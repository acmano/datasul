// src/modules/item/dadosCadastrais/manufatura/types/index.ts

export interface ItemManufatura {
  item: {
    codigo: string;
    descricao: string;
    gerais: {
      situacao: string;
      tipoControle: string;
      tipoControleEstoque: string;
      tipoRequisicao: string;
      consideraAlocacaoAtividades: string;
      programaAlocacaoAtividades: string;
      taxaOverlap: number | null; // Percentual 2 casas decimais
    };
    reposicao: {
      politica: string;
      tipoDemanda: string;
      lote: {
        multiplo: number | null; // Inteiro
        minimo: number | null; // Inteiro
        economico: number | null; // Inteiro
      };
      estoqueSeguranca: {
        tipo: string;
        quantidade: number | null; // Inteiro
        tempo: number | null; // Inteiro
        converteTempo: string;
        reabastecimento: string;
      };
      periodoFixo: number | null; // Inteiro
      pontoReposicao: number | null; // Inteiro
      fatorRefugo: number | null; // Percentual 2 casas decimais
      quantidadePerda: number | null; // Decimal 4 casas
    };
    mrp: {
      classeReprogramacao: string;
      emissaoOrdens: string;
      controlePlanejamento: string;
      divisaoOrdens: string;
      processo: string;
      represaDemanda: string;
      ressuprimento: {
        compras: number | null; // Inteiro
        fornecedor: number | null; // Inteiro
        qualidade: number | null; // Inteiro
        fabrica: number | null; // Inteiro
        fabricaQualidade: number | null; // Inteiro
        minimo: number | null; // Inteiro
        variacaoTempo: number | null; // Inteiro
        quantidade: number | null; // Inteiro
        horizonteLiberacao: number | null; // Inteiro
        horizonteFixo: number | null; // Inteiro
      };
    };
    pvMpsCrp: {
      pV: {
        origem: string;
        formula: string;
      };
      MPS: {
        criterioCalculo: string;
        fatorCustoDistribuicao: number | null; // Percentual 2 casas decimais
      };
      CRP: {
        prioridade: number | null; // Inteiro
        programacao: string;
      };
    };
    MES: Record<string, any>;
  };
}
