// src/domain/value-objects/FamiliaCodigo.ts

/**
 * Value Object - Código de Família
 *
 * @description
 * Representa o código de uma família de forma imutável.
 * Garante validações e regras de negócio.
 *
 * @example
 * ```typescript
 * const codigo = FamiliaCodigo.create('FM001');
 * console.log(codigo.value); // 'FM001'
 * ```
 */
export class FamiliaCodigo {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Factory method para criar FamiliaCodigo
   *
   * @param value - Código da família
   * @returns FamiliaCodigo
   * @throws Error se código inválido
   */
  static create(value: string): FamiliaCodigo {
    // Validações
    if (!value || value.trim() === '') {
      throw new Error('Código de família não pode ser vazio');
    }

    const trimmed = value.trim();

    if (trimmed.length > 8) {
      throw new Error('Código de família deve ter no máximo 8 caracteres');
    }

    return new FamiliaCodigo(trimmed);
  }

  /**
   * Retorna valor do código
   */
  get value(): string {
    return this._value;
  }

  /**
   * Compara com outro FamiliaCodigo
   *
   * @param other - Outro código
   * @returns true se iguais
   */
  equals(other: FamiliaCodigo): boolean {
    return this._value === other._value;
  }

  /**
   * Retorna representação em string
   */
  toString(): string {
    return this._value;
  }
}
