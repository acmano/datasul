// src/types/validators.ts

/**
 * Validators com class-validator
 *
 * @module types/validators
 * @version 1.0.0
 *
 * @description
 * DTOs com decorators de validação usando class-validator.
 * Fornece validação declarativa type-safe.
 */

import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsInt,
  IsPositive,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsEmail,
  IsUUID,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// PAGINATION DTO
// ============================================================================

/**
 * DTO de paginação com validação
 */
export class PaginationDTO {
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}

// ============================================================================
// ITEM SEARCH DTO
// ============================================================================

/**
 * DTO de busca de item com validação
 */
export class ItemSearchDTO {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  codigo?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(8)
  familia?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(8)
  familiaComercial?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  grupoEstoque?: string;

  @IsOptional()
  @IsString()
  @MinLength(13)
  @MaxLength(14)
  @Matches(/^\d+$/, { message: 'GTIN deve conter apenas dígitos' })
  gtin?: string;
}

// ============================================================================
// ITEM FILTER DTO
// ============================================================================

/**
 * DTO de filtro de items com paginação e validação
 */
export class ItemFilterDTO extends PaginationDTO {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(8)
  familiaId?: string;

  @IsOptional()
  @IsString()
  grupoEstoqueId?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

// ============================================================================
// ITEM DTO
// ============================================================================

/**
 * DTO de item com validação
 */
export class ItemDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(16)
  codigo!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(120)
  descricao!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  unidade?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}

// ============================================================================
// CREATE/UPDATE DTOs
// ============================================================================

/**
 * DTO para criação de item
 */
export class CreateItemDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(16)
  codigo!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(120)
  descricao!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  unidade!: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  familiaId?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean = true;
}

/**
 * DTO para atualização de item
 */
export class UpdateItemDTO {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  unidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  familiaId?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}

// ============================================================================
// API KEY DTO
// ============================================================================

/**
 * DTO para criação de API Key
 */
export class CreateApiKeyDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  userName!: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  userEmail!: string;

  @IsEnum(['free', 'premium', 'enterprise', 'admin'])
  tier!: 'free' | 'premium' | 'enterprise' | 'admin';

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}

// ============================================================================
// CORRELATION ID DTO
// ============================================================================

/**
 * DTO para Correlation ID
 */
export class CorrelationIdDTO {
  @IsString()
  @IsUUID('4')
  correlationId!: string;
}

// ============================================================================
// BATCH OPERATION DTOs
// ============================================================================

/**
 * DTO para operação em lote
 */
export class BatchOperationDTO<T> {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => Object)
  items!: T[];

  @IsOptional()
  @IsBoolean()
  stopOnError?: boolean = false;
}

/**
 * DTO para resultado de operação em lote
 */
export class BatchResultDTO<T> {
  @IsNumber()
  @Min(0)
  successCount!: number;

  @IsNumber()
  @Min(0)
  errorCount!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  results!: Array<{
    success: boolean;
    data?: T;
    error?: string;
  }>;
}
