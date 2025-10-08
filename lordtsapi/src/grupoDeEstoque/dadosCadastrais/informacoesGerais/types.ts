// src/grupoDeEstoque/dadosCadastrais/informacoesGerais/types.ts

/**
 * Types específicos do módulo Grupo de Estoque - Informações Gerais
 * Types compartilhados importados de @datasul/shared-types
 */

import {
  ApiResponse,
  GrupoDeEstoqueData,
  GrupoDeEstoqueMasterQueryResult
} from '@datasul/shared-types';

// ============================================================================
// RE-EXPORTS (para compatibilidade)
// ============================================================================

export {
  GrupoDeEstoqueData,
  GrupoDeEstoqueMasterQueryResult
};

// ============================================================================
// TYPES ESPECÍFICOS DESTE MÓDULO
// ============================================================================

/**
 * Informações gerais de um grupo de estoque
 */
export type GrupoDeEstoqueInformacoesGerais = GrupoDeEstoqueData;

/**
 * DTO de entrada
 */
export interface GrupoDeEstoqueInformacoesGeraisRequestDTO {
  grupoDeEstoqueCodigo: string;
}

/**
 * DTO de resposta (usando ApiResponse genérico)
 */
export type GrupoDeEstoqueInformacoesGeraisResponseDTO = ApiResponse<GrupoDeEstoqueInformacoesGerais>;
