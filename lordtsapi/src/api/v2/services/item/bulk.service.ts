/**
 * Bulk Item Service - API v2
 * Orquestra operações em lote com cache
 */

import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';
import { log } from '@shared/utils/logger';
import { BulkItemRepository } from '../../repositories/item/bulk.repository';

interface BulkResult {
  items: any[];
  notFound: string[];
  count: number;
}

export class BulkItemService {
  /**
   * Busca múltiplos itens de uma vez
   * Usa cache quando possível
   *
   * @param codigos - Array de códigos de itens
   * @param fields - Campos específicos a retornar (opcional)
   * @param correlationId - ID de correlação
   * @returns Resultado com itens encontrados e não encontrados
   */
  static async getBulk(
    codigos: string[],
    fields: string[] | undefined,
    correlationId: string
  ): Promise<BulkResult> {
    log.debug('BulkItemService.getBulk', {
      correlationId,
      codigosCount: codigos.length,
      fields: fields || 'all',
    });

    // Remove duplicatas
    const uniqueCodigos = [...new Set(codigos)];

    // Tenta buscar do cache primeiro
    const cacheKey = generateCacheKey(
      'bulk',
      'items',
      uniqueCodigos.sort().join(','),
      fields?.join(',') || 'all'
    );

    const cached = await CacheManager.get<BulkResult>(cacheKey);
    if (cached) {
      log.debug('Bulk items found in cache', {
        correlationId,
        cacheKey,
        count: cached.count,
      });
      return cached;
    }

    // Cache miss - busca do banco
    log.debug('Cache miss, fetching from database', { correlationId });

    const items = await BulkItemRepository.getBulk(uniqueCodigos, fields);

    // Identifica códigos não encontrados
    const foundCodigos = new Set(items.map((item: any) => item.codigo));
    const notFound = uniqueCodigos.filter((codigo) => !foundCodigos.has(codigo));

    const result: BulkResult = {
      items,
      notFound,
      count: items.length,
    };

    // Cacheia resultado (TTL: 5 minutos)
    await CacheManager.set(cacheKey, result, 300);

    log.info('Bulk items fetched successfully', {
      correlationId,
      requested: uniqueCodigos.length,
      found: items.length,
      notFound: notFound.length,
    });

    return result;
  }

  /**
   * Invalida cache de bulk para itens específicos
   */
  static async invalidateCache(codigos: string[]): Promise<void> {
    // Invalida padrão de cache que inclui esses códigos
    // Nota: Invalidação de bulk cache é complexa pois pode haver
    // múltiplas combinações. Para simplificar, invalidamos pattern geral.
    const pattern = 'bulk:items:*';
    await CacheManager.invalidate(pattern);

    log.debug('Bulk cache invalidated', { pattern });
  }
}
