/**
 * Barrel export - Presentation Layer
 *
 * Camada de apresentação contendo:
 * - Routes: Definições de rotas HTTP
 * - Controllers: Lógica de apresentação (parsing request, formatar response)
 * - HTTP Middleware: Validação, autenticação específica de apresentação
 *
 * Esta camada lida com detalhes de interface HTTP (Express, rotas, etc).
 *
 * @module Presentation
 */

export * from './admin';
export * from './metrics';
export * from './test';
