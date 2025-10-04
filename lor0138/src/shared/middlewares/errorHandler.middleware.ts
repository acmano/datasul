// src/shared/middlewares/errorHandler.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger'; // ✅ CORRIGIDO: path relativo

/**
 * Tipos de erro conhecidos
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Sanitiza mensagem de erro removendo informações sensíveis
 */
function sanitizeErrorMessage(error: any): string {
  const message = error.message || 'Erro desconhecido';
  
  // Remove caminhos de arquivo
  let sanitized = message.replace(/\/[^\s]+\.(ts|js|tsx|jsx)/gi, '[arquivo]');
  
  // Remove detalhes de SQL
  sanitized = sanitized.replace(/SELECT\s+.*?FROM/gi, 'consulta SQL');
  sanitized = sanitized.replace(/INSERT\s+INTO/gi, 'operação de inserção');
  sanitized = sanitized.replace(/UPDATE\s+.*?SET/gi, 'operação de atualização');
  
  // Remove IPs e portas
  sanitized = sanitized.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/g, '[servidor]');
  
  // Remove nomes de usuário/senha em connection strings
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
  // Se já foi enviada resposta, passa para o Express
  if (res.headersSent) {
    return next(err);
  }

  // Determina status code
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  
  // Loga erro completo no servidor usando Winston
  log.error('Erro na aplicação', {
    requestId: (req as any).requestId || (req as any).id,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    statusCode,
    errorName: err.constructor.name,
    errorMessage: err.message,
    stack: err.stack,
  });

  // Mensagens amigáveis por tipo de erro
  const errorMessages: { [key: number]: string } = {
    400: 'Requisição inválida. Verifique os dados enviados.',
    401: 'Autenticação necessária.',
    403: 'Acesso negado.',
    404: 'Recurso não encontrado.',
    429: 'Muitas requisições. Aguarde um momento.',
    500: 'Erro interno do servidor. Tente novamente mais tarde.',
    502: 'Erro de comunicação com o servidor.',
    503: 'Serviço temporariamente indisponível.',
  };

  // Em desenvolvimento, mostra mais detalhes
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return res.status(statusCode).json({
      success: false,
      error: err.message || errorMessages[statusCode] || 'Erro desconhecido',
      details: {
        type: err.constructor.name,
        stack: err.stack?.split('\n').slice(0, 3), // Primeiras 3 linhas do stack
        requestId: (req as any).requestId || (req as any).id,
      },
    });
  }

  // Em produção, mensagens genéricas e seguras
  const userMessage = err instanceof AppError && err.isOperational
    ? sanitizeErrorMessage(err)
    : errorMessages[statusCode] || 'Ocorreu um erro. Tente novamente mais tarde.';

  res.status(statusCode).json({
    success: false,
    error: userMessage,
    requestId: (req as any).requestId || (req as any).id,
  });
}

/**
 * Middleware para capturar erros assíncronos
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}