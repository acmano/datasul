/**
 * Barrel export for infrastructure/database/config module
 * Agrupa todas as configurações de banco de dados
 */

export * from './odbcConfig';
// Nota: serverConfig e sqlServerConfig exportam funções com mesmo nome
// Exportando apenas sqlServerConfig para evitar conflito TS2308
// export * from './serverConfig';
export * from './sqlServerConfig';
