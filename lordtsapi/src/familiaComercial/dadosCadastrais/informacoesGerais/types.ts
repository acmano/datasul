// src/familiaComercial/dadosCadastrais/informacoesGerais/types.ts

/**
 * Types específicos do módulo Familia Comercial - Informações Gerais
 * Types compartilhados importados de @datasul/shared-types
 */

import {
  ApiResponse,
  FamiliaComercialData,
  FamiliaComercialMasterQueryResult
} from '@datasul/shared-types';

// ============================================================================
// RE-EXPORTS (para compatibilidade)
// ============================================================================

export {
  FamiliaComercialData,
  FamiliaComercialMasterQueryResult
};

// ============================================================================
// TYPES ESPECÍFICOS DESTE MÓDULO
// ============================================================================

/**
 * Informações gerais de uma família comercial
 */
export type FamiliaComercialInformacoesGerais = FamiliaComercialData;

/**
 * DTO de entrada
 */
export interface FamiliaComercialInformacoesGeraisRequestDTO {
  familiaComercialCodigo: string;
}

/**
 * DTO de resposta (usando ApiResponse genérico)
 */
export type FamiliaComercialInformacoesGeraisResponseDTO = ApiResponse<FamiliaComercialInformacoesGerais>;
