// src/estabelecimento/listar/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import { EstabelecimentoQueries } from '../queries';
import type { EstabelecimentoListItem } from './types';

/**
 * Repository - Listar Estabelecimentos
 *
 * ✨ REFATORADO: Queries extraídas para arquivos .sql separados
 * @see ../queries/README.md para documentação completa
 */
export class EstabelecimentoListarRepository {
  /**
   * Busca todos os estabelecimentos cadastrados
   *
   * Query: ../queries/listar-todos.sql
   * Database: MULT (pub.estabelec)
   * Cache: 1 hora (configurado em QueryCacheService)
   *
   * @returns Lista de todos os estabelecimentos
   */
  static async listarTodos(): Promise<EstabelecimentoListItem[]> {
    // Carrega query do arquivo (cached em memória após primeira leitura)
    const query = EstabelecimentoQueries.listarTodos();

    const params: QueryParameter[] = [];

    const result = await QueryCacheService.withEstabelecimentoCache(query, params, async () =>
      DatabaseManager.datasul('mult').query<EstabelecimentoListItem>(query, params)
    );

    return result || [];
  }
}
