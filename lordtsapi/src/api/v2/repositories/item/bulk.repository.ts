/**
 * Bulk Item Repository - API v2
 * Acesso a dados otimizado para operações em lote
 */

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

export class BulkItemRepository {
  /**
   * Busca múltiplos itens de uma vez usando IN clause
   * Muito mais eficiente que N queries individuais
   *
   * @param codigos - Array de códigos
   * @param fields - Campos específicos (opcional)
   * @returns Array de itens encontrados
   */
  static async getBulk(codigos: string[], fields?: string[]): Promise<any[]> {
    if (codigos.length === 0) {
      return [];
    }

    // Seleciona campos
    const selectFields =
      fields && fields.length > 0
        ? fields.map((f) => this.mapFieldToColumn(f)).join(', ')
        : `
        "it-codigo" AS codigo,
        "desc-item" AS descricao,
        "un" AS unidade,
        "familia" AS familiaItem,
        "grupo-estoq" AS grupoEstoque,
        "situacao" AS situacao,
        "nome-abrev" AS nomeAbreviado
      `;

    // Query com IN clause (parametrizada)
    let query = `
      SELECT ${selectFields}
      FROM item
      WHERE "it-codigo" IN (
    `;

    // Adiciona placeholders para cada código
    const params: any[] = [];
    const placeholders: string[] = [];

    codigos.forEach((codigo, index) => {
      const paramName = `codigo${index}`;
      placeholders.push(`@${paramName}`);
      params.push({
        name: paramName,
        type: 'varchar',
        value: codigo,
      });
    });

    query += placeholders.join(', ') + ')';

    // Ordena por código para consistência
    query += ' ORDER BY "it-codigo"';

    // Executa query
    const result = await DatabaseManager.datasul('emp').query(query, params);

    return result;
  }

  /**
   * Mapeia nomes de campos da API para colunas do banco
   */
  private static mapFieldToColumn(field: string): string {
    const mapping: Record<string, string> = {
      codigo: '"it-codigo" AS codigo',
      descricao: '"desc-item" AS descricao',
      unidade: '"un" AS unidade',
      familiaItem: '"familia" AS familiaItem',
      grupoEstoque: '"grupo-estoq" AS grupoEstoque',
      situacao: '"situacao" AS situacao',
      nomeAbreviado: '"nome-abrev" AS nomeAbreviado',
    };

    return mapping[field] || `"${field}"`;
  }

  /**
   * Busca itens com seus preços em uma única query (JOIN otimizado)
   * Para casos onde precisa de dados relacionados
   */
  static async getBulkWithPrecos(codigos: string[]): Promise<any[]> {
    if (codigos.length === 0) {
      return [];
    }

    let query = `
      SELECT
        i."it-codigo" AS codigo,
        i."desc-item" AS descricao,
        i."un" AS unidade,
        p."nr-tabela" AS tabelaPreco,
        p."preco-venda" AS preco,
        p."moeda" AS moeda
      FROM item i
      LEFT JOIN "preco-item" p ON p."it-codigo" = i."it-codigo"
        AND p."dt-validade-ini" <= GETDATE()
        AND (p."dt-validade-fim" IS NULL OR p."dt-validade-fim" >= GETDATE())
      WHERE i."it-codigo" IN (
    `;

    const params: any[] = [];
    const placeholders: string[] = [];

    codigos.forEach((codigo, index) => {
      const paramName = `codigo${index}`;
      placeholders.push(`@${paramName}`);
      params.push({
        name: paramName,
        type: 'varchar',
        value: codigo,
      });
    });

    query += placeholders.join(', ') + ')';
    query += ' ORDER BY i."it-codigo", p."nr-tabela"';

    const result = await DatabaseManager.datasul('emp').query(query, params);

    // Agrupa por item
    const itemsMap = new Map<string, any>();

    result.forEach((row: any) => {
      if (!itemsMap.has(row.codigo)) {
        itemsMap.set(row.codigo, {
          codigo: row.codigo,
          descricao: row.descricao,
          unidade: row.unidade,
          precos: [],
        });
      }

      if (row.tabelaPreco !== null) {
        itemsMap.get(row.codigo).precos.push({
          tabelaPreco: row.tabelaPreco,
          preco: row.preco,
          moeda: row.moeda,
        });
      }
    });

    return Array.from(itemsMap.values());
  }
}
