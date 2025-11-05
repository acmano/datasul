/**
 * Serviço de exportação para XLSX (Excel)
 */

import * as XLSX from 'xlsx';
import type { EstruturaCompleta } from '../informacoesGerais/types';
import type { ExportHeader, ExportResult } from './types';
import { log } from '@shared/utils/logger';

export class XlsxExportService {
  /**
   * Cria linhas do cabeçalho para o Excel
   */
  private static createHeaderRows(header: ExportHeader): any[][] {
    const { itemPrincipal, parametrosConsulta, dataHoraGeracao } = header;
    const dataRef = parametrosConsulta.dataReferencia || 'Data atual';
    const dataFormatada = new Date(dataHoraGeracao).toLocaleString('pt-BR');

    return [
      ['ESTRUTURA DE PRODUTO (BOM)'],
      [],
      ['Item:', itemPrincipal.codigo],
      ['Descrição:', itemPrincipal.descricao],
      ['Unidade:', itemPrincipal.unidadeMedida],
      ['Estabelecimento:', itemPrincipal.estabelecimento],
      ['Data de Referência:', dataRef],
      ['Quantidade Base:', parametrosConsulta.quantidadeBase],
      ['Gerado em:', dataFormatada],
      [],
      [], // Linha em branco antes da tabela
    ];
  }

  /**
   * Achata a estrutura recursiva em array de linhas
   */
  private static flattenEstrutura(item: any, nivel = 0, path = '', result: any[] = []): any[] {
    const itemPath = path ? `${path} > ${item.codigo}` : item.codigo;
    const indent = '  '.repeat(nivel); // Indentação visual por nível

    result.push({
      Nível: nivel,
      Caminho: itemPath,
      Código: indent + item.codigo,
      Descrição: item.descricao,
      Unidade: item.unidadeMedida,
      Estabelecimento: item.estabelecimento,
      'Qtd. Estrutura': item.quantidadeEstrutura || '',
      'Qtd. Acumulada': item.quantidadeAcumulada,
      'Data Início': item.dataInicio || '',
      'Data Fim': item.dataFim || '',
      'Total Operações': item.processoFabricacao?.operacao?.length || 0,
    });

    // Recursão nos componentes
    if (item.componentes && item.componentes.length > 0) {
      item.componentes.forEach((comp: any) => {
        this.flattenEstrutura(comp, nivel + 1, itemPath, result);
      });
    }

    return result;
  }

  /**
   * Cria resumo de horas (segunda aba)
   */
  private static createResumoSheet(estrutura: EstruturaCompleta): any[][] {
    const rows: any[][] = [
      ['RESUMO DE HORAS POR CENTRO DE CUSTO'],
      [],
      [
        'Estabelecimento',
        'Centro Custo',
        'Descrição',
        'Horas Total',
        'Horas Homem',
        'Horas Máquina',
      ],
    ];

    // Adicionar linhas de centro de custo
    estrutura.resumoHoras?.porCentroCusto?.forEach((cc) => {
      rows.push([
        cc.estabelecimento,
        cc.centroCusto,
        cc.descricao,
        cc.totalHoras,
        cc.horasHomem,
        cc.horasMaquina,
      ]);
    });

    // Linha vazia
    rows.push([]);

    // Totais
    const totais = estrutura.resumoHoras?.totais;
    if (totais) {
      rows.push(['TOTAIS GERAIS']);
      rows.push(['Total Geral:', totais.totalGeralHoras]);
      rows.push(['Total Horas Homem:', totais.totalHorasHomem]);
      rows.push(['Total Horas Máquina:', totais.totalHorasMaquina]);
    }

    return rows;
  }

  /**
   * Exporta estrutura para XLSX
   */
  static async export(
    estrutura: EstruturaCompleta,
    itemCodigo: string,
    dataReferencia?: string
  ): Promise<ExportResult> {
    try {
      log.info('Gerando exportação XLSX', { itemCodigo });

      // Criar header
      const header: ExportHeader = {
        itemPrincipal: {
          codigo: estrutura.itemPrincipal.codigo,
          descricao: estrutura.itemPrincipal.descricao,
          unidadeMedida: estrutura.itemPrincipal.unidadeMedida,
          estabelecimento: estrutura.itemPrincipal.estabelecimento,
        },
        parametrosConsulta: {
          dataReferencia: dataReferencia || null,
          quantidadeBase: estrutura.itemPrincipal.quantidadeAcumulada || 1.0,
        },
        dataHoraGeracao: new Date().toISOString(),
      };

      // Criar workbook
      const wb = XLSX.utils.book_new();

      // ===== ABA 1: ESTRUTURA =====
      const headerRows = this.createHeaderRows(header);
      const flatData = this.flattenEstrutura(estrutura.itemPrincipal);

      // Combinar header + dados
      const ws1Data = [...headerRows, ...XLSX.utils.json_to_sheet(flatData).data];
      const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);

      // Largura das colunas
      ws1['!cols'] = [
        { wch: 8 }, // Nível
        { wch: 50 }, // Caminho
        { wch: 15 }, // Código
        { wch: 40 }, // Descrição
        { wch: 10 }, // Unidade
        { wch: 15 }, // Estabelecimento
        { wch: 15 }, // Qtd. Estrutura
        { wch: 15 }, // Qtd. Acumulada
        { wch: 12 }, // Data Início
        { wch: 12 }, // Data Fim
        { wch: 15 }, // Total Operações
      ];

      XLSX.utils.book_append_sheet(wb, ws1, 'Estrutura');

      // ===== ABA 2: RESUMO DE HORAS =====
      const resumoData = this.createResumoSheet(estrutura);
      const ws2 = XLSX.utils.aoa_to_sheet(resumoData);

      ws2['!cols'] = [
        { wch: 15 }, // Estabelecimento
        { wch: 15 }, // Centro Custo
        { wch: 40 }, // Descrição
        { wch: 12 }, // Horas Total
        { wch: 12 }, // Horas Homem
        { wch: 15 }, // Horas Máquina
      ];

      XLSX.utils.book_append_sheet(wb, ws2, 'Resumo Horas');

      // ===== ABA 3: METADADOS =====
      const metadata = estrutura.metadata;
      const metadataRows = [
        ['METADADOS DA CONSULTA'],
        [],
        ['Item Pesquisado:', metadata?.itemPesquisado || ''],
        ['Estabelecimento Principal:', metadata?.estabelecimentoPrincipal || ''],
        ['Total de Níveis:', metadata?.totalNiveis || 0],
        ['Total de Itens:', metadata?.totalItens || 0],
        ['Total de Operações:', metadata?.totalOperacoes || 0],
        ['Data de Geração:', metadata?.dataGeracao || ''],
      ];

      const ws3 = XLSX.utils.aoa_to_sheet(metadataRows);
      ws3['!cols'] = [{ wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Metadados');

      // Gerar buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const filename = `estrutura_${itemCodigo}_${Date.now()}.xlsx`;

      log.info('XLSX gerado com sucesso', {
        itemCodigo,
        size: buffer.length,
        totalItens: flatData.length,
      });

      return {
        buffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
      };
    } catch (error) {
      log.error('Erro ao gerar XLSX', {
        itemCodigo,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
