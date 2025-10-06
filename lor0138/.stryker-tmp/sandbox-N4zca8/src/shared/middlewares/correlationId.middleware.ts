// @ts-nocheck
// src/shared/middlewares/correlationId.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@shared/utils/logger';

/**
 * Middleware de Correlation ID
 * 
 * Funcionalidades:
 * 1. Aceita correlation ID do cliente (headers: X-Correlation-ID, X-Request-ID, correlation-id)
 * 2. Gera novo UUID se não fornecido
 * 3. Adiciona ao objeto request (req.id)
 * 4. Retorna no header X-Correlation-ID
 * 5. Adiciona timestamp para métricas de performance
 * 
 * @example
 * // Cliente envia:
 * curl -H "X-Correlation-ID: abc-123" http://lor0138.lorenzetti.ibe:3000/api/...
 * 
 * // Servidor usa "abc-123" e retorna no header:
 * X-Correlation-ID: abc-123
 * 
 * // Se cliente não enviar, servidor gera:
 * X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
 */
export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. Tenta pegar correlation ID dos headers do cliente (ordem de prioridade)
  const clientCorrelationId = 
    req.headers['x-correlation-id'] as string ||
    req.headers['x-request-id'] as string ||
    req.headers['correlation-id'] as string;

  // 2. Usa ID do cliente ou gera novo UUID
  const correlationId = clientCorrelationId || uuidv4();

  // 3. Adiciona ao request para uso em toda aplicação
  req.id = correlationId;

  // 4. Adiciona timestamp para cálculo de duração
  req.startTime = Date.now();

  // 5. Retorna correlation ID no header de resposta
  res.setHeader('X-Correlation-ID', correlationId);

  // 6. Log de início da requisição (opcional, pode ser feito no requestLogger)
  if (clientCorrelationId) {
    log.debug('Correlation ID recebido do cliente', {
      correlationId,
      method: req.method,
      url: req.url,
    });
  }

  next();
};

/**
 * Helper para obter correlation ID do request
 * Útil em lugares onde o request não está disponível diretamente
 */
export const getCorrelationId = (req: Request): string => {
  return req.id || 'unknown';
};

/**
 * Helper para adicionar correlation ID em objetos de log
 */
export const withCorrelationId = (
  req: Request,
  logData: Record<string, any>
): Record<string, any> => {
  return {
    ...logData,
    correlationId: req.id,
  };
};