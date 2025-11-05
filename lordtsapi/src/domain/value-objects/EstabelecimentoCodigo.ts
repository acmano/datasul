// src/domain/value-objects/EstabelecimentoCodigo.ts

/**
 * Value Object - Código de Estabelecimento
 */
export class EstabelecimentoCodigo {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): EstabelecimentoCodigo {
    if (!value || value.trim() === '') {
      throw new Error('Código de estabelecimento não pode ser vazio');
    }

    const trimmed = value.trim();

    if (trimmed.length > 5) {
      throw new Error(
        'Código de estabelecimento deve ter no máximo 5 caracteres'
      );
    }

    return new EstabelecimentoCodigo(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: EstabelecimentoCodigo): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
