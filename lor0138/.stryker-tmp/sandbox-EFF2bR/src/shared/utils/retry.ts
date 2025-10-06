// @ts-nocheck
// src/shared/utils/retry.ts
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { log } from './logger';
export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffFactor: number; // multiplicador para exponential backoff
  jitter: boolean; // adiciona aleatoriedade para evitar thundering herd
  onRetry?: (error: Error, attempt: number, nextDelay: number) => void;
}
const DEFAULT_OPTIONS: RetryOptions = stryMutAct_9fa48("4192") ? {} : (stryCov_9fa48("4192"), {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: stryMutAct_9fa48("4193") ? false : (stryCov_9fa48("4193"), true)
});

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
export async function retryWithBackoff<T>(fn: () => Promise<T>, options: Partial<RetryOptions> = {}, context: string = stryMutAct_9fa48("4194") ? "" : (stryCov_9fa48("4194"), 'Operation')): Promise<T> {
  if (stryMutAct_9fa48("4195")) {
    {}
  } else {
    stryCov_9fa48("4195");
    const opts = stryMutAct_9fa48("4196") ? {} : (stryCov_9fa48("4196"), {
      ...DEFAULT_OPTIONS,
      ...options
    });
    let lastError: Error | null = null;
    let delay = opts.initialDelay;
    for (let attempt = 1; stryMutAct_9fa48("4199") ? attempt > opts.maxAttempts : stryMutAct_9fa48("4198") ? attempt < opts.maxAttempts : stryMutAct_9fa48("4197") ? false : (stryCov_9fa48("4197", "4198", "4199"), attempt <= opts.maxAttempts); stryMutAct_9fa48("4200") ? attempt-- : (stryCov_9fa48("4200"), attempt++)) {
      if (stryMutAct_9fa48("4201")) {
        {}
      } else {
        stryCov_9fa48("4201");
        try {
          if (stryMutAct_9fa48("4202")) {
            {}
          } else {
            stryCov_9fa48("4202");
            log.debug(stryMutAct_9fa48("4203") ? `` : (stryCov_9fa48("4203"), `${context}: Tentativa ${attempt}/${opts.maxAttempts}`), stryMutAct_9fa48("4204") ? {} : (stryCov_9fa48("4204"), {
              attempt,
              maxAttempts: opts.maxAttempts
            }));
            const result = await fn();
            if (stryMutAct_9fa48("4208") ? attempt <= 1 : stryMutAct_9fa48("4207") ? attempt >= 1 : stryMutAct_9fa48("4206") ? false : stryMutAct_9fa48("4205") ? true : (stryCov_9fa48("4205", "4206", "4207", "4208"), attempt > 1)) {
              if (stryMutAct_9fa48("4209")) {
                {}
              } else {
                stryCov_9fa48("4209");
                log.info(stryMutAct_9fa48("4210") ? `` : (stryCov_9fa48("4210"), `${context}: Sucesso na tentativa ${attempt}`), stryMutAct_9fa48("4211") ? {} : (stryCov_9fa48("4211"), {
                  attempt
                }));
              }
            }
            return result;
          }
        } catch (error) {
          if (stryMutAct_9fa48("4212")) {
            {}
          } else {
            stryCov_9fa48("4212");
            lastError = error as Error;
            if (stryMutAct_9fa48("4215") ? attempt !== opts.maxAttempts : stryMutAct_9fa48("4214") ? false : stryMutAct_9fa48("4213") ? true : (stryCov_9fa48("4213", "4214", "4215"), attempt === opts.maxAttempts)) {
              if (stryMutAct_9fa48("4216")) {
                {}
              } else {
                stryCov_9fa48("4216");
                log.error(stryMutAct_9fa48("4217") ? `` : (stryCov_9fa48("4217"), `${context}: Falhou após ${opts.maxAttempts} tentativas`), stryMutAct_9fa48("4218") ? {} : (stryCov_9fa48("4218"), {
                  error: lastError.message,
                  attempts: opts.maxAttempts
                }));
                throw lastError;
              }
            }

            // Calcular próximo delay com exponential backoff
            const nextDelay = calculateDelay(delay, opts);
            log.warn(stryMutAct_9fa48("4219") ? `` : (stryCov_9fa48("4219"), `${context}: Tentativa ${attempt} falhou, retry em ${nextDelay}ms`), stryMutAct_9fa48("4220") ? {} : (stryCov_9fa48("4220"), {
              attempt,
              error: lastError.message,
              nextDelay,
              nextAttempt: stryMutAct_9fa48("4221") ? attempt - 1 : (stryCov_9fa48("4221"), attempt + 1)
            }));

            // Callback opcional
            if (stryMutAct_9fa48("4223") ? false : stryMutAct_9fa48("4222") ? true : (stryCov_9fa48("4222", "4223"), opts.onRetry)) {
              if (stryMutAct_9fa48("4224")) {
                {}
              } else {
                stryCov_9fa48("4224");
                opts.onRetry(lastError, attempt, nextDelay);
              }
            }

            // Aguardar antes do próximo retry
            await sleep(nextDelay);

            // Atualizar delay para próxima iteração
            delay = stryMutAct_9fa48("4225") ? Math.max(delay * opts.backoffFactor, opts.maxDelay) : (stryCov_9fa48("4225"), Math.min(stryMutAct_9fa48("4226") ? delay / opts.backoffFactor : (stryCov_9fa48("4226"), delay * opts.backoffFactor), opts.maxDelay));
          }
        }
      }
    }

    // Nunca deve chegar aqui, mas TypeScript precisa
    throw stryMutAct_9fa48("4229") ? lastError && new Error(`${context}: Retry failed`) : stryMutAct_9fa48("4228") ? false : stryMutAct_9fa48("4227") ? true : (stryCov_9fa48("4227", "4228", "4229"), lastError || new Error(stryMutAct_9fa48("4230") ? `` : (stryCov_9fa48("4230"), `${context}: Retry failed`)));
  }
}

/**
 * Calcula delay com exponential backoff e jitter opcional
 */
function calculateDelay(currentDelay: number, options: RetryOptions): number {
  if (stryMutAct_9fa48("4231")) {
    {}
  } else {
    stryCov_9fa48("4231");
    let nextDelay = currentDelay;

    // Adicionar jitter (aleatoriedade) se habilitado
    if (stryMutAct_9fa48("4233") ? false : stryMutAct_9fa48("4232") ? true : (stryCov_9fa48("4232", "4233"), options.jitter)) {
      if (stryMutAct_9fa48("4234")) {
        {}
      } else {
        stryCov_9fa48("4234");
        // Jitter entre 50% e 150% do delay
        const jitterFactor = stryMutAct_9fa48("4235") ? 0.5 - Math.random() : (stryCov_9fa48("4235"), 0.5 + Math.random());
        nextDelay = Math.floor(stryMutAct_9fa48("4236") ? currentDelay / jitterFactor : (stryCov_9fa48("4236"), currentDelay * jitterFactor));
      }
    }

    // Garantir que não excede maxDelay
    return stryMutAct_9fa48("4237") ? Math.max(nextDelay, options.maxDelay) : (stryCov_9fa48("4237"), Math.min(nextDelay, options.maxDelay));
  }
}

/**
 * Helper para aguardar um tempo
 */
function sleep(ms: number): Promise<void> {
  if (stryMutAct_9fa48("4238")) {
    {}
  } else {
    stryCov_9fa48("4238");
    return new Promise(stryMutAct_9fa48("4239") ? () => undefined : (stryCov_9fa48("4239"), resolve => setTimeout(resolve, ms)));
  }
}

/**
 * Verifica se um erro é retryable (temporário)
 */
export function isRetryableError(error: Error): boolean {
  if (stryMutAct_9fa48("4240")) {
    {}
  } else {
    stryCov_9fa48("4240");
    const retryablePatterns = stryMutAct_9fa48("4241") ? [] : (stryCov_9fa48("4241"), [/ECONNREFUSED/i, /ETIMEDOUT/i, /ENOTFOUND/i, /EHOSTUNREACH/i, /ENETUNREACH/i, /timeout/i, stryMutAct_9fa48("4242") ? /connection.closed/i : (stryCov_9fa48("4242"), /connection.*closed/i), stryMutAct_9fa48("4243") ? /connection.reset/i : (stryCov_9fa48("4243"), /connection.*reset/i), /socket hang up/i]);
    const errorMessage = stryMutAct_9fa48("4246") ? error.message && '' : stryMutAct_9fa48("4245") ? false : stryMutAct_9fa48("4244") ? true : (stryCov_9fa48("4244", "4245", "4246"), error.message || (stryMutAct_9fa48("4247") ? "Stryker was here!" : (stryCov_9fa48("4247"), '')));
    return stryMutAct_9fa48("4248") ? retryablePatterns.every(pattern => pattern.test(errorMessage)) : (stryCov_9fa48("4248"), retryablePatterns.some(stryMutAct_9fa48("4249") ? () => undefined : (stryCov_9fa48("4249"), pattern => pattern.test(errorMessage))));
  }
}

/**
 * Retry apenas para erros retryable
 */
export async function retryOnRetryableError<T>(fn: () => Promise<T>, options: Partial<RetryOptions> = {}, context: string = stryMutAct_9fa48("4250") ? "" : (stryCov_9fa48("4250"), 'Operation')): Promise<T> {
  if (stryMutAct_9fa48("4251")) {
    {}
  } else {
    stryCov_9fa48("4251");
    return retryWithBackoff(fn, stryMutAct_9fa48("4252") ? {} : (stryCov_9fa48("4252"), {
      ...options,
      onRetry: (error, attempt, delay) => {
        if (stryMutAct_9fa48("4253")) {
          {}
        } else {
          stryCov_9fa48("4253");
          // Só retry se for erro retryable
          if (stryMutAct_9fa48("4256") ? false : stryMutAct_9fa48("4255") ? true : stryMutAct_9fa48("4254") ? isRetryableError(error) : (stryCov_9fa48("4254", "4255", "4256"), !isRetryableError(error))) {
            if (stryMutAct_9fa48("4257")) {
              {}
            } else {
              stryCov_9fa48("4257");
              throw error; // Lança imediatamente se não for retryable
            }
          }
          stryMutAct_9fa48("4258") ? options.onRetry(error, attempt, delay) : (stryCov_9fa48("4258"), options.onRetry?.(error, attempt, delay));
        }
      }
    }), context);
  }
}