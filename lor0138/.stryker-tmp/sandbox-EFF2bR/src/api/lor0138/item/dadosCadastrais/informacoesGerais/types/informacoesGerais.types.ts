/**
 * Dados de um item em um estabelecimento específico
 */
// @ts-nocheck

export interface ItemInformacoesGeraisEstabelecimento {
  itemCodigo: string; // item.it-codigo
  estabCodigo: string; // estabelec.cod-estabel
  estabNome: string; // estabelec.nome
  statusIndex: number; // item-uni-estab.cod-obsoleto
}

/**
 * Dados gerais (mestres) do item
 */
export interface ItemInformacoesGerais {
  identificacaoItemCodigo: string; // item.it-codigo
  identificacaoItemDescricao: string; // item.desc-item
  identificacaoItemUnidade: string; // item.un
  identificacaoItensEstabelecimentos: ItemInformacoesGeraisEstabelecimento[];
}

/**
 * DTO de entrada para buscar item
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

/**
 * Resultado bruto da query SQL (mestre)
 */
export interface ItemMasterQueryResult {
  itemCodigo: string;
  itemDescricao: string;
  itemUnidade: string;
}

/**
 * Resultado bruto da query SQL (estabelecimentos)
 */
export interface ItemEstabQueryResult {
  itemCodigo: string;
  estabCodigo: string;
  estabNome: string;
  codObsoleto: number;
}