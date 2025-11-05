/**
 * Types - Fiscal Base
 *
 * Tipos para dados básicos do módulo Fiscal
 *
 * TODO: Definir interfaces específicas após levantamento de requisitos
 */

/**
 * Interface base para dados de Fiscal
 */
export interface FiscalBase {
  // TODO: Adicionar campos após definição de requisitos
  codigo?: string;
  descricao?: string;
}

/**
 * Resposta padrão da API
 */
export interface FiscalBaseResponse {
  success: boolean;
  data: FiscalBase | FiscalBase[];
  correlationId?: string;
}

/**
 * Parâmetros de consulta
 */
export interface FiscalBaseParams {
  // TODO: Adicionar parâmetros após definição de requisitos
  codigo?: string;
}

// TODO: Adicionar tipos específicos conforme necessário
// - DTOs de entrada/saída
// - Interfaces de query results
// - Enums de status/tipos
