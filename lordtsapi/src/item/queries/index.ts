// src/item/queries/index.ts

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
 * import { ItemQueries } from './queries';
 *
 * const query = ItemQueries.getItemMaster(); // Primeira vez: I/O
 * const query2 = ItemQueries.getItemMaster(); // Subsequente: Cache
 * ```
 */

// Cache global de queries (permanente durante processo)
const queryCache = new Map<string, string>();

/**
 * Carrega uma query SQL do disco e cacheia em memória
 *
 * @param filename - Nome do arquivo .sql (ex: 'get-item-master.sql')
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
 * Queries disponíveis do módulo Item
 *
 * Todas as queries são lazy-loaded e cacheadas automaticamente.
 * O cache persiste durante toda a execução do processo Node.js.
 */
export const ItemQueries = {
  /**
   * Busca dados mestres completos do item
   *
   * Arquivo: get-item-master.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item
   * Retorna: ItemMasterQueryResult | null
   *
   * Performance:
   * - WHERE executado no Progress (3 bancos: EMP, ESP, MULT)
   * - Retorna no máximo 1 registro
   * - Cache recomendado (TTL: 10min)
   */
  getItemMaster: () => loadQuery('get-item-master.sql'),

  /**
   * Busca dados principais do item (Banco EMP)
   * Parte 1/3 da migração de get-item-master.sql
   *
   * Arquivo: get-item-emp-main.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item
   * Retorna: Dados do item + unidade + embalagem
   */
  getItemEmpMain: () => loadQuery('get-item-emp-main.sql'),

  /**
   * Busca dados estendidos do item (Banco ESP)
   * Parte 2/3 da migração de get-item-master.sql
   *
   * Arquivo: get-item-esp-extended.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item
   * Retorna: Dados estendidos + contenedor
   */
  getItemEspExtended: () => loadQuery('get-item-esp-extended.sql'),

  /**
   * Busca descrição de embalagem (Banco EMP)
   * Parte 3/3 da migração de get-item-master.sql
   *
   * Arquivo: get-item-emp-embalagem.sql
   * Parâmetros:
   *  - @paramEmbalagemCodigo (varchar) - Código da embalagem
   * Retorna: Descrição da embalagem TE
   */
  getItemEmpEmbalagem: () => loadQuery('get-item-emp-embalagem.sql'),

  /**
   * Busca estabelecimentos onde o item está cadastrado
   *
   * Arquivo: get-item-estabelecimentos.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item
   * Retorna: ItemEstabelecimentoQueryResult[]
   *
   * Performance:
   * - WHERE executado no Progress (2 bancos: EMP, MULT)
   * - Retorna N registros (um por estabelecimento)
   * - Ordenado por código do estabelecimento
   * - Cache recomendado (TTL: 10min)
   */
  getItemEstabelecimentos: () => loadQuery('get-item-estabelecimentos.sql'),

  /**
   * Busca dimensões completas do item
   *
   * Arquivo: get-item-dimensoes.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item
   * Retorna: ItemDimensoesRaw | null
   *
   * Performance:
   * - WHERE executado no Progress (2 bancos: EMP, ESP)
   * - Retorna no máximo 1 registro
   * - Inclui dimensões de peça, embalagem, produto e paletização
   * - Cache recomendado (TTL: 10min)
   */
  getItemDimensoes: () => loadQuery('get-item-dimensoes.sql'),

  /**
   * Busca dimensões da embalagem (complemento de get-item-dimensoes)
   *
   * Arquivo: get-embalagem-dimensoes.sql
   * Parâmetros:
   *  - @paramEmbalagemCodigo (varchar) - Sigla da embalagem
   * Retorna: RawEmbalagemDB | null
   *
   * Performance:
   * - WHERE executado no Progress (banco EMP)
   * - Retorna no máximo 1 registro
   * - Query auxiliar para dados de embalagem
   * - Cache recomendado (TTL: 10min)
   */
  getEmbalagemDimensoes: () => loadQuery('get-embalagem-dimensoes.sql'),

  /**
   * Busca informações de planejamento MRP do item
   *
   * Arquivo: get-item-planejamento.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item
   * Retorna: ItemPlanejamentoRaw[]
   *
   * Performance:
   * - WHERE executado no Progress (2 bancos: EMP, MULT)
   * - Retorna N registros (um por estabelecimento)
   * - Inclui política, lotes, estoque segurança, refugo, etc
   * - Cache recomendado (TTL: 10min)
   */
  getItemPlanejamento: () => loadQuery('get-item-planejamento.sql'),

  /**
   * Busca informações fiscais e tributárias do item
   *
   * Arquivo: get-item-fiscal.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item
   * Retorna: ItemFiscalRaw[]
   *
   * Performance:
   * - WHERE executado no Progress (banco EMP)
   * - Retorna no máximo 1 registro
   * - Inclui NCM, IPI, ICMS, ISS, PIS/COFINS
   * - Cache recomendado (TTL: 10min)
   */
  getItemFiscal: () => loadQuery('get-item-fiscal.sql'),

  /**
   * Busca informações de manufatura e produção do item
   *
   * Arquivo: get-item-manufatura.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item
   * Retorna: ItemManufaturaRaw[]
   *
   * Performance:
   * - WHERE executado no Progress (banco EMP)
   * - Retorna no máximo 1 registro
   * - LEFT JOIN com item-man para dados de manufatura
   * - Inclui MRP, lotes, alocação, ressuprimento, PV/MPS/CRP
   * - Cache recomendado (TTL: 10min)
   */
  getItemManufatura: () => loadQuery('get-item-manufatura.sql'),

  /**
   * Busca empresas (estabelecimentos) onde o item está cadastrado
   *
   * Arquivo: get-item-empresas.sql
   * Parâmetros:
   *  - @paramItemCodigo (varchar) - Código do item
   * Retorna: ItemEmpresaQueryResult[]
   *
   * Performance:
   * - WHERE executado no Progress (2 bancos: EMP, MULT)
   * - Retorna N registros (um por estabelecimento)
   * - JOIN entre item-uni-estab e estabelec
   * - Ordenado por código do estabelecimento
   * - Cache recomendado (TTL: 10min)
   */
  getItemEmpresas: () => loadQuery('get-item-empresas.sql'),
} as const;

// Type-safety: Export do tipo para uso em repositories
export type ItemQueriesType = typeof ItemQueries;
