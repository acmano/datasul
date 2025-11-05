/**
 * Types - Suprimentos Programação de Entrega
 *
 * Tipos para programação/agendamento de entregas
 *
 * TODO: Definir interfaces específicas após levantamento de requisitos
 */

/**
 * Interface para programação de entrega
 */
export interface ProgramacaoEntrega {
  // TODO: Adicionar campos após definição de requisitos
  numero?: number;
  fornecedorCodigo?: string;
  itemCodigo?: string;
  dataEntregaPrevista?: string;
  dataEntregaReal?: string;
  quantidade?: number;
  status?: string; // 'programada' | 'confirmada' | 'entregue' | 'cancelada'
}

/**
 * Detalhes de uma programação de entrega
 */
export interface DetalhesProgramacao {
  numero: number;
  fornecedor: {
    codigo: string;
    razaoSocial?: string;
  };
  item: {
    codigo: string;
    descricao?: string;
    unidade?: string;
  };
  quantidadeProgramada: number;
  quantidadeEntregue?: number;
  dataEntregaPrevista: string;
  dataEntregaReal?: string;
  status: string;
  observacao?: string;
  numeroPedidoCompra?: string;
}

/**
 * Resumo de programações por período
 */
export interface ResumoProgramacao {
  periodo: string;
  totalProgramacoes: number;
  totalConfirmadas: number;
  totalEntregues: number;
  totalCanceladas: number;
  totalPendentes: number;
}

/**
 * Programação por fornecedor
 */
export interface ProgramacaoPorFornecedor {
  fornecedorCodigo: string;
  fornecedorNome?: string;
  totalProgramacoes: number;
  quantidadeTotalProgramada: number;
  quantidadeTotalEntregue?: number;
  proximaEntrega?: string;
}

/**
 * Resposta padrão da API
 */
export interface ProgramacaoEntregaResponse {
  success: boolean;
  data: ProgramacaoEntrega | ProgramacaoEntrega[];
  correlationId?: string;
}

/**
 * Parâmetros de consulta
 */
export interface ProgramacaoEntregaParams {
  numero?: number;
  fornecedorCodigo?: string;
  itemCodigo?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
}

// TODO: Adicionar tipos específicos conforme necessário
// - DTOs de entrada/saída
// - Interfaces de query results
// - Enums de status
