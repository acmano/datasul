// src/item/dadosCadastrais/informacoesGerais/types.ts

/**
 * Types específicos do módulo Item - Informações Gerais
 * Types compartilhados importados de @acmano/lordtsapi-shared-types
 */

import {
  ApiResponse,
  ItemData,
  FamiliaData,
  FamiliaComercialData,
  GrupoDeEstoqueData,
  EstabelecimentoData,
  ItemEstabelecimentoQueryResult,
  FamiliaMasterQueryResult,
  FamiliaComercialMasterQueryResult,
  GrupoDeEstoqueMasterQueryResult,
} from '@acmano/lordtsapi-shared-types';

// ============================================================================
// LOCAL TYPE OVERRIDES
// ============================================================================

/**
 * Resultado completo da query de item master (get-item-master.sql)
 * SOBRESCREVE a versão do shared-types que só tem campos básicos
 */
export interface ItemMasterQueryResult {
  // Campos básicos
  itemCodigo: string;
  itemDescricao: string;
  itemUnidade: string;
  itemUnidadeDescricao: string;

  // Códigos de relacionamento
  familiaCodigo: string | null;
  familiaComercialCodigo: string | null;
  grupoDeEstoqueCodigo: string | null;

  // Campos de controle
  status: string;
  deposito: string;
  codLocalizacao: string;
  estabelecimentoPadraoCodigo: string;

  // Datas
  dataImplantacao: string;
  dataLiberacao: string;
  dataObsolescencia: string;

  // Descrições estendidas
  narrativa?: string;
  endereco?: string;
  descricaoResumida?: string;
  descricaoAlternativa?: string;

  // Contenedor
  contenedorCodigo?: string;
  contenedorDescricao?: string;

  // Transporte embalagem (SQL retorna como teCodigo/teDescricao)
  teCodigo?: string;
  teDescricao?: string;

  // Venda embalagem (SQL retorna vendaEmbItens como número)
  vendaEmbCodigo?: string;
  vendaEmbDescricao?: string;
  vendaEmbItens?: number;
}

// ============================================================================
// RE-EXPORTS (para compatibilidade)
// ============================================================================

export {
  ItemData,
  FamiliaData,
  FamiliaComercialData,
  GrupoDeEstoqueData,
  EstabelecimentoData,
  ItemEstabelecimentoQueryResult,
  FamiliaMasterQueryResult,
  FamiliaComercialMasterQueryResult,
  GrupoDeEstoqueMasterQueryResult,
};

// ============================================================================
// TYPES ESPECÍFICOS DESTE MÓDULO
// ============================================================================

/**
 * Estabelecimento enriquecido com nome
 * Estende EstabelecimentoData com campo nome
 */
export interface EstabelecimentoEnriquecido {
  codigo: string;
  nome: string;
}

/**
 * Estrutura completa de resposta (aninhada/híbrida)
 * NOTA: Usa tipos *MasterQueryResult que contêm TODOS os campos retornados pelas queries SQL
 */
export interface ItemInformacoesGerais {
  item: ItemMasterQueryResult | null;
  familia: FamiliaMasterQueryResult | null;
  familiaComercial: FamiliaComercialMasterQueryResult | null;
  grupoDeEstoque: GrupoDeEstoqueMasterQueryResult | null;
  estabelecimentos: EstabelecimentoEnriquecido[];
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
