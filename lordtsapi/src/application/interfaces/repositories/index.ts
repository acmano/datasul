// src/application/interfaces/repositories/index.ts

/**
 * Barrel export para interfaces de repositórios (Ports)
 *
 * @module application/interfaces/repositories
 *
 * @description
 * Exporta todas as interfaces de repositórios que definem
 * os contratos (ports) para a camada de persistência.
 *
 * Seguindo o padrão Hexagonal Architecture (Ports & Adapters):
 * - **Ports** (aqui): Interfaces que definem contratos
 * - **Adapters** (infrastructure): Implementações concretas
 *
 * @example
 * ```typescript
 * import type { IItemRepository, IFamiliaRepository } from '@application/interfaces/repositories';
 *
 * class GetItemUseCase {
 *   constructor(
 *     private itemRepository: IItemRepository  // Depende da interface, não da implementação
 *   ) {}
 * }
 * ```
 */

// Repository Interfaces (Ports)
export type { IItemRepository, ItemCompleto, ItemFilter } from './IItemRepository';
export type { IFamiliaRepository, FamiliaCompleto, FamiliaFilter } from './IFamiliaRepository';
export type {
  IEstabelecimentoRepository,
  EstabelecimentoCompleto,
} from './IEstabelecimentoRepository';
export type {
  IGrupoDeEstoqueRepository,
  GrupoEstoqueCompleto,
} from './IGrupoDeEstoqueRepository';
export type {
  IFamiliaComercialRepository,
  FamiliaComercialCompleto,
} from './IFamiliaComercialRepository';

// Shared Types
export type {
  PaginationOptions,
  PaginatedResult,
  SearchOptions,
} from './IItemRepository';
