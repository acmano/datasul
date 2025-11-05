// src/application/interfaces/repositories/IGrupoDeEstoqueRepository.ts

import type { GrupoEstoque } from '@domain/entities';

/**
 * Interface do Repositório de Grupo de Estoque (Port)
 */
export interface IGrupoDeEstoqueRepository {
  /**
   * Busca grupo por código
   *
   * @param codigo - Código do grupo (string ou number)
   * @returns GrupoEstoque ou null
   */
  findByCodigo(codigo: string | number): Promise<GrupoEstoque | null>;

  /**
   * Busca grupo completo com relacionamentos
   *
   * @param codigo - Código do grupo
   * @returns Grupo completo
   */
  findCompleto(codigo: string | number): Promise<GrupoEstoqueCompleto | null>;

  /**
   * Lista todos os grupos
   *
   * @param options - Opções de paginação
   * @returns Grupos encontrados
   */
  findAll(options?: PaginationOptions): Promise<PaginatedResult<GrupoEstoque>>;

  /**
   * Busca grupos por descrição
   *
   * @param descricao - Termo de busca
   * @param options - Opções
   * @returns Grupos encontrados
   */
  search(
    descricao: string,
    options?: SearchOptions
  ): Promise<PaginatedResult<GrupoEstoque>>;

  /**
   * Verifica se grupo existe
   *
   * @param codigo - Código
   * @returns true se existe
   */
  exists(codigo: string | number): Promise<boolean>;

  /**
   * Conta total de grupos
   *
   * @returns Quantidade
   */
  count(): Promise<number>;
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export interface GrupoEstoqueCompleto {
  grupo: GrupoEstoque;
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
