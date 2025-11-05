/**
 * Advanced Search Service - API v2
 */

import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';
import { log } from '@shared/utils/logger';
import { AdvancedSearchRepository } from '../../repositories/item/advancedSearch.repository';

export interface SearchFilters {
  q?: string;
  familia?: string;
  grupoEstoque?: string;
  situacao?: 'A' | 'I';
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  items: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: SearchFilters;
}

export class AdvancedSearchService {
  static async search(filters: SearchFilters, correlationId: string): Promise<SearchResult> {
    log.info('Advanced search request', { correlationId, filters });

    // Normaliza filtros
    const normalizedFilters: SearchFilters = {
      q: filters.q?.trim(),
      familia: filters.familia?.trim(),
      grupoEstoque: filters.grupoEstoque?.trim(),
      situacao: filters.situacao,
      sort: filters.sort || 'codigo',
      order: filters.order || 'asc',
      page: Math.max(1, filters.page || 1),
      limit: Math.min(100, Math.max(1, filters.limit || 20)),
    };

    // Gera chave de cache
    const cacheKey = generateCacheKey(
      'advanced-search',
      JSON.stringify(normalizedFilters)
    );

    // Tenta cache
    const cached = await CacheManager.get<SearchResult>(cacheKey);
    if (cached) {
      log.debug('Search result from cache', { correlationId, cacheKey });
      return cached;
    }

    // Busca total de registros (para paginação)
    const total = await AdvancedSearchRepository.count(normalizedFilters);

    // Busca items paginados
    const items = await AdvancedSearchRepository.search(normalizedFilters);

    // Calcula paginação
    const totalPages = Math.ceil(total / normalizedFilters.limit!);
    const hasMore = normalizedFilters.page! < totalPages;

    const result: SearchResult = {
      items,
      pagination: {
        page: normalizedFilters.page!,
        limit: normalizedFilters.limit!,
        total,
        totalPages,
        hasMore,
      },
      filters: normalizedFilters,
    };

    // Cacheia (TTL: 2 minutos para buscas)
    await CacheManager.set(cacheKey, result, 120);

    log.info('Search completed', {
      correlationId,
      total,
      returned: items.length,
    });

    return result;
  }
}
