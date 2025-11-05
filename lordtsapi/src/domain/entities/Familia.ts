// src/domain/entities/Familia.ts

import { Descricao } from '../value-objects';

/**
 * Value Object - Código de Família
 */
export class FamiliaCodigo {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.trim();
  }

  static create(value: string): FamiliaCodigo {
    if (!value || value.trim() === '') {
      throw new Error('Código da família não pode ser vazio');
    }
    return new FamiliaCodigo(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: FamiliaCodigo): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

/**
 * Entidade de Domínio - Família
 *
 * Representa uma família de produtos.
 */
export class Familia {
  private readonly _codigo: FamiliaCodigo;
  private _descricao: Descricao;
  private _ativo: boolean;

  private constructor(
    codigo: FamiliaCodigo,
    descricao: Descricao,
    ativo: boolean = true
  ) {
    this._codigo = codigo;
    this._descricao = descricao;
    this._ativo = ativo;
  }

  /**
   * Factory method para criar uma Familia
   */
  static create(props: {
    codigo: string;
    descricao: string;
    ativo?: boolean;
  }): Familia {
    const codigo = FamiliaCodigo.create(props.codigo);
    const descricao = Descricao.create(props.descricao);

    return new Familia(codigo, descricao, props.ativo ?? true);
  }

  // Getters
  get codigo(): FamiliaCodigo {
    return this._codigo;
  }

  get codigoValue(): string {
    return this._codigo.value;
  }

  get descricao(): Descricao {
    return this._descricao;
  }

  get descricaoValue(): string {
    return this._descricao.value;
  }

  get ativo(): boolean {
    return this._ativo;
  }

  // Regras de negócio
  ativar(): void {
    this._ativo = true;
  }

  inativar(): void {
    this._ativo = false;
  }

  atualizarDescricao(novaDescricao: string): void {
    this._descricao = Descricao.create(novaDescricao);
  }

  // Métodos auxiliares
  equals(other: Familia): boolean {
    if (!(other instanceof Familia)) {
      return false;
    }
    return this._codigo.equals(other._codigo);
  }

  toString(): string {
    return `Familia[${this._codigo.value}]: ${this._descricao.value}`;
  }

  toDTO(): {
    codigo: string;
    descricao: string;
    ativo: boolean;
  } {
    return {
      codigo: this._codigo.value,
      descricao: this._descricao.value,
      ativo: this._ativo
    };
  }
}
