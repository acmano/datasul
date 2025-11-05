// src/modules/item/dadosCadastrais/informacoesGerais/types/dimensoes.types.ts

export interface ItemDimensoes {
  itemCodigo: string;
  itemDescricao: string;
  peca: {
    altura: number;
    largura: number;
    profundidade: number;
    peso: number;
  };
  item: {
    pecas: number;
    embalagem: {
      altura: number;
      largura: number;
      profundidade: number;
      peso: number;
    };
    embalado: {
      altura: number;
      largura: number;
      profundidade: number;
      peso: number;
    };
  };
  produto: {
    itens: number;
    gtin13?: string;
    embalagem: {
      altura: number;
      largura: number;
      profundidade: number;
      peso: number;
    };
    embalado: {
      altura: number;
      largura: number;
      profundidade: number;
      peso: number;
    };
  };
  caixa: {
    produtos: number;
    gtin14?: number;
    embalagem: {
      sigla: string;
      altura: number;
      largura: number;
      profundidade: number;
      peso: number;
    };
  };
  palete: {
    lastro: number;
    camadas: number;
    caixasPalete: number;
  };
}
