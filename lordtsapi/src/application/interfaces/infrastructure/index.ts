// src/application/interfaces/infrastructure/index.ts

/**
 * Barrel export para interfaces de infraestrutura (Ports)
 *
 * @module application/interfaces/infrastructure
 *
 * @description
 * Exporta interfaces que definem contratos para serviços de infraestrutura.
 *
 * Seguindo Hexagonal Architecture:
 * - Application Layer depende dessas interfaces (Ports)
 * - Infrastructure Layer implementa essas interfaces (Adapters)
 *
 * @example
 * ```typescript
 * import type { ILogger, ICache, IMetrics, IDatabase } from '@application/interfaces/infrastructure';
 *
 * class GetItemUseCase {
 *   constructor(
 *     private logger: ILogger,
 *     private cache: ICache,
 *     private metrics: IMetrics,
 *     private itemRepository: IItemRepository
 *   ) {}
 * }
 * ```
 */

export type { ILogger, LogContext } from './ILogger';
export type { ICache, CacheStats, CacheOptions } from './ICache';
export type { IMetrics, MetricLabels } from './IMetrics';
export type { IDatabase, DatabaseStats, QueryOptions } from './IDatabase';
export type { IEventBus, EventHandler, UnsubscribeFunction } from './IEventBus';
export type { IHttpClient, HttpConfig, HttpResponse } from './IHttpClient';
