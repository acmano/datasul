// src/engenharia/estrutura/ondeUsado/queries/index.ts

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
  log.warn('OndeUsado query cache limpo', { queriesRemovidas: cacheSize });
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
 * Queries disponíveis do módulo Onde Usado
 */
export const OndeUsadoQueries = {
  /**
   * Busca item raiz (componente inicial) para onde usado
   *
   * Arquivo: get-onde-usado-root.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do componente
   * Retorna: Item raiz com código, estabelecimento, descrição e unidade
   */
  getOndeUsadoRoot: () => loadQuery('get-onde-usado-root.sql'),

  /**
   * Busca itens PAI que usam o componente (nível N -> nível N-1, inverso!)
   *
   * Arquivo: get-onde-usado-pais.sql
   * Parâmetros:
   *  - @paramComponenteCodigo (varchar) - Código do componente
   * Retorna: Lista de itens PAI que usam este componente, com quantidades e datas
   */
  getOndeUsadoPais: () => loadQuery('get-onde-usado-pais.sql'),

  /**
   * Busca processos de fabricação de um item PAI
   *
   * Arquivo: get-onde-usado-processos.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item PAI
   * Retorna: Lista de operações/processos com tempos, centro de custo, grupo de máquinas
   */
  getOndeUsadoProcessos: () => loadQuery('get-onde-usado-processos.sql'),
} as const;

export type OndeUsadoQueriesType = typeof OndeUsadoQueries;
