// src/infrastructure/cache/adapters/index.ts

/**
 * Barrel export - Cache Adapters
 *
 * Adapters para diferentes estratégias de cache.
 */

export { CacheAdapter } from './CacheAdapter';
export { MemoryCacheAdapter } from './MemoryCacheAdapter';
export { RedisCacheAdapter } from './RedisCacheAdapter';
export { LayeredCacheAdapter } from './LayeredCacheAdapter';
