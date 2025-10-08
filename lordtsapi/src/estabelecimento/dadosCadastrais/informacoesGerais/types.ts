// src/estabelecimento/dadosCadastrais/informacoesGerais/types.ts

/**
 * Types específicos do módulo Estabelecimento - Informações Gerais
 * Types compartilhados importados de @datasul/shared-types
 */

import {
  ApiResponse,
  EstabelecimentoData
} from '@datasul/shared-types';

// ============================================================================
// RE-EXPORTS (para compatibilidade)
// ============================================================================

export {
  EstabelecimentoData
};

// ============================================================================
// TYPES ESPECÍFICOS DESTE MÓDULO
// ============================================================================

/**
 * Resultado da query de estabelecimento master
 */
export interface EstabelecimentoMasterQueryResult {
  estabelecimentoCodigo: string;
  estabelecimentoNome: string;
}

/**
 * Informações gerais de um estabelecimento
 */
export interface EstabelecimentoInformacoesGerais {
  codigo: string;
  nome: string;
}

/**
 * DTO de entrada
 */
export interface EstabelecimentoInformacoesGeraisRequestDTO {
  estabelecimentoCodigo: string;
}

/**
 * DTO de resposta (usando ApiResponse genérico)
 */
export type EstabelecimentoInformacoesGeraisResponseDTO = ApiResponse<EstabelecimentoInformacoesGerais>;
