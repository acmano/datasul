// src/infrastructure/database/circuitBreaker/CircuitBreaker.ts

import { log } from '@shared/utils/logger';
import { CircuitBreakerOpenError } from '@shared/errors/CircuitBreakerErrors';
import { DatabaseInstrumentation } from '@infrastructure/tracing/DatabaseInstrumentation';

/**
 * Circuit Breaker States
 *
 * @description
 * Estados possíveis do circuit breaker:
 * - CLOSED: Operação normal, todas as requests passam
 * - OPEN: Muitas falhas detectadas, bloqueia requests imediatamente (fail fast)
 * - HALF_OPEN: Estado de teste para verificar se o serviço se recuperou
 *
 * @enum {string}
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Configuração do Circuit Breaker
 *
 * @interface CircuitBreakerConfig
 *
 * @property {number} failureThreshold - Número de falhas antes de abrir o circuit (default: 5)
 * @property {number} successThreshold - Sucessos necessários para fechar do half-open (default: 2)
 * @property {number} timeout - Tempo antes de tentar half-open em ms (default: 60000)
 * @property {number} monitoringPeriod - Período para contar falhas em ms (default: 10000)
 * @property {number} volumeThreshold - Mínimo de requests antes de verificar threshold (default: 10)
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  monitoringPeriod: number;
  volumeThreshold: number;
}

/**
 * Métricas do Circuit Breaker
 *
 * @interface CircuitBreakerMetrics
 */
export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  tripTime?: Date;
  totalRequests: number;
  rejectedRequests: number;
}

/**
 * Circuit Breaker implementation for database connections
 *
 * @description
 * Previne cascading failures através do padrão Circuit Breaker.
 * Quando detecta muitas falhas, "abre o circuit" e rejeita requests
 * imediatamente, dando tempo para o serviço se recuperar.
 *
 * **Estados:**
 * - **CLOSED**: Operação normal, monitora falhas
 * - **OPEN**: Circuit aberto, rejeita todas as requests (fail fast)
 * - **HALF_OPEN**: Permite requests de teste para verificar recuperação
 *
 * **Funcionamento:**
 * 1. Estado inicial: CLOSED
 * 2. Se atingir threshold de falhas → OPEN
 * 3. Após timeout → HALF_OPEN (permite testes)
 * 4. Se testes passarem → CLOSED
 * 5. Se testes falharem → OPEN novamente
 *
 * @class CircuitBreaker
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker('PCF4_PRD', {
 *   failureThreshold: 5,
 *   timeout: 60000
 * });
 *
 * try {
 *   const result = await breaker.execute(async () => {
 *     return await queryDatabase();
 *   });
 * } catch (error) {
 *   if (error instanceof CircuitBreakerOpenError) {
 *     console.log('Circuit is open, service unavailable');
 *   }
 * }
 * ```
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private config: CircuitBreakerConfig;
  private connectionId: string;

  // Metrics
  private failures: number = 0;
  private successes: number = 0;
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private tripTime?: Date;
  private totalRequests: number = 0;
  private rejectedRequests: number = 0;

  // Sliding window for failure tracking
  private recentFailures: Date[] = [];

  constructor(connectionId: string, config?: Partial<CircuitBreakerConfig>) {
    this.connectionId = connectionId;
    this.config = {
      failureThreshold: config?.failureThreshold ?? 5,
      successThreshold: config?.successThreshold ?? 2,
      timeout: config?.timeout ?? 60000, // 1 minute
      monitoringPeriod: config?.monitoringPeriod ?? 10000, // 10 seconds
      volumeThreshold: config?.volumeThreshold ?? 10,
    };

    log.info('Circuit breaker initialized', {
      connectionId,
      config: this.config,
    });
  }

  /**
   * Executa função com proteção do circuit breaker
   *
   * @template T
   * @param {() => Promise<T>} fn - Função async a executar
   * @returns {Promise<T>} Resultado da função
   * @throws {CircuitBreakerOpenError} Se circuit estiver OPEN
   * @throws {Error} Erro da função executada
   *
   * @description
   * Executa a função fornecida com proteção do circuit breaker:
   * - Se CLOSED: executa normalmente, registra sucesso/falha
   * - Se OPEN: rejeita imediatamente se não passou timeout
   * - Se OPEN e passou timeout: transita para HALF_OPEN e tenta executar
   * - Se HALF_OPEN: executa e decide próximo estado baseado no resultado
   *
   * @example
   * ```typescript
   * const result = await breaker.execute(async () => {
   *   return await connection.query('SELECT 1');
   * });
   * ```
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        log.info('Circuit breaker entering half-open state', {
          connectionId: this.connectionId,
        });
        this.state = CircuitState.HALF_OPEN;

        // Trace circuit breaker event
        DatabaseInstrumentation.traceCircuitBreakerEvent(this.connectionId, 'half_open');
      } else {
        this.rejectedRequests++;
        throw new CircuitBreakerOpenError(
          `Circuit breaker is OPEN for connection ${this.connectionId}`,
          {
            connectionId: this.connectionId,
            state: this.state,
            tripTime: this.tripTime,
            nextAttemptIn: this.getNextAttemptTime(),
          }
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Registra sucesso de execução
   * @private
   */
  private onSuccess(): void {
    this.lastSuccessTime = new Date();
    this.successes++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        log.info('Circuit breaker closing after recovery', {
          connectionId: this.connectionId,
          consecutiveSuccesses: this.consecutiveSuccesses,
        });
        this.close();
      }
    }
  }

  /**
   * Registra falha de execução
   * @private
   */
  private onFailure(error: Error): void {
    this.lastFailureTime = new Date();
    this.failures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;

    // Add to sliding window
    this.recentFailures.push(new Date());
    this.cleanupRecentFailures();

    // Check if we should trip
    if (this.state === CircuitState.HALF_OPEN) {
      log.warn('Circuit breaker opening after half-open failure', {
        connectionId: this.connectionId,
        error: error.message,
      });
      this.open();
    } else if (this.shouldTrip()) {
      log.error('Circuit breaker tripping due to failures', {
        connectionId: this.connectionId,
        consecutiveFailures: this.consecutiveFailures,
        recentFailures: this.recentFailures.length,
        threshold: this.config.failureThreshold,
      });
      this.open();
    }
  }

  /**
   * Verifica se deve abrir o circuit (trip)
   * @private
   */
  private shouldTrip(): boolean {
    // Need minimum volume
    if (this.totalRequests < this.config.volumeThreshold) {
      return false;
    }

    // Check recent failures in monitoring period
    return this.recentFailures.length >= this.config.failureThreshold;
  }

  /**
   * Verifica se deve tentar reset (OPEN → HALF_OPEN)
   * @private
   */
  private shouldAttemptReset(): boolean {
    if (!this.tripTime) return false;

    const elapsed = Date.now() - this.tripTime.getTime();
    return elapsed >= this.config.timeout;
  }

  /**
   * Abre o circuit (fail fast mode)
   * @private
   */
  private open(): void {
    this.state = CircuitState.OPEN;
    this.tripTime = new Date();

    // Trace circuit breaker event
    DatabaseInstrumentation.traceCircuitBreakerEvent(this.connectionId, 'open');
  }

  /**
   * Fecha o circuit (normal operation)
   * @private
   */
  private close(): void {
    this.state = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.recentFailures = [];
    this.tripTime = undefined;

    // Trace circuit breaker event
    DatabaseInstrumentation.traceCircuitBreakerEvent(this.connectionId, 'close');
  }

  /**
   * Remove falhas antigas fora do monitoring period
   * @private
   */
  private cleanupRecentFailures(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.recentFailures = this.recentFailures.filter((time) => time.getTime() > cutoff);
  }

  /**
   * Calcula tempo até próxima tentativa (para OPEN state)
   * @private
   */
  private getNextAttemptTime(): number {
    if (!this.tripTime) return 0;

    const elapsed = Date.now() - this.tripTime.getTime();
    return Math.max(0, this.config.timeout - elapsed);
  }

  /**
   * Retorna métricas atuais do circuit breaker
   *
   * @returns {CircuitBreakerMetrics} Métricas atuais
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      tripTime: this.tripTime,
      totalRequests: this.totalRequests,
      rejectedRequests: this.rejectedRequests,
    };
  }

  /**
   * Força abertura do circuit (para testes/emergências)
   *
   * @description
   * Força o circuit para estado OPEN independente das métricas.
   * Use apenas em emergências ou testes.
   */
  forceOpen(): void {
    log.warn('Circuit breaker force opened', { connectionId: this.connectionId });
    this.open();
  }

  /**
   * Força fechamento do circuit (para testes/recovery)
   *
   * @description
   * Força o circuit para estado CLOSED independente das métricas.
   * Use apenas para recovery manual ou testes.
   */
  forceClose(): void {
    log.warn('Circuit breaker force closed', { connectionId: this.connectionId });
    this.close();
  }

  /**
   * Reseta todas as métricas e fecha o circuit
   *
   * @description
   * Limpa completamente o estado do circuit breaker:
   * - Fecha o circuit
   * - Zera todos os contadores
   * - Limpa histórico de falhas
   */
  reset(): void {
    this.close();
    this.failures = 0;
    this.successes = 0;
    this.totalRequests = 0;
    this.rejectedRequests = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
  }

  /**
   * Retorna ID da conexão protegida
   */
  getConnectionId(): string {
    return this.connectionId;
  }

  /**
   * Retorna estado atual do circuit
   */
  getState(): CircuitState {
    return this.state;
  }
}

/**
 * Gerenciador de circuit breakers para todas as conexões
 *
 * @class CircuitBreakerManager
 *
 * @description
 * Gerencia múltiplos circuit breakers, um por conexão.
 * Fornece API centralizada para criar, acessar e gerenciar breakers.
 *
 * @example
 * ```typescript
 * const manager = new CircuitBreakerManager();
 *
 * // Get or create breaker for connection
 * const breaker = manager.getBreaker('PCF4_PRD');
 *
 * // Execute with protection
 * await breaker.execute(async () => queryDatabase());
 *
 * // Get all metrics
 * const allMetrics = manager.getAllMetrics();
 * ```
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig;

  constructor(defaultConfig?: Partial<CircuitBreakerConfig>) {
    this.defaultConfig = {
      failureThreshold: defaultConfig?.failureThreshold ?? 5,
      successThreshold: defaultConfig?.successThreshold ?? 2,
      timeout: defaultConfig?.timeout ?? 60000,
      monitoringPeriod: defaultConfig?.monitoringPeriod ?? 10000,
      volumeThreshold: defaultConfig?.volumeThreshold ?? 10,
    };
  }

  /**
   * Obtém ou cria circuit breaker para conexão
   *
   * @param {string} connectionId - ID da conexão (DSN)
   * @param {Partial<CircuitBreakerConfig>} [config] - Configuração opcional específica
   * @returns {CircuitBreaker} Circuit breaker para a conexão
   *
   * @description
   * Lazy initialization: cria breaker apenas na primeira vez que é solicitado.
   * Requests subsequentes retornam o mesmo breaker.
   */
  getBreaker(connectionId: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(connectionId)) {
      this.breakers.set(
        connectionId,
        new CircuitBreaker(connectionId, { ...this.defaultConfig, ...config })
      );
    }
    return this.breakers.get(connectionId)!;
  }

  /**
   * Retorna métricas de todos os circuit breakers
   *
   * @returns {Map<string, CircuitBreakerMetrics>} Map de connectionId → metrics
   */
  getAllMetrics(): Map<string, CircuitBreakerMetrics> {
    const metrics = new Map<string, CircuitBreakerMetrics>();
    for (const [id, breaker] of this.breakers) {
      metrics.set(id, breaker.getMetrics());
    }
    return metrics;
  }

  /**
   * Reseta todos os circuit breakers
   *
   * @description
   * Reseta estado e métricas de todos os breakers.
   * Use com cautela em produção.
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    log.info('All circuit breakers reset', { count: this.breakers.size });
  }

  /**
   * Remove circuit breaker de uma conexão
   *
   * @param {string} connectionId - ID da conexão
   * @returns {boolean} true se removeu, false se não existia
   */
  removeBreaker(connectionId: string): boolean {
    return this.breakers.delete(connectionId);
  }

  /**
   * Retorna número de circuit breakers ativos
   */
  getCount(): number {
    return this.breakers.size;
  }
}

// Singleton instance
export const circuitBreakerManager = new CircuitBreakerManager({
  failureThreshold: Number(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 5,
  successThreshold: 2,
  timeout: Number(process.env.CIRCUIT_BREAKER_TIMEOUT) || 60000,
  monitoringPeriod: 10000,
  volumeThreshold: 10,
});
