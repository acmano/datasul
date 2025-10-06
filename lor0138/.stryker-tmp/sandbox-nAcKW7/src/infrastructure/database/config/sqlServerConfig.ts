// @ts-nocheck
import { DatabaseConfig } from '../types';
import { config } from '@config/env.config';

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