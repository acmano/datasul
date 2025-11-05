// src/application/interfaces/repositories/IFamiliaComercialRepository.ts

import type { FamiliaComercial } from '@domain/entities';

/**
 * Interface do Repositório de Família Comercial (Port)
 */
export interface IFamiliaComercialRepository {
  /**
   * Busca família comercial por código
   *
   * @param codigo - Código da família comercial
   * @returns FamiliaComercial ou null
   */
  findByCodigo(codigo: string): Promise<FamiliaComercial | null>;

  /**
   * Busca família comercial completa
   *
   * @param codigo - Código
   * @returns Família comercial completa
   */
  findCompleto(codigo: string): Promise<FamiliaComercialCompleto | null>;

  /**
   * Lista todas as famílias comerciais
   *
   * @param options - Opções de paginação
   * @returns Famílias comerciais
   */
  findAll(
    options?: PaginationOptions
  ): Promise<PaginatedResult<FamiliaComercial>>;

  /**
   * Busca famílias comerciais por descrição
   *
   * @param descricao - Termo de busca
   * @param options - Opções
   * @returns Famílias encontradas
   */
  search(
    descricao: string,
    options?: SearchOptions
  ): Promise<PaginatedResult<FamiliaComercial>>;

  /**
   * Verifica se família comercial existe
   *
   * @param codigo - Código
   * @returns true se existe
   */
  exists(codigo: string): Promise<boolean>;

  /**
   * Conta total de famílias comerciais
   *
   * @returns Quantidade
   */
  count(): Promise<number>;
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export interface FamiliaComercialCompleto {
  familiaComercial: FamiliaComercial;
  items?: Array<{
    codigo: string;
    descricao: string;
  }>;
  totalItems?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

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

export interface SearchOptions extends PaginationOptions {
  fields?: ('codigo' | 'descricao')[];
}
