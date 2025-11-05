// src/grupoDeEstoque/queries/index.ts

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
 * import { GrupoDeEstoqueQueries } from './queries';
 *
 * const query = GrupoDeEstoqueQueries.listarTodos(); // Primeira vez: I/O
 * const query2 = GrupoDeEstoqueQueries.listarTodos(); // Subsequente: Cache
 * ```
 */

// Cache global de queries (permanente durante processo)
const queryCache = new Map<string, string>();

/**
 * Carrega uma query SQL do disco e cacheia em memória
 *
 * @param filename - Nome do arquivo .sql (ex: 'listar-todos.sql')
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
 * Queries disponíveis do módulo GrupoDeEstoque
 *
 * ARQUITETURA: Composição Modular em 2 Arquivos
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Cada query é composta por 2 arquivos .sql separados:
 *
 * 1. PROJEÇÃO (compartilhada):
 *    - Arquivo: projection.sql
 *    - Conteúdo: SELECT ... FROM pub."grup-estoque"
 *    - Reutilizado por todas as queries
 *
 * 2. PARTE ESPECÍFICA (isolada):
 *    - Arquivo: {nome}.sql
 *    - Conteúdo: WHERE, ORDER BY, etc.
 *    - Específico para cada query
 *
 * Benefícios:
 * ✓ Projeção única (zero duplicação)
 * ✓ Queries complexas isoladas em arquivos
 * ✓ Fácil testar cada parte separadamente
 * ✓ Documentação específica para cada filtro
 * ✓ Cache em memória de ambas as partes
 *
 * @example
 * ```typescript
 * // Query final = Projeção + WHERE
 * const query = GrupoDeEstoqueQueries.getByCodigo();
 * // Resultado:
 * // SELECT grupoDeEstoque."ge-codigo" as codigo, ...
 * // FROM pub."grup-estoque" grupoDeEstoque
 * // WHERE grupoDeEstoque."ge-codigo" = ?
 * ```
 */
export const GrupoDeEstoqueQueries = {
  /**
   * Retorna apenas a projeção SQL comum (SELECT ... FROM)
   *
   * Arquivo: projection.sql
   * Uso: Para compor queries customizadas
   *
   * @example
   * ```typescript
   * const projection = GrupoDeEstoqueQueries.getProjection();
   * const query = `${projection}
   * WHERE grupoDeEstoque."descricao" LIKE '%MATERIA%'
   * ORDER BY grupoDeEstoque."descricao"`;
   * ```
   */
  getProjection: () => loadQuery('projection.sql'),

  /**
   * Busca um grupo de estoque específico por código
   *
   * Composição: 2 arquivos
   * - projection.sql (SELECT ... FROM)
   * - get-by-codigo.sql (WHERE)
   *
   * Parâmetros:
   *  - ? (varchar) - Código do grupo de estoque (parâmetro ODBC)
   * Retorna: GrupoDeEstoqueMasterQueryResult | null
   *
   * Performance:
   * - WHERE executado no Progress (banco EMP)
   * - Retorna no máximo 1 registro
   * - Cache recomendado (TTL: 10min)
   */
  getByCodigo: () => {
    const projection = loadQuery('projection.sql');
    const where = loadQuery('get-by-codigo.sql');
    return `${projection}\n${where}`;
  },

  /**
   * Lista todos os grupos de estoque cadastrados
   *
   * Composição: 2 arquivos
   * - projection.sql (SELECT ... FROM)
   * - listar-todos.sql (ORDER BY)
   *
   * Parâmetros: Nenhum (lista todos)
   * Retorna: GrupoDeEstoqueListItem[]
   *
   * Performance:
   * - Lê toda a tabela grup-estoque (sem WHERE)
   * - Ordenação executada no Progress (banco EMP)
   * - Cache recomendado (TTL: 1h)
   */
  listarTodos: () => {
    const projection = loadQuery('projection.sql');
    const orderBy = loadQuery('listar-todos.sql');
    return `${projection}\n${orderBy}`;
  },
} as const;

// Type-safety: Export do tipo para uso em repositories
export type GrupoDeEstoqueQueriesType = typeof GrupoDeEstoqueQueries;
