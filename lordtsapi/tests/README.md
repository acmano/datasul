# Tests - Shared Resources

Esta pasta contém recursos **compartilhados** entre testes de diferentes módulos.

## Estrutura

```
tests/
├── factories/           # Test data factories
│   └── item.factory.ts
├── helpers/            # Test utilities
│   └── database.helper.ts
├── mocks/              # Shared mocks
│   └── DatabaseManager.mock.ts
├── load/               # K6 load tests
│   ├── smoke.test.js
│   ├── load.test.js
│   ├── stress.test.js
│   └── spike.test.js
├── setup.ts            # Jest setup
├── setup.integration.ts # Integration setup
├── globals.d.ts        # Global types
├── .env.test           # Test environment
└── README.md           # This file
```

## Onde estão os testes?

Os testes agora ficam **co-located** com o código, em pastas `__tests__/`:

```
src/item/dadosCadastrais/informacoesGerais/
├── controller.ts
├── service.ts
├── repository.ts
└── __tests__/          ← Testes aqui!
    ├── service.test.ts
    ├── repository.test.ts
    ├── controller.test.ts
    └── e2e.test.ts
```

## Factories

Criar dados de teste padronizados:

```typescript
// tests/factories/item.factory.ts
export function createItemMasterQueryResult(overrides = {}) {
  return {
    itemCodigo: '7530110',
    itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
    itemUnidade: 'UN',
    ...overrides
  };
}
```

**Uso:**
```typescript
import { createItemMasterQueryResult } from '@tests/factories/item.factory';

const mockData = createItemMasterQueryResult({ 
  itemCodigo: 'CUSTOM123' 
});
```

## Helpers

Utilitários de teste reutilizáveis:

```typescript
// tests/helpers/database.helper.ts
export class DatabaseTestHelper {
  static async seedTestData() { /* ... */ }
  static async clearDatabase() { /* ... */ }
}
```

**Uso:**
```typescript
import { DatabaseTestHelper } from '@tests/helpers/database.helper';

beforeAll(async () => {
  await DatabaseTestHelper.seedTestData();
});
```

## Mocks

Mocks compartilhados de infraestrutura:

```typescript
// tests/mocks/DatabaseManager.mock.ts
export const mockDatabaseManager = {
  initialize: jest.fn(),
  queryEmpWithParams: jest.fn(),
  // ...
};
```

**Uso:**
```typescript
import { mockDatabaseManager } from '@tests/mocks/DatabaseManager.mock';

jest.mock('@infrastructure/database/DatabaseManager', () => 
  mockDatabaseManager
);
```

## Load Tests

Testes de carga com K6:

```bash
# Smoke test (validação básica)
npm run test:load:smoke

# Load test (carga normal)
npm run test:load

# Stress test (limite)
npm run test:load:stress

# Spike test (picos)
npm run test:load:spike
```

## Setup Files

### setup.ts
Configuração global do Jest:
- Timeout padrão
- Extensions do Joi
- Mocks globais

### setup.integration.ts
Setup específico para testes de integração:
- Conexão com banco de teste
- Seed de dados
- Cleanup

### globals.d.ts
Tipos globais disponíveis em todos os testes:
```typescript
declare global {
  namespace jest {
    interface Matchers<R> {
      // Custom matchers
    }
  }
}
```

## Path Aliases

Configurados no `jest.config.ts`:

```typescript
moduleNameMapper: {
  '^@tests/(.*)$': '<rootDir>/tests/$1',
  '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  '^@/(.*)$': '<rootDir>/src/$1',
  // ...
}
```

**Uso:**
```typescript
import { factory } from '@tests/factories/item.factory';
import { helper } from '@tests/helpers/database.helper';
import { Service } from '@/item/.../service';
import { logger } from '@shared/utils/logger';
```

## Executar Testes

```bash
# Todos os testes
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Módulo específico
npm test -- item

# Apenas co-located tests
npm test -- src/
```

## Criando Novas Factories

```typescript
// tests/factories/familia.factory.ts
export function createFamiliaMasterQueryResult(overrides = {}) {
  return {
    familiaCodigo: '452000',
    familiaDescricao: 'MANUTENCAO HIDRAULICA MECANICA',
    ...overrides
  };
}

export function createFamiliaInformacoesGerais(overrides = {}) {
  return {
    identificacaoFamiliaCodigo: '452000',
    identificacaoFamiliaDescricao: 'MANUTENCAO HIDRAULICA MECANICA',
    ...overrides
  };
}
```

## Boas Práticas

1. **Factories devem ser simples** - Apenas dados, sem lógica
2. **Helpers devem ser puros** - Sem side effects
3. **Mocks devem ser mínimos** - Apenas o necessário
4. **Setup deve ser rápido** - Evitar operações pesadas

## Migração

Testes antigos foram migrados para `__tests__/` co-located.

**Antes:**
```
tests/unit/api/lor0138/item/.../service.test.ts
```

**Depois:**
```
src/item/.../__tests__/service.test.ts
```

Ver `TESTING.md` na raiz para mais detalhes.
