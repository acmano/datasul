// src/infrastructure/database/config/sqlServerConfig.ts

import { DatabaseConfig } from '../types';
import { config } from '@config/env.config';

/**
 * ✅ CORRIGIDO: Agora usa env.config.ts centralizado
 * 
 * IMPORTANTE: Este arquivo é apenas um WRAPPER.
 * Todas as configurações vêm de env.config.ts que usa parseTimeout()
 * corretamente para TODOS os timeouts.
 * 
 * Antes: parseInt('30s') = 30 (30ms - impossível!)
 * Agora: parseTimeout('30s') = 30000 (30s - correto!)
 */

export function getSqlServerConfigEmp(): DatabaseConfig {
  const dbConfig = config.database.sqlServer;

  return {
    server: dbConfig.server,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.databaseEmp,
    connectionTimeout: dbConfig.connectionTimeout,
    requestTimeout: dbConfig.requestTimeout,
    encrypt: dbConfig.encrypt,
    trustServerCertificate: dbConfig.trustServerCertificate,
  };
}

export function getSqlServerConfigMult(): DatabaseConfig {
  const dbConfig = config.database.sqlServer;

  return {
    server: dbConfig.server,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.databaseMult,
    connectionTimeout: dbConfig.connectionTimeout,
    requestTimeout: dbConfig.requestTimeout,
    encrypt: dbConfig.encrypt,
    trustServerCertificate: dbConfig.trustServerCertificate,
  };
}