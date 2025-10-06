// src/shared/errors/AppError.ts

/**
 * =============================================================================
 * CLASSE BASE - APP ERROR
 * =============================================================================
 *
 * Classe base para todos os erros customizados da aplicação.
 * Estende Error nativo do JavaScript com propriedades adicionais
 * para tratamento padronizado de erros HTTP.
 *
 * @module AppError
 * @category Errors
 * @subcategory Core
 *
 * PROPÓSITO:
 * - Padronizar erros da aplicação
 * - Adicionar statusCode HTTP aos erros
 * - Diferenciar erros operacionais de bugs
 * - Incluir contexto adicional para debugging
 * - Manter stack trace correto
 *
 * ARQUITETURA:
 * - Classe base abstrata (não deve ser instanciada diretamente)
 * - Estende Error nativo do JavaScript
 * - Usa Error.captureStackTrace para stack trace
 * - Object.setPrototypeOf para herança correta
 *
 * PADRÃO DE PROJETO:
 * - Error Object Pattern
 * - Operational Error Pattern
 * - Context Pattern (armazena dados adicionais)
 *
 * HIERARQUIA:
 * Error (JavaScript nativo)
 *   └── AppError (esta classe)
 *         ├── ItemNotFoundError
 *         ├── ValidationError
 *         ├── DatabaseError
 *         ├── AuthenticationError
 *         └── ... (outros erros customizados)
 *
 * PONTOS CRÍTICOS:
 * - readonly: Propriedades não podem ser modificadas após criação
 * - Error.captureStackTrace: Melhora stack trace em V8
 * - Object.setPrototypeOf: Fix para herança de Error em TypeScript
 * - this.name: Sempre mostra nome da classe filha
 *
 * =============================================================================
 */
export class AppError extends Error {
  /**
   * ---------------------------------------------------------------------------
   * PROPRIEDADE: statusCode
   * ---------------------------------------------------------------------------
   *
   * Código de status HTTP associado ao erro.
   *
   * @description
   * Status code que será usado na resposta HTTP quando este erro for lançado.
   * Segue o padrão HTTP Status Codes (RFC 7231).
   *
   * CÓDIGOS COMUNS:
   * - 400: Bad Request (validação falhou)
   * - 401: Unauthorized (não autenticado)
   * - 403: Forbidden (não autorizado)
   * - 404: Not Found (recurso não existe)
   * - 422: Unprocessable Entity (regra de negócio)
   * - 429: Too Many Requests (rate limit)
   * - 500: Internal Server Error (erro do servidor)
   * - 503: Service Unavailable (timeout, serviço offline)
   *
   * IMPORTANTE:
   * - readonly: Não pode ser alterado após instanciação
   * - public: Acessível externamente pelo errorHandler
   *
   * @type {number}
   * @readonly
   * @public
   *
   * @example
   * const error = new AppError(404, 'Recurso não encontrado');
   * console.log(error.statusCode); // 404
   *
   * @example
   * // No errorHandler middleware
   * if (err instanceof AppError) {
   *   res.status(err.statusCode).json({ ... });
   * }
   */
  public readonly statusCode: number;

  /**
   * ---------------------------------------------------------------------------
   * PROPRIEDADE: isOperational
   * ---------------------------------------------------------------------------
   *
   * Indica se o erro é operacional (esperado) ou programático (bug).
   *
   * @description
   * Flag booleana que diferencia dois tipos fundamentais de erros:
   *
   * ERRO OPERACIONAL (isOperational = true):
   * - Esperado e previsto no fluxo da aplicação
   * - Não indica bug no código
   * - Pode ser tratado graciosamente
   * - Exemplos: item não encontrado, validação falhou, timeout
   * - Log level: warn (não requer atenção urgente)
   *
   * ERRO PROGRAMÁTICO (isOperational = false):
   * - Inesperado, indica bug ou problema no código
   * - Requer investigação e correção
   * - Não deve acontecer em condições normais
   * - Exemplos: TypeError, ReferenceError, null pointer
   * - Log level: error (requer atenção urgente)
   *
   * USO NO ERROR HANDLER:
   * - Determina nível de log (warn vs error)
   * - Decide se inclui detalhes na resposta
   * - Afeta estratégia de retry
   * - Influencia alertas de monitoramento
   *
   * IMPORTANTE:
   * - readonly: Não pode ser alterado após instanciação
   * - Padrão: true (assumir operacional até provar contrário)
   *
   * @type {boolean}
   * @readonly
   * @public
   *
   * @example
   * // Erro operacional (esperado)
   * const notFoundError = new AppError(404, 'Item não encontrado', true);
   * console.log(notFoundError.isOperational); // true
   *
   * @example
   * // Erro programático (bug)
   * const configError = new AppError(500, 'Config inválida', false);
   * console.log(configError.isOperational); // false
   *
   * @example
   * // Uso no errorHandler
   * if (err.isOperational) {
   *   log.warn('Erro operacional', { ... });
   * } else {
   *   log.error('Erro programático - investigar!', { ... });
   * }
   */
  public readonly isOperational: boolean;

  /**
   * ---------------------------------------------------------------------------
   * PROPRIEDADE: context
   * ---------------------------------------------------------------------------
   *
   * Objeto com dados adicionais relacionados ao erro.
   *
   * @description
   * Context armazena informações extras que ajudam a entender e debugar o erro.
   * É um objeto livre (Record) que pode conter qualquer dado relevante.
   *
   * CASOS DE USO:
   * - Armazenar parâmetros que causaram o erro
   * - Incluir IDs de recursos relacionados
   * - Adicionar detalhes de validação
   * - Guardar informações do erro original
   * - Registrar estado da aplicação no momento do erro
   *
   * VISIBILIDADE:
   * - Incluído em logs para debugging
   * - Incluído na resposta HTTP (apenas em dev)
   * - Não exposto em produção (segurança)
   * - Usado para troubleshooting
   *
   * ESTRUTURA:
   * - Chave: string (nome do campo)
   * - Valor: any (qualquer tipo de dado)
   * - Opcional: Pode ser undefined
   *
   * IMPORTANTE:
   * - readonly: Não pode ser alterado após instanciação
   * - Opcional: Nem todo erro precisa de contexto
   * - Não incluir dados sensíveis (senhas, tokens)
   *
   * @type {Record<string, any> | undefined}
   * @readonly
   * @public
   *
   * @example
   * // Erro com contexto de validação
   * const error = new AppError(400, 'Validação falhou', true, {
   *   fields: {
   *     email: 'Formato inválido',
   *     age: 'Deve ser maior que 18'
   *   }
   * });
   *
   * @example
   * // Erro com ID do recurso
   * const error = new AppError(404, 'Item não encontrado', true, {
   *   itemCodigo: '7530110',
   *   tentativasAnteriores: 3
   * });
   *
   * @example
   * // Erro com detalhes de timeout
   * const error = new AppError(503, 'Timeout', true, {
   *   service: 'SQL Server',
   *   timeout: 30000,
   *   host: '10.105.0.4'
   * });
   *
   * @example
   * // Erro sem contexto (também válido)
   * const error = new AppError(500, 'Erro interno');
   * console.log(error.context); // undefined
   */
  public readonly context?: Record<string, any>;

  /**
   * ---------------------------------------------------------------------------
   * CONSTRUTOR
   * ---------------------------------------------------------------------------
   *
   * Inicializa instância de AppError com todas as propriedades.
   *
   * @description
   * Construtor que cria novo erro customizado com statusCode, isOperational
   * e context opcional. Também configura name e stack trace corretamente.
   *
   * FLUXO DE INICIALIZAÇÃO:
   * 1. Chama super(message) - inicializa Error nativo
   * 2. Define statusCode para resposta HTTP
   * 3. Define isOperational (padrão: true)
   * 4. Define context se fornecido
   * 5. Captura stack trace (V8 optimization)
   * 6. Corrige prototype chain (TypeScript fix)
   * 7. Define name para nome da classe
   *
   * PARÂMETROS PADRÃO:
   * - isOperational: true (assumir operacional)
   * - context: undefined (opcional)
   *
   * ERROR.CAPTURESTACKTRACE:
   * - Otimização do V8 (motor JavaScript)
   * - Remove frames do construtor do stack trace
   * - Melhora legibilidade do stack
   * - Específico de Node.js/V8
   *
   * OBJECT.SETPROTOTYPEOF:
   * - Fix necessário para herança de Error em TypeScript
   * - Garante que instanceof funcione corretamente
   * - Preserva métodos da classe filha
   * - Necessário devido a limitações do ES5/ES6
   *
   * THIS.NAME:
   * - Define nome do erro como nome da classe
   * - Usado em logs e mensagens de erro
   * - Facilita identificação do tipo de erro
   * - Sobrescreve 'Error' padrão
   *
   * @constructor
   *
   * @param {number} statusCode - Código HTTP (200-599)
   * @param {string} message - Mensagem descritiva do erro
   * @param {boolean} [isOperational=true] - Se é erro operacional (padrão: true)
   * @param {Record<string, any>} [context] - Dados adicionais (opcional)
   *
   * @example
   * // Erro mínimo (apenas statusCode e mensagem)
   * const error = new AppError(500, 'Erro interno');
   *
   * @example
   * // Erro operacional com contexto
   * const error = new AppError(
   *   404,
   *   'Item não encontrado',
   *   true,
   *   { itemCodigo: '7530110' }
   * );
   *
   * @example
   * // Erro programático (bug)
   * const error = new AppError(
   *   500,
   *   'Configuração inválida detectada',
   *   false,
   *   { configFile: 'app.config.ts', missingKey: 'DATABASE_URL' }
   * );
   *
   * @example
   * // Uso em classe filha
   * export class ItemNotFoundError extends AppError {
   *   constructor(itemCodigo: string) {
   *     super(404, `Item ${itemCodigo} não encontrado`, true, { itemCodigo });
   *   }
   * }
   *
   * @example
   * // Verificação de instância
   * try {
   *   throw new AppError(400, 'Validação falhou');
   * } catch (error) {
   *   if (error instanceof AppError) {
   *     console.log(error.statusCode);     // 400
   *     console.log(error.isOperational);  // true
   *     console.log(error.name);           // 'AppError'
   *   }
   * }
   */
  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    // ---------------------------------------------------------------------------
    // ETAPA 1: Inicializar Error Nativo
    // ---------------------------------------------------------------------------
    // Chama construtor da classe pai (Error)
    // Define a propriedade 'message' herdada
    super(message);

    // ---------------------------------------------------------------------------
    // ETAPA 2: Definir Propriedades Customizadas
    // ---------------------------------------------------------------------------
    // Atribui valores aos campos específicos de AppError
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // ---------------------------------------------------------------------------
    // ETAPA 3: Capturar Stack Trace
    // ---------------------------------------------------------------------------
    /**
     * Error.captureStackTrace (V8 Optimization)
     *
     * PROPÓSITO:
     * - Remove frames do construtor do stack trace
     * - Melhora legibilidade removendo ruído
     * - Específico de V8 (Node.js)
     *
     * PARÂMETROS:
     * - this: Objeto onde armazenar stack
     * - this.constructor: Remove frames até este ponto
     *
     * RESULTADO:
     * Stack trace começa do ponto onde erro foi lançado,
     * não do construtor da classe.
     *
     * EXEMPLO SEM captureStackTrace:
     * Error: Item não encontrado
     *   at new AppError (AppError.ts:150)      <- ruído
     *   at new ItemNotFoundError (...)         <- ruído
     *   at Service.getItem (service.ts:45)     <- útil
     *
     * EXEMPLO COM captureStackTrace:
     * Error: Item não encontrado
     *   at Service.getItem (service.ts:45)     <- direto ao ponto
     */
    Error.captureStackTrace(this, this.constructor);

    // ---------------------------------------------------------------------------
    // ETAPA 4: Corrigir Prototype Chain
    // ---------------------------------------------------------------------------
    /**
     * Object.setPrototypeOf (TypeScript Fix)
     *
     * PROBLEMA:
     * Em TypeScript, estender Error tem issues de prototype chain
     * devido a como ES5/ES6 tratam built-in objects.
     *
     * SINTOMA SEM FIX:
     * - instanceof pode falhar
     * - Métodos customizados não acessíveis
     * - Prototype chain quebrado
     *
     * SOLUÇÃO:
     * Força prototype correto usando Object.setPrototypeOf
     *
     * new.target:
     * - Referência ao construtor que foi chamado
     * - Em classe base: AppError
     * - Em classe filha: ItemNotFoundError, etc
     *
     * new.target.prototype:
     * - Prototype da classe que está sendo instanciada
     * - Garante que métodos e propriedades estejam acessíveis
     *
     * REFERÊNCIA:
     * https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
     */
    Object.setPrototypeOf(this, new.target.prototype);

    // ---------------------------------------------------------------------------
    // ETAPA 5: Definir Nome do Erro
    // ---------------------------------------------------------------------------
    /**
     * this.name = Nome da Classe
     *
     * PROPÓSITO:
     * - Identifica tipo específico do erro
     * - Usado em logs: [AppError] ou [ItemNotFoundError]
     * - Aparece em JSON de resposta: { "error": "ItemNotFoundError" }
     * - Facilita debugging e filtragem de logs
     *
     * this.constructor.name:
     * - Nome da classe que está sendo instanciada
     * - AppError: se instanciado diretamente (não recomendado)
     * - ItemNotFoundError: se instanciado via classe filha
     * - ValidationError: se instanciado via classe filha
     *
     * SEM esta linha:
     * this.name seria sempre 'Error' (padrão do JavaScript)
     *
     * COM esta linha:
     * this.name reflete a classe real (AppError, ItemNotFoundError, etc)
     */
    this.name = this.constructor.name;
  }
}