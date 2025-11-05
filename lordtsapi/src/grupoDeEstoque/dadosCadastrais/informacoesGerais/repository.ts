// src/grupoDeEstoque/dadosCadastrais/informacoesGerais/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { GrupoDeEstoqueQueries } from '../../queries';
import type { GrupoDeEstoqueMasterQueryResult } from './types';

/**
 * Repository para informações gerais de grupos de estoque
 *
 * Responsabilidades:
 * - Buscar dados cadastrais de um grupo de estoque específico
 * - Gerenciar cache de queries
 */
export class GrupoDeEstoqueInformacoesGeraisRepository {
  /**
   * Busca informações completas de um grupo de estoque pelo código
   *
   * @param grupoDeEstoqueCodigo - Código do grupo de estoque
   * @returns Objeto com informações do grupo ou null se não encontrado
   * @throws Error em caso de falha na consulta ao banco
   */
  static async getGrupoDeEstoqueMaster(
    grupoDeEstoqueCodigo: string
  ): Promise<GrupoDeEstoqueMasterQueryResult | null> {
    // Carrega query do arquivo (cached automaticamente)
    const query = GrupoDeEstoqueQueries.getByCodigo();

    const params: QueryParameter[] = [
      { name: 'paramGrupoDeEstoqueCodigo', type: 'varchar', value: grupoDeEstoqueCodigo },
    ];

    const result = await QueryCacheService.withGrupoDeEstoqueCache(query, params, async () =>
      DatabaseManager.datasul('emp').query<GrupoDeEstoqueMasterQueryResult>(query, params)
    );

    return result && result.length > 0 ? result[0] || null : null;
  }

  /**
   * Invalida o cache de um grupo de estoque específico
   *
   * @param grupoDeEstoqueCodigo - Código do grupo de estoque
   */
  static async invalidateCache(_grupoDeEstoqueCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['grupoDeEstoque:*']);
  }
}
