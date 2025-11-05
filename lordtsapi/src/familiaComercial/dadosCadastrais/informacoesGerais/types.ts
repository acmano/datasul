// src/familiaComercial/dadosCadastrais/informacoesGerais/types.ts

/**
 * Types específicos do módulo Familia Comercial - Informações Gerais
 * Types compartilhados importados de @acmano/lordtsapi-shared-types
 */

import { ApiResponse, FamiliaComercialData } from '@acmano/lordtsapi-shared-types';

// ============================================================================
// QUERY RESULT TYPES (ODBC lowercase)
// ============================================================================

/**
 * Resultado da query getFamiliaComercialMaster
 * ODBC retorna colunas em lowercase após normalização
 */
export interface FamiliaComercialMasterQueryResult {
  codigo: string;
  descricao: string;
}

// ============================================================================
// RE-EXPORTS (para compatibilidade)
// ============================================================================

export { FamiliaComercialData };

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
export type FamiliaComercialInformacoesGeraisResponseDTO =
  ApiResponse<FamiliaComercialInformacoesGerais>;
