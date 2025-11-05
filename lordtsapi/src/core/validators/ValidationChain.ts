// src/core/validators/ValidationChain.ts

/**
 * Validation Chain - Chain of Responsibility Pattern
 *
 * @description
 * Cadeia de validações que permite compor múltiplas regras
 * de forma sequencial e reutilizável.
 *
 * @example
 * ```typescript
 * const validation = new ValidationChain()
 *   .add(new RequiredValidator('codigo'))
 *   .add(new LengthValidator('codigo', { max: 16 }))
 *   .add(new AlphanumericValidator('codigo'));
 *
 * const result = await validation.validate({ codigo: '7530110' });
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export class ValidationChain {
  private validators: Validator[] = [];

  /**
   * Adiciona validador à cadeia
   *
   * @param validator - Validador a adicionar
   * @returns this (fluent interface)
   */
  add(validator: Validator): this {
    this.validators.push(validator);
    return this;
  }

  /**
   * Executa todos os validadores
   *
   * @param data - Dados a validar
   * @param options - Opções de validação
   * @returns Resultado da validação
   */
  async validate(
    data: Record<string, any>,
    options?: ValidationOptions
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    for (const validator of this.validators) {
      const result = await validator.validate(data);

      if (!result.valid) {
        errors.push(...result.errors);

        // Para na primeira falha se configurado
        if (options?.stopOnFirstError) {
          break;
        }
      }
    }

    if (errors.length === 0) {
      return { valid: true, errors: [] };
    }

    return {
      valid: false,
      errors,
    };
  }

  /**
   * Valida e lança exceção se inválido
   *
   * @param data - Dados a validar
   * @throws ValidationException se inválido
   */
  async validateOrThrow(data: Record<string, any>): Promise<void> {
    const result = await this.validate(data);

    if (!result.valid) {
      throw new ValidationException(result.errors);
    }
  }
}

// ============================================================================
// BASE VALIDATOR
// ============================================================================

/**
 * Interface base para validadores
 */
export interface Validator {
  validate(data: Record<string, any>): Promise<ValidationResult> | ValidationResult;
}

// ============================================================================
// BUILT-IN VALIDATORS
// ============================================================================

/**
 * Validador de campo obrigatório
 */
export class RequiredValidator implements Validator {
  constructor(
    private field: string,
    private message?: string
  ) {}

  validate(data: Record<string, any>): ValidationResult {
    const value = data[this.field];

    if (value === undefined || value === null || value === '') {
      return {
        valid: false,
        errors: [
          {
            field: this.field,
            message: this.message || `${this.field} is required`,
            code: 'REQUIRED',
          },
        ],
      };
    }

    return { valid: true, errors: [] };
  }
}

/**
 * Validador de comprimento de string
 */
export class LengthValidator implements Validator {
  constructor(
    private field: string,
    private options: { min?: number; max?: number }
  ) {}

  validate(data: Record<string, any>): ValidationResult {
    const value = data[this.field];

    if (typeof value !== 'string') {
      return { valid: true, errors: [] }; // Skip if not string
    }

    const errors: ValidationError[] = [];

    if (this.options.min && value.length < this.options.min) {
      errors.push({
        field: this.field,
        message: `${this.field} must be at least ${this.options.min} characters`,
        code: 'MIN_LENGTH',
      });
    }

    if (this.options.max && value.length > this.options.max) {
      errors.push({
        field: this.field,
        message: `${this.field} must be at most ${this.options.max} characters`,
        code: 'MAX_LENGTH',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Validador de pattern (regex)
 */
export class PatternValidator implements Validator {
  constructor(
    private field: string,
    private pattern: RegExp,
    private message?: string
  ) {}

  validate(data: Record<string, any>): ValidationResult {
    const value = data[this.field];

    if (typeof value !== 'string') {
      return { valid: true, errors: [] };
    }

    if (!this.pattern.test(value)) {
      return {
        valid: false,
        errors: [
          {
            field: this.field,
            message: this.message || `${this.field} does not match pattern`,
            code: 'PATTERN_MISMATCH',
          },
        ],
      };
    }

    return { valid: true, errors: [] };
  }
}

/**
 * Validador numérico
 */
export class NumericValidator implements Validator {
  constructor(
    private field: string,
    private options?: { min?: number; max?: number; integer?: boolean }
  ) {}

  validate(data: Record<string, any>): ValidationResult {
    const value = data[this.field];

    if (typeof value !== 'number') {
      return {
        valid: false,
        errors: [
          {
            field: this.field,
            message: `${this.field} must be a number`,
            code: 'NOT_NUMBER',
          },
        ],
      };
    }

    const errors: ValidationError[] = [];

    if (this.options?.integer && !Number.isInteger(value)) {
      errors.push({
        field: this.field,
        message: `${this.field} must be an integer`,
        code: 'NOT_INTEGER',
      });
    }

    if (this.options?.min !== undefined && value < this.options.min) {
      errors.push({
        field: this.field,
        message: `${this.field} must be at least ${this.options.min}`,
        code: 'MIN_VALUE',
      });
    }

    if (this.options?.max !== undefined && value > this.options.max) {
      errors.push({
        field: this.field,
        message: `${this.field} must be at most ${this.options.max}`,
        code: 'MAX_VALUE',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Validador customizado (função)
 */
export class CustomValidator implements Validator {
  constructor(
    private fn: (data: Record<string, any>) => ValidationResult | Promise<ValidationResult>
  ) {}

  validate(data: Record<string, any>): ValidationResult | Promise<ValidationResult> {
    return this.fn(data);
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationOptions {
  stopOnFirstError?: boolean;
}

// ============================================================================
// EXCEPTION
// ============================================================================

/**
 * Exceção de validação
 */
export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super(`Validation failed: ${errors.map((e) => e.message).join(', ')}`);
    this.name = 'ValidationException';
  }
}
