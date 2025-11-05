/**
 * Tipos para exportação de estruturas de produtos
 */

/**
 * Formato de exportação suportado
 */
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

/**
 * Header/Cabeçalho visual para relatórios exportados
 */
export interface ExportHeader {
  itemPrincipal: {
    codigo: string;
    descricao: string;
    unidadeMedida: string;
    estabelecimento: string;
  };
  parametrosConsulta: {
    dataReferencia: string | null;
    quantidadeBase: number;
    quantidadeProduzir?: number;
  };
  dataHoraGeracao: string;
}

/**
 * Opções de exportação
 */
export interface ExportOptions {
  format: ExportFormat;
  includeHeader: boolean;
  includeResumo: boolean;
  includeProcessos: boolean;
}

/**
 * Resultado da exportação
 */
export interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}
