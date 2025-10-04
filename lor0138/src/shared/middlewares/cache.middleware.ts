// src/shared/middlewares/cache.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';
import { log } from '@shared/utils/logger';

interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const ttl = options.ttl || 300;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = options.keyGenerator 
      ? options.keyGenerator(req)
      : generateDefaultCacheKey(req);

    // ✅ CORRIGIDO: Adicionar await
    const cachedResponse = await CacheManager.get<CachedResponse>(cacheKey);

    if (cachedResponse) {
      log.debug('Cache HTTP HIT', { 
        correlationId: req.id,
        cacheKey,
        url: req.url 
      });

      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);

      return res
        .status(cachedResponse.statusCode)
        .set(cachedResponse.headers)
        .json(cachedResponse.body);
    }

    log.debug('Cache HTTP MISS', { 
      correlationId: req.id,
      cacheKey,
      url: req.url 
    });

    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      const shouldCache = options.condition 
        ? options.condition(req, res)
        : res.statusCode === 200;

      if (shouldCache) {
        const cachedResponse: CachedResponse = {
          statusCode: res.statusCode,
          headers: getRelevantHeaders(res),
          body,
        };

        // ✅ CORRIGIDO: Adicionar await (mas como não é async, usar then)
        CacheManager.set(cacheKey, cachedResponse, ttl)
          .then(() => {
            log.debug('Cache HTTP STORED', {
              correlationId: req.id,
              cacheKey,
              ttl,
              statusCode: res.statusCode,
            });
          })
          .catch(err => {
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

function generateDefaultCacheKey(req: Request): string {
  const { method, path, query } = req;
  
  const sortedQuery = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');

  const parts = [method, path];
  if (sortedQuery) {
    parts.push(sortedQuery);
  }

  return generateCacheKey(...parts);
}

function getRelevantHeaders(res: Response): Record<string, string> {
  const relevantHeaders: Record<string, string> = {};
  
  const headersToPreserve = [
    'content-type',
    'content-encoding',
    'x-correlation-id',
  ];

  headersToPreserve.forEach(header => {
    const value = res.getHeader(header);
    if (value) {
      relevantHeaders[header] = String(value);
    }
  });

  return relevantHeaders;
}

interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

export function invalidateCacheMiddleware(
  pattern: string | ((req: Request) => string)
) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const cachePattern = typeof pattern === 'function' 
          ? pattern(req) 
          : pattern;

        // ✅ CORRIGIDO: Adicionar await
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