// src/item/search/queries/index.ts

import * as fs from 'fs';
import * as path from 'path';
import { log } from '@shared/utils/logger';

/**
 * QueryLoader - Carrega e cacheia queries SQL em memória
 *
 * Este serviço:
 * 1. Lê arquivos .sql do disco na primeira chamada
 * 2. Armazena em cache em memória para chamadas subsequentes
 * 3. Evita I/O repetido melhorando performance
 *
 * Cache:
 * - Permanente durante execução do processo
 * - Reinicia quando servidor reinicia
 * - Thread-safe (Map é thread-safe para leitura)
 *
 * @example
 * ```typescript
 * import { ItemSearchQueries } from './queries';
 *
 * const projection = ItemSearchQueries.getProjectionEmp();
 * const query = `${projection}\nWHERE item."it-codigo" = ?`;
 * ```
 */

// Cache global de queries (permanente durante processo)
const queryCache = new Map<string, string>();

/**
 * Carrega uma query SQL do disco e cacheia em memória
 *
 * @param filename - Nome do arquivo .sql (ex: 'projection-emp.sql')
 * @returns Conteúdo da query como string
 * @throws Error se arquivo não existir ou não puder ser lido
 */
function loadQuery(filename: string): string {
  // Verifica se já está em cache
  if (queryCache.has(filename)) {
    log.debug(`Query cache hit: ${filename}`);
    return queryCache.get(filename)!;
  }

  // Carrega do disco
  try {
    const queryPath = path.join(__dirname, filename);

    log.debug(`Carregando query do disco: ${queryPath}`);

    const query = fs.readFileSync(queryPath, 'utf-8');

    // Valida que não está vazia
    if (!query || query.trim().length === 0) {
      throw new Error(`Query vazia: ${filename}`);
    }

    // Armazena em cache
    queryCache.set(filename, query);

    log.info(`Query carregada e cacheada: ${filename}`, {
      size: query.length,
      path: queryPath,
    });

    return query;
  } catch (error) {
    log.error(`Erro ao carregar query: ${filename}`, {
      error: error instanceof Error ? error.message : String(error),
    });

    throw new Error(
      `Falha ao carregar query '${filename}': ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Limpa o cache de queries (útil para testes ou reload)
 * ⚠️ Use com cautela em produção
 */
export function clearQueryCache(): void {
  const cacheSize = queryCache.size;
  queryCache.clear();

  log.warn('Query cache limpo', { queriesRemovidas: cacheSize });
}

/**
 * Retorna estatísticas do cache de queries
 */
export function getQueryCacheStats() {
  return {
    totalQueries: queryCache.size,
    queries: Array.from(queryCache.keys()),
  };
}

/**
 * Queries disponíveis do módulo Item Search
 *
 * ARQUITETURA: Projection + WHERE Dinâmico
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Cada query é composta por:
 *
 * 1. PROJEÇÃO (fixa):
 *    - Arquivo: projection-emp.sql ou projection-esp.sql
 *    - Conteúdo: SELECT ... FROM ... JOIN ...
 *    - Carregada do arquivo e cacheada
 *
 * 2. WHERE CLAUSE (dinâmica):
 *    - Construída em runtime no repository
 *    - Depende dos parâmetros de busca (codigo, descricao, familia, etc)
 *    - Concatenada com a projeção: `${projection}\n${whereClause}`
 *
 * Benefícios:
 * ✓ Projeção isolada em arquivo .sql
 * ✓ WHERE dinâmico e flexível (runtime)
 * ✓ Cache em memória da projeção
 * ✓ Documentação específica
 * ✓ Fácil testar e manter
 *
 * @example
 * ```typescript
 * // Query final = Projection + WHERE dinâmico
 * const projection = ItemSearchQueries.getProjectionEmp();
 * const where = `WHERE item."it-codigo" LIKE ?`;
 * const fullQuery = `${projection}\n${where}\nORDER BY item."it-codigo"`;
 * ```
 */
export const ItemSearchQueries = {
  /**
   * Retorna a projeção SQL do banco EMP (SELECT ... FROM ... JOIN)
   *
   * Arquivo: projection-emp.sql
   * Uso: Base para busca de itens com filtros dinâmicos
   *
   * Inclui JOINs:
   * - pub.familia (fm-codigo)
   * - pub."fam-comerc" (fm-cod-com)
   * - pub."grup-estoque" (ge-codigo)
   *
   * WHERE clause:
   * - NÃO incluída (construída dinamicamente)
   *
   * @example
   * ```typescript
   * const projection = ItemSearchQueries.getProjectionEmp();
   * const where = 'WHERE item."it-codigo" = ?';
   * const query = `${projection}\n${where}`;
   * ```
   */
  getProjectionEmp: () => loadQuery('projection-emp.sql'),

  /**
   * Retorna a projeção SQL do banco ESP (SELECT ... FROM)
   *
   * Arquivo: projection-esp.sql
   * Uso: Busca de GTINs (EAN-13 e DUN-14)
   *
   * Campos:
   * - codigo: it-codigo (para JOIN com EMP)
   * - gtin13: cod-ean
   * - gtin14: cod-dun
   *
   * WHERE clause:
   * - NÃO incluída (retorna todos os GTINs)
   * - Filtro aplicado em TypeScript após JOIN
   *
   * @example
   * ```typescript
   * const projection = ItemSearchQueries.getProjectionEsp();
   * // Retorna todos os GTINs sem filtro
   * ```
   */
  getProjectionEsp: () => loadQuery('projection-esp.sql'),
} as const;

// Type-safety: Export do tipo para uso em repositories
export type ItemSearchQueriesType = typeof ItemSearchQueries;
