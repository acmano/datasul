// tests/fixtures/entities.fixtures.ts

import { Item } from '@domain/entities/Item';
import { Familia } from '@domain/entities/Familia';
import { FamiliaComercial } from '@domain/entities/FamiliaComercial';
import { GrupoEstoque } from '@domain/entities/GrupoEstoque';
import { Estabelecimento } from '@domain/entities/Estabelecimento';

/**
 * Fixtures para Entidades de Domínio
 *
 * Fornece builders com valores padrão para facilitar testes.
 * Use o padrão Builder para sobrescrever apenas os valores necessários.
 *
 * @example
 * const item = ItemBuilder.build();
 * const itemInativo = ItemBuilder.build({ ativo: false });
 * const itemCustom = ItemBuilder.build({
 *   codigo: 'CUSTOM',
 *   descricao: 'DESCRIÇÃO CUSTOM'
 * });
 */

// ============================================================================
// ITEM BUILDERS
// ============================================================================

export class ItemBuilder {
  private static defaults = {
    codigo: 'TEST001',
    descricao: 'ITEM DE TESTE',
    unidade: 'UN',
    ativo: true,
  };

  /**
   * Cria um Item com valores padrão
   */
  static build(overrides?: Partial<typeof ItemBuilder.defaults>): Item {
    return Item.create({
      ...this.defaults,
      ...overrides,
    });
  }

  /**
   * Cria um Item ativo
   */
  static buildAtivo(overrides?: Partial<typeof ItemBuilder.defaults>): Item {
    return this.build({ ...overrides, ativo: true });
  }

  /**
   * Cria um Item inativo
   */
  static buildInativo(overrides?: Partial<typeof ItemBuilder.defaults>): Item {
    return this.build({ ...overrides, ativo: false });
  }

  /**
   * Cria um Item com observação
   */
  static buildComObservacao(observacao: string, overrides?: Partial<typeof ItemBuilder.defaults>): Item {
    return this.build({ ...overrides, observacao });
  }

  /**
   * Cria um Item típico de material hidráulico
   */
  static buildTorneira(): Item {
    return this.build({
      codigo: '7530110',
      descricao: 'TORNEIRA MONOCOMANDO CROMADA',
      unidade: 'UN',
    });
  }

  /**
   * Cria um Item típico de material de construção
   */
  static buildCimento(): Item {
    return this.build({
      codigo: 'CIM-001',
      descricao: 'CIMENTO PORTLAND CP-II 50KG',
      unidade: 'SC',
    });
  }

  /**
   * Cria múltiplos Items
   */
  static buildMany(count: number, overrides?: Partial<typeof ItemBuilder.defaults>): Item[] {
    return Array.from({ length: count }, (_, i) =>
      this.build({
        ...overrides,
        codigo: `${overrides?.codigo || 'TEST'}${i.toString().padStart(3, '0')}`,
        descricao: `${overrides?.descricao || 'ITEM'} ${i + 1}`,
      })
    );
  }
}

// ============================================================================
// FAMILIA BUILDERS
// ============================================================================

export class FamiliaBuilder {
  private static defaults = {
    codigo: 'FM001',
    descricao: 'FAMILIA DE TESTE',
  };

  static build(overrides?: Partial<typeof FamiliaBuilder.defaults>): Familia {
    return Familia.create({
      ...this.defaults,
      ...overrides,
    });
  }

  static buildMetais(): Familia {
    return this.build({
      codigo: 'FM-MET',
      descricao: 'METAIS SANITARIOS',
    });
  }

  static buildFerramentas(): Familia {
    return this.build({
      codigo: 'FM-FER',
      descricao: 'FERRAMENTAS',
    });
  }

  static buildMany(count: number, overrides?: Partial<typeof FamiliaBuilder.defaults>): Familia[] {
    return Array.from({ length: count }, (_, i) =>
      this.build({
        ...overrides,
        codigo: `FM${i.toString().padStart(3, '0')}`,
        descricao: `FAMILIA ${i + 1}`,
      })
    );
  }
}

// ============================================================================
// FAMILIA COMERCIAL BUILDERS
// ============================================================================

export class FamiliaComercialBuilder {
  private static defaults = {
    codigo: 'FC001',
    descricao: 'FAMILIA COMERCIAL DE TESTE',
  };

  static build(overrides?: Partial<typeof FamiliaComercialBuilder.defaults>): FamiliaComercial {
    return FamiliaComercial.create({
      ...this.defaults,
      ...overrides,
    });
  }

  static buildHidraulica(): FamiliaComercial {
    return this.build({
      codigo: 'FC-HID',
      descricao: 'HIDRAULICA',
    });
  }

  static buildEletrica(): FamiliaComercial {
    return this.build({
      codigo: 'FC-ELE',
      descricao: 'ELETRICA',
    });
  }

  static buildMany(count: number, overrides?: Partial<typeof FamiliaComercialBuilder.defaults>): FamiliaComercial[] {
    return Array.from({ length: count }, (_, i) =>
      this.build({
        ...overrides,
        codigo: `FC${i.toString().padStart(3, '0')}`,
        descricao: `FAMILIA COMERCIAL ${i + 1}`,
      })
    );
  }
}

// ============================================================================
// GRUPO ESTOQUE BUILDERS
// ============================================================================

export class GrupoEstoqueBuilder {
  private static defaults = {
    codigo: '01',
    descricao: 'GRUPO DE ESTOQUE DE TESTE',
  };

  static build(overrides?: Partial<typeof GrupoEstoqueBuilder.defaults>): GrupoEstoque {
    return GrupoEstoque.create({
      ...this.defaults,
      ...overrides,
    });
  }

  static buildMateriais(): GrupoEstoque {
    return this.build({
      codigo: '01',
      descricao: 'MATERIAIS',
    });
  }

  static buildProdutosAcabados(): GrupoEstoque {
    return this.build({
      codigo: '02',
      descricao: 'PRODUTOS ACABADOS',
    });
  }

  static buildMany(count: number, overrides?: Partial<typeof GrupoEstoqueBuilder.defaults>): GrupoEstoque[] {
    return Array.from({ length: count }, (_, i) =>
      this.build({
        ...overrides,
        codigo: (i + 1).toString().padStart(2, '0'),
        descricao: `GRUPO ${i + 1}`,
      })
    );
  }
}

// ============================================================================
// ESTABELECIMENTO BUILDERS
// ============================================================================

export class EstabelecimentoBuilder {
  private static defaults = {
    codigo: '001',
    nome: 'ESTABELECIMENTO DE TESTE',
  };

  static build(overrides?: Partial<typeof EstabelecimentoBuilder.defaults>): Estabelecimento {
    return Estabelecimento.create({
      ...this.defaults,
      ...overrides,
    });
  }

  static buildMatriz(): Estabelecimento {
    return this.build({
      codigo: '001',
      nome: 'MATRIZ',
    });
  }

  static buildFilial(numero: number): Estabelecimento {
    return this.build({
      codigo: numero.toString().padStart(3, '0'),
      nome: `FILIAL ${numero}`,
    });
  }

  static buildMany(count: number, overrides?: Partial<typeof EstabelecimentoBuilder.defaults>): Estabelecimento[] {
    return Array.from({ length: count }, (_, i) =>
      this.build({
        ...overrides,
        codigo: (i + 1).toString().padStart(3, '0'),
        nome: `ESTABELECIMENTO ${i + 1}`,
      })
    );
  }
}

// ============================================================================
// SCENARIOS - Cenários Completos
// ============================================================================

/**
 * Cenários pré-configurados para testes complexos
 */
export class EntityScenarios {
  /**
   * Cenário: Produto completo com todas as relações
   */
  static itemCompleto() {
    return {
      item: ItemBuilder.buildTorneira(),
      familia: FamiliaBuilder.buildMetais(),
      familiaComercial: FamiliaComercialBuilder.buildHidraulica(),
      grupoEstoque: GrupoEstoqueBuilder.buildMateriais(),
      estabelecimentos: [
        EstabelecimentoBuilder.buildMatriz(),
        EstabelecimentoBuilder.buildFilial(2),
      ],
    };
  }

  /**
   * Cenário: Item básico sem relações
   */
  static itemBasico() {
    return {
      item: ItemBuilder.build(),
    };
  }

  /**
   * Cenário: Catálogo de produtos
   */
  static catalogo(qtdItems: number = 10) {
    return {
      items: ItemBuilder.buildMany(qtdItems),
      familias: FamiliaBuilder.buildMany(3),
      grupos: GrupoEstoqueBuilder.buildMany(2),
    };
  }

  /**
   * Cenário: Multi-estabelecimento
   */
  static multiEstabelecimento() {
    return {
      item: ItemBuilder.build({ codigo: 'MULTI-001' }),
      estabelecimentos: EstabelecimentoBuilder.buildMany(5),
    };
  }
}
