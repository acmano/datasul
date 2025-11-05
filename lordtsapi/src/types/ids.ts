// src/types/ids.ts

/**
 * Branded Types para IDs de Entidades
 *
 * @module types/ids
 * @version 1.0.0
 *
 * @description
 * Define tipos nominais (branded types) para IDs de entidades do sistema.
 * Previne mistura acidental de IDs de diferentes entidades em compile-time.
 *
 * @example
 * ```typescript
 * import { ItemId, FamiliaId, toItemId } from '@/types/ids';
 *
 * const itemId = toItemId('7530110');
 * const familiaId = toFamiliaId('450000');
 *
 * getItem(itemId); // ✅ OK
 * getItem(familiaId); // ❌ Type error
 * ```
 */

import { Brand, ValidationResult } from './utils';

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

/**
 * ID único de Item
 *
 * @example
 * ```typescript
 * const itemId: ItemId = toItemId('7530110');
 * ```
 */
export type ItemId = Brand<string, 'ItemId'>;

/**
 * ID único de Família
 *
 * @example
 * ```typescript
 * const familiaId: FamiliaId = toFamiliaId('450000');
 * ```
 */
export type FamiliaId = Brand<string, 'FamiliaId'>;

/**
 * ID único de Família Comercial
 *
 * @example
 * ```typescript
 * const familiaComercialId: FamiliaComercialId = toFamiliaComercialId('FC001');
 * ```
 */
export type FamiliaComercialId = Brand<string, 'FamiliaComercialId'>;

/**
 * ID único de Grupo de Estoque
 *
 * @description
 * Pode ser string ou number dependendo da fonte de dados
 *
 * @example
 * ```typescript
 * const grupoId: GrupoDeEstoqueId = toGrupoDeEstoqueId(1);
 * ```
 */
export type GrupoDeEstoqueId = Brand<string | number, 'GrupoDeEstoqueId'>;

/**
 * ID único de Estabelecimento
 *
 * @example
 * ```typescript
 * const estabId: EstabelecimentoId = toEstabelecimentoId('01');
 * ```
 */
export type EstabelecimentoId = Brand<string, 'EstabelecimentoId'>;

/**
 * ID único de API Key
 *
 * @description
 * Formato: [tier]-[32-char-hex]
 * Exemplo: premium-a1b2c3d4e5f6...
 *
 * @example
 * ```typescript
 * const apiKeyId: ApiKeyId = toApiKeyId('premium-abc123...');
 * ```
 */
export type ApiKeyId = Brand<string, 'ApiKeyId'>;

/**
 * ID único de Usuário
 *
 * @example
 * ```typescript
 * const userId: UserId = toUserId('user-123');
 * ```
 */
export type UserId = Brand<string, 'UserId'>;

/**
 * ID único de Correlação (para tracing)
 *
 * @description
 * UUID v4 gerado por requisição
 *
 * @example
 * ```typescript
 * const correlationId: CorrelationId = toCorrelationId(uuidv4());
 * ```
 */
export type CorrelationId = Brand<string, 'CorrelationId'>;

// ============================================================================
// CONVERSION HELPERS
// ============================================================================

/**
 * Converte string para ItemId
 *
 * @param value - Código do item
 * @returns ItemId branded
 *
 * @example
 * ```typescript
 * const id = toItemId('7530110');
 * ```
 */
export function toItemId(value: string): ItemId {
  return value as ItemId;
}

/**
 * Converte string para FamiliaId
 *
 * @param value - Código da família
 * @returns FamiliaId branded
 *
 * @example
 * ```typescript
 * const id = toFamiliaId('450000');
 * ```
 */
export function toFamiliaId(value: string): FamiliaId {
  return value as FamiliaId;
}

/**
 * Converte string para FamiliaComercialId
 *
 * @param value - Código da família comercial
 * @returns FamiliaComercialId branded
 *
 * @example
 * ```typescript
 * const id = toFamiliaComercialId('FC001');
 * ```
 */
export function toFamiliaComercialId(value: string): FamiliaComercialId {
  return value as FamiliaComercialId;
}

/**
 * Converte string ou number para GrupoDeEstoqueId
 *
 * @param value - Código do grupo de estoque
 * @returns GrupoDeEstoqueId branded
 *
 * @example
 * ```typescript
 * const id1 = toGrupoDeEstoqueId(1);
 * const id2 = toGrupoDeEstoqueId('1');
 * ```
 */
export function toGrupoDeEstoqueId(value: string | number): GrupoDeEstoqueId {
  return value as GrupoDeEstoqueId;
}

/**
 * Converte string para EstabelecimentoId
 *
 * @param value - Código do estabelecimento
 * @returns EstabelecimentoId branded
 *
 * @example
 * ```typescript
 * const id = toEstabelecimentoId('01');
 * ```
 */
export function toEstabelecimentoId(value: string): EstabelecimentoId {
  return value as EstabelecimentoId;
}

/**
 * Converte string para ApiKeyId
 *
 * @param value - API Key completa
 * @returns ApiKeyId branded
 *
 * @example
 * ```typescript
 * const id = toApiKeyId('premium-abc123def456...');
 * ```
 */
export function toApiKeyId(value: string): ApiKeyId {
  return value as ApiKeyId;
}

/**
 * Converte string para UserId
 *
 * @param value - User ID
 * @returns UserId branded
 *
 * @example
 * ```typescript
 * const id = toUserId('user-123');
 * ```
 */
export function toUserId(value: string): UserId {
  return value as UserId;
}

/**
 * Converte string para CorrelationId
 *
 * @param value - UUID de correlação
 * @returns CorrelationId branded
 *
 * @example
 * ```typescript
 * const id = toCorrelationId(uuidv4());
 * ```
 */
export function toCorrelationId(value: string): CorrelationId {
  return value as CorrelationId;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Valida e converte string para ItemId
 *
 * @param value - Valor a validar
 * @returns ValidationResult com ItemId ou erro
 *
 * @example
 * ```typescript
 * const result = validateItemId('7530110');
 * if (result.valid) {
 *   const id: ItemId = result.data;
 * }
 * ```
 */
export function validateItemId(value: unknown): ValidationResult<ItemId> {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Item ID must be a string', field: 'itemId' };
  }

  if (value.trim().length === 0) {
    return { valid: false, error: 'Item ID cannot be empty', field: 'itemId' };
  }

  if (value.length > 16) {
    return { valid: false, error: 'Item ID too long (max 16 chars)', field: 'itemId' };
  }

  return { valid: true, data: toItemId(value.trim()) };
}

/**
 * Valida e converte string para FamiliaId
 *
 * @param value - Valor a validar
 * @returns ValidationResult com FamiliaId ou erro
 *
 * @example
 * ```typescript
 * const result = validateFamiliaId('450000');
 * if (result.valid) {
 *   const id: FamiliaId = result.data;
 * }
 * ```
 */
export function validateFamiliaId(value: unknown): ValidationResult<FamiliaId> {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Familia ID must be a string', field: 'familiaId' };
  }

  if (value.trim().length === 0) {
    return { valid: false, error: 'Familia ID cannot be empty', field: 'familiaId' };
  }

  if (value.length > 8) {
    return { valid: false, error: 'Familia ID too long (max 8 chars)', field: 'familiaId' };
  }

  return { valid: true, data: toFamiliaId(value.trim()) };
}

/**
 * Valida e converte string para FamiliaComercialId
 *
 * @param value - Valor a validar
 * @returns ValidationResult com FamiliaComercialId ou erro
 */
export function validateFamiliaComercialId(value: unknown): ValidationResult<FamiliaComercialId> {
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: 'Familia Comercial ID must be a string',
      field: 'familiaComercialId',
    };
  }

  if (value.trim().length === 0) {
    return {
      valid: false,
      error: 'Familia Comercial ID cannot be empty',
      field: 'familiaComercialId',
    };
  }

  if (value.length > 8) {
    return {
      valid: false,
      error: 'Familia Comercial ID too long (max 8 chars)',
      field: 'familiaComercialId',
    };
  }

  return { valid: true, data: toFamiliaComercialId(value.trim()) };
}

/**
 * Valida e converte string/number para GrupoDeEstoqueId
 *
 * @param value - Valor a validar
 * @returns ValidationResult com GrupoDeEstoqueId ou erro
 */
export function validateGrupoDeEstoqueId(
  value: unknown
): ValidationResult<GrupoDeEstoqueId> {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return {
      valid: false,
      error: 'Grupo de Estoque ID must be a string or number',
      field: 'grupoDeEstoqueId',
    };
  }

  const strValue = String(value).trim();

  if (strValue.length === 0) {
    return {
      valid: false,
      error: 'Grupo de Estoque ID cannot be empty',
      field: 'grupoDeEstoqueId',
    };
  }

  return { valid: true, data: toGrupoDeEstoqueId(value) };
}

/**
 * Valida e converte string para EstabelecimentoId
 *
 * @param value - Valor a validar
 * @returns ValidationResult com EstabelecimentoId ou erro
 */
export function validateEstabelecimentoId(
  value: unknown
): ValidationResult<EstabelecimentoId> {
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: 'Estabelecimento ID must be a string',
      field: 'estabelecimentoId',
    };
  }

  if (value.trim().length === 0) {
    return {
      valid: false,
      error: 'Estabelecimento ID cannot be empty',
      field: 'estabelecimentoId',
    };
  }

  if (value.length > 3) {
    return {
      valid: false,
      error: 'Estabelecimento ID too long (max 3 chars)',
      field: 'estabelecimentoId',
    };
  }

  return { valid: true, data: toEstabelecimentoId(value.trim()) };
}

/**
 * Valida e converte string para ApiKeyId
 *
 * @param value - Valor a validar
 * @returns ValidationResult com ApiKeyId ou erro
 *
 * @description
 * Valida formato: [tier]-[32-char-hex]
 */
export function validateApiKeyId(value: unknown): ValidationResult<ApiKeyId> {
  if (typeof value !== 'string') {
    return { valid: false, error: 'API Key ID must be a string', field: 'apiKeyId' };
  }

  if (value.trim().length === 0) {
    return { valid: false, error: 'API Key ID cannot be empty', field: 'apiKeyId' };
  }

  // Formato esperado: tier-hexstring (ex: premium-abc123...)
  const parts = value.split('-');
  if (parts.length < 2) {
    return {
      valid: false,
      error: 'API Key ID must follow format: tier-key',
      field: 'apiKeyId',
    };
  }

  const [tier, ...keyParts] = parts;
  const validTiers = ['free', 'premium', 'enterprise', 'admin'];

  if (!validTiers.includes(tier)) {
    return {
      valid: false,
      error: `Invalid tier. Must be one of: ${validTiers.join(', ')}`,
      field: 'apiKeyId',
    };
  }

  const keyPart = keyParts.join('-');
  if (keyPart.length < 10) {
    return { valid: false, error: 'API Key too short', field: 'apiKeyId' };
  }

  return { valid: true, data: toApiKeyId(value.trim()) };
}

/**
 * Valida e converte string para UserId
 *
 * @param value - Valor a validar
 * @returns ValidationResult com UserId ou erro
 */
export function validateUserId(value: unknown): ValidationResult<UserId> {
  if (typeof value !== 'string') {
    return { valid: false, error: 'User ID must be a string', field: 'userId' };
  }

  if (value.trim().length === 0) {
    return { valid: false, error: 'User ID cannot be empty', field: 'userId' };
  }

  return { valid: true, data: toUserId(value.trim()) };
}

/**
 * Valida e converte string para CorrelationId
 *
 * @param value - Valor a validar
 * @returns ValidationResult com CorrelationId ou erro
 *
 * @description
 * Valida formato UUID v4
 */
export function validateCorrelationId(value: unknown): ValidationResult<CorrelationId> {
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: 'Correlation ID must be a string',
      field: 'correlationId',
    };
  }

  if (value.trim().length === 0) {
    return {
      valid: false,
      error: 'Correlation ID cannot be empty',
      field: 'correlationId',
    };
  }

  // Validação básica de UUID v4
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    return {
      valid: false,
      error: 'Correlation ID must be a valid UUID v4',
      field: 'correlationId',
    };
  }

  return { valid: true, data: toCorrelationId(value.trim()) };
}

// ============================================================================
// EXTRACTION HELPERS
// ============================================================================

/**
 * Extrai o valor raw de um branded ID
 *
 * @template T - Tipo do ID branded
 * @param id - ID branded
 * @returns Valor string/number original
 *
 * @example
 * ```typescript
 * const itemId: ItemId = toItemId('7530110');
 * const rawValue = extractId(itemId); // '7530110'
 * ```
 */
export function extractId<T extends Brand<string | number, string>>(
  id: T
): string | number {
  return id as unknown as string | number;
}

/**
 * Verifica se dois IDs branded são iguais
 *
 * @template T - Tipo do ID branded
 * @param id1 - Primeiro ID
 * @param id2 - Segundo ID
 * @returns true se IDs são iguais
 *
 * @example
 * ```typescript
 * const id1 = toItemId('123');
 * const id2 = toItemId('123');
 * const id3 = toItemId('456');
 *
 * idsEqual(id1, id2); // true
 * idsEqual(id1, id3); // false
 * ```
 */
export function idsEqual<T extends Brand<string | number, string>>(
  id1: T,
  id2: T
): boolean {
  return extractId(id1) === extractId(id2);
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard para verificar se valor é um ItemId
 *
 * @param value - Valor a verificar
 * @returns true se for ItemId
 *
 * @example
 * ```typescript
 * if (isItemId(someValue)) {
 *   // someValue é ItemId
 * }
 * ```
 */
export function isItemId(value: unknown): value is ItemId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard para verificar se valor é um FamiliaId
 */
export function isFamiliaId(value: unknown): value is FamiliaId {
  return typeof value === 'string' && value.length > 0 && value.length <= 8;
}

/**
 * Type guard para verificar se valor é um GrupoDeEstoqueId
 */
export function isGrupoDeEstoqueId(value: unknown): value is GrupoDeEstoqueId {
  return (typeof value === 'string' || typeof value === 'number') && String(value).length > 0;
}

/**
 * Type guard para verificar se valor é um EstabelecimentoId
 */
export function isEstabelecimentoId(value: unknown): value is EstabelecimentoId {
  return typeof value === 'string' && value.length > 0 && value.length <= 3;
}
