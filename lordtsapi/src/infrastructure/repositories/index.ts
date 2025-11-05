// src/infrastructure/repositories/index.ts

/**
 * Barrel export para Repository Adapters
 *
 * @module infrastructure/repositories
 *
 * @description
 * Exporta implementações concretas (Adapters) das interfaces de repositórios.
 *
 * Padrão Hexagonal Architecture (Ports & Adapters):
 * - **Ports**: Interfaces em @application/interfaces/repositories
 * - **Adapters**: Implementações concretas (aqui)
 *
 * @example
 * ```typescript
 * import { ItemRepositoryAdapter } from '@infrastructure/repositories';
 * import type { IItemRepository } from '@application/interfaces/repositories';
 *
 * const itemRepository: IItemRepository = new ItemRepositoryAdapter();
 * ```
 */

export { ItemRepositoryAdapter } from './ItemRepositoryAdapter';
export { FamiliaRepositoryAdapter } from './FamiliaRepositoryAdapter';
export { EstabelecimentoRepositoryAdapter } from './EstabelecimentoRepositoryAdapter';
export { GrupoDeEstoqueRepositoryAdapter } from './GrupoDeEstoqueRepositoryAdapter';
export { FamiliaComercialRepositoryAdapter } from './FamiliaComercialRepositoryAdapter';
