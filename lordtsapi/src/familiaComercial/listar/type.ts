// src/familiaComercial/listar/types.ts

/**
 * Types específicos do módulo FamiliaComercial - Listar
 * Types compartilhados importados de @acmano/lordtsapi-shared-types
 */

import { ApiResponse, FamiliaComercialData } from '@acmano/lordtsapi-shared-types';

// ============================================================================
// RE-EXPORTS (para compatibilidade)
// ============================================================================

export { FamiliaComercialData };

// ============================================================================
// TYPES ESPECÍFICOS DESTE MÓDULO
// ============================================================================

/**
 * Item da lista de famílias comerciais
 */
export interface FamiliaComercialListItem {
  codigo: string;
  descricao: string;
}

/**
 * Resposta da listagem de famílias comerciais
 */
export interface FamiliaComercialListarResponse {
  familiasComerciais: FamiliaComercialListItem[];
  total: number;
}

/**
 * DTO de resposta (usando ApiResponse genérico)
 */
export type FamiliaComercialListarResponseDTO = ApiResponse<FamiliaComercialListItem[]>;
