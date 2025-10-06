// src/shared/errors/index.ts

/**
 * @fileoverview Ponto de entrada centralizado para o sistema de erros customizados
 *
 * Este módulo exporta todas as classes de erro e tipos relacionados,
 * permitindo importações simplificadas em todo o projeto.
 *
 * Sistema de erros hierárquico:
 * - AppError (classe base) → Todos os erros customizados herdam desta
 * - CustomErrors → Erros específicos por contexto (404, 400, 500, etc)
 *
 * Benefícios:
 * - Status codes HTTP apropriados automaticamente
 * - Contexto adicional para debugging
 * - Distinção entre erros operacionais e críticos
 * - Respostas JSON padronizadas
 * - Logs estruturados e informativos
 *
 * @module shared/errors
 *
 * @example Importação simplificada
 * ```typescript
 * // ✅ CORRETO: Import de múltiplas classes de uma vez
 * import {
 *   ItemNotFoundError,
 *   ValidationError,
 *   DatabaseError
 * } from '@shared/errors';
 *
 * // ❌ EVITE: Import de arquivos individuais
 * import { ItemNotFoundError } from '@shared/errors/CustomErrors';
 * ```
 *
 * @example Uso em controller
 * ```typescript
 * import { ItemNotFoundError, ValidationError } from '@shared/errors';
 *
 * export class ItemController {
 *   static getItem = asyncHandler(async (req, res) => {
 *     const { itemCodigo } = req.params;
 *
 *     if (!itemCodigo) {
 *       throw new ValidationError('Código obrigatório');
 *     }
 *
 *     const item = await ItemService.find(itemCodigo);
 *
 *     if (!item) {
 *       throw new ItemNotFoundError(itemCodigo);
 *     }
 *
 *     res.json({ success: true, data: item });
 *   });
 * }
 * ```
 *
 * @example Uso em service
 * ```typescript
 * import { ItemNotFoundError, DatabaseError } from '@shared/errors';
 *
 * export class ItemService {
 *   static async find(codigo: string) {
 *     try {
 *       const item = await Repository.findByCodigo(codigo);
 *
 *       if (!item) {
 *         throw new ItemNotFoundError(codigo);
 *       }
 *
 *       return item;
 *     } catch (error) {
 *       if (error instanceof ItemNotFoundError) {
 *         throw error; // Re-lança erros customizados
 *       }
 *
 *       // Converte erros genéricos em DatabaseError
 *       throw new DatabaseError('Falha ao buscar item', error);
 *     }
 *   }
 * }
 * ```
 *
 * @see {@link AppError} para classe base
 * @see {@link CustomErrors} para erros específicos
 * @see {@link ERROR_HANDLING.md} para guia completo
 */

/**
 * Classe base para todos os erros customizados
 *
 * @class AppError
 *
 * @description
 * Classe abstrata que estende Error nativo do JavaScript.
 * Todos os erros customizados da aplicação herdam desta classe.
 *
 * Propriedades principais:
 * - statusCode: Status HTTP apropriado (404, 400, 500, etc)
 * - isOperational: true para erros esperados, false para bugs
 * - context: Objeto com dados adicionais para debugging
 *
 * @example
 * ```typescript
 * // Criar erro customizado
 * class MeuErro extends AppError {
 *   constructor(mensagem: string) {
 *     super(400, mensagem, true, { campo: 'valor' });
 *   }
 * }
 * ```
 *
 * @see {@link AppError.ts} para implementação completa
 */
export { AppError } from './AppError';

/**
 * Erros específicos por contexto e status HTTP
 *
 * @description
 * Conjunto de classes de erro pré-definidas para os casos mais comuns.
 * Cada classe já vem configurada com status code e mensagem apropriada.
 *
 * Erros disponíveis:
 *
 * **404 - Not Found:**
 * - ItemNotFoundError: Item não encontrado
 * - EstabelecimentoNotFoundError: Estabelecimento não encontrado
 *
 * **400 - Bad Request:**
 * - ValidationError: Erro de validação de dados
 *
 * **401 - Unauthorized:**
 * - AuthenticationError: Não autenticado
 *
 * **403 - Forbidden:**
 * - AuthorizationError: Não autorizado
 *
 * **422 - Unprocessable Entity:**
 * - BusinessRuleError: Regra de negócio violada
 *
 * **429 - Too Many Requests:**
 * - RateLimitError: Rate limit excedido
 *
 * **500 - Internal Server Error:**
 * - DatabaseError: Erro no banco de dados
 * - CacheError: Erro no cache
 * - ConfigurationError: Erro de configuração
 *
 * **503 - Service Unavailable:**
 * - ConnectionTimeoutError: Timeout de conexão
 * - ExternalServiceError: Serviço externo falhou
 *
 * @example ItemNotFoundError
 * ```typescript
 * throw new ItemNotFoundError('7530110');
 * // → 404: "Item 7530110 não encontrado"
 * ```
 *
 * @example ValidationError
 * ```typescript
 * throw new ValidationError('Dados inválidos', {
 *   itemCodigo: 'Obrigatório',
 *   quantidade: 'Deve ser maior que zero'
 * });
 * // → 400: "Dados inválidos"
 * // context: { fields: { itemCodigo: 'Obrigatório', ... } }
 * ```
 *
 * @example DatabaseError
 * ```typescript
 * try {
 *   await database.query('SELECT ...');
 * } catch (error) {
 *   throw new DatabaseError('Falha na query', error);
 * }
 * // → 500: "Erro no banco de dados: Falha na query"
 * ```
 *
 * @see {@link CustomErrors.ts} para implementação de cada erro
 */
export {
  ItemNotFoundError,
  EstabelecimentoNotFoundError,
  ValidationError,
  DatabaseError,
  ConnectionTimeoutError,
  ExternalServiceError,
  CacheError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  ConfigurationError,
  BusinessRuleError,
} from './CustomErrors';

/**
 * Tipo genérico para detalhes de erro
 *
 * @typedef {Record<string, any>} ErrorDetails
 *
 * @description
 * Objeto chave-valor com informações adicionais sobre o erro.
 * Usado na propriedade `context` do AppError.
 *
 * Casos de uso:
 * - Campos de validação que falharam
 * - IDs de recursos não encontrados
 * - Parâmetros que causaram o erro
 * - Dados de debug
 *
 * @example
 * ```typescript
 * const details: ErrorDetails = {
 *   itemCodigo: '7530110',
 *   tentativas: 3,
 *   timeout: 30000
 * };
 *
 * throw new AppError(500, 'Falha ao processar', true, details);
 * ```
 *
 * @example Em ValidationError
 * ```typescript
 * const details: ErrorDetails = {
 *   itemCodigo: 'Campo obrigatório',
 *   quantidade: 'Deve ser maior que zero',
 *   estabCodigo: 'Formato inválido'
 * };
 *
 * throw new ValidationError('Dados inválidos', details);
 * ```
 */
export type ErrorDetails = Record<string, any>;

/**
 * Estrutura da resposta JSON de erro
 *
 * @typedef {Object} ErrorResponse
 *
 * @property {string} error - Nome da classe de erro
 * @property {string} message - Mensagem descritiva do erro
 * @property {string} timestamp - Data/hora do erro (ISO 8601)
 * @property {string} path - URL da requisição que causou o erro
 * @property {string} correlationId - ID único para rastreamento
 * @property {ErrorDetails} [details] - Contexto adicional (opcional)
 *
 * @description
 * Formato padronizado de resposta de erro retornado pela API.
 * Gerado automaticamente pelo errorHandler middleware.
 *
 * Campos principais:
 * - **error**: Nome da classe (ex: "ItemNotFoundError")
 * - **message**: Mensagem legível (ex: "Item 7530110 não encontrado")
 * - **timestamp**: Momento exato do erro
 * - **path**: Endpoint que foi chamado
 * - **correlationId**: Para rastrear logs relacionados
 * - **details**: Dados adicionais do contexto do erro
 *
 * @example Response 404
 * ```json
 * {
 *   "error": "ItemNotFoundError",
 *   "message": "Item 7530110 não encontrado",
 *   "timestamp": "2025-10-06T12:00:00.000Z",
 *   "path": "/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110",
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000",
 *   "details": {
 *     "itemCodigo": "7530110"
 *   }
 * }
 * ```
 *
 * @example Response 400
 * ```json
 * {
 *   "error": "ValidationError",
 *   "message": "Dados inválidos",
 *   "timestamp": "2025-10-06T12:00:00.000Z",
 *   "path": "/api/items",
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000",
 *   "details": {
 *     "fields": {
 *       "itemCodigo": "Obrigatório",
 *       "quantidade": "Deve ser maior que zero"
 *     }
 *   }
 * }
 * ```
 *
 * @example Response 500
 * ```json
 * {
 *   "error": "DatabaseError",
 *   "message": "Erro no banco de dados: Connection timeout",
 *   "timestamp": "2025-10-06T12:00:00.000Z",
 *   "path": "/api/items/7530110",
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000",
 *   "details": {
 *     "originalMessage": "ETIMEDOUT",
 *     "stack": "Error: ETIMEDOUT\n    at ..."  // apenas em dev
 *   }
 * }
 * ```
 *
 * @remarks
 * 💡 O campo `details` é opcional e só aparece se o erro tiver contexto.
 * Em produção, stack traces não são incluídas por segurança.
 *
 * @remarks
 * 🔍 Use o `correlationId` para buscar todos os logs relacionados:
 * ```bash
 * grep "550e8400-e29b-41d4-a716-446655440000" logs/app.log
 * ```
 *
 * @see {@link errorHandler.middleware.ts} para geração da resposta
 */
export type ErrorResponse = {
  error: string;
  message: string;
  timestamp: string;
  path: string;
  correlationId: string;
  details?: ErrorDetails;
};