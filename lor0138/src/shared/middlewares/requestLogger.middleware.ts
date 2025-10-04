// src/shared/middlewares/requestLogger.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../utils/logger'; // ✅ CORRIGIDO: path relativo

// Estende o Request do Express para incluir requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

/**
 * Middleware que adiciona Request ID e loga todas as requisições
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Gera ID único para rastrear a requisição
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Adiciona Request ID no header da resposta
  res.setHeader('X-Request-ID', req.requestId);

  // Loga início da requisição
  log.http('Requisição recebida', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Intercepta o fim da resposta para logar
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - req.startTime;
    
    // Loga resposta
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    log[logLevel]('Requisição finalizada', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: duration,
      ip: req.ip,
    });

    // Se for erro, loga detalhes adicionais
    if (res.statusCode >= 500) {
      log.error('Erro no servidor', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        response: typeof data === 'string' ? data : JSON.stringify(data),
      });
    }

    return originalSend.call(this, data);
  };

  next();
}