/**
 * Advanced Search Repository - API v2
 * Query builder dinâmico para busca avançada
 */

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { SearchFilters } from '../../services/item/advancedSearch.service';

export class AdvancedSearchRepository {
  /**
   * Busca itens com filtros dinâmicos e paginação
   */
  static async search(filters: SearchFilters): Promise<any[]> {
    const { query, params } = this.buildQuery(filters, true);
    const result = await DatabaseManager.datasul('emp').query(query, params);
    return result;
  }

  /**
   * Conta total de registros (para paginação)
   */
  static async count(filters: SearchFilters): Promise<number> {
    const { query, params } = this.buildQuery(filters, false);
    const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS subquery`;
    const result = await DatabaseManager.datasul('emp').query(countQuery, params);
    return (result[0] as { total: number } | undefined)?.total || 0;
  }

  /**
   * Constrói query dinâmica baseada nos filtros
   */
  private static buildQuery(
    filters: SearchFilters,
    withPagination: boolean
  ): { query: string; params: any[] } {
    let query = `
      SELECT
        "it-codigo" AS codigo,
        "desc-item" AS descricao,
        "un" AS unidade,
        "familia" AS familiaItem,
        "grupo-estoq" AS grupoEstoque,
        "situacao" AS situacao,
        "nome-abrev" AS nomeAbreviado
      FROM item
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 0;

    // Filtro de texto (busca em código OU descrição)
    if (filters.q) {
      query += ` AND ("it-codigo" LIKE @q OR "desc-item" LIKE @q)`;
      params.push({
        name: 'q',
        type: 'varchar',
        value: `%${filters.q}%`,
      });
    }

    // Filtro de família
    if (filters.familia) {
      query += ` AND "familia" = @familia`;
      params.push({
        name: 'familia',
        type: 'varchar',
        value: filters.familia,
      });
    }

    // Filtro de grupo de estoque
    if (filters.grupoEstoque) {
      query += ` AND "grupo-estoq" = @grupoEstoque`;
      params.push({
        name: 'grupoEstoque',
        type: 'varchar',
        value: filters.grupoEstoque,
      });
    }

    // Filtro de situação
    if (filters.situacao) {
      query += ` AND "situacao" = @situacao`;
      params.push({
        name: 'situacao',
        type: 'char',
        value: filters.situacao,
      });
    }

    // Ordenação
    const sortColumn = this.mapSortField(filters.sort || 'codigo');
    const sortOrder = filters.order === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortOrder}`;

    // Paginação (SQL Server syntax)
    if (withPagination) {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      query += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    }

    return { query, params };
  }

  /**
   * Mapeia campo de ordenação para coluna do banco
   */
  private static mapSortField(field: string): string {
    const mapping: Record<string, string> = {
      codigo: '"it-codigo"',
      descricao: '"desc-item"',
      familia: '"familia"',
      grupoEstoque: '"grupo-estoq"',
    };

    return mapping[field] || '"it-codigo"';
  }
}
