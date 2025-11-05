// src/familia/dadosCadastrais/informacoesGerais/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { FamiliaQueries } from '../../queries';
import type { FamiliaMasterQueryResult } from './types';

export class FamiliaInformacoesGeraisRepository {
  static async getFamiliaMaster(familiaCodigo: string): Promise<FamiliaMasterQueryResult | null> {
    // Carrega query do arquivo (cached automaticamente em memória)
    const query = FamiliaQueries.getByCodigo();

    const params: QueryParameter[] = [
      { name: 'paramfamiliaCodigo', type: 'varchar', value: familiaCodigo },
    ];

    const result = await QueryCacheService.withFamiliaCache(query, params, async () =>
      DatabaseManager.datasul('emp').query<FamiliaMasterQueryResult>(query, params)
    );

    return result && result.length > 0 ? result[0] || null : null;
  }

  static async invalidateCache(_familiaCodigo: string): Promise<void> {
    await QueryCacheService.invalidateMultiple(['familia:*']);
  }
}
