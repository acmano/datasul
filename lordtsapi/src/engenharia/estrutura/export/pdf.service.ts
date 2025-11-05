/**
 * Serviço de exportação para PDF
 */

import PDFDocument from 'pdfkit';
import type { EstruturaCompleta } from '../informacoesGerais/types';
import type { ExportHeader, ExportResult } from './types';
import { log } from '@shared/utils/logger';

export class PdfExportService {
  /**
   * Adiciona cabeçalho ao PDF
   */
  private static addHeader(doc: PDFKit.PDFDocument, header: ExportHeader): void {
    const { itemPrincipal, parametrosConsulta, dataHoraGeracao } = header;
    const dataRef = parametrosConsulta.dataReferencia || 'Data atual';
    const dataFormatada = new Date(dataHoraGeracao).toLocaleString('pt-BR');

    // Título
    doc.fontSize(18).font('Helvetica-Bold').text('ESTRUTURA DE PRODUTO (BOM)', { align: 'center' });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Informações do item
    doc.fontSize(10).font('Helvetica');

    const leftColumn = 70;
    const rightColumn = 300;
    let currentY = doc.y;

    // Coluna esquerda
    doc
      .font('Helvetica-Bold')
      .text('Item:', leftColumn, currentY, { continued: true })
      .font('Helvetica')
      .text(` ${itemPrincipal.codigo}`, { continued: false });

    currentY += 15;
    doc
      .font('Helvetica-Bold')
      .text('Descrição:', leftColumn, currentY, { continued: true })
      .font('Helvetica')
      .text(` ${itemPrincipal.descricao}`, { continued: false, width: 200 });

    currentY += 30;
    doc
      .font('Helvetica-Bold')
      .text('Unidade:', leftColumn, currentY, { continued: true })
      .font('Helvetica')
      .text(` ${itemPrincipal.unidadeMedida}`, { continued: false });

    currentY += 15;
    doc
      .font('Helvetica-Bold')
      .text('Estabelecimento:', leftColumn, currentY, { continued: true })
      .font('Helvetica')
      .text(` ${itemPrincipal.estabelecimento}`, { continued: false });

    // Coluna direita
    currentY = doc.y - 60; // Volta para alinhar com a primeira linha
    doc
      .font('Helvetica-Bold')
      .text('Data de Referência:', rightColumn, currentY, { continued: true })
      .font('Helvetica')
      .text(` ${dataRef}`, { continued: false });

    currentY += 15;
    doc
      .font('Helvetica-Bold')
      .text('Quantidade Base:', rightColumn, currentY, { continued: true })
      .font('Helvetica')
      .text(` ${parametrosConsulta.quantidadeBase}`, { continued: false });

    currentY += 15;
    doc
      .font('Helvetica-Bold')
      .text('Gerado em:', rightColumn, currentY, { continued: true })
      .font('Helvetica')
      .text(` ${dataFormatada}`, { continued: false });

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  /**
   * Adiciona linha da estrutura ao PDF
   */
  private static addItemRow(
    doc: PDFKit.PDFDocument,
    item: any,
    nivel: number,
    _path: string
  ): void {
    const indent = '  '.repeat(nivel);
    const y = doc.y;

    // Verificar se precisa de nova página
    if (y > 700) {
      doc.addPage();
    }

    doc.fontSize(8).font('Helvetica');

    // Nível e Código (com indentação)
    doc.text(`${nivel}`, 50, y, { width: 20, continued: false });
    doc.text(`${indent}${item.codigo}`, 75, y, { width: 80, continued: false });

    // Descrição
    doc.text(item.descricao, 160, y, { width: 150, continued: false });

    // Quantidade
    const qtd = item.quantidadeEstrutura || item.quantidadeAcumulada || '';
    doc.text(`${qtd}`, 315, y, { width: 40, align: 'right', continued: false });

    // Unidade
    doc.text(item.unidadeMedida, 360, y, { width: 40, continued: false });

    // Operações
    const ops = item.processoFabricacao?.operacao?.length || 0;
    doc.text(`${ops}`, 405, y, { width: 30, align: 'center', continued: false });

    // Vigência
    const vigencia =
      item.dataInicio && item.dataFim
        ? `${item.dataInicio} a ${item.dataFim}`
        : item.dataInicio || item.dataFim || '';
    doc.text(vigencia, 440, y, { width: 100, continued: false });

    doc.moveDown(0.3);
  }

  /**
   * Adiciona tabela da estrutura
   */
  private static addEstruturaTable(doc: PDFKit.PDFDocument, item: any, nivel = 0, path = ''): void {
    const itemPath = path ? `${path} > ${item.codigo}` : item.codigo;

    this.addItemRow(doc, item, nivel, itemPath);

    // Recursão nos componentes
    if (item.componentes && item.componentes.length > 0) {
      item.componentes.forEach((comp: any) => {
        this.addEstruturaTable(doc, comp, nivel + 1, itemPath);
      });
    }
  }

  /**
   * Adiciona cabeçalho da tabela
   */
  private static addTableHeader(doc: PDFKit.PDFDocument): void {
    const y = doc.y;

    doc.fontSize(9).font('Helvetica-Bold');

    doc.text('Nv', 50, y, { width: 20, continued: false });
    doc.text('Código', 75, y, { width: 80, continued: false });
    doc.text('Descrição', 160, y, { width: 150, continued: false });
    doc.text('Qtd', 315, y, { width: 40, align: 'right', continued: false });
    doc.text('UN', 360, y, { width: 40, continued: false });
    doc.text('Ops', 405, y, { width: 30, align: 'center', continued: false });
    doc.text('Vigência', 440, y, { width: 100, continued: false });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
  }

  /**
   * Adiciona resumo de horas em nova página
   */
  private static addResumoHoras(doc: PDFKit.PDFDocument, estrutura: EstruturaCompleta): void {
    doc.addPage();

    doc.fontSize(14).font('Helvetica-Bold').text('RESUMO DE HORAS', { align: 'center' });
    doc.moveDown(1);

    // Cabeçalho da tabela
    doc.fontSize(9).font('Helvetica-Bold');
    const y = doc.y;

    doc.text('Centro Custo', 50, y, { width: 80, continued: false });
    doc.text('Descrição', 135, y, { width: 200, continued: false });
    doc.text('H. Total', 340, y, { width: 60, align: 'right', continued: false });
    doc.text('H. Homem', 405, y, { width: 60, align: 'right', continued: false });
    doc.text('H. Máq', 470, y, { width: 60, align: 'right', continued: false });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    // Dados
    doc.fontSize(8).font('Helvetica');

    estrutura.resumoHoras?.porCentroCusto?.forEach((cc) => {
      const y = doc.y;

      if (y > 700) doc.addPage();

      doc.text(cc.centroCusto, 50, y, { width: 80, continued: false });
      doc.text(cc.descricao, 135, y, { width: 200, continued: false });
      doc.text(cc.totalHoras.toFixed(2), 340, y, { width: 60, align: 'right', continued: false });
      doc.text(cc.horasHomem.toFixed(2), 405, y, { width: 60, align: 'right', continued: false });
      doc.text(cc.horasMaquina.toFixed(2), 470, y, { width: 60, align: 'right', continued: false });

      doc.moveDown(0.3);
    });

    // Totais
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    const totais = estrutura.resumoHoras?.totais;
    if (totais) {
      doc.fontSize(10).font('Helvetica-Bold');

      doc.text('TOTAIS GERAIS:', 50, doc.y);
      doc.moveDown(0.5);

      doc.fontSize(9).font('Helvetica');
      doc.text(`Total Geral de Horas: ${totais.totalGeralHoras.toFixed(2)}h`, 70);
      doc.text(`Total Horas Homem: ${totais.totalHorasHomem.toFixed(2)}h`, 70);
      doc.text(`Total Horas Máquina: ${totais.totalHorasMaquina.toFixed(2)}h`, 70);
    }
  }

  /**
   * Exporta estrutura para PDF
   */
  static async export(
    estrutura: EstruturaCompleta,
    itemCodigo: string,
    dataReferencia?: string
  ): Promise<ExportResult> {
    return new Promise((resolve, reject) => {
      try {
        log.info('Gerando exportação PDF', { itemCodigo });

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

        // Criar documento PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(buffers);
          const filename = `estrutura_${itemCodigo}_${Date.now()}.pdf`;

          log.info('PDF gerado com sucesso', {
            itemCodigo,
            size: buffer.length,
          });

          resolve({
            buffer,
            filename,
            mimeType: 'application/pdf',
            size: buffer.length,
          });
        });

        doc.on('error', reject);

        // Adicionar cabeçalho
        this.addHeader(doc, header);

        // Adicionar tabela de estrutura
        this.addTableHeader(doc);
        this.addEstruturaTable(doc, estrutura.itemPrincipal);

        // Adicionar resumo de horas
        this.addResumoHoras(doc, estrutura);

        // Finalizar PDF
        doc.end();
      } catch (error) {
        log.error('Erro ao gerar PDF', {
          itemCodigo,
          error: error instanceof Error ? error.message : String(error),
        });
        reject(error);
      }
    });
  }
}
