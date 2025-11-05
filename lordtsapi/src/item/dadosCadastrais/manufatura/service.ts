// src/item/dadosCadastrais/manufatura/service.ts

import { ItemManufaturaRepository } from './repository';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';
import { ItemManufaturaRaw, ItemManufaturaResponse } from './types';

export class ManufaturaService {
  /**
   * Converte código para descrição usando array de opções
   */
  private static escolher(codigo: number | null | undefined, opcoes: string[]): string {
    return codigo && codigo >= 1 && codigo <= opcoes.length ? opcoes[codigo - 1] : '';
  }

  /**
   * Converte booleano para Sim/Não
   */
  private static getSimNao(valor: boolean | null | undefined): string {
    if (valor === null || valor === undefined) return '';
    return valor ? 'Sim' : 'Não';
  }

  /**
   * Extrai dados do campo char1 (campo empacotado do Progress)
   */
  private static parseChar1(char1: string | null): {
    reabastecimento: string;
    represaDemanda: string;
    mrpRessuprimentoMinimo: number | null;
    mrpRessuprimentoVariacaoTempo: number | null;
    mrpRessuprimentoQuantidade: number | null;
    mrpRessuprimentoHorizonteLiberacao: number | null;
  } {
    if (!char1) {
      return {
        reabastecimento: '',
        represaDemanda: '',
        mrpRessuprimentoMinimo: null,
        mrpRessuprimentoVariacaoTempo: null,
        mrpRessuprimentoQuantidade: null,
        mrpRessuprimentoHorizonteLiberacao: null,
      };
    }

    // SUBSTRING(char1, 10, 1) = '1' => Demanda, senão Quantidade
    const reabastecimento = char1.length >= 10 && char1[9] === '1' ? 'Demanda' : 'Quantidade';

    // SUBSTRING(char1, 132, 1) = '1' => Sim, senão Não
    const represaDemanda = char1.length >= 132 && char1[131] === '1' ? 'Sim' : 'Não';

    // SUBSTRING(char1, 20, 12) - mrpRessuprimentoMinimo
    const minimoStr = char1.length >= 32 ? char1.substring(19, 31).trim().replace(',', '.') : '';
    const mrpRessuprimentoMinimo = minimoStr ? parseFloat(minimoStr) : null;

    // SUBSTRING(char1, 14, 4) - mrpRessuprimentoVariacaoTempo
    const varTempoStr = char1.length >= 18 ? char1.substring(13, 17).trim() : '';
    const mrpRessuprimentoVariacaoTempo = varTempoStr ? parseInt(varTempoStr) : null;

    // SUBSTRING(char1, 35, 12) - mrpRessuprimentoQuantidade
    const qtdStr = char1.length >= 47 ? char1.substring(34, 46).trim().replace(',', '.') : '';
    const mrpRessuprimentoQuantidade = qtdStr ? parseFloat(qtdStr) : null;

    // SUBSTRING(char1, 129, 3) - mrpRessuprimentoHorizonteLiberacao
    const horizStr = char1.length >= 132 ? char1.substring(128, 131).trim() : '';
    const mrpRessuprimentoHorizonteLiberacao = horizStr ? parseInt(horizStr) : null;

    return {
      reabastecimento,
      represaDemanda,
      mrpRessuprimentoMinimo,
      mrpRessuprimentoVariacaoTempo,
      mrpRessuprimentoQuantidade,
      mrpRessuprimentoHorizonteLiberacao,
    };
  }

  static async getManufatura(itemCodigo: string): Promise<ItemManufaturaResponse> {
    return withErrorHandling(
      async () => {
        const dados = await ItemManufaturaRepository.getManufatura(itemCodigo);

        validateEntityExists(dados, ItemNotFoundError, 'itemCodigo', itemCodigo, 'Item', 'M');

        const dadosArray = Array.isArray(dados) ? dados : [dados];
        const dado: ItemManufaturaRaw = dadosArray[0];

        // Extrai dados do campo char1
        const char1Data = this.parseChar1(dado.char1);

        return {
          item: {
            codigo: dado.codigo || '',
            descricao: dado.descricao || '',
            gerais: {
              situacao: this.escolher(dado.situacao, [
                'Ativo',
                'Obsoleto Ordens Automáticas',
                'Obsoleto Todas as Ordens',
                'Totalmente Obsoleto',
              ]),
              tipoControle: this.escolher(dado.tipoControle, [
                'Físico',
                'Total',
                'Consignado',
                'Débito Direto',
                'Não Definido',
              ]),
              tipoControleEstoque: this.escolher(dado.tipoControleEstoque, [
                'Serial',
                'Número Série',
                'Lote',
                'Referência',
              ]),
              tipoRequisicao: this.escolher(dado.tipoRequisicao, [
                'Normal',
                'Transferência',
                'Débito GGF',
              ]),
              consideraAlocacaoAtividades: this.getSimNao(dado.consideraAlocacaoAtividades),
              programaAlocacaoAtividades: this.getSimNao(dado.programaAlocacaoAtividades),
              taxaOverlap: dado.taxaOverlap,
            },
            reposicao: {
              politica: this.escolher(dado.politica, [
                'Período Fixo',
                'Lote Econômico',
                'Ordem',
                'Nível Superior',
                'Configurado',
                'Composto',
                'Ponto de Reposição',
              ]),
              tipoDemanda: this.escolher(dado.demanda, ['Dependente', 'Independente']),
              lote: {
                multiplo: dado.loteMultiplo, // ✅ NÚMERO
                minimo: dado.loteMinimo, // ✅ NÚMERO
                economico: dado.loteEconomico, // ✅ NÚMERO
              },
              estoqueSeguranca: {
                tipo: dado.estoqueSegurancaTipo === 1 ? 'Quantidade' : 'Tempo',
                quantidade: dado.estoqueSegurancaQuantidade,
                tempo: dado.estoqueSegurancaTempo,
                converteTempo: this.getSimNao(dado.estoqueSegurancaConverteTempo),
                reabastecimento: char1Data.reabastecimento,
              },
              periodoFixo: dado.periodoFixo,
              pontoReposicao: dado.pontoReposicao,
              fatorRefugo: null,
              quantidadePerda: null,
            },
            mrp: {
              classeReprogramacao: this.escolher(dado.mrpClaseReprogramacao, [
                'Antecipa/Prorroga',
                'Prorroga',
                'Antecipa',
                'Não Reprograma',
              ]),
              emissaoOrdens: this.escolher(dado.mrpEmissaoOrdens, ['Automático', 'Manual']),
              controlePlanejamento: this.escolher(dado.mrpControlePlanejamento, [
                'Produção',
                'Manutenção Industrial',
              ]),
              divisaoOrdens: this.escolher(dado.mrpDivisaoOrdens, [
                'Não Divide',
                'Lote Múltiplo',
                'Lote Econômico',
              ]),
              processo: this.escolher(dado.mrpProcesso, [
                'Processo Principal',
                'Todos os Processos',
              ]),
              represaDemanda: char1Data.represaDemanda,
              ressuprimento: {
                compras: dado.mrpRessuprimentoCompras,
                fornecedor: dado.mrpRessuprimentoFornecedor,
                qualidade: dado.mrpRessuprimentoQualidade,
                fabrica: dado.mrpRessuprimentoFabrica,
                fabricaQualidade: dado.mrpRessuprimentoFabricaQualidade,
                minimo: char1Data.mrpRessuprimentoMinimo,
                variacaoTempo: char1Data.mrpRessuprimentoVariacaoTempo,
                quantidade: char1Data.mrpRessuprimentoQuantidade,
                horizonteLiberacao: char1Data.mrpRessuprimentoHorizonteLiberacao,
                horizonteFixo: dado.mrpRessuprimentoHorizonteFixo,
              },
            },
            pvMpsCrp: {
              pV: {
                origem: this.escolher(dado.mrpPvMpsCrpPVOrigem, [
                  'Estoque',
                  'Pedidos',
                  'Faturamento',
                ]),
                formula: this.escolher(dado.mrpPvMpsCrpPVFormula, [
                  'Último Período',
                  'Média Móvel',
                  'Média Móvel Ponderada',
                  'Média Móvel Exponencial',
                  'Média Móvel Expnencial Ajustada',
                  'Mínimos Quadradsos',
                  'Focus Forecasting',
                  'Sazonalidade',
                ]),
              },
              MPS: {
                criterioCalculo: this.escolher(dado.mrpPvMpsCrpMpsCriterioCalculo, [
                  'Distribuição e Capacidade',
                  'Capacidade',
                  'Especialidade',
                ]),
                fatorCustoDistribuicao: dado.mrpPvMpsCrpMpsFatorCustoDistribuicao,
              },
              CRP: {
                prioridade: dado.mrpPvMpsCrpCrpPrioridade,
                programacao: this.escolher(dado.mrpPvMpsCrpCrpProgramacao, ['Backward', 'Forward']),
              },
            },
            MES: {},
          },
        };
      },
      {
        entityName: 'manufatura do item',
        codeFieldName: 'itemCodigo',
        codeValue: itemCodigo,
        operationName: 'buscar manufatura',
      },
      ItemNotFoundError
    );
  }
}
