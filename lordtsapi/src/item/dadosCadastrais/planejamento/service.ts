// @ts-nocheck
// src/item/dadosCadastrais/planejamento/service.ts

import { ItemPlanejamentoRepository } from './repository';
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { withErrorHandling, validateEntityExists } from '@shared/utils/serviceHelpers';
import {
  ItemPlanejamentoRaw,
  ItemPlanejamentoResponse,
  EstabelecimentoPlanejamento,
} from './types';

export class PlanejamentoService {
  /**
   * Converte código de situação para descrição
   */
  private static getSituacaoDescricao(situacao: number | null | undefined): string {
    const opcoes = [
      'Ativo',
      'Obsoleto para ordens automáticas',
      'Obsoleto para todas as ordens',
      'Totalmente Obsoleto',
    ];
    return situacao && situacao >= 1 && situacao <= 4 ? opcoes[situacao - 1] : 'N/D';
  }

  /**
   * Converte código de política para descrição
   */
  private static getPoliticaDescricao(politica: number | null | undefined): string {
    const opcoes = [
      'Período Fixo',
      'Lote Econômico',
      'Ordem',
      'Nível Superior',
      'Configurado',
      'Composto',
      'Ponto de Reposição',
    ];
    return politica && politica >= 1 && politica <= 7 ? opcoes[politica - 1] : 'N/D';
  }

  /**
   * Converte booleano Progress para Sim/Não
   */
  private static getSimNao(valor: boolean | number | null | undefined): string {
    if (valor === null || valor === undefined) return 'N/D';
    return valor === true || valor === 1 || valor === '1' ? 'Sim' : 'Não';
  }

  /**
   * Converte código para descrição usando array de opções
   */
  private static escolher(codigo: number | null | undefined, opcoes: string[]): string {
    return codigo && codigo >= 1 && codigo <= opcoes.length ? opcoes[codigo - 1] : 'N/D';
  }

  static async getPlanejamento(itemCodigo: string): Promise<ItemPlanejamentoResponse> {
    return withErrorHandling(
      async () => {
        const dados = await ItemPlanejamentoRepository.getPlanejamento(itemCodigo);

        validateEntityExists(dados, ItemNotFoundError, 'itemCodigo', itemCodigo, 'Item', 'M');

        const dadosArray = Array.isArray(dados) ? dados : [dados];
        const itemDescricao = dadosArray[0].itemDescricao;

        const estabelecimentos: EstabelecimentoPlanejamento[] = dadosArray.map(
          (dado: ItemPlanejamentoRaw) => ({
            codigo: dado.estabCodigo || '',
            nome: dado.estabNome || '',
            producao1: {
              depositoPadrao: dado.depositoPadrao || '',
              localizacao: dado.localizacao || '',
              status: this.getSituacaoDescricao(dado.situacao),
              planejador: {
                codigo: dado.planejadorCodigo || '',
                nome: dado.planejadorNome || '',
              },
              linhaProducao: {
                codigo: dado.linhaProducaoCodigo,
                nome: dado.linhaProducaoNome || '',
              },
              chaoDeFabrica: {
                capacidadeEstoque: dado.capacidadeEstoque,
                consideraAlocAtividades: dado.consideraAlocAtividades,
                programaAlocAtividades: dado.programaAlocAtividades,
                percentualOverlap: dado.percentualOverlap,
              },
            },
            producao2: {
              reportaMOB: this.escolher(dado.reportaMOB, ['Real', 'Padrão']),
              reportaGGF: this.escolher(dado.reportaGGF, ['Real', 'Padrão']),
              tipoAlocacao: this.escolher(dado.tipoAlocacao, ['Total', 'Parcial', 'Proporcional']),
              tipoRequisicao: this.escolher(dado.tipoRequisicao, [
                'Normal',
                'Transferência',
                'Débito GGF',
              ]),
              processoCustos: this.escolher(dado.processoCustos, [
                'Processo Princial',
                'Todos os processos',
              ]),
              reporteProducao: this.escolher(dado.reporteProducao, [
                'Ordem',
                'Operação',
                'Ponto de Controle',
                'Item',
              ]),
              refugo: {
                tratamentoRefugo: this.escolher(dado.tratamentoRefugo, [
                  'Perda Total',
                  'Reciclável',
                ]),
                controlaEstoque: this.getSimNao(dado.controlaEstoque),
                precoFiscal: this.getSimNao(dado.precoFiscal),
                item: {
                  codigo: dado.refugoItemCodigo || 'N/D',
                  descricao: dado.refugoItemDescricao || 'N/D',
                },
                relacaoItem: dado.refugoRelacaoItem,
                fator: dado.refugoFator,
                perda: dado.refugoPerda,
              },
            },
            reposicao: {
              politica: this.getPoliticaDescricao(dado.politica),
              tipoDemanda: this.escolher(dado.demanda, ['Dependente', 'Independente']),
              lote: {
                multiplo: dado.loteMultiplo,
                minimo: dado.loteMinimo,
                economico: dado.loteEconomico,
                periodoFixo: dado.periodoFixo,
                pontoReposicao: dado.pontoReposicao,
              },
              estoqueSeguranca: {
                tipo: dado.estoqueSegurancaTipo === 1 ? 'Quantidade' : 'Tempo',
                valor:
                  dado.estoqueSegurancaTipo === 1
                    ? dado.estoqueSegurancaQtd
                    : dado.estoqueSegurancaTempo,
                converteTempo: this.getSimNao(dado.estoqueSegurancaConvTempo),
              },
            },
            mrp: {
              classeReprogramacao: this.escolher(dado.classeReprogramacao, [
                'Antecipa/Prorroga',
                'Prorroga',
                'Antecipa',
                'Não Reprograma',
              ]),
              emissaoOrdens: this.escolher(dado.emissaoOrdens, ['Automática', 'Manual']),
              divisaoOrdens: this.escolher(dado.divisaoOrdens, [
                'Não divide',
                'Lote Múltiplo',
                'Lote Econômico',
              ]),
              prioridade: dado.prioridade,
              ressuprimento: {
                compras: {
                  quantidade: dado.ressuprimentoComprasQuantidade,
                  fornecedor: dado.ressuprimentoComprasFornecedor,
                  qualidade: dado.ressuprimentoComprasCQ,
                },
                fabrica: {
                  quantidade: dado.ressuprimentoFabricaQuantidade,
                  qualidade: dado.ressuprimentoFabricaCQ,
                  minimo: dado.ressuprimentoFabricaMinimo,
                  variacao: {
                    tempo: dado.ressupFabVarTempo,
                    quantidade: dado.ressupFabVarQuantidade,
                  },
                },
              },
            },
          })
        );

        return {
          item: {
            codigo: itemCodigo,
            descricao: itemDescricao,
            estabelecimento: estabelecimentos,
          },
        };
      },
      {
        entityName: 'planejamento do item',
        codeFieldName: 'itemCodigo',
        codeValue: itemCodigo,
        operationName: 'buscar planejamento',
      },
      ItemNotFoundError
    );
  }
}
