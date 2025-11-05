// src/familia/dadosCadastrais/informacoesGerais/types.ts

/**
 * Types específicos do módulo Familia - Informações Gerais
 * Types compartilhados importados de @acmano/lordtsapi-shared-types
 */

import { ApiResponse, FamiliaData } from '@acmano/lordtsapi-shared-types';

// ============================================================================
// QUERY RESULT TYPES (ODBC lowercase)
// ============================================================================

/**
 * Resultado da query getFamiliaMaster
 * ODBC retorna colunas em lowercase após normalização
 */
export interface FamiliaMasterQueryResult {
  codigo: string;
  descricao: string;
}

// ============================================================================
// RE-EXPORTS (para compatibilidade)
// ============================================================================

export { FamiliaData };

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
