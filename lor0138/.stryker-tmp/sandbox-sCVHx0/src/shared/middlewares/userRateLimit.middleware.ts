// @ts-nocheck
// src/shared/middlewares/userRateLimit.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { UserRateLimiter } from '@shared/utils/UserRateLimiter';
import { RateLimitError } from '@shared/errors';
import { UserTier } from '@shared/types/apiKey.types';
import { log } from '@shared/utils/logger';

/**
 * Middleware de rate limiting por usuário
 * Requer que apiKeyAuth middleware seja executado antes
 */
export function userRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Se não há usuário autenticado, aplica rate limit genérico por IP
    if (!req.user) {
      log.debug('Rate limit por IP (sem autenticação)', {
        correlationId: req.id,
        ip: req.ip
      });
      // Fallback para rate limit genérico
      return next();
    }

    const { id: userId, tier } = req.user;

    // Verifica rate limit
    const result = UserRateLimiter.check(userId, tier);

    // Adiciona headers de rate limit
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    if (!result.allowed) {
      // Rate limit excedido
      log.warn('Rate limit por usuário excedido', {
        correlationId: req.id,
        userId,
        tier,
        limit: result.limit,
        resetAt: new Date(result.resetAt)
      });

      // Adiciona header Retry-After
      if (result.retryAfter) {
        res.setHeader('Retry-After', result.retryAfter.toString());
      }

      throw new RateLimitError(result.retryAfter);
    }

    log.debug('Rate limit OK', {
      correlationId: req.id,
      userId,
      tier,
      remaining: result.remaining,
      limit: result.limit
    });

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Cria middleware de rate limit customizado para endpoints específicos
 */
export function createUserRateLimit(options?: {
  skipAuthenticated?: boolean; // Pula rate limit se autenticado
  multiplier?: number; // Multiplica os limites padrão
}): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Se configurado para pular autenticados e usuário está autenticado
      if (options?.skipAuthenticated && req.user) {
        return next();
      }

      if (!req.user) {
        return next();
      }

      const { id: userId, tier } = req.user;
      const result = UserRateLimiter.check(userId, tier);

      // Aplica multiplicador se configurado
      const limit = options?.multiplier 
        ? result.limit * options.multiplier 
        : result.limit;

      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

      if (!result.allowed) {
        if (result.retryAfter) {
          res.setHeader('Retry-After', result.retryAfter.toString());
        }

        throw new RateLimitError(result.retryAfter);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}