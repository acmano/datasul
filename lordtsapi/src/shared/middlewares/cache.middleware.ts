// src/shared/middlewares/cache.middleware.ts

/**
 * Middleware de cache HTTP em memória
 *
 * @module shared/middlewares/cache
 * @see cache.middleware.md para documentação completa
 *
 * Exports:
 * - cacheMiddleware: Cache automático de respostas GET/POST
 * - invalidateCacheMiddleware: Invalidação por mutação
 * - createCachePreset: Factory de presets (short/medium/long)
 * - noCache: Desabilita cache completamente
 *
 * Features:
 * - TTL configurável
 * - Geração de chave customizável
 * - Condições de cache flexíveis
 * - Headers de debug (X-Cache: HIT/MISS)
 * - Suporte a GET e POST
 */

import { Request, Response, NextFunction } from 'express';
import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';
import { log } from '@shared/utils/logger';

// ====================================================================
// INTERFACES
// ====================================================================

interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
  allowedMethods?: string[];
}

interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

// ====================================================================
// MIDDLEWARE PRINCIPAL
// ====================================================================

/**
 * Middleware de cache HTTP
 * @param options - Configurações de cache (ttl, keyGenerator, condition, allowedMethods)
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const ttl = options.ttl || 300;
  const allowedMethods = options.allowedMethods || ['GET'];

  return async (req: Request, res: Response, next: NextFunction) => {
    // Verificar método permitido
    if (!allowedMethods.includes(req.method)) {
      return next();
    }

    // Gerar chave
    const cacheKey = options.keyGenerator
      ? options.keyGenerator(req)
      : generateDefaultCacheKey(req);

    // Buscar no cache
    const cachedResponse = await CacheManager.get<CachedResponse>(cacheKey);

    // Cache HIT
    if (cachedResponse) {
      log.debug('Cache HTTP HIT', {
        correlationId: req.id,
        cacheKey,
        url: req.url,
      });

      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);

      return res
        .status(cachedResponse.statusCode)
        .set(cachedResponse.headers)
        .json(cachedResponse.body);
    }

    // Cache MISS - interceptar res.json()
    log.debug('Cache HTTP MISS', {
      correlationId: req.id,
      cacheKey,
      url: req.url,
    });

    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      // Verificar condição de cache
      const shouldCache = options.condition ? options.condition(req, res) : res.statusCode === 200;

      if (shouldCache) {
        const cachedResponse: CachedResponse = {
          statusCode: res.statusCode,
          headers: getRelevantHeaders(res),
          body,
        };

        // Armazenar assincronamente
        CacheManager.set(cacheKey, cachedResponse, ttl)
          .then(() => {
            log.debug('Cache HTTP STORED', {
              correlationId: req.id,
              cacheKey,
              ttl,
              statusCode: res.statusCode,
            });
          })
          .catch((err) => {
            log.error('Erro ao armazenar cache', { error: err });
          });
      }

      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      return originalJson(body);
    };

    next();
  };
}

// ====================================================================
// MIDDLEWARE DE INVALIDAÇÃO
// ====================================================================

/**
 * Middleware de invalidação de cache por mutação
 * @param pattern - Padrão de chaves a invalidar ou função
 */
export function invalidateCacheMiddleware(pattern: string | ((req: Request) => string)) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      // Apenas invalida se sucesso (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const cachePattern = typeof pattern === 'function' ? pattern(req) : pattern;

        const removed = await CacheManager.invalidate(cachePattern);

        if (removed > 0) {
          log.info('Cache invalidado por mutation', {
            correlationId: req.id,
            pattern: cachePattern,
            removed,
            method: req.method,
            url: req.url,
          });
        }
      }
    });

    next();
  };
}

// ====================================================================
// FUNÇÕES AUXILIARES
// ====================================================================

function generateDefaultCacheKey(req: Request): string {
  const { method, path } = req;

  let params: any;

  if (method === 'GET') {
    params = req.query;
  } else if (method === 'POST') {
    params = req.body;
  } else {
    params = {};
  }

  // Ordenar params para consistência
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  const parts = [method, path];
  if (sortedParams) {
    parts.push(sortedParams);
  }

  return generateCacheKey(...parts);
}

function getRelevantHeaders(res: Response): Record<string, string> {
  const relevantHeaders: Record<string, string> = {};

  const headersToPreserve = ['content-type', 'content-encoding', 'x-correlation-id'];

  headersToPreserve.forEach((header) => {
    const value = res.getHeader(header);
    if (value) {
      relevantHeaders[header] = String(value);
    }
  });

  return relevantHeaders;
}

// ====================================================================
// UTILITÁRIOS
// ====================================================================

/**
 * Factory de presets de cache
 * @param preset - 'short' (1min) | 'medium' (5min) | 'long' (15min)
 */
export function createCachePreset(preset: 'short' | 'medium' | 'long') {
  const ttls = {
    short: 60, // 1 minuto
    medium: 300, // 5 minutos
    long: 900, // 15 minutos
  };

  return cacheMiddleware({ ttl: ttls[preset] });
}

/**
 * Middleware que desabilita cache
 */
export function noCache(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}
