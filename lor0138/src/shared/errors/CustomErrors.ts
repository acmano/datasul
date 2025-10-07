// src/shared/errors/CustomErrors.ts

import { AppError } from './AppError';

/**
 * =============================================================================
 * ERROS CUSTOMIZADOS DA APLICAÇÃO
 * =============================================================================
 *
 * Coleção de classes de erro específicas que estendem AppError.
 * Cada classe representa um tipo específico de erro da aplicação,
 * com statusCode, mensagem e contexto apropriados.
 *
 * @module CustomErrors
 * @category Errors
 * @subcategory Specific
 *
 * PROPÓSITO:
 * - Substituir erros genéricos por erros tipados e descritivos
 * - Padronizar mensagens de erro
 * - Facilitar tratamento específico por tipo de erro
 * - Melhorar debugging com contexto rico
 * - Garantir statusCode HTTP correto
 *
 * CATEGORIAS DE ERRO:
 * - Not Found (404): Recurso não encontrado
 * - Validation (400): Dados inválidos
 * - Database (500): Erros de banco de dados
 * - Timeout (503): Timeouts e serviços indisponíveis
 * - Authentication (401): Não autenticado
 * - Authorization (403): Sem permissão
 * - Rate Limit (429): Limite de requisições excedido
 * - Business Rule (422): Regra de negócio violada
 * - Configuration (500): Erro de configuração
 *
 * PADRÃO DE USO:
 * ```typescript
 * // Ao invés de:
 * throw new Error('Item não encontrado');
 *
 * // Use:
 * throw new ItemNotFoundError(itemCodigo);
 * ```
 *
 * BENEFÍCIOS:
 * - Type safety (TypeScript sabe o tipo do erro)
 * - Autocomplete no IDE
 * - Mensagens padronizadas
 * - Context automático
 * - StatusCode correto
 * - Logs estruturados
 *
 * =============================================================================
 */

/**
 * =============================================================================
 * CATEGORIA: NOT FOUND (404)
 * =============================================================================
 */

/**
 * ---------------------------------------------------------------------------
 * ERRO: ItemNotFoundError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando um item não é encontrado no sistema.
 *
 * @class ItemNotFoundError
 * @extends {AppError}
 *
 * @description
 * Erro específico para situações onde um item solicitado não existe
 * na base de dados. Sempre retorna statusCode 404.
 *
 * QUANDO USAR:
 * - Busca de item por código retorna vazio
 * - Item foi deletado ou nunca existiu
 * - Usuário tenta acessar item inexistente
 *
 * PROPRIEDADES HERDADAS:
 * - statusCode: 404 (Not Found)
 * - isOperational: true (erro esperado)
 * - message: "Item {codigo} não encontrado"
 * - context: { itemCodigo: string }
 *
 * @param {string} itemCodigo - Código do item não encontrado
 *
 * @example
 * // No Service
 * const item = await repository.findByCode('7530110');
 * if (!item) {
 *   throw new ItemNotFoundError('7530110');
 * }
 *
 * @example
 * // Resposta HTTP (404)
 * {
 *   "error": "ItemNotFoundError",
 *   "message": "Item 7530110 não encontrado",
 *   "statusCode": 404,
 *   "context": { "itemCodigo": "7530110" }
 * }
 *
 * @example
 * // Tratamento específico
 * try {
 *   return await getItem('INVALID');
 * } catch (error) {
 *   if (error instanceof ItemNotFoundError) {
 *     console.log('Item não existe:', error.context.itemCodigo);
 *   }
 * }
 */
export class ItemNotFoundError extends AppError {
  constructor(itemCodigo: string) {
    super(404, `Item ${itemCodigo} não encontrado`, true, { itemCodigo });
  }
}

/**
 * ---------------------------------------------------------------------------
 * ERRO: FamiliaNotFoundError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando uma familia não é encontrada no sistema.
 *
 * @class FamiliaNotFoundError
 * @extends {AppError}
 *
 * @description
 * Erro específico para situações onde uma familia solicitada não existe
 * na base de dados. Sempre retorna statusCode 404.
 *
 * QUANDO USAR:
 * - Busca de familia por código retorna vazio
 * - Familia foi deletada ou nunca existiu
 * - Usuário tenta acessar familia inexistente
 *
 * PROPRIEDADES HERDADAS:
 * - statusCode: 404 (Not Found)
 * - isOperational: true (erro esperado)
 * - message: "Familia {codigo} não encontrada"
 * - context: { familiaCodigo: string }
 *
 * @param {string} familiaCodigo - Código da familia não encontrada
 *
 * @example
 * // No Service
 * const familia = await repository.findByCode('450000');
 * if (!familia) {
 *   throw new FamiliaNotFoundError('450000');
 * }
 *
 * @example
 * // Resposta HTTP (404)
 * {
 *   "error": "FamiliaNotFoundError",
 *   "message": "Familia 450000 não encontrada",
 *   "statusCode": 404,
 *   "context": { "familiaCodigo": "450000" }
 * }
 *
 * @example
 * // Tratamento específico
 * try {
 *   return await getItem('INVALID');
 * } catch (error) {
 *   if (error instanceof FamiliaNotFoundError) {
 *     console.log('Familia não existe:', error.context.FamiliaCodigo);
 *   }
 * }
 */
export class FamiliaNotFoundError extends AppError {
  constructor(familiaCodigo: string) {
    super(404, `Familia ${familiaCodigo} não encontrada`, true, { familiaCodigo });
  }
}

/**
 * ---------------------------------------------------------------------------
 * ERRO: EstabelecimentoNotFoundError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando um estabelecimento não é encontrado no sistema.
 *
 * @class EstabelecimentoNotFoundError
 * @extends {AppError}
 *
 * @description
 * Erro específico para situações onde um estabelecimento (filial)
 * solicitado não existe na base de dados.
 *
 * QUANDO USAR:
 * - Busca de estabelecimento por código retorna vazio
 * - Estabelecimento foi desativado ou nunca existiu
 * - Usuário tenta acessar estabelecimento inexistente
 *
 * PROPRIEDADES:
 * - statusCode: 404 (Not Found)
 * - isOperational: true
 * - message: "Estabelecimento {codigo} não encontrado"
 * - context: { estabCodigo: string }
 *
 * @param {string} estabCodigo - Código do estabelecimento (ex: "01.01")
 *
 * @example
 * const estab = await repository.findByCode('99.99');
 * if (!estab) {
 *   throw new EstabelecimentoNotFoundError('99.99');
 * }
 *
 * @example
 * // Resposta HTTP
 * {
 *   "error": "EstabelecimentoNotFoundError",
 *   "message": "Estabelecimento 99.99 não encontrado",
 *   "context": { "estabCodigo": "99.99" }
 * }
 */
export class EstabelecimentoNotFoundError extends AppError {
  constructor(estabCodigo: string) {
    super(404, `Estabelecimento ${estabCodigo} não encontrado`, true, { estabCodigo });
  }
}

/**
 * =============================================================================
 * CATEGORIA: VALIDATION (400)
 * =============================================================================
 */

/**
 * ---------------------------------------------------------------------------
 * ERRO: ValidationError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando dados de entrada falham na validação.
 *
 * @class ValidationError
 * @extends {AppError}
 *
 * @description
 * Erro genérico de validação usado quando dados fornecidos pelo cliente
 * não atendem aos requisitos esperados.
 *
 * QUANDO USAR:
 * - Campos obrigatórios ausentes
 * - Formato de dado inválido
 * - Valor fora do range permitido
 * - Falha em regra de validação
 *
 * PROPRIEDADES:
 * - statusCode: 400 (Bad Request)
 * - isOperational: true
 * - message: Mensagem customizada
 * - context: { fields?: Record<string, string> }
 *
 * CONTEXT FIELDS:
 * Objeto opcional com detalhes de validação por campo:
 * - Chave: Nome do campo
 * - Valor: Mensagem de erro específica
 *
 * @param {string} message - Mensagem geral do erro de validação
 * @param {Record<string, string>} [fields] - Detalhes por campo (opcional)
 *
 * @example
 * // Validação simples (sem detalhes de campos)
 * if (!itemCodigo) {
 *   throw new ValidationError('Código do item é obrigatório');
 * }
 *
 * @example
 * // Validação com detalhes de múltiplos campos
 * throw new ValidationError('Dados inválidos', {
 *   email: 'Formato inválido',
 *   idade: 'Deve ser maior que 18',
 *   telefone: 'Obrigatório'
 * });
 *
 * @example
 * // Resposta HTTP
 * {
 *   "error": "ValidationError",
 *   "message": "Dados inválidos",
 *   "context": {
 *     "fields": {
 *       "email": "Formato inválido",
 *       "idade": "Deve ser maior que 18"
 *     }
 *   }
 * }
 *
 * @example
 * // Uso em validator
 * function validateItem(data: any) {
 *   const errors: Record<string, string> = {};
 *
 *   if (!data.codigo) errors.codigo = 'Obrigatório';
 *   if (data.codigo?.length > 16) errors.codigo = 'Máximo 16 caracteres';
 *
 *   if (Object.keys(errors).length > 0) {
 *     throw new ValidationError('Validação falhou', errors);
 *   }
 * }
 */
export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super(400, message, true, { fields });
  }
}

/**
 * =============================================================================
 * CATEGORIA: DATABASE (500)
 * =============================================================================
 */

/**
 * ---------------------------------------------------------------------------
 * ERRO: DatabaseError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando ocorre erro na comunicação com banco de dados.
 *
 * @class DatabaseError
 * @extends {AppError}
 *
 * @description
 * Erro genérico para problemas relacionados ao banco de dados.
 * Encapsula erro original e adiciona contexto.
 *
 * QUANDO USAR:
 * - Query SQL falha
 * - Constraint violation
 * - Deadlock
 * - Erro de sintaxe SQL
 * - Conexão perdida durante query
 *
 * PROPRIEDADES:
 * - statusCode: 500 (Internal Server Error)
 * - isOperational: true
 * - message: "Erro no banco de dados: {detalhe}"
 * - context: { originalMessage, stack (apenas dev) }
 *
 * CONTEXT:
 * - originalMessage: Mensagem do erro original do banco
 * - stack: Stack trace (apenas em desenvolvimento)
 *
 * SEGURANÇA:
 * Stack trace do erro original só é incluído em desenvolvimento
 * para evitar vazamento de informações em produção.
 *
 * @param {string} message - Mensagem descritiva do erro
 * @param {Error} [originalError] - Erro original do banco (opcional)
 *
 * @example
 * // Captura erro de banco e re-lança como DatabaseError
 * try {
 *   await connection.query('SELECT * FROM item WHERE ...');
 * } catch (error) {
 *   throw new DatabaseError('Falha ao buscar item', error as Error);
 * }
 *
 * @example
 * // Resposta HTTP (Development)
 * {
 *   "error": "DatabaseError",
 *   "message": "Erro no banco de dados: Connection timeout",
 *   "context": {
 *     "originalMessage": "ETIMEDOUT",
 *     "stack": "Error: ETIMEDOUT\n  at ..."
 *   }
 * }
 *
 * @example
 * // Resposta HTTP (Production)
 * {
 *   "error": "DatabaseError",
 *   "message": "Erro no banco de dados: Connection timeout",
 *   "context": {
 *     "originalMessage": "ETIMEDOUT"
 *   }
 * }
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(500, `Erro no banco de dados: ${message}`, true, {
      originalMessage: originalError?.message,
      // Só inclui stack em desenvolvimento (segurança)
      ...(process.env.NODE_ENV === 'development' && {
        stack: originalError?.stack
      }),
    });
  }
}

/**
 * =============================================================================
 * CATEGORIA: TIMEOUT / SERVICE UNAVAILABLE (503)
 * =============================================================================
 */

/**
 * ---------------------------------------------------------------------------
 * ERRO: ConnectionTimeoutError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando conexão com serviço externo excede tempo limite.
 *
 * @class ConnectionTimeoutError
 * @extends {AppError}
 *
 * @description
 * Erro específico para timeouts de conexão com serviços externos
 * como banco de dados, APIs, microserviços, etc.
 *
 * QUANDO USAR:
 * - Conexão com banco de dados timeout
 * - API externa não responde
 * - Serviço lento ou sobrecarregado
 * - Network issues
 *
 * PROPRIEDADES:
 * - statusCode: 503 (Service Unavailable)
 * - isOperational: true
 * - message: "Timeout ao conectar com {serviço} após {ms}ms"
 * - context: { service: string, timeout: number }
 *
 * RETRY:
 * Cliente pode tentar novamente (503 indica temporário).
 *
 * @param {string} service - Nome do serviço (ex: "SQL Server", "API Externa")
 * @param {number} timeout - Tempo limite em milissegundos
 *
 * @example
 * const timeout = 30000; // 30s
 * const startTime = Date.now();
 *
 * try {
 *   await connection.connect();
 * } catch (error) {
 *   if (Date.now() - startTime >= timeout) {
 *     throw new ConnectionTimeoutError('SQL Server', timeout);
 *   }
 * }
 *
 * @example
 * // Resposta HTTP
 * {
 *   "error": "ConnectionTimeoutError",
 *   "message": "Timeout ao conectar com SQL Server após 30000ms",
 *   "context": {
 *     "service": "SQL Server",
 *     "timeout": 30000
 *   }
 * }
 */
export class ConnectionTimeoutError extends AppError {
  constructor(service: string, timeout: number) {
    super(
      503,
      `Timeout ao conectar com ${service} após ${timeout}ms`,
      true,
      { service, timeout }
    );
  }
}

/**
 * ---------------------------------------------------------------------------
 * ERRO: ExternalServiceError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando serviço externo retorna erro.
 *
 * @class ExternalServiceError
 * @extends {AppError}
 *
 * @description
 * Erro genérico para falhas em serviços externos (APIs, microserviços).
 *
 * QUANDO USAR:
 * - API externa retorna 5xx
 * - Microserviço está offline
 * - Serviço retorna resposta inválida
 * - Integração falha
 *
 * PROPRIEDADES:
 * - statusCode: 503 (Service Unavailable)
 * - isOperational: true
 * - message: "Erro no serviço {nome}: {detalhe}"
 * - context: { service: string }
 *
 * @param {string} service - Nome do serviço externo
 * @param {string} message - Mensagem descritiva do erro
 *
 * @example
 * const response = await fetch('https://api.externa.com/data');
 * if (!response.ok) {
 *   throw new ExternalServiceError(
 *     'API Externa',
 *     `Status ${response.status}: ${response.statusText}`
 *   );
 * }
 *
 * @example
 * // Resposta HTTP
 * {
 *   "error": "ExternalServiceError",
 *   "message": "Erro no serviço API Externa: Status 503",
 *   "context": { "service": "API Externa" }
 * }
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(503, `Erro no serviço ${service}: ${message}`, true, { service });
  }
}

/**
 * =============================================================================
 * CATEGORIA: CACHE (500)
 * =============================================================================
 */

/**
 * ---------------------------------------------------------------------------
 * ERRO: CacheError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando operação de cache falha.
 *
 * @class CacheError
 * @extends {AppError}
 *
 * @description
 * Erro específico para falhas em operações de cache.
 *
 * QUANDO USAR:
 * - Falha ao salvar no cache
 * - Falha ao recuperar do cache
 * - Falha ao invalidar cache
 * - Redis/Memcached offline
 *
 * PROPRIEDADES:
 * - statusCode: 500 (Internal Server Error)
 * - isOperational: true
 * - message: "Erro no cache ({operação}): {detalhe}"
 * - context: { operation: string }
 *
 * IMPORTANTE:
 * Aplicação deve continuar funcionando mesmo com cache offline
 * (degraded mode - busca direto do banco).
 *
 * @param {string} operation - Operação que falhou (get, set, delete, etc)
 * @param {string} message - Mensagem descritiva do erro
 *
 * @example
 * try {
 *   await cache.set('key', value);
 * } catch (error) {
 *   // Log mas não falha (degraded mode)
 *   log.warn(new CacheError('set', error.message));
 *   // Continua sem cache
 * }
 *
 * @example
 * // Resposta HTTP
 * {
 *   "error": "CacheError",
 *   "message": "Erro no cache (set): Connection refused",
 *   "context": { "operation": "set" }
 * }
 */
export class CacheError extends AppError {
  constructor(operation: string, message: string) {
    super(500, `Erro no cache (${operation}): ${message}`, true, { operation });
  }
}

/**
 * =============================================================================
 * CATEGORIA: AUTHENTICATION / AUTHORIZATION (401, 403)
 * =============================================================================
 */

/**
 * ---------------------------------------------------------------------------
 * ERRO: AuthenticationError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando usuário não está autenticado.
 *
 * @class AuthenticationError
 * @extends {AppError}
 *
 * @description
 * Erro para situações onde usuário precisa fazer login.
 *
 * QUANDO USAR:
 * - Token ausente
 * - Token inválido ou expirado
 * - Credenciais incorretas
 * - Sessão expirada
 *
 * PROPRIEDADES:
 * - statusCode: 401 (Unauthorized)
 * - isOperational: true
 * - message: "Não autenticado" (padrão) ou customizada
 *
 * RESPOSTA:
 * Cliente deve redirecionar para login ou refresh token.
 *
 * @param {string} [message='Não autenticado'] - Mensagem customizada
 *
 * @example
 * const token = req.headers.authorization;
 * if (!token) {
 *   throw new AuthenticationError();
 * }
 *
 * @example
 * // Com mensagem customizada
 * if (isTokenExpired(token)) {
 *   throw new AuthenticationError('Token expirado. Faça login novamente.');
 * }
 *
 * @example
 * // Resposta HTTP
 * {
 *   "error": "AuthenticationError",
 *   "message": "Não autenticado",
 *   "statusCode": 401
 * }
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autenticado') {
    super(401, message, true);
  }
}

/**
 * ---------------------------------------------------------------------------
 * ERRO: AuthorizationError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando usuário não tem permissão para ação.
 *
 * @class AuthorizationError
 * @extends {AppError}
 *
 * @description
 * Erro para situações onde usuário está autenticado mas não autorizado.
 *
 * QUANDO USAR:
 * - Usuário não tem role necessário
 * - Recurso pertence a outro usuário
 * - Ação bloqueada por permissão
 * - Tentativa de acesso a recurso restrito
 *
 * DIFERENÇA DE AuthenticationError:
 * - 401: Não autenticado (precisa fazer login)
 * - 403: Autenticado mas sem permissão (já logado)
 *
 * PROPRIEDADES:
 * - statusCode: 403 (Forbidden)
 * - isOperational: true
 * - message: "Não autorizado" (padrão) ou customizada
 *
 * @param {string} [message='Não autorizado'] - Mensagem customizada
 *
 * @example
 * if (req.user.role !== 'admin') {
 *   throw new AuthorizationError('Apenas administradores podem acessar');
 * }
 *
 * @example
 * if (resource.ownerId !== req.user.id) {
 *   throw new AuthorizationError('Você não tem permissão para este recurso');
 * }
 *
 * @example
 * // Resposta HTTP
 * {
 *   "error": "AuthorizationError",
 *   "message": "Apenas administradores podem acessar",
 *   "statusCode": 403
 * }
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(403, message, true);
  }
}

/**
 * =============================================================================
 * CATEGORIA: RATE LIMIT (429)
 * =============================================================================
 */

/**
 * ---------------------------------------------------------------------------
 * ERRO: RateLimitError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando usuário excede limite de requisições.
 *
 * @class RateLimitError
 * @extends {AppError}
 *
 * @description
 * Erro para situações onde rate limit foi excedido.
 *
 * QUANDO USAR:
 * - Muitas requisições em curto período
 * - Limite de API excedido
 * - Proteção contra abuso/DDoS
 *
 * PROPRIEDADES:
 * - statusCode: 429 (Too Many Requests)
 * - isOperational: true
 * - message: "Muitas requisições. Tente novamente em alguns segundos."
 * - context: { retryAfter?: number }
 *
 * RETRY-AFTER:
 * Tempo em segundos que cliente deve aguardar antes de tentar novamente.
 *
 * @param {number} [retryAfter] - Segundos para retry (opcional)
 *
 * @example
 * const limit = rateLimiter.check(userId);
 * if (limit.exceeded) {
 *   throw new RateLimitError(limit.retryAfter);
 * }
 *
 * @example
 * // Resposta HTTP
 * {
 *   "error": "RateLimitError",
 *   "message": "Muitas requisições. Tente novamente em alguns segundos.",
 *   "statusCode": 429,
 *   "context": { "retryAfter": 60 }
 * }
 *
 * @example
 * // Header Retry-After pode ser adicionado pelo middleware
 * res.setHeader('Retry-After', error.context.retryAfter);
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      429,
      'Muitas requisições. Tente novamente em alguns segundos.',
      true,
      { retryAfter }
    );
  }
}

/**
 * =============================================================================
 * CATEGORIA: CONFIGURATION (500)
 * =============================================================================
 */

/**
 * ---------------------------------------------------------------------------
 * ERRO: ConfigurationError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando há erro de configuração da aplicação.
 *
 * @class ConfigurationError
 * @extends {AppError}
 *
 * @description
 * Erro para problemas de configuração que impedem operação normal.
 *
 * QUANDO USAR:
 * - Variável de ambiente ausente
 * - Arquivo de config inválido
 * - Configuração conflitante
 * - Setup incorreto
 *
 * IMPORTANTE:
 * - isOperational: FALSE (é bug de configuração, não erro esperado)
 * - Deve ser corrigido antes de deploy
 * - Aplicação não deve iniciar com erro de config
 *
 * PROPRIEDADES:
 * - statusCode: 500 (Internal Server Error)
 * - isOperational: false (BUG!)
 * - message: "Erro de configuração: {detalhe}"
 *
 * @param {string} message - Descrição do erro de configuração
 *
 * @example
 * if (!process.env.DATABASE_URL) {
 *   throw new ConfigurationError('DATABASE_URL não configurada');
 * }
 *
 * @example
 * if (config.timeout < 0) {
 *   throw new ConfigurationError('Timeout não pode ser negativo');
 * }
 *
 * @example
 * // Log (erro não operacional - level error)
 * {
 *   "level": "error",
 *   "message": "Erro de configuração: DATABASE_URL não configurada",
 *   "isOperational": false  // <- BUG, não erro esperado
 * }
 */
export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(500, `Erro de configuração: ${message}`, false); // isOperational: false!
  }
}

/**
 * =============================================================================
 * CATEGORIA: BUSINESS RULE (422)
 * =============================================================================
 */

/**
 * ---------------------------------------------------------------------------
 * ERRO: BusinessRuleError
 * ---------------------------------------------------------------------------
 *
 * Lançado quando regra de negócio é violada.
 *
 * @class BusinessRuleError
 * @extends {AppError}
 *
 * @description
 * Erro para violações de regras de negócio específicas da aplicação.
 *
 * QUANDO USAR:
 * - Regra de negócio não satisfeita
 * - Estado inválido para operação
 * - Constraint de domínio violada
 * - Workflow incorreto
 *
 * DIFERENÇA DE ValidationError:
 * - 400 (ValidationError): Formato/tipo de dado inválido
 * - 422 (BusinessRuleError): Dados válidos mas regra de negócio falha
 *
 * EXEMPLOS:
 * - Não pode vender item com estoque negativo
 * - Pedido já foi fechado, não pode ser editado
 * - Usuário menor de idade não pode fazer compra
 * - Valor do pedido abaixo do mínimo
 *
 * PROPRIEDADES:
 * - statusCode: 422 (Unprocessable Entity)
 * - isOperational: true
 * - message: Descrição da regra violada
 * - context: { rule?: string }
 *
 * @param {string} message - Descrição da regra violada
 * @param {string} [rule] - Código/nome da regra (opcional)
 *
 * @example
 * if (item.estoque < quantidade) {
 *   throw new BusinessRuleError(
 *     'Estoque insuficiente para esta operação',
 *     'ESTOQUE_INSUFICIENTE'
 *   );
 * }
 *
 * @example
 * if (pedido.status === 'FECHADO') {
 *   throw new BusinessRuleError(
 *     'Pedido já foi fechado e não pode ser alterado',
 *     'PEDIDO_FECHADO'
 *   );
 * }
 *
 * @example
 * // Resposta HTTP
 * {
 *   "error": "BusinessRuleError",
 *   "message": "Estoque insuficiente para esta operação",
 *   "statusCode": 422,
 *   "context": { "rule": "ESTOQUE_INSUFICIENTE" }
 * }
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, rule?: string) {
    super(422, message, true, { rule });
  }
}