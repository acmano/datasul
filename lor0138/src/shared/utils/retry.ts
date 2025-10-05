// src/shared/utils/retry.ts

import { log } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffFactor: number; // multiplicador para exponential backoff
  jitter: boolean; // adiciona aleatoriedade para evitar thundering herd
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
 * Executa uma função com retry e exponential backoff
 * 
 * @param fn Função async a ser executada
 * @param options Opções de retry
 * @param context Contexto para logs (ex: "SQL Server EMP")
 * @returns Resultado da função ou lança erro após todas as tentativas
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => pool.connect(),
 *   { maxAttempts: 5, initialDelay: 1000 },
 *   'SQL Server Connection'
 * );
 * ```
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

      // Calcular próximo delay com exponential backoff
      const nextDelay = calculateDelay(delay, opts);
      
      log.warn(`${context}: Tentativa ${attempt} falhou, retry em ${nextDelay}ms`, {
        attempt,
        error: lastError.message,
        nextDelay,
        nextAttempt: attempt + 1,
      });

      // Callback opcional
      if (opts.onRetry) {
        opts.onRetry(lastError, attempt, nextDelay);
      }

      // Aguardar antes do próximo retry
      await sleep(nextDelay);

      // Atualizar delay para próxima iteração
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
    }
  }

  // Nunca deve chegar aqui, mas TypeScript precisa
  throw lastError || new Error(`${context}: Retry failed`);
}

/**
 * Calcula delay com exponential backoff e jitter opcional
 */
function calculateDelay(currentDelay: number, options: RetryOptions): number {
  let nextDelay = currentDelay;

  // Adicionar jitter (aleatoriedade) se habilitado
  if (options.jitter) {
    // Jitter entre 50% e 150% do delay
    const jitterFactor = 0.5 + Math.random();
    nextDelay = Math.floor(currentDelay * jitterFactor);
  }

  // Garantir que não excede maxDelay
  return Math.min(nextDelay, options.maxDelay);
}

/**
 * Helper para aguardar um tempo
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica se um erro é retryable (temporário)
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
  return retryablePatterns.some(pattern => pattern.test(errorMessage));
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
        // Só retry se for erro retryable
        if (!isRetryableError(error)) {
          throw error; // Lança imediatamente se não for retryable
        }
        options.onRetry?.(error, attempt, delay);
      },
    },
    context
  );
}