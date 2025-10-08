// src/shared/middlewares/userRateLimit.middleware.ts

/**
 * Middleware de Rate Limiting por Usuário e Tier
 * @module shared/middlewares/userRateLimit
 */

import { Request, Response, NextFunction } from 'express';
import { UserRateLimiter } from '@shared/utils/UserRateLimiter';
import { RateLimitError } from '@shared/errors/errors';
import { UserTier } from '@shared/types/apiKey.types';
import { log } from '@shared/utils/logger';

/**
 * Opções de configuração para rate limit customizado
 */
interface UserRateLimitOptions {
  skipAuthenticated?: boolean;
  multiplier?: number;
}

/**
 * Middleware principal de rate limiting por usuário autenticado
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

    // Verifica rate limit baseado no tier do usuário
    const result = UserRateLimiter.check(userId, tier);

    // Adiciona headers de rate limit para informar o cliente
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

      // Adiciona header Retry-After para informar quando pode tentar novamente
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
 * Factory para criação de middleware de rate limit customizado
 */
export function createUserRateLimit(options?: UserRateLimitOptions): (
  req: Request,
  res: Response,
  next: NextFunction
) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Se configurado para pular autenticados e usuário está autenticado
      if (options?.skipAuthenticated && req.user) {
        return next();
      }

      // Se não há usuário autenticado, passa (fallback para rate limit genérico)
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