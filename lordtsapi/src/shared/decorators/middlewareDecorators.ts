// src/shared/decorators/middlewareDecorators.ts

import type { Request, Response, NextFunction } from 'express';

/**
 * Decorator Pattern para Middlewares
 *
 * @description
 * Decorators que adicionam funcionalidades aos middlewares de forma composável.
 *
 * @example
 * ```typescript
 * const handler = withLogging(
 *   withCache(
 *     withValidation(
 *       async (req, res) => {
 *         const data = await service.getData();
 *         res.json(data);
 *       }
 *     )
 *   )
 * );
 * ```
 */

export type RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export type MiddlewareDecorator = (handler: RequestHandler) => RequestHandler;

// ============================================================================
// LOGGING DECORATOR
// ============================================================================

/**
 * Decorator que adiciona logging ao handler
 *
 * @param handler - Handler original
 * @returns Handler decorado com logging
 *
 * @example
 * ```typescript
 * const handler = withLogging(async (req, res) => {
 *   res.json({ message: 'OK' });
 * });
 * ```
 */
export function withLogging(handler: RequestHandler): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    console.log(`[${req.method}] ${req.path} - Start`, {
      correlationId: req.id,
      method: req.method,
      path: req.path,
    });

    try {
      await handler(req, res, next);

      const duration = Date.now() - start;
      console.log(`[${req.method}] ${req.path} - Success (${duration}ms)`, {
        correlationId: req.id,
        duration,
        status: res.statusCode,
      });
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[${req.method}] ${req.path} - Error (${duration}ms)`, {
        correlationId: req.id,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };
}

// ============================================================================
// CACHE DECORATOR
// ============================================================================

/**
 * Decorator que adiciona cache ao handler
 *
 * @param ttl - Tempo de vida em segundos
 * @returns Decorator function
 *
 * @example
 * ```typescript
 * const handler = withCache(300)(async (req, res) => {
 *   const data = await service.getData();
 *   res.json(data);
 * });
 * ```
 */
export function withCache(ttl: number = 300): MiddlewareDecorator {
  return (handler: RequestHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Gera cache key baseado na rota e query params
      const cacheKey = `route:${req.path}:${JSON.stringify(req.query)}`;

      // Verifica se tem cache (implementação simplificada)
      // Em produção, usar CacheManager
      const cached = (req as any)._cache?.[cacheKey];

      if (cached) {
        console.log('Cache hit:', cacheKey);
        return res.json(cached);
      }

      // Intercepta res.json para salvar no cache
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        // Salva no cache (implementação simplificada)
        (req as any)._cache = (req as any)._cache || {};
        (req as any)._cache[cacheKey] = data;

        return originalJson(data);
      };

      await handler(req, res, next);
    };
  };
}

// ============================================================================
// VALIDATION DECORATOR
// ============================================================================

/**
 * Decorator que adiciona validação ao handler
 *
 * @param validator - Função de validação
 * @returns Decorator function
 *
 * @example
 * ```typescript
 * const handler = withValidation((req) => {
 *   if (!req.params.id) throw new Error('ID required');
 * })(async (req, res) => {
 *   res.json({ id: req.params.id });
 * });
 * ```
 */
export function withValidation(
  validator: (req: Request) => void | Promise<void>
): MiddlewareDecorator {
  return (handler: RequestHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await validator(req);
        await handler(req, res, next);
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Validation failed',
          code: 'VALIDATION_ERROR',
        });
      }
    };
  };
}

// ============================================================================
// ERROR HANDLING DECORATOR
// ============================================================================

/**
 * Decorator que adiciona tratamento de erros
 *
 * @param handler - Handler original
 * @returns Handler decorado
 *
 * @example
 * ```typescript
 * const handler = withErrorHandler(async (req, res) => {
 *   throw new Error('Something went wrong');
 * });
 * ```
 */
export function withErrorHandler(handler: RequestHandler): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      console.error('Handler error:', error);

      if (res.headersSent) {
        return next(error);
      }

      const statusCode = (error as any).statusCode || 500;
      const message =
        error instanceof Error ? error.message : 'Internal server error';

      res.status(statusCode).json({
        success: false,
        error: message,
        code: (error as any).code || 'INTERNAL_ERROR',
        correlationId: req.id,
      });
    }
  };
}

// ============================================================================
// RATE LIMITING DECORATOR
// ============================================================================

/**
 * Decorator que adiciona rate limiting
 *
 * @param maxRequests - Máximo de requisições
 * @param windowMs - Janela de tempo em ms
 * @returns Decorator function
 *
 * @example
 * ```typescript
 * const handler = withRateLimit(10, 60000)(async (req, res) => {
 *   res.json({ message: 'OK' });
 * });
 * ```
 */
export function withRateLimit(
  maxRequests: number,
  windowMs: number
): MiddlewareDecorator {
  const requests = new Map<string, number[]>();

  return (handler: RequestHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || 'unknown';
      const now = Date.now();

      // Limpa requisições antigas
      const userRequests = requests.get(key) || [];
      const recentRequests = userRequests.filter((time) => now - time < windowMs);

      if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
        });
      }

      recentRequests.push(now);
      requests.set(key, recentRequests);

      await handler(req, res, next);
    };
  };
}

// ============================================================================
// COMPOSITION HELPER
// ============================================================================

/**
 * Compõe múltiplos decorators
 *
 * @param decorators - Array de decorators
 * @returns Decorator composto
 *
 * @example
 * ```typescript
 * const handler = compose([
 *   withLogging,
 *   withCache(300),
 *   withValidation(validateId),
 *   withErrorHandler
 * ])(async (req, res) => {
 *   res.json({ message: 'OK' });
 * });
 * ```
 */
export function compose(
  decorators: MiddlewareDecorator[]
): MiddlewareDecorator {
  return (handler: RequestHandler) => {
    return decorators.reduceRight(
      (decorated, decorator) => decorator(decorated),
      handler
    );
  };
}
