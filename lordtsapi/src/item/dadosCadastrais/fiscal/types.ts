// src/item/dadosCadastrais/fiscal/types.ts

/**
 * Raw data interface - Direct from ODBC Progress query
 * No transformations applied, lowercase field names
 * Aliases shortened to <20 chars due to Progress ODBC limits
 */
export interface RawItemFiscal {
  cod: string;
  descricao: string;
  geraisformdesc: number | null;
  geraisformobt: number | null;
  geraisfrac: number | null;
  geraislote: number | null;
  geraisuncod: string | null;
  geraisunnome: string | null;
  comptipoctrl: number | null;
  comptipocest: number | null;
  compfat: number | null;
  compbaixa: number | null;
  fiscserv: string | null;
  fiscclasscod: string | null;
  fiscclassncm: number | null;
  fiscclassnome: string | null;
  fiscipicodtrib: number | null;
  fiscipialiq: number | null;
  fiscipiapurac: number | null;
  itemchar2: string | null;
  fiscipidife: number | null;
  fiscipiincent: number | null;
  fiscipicombust: number | null;
  fiscipifamcod: string | null;
  fiscipifamnome: string | null;
  fiscicmscodtrib: number | null;
  fiscicmsfator: number | null;
  fiscisscodtrib: string | null;
  fiscissaliq: number | null;
  fiscdcr: string | null;
  fiscsefaz: string | null;
  piscalc: number | null;
  pisvalor: number | null;
  pisretenc: number | null;
  pisretorig: string | null;
  cofinscalc: number | null;
  cofinsvalor: number | null;
  cofinsretenc: number | null;
  cofinsretorig: string | null;
}

/**
 * Transformed data interface - After TypeScript transformations
 * This is the final output format sent to the API
 */
export interface ItemFiscalRaw {
  itemCodigo: string;
  itemDescricao: string;
  itemGeraisFormaDescricao: string | null;
  itemGeraisFormaObtencao: string | null;
  itemGeraisQuantidadeFracionada: string | null;
  itemGeraisLoteMultiplo: number | null;
  itemGeraisUnidadeNegocioCodigo: string | null;
  itemGeraisUnidadeNegocioNome: string | null;
  itemGeraisOrigemUnidadeTributaria: string | null;
  itemComplementaresTipoControle: string | null;
  itemComplementaresTipoControleEstoque: string | null;
  itemComplementaresEmissaoNf: string | null;
  itemComplementaresFaturavel: string | null;
  itemComplementaresBaixaEstoque: string | null;
  itemFiscalServico: string | null;
  itemFiscalClassificacaoCodigo: string | null;
  itemFiscalClassificacaoNcm: string | null;
  itemFiscalClassificacaoNome: string | null;
  itemFiscalIpiCodigoTributacao: string | null;
  itemFiscalIpiAliquota: number | null;
  itemFiscalIpiApuracao: string | null;
  itemFiscalIpiSuspenso: string | null;
  itemFiscalIpiDiferenciado: string | null;
  itemFiscalIpiIncentivado: string | null;
  itemFiscalIpiCombustivelSolvente: string | null;
  itemFiscalIpiFamiliaCodigo: string | null;
  itemFiscalIpiFamiliaNome: string | null;
  itemFiscalIcmsCodigo: string | null;
  itemFiscalIcsmFatorReajuste: number | null;
  itemFiscalIssCodigoTributacao: string | null;
  itemFiscalIssAliquota: number | null;
  itemFiscalInssServicoCodigo: string | null;
  itemFiscalDcr: string | null;
  itemFiscalSefazSp: string | null;
  itemPisCofinsPisCalculoPorUnidade: string | null;
  itemPisCofinsPisValorPorUnidade: number | null;
  itemPisCofinsPisAliquotaOrigem: string | null;
  itemPisCofinsPisAliquota: number | null;
  itemPisCofinsPisPercentualReducao: number | null;
  itemPisCofinsPisRetencaoPercentual: number | null;
  itemPisCofinsPisRetencaoOrigem: string | null;
  itemPisCofinsCofinsCalculoPorUnidade: string | null;
  itemPisCofinsCofinsValorPorUnidade: number | null;
  itemPisCofinsCofinsAliquotaOrigem: string | null;
  itemPisCofinsCofinsAliquota: number | null;
  itemPisCofinsCofinsPercentualReducao: number | null;
  itemPisCofinsCofinsRetencaoPercentual: number | null;
  itemPisCofinsCofinsRetencaoOrigem: string | null;
}

export interface ItemFiscalResponse {
  item: {
    codigo: string;
    descricao: string;
    gerais: {
      formaDescricao: string;
      formaObtencao: string;
      quantidadeFracionada: string;
      loteMultiplo: number | null;
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
        aliquota: number | null;
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
        fatorReajuste: number | null;
      };
      iss: {
        codigo: string;
        aliquota: number | null;
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
        valorPorUnidade: number | null;
        aliquotaOrigem: string;
        aliquota: number | null;
        percentualReducao: number | null;
        retencao: {
          percentual: number | null;
          origem: string;
        };
      };
      cofins: {
        calculoPorUnidade: string;
        valorPorUnidade: number | null;
        aliquotaOrigem: string;
        aliquota: number | null;
        percentualReducao: number | null;
        retencao: {
          percentual: number | null;
          origem: string;
        };
      };
      retencaoCsll: {
        origem: string;
        percentual: number | null;
      };
      substTotalNF: string;
    };
  };
}
