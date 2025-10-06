// src/shared/middlewares/errorHandler.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@shared/errors/AppError';
import { log } from '../utils/logger';

/**
 * =============================================================================
 * MIDDLEWARE - TRATAMENTO CENTRALIZADO DE ERROS
 * =============================================================================
 *
 * Sistema de tratamento centralizado de erros para Express com suporte a:
 * - Erros customizados (AppError e subclasses)
 * - Sanitização automática de mensagens sensíveis
 * - Logging diferenciado (operacional vs crítico)
 * - Respostas padronizadas JSON
 * - Modo desenvolvimento vs produção
 *
 * @module ErrorHandler
 * @category Middlewares
 * @subcategory ErrorHandling
 *
 * RESPONSABILIDADES:
 * - Capturar todos os erros não tratados da aplicação
 * - Identificar tipo de erro (operacional vs sistema)
 * - Sanitizar informações sensíveis
 * - Registrar logs apropriados
 * - Retornar resposta HTTP padronizada
 * - Prevenir leak de informações em produção
 *
 * ARQUITETURA:
 * - Middleware de erro global (4 parâmetros)
 * - Últim middleware na cadeia do Express
 * - Integrado com sistema de AppError customizado
 * - Logging via Winston estruturado
 *
 * PADRÃO DE PROJETO:
 * - Error Handler Pattern
 * - Fail Safe Pattern (não propaga erros do handler)
 * - Sanitization Pattern (remove dados sensíveis)
 *
 * PONTOS CRÍTICOS:
 * - DEVE ser o último middleware registrado
 * - Usa 4 parâmetros (err, req, res, next) - assinatura obrigatória
 * - Verifica res.headersSent para evitar double-response
 * - Diferencia erros operacionais de bugs/crashes
 *
 * =============================================================================
 */

/**
 * ---------------------------------------------------------------------------
 * FUNÇÃO: sanitizeErrorMessage
 * ---------------------------------------------------------------------------
 *
 * Remove informações sensíveis e técnicas das mensagens de erro.
 *
 * @description
 * Sanitiza mensagens de erro antes de enviá-las ao cliente,
 * removendo detalhes que não devem ser expostos:
 * - Caminhos de arquivos do servidor
 * - Queries SQL completas
 * - Endereços IP de servidores
 * - Credenciais de banco de dados
 * - Stack traces detalhados
 *
 * PROPÓSITO:
 * - Segurança: Previne vazamento de informações do sistema
 * - Compliance: LGPD/GDPR - não expor dados técnicos
 * - UX: Mensagens mais amigáveis ao usuário final
 * - Debug: Informações técnicas ficam apenas nos logs
 *
 * PADRÕES REMOVIDOS:
 * - Caminhos de arquivo: /path/to/file.ts → [arquivo]
 * - Queries SQL: SELECT * FROM item → consulta SQL
 * - Endereços IP: 192.168.1.100 → [servidor]
 * - Credenciais: user=admin → user=[oculto]
 * - Senhas: password=123 → password=[oculto]
 *
 * PONTOS CRÍTICOS:
 * - Usa regex case-insensitive (flag 'i')
 * - Preserva contexto da mensagem (não remove tudo)
 * - Substitui por placeholders descritivos
 * - Não afeta logging interno (apenas resposta HTTP)
 *
 * @private
 * @function sanitizeErrorMessage
 *
 * @param {any} error - Erro a ter mensagem sanitizada
 *
 * @returns {string} Mensagem sanitizada sem informações sensíveis
 *
 * @example
 * // Entrada
 * const error = new Error('Query failed: SELECT * FROM item WHERE user=admin password=123');
 *
 * // Saída
 * sanitizeErrorMessage(error);
 * // "Query failed: consulta SQL WHERE user=[oculto] password=[oculto]"
 *
 * @example
 * // Entrada com caminho de arquivo
 * const error = new Error('Error in /home/app/src/controllers/item.controller.ts');
 *
 * // Saída
 * sanitizeErrorMessage(error);
 * // "Error in [arquivo]"
 *
 * @example
 * // Entrada com IP de servidor
 * const error = new Error('Connection failed to 10.105.0.4:1433');
 *
 * // Saída
 * sanitizeErrorMessage(error);
 * // "Connection failed to [servidor]"
 */
function sanitizeErrorMessage(error: any): string {
  // Extrai mensagem original (usa 'Erro desconhecido' se não houver)
  const message = error.message || 'Erro desconhecido';

  // ---------------------------------------------------------------------------
  // SANITIZAÇÃO 1: Caminhos de Arquivo
  // ---------------------------------------------------------------------------
  // Remove: /path/to/file.ts, /path/to/file.js, etc
  // Substitui por: [arquivo]
  let sanitized = message.replace(/\/[^\s]+\.(ts|js|tsx|jsx)/gi, '[arquivo]');

  // ---------------------------------------------------------------------------
  // SANITIZAÇÃO 2: Queries SQL SELECT
  // ---------------------------------------------------------------------------
  // Remove: SELECT ... FROM table
  // Substitui por: consulta SQL
  sanitized = sanitized.replace(/SELECT\s+.*?FROM/gi, 'consulta SQL');

  // ---------------------------------------------------------------------------
  // SANITIZAÇÃO 3: Queries SQL INSERT
  // ---------------------------------------------------------------------------
  // Remove: INSERT INTO table ...
  // Substitui por: operação de inserção
  sanitized = sanitized.replace(/INSERT\s+INTO/gi, 'operação de inserção');

  // ---------------------------------------------------------------------------
  // SANITIZAÇÃO 4: Queries SQL UPDATE
  // ---------------------------------------------------------------------------
  // Remove: UPDATE table SET ...
  // Substitui por: operação de atualização
  sanitized = sanitized.replace(/UPDATE\s+.*?SET/gi, 'operação de atualização');

  // ---------------------------------------------------------------------------
  // SANITIZAÇÃO 5: Endereços IP
  // ---------------------------------------------------------------------------
  // Remove: 192.168.1.100, 10.0.0.1:1433, etc
  // Substitui por: [servidor]
  sanitized = sanitized.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/g, '[servidor]');

  // ---------------------------------------------------------------------------
  // SANITIZAÇÃO 6: Credenciais de Usuário
  // ---------------------------------------------------------------------------
  // Remove: user=admin, USER=root, etc
  // Substitui por: user=[oculto]
  sanitized = sanitized.replace(/user=\w+/gi, 'user=[oculto]');

  // ---------------------------------------------------------------------------
  // SANITIZAÇÃO 7: Senhas
  // ---------------------------------------------------------------------------
  // Remove: password=123, PASSWORD=secret, etc
  // Substitui por: password=[oculto]
  sanitized = sanitized.replace(/password=\w+/gi, 'password=[oculto]');

  return sanitized;
}

/**
 * ---------------------------------------------------------------------------
 * MIDDLEWARE: errorHandler
 * ---------------------------------------------------------------------------
 *
 * Middleware global de tratamento centralizado de erros.
 *
 * @description
 * Middleware de erro do Express (4 parâmetros) que captura todos os erros
 * não tratados da aplicação e retorna resposta HTTP padronizada.
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Verifica se headers já foram enviados (evita double-response)
 * 2. Identifica tipo de erro (AppError vs Error genérico)
 * 3. Extrai statusCode, isOperational e context
 * 4. Registra log apropriado (warn vs error)
 * 5. Monta resposta JSON padronizada
 * 6. Sanitiza mensagem em produção
 * 7. Inclui stack trace apenas em desenvolvimento
 * 8. Envia resposta HTTP ao cliente
 *
 * TIPOS DE ERRO TRATADOS:
 * - AppError: Erros customizados (ValidationError, ItemNotFoundError, etc)
 * - Error: Erros genéricos do JavaScript/Node.js
 * - Qualquer: Fallback para erros desconhecidos
 *
 * LOGGING DIFERENCIADO:
 * - Operacional (warn): Esperado, não requer atenção urgente
 * - Não operacional (error): Inesperado, requer investigação
 *
 * RESPOSTAS POR AMBIENTE:
 * - Development: Inclui stack trace e mensagem completa
 * - Production: Sanitiza mensagem e oculta detalhes técnicos
 *
 * PONTOS CRÍTICOS:
 * - DEVE ter exatamente 4 parâmetros (assinatura Express)
 * - DEVE ser o último middleware (depois de todas as rotas)
 * - Verifica res.headersSent antes de enviar resposta
 * - Nunca propaga erro (catch-all final)
 * - Usa requestId/correlationId para rastreamento
 *
 * @middleware
 * @function errorHandler
 *
 * @param {Error | AppError} err - Erro capturado
 * @param {Request} req - Objeto de requisição Express
 * @param {Response} res - Objeto de resposta Express
 * @param {NextFunction} next - Função para próximo middleware
 *
 * @returns {void} Envia resposta HTTP JSON ao cliente
 *
 * @example
 * // Registro no app.ts (DEVE ser o último middleware)
 * import { errorHandler } from '@shared/middlewares/errorHandler.middleware';
 *
 * app.use(routes);           // Rotas primeiro
 * app.use(errorHandler);     // Handler de erro por último
 *
 * @example
 * // Erro operacional (ValidationError)
 * // Request: GET /api/items?codigo=
 * // Response: 400
 * {
 *   "error": "ValidationError",
 *   "message": "Código é obrigatório",
 *   "timestamp": "2025-10-06T14:30:00.000Z",
 *   "path": "/api/items",
 *   "requestId": "abc-123",
 *   "context": { "field": "codigo" }
 * }
 *
 * @example
 * // Erro não operacional (TypeError)
 * // Development Response: 500
 * {
 *   "error": "TypeError",
 *   "message": "Cannot read property 'id' of undefined",
 *   "timestamp": "2025-10-06T14:30:00.000Z",
 *   "path": "/api/items",
 *   "requestId": "abc-123",
 *   "stack": ["at Controller.getItem", "at Layer.handle", ...]
 * }
 *
 * @example
 * // Production Response (mesmo erro)
 * {
 *   "error": "Error",
 *   "message": "Erro interno do servidor. Tente novamente mais tarde.",
 *   "timestamp": "2025-10-06T14:30:00.000Z",
 *   "path": "/api/items",
 *   "requestId": "abc-123"
 * }
 *
 * @see {@link AppError}
 * @see {@link sanitizeErrorMessage}
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // ---------------------------------------------------------------------------
  // VERIFICAÇÃO: Headers Já Enviados
  // ---------------------------------------------------------------------------
  // Se headers já foram enviados, não podemos enviar nova resposta
  // Passa erro para handler padrão do Express (evita crash)
  if (res.headersSent) {
    return next(err);
  }

  // ---------------------------------------------------------------------------
  // IDENTIFICAÇÃO: Tipo de Erro
  // ---------------------------------------------------------------------------
  // Extrai informações do erro (diferencia AppError de Error genérico)
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;
  const context = err instanceof AppError ? err.context : undefined;

  // ---------------------------------------------------------------------------
  // LOGGING: Diferenciado por Tipo
  // ---------------------------------------------------------------------------
  if (isOperational) {
    // ---------------------------------------------------------------------------
    // CASO 1: Erro Operacional (Esperado)
    // ---------------------------------------------------------------------------
    // Exemplos: ValidationError, ItemNotFoundError, AuthenticationError
    // Nível: warn (não requer atenção urgente)
    // Não inclui stack trace (comportamento esperado)
    log.warn('Erro operacional', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message: err.message,
      context,
    });
  } else {
    // ---------------------------------------------------------------------------
    // CASO 2: Erro Não Operacional (Inesperado - Bug/Crash)
    // ---------------------------------------------------------------------------
    // Exemplos: TypeError, ReferenceError, erros de sistema
    // Nível: error (requer investigação)
    // Inclui stack trace completo para debug
    log.error('Erro não operacional', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      stack: err.stack,
    });
  }

  // ---------------------------------------------------------------------------
  // RESPOSTA: Modo Desenvolvimento
  // ---------------------------------------------------------------------------
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // ---------------------------------------------------------------------------
    // DESENVOLVIMENTO: Informações Completas
    // ---------------------------------------------------------------------------
    // Inclui todos os detalhes para facilitar debugging:
    // - Mensagem original sem sanitização
    // - Stack trace (primeiras 5 linhas)
    // - Context completo
    // - Nome do erro
    return res.status(statusCode).json({
      error: err.name || 'Error',
      message: err.message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      requestId: req.requestId,
      context,
      stack: err.stack?.split('\n').slice(0, 5), // Primeiras 5 linhas
    });
  }

  // ---------------------------------------------------------------------------
  // RESPOSTA: Modo Produção (Sanitizada)
  // ---------------------------------------------------------------------------
  // Sanitiza mensagem para não expor detalhes técnicos
  const userMessage = isOperational
    ? sanitizeErrorMessage(err)  // Erro operacional: sanitiza mas mantém contexto
    : 'Erro interno do servidor. Tente novamente mais tarde.'; // Erro de sistema: mensagem genérica

  res.status(statusCode).json({
    error: err.name || 'Error',
    message: userMessage,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    requestId: req.requestId,
  });
}

/**
 * ---------------------------------------------------------------------------
 * MIDDLEWARE: notFoundHandler
 * ---------------------------------------------------------------------------
 *
 * Middleware para capturar rotas não encontradas (404).
 *
 * @description
 * Middleware que captura todas as requisições que não bateram
 * em nenhuma rota definida e retorna erro 404 padronizado.
 *
 * QUANDO É EXECUTADO:
 * - Quando nenhuma rota corresponde ao path solicitado
 * - ANTES do errorHandler (passa erro via next)
 * - Para qualquer método HTTP (GET, POST, PUT, DELETE, etc)
 *
 * FLUXO:
 * 1. Requisição não bate em nenhuma rota
 * 2. notFoundHandler é executado
 * 3. Cria AppError 404 com detalhes da rota
 * 4. Passa erro via next(error)
 * 5. errorHandler processa o erro 404
 * 6. Resposta 404 é enviada ao cliente
 *
 * PONTOS CRÍTICOS:
 * - DEVE vir após todas as rotas
 * - DEVE vir antes do errorHandler
 * - Passa erro via next() (não envia resposta diretamente)
 * - Inclui método e path no context
 *
 * @middleware
 * @function notFoundHandler
 *
 * @param {Request} req - Objeto de requisição Express
 * @param {Response} res - Objeto de resposta Express
 * @param {NextFunction} next - Função para próximo middleware (errorHandler)
 *
 * @returns {void} Passa erro 404 para errorHandler via next()
 *
 * @example
 * // Registro no app.ts (após rotas, antes de errorHandler)
 * import { notFoundHandler, errorHandler } from '@shared/middlewares/errorHandler.middleware';
 *
 * app.use(routes);           // Rotas definidas
 * app.use(notFoundHandler);  // Captura 404
 * app.use(errorHandler);     // Trata todos os erros
 *
 * @example
 * // Request para rota inexistente
 * // GET /api/rota-inexistente
 *
 * // Resposta: 404
 * {
 *   "error": "AppError",
 *   "message": "Rota não encontrada: GET /api/rota-inexistente",
 *   "timestamp": "2025-10-06T14:30:00.000Z",
 *   "path": "/api/rota-inexistente",
 *   "requestId": "abc-123",
 *   "context": {
 *     "method": "GET",
 *     "path": "/api/rota-inexistente"
 *   }
 * }
 *
 * @see {@link AppError}
 * @see {@link errorHandler}
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  // ---------------------------------------------------------------------------
  // CRIAÇÃO: Erro 404 Customizado
  // ---------------------------------------------------------------------------
  // Cria instância de AppError com:
  // - statusCode: 404 (Not Found)
  // - message: Inclui método e path da requisição
  // - isOperational: true (erro esperado)
  // - context: Detalhes da requisição (method + path)
  const error = new AppError(
    404,
    `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    true,
    { method: req.method, path: req.originalUrl }
  );

  // ---------------------------------------------------------------------------
  // PROPAGAÇÃO: Passa para errorHandler
  // ---------------------------------------------------------------------------
  // Não envia resposta diretamente
  // Passa erro via next() para ser processado pelo errorHandler
  next(error);
}

/**
 * ---------------------------------------------------------------------------
 * HELPER: asyncHandler
 * ---------------------------------------------------------------------------
 *
 * Wrapper para funções assíncronas de controller/middleware.
 *
 * @description
 * Helper que envolve funções assíncronas e captura automaticamente
 * erros rejeitados (Promise.reject), passando-os para next().
 *
 * SEM asyncHandler:
 * ```typescript
 * async (req, res, next) => {
 *   try {
 *     await someAsyncOperation();
 *   } catch (error) {
 *     next(error); // Deve chamar manualmente
 *   }
 * }
 * ```
 *
 * COM asyncHandler:
 * ```typescript
 * asyncHandler(async (req, res, next) => {
 *   await someAsyncOperation(); // Erros capturados automaticamente
 * });
 * ```
 *
 * BENEFÍCIOS:
 * - Elimina try/catch repetitivo
 * - Garante que erros assíncronos sejam capturados
 * - Código mais limpo e legível
 * - Previne "unhandled promise rejection"
 *
 * QUANDO USAR:
 * - Em todos os controllers assíncronos
 * - Em middlewares que fazem operações assíncronas
 * - Em routes que chamam banco de dados
 * - Em qualquer handler que retorna Promise
 *
 * PONTOS CRÍTICOS:
 * - Usa Promise.resolve() para garantir Promise
 * - .catch(next) passa erro automaticamente
 * - Funciona com async/await e Promises
 * - Não afeta funções síncronas
 *
 * @function asyncHandler
 *
 * @param {Function} fn - Função assíncrona a ser envolvida
 *
 * @returns {Function} Função que retorna Promise capturada
 *
 * @example
 * // Uso em controller
 * import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
 * import { ItemNotFoundError } from '@shared/errors';
 *
 * export class ItemController {
 *   static getItem = asyncHandler(async (req, res, next) => {
 *     const item = await ItemService.getItem(req.params.id);
 *
 *     if (!item) {
 *       throw new ItemNotFoundError(req.params.id); // Capturado automaticamente
 *     }
 *
 *     res.json({ success: true, data: item });
 *   });
 * }
 *
 * @example
 * // Uso em middleware
 * const checkAuth = asyncHandler(async (req, res, next) => {
 *   const token = req.headers.authorization;
 *   const user = await verifyToken(token); // Erros capturados
 *
 *   if (!user) {
 *     throw new AuthenticationError(); // Capturado automaticamente
 *   }
 *
 *   req.user = user;
 *   next();
 * });
 *
 * @example
 * // Comparação: COM vs SEM asyncHandler
 *
 * // SEM asyncHandler (verboso)
 * static getItem = async (req, res, next) => {
 *   try {
 *     const item = await ItemService.getItem(req.params.id);
 *     if (!item) throw new ItemNotFoundError(req.params.id);
 *     res.json({ data: item });
 *   } catch (error) {
 *     next(error); // Manual
 *   }
 * };
 *
 * // COM asyncHandler (limpo)
 * static getItem = asyncHandler(async (req, res, next) => {
 *   const item = await ItemService.getItem(req.params.id);
 *   if (!item) throw new ItemNotFoundError(req.params.id);
 *   res.json({ data: item });
 *   // Erros capturados automaticamente
 * });
 *
 * @see {@link errorHandler}
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    // ---------------------------------------------------------------------------
    // EXECUÇÃO: Envolve em Promise.resolve
    // ---------------------------------------------------------------------------
    // Promise.resolve() garante que fn() retorna Promise
    // Funciona mesmo se fn não for async
    // .catch(next) captura qualquer erro rejeitado
    // Passa erro para errorHandler via next()
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}