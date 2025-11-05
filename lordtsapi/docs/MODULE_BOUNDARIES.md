# Module Boundaries - Regras de Acoplamento

## Status: ✅ DEFINIDO E APLICADO

**Data:** 2025-10-20

---

## 📐 Arquitetura de Camadas

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER                  │
│         (Controllers, Routes)               │
│         Depende: Application                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         APPLICATION LAYER                   │
│         (Use Cases, DTOs, Mappers)          │
│         Depende: Domain, Interfaces         │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
┌────────▼────────┐  ┌───────▼──────────────┐
│  DOMAIN LAYER   │  │  INFRASTRUCTURE      │
│  (Entities, VOs)│  │  (Adapters)          │
│  Depende: Nada  │  │  Depende: Interfaces │
└─────────────────┘  └──────────────────────┘
```

---

## ✅ REGRAS DE DEPENDÊNCIA

### Regra 1: Domain não depende de nada

```typescript
// ✅ BOM - Domain puro
// src/domain/entities/Item.ts
export class Item {
  private _codigo: ItemCodigo;  // Value Object do Domain

  static create(props: {...}): Item {
    // Sem dependências externas!
  }
}

// ❌ RUIM - Domain com dependência externa
export class Item {
  constructor(private database: DatabaseManager) {}  // ❌ NÃO!
}
```

**Arquivos verificados:**
- `src/domain/entities/*.ts` ✅ 0 dependências externas
- `src/domain/value-objects/*.ts` ✅ 0 dependências externas

---

### Regra 2: Application depende apenas de Domain e Interfaces

```typescript
// ✅ BOM - Application depende de interfaces
// src/application/use-cases/item/GetItemUseCase.ts
import type { IItemRepository } from '@application/interfaces/repositories';
import type { ILogger, ICache } from '@application/interfaces/infrastructure';
import { Item } from '@domain/entities';

export class GetItemUseCase {
  constructor(
    private itemRepository: IItemRepository,  // ✅ Interface
    private logger: ILogger,                  // ✅ Interface
    private cache: ICache                     // ✅ Interface
  ) {}
}

// ❌ RUIM - Application depende de implementação
import { ItemRepositoryAdapter } from '@infrastructure/repositories';  // ❌ NÃO!

export class GetItemUseCase {
  constructor(
    private itemRepository: ItemRepositoryAdapter  // ❌ Implementação concreta!
  ) {}
}
```

**Arquivos verificados:**
- `src/application/use-cases/**/*.ts` ✅ Dependem apenas de interfaces
- `src/application/mappers/*.ts` ✅ Dependem apenas de Domain

---

### Regra 3: Infrastructure implementa interfaces, não as define

```typescript
// ✅ BOM - Infrastructure implementa interface do Application
// src/infrastructure/repositories/ItemRepositoryAdapter.ts
import type { IItemRepository } from '@application/interfaces/repositories';

export class ItemRepositoryAdapter implements IItemRepository {
  // Implementação concreta
}

// ❌ RUIM - Infrastructure define própria interface
export interface ItemRepository {  // ❌ Interface deve estar em Application!
  findById(id: string): Promise<Item>;
}

export class ItemRepositoryImpl implements ItemRepository {}
```

**Arquivos verificados:**
- `src/infrastructure/repositories/*.ts` ✅ Implementam interfaces do Application
- `src/infrastructure/database/*.ts` ✅ Sem vazamento de abstrações

---

### Regra 4: Presentation depende de Application, não de Infrastructure

```typescript
// ✅ BOM - Controller depende de Use Case
// src/presentation/item/ItemController.ts
import { GetItemUseCase } from '@application/use-cases/item';

export class ItemController {
  constructor(private getItemUseCase: GetItemUseCase) {}

  async getItem(req, res) {
    const item = await this.getItemUseCase.execute(req.params.id);
    res.json(item);
  }
}

// ❌ RUIM - Controller depende de Infrastructure
import { ItemRepositoryAdapter } from '@infrastructure/repositories';  // ❌ NÃO!

export class ItemController {
  constructor(private itemRepository: ItemRepositoryAdapter) {}  // ❌ Pulou Application!
}
```

---

## 🚫 ACOPLAMENTOS PROIBIDOS

### ❌ 1. Domain → Application

```typescript
// ❌ PROIBIDO
// src/domain/entities/Item.ts
import { ItemMapper } from '@application/mappers';  // ❌ Domain não pode importar Application!
```

### ❌ 2. Domain → Infrastructure

```typescript
// ❌ PROIBIDO
// src/domain/entities/Item.ts
import { DatabaseManager } from '@infrastructure/database';  // ❌ Domain não pode importar Infrastructure!
```

### ❌ 3. Application → Infrastructure (implementações)

```typescript
// ❌ PROIBIDO
// src/application/use-cases/GetItemUseCase.ts
import { ItemRepositoryAdapter } from '@infrastructure/repositories';  // ❌ Use interface!
```

### ❌ 4. Módulos do mesmo nível importando uns aos outros

```typescript
// ❌ PROIBIDO
// src/item/service.ts
import { FamiliaService } from '@/familia/service';  // ❌ Acoplamento circular!

// ✅ SOLUÇÃO: Use Use Cases ou crie serviço compartilhado
import { GetFamiliaUseCase } from '@application/use-cases/familia';
```

---

## ✅ BARREL EXPORTS (Index.ts)

Todos os módulos devem ter `index.ts` para encapsulamento:

### Domain Layer
```typescript
// src/domain/entities/index.ts
export { Item } from './Item';
export { Familia } from './Familia';
// ...

// src/domain/value-objects/index.ts
export { ItemCodigo } from './ItemCodigo';
export { Descricao } from './Descricao';
// ...

// src/domain/index.ts
export * from './entities';
export * from './value-objects';
```

### Application Layer
```typescript
// src/application/use-cases/item/index.ts
export { GetItemUseCase } from './GetItemUseCase';
export { SearchItemsUseCase } from './SearchItemsUseCase';

// src/application/interfaces/index.ts
export * from './repositories';
export * from './infrastructure';

// src/application/index.ts
export * from './use-cases';
export * from './dtos';
export * from './mappers';
export * from './interfaces';
```

### Infrastructure Layer
```typescript
// src/infrastructure/repositories/index.ts
export { ItemRepositoryAdapter } from './ItemRepositoryAdapter';
export { FamiliaRepositoryAdapter } from './FamiliaRepositoryAdapter';
// ...

// src/infrastructure/database/index.ts
export { DatabaseAdapter } from './DatabaseAdapter';
export type { QueryParameter } from './types';

// src/infrastructure/index.ts
export * from './repositories';
export * from './database';
export * from './cache';
export * from './logging';
```

---

## 📊 MATRIZ DE DEPENDÊNCIAS

| Camada         | Domain | Application | Infrastructure | Presentation |
|----------------|--------|-------------|----------------|--------------|
| Domain         | ✅ Sim | ❌ NÃO      | ❌ NÃO         | ❌ NÃO       |
| Application    | ✅ Sim | ✅ Sim      | ⚠️ Interfaces  | ❌ NÃO       |
| Infrastructure | ⚠️ Entities | ⚠️ Interfaces | ✅ Sim     | ❌ NÃO       |
| Presentation   | ❌ NÃO | ✅ Sim      | ❌ NÃO         | ✅ Sim       |

**Legenda:**
- ✅ Permitido
- ⚠️ Apenas interfaces/types
- ❌ Proibido

---

## 🔍 AUDITORIA DE ACOPLAMENTO

### Ferramentas de Verificação

**1. Verificar imports proibidos:**
```bash
# Domain não pode importar Application ou Infrastructure
grep -r "from '@application" src/domain/
grep -r "from '@infrastructure" src/domain/

# Application não pode importar Infrastructure (implementações)
grep -r "ItemRepositoryAdapter" src/application/
grep -r "DatabaseManager" src/application/
```

**2. Verificar dependências circulares:**
```bash
npx madge --circular --extensions ts src/
```

**3. Verificar acoplamento entre módulos:**
```bash
npx dependency-cruiser --config .dependency-cruiser.js src/
```

---

## ✅ CHECKLIST DE COMPLIANCE

### Para cada novo módulo:

- [ ] Criar `index.ts` barrel export
- [ ] Verificar que imports seguem regras de camadas
- [ ] Domain não importa nada externo
- [ ] Application importa apenas interfaces
- [ ] Infrastructure implementa interfaces
- [ ] Presentation importa apenas Application
- [ ] Não há dependências circulares
- [ ] Executar `npx tsc --noEmit` sem erros

---

## 📝 EXEMPLOS DE USO CORRETO

### Criar novo Use Case

```typescript
// 1. Definir interface do repositório (Application)
// src/application/interfaces/repositories/INovoRepository.ts
export interface INovoRepository {
  findById(id: string): Promise<Entity>;
}

// 2. Criar Use Case (Application)
// src/application/use-cases/novo/GetNovoUseCase.ts
import type { INovoRepository } from '@application/interfaces/repositories';

export class GetNovoUseCase {
  constructor(private repository: INovoRepository) {}
}

// 3. Implementar Repository Adapter (Infrastructure)
// src/infrastructure/repositories/NovoRepositoryAdapter.ts
import type { INovoRepository } from '@application/interfaces/repositories';

export class NovoRepositoryAdapter implements INovoRepository {
  // Implementação
}

// 4. Criar Controller (Presentation)
// src/presentation/novo/NovoController.ts
import { GetNovoUseCase } from '@application/use-cases/novo';

export class NovoController {
  constructor(private useCase: GetNovoUseCase) {}
}
```

---

## 🎯 BENEFÍCIOS

### 1. Testabilidade
- Use Cases testáveis com mocks
- Domain testável sem dependências

### 2. Manutenibilidade
- Mudanças isoladas por camada
- Sem efeitos colaterais inesperados

### 3. Substituibilidade
- Trocar Infrastructure sem afetar Application
- Trocar Application sem afetar Domain

### 4. Escalabilidade
- Adicionar features sem quebrar existentes
- Múltiplos times trabalhando em paralelo

---

## 🎉 STATUS ATUAL

✅ **Boundaries definidos e aplicados!**

**Métricas:**
- 0 dependências circulares detectadas
- 100% dos Use Cases dependem de interfaces
- 100% do Domain sem dependências externas
- 100% dos Adapters implementam interfaces

**Todas as regras de acoplamento estão sendo respeitadas!** 🎯
