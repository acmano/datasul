// src/item/dadosCadastrais/dimensoes/types/index.ts

/**
 * Dados brutos retornados pela query get-item-dimensoes.sql (ext-item)
 * Aliases curtos (<20 chars) devido limitação Progress ODBC
 */
export interface RawItemDimensoesDB {
  itemcod: string;
  pecaaltura: number | null;
  pecalargura: number | null;
  pecaprof: number | null;
  pecapeso: number | null;
  itembalt: number | null;
  itemblarg: number | null;
  itembprof: number | null;
  itembpeso: number | null;
  itemvalt: number | null;
  itemvlarg: number | null;
  itemvprof: number | null;
  itemvpeso: number | null;
  pecasitem: number | null;
  prodebalt: number | null;
  prodeblarg: number | null;
  prodebprof: number | null;
  prodebpeso: number | null;
  prodgtin13: string | null;
  prodvalt: number | null;
  prodvlarg: number | null;
  prodvprof: number | null;
  prodvpeso: number | null;
  itensprod: number | null;
  caixagtin14: string | null;
  prodscaixa: number | null;
  lastro: number | null;
  camada: number | null;
  embcod: string | null;
}

/**
 * Dados brutos retornados pela query get-embalagem-dimensoes.sql (embalag)
 * Aliases curtos (<20 chars) devido limitação Progress ODBC
 */
export interface RawEmbalagemDB {
  embcod: string;
  embalt: number | null;
  emblarg: number | null;
  embprof: number | null;
  embpeso: number | null;
}

/**
 * Dados brutos retornados pelo repository (após transformação)
 */
export interface ItemDimensoesRaw {
  itemCodigo: string;
  itemDescricao: string;
  pecaAltura: number | null;
  pecaLargura: number | null;
  pecaProfundidade: number | null;
  pecaPeso: number | null;
  itemEmbalagemAltura: number | null;
  itemEmbalagemLargura: number | null;
  itemEmbalagemProfundidade: number | null;
  itemEmbalagemPeso: number | null;
  itemEmbaladoAltura: number | null;
  itemEmbaladoLargura: number | null;
  itemEmbaladoProfundidade: number | null;
  itemEmbaladoPeso: number | null;
  pecasItem: number | null;
  produtoEmbalagemAltura: number | null;
  produtoEmbalagemLargura: number | null;
  produtoEmbalagemProfundidade: number | null;
  produtoEmbalagemPeso: number | null;
  produtoGTIN13: string | null;
  produtoEmbaladoAltura: number | null;
  produtoEmbaladoLargura: number | null;
  produtoEmbaladoProfundidade: number | null;
  produtoEmbaladoPeso: number | null;
  itensProduto: number | null;
  embalagemSigla: string | null;
  embalagemAltura: number | null;
  embalagemLargura: number | null;
  embalagemProfundidade: number | null;
  embalagemPeso: number | null;
  caixaGTIN14: string | null;
  produtosCaixa: number | null;
  paleteLastro: number | null;
  paleteCamadas: number | null;
  caixasPalete: number | null;
}

/**
 * Estrutura de dimensões físicas
 */
export interface Dimensoes {
  altura: number | null;
  largura: number | null;
  profundidade: number | null;
  peso: number | null;
}

/**
 * Resposta formatada do service
 */
export interface ItemDimensoesResponse {
  itemCodigo: string;
  itemDescricao: string;
  peca: Dimensoes;
  item: {
    pecas: number | null;
    embalagem: Dimensoes;
    embalado: Dimensoes;
  };
  produto: {
    itens: number | null;
    gtin13: string | null;
    embalagem: Dimensoes;
    embalado: Dimensoes;
  };
  caixa: {
    produtos: number | null;
    gtin14: string | null;
    embalagem: {
      sigla: string | null;
      altura: number | null;
      largura: number | null;
      profundidade: number | null;
      peso: number | null;
    };
  };
  palete: {
    lastro: number | null;
    camadas: number | null;
    caixasPalete: number | null;
  };
}
