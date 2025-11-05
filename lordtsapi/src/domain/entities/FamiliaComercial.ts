// src/domain/entities/FamiliaComercial.ts

import { Descricao } from '../value-objects';

/**
 * Value Object - Código de Família Comercial
 */
export class FamiliaComercialCodigo {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.trim();
  }

  static create(value: string): FamiliaComercialCodigo {
    if (!value || value.trim() === '') {
      throw new Error('Código da família comercial não pode ser vazio');
    }
    return new FamiliaComercialCodigo(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: FamiliaComercialCodigo): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

/**
 * Entidade de Domínio - Família Comercial
 *
 * Representa uma família comercial de produtos.
 */
export class FamiliaComercial {
  private readonly _codigo: FamiliaComercialCodigo;
  private _descricao: Descricao;
  private _ativo: boolean;

  private constructor(
    codigo: FamiliaComercialCodigo,
    descricao: Descricao,
    ativo: boolean = true
  ) {
    this._codigo = codigo;
    this._descricao = descricao;
    this._ativo = ativo;
  }

  /**
   * Factory method para criar uma FamiliaComercial
   */
  static create(props: {
    codigo: string;
    descricao: string;
    ativo?: boolean;
  }): FamiliaComercial {
    const codigo = FamiliaComercialCodigo.create(props.codigo);
    const descricao = Descricao.create(props.descricao);

    return new FamiliaComercial(codigo, descricao, props.ativo ?? true);
  }

  // Getters
  get codigo(): FamiliaComercialCodigo {
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
  equals(other: FamiliaComercial): boolean {
    if (!(other instanceof FamiliaComercial)) {
      return false;
    }
    return this._codigo.equals(other._codigo);
  }

  toString(): string {
    return `FamiliaComercial[${this._codigo.value}]: ${this._descricao.value}`;
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
