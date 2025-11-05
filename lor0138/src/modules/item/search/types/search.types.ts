// Types de pesquisa de itens

export interface ItemSearchFilters {
  itemCodigo?: string;
  itemDescricao?: string;
  familiaCodigo?: string;
  familiaComercialCodigo?: string;
  grupoEstoqueCodigo?: string;
  tipoItem?: string[];
  gtin?: string;
  limite?: number;
}

export interface ItemSearchResultItem {
  itemCodigo: string;
  itemDescricao: string;
  unidadeMedidaCodigo: string;
  unidadeMedidaDescricao?: string;
  familiaCodigo: string;
  familiaDescricao?: string;
  familiaComercialCodigo: string;
  familiaComercialDescricao?: string;
  grupoEstoqueCodigo: string;
  grupoEstoqueDescricao?: string;
  codObsoleto: number;
  gtin?: string;
  tipo?: string;
}

export interface ItemSearchResponse {
  items: ItemSearchResultItem[];
  total: number;
}
