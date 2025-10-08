/**
 * Dados do item
 */
export interface ItemData {
  codigo: string;
  descricao: string;
  unidade: string;
}

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
 * Resultado da query de estabelecimentos do item
 */
export interface ItemEstabelecimentoQueryResult {
  itemCodigo: string;
  estabelecimentoCodigo: string;
}
