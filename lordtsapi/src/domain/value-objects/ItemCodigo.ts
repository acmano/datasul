// src/domain/value-objects/ItemCodigo.ts

/**
 * Value Object - Código de Item
 *
 * Representa um código de item válido do sistema Datasul.
 * Imutável e auto-validável.
 *
 * @example
 * const codigo = ItemCodigo.create('7530110');
 * console.log(codigo.value); // '7530110'
 * console.log(codigo.isValid); // true
 */
export class ItemCodigo {
  private readonly _value: string;
  private static readonly MAX_LENGTH = 16;
  private static readonly MIN_LENGTH = 1;
  private static readonly VALID_PATTERN = /^[A-Z0-9-]+$/i;

  private constructor(value: string) {
    this._value = value.trim().toUpperCase();
  }

  /**
   * Factory method para criar um ItemCodigo
   *
   * @param value - Código do item
   * @returns ItemCodigo validado
   * @throws Error se código inválido
   */
  static create(value: string): ItemCodigo {
    if (!value || value.trim() === '') {
      throw new Error('Código do item não pode ser vazio');
    }

    const trimmed = value.trim();

    if (trimmed.length < this.MIN_LENGTH) {
      throw new Error(`Código do item deve ter pelo menos ${this.MIN_LENGTH} caractere`);
    }

    if (trimmed.length > this.MAX_LENGTH) {
      throw new Error(`Código do item não pode exceder ${this.MAX_LENGTH} caracteres`);
    }

    if (!this.VALID_PATTERN.test(trimmed)) {
      throw new Error('Código do item contém caracteres inválidos. Apenas letras, números e hífen são permitidos');
    }

    return new ItemCodigo(trimmed);
  }

  /**
   * Retorna o valor do código
   */
  get value(): string {
    return this._value;
  }

  /**
   * Retorna true se o código é válido
   */
  get isValid(): boolean {
    return true; // Se chegou aqui, foi validado no create
  }

  /**
   * Compara dois códigos de item
   */
  equals(other: ItemCodigo): boolean {
    if (!(other instanceof ItemCodigo)) {
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
}
