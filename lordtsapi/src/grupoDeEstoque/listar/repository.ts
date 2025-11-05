// src/grupoDeEstoque/listar/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { GrupoDeEstoqueQueries } from '../queries';
import type { GrupoDeEstoqueListItem } from './types';

/**
 * Repository para listar grupos de estoque
 *
 * Responsabilidades:
 * - Buscar todos os grupos de estoque cadastrados
 * - Aplicar cache via QueryCacheService
 */
export class GrupoDeEstoqueListarRepository {
  /**
   * Lista todos os grupos de estoque cadastrados
   *
   * @returns Array de grupos de estoque (código e descrição)
   * @throws Error em caso de falha na consulta ao banco
   */
  static async listarTodos(): Promise<GrupoDeEstoqueListItem[]> {
    // Carrega query do arquivo (cached automaticamente)
    const query = GrupoDeEstoqueQueries.listarTodos();

    const params: QueryParameter[] = [];

    const result = await QueryCacheService.withGrupoDeEstoqueCache(query, params, async () =>
      DatabaseManager.datasul('emp').query<GrupoDeEstoqueListItem>(query, params)
    );

    return result || [];
  }
}
