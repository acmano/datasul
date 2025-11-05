// tests/fixtures/dtos.fixtures.ts

import type { ItemDTO, CreateItemDTO, ItemDetailDTO } from '@application/dtos/ItemDTO';

/**
 * Fixtures para DTOs
 *
 * Fornece builders com valores padrão para DTOs usados na camada de aplicação.
 *
 * @example
 * const itemDTO = ItemDTOBuilder.build();
 * const createDTO = CreateItemDTOBuilder.build({ codigo: 'NEW001' });
 */

// ============================================================================
// ITEM DTO BUILDERS
// ============================================================================

export class ItemDTOBuilder {
  private static defaults: ItemDTO = {
    codigo: 'TEST001',
    descricao: 'ITEM DE TESTE',
    unidade: 'UN',
    ativo: true,
  };

  static build(overrides?: Partial<ItemDTO>): ItemDTO {
    return {
      ...this.defaults,
      ...overrides,
    };
  }

  static buildAtivo(overrides?: Partial<ItemDTO>): ItemDTO {
    return this.build({ ...overrides, ativo: true });
  }

  static buildInativo(overrides?: Partial<ItemDTO>): ItemDTO {
    return this.build({ ...overrides, ativo: false });
  }

  static buildComObservacao(observacao: string, overrides?: Partial<ItemDTO>): ItemDTO {
    return this.build({ ...overrides, observacao });
  }

  static buildMany(count: number, overrides?: Partial<ItemDTO>): ItemDTO[] {
    return Array.from({ length: count }, (_, i) =>
      this.build({
        ...overrides,
        codigo: `${overrides?.codigo || 'TEST'}${i.toString().padStart(3, '0')}`,
        descricao: `${overrides?.descricao || 'ITEM'} ${i + 1}`,
      })
    );
  }
}

// ============================================================================
// CREATE ITEM DTO BUILDERS
// ============================================================================

export class CreateItemDTOBuilder {
  private static defaults: CreateItemDTO = {
    codigo: 'NEW001',
    descricao: 'NOVO ITEM',
    unidade: 'UN',
  };

  static build(overrides?: Partial<CreateItemDTO>): CreateItemDTO {
    return {
      ...this.defaults,
      ...overrides,
    };
  }

  static buildComplete(overrides?: Partial<CreateItemDTO>): CreateItemDTO {
    return this.build({
      ...overrides,
      ativo: true,
      observacao: 'Observação completa',
    });
  }

  static buildMinimal(): CreateItemDTO {
    return {
      codigo: 'MIN001',
      descricao: 'ITEM MINIMO',
      unidade: 'UN',
    };
  }
}

// ============================================================================
// ITEM DETAIL DTO BUILDERS
// ============================================================================

export class ItemDetailDTOBuilder {
  private static defaults: ItemDetailDTO = {
    codigo: 'TEST001',
    descricao: 'ITEM DE TESTE',
    unidade: 'UN',
    ativo: true,
  };

  static build(overrides?: Partial<ItemDetailDTO>): ItemDetailDTO {
    return {
      ...this.defaults,
      ...overrides,
    };
  }

  static buildWithAllRelations(overrides?: Partial<ItemDetailDTO>): ItemDetailDTO {
    return this.build({
      ...overrides,
      familia: { codigo: 'FM001', descricao: 'METAIS' },
      familiaComercial: { codigo: 'FC001', descricao: 'HIDRAULICA' },
      grupoEstoque: { codigo: '01', descricao: 'MATERIAIS' },
      estabelecimentos: [
        { codigo: '001', nome: 'MATRIZ' },
        { codigo: '002', nome: 'FILIAL 1' },
      ],
    });
  }

  static buildWithFamilia(familia: { codigo: string; descricao: string }, overrides?: Partial<ItemDetailDTO>): ItemDetailDTO {
    return this.build({
      ...overrides,
      familia,
    });
  }
}

// ============================================================================
// PAGINATION DTO BUILDERS
// ============================================================================

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class PaginationDTOBuilder {
  private static defaults: PaginationDTO = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  static build(overrides?: Partial<PaginationDTO>): PaginationDTO {
    const pagination = {
      ...this.defaults,
      ...overrides,
    };

    // Auto-calculate totalPages if not provided
    if (overrides?.total !== undefined && overrides?.totalPages === undefined) {
      pagination.totalPages = Math.ceil(pagination.total / pagination.limit);
    }

    // Auto-calculate hasNext and hasPrev
    if (overrides?.total !== undefined) {
      pagination.hasNext = pagination.page < pagination.totalPages;
      pagination.hasPrev = pagination.page > 1;
    }

    return pagination;
  }

  static buildFirstPage(total: number, limit: number = 20): PaginationDTO {
    return this.build({
      page: 1,
      limit,
      total,
    });
  }

  static buildLastPage(total: number, limit: number = 20): PaginationDTO {
    const totalPages = Math.ceil(total / limit);
    return this.build({
      page: totalPages,
      limit,
      total,
    });
  }

  static buildMiddlePage(total: number, page: number, limit: number = 20): PaginationDTO {
    return this.build({
      page,
      limit,
      total,
    });
  }

  static buildEmpty(): PaginationDTO {
    return this.build({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  }
}

// ============================================================================
// PAGINATED RESPONSE BUILDERS
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationDTO;
}

export class PaginatedResponseBuilder {
  static build<T>(data: T[], pagination: PaginationDTO): PaginatedResponse<T> {
    return {
      data,
      pagination,
    };
  }

  static buildItemsResponse(count: number, page: number = 1, limit: number = 20): PaginatedResponse<ItemDTO> {
    const items = ItemDTOBuilder.buildMany(count);
    const pagination = PaginationDTOBuilder.build({
      page,
      limit,
      total: count,
    });

    return this.build(items.slice(0, limit), pagination);
  }

  static buildEmpty<T>(): PaginatedResponse<T> {
    return {
      data: [],
      pagination: PaginationDTOBuilder.buildEmpty(),
    };
  }
}

// ============================================================================
// SEARCH REQUEST BUILDERS
// ============================================================================

export interface SearchItemsRequest {
  search?: string;
  gtin?: string;
  familia?: string;
  grupoEstoque?: string;
  ativo?: boolean;
  page?: number;
  limit?: number;
}

export class SearchItemsRequestBuilder {
  private static defaults: SearchItemsRequest = {
    page: 1,
    limit: 20,
  };

  static build(overrides?: Partial<SearchItemsRequest>): SearchItemsRequest {
    return {
      ...this.defaults,
      ...overrides,
    };
  }

  static buildGeneralSearch(searchTerm: string): SearchItemsRequest {
    return this.build({ search: searchTerm });
  }

  static buildGtinSearch(gtin: string): SearchItemsRequest {
    return this.build({ gtin });
  }

  static buildFamiliaSearch(familia: string, page?: number): SearchItemsRequest {
    return this.build({ familia, page });
  }

  static buildGrupoEstoqueSearch(grupoEstoque: string): SearchItemsRequest {
    return this.build({ grupoEstoque });
  }

  static buildAtivoSearch(ativo: boolean): SearchItemsRequest {
    return this.build({ ativo });
  }

  static buildComplexSearch(params: {
    search: string;
    familia?: string;
    ativo?: boolean;
    page?: number;
    limit?: number;
  }): SearchItemsRequest {
    return this.build(params);
  }
}

// ============================================================================
// VALIDATION ERROR BUILDERS
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class ValidationErrorBuilder {
  static build(field: string, message: string, code: string): ValidationError {
    return { field, message, code };
  }

  static buildRequired(field: string): ValidationError {
    return this.build(field, `${field} é obrigatório`, 'REQUIRED');
  }

  static buildMinLength(field: string, min: number): ValidationError {
    return this.build(field, `${field} deve ter pelo menos ${min} caracteres`, 'MIN_LENGTH');
  }

  static buildMaxLength(field: string, max: number): ValidationError {
    return this.build(field, `${field} não pode exceder ${max} caracteres`, 'MAX_LENGTH');
  }

  static buildPattern(field: string): ValidationError {
    return this.build(field, `${field} está em formato inválido`, 'PATTERN_MISMATCH');
  }

  static buildMany(errors: Array<{ field: string; message: string; code: string }>): ValidationError[] {
    return errors.map(e => this.build(e.field, e.message, e.code));
  }
}

// ============================================================================
// RESPONSE BUILDERS
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  correlationId?: string;
}

export class ApiResponseBuilder {
  static buildSuccess<T>(data: T, correlationId?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      correlationId,
    };
  }

  static buildError(message: string, code: string, details?: unknown, correlationId?: string): ApiResponse<never> {
    return {
      success: false,
      error: {
        message,
        code,
        details,
      },
      correlationId,
    };
  }

  static buildValidationError(errors: ValidationError[], correlationId?: string): ApiResponse<never> {
    return this.buildError(
      'Erro de validação',
      'VALIDATION_ERROR',
      { errors },
      correlationId
    );
  }

  static buildNotFound(entity: string, id: string, correlationId?: string): ApiResponse<never> {
    return this.buildError(
      `${entity} não encontrado: ${id}`,
      'NOT_FOUND',
      { entity, id },
      correlationId
    );
  }
}
