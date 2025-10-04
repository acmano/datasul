// src/infrastructure/database/config/odbcConfig.ts

export interface OdbcConfig {
  connectionString: string;
  connectionTimeout: number; // milissegundos
  commandTimeout: number;    // milissegundos
}

/**
 * Retorna connection string ODBC para o database especificado
 */
export const getOdbcConnectionString = (database: 'EMP' | 'MULT'): string => {
  const dsnName =
    database === 'EMP'
      ? process.env.ODBC_DSN_EMP || 'PRD_EMS2EMP'
      : process.env.ODBC_DSN_MULT || 'PRD_EMS2MULT';

  const user = process.env.ODBC_USER || process.env.DB_USER || '';
  const password = process.env.ODBC_PASSWORD || process.env.DB_PASSWORD || '';

  return `DSN=${dsnName};UID=${user};PWD=${password}`;
};

/**
 * ✅ NOVO: Retorna configuração completa com timeouts
 */
export const getOdbcConfig = (database: 'EMP' | 'MULT'): OdbcConfig => {
  const connectionString = getOdbcConnectionString(database);

  // ✅ IMPORTANTE: Usa parseInt() direto, então .env deve ter milissegundos puros
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
    commandTimeout
  };
};

/**
 * Valida configuração ODBC
 */
export const validateOdbcConfig = (): void => {
  const requiredVars = ['DB_USER', 'DB_PASSWORD'];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Variável de ambiente obrigatória não encontrada: ${varName}`);
    }
  }

  // Verifica timeouts
  const connectionTimeout = parseInt(process.env.ODBC_CONNECTION_TIMEOUT || '15000', 10);
  const commandTimeout = parseInt(process.env.ODBC_COMMAND_TIMEOUT || '30000', 10);

  if (isNaN(connectionTimeout) || connectionTimeout < 1000) {
    throw new Error(
      `ODBC_CONNECTION_TIMEOUT inválido: deve ser >= 1000ms (recebido: ${process.env.ODBC_CONNECTION_TIMEOUT})`
    );
  }

  if (isNaN(commandTimeout) || commandTimeout < 1000) {
    throw new Error(
      `ODBC_COMMAND_TIMEOUT inválido: deve ser >= 1000ms (recebido: ${process.env.ODBC_COMMAND_TIMEOUT})`
    );
  }
};