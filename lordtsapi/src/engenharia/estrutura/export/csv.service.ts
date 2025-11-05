/**
 * Serviço de exportação para CSV
 */

import { Parser } from 'json2csv';
import type { EstruturaCompleta } from '../informacoesGerais/types';
import type { ExportHeader, ExportResult } from './types';
import { log } from '@shared/utils/logger';

export class CsvExportService {
  /**
   * Gera cabeçalho visual para o CSV
   */
  private static generateHeader(header: ExportHeader): string {
    const { itemPrincipal, parametrosConsulta, dataHoraGeracao } = header;
    const dataRef = parametrosConsulta.dataReferencia || 'Data atual';
    const dataFormatada = new Date(dataHoraGeracao).toLocaleString('pt-BR');

    return [
      '═══════════════════════════════════════════════════════════════════',
      'ESTRUTURA DE PRODUTO (BOM)',
      '═══════════════════════════════════════════════════════════════════',
      '',
      `Item: ${itemPrincipal.codigo} - ${itemPrincipal.descricao}`,
      `Unidade: ${itemPrincipal.unidadeMedida}`,
      `Estabelecimento: ${itemPrincipal.estabelecimento}`,
      `Data de Referência: ${dataRef}`,
      `Quantidade Base: ${parametrosConsulta.quantidadeBase}`,
      `Gerado em: ${dataFormatada}`,
      '',
      '═══════════════════════════════════════════════════════════════════',
      '',
    ].join('\n');
  }

  /**
   * Achata a estrutura recursiva em array de linhas
   */
  private static flattenEstrutura(item: any, nivel = 0, path = '', result: any[] = []): any[] {
    const itemPath = path ? `${path} > ${item.codigo}` : item.codigo;

    result.push({
      nivel,
      path: itemPath,
      codigo: item.codigo,
      descricao: item.descricao,
      unidadeMedida: item.unidadeMedida,
      estabelecimento: item.estabelecimento,
      quantidadeEstrutura: item.quantidadeEstrutura || '',
      quantidadeAcumulada: item.quantidadeAcumulada,
      dataInicio: item.dataInicio || '',
      dataFim: item.dataFim || '',
      totalOperacoes: item.processoFabricacao?.operacao?.length || 0,
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
   * Exporta estrutura para CSV
   */
  static async export(
    estrutura: EstruturaCompleta,
    itemCodigo: string,
    dataReferencia?: string
  ): Promise<ExportResult> {
    try {
      log.info('Gerando exportação CSV', { itemCodigo });

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

      // Gerar cabeçalho visual
      const headerText = this.generateHeader(header);

      // Achatar estrutura
      const flatData = this.flattenEstrutura(estrutura.itemPrincipal);

      // Configurar campos do CSV
      const fields = [
        { label: 'Nível', value: 'nivel' },
        { label: 'Caminho', value: 'path' },
        { label: 'Código', value: 'codigo' },
        { label: 'Descrição', value: 'descricao' },
        { label: 'Unidade', value: 'unidadeMedida' },
        { label: 'Estabelecimento', value: 'estabelecimento' },
        { label: 'Qtd. Estrutura', value: 'quantidadeEstrutura' },
        { label: 'Qtd. Acumulada', value: 'quantidadeAcumulada' },
        { label: 'Data Início', value: 'dataInicio' },
        { label: 'Data Fim', value: 'dataFim' },
        { label: 'Total Operações', value: 'totalOperacoes' },
      ];

      // Gerar CSV
      const parser = new Parser({ fields, delimiter: ';' });
      const csvData = parser.parse(flatData);

      // Combinar header + CSV
      const finalCsv = headerText + '\n' + csvData;

      // Converter para buffer
      const buffer = Buffer.from(finalCsv, 'utf-8');

      const filename = `estrutura_${itemCodigo}_${Date.now()}.csv`;

      log.info('CSV gerado com sucesso', {
        itemCodigo,
        size: buffer.length,
        totalItens: flatData.length,
      });

      return {
        buffer,
        filename,
        mimeType: 'text/csv; charset=utf-8',
        size: buffer.length,
      };
    } catch (error) {
      log.error('Erro ao gerar CSV', {
        itemCodigo,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
