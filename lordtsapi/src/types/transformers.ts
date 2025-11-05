// src/types/transformers.ts

/**
 * Transformers para DTOs (plain to class)
 *
 * @module types/transformers
 * @version 1.0.0
 *
 * @description
 * Utilitários para transformar objetos plain em classes validadas.
 * Usa class-transformer para conversão type-safe.
 */

import { plainToClass, plainToInstance, ClassConstructor } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { ValidationResult } from './utils';

// ============================================================================
// TRANSFORMATION HELPERS
// ============================================================================

/**
 * Transforma plain object em instância de classe
 *
 * @template T - Tipo da classe
 * @param cls - Classe destino
 * @param plain - Objeto plain
 * @returns Instância da classe
 *
 * @example
 * ```typescript
 * const dto = toClass(ItemDTO, req.body);
 * ```
 */
export function toClass<T>(cls: ClassConstructor<T>, plain: unknown): T {
  return plainToInstance(cls, plain, {
    excludeExtraneousValues: false,
    enableImplicitConversion: true,
  });
}

/**
 * Transforma array de plain objects em array de classes
 *
 * @template T - Tipo da classe
 * @param cls - Classe destino
 * @param plains - Array de objetos plain
 * @returns Array de instâncias
 *
 * @example
 * ```typescript
 * const dtos = toClassArray(ItemDTO, items);
 * ```
 */
export function toClassArray<T>(cls: ClassConstructor<T>, plains: unknown[]): T[] {
  return plainToInstance(cls, plains, {
    excludeExtraneousValues: false,
    enableImplicitConversion: true,
  });
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Valida um DTO e retorna resultado type-safe
 *
 * @template T - Tipo do DTO
 * @param dto - DTO a validar
 * @returns ValidationResult com DTO validado ou erros
 *
 * @example
 * ```typescript
 * const result = await validateDTO(itemDTO);
 * if (result.valid) {
 *   const validated = result.data; // ✅ Type-safe
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function validateDTO<T extends object>(dto: T): Promise<ValidationResult<T>> {
  const errors = await validate(dto);

  if (errors.length === 0) {
    return { valid: true, data: dto };
  }

  const errorMessage = formatValidationErrors(errors);
  return {
    valid: false,
    error: errorMessage,
    field: errors[0]?.property,
  };
}

/**
 * Transforma e valida plain object em classe
 *
 * @template T - Tipo da classe
 * @param cls - Classe destino
 * @param plain - Objeto plain
 * @returns ValidationResult com instância validada ou erros
 *
 * @example
 * ```typescript
 * const result = await transformAndValidate(ItemDTO, req.body);
 * if (result.valid) {
 *   const dto = result.data; // ✅ Validated ItemDTO
 * } else {
 *   return res.status(400).json({ error: result.error });
 * }
 * ```
 */
export async function transformAndValidate<T extends object>(
  cls: ClassConstructor<T>,
  plain: unknown
): Promise<ValidationResult<T>> {
  try {
    const instance = toClass(cls, plain);
    return await validateDTO(instance);
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Transformation failed',
    };
  }
}

/**
 * Transforma e valida array de plain objects
 *
 * @template T - Tipo da classe
 * @param cls - Classe destino
 * @param plains - Array de objetos plain
 * @returns ValidationResult com array validado ou erros
 *
 * @example
 * ```typescript
 * const result = await transformAndValidateArray(ItemDTO, req.body.items);
 * if (result.valid) {
 *   const dtos = result.data; // ✅ Validated ItemDTO[]
 * }
 * ```
 */
export async function transformAndValidateArray<T extends object>(
  cls: ClassConstructor<T>,
  plains: unknown[]
): Promise<ValidationResult<T[]>> {
  try {
    const instances = toClassArray(cls, plains);

    // Validate each instance
    const validationResults = await Promise.all(instances.map((instance) => validate(instance)));

    // Check if any have errors
    const allErrors = validationResults.flat();
    if (allErrors.length === 0) {
      return { valid: true, data: instances };
    }

    const errorMessage = formatValidationErrors(allErrors);
    return {
      valid: false,
      error: errorMessage,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Transformation failed',
    };
  }
}

// ============================================================================
// ERROR FORMATTING
// ============================================================================

/**
 * Formata erros de validação em mensagem legível
 *
 * @param errors - Array de erros de validação
 * @returns Mensagem formatada
 *
 * @example
 * ```typescript
 * const message = formatValidationErrors(errors);
 * // "codigo: must be a string, descricao: should not be empty"
 * ```
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((error) => {
      const constraints = error.constraints
        ? Object.values(error.constraints).join(', ')
        : 'validation failed';
      return `${error.property}: ${constraints}`;
    })
    .join('; ');
}

/**
 * Formata erros de validação em objeto estruturado
 *
 * @param errors - Array de erros de validação
 * @returns Objeto com erros por campo
 *
 * @example
 * ```typescript
 * const errorMap = formatValidationErrorsToMap(errors);
 * // { codigo: ['must be a string'], descricao: ['should not be empty'] }
 * ```
 */
export function formatValidationErrorsToMap(errors: ValidationError[]): Record<string, string[]> {
  const errorMap: Record<string, string[]> = {};

  for (const error of errors) {
    if (error.constraints) {
      errorMap[error.property] = Object.values(error.constraints);
    }
  }

  return errorMap;
}

// ============================================================================
// MIDDLEWARE HELPER
// ============================================================================

/**
 * Cria middleware de validação para Express
 *
 * @template T - Tipo do DTO
 * @param dtoClass - Classe do DTO
 * @param source - Fonte dos dados ('body' | 'query' | 'params')
 * @returns Middleware Express
 *
 * @example
 * ```typescript
 * router.post('/items',
 *   validationMiddleware(CreateItemDTO, 'body'),
 *   ItemController.create
 * );
 * ```
 */
export function validationMiddleware<T extends object>(
  dtoClass: ClassConstructor<T>,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (req: any, res: any, next: any) => {
    const result = await transformAndValidate(dtoClass, req[source]);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: 'error' in result ? result.error : 'Unknown validation error',
        code: 'VALIDATION_ERROR',
      });
    }

    // Replace with validated DTO
    req[source] = result.data;
    next();
  };
}
