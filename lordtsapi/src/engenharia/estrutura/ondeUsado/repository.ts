import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { log } from '@shared/utils/logger';
import { DatabaseError } from '@shared/errors/errors';
import { OndeUsadoQueries } from './queries';
import type { OndeUsadoCompleto, ItemOndeUsado, ItemFinal, ResumoHoras } from './types';

interface RawRootItem {
  itemCodigo: string;
  codEstabel: string;
  descricao: string;
  unidadeMedida: string;
  tipo: string;
}

interface RawPai {
  itemCodigoPai: string;
  pTipo: string;
  componenteCodigo: string;
  cTipo: string;
  qtdCompon: number;
  dataInicio: string | null;
  dataFim: string | null;
  descricao: string;
  unidadeMedida: string;
  codEstabel: string;
}

interface RawProcesso {
  itemCodigo: string;
  opCodigo: number;
  descricao: string;
  nrUnidades: number;
  numeroHomem: number;
  tempoHomem: number;
  tempoMaquin: number;
  proporcao: number;
  unMedTempo: number;
  codEstabel: string;
  ccCodigo: string;
  gmCodigo: string;
  gmDescricao: string;
  ccDescricao: string;
  un: string;
}

/**
 * Repository - Onde Usado (Where Used)
 *
 * ✨ REFATORADO: Convertido de Stored Procedure SQL Server para ODBC queries + TypeScript BFS INVERSO
 *
 * Percorre a estrutura de produtos de baixo para cima (componente -> produtos que o usam)
 */
export class OndeUsadoRepository {
  private static readonly MAX_DEPTH = 50; // Limite de níveis para prevenir loops infinitos

  /**
   * Converte unidade de tempo para horas
   */
  private static converterParaHoras(valor: number, unidadeTempo: number): number {
    switch (unidadeTempo) {
      case 1:
        return valor; // Já em horas
      case 2:
        return valor / 60; // Minutos para horas
      case 3:
        return valor / 3600; // Segundos para horas
      case 4:
        return valor * 24; // Dias para horas
      default:
        return valor;
    }
  }

  /**
   * Busca onde um componente é usado (Where Used)
   *
   * Implementa BFS INVERSO em TypeScript para construir a árvore de baixo para cima
   *
   * @param itemCodigo - Código do componente (item inicial)
   * @param dataReferencia - Data de referência opcional (formato YYYY-MM-DD)
   * @param apenasFinais - Se true, retorna apenas lista simples dos leafs com tipo=FINAL
   * @returns Lista de itens que usam o componente em formato JSON hierárquico ou lista de finais
   */
  static async getOndeUsado(
    itemCodigo: string,
    dataReferencia?: string,
    apenasFinais = false
  ): Promise<OndeUsadoCompleto | null> {
    try {
      const startTime = Date.now();

      log.debug('Buscando onde usado para o item', {
        itemCodigo,
        dataReferencia,
      });

      // === 1. Buscar item raiz (componente) ===
      const queryRoot = OndeUsadoQueries.getOndeUsadoRoot();
      const paramsRoot: QueryParameter[] = [{ name: 'codigo', type: 'varchar', value: itemCodigo }];

      const resultRoot = await DatabaseManager.datasul('emp').query<RawRootItem>(
        queryRoot,
        paramsRoot
      );

      if (!resultRoot || resultRoot.length === 0) {
        log.warn('Item raiz não encontrado (Onde Usado)', { itemCodigo });
        return null;
      }

      const rootItem = resultRoot[0];

      // === 2. Estruturas auxiliares para BFS INVERSO ===
      interface NoOndeUsado {
        codigo: string;
        estabelecimento: string;
        descricao: string;
        unidadeMedida: string;
        tipo: string;
        nivel: number;
        quantidadeEstrutura: number | null;
        quantidadeAcumulada: number;
        dataInicio?: string | null;
        dataFim?: string | null;
        processos: unknown[];
        pais: NoOndeUsado[]; // INVERSO: em vez de componentes, temos pais!
      }

      const root: NoOndeUsado = {
        codigo: rootItem.itemCodigo?.trim() || '',
        estabelecimento: rootItem.codEstabel?.trim() || '',
        descricao: rootItem.descricao?.trim() || '',
        unidadeMedida: rootItem.unidadeMedida?.trim() || '',
        tipo: rootItem.tipo?.trim() || '',
        nivel: 0,
        quantidadeEstrutura: null,
        quantidadeAcumulada: 1,
        dataInicio: null,
        dataFim: null,
        processos: [],
        pais: [],
      };

      // === 3. BFS INVERSO: Processar nível por nível (de baixo para cima) ===
      let nivelAtual: NoOndeUsado[] = [root];
      let nivelCorrente = 0;
      let totalItens = 1;
      let totalOperacoes = 0;

      // Mapas para acumular horas por centro de custo
      const horasPorCC = new Map<
        string,
        {
          estabelecimento: string;
          centroCusto: string;
          descricao: string;
          totalHoras: number;
          horasHomem: number;
          horasMaquina: number;
        }
      >();

      while (nivelAtual.length > 0 && nivelCorrente < this.MAX_DEPTH) {
        const proximoNivel: NoOndeUsado[] = [];

        // Para cada nó do nível atual
        for (const no of nivelAtual) {
          // 3.1 Buscar PAIS que usam este componente (INVERSO!)
          const queryPais = OndeUsadoQueries.getOndeUsadoPais();
          const paramsPais: QueryParameter[] = [
            { name: 'componenteCodigo', type: 'varchar', value: no.codigo },
          ];

          const resultPais = await DatabaseManager.datasul('emp').query<RawPai>(
            queryPais,
            paramsPais
          );

          if (resultPais && resultPais.length > 0) {
            for (const pai of resultPais) {
              // 3.2 Buscar processos do item PAI
              const queryProc = OndeUsadoQueries.getOndeUsadoProcessos();
              const paramsProc: QueryParameter[] = [
                { name: 'codigo', type: 'varchar', value: pai.itemCodigoPai },
              ];

              const processosDoPai: unknown[] = [];
              const resultProc = await DatabaseManager.datasul('emp').query<RawProcesso>(
                queryProc,
                paramsProc
              );

              if (resultProc && resultProc.length > 0) {
                for (const proc of resultProc) {
                  // Calcular horas (multiplicado pela quantidade acumulada)
                  // INVERSO: Ao subir, multiplicamos a quantidade
                  const qtdAcumuladaPai = no.quantidadeAcumulada * (pai.qtdCompon || 1);

                  const horasHomem =
                    qtdAcumuladaPai *
                    ((proc.tempoHomem * proc.proporcao) / (100.0 * proc.nrUnidades || 1)) *
                    this.converterParaHoras(1, proc.unMedTempo);

                  const horasMaquina =
                    qtdAcumuladaPai *
                    ((proc.tempoMaquin * proc.proporcao) / (100.0 * proc.nrUnidades || 1)) *
                    this.converterParaHoras(1, proc.unMedTempo);

                  // Adicionar processo
                  processosDoPai.push({
                    codigo: proc.opCodigo,
                    descricao: proc.descricao?.trim() || '',
                    estabelecimento: proc.codEstabel?.trim() || '',
                    tempos: {
                      tempoHomemOriginal: proc.tempoHomem,
                      tempoMaquinaOriginal: proc.tempoMaquin,
                      unidadeTempoCodigo: proc.unMedTempo,
                      proporcao: proc.proporcao,
                      horasHomemCalculadas: horasHomem,
                      horasMaquinaCalculadas: horasMaquina,
                    },
                    centroCusto: {
                      codigo: proc.ccCodigo?.trim() || '',
                      descricao: proc.ccDescricao?.trim() || '',
                    },
                    grupoMaquina: {
                      codigo: proc.gmCodigo?.trim() || '',
                      descricao: proc.gmDescricao?.trim() || '',
                    },
                    recursos: {
                      nrUnidades: proc.nrUnidades,
                      numeroHomem: proc.numeroHomem,
                      unidadeMedida: proc.un?.trim() || '',
                      unidadeTempo:
                        proc.unMedTempo === 1
                          ? 'h'
                          : proc.unMedTempo === 2
                            ? 'm'
                            : proc.unMedTempo === 3
                              ? 's'
                              : proc.unMedTempo === 4
                                ? 'd'
                                : 'h',
                    },
                  });

                  totalOperacoes++;

                  // Acumular horas por centro de custo
                  const ccKey = `${proc.codEstabel}_${proc.ccCodigo}`;
                  if (!horasPorCC.has(ccKey)) {
                    horasPorCC.set(ccKey, {
                      estabelecimento: proc.codEstabel?.trim() || '',
                      centroCusto: proc.ccCodigo?.trim() || '',
                      descricao: proc.ccDescricao?.trim() || '',
                      totalHoras: 0,
                      horasHomem: 0,
                      horasMaquina: 0,
                    });
                  }

                  const ccData = horasPorCC.get(ccKey)!;
                  ccData.horasHomem += horasHomem;
                  ccData.horasMaquina += horasMaquina;
                  ccData.totalHoras += horasHomem + horasMaquina;
                }
              }

              // Criar nó PAI
              const novoPai: NoOndeUsado = {
                codigo: pai.itemCodigoPai?.trim() || '',
                estabelecimento: pai.codEstabel?.trim() || '',
                descricao: pai.descricao?.trim() || '',
                unidadeMedida: pai.unidadeMedida?.trim() || '',
                tipo: pai.pTipo?.trim() || '',
                nivel: nivelCorrente + 1,
                quantidadeEstrutura: pai.qtdCompon,
                quantidadeAcumulada: no.quantidadeAcumulada * (pai.qtdCompon || 1),
                dataInicio: pai.dataInicio || null,
                dataFim: pai.dataFim || null,
                processos: processosDoPai,
                pais: [], // Recursivo: pais do pai
              };

              no.pais.push(novoPai);
              proximoNivel.push(novoPai);
              totalItens++;
            }
          }
        }

        // Avançar para próximo nível (subindo na hierarquia!)
        nivelAtual = proximoNivel;
        nivelCorrente++;
      }

      // === 4. Construir resumo de horas ===
      const porCentroCusto = Array.from(horasPorCC.values());
      const totais = {
        totalGeralHoras: porCentroCusto.reduce((sum, cc) => sum + cc.totalHoras, 0),
        totalHorasHomem: porCentroCusto.reduce((sum, cc) => sum + cc.horasHomem, 0),
        totalHorasMaquina: porCentroCusto.reduce((sum, cc) => sum + cc.horasMaquina, 0),
      };

      const resumoHoras: ResumoHoras = {
        porCentroCusto,
        totais,
      };

      // === 6. Se modo apenasFinais, extrair apenas os leafs finais ===
      if (apenasFinais) {
        /**
         * Percorre árvore e coleta apenas os leafs com tipo=FINAL
         */
        const coletarFinais = (no: NoOndeUsado, listaFinais: ItemFinal[]): void => {
          // Se é leaf (não tem pais)
          if (!no.pais || no.pais.length === 0) {
            // E se o tipo é FINAL
            if (no.tipo === 'FINAL') {
              listaFinais.push({
                codigo: no.codigo,
                estabelecimento: no.estabelecimento,
                descricao: no.descricao,
                unidadeMedida: no.unidadeMedida,
                quantidadeAcumulada: no.quantidadeAcumulada,
                tipo: no.tipo,
              });
            }
          } else {
            // Se não é leaf, continua percorrendo recursivamente
            for (const pai of no.pais) {
              coletarFinais(pai, listaFinais);
            }
          }
        };

        const listaFinais: ItemFinal[] = [];
        coletarFinais(root, listaFinais);

        const endTime = Date.now();
        const duration = endTime - startTime;

        log.info('Onde Usado (apenas finais) carregado com sucesso', {
          itemCodigo,
          totalNiveis: nivelCorrente,
          totalFinais: listaFinais.length,
          duration,
        });

        return {
          listaFinais,
          metadata: {
            dataGeracao: new Date().toISOString(),
            itemPesquisado: itemCodigo,
            totalNiveis: nivelCorrente,
            totalItens: listaFinais.length,
            totalOperacoes: 0,
            modo: 'apenasFinais',
          },
        };
      } else {
        // === 7. Modo normal - Converter NoOndeUsado para ItemOndeUsado ===
        const convertToItemOndeUsado = (no: NoOndeUsado): ItemOndeUsado => ({
          codigo: no.codigo,
          estabelecimento: no.estabelecimento,
          descricao: no.descricao,
          unidadeMedida: no.unidadeMedida,
          tipo: no.tipo,
          nivel: no.nivel,
          quantidadeEstrutura: no.quantidadeEstrutura,
          quantidadeAcumulada: no.quantidadeAcumulada,
          dataInicio: no.dataInicio,
          dataFim: no.dataFim,
          processoFabricacao: {
            operacao: no.processos as any[],
          },
          usadoEm: no.pais.map(convertToItemOndeUsado), // INVERSO: pais em vez de componentes
        });

        const itemPrincipal = convertToItemOndeUsado(root);

        const endTime = Date.now();
        const duration = endTime - startTime;

        log.info('Onde Usado (estrutura completa) carregado com sucesso', {
          itemCodigo,
          totalNiveis: nivelCorrente,
          totalItens,
          totalOperacoes,
          duration,
        });

        return {
          itemPrincipal,
          resumoHoras,
          metadata: {
            dataGeracao: new Date().toISOString(),
            itemPesquisado: itemCodigo,
            estabelecimentoPrincipal: root.estabelecimento,
            totalNiveis: nivelCorrente,
            totalItens,
            totalOperacoes,
            modo: 'estruturaCompleta',
          },
        };
      }
    } catch (error) {
      log.error('Erro ao buscar Onde Usado do item', {
        itemCodigo,
        dataReferencia,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new DatabaseError(
        `Erro ao buscar Onde Usado do item ${itemCodigo}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Verifica se o serviço está disponível (stub para compatibilidade)
   */
  static async checkStoredProcedureExists(): Promise<boolean> {
    // Com ODBC direto, sempre disponível se o banco estiver acessível
    return true;
  }
}
