// src/domain/value-objects/Descricao.ts

/**
 * Value Object - Descrição
 *
 * Representa uma descrição válida de entidades (item, família, etc).
 * Imutável e auto-validável.
 *
 * @example
 * const desc = Descricao.create('TORNEIRA MONOCOMANDO');
 * console.log(desc.value); // 'TORNEIRA MONOCOMANDO'
 * console.log(desc.isEmpty); // false
 */
export class Descricao {
  private readonly _value: string;
  private static readonly MAX_LENGTH = 255;

  private constructor(value: string) {
    this._value = value.trim();
  }

  /**
   * Factory method para criar uma Descricao
   *
   * @param value - Texto da descrição
   * @returns Descricao validada
   * @throws Error se descrição inválida
   */
  static create(value: string): Descricao {
    if (!value || value.trim() === '') {
      throw new Error('Descrição não pode ser vazia');
    }

    const trimmed = value.trim();

    if (trimmed.length > this.MAX_LENGTH) {
      throw new Error(`Descrição não pode exceder ${this.MAX_LENGTH} caracteres`);
    }

    return new Descricao(trimmed);
  }

  /**
   * Cria uma Descricao vazia (para casos opcionais)
   */
  static empty(): Descricao {
    return new Descricao('-');
  }

  /**
   * Retorna o valor da descrição
   */
  get value(): string {
    return this._value;
  }

  /**
   * Retorna true se a descrição está vazia
   */
  get isEmpty(): boolean {
    return this._value === '-' || this._value === '';
  }

  /**
   * Retorna o comprimento da descrição
   */
  get length(): number {
    return this._value.length;
  }

  /**
   * Compara duas descrições
   */
  equals(other: Descricao): boolean {
    if (!(other instanceof Descricao)) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * Retorna representação string
   */
  toString(): string {
    return this._value;
  }

  /**
   * Retorna JSON
   */
  toJSON(): string {
    return this._value;
  }

  /**
   * Retorna versão abreviada (primeiros N caracteres)
   */
  abbreviate(maxLength: number): string {
    if (this._value.length <= maxLength) {
      return this._value;
    }
    return this._value.substring(0, maxLength - 3) + '...';
  }
}
