// src/api/lor0138/grupoDeEstoque/dadosCadastrais/informacoesGerais/types/informacoesGerais.types.ts

/**
 * Types e Interfaces para Informações Gerais de Grupos de Estoque
 * @module InformacoesGeraisTypes
 * @category Types
 */

// ============================================================================
// MODELOS DE DOMÍNIO
// ============================================================================

/**
 * Dados de um grupo de estoque específica
 */
export interface GrupoDeEstoqueInformacoesGerais {
  grupoCodigo: string;
  grupoDescricao: string;
}

// ============================================================================
// DTOs DE API (REQUEST/RESPONSE)
// ============================================================================

/**
 * DTO de entrada para buscar informações de um grupo de estoque
 */
export interface GrupoDeEstoqueInformacoesGeraisRequestDTO {
  grupoCodigo: string;
}

/**
 * DTO de resposta da API
 */
export interface GrupoDeEstoqueInformacoesGeraisResponseDTO {
  success: boolean;
  data?: GrupoDeEstoqueInformacoesGerais;
  error?: string;
}

// ============================================================================
// TIPOS DE RESULTADO DE QUERIES (CAMADA DE DADOS)
// ============================================================================

/**
 * Resultado bruto da query SQL para dados mestres do grupo de estoque
 */
export interface GrupoDeEstoqueMasterQueryResult {
  grupoCodigo: string;
  grupoDescricao: string;
}