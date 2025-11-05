// src/application/interfaces/repositories/IEstabelecimentoRepository.ts

import type { Estabelecimento } from '@domain/entities';

/**
 * Interface do Repositório de Estabelecimento (Port)
 *
 * @description
 * Define o contrato para operações de persistência de Estabelecimento.
 */
export interface IEstabelecimentoRepository {
  /**
   * Busca estabelecimento por código
   *
   * @param codigo - Código do estabelecimento
   * @returns Estabelecimento ou null
   */
  findByCodigo(codigo: string): Promise<Estabelecimento | null>;

  /**
   * Busca estabelecimento completo
   *
   * @param codigo - Código do estabelecimento
   * @returns Estabelecimento completo
   */
  findCompleto(codigo: string): Promise<EstabelecimentoCompleto | null>;

  /**
   * Lista todos os estabelecimentos
   *
   * @param options - Opções de paginação
   * @returns Estabelecimentos
   */
  findAll(
    options?: PaginationOptions
  ): Promise<PaginatedResult<Estabelecimento>>;

  /**
   * Busca estabelecimentos por item
   *
   * @param itemCodigo - Código do item
   * @returns Estabelecimentos que possuem o item
   */
  findByItem(itemCodigo: string): Promise<Estabelecimento[]>;

  /**
   * Verifica se estabelecimento existe
   *
   * @param codigo - Código
   * @returns true se existe
   */
  exists(codigo: string): Promise<boolean>;
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export interface EstabelecimentoCompleto {
  estabelecimento: Estabelecimento;
  items?: Array<{
    codigo: string;
    descricao: string;
  }>;
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
