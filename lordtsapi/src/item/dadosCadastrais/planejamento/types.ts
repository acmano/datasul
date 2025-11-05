// src/item/dadosCadastrais/planejamento/types.ts

/**
 * Dados RAW retornados do banco Progress (antes das transformações)
 * Campos numéricos e booleanos conforme retornados pelo ODBC
 */
export interface ItemPlanejamentoRaw {
  itemCodigo: string;
  itemDescricao: string;
  estabCodigo: string;
  estabNome: string; // Adicionado pelo merge com MULT
  depositoPadrao: string | null;
  localizacao: string | null;
  situacao: number | null; // 1-4 (RAW)
  planejadorCodigo: string | null;
  planejadorNome: string | null;
  linhaProducaoCodigo: number | null;
  linhaProducaoNome: string | null;
  capacidadeEstoque: number | null;
  consideraAlocAtividades: boolean | number | null;
  programaAlocAtividades: boolean | number | null;
  percentualOverlap: number | null;
  reportaMOB: number | null; // 1-2 (RAW)
  reportaGGF: number | null; // 1-2 (RAW)
  tipoAlocacao: number | null; // 1-3 (RAW)
  tipoRequisicao: number | null; // 1-3 (RAW)
  processoCustos: number | null; // 1-2 (RAW)
  reporteProducao: number | null; // 1-4 (RAW)
  tratamentoRefugo: number | null; // 1-2 (RAW)
  controlaEstoque: boolean | number | null;
  precoFiscal: boolean | number | null;
  refugoItemCodigo: string | null;
  refugoItemDescricao: string | null;
  refugoRelacaoItem: number | null;
  refugoFator: number | null;
  refugoPerda: number | null;
  politica: number | null; // 1-7 (RAW)
  demanda: number | null; // 1-2 (RAW)
  loteMultiplo: number | null;
  loteMinimo: number | null;
  loteEconomico: number | null;
  periodoFixo: number | null;
  pontoReposicao: number | null;
  estoqueSegurancaTipo: number | null; // 1=Quantidade, 2=Tempo
  estoqueSegurancaQtd: number | null;
  estoqueSegurancaTempo: number | null;
  estoqueSegurancaConvTempo: boolean | number | null;
  classeReprogramacao: number | null; // 1-4 (RAW)
  emissaoOrdens: number | null; // 1-2 (RAW)
  divisaoOrdens: number | null; // 1-3 (RAW)
  prioridade: number | null;
  ressuprimentoComprasQuantidade: number | null;
  ressuprimentoComprasFornecedor: number | null;
  ressuprimentoComprasCQ: number | null;
  ressuprimentoFabricaQuantidade: number | null;
  ressuprimentoFabricaCQ: number | null;
  ressuprimentoFabricaMinimo: number | null;
  ressupFabVarTempo: number | null;
  ressupFabVarQuantidade: number | null;
}

export interface EstabelecimentoPlanejamento {
  codigo: string;
  nome: string;
  producao1: {
    depositoPadrao: string;
    localizacao: string;
    status: string;
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

export interface ItemPlanejamentoResponse {
  item: {
    codigo: string;
    descricao: string;
    estabelecimento: EstabelecimentoPlanejamento[];
  };
}
