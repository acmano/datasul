/**
 * Types - Suprimentos Estoque
 *
 * Tipos para dados de estoque/inventário do módulo de Suprimentos
 *
 * TODO: Definir interfaces específicas após levantamento de requisitos
 */

/**
 * Interface para dados de estoque
 */
export interface EstoqueData {
  // TODO: Adicionar campos após definição de requisitos
  itemCodigo?: string;
  estabelecimento?: string;
  saldoDisponivel?: number;
  saldoFisico?: number;
  unidade?: string;
}

/**
 * Saldo de estoque por estabelecimento
 */
export interface SaldoEstoque {
  estabelecimento: string;
  deposito?: string;
  saldoFisico: number;
  saldoDisponivel: number;
  saldoReservado?: number;
  saldoEmTransito?: number;
}

/**
 * Resposta padrão da API
 */
export interface EstoqueResponse {
  success: boolean;
  data: EstoqueData | EstoqueData[];
  correlationId?: string;
}

/**
 * Parâmetros de consulta
 */
export interface EstoqueParams {
  itemCodigo?: string;
  estabelecimento?: string;
  deposito?: string;
}

// TODO: Adicionar tipos específicos conforme necessário
// - DTOs de entrada/saída
// - Interfaces de query results
// - Enums de status/tipos de movimentação
