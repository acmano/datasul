import { DatabaseConfig } from '../types';

export function getSqlServerConfigEmp(): DatabaseConfig {
  // ✅ DEBUG: Veja o que está vindo do .env
  console.log('🔍 sqlServerConfig - DB_DATABASE_EMP:', process.env.DB_DATABASE_EMP);
  console.log('🔍 sqlServerConfig - É undefined?', process.env.DB_DATABASE_EMP === undefined);
  console.log('🔍 sqlServerConfig - É vazio?', process.env.DB_DATABASE_EMP === '');
  
  const config = {
    server: process.env.DB_SERVER || '',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE_EMP || '',
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT || '30000', 10),
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  };
  
  console.log('🔍 sqlServerConfig - config.database final:', config.database);
  
  return config;
}

export function getSqlServerConfigMult(): DatabaseConfig {
  console.log('🔍 sqlServerConfig - DB_DATABASE_MULT:', process.env.DB_DATABASE_MULT);
  
  return {
    ...getSqlServerConfigEmp(),
    database: process.env.DB_DATABASE_MULT || '',
  };
}