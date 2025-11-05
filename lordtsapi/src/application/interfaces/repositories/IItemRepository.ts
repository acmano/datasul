// src/application/interfaces/repositories/IItemRepository.ts

import type { Item } from '@domain/entities';
import type { ItemCodigo } from '@domain/value-objects';

/**
 * Interface do Repositório de Item (Port)
 *
 * @description
 * Define o contrato que implementações de repositório devem seguir.
 * Segue o princípio da Inversão de Dependência (SOLID).
 *
 * A camada de Application depende APENAS desta interface,
 * não da implementação concreta em Infrastructure.
 *
 * @example
 * ```typescript
 * class GetItemUseCase {
 *   constructor(private itemRepository: IItemRepository) {}
 *
 *   async execute(codigo: string): Promise<ItemDetailDTO> {
 *     const item = await this.itemRepository.findByCodigo(codigo);
 *     // ...
 *   }
 * }
 * ```
 */
export interface IItemRepository {
  /**
   * Busca item por código
   *
   * @param codigo - Código do item
   * @returns Item ou null se não encontrado
   */
  findByCodigo(codigo: ItemCodigo | string): Promise<Item | null>;

  /**
   * Busca item completo com relacionamentos
   *
   * @param codigo - Código do item
   * @returns Item com família, grupo, estabelecimentos
   */
  findCompleto(codigo: ItemCodigo | string): Promise<ItemCompleto | null>;

  /**
   * Busca múltiplos items por códigos
   *
   * @param codigos - Array de códigos
   * @returns Array de items encontrados
   */
  findManyCodigos(codigos: (ItemCodigo | string)[]): Promise<Item[]>;

  /**
   * Busca items por família
   *
   * @param familiaCodigo - Código da família
   * @param options - Opções de paginação
   * @returns Items da família
   */
  findByFamilia(
    familiaCodigo: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Item>>;

  /**
   * Busca items por grupo de estoque
   *
   * @param grupoEstoqueCodigo - Código do grupo
   * @param options - Opções de paginação
   * @returns Items do grupo
   */
  findByGrupoEstoque(
    grupoEstoqueCodigo: string | number,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Item>>;

  /**
   * Busca item por GTIN (código de barras)
   *
   * @param gtin - GTIN do item
   * @returns Item ou null
   */
  findByGtin(gtin: string): Promise<Item | null>;

  /**
   * Pesquisa items por texto livre
   *
   * @param searchTerm - Termo de busca
   * @param options - Opções de busca e paginação
   * @returns Items encontrados
   */
  search(
    searchTerm: string,
    options?: SearchOptions
  ): Promise<PaginatedResult<Item>>;

  /**
   * Verifica se item existe
   *
   * @param codigo - Código do item
   * @returns true se existe
   */
  exists(codigo: ItemCodigo | string): Promise<boolean>;

  /**
   * Conta total de items
   *
   * @param filter - Filtros opcionais
   * @returns Quantidade de items
   */
  count(filter?: ItemFilter): Promise<number>;
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

/**
 * Item completo com relacionamentos
 */
export interface ItemCompleto {
  item: Item;
  familia?: {
    codigo: string;
    descricao: string;
  };
  familiaComercial?: {
    codigo: string;
    descricao: string;
  };
  grupoEstoque?: {
    codigo: string | number;
    descricao: string;
  };
  estabelecimentos?: Array<{
    codigo: string;
    nome: string;
  }>;
  dimensoes?: {
    altura?: number;
    largura?: number;
    profundidade?: number;
    peso?: number;
  };
  fiscal?: {
    ncm?: string;
    origem?: number;
  };
  manufatura?: {
    tempoProducao?: number;
    loteMinimo?: number;
  };
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
  fields?: ('codigo' | 'descricao' | 'gtin')[];
  ativo?: boolean;
  familiaCodigo?: string;
  grupoEstoqueCodigo?: string | number;
}

/**
 * Filtro de items
 */
export interface ItemFilter {
  ativo?: boolean;
  familiaCodigo?: string;
  familiaComercialCodigo?: string;
  grupoEstoqueCodigo?: string | number;
}
