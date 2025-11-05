// src/shared/services/logger.service.ts

/**
 * Serviço de logging centralizado para o frontend
 *
 * Características:
 * - Queue in-memory com flush automático (batch sending)
 * - Flush a cada 10 segundos OU 50 logs acumulados
 * - Envio imediato para logs críticos (error)
 * - Retry com backoff exponencial (3 tentativas)
 * - Fallback para console.log em caso de falha
 * - Respeita nível de log configurado via .env
 *
 * @module shared/services/logger
 */

import api from '../config/api.config';
import { env } from '../utils/env';

/**
 * Níveis de log
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Interface para log individual
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  correlationId?: string;
  timestamp: string;
  url?: string;
  userAgent?: string;
}

/**
 * Configuração do logger
 */
interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  endpoint: string;
  batchEndpoint: string;
  batchSize: number;
  flushInterval: number; // milissegundos
  maxRetries: number;
}

/**
 * Mapeamento de níveis para ordenação
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Classe LoggerService (Singleton)
 */
class LoggerService {
  private static instance: LoggerService | null = null;

  private config: LoggerConfig;
  private queue: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing: boolean = false;

  /**
   * Construtor privado (Singleton)
   */
  private constructor() {
    // Lê configuração do .env usando helper
    this.config = {
      enabled: env.LOG_ENABLED,
      level: env.LOG_LEVEL as LogLevel,
      endpoint: '/api/logs/frontend',
      batchEndpoint: '/api/logs/frontend/batch',
      batchSize: 50,
      flushInterval: 10000, // 10 segundos
      maxRetries: 3,
    };

    // Inicia timer de flush automático
    this.startFlushTimer();

    // Flush ao descarregar página
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushSync();
      });
    }
  }

  /**
   * Retorna instância singleton
   */
  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Verifica se deve logar baseado no nível configurado
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const configuredPriority = LOG_LEVEL_PRIORITY[this.config.level];
    const requestedPriority = LOG_LEVEL_PRIORITY[level];

    return requestedPriority >= configuredPriority;
  }

  /**
   * Cria entrada de log
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    correlationId?: string
  ): LogEntry {
    return {
      level,
      message,
      context,
      correlationId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  /**
   * Adiciona log à queue
   */
  private enqueueLog(entry: LogEntry, immediate: boolean = false): void {
    this.queue.push(entry);

    // Log no console também (em desenvolvimento)
    if (env.IS_DEV) {
      const consoleMethod =
        entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log';
      // eslint-disable-next-line no-console
      console[consoleMethod](
        `[Logger] ${entry.level.toUpperCase()}: ${entry.message}`,
        entry.context || {}
      );
    }

    // Flush imediato para erros críticos
    if (immediate || entry.level === 'error') {
      this.flush();
      return;
    }

    // Flush se atingiu tamanho do batch
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Inicia timer de flush automático
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Envia logs para backend (assíncrono)
   */
  private async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) {
      return;
    }

    this.isFlushing = true;

    // Copia queue e limpa
    const logsToSend = [...this.queue];
    this.queue = [];

    try {
      // Tenta enviar batch
      await this.sendLogsWithRetry(logsToSend);
    } catch (error) {
      // Fallback: log no console
      console.error('[LoggerService] Falha ao enviar logs após tentativas:', error);
      console.error('[LoggerService] Logs perdidos:', logsToSend);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Envia logs para backend de forma síncrona (beforeunload)
   */
  private flushSync(): void {
    if (this.queue.length === 0) {
      return;
    }

    const logsToSend = [...this.queue];
    this.queue = [];

    try {
      // Usa sendBeacon para envio síncrono no beforeunload
      const endpoint = `${api.defaults.baseURL}${this.config.batchEndpoint}`;
      const payload = JSON.stringify({ logs: logsToSend });
      const blob = new Blob([payload], { type: 'application/json' });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, blob);
      }
    } catch (error) {
      console.error('[LoggerService] Falha no flush síncrono:', error);
    }
  }

  /**
   * Envia logs com retry e backoff exponencial
   */
  private async sendLogsWithRetry(logs: LogEntry[]): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        await api.post(this.config.batchEndpoint, { logs });
        return; // Sucesso
      } catch (error) {
        lastError = error as Error;

        // Aguarda antes de tentar novamente (backoff exponencial)
        if (attempt < this.config.maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    throw lastError;
  }

  /**
   * Log nível DEBUG
   */
  public debug(message: string, context?: Record<string, unknown>, correlationId?: string): void {
    if (!this.shouldLog('debug')) {
      return;
    }

    const entry = this.createLogEntry('debug', message, context, correlationId);
    this.enqueueLog(entry, false);
  }

  /**
   * Log nível INFO
   */
  public info(message: string, context?: Record<string, unknown>, correlationId?: string): void {
    if (!this.shouldLog('info')) {
      return;
    }

    const entry = this.createLogEntry('info', message, context, correlationId);
    this.enqueueLog(entry, false);
  }

  /**
   * Log nível WARN
   */
  public warn(message: string, context?: Record<string, unknown>, correlationId?: string): void {
    if (!this.shouldLog('warn')) {
      return;
    }

    const entry = this.createLogEntry('warn', message, context, correlationId);
    this.enqueueLog(entry, false);
  }

  /**
   * Log nível ERROR (envio imediato)
   */
  public error(message: string, context?: Record<string, unknown>, correlationId?: string): void {
    if (!this.shouldLog('error')) {
      return;
    }

    const entry = this.createLogEntry('error', message, context, correlationId);
    this.enqueueLog(entry, true); // Envio imediato
  }

  /**
   * Força flush imediato (útil para testes)
   */
  public forceFlush(): Promise<void> {
    return this.flush();
  }

  /**
   * Limpa queue sem enviar (útil para testes)
   */
  public clearQueue(): void {
    this.queue = [];
  }

  /**
   * Retorna tamanho atual da queue (útil para testes)
   */
  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Destrói instância (útil para testes)
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushSync();
    LoggerService.instance = null;
  }
}

/**
 * Instância singleton exportada
 */
const logger = LoggerService.getInstance();

export default logger;
