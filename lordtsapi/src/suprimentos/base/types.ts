/**
 * Types - Suprimentos Base
 *
 * Tipos para dados básicos do módulo de Suprimentos
 *
 * TODO: Definir interfaces específicas após levantamento de requisitos
 */

/**
 * Interface base para dados de suprimentos
 */
export interface SuprimentosBase {
  // TODO: Adicionar campos após definição de requisitos
  codigo?: string;
  descricao?: string;
}

/**
 * Resposta padrão da API
 */
export interface SuprimentosBaseResponse {
  success: boolean;
  data: SuprimentosBase | SuprimentosBase[];
  correlationId?: string;
}

/**
 * Parâmetros de consulta
 */
export interface SuprimentosBaseParams {
  // TODO: Adicionar parâmetros após definição de requisitos
  codigo?: string;
}

// TODO: Adicionar tipos específicos conforme necessário
// - DTOs de entrada/saída
// - Interfaces de query results
// - Enums de status/tipos
