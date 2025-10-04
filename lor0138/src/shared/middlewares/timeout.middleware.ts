// src/shared/middlewares/timeout.middleware.ts

import timeout from 'connect-timeout';
import { Request, Response, NextFunction } from 'express';

/**
 * Configuração de timeouts
 */
const TIMEOUTS = {
  // Timeout padrão para todas as requisições (30 segundos)
  DEFAULT: '30s',
  
  // Timeout maior para operações pesadas (60 segundos)
  HEAVY: '60s',
  
  // Timeout curto para health checks (5 segundos)
  HEALTH_CHECK: '5s',
};

/**
 * Middleware de timeout global
 * Cancela requisições que demoram mais do que o limite configurado
 */
export const requestTimeout = timeout(TIMEOUTS.DEFAULT);

/**
 * Middleware de timeout para operações pesadas
 * Use em rotas que fazem queries complexas ou processamento intensivo
 */
export const heavyOperationTimeout = timeout(TIMEOUTS.HEAVY);

/**
 * Middleware de timeout para health checks
 * Health checks devem responder rapidamente
 */
export const healthCheckTimeout = timeout(TIMEOUTS.HEALTH_CHECK);

/**
 * Handler para requisições que excederam o timeout
 * Este middleware deve vir DEPOIS do timeout middleware
 */
export const timeoutErrorHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Verifica se a requisição excedeu o timeout
  if (!req.timedout) {
    next();
    return;
  }

  // Se já enviou resposta, não faz nada
  if (res.headersSent) {
    return;
  }

  // Loga o timeout
  console.error('Request timeout:', {
    requestId: (req as any).id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    timeout: TIMEOUTS.DEFAULT,
  });

  // Retorna erro 503 (Service Unavailable) - mais apropriado que 408
  res.status(503).json({
    success: false,
    error: 'Request Timeout',
    message: 'A requisição demorou muito para ser processada e foi cancelada pelo servidor.',
    details: {
      timeout: TIMEOUTS.DEFAULT,
      suggestion: 'Tente novamente em alguns instantes. Se o problema persistir, contate o suporte.',
    },
  });
};

/**
 * Middleware que previne que código continue executando após timeout
 * Use este middleware em rotas específicas APÓS o timeout middleware
 */
export const haltOnTimedout = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.timedout) {
    next();
  }
  // Se timeout ocorreu, não chama next() - para a execução
};

/**
 * Configuração de timeout para exportação
 */
export const timeoutConfig = {
  default: TIMEOUTS.DEFAULT,
  heavy: TIMEOUTS.HEAVY,
  healthCheck: TIMEOUTS.HEALTH_CHECK,
};