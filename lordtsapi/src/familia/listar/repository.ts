// src/familia/listar/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { FamiliaQueries } from '../queries';
import type { FamiliaListItem } from './types';

export class FamiliaListarRepository {
  static async listarTodas(): Promise<FamiliaListItem[]> {
    // Carrega query do arquivo (cached automaticamente em memória)
    const query = FamiliaQueries.listarTodas();

    const params: QueryParameter[] = [];

    const result = await QueryCacheService.withFamiliaCache(query, params, async () =>
      DatabaseManager.datasul('emp').query<FamiliaListItem>(query, params)
    );

    return result || [];
  }
}
