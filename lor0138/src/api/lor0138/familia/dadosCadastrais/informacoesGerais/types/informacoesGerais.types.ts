// src/api/lor0138/familia/dadosCadastrais/informacoesGerais/types/informacoesGerais.types.ts

/**
 * @fileoverview Types e Interfaces para Informações Gerais de Famílias
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
 * Dados de uma família específica
 *
 * Representa os dados de uma família.
 *
 * **Origem dos Dados:**
 * - Progress/Datasul: Tabela `familia`
 * - SQL Server: Linked Server `PRD_EMS2EMP`
 *
 * @interface FamiliaInformacoesGerais
 *
 * @property {string} familiaCodigo - Código da família
 *
 *
 */
export interface FamiliaInformacoesGerais {
  /** Código da família no ERP (chave primária) */
  familiaCodigo: string;

  /** Descrição completa da família */
  familiaDescricao: string;
}

// ============================================================================
// DTOs DE API (REQUEST/RESPONSE)
// ============================================================================

/**
 * DTO de entrada para buscar informações de uma família
 *
 * Define o contrato de dados esperado na requisição HTTP.
 * Usado pelo validator para validação de entrada.
 *
 * **Validações Aplicadas:**
 * - familiaCodigo é obrigatório
 * - familiaCodigo é string
 * - familiaCodigo tem 1-16 caracteres
 * - familiaCodigo contém apenas A-Z, a-z, 0-9
 * - Sanitização contra SQL injection/XSS
 *
 * @interface FamiliaInformacoesGeraisRequestDTO
 *
 * @property {string} familiaCodigo - Código da família a ser buscada (1-16 caracteres alfanuméricos)
 *
 * @example
 * ```typescript
 * // Vem de req.params no controller
 * const request: FamiliaInformacoesGeraisRequestDTO = {
 *   familiaCodigo: '450000'
 * };
 * ```
 *
 * @see validateFamiliaInformacoesGeraisRequest para validação completa
 */
export interface FamiliaInformacoesGeraisRequestDTO {
  /**
   * Código da família a ser buscada (1-16 caracteres alfanuméricos)
   * Será validado e sanitizado antes de uso
   */
  familiaCodigo: string;
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
 * @property {FamiliaInformacoesGerais} [data] - Dados da família (se sucesso)
 * @property {string} [error] - Mensagem de erro (se falha)
 *
 * @example
 * ```typescript
 * // Resposta de sucesso
 * const response: FamiliaInformacoesGeraisResponseDTO = {
 *   success: true,
 *   data: {
 *     identificacaoFamiliaCodigo: '450000',
 *     identificacaoFamiliaDescricao: 'FAMILIA TESTE',
 *     // ...
 *   }
 * };
 *
 * // Resposta de erro
 * const errorResponse: FamiliaInformacoesGeraisResponseDTO = {
 *   success: false,
 *   error: 'Família não encontrada'
 * };
 * ```
 *
 * @note
 * Este tipo é usado pelo controller, mas o errorHandler middleware
 * pode modificar a estrutura em caso de erro
 */
export interface FamiliaInformacoesGeraisResponseDTO {
  /** Flag indicando sucesso da operação */
  success: boolean;

  /** Dados do item (presente apenas se success = true) */
  data?: FamiliaInformacoesGerais;

  /** Mensagem de erro (presente apenas se success = false) */
  error?: string;
}

// ============================================================================
// TIPOS DE RESULTADO DE QUERIES (CAMADA DE DADOS)
// ============================================================================

/**
 * Resultado bruto da query SQL para dados mestres da família
 *
 * Representa a estrutura de dados retornada diretamente pela query
 * do SQL Server/Linked Server, antes de qualquer transformação.
 *
 * **Origem:**
 * ```sql
 * SELECT
 *   familia."fm-codigo" as familiaCodigo,
 *   familia."descricao" as familiaDescricao,
 * FROM OPENQUERY (
 *   PRD_EMS2EMP
 * ,  'SELECT  "fm-codigo"
 *           , "desc-item"
 *           , "un"
 *       FROM  pub.familia familia
 *       WHERE "fm-codigo" = ''${familiaCodigo}''
 *    ') as familia
 * ```
 *
 * **Transformação:**
 * QueryResult → (Repository) → DomainModel → (Service) → ResponseDTO
 *
 * @interface FamiliaMasterQueryResult
 *
 * @property {string} familiaCodigo - Código da família (mapeado de fm-codigo)
 * @property {string} familiaDescricao - Descrição (mapeado de descricao)
 *
 * @example
 * ```typescript
 * // Retornado pelo DatabaseManager após query
 * const queryResult: FamiliaMasterQueryResult = {
 *   familiaCodigo: '450000',
 *   familiaDescricao: 'FAMILIA TESTE',
 * };
 * ```
 *
 * @private
 * Usado apenas internamente pelo Repository
 */
export interface FamiliaMasterQueryResult {
  /** Código da familia (coluna: fm-codigo) */
  familiaCodigo: string;

  /** Descrição da familia (coluna: descricao) */
  familiaDescricao: string;

}
