// src/domain/value-objects/UnidadeMedida.ts

/**
 * Value Object - Unidade de Medida
 *
 * Representa uma unidade de medida válida (UN, KG, M, L, etc).
 * Imutável e auto-validável.
 *
 * @example
 * const un = UnidadeMedida.create('UN');
 * console.log(un.value); // 'UN'
 * console.log(un.descricao); // 'Unidade'
 */
export class UnidadeMedida {
  private readonly _value: string;
  private static readonly MAX_LENGTH = 4;

  // Mapeamento de unidades conhecidas
  private static readonly UNIDADES_CONHECIDAS: Record<string, string> = {
    'UN': 'Unidade',
    'KG': 'Quilograma',
    'G': 'Grama',
    'M': 'Metro',
    'CM': 'Centímetro',
    'L': 'Litro',
    'ML': 'Mililitro',
    'PC': 'Peça',
    'CX': 'Caixa',
    'PAR': 'Par',
    'JG': 'Jogo',
    'KIT': 'Kit',
    'M2': 'Metro Quadrado',
    'M3': 'Metro Cúbico'
  };

  private constructor(value: string) {
    this._value = value.trim().toUpperCase();
  }

  /**
   * Factory method para criar uma UnidadeMedida
   *
   * @param value - Código da unidade
   * @returns UnidadeMedida validada
   * @throws Error se unidade inválida
   */
  static create(value: string): UnidadeMedida {
    if (!value || value.trim() === '') {
      throw new Error('Unidade de medida não pode ser vazia');
    }

    const trimmed = value.trim().toUpperCase();

    if (trimmed.length > this.MAX_LENGTH) {
      throw new Error(`Unidade de medida não pode exceder ${this.MAX_LENGTH} caracteres`);
    }

    return new UnidadeMedida(trimmed);
  }

  /**
   * Retorna o código da unidade
   */
  get value(): string {
    return this._value;
  }

  /**
   * Retorna a descrição da unidade (se conhecida)
   */
  get descricao(): string {
    return UnidadeMedida.UNIDADES_CONHECIDAS[this._value] || this._value;
  }

  /**
   * Retorna true se é uma unidade conhecida
   */
  get isConhecida(): boolean {
    return this._value in UnidadeMedida.UNIDADES_CONHECIDAS;
  }

  /**
   * Compara duas unidades
   */
  equals(other: UnidadeMedida): boolean {
    if (!(other instanceof UnidadeMedida)) {
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
   * Retorna representação completa (código + descrição)
   */
  toFullString(): string {
    return `${this._value} - ${this.descricao}`;
  }
}
