// src/api/lor0138/familia/dadosCadastrais/informacoesGerais/types/informacoesGerais.types.ts

/**
 * Types e Interfaces para Informações Gerais de Famílias
 * @module InformacoesGeraisTypes
 * @category Types
 */

// ============================================================================
// MODELOS DE DOMÍNIO
// ============================================================================

/**
 * Dados de uma família específica
 */
export interface FamiliaInformacoesGerais {
  familiaCodigo: string;
  familiaDescricao: string;
}

// ============================================================================
// DTOs DE API (REQUEST/RESPONSE)
// ============================================================================

/**
 * DTO de entrada para buscar informações de uma família
 */
export interface FamiliaInformacoesGeraisRequestDTO {
  familiaCodigo: string;
}

/**
 * DTO de resposta da API
 */
export interface FamiliaInformacoesGeraisResponseDTO {
  success: boolean;
  data?: FamiliaInformacoesGerais;
  error?: string;
}

// ============================================================================
// TIPOS DE RESULTADO DE QUERIES (CAMADA DE DADOS)
// ============================================================================

/**
 * Resultado bruto da query SQL para dados mestres da família
 */
export interface FamiliaMasterQueryResult {
  familiaCodigo: string;
  familiaDescricao: string;
}