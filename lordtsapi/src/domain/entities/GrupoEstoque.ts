// src/domain/entities/GrupoEstoque.ts

import { Descricao } from '../value-objects';

/**
 * Value Object - Código de Grupo de Estoque
 */
export class GrupoEstoqueCodigo {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.trim();
  }

  static create(value: string): GrupoEstoqueCodigo {
    if (!value || value.trim() === '') {
      throw new Error('Código do grupo de estoque não pode ser vazio');
    }
    return new GrupoEstoqueCodigo(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: GrupoEstoqueCodigo): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

/**
 * Entidade de Domínio - Grupo de Estoque
 *
 * Representa um grupo de estoque de produtos.
 */
export class GrupoEstoque {
  private readonly _codigo: GrupoEstoqueCodigo;
  private _descricao: Descricao;
  private _ativo: boolean;

  private constructor(
    codigo: GrupoEstoqueCodigo,
    descricao: Descricao,
    ativo: boolean = true
  ) {
    this._codigo = codigo;
    this._descricao = descricao;
    this._ativo = ativo;
  }

  /**
   * Factory method para criar um GrupoEstoque
   */
  static create(props: {
    codigo: string;
    descricao: string;
    ativo?: boolean;
  }): GrupoEstoque {
    const codigo = GrupoEstoqueCodigo.create(props.codigo);
    const descricao = Descricao.create(props.descricao);

    return new GrupoEstoque(codigo, descricao, props.ativo ?? true);
  }

  // Getters
  get codigo(): GrupoEstoqueCodigo {
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
  equals(other: GrupoEstoque): boolean {
    if (!(other instanceof GrupoEstoque)) {
      return false;
    }
    return this._codigo.equals(other._codigo);
  }

  toString(): string {
    return `GrupoEstoque[${this._codigo.value}]: ${this._descricao.value}`;
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
