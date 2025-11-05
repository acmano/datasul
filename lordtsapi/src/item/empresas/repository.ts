// src/item/empresas/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { ItemQueries } from '@/item/queries';
import type { ItemEmpresasParams, ItemEmpresaQueryResult, EmpresaResult } from './types';

/**
 * Repository - Empresas (Estabelecimentos) do Item
 *
 * ✨ REFATORADO: Queries extraídas para arquivos .sql separados
 * @see ../../queries/README.md para documentação completa
 */
export class ItemEmpresasRepository {
  /**
   * Busca estabelecimentos onde o item está cadastrado
   *
   * Query: ../../queries/get-item-empresas.sql
   *
   * @param params - Parâmetros contendo código do item
   * @returns Array de estabelecimentos (código e nome)
   */
  static async getItemEmpresas(params: ItemEmpresasParams): Promise<EmpresaResult[]> {
    // Carrega query do arquivo (cached em memória após primeira leitura)
    const query = ItemQueries.getItemEmpresas();

    const queryParams: QueryParameter[] = [
      { name: 'paramItemCodigo', type: 'varchar', value: params.codigo },
    ];

    const results = await DatabaseManager.datasul('emp').query<ItemEmpresaQueryResult>(
      query,
      queryParams
    );

    // Mapeia resultados para formato de saída
    return results.map((row: ItemEmpresaQueryResult) => ({
      codigo: row.estabelecimentoCodigo?.trim() || '',
      nome: row.estabelecimentoNome?.trim() || '',
    }));
  }
}
