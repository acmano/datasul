// src/shared/middlewares/errorHandler.middleware.ts

/**
 * Middleware de tratamento centralizado de erros
 *
 * @module shared/middlewares/errorHandler
 * @see errorHandler.middleware.md para documentação completa
 *
 * Funcionalidades:
 * - Tratamento de AppError e erros genéricos
 * - Sanitização de mensagens sensíveis
 * - Logging diferenciado (operacional vs crítico)
 * - Respostas JSON padronizadas
 * - Modo development vs production
 *
 * Exports:
 * - errorHandler: Middleware global de erros (4 parâmetros)
 * - notFoundHandler: Captura rotas 404
 * - asyncHandler: Wrapper para funções async
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@shared/errors/AppError';
import { log } from '../utils/logger';

// ============================================================================
// SANITIZAÇÃO
// ============================================================================

/**
 * Remove informações sensíveis das mensagens de erro
 * Sanitiza: caminhos, queries SQL, IPs, credenciais
 */
function sanitizeErrorMessage(error: unknown): string {
  const message = (error as Error).message || 'Erro desconhecido';

  const sanitized = message
    // Caminhos de arquivo
    .replace(/\/[^\s]+\.(ts|js|tsx|jsx)/gi, '[arquivo]')
    // Queries SQL
    .replace(/SELECT\s+.*?FROM/gi, 'consulta SQL')
    .replace(/INSERT\s+INTO/gi, 'operação de inserção')
    .replace(/UPDATE\s+.*?SET/gi, 'operação de atualização')
    // IPs
    .replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/g, '[servidor]')
    // Credenciais
    .replace(/user=\w+/gi, 'user=[oculto]')
    .replace(/password=\w+/gi, 'password=[oculto]');

  return sanitized;
}

// ============================================================================
// MIDDLEWARE DE ERRO GLOBAL
// ============================================================================

/**
 * Middleware global de tratamento de erros
 * IMPORTANTE: Deve ser o ÚLTIMO middleware registrado (após rotas)
 * Requer 4 parâmetros (assinatura Express)
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Se headers já foram enviados, passa para handler padrão
  if (res.headersSent) {
    return next(err);
  }

  // Extrai informações do erro
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;
  const context = err instanceof AppError ? err.context : undefined;

  // Logging diferenciado
  if (isOperational) {
    // Erro esperado (warn)
    log.warn('Erro operacional', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message: err.message,
      context,
    });
  } else {
    // Erro inesperado (error)
    log.error('Erro não operacional', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      stack: err.stack,
    });
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // Development: Informações completas
    return res.status(statusCode).json({
      error: err.name || 'Error',
      message: err.message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      requestId: req.requestId,
      context,
      stack: err.stack?.split('\n').slice(0, 5),
    });
  }

  // Production: Mensagem sanitizada
  const userMessage = isOperational
    ? sanitizeErrorMessage(err)
    : 'Erro interno do servidor. Tente novamente mais tarde.';

  res.status(statusCode).json({
    error: err.name || 'Error',
    message: userMessage,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    requestId: req.requestId,
  });
}

// ============================================================================
// MIDDLEWARE 404
// ============================================================================

/**
 * Middleware para capturar rotas não encontradas (404)
 * Deve vir após todas as rotas, antes do errorHandler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(404, `Rota não encontrada: ${req.method} ${req.originalUrl}`, true, {
    method: req.method,
    path: req.originalUrl,
  });

  next(error);
}

// ============================================================================
// ASYNC HANDLER
// ============================================================================

/**
 * Wrapper para funções assíncronas
 * Captura erros automaticamente e passa para errorHandler
 * Elimina necessidade de try/catch repetitivo
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
