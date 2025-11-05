// src/application/dtos/FamiliaDTO.ts

/**
 * Data Transfer Object - Familia
 *
 * Objeto simples para transferência de dados de Familia.
 */
export interface FamiliaDTO {
  codigo: string;
  descricao: string;
  ativo: boolean;
}

/**
 * DTO para criação de Familia
 */
export interface CreateFamiliaDTO {
  codigo: string;
  descricao: string;
  ativo?: boolean;
}

/**
 * DTO para atualização de Familia
 */
export interface UpdateFamiliaDTO {
  descricao?: string;
  ativo?: boolean;
}

/**
 * DTO para listagem de familias
 */
export interface FamiliaListDTO {
  codigo: string;
  descricao: string;
  ativo: boolean;
}

/**
 * DTO para busca de familias
 */
export interface ListFamiliasDTO {
  ativo?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * DTO para resultado de listagem
 */
export interface ListFamiliasResultDTO {
  familias: FamiliaListDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
