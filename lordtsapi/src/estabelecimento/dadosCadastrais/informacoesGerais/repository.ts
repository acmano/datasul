// src/estabelecimento/dadosCadastrais/informacoesGerais/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { EstabelecimentoQueries } from '../../queries';
import type { EstabelecimentoMasterQueryResult } from './types';

/**
 * Repository - Informações Gerais do Estabelecimento
 *
 * ✨ REFATORADO: Queries extraídas para arquivos .sql separados
 * @see ../../queries/README.md para documentação completa
 */
export class EstabelecimentoInformacoesGeraisRepository {
  /**
   * Busca informações completas de um estabelecimento específico
   *
   * Query: ../../queries/get-by-codigo.sql
   * Cache: 10 minutos (configurado em QueryCacheService)
   *
   * @param estabelecimentoCodigo - Código do estabelecimento a buscar
   * @returns Informações do estabelecimento ou null se não encontrado
   */
  static async getEstabelecimentoMaster(
    estabelecimentoCodigo: string
  ): Promise<EstabelecimentoMasterQueryResult | null> {
    // Carrega query do arquivo (cached em memória após primeira leitura)
    const query = EstabelecimentoQueries.getByCodigo();

    const params: QueryParameter[] = [
      { name: 'paramEstabelecimentoCodigo', type: 'varchar', value: estabelecimentoCodigo },
    ];

    const result = await QueryCacheService.withEstabelecimentoCache(query, params, async () =>
      DatabaseManager.datasul('mult').query<EstabelecimentoMasterQueryResult>(query, params)
    );

    return result && result.length > 0 ? result[0] || null : null;
  }

  /**
   * Invalida cache de um estabelecimento específico
   *
   * @param _estabelecimentoCodigo - Código do estabelecimento (não usado atualmente - invalida todos)
   */
  static async invalidateCache(_estabelecimentoCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['estabelecimento:*']);
  }
}
