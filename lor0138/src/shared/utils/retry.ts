// src/shared/utils/retry.ts

import { log } from './logger';

/**
 * ========================================
 * TIPOS E INTERFACES
 * ========================================
 */

/**
 * Opções de configuração para retry com backoff
 *
 * PROPÓSITO:
 * Permite customizar comportamento de tentativas e delays
 */
export interface RetryOptions {
  /**
   * Número máximo de tentativas
   *
   * VALORES RECOMENDADOS:
   * - 3: Padrão, equilibrado
   * - 5: Para operações mais importantes
   * - 1: Sem retry (fail fast)
   *
   * @default 3
   */
  maxAttempts: number;

  /**
   * Delay inicial em milissegundos
   *
   * VALORES RECOMENDADOS:
   * - 1000ms (1s): Padrão
   * - 500ms: Para operações rápidas
   * - 2000ms: Para operações pesadas
   *
   * @default 1000
   */
  initialDelay: number;

  /**
   * Delay máximo em milissegundos
   *
   * PROPÓSITO:
   * Limita crescimento exponencial do delay
   *
   * VALORES RECOMENDADOS:
   * - 10000ms (10s): Padrão
   * - 5000ms: Para operações rápidas
   * - 30000ms: Para operações longas
   *
   * @default 10000
   */
  maxDelay: number;

  /**
   * Fator multiplicador para exponential backoff
   *
   * COMPORTAMENTO:
   * - delay *= backoffFactor a cada tentativa
   * - 2.0 = dobra delay a cada tentativa
   * - 1.5 = aumenta 50% a cada tentativa
   *
   * EXEMPLO COM FACTOR 2.0:
   * - Tentativa 1: 1000ms
   * - Tentativa 2: 2000ms
   * - Tentativa 3: 4000ms
   * - Tentativa 4: 8000ms
   *
   * @default 2
   */
  backoffFactor: number;

  /**
   * Adiciona aleatoriedade ao delay
   *
   * PROPÓSITO:
   * Evita "thundering herd" (múltiplos clientes retrying simultaneamente)
   *
   * COMPORTAMENTO:
   * - true: delay * (0.5 + random(0, 1))
   * - false: delay fixo
   *
   * EXEMPLO:
   * - Delay base: 2000ms
   * - Com jitter: entre 1000ms e 3000ms
   * - Sem jitter: sempre 2000ms
   *
   * @default true
   */
  jitter: boolean;

  /**
   * Callback executado antes de cada retry
   *
   * PROPÓSITO:
   * Permite logging customizado ou lógica adicional
   *
   * EXEMPLO:
   * ```typescript
   * onRetry: (error, attempt, nextDelay) => {
   *   metrics.incrementRetryCount('database');
   *   log.warn('Retry necessário', { attempt, nextDelay });
   * }
   * ```
   *
   * @param error - Erro que causou o retry
   * @param attempt - Número da tentativa atual
   * @param nextDelay - Delay até próxima tentativa em ms
   *
   * @optional
   */
  onRetry?: (error: Error, attempt: number, nextDelay: number) => void;
}

/**
 * ========================================
 * CONSTANTES
 * ========================================
 */

/**
 * Opções padrão para retry
 *
 * VALORES:
 * - maxAttempts: 3 tentativas
 * - initialDelay: 1000ms (1 segundo)
 * - maxDelay: 10000ms (10 segundos)
 * - backoffFactor: 2 (exponencial)
 * - jitter: true (aleatoriedade ativada)
 */
const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
};

/**
 * ========================================
 * FUNÇÃO PRINCIPAL DE RETRY
 * ========================================
 */

/**
 * Executa uma função com retry e exponential backoff
 *
 * PROPÓSITO:
 * Tenta executar função múltiplas vezes com delays crescentes
 * até obter sucesso ou esgotar tentativas.
 *
 * ALGORITMO:
 * 1. Tenta executar função
 * 2. Se sucesso: retorna resultado
 * 3. Se falha: aguarda delay e tenta novamente
 * 4. Delay cresce exponencialmente a cada tentativa
 * 5. Após maxAttempts: lança último erro
 *
 * EXPONENTIAL BACKOFF:
 * - Delay aumenta exponencialmente: 1s → 2s → 4s → 8s
 * - Limita no maxDelay para não crescer infinitamente
 * - Opcional: jitter adiciona aleatoriedade (evita thundering herd)
 *
 * CASOS DE USO:
 * - Conexões de banco de dados
 * - Requisições HTTP para APIs externas
 * - Operações de rede temporariamente indisponíveis
 * - File system busy
 *
 * EXEMPLO BÁSICO:
 * ```typescript
 * // Retry em conexão de banco
 * const pool = await retryWithBackoff(
 *   () => createDatabasePool(),
 *   { maxAttempts: 5, initialDelay: 1000 },
 *   'Database Connection'
 * );
 * ```
 *
 * EXEMPLO COM CALLBACK:
 * ```typescript
 * const data = await retryWithBackoff(
 *   () => fetchDataFromAPI(),
 *   {
 *     maxAttempts: 3,
 *     initialDelay: 500,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Tentativa ${attempt} falhou, aguardando ${delay}ms`);
 *       metrics.increment('api_retry');
 *     }
 *   },
 *   'External API'
 * );
 * ```
 *
 * EXEMPLO DE LOGS:
 * ```
 * Database Connection: Tentativa 1/5
 * Database Connection: Tentativa 1 falhou, retry em 1000ms (nextAttempt: 2)
 * Database Connection: Tentativa 2/5
 * Database Connection: Tentativa 2 falhou, retry em 2000ms (nextAttempt: 3)
 * Database Connection: Tentativa 3/5
 * Database Connection: Sucesso na tentativa 3
 * ```
 *
 * PONTOS CRÍTICOS:
 * - Função deve ser idempotente (pode executar múltiplas vezes)
 * - Delays são em MILISSEGUNDOS
 * - Jitter ativado por padrão (recomendado)
 * - Erros não-retryable devem ser detectados no onRetry
 * - Timeout total = sum(all delays) + execution time
 *
 * @param fn - Função async a ser executada
 * @param options - Opções de retry (opcional, usa defaults)
 * @param context - Contexto para logs (ex: "SQL Server EMP")
 * @returns Promise com resultado da função ou lança erro após todas tentativas
 *
 * @template T - Tipo do retorno da função
 *
 * @throws {Error} Último erro após esgotar todas tentativas
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  context: string = 'Operation'
): Promise<T> {
  // ========================================
  // CONFIGURAÇÃO
  // ========================================
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelay;

  // ========================================
  // LOOP DE TENTATIVAS
  // ========================================
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // ========================================
      // LOG DE TENTATIVA
      // ========================================
      log.debug(`${context}: Tentativa ${attempt}/${opts.maxAttempts}`, {
        attempt,
        maxAttempts: opts.maxAttempts,
      });

      // ========================================
      // EXECUÇÃO DA FUNÇÃO
      // ========================================
      const result = await fn();

      // ========================================
      // SUCESSO
      // ========================================
      if (attempt > 1) {
        // Só loga se houve retry
        log.info(`${context}: Sucesso na tentativa ${attempt}`, { attempt });
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // ========================================
      // ÚLTIMA TENTATIVA - LANÇA ERRO
      // ========================================
      if (attempt === opts.maxAttempts) {
        log.error(
          `${context}: Falhou após ${opts.maxAttempts} tentativas`,
          {
            error: lastError.message,
            attempts: opts.maxAttempts,
          }
        );
        throw lastError;
      }

      // ========================================
      // CALCULAR PRÓXIMO DELAY
      // ========================================
      const nextDelay = calculateDelay(delay, opts);

      log.warn(
        `${context}: Tentativa ${attempt} falhou, retry em ${nextDelay}ms`,
        {
          attempt,
          error: lastError.message,
          nextDelay,
          nextAttempt: attempt + 1,
        }
      );

      // ========================================
      // CALLBACK OPCIONAL
      // ========================================
      if (opts.onRetry) {
        opts.onRetry(lastError, attempt, nextDelay);
      }

      // ========================================
      // AGUARDAR ANTES DO PRÓXIMO RETRY
      // ========================================
      await sleep(nextDelay);

      // ========================================
      // ATUALIZAR DELAY PARA PRÓXIMA ITERAÇÃO
      // ========================================
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
    }
  }

  // Nunca deve chegar aqui, mas TypeScript precisa
  throw lastError || new Error(`${context}: Retry failed`);
}

/**
 * ========================================
 * FUNÇÕES AUXILIARES
 * ========================================
 */

/**
 * Calcula delay com exponential backoff e jitter opcional
 *
 * PROPÓSITO:
 * Determina quanto tempo aguardar antes da próxima tentativa
 *
 * ALGORITMO:
 * 1. Se jitter ativado: multiplica por fator aleatório (0.5 - 1.5)
 * 2. Garante que não excede maxDelay
 *
 * JITTER EXPLICADO:
 * - Sem jitter: Todos clientes retrying ao mesmo tempo
 * - Com jitter: Cada cliente retry em tempo ligeiramente diferente
 * - Evita "thundering herd" no servidor
 *
 * EXEMPLO SEM JITTER:
 * ```
 * currentDelay: 2000ms
 * nextDelay: 2000ms (sempre)
 * ```
 *
 * EXEMPLO COM JITTER:
 * ```
 * currentDelay: 2000ms
 * jitterFactor: random entre 0.5 e 1.5
 * nextDelay: entre 1000ms e 3000ms
 * ```
 *
 * @param currentDelay - Delay atual em ms
 * @param options - Opções de retry
 * @returns Próximo delay em ms
 */
function calculateDelay(currentDelay: number, options: RetryOptions): number {
  let nextDelay = currentDelay;

  // ========================================
  // APLICAR JITTER (ALEATORIEDADE)
  // ========================================
  if (options.jitter) {
    // Jitter entre 50% e 150% do delay
    const jitterFactor = 0.5 + Math.random();
    nextDelay = Math.floor(currentDelay * jitterFactor);
  }

  // ========================================
  // GARANTIR QUE NÃO EXCEDE maxDelay
  // ========================================
  return Math.min(nextDelay, options.maxDelay);
}

/**
 * Helper para aguardar um tempo
 *
 * PROPÓSITO:
 * Wrapper de setTimeout como Promise
 *
 * EXEMPLO:
 * ```typescript
 * await sleep(1000); // Aguarda 1 segundo
 * console.log('1 segundo depois');
 * ```
 *
 * @param ms - Milissegundos a aguardar
 * @returns Promise que resolve após delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ========================================
 * VERIFICAÇÃO DE ERROS RETRYABLE
 * ========================================
 */

/**
 * Verifica se um erro é retryable (temporário)
 *
 * PROPÓSITO:
 * Distinguir erros temporários (vale retry) de erros permanentes (não vale)
 *
 * ERROS RETRYABLE (TEMPORÁRIOS):
 * - ECONNREFUSED: Servidor recusou conexão (pode estar reiniciando)
 * - ETIMEDOUT: Timeout de conexão (rede lenta, servidor ocupado)
 * - ENOTFOUND: DNS não resolveu (problema temporário de DNS)
 * - EHOSTUNREACH: Host inacessível (problema de rede)
 * - ENETUNREACH: Rede inacessível (problema de rede)
 * - "timeout": Qualquer erro com palavra timeout
 * - "connection closed": Conexão fechada inesperadamente
 * - "connection reset": Conexão resetada pelo peer
 * - "socket hang up": Socket pendurado
 *
 * ERROS NÃO-RETRYABLE (PERMANENTES):
 * - Erros de autenticação (senha errada)
 * - Erros de validação (dados inválidos)
 * - Erros 4xx HTTP (bad request, not found, etc)
 * - Erros de sintaxe SQL
 * - Erros de lógica de negócio
 *
 * EXEMPLO:
 * ```typescript
 * try {
 *   await connectToDatabase();
 * } catch (error) {
 *   if (isRetryableError(error)) {
 *     // Vale a pena tentar novamente
 *     await retryWithBackoff(() => connectToDatabase());
 *   } else {
 *     // Erro permanente, não adianta retry
 *     throw error;
 *   }
 * }
 * ```
 *
 * @param error - Erro a verificar
 * @returns true se erro é temporário (vale retry), false se permanente
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
 * ========================================
 * FUNÇÃO DE RETRY CONDICIONAL
 * ========================================
 */

/**
 * Retry apenas para erros retryable
 *
 * PROPÓSITO:
 * Versão inteligente de retry que para imediatamente em erros permanentes
 *
 * COMPORTAMENTO:
 * - Erros retryable: Continua tentando
 * - Erros não-retryable: Lança erro imediatamente
 *
 * VANTAGENS:
 * - Não desperdiça tentativas em erros permanentes
 * - Falha rápido em erros de configuração
 * - Economiza tempo em erros de lógica
 *
 * EXEMPLO:
 * ```typescript
 * // Senha errada: não vale retry, falha imediatamente
 * // Timeout: vale retry, tenta até 3x
 * const connection = await retryOnRetryableError(
 *   () => connectToDatabase(config),
 *   { maxAttempts: 3 },
 *   'Database'
 * );
 * ```
 *
 * COMPARAÇÃO:
 * ```typescript
 * // retryWithBackoff: Tenta 3x mesmo com senha errada
 * // retryOnRetryableError: Falha imediatamente com senha errada
 * //                        Tenta 3x apenas em timeouts
 * ```
 *
 * @param fn - Função async a ser executada
 * @param options - Opções de retry (opcional)
 * @param context - Contexto para logs
 * @returns Promise com resultado da função
 *
 * @template T - Tipo do retorno da função
 *
 * @throws {Error} Erro permanente imediatamente ou último erro após tentativas
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
        // ========================================
        // VERIFICAR SE ERRO É RETRYABLE
        // ========================================
        if (!isRetryableError(error)) {
          log.error(`${context}: Erro não-retryable, abortando`, {
            error: error.message,
            attempt,
          });
          throw error; // Lança imediatamente se não for retryable
        }

        // ========================================
        // CALLBACK OPCIONAL DO USUÁRIO
        // ========================================
        options.onRetry?.(error, attempt, delay);
      },
    },
    context
  );
}