// @ts-nocheck
// src/shared/middlewares/cachePresets.ts
import { cacheMiddleware } from './cache.middleware';

export const healthCache = cacheMiddleware({ 
  ttl: parseInt(process.env.CACHE_HEALTH_TTL || '30', 10) 
});

export const itemCache = cacheMiddleware({ 
  ttl: parseInt(process.env.CACHE_ITEM_TTL || '600', 10) 
});

export const estabelecimentoCache = cacheMiddleware({ 
  ttl: parseInt(process.env.CACHE_ESTABELECIMENTO_TTL || '900', 10) 
});