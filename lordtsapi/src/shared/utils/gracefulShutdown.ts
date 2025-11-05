// src/shared/utils/gracefulShutdown.ts

import { Server } from 'http';
import { Socket } from 'net';
import { log } from './logger';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

/**
 * Gerenciador de Graceful Shutdown
 * @module GracefulShutdown
 */

interface ShutdownConfig {
  /** Timeout em ms para forçar encerramento @default 10000 */
  timeout?: number;
  /** Callback antes do shutdown */
  onShutdownStart?: () => void | Promise<void>;
  /** Callback após shutdown completo */
  onShutdownComplete?: () => void | Promise<void>;
}

export class GracefulShutdown {
  private server: Server;
  private config: Required<ShutdownConfig>;
  private isShuttingDown: boolean = false;
  private shutdownTimer?: NodeJS.Timeout;
  private activeConnections: Set<Socket> = new Set();

  constructor(server: Server, config: ShutdownConfig = {}) {
    this.server = server;
    this.config = {
      timeout: config.timeout || 10000,
      onShutdownStart: config.onShutdownStart || (() => {}),
      onShutdownComplete: config.onShutdownComplete || (() => {}),
    };
  }

  /**
   * Inicializa listeners de sinais
   */
  public init(): void {
    // SIGTERM - Shutdown gracioso (Docker, K8s)
    process.on('SIGTERM', () => {
      log.info('🔥 SIGTERM recebido - Iniciando graceful shutdown');
      this.shutdown('SIGTERM');
    });

    // SIGINT - Ctrl+C (desenvolvimento)
    process.on('SIGINT', () => {
      log.info('🔥 SIGINT recebido (Ctrl+C) - Iniciando graceful shutdown');
      this.shutdown('SIGINT');
    });

    // SIGQUIT - Quit signal
    process.on('SIGQUIT', () => {
      log.info('🔥 SIGQUIT recebido - Iniciando graceful shutdown');
      this.shutdown('SIGQUIT');
    });

    // Uncaught Exception
    process.on('uncaughtException', (error: Error) => {
      log.error('❌ Uncaught Exception - Forçando shutdown', {
        error: error.message,
        stack: error.stack,
      });
      this.forceShutdown(1);
    });

    // Unhandled Promise Rejection
    process.on('unhandledRejection', (reason: unknown) => {
      log.error('❌ Unhandled Promise Rejection - Forçando shutdown', {
        reason: String(reason),
      });
      this.forceShutdown(1);
    });

    // Rastrear conexões ativas
    this.server.on('connection', (connection) => {
      this.activeConnections.add(connection);
      connection.on('close', () => {
        this.activeConnections.delete(connection);
      });
    });

    log.info('✅ Graceful shutdown configurado', {
      timeout: `${this.config.timeout}ms`,
      signals: ['SIGTERM', 'SIGINT', 'SIGQUIT'],
    });
  }

  /**
   * Executa shutdown gracioso
   */
  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      log.warn('⚠️ Shutdown já em andamento, ignorando sinal duplicado', { signal });
      return;
    }

    this.isShuttingDown = true;
    const startTime = Date.now();

    log.info('🛑 Iniciando processo de shutdown', {
      signal,
      activeConnections: this.activeConnections.size,
      timestamp: new Date().toISOString(),
    });

    try {
      await this.config.onShutdownStart();
    } catch (error) {
      log.error('Erro no callback onShutdownStart', { error });
    }

    this.shutdownTimer = setTimeout(() => {
      log.warn(`⏱️ Timeout de ${this.config.timeout}ms atingido - Forçando encerramento`);
      this.forceShutdown(0);
    }, this.config.timeout);

    try {
      await this.closeHttpServer();
      await this.closeDatabaseConnections();
      await this.performCleanup();

      const duration = Date.now() - startTime;
      log.info('✅ Graceful shutdown completo', {
        signal,
        duration,
        timestamp: new Date().toISOString(),
      });

      try {
        await this.config.onShutdownComplete();
      } catch (error) {
        log.error('Erro no callback onShutdownComplete', { error });
      }

      if (this.shutdownTimer) {
        clearTimeout(this.shutdownTimer);
      }

      process.exit(0);
    } catch (error) {
      log.error('❌ Erro durante graceful shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      this.forceShutdown(1);
    }
  }

  /**
   * Fecha servidor HTTP
   */
  private closeHttpServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      log.info('📡 Fechando servidor HTTP...');

      this.server.close((error) => {
        if (error) {
          log.error('Erro ao fechar servidor HTTP', { error: error.message });
          reject(error);
        } else {
          log.info('✅ Servidor HTTP fechado', {
            activeConnections: this.activeConnections.size,
          });
          resolve();
        }
      });

      // Força fechamento de conexões ativas após 5s
      setTimeout(() => {
        if (this.activeConnections.size > 0) {
          log.warn(`⚠️ Forçando fechamento de ${this.activeConnections.size} conexões ativas`);
          this.activeConnections.forEach((connection) => connection.destroy());
          this.activeConnections.clear();
        }
      }, 5000);
    });
  }

  /**
   * Fecha conexões do banco
   */
  private async closeDatabaseConnections(): Promise<void> {
    log.info('🗄️ Fechando conexões do banco de dados...');
    try {
      await DatabaseManager.close();
      log.info('✅ Conexões do banco fechadas');
    } catch (error) {
      log.error('Erro ao fechar conexões do banco', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Cleanup final
   */
  private async performCleanup(): Promise<void> {
    log.info('🧹 Executando cleanup final...');
    await new Promise((resolve) => setTimeout(resolve, 100));
    log.info('✅ Cleanup completo');
  }

  /**
   * Força encerramento imediato
   */
  private forceShutdown(exitCode: number): void {
    log.error('🔴 FORÇANDO ENCERRAMENTO IMEDIATO', {
      exitCode,
      timestamp: new Date().toISOString(),
    });

    if (this.shutdownTimer) {
      clearTimeout(this.shutdownTimer);
    }

    this.activeConnections.forEach((connection) => connection.destroy());

    setTimeout(() => {
      process.exit(exitCode);
    }, 100);
  }

  /**
   * Retorna status do shutdown
   */
  public getStatus(): {
    isShuttingDown: boolean;
    activeConnections: number;
  } {
    return {
      isShuttingDown: this.isShuttingDown,
      activeConnections: this.activeConnections.size,
    };
  }
}

/**
 * Helper para setup simplificado
 */
export function setupGracefulShutdown(server: Server, config?: ShutdownConfig): GracefulShutdown {
  const shutdown = new GracefulShutdown(server, config);
  shutdown.init();
  return shutdown;
}
