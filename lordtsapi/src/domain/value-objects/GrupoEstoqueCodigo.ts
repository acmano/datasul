// src/domain/value-objects/GrupoEstoqueCodigo.ts

/**
 * Value Object - Código de Grupo de Estoque
 */
export class GrupoEstoqueCodigo {
  private readonly _value: string | number;

  private constructor(value: string | number) {
    this._value = value;
  }

  static create(value: string | number): GrupoEstoqueCodigo {
    if (value === null || value === undefined || value === '') {
      throw new Error('Código de grupo de estoque não pode ser vazio');
    }

    return new GrupoEstoqueCodigo(value);
  }

  get value(): string | number {
    return this._value;
  }

  get valueAsString(): string {
    return this._value.toString();
  }

  equals(other: GrupoEstoqueCodigo): boolean {
    return this._value.toString() === other._value.toString();
  }

  toString(): string {
    return this._value.toString();
  }
}
