// src/shared/middlewares/correlationId.middleware.ts

/**
 * Middleware de Correlation ID (Request Tracing)
 *
 * @module shared/middlewares/correlationId
 * @see correlationId.middleware.md para documentação completa
 *
 * Funcionalidades:
 * - Aceita Correlation ID do cliente (múltiplos headers)
 * - Gera UUID v4 automaticamente se não fornecido
 * - Adiciona ao req.id e req.startTime
 * - Retorna no header X-Correlation-ID
 *
 * Headers suportados (prioridade):
 * 1. X-Correlation-ID
 * 2. X-Request-ID
 * 3. correlation-id
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@shared/utils/logger';

// ============================================================================
// CONSTANTES
// ============================================================================

const CORRELATION_ID_HEADERS = ['x-correlation-id', 'x-request-id', 'correlation-id'] as const;

const RESPONSE_HEADER_NAME = 'X-Correlation-ID';

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Middleware de Correlation ID
 * IMPORTANTE: Deve ser o PRIMEIRO middleware na cadeia
 */
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Tenta extrair Correlation ID dos headers
  const clientCorrelationId = CORRELATION_ID_HEADERS.reduce<string | undefined>(
    (found, headerName) => found || (req.headers[headerName] as string),
    undefined
  );

  // Usa ID do cliente ou gera novo UUID v4
  const correlationId = clientCorrelationId || uuidv4();

  // Adiciona ao request
  req.id = correlationId;
  req.startTime = Date.now();

  // Retorna no header de resposta
  res.setHeader(RESPONSE_HEADER_NAME, correlationId);

  // Log de debug se cliente enviou ID
  if (clientCorrelationId) {
    log.debug('Correlation ID recebido do cliente', {
      correlationId,
      method: req.method,
      url: req.url,
    });
  }

  next();
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtém Correlation ID do request
 * @returns Correlation ID ou 'unknown'
 */
export const getCorrelationId = (req: Request): string => {
  return req.id || 'unknown';
};

/**
 * Adiciona Correlation ID em objetos de log
 * @param req - Request do Express
 * @param logData - Dados do log
 * @returns Dados originais + correlationId
 */
export const withCorrelationId = (
  req: Request,
  logData: Record<string, any>
): Record<string, any> => {
  return {
    correlationId: req.id,
    ...logData,
  };
};
