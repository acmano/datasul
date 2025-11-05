// src/domain/entities/Estabelecimento.ts

import { Descricao } from '../value-objects';

/**
 * Value Object - Código de Estabelecimento
 */
export class EstabelecimentoCodigo {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.trim();
  }

  static create(value: string): EstabelecimentoCodigo {
    if (!value || value.trim() === '') {
      throw new Error('Código do estabelecimento não pode ser vazio');
    }
    return new EstabelecimentoCodigo(value);
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

/**
 * Entidade de Domínio - Estabelecimento
 *
 * Representa um estabelecimento (filial, loja, etc).
 */
export class Estabelecimento {
  private readonly _codigo: EstabelecimentoCodigo;
  private _nome: Descricao;
  private _ativo: boolean;

  private constructor(
    codigo: EstabelecimentoCodigo,
    nome: Descricao,
    ativo: boolean = true
  ) {
    this._codigo = codigo;
    this._nome = nome;
    this._ativo = ativo;
  }

  /**
   * Factory method para criar um Estabelecimento
   */
  static create(props: {
    codigo: string;
    nome: string;
    ativo?: boolean;
  }): Estabelecimento {
    const codigo = EstabelecimentoCodigo.create(props.codigo);
    const nome = Descricao.create(props.nome);

    return new Estabelecimento(codigo, nome, props.ativo ?? true);
  }

  // Getters
  get codigo(): EstabelecimentoCodigo {
    return this._codigo;
  }

  get codigoValue(): string {
    return this._codigo.value;
  }

  get nome(): Descricao {
    return this._nome;
  }

  get nomeValue(): string {
    return this._nome.value;
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

  atualizarNome(novoNome: string): void {
    this._nome = Descricao.create(novoNome);
  }

  // Métodos auxiliares
  equals(other: Estabelecimento): boolean {
    if (!(other instanceof Estabelecimento)) {
      return false;
    }
    return this._codigo.equals(other._codigo);
  }

  toString(): string {
    return `Estabelecimento[${this._codigo.value}]: ${this._nome.value}`;
  }

  toDTO(): {
    codigo: string;
    nome: string;
    ativo: boolean;
  } {
    return {
      codigo: this._codigo.value,
      nome: this._nome.value,
      ativo: this._ativo
    };
  }
}
