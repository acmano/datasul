# 🧪 Guia de Testes - lor0138

## 📋 Índice

- [Tipos de Testes](#tipos-de-testes)
- [Configuração](#configuração)
- [Como Rodar](#como-rodar)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)

---

## 📊 Tipos de Testes

### 1. Testes Unitários
- **O que testam:** Funções e classes isoladas (validators, services, repositories)
- **Mock:** Sim, todas as dependências são mockadas
- **Velocidade:** Muito rápido (< 1s por teste)
- **Quando rodar:** Sempre, antes de commit

### 2. Testes de Integração
- **O que testam:** Comunicação entre componentes + banco de dados REAL
- **Mock:** Não, usa banco de produção (somente leitura)
- **Velocidade:** Médio (1-5s por teste)
- **Quando rodar:** Antes de deploy, depois de mudanças em queries

### 3. Testes E2E
- **O que testam:** Fluxo completo da API com mocks
- **Mock:** Sim, simula banco e serviços externos
- **Velocidade:** Rápido (1-3s por teste)
- **Quando rodar:** Antes de deploy

---

## ⚙️ Configuração

### 1. Criar `.env.test`

Copie o `.env.example` e ajuste:

```bash
cp .env.example .env.test
```

**Configurações importantes:**

```env
# Banco de produção (somente leitura)
DB_SERVER=10.105.0.4\LOREN
DB_USER=dcloren
DB_PASSWORD='#dcloren#'
DB_DATABASE_EMP=
DB_DATABASE_MULT=

# Cache desabilitado
CACHE_ENABLED=false

# Logs silenciosos
LOG_LEVEL=error
```

### 2. Instalar Dependências

```bash
npm install
```

---

## 🚀 Como Rodar

### Rodar Todos os Testes Unitários

```bash
npm run test:unit
```

### Rodar Testes de Integração (Banco Real)

```bash
npm run test:integration
```

**⚠️ IMPORTANTE:** 
- Usa banco de **PRODUÇÃO** (somente leitura)
- Se banco offline, usa MOCK automaticamente
- Não escreve nada no banco

### Rodar Testes E2E

```bash
npm run test:e2e
```

### Rodar Tudo

```bash
npm run test:all
```

### Modo Watch (desenvolvimento)

```bash
npm run test:unit:watch          # Unitários
npm run test:integration:watch   # Integração
npm run test:e2e:watch           # E2E
```

### Coverage (cobertura)

```bash
npm run test:coverage
```

---

## 📂 Estrutura de Arquivos

```
tests/
├── unit/                           # Testes unitários
│   ├── validators/
│   ├── services/
│   └── repositories/
│
├── integration/                    # Testes de integração (BANCO REAL)
│   ├── api/
│   │   └── informacoesGerais.integration.test.ts
│   └── controllers/
│
├── e2e/                           # Testes E2E (MOCK)
│   └── api/
│       └── informacoesGerais.e2e.test.ts
│
├── helpers/                       # Utilitários
│   └── database.helper.ts         # Helper para banco de teste
│
├── factories/                     # Factories de dados
│   └── item.factory.ts
│
├── mocks/                         # Mocks
│   └── DatabaseManager.mock.ts
│
├── setup.ts                       # Setup global (unitários/E2E)
└── setup.integration.ts           # Setup para integração
```

---

## ✅ Boas Práticas

### 1. Isolamento de Testes

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Limpa mocks entre testes
});
```

### 2. Usar Factories para Dados

```typescript
import { createInformacoesGerais } from '../../factories/item.factory';

const mockData = createInformacoesGerais();
```

### 3. Testar Casos de Erro

```typescript
it('deve lançar erro se item não existe', async () => {
  expect(async () => {
    await service.buscar('INEXISTENTE');
  }).rejects.toThrow(ItemNotFoundError);
});
```

### 4. Validar Performance

```typescript
it('deve responder em < 1s', async () => {
  const start = Date.now();
  await request(app).get('/api/item/123');
  expect(Date.now() - start).toBeLessThan(1000);
});
```

### 5. Usar Correlation ID em Testes

```typescript
const response = await request(app)
  .get('/api/item/123')
  .set('X-Correlation-ID', 'test-123');

expect(response.headers['x-correlation-id']).toBe('test-123');
```

---

## 🔍 Verificando Fonte de Dados

Os testes de integração mostram se estão usando banco real ou mock:

```bash
npm run test:integration

# Output esperado:
# 🔗 Banco: REAL
# 📦 Item de teste: 7530110
# ✅ Usando banco REAL - Testes de integração completos
```

Se banco offline:

```bash
# 🔗 Banco: MOCK
# ⚠️  Usando MOCK - Testes de integração limitados
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '@shared/...'"

**Solução:** Verificar `tsconfig.json` e `jest.config.ts` paths

```json
// jest.config.ts
moduleNameMapper: {
  '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  '^@api/(.*)$': '<rootDir>/src/api/$1',
  // ...
}
```

### Erro: "Timeout of 10000ms exceeded"

**Solução:** Aumentar timeout no teste específico

```typescript
jest.setTimeout(30000); // 30 segundos
```

Ou no teste individual:

```typescript
it('teste lento', async () => {
  // ...
}, 30000); // 30s timeout
```

### Erro: "Login failed for user 'dcloren'"

**Solução:** Verificar `.env.test`

```env
# Senha DEVE ter aspas simples
DB_PASSWORD='#dcloren#'

# Database vazio
DB_DATABASE_EMP=
DB_DATABASE_MULT=
```

### Testes de Integração Usando Mock

**Causa:** Banco não está acessível

**Verificar:**

```bash
# Testar conexão manual
sqlcmd -S "10.105.0.4\LOREN" -U dcloren -P '#dcloren#'
```

**Solução:** 
- Verificar rede
- Verificar firewall
- Verificar credenciais

### Jest Caching Issues

**Solução:** Limpar cache

```bash
npm test -- --clearCache
rm -rf .jest-cache
```

---

## 📈 Próximos Passos

Depois de validar os testes de integração:

1. **FASE 2:** Testes de Carga com k6
2. **FASE 3:** Mutation Testing com Stryker

---

## 🎯 Checklist de Qualidade

- [ ] Todos os testes unitários passando (`npm run test:unit`)
- [ ] Testes de integração passando com banco real (`npm run test:integration`)
- [ ] Coverage > 70% (`npm run test:coverage`)
- [ ] Testes E2E passando (`npm run test:e2e`)
- [ ] Sem warnings ou erros no console
- [ ] Performance OK (< 3s por request)

---

**Última atualização:** 2025-01-05  
**Mantenedor:** Projeto LOR0138