// @ts-nocheck
// src/shared/middlewares/errorHandler.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@shared/errors/AppError';
import { log } from '../utils/logger';

/**
 * Sanitiza mensagem de erro (mantido do seu código)
 */
function sanitizeErrorMessage(error: any): string {
  const message = error.message || 'Erro desconhecido';
  
  let sanitized = message.replace(/\/[^\s]+\.(ts|js|tsx|jsx)/gi, '[arquivo]');
  sanitized = sanitized.replace(/SELECT\s+.*?FROM/gi, 'consulta SQL');
  sanitized = sanitized.replace(/INSERT\s+INTO/gi, 'operação de inserção');
  sanitized = sanitized.replace(/UPDATE\s+.*?SET/gi, 'operação de atualização');
  sanitized = sanitized.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/g, '[servidor]');
  sanitized = sanitized.replace(/user=\w+/gi, 'user=[oculto]');
  sanitized = sanitized.replace(/password=\w+/gi, 'password=[oculto]');
  
  return sanitized;
}

/**
 * Middleware global de tratamento de erros
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;
  const context = err instanceof AppError ? err.context : undefined;

  // Log baseado no tipo
  if (isOperational) {
    log.warn('Erro operacional', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message: err.message,
      context,
    });
  } else {
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

  // Produção: sanitiza mensagem
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

/**
 * 404 - Rota não encontrada
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(
    404,
    `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    true,
    { method: req.method, path: req.originalUrl }
  );
  next(error);
}

/**
 * asyncHandler (mantido do seu código)
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}