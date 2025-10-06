// src/api/lor0138/item/dadosCadastrais/informacoesGerais/types/informacoesGerais.types.ts

/**
 * @fileoverview Types e Interfaces para Informações Gerais de Itens
 *
 * Define os contratos de dados para o módulo de informações gerais,
 * incluindo:
 * - DTOs de Request/Response (camada de API)
 * - Modelos de domínio (representação de negócio)
 * - Tipos de resultado de queries (camada de dados)
 *
 * **Arquitetura de Tipos:**
 * ```
 * Request → RequestDTO → Service → Repository → QueryResult
 *                           ↓
 *                       DomainModel
 *                           ↓
 *                      ResponseDTO → Response
 * ```
 *
 * **Convenção de Nomenclatura:**
 * - `*RequestDTO`: Dados de entrada da API
 * - `*ResponseDTO`: Dados de saída da API
 * - `*QueryResult`: Resultado bruto de queries SQL
 * - Sem sufixo: Modelos de domínio (business objects)
 *
 * @module InformacoesGeraisTypes
 * @category Types
 */

// ============================================================================
// MODELOS DE DOMÍNIO
// ============================================================================

/**
 * Dados de um item em um estabelecimento específico
 *
 * Representa a relação entre um item e um estabelecimento no ERP,
 * incluindo status de ativação e informações de cadastro.
 *
 * **Origem dos Dados:**
 * - Progress/Datasul: Tabelas `item`, `estabelec`, `item-uni-estab`
 * - SQL Server: Linked Server `PRD_EMS2EMP`
 *
 * **Status Index:**
 * - `1`: Item ativo no estabelecimento (cod-obsoleto = 0)
 * - `2`: Item inativo no estabelecimento (cod-obsoleto != 0)
 *
 * @interface ItemInformacoesGeraisEstabelecimento
 *
 * @property {string} itemCodigo - Código do item
 * @property {string} estabCodigo - Código do estabelecimento (formato: XX.XX)
 * @property {string} estabNome - Nome/descrição do estabelecimento
 * @property {number} statusIndex - Status de ativação (1=ativo, 2=inativo)
 *
 * @example
 * ```typescript
 * const estabelecimento: ItemInformacoesGeraisEstabelecimento = {
 *   itemCodigo: '7530110',
 *   estabCodigo: '01.01',
 *   estabNome: 'CD São Paulo',
 *   statusIndex: 1 // Ativo
 * };
 * ```
 *
 * @note
 * O formato do estabCodigo (XX.XX) é padrão do Datasul/Progress
 */
export interface ItemInformacoesGeraisEstabelecimento {
  /** Código do item no ERP (chave estrangeira) */
  itemCodigo: string;

  /** Código do estabelecimento no formato XX.XX (ex: 01.01, 02.15) */
  estabCodigo: string;

  /** Nome/descrição do estabelecimento */
  estabNome: string;

  /**
   * Status de ativação do item no estabelecimento
   * - 1: Ativo (cod-obsoleto = 0)
   * - 2: Inativo (cod-obsoleto != 0)
   */
  statusIndex: number;
}

/**
 * Dados gerais (mestres) do item
 *
 * Representa as informações cadastrais principais de um item do ERP,
 * agregando dados mestres e suas relações com estabelecimentos.
 *
 * **Estrutura Hierárquica:**
 * ```
 * Item (dados mestres)
 *   └── Estabelecimentos[] (onde o item está cadastrado)
 * ```
 *
 * **Nomenclatura "identificacao":**
 * Os campos começam com "identificacao" para manter compatibilidade
 * com a estrutura original do Datasul/Progress e facilitar mapeamento.
 *
 * @interface ItemInformacoesGerais
 *
 * @property {string} identificacaoItemCodigo - Código único do item
 * @property {string} identificacaoItemDescricao - Descrição completa do item
 * @property {string} identificacaoItemUnidade - Unidade de medida padrão
 * @property {ItemInformacoesGeraisEstabelecimento[]} identificacaoItensEstabelecimentos - Estabelecimentos relacionados
 *
 * @example
 * ```typescript
 * const item: ItemInformacoesGerais = {
 *   identificacaoItemCodigo: '7530110',
 *   identificacaoItemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
 *   identificacaoItemUnidade: 'UN',
 *   identificacaoItensEstabelecimentos: [
 *     {
 *       itemCodigo: '7530110',
 *       estabCodigo: '01.01',
 *       estabNome: 'CD São Paulo',
 *       statusIndex: 1
 *     },
 *     {
 *       itemCodigo: '7530110',
 *       estabCodigo: '02.01',
 *       estabNome: 'Fábrica Joinville',
 *       statusIndex: 2
 *     }
 *   ]
 * };
 * ```
 *
 * @note
 * Array de estabelecimentos pode ser vazio se item não possui cadastro em estabelecimentos
 */
export interface ItemInformacoesGerais {
  /** Código único do item (1-16 caracteres alfanuméricos) */
  identificacaoItemCodigo: string;

  /** Descrição completa do item (ex: 'VALVULA DE ESFERA 1/2" BRONZE') */
  identificacaoItemDescricao: string;

  /** Unidade de medida padrão (ex: 'UN', 'KG', 'MT') */
  identificacaoItemUnidade: string;

  /**
   * Lista de estabelecimentos onde o item está cadastrado
   * Pode ser array vazio se item não possui cadastro em estabelecimentos
   */
  identificacaoItensEstabelecimentos: ItemInformacoesGeraisEstabelecimento[];
}

// ============================================================================
// DTOs DE API (REQUEST/RESPONSE)
// ============================================================================

/**
 * DTO de entrada para buscar informações de um item
 *
 * Define o contrato de dados esperado na requisição HTTP.
 * Usado pelo validator para validação de entrada.
 *
 * **Validações Aplicadas:**
 * - itemCodigo é obrigatório
 * - itemCodigo é string
 * - itemCodigo tem 1-16 caracteres
 * - itemCodigo contém apenas A-Z, a-z, 0-9
 * - Sanitização contra SQL injection/XSS
 *
 * @interface ItemInformacoesGeraisRequestDTO
 *
 * @property {string} itemCodigo - Código do item a ser buscado
 *
 * @example
 * ```typescript
 * // Vem de req.params no controller
 * const request: ItemInformacoesGeraisRequestDTO = {
 *   itemCodigo: '7530110'
 * };
 * ```
 *
 * @see validateItemInformacoesGeraisRequest para validação completa
 */
export interface ItemInformacoesGeraisRequestDTO {
  /**
   * Código do item a ser buscado (1-16 caracteres alfanuméricos)
   * Será validado e sanitizado antes de uso
   */
  itemCodigo: string;
}

/**
 * DTO de resposta da API
 *
 * Envelope padrão para respostas HTTP do endpoint.
 * Segue o padrão de resposta da API com flag de sucesso.
 *
 * **Estrutura de Resposta:**
 * - Sucesso: `{ success: true, data: {...} }`
 * - Erro: `{ success: false, error: '...' }`
 *
 * @interface ItemInformacoesGeraisResponseDTO
 *
 * @property {boolean} success - Indica se operação foi bem-sucedida
 * @property {ItemInformacoesGerais} [data] - Dados do item (se sucesso)
 * @property {string} [error] - Mensagem de erro (se falha)
 *
 * @example
 * ```typescript
 * // Resposta de sucesso
 * const response: ItemInformacoesGeraisResponseDTO = {
 *   success: true,
 *   data: {
 *     identificacaoItemCodigo: '7530110',
 *     identificacaoItemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
 *     // ...
 *   }
 * };
 *
 * // Resposta de erro
 * const errorResponse: ItemInformacoesGeraisResponseDTO = {
 *   success: false,
 *   error: 'Item não encontrado'
 * };
 * ```
 *
 * @note
 * Este tipo é usado pelo controller, mas o errorHandler middleware
 * pode modificar a estrutura em caso de erro
 */
export interface ItemInformacoesGeraisResponseDTO {
  /** Flag indicando sucesso da operação */
  success: boolean;

  /** Dados do item (presente apenas se success = true) */
  data?: ItemInformacoesGerais;

  /** Mensagem de erro (presente apenas se success = false) */
  error?: string;
}

// ============================================================================
// TIPOS DE RESULTADO DE QUERIES (CAMADA DE DADOS)
// ============================================================================

/**
 * Resultado bruto da query SQL para dados mestres do item
 *
 * Representa a estrutura de dados retornada diretamente pela query
 * do SQL Server/Linked Server, antes de qualquer transformação.
 *
 * **Origem:**
 * ```sql
 * SELECT
 *   item."it-codigo" as itemCodigo,
 *   item."desc-item" as itemDescricao,
 *   item."un" as itemUnidade
 * FROM OPENQUERY(PRD_EMS2EMP, '
 *   SELECT "it-codigo", "desc-item", "un"
 *   FROM pub.item
 *   WHERE "it-codigo" = ''${itemCodigo}''
 * ') as item
 * ```
 *
 * **Transformação:**
 * QueryResult → (Repository) → DomainModel → (Service) → ResponseDTO
 *
 * @interface ItemMasterQueryResult
 *
 * @property {string} itemCodigo - Código do item (mapeado de it-codigo)
 * @property {string} itemDescricao - Descrição (mapeado de desc-item)
 * @property {string} itemUnidade - Unidade de medida (mapeado de un)
 *
 * @example
 * ```typescript
 * // Retornado pelo DatabaseManager após query
 * const queryResult: ItemMasterQueryResult = {
 *   itemCodigo: '7530110',
 *   itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
 *   itemUnidade: 'UN'
 * };
 * ```
 *
 * @private
 * Usado apenas internamente pelo Repository
 */
export interface ItemMasterQueryResult {
  /** Código do item (coluna: it-codigo) */
  itemCodigo: string;

  /** Descrição do item (coluna: desc-item) */
  itemDescricao: string;

  /** Unidade de medida padrão (coluna: un) */
  itemUnidade: string;
}

/**
 * Resultado bruto da query SQL para estabelecimentos do item
 *
 * Representa a estrutura de dados retornada pela query de estabelecimentos,
 * incluindo o código de obsolescência para determinar status.
 *
 * **Origem:**
 * ```sql
 * SELECT
 *   item."it-codigo" as itemCodigo,
 *   estabelec."cod-estabel" as estabCodigo,
 *   estabelec."nome" as estabNome,
 *   "item-uni-estab"."cod-obsoleto" as codObsoleto
 * FROM OPENQUERY(PRD_EMS2EMP, '...')
 * ```
 *
 * **Transformação de codObsoleto:**
 * - `0` → statusIndex = `1` (ativo)
 * - `!= 0` → statusIndex = `2` (inativo)
 *
 * @interface ItemEstabQueryResult
 *
 * @property {string} itemCodigo - Código do item
 * @property {string} estabCodigo - Código do estabelecimento (XX.XX)
 * @property {string} estabNome - Nome do estabelecimento
 * @property {number} codObsoleto - Código de obsolescência (0=ativo)
 *
 * @example
 * ```typescript
 * // Retornado pelo DatabaseManager após query
 * const queryResult: ItemEstabQueryResult = {
 *   itemCodigo: '7530110',
 *   estabCodigo: '01.01',
 *   estabNome: 'CD São Paulo',
 *   codObsoleto: 0 // Ativo
 * };
 *
 * // Transformado em:
 * const domainModel: ItemInformacoesGeraisEstabelecimento = {
 *   itemCodigo: '7530110',
 *   estabCodigo: '01.01',
 *   estabNome: 'CD São Paulo',
 *   statusIndex: 1 // codObsoleto === 0 ? 1 : 2
 * };
 * ```
 *
 * @private
 * Usado apenas internamente pelo Repository
 */
export interface ItemEstabQueryResult {
  /** Código do item (coluna: it-codigo) */
  itemCodigo: string;

  /** Código do estabelecimento (coluna: cod-estabel, formato: XX.XX) */
  estabCodigo: string;

  /** Nome do estabelecimento (coluna: nome) */
  estabNome: string;

  /**
   * Código de obsolescência (coluna: cod-obsoleto)
   * - 0: Item ativo no estabelecimento
   * - != 0: Item inativo/obsoleto no estabelecimento
   */
  codObsoleto: number;
}