// src/familiaComercial/dadosCadastrais/informacoesGerais/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { FamiliaComercialQueries } from '../../queries';
import type { FamiliaComercialMasterQueryResult } from './types';

export class FamiliaComercialInformacoesGeraisRepository {
  static async getFamiliaComercialMaster(
    familiaComercialCodigo: string
  ): Promise<FamiliaComercialMasterQueryResult | null> {
    // Carrega query do arquivo (cached automaticamente)
    const query = FamiliaComercialQueries.getByCodigo();

    const params: QueryParameter[] = [
      { name: 'paramFamiliaComercialCodigo', type: 'varchar', value: familiaComercialCodigo },
    ];

    const result = await QueryCacheService.withFamiliaComercialCache(query, params, async () =>
      DatabaseManager.datasul('emp').query<FamiliaComercialMasterQueryResult>(query, params)
    );

    return result && result.length > 0 ? result[0] || null : null;
  }

  static async invalidateCache(_familiaComercialCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['familiaComercial:*']);
  }
}
