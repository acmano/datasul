// src/domain/index.ts

/**
 * Barrel export - Camada de Domínio
 *
 * Contém toda a lógica de negócio pura, independente de frameworks
 * e infraestrutura.
 *
 * Estrutura:
 * - entities: Objetos com identidade e ciclo de vida
 * - value-objects: Objetos imutáveis que representam valores
 * - interfaces: Contratos do domínio (futuro)
 *
 * @module Domain
 */

// Entidades
export * from './entities';

// Value Objects
export * from './value-objects';

// Re-exports específicos removidos para evitar duplicação
// (já incluídos no export * acima)
