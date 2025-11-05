// src/shared/middlewares/requestLogger.middleware.ts

/**
 * Middleware de logging de requisições HTTP
 * @module shared/middlewares/requestLogger
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../utils/logger';

// ====================================================================
// EXTENSÕES DE TIPOS
// ====================================================================

/**
 * Estende o Request do Express para incluir propriedades customizadas
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      startTime?: number;
    }
  }
}

// ====================================================================
// MIDDLEWARE PRINCIPAL
// ====================================================================

/**
 * Middleware de logging de requisições
 *
 * Registra logs detalhados de todas as requisições HTTP.
 * Gera ID único, calcula duração, e escolhe nível de log apropriado.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Gera ID único para rastrear a requisição
  req.requestId = uuidv4();

  // Marca timestamp do início da requisição
  req.startTime = Date.now();

  // Adiciona Request ID no header da resposta
  res.setHeader('X-Request-ID', req.requestId);

  // Loga informações iniciais da requisição
  log.http('Requisição recebida', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Preserva referência original do método res.send()
  const originalSend = res.send;

  // Sobrescreve res.send() para interceptar resposta
  res.send = function (data: any): Response {
    // Calcular duração da requisição
    const duration = Date.now() - (req.startTime || 0);

    // Determinar nível de log baseado no status code
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';

    // Logar finalização da requisição
    log[logLevel]('Requisição finalizada', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: duration,
      ip: req.ip,
    });

    // Se for erro do servidor (5xx), logar detalhes adicionais
    if (res.statusCode >= 500) {
      log.error('Erro no servidor', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        response: typeof data === 'string' ? data : JSON.stringify(data),
      });
    }

    // Chamar método original para enviar resposta
    return originalSend.call(this, data);
  };

  // Passar controle para próximo middleware
  next();
}

// ====================================================================
// UTILITÁRIOS
// ====================================================================

/**
 * Extrai Request ID do objeto de requisição
 */
export function getRequestId(req: Request): string {
  return req.requestId || 'unknown';
}

/**
 * Adiciona Request ID em objetos de log
 */
export function withRequestId(
  req: Request,
  logData: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...logData,
    requestId: req.requestId,
  };
}

/**
 * Calcula duração de uma requisição
 */
export function getRequestDuration(req: Request): number {
  if (!req.startTime) {
    return 0;
  }
  return Date.now() - req.startTime;
}

/**
 * Formata informações da requisição para log
 */
export function formatRequestInfo(req: Request) {
  return {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
    startTime: req.startTime,
  };
}
