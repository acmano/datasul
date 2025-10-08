/**
 * Constantes de banco de dados compartilhadas
 */

/**
 * Linked Servers SQL Server
 */
export const LINKED_SERVERS = {
  /** Linked server para ambiente de produção EMS2 - Empresa */
  PRD_EMS2EMP: 'PRD_EMS2EMP',
  
  /** Linked server para ambiente de produção EMS2 - Multi-empresa */
  PRD_EMS2MULT: 'PRD_EMS2MULT',
} as const;

/**
 * Schemas do banco Progress
 */
export const PROGRESS_SCHEMAS = {
  /** Schema público do Progress */
  PUB: 'pub',
} as const;

/**
 * Tabelas do Progress (pub.*)
 */
export const PROGRESS_TABLES = {
  /** Tabela de itens */
  ITEM: 'pub.item',
  
  /** Tabela de itens por estabelecimento */
  ITEM_UNI_ESTAB: 'pub."item-uni-estab"',
  
  /** Tabela de famílias */
  FAMILIA: 'pub.familia',
  
  /** Tabela de famílias comerciais */
  FAMILIA_COMERCIAL: 'pub."fam-comerc"',
  
  /** Tabela de grupos de estoque */
  GRUPO_ESTOQUE: 'pub."grupo-estoq"',
  
  /** Tabela de estabelecimentos */
  ESTABELECIMENTO: 'pub.estabelec',
} as const;

/**
 * Configurações de query
 */
export const QUERY_CONFIG = {
  /** Timeout padrão para queries (ms) */
  DEFAULT_TIMEOUT: 30000,
  
  /** Limite máximo de registros por query */
  MAX_RECORDS: 1000,
  
  /** Limite de estabelecimentos carregados em paralelo */
  MAX_ESTABELECIMENTOS_PARALELO: 50,
} as const;

/**
 * Tipos SQL Server
 */
export const SQL_TYPES = {
  VARCHAR: 'varchar',
  NVARCHAR: 'nvarchar',
  INT: 'int',
  BIGINT: 'bigint',
  DECIMAL: 'decimal',
  DATE: 'date',
  DATETIME: 'datetime',
} as const;

/**
 * Helper para construir nome de tabela com schema
 */
export function getProgressTable(table: string): string {
  return `${PROGRESS_SCHEMAS.PUB}.${table}`;
}

/**
 * Helper para construir referência de coluna Progress
 */
export function getProgressColumn(column: string): string {
  return `"${column}"`;
}
