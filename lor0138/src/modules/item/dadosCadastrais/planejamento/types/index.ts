// src/modules/item/dadosCadastrais/planejamento/types/index.ts

export interface EstabelecimentoPlanejamento {
  codigo: string;
  nome: string;
  producao1: {
    depositoPadrao: string;
    localizacao: string;
    status: number;
    planejador: {
      codigo: string;
      nome: string;
    };
    linhaProducao: {
      codigo: number | null;
      nome: string;
    };
    chaoDeFabrica: {
      capacidadeEstoque: number | null;
      consideraAlocAtividades: boolean | null;
      programaAlocAtividades: boolean | null;
      percentualOverlap: number | null;
    };
  };
  producao2: {
    reportaMOB: string;
    reportaGGF: string;
    tipoAlocacao: string;
    tipoRequisicao: string;
    processoCustos: string;
    reporteProducao: string;
    refugo: {
      tratamentoRefugo: string;
      controlaEstoque: string;
      precoFiscal: string;
      item: {
        codigo: string;
        descricao: string;
      };
      relacaoItem: number | null;
      fator: number | null;
      perda: number | null;
    };
  };
  reposicao: {
    politica: string;
    tipoDemanda: string;
    lote: {
      multiplo: number | null;
      minimo: number | null;
      economico: number | null;
      periodoFixo: number | null;
      pontoReposicao: number | null;
    };
    estoqueSeguranca: {
      tipo: string;
      valor: number | null;
      converteTempo: string;
    };
  };
  mrp: {
    classeReprogramacao: string;
    emissaoOrdens: string;
    divisaoOrdens: string;
    prioridade: number | null;
    ressuprimento: {
      compras: {
        quantidade: number | null;
        fornecedor: number | null;
        qualidade: number | null;
      };
      fabrica: {
        quantidade: number | null;
        qualidade: number | null;
        minimo: number | null;
        variacao: {
          tempo: number | null;
          quantidade: number | null;
        };
      };
    };
  };
}

export interface ItemPlanejamento {
  item: {
    codigo: string;
    descricao: string;
    estabelecimento: EstabelecimentoPlanejamento[];
  };
}
