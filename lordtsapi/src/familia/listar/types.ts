// src/familia/listar/types.ts

/**
 * Types específicos do módulo Familia - Listar
 * Types compartilhados importados de @acmano/lordtsapi-shared-types
 */

import { ApiResponse, FamiliaData } from '@acmano/lordtsapi-shared-types';

// ============================================================================
// RE-EXPORTS (para compatibilidade)
// ============================================================================

export { FamiliaData };

// ============================================================================
// TYPES ESPECÍFICOS DESTE MÓDULO
// ============================================================================

/**
 * Item da lista de famílias
 */
export interface FamiliaListItem {
  codigo: string;
  descricao: string;
}

/**
 * Resposta da listagem de famílias
 */
export interface FamiliaListarResponse {
  familias: FamiliaListItem[];
  total: number;
}

/**
 * DTO de resposta (usando ApiResponse genérico)
 */
export type FamiliaListarResponseDTO = ApiResponse<FamiliaListItem[]>;
