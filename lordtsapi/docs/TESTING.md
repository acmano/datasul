# TESTING.md - Guia Completo de Testes

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Tipos de Testes](#-tipos-de-testes)
3. [Configuração](#️-configuração)
4. [Como Rodar](#-como-rodar)
5. [Estrutura de Arquivos](#-estrutura-de-arquivos)
6. [Boas Práticas](#-boas-práticas)
7. [Estratégias de Teste](#-estratégias-de-teste)
8. [Debugging de Testes](#-debugging-de-testes)
9. [Troubleshooting](#-troubleshooting)
10. [Performance de Testes](#-performance-de-testes)
11. [Integração Contínua](#-integração-contínua)
12. [Próximos Passos](#-próximos-passos)

---

## 🎯 Visão Geral

O projeto LOR0138 utiliza uma estratégia de testes em múltiplas camadas para garantir qualidade e confiabilidade:

```
Pirâmide de Testes
        ┌─────────┐
        │   E2E   │  ← Poucos, lentos, alta confiança
        ├─────────┤
      │ Integration │  ← Médios, moderados, validam fluxos
      ├───────────┤
    │   Unit Tests  │  ← Muitos, rápidos, validam lógica
    └─────────────┘
```

### Cobertura Atual

| Tipo | Cobertura | Status |
|------|-----------|--------|
| Unit Tests | 75%+ | ✅ OK |
| Integration | 60%+ | ⚠️ Em progresso |
| E2E | 40%+ | 🔄 Planejado |
| Mutation Score | 80%+ | 🎯 Meta |

---

## 🧪 Tipos de Testes

### 1. Testes Unitários (Unit Tests)

**O que testam:** Unidades isoladas de código (funções, classes, métodos)

**Mock:** Sim, todas as dependências externas são mockadas

**Velocidade:** Muito rápido (<100ms por teste)

**Quando rodar:** A cada mudança de código, durante desenvolvimento

**Exemplos:**
```bash
# Testar validators
npm run test:unit -- validators

# Testar services
npm run test:unit -- services

# Watch mode durante desenvolvimento
npm run test:unit:watch
```

**Casos de uso:**
- Validação de entrada (validators)
- Lógica de negócio (services)
- Transformação de dados (mappers)
- Utilitários (helpers, utils)

### 2. Testes de Integração (Integration Tests)

**O que testam:** Integração entre componentes com banco de dados **REAL**

**Mock:** Não, usa banco de produção (somente leitura)

**Velocidade:** Moderado (1-5s por teste)

**Quando rodar:** Antes de commits, PRs e deploys

**⚠️ IMPORTANTE:**
- Usa banco de **PRODUÇÃO** (somente leitura)
- Se banco offline, usa MOCK automaticamente
- Não escreve nada no banco
- Validação com item real: `7530110`

**Exemplos:**
```bash
# Rodar todos os testes de integração
npm run test:integration

# Watch mode
npm run test:integration:watch
```

**Casos de uso:**
- Repository + DatabaseManager
- Controller + Service + Repository
- Fluxos completos de API
- Validação de queries SQL

### 3. Testes E2E (End-to-End)

**O que testam:** Fluxo completo da API com mocks

**Mock:** Sim, simula banco e serviços externos

**Velocidade:** Rápido (1-3s por teste)

**Quando rodar:** Antes de deploy

**Exemplos:**
```bash
# Rodar todos os testes E2E
npm run test:e2e

# Watch mode
npm run test:e2e:watch
```

**Casos de uso:**
- Testes de contratos de API
- Validação de responses HTTP
- Testes de autenticação/autorização
- Testes de rate limiting

### 4. Mutation Testing

**O que testa:** Qualidade dos testes (detecta testes fracos)

**Ferramenta:** Stryker Mutator

**Velocidade:** Lento (5-15 min)

**Quando rodar:** Antes de PRs importantes

**Exemplos:**
```bash
# Rodar mutation testing completo
npm run test:mutation

# Quick scan (apenas validators)
npm run test:mutation:quick

# Modo incremental (apenas arquivos modificados)
npm run test:mutation:incremental
```

Ver [MUTATION_TESTING.md](./MUTATION_TESTING.md) para detalhes completos.

---

## ⚙️ Configuração

### 1. Criar `.env.test`

Copie o `.env.example` e ajuste:

```bash
cp .env.example .env.test
```

**Configurações importantes:**

```env
# ========================================
# DATABASE - Banco de Produção (READ-ONLY)
# ========================================
DB_SERVER=10.105.0.4\LOREN
DB_USER=sysprogress
DB_PASSWORD='sysprogress'           # ⚠️ Aspas simples obrigatórias!
DB_DATABASE_EMP=                  # Vazio = usa default do user
DB_DATABASE_MULT=                 # Vazio = usa default do user
DB_CONNECTION_TIMEOUT=30000       # 30s em milissegundos
DB_REQUEST_TIMEOUT=30000          # 30s em milissegundos

# ========================================
# CACHE - Desabilitado para testes
# ========================================
CACHE_ENABLED=false
CACHE_STRATEGY=memory

# ========================================
# LOGS - Silenciosos para testes
# ========================================
LOG_LEVEL=error                   # Apenas erros
LOG_TO_FILE=false                 # Não gravar em arquivo

# ========================================
# HTTP - Timeouts reduzidos
# ========================================
HTTP_REQUEST_TIMEOUT=5000         # 5s para testes
HTTP_HEALTH_TIMEOUT=2000          # 2s para health check
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Verificar Configuração do Jest

O arquivo `jest.config.ts` já está configurado com:

```typescript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  }
}
```

---

## 🚀 Como Rodar

### Comandos Básicos

```bash
# Rodar todos os testes unitários
npm run test:unit

# Rodar testes de integração (banco real)
npm run test:integration

# Rodar testes E2E
npm run test:e2e

# Rodar TODOS os testes
npm run test:all
```

### Modo Watch (Desenvolvimento)

```bash
# Watch unitários
npm run test:unit:watch

# Watch integração
npm run test:integration:watch

# Watch E2E
npm run test:e2e:watch
```

### Coverage (Cobertura)

```bash
# Gerar relatório de cobertura
npm run test:coverage

# Abrir relatório HTML
open coverage/lcov-report/index.html
```

### Filtrar Testes

```bash
# Rodar apenas testes de validators
npm run test:unit -- validators

# Rodar teste específico por nome
npm run test:unit -- -t "deve validar item código"

# Rodar arquivos que contém 'validator' no path
npm run test:unit -- --testPathPattern=validator
```

### Testes com Verbose

```bash
# Mostrar todos os testes executados
npm run test:unit -- --verbose

# Mostrar apenas falhas
npm run test:unit -- --silent
```

### Limpar Cache

```bash
# Limpar cache do Jest
npm test -- --clearCache

# Remover diretório de cache
rm -rf .jest-cache
```

---

## 📂 Estrutura de Arquivos

```
tests/
├── unit/                           # Testes unitários (isolados, com mocks)
│   ├── validators/
│   │   ├── itemCodigoValidator.test.ts
│   │   └── queryParamsValidator.test.ts
│   ├── services/
│   │   └── informacoesGeraisService.test.ts
│   ├── repositories/
│   │   └── informacoesGeraisRepository.test.ts
│   └── utils/
│       └── logger.test.ts
│
├── integration/                    # Testes de integração (BANCO REAL)
│   ├── api/
│   │   └── informacoesGerais.integration.test.ts
│   └── repositories/
│       └── informacoesGeraisRepository.integration.test.ts
│
├── e2e/                           # Testes E2E (MOCK completo)
│   └── api/
│       └── informacoesGerais.e2e.test.ts
│
├── helpers/                       # Utilitários para testes
│   └── database.helper.ts         # Helper para banco de teste
│
├── factories/                     # Factories de dados de teste
│   └── item.factory.ts            # Cria dados mock de itens
│
├── mocks/                         # Mocks compartilhados
│   ├── DatabaseManager.mock.ts
│   └── CacheManager.mock.ts
│
├── setup.ts                       # Setup global (unitários/E2E)
└── setup.integration.ts           # Setup para integração
```

### Padrões de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Unit Test | `*.test.ts` | `itemValidator.test.ts` |
| Integration Test | `*.integration.test.ts` | `itemApi.integration.test.ts` |
| E2E Test | `*.e2e.test.ts` | `itemFlow.e2e.test.ts` |
| Mock | `*.mock.ts` | `DatabaseManager.mock.ts` |
| Factory | `*.factory.ts` | `item.factory.ts` |
| Helper | `*.helper.ts` | `database.helper.ts` |

---

## ✅ Boas Práticas

### 1. Isolamento de Testes

**❌ Evite:**
```typescript
let sharedData: any;

it('teste 1', () => {
  sharedData = { value: 1 };
  expect(sharedData.value).toBe(1);
});

it('teste 2', () => {
  // Pode falhar se teste 1 não rodar antes
  expect(sharedData.value).toBe(1);
});
```

**✅ Faça:**
```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Limpa mocks entre testes
});

it('teste 1', () => {
  const data = { value: 1 };
  expect(data.value).toBe(1);
});

it('teste 2', () => {
  const data = { value: 2 };
  expect(data.value).toBe(2);
});
```

### 2. Use Factories para Dados

**❌ Evite:**
```typescript
it('deve criar item', () => {
  const item = {
    itemCodigo: '7530110',
    itemDescricao: 'VALVULA DE ESFERA',
    itemUnidade: 'UN',
    itemTipo: 'MC',
    // ... 20 campos mais
  };

  expect(service.create(item)).toBeTruthy();
});
```

**✅ Faça:**
```typescript
import { createInformacoesGerais } from '../../factories/item.factory';

it('deve criar item', () => {
  const item = createInformacoesGerais({
    itemCodigo: '7530110' // Override apenas o necessário
  });

  expect(service.create(item)).toBeTruthy();
});
```

### 3. Teste Casos de Erro

**❌ Evite:**
```typescript
it('deve buscar item', async () => {
  const result = await service.buscar('7530110');
  expect(result).toBeTruthy();
});
```

**✅ Faça:**
```typescript
describe('buscar item', () => {
  it('deve buscar item existente', async () => {
    const result = await service.buscar('7530110');
    expect(result).toBeTruthy();
    expect(result.itemCodigo).toBe('7530110');
  });

  it('deve lançar erro se item não existe', async () => {
    await expect(
      service.buscar('INEXISTENTE')
    ).rejects.toThrow(ItemNotFoundError);
  });

  it('deve lançar erro se código inválido', async () => {
    await expect(
      service.buscar('')
    ).rejects.toThrow(ValidationError);
  });
});
```

### 4. Valide Performance

```typescript
it('deve responder em menos de 1 segundo', async () => {
  const start = Date.now();

  await request(app).get('/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110');

  const duration = Date.now() - start;
  expect(duration).toBeLessThan(1000);
});
```

### 5. Use Correlation ID em Testes

```typescript
it('deve incluir correlation ID no header', async () => {
  const response = await request(app)
    .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110')
    .set('X-Correlation-ID', 'test-correlation-id-123');

  expect(response.headers['x-correlation-id']).toBe('test-correlation-id-123');
});
```

### 6. Organize Testes com describe()

**❌ Evite:**
```typescript
it('deve validar código válido', () => { /* ... */ });
it('deve rejeitar código vazio', () => { /* ... */ });
it('deve rejeitar código com espaços', () => { /* ... */ });
it('deve buscar item válido', () => { /* ... */ });
```

**✅ Faça:**
```typescript
describe('ItemCodigoValidator', () => {
  describe('validate()', () => {
    it('deve validar código válido', () => { /* ... */ });
    it('deve rejeitar código vazio', () => { /* ... */ });
    it('deve rejeitar código com espaços', () => { /* ... */ });
  });
});

describe('ItemService', () => {
  describe('buscar()', () => {
    it('deve buscar item válido', () => { /* ... */ });
  });
});
```

### 7. Nomeie Testes de Forma Clara

**❌ Evite:**
```typescript
it('works', () => { /* ... */ });
it('test 1', () => { /* ... */ });
it('should pass', () => { /* ... */ });
```

**✅ Faça:**
```typescript
it('deve validar item código com 7 caracteres', () => { /* ... */ });
it('deve lançar ValidationError quando código está vazio', () => { /* ... */ });
it('deve retornar 200 com dados do item quando item existe', () => { /* ... */ });
```

### 8. Use Matchers Apropriados

```typescript
// ❌ Evite comparações genéricas
expect(result !== null).toBe(true);
expect(list.length > 0).toBe(true);

// ✅ Use matchers específicos
expect(result).not.toBeNull();
expect(list).not.toHaveLength(0);

// ✅ Matchers úteis do Jest
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(object).toHaveProperty('key');
expect(string).toMatch(/pattern/);
```

---

## 🎯 Estratégias de Teste

### Estratégia 1: Test-Driven Development (TDD)

```typescript
// 1. Escreva o teste (Red)
describe('calculateDiscount', () => {
  it('deve aplicar 10% de desconto', () => {
    const result = calculateDiscount(100, 10);
    expect(result).toBe(90);
  });
});

// 2. Escreva o código mínimo para passar (Green)
function calculateDiscount(price: number, percentage: number): number {
  return price - (price * percentage / 100);
}

// 3. Refatore (Refactor)
function calculateDiscount(price: number, percentage: number): number {
  const discount = price * (percentage / 100);
  return price - discount;
}
```

### Estratégia 2: AAA Pattern (Arrange-Act-Assert)

```typescript
it('deve calcular total do pedido', () => {
  // Arrange - Preparar dados e mocks
  const items = [
    { price: 10, quantity: 2 },
    { price: 20, quantity: 1 }
  ];

  // Act - Executar ação
  const total = calculateOrderTotal(items);

  // Assert - Verificar resultado
  expect(total).toBe(40);
});
```

### Estratégia 3: Given-When-Then (BDD)

```typescript
describe('Order Processing', () => {
  it('should apply free shipping for orders over $100', () => {
    // Given - contexto inicial
    const order = {
      items: [{ price: 120, quantity: 1 }],
      shippingCost: 10
    };

    // When - ação executada
    const finalOrder = processOrder(order);

    // Then - resultado esperado
    expect(finalOrder.shippingCost).toBe(0);
    expect(finalOrder.total).toBe(120);
  });
});
```

### Estratégia 4: Table-Driven Tests

```typescript
describe('ItemCodigoValidator', () => {
  const testCases = [
    { input: '1234567', expected: true, description: 'código válido' },
    { input: '123456', expected: false, description: 'muito curto' },
    { input: '12345678', expected: false, description: 'muito longo' },
    { input: '', expected: false, description: 'vazio' },
    { input: '  12345  ', expected: false, description: 'com espaços' },
  ];

  testCases.forEach(({ input, expected, description }) => {
    it(`deve retornar ${expected} para ${description}`, () => {
      const result = validator.isValid(input);
      expect(result).toBe(expected);
    });
  });
});
```

### Estratégia 5: Testes de Boundary (Limites)

```typescript
describe('Validação de quantidade', () => {
  // Testa valores nos limites
  const boundaries = [
    { value: 0, valid: false, reason: 'limite inferior' },
    { value: 1, valid: true, reason: 'mínimo válido' },
    { value: 999, valid: true, reason: 'máximo válido' },
    { value: 1000, valid: false, reason: 'limite superior' },
    { value: -1, valid: false, reason: 'negativo' },
  ];

  boundaries.forEach(({ value, valid, reason }) => {
    it(`${valid ? 'aceita' : 'rejeita'} ${value} (${reason})`, () => {
      if (valid) {
        expect(() => validateQuantity(value)).not.toThrow();
      } else {
        expect(() => validateQuantity(value)).toThrow();
      }
    });
  });
});
```

---

## 🔍 Debugging de Testes

### 1. Debug com VSCode

Adicione ao `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: Teste Atual",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "${fileBasenameNoExtension}",
        "--runInBand",
        "--no-cache"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: Todos",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--no-cache"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 2. Debug com console.log

```typescript
it('deve processar dados', () => {
  const input = { value: 10 };

  console.log('Input:', input);

  const result = process(input);

  console.log('Result:', result);

  expect(result.value).toBe(20);
});
```

### 3. Usar test.only() para isolar teste

```typescript
// Roda apenas este teste
test.only('deve funcionar', () => {
  expect(true).toBe(true);
});

// Estes não rodam
test('outro teste', () => {
  expect(true).toBe(true);
});
```

### 4. Usar test.skip() para pular teste

```typescript
// Pula este teste temporariamente
test.skip('teste com problema', () => {
  // Código com bug
});

test('teste normal', () => {
  expect(true).toBe(true);
});
```

### 5. Aumentar timeout para debug

```typescript
it('teste lento para debugar', async () => {
  // Aumenta timeout para 60s
  jest.setTimeout(60000);

  const result = await slowOperation();

  expect(result).toBeTruthy();
}, 60000); // Ou definir timeout aqui
```

---

## 🛠 Troubleshooting

### Erro: "Cannot find module '@shared/...'"

**Causa:** Paths do TypeScript não configurados no Jest

**Solução:** Verificar `jest.config.ts`:

```typescript
moduleNameMapper: {
  '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  '^@api/(.*)$': '<rootDir>/src/api/$1',
  '^@config/(.*)$': '<rootDir>/src/config/$1',
  '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
}
```

### Erro: "Timeout of 10000ms exceeded"

**Causa:** Teste demora mais que o timeout padrão (10s)

**Solução 1:** Aumentar timeout globalmente em `jest.config.ts`:
```typescript
testTimeout: 30000, // 30 segundos
```

**Solução 2:** Aumentar timeout em teste específico:
```typescript
it('teste lento', async () => {
  // código do teste
}, 30000); // 30s timeout
```

**Solução 3:** Aumentar timeout em describe:
```typescript
describe('Testes lentos', () => {
  beforeAll(() => {
    jest.setTimeout(30000);
  });

  it('teste 1', async () => { /* ... */ });
  it('teste 2', async () => { /* ... */ });
});
```

### Erro: "Login failed for user 'sysprogress'"

**Causa:** Configuração incorreta do `.env.test`

**Solução:** Verificar formato da senha:

```env
# ❌ ERRADO - # é interpretado como comentário
DB_PASSWORD=sysprogress

# ❌ ERRADO - Aspas duplas são incluídas na senha
DB_PASSWORD="sysprogress"

# ✅ CORRETO - Aspas simples
DB_PASSWORD='sysprogress'
```

### Erro: "Cannot read property 'query' of undefined"

**Causa:** DatabaseManager não foi mockado ou inicializado

**Solução para testes unitários:**
```typescript
jest.mock('@infrastructure/database/DatabaseManager');

beforeEach(() => {
  (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([
    { itemCodigo: '7530110' }
  ]);
});
```

**Solução para testes de integração:**
```typescript
beforeAll(async () => {
  await DatabaseManager.initialize();
});

afterAll(async () => {
  await DatabaseManager.close();
});
```

### Testes de Integração Usando Mock

**Causa:** Banco de dados não está acessível

**Solução:** Verificar conectividade:

```bash
# Testar conexão manual
sqlcmd -S "10.105.0.4\LOREN" -U sysprogress -P 'sysprogress'
```

**Diagnosticar:**
- Verificar rede e VPN
- Verificar firewall
- Verificar credenciais
- Ver logs em `logs/error.log`

### Jest Caching Issues

**Causa:** Cache antigo causando comportamento inconsistente

**Solução:**
```bash
# Limpar cache do Jest
npm test -- --clearCache

# Remover diretório de cache
rm -rf .jest-cache

# Rodar testes sem cache
npm test -- --no-cache
```

### Erro: "ReferenceError: TextEncoder is not defined"

**Causa:** Node.js < 18 não tem TextEncoder global

**Solução:** Adicionar polyfill em `tests/setup.ts`:
```typescript
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
```

### Erro: "TypeError: Cannot read property 'mockResolvedValue' of undefined"

**Causa:** Mock não foi aplicado antes do uso

**Solução:**
```typescript
// ❌ ERRADO - mock depois do import
import { service } from './service';
jest.mock('./dependency');

// ✅ CORRETO - mock antes do import
jest.mock('./dependency');
import { service } from './service';
```

### Testes Flaky (Instáveis)

**Causa:** Dependência de timing, ordem de execução ou estado compartilhado

**Soluções:**
1. Isolar estado com `beforeEach()` e `afterEach()`
2. Evitar timeouts fixos, usar polling
3. Mockar APIs externas
4. Evitar datas/timestamps hardcoded

```typescript
// ❌ Flaky - depende do horário
it('deve expirar token', () => {
  const token = createToken(Date.now() + 1000);
  expect(isExpired(token)).toBe(false);

  setTimeout(() => {
    expect(isExpired(token)).toBe(true);
  }, 1100);
});

// ✅ Estável - controla o tempo
it('deve expirar token', () => {
  jest.useFakeTimers();

  const token = createToken(Date.now() + 1000);
  expect(isExpired(token)).toBe(false);

  jest.advanceTimersByTime(1100);
  expect(isExpired(token)).toBe(true);

  jest.useRealTimers();
});
```

---

## ⚡ Performance de Testes

### Diagnóstico de Lentidão

```bash
# Ver quanto tempo cada teste levou
npm test -- --verbose

# Mostrar os 10 testes mais lentos
npm test -- --listTests | head -10
```

### Otimizações

#### 1. Rodar Testes em Paralelo

```typescript
// jest.config.ts
{
  maxWorkers: '50%', // Usa 50% dos cores da CPU
}
```

#### 2. Usar --runInBand para Debugging

```bash
# Roda testes sequencialmente (mais lento, mas útil para debug)
npm test -- --runInBand
```

#### 3. Mockar Operações Lentas

```typescript
// ❌ Lento - faz requisição real
it('deve buscar dados', async () => {
  const data = await fetchFromAPI();
  expect(data).toBeTruthy();
});

// ✅ Rápido - usa mock
it('deve buscar dados', async () => {
  fetchFromAPI.mockResolvedValue({ data: 'test' });
  const data = await fetchFromAPI();
  expect(data).toBeTruthy();
});
```

#### 4. Agrupar Setup Pesado em beforeAll

```typescript
// ❌ Lento - reconecta a cada teste
describe('Database tests', () => {
  beforeEach(async () => {
    await db.connect(); // Lento!
  });

  it('test 1', async () => { /* ... */ });
  it('test 2', async () => { /* ... */ });
});

// ✅ Rápido - conecta uma vez
describe('Database tests', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  it('test 1', async () => { /* ... */ });
  it('test 2', async () => { /* ... */ });
});
```

### Métricas de Performance

| Tipo de Teste | Tempo Esperado | Limite Aceitável |
|---------------|----------------|------------------|
| Unit Test | < 100ms | < 500ms |
| Integration Test | < 2s | < 5s |
| E2E Test | < 3s | < 10s |
| Mutation Test | 5-15 min | < 30 min |

---

## 🔄 Integração Contínua

### GitHub Actions

Crie `.github/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DB_SERVER: ${{ secrets.DB_SERVER }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Run mutation tests
        run: npm run test:mutation
        if: github.event_name == 'pull_request'
```

### GitLab CI

Crie `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - coverage
  - mutation

variables:
  NODE_VERSION: "18"

before_script:
  - npm ci

test:unit:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm run test:unit
  artifacts:
    reports:
      junit: junit.xml

test:integration:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm run test:integration
  only:
    - main
    - develop

coverage:
  stage: coverage
  image: node:${NODE_VERSION}
  script:
    - npm run test:coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    paths:
      - coverage/

mutation:
  stage: mutation
  image: node:${NODE_VERSION}
  script:
    - npm run test:mutation:ci
  only:
    - merge_requests
  when: manual
```

### Pre-commit Hook

Adicione ao `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit && npm run lint"
    }
  }
}
```

Ou crie `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run test:unit
npm run lint
```

---

## 📊 Verificando Fonte de Dados

Os testes de integração mostram se estão usando banco real ou mock:

```bash
npm run test:integration
```

**Output esperado com banco real:**
```
🔗 Banco: REAL
📦 Item de teste: 7530110
✅ Usando banco REAL - Testes de integração completos
```

**Output com banco offline:**
```
🔗 Banco: MOCK
⚠️  Usando MOCK - Testes de integração limitados
```

---

## 📈 Próximos Passos

Roadmap de melhorias de testes:

### Fase 1: Consolidação (Atual)
- [x] Estrutura de testes definida
- [x] Testes unitários básicos
- [x] Setup de integração
- [x] Documentação completa
- [ ] Aumentar cobertura para 80%+

### Fase 2: Automação
- [ ] CI/CD com GitHub Actions
- [ ] Pre-commit hooks
- [ ] Testes de performance automatizados
- [ ] Relatórios de coverage automáticos

### Fase 3: Qualidade Avançada
- [ ] **Mutation Testing** com Stryker (ver [MUTATION_TESTING.md](./MUTATION_TESTING.md))
- [ ] **Testes de Carga** com k6
- [ ] **Testes de Segurança** com OWASP ZAP
- [ ] **Contract Testing** com Pact

### Fase 4: Monitoramento
- [ ] Dashboards de métricas de teste
- [ ] Alertas de degradação de qualidade
- [ ] Relatórios semanais automatizados
- [ ] Integração com Prometheus/Grafana

---

## 🎯 Checklist de Qualidade

Use este checklist antes de fazer merge:

### Testes
- [ ] Todos os testes unitários passando (`npm run test:unit`)
- [ ] Testes de integração passando com banco real (`npm run test:integration`)
- [ ] Testes E2E passando (`npm run test:e2e`)
- [ ] Coverage > 70% (`npm run test:coverage`)
- [ ] Mutation score > 80% (se aplicável)

### Código
- [ ] Sem warnings do linter (`npm run lint`)
- [ ] Sem erros do TypeScript (`npm run build`)
- [ ] Sem console.log ou debug code
- [ ] Código formatado (`npm run format`)

### Documentação
- [ ] README atualizado (se necessário)
- [ ] JSDoc atualizado
- [ ] CHANGELOG atualizado
- [ ] Testes documentam comportamento esperado

### Performance
- [ ] Endpoints respondem < 3s
- [ ] Queries otimizadas
- [ ] Cache implementado onde apropriado
- [ ] Sem memory leaks

### Segurança
- [ ] Validação de entrada implementada
- [ ] Sem dados sensíveis em logs
- [ ] Rate limiting configurado
- [ ] CORS configurado corretamente

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Stryker Mutator](https://stryker-mutator.io/)

### Artigos Recomendados
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Mutation Testing](https://stryker-mutator.io/docs/mutation-testing-elements/introduction/)

### Documentos do Projeto
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura do sistema
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia de deploy
- [MUTATION_TESTING.md](./MUTATION_TESTING.md) - Mutation testing detalhado
- [API.md](./API.md) - Documentação da API

---

**Última atualização:** 2025-10-06
**Versão:** 2.0.0
**Mantenedor:** Projeto LOR0138

---

## 💡 Dicas Finais

1. **Escreva testes antes de corrigir bugs** - Reproduza o bug em um teste, depois corrija
2. **Mantenha testes simples e focados** - Um teste deve validar uma coisa
3. **Use nomes descritivos** - O nome do teste deve descrever o comportamento esperado
4. **Evite dependências entre testes** - Cada teste deve ser independente
5. **Prefira mocks a stubs** - Mocks são mais flexíveis e expressivos
6. **Teste comportamento, não implementação** - Não acople testes à implementação interna
7. **Mantenha testes rápidos** - Testes lentos não são executados com frequência
8. **Revise coverage regularmente** - Mas lembre-se: 100% de coverage ≠ 100% de qualidade
9. **Use mutation testing** - Para validar a qualidade dos seus testes
10. **Automatize tudo** - CI/CD, pre-commit hooks, relatórios automáticos

**Lembre-se:** Testes são código de produção. Trate-os com o mesmo cuidado e qualidade!