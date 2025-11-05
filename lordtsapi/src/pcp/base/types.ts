/**
 * Types - PCP Base
 *
 * Tipos para dados básicos do módulo de PCP (Planejamento e Controle da Produção)
 *
 * TODO: Definir interfaces específicas após levantamento de requisitos
 */

/**
 * Interface base para dados de PCP
 */
export interface PCPBase {
  // TODO: Adicionar campos após definição de requisitos
  codigo?: string;
  descricao?: string;
}

/**
 * Resposta padrão da API
 */
export interface PCPBaseResponse {
  success: boolean;
  data: PCPBase | PCPBase[];
  correlationId?: string;
}

/**
 * Parâmetros de consulta
 */
export interface PCPBaseParams {
  // TODO: Adicionar parâmetros após definição de requisitos
  codigo?: string;
}

// TODO: Adicionar tipos específicos conforme necessário
// - DTOs de entrada/saída
// - Interfaces de query results
// - Enums de status/tipos
