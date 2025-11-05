# Application - Casos de Uso e Orquestração

## 📋 Responsabilidade

A camada **Application** contém **casos de uso** (use cases) que orquestram o fluxo de dados entre a interface do usuário e as entidades de domínio. Coordena operações mas não contém lógica de negócio.

**Princípio chave:** Orquestrar, não implementar regras de negócio.

## ✅ O que esta camada PODE fazer

- ✅ Definir **Use Cases** (GetItemUseCase, SearchItemsUseCase)
- ✅ Criar **DTOs** para entrada/saída (ItemDTO, SearchItemsDTO)
- ✅ Criar **Mappers** (Entity ↔ DTO)
- ✅ Definir **interfaces** de repositórios (IItemRepository)
- ✅ Orquestrar fluxo: validar → buscar → mapear → retornar
- ✅ Usar entidades de **@domain**
- ✅ Usar validações de **@core**
- ✅ Chamar repositórios via interfaces

## ❌ O que esta camada NÃO PODE fazer

- ❌ Implementar repositórios (vai em @infrastructure)
- ❌ Acessar banco de dados diretamente
- ❌ Importar Express ou detalhes HTTP
- ❌ Implementar regras de negócio (vai em @domain)
- ❌ Depender de @infrastructure (apenas interfaces)
- ❌ Depender de @presentation

## 📁 Estrutura

```
src/application/
├── use-cases/
│   ├── item/
│   │   ├── GetItemUseCase.ts       # Buscar item por código
│   │   ├── SearchItemsUseCase.ts   # Buscar itens com filtros
│   │   └── index.ts
│   ├── familia/
│   │   ├── GetFamiliaUseCase.ts
│   │   ├── ListFamiliasUseCase.ts
│   │   └── index.ts
│   └── index.ts
├── dtos/
│   ├── ItemDTO.ts                   # DTOs de Item
│   ├── FamiliaDTO.ts
│   └── index.ts
├── mappers/
│   ├── ItemMapper.ts                # Entity ↔ DTO
│   ├── FamiliaMapper.ts
│   └── index.ts
└── README.md
```

## 💡 Exemplos

### ✅ BOM - DTO (Data Transfer Object)

```typescript
// src/application/dtos/ItemDTO.ts

/**
 * DTO - Item (simples objeto para transferência)
 *
 * Características:
 * - Plain object (não é classe)
 * - Sem lógica de negócio
 * - Usado para comunicação entre camadas
 * - Serializable (pode virar JSON)
 */

export interface ItemDTO {
  codigo: string;
  descricao: string;
  unidade: string;
  ativo: boolean;
  observacao?: string;
}

export interface ItemDetailDTO extends ItemDTO {
  familia?: {
    codigo: string;
    descricao: string;
  };
  familiaComercial?: {
    codigo: string;
    descricao: string;
  };
  grupoEstoque?: {
    codigo: string;
    descricao: string;
  };
}

export interface SearchItemsDTO {
  query?: string;
  ativo?: boolean;
  familia?: string;
  limit?: number;
  offset?: number;
}

export interface SearchItemsResultDTO {
  items: ItemDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
```

### ✅ BOM - Mapper (Entity ↔ DTO)

```typescript
// src/application/mappers/ItemMapper.ts

import { Item } from '@domain/entities/Item';
import type { ItemDTO, ItemDetailDTO } from '../dtos/ItemDTO';

/**
 * Mapper - Converte entre Entity e DTO
 *
 * Responsabilidade:
 * - Entity → DTO (para resposta)
 * - DTO → Entity (para criação/atualização)
 */
export class ItemMapper {
  /**
   * Converte Entity para DTO simples
   */
  static toDTO(item: Item): ItemDTO {
    return {
      codigo: item.codigoValue,
      descricao: item.descricaoValue,
      unidade: item.unidadeValue,
      ativo: item.ativo,
      observacao: item.observacao,
    };
  }

  /**
   * Converte DTO para Entity (criação)
   */
  static toDomain(dto: {
    codigo: string;
    descricao: string;
    unidade: string;
    ativo?: boolean;
    observacao?: string;
  }): Item {
    return Item.create({
      codigo: dto.codigo,
      descricao: dto.descricao,
      unidade: dto.unidade,
      ativo: dto.ativo,
      observacao: dto.observacao,
    });
  }

  /**
   * Converte Entity + dados relacionados para DTO detalhado
   */
  static toDetailDTO(
    item: Item,
    related?: {
      familia?: { codigo: string; descricao: string };
      familiaComercial?: { codigo: string; descricao: string };
      grupoEstoque?: { codigo: string; descricao: string };
    }
  ): ItemDetailDTO {
    return {
      ...this.toDTO(item),
      ...related,
    };
  }

  /**
   * Converte array de Entities para array de DTOs
   */
  static toDTOList(items: Item[]): ItemDTO[] {
    return items.map(item => this.toDTO(item));
  }
}
```

### ✅ BOM - Use Case (Orquestração)

```typescript
// src/application/use-cases/item/GetItemUseCase.ts

import type { ItemDetailDTO } from '../../dtos/ItemDTO';

/**
 * Use Case - Obter Item por Código
 *
 * Responsabilidade:
 * 1. Validar entrada
 * 2. Buscar item no repositório
 * 3. Buscar dados relacionados (familia, etc)
 * 4. Mapear para DTO
 * 5. Retornar resultado
 *
 * NÃO implementa:
 * - Regras de negócio (vai em @domain)
 * - Acesso a banco (vai em @infrastructure)
 * - Detalhes HTTP (vai em @presentation)
 */
export class GetItemUseCase {
  /**
   * Executa o use case
   *
   * @param itemCodigo - Código do item
   * @returns DTO detalhado do item
   * @throws Error se código inválido ou item não encontrado
   */
  async execute(itemCodigo: string): Promise<ItemDetailDTO> {
    // 1. Validar entrada
    if (!itemCodigo || itemCodigo.trim() === '') {
      throw new Error('Código do item é obrigatório');
    }

    // 2. Buscar item (delegado ao repository - não implementado aqui)
    // const item = await this.itemRepository.findByCode(itemCodigo);
    // if (!item) {
    //   throw new Error(`Item ${itemCodigo} não encontrado`);
    // }

    // 3. Buscar dados relacionados
    // const familia = await this.familiaRepository.findByCode(item.familiaCode);
    // const familiaComercial = await this.familiaComercialRepository...
    // const grupoEstoque = await this.grupoEstoqueRepository...

    // 4. Mapear para DTO
    // return ItemMapper.toDetailDTO(item, {
    //   familia: familia?.toDTO(),
    //   familiaComercial: familiaComercial?.toDTO(),
    //   grupoEstoque: grupoEstoque?.toDTO(),
    // });

    // Por enquanto, retorna estrutura de exemplo
    return {
      codigo: itemCodigo,
      descricao: 'Item de exemplo',
      unidade: 'UN',
      ativo: true,
    };
  }
}
```

### ✅ BOM - Use Case com Paginação

```typescript
// src/application/use-cases/item/SearchItemsUseCase.ts

import type {
  SearchItemsDTO,
  SearchItemsResultDTO,
} from '../../dtos/ItemDTO';

/**
 * Use Case - Buscar Itens com Filtros
 *
 * Orquestra:
 * 1. Validação de parâmetros
 * 2. Aplicação de defaults (limit, offset)
 * 3. Busca no repositório
 * 4. Mapeamento para DTO
 * 5. Cálculo de paginação
 */
export class SearchItemsUseCase {
  async execute(params: SearchItemsDTO): Promise<SearchItemsResultDTO> {
    // 1. Aplicar defaults
    const limit = Math.min(params.limit || 50, 100); // Max 100
    const offset = params.offset || 0;

    // 2. Validar parâmetros
    if (limit < 1) {
      throw new Error('Limit deve ser maior que zero');
    }

    if (offset < 0) {
      throw new Error('Offset não pode ser negativo');
    }

    // 3. Buscar no repositório (delegado)
    // const items = await this.itemRepository.search({
    //   query: params.query,
    //   ativo: params.ativo,
    //   familia: params.familia,
    //   limit,
    //   offset,
    // });

    // 4. Contar total
    // const total = await this.itemRepository.count({
    //   query: params.query,
    //   ativo: params.ativo,
    //   familia: params.familia,
    // });

    // 5. Mapear para DTOs
    // const itemDTOs = ItemMapper.toDTOList(items);

    // 6. Calcular paginação
    // const hasMore = offset + limit < total;

    // Por enquanto, retorna estrutura vazia
    return {
      items: [],
      total: 0,
      limit,
      offset,
      hasMore: false,
    };
  }
}
```

### ❌ RUIM - Use Case com Lógica de Negócio

```typescript
// ❌ NÃO FAÇA ISSO EM APPLICATION

export class CreateItemUseCase {
  async execute(dto: CreateItemDTO): Promise<ItemDTO> {
    // ❌ Lógica de negócio no use case (deveria estar em @domain)
    if (dto.codigo.length > 16) {
      throw new Error('Código muito longo');
    }

    // ❌ Acessando banco diretamente (deveria usar repository)
    await DatabaseManager.queryEmp(
      `INSERT INTO item VALUES ('${dto.codigo}', '${dto.descricao}')`
    );

    // ❌ Regra de negócio (deveria estar na entidade)
    const ativo = dto.familia?.startsWith('A') ? true : false;

    return { ...dto, ativo };
  }
}
```

### ✅ BOM - Interface de Repository

```typescript
// src/application/interfaces/IItemRepository.ts

import type { Item } from '@domain/entities/Item';

/**
 * Interface de Repository
 *
 * Define contrato, não implementação
 * Implementação vai em @infrastructure
 */
export interface IItemRepository {
  findByCode(codigo: string): Promise<Item | null>;

  search(filters: {
    query?: string;
    ativo?: boolean;
    familia?: string;
    limit: number;
    offset: number;
  }): Promise<Item[]>;

  count(filters: {
    query?: string;
    ativo?: boolean;
    familia?: string;
  }): Promise<number>;

  save(item: Item): Promise<void>;

  delete(codigo: string): Promise<void>;
}
```

## 🔗 Dependências

### Dependências Permitidas

- ✅ **@domain** - Usar entidades e value objects
- ✅ **@core** - Usar validações puras
- ✅ Definir interfaces para repositórios (implementadas em @infrastructure)

### Camadas que podem importar Application

- ✅ **presentation** → application (usa use cases e DTOs)
- ✅ **infrastructure** → application (implementa interfaces)

### Camadas que Application NÃO pode importar

- ❌ application → presentation
- ❌ application → infrastructure (apenas interfaces, não implementações)

## 📊 Diagrama de Dependências

```
┌─────────────────────────────────────┐
│         presentation                │
│    (usa use cases e DTOs)           │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│         application                 │
│    (use cases, DTOs, mappers)       │
│    define: IItemRepository          │
└────────┬───────────────────┬────────┘
         │                   │
         │                   │ implementa
         │                   │ interfaces
         ▼                   ▼
   ┌──────────┐      ┌──────────────┐
   │  domain  │      │infrastructure│
   │          │      │ (repositories)│
   └──────────┘      └───────────────┘
```

## 🎯 Boas Práticas

### ✅ DO - Use Cases

1. **Um use case = uma operação** - GetItem, SearchItems, CreateItem
2. **Método execute()** - Ponto de entrada padrão
3. **Validar entrada** - Antes de chamar repositórios
4. **Orquestrar, não implementar** - Delegar para domain e repositories
5. **Retornar DTOs** - Não expor entidades diretamente
6. **Async/await** - Use cases geralmente são assíncronos

### ✅ DO - DTOs

1. **Interfaces, não classes** - DTOs são plain objects
2. **Sem lógica** - Apenas estrutura de dados
3. **Tipos específicos** - ItemDTO, SearchItemsDTO, ItemDetailDTO
4. **Opcional quando faz sentido** - Usar `?` para campos opcionais
5. **Naming consistente** - *DTO, *ResultDTO, *QueryDTO

### ✅ DO - Mappers

1. **Classe estática** - ItemMapper com métodos estáticos
2. **toDTO() / toDomain()** - Métodos claros
3. **Sem dependências** - Apenas conversão de dados
4. **Null-safe** - Tratar casos de undefined/null

### ❌ DON'T

1. ❌ Implementar regras de negócio em use cases
2. ❌ Acessar banco diretamente (usar repositories)
3. ❌ Importar Express ou detalhes HTTP
4. ❌ DTOs com métodos (devem ser plain objects)
5. ❌ Use cases com muita responsabilidade (quebrar em menores)
6. ❌ Expor entidades domain diretamente (usar DTOs)

## 🧪 Testabilidade

Application usa mocks para repositories:

```typescript
// __tests__/GetItemUseCase.test.ts

import { GetItemUseCase } from '../GetItemUseCase';
import { IItemRepository } from '../../interfaces/IItemRepository';
import { Item } from '@domain/entities/Item';

// Mock do repository
const mockItemRepository: jest.Mocked<IItemRepository> = {
  findByCode: jest.fn(),
  search: jest.fn(),
  count: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('GetItemUseCase', () => {
  let useCase: GetItemUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetItemUseCase(mockItemRepository);
  });

  it('retorna item quando encontrado', async () => {
    // Arrange
    const item = Item.create({
      codigo: 'ITEM-001',
      descricao: 'Teste',
      unidade: 'UN',
    });

    mockItemRepository.findByCode.mockResolvedValue(item);

    // Act
    const result = await useCase.execute('ITEM-001');

    // Assert
    expect(result.codigo).toBe('ITEM-001');
    expect(mockItemRepository.findByCode).toHaveBeenCalledWith('ITEM-001');
  });

  it('lança erro quando código vazio', async () => {
    await expect(useCase.execute('')).rejects.toThrow(
      'Código do item é obrigatório'
    );
  });
});

// ✅ Testa orquestração sem acessar banco real
// ✅ Mocks controlam comportamento dos repositories
// ✅ Rápido e isolado
```

## 📚 Referências

### Conceitos

- **Use Case** - Caso de uso da aplicação (operação específica)
- **DTO** - Data Transfer Object (objeto para transferência)
- **Mapper** - Converte entre Entity e DTO
- **Repository Pattern** - Interface para acesso a dados
- **Orchestration** - Coordenar fluxo, não implementar lógica

### Leitura Recomendada

- [Clean Architecture - Use Cases](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [DTO Pattern](https://martinfowler.com/eaaCatalog/dataTransferObject.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

### Arquivos Relacionados

- `src/domain/` - Entidades usadas pelos use cases
- `src/presentation/` - Controllers que chamam use cases
- `src/infrastructure/` - Implementa interfaces de repositories
- `tsconfig.json` - Path alias @application/*

---

**Última atualização:** 2025-10-20
**Camada:** Application (Use Cases)
**Princípio:** Orquestrar, não implementar regras de negócio
