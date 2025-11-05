/**
 * Controller de Exportação de Estruturas
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { EstruturaInformacoesGeraisService } from '../informacoesGerais/service';
import { CsvExportService } from './csv.service';
import { XlsxExportService } from './xlsx.service';
import { PdfExportService } from './pdf.service';
import { log } from '@shared/utils/logger';
import type { ExportFormat } from './types';

export class ExportController {
  /**
   * GET /api/engenharia/estrutura/export/:itemCodigo/:format
   *
   * Exporta a estrutura do produto no formato especificado
   *
   * Parâmetros:
   * - itemCodigo (path): Código do item (obrigatório)
   * - format (path): Formato de exportação - 'csv', 'xlsx' ou 'pdf' (obrigatório)
   * - dataReferencia (query): Data de referência no formato YYYY-MM-DD (opcional)
   */
  static exportEstrutura = asyncHandler(async (req: Request, res: Response) => {
    const itemCodigo: string = req.params.itemCodigo!;
    const format: string = req.params.format!;
    const dataReferencia: string = ((req.query.dataReferencia as string | undefined) ||
      new Date().toISOString().split('T')[0]) as string;

    // Validar formato
    const validFormats: ExportFormat[] = ['csv', 'xlsx', 'pdf'];
    if (!validFormats.includes(format as ExportFormat)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Formato inválido. Use "csv", "xlsx" ou "pdf"',
          code: 'invalid_format',
          details: { format, validFormats },
        },
        correlationId: req.id,
      });
      return;
    }

    log.info('Requisição de exportação recebida', {
      correlationId: req.id,
      itemCodigo,
      format,
      dataReferencia,
      ip: req.ip,
    });

    // Buscar estrutura
    const estrutura = await EstruturaInformacoesGeraisService.getEstrutura(
      itemCodigo,
      dataReferencia
    );

    // Gerar exportação de acordo com o formato
    let result;
    switch (format as ExportFormat) {
      case 'csv':
        result = await CsvExportService.export(estrutura, itemCodigo, dataReferencia);
        break;

      case 'xlsx':
        result = await XlsxExportService.export(estrutura, itemCodigo, dataReferencia);
        break;

      case 'pdf':
        result = await PdfExportService.export(estrutura, itemCodigo, dataReferencia);
        break;
    }

    log.info('Exportação gerada com sucesso', {
      correlationId: req.id,
      itemCodigo,
      format,
      filename: result.filename,
      size: result.size,
    });

    // Configurar headers para download
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.size);
    res.setHeader('X-Correlation-ID', req.id || '');

    // Enviar arquivo
    res.send(result.buffer);
  });

  /**
   * GET /api/engenharia/estrutura/export/:itemCodigo/print
   *
   * Gera PDF otimizado para impressão
   */
  static printEstrutura = asyncHandler(async (req: Request, res: Response) => {
    const itemCodigo: string = req.params.itemCodigo!;
    const dataReferencia: string = ((req.query.dataReferencia as string | undefined) ||
      new Date().toISOString().split('T')[0]) as string;

    log.info('Requisição de impressão recebida', {
      correlationId: req.id,
      itemCodigo,
      dataReferencia,
    });

    // Buscar estrutura
    const estrutura = await EstruturaInformacoesGeraisService.getEstrutura(
      itemCodigo,
      dataReferencia
    );

    // Gerar PDF
    const result = await PdfExportService.export(estrutura, itemCodigo, dataReferencia);

    log.info('PDF para impressão gerado', {
      correlationId: req.id,
      itemCodigo,
      size: result.size,
    });

    // Configurar headers para visualização inline (abre no navegador)
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.size);
    res.setHeader('X-Correlation-ID', req.id || '');

    // Enviar arquivo
    res.send(result.buffer);
  });
}
