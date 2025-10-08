// src/familia/dadosCadastrais/informacoesGerais/types.ts

/**
 * Types específicos do módulo Familia - Informações Gerais
 * Types compartilhados importados de @datasul/shared-types
 */

import {
  ApiResponse,
  FamiliaData,
  FamiliaMasterQueryResult
} from '@datasul/shared-types';

// ============================================================================
// RE-EXPORTS (para compatibilidade)
// ============================================================================

export {
  FamiliaData,
  FamiliaMasterQueryResult
};

// ============================================================================
// TYPES ESPECÍFICOS DESTE MÓDULO
// ============================================================================

/**
 * Informações gerais de uma família
 */
export type FamiliaInformacoesGerais = FamiliaData;

/**
 * DTO de entrada
 */
export interface FamiliaInformacoesGeraisRequestDTO {
  familiaCodigo: string;
}

/**
 * DTO de resposta (usando ApiResponse genérico)
 */
export type FamiliaInformacoesGeraisResponseDTO = ApiResponse<FamiliaInformacoesGerais>;
