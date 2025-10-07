// src/shared/utils/retry.ts

import { log } from './logger';

/**
 * Utilitário de Retry com Exponential Backoff
 * @module Retry
 */

export interface RetryOptions {
  /** Número máximo de tentativas @default 3 */
  maxAttempts: number;
  /** Delay inicial em ms @default 1000 */
  initialDelay: number;
  /** Delay máximo em ms @default 10000 */
  maxDelay: number;
  /** Fator multiplicador @default 2 */
  backoffFactor: number;
  /** Adiciona aleatoriedade @default true */
  jitter: boolean;
  /** Callback antes de cada retry */
  onRetry?: (error: Error, attempt: number, nextDelay: number) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
};

/**
 * Executa função com retry e exponential backoff
 *
 * @param fn - Função async a executar
 * @param options - Opções de retry
 * @param context - Contexto para logs
 * @returns Resultado da função
 * @throws Último erro após esgotar tentativas
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  context: string = 'Operation'
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelay;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      log.debug(`${context}: Tentativa ${attempt}/${opts.maxAttempts}`, {
        attempt,
        maxAttempts: opts.maxAttempts,
      });

      const result = await fn();

      if (attempt > 1) {
        log.info(`${context}: Sucesso na tentativa ${attempt}`, { attempt });
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      if (attempt === opts.maxAttempts) {
        log.error(`${context}: Falhou após ${opts.maxAttempts} tentativas`, {
          error: lastError.message,
          attempts: opts.maxAttempts,
        });
        throw lastError;
      }

      const nextDelay = calculateDelay(delay, opts);

      log.warn(`${context}: Tentativa ${attempt} falhou, retry em ${nextDelay}ms`, {
        attempt,
        error: lastError.message,
        nextDelay,
        nextAttempt: attempt + 1,
      });

      if (opts.onRetry) {
        opts.onRetry(lastError, attempt, nextDelay);
      }

      await sleep(nextDelay);

      delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
    }
  }

  throw lastError || new Error(`${context}: Retry failed`);
}

/**
 * Calcula delay com backoff e jitter
 */
function calculateDelay(currentDelay: number, options: RetryOptions): number {
  let nextDelay = currentDelay;

  if (options.jitter) {
    const jitterFactor = 0.5 + Math.random();
    nextDelay = Math.floor(currentDelay * jitterFactor);
  }

  return Math.min(nextDelay, options.maxDelay);
}

/**
 * Aguarda tempo especificado
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verifica se erro é retryable (temporário)
 */
export function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /ENOTFOUND/i,
    /EHOSTUNREACH/i,
    /ENETUNREACH/i,
    /timeout/i,
    /connection.*closed/i,
    /connection.*reset/i,
    /socket hang up/i,
  ];

  const errorMessage = error.message || '';
  return retryablePatterns.some((pattern) => pattern.test(errorMessage));
}

/**
 * Retry apenas para erros retryable
 */
export async function retryOnRetryableError<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  context: string = 'Operation'
): Promise<T> {
  return retryWithBackoff(
    fn,
    {
      ...options,
      onRetry: (error, attempt, delay) => {
        if (!isRetryableError(error)) {
          log.error(`${context}: Erro não-retryable, abortando`, {
            error: error.message,
            attempt,
          });
          throw error;
        }

        options.onRetry?.(error, attempt, delay);
      },
    },
    context
  );
}