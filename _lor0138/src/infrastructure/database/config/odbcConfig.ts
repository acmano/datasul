// src/infrastructure/database/config/odbcConfig.ts

/**
 * @fileoverview Configuração de conexões ODBC
 *
 * @description
 * Módulo responsável por gerar e validar configurações de conexão ODBC
 * para os bancos de dados Progress OpenEdge (EMP e MULT).
 *
 * IMPORTANTE:
 * - Usa parseInt() direto, NÃO parseTimeout()
 * - Timeouts devem estar em ms puros no .env (15000, não '15s')
 * - Suporta autenticação via DSN ou credenciais explícitas
 *
 * @module infrastructure/database/config/odbcConfig
 */

// ====================================================================
// INTERFACES
// ====================================================================

/**
 * Interface de configuração ODBC completa
 *
 * @interface OdbcConfig
 *
 * @property {string} connectionString - String de conexão ODBC formatada
 * @property {number} connectionTimeout - Timeout para estabelecer conexão (ms)
 * @property {number} commandTimeout - Timeout para executar comandos (ms)
 */
export interface OdbcConfig {
  connectionString: string;
  connectionTimeout: number;
  commandTimeout: number;
}

// ====================================================================
// FUNÇÕES DE CONFIGURAÇÃO
// ====================================================================

/**
 * Retorna connection string ODBC para o database especificado
 *
 * @description
 * Gera string de conexão ODBC formatada usando DSN e credenciais
 * das variáveis de ambiente. Suporta fallback entre variáveis
 * específicas ODBC e genéricas DB.
 *
 * @param {('EMP'|'MULT')} database - Identificador do banco (EMP ou MULT)
 * @returns {string} Connection string ODBC no formato: DSN=xxx;UID=xxx;PWD=xxx
 *
 * @public
 *
 * @example
 * ```typescript
 * // Para banco EMP
 * const connStr = getOdbcConnectionString('EMP');
 * // 'DSN=PRD_EMS2EMP;UID=dcloren;PWD=#dcloren#'
 *
 * // Para banco MULT
 * const connStr = getOdbcConnectionString('MULT');
 * // 'DSN=PRD_EMS2MULT;UID=dcloren;PWD=#dcloren#'
 * ```
 *
 * @remarks
 * Ordem de precedência das variáveis de ambiente:
 * 1. ODBC_DSN_EMP ou ODBC_DSN_MULT (específico)
 * 2. DSN padrão: PRD_EMS2EMP ou PRD_EMS2MULT
 *
 * Para credenciais:
 * 1. ODBC_USER (específico ODBC)
 * 2. DB_USER (genérico)
 * 3. ODBC_PASSWORD (específico ODBC)
 * 4. DB_PASSWORD (genérico)
 */
export const getOdbcConnectionString = (database: 'EMP' | 'MULT'): string => {
  // Determinar DSN com base no database
  const dsnName =
    database === 'EMP'
      ? process.env.ODBC_DSN_EMP || 'PRD_EMS2EMP'
      : process.env.ODBC_DSN_MULT || 'PRD_EMS2MULT';

  // Buscar credenciais com fallback
  const user = process.env.ODBC_USER || process.env.DB_USER || '';
  const password = process.env.ODBC_PASSWORD || process.env.DB_PASSWORD || '';

  // Montar connection string
  return `DSN=${dsnName};UID=${user};PWD=${password}`;
};

/**
 * Retorna configuração ODBC completa com timeouts
 *
 * @description
 * Gera objeto de configuração ODBC completo incluindo connection string
 * e timeouts. Todos os valores são lidos das variáveis de ambiente.
 *
 * @param {('EMP'|'MULT')} database - Identificador do banco (EMP ou MULT)
 * @returns {OdbcConfig} Objeto de configuração completo
 *
 * @public
 *
 * @example
 * ```typescript
 * const config = getOdbcConfig('EMP');
 * // {
 * //   connectionString: 'DSN=PRD_EMS2EMP;UID=dcloren;PWD=#dcloren#',
 * //   connectionTimeout: 15000,
 * //   commandTimeout: 30000
 * // }
 * ```
 *
 * @remarks
 * CRÍTICO:
 * - Usa parseInt() direto, NÃO parseTimeout()
 * - Variáveis de ambiente devem conter milissegundos puros
 * - Exemplo: ODBC_CONNECTION_TIMEOUT=15000 (não '15s')
 *
 * Defaults:
 * - connectionTimeout: 15000ms (15 segundos)
 * - commandTimeout: 30000ms (30 segundos)
 */
export const getOdbcConfig = (database: 'EMP' | 'MULT'): OdbcConfig => {
  // Gerar connection string
  const connectionString = getOdbcConnectionString(database);

  // Ler timeouts das variáveis de ambiente
  // IMPORTANTE: Usa parseInt() direto, então .env deve ter milissegundos puros
  const connectionTimeout = parseInt(
    process.env.ODBC_CONNECTION_TIMEOUT || '15000',
    10
  );

  const commandTimeout = parseInt(
    process.env.ODBC_COMMAND_TIMEOUT || '30000',
    10
  );

  return {
    connectionString,
    connectionTimeout,
    commandTimeout,
  };
};

// ====================================================================
// FUNÇÕES DE VALIDAÇÃO
// ====================================================================

/**
 * Valida configuração ODBC
 *
 * @description
 * Verifica se todas as variáveis de ambiente necessárias estão presentes
 * e se os valores são válidos. Lança erro descritivo em caso de problema.
 *
 * @throws {Error} Se variáveis obrigatórias não estiverem definidas
 * @throws {Error} Se timeouts forem inválidos (< 1000ms)
 * @throws {Error} Se timeouts não forem números válidos
 *
 * @public
 *
 * @example
 * ```typescript
 * try {
 *   validateOdbcConfig();
 *   console.log('Configuração ODBC válida!');
 * } catch (error) {
 *   console.error('Erro na configuração:', error.message);
 * }
 * ```
 *
 * @remarks
 * Validações realizadas:
 * 1. Presença de DB_USER (obrigatório)
 * 2. Presença de DB_PASSWORD (obrigatório)
 * 3. ODBC_CONNECTION_TIMEOUT >= 1000ms
 * 4. ODBC_COMMAND_TIMEOUT >= 1000ms
 * 5. Timeouts são números válidos (não NaN)
 *
 * Variáveis validadas:
 * - DB_USER: Usuário para autenticação
 * - DB_PASSWORD: Senha para autenticação
 * - ODBC_CONNECTION_TIMEOUT: Timeout de conexão em ms
 * - ODBC_COMMAND_TIMEOUT: Timeout de comando em ms
 */
export const validateOdbcConfig = (): void => {
  // Variáveis obrigatórias
  const requiredVars = ['DB_USER', 'DB_PASSWORD'];

  // Verificar presença de variáveis obrigatórias
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Variável de ambiente obrigatória não encontrada: ${varName}`);
    }
  }

  // Validar timeouts
  const connectionTimeout = parseInt(process.env.ODBC_CONNECTION_TIMEOUT || '15000', 10);
  const commandTimeout = parseInt(process.env.ODBC_COMMAND_TIMEOUT || '30000', 10);

  // Verificar se connectionTimeout é número válido
  if (isNaN(connectionTimeout)) {
    throw new Error(
      `ODBC_CONNECTION_TIMEOUT inválido: não é um número (recebido: ${process.env.ODBC_CONNECTION_TIMEOUT})`
    );
  }

  // Verificar se connectionTimeout é >= 1000ms
  if (connectionTimeout < 1000) {
    throw new Error(
      `ODBC_CONNECTION_TIMEOUT inválido: deve ser >= 1000ms (recebido: ${process.env.ODBC_CONNECTION_TIMEOUT})`
    );
  }

  // Verificar se commandTimeout é número válido
  if (isNaN(commandTimeout)) {
    throw new Error(
      `ODBC_COMMAND_TIMEOUT inválido: não é um número (recebido: ${process.env.ODBC_COMMAND_TIMEOUT})`
    );
  }

  // Verificar se commandTimeout é >= 1000ms
  if (commandTimeout < 1000) {
    throw new Error(
      `ODBC_COMMAND_TIMEOUT inválido: deve ser >= 1000ms (recebido: ${process.env.ODBC_COMMAND_TIMEOUT})`
    );
  }
};

// ====================================================================
// UTILITÁRIOS DE DEBUG
// ====================================================================

/**
 * Retorna informações de debug da configuração ODBC
 *
 * @description
 * Gera objeto com informações da configuração ODBC para debug,
 * ocultando dados sensíveis como senha. Útil para logs de diagnóstico.
 *
 * @param {('EMP'|'MULT')} database - Identificador do banco
 * @returns {object} Objeto com informações de debug
 *
 * @public
 *
 * @example
 * ```typescript
 * const info = getOdbcConfigInfo('EMP');
 * console.log(info);
 * // {
 * //   database: 'EMP',
 * //   dsn: 'PRD_EMS2EMP',
 * //   user: 'dcloren',
 * //   hasPassword: true,
 * //   connectionTimeout: 15000,
 * //   commandTimeout: 30000
 * // }
 * ```
 *
 * @remarks
 * SEGURANÇA:
 * - Senha nunca é exposta, apenas indicado se está presente
 * - Use em logs de debug para diagnóstico
 * - Não expor em endpoints públicos
 */
export const getOdbcConfigInfo = (database: 'EMP' | 'MULT') => {
  const dsnName =
    database === 'EMP'
      ? process.env.ODBC_DSN_EMP || 'PRD_EMS2EMP'
      : process.env.ODBC_DSN_MULT || 'PRD_EMS2MULT';

  const user = process.env.ODBC_USER || process.env.DB_USER || '';
  const hasPassword = !!(process.env.ODBC_PASSWORD || process.env.DB_PASSWORD);

  const connectionTimeout = parseInt(
    process.env.ODBC_CONNECTION_TIMEOUT || '15000',
    10
  );

  const commandTimeout = parseInt(
    process.env.ODBC_COMMAND_TIMEOUT || '30000',
    10
  );

  return {
    database,
    dsn: dsnName,
    user,
    hasPassword,
    connectionTimeout,
    commandTimeout,
  };
};