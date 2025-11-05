// src/config/retry.config.ts

import {
  RetryPolicy,
  defaultRetryPolicy,
  aggressiveRetryPolicy,
  conservativeRetryPolicy,
  noRetryPolicy,
  type RetryConfig,
} from '@infrastructure/database/retry/RetryPolicy';

/**
 * Configurações de retry por tipo de conexão
 *
 * @description
 * Define políticas de retry específicas para cada tipo de sistema/conexão.
 * Permite ajuste fino do comportamento de retry baseado no contexto.
 *
 * **Políticas disponíveis:**
 * - `datasul_production`: Agressiva - máxima disponibilidade
 * - `datasul_test`: Conservadora - menos tentativas
 * - `datasul_homologation`: Balanceada - intermediária
 * - `sqlserver`: Balanceada - conexões diretas SQL Server
 * - `informix`: Balanceada - conexões Informix
 * - `pcfactory`: Conservadora - operações MES
 * - `corporativo`: Conservadora - BI/Analytics
 * - `default`: Política padrão para conexões não mapeadas
 *
 * @example Datasul Production (crítico)
 * ```typescript
 * const policy = retryConfigurations.datasul_production;
 * // 5 tentativas, delay inicial 50ms, delay máximo 3s
 * ```
 *
 * @example Datasul Test (desenvolvimento)
 * ```typescript
 * const policy = retryConfigurations.datasul_test;
 * // 2 tentativas, delay inicial 200ms, delay máximo 1s
 * ```
 */
export const retryConfigurations: Record<string, RetryPolicy> = {
  // ========================================
  // DATASUL - ODBC
  // ========================================

  /**
   * Datasul Production - Agressivo
   *
   * Configuração agressiva para ambiente de produção:
   * - 5 tentativas (máxima resiliência)
   * - Delay inicial: 50ms (retry rápido)
   * - Delay máximo: 3s
   * - Use para: DtsPrdEmp, DtsPrdMult, DtsPrdAdt, DtsPrdEsp, DtsPrdEms5, DtsPrdFnd
   */
  datasul_production: new RetryPolicy({
    maxAttempts: 5,
    initialDelayMs: 50,
    maxDelayMs: 3000,
    backoffMultiplier: 2,
    jitterMs: 50,
  }),

  /**
   * Datasul Test - Conservador
   *
   * Configuração conservadora para ambiente de teste:
   * - 2 tentativas (fail-fast para debugging)
   * - Delay inicial: 200ms
   * - Delay máximo: 1s
   * - Use para: DtsTstEmp, DtsTstMult, DtsTstAdt, DtsTstEsp, DtsTstEms5, DtsTstFnd
   */
  datasul_test: new RetryPolicy({
    maxAttempts: 2,
    initialDelayMs: 200,
    maxDelayMs: 1000,
    backoffMultiplier: 2,
    jitterMs: 50,
  }),

  /**
   * Datasul Homologação - Balanceado
   *
   * Configuração balanceada para ambiente de homologação:
   * - 3 tentativas (intermediário)
   * - Delay inicial: 100ms
   * - Delay máximo: 2s
   * - Use para: DtsHmlEmp, DtsHmlMult, DtsHmlAdt, DtsHmlEsp, DtsHmlEms5, DtsHmlFnd
   */
  datasul_homologation: new RetryPolicy({
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
    jitterMs: 50,
  }),

  // ========================================
  // INFORMIX - ODBC
  // ========================================

  /**
   * Informix - Balanceado
   *
   * Configuração balanceada para Informix (Logix):
   * - 3 tentativas
   * - Delay inicial: 150ms
   * - Delay máximo: 2.5s
   * - Use para: LgxDev, LgxAtu, LgxNew, LgxPrd
   */
  informix: new RetryPolicy({
    maxAttempts: 3,
    initialDelayMs: 150,
    maxDelayMs: 2500,
    backoffMultiplier: 2,
    jitterMs: 50,
  }),

  // ========================================
  // SQL SERVER - Conexões Diretas
  // ========================================

  /**
   * SQL Server - Balanceado
   *
   * Configuração balanceada para SQL Server direto:
   * - 3 tentativas
   * - Delay inicial: 100ms (mais rápido que ODBC)
   * - Delay máximo: 2s
   * - Use para: conexões diretas SQL Server
   */
  sqlserver: new RetryPolicy({
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
    jitterMs: 50,
  }),

  /**
   * PCFactory - Conservador
   *
   * Configuração conservadora para PCFactory (MES):
   * - 2 tentativas (operações MES são sensíveis)
   * - Delay inicial: 200ms
   * - Delay máximo: 2s
   * - Use para: PCF4_PRD, PCF4_DEV, PCF_Integ_PRD, PCF_Integ_DEV
   */
  pcfactory: new RetryPolicy({
    maxAttempts: 2,
    initialDelayMs: 200,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
    jitterMs: 50,
  }),

  /**
   * Corporativo - Conservador
   *
   * Configuração conservadora para Corporativo Lorenzetti (BI/Analytics):
   * - 2 tentativas (queries podem ser pesadas)
   * - Delay inicial: 250ms
   * - Delay máximo: 3s
   * - Use para: DATACORP_PRD, DATACORP_DEV
   */
  corporativo: new RetryPolicy({
    maxAttempts: 2,
    initialDelayMs: 250,
    maxDelayMs: 3000,
    backoffMultiplier: 2,
    jitterMs: 50,
  }),

  // ========================================
  // DEFAULT
  // ========================================

  /**
   * Default - Balanceado
   *
   * Política padrão para conexões não mapeadas:
   * - 3 tentativas
   * - Delay inicial: 100ms
   * - Delay máximo: 5s
   */
  default: defaultRetryPolicy,
};

/**
 * Mapeamento de DSN para política de retry
 *
 * @description
 * Permite lookup direto de política por DSN específico.
 * Fallback para política por tipo de sistema se DSN não estiver mapeado.
 *
 * @example
 * ```typescript
 * const policy = getRetryPolicyByDSN('DtsPrdEmp');
 * // Retorna: datasul_production
 * ```
 */
export const dsnToPolicyMap: Record<string, keyof typeof retryConfigurations> = {
  // Datasul Production
  DtsPrdAdt: 'datasul_production',
  DtsPrdEmp: 'datasul_production',
  DtsPrdEsp: 'datasul_production',
  DtsPrdMult: 'datasul_production',
  DtsPrdEms5: 'datasul_production',
  DtsPrdFnd: 'datasul_production',

  // Datasul Test
  DtsTstAdt: 'datasul_test',
  DtsTstEmp: 'datasul_test',
  DtsTstEsp: 'datasul_test',
  DtsTstMult: 'datasul_test',
  DtsTstEms5: 'datasul_test',
  DtsTstFnd: 'datasul_test',

  // Datasul Homologation
  DtsHmlAdt: 'datasul_homologation',
  DtsHmlEmp: 'datasul_homologation',
  DtsHmlEsp: 'datasul_homologation',
  DtsHmlMult: 'datasul_homologation',
  DtsHmlEms5: 'datasul_homologation',
  DtsHmlFnd: 'datasul_homologation',

  // Informix
  LgxDev: 'informix',
  LgxAtu: 'informix',
  LgxNew: 'informix',
  LgxPrd: 'informix',

  // PCFactory
  PCF4_PRD: 'pcfactory',
  PCF4_DEV: 'pcfactory',
  PCF_Integ_PRD: 'pcfactory',
  PCF_Integ_DEV: 'pcfactory',

  // Corporativo
  DATACORP_PRD: 'corporativo',
  DATACORP_DEV: 'corporativo',
};

/**
 * Obtém política de retry para um DSN específico
 *
 * @param dsn - Nome do DSN (ex: 'DtsPrdEmp', 'LgxDev')
 * @returns {RetryPolicy} Política de retry apropriada
 *
 * @description
 * Busca política específica para o DSN. Se não encontrar,
 * tenta inferir pelo prefixo do DSN (Dts, Lgx, PCF, DATACORP).
 * Se não conseguir inferir, retorna política default.
 *
 * @example
 * ```typescript
 * const policy = getRetryPolicyByDSN('DtsPrdEmp');
 * // Retorna: aggressiveRetryPolicy (5 tentativas)
 * ```
 *
 * @example
 * ```typescript
 * const policy = getRetryPolicyByDSN('UNKNOWN_DSN');
 * // Retorna: defaultRetryPolicy (3 tentativas)
 * ```
 */
export function getRetryPolicyByDSN(dsn: string): RetryPolicy {
  // Lookup direto
  const policyKey = dsnToPolicyMap[dsn];
  if (policyKey) {
    return retryConfigurations[policyKey]!;
  }

  // Inferência por prefixo
  if (dsn.startsWith('DtsPrd')) {
    return retryConfigurations.datasul_production!;
  }
  if (dsn.startsWith('DtsTst')) {
    return retryConfigurations.datasul_test!;
  }
  if (dsn.startsWith('DtsHml')) {
    return retryConfigurations.datasul_homologation!;
  }
  if (dsn.startsWith('Lgx')) {
    return retryConfigurations.informix!;
  }
  if (dsn.startsWith('PCF')) {
    return retryConfigurations.pcfactory!;
  }
  if (dsn.startsWith('DATACORP')) {
    return retryConfigurations.corporativo!;
  }

  // Fallback para default
  return retryConfigurations.default!;
}

/**
 * Obtém política de retry customizada de variáveis de ambiente
 *
 * @returns {Partial<RetryConfig>} Configuração parcial de retry
 *
 * @description
 * Permite override da configuração via environment variables.
 * Útil para ajuste fino sem recompilação.
 *
 * **Variáveis de ambiente suportadas:**
 * - `DB_RETRY_ENABLED`: Habilita/desabilita retry (default: true)
 * - `DB_RETRY_MAX_ATTEMPTS`: Número máximo de tentativas (default: 3)
 * - `DB_RETRY_INITIAL_DELAY`: Delay inicial em ms (default: 100)
 * - `DB_RETRY_MAX_DELAY`: Delay máximo em ms (default: 5000)
 * - `DB_RETRY_BACKOFF_MULTIPLIER`: Multiplicador exponencial (default: 2)
 * - `DB_RETRY_JITTER`: Jitter aleatório em ms (default: 50)
 *
 * @example .env
 * ```bash
 * DB_RETRY_ENABLED=true
 * DB_RETRY_MAX_ATTEMPTS=5
 * DB_RETRY_INITIAL_DELAY=50
 * DB_RETRY_MAX_DELAY=3000
 * DB_RETRY_BACKOFF_MULTIPLIER=2
 * DB_RETRY_JITTER=50
 * ```
 *
 * @example Uso
 * ```typescript
 * const envConfig = getRetryConfigFromEnv();
 * const policy = new RetryPolicy(envConfig);
 * ```
 */
export function getRetryConfigFromEnv(): Partial<RetryConfig> {
  const config: Partial<RetryConfig> = {};

  // Se retry está desabilitado, retorna config com maxAttempts = 1 (no retry)
  if (process.env.DB_RETRY_ENABLED === 'false') {
    return { maxAttempts: 1 };
  }

  // Max attempts
  const maxAttempts = parseInt(process.env.DB_RETRY_MAX_ATTEMPTS || '');
  if (!isNaN(maxAttempts) && maxAttempts > 0) {
    config.maxAttempts = maxAttempts;
  }

  // Initial delay
  const initialDelay = parseInt(process.env.DB_RETRY_INITIAL_DELAY || '');
  if (!isNaN(initialDelay) && initialDelay > 0) {
    config.initialDelayMs = initialDelay;
  }

  // Max delay
  const maxDelay = parseInt(process.env.DB_RETRY_MAX_DELAY || '');
  if (!isNaN(maxDelay) && maxDelay > 0) {
    config.maxDelayMs = maxDelay;
  }

  // Backoff multiplier
  const multiplier = parseFloat(process.env.DB_RETRY_BACKOFF_MULTIPLIER || '');
  if (!isNaN(multiplier) && multiplier > 1) {
    config.backoffMultiplier = multiplier;
  }

  // Jitter
  const jitter = parseInt(process.env.DB_RETRY_JITTER || '');
  if (!isNaN(jitter) && jitter >= 0) {
    config.jitterMs = jitter;
  }

  return config;
}

/**
 * Políticas pré-definidas para fácil importação
 *
 * @example
 * ```typescript
 * import { RetryPolicies } from '@config/retry.config';
 *
 * const result = await RetryPolicies.aggressive.execute(async () => {
 *   return await query();
 * }, 'DtsPrdEmp');
 * ```
 */
export const RetryPolicies = {
  /**
   * Política padrão balanceada (3 tentativas)
   */
  default: defaultRetryPolicy,

  /**
   * Política agressiva para produção (5 tentativas)
   */
  aggressive: aggressiveRetryPolicy,

  /**
   * Política conservadora para desenvolvimento (2 tentativas)
   */
  conservative: conservativeRetryPolicy,

  /**
   * Sem retry - fail-fast (1 tentativa)
   */
  noRetry: noRetryPolicy,
} as const;
