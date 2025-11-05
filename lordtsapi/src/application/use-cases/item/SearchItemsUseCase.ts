// src/application/use-cases/item/SearchItemsUseCase.ts

import type {
  IItemRepository,
  SearchOptions,
  PaginatedResult,
} from '@application/interfaces/repositories';
import type { ILogger, ICache } from '@application/interfaces/infrastructure';
import type { ItemDTO } from '../../dtos/ItemDTO';
import { ItemMapper } from '../../mappers/ItemMapper';

/**
 * Use Case - Pesquisar Items
 *
 * @description
 * Realiza busca de items com filtros e paginação.
 * Suporta busca por:
 * - Texto livre (código, descrição)
 * - Família
 * - Grupo de estoque
 * - Status (ativo/inativo)
 * - GTIN
 *
 * @example
 * ```typescript
 * const useCase = new SearchItemsUseCase(itemRepository, logger, cache);
 *
 * const result = await useCase.execute({
 *   search: 'torneira',
 *   ativo: true,
 *   page: 1,
 *   limit: 20
 * });
 * ```
 */
export class SearchItemsUseCase {
  constructor(
    private readonly itemRepository: IItemRepository,
    private readonly logger: ILogger,
    private readonly cache: ICache
  ) {}

  /**
   * Executa a pesquisa de items
   *
   * @param request - Parâmetros de busca
   * @returns Resultado paginado com items
   */
  async execute(request: SearchItemsRequest): Promise<PaginatedResult<ItemDTO>> {
    // 1. Validar entrada
    this.validateInput(request);

    // 2. Log de início
    this.logger.info('SearchItemsUseCase: Searching items', {
      search: request.search,
      page: request.page,
      limit: request.limit,
    });

    // 3. Construir cache key
    const cacheKey = this.buildCacheKey(request);

    // 4. Tentar buscar do cache
    const cached = await this.cache.get<PaginatedResult<ItemDTO>>(cacheKey);
    if (cached) {
      this.logger.debug('SearchItemsUseCase: Cache hit', { cacheKey });
      return cached;
    }

    // 5. Buscar do repositório
    const searchOptions: SearchOptions = {
      page: request.page ?? 1,
      limit: request.limit ?? 20,
      ativo: request.ativo,
      familiaCodigo: request.familia,
      grupoEstoqueCodigo: request.grupoEstoque,
      sortBy: request.sortBy,
      sortOrder: request.sortOrder,
    };

    let result: PaginatedResult<any>;

    // Se tem GTIN, busca por GTIN
    if (request.gtin) {
      const item = await this.itemRepository.findByGtin(request.gtin);
      result = {
        data: item ? [item] : [],
        pagination: {
          page: 1,
          limit: 1,
          total: item ? 1 : 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    // Se tem família, busca por família
    else if (request.familia) {
      result = await this.itemRepository.findByFamilia(
        request.familia,
        searchOptions
      );
    }
    // Se tem grupo de estoque, busca por grupo
    else if (request.grupoEstoque) {
      result = await this.itemRepository.findByGrupoEstoque(
        request.grupoEstoque,
        searchOptions
      );
    }
    // Caso contrário, busca geral
    else {
      result = await this.itemRepository.search(
        request.search || '',
        searchOptions
      );
    }

    // 6. Converter entidades → DTOs
    const dtos = result.data.map((item) => ItemMapper.toDTO(item));

    const response: PaginatedResult<ItemDTO> = {
      data: dtos,
      pagination: result.pagination,
    };

    // 7. Salvar no cache (2 minutos - busca muda frequentemente)
    await this.cache.set(cacheKey, response, 120);

    this.logger.info('SearchItemsUseCase: Search completed', {
      total: response.pagination.total,
      page: response.pagination.page,
    });

    return response;
  }

  /**
   * Valida entrada
   * @private
   */
  private validateInput(request: SearchItemsRequest): void {
    if (request.page && request.page < 1) {
      throw new Error('Página deve ser maior que zero');
    }

    if (request.limit && (request.limit < 1 || request.limit > 100)) {
      throw new Error('Limite deve estar entre 1 e 100');
    }

    if (request.gtin && !/^\d{13,14}$/.test(request.gtin)) {
      throw new Error('GTIN deve ter 13 ou 14 dígitos numéricos');
    }
  }

  /**
   * Constrói cache key baseado nos parâmetros de busca
   * @private
   */
  private buildCacheKey(request: SearchItemsRequest): string {
    const parts = ['items:search'];

    if (request.search) parts.push(`q:${request.search}`);
    if (request.gtin) parts.push(`gtin:${request.gtin}`);
    if (request.familia) parts.push(`fam:${request.familia}`);
    if (request.grupoEstoque) parts.push(`grp:${request.grupoEstoque}`);
    if (request.ativo !== undefined) parts.push(`ativo:${request.ativo}`);
    if (request.page) parts.push(`pg:${request.page}`);
    if (request.limit) parts.push(`lim:${request.limit}`);

    return parts.join(':');
  }
}

// ============================================================================
// REQUEST TYPE
// ============================================================================

export interface SearchItemsRequest {
  search?: string;
  gtin?: string;
  familia?: string;
  grupoEstoque?: string | number;
  ativo?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
