// src/engenharia/queries/index.ts

import * as fs from 'fs';
import * as path from 'path';
import { log } from '@shared/utils/logger';

// Cache global de queries (permanente durante processo)
const queryCache = new Map<string, string>();

/**
 * Carrega uma query SQL do disco e cacheia em memória
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
 * Limpa o cache de queries
 */
export function clearQueryCache(): void {
  const cacheSize = queryCache.size;
  queryCache.clear();
  log.warn('Engenharia query cache limpo', { queriesRemovidas: cacheSize });
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
 * Queries disponíveis do módulo Engenharia
 */
export const EngenhariaQueries = {
  /**
   * Busca item raiz da estrutura (BOM)
   *
   * Arquivo: get-estrutura-root.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item
   * Retorna: Item raiz com código, estabelecimento, descrição e unidade
   */
  getEstruturaRoot: () => loadQuery('get-estrutura-root.sql'),

  /**
   * Busca componentes de um item (nível N -> nível N+1)
   *
   * Arquivo: get-estrutura-componentes.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item pai
   *  - @paramDataReferencia (varchar) - Data de referência (formato MM/DD/YYYY)
   *  - @paramDataReferencia (varchar) - Data de referência (formato MM/DD/YYYY) - repetido para AND
   * Retorna: Lista de componentes com quantidades e datas de validade
   */
  getEstruturaComponentes: () => loadQuery('get-estrutura-componentes.sql'),

  /**
   * Busca processos de fabricação de um item
   *
   * Arquivo: get-estrutura-processos.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item
   *  - @paramDataReferencia (varchar) - Data de referência (formato MM/DD/YYYY)
   *  - @paramDataReferencia (varchar) - Data de referência (formato MM/DD/YYYY) - repetido para AND
   * Retorna: Lista de operações/processos com tempos, centro de custo, grupo de máquinas
   */
  getEstruturaProcessos: () => loadQuery('get-estrutura-processos.sql'),
} as const;

export type EngenhariaQueriesType = typeof EngenhariaQueries;
