// src/shared/middlewares/timeout.middleware.ts

/**
 * Middlewares de Timeout para Requisições HTTP
 * @module shared/middlewares/timeout
 */

import timeout from 'connect-timeout';
import { Request, Response, NextFunction } from 'express';
import { log } from '@shared/utils/logger';

// ============================================================================
// CONFIGURAÇÃO DE TIMEOUTS
// ============================================================================

/**
 * Configuração de timeouts por tipo de operação
 */
const TIMEOUTS = {
  DEFAULT: '30s',
  HEAVY: '60s',
  HEALTH_CHECK: '5s',
} as const;

// ============================================================================
// MIDDLEWARES DE TIMEOUT
// ============================================================================

/**
 * Middleware de timeout global (30s)
 */
export const requestTimeout = timeout(TIMEOUTS.DEFAULT);

/**
 * Middleware de timeout para operações pesadas (60s)
 */
export const heavyOperationTimeout = timeout(TIMEOUTS.HEAVY);

/**
 * Middleware de timeout para health checks (5s)
 */
export const healthCheckTimeout = timeout(TIMEOUTS.HEALTH_CHECK);

// ============================================================================
// HANDLER DE ERROS DE TIMEOUT
// ============================================================================

/**
 * Handler para requisições que excederam o timeout
 */
export const timeoutErrorHandler = (req: Request, res: Response, next: NextFunction): void => {
  // Se não houve timeout, continua normalmente
  if (!req.timedout) {
    next();
    return;
  }

  // Se já enviou resposta (edge case), não faz nada
  if (res.headersSent) {
    return;
  }

  // Loga o timeout para análise
  log.error('Request timeout:', {
    requestId: (req as any).id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    timeout: TIMEOUTS.DEFAULT,
  });

  // Retorna erro 503 (Service Unavailable)
  res.status(503).json({
    success: false,
    error: 'Request Timeout',
    message: 'A requisição demorou muito para ser processada e foi cancelada pelo servidor.',
    details: {
      timeout: TIMEOUTS.DEFAULT,
      suggestion:
        'Tente novamente em alguns instantes. Se o problema persistir, contate o suporte.',
    },
  });
};

// ============================================================================
// HELPER - HALT ON TIMEOUT
// ============================================================================

/**
 * Middleware que previne execução após timeout
 */
export const haltOnTimedout = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.timedout) {
    next();
  }
  // Se timeout ocorreu, NÃO chama next() - para a execução
};

// ============================================================================
// CONFIGURAÇÃO EXPORTADA
// ============================================================================

/**
 * Configuração de timeout para exportação
 */
export const timeoutConfig = {
  default: TIMEOUTS.DEFAULT,
  heavy: TIMEOUTS.HEAVY,
  healthCheck: TIMEOUTS.HEALTH_CHECK,
};
