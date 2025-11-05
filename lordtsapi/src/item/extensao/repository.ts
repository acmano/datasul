// src/item/extensao/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { ItemExtensaoQueries } from './queries';
import type { ItemExtensao } from './types';

/**
 * Repository - Item Extensão
 *
 * ✨ REFATORADO: Queries extraídas para arquivos .sql separados
 * @see ./queries/README.md para documentação completa
 */
export class ItemExtensaoRepository {
  /**
   * Busca dados de extensão de um item específico por código
   *
   * Query: ./queries/get-by-codigo.sql
   * Database: ESP (pub."ext-item")
   * Cache: 10 minutos (configurado em QueryCacheService)
   *
   * @param itemCodigo - Código do item
   * @returns Dados de extensão do item ou null se não encontrado
   */
  static async getByCodigo(itemCodigo: string): Promise<ItemExtensao | null> {
    // Carrega query do arquivo (cached em memória após primeira leitura)
    const query = ItemExtensaoQueries.getByCodigo();

    const params: QueryParameter[] = [{ name: 'itemCodigo', type: 'varchar', value: itemCodigo }];

    const result = await QueryCacheService.withItemCache(query, params, async () =>
      DatabaseManager.datasul('esp').query<ItemExtensao>(query, params)
    );

    return result && result.length > 0 ? result[0] : null;
  }

  /**
   * Busca todos os itens com extensão cadastrados
   *
   * Query: ./queries/listar-todos.sql
   * Database: ESP (pub."ext-item")
   * Cache: 1 hora (configurado em QueryCacheService)
   *
   * @returns Lista de todas as extensões de itens
   */
  static async listarTodos(): Promise<ItemExtensao[]> {
    // Carrega query do arquivo (cached em memória após primeira leitura)
    const query = ItemExtensaoQueries.listarTodos();

    const params: QueryParameter[] = [];

    const result = await QueryCacheService.withItemCache(query, params, async () =>
      DatabaseManager.datasul('esp').query<ItemExtensao>(query, params)
    );

    return result || [];
  }
}
