// src/deposito/dadosCadastrais/informacoesGerais/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { DepositoQueries } from '../../queries';
import type { DepositoMasterQueryResult } from './types';

/**
 * Repository - Informações Gerais do Depósito
 *
 * ✨ REFATORADO: Queries extraídas para arquivos .sql separados
 * @see ../../queries/README.md para documentação completa
 */
export class DepositoInformacoesGeraisRepository {
  /**
   * Busca informações completas de um depósito específico
   *
   * Query: ../../queries/get-by-codigo.sql
   * Cache: 10 minutos (configurado em QueryCacheService)
   *
   * @param depositoCodigo - Código do depósito a buscar
   * @returns Informações do depósito ou null se não encontrado
   */
  static async getDepositoMaster(
    depositoCodigo: string
  ): Promise<DepositoMasterQueryResult | null> {
    // Carrega query do arquivo (cached em memória após primeira leitura)
    const query = DepositoQueries.getByCodigo();

    const params: QueryParameter[] = [
      { name: 'paramdepositoCodigo', type: 'varchar', value: depositoCodigo },
    ];

    const result = await QueryCacheService.withDepositoCache(query, params, async () =>
      DatabaseManager.datasul('emp').query<DepositoMasterQueryResult>(query, params)
    );

    return result && result.length > 0 ? result[0] || null : null;
  }

  /**
   * Invalida cache de um depósito específico
   *
   * @param _depositoCodigo - Código do depósito (não usado atualmente - invalida todos)
   */
  static async invalidateCache(_depositoCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['deposito:*']);
  }
}
