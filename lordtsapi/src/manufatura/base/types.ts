/**
 * Types - Manufatura Base
 *
 * Tipos para dados básicos do módulo de Manufatura (Planejamento e Controle da Produção)
 *
 * TODO: Definir interfaces específicas após levantamento de requisitos
 */

/**
 * Interface base para dados de Manufatura
 */
export interface ManufaturaBase {
  // TODO: Adicionar campos após definição de requisitos
  codigo?: string;
  descricao?: string;
}

/**
 * Resposta padrão da API
 */
export interface ManufaturaBaseResponse {
  success: boolean;
  data: ManufaturaBase | ManufaturaBase[];
  correlationId?: string;
}

/**
 * Parâmetros de consulta
 */
export interface ManufaturaBaseParams {
  // TODO: Adicionar parâmetros após definição de requisitos
  codigo?: string;
}

// TODO: Adicionar tipos específicos conforme necessário
// - DTOs de entrada/saída
// - Interfaces de query results
// - Enums de status/tipos
