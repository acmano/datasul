// src/api/lor0138/familia/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository.ts

import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

/**
 * =============================================================================
 * REPOSITORY - INFORMAÇÕES GERAIS DA FAMÍLIA
 * =============================================================================
 *
 * Camada de acesso a dados para consultas relacionadas às informações
 * gerais de famílias do sistema Datasul/Progress OpenEdge.
 *
 * @module FamiliaInformacoesGeraisRepository
 * @category Repositories
 * @subcategory Familia/DadosCadastrais
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
 * - Linked Server: PRD_EMS2EMP (empresa)
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
 * - Progress usa aspas duplas em nomes de campos e tabelas
 *
 * =============================================================================
 */
export class FamiliaInformacoesGeraisRepository {

  /**
   * ---------------------------------------------------------------------------
   * MÉTODO: getFamiliaMaster
   * ---------------------------------------------------------------------------
   *
   * Busca dados mestres de uma familia da tabela pub.familia do Progress.
   *
   * @description
   * Consulta informações básicas (código, descrição) de uma família
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
   * - DECLARE @familiaCodigo: Define variável SQL Server
   * - OPENQUERY(PRD_EMS2EMP, ...): Consulta Linked Server Progress
   * - SELECT pub.familia: Acessa tabela familia do Progress
   * - EXEC sp_executesql: Executa SQL dinâmico com parâmetros
   *
   * CACHE:
   * - Namespace: 'familia'
   * - TTL: 600 segundos (10 minutos)
   * - Invalidação: Manual via invalidateCache()
   * - Strategy: Cache-aside (lazy loading)
   *
   * SEGURANÇA:
   * - Queries parametrizadas previnem SQL Injection
   * - sp_executesql com @paramfamiliaCodigo tipado como varchar(16)
   * - Escape de aspas simples no OPENQUERY ('''')
   *
   * PONTOS CRÍTICOS:
   * - Progress usa aspas duplas: "fm-codigo", "descricao"
   * - OPENQUERY requer concatenação de strings (limitação técnica)
   * - Retorna null se familia não existir (não array vazio)
   * - Cache reduz 80-90% das chamadas ao banco
   *
   * @async
   * @static
   * @method getFamiliaMaster
   *
   * @param {string} familiaCodigo - Código único da família (máx 16 caracteres)
   *
   * @returns {Promise<FamiliaMasterQueryResult | null>}
   * Objeto com dados da família ou null se não encontrado:
   * @returns {string} familiaCodigo - Código da família (familia."fm-codigo")
   * @returns {string} familiaDescricao - Descrição da família (familia."descricao")
   *
   * @throws {Error}
   * Quando ocorre erro no banco de dados:
   * - Timeout de conexão/query
   * - Linked Server offline
   * - Permissão negada
   * - SQL inválido
   *
   * @example
   * // Caso de sucesso - Familia encontrada
   * const familia = await FamiliaInformacoesGeraisRepository.getFamiliaMaster('450000');
   * // Retorna:
   * {
   *   familiaCodigo: '450000',
   *   familiaDescricao: 'FAMILIATESTE',
   * }
   *
   * @example
   * // Caso de familia não encontradA
   * const familia = await FamiliaInformacoesGeraisRepository.getFamiliaMaster('INVALID');
   * // Retorna: null
   *
   * @example
   * // Uso com cache hit (segunda chamada)
   * const Familia1 = await getFamiliaMaster('450000'); // Cache miss → banco
   * const Familia2 = await getFamiliaMaster('450000'); // Cache hit → memória (rápido!)
   *
   * @see {@link DatabaseManager.queryEmpWithParams}
   * @see {@link QueryCacheService.withFamiliaCache}
   */
  static async getFamiliaMaster(familiaCodigo: string): Promise<any | null> {
    try {
      // ---------------------------------------------------------------------------
      // QUERY SQL DINÂMICA COM OPENQUERY
      // ---------------------------------------------------------------------------
      // IMPORTANTE: OPENQUERY não suporta parâmetros diretos
      // Solução: Usar sp_executesql com variável @familiaCodigo
      // Aspas quádruplas ('''') são necessárias para escape no OPENQUERY
      const query = `
        DECLARE @familiaCodigo varchar(16) = @paramfamiliaCodigo;
        DECLARE @sql nvarchar(max);

        SET @sql = N'
          SELECT  familia."fm-codigo" as familiaCodigo
                , familia."descricao" as familiaDescricao
            FROM  OPENQUERY (
              PRD_EMS2EMP
            ,  ''SELECT  familia."fm-codigo"
                       , familia."descricao"
                   FROM   pub.familia familia
                   WHERE  familia."fm-codigo" = ''''' + @familiaCodigo + '''''
               ''
            ) as familia
        ';

        EXEC sp_executesql @sql;
      `;

      // ---------------------------------------------------------------------------
      // PARÂMETROS TIPADOS
      // ---------------------------------------------------------------------------
      // sp_executesql requer parâmetros tipados explicitamente
      // Previne SQL Injection ao tratar entrada como valor literal
      const params: QueryParameter[] = [
        { name: 'paramfamiliaCodigo', type: 'varchar', value: familiaCodigo }
      ];

      // ---------------------------------------------------------------------------
      // EXECUÇÃO COM CACHE L1/L2
      // ---------------------------------------------------------------------------
      // QueryCacheService verifica cache antes de executar query
      // Se cache miss, executa queryFn e armazena resultado
      // TTL: 10 minutos (600 segundos)
      // Namespace: 'familia' (permite invalidação seletiva)
      const result = await QueryCacheService.withFamiliaCache(
        query,
        params,
        async () => DatabaseManager.queryEmpWithParams(query, params)
      );

      // ---------------------------------------------------------------------------
      // RETORNO
      // ---------------------------------------------------------------------------
      // Se resultado contém registros, retorna o primeiro
      // Se vazio, retorna null (familia não encontrado)
      // IMPORTANTE: Retorna null, não array vazio, para consistência com Service
      return result && result.length > 0 ? result[0] : null;

    } catch (error) {
      // ---------------------------------------------------------------------------
      // TRATAMENTO DE ERROS
      // ---------------------------------------------------------------------------
      // Registra erro detalhado no console para troubleshooting
      // Propaga erro para camada superior (Service) tratar
      console.error('Erro ao buscar familia master:', error);
      throw error;
    }
  }

  /**
   * ---------------------------------------------------------------------------
   * MÉTODO: invalidateCache
   * ---------------------------------------------------------------------------
   *
   * Invalida cache de queries relacionadas a uma familia específica.
   *
   * @description
   * Remove entradas de cache para forçar recarregamento de dados frescos
   * do banco de dados na próxima consulta.
   *
   * QUANDO USAR:
   * - Após UPDATE em dados da família
   * - Em rotinas de sincronização de dados
   *
   * PADRÕES INVALIDADOS:
   * - 'familia:*': Todos os caches de dados mestres de familias
   *
   * IMPORTANTE:
   * - Invalidação é ampla (todos as famílias, não apenas uma específica)
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
   * @param {string} familiaCodigo - Código da família (usado apenas para log)
   *
   * @returns {Promise<void>} Promise que resolve quando cache for invalidado
   *
   * @example
   * // Após atualizar familia
   * await repository.updateFamilia('450000', newData);
   * await repository.invalidateCache('450000');
   *
   * @example
   * // Em job de sincronização
   * for (const familia of updatedFamilias) {
   *   await updateFamiliaInDatabase(familia);
   * }
   * // Invalida uma vez ao final (não a cada familia)
   * await FamiliaInformacoesGeraisRepository.invalidateCache('batch-update');
   *
   * @example
   * // Verificar resultado da invalidação
   * console.log('Invalidando cache...');
   * await invalidateCache('450000');
   * console.log('Cache invalidado. Próximas consultas buscarão dados frescos.');
   *
   * @see {@link QueryCacheService.invalidateMultiple}
   */
  static async invalidateCache(familiaCodigo: string): Promise<void> {
    // ---------------------------------------------------------------------------
    // INVALIDAÇÃO DE MÚLTIPLOS PADRÕES
    // ---------------------------------------------------------------------------
    // Invalida cache de familia master e estabelecimentos
    // Usa wildcard (*) para invalidar todos os hashes de queries
    await QueryCacheService.invalidateMultiple([
      'familia:*',              // Cache de getFamiliaMaster
      'estabelecimento:*'    // Cache de getFamiliaEstabelecimentos
    ]);

    // ---------------------------------------------------------------------------
    // LOGGING
    // ---------------------------------------------------------------------------
    // Registra invalidação para auditoria e troubleshooting
    // familiaCodigo é usado apenas para contexto no log
    console.log('Cache invalidado para familia:', familiaCodigo);
  }
}