# Domain - Entidades e Objetos de Domínio (DDD)

## 📋 Responsabilidade

A camada **Domain** contém as **entidades de domínio** e **value objects** seguindo Domain-Driven Design (DDD). Representa os conceitos fundamentais do negócio com suas regras e comportamentos.

**Princípio chave:** Modelar o negócio, não a tecnologia.

## ✅ O que esta camada PODE fazer

- ✅ Definir **Entidades** com identidade (Item, Familia, Estabelecimento)
- ✅ Criar **Value Objects** imutáveis (ItemCodigo, Descricao, UnidadeMedida)
- ✅ Implementar **regras de negócio** (ativar/inativar, validações)
- ✅ Usar validações de **@core**
- ✅ Ter métodos de negócio (item.ativar(), familia.ehAtiva())
- ✅ Converter para DTOs (toDTO())
- ✅ Factory methods estáticos (Item.create())

## ❌ O que esta camada NÃO PODE fazer

- ❌ Acessar banco de dados
- ❌ Fazer chamadas HTTP
- ❌ Importar Express ou frameworks web
- ❌ Usar logger diretamente
- ❌ Depender de @infrastructure
- ❌ Depender de @presentation
- ❌ Depender de @application (exceto tipos)

## 📁 Estrutura

```
src/domain/
├── entities/
│   ├── Item.ts              # Entidade Item com lógica de negócio
│   ├── Familia.ts           # Entidade Familia
│   ├── FamiliaComercial.ts
│   ├── GrupoEstoque.ts
│   └── Estabelecimento.ts
├── value-objects/
│   ├── ItemCodigo.ts        # Value Object imutável
│   ├── Descricao.ts
│   └── UnidadeMedida.ts
└── README.md
```

## 💡 Exemplos

### ✅ BOM - Value Object Imutável

```typescript
// src/domain/value-objects/ItemCodigo.ts

import { isValidItemCode, normalizeItemCode } from '@core/validators/codeValidators';

/**
 * Value Object - Código de Item
 *
 * Características:
 * - Imutável (readonly)
 * - Auto-validação
 * - Sem identidade (igualdade por valor)
 * - Não tem métodos setters
 */
export class ItemCodigo {
  private readonly _value: string;
  private static readonly MAX_LENGTH = 16;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Factory method - única forma de criar instância
   * Valida e normaliza na criação
   */
  static create(value: string): ItemCodigo {
    if (!value || value.trim() === '') {
      throw new Error('Código do item não pode ser vazio');
    }

    const normalized = normalizeItemCode(value);

    if (!isValidItemCode(normalized)) {
      throw new Error(
        `Código inválido: "${value}". Deve ter até ${ItemCodigo.MAX_LENGTH} caracteres alfanuméricos.`
      );
    }

    return new ItemCodigo(normalized);
  }

  get value(): string {
    return this._value;
  }

  /**
   * Igualdade por valor
   */
  equals(other: ItemCodigo): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
```

### ✅ BOM - Entidade com Lógica de Negócio

```typescript
// src/domain/entities/Item.ts

import { ItemCodigo } from '../value-objects/ItemCodigo';
import { Descricao } from '../value-objects/Descricao';
import { UnidadeMedida } from '../value-objects/UnidadeMedida';

/**
 * Entidade - Item
 *
 * Características:
 * - Tem identidade (codigo)
 * - Mutável (pode ativar/inativar)
 * - Contém lógica de negócio
 * - Usa Value Objects para garantir validade
 */
export class Item {
  private readonly _codigo: ItemCodigo;        // Imutável
  private _descricao: Descricao;               // Mutável
  private _unidade: UnidadeMedida;             // Mutável
  private _ativo: boolean;                     // Mutável
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
  }

  /**
   * Factory method - cria Item validado
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

  // ==================== Getters ====================

  get codigoValue(): string {
    return this._codigo.value;
  }

  get descricaoValue(): string {
    return this._descricao.value;
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

  // ==================== Métodos de Negócio ====================

  /**
   * Ativa o item
   * @businessRule Item inativo pode ser reativado
   */
  ativar(): void {
    this._ativo = true;
  }

  /**
   * Inativa o item
   * @businessRule Item ativo pode ser inativado
   */
  inativar(): void {
    this._ativo = false;
  }

  /**
   * Atualiza descrição com validação
   */
  atualizarDescricao(novaDescricao: string): void {
    this._descricao = Descricao.create(novaDescricao);
  }

  /**
   * Atualiza unidade de medida
   */
  atualizarUnidade(novaUnidade: string): void {
    this._unidade = UnidadeMedida.create(novaUnidade);
  }

  /**
   * Verifica se item está ativo e pode ser usado
   * @businessRule Apenas itens ativos podem ser usados em movimentações
   */
  podeSerMovimentado(): boolean {
    return this._ativo;
  }

  // ==================== Conversão ====================

  /**
   * Converte para DTO (simples objeto)
   * Usado por application layer
   */
  toDTO(): {
    codigo: string;
    descricao: string;
    unidade: string;
    ativo: boolean;
    observacao?: string;
  } {
    return {
      codigo: this.codigoValue,
      descricao: this.descricaoValue,
      unidade: this.unidadeValue,
      ativo: this._ativo,
      observacao: this._observacao,
    };
  }
}
```

### ❌ RUIM - Entidade com Dependências de Infra

```typescript
// ❌ NÃO FAÇA ISSO EM DOMAIN

import { DatabaseManager } from '@infrastructure/database'; // ❌
import { log } from '@shared/utils/logger'; // ❌
import { Request } from 'express'; // ❌

export class Item {
  private codigo: string;

  // ❌ Entidade acessando banco diretamente
  async save(): Promise<void> {
    log.info('Salvando item'); // ❌ Logger
    await DatabaseManager.queryEmp(
      'INSERT INTO item ...'
    ); // ❌ Database
  }

  // ❌ Entidade conhecendo detalhes de HTTP
  static fromRequest(req: Request): Item {
    return new Item(req.body.codigo); // ❌ Express
  }
}
```

### ✅ BOM - Agregado com Entidades Relacionadas

```typescript
// src/domain/entities/Familia.ts

import { FamiliaCodigo } from '../value-objects/FamiliaCodigo';
import { Descricao } from '../value-objects/Descricao';

/**
 * Agregado - Familia
 *
 * Família é um agregado que pode conter referências a itens
 * mas não gerencia o ciclo de vida deles
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

  static create(props: {
    codigo: string;
    descricao: string;
    ativo?: boolean;
  }): Familia {
    const codigo = FamiliaCodigo.create(props.codigo);
    const descricao = Descricao.create(props.descricao);

    return new Familia(codigo, descricao, props.ativo ?? true);
  }

  get codigoValue(): string {
    return this._codigo.value;
  }

  get descricaoValue(): string {
    return this._descricao.value;
  }

  get ativo(): boolean {
    return this._ativo;
  }

  /**
   * Regra de negócio: Família deve estar ativa
   * para permitir cadastro de itens
   */
  podeReceberItens(): boolean {
    return this._ativo;
  }

  ativar(): void {
    this._ativo = true;
  }

  inativar(): void {
    this._ativo = false;
  }

  toDTO() {
    return {
      codigo: this.codigoValue,
      descricao: this.descricaoValue,
      ativo: this._ativo,
    };
  }
}
```

## 🔗 Dependências

### Dependências Permitidas

- ✅ **@core/** - Validações puras, type guards
- ✅ TypeScript built-in types

### Camadas que podem importar Domain

- ✅ **application** → domain
- ✅ **presentation** → domain (apenas para tipos)
- ✅ **infrastructure** → domain (para mappers)

### Camadas que Domain NÃO pode importar

- ❌ domain → application
- ❌ domain → presentation
- ❌ domain → infrastructure (exceto tipos de interface)

## 📊 Diagrama de Dependências

```
┌─────────────────────────────────────┐
│         presentation                │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│         application                 │
│    (usa entidades domain)           │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│           domain                    │
│    (Entidades + Value Objects)      │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│            core                     │
│    (validações puras)               │
└─────────────────────────────────────┘
```

## 🎯 Boas Práticas

### ✅ DO - Entidades

1. **Identidade clara** - Entidade tem ID único (codigo)
2. **Factory methods** - Usar `Item.create()` em vez de `new Item()`
3. **Encapsulamento** - Campos private/readonly, expor por getters
4. **Métodos de negócio** - `ativar()`, `inativar()`, `podeSerMovimentado()`
5. **Validação na criação** - Factory valida antes de criar
6. **toDTO()** - Conversão para camada de aplicação

### ✅ DO - Value Objects

1. **Imutabilidade** - readonly em todos os campos
2. **Auto-validação** - Validar no factory method
3. **Igualdade por valor** - Implementar `equals()`
4. **Sem identidade** - Dois VOs com mesmo valor são iguais
5. **Factory pattern** - `ItemCodigo.create()` valida e normaliza

### ❌ DON'T

1. ❌ Acessar banco de dados em entidades
2. ❌ Usar logger em domain objects
3. ❌ Importar Express ou frameworks web
4. ❌ Fazer entidades anêmicas (só getters/setters, sem lógica)
5. ❌ Usar `any` - sempre tipar fortemente
6. ❌ Expor setters públicos - usar métodos de negócio
7. ❌ Construtor público - usar factory methods

## 🧪 Testabilidade

Domain é fácil de testar (sem dependências externas):

```typescript
// __tests__/Item.test.ts

import { Item } from '../Item';

describe('Item', () => {
  describe('create', () => {
    it('cria item válido', () => {
      const item = Item.create({
        codigo: 'ITEM-001',
        descricao: 'Item de teste',
        unidade: 'UN',
      });

      expect(item.codigoValue).toBe('ITEM-001');
      expect(item.ativo).toBe(true);
    });

    it('lança erro para código inválido', () => {
      expect(() => {
        Item.create({
          codigo: '',  // Inválido
          descricao: 'Teste',
          unidade: 'UN',
        });
      }).toThrow('Código do item não pode ser vazio');
    });
  });

  describe('métodos de negócio', () => {
    it('ativa e inativa item', () => {
      const item = Item.create({
        codigo: 'ITEM-001',
        descricao: 'Teste',
        unidade: 'UN',
        ativo: false,
      });

      expect(item.ativo).toBe(false);

      item.ativar();
      expect(item.ativo).toBe(true);

      item.inativar();
      expect(item.ativo).toBe(false);
    });

    it('item inativo não pode ser movimentado', () => {
      const item = Item.create({
        codigo: 'ITEM-001',
        descricao: 'Teste',
        unidade: 'UN',
        ativo: false,
      });

      expect(item.podeSerMovimentado()).toBe(false);

      item.ativar();
      expect(item.podeSerMovimentado()).toBe(true);
    });
  });
});

// ✅ Sem mocks!
// ✅ Testando lógica de negócio pura
// ✅ Rápido e determinístico
```

## 📚 Referências

### Conceitos DDD

- **Entity** - Objeto com identidade única
- **Value Object** - Objeto definido por seus atributos (imutável)
- **Aggregate** - Cluster de entidades tratadas como unidade
- **Factory** - Método estático para criar instâncias validadas
- **Domain Logic** - Regras de negócio do domínio

### Leitura Recomendada

- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [Implementing Domain-Driven Design - Vaughn Vernon](https://vaughnvernon.com/)
- [Value Objects Explained](https://martinfowler.com/bliki/ValueObject.html)

### Arquivos Relacionados

- `src/core/` - Validações usadas por Domain
- `src/application/` - Usa entidades de Domain
- `tsconfig.json` - Path alias @domain/*

---

**Última atualização:** 2025-10-20
**Camada:** Domain (DDD)
**Princípio:** Modelar o negócio, não a tecnologia
