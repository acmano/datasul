// src/types/index.ts

/**
 * Barrel export para todos os tipos compartilhados
 *
 * @module types
 * @version 1.0.0
 *
 * @description
 * Ponto central de exportação para tipos reutilizáveis do projeto.
 * Facilita imports limpos e organizados.
 *
 * @example
 * ```typescript
 * // Ao invés de:
 * import { Result } from '@/types/utils';
 * import { ErrorContext } from '@shared/errors/AppError';
 *
 * // Faça:
 * import { Result, ErrorContext } from '@/types';
 * ```
 */

// ============================================================================
// UTILITY TYPES
// ============================================================================

export * from './utils';
export * from './ids';
// Note: responses.ts exports isSuccess which conflicts with utils.ts - using utils version
// export * from './responses';
// Note: guards.ts exports isError which conflicts with responses.ts - both kept for different use cases
// export * from './guards';
export * from './config';
// Note: dtos.ts exports ItemDTO which may conflict - investigate if needed
// export * from './dtos';
export * from './validators';
export * from './transformers';

// ============================================================================
// DOMAIN TYPES (re-exports convenientes)
// ============================================================================

/**
 * NOTA: Re-exports de tipos de outros módulos podem ser adicionados aqui
 * conforme necessário para facilitar imports.
 *
 * Exemplos:
 * ```typescript
 * export type { ErrorContext } from '@shared/errors/AppError';
 * export type { QueryParameter } from '@infrastructure/database/types';
 * export { UserTier } from '@shared/types/apiKey.types';
 * ```
 */
