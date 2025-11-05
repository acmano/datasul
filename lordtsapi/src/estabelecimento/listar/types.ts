// src/estabelecimento/listar/types.ts

/**
 * Types específicos do módulo Estabelecimento - Listar
 */

import { ApiResponse } from '@acmano/lordtsapi-shared-types';

// ============================================================================
// TYPES ESPECÍFICOS DESTE MÓDULO
// ============================================================================

/**
 * Item da lista de estabelecimentos
 */
export interface EstabelecimentoListItem {
  codigo: string;
  nome: string;
}

/**
 * Resposta da listagem de estabelecimentos
 */
export interface EstabelecimentoListarResponse {
  estabelecimentos: EstabelecimentoListItem[];
  total: number;
}

/**
 * DTO de resposta (usando ApiResponse genérico)
 */
export type EstabelecimentoListarResponseDTO = ApiResponse<EstabelecimentoListItem[]>;
