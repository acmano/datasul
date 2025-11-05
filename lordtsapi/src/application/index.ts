// src/application/index.ts

/**
 * Barrel export - Application Layer
 *
 * Camada de aplicação contendo:
 * - Use Cases: Casos de uso específicos da aplicação
 * - DTOs: Data Transfer Objects
 * - Mappers: Conversão entre entidades e DTOs
 * - Interfaces: Contratos para repositórios e serviços
 *
 * Esta camada orquestra o fluxo de dados entre a interface
 * do usuário e as entidades de domínio.
 *
 * @module Application
 */

// DTOs
export * from './dtos';

// Mappers
export * from './mappers';

// Use Cases
export * from './use-cases';
