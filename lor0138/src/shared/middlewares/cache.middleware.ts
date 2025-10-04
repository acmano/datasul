// src/shared/middlewares/cache.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { CacheManager, generateCacheKey } from '@shared/utils/cacheManager';
import { log } from '@shared/utils/logger';

interface CacheOptions {
  /**
   * TTL em segundos
   * @default 300 (5 minutos)
   */
  ttl?: number;

  /**
   * Gerar chave de cache customizada
   * Se não fornecida, usa: método + URL + query params
   */
  keyGenerator?: (req: Request) => string;

  /**
   * Condição para cachear
   * Retorna true se deve cachear a resposta
   */
  condition?: (req: Request, res: Response) => boolean;
}

/**
 * Middleware de cache HTTP
 * 
 * Cacheia respostas de endpoints GET para reduzir carga no servidor.
 * 
 * @example
 * // Cache de 5 minutos (padrão)
 * router.get('/items', cacheMiddleware(), controller.getItems);
 * 
 * // Cache customizado
 * router.get('/items/:id', cacheMiddleware({
 *   ttl: 600, // 10 minutos
 *   keyGenerator: (req) => `item:${req.params.id}`,
 *   condition: (req, res) => res.statusCode === 200
 * }), controller.getItem);
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const cache = CacheManager.getInstance();
  const ttl = options.ttl || 300; // 5 minutos padrão

  return async (req: Request, res: Response, next: NextFunction) => {
    // Só cacheia GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Gera chave de cache
    const cacheKey = options.keyGenerator 
      ? options.keyGenerator(req)
      : generateDefaultCacheKey(req);

    // Tenta pegar do cache
    const cachedResponse = cache.get<CachedResponse>(cacheKey);

    if (cachedResponse) {
      // Cache HIT - retorna resposta cacheada
      log.debug('Cache HTTP HIT', { 
        correlationId: req.id,
        cacheKey,
        url: req.url 
      });

      // Headers de cache
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);

      // Retorna resposta cacheada
      return res
        .status(cachedResponse.statusCode)
        .set(cachedResponse.headers)
        .json(cachedResponse.body);
    }

    // Cache MISS - continua para o controller
    log.debug('Cache HTTP MISS', { 
      correlationId: req.id,
      cacheKey,
      url: req.url 
    });

    // Captura resposta original
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      // Verifica condição de cache (se fornecida)
      const shouldCache = options.condition 
        ? options.condition(req, res)
        : res.statusCode === 200;

      if (shouldCache) {
        // Armazena no cache
        const cachedResponse: CachedResponse = {
          statusCode: res.statusCode,
          headers: getRelevantHeaders(res),
          body,
        };

        cache.set(cacheKey, cachedResponse, ttl);

        log.debug('Cache HTTP STORED', {
          correlationId: req.id,
          cacheKey,
          ttl,
          statusCode: res.statusCode,
        });
      }

      // Headers de cache
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      // Retorna resposta original
      return originalJson(body);
    };

    next();
  };
}

/**
 * Gera chave de cache padrão baseada em método, URL e query params
 */
function generateDefaultCacheKey(req: Request): string {
  const { method, path, query } = req;
  
  // Ordena query params para gerar chave consistente
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

/**
 * Extrai headers relevantes da resposta
 */
function getRelevantHeaders(res: Response): Record<string, string> {
  const relevantHeaders: Record<string, string> = {};
  
  // Lista de headers a serem preservados
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

/**
 * Estrutura da resposta cacheada
 */
interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

/**
 * Middleware para invalidar cache
 * 
 * Útil em rotas POST/PUT/DELETE que modificam dados
 * 
 * @example
 * router.post('/items', invalidateCacheMiddleware('item:*'), controller.createItem);
 * router.put('/items/:id', invalidateCacheMiddleware((req) => `item:${req.params.id}`), controller.updateItem);
 */
export function invalidateCacheMiddleware(
  pattern: string | ((req: Request) => string)
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const cache = CacheManager.getInstance();
    
    // Invalida após a resposta ser enviada
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const cachePattern = typeof pattern === 'function' 
          ? pattern(req) 
          : pattern;

        const removed = cache.invalidate(cachePattern);

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