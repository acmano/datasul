// src/shared/types/RepositoryTypes.ts

/**
 * Tipos compartilhados para Repositories
 *
 * Este arquivo contém interfaces para resultados de queries
 * que são usadas por múltiplos repositories.
 */

/**
 * Resultado genérico de query com paginação
 */
export interface PaginatedQueryResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Filtros genéricos de listagem
 */
export interface ListFilters {
  ativo?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Resultado de query de lista simples (familia, grupoEstoque, etc)
 */
export interface ListItemResult {
  codigo: string;
  descricao: string;
  ativo: number; // 0 ou 1 do banco
}

/**
 * Resultado de contagem
 */
export interface CountResult {
  total: number;
}

/**
 * Parâmetro de query genérico
 */
export interface QueryParam {
  name: string;
  type: 'varchar' | 'int' | 'decimal' | 'datetime' | 'bit';
  value: string | number | boolean | Date;
}
