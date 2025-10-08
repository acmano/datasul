# Estrutura de Testes - Clean Architecture

## Nova Estrutura

```
item/dadosCadastrais/informacoesGerais/
├── controller.ts
├── service.ts  
├── repository.ts
├── routes.ts
├── types.ts
├── validators.ts
└── __tests__/              # Co-located tests
    ├── service.test.ts     # Unit test
    ├── repository.test.ts  # Unit test
    ├── controller.test.ts  # Integration test
    ├── validators.test.ts  # Unit test
    ├── integration.test.ts # Integration test
    └── e2e.test.ts        # E2E test
```

## Tipos de Testes

### Unit Tests
- `service.test.ts` - Lógica de negócio
- `repository.test.ts` - Acesso a dados
- `validators.test.ts` - Schemas Joi

**Características:**
- Mocka dependências externas
- Testa função por função
- Rápido (~ms)

### Integration Tests
- `controller.test.ts` - Controller + Service
- `integration.test.ts` - Fluxo completo

**Características:**
- Testa interação entre camadas
- Mock apenas banco de dados
- Médio (~100ms)

### E2E Tests
- `e2e.test.ts` - API completa

**Características:**
- Testa API HTTP
- Mock banco + infraestrutura
- Lento (~1s)

## Imports

### Antes (paths relativos longos)
```typescript
import { Service } from '../../../../../../../../src/api/.../service';
```

### Depois (imports locais + aliases)
```typescript
import { Service } from '../service';
import { AppError } from '@shared/errors/AppError';
import { createFactory } from '@tests/factories/item.factory';
```

## Path Aliases

**jest.config.ts:**
```typescript
moduleNameMapper: {
  '^@tests/(.*)$': '<rootDir>/tests/$1',
  '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  // ... outros
}
```

## Executar Testes

```bash
# Todos os testes
npm test

# Apenas um módulo
npm test -- item

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Apenas unit tests
npm test -- --testPathPattern=__tests__

# Apenas E2E
npm test -- --testPathPattern=e2e
```

## Factories & Helpers

Mantidos em `tests/` root:
```
tests/
├── factories/
│   └── item.factory.ts
├── helpers/
│   └── database.helper.ts
└── mocks/
    └── DatabaseManager.mock.ts
```

## Criando Novos Testes

### Service Test Template

```typescript
// __tests__/service.test.ts
import { InformacoesGeraisService } from '../service';
import { Repository } from '../repository';
import { EntityNotFoundError } from '@shared/errors/CustomErrors';

jest.mock('../repository');

describe('Service - InformacoesGeraisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInformacoesGerais', () => {
    it('deve retornar dados quando encontrado', async () => {
      const mockData = { /* ... */ };
      (Repository.get as jest.Mock).mockResolvedValue(mockData);

      const result = await InformacoesGeraisService.get('123');

      expect(result).toEqual(mockData);
    });

    it('deve lançar erro quando não encontrado', async () => {
      (Repository.get as jest.Mock).mockResolvedValue(null);

      await expect(
        InformacoesGeraisService.get('999')
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
```

### Controller Test Template

```typescript
// __tests__/controller.test.ts
import { Request, Response, NextFunction } from 'express';
import { Controller } from '../controller';
import { Service } from '../service';

jest.mock('../service');

describe('Controller - InformacoesGeraisController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { params: {} };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  it('deve retornar 200 com dados', async () => {
    const mockData = { /* ... */ };
    mockReq.params = { codigo: '123' };
    (Service.get as jest.Mock).mockResolvedValue(mockData);

    await Controller.get(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: mockData
    });
  });
});
```

### E2E Test Template

```typescript
// __tests__/e2e.test.ts
import request from 'supertest';
import app from '@/app';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

jest.mock('@infrastructure/database/DatabaseManager');

describe('E2E - API Endpoint', () => {
  beforeAll(() => {
    // Setup mocks
  });

  it('GET /api/... deve retornar 200', async () => {
    const response = await request(app)
      .get('/api/endpoint/123')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});
```

## Vantagens

- ✓ **Co-located**: Testes perto do código
- ✓ **Imports curtos**: Menos `../../../`
- ✓ **Organizado**: `__tests__/` não polui
- ✓ **Consistente**: Mesmo padrão em todos módulos
- ✓ **Fácil encontrar**: Sabe onde está cada teste

## Migration Guide

Para migrar testes antigos:

1. Copiar teste para `__tests__/`
2. Renomear removendo sufixo
3. Atualizar imports:
   - `'../../../../src/...'` → `'../'`
   - `'../../../../shared/...'` → `'@shared/...'`
4. Testar: `npm test -- <module>`
