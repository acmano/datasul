// src/item/dadosCadastrais/manufatura/types.ts

export interface ItemManufaturaRaw {
  codigo: string;
  descricao: string;
  situacao: number | null;
  tipoControle: number | null;
  tipoControleEstoque: number | null;
  tipoRequisicao: number | null;
  consideraAlocacaoAtividades: boolean | null;
  programaAlocacaoAtividades: boolean | null;
  taxaOverlap: number | null;
  politica: number | null;
  demanda: number | null;
  loteMultiplo: number | null;
  loteMinimo: number | null;
  loteEconomico: number | null;
  estoqueSegurancaTipo: number | null;
  estoqueSegurancaQuantidade: number | null;
  periodoFixo: number | null;
  pontoReposicao: number | null;
  estoqueSegurancaTempo: number | null;
  estoqueSegurancaConverteTempo: boolean | null;
  char1: string | null; // Campo char-1 do Progress (contém dados empacotados)
  mrpClaseReprogramacao: number | null;
  mrpEmissaoOrdens: number | null;
  mrpControlePlanejamento: number | null;
  mrpDivisaoOrdens: number | null;
  mrpProcesso: number | null;
  mrpRessuprimentoCompras: number | null;
  mrpRessuprimentoFornecedor: number | null;
  mrpRessuprimentoQualidade: number | null;
  mrpRessuprimentoFabrica: number | null;
  mrpRessuprimentoFabricaQualidade: number | null;
  mrpRessuprimentoHorizonteFixo: number | null;
  mrpPvMpsCrpPVOrigem: number | null;
  mrpPvMpsCrpPVFormula: number | null;
  mrpPvMpsCrpMpsCriterioCalculo: number | null;
  mrpPvMpsCrpMpsFatorCustoDistribuicao: number | null;
  mrpPvMpsCrpCrpPrioridade: number | null;
  mrpPvMpsCrpCrpProgramacao: number | null;
}

export interface ItemManufaturaResponse {
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
      taxaOverlap: number | null; // ✅ NÚMERO (percentual 2 casas)
    };
    reposicao: {
      politica: string;
      tipoDemanda: string;
      lote: {
        multiplo: number | null; // ✅ NÚMERO (inteiro)
        minimo: number | null; // ✅ NÚMERO (inteiro)
        economico: number | null; // ✅ NÚMERO (inteiro)
      };
      estoqueSeguranca: {
        tipo: string;
        quantidade: number | null; // ✅ NÚMERO (inteiro)
        tempo: number | null; // ✅ NÚMERO (inteiro)
        converteTempo: string;
        reabastecimento: string;
      };
      periodoFixo: number | null; // ✅ NÚMERO (inteiro)
      pontoReposicao: number | null; // ✅ NÚMERO (inteiro)
      fatorRefugo: number | null; // ✅ NÚMERO (percentual 2 casas) - TODO: adicionar no banco
      quantidadePerda: number | null; // ✅ NÚMERO (decimal 4 casas) - TODO: adicionar no banco
    };
    mrp: {
      classeReprogramacao: string;
      emissaoOrdens: string;
      controlePlanejamento: string;
      divisaoOrdens: string;
      processo: string;
      represaDemanda: string;
      ressuprimento: {
        compras: number | null; // ✅ NÚMERO (inteiro)
        fornecedor: number | null; // ✅ NÚMERO (inteiro)
        qualidade: number | null; // ✅ NÚMERO (inteiro)
        fabrica: number | null; // ✅ NÚMERO (inteiro)
        fabricaQualidade: number | null; // ✅ NÚMERO (inteiro)
        minimo: number | null; // ✅ NÚMERO (inteiro)
        variacaoTempo: number | null; // ✅ NÚMERO (inteiro)
        quantidade: number | null; // ✅ NÚMERO (inteiro)
        horizonteLiberacao: number | null; // ✅ NÚMERO (inteiro)
        horizonteFixo: number | null; // ✅ NÚMERO (inteiro)
      };
    };
    pvMpsCrp: {
      pV: {
        origem: string;
        formula: string;
      };
      MPS: {
        criterioCalculo: string;
        fatorCustoDistribuicao: number | null; // ✅ NÚMERO (percentual 2 casas)
      };
      CRP: {
        prioridade: number | null; // ✅ NÚMERO (inteiro)
        programacao: string;
      };
    };
    MES: Record<string, never>;
  };
}
