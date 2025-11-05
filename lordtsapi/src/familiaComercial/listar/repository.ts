// src/familiaComercial/listar/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { FamiliaComercialQueries } from '../queries';
import type { FamiliaComercialListItem } from './type';

export class FamiliaComercialListarRepository {
  static async listarTodas(): Promise<FamiliaComercialListItem[]> {
    // Carrega query do arquivo (cached automaticamente)
    const query = FamiliaComercialQueries.listarTodas();

    const params: QueryParameter[] = [];

    const result = await QueryCacheService.withFamiliaComercialCache(query, params, async () =>
      DatabaseManager.datasul('emp').query<FamiliaComercialListItem>(query, params)
    );

    return result || [];
  }
}
