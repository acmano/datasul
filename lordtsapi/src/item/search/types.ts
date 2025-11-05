// src/item/search/types.ts

export interface ItemSearchParams {
  codigo?: string;
  descricao?: string;
  familia?: string;
  familiaComercial?: string;
  grupoEstoque?: string;
  gtin?: string;
  tipoItem?: string[];
}

export interface ItemSearchQueryResult {
  codigo: string;
  descricao: string;
  itemUnidade: string;
  familiaCodigo: string;
  familiaDescricao: string;
  familiaComercialCodigo: string;
  familiaComercialDescricao: string;
  grupoDeEstoqueCodigo: number | string;
  grupoDeEstoqueDescricao: string;
  gtin13?: string | number;
  gtin14?: string | number;
  tipo?: string;
}

export interface ItemSearchResult {
  item: {
    codigo: string;
    descricao: string;
    unidade: string;
    gtin13?: string;
    gtin14?: string;
    tipo?: string;
    familia: {
      codigo: string;
      descricao: string;
    };
    familiaComercial: {
      codigo: string;
      descricao: string;
    };
    grupoDeEstoque: {
      codigo: number | string;
      descricao: string;
    };
  };
}

export interface ItemSearchResponse {
  success: true;
  criteriosDeBusca: {
    codigo: string;
    descricao: string;
    familia: string;
    familiaComercial: string;
    grupoEstoque: string;
    gtin: string;
    tipoItem: string[];
  };
  data: ItemSearchResult[];
  total: number;
}
