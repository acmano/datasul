/**
 * Export Service - API v2
 *
 * INSTALAÇÃO REQUERIDA:
 * npm install exceljs csv-stringify
 *
 * Se as bibliotecas não estiverem instaladas, esse código vai falhar.
 * Execute: npm install exceljs csv-stringify
 */

import { log } from '@shared/utils/logger';
import { SearchFilters } from './advancedSearch.service';
import { AdvancedSearchRepository } from '../../repositories/item/advancedSearch.repository';

export class ExportService {
  /**
   * Exporta para Excel (.xlsx)
   * Requer: npm install exceljs
   */
  static async exportToExcel(filters: SearchFilters, correlationId: string): Promise<Buffer> {
    log.info('Exporting to Excel', { correlationId, filters });

    try {
      // Import dinâmico para não quebrar se biblioteca não instalada
      const ExcelJS = await import('exceljs');

      // Busca dados (sem paginação, mas com limite)
      const items = await AdvancedSearchRepository.search({
        ...filters,
        limit: Math.min(filters.limit || 1000, 10000),
      });

      // Cria workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Itens');

      // Define colunas
      worksheet.columns = [
        { header: 'Código', key: 'codigo', width: 15 },
        { header: 'Descrição', key: 'descricao', width: 40 },
        { header: 'Unidade', key: 'unidade', width: 10 },
        { header: 'Família', key: 'familiaItem', width: 15 },
        { header: 'Grupo Estoque', key: 'grupoEstoque', width: 15 },
        { header: 'Situação', key: 'situacao', width: 10 },
        { header: 'Nome Abreviado', key: 'nomeAbreviado', width: 25 },
      ];

      // Estilo do header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };

      // Adiciona dados
      worksheet.addRows(items);

      // Freeze primeira linha (header)
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      // Adiciona filtros
      worksheet.autoFilter = {
        from: 'A1',
        to: `G1`,
      };

      // Gera buffer
      const buffer = await workbook.xlsx.writeBuffer();

      log.info('Excel export completed', {
        correlationId,
        rows: items.length,
        size: Buffer.isBuffer(buffer) ? buffer.length : 0,
      });

      return Buffer.from(buffer);
    } catch (error) {
      if ((error as any).code === 'MODULE_NOT_FOUND') {
        throw new Error('ExcelJS não instalado. Execute: npm install exceljs');
      }
      throw error;
    }
  }

  /**
   * Exporta para CSV
   * Requer: npm install csv-stringify
   */
  static async exportToCSV(filters: SearchFilters, correlationId: string): Promise<string> {
    log.info('Exporting to CSV', { correlationId, filters });

    try {
      // Import dinâmico
      const { stringify } = await import('csv-stringify/sync');

      // Busca dados
      const items = await AdvancedSearchRepository.search({
        ...filters,
        limit: Math.min(filters.limit || 1000, 10000),
      });

      // Gera CSV
      const csv = stringify(items, {
        header: true,
        columns: {
          codigo: 'Código',
          descricao: 'Descrição',
          unidade: 'Unidade',
          familiaItem: 'Família',
          grupoEstoque: 'Grupo Estoque',
          situacao: 'Situação',
          nomeAbreviado: 'Nome Abreviado',
        },
        delimiter: ';', // Ponto e vírgula para compatibilidade com Excel
      });

      log.info('CSV export completed', {
        correlationId,
        rows: items.length,
        size: csv.length,
      });

      return csv;
    } catch (error) {
      if ((error as any).code === 'MODULE_NOT_FOUND') {
        throw new Error('csv-stringify não instalado. Execute: npm install csv-stringify');
      }
      throw error;
    }
  }
}
