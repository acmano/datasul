// src/deposito/listar/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { DepositoQueries } from '../queries';
import type { DepositoListItem } from './types';

/**
 * Repository - Listar Depósitos
 *
 * ✨ REFATORADO: Queries extraídas para arquivos .sql separados
 * @see ../queries/README.md para documentação completa
 */
export class DepositoListarRepository {
  /**
   * Busca todos os depósitos cadastrados
   *
   * Query: ../queries/listar-todos.sql
   * Cache: 5 minutos (configurado em QueryCacheService)
   *
   * @returns Lista de todos os depósitos
   */
  static async listarTodos(): Promise<DepositoListItem[]> {
    // Carrega query do arquivo (cached em memória após primeira leitura)
    const query = DepositoQueries.listarTodos();

    const params: QueryParameter[] = [];

    const result = await QueryCacheService.withDepositoCache(query, params, async () =>
      DatabaseManager.datasul('emp').query<DepositoListItem>(query, params)
    );

    return result || [];
  }
}
