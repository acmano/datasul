// src/modules/fiscal/base/types/index.ts

export interface ItemFiscal {
  item: {
    codigo: string;
    descricao: string;
    gerais: {
      formaDescricao: string;
      formaObtencao: string;
      quantidadeFracionada: string;
      loteMultiplo: string;
      unidadeNegocio: {
        codigo: string;
        nome: string;
      };
      origemUnidTrib: string;
    };
    complementares: {
      tipoControle: string;
      tipoControleEstoque: string;
      emissaoNF: string;
      faturavel: string;
      baixaEstoque: string;
    };
    fiscal: {
      servico: string;
      classificacao: {
        codigo: string;
        ncm: string;
        nome: string;
      };
      ipi: {
        codigoTributacao: string;
        aliquota: string;
        apuracao: string;
        suspenso: string;
        diferenciado: string;
        incentivado: string;
        combustivelSolvente: string;
        familia: {
          codigo: string;
          nome: string;
        };
      };
      icms: {
        codigoTributacao: string;
        fatorReajuste: string;
      };
      iss: {
        codigo: string;
        aliquota: string;
      };
      inss: {
        servicoCodigo: string;
      };
      DCR: string;
      sefazSP: string;
    };
    pisCofins: {
      pis: {
        calculoPorUnidade: string;
        valorPorUnidade: string;
        aliquotaOrigem: string;
        aliquota: string;
        percentualReducao: string;
        retencao: {
          percentual: string;
          origem: string;
        };
      };
      cofins: {
        calculoPorUnidade: string;
        valorPorUnidade: string;
        aliquotaOrigem: string;
        aliquota: string;
        percentualReducao: string;
        retencao: {
          percentual: string;
          origem: string;
        };
      };
      retencaoCsll: {
        origem: string;
        percentual: string;
      };
      substTotalNF: string;
    };
  };
}
