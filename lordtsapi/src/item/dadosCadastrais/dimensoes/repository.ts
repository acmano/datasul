// src/item/dadosCadastrais/dimensoes/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { ItemQueries } from '@/item/queries';
import type { ItemDimensoesRaw, RawItemDimensoesDB, RawEmbalagemDB } from './types';
import { transformItemDimensoes } from './helpers';

/**
 * Repository - Dimensões do Item
 *
 * ✨ MIGRADO PARA ODBC:
 * - Query get-item-dimensoes.sql (ESP database - ext-item)
 * - Query get-embalagem-dimensoes.sql (EMP database - embalag)
 * - Transformações de dados movidas para helpers.ts
 * - Divisões por 100 (cm → m) feitas em TypeScript
 *
 * @see ../../../queries/README.md para documentação completa
 */
export class ItemDimensoesRepository {
  /**
   * Busca dimensões completas do item
   *
   * Executa 3 queries:
   * 1. Descrição do item (EMP - pub.item)
   * 2. Dimensões do item (ESP - ext-item)
   * 3. Dimensões da embalagem (EMP - embalag) - se aplicável
   *
   * Cache: 10 minutos (configurado em QueryCacheService)
   *
   * @param itemCodigo - Código do item a buscar
   * @returns Dimensões do item ou null se não encontrado
   */
  static async getDimensoes(itemCodigo: string): Promise<ItemDimensoesRaw | null> {
    const params: QueryParameter[] = [{ name: 'codigo', type: 'varchar', value: itemCodigo }];

    // 1. Buscar descrição do item (EMP database)
    const descQuery = 'SELECT "desc-item" as descricao FROM pub.item WHERE "it-codigo" = ?';
    const descResult = await DatabaseManager.datasul('emp').query<{ descricao: string }>(
      descQuery,
      params
    );

    if (!descResult || descResult.length === 0) {
      return null; // Item não encontrado
    }

    const itemDescricao = descResult[0].descricao;

    // 2. Buscar dimensões do item (ESP database via ODBC separado)
    const dimensoesQuery = ItemQueries.getItemDimensoes();
    const dimensoesResult = await DatabaseManager.datasul('esp').query<RawItemDimensoesDB>(
      dimensoesQuery,
      params
    );

    if (!dimensoesResult || dimensoesResult.length === 0) {
      return null; // Dimensões não encontradas
    }

    const rawDimensoes = dimensoesResult[0];

    // 3. Buscar dados da embalagem (EMP database) - se o item tem embalagem
    let embalagem: RawEmbalagemDB | null = null;
    if (rawDimensoes.embcod) {
      const embalagemQuery = ItemQueries.getEmbalagemDimensoes();
      const embalagemParams: QueryParameter[] = [
        { name: 'sigla', type: 'varchar', value: rawDimensoes.embcod },
      ];

      const embalagemResult = await DatabaseManager.datasul('emp').query<RawEmbalagemDB>(
        embalagemQuery,
        embalagemParams
      );

      if (embalagemResult && embalagemResult.length > 0) {
        embalagem = embalagemResult[0];
      }
    }

    // 4. Transformar dados brutos para formato do repository
    return transformItemDimensoes(rawDimensoes, embalagem, itemDescricao);
  }

  /**
   * Invalida cache das dimensões do item
   */
  static async invalidateCache(_itemCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['item:*']);
  }
}
