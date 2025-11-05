// src/shared/middlewares/rateLimiter.middleware.ts

/**
 * Middlewares de Rate Limiting
 * @module shared/middlewares/rateLimiter
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// ====================================================================
// RATE LIMITER GERAL
// ====================================================================

/**
 * Rate limiter geral para toda a API
 * - Window: 15 minutos
 * - Limite: 100 requisições por IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Limite de requisições excedido. Aguarde alguns minutos.',
    });
  },
  skip: (_req: Request) => {
    return process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true';
  },
});

// ====================================================================
// RATE LIMITER RESTRITIVO
// ====================================================================

/**
 * Rate limiter restritivo para endpoints críticos
 * - Window: 5 minutos
 * - Limite: 20 requisições por IP
 */
export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Muitas requisições neste endpoint. Aguarde alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Limite de requisições excedido para este endpoint.',
    });
  },
});

// ====================================================================
// RATE LIMITER POR RECURSO
// ====================================================================

/**
 * Rate limiter por recurso específico (item)
 * - Window: 1 minuto
 * - Limite: 10 requisições por item
 * - Key: item:{itemCodigo}
 */
export const itemLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Muitas consultas para este item. Aguarde um momento.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const itemCodigo = req.params.itemCodigo || 'no-item';
    return `item:${itemCodigo}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Muitas consultas para este item específico. Aguarde um momento.',
    });
  },
  skip: (_req: Request) => {
    return process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true';
  },
});

// ====================================================================
// UTILITÁRIOS
// ====================================================================

/**
 * Cria rate limiter customizado com configurações específicas
 */
export function createCustomRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipInDev?: boolean;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: options.message || 'Rate limit excedido',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: options.message || 'Limite de requisições excedido',
      });
    },
    skip: options.skipInDev
      ? (_req: Request) => {
          return process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true';
        }
      : undefined,
  });
}
