// src/infrastructure/cache/index.ts

/**
 * Barrel export - Cache Infrastructure
 *
 * Sistema de cache em camadas (L1 Memory + L2 Redis).
 */

// Adapters
export * from './adapters';

// Managers and Services
export { CacheManager, generateCacheKey } from './CacheManager';
export { QueryCacheService } from './QueryCacheService';

// Re-exports específicos para conveniência
export { CacheAdapter } from './adapters/CacheAdapter';
export { MemoryCacheAdapter } from './adapters/MemoryCacheAdapter';
export { RedisCacheAdapter } from './adapters/RedisCacheAdapter';
export { LayeredCacheAdapter } from './adapters/LayeredCacheAdapter';
