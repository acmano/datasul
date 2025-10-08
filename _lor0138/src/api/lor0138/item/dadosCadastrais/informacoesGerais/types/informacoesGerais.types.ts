// src/api/lor0138/item/dadosCadastrais/informacoesGerais/types/informacoesGerais.types.ts

/**
 * Types e Interfaces - Informações Gerais do Item (estrutura aninhada)
 */

// ============================================================================
// QUERY RESULTS (Camada de dados bruta)
// ============================================================================

/**
 * Resultado da query de item master
 */
export interface ItemMasterQueryResult {
  itemCodigo: string;
  itemDescricao: string;
  itemUnidade: string;
  familiaCodigo: string | null;
  familiaComercialCodigo: string | null;
  grupoDeEstoqueCodigo: string | null;
}

/**
 * Resultado da query de estabelecimentos
 */
export interface ItemEstabelecimentoQueryResult {
  itemCodigo: string;
  estabelecimentoCodigo: string;
}

/**
 * Resultado da query de família
 */
export interface FamiliaMasterQueryResult {
  familiaCodigo: string;
  familiaDescricao: string;
}

/**
 * Resultado da query de família comercial
 */
export interface FamiliaComercialMasterQueryResult {
  familiaComercialCodigo: string;
  familiaComercialDescricao: string;
}

/**
 * Resultado da query de grupo de estoque
 */
export interface GrupoDeEstoqueMasterQueryResult {
  grupoDeEstoqueCodigo: string;
  grupoDeEstoqueDescricao: string;
}

// ============================================================================
// MODELOS DE DOMÍNIO (estrutura aninhada)
// ============================================================================

/**
 * Dados do item (simplificado)
 */
export interface ItemData {
  codigo: string;
  descricao: string;
  unidade: string;
}

/**
 * Dados de família (simplificado)
 */
export interface FamiliaData {
  codigo: string;
  descricao: string;
}

/**
 * Dados de família comercial (simplificado)
 */
export interface FamiliaComercialData {
  codigo: string;
  descricao: string;
}

/**
 * Dados de grupo de estoque (simplificado)
 */
export interface GrupoDeEstoqueData {
  codigo: string;
  descricao: string;
}

/**
 * Dados de estabelecimento (simplificado)
 */
export interface EstabelecimentoData {
  codigo: string;
  // Adicione mais campos conforme necessário:
  // descricao?: string;
  // ativo?: boolean;
  // estoque?: number;
}

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

// ============================================================================
// DTOs DE API
// ============================================================================

/**
 * DTO de entrada
 */
export interface ItemInformacoesGeraisRequestDTO {
  itemCodigo: string;
}

/**
 * DTO de resposta
 */
export interface ItemInformacoesGeraisResponseDTO {
  success: boolean;
  data?: ItemInformacoesGerais;
  error?: string;
}