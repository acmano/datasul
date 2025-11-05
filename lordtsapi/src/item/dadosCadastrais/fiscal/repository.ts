// src/item/dadosCadastrais/fiscal/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { ItemQueries } from '@/item/queries';
import { transformItemFiscal } from './helpers';
import type { RawItemFiscal, ItemFiscalRaw } from './types';

/**
 * Repository - Informações Fiscais do Item
 *
 * ✨ REFATORADO v2: ODBC direto + Transformações em TypeScript
 * @see ../../../queries/README.md para documentação completa
 * @see ./helpers.ts para transformações de dados
 *
 * Padrão:
 * 1. Query SQL retorna dados RAW do Progress (sem transformações)
 * 2. TypeScript aplica transformações (CHOOSE, FORMAT, etc.)
 * 3. Cache é aplicado após transformações
 */
export class ItemFiscalRepository {
  /**
   * Busca informações fiscais e tributárias do item
   *
   * Query: ../../../queries/get-item-fiscal.sql (RAW data)
   * Transformações: ./helpers.ts (TypeScript)
   * Cache: 10 minutos (configurado em QueryCacheService)
   *
   * @param itemCodigo - Código do item a buscar
   * @returns Informações fiscais transformadas ou null se não encontrado
   */
  static async getFiscal(itemCodigo: string): Promise<ItemFiscalRaw[] | null> {
    // Carrega query do arquivo (cached em memória após primeira leitura)
    const query = ItemQueries.getItemFiscal();

    // ODBC usa ? como placeholder, não precisa de nome
    const params: QueryParameter[] = [{ name: '', type: 'varchar', value: itemCodigo }];

    // Query retorna dados RAW, cache é aplicado após transformação
    const result = await QueryCacheService.withItemCache(query, params, async () => {
      // Busca dados RAW do Progress via ODBC (syntax sugar)
      const rawData = await DatabaseManager.datasul('emp').query<RawItemFiscal>(query, params);

      if (!rawData || rawData.length === 0) {
        return null;
      }

      // Aplica transformações TypeScript
      const transformed = rawData.map((raw: RawItemFiscal) => transformItemFiscal(raw));

      return transformed;
    });

    return result && result.length > 0 ? (result as ItemFiscalRaw[]) : null;
  }

  static async invalidateCache(_itemCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['item:*']);
  }
}
