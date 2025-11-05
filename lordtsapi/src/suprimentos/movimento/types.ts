/**
 * Types - Suprimentos Movimento
 *
 * Tipos para movimentações de estoque (entradas/saídas)
 *
 * TODO: Definir interfaces específicas após levantamento de requisitos
 */

/**
 * Interface para movimentação de estoque
 */
export interface MovimentoEstoque {
  // TODO: Adicionar campos após definição de requisitos
  numero?: number;
  itemCodigo?: string;
  tipoMovimento?: string; // 'entrada' | 'saida' | 'transferencia' | 'ajuste'
  quantidade?: number;
  dataMovimento?: string;
  estabelecimento?: string;
}

/**
 * Detalhes de uma movimentação
 */
export interface DetalhesMovimento {
  numero: number;
  serie?: string;
  itemCodigo: string;
  itemDescricao?: string;
  tipoMovimento: string;
  quantidade: number;
  unidade: string;
  dataMovimento: string;
  estabelecimento: string;
  deposito?: string;
  usuario?: string;
  observacao?: string;
}

/**
 * Resumo de movimentações por período
 */
export interface ResumoMovimentacao {
  itemCodigo: string;
  periodo: string;
  totalEntradas: number;
  totalSaidas: number;
  saldoLiquido: number;
}

/**
 * Resposta padrão da API
 */
export interface MovimentoResponse {
  success: boolean;
  data: MovimentoEstoque | MovimentoEstoque[];
  correlationId?: string;
}

/**
 * Parâmetros de consulta
 */
export interface MovimentoParams {
  itemCodigo?: string;
  estabelecimento?: string;
  dataInicio?: string;
  dataFim?: string;
  tipoMovimento?: string;
}

// TODO: Adicionar tipos específicos conforme necessário
// - DTOs de entrada/saída
// - Interfaces de query results
// - Enums de tipos de movimentação
