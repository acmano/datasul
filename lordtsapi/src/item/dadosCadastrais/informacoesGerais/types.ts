// src/item/dadosCadastrais/informacoesGerais/types.ts

/**
 * Types específicos do módulo Item - Informações Gerais
 * Types compartilhados importados de @datasul/shared-types
 */

import {
  ApiResponse,
  ItemData,
  FamiliaData,
  FamiliaComercialData,
  GrupoDeEstoqueData,
  EstabelecimentoData,
  ItemMasterQueryResult,
  ItemEstabelecimentoQueryResult,
  FamiliaMasterQueryResult,
  FamiliaComercialMasterQueryResult,
  GrupoDeEstoqueMasterQueryResult
} from '@datasul/shared-types';

// ============================================================================
// RE-EXPORTS (para compatibilidade)
// ============================================================================

export {
  ItemData,
  FamiliaData,
  FamiliaComercialData,
  GrupoDeEstoqueData,
  EstabelecimentoData,
  ItemMasterQueryResult,
  ItemEstabelecimentoQueryResult,
  FamiliaMasterQueryResult,
  FamiliaComercialMasterQueryResult,
  GrupoDeEstoqueMasterQueryResult
};

// ============================================================================
// TYPES ESPECÍFICOS DESTE MÓDULO
// ============================================================================

/**
 * Estrutura completa de resposta (aninhada/híbrida)
 */
export interface ItemInformacoesGerais {
  item: ItemData;
  familia: FamiliaData | null;
  familiaComercial: FamiliaComercialData | null;
  grupoDeEstoque: GrupoDeEstoqueData | null;
  estabelecimentos: EstabelecimentoData[];
}

/**
 * DTO de entrada
 */
export interface ItemInformacoesGeraisRequestDTO {
  itemCodigo: string;
}

/**
 * DTO de resposta (usando ApiResponse genérico)
 */
export type ItemInformacoesGeraisResponseDTO = ApiResponse<ItemInformacoesGerais>;
