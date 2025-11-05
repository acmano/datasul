/**
 * Serviço de API para operações de exportação
 * Automaticamente adiciona o header X-Export-Request para bypass de rate limiting
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://lordtsapi.lorenzetti.ibe';

interface ExportOptions {
  /**
   * Parâmetros de query string
   */
  params?: Record<string, string | number | boolean>;

  /**
   * Headers adicionais
   */
  headers?: Record<string, string>;

  /**
   * Tipo de resposta esperada
   * @default 'blob'
   */
  responseType?: 'blob' | 'json' | 'text';
}

/**
 * Faz uma requisição de exportação com header especial para bypass de rate limiting
 */
export async function exportRequest(
  endpoint: string,
  options: ExportOptions = {}
): Promise<Blob | any> {
  const { params = {}, headers = {}, responseType = 'blob' } = options;

  // Construir query string
  const queryString = new URLSearchParams(
    Object.entries(params).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>
    )
  ).toString();

  const url = queryString
    ? `${API_BASE_URL}${endpoint}?${queryString}`
    : `${API_BASE_URL}${endpoint}`;

  // Headers com bypass de rate limit
  const exportHeaders = {
    'X-Export-Request': 'true',
    ...headers,
  };

  // Adicionar API Key se disponível
  const apiKey = localStorage.getItem('apiKey');
  if (apiKey) {
    exportHeaders['X-API-Key'] = apiKey;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: exportHeaders,
  });

  if (!response.ok) {
    throw new Error(`Erro na exportação: ${response.status} ${response.statusText}`);
  }

  // Processar resposta baseado no tipo
  if (responseType === 'blob') {
    return await response.blob();
  } else if (responseType === 'json') {
    return await response.json();
  } else {
    return await response.text();
  }
}

/**
 * Exporta itens para Excel
 */
export async function exportItemsToExcel(filters: {
  q?: string;
  familia?: string;
  grupoEstoque?: string;
  situacao?: 'A' | 'I';
  limit?: number;
}): Promise<Blob> {
  return exportRequest('/api/v2/item/export/excel', {
    params: filters,
    responseType: 'blob',
  }) as Promise<Blob>;
}

/**
 * Exporta itens para CSV
 */
export async function exportItemsToCSV(filters: {
  q?: string;
  familia?: string;
  grupoEstoque?: string;
  situacao?: 'A' | 'I';
  limit?: number;
}): Promise<Blob> {
  return exportRequest('/api/v2/item/export/csv', {
    params: filters,
    responseType: 'blob',
  }) as Promise<Blob>;
}

/**
 * Exporta estrutura de engenharia
 */
export async function exportEstrutura(
  itemCodigo: string,
  format: 'csv' | 'xlsx' | 'pdf',
  dataReferencia?: string
): Promise<Blob> {
  const params: Record<string, string> = {};
  if (dataReferencia) {
    params.dataReferencia = dataReferencia;
  }

  return exportRequest(`/api/engenharia/estrutura/export/${itemCodigo}/${format}`, {
    params,
    responseType: 'blob',
  }) as Promise<Blob>;
}

/**
 * Baixa um blob como arquivo
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Exemplo de uso completo - Exporta itens para Excel e faz download
 */
export async function downloadItemsExcel(filters: {
  q?: string;
  familia?: string;
  limit?: number;
}): Promise<void> {
  try {
    const blob = await exportItemsToExcel(filters);
    const filename = `items_${new Date().toISOString().split('T')[0]}.xlsx`;
    downloadBlob(blob, filename);
  } catch (error) {
    console.error('Erro ao exportar items para Excel:', error);
    throw error;
  }
}
