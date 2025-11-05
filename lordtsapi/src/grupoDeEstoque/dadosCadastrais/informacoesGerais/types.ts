// src/grupoDeEstoque/dadosCadastrais/informacoesGerais/types.ts

/**
 * Types específicos do módulo Grupo de Estoque - Informações Gerais
 * Types compartilhados importados de @acmano/lordtsapi-shared-types
 */

import { ApiResponse, GrupoDeEstoqueData } from '@acmano/lordtsapi-shared-types';

// ============================================================================
// QUERY RESULT TYPES (ODBC lowercase)
// ============================================================================

/**
 * Resultado da query getGrupoDeEstoqueMaster
 * ODBC retorna colunas em lowercase após normalização
 */
export interface GrupoDeEstoqueMasterQueryResult {
  codigo: string;
  descricao: string;
}

// ============================================================================
// RE-EXPORTS (para compatibilidade)
// ============================================================================

export { GrupoDeEstoqueData };

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
export type GrupoDeEstoqueInformacoesGeraisResponseDTO =
  ApiResponse<GrupoDeEstoqueInformacoesGerais>;
