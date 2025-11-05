// src/item/search/repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import type { ItemSearchParams, ItemSearchResult } from './types';
import { log } from '@shared/utils/logger';
import { ItemSearchQueries } from './queries';

// Tipos RAW retornados pelo Progress ODBC
// NOTE: Progress ODBC pode retornar em lowercase OU camelCase dependendo do método
interface ItemSearchRawEmp {
  codigo?: string;
  descricao?: string;
  // Pode ser lowercase ou camelCase
  itemUnidade?: string;
  itemunidade?: string;
  familiaCodigo?: string;
  familiacodigo?: string;
  familiaDescricao?: string;
  familiadescricao?: string;
  familiaComercialCodigo?: string;
  familiacomercialcodigo?: string;
  familiaComercialDescricao?: string;
  familiacomercialdescricao?: string;
  grupoDeEstoqueCodigo?: number | string;
  grupodeestoquecodigo?: number | string;
  grupoDeEstoqueDescricao?: string;
  grupodeestoquedescricao?: string;
  tipo?: string;
}

interface ItemSearchRawEsp {
  codigo?: string;
  gtin13?: string | number; // Progress ODBC pode retornar como número
  gtin14?: string | number; // Progress ODBC pode retornar como número
}

export class ItemSearchRepository {
  /**
   * Busca itens com suporte a múltiplos critérios (AND) e wildcards
   *
   * ✨ REFATORADO: Migrado de OPENQUERY para ODBC puro
   *
   * COMPORTAMENTO:
   * - Critérios são construídos dinamicamente: apenas campos informados são usados
   * - Múltiplos critérios são combinados com AND (todos devem ser satisfeitos)
   * - Filtros aplicados no Progress via WHERE dinâmico
   *
   * WILDCARDS:
   * - codigo e descricao: Suportam * ou % para busca parcial (ex: "%PARAFUSO%")
   * - codigo e descricao SEM wildcard: Busca exata (igualdade)
   * - GTIN: NÃO aceita wildcards, apenas números exatos
   *
   * GTIN (comportamento especial):
   * - Comparado com DOIS campos: gtin13 OR gtin14
   * - JOIN feito em TypeScript (após buscar EMP e ESP separadamente)
   * - Filtro GTIN aplicado em TypeScript
   *
   * EXECUÇÃO:
   * 1. Query EMP com filtros dinâmicos (codigo, descricao, familia, etc)
   * 2. Query ESP completa (todos os GTINs)
   * 3. JOIN em TypeScript (codigo)
   * 4. Filtro GTIN em TypeScript (se informado)
   * 5. Ordenação e LIMIT 100 em TypeScript
   *
   * @param params - Parâmetros de busca (todos opcionais)
   * @param params.codigo - Código do item (aceita wildcards * ou %)
   * @param params.descricao - Descrição do item (aceita wildcards * ou %)
   * @param params.familia - Código da família (busca exata)
   * @param params.familiaComercial - Código da família comercial (busca exata)
   * @param params.grupoEstoque - Código do grupo de estoque (busca exata)
   * @param params.gtin - GTIN do item - 13 ou 14 dígitos (busca exata, sem wildcards)
   * @returns Lista de itens encontrados (máximo 100 resultados)
   */
  static async searchItems(params: ItemSearchParams): Promise<ItemSearchResult[]> {
    try {
      // ========================================================================
      // PASSO 1: Construir WHERE clause dinâmica
      // ========================================================================
      const whereClauses: string[] = [];
      const queryParams: QueryParameter[] = [];

      // Código do item (com wildcard)
      if (params.codigo) {
        if (params.codigo.includes('*') || params.codigo.includes('%')) {
          const likeValue = params.codigo.replace(/\*/g, '%');
          whereClauses.push(`item."it-codigo" LIKE ?`);
          queryParams.push({ name: '', type: 'varchar', value: likeValue });
        } else {
          whereClauses.push(`item."it-codigo" = ?`);
          queryParams.push({ name: '', type: 'varchar', value: params.codigo });
        }
      }

      // Descrição do item (com wildcard)
      if (params.descricao) {
        if (params.descricao.includes('*') || params.descricao.includes('%')) {
          const likeValue = params.descricao.replace(/\*/g, '%');
          whereClauses.push(`item."desc-item" LIKE ?`);
          queryParams.push({ name: '', type: 'varchar', value: likeValue });
        } else {
          whereClauses.push(`item."desc-item" = ?`);
          queryParams.push({ name: '', type: 'varchar', value: params.descricao });
        }
      }

      // Família (exata)
      if (params.familia) {
        whereClauses.push(`item."fm-codigo" = ?`);
        queryParams.push({ name: '', type: 'varchar', value: params.familia });
      }

      // Família comercial (exata)
      if (params.familiaComercial) {
        whereClauses.push(`item."fm-cod-com" = ?`);
        queryParams.push({ name: '', type: 'varchar', value: params.familiaComercial });
      }

      // Grupo de estoque (exato)
      if (params.grupoEstoque) {
        whereClauses.push(`item."ge-codigo" = ?`);
        queryParams.push({ name: '', type: 'varchar', value: params.grupoEstoque });
      }

      // Tipo do item (array - IN clause)
      if (params.tipoItem && params.tipoItem.length > 0) {
        const placeholders = params.tipoItem.map(() => '?').join(', ');
        whereClauses.push(`SUBSTRING(iue."char-1", 133, 2) IN (${placeholders})`);
        params.tipoItem.forEach((tipo) => {
          queryParams.push({ name: '', type: 'varchar', value: tipo });
        });
      }

      // Montar WHERE final
      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // ========================================================================
      // PASSO 2: Montar query final = Projection + WHERE dinâmico + ORDER BY
      // ========================================================================
      const projectionEmp = ItemSearchQueries.getProjectionEmp();
      const projectionEsp = ItemSearchQueries.getProjectionEsp();

      // Query EMP: Projection + WHERE dinâmico + ORDER BY
      const fullQueryEmp = whereClause
        ? `${projectionEmp}\n${whereClause}\nORDER BY item."it-codigo"`
        : `${projectionEmp}\nORDER BY item."it-codigo"`;

      // ========================================================================
      // PASSO 3: Executar queries EMP e ESP em paralelo (ODBC puro)
      // ========================================================================
      const [empResults, espResults] = await Promise.all([
        // Query EMP: Projection + WHERE dinâmico
        DatabaseManager.queryWithConnection<ItemSearchRawEmp>(
          'DtsPrdEmp',
          fullQueryEmp,
          queryParams
        ),

        // Query ESP: Projection simples (todos os GTINs)
        DatabaseManager.queryWithConnection<ItemSearchRawEsp>('DtsPrdEsp', projectionEsp, []),
      ]);

      log.debug('Queries executadas', {
        empCount: empResults.length,
        espCount: espResults.length,
        filters: Object.keys(params).filter((k) => params[k as keyof ItemSearchParams]),
      });

      // ========================================================================
      // PASSO 4: Criar mapa de GTINs para JOIN rápido
      // ========================================================================
      const gtinMap = new Map<string, ItemSearchRawEsp>();
      espResults.forEach((esp) => {
        if (esp.codigo) {
          gtinMap.set(esp.codigo.trim(), esp);
        }
      });

      // ========================================================================
      // PASSO 5: JOIN entre EMP e ESP em TypeScript
      // ========================================================================
      let joinedResults = empResults.map((emp) => {
        const codigo = emp.codigo?.trim() || '';
        const espData = gtinMap.get(codigo);

        return {
          codigo,
          descricao: emp.descricao?.trim() || '',
          // Tentar camelCase primeiro, fallback para lowercase
          itemUnidade: (emp.itemUnidade || emp.itemunidade)?.trim() || '',
          familiaCodigo: (emp.familiaCodigo || emp.familiacodigo)?.trim() || '',
          familiaDescricao: (emp.familiaDescricao || emp.familiadescricao)?.trim() || '',
          familiaComercialCodigo:
            (emp.familiaComercialCodigo || emp.familiacomercialcodigo)?.trim() || '',
          familiaComercialDescricao:
            (emp.familiaComercialDescricao || emp.familiacomercialdescricao)?.trim() || '',
          grupoDeEstoqueCodigo:
            (emp.grupoDeEstoqueCodigo ?? emp.grupodeestoquecodigo) != null
              ? String(emp.grupoDeEstoqueCodigo ?? emp.grupodeestoquecodigo)
              : '',
          grupoDeEstoqueDescricao:
            (emp.grupoDeEstoqueDescricao || emp.grupodeestoquedescricao)?.trim() || '',
          tipo: emp.tipo?.trim() || '',
          // Progress ODBC retorna GTINs como números - converter para string
          gtin13: espData?.gtin13 != null ? String(espData.gtin13).trim() : undefined,
          gtin14: espData?.gtin14 != null ? String(espData.gtin14).trim() : undefined,
        };
      });

      // ========================================================================
      // PASSO 6: Filtro GTIN em TypeScript (se informado)
      // ========================================================================
      if (params.gtin) {
        const gtinValue = params.gtin.trim();
        joinedResults = joinedResults.filter(
          (item) =>
            (item.gtin13 && item.gtin13 === gtinValue) || (item.gtin14 && item.gtin14 === gtinValue)
        );

        log.debug('Filtro GTIN aplicado', {
          gtin: gtinValue,
          resultCount: joinedResults.length,
        });
      }

      // ========================================================================
      // PASSO 7: Retornar todos os resultados (sem limite)
      // ========================================================================
      log.info('Busca de itens executada', {
        resultCount: joinedResults.length,
        filters: Object.keys(params).filter((k) => params[k as keyof ItemSearchParams]),
        hasGtinFilter: !!params.gtin,
      });

      // ========================================================================
      // PASSO 8: Transformar para formato de saída
      // ========================================================================
      return joinedResults.map((row) => ({
        item: {
          codigo: row.codigo,
          descricao: row.descricao,
          unidade: row.itemUnidade,
          gtin13: row.gtin13,
          gtin14: row.gtin14,
          tipo: row.tipo,
          familia: {
            codigo: row.familiaCodigo,
            descricao: row.familiaDescricao,
          },
          familiaComercial: {
            codigo: row.familiaComercialCodigo,
            descricao: row.familiaComercialDescricao,
          },
          grupoDeEstoque: {
            codigo: row.grupoDeEstoqueCodigo,
            descricao: row.grupoDeEstoqueDescricao,
          },
        },
      }));
    } catch (error) {
      log.error('Erro ao buscar itens', {
        params,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
