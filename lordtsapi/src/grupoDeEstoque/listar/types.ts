// src/grupoDeEstoque/listar/types.ts

/**
 * Types específicos do módulo GrupoDeEstoque - Listar
 * Types compartilhados importados de @acmano/lordtsapi-shared-types
 */

import { ApiResponse, GrupoDeEstoqueData } from '@acmano/lordtsapi-shared-types';

// ============================================================================
// RE-EXPORTS (para compatibilidade)
// ============================================================================

export { GrupoDeEstoqueData };

// ============================================================================
// TYPES ESPECÍFICOS DESTE MÓDULO
// ============================================================================

/**
 * Item da lista de grupos de estoque
 */
export interface GrupoDeEstoqueListItem {
  codigo: string;
  descricao: string;
}

/**
 * Resposta da listagem de grupos de estoque
 */
export interface GrupoDeEstoqueListarResponse {
  gruposDeEstoque: GrupoDeEstoqueListItem[];
  total: number;
}

/**
 * DTO de resposta (usando ApiResponse genérico)
 */
export type GrupoDeEstoqueListarResponseDTO = ApiResponse<GrupoDeEstoqueListItem[]>;
