// src/application/interfaces/repositories/IFamiliaRepository.ts

import type { Familia } from '@domain/entities';

/**
 * Interface do Repositório de Família (Port)
 *
 * @description
 * Define o contrato para operações de persistência de Família.
 * Segue o princípio da Inversão de Dependência (SOLID).
 */
export interface IFamiliaRepository {
  /**
   * Busca família por código
   *
   * @param codigo - Código da família
   * @returns Familia ou null
   */
  findByCodigo(codigo: string): Promise<Familia | null>;

  /**
   * Busca família completa com relacionamentos
   *
   * @param codigo - Código da família
   * @returns Familia completa
   */
  findCompleto(codigo: string): Promise<FamiliaCompleto | null>;

  /**
   * Lista todas as famílias
   *
   * @param options - Opções de paginação
   * @returns Famílias encontradas
   */
  findAll(options?: PaginationOptions): Promise<PaginatedResult<Familia>>;

  /**
   * Busca famílias por descrição
   *
   * @param descricao - Termo de busca
   * @param options - Opções de busca
   * @returns Famílias encontradas
   */
  search(
    descricao: string,
    options?: SearchOptions
  ): Promise<PaginatedResult<Familia>>;

  /**
   * Verifica se família existe
   *
   * @param codigo - Código da família
   * @returns true se existe
   */
  exists(codigo: string): Promise<boolean>;

  /**
   * Conta total de famílias
   *
   * @param filter - Filtros opcionais
   * @returns Quantidade
   */
  count(filter?: FamiliaFilter): Promise<number>;
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

/**
 * Família completa com relacionamentos
 */
export interface FamiliaCompleto {
  familia: Familia;
  items?: Array<{
    codigo: string;
    descricao: string;
  }>;
  totalItems?: number;
}

/**
 * Opções de paginação
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Opções de busca
 */
export interface SearchOptions extends PaginationOptions {
  fields?: ('codigo' | 'descricao')[];
}

/**
 * Filtro de famílias
 */
export interface FamiliaFilter {
  descricao?: string;
}
