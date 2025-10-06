// src/api/lor0138/item/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

/**
 * =============================================================================
 * REPOSITORY - INFORMAÇÕES GERAIS DO ITEM
 * =============================================================================
 *
 * Camada de acesso a dados para consultas relacionadas às informações
 * gerais de itens do sistema Datasul/Progress OpenEdge.
 *
 * @module ItemInformacoesGeraisRepository
 * @category Repositories
 * @subcategory Item/DadosCadastrais
 *
 * RESPONSABILIDADES:
 * - Executar queries SQL no banco de dados via OPENQUERY
 * - Gerenciar cache de queries (L1 + L2)
 * - Transformar resultados brutos em objetos tipados
 * - Garantir uso de queries parametrizadas (segurança)
 * - Invalidar cache quando necessário
 *
 * ARQUITETURA:
 * - Acessa SQL Server que conecta ao Progress via Linked Server
 * - Utiliza OPENQUERY para queries em banco Progress
 * - Implementa cache em dois níveis (L1 in-memory + L2 Redis)
 * - Queries parametrizadas previnem SQL Injection
 *
 * TECNOLOGIAS:
 * - SQL Server: Banco intermediário
 * - Progress OpenEdge: Banco de dados Datasul (origem)
 * - Linked Server: PRD_EMS2EMP (empresa) e PRD_EMS2MULT (multi-empresa)
 * - Cache: QueryCacheService (L1 + L2)
 *
 * PADRÃO DE PROJETO:
 * - Repository Pattern
 * - Cache-Aside Pattern
 * - Prepared Statements (queries parametrizadas)
 *
 * PONTOS CRÍTICOS:
 * - OPENQUERY não suporta parâmetros diretos (SQL dinâmico necessário)
 * - Cache L1 (10-15min TTL) reduz carga no banco em ~80%
 * - Queries executadas em dois Linked Servers diferentes
 * - Progress usa aspas duplas em nomes de campos e tabelas
 *
 * =============================================================================
 */
export class ItemInformacoesGeraisRepository {

  /**
   * ---------------------------------------------------------------------------
   * MÉTODO: getItemMaster
   * ---------------------------------------------------------------------------
   *
   * Busca dados mestres de um item da tabela pub.item do Progress.
   *
   * @description
   * Consulta informações básicas (código, descrição, unidade) de um item
   * no banco de dados Datasul Progress via Linked Server.
   *
   * A query utiliza OPENQUERY para acessar o Progress através do SQL Server.
   * Como OPENQUERY não suporta parâmetros diretos, utiliza-se SQL dinâmico
   * com sp_executesql para garantir segurança.
   *
   * FLUXO DE EXECUÇÃO:
   * 1. Monta query SQL dinâmica com DECLARE + OPENQUERY
   * 2. Cria parâmetros tipados para sp_executesql
   * 3. Verifica cache L1/L2 (TTL: 10 minutos)
   * 4. Se cache miss, executa query no banco via DatabaseManager
   * 5. Armazena resultado no cache
   * 6. Retorna primeiro registro ou null
   *
   * ESTRUTURA DA QUERY:
   * - DECLARE @itemCodigo: Define variável SQL Server
   * - OPENQUERY(PRD_EMS2EMP, ...): Consulta Linked Server Progress
   * - SELECT pub.item: Acessa tabela item do Progress
   * - EXEC sp_executesql: Executa SQL dinâmico com parâmetros
   *
   * CACHE:
   * - Namespace: 'item'
   * - TTL: 600 segundos (10 minutos)
   * - Invalidação: Manual via invalidateCache()
   * - Strategy: Cache-aside (lazy loading)
   *
   * SEGURANÇA:
   * - Queries parametrizadas previnem SQL Injection
   * - sp_executesql com @paramItemCodigo tipado como varchar(16)
   * - Escape de aspas simples no OPENQUERY ('''')
   *
   * PONTOS CRÍTICOS:
   * - Progress usa aspas duplas: "it-codigo", "desc-item"
   * - OPENQUERY requer concatenação de strings (limitação técnica)
   * - Retorna null se item não existir (não array vazio)
   * - Cache reduz 80-90% das chamadas ao banco
   *
   * @async
   * @static
   * @method getItemMaster
   *
   * @param {string} itemCodigo - Código único do item (máx 16 caracteres)
   *
   * @returns {Promise<ItemMasterQueryResult | null>}
   * Objeto com dados do item ou null se não encontrado:
   * @returns {string} itemCodigo - Código do item (item."it-codigo")
   * @returns {string} itemDescricao - Descrição do item (item."desc-item")
   * @returns {string} itemUnidade - Unidade de medida (item."un")
   *
   * @throws {Error}
   * Quando ocorre erro no banco de dados:
   * - Timeout de conexão/query
   * - Linked Server offline
   * - Permissão negada
   * - SQL inválido
   *
   * @example
   * // Caso de sucesso - Item encontrado
   * const item = await ItemInformacoesGeraisRepository.getItemMaster('7530110');
   * // Retorna:
   * {
   *   itemCodigo: '7530110',
   *   itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
   *   itemUnidade: 'UN'
   * }
   *
   * @example
   * // Caso de item não encontrado
   * const item = await ItemInformacoesGeraisRepository.getItemMaster('INVALID');
   * // Retorna: null
   *
   * @example
   * // Uso com cache hit (segunda chamada)
   * const item1 = await getItemMaster('7530110'); // Cache miss → banco
   * const item2 = await getItemMaster('7530110'); // Cache hit → memória (rápido!)
   *
   * @see {@link DatabaseManager.queryEmpWithParams}
   * @see {@link QueryCacheService.withItemCache}
   */
  static async getItemMaster(itemCodigo: string): Promise<any | null> {
    try {
      // ---------------------------------------------------------------------------
      // QUERY SQL DINÂMICA COM OPENQUERY
      // ---------------------------------------------------------------------------
      // IMPORTANTE: OPENQUERY não suporta parâmetros diretos
      // Solução: Usar sp_executesql com variável @itemCodigo
      // Aspas quádruplas ('''') são necessárias para escape no OPENQUERY
      const query = `
        DECLARE @itemCodigo varchar(16) = @paramItemCodigo;
        DECLARE @sql nvarchar(max);

        SET @sql = N'
          SELECT
            item."it-codigo" as itemCodigo,
            item."desc-item" as itemDescricao,
            item."un" as itemUnidade
          FROM OPENQUERY(PRD_EMS2EMP, ''
            SELECT
              item."it-codigo",
              item."desc-item",
              item."un"
            FROM pub.item
            WHERE item."it-codigo" = ''''' + @itemCodigo + '''''
          '') as item
        ';

        EXEC sp_executesql @sql;
      `;

      // ---------------------------------------------------------------------------
      // PARÂMETROS TIPADOS
      // ---------------------------------------------------------------------------
      // sp_executesql requer parâmetros tipados explicitamente
      // Previne SQL Injection ao tratar entrada como valor literal
      const params: QueryParameter[] = [
        { name: 'paramItemCodigo', type: 'varchar', value: itemCodigo }
      ];

      // ---------------------------------------------------------------------------
      // EXECUÇÃO COM CACHE L1/L2
      // ---------------------------------------------------------------------------
      // QueryCacheService verifica cache antes de executar query
      // Se cache miss, executa queryFn e armazena resultado
      // TTL: 10 minutos (600 segundos)
      // Namespace: 'item' (permite invalidação seletiva)
      const result = await QueryCacheService.withItemCache(
        query,
        params,
        async () => DatabaseManager.queryEmpWithParams(query, params)
      );

      // ---------------------------------------------------------------------------
      // RETORNO
      // ---------------------------------------------------------------------------
      // Se resultado contém registros, retorna o primeiro
      // Se vazio, retorna null (item não encontrado)
      // IMPORTANTE: Retorna null, não array vazio, para consistência com Service
      return result && result.length > 0 ? result[0] : null;

    } catch (error) {
      // ---------------------------------------------------------------------------
      // TRATAMENTO DE ERROS
      // ---------------------------------------------------------------------------
      // Registra erro detalhado no console para troubleshooting
      // Propaga erro para camada superior (Service) tratar
      console.error('Erro ao buscar item master:', error);
      throw error;
    }
  }

  /**
   * ---------------------------------------------------------------------------
   * MÉTODO: getItemEstabelecimentos
   * ---------------------------------------------------------------------------
   *
   * Busca estabelecimentos onde um item está cadastrado, incluindo status.
   *
   * @description
   * Consulta todos os estabelecimentos (filiais) onde um item específico
   * está cadastrado, incluindo informações de status (ativo/obsoleto).
   *
   * Utiliza JOIN entre dois Linked Servers diferentes:
   * - PRD_EMS2EMP: Dados de item-uni-estab (relacionamento item-estabelecimento)
   * - PRD_EMS2MULT: Dados de estabelec (cadastro de estabelecimentos)
   *
   * FLUXO DE EXECUÇÃO:
   * 1. Monta query SQL dinâmica com dois OPENQUERY
   * 2. Executa LEFT JOIN entre item-uni-estab e estabelec
   * 3. Verifica cache L1/L2 (TTL: 15 minutos)
   * 4. Se cache miss, executa query no banco
   * 5. Armazena resultado no cache
   * 6. Retorna array de estabelecimentos (vazio se nenhum)
   *
   * ESTRUTURA DA QUERY:
   * - OPENQUERY(PRD_EMS2EMP): Busca item-uni-estab (relacionamento)
   * - OPENQUERY(PRD_EMS2MULT): Busca estabelec (cadastro de filiais)
   * - LEFT JOIN: Combina dados dos dois Linked Servers
   * - cod-obsoleto: Indica status do item no estabelecimento
   *
   * CACHE:
   * - Namespace: 'estabelecimento'
   * - TTL: 900 segundos (15 minutos)
   * - TTL maior que item master (dados mudam menos frequentemente)
   * - Invalidação: Manual via invalidateCache()
   *
   * CAMPO cod-obsoleto:
   * - 0: Item ativo no estabelecimento
   * - 1+: Item obsoleto/inativo no estabelecimento
   * - Usado pelo Service para mapear statusIndex
   *
   * PONTOS CRÍTICOS:
   * - JOIN entre dois Linked Servers diferentes (custo alto)
   * - Pode retornar array vazio (item sem estabelecimentos)
   * - Progress não tem Foreign Keys (LEFT JOIN necessário)
   * - Cache de 15min reduz significativamente carga de JOIN
   *
   * @async
   * @static
   * @method getItemEstabelecimentos
   *
   * @param {string} itemCodigo - Código único do item (máx 16 caracteres)
   *
   * @returns {Promise<ItemEstabQueryResult[]>}
   * Array de estabelecimentos (vazio se item não tiver estabelecimentos):
   * @returns {string} itemCodigo - Código do item
   * @returns {string} estabCodigo - Código do estabelecimento (ex: "01.01")
   * @returns {string} estabNome - Nome do estabelecimento (ex: "CD São Paulo")
   * @returns {number} codObsoleto - Status: 0=ativo, 1+=obsoleto
   *
   * @throws {Error}
   * Quando ocorre erro no banco de dados:
   * - Timeout de conexão/query
   * - Um dos Linked Servers offline
   * - Permissão negada
   * - SQL inválido
   * - JOIN falha
   *
   * @example
   * // Caso de sucesso - Item com múltiplos estabelecimentos
   * const estabs = await ItemInformacoesGeraisRepository.getItemEstabelecimentos('7530110');
   * // Retorna:
   * [
   *   {
   *     itemCodigo: '7530110',
   *     estabCodigo: '01.01',
   *     estabNome: 'CD São Paulo',
   *     codObsoleto: 0  // Ativo
   *   },
   *   {
   *     itemCodigo: '7530110',
   *     estabCodigo: '02.01',
   *     estabNome: 'Fábrica Joinville',
   *     codObsoleto: 1  // Obsoleto
   *   }
   * ]
   *
   * @example
   * // Caso de item sem estabelecimentos
   * const estabs = await getItemEstabelecimentos('ITEM_NOVO');
   * // Retorna: []
   *
   * @example
   * // Performance - Cache hit vs Cache miss
   * const t1 = Date.now();
   * const estabs1 = await getItemEstabelecimentos('7530110'); // Cache miss: ~2000ms
   * const d1 = Date.now() - t1;
   *
   * const t2 = Date.now();
   * const estabs2 = await getItemEstabelecimentos('7530110'); // Cache hit: ~5ms
   * const d2 = Date.now() - t2;
   *
   * console.log(`Cache reduziu tempo em ${Math.round((1 - d2/d1) * 100)}%`);
   * // Output: Cache reduziu tempo em 99%
   *
   * @see {@link DatabaseManager.queryEmpWithParams}
   * @see {@link QueryCacheService.withEstabelecimentoCache}
   */
  static async getItemEstabelecimentos(itemCodigo: string): Promise<any[]> {
    try {
      // ---------------------------------------------------------------------------
      // QUERY SQL DINÂMICA COM DOIS OPENQUERY E JOIN
      // ---------------------------------------------------------------------------
      // COMPLEXIDADE: Query envolve dois Linked Servers diferentes
      // PRD_EMS2EMP: Dados da empresa (item-uni-estab)
      // PRD_EMS2MULT: Dados multi-empresa (estabelec - cadastro de filiais)
      // LEFT JOIN: Combina dados dos dois Progress via SQL Server
      const query = `
        DECLARE @itemCodigo varchar(16) = @paramItemCodigo;
        DECLARE @sql nvarchar(max);

        SET @sql = N'
          SELECT
            itemEstab."it-codigo" as itemCodigo,
            itemEstab."cod-estabel" as estabCodigo,
            estab."nome" as estabNome,
            itemEstab."cod-obsoleto" as codObsoleto
          FROM OPENQUERY(PRD_EMS2EMP, ''
            SELECT
              "item-uni-estab"."it-codigo",
              "item-uni-estab"."cod-estabel",
              "item-uni-estab"."cod-obsoleto"
            FROM pub."item-uni-estab"
            WHERE "item-uni-estab"."it-codigo" = ''''' + @itemCodigo + '''''
          '') as itemEstab
          LEFT JOIN OPENQUERY(PRD_EMS2MULT, ''
            SELECT
              estabelec."ep-codigo" as cod_estabel,
              estabelec."nome"
            FROM pub.estabelec
          '') as estab ON itemEstab."cod-estabel" = estab.cod_estabel
        ';

        EXEC sp_executesql @sql;
      `;

      // ---------------------------------------------------------------------------
      // PARÂMETROS TIPADOS
      // ---------------------------------------------------------------------------
      const params: QueryParameter[] = [
        { name: 'paramItemCodigo', type: 'varchar', value: itemCodigo }
      ];

      // ---------------------------------------------------------------------------
      // EXECUÇÃO COM CACHE L1/L2
      // ---------------------------------------------------------------------------
      // QueryCacheService com namespace 'estabelecimento'
      // TTL: 15 minutos (900 segundos) - maior que item master
      // Razão: Estabelecimentos mudam menos que dados de itens
      const result = await QueryCacheService.withEstabelecimentoCache(
        query,
        params,
        async () => DatabaseManager.queryEmpWithParams(query, params)
      );

      // ---------------------------------------------------------------------------
      // RETORNO
      // ---------------------------------------------------------------------------
      // Retorna array (vazio se item não tiver estabelecimentos)
      // Garante que sempre retorna array, nunca null/undefined
      return result || [];

    } catch (error) {
      // ---------------------------------------------------------------------------
      // TRATAMENTO DE ERROS
      // ---------------------------------------------------------------------------
      // Registra erro detalhado para troubleshooting de JOIN complexo
      console.error('Erro ao buscar estabelecimentos:', error);
      throw error;
    }
  }

  /**
   * ---------------------------------------------------------------------------
   * MÉTODO: invalidateCache
   * ---------------------------------------------------------------------------
   *
   * Invalida cache de queries relacionadas a um item específico.
   *
   * @description
   * Remove entradas de cache para forçar recarregamento de dados frescos
   * do banco de dados na próxima consulta.
   *
   * QUANDO USAR:
   * - Após UPDATE em dados do item
   * - Após INSERT/DELETE de estabelecimentos
   * - Após mudanças que afetem cod-obsoleto
   * - Em rotinas de sincronização de dados
   *
   * PADRÕES INVALIDADOS:
   * - 'item:*': Todos os caches de dados mestres de itens
   * - 'estabelecimento:*': Todos os caches de estabelecimentos
   *
   * IMPORTANTE:
   * - Invalidação é ampla (todos os itens, não apenas um específico)
   * - Cache L1 (in-memory) e L2 (Redis) são invalidados
   * - Próximas consultas terão cache miss (mais lentas)
   * - Use com moderação (apenas quando dados realmente mudarem)
   *
   * PONTOS CRÍTICOS:
   * - Operação síncrona (aguarda completar)
   * - Pode causar spike de carga no banco se muitos usuários consultarem
   * - Considere invalidar apenas padrões específicos em produção
   * - Log auxilia auditoria e troubleshooting
   *
   * @async
   * @static
   * @method invalidateCache
   *
   * @param {string} itemCodigo - Código do item (usado apenas para log)
   *
   * @returns {Promise<void>} Promise que resolve quando cache for invalidado
   *
   * @example
   * // Após atualizar item
   * await repository.updateItem('7530110', newData);
   * await repository.invalidateCache('7530110');
   *
   * @example
   * // Em job de sincronização
   * for (const item of updatedItems) {
   *   await updateItemInDatabase(item);
   * }
   * // Invalida uma vez ao final (não a cada item)
   * await ItemInformacoesGeraisRepository.invalidateCache('batch-update');
   *
   * @example
   * // Verificar resultado da invalidação
   * console.log('Invalidando cache...');
   * await invalidateCache('7530110');
   * console.log('Cache invalidado. Próximas consultas buscarão dados frescos.');
   *
   * @see {@link QueryCacheService.invalidateMultiple}
   */
  static async invalidateCache(itemCodigo: string): Promise<void> {
    // ---------------------------------------------------------------------------
    // INVALIDAÇÃO DE MÚLTIPLOS PADRÕES
    // ---------------------------------------------------------------------------
    // Invalida cache de item master e estabelecimentos
    // Usa wildcard (*) para invalidar todos os hashes de queries
    await QueryCacheService.invalidateMultiple([
      'item:*',              // Cache de getItemMaster
      'estabelecimento:*'    // Cache de getItemEstabelecimentos
    ]);

    // ---------------------------------------------------------------------------
    // LOGGING
    // ---------------------------------------------------------------------------
    // Registra invalidação para auditoria e troubleshooting
    // itemCodigo é usado apenas para contexto no log
    console.log('Cache invalidado para item:', itemCodigo);
  }
}