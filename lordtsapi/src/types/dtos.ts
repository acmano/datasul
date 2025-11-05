// src/types/dtos.ts

/**
 * Data Transfer Objects (DTOs)
 *
 * @module types/dtos
 * @version 1.0.0
 *
 * @description
 * DTOs genéricos para requisições e respostas da API.
 * Usa branded types, discriminated unions e validators.
 */

import { ItemId, FamiliaId, EstabelecimentoId, GrupoDeEstoqueId } from './ids';
import { PaginationParams } from './utils';

// ============================================================================
// REQUEST DTOs
// ============================================================================

/**
 * DTO base para requisições com paginação
 */
export interface PaginatedRequestDTO extends PaginationParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * DTO para busca de item
 */
export interface ItemSearchDTO {
  codigo?: string;
  familia?: string;
  familiaComercial?: string;
  grupoEstoque?: string;
  gtin?: string;
}

/**
 * DTO para filtro de items com paginação
 */
export interface ItemFilterDTO extends PaginatedRequestDTO {
  search?: string;
  familiaId?: FamiliaId;
  grupoEstoqueId?: GrupoDeEstoqueId;
  ativo?: boolean;
}

/**
 * DTO para criação de recurso genérico
 */
export interface CreateDTO<T> {
  data: T;
}

/**
 * DTO para atualização de recurso genérico
 */
export interface UpdateDTO<T> {
  data: Partial<T>;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * DTO básico de item
 */
export interface ItemDTO {
  id: ItemId;
  codigo: string;
  descricao: string;
  unidade?: string;
  ativo?: boolean;
}

/**
 * DTO básico de família
 */
export interface FamiliaDTO {
  id: FamiliaId;
  codigo: string;
  descricao: string;
}

/**
 * DTO básico de estabelecimento
 */
export interface EstabelecimentoDTO {
  id: EstabelecimentoId;
  codigo: string;
  nome: string;
}

/**
 * DTO básico de grupo de estoque
 */
export interface GrupoDeEstoqueDTO {
  id: GrupoDeEstoqueId;
  codigo: string | number;
  descricao: string;
}

/**
 * DTO completo de item com relacionamentos
 */
export interface ItemCompletoDTO extends ItemDTO {
  familia?: FamiliaDTO;
  familiaComercial?: FamiliaDTO;
  grupoDeEstoque?: GrupoDeEstoqueDTO;
  estabelecimentos?: EstabelecimentoDTO[];
}

// ============================================================================
// METADATA DTOs
// ============================================================================

/**
 * DTO de metadados de requisição
 */
export interface RequestMetaDTO {
  correlationId: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

/**
 * DTO de metadados de resposta
 */
export interface ResponseMetaDTO {
  executionTime: number;
  cached: boolean;
  cacheHit?: boolean;
  source: 'database' | 'cache' | 'mock';
}
