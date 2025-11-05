# Testes de Integração

Testes que validam a integração com serviços externos reais (Database, Redis, etc.)

## 🐳 Test Containers

Usamos **Testcontainers** para rodar serviços em containers Docker durante os testes, garantindo:
- ✅ Isolamento total
- ✅ Sem dependência de serviços locais
- ✅ Ambiente limpo para cada execução
- ✅ CI/CD friendly

### Pré-requisitos

```bash
# Docker deve estar rodando
docker --version

# Instalar dependências
npm install --save-dev testcontainers
```

## 🚀 Executando Testes

```bash
# Todos os testes de integração
npm run test:integration

# Apenas testes de Redis
npm run test:integration -- redis

# Apenas testes de Database
npm run test:integration -- database

# Com coverage
npm run test:integration:coverage

# Watch mode (útil para desenvolvimento)
npm run test:integration:watch
```

## 📝 Estrutura

```
tests/integration/
├── cache/
│   └── RedisCache.integration.test.ts
├── database/
│   └── ItemRepository.integration.test.ts
├── api/
│   └── ItemAPI.integration.test.ts
└── setup/
    └── testcontainers.setup.ts
```

## 🔧 Configuração

Os containers são configurados automaticamente via `testcontainers.setup.ts`:

- **Redis:** `redis:7-alpine` na porta aleatória
- **SQL Server:** `mssql/server:2022-latest` na porta aleatória

As variáveis de ambiente são configuradas automaticamente antes dos testes.

## 📊 Exemplo de Teste

```typescript
import { CacheManager } from '@shared/utils/cacheManager';

describe('Redis Integration', () => {
  it('deve cachear e recuperar dados', async () => {
    // Containers já estão rodando!
    await CacheManager.set('test-key', 'test-value', 60);
    const result = await CacheManager.get('test-key');

    expect(result).toBe('test-value');
  });
});
```

## ⚙️ Configuração Manual (Opcional)

Se preferir usar serviços locais ao invés de containers:

```bash
# .env.test
USE_TESTCONTAINERS=false
REDIS_HOST=localhost
REDIS_PORT=6379
DB_HOST=localhost
DB_PORT=1433
```

## 🐛 Troubleshooting

### Containers não iniciam

```bash
# Verificar se Docker está rodando
docker ps

# Limpar containers antigos
docker rm -f $(docker ps -aq)

# Limpar volumes
docker volume prune
```

### Testes timeout

```bash
# Aumentar timeout no jest.integration.config.ts
testTimeout: 60000  # 60 segundos
```

### Porta já em uso

Testcontainers usa portas aleatórias automaticamente. Se ainda houver conflito:

```bash
# Parar todos os containers
docker stop $(docker ps -aq)
```

## 📈 Performance

- **Primeira execução:** ~30-60s (download de images)
- **Execuções seguintes:** ~10-15s (images em cache)
- **CI/CD:** Similar, com cache de images

## 🔒 Segurança

- ⚠️ **NUNCA** commitar credenciais reais
- ✅ Containers são descartados após testes
- ✅ Dados são efêmeros (não persistem)
- ✅ Isolamento total entre execuções

## 📚 Recursos

- [Testcontainers Docs](https://testcontainers.com/)
- [Jest Integration Testing](https://jestjs.io/docs/testing-frameworks)
