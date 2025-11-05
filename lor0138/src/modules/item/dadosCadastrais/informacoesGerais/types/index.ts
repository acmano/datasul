// src/modules/item/dadosCadastrais/informacoesGerais/types/index.ts

/**
 * Types locais - Espelham exatamente o que a API retorna
 * Devem ser mantidos sincronizados manualmente com o backend
 */

// ============================================================================
// RESPONSE DA API (Estrutura Aninhada)
// ============================================================================

/**
 * Estrutura exata retornada pela API
 * GET /api/item/dadosCadastrais/informacoesGerais/:codigo
 */
export interface ItemInformacoesGeraisApiResponse {
  success: boolean;
  data: {
    item: {
      codigo: string;
      descricao: string;
      unidade: string;
      status: string;
      estabelecimentoPadraoCodigo: string;
      dataImplantacao: string;
      dataLiberacao: string;
      dataObsolescencia: string | null;
      itemNarrativa?: string;
      deposito: string;
      codLocalizacao: string;
      endereco?: string;
      descricaoResumida?: string;
      descricaoAlternativa?: string;
      contenedor?: {
        codigo?: string;
        descricao?: string;
      };
    };
    familia: {
      codigo: string;
      descricao: string;
    } | null;
    familiaComercial: {
      codigo: string;
      descricao: string;
    } | null;
    grupoDeEstoque: {
      codigo: number;
      descricao: string;
    } | null;
    estabelecimentos: Array<{
      codigo: string;
      nome: string;
    }>;
  };
}

// ============================================================================
// FORMATO FLAT PARA O FRONTEND
// ============================================================================

/**
 * Dados do item em formato plano (flat) para facilitar uso nos componentes
 */
export interface ItemInformacoesGeraisFlat {
  // Dados principais do item
  itemCodigo: string;
  itemDescricao: string;
  itemDescricaoResumida?: string;
  itemDescricaoAlternativa?: string;
  itemNarrativa?: string;

  // Unidade de medida
  unidadeMedidaCodigo: string;
  unidadeMedidaDescricao: string;

  // Status e datas
  itemStatus: string;
  dataImplantacao: string;
  dataLiberacao: string;
  dataObsolescencia: string | null;

  // Localização
  deposito: string;
  codLocalizacao: string;
  endereco?: string;
  estabelecimentoPadraoCodigo: string;

  // Contenedor
  contenedorCodigo?: string;
  contenedorDescricao?: string;

  // Classificações
  familiaCodigo: string;
  familiaDescricao: string;
  familiaComercialCodigo: string;
  familiaComercialDescricao: string;
  grupoEstoqueCodigo: string;
  grupoEstoqueDescricao: string;

  // Estabelecimentos
  estabelecimentos: Array<{
    codigo: string;
    nome: string;
  }>;
}
