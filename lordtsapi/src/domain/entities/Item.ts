// src/domain/entities/Item.ts

import { ItemCodigo, Descricao, UnidadeMedida } from '../value-objects';

/**
 * Entidade de Domínio - Item
 *
 * Representa um item do catálogo de produtos.
 * Contém regras de negócio e invariantes do domínio.
 *
 * @example
 * const item = Item.create({
 *   codigo: '7530110',
 *   descricao: 'TORNEIRA MONOCOMANDO',
 *   unidade: 'UN'
 * });
 */
export class Item {
  private readonly _codigo: ItemCodigo;
  private _descricao: Descricao;
  private _unidade: UnidadeMedida;
  private _ativo: boolean;
  private _observacao?: string;

  private constructor(
    codigo: ItemCodigo,
    descricao: Descricao,
    unidade: UnidadeMedida,
    ativo: boolean = true,
    observacao?: string
  ) {
    this._codigo = codigo;
    this._descricao = descricao;
    this._unidade = unidade;
    this._ativo = ativo;
    this._observacao = observacao;

    // Validar invariantes
    this.validate();
  }

  /**
   * Factory method para criar um Item
   *
   * @param props - Propriedades do item
   * @returns Item criado
   */
  static create(props: {
    codigo: string;
    descricao: string;
    unidade: string;
    ativo?: boolean;
    observacao?: string;
  }): Item {
    const codigo = ItemCodigo.create(props.codigo);
    const descricao = Descricao.create(props.descricao);
    const unidade = UnidadeMedida.create(props.unidade);

    return new Item(
      codigo,
      descricao,
      unidade,
      props.ativo ?? true,
      props.observacao
    );
  }

  /**
   * Valida invariantes do domínio
   * @private
   */
  private validate(): void {
    if (this._descricao.isEmpty) {
      throw new Error('Item deve ter uma descrição válida');
    }
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  get codigo(): ItemCodigo {
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

  get unidade(): UnidadeMedida {
    return this._unidade;
  }

  get unidadeValue(): string {
    return this._unidade.value;
  }

  get ativo(): boolean {
    return this._ativo;
  }

  get observacao(): string | undefined {
    return this._observacao;
  }

  // ============================================================================
  // REGRAS DE NEGÓCIO
  // ============================================================================

  /**
   * Ativa o item
   */
  ativar(): void {
    this._ativo = true;
  }

  /**
   * Inativa o item
   */
  inativar(): void {
    this._ativo = false;
  }

  /**
   * Atualiza a descrição do item
   */
  atualizarDescricao(novaDescricao: string): void {
    this._descricao = Descricao.create(novaDescricao);
    this.validate();
  }

  /**
   * Atualiza a unidade de medida
   */
  atualizarUnidade(novaUnidade: string): void {
    this._unidade = UnidadeMedida.create(novaUnidade);
  }

  /**
   * Adiciona ou atualiza observação
   */
  adicionarObservacao(observacao: string): void {
    this._observacao = observacao.trim();
  }

  /**
   * Remove observação
   */
  removerObservacao(): void {
    this._observacao = undefined;
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  /**
   * Compara dois itens
   */
  equals(other: Item): boolean {
    if (!(other instanceof Item)) {
      return false;
    }
    return this._codigo.equals(other._codigo);
  }

  /**
   * Retorna representação string
   */
  toString(): string {
    return `Item[${this._codigo.value}]: ${this._descricao.value}`;
  }

  /**
   * Converte para DTO
   */
  toDTO(): {
    codigo: string;
    descricao: string;
    unidade: string;
    ativo: boolean;
    observacao?: string | undefined;
  } {
    return {
      codigo: this._codigo.value,
      descricao: this._descricao.value,
      unidade: this._unidade.value,
      ativo: this._ativo,
      observacao: this._observacao
    };
  }
}
