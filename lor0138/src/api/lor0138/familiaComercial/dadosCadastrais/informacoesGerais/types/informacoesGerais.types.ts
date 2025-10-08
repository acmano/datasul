// src/api/lor0138/familiaComercial/dadosCadastrais/informacoesGerais/types/informacoesGerais.types.ts

/**
 * Types e Interfaces para Informações Gerais de Famílias Comerciais
 * @module InformacoesGeraisTypes
 * @category Types
 */

// ============================================================================
// MODELOS DE DOMÍNIO
// ============================================================================

/**
 * Dados de uma família comercial específica
 */
export interface FamiliaComercialInformacoesGerais {
  familiaComercialCodigo: string;
  familiaComercialDescricao: string;
}

// ============================================================================
// DTOs DE API (REQUEST/RESPONSE)
// ============================================================================

/**
 * DTO de entrada para buscar informações de uma família comercial
 */
export interface FamiliaComercialInformacoesGeraisRequestDTO {
  familiaComercialCodigo: string;
}

/**
 * DTO de resposta da API
 */
export interface FamiliaComercialInformacoesGeraisResponseDTO {
  success: boolean;
  data?: FamiliaComercialInformacoesGerais;
  error?: string;
}

// ============================================================================
// TIPOS DE RESULTADO DE QUERIES (CAMADA DE DADOS)
// ============================================================================

/**
 * Resultado bruto da query SQL para dados mestres da família comercial
 */
export interface FamiliaComercialMasterQueryResult {
  familiaComercialCodigo: string;
  familiaComercialDescricao: string;
}