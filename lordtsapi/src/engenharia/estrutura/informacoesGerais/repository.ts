import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryParameter } from '@infrastructure/database/types';
import { log } from '@shared/utils/logger';
import { DatabaseError } from '@shared/errors/errors';
import { EngenhariaQueries } from '@/engenharia/queries';
import type { EstruturaCompleta, ItemEstrutura, ResumoHoras, Metadata } from './types';

interface RawRootItem {
  itemCodigo: string;
  codEstabel: string;
  descricao: string;
  unidadeMedida: string;
  tipo: string; // Tipo do item: 0 ou 4 = FINAL, outros = COMPONENTE
}

interface RawComponente {
  itemCodigoPai: string;
  pTipo: string; // Tipo do item pai
  escodigo: string;
  cTipo: string; // Tipo do componente
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
 * Repository - Estrutura de Produtos (BOM) e Processos de Fabricação
 *
 * ✨ REFATORADO: Convertido de Stored Procedure SQL Server para ODBC queries + TypeScript BFS
 */
export class EstruturaInformacoesGeraisRepository {
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
   * Busca a estrutura completa do produto (BOM) com processos de fabricação
   *
   * Implementa BFS (Breadth-First Search) em TypeScript para construir a árvore
   *
   * @param itemCodigo - Código do item principal
   * @param dataReferencia - Data de referência opcional (formato YYYY-MM-DD)
   * @returns Estrutura completa em formato JSON
   */
  static async getEstruturaCompleta(
    itemCodigo: string,
    dataReferencia?: string
  ): Promise<EstruturaCompleta | null> {
    try {
      const startTime = Date.now();

      log.debug('Buscando estrutura do item', {
        itemCodigo,
        dataReferencia,
      });

      // === 1. Buscar item raiz ===
      const queryRoot = EngenhariaQueries.getEstruturaRoot();
      const paramsRoot: QueryParameter[] = [{ name: 'codigo', type: 'varchar', value: itemCodigo }];

      const resultRoot = await DatabaseManager.datasul('emp').query<RawRootItem>(
        queryRoot,
        paramsRoot
      );

      if (!resultRoot || resultRoot.length === 0) {
        log.warn('Item raiz não encontrado', { itemCodigo });
        return null;
      }

      const rootItem = resultRoot[0];

      // === 2. Estruturas auxiliares para BFS ===
      interface NoEstrutura {
        codigo: string;
        estabelecimento: string;
        descricao: string;
        unidadeMedida: string;
        tipo?: string; // Tipo do item
        pTipo?: string; // Tipo do item pai
        cTipo?: string; // Tipo do componente
        nivel: number;
        quantidadeEstrutura: number | null;
        quantidadeAcumulada: number;
        dataInicio?: string | null;
        dataFim?: string | null;
        processos: unknown[];
        componentes: NoEstrutura[];
      }

      const root: NoEstrutura = {
        codigo: rootItem.itemCodigo?.trim() || '',
        estabelecimento: rootItem.codEstabel?.trim() || '',
        descricao: rootItem.descricao?.trim() || '',
        unidadeMedida: rootItem.unidadeMedida?.trim() || '',
        tipo: rootItem.tipo?.trim() || '',
        pTipo: undefined, // Root não tem pai
        cTipo: undefined, // Root não é componente
        nivel: 0,
        quantidadeEstrutura: null,
        quantidadeAcumulada: 1,
        dataInicio: null,
        dataFim: null,
        processos: [],
        componentes: [],
      };

      // === 3. BFS: Processar nível por nível ===
      let nivelAtual: NoEstrutura[] = [root];
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
        const proximoNivel: NoEstrutura[] = [];

        // Para cada nó do nível atual
        for (const no of nivelAtual) {
          // 3.1 Buscar processos do item
          const queryProc = EngenhariaQueries.getEstruturaProcessos();
          const paramsProc: QueryParameter[] = [
            { name: 'codigo', type: 'varchar', value: no.codigo },
          ];

          const resultProc = await DatabaseManager.datasul('emp').query<RawProcesso>(
            queryProc,
            paramsProc
          );

          if (resultProc && resultProc.length > 0) {
            for (const proc of resultProc) {
              // Calcular horas (multiplicado pela quantidade acumulada)
              const horasHomem =
                no.quantidadeAcumulada *
                ((proc.tempoHomem * proc.proporcao) / (100.0 * proc.nrUnidades || 1)) *
                this.converterParaHoras(1, proc.unMedTempo);

              const horasMaquina =
                no.quantidadeAcumulada *
                ((proc.tempoMaquin * proc.proporcao) / (100.0 * proc.nrUnidades || 1)) *
                this.converterParaHoras(1, proc.unMedTempo);

              // Adicionar processo ao nó
              no.processos.push({
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

          // 3.2 Buscar componentes do item
          const queryComp = EngenhariaQueries.getEstruturaComponentes();
          const paramsComp: QueryParameter[] = [
            { name: 'codigo', type: 'varchar', value: no.codigo },
          ];

          const resultComp = await DatabaseManager.datasul('emp').query<RawComponente>(
            queryComp,
            paramsComp
          );

          if (resultComp && resultComp.length > 0) {
            for (const comp of resultComp) {
              const novoNo: NoEstrutura = {
                codigo: comp.escodigo?.trim() || '',
                estabelecimento: comp.codEstabel?.trim() || '',
                descricao: comp.descricao?.trim() || '',
                unidadeMedida: comp.unidadeMedida?.trim() || '',
                tipo: comp.cTipo?.trim() || '', // Tipo do componente
                pTipo: comp.pTipo?.trim() || '', // Tipo do pai
                cTipo: comp.cTipo?.trim() || '', // Tipo do componente
                nivel: nivelCorrente + 1,
                quantidadeEstrutura: comp.qtdCompon,
                quantidadeAcumulada: no.quantidadeAcumulada * (comp.qtdCompon || 0),
                dataInicio: comp.dataInicio || null,
                dataFim: comp.dataFim || null,
                processos: [],
                componentes: [],
              };

              no.componentes.push(novoNo);
              proximoNivel.push(novoNo);
              totalItens++;
            }
          }
        }

        // Avançar para próximo nível
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

      // === 5. Construir metadata ===
      const metadata: Metadata = {
        dataGeracao: new Date().toISOString(),
        itemPesquisado: itemCodigo,
        estabelecimentoPrincipal: root.estabelecimento,
        totalNiveis: nivelCorrente,
        totalItens,
        totalOperacoes,
      };

      // === 6. Converter NoEstrutura para ItemEstrutura (ajustar processoFabricacao) ===
      const convertToItemEstrutura = (no: NoEstrutura): ItemEstrutura => ({
        codigo: no.codigo,
        estabelecimento: no.estabelecimento,
        descricao: no.descricao,
        unidadeMedida: no.unidadeMedida,
        tipo: no.tipo,
        pTipo: no.pTipo,
        cTipo: no.cTipo,
        nivel: no.nivel,
        quantidadeEstrutura: no.quantidadeEstrutura,
        quantidadeAcumulada: no.quantidadeAcumulada,
        dataInicio: no.dataInicio,
        dataFim: no.dataFim,
        processoFabricacao: {
          operacao: no.processos as any[],
        },
        componentes: no.componentes.map(convertToItemEstrutura),
      });

      const itemPrincipal = convertToItemEstrutura(root);

      const endTime = Date.now();
      const duration = endTime - startTime;

      log.info('Estrutura carregada com sucesso', {
        itemCodigo,
        totalNiveis: nivelCorrente,
        totalItens,
        totalOperacoes,
        duration,
      });

      return {
        itemPrincipal,
        resumoHoras,
        metadata,
      };
    } catch (error) {
      log.error('Erro ao buscar estrutura do item', {
        itemCodigo,
        dataReferencia,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new DatabaseError(
        `Erro ao buscar estrutura do item ${itemCodigo}`,
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
