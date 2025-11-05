// src/item/dadosCadastrais/fiscal/service.ts

import { ItemFiscalRepository } from './repository';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';
import { ItemFiscalResponse } from './types';

export class FiscalService {
  static async getFiscal(itemCodigo: string): Promise<ItemFiscalResponse> {
    return withErrorHandling(
      async () => {
        const dados = await ItemFiscalRepository.getFiscal(itemCodigo);

        validateEntityExists(dados, ItemNotFoundError, 'itemCodigo', itemCodigo, 'Item', 'M');

        const dado = Array.isArray(dados) ? dados[0] : dados;

        if (!dado) {
          throw new ItemNotFoundError(itemCodigo);
        }

        return {
          item: {
            codigo: dado.itemCodigo || '',
            descricao: dado.itemDescricao || '',
            gerais: {
              formaDescricao: dado.itemGeraisFormaDescricao || '',
              formaObtencao: dado.itemGeraisFormaObtencao || '',
              quantidadeFracionada: dado.itemGeraisQuantidadeFracionada || '',
              loteMultiplo: dado.itemGeraisLoteMultiplo,
              unidadeNegocio: {
                codigo: dado.itemGeraisUnidadeNegocioCodigo || '',
                nome: dado.itemGeraisUnidadeNegocioNome || '',
              },
              origemUnidTrib: dado.itemGeraisOrigemUnidadeTributaria || '',
            },
            complementares: {
              tipoControle: dado.itemComplementaresTipoControle || '',
              tipoControleEstoque: dado.itemComplementaresTipoControleEstoque || '',
              emissaoNF: dado.itemComplementaresEmissaoNf || '',
              faturavel: dado.itemComplementaresFaturavel || '',
              baixaEstoque: dado.itemComplementaresBaixaEstoque || '',
            },
            fiscal: {
              servico: dado.itemFiscalServico || '',
              classificacao: {
                codigo: dado.itemFiscalClassificacaoCodigo || '',
                ncm: dado.itemFiscalClassificacaoNcm || '',
                nome: dado.itemFiscalClassificacaoNome || '',
              },
              ipi: {
                codigoTributacao: dado.itemFiscalIpiCodigoTributacao || '',
                aliquota: dado.itemFiscalIpiAliquota,
                apuracao: dado.itemFiscalIpiApuracao || '',
                suspenso: dado.itemFiscalIpiSuspenso || '',
                diferenciado: dado.itemFiscalIpiDiferenciado || '',
                incentivado: dado.itemFiscalIpiIncentivado || '',
                combustivelSolvente: dado.itemFiscalIpiCombustivelSolvente || '',
                familia: {
                  codigo: dado.itemFiscalIpiFamiliaCodigo || '',
                  nome: dado.itemFiscalIpiFamiliaNome || '',
                },
              },
              icms: {
                codigoTributacao: dado.itemFiscalIcmsCodigo || '',
                fatorReajuste: dado.itemFiscalIcsmFatorReajuste,
              },
              iss: {
                codigo: dado.itemFiscalIssCodigoTributacao || '',
                aliquota: dado.itemFiscalIssAliquota,
              },
              inss: {
                servicoCodigo: dado.itemFiscalInssServicoCodigo || '',
              },
              DCR: dado.itemFiscalDcr || '',
              sefazSP: dado.itemFiscalSefazSp || '',
            },
            pisCofins: {
              pis: {
                calculoPorUnidade: dado.itemPisCofinsPisCalculoPorUnidade || '',
                valorPorUnidade: dado.itemPisCofinsPisValorPorUnidade,
                aliquotaOrigem: dado.itemPisCofinsPisAliquotaOrigem || '',
                aliquota: dado.itemPisCofinsPisAliquota,
                percentualReducao: dado.itemPisCofinsPisPercentualReducao,
                retencao: {
                  percentual: dado.itemPisCofinsPisRetencaoPercentual,
                  origem: dado.itemPisCofinsPisRetencaoOrigem || '',
                },
              },
              cofins: {
                calculoPorUnidade: dado.itemPisCofinsCofinsCalculoPorUnidade || '',
                valorPorUnidade: dado.itemPisCofinsCofinsValorPorUnidade,
                aliquotaOrigem: dado.itemPisCofinsCofinsAliquotaOrigem || '',
                aliquota: dado.itemPisCofinsCofinsAliquota,
                percentualReducao: dado.itemPisCofinsCofinsPercentualReducao,
                retencao: {
                  percentual: dado.itemPisCofinsCofinsRetencaoPercentual,
                  origem: dado.itemPisCofinsCofinsRetencaoOrigem || '',
                },
              },
              retencaoCsll: {
                origem: '',
                percentual: null,
              },
              substTotalNF: '',
            },
          },
        };
      },
      {
        entityName: 'dados fiscais do item',
        codeFieldName: 'itemCodigo',
        codeValue: itemCodigo,
        operationName: 'buscar dados fiscais',
      },
      ItemNotFoundError
    );
  }
}
