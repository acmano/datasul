# Test Fixtures

Sistema completo de fixtures para facilitar a escrita de testes no projeto.

## 📚 Visão Geral

Os fixtures fornecem **builders** e **factories** para criar objetos de teste rapidamente, com valores padrão sensatos e a possibilidade de sobrescrever apenas os valores necessários.

## 🎯 Benefícios

- ✅ **Menos código boilerplate** nos testes
- ✅ **Consistência** entre testes
- ✅ **Manutenibilidade** - alterações centralizadas
- ✅ **Legibilidade** - intenção clara do teste
- ✅ **Rapidez** - escreva testes mais rápido

## 📦 Estrutura

```
tests/fixtures/
├── entities.fixtures.ts     # Builders para entidades de domínio
├── dtos.fixtures.ts          # Builders para DTOs
├── mocks.fixtures.ts         # Builders para mocks
├── database.fixtures.ts      # Builders para respostas de BD
├── index.ts                  # Export central
└── README.md                 # Este arquivo
```

## 🚀 Uso Rápido

### Importação

```typescript
// Importar tudo de uma vez
import {
  ItemBuilder,
  ItemDTOBuilder,
  MockRepositoryBuilder,
  UseCaseDependenciesBuilder,
} from '@tests/fixtures';

// Ou usar bundles pré-configurados
import { UseCaseTestBundle } from '@tests/fixtures';
```

### Criando Entidades de Domínio

```typescript
import { ItemBuilder } from '@tests/fixtures';

// Item com valores padrão
const item = ItemBuilder.build();

// Item com override de campos específicos
const item = ItemBuilder.build({
  codigo: 'CUSTOM001',
  descricao: 'DESCRIÇÃO CUSTOMIZADA',
});

// Item pré-configurado
const torneira = ItemBuilder.buildTorneira();
const itemInativo = ItemBuilder.buildInativo();

// Múltiplos items
const items = ItemBuilder.buildMany(10);
```

### Criando DTOs

```typescript
import {
  ItemDTOBuilder,
  PaginatedResponseBuilder,
  SearchItemsRequestBuilder,
} from '@tests/fixtures';

// DTO básico
const dto = ItemDTOBuilder.build();

// Request de busca
const searchRequest = SearchItemsRequestBuilder.buildGeneralSearch('torneira');

// Resposta paginada
const response = PaginatedResponseBuilder.buildItemsResponse(50, 1, 20);
```

### Criando Mocks

```typescript
import {
  MockRepositoryBuilder,
  MockInfrastructureBuilder,
  UseCaseDependenciesBuilder,
} from '@tests/fixtures';

// Mock de repositório
const mockRepo = MockRepositoryBuilder.buildItemRepository();

// Mock de logger que captura mensagens
const mockLogger = MockInfrastructureBuilder.buildCapturingLogger();

// Mock de cache realista
const mockCache = MockInfrastructureBuilder.buildRealisticCache();

// Todas as dependências de um Use Case
const deps = UseCaseDependenciesBuilder.build();

// Dependências com cache miss
const deps = UseCaseDependenciesBuilder.buildWithCacheMiss();
```

## 📖 Guia Detalhado

### 1. Domain Entities Builders

#### ItemBuilder

```typescript
// Básico
ItemBuilder.build();
ItemBuilder.build({ codigo: 'ABC123' });

// Pré-configurados
ItemBuilder.buildAtivo();
ItemBuilder.buildInativo();
ItemBuilder.buildComObservacao('Observação importante');
ItemBuilder.buildTorneira(); // Item típico de metais sanitários
ItemBuilder.buildCimento(); // Item típico de construção

// Múltiplos
ItemBuilder.buildMany(10);
ItemBuilder.buildMany(5, { unidade: 'KG' });
```

#### FamiliaBuilder, GrupoEstoqueBuilder, etc.

```typescript
FamiliaBuilder.build();
FamiliaBuilder.buildMetais();
FamiliaBuilder.buildFerramentas();

GrupoEstoqueBuilder.build();
GrupoEstoqueBuilder.buildMateriais();

EstabelecimentoBuilder.buildMatriz();
EstabelecimentoBuilder.buildFilial(2);
```

#### Entity Scenarios

```typescript
import { EntityScenarios } from '@tests/fixtures';

// Item completo com todas as relações
const { item, familia, grupoEstoque, estabelecimentos } =
  EntityScenarios.itemCompleto();

// Catálogo de produtos
const { items, familias, grupos } = EntityScenarios.catalogo(10);
```

### 2. DTO Builders

#### Pagination

```typescript
// Primeira página
PaginationDTOBuilder.buildFirstPage(100, 20);

// Última página
PaginationDTOBuilder.buildLastPage(100, 20);

// Página específica
PaginationDTOBuilder.buildMiddlePage(100, 3, 20);

// Vazio
PaginationDTOBuilder.buildEmpty();
```

#### Paginated Response

```typescript
// Resposta com items
PaginatedResponseBuilder.buildItemsResponse(50, 1, 20);

// Resposta vazia
PaginatedResponseBuilder.buildEmpty();

// Resposta customizada
const items = ItemDTOBuilder.buildMany(10);
const pagination = PaginationDTOBuilder.buildFirstPage(100);
PaginatedResponseBuilder.build(items, pagination);
```

#### Validation Errors

```typescript
ValidationErrorBuilder.buildRequired('codigo');
ValidationErrorBuilder.buildMinLength('descricao', 3);
ValidationErrorBuilder.buildMaxLength('codigo', 16);
ValidationErrorBuilder.buildPattern('email');

// Múltiplos erros
ValidationErrorBuilder.buildMany([
  { field: 'codigo', message: 'Código obrigatório', code: 'REQUIRED' },
  { field: 'descricao', message: 'Descrição obrigatória', code: 'REQUIRED' },
]);
```

#### API Response

```typescript
// Success
ApiResponseBuilder.buildSuccess(data, 'corr-123');

// Error
ApiResponseBuilder.buildError('Erro interno', 'INTERNAL_ERROR');

// Validation Error
ApiResponseBuilder.buildValidationError(errors, 'corr-123');

// Not Found
ApiResponseBuilder.buildNotFound('Item', '7530110', 'corr-123');
```

### 3. Mock Builders

#### Repository Mocks

```typescript
// Mock básico
const mockRepo = MockRepositoryBuilder.buildItemRepository();

// Mock que sempre retorna sucesso
const mockRepo = MockRepositoryBuilder.buildSuccessRepository(item);

// Mock que sempre retorna null
const mockRepo = MockRepositoryBuilder.buildEmptyRepository();

// Mock que sempre lança erro
const mockRepo = MockRepositoryBuilder.buildErrorRepository(
  new Error('Database error')
);
```

#### Infrastructure Mocks

```typescript
// Logger básico
const logger = MockInfrastructureBuilder.buildLogger();

// Logger que captura todas as mensagens
const logger = MockInfrastructureBuilder.buildCapturingLogger();
console.log(logger.messages); // [{ level: 'info', message: '...', meta: {...} }]

// Cache com hit
const cache = MockInfrastructureBuilder.buildHitCache(cachedValue);

// Cache com miss
const cache = MockInfrastructureBuilder.buildMissCache();

// Cache realista (com Map interna)
const cache = MockInfrastructureBuilder.buildRealisticCache();
await cache.set('key', 'value');
const value = await cache.get('key');

// Métricas que capturam valores
const metrics = MockInfrastructureBuilder.buildCapturingMetrics();
metrics.incrementCounter('test', 5);
console.log(metrics.counters.get('test')); // 5
```

#### Use Case Dependencies

```typescript
// Todas as dependências
const { repository, logger, cache, metrics } =
  UseCaseDependenciesBuilder.build();

// Com cache miss
const deps = UseCaseDependenciesBuilder.buildWithCacheMiss();

// Com cache hit
const deps = UseCaseDependenciesBuilder.buildWithCacheHit(cachedItem);

// Com erro
const deps = UseCaseDependenciesBuilder.buildWithError(
  new Error('Database error')
);

// Com overrides
const deps = UseCaseDependenciesBuilder.build({
  logger: myCustomLogger,
});
```

### 4. Database Fixtures

#### Raw Database Responses

```typescript
// Item row do banco
const row = DatabaseItemBuilder.build();
const row = DatabaseItemBuilder.buildTorneira();
const row = DatabaseItemBuilder.buildInativo();
const rows = DatabaseItemBuilder.buildMany(10);

// Familia row
const familiaRow = DatabaseFamiliaBuilder.buildMetais();

// Query Result
const result = QueryResultBuilder.build(rows);
const result = QueryResultBuilder.buildSingle(row);
const result = QueryResultBuilder.buildEmpty();
```

#### Database Scenarios

```typescript
// Item completo com relações
const { item, familia, grupoEstoque } = DatabaseScenarios.itemCompletoRaw();

// Query com múltiplos items
const result = DatabaseScenarios.queryMultiplosItems(10);

// Query com item único
const result = DatabaseScenarios.queryItemUnico('7530110');

// Query vazia
const result = DatabaseScenarios.queryItemNaoEncontrado();

// Erros
const error = DatabaseScenarios.erroConexao();
const error = DatabaseScenarios.erroTimeout();
const error = DatabaseScenarios.erroSintaxeSQL();
```

#### SQL Parameters

```typescript
const param = SqlParameterBuilder.buildVarchar('codigo', 'ABC123');
const param = SqlParameterBuilder.buildInt('quantidade', 10);
const param = SqlParameterBuilder.buildBoolean('ativo', true);

const params = SqlParameterBuilder.buildMany([
  { name: 'codigo', type: 'varchar', value: 'ABC123' },
  { name: 'ativo', type: 'bit', value: true },
]);
```

## 🎁 Bundles

### UseCaseTestBundle

Tudo que você precisa para testar Use Cases:

```typescript
import { UseCaseTestBundle } from '@tests/fixtures';

const { item, repository, infrastructure, dependencies, scenarios } =
  UseCaseTestBundle;

// Usar
const testItem = item.build();
const mockRepo = repository.buildItemRepository();
const deps = dependencies.build();
```

### RepositoryTestBundle

Tudo para testar Repositories:

```typescript
import { RepositoryTestBundle } from '@tests/fixtures';

const { dbItem, queryResult, scenarios, logger } = RepositoryTestBundle;

// Usar
const row = dbItem.buildTorneira();
const result = queryResult.buildSingle(row);
```

### ControllerTestBundle

Tudo para testar Controllers:

```typescript
import { ControllerTestBundle } from '@tests/fixtures';

const { itemDTO, createDTO, pagination, apiResponse } = ControllerTestBundle;

// Usar
const dto = itemDTO.build();
const response = apiResponse.buildSuccess(dto);
```

## 🛠️ Utilities

### Mock Helpers

```typescript
import { clearAllMocks, resetAllMocks, expectMocksCalled } from '@tests/fixtures';

// Limpar todos os mocks
clearAllMocks({ mockRepo, mockLogger, mockCache });

// Reset todos os mocks
resetAllMocks({ mockRepo, mockLogger });

// Verificar múltiplos mocks foram chamados
expectMocksCalled(mockRepo.findByCodigo, mockLogger.info);

// Verificar múltiplos mocks NÃO foram chamados
expectMocksNotCalled(mockRepo.delete, mockRepo.update);
```

### Test Utilities

```typescript
import { nextTick, wait, generateTestId, spyConsole, dateHelpers } from '@tests/fixtures';

// Aguardar próximo tick
await nextTick();

// Aguardar tempo específico
await wait(1000);

// Gerar IDs únicos
const id = generateTestId(); // TEST-1234567890-abc123
const corrId = generateCorrelationId(); // corr-1234567890-xyz789

// Capturar console
const consoleSpy = spyConsole();
console.log('test');
console.error('error');
expect(consoleSpy.logs).toContain('test');
expect(consoleSpy.errors).toContain('error');
consoleSpy.restore();

// Congelar tempo
const restore = dateHelpers.freezeTime(new Date('2024-01-01'));
// ... testes ...
restore();
```

## 📝 Exemplos Completos

### Teste de Use Case

```typescript
import {
  UseCaseDependenciesBuilder,
  ItemBuilder,
  PaginatedResponseBuilder,
} from '@tests/fixtures';

describe('SearchItemsUseCase', () => {
  it('deve buscar items com sucesso', async () => {
    // Arrange
    const deps = UseCaseDependenciesBuilder.buildWithCacheMiss();
    const mockResult = PaginatedResponseBuilder.buildItemsResponse(10);

    deps.repository.search.mockResolvedValue(mockResult);

    const useCase = new SearchItemsUseCase(
      deps.repository,
      deps.logger,
      deps.cache
    );

    // Act
    const result = await useCase.execute({ search: 'torneira' });

    // Assert
    expect(result.data).toHaveLength(10);
    expect(deps.repository.search).toHaveBeenCalledWith(
      'torneira',
      expect.any(Object)
    );
  });
});
```

### Teste de Repository

```typescript
import {
  DatabaseItemBuilder,
  QueryResultBuilder,
  MockDatabaseConnectionBuilder,
} from '@tests/fixtures';

describe('ItemRepository', () => {
  it('deve buscar item por código', async () => {
    // Arrange
    const row = DatabaseItemBuilder.buildTorneira();
    const queryResult = QueryResultBuilder.buildSingle(row);
    const mockConnection = MockDatabaseConnectionBuilder.buildWithResult(queryResult);

    const repository = new ItemRepository(mockConnection);

    // Act
    const item = await repository.findByCodigo('7530110');

    // Assert
    expect(item).toBeDefined();
    expect(item.codigoValue).toBe('7530110');
  });
});
```

## 🤝 Contribuindo

Ao adicionar novos fixtures:

1. Siga o padrão `XxxBuilder` para builders
2. Forneça métodos `build()` com overrides opcionais
3. Adicione métodos pré-configurados (`buildTorneira()`, etc.)
4. Documente com JSDoc e exemplos
5. Exporte no `index.ts`
6. Atualize este README

## 📚 Referências

- [Test Data Builders Pattern](https://www.natpryce.com/articles/000714.html)
- [Object Mother Pattern](https://martinfowler.com/bliki/ObjectMother.html)
- [Jest Mocking Guide](https://jestjs.io/docs/mock-functions)
