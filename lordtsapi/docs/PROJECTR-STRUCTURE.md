# 📁 Estrutura do Projeto - LOR0138

> Guia completo da organização de diretórios e responsabilidades

---

## 🎯 Visão Geral

O projeto segue **Clean Architecture** com separação clara de responsabilidades:

```
📦 lor0138/
├── 📂 src/              # Código-fonte TypeScript
├── 📂 docs/             # Documentação
├── 📂 tests/            # Testes
├── 📂 logs/             # Logs da aplicação
├── 📂 dist/             # Build compilado
└── 📄 Arquivos config   # package.json, tsconfig.json, etc
```

---

## 📂 src/ - Código-Fonte

### Estrutura Completa

```
src/
├── api/                            # Camada de apresentação (Controllers + Routes)
│   ├── lor0138/                    # API do sistema LOR0138
│   │   └── item/
│   │       └── dadosCadastrais/
│   │           └── informacoesGerais/
│   │               ├── controller/  # Controllers
│   │               ├── service/     # Services (lógica de negócio)
│   │               ├── repository/  # Repositories (acesso a dados)
│   │               ├── routes/      # Definição de rotas
│   │               ├── validators/  # Validações Joi
│   │               └── types/       # Types TypeScript específicos
│   ├── healthCheck/                # Health check endpoints
│   ├── metrics/                    # Métricas Prometheus
│   └── admin/                      # Rotas administrativas
│
├── config/                         # Configurações da aplicação
│   ├── app.config.ts              # Config geral da app
│   ├── env.config.ts              # Leitura de variáveis de ambiente
│   ├── databaseConfig.ts          # Config geral de DB
│   ├── sqlServerConfig.ts         # Config SQL Server específico
│   ├── odbcConfig.ts              # Config ODBC
│   ├── serverConfig.ts            # Config do servidor HTTP
│   ├── swagger.config.ts          # Config Swagger/OpenAPI
│   ├── cachePresets.ts            # Presets de cache por tipo
│   └── cors.middleware.ts         # Config CORS
│
├── infrastructure/                 # Infraestrutura e integrações
│   ├── database/                  # Gerenciamento de banco de dados
│   │   ├── DatabaseManager.ts     # Singleton de gestão de conexões
│   │   ├── connections/
│   │   │   ├── SqlServerConnection.ts
│   │   │   ├── OdbcConnection.ts
│   │   │   └── MockConnection.ts
│   │   ├── config/
│   │   │   ├── sqlServerConfig.ts
│   │   │   └── odbcConfig.ts
│   │   └── types/
│   │       └── index.ts           # Interfaces de conexão
│   │
│   └── metrics/                   # Sistema de métricas
│       ├── MetricsManager.ts      # Gerenciador Prometheus
│       ├── helpers/
│       │   └── databaseMetrics.ts # Helper de métricas DB
│       └── types/
│           └── index.ts           # Types de métricas
│
├── shared/                        # Código compartilhado
│   ├── errors/                    # Hierarquia de erros
│   │   ├── AppError.ts           # Classe base
│   │   ├── CustomErrors.ts       # Erros específicos
│   │   └── index.ts              # Exports
│   │
│   ├── middlewares/              # Middlewares Express
│   │   ├── correlationId.middleware.ts
│   │   ├── timeout.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   ├── cache.middleware.ts
│   │   ├── metrics.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   ├── requestLogger.middleware.ts
│   │   ├── helmet.middleware.ts
│   │   ├── compression.middleware.ts
│   │   ├── apiKeyAuth.middleware.ts
│   │   └── userRateLimit.middleware.ts
│   │
│   ├── services/                 # Serviços compartilhados
│   │   └── ApiKeyService.ts     # Gestão de API Keys
│   │
│   ├── types/                    # Types TypeScript globais
│   │   ├── express/
│   │   │   └── index.d.ts       # Extensões do Express
│   │   ├── metrics.types.ts
│   │   └── apiKey.types.ts
│   │
│   └── utils/                    # Utilitários
│       ├── logger.ts             # Winston logger
│       ├── configValidator.ts    # Validação de config
│       ├── cacheManager.ts       # Gestão de cache
│       ├── gracefulShutdown.ts   # Shutdown gracioso
│       ├── retry.ts              # Retry com backoff
│       ├── UserRateLimiter.ts    # Rate limiter
│       └── cache/                # Adaptadores de cache
│           ├── CacheAdapter.ts
│           ├── MemoryCacheAdapter.ts
│           ├── RedisCacheAdapter.ts
│           └── LayeredCacheAdapter.ts
│
├── app.ts                        # Configuração do Express
└── server.ts                     # Entry point da aplicação
```

---

## 📖 Responsabilidades por Camada

### 🎨 API Layer (`src/api/`)

**Responsabilidade**: Receber requests, validar input, retornar responses

**Componentes**:

#### Controllers
```typescript
// api/lor0138/item/.../informacoesGerais/controller/informacoesGerais.controller.ts
export class InformacoesGeraisController {
  async getByItemCodigo(req: Request, res: Response, next: NextFunction) {
    // 1. Extrair parâmetros
    // 2. Chamar service
    // 3. Retornar response
  }
}
```

**Não deve**:
- ❌ Conter lógica de negócio
- ❌ Acessar banco de dados diretamente
- ❌ Fazer transformações complexas

**Deve**:
- ✅ Validar input (delegando para validators)
- ✅ Chamar services
- ✅ Formatar responses HTTP
- ✅ Tratar erros (delegando para errorHandler)

#### Services
```typescript
// api/lor0138/item/.../informacoesGerais/service/informacoesGerais.service.ts
export class InformacoesGeraisService {
  async getByItemCodigo(itemCodigo: string): Promise<ItemInformacoesGerais> {
    // 1. Lógica de negócio
    // 2. Chamar repositories
    // 3. Transformar dados
    // 4. Aplicar regras de negócio
  }
}
```

**Responsabilidades**:
- ✅ Lógica de negócio
- ✅ Orquestração de repositories
- ✅ Transformação de dados
- ✅ Aplicação de regras
- ✅ Cache (quando apropriado)

#### Repositories
```typescript
// api/lor0138/item/.../informacoesGerais/repository/informacoesGerais.repository.ts
export class InformacoesGeraisRepository {
  async findByItemCodigo(itemCodigo: string): Promise<ItemMasterQueryResult> {
    // 1. Construir query SQL
    // 2. Executar via DatabaseManager
    // 3. Retornar dados brutos
  }
}
```

**Responsabilidades**:
- ✅ Acesso a dados
- ✅ Construção de queries
- ✅ Mapeamento banco → objetos
- ✅ Tratamento de erros de DB

#### Routes
```typescript
// api/lor0138/item/.../informacoesGerais/routes/informacoesGerais.routes.ts
router.get(
  '/:itemCodigo',
  validateItemCodigo,
  asyncHandler(controller.getByItemCodigo)
);
```

**Responsabilidades**:
- ✅ Definição de rotas
- ✅ Aplicação de middlewares
- ✅ Documentação Swagger
- ✅ Binding de validadores

#### Validators
```typescript
// api/lor0138/item/.../informacoesGerais/validators/informacoesGerais.validators.ts
export const validateItemCodigo = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    itemCodigo: Joi.string().min(1).max(16).required()
  });
  // Validar e retornar erro se inválido
};
```

**Responsabilidades**:
- ✅ Validação de input
- ✅ Schemas Joi
- ✅ Mensagens de erro claras

---

### ⚙️ Config Layer (`src/config/`)

**Responsabilidade**: Centralizar e validar configurações

**Arquivos principais**:

- `env.config.ts`: Lê `.env` e exporta config tipado
- `app.config.ts`: Configurações gerais da aplicação
- `sqlServerConfig.ts`: Config SQL Server (usado pelo DatabaseManager)
- `swagger.config.ts`: Especificação OpenAPI

**Padrão**:
```typescript
// config/env.config.ts
export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  database: {
    type: process.env.DB_CONNECTION_TYPE || 'sqlserver',
    // ...
  }
};
```

---

### 🏗️ Infrastructure Layer (`src/infrastructure/`)

**Responsabilidade**: Integração com recursos externos

#### Database

**DatabaseManager.ts**: Singleton que gerencia pools de conexão

```typescript
export class DatabaseManager {
  private static connectionEmp: IConnection;
  private static connectionMult: IConnection;

  static async initialize() { /* ... */ }
  static async queryEmp(sql: string) { /* ... */ }
  static async queryMult(sql: string) { /* ... */ }
}
```

**Connections**: Implementações específicas
- `SqlServerConnection`: Via mssql
- `OdbcConnection`: Via odbc
- `MockConnection`: Dados fake para desenvolvimento

#### Metrics

**MetricsManager**: Centraliza métricas Prometheus

```typescript
export class MetricsManager {
  public httpRequestsTotal: Counter;
  public dbQueriesTotal: Counter;
  // ...
}
```

---

### 🔧 Shared Layer (`src/shared/`)

**Responsabilidade**: Código reutilizável entre módulos

#### Errors

Hierarquia de erros customizados:

```typescript
AppError (base)
├── ItemNotFoundError
├── DatabaseError
├── ValidationError
├── RateLimitError
└── ...
```

#### Middlewares

Middlewares Express reutilizáveis:

- **correlationId**: Adiciona ID único a requests
- **timeout**: Controle de timeout
- **errorHandler**: Tratamento centralizado de erros
- **cache**: Cache automático de responses
- **metrics**: Coleta de métricas

#### Utils

Utilitários gerais:

- **logger**: Winston configurado
- **cacheManager**: Gestão de cache (L1 + L2)
- **gracefulShutdown**: Shutdown ordenado
- **retry**: Retry com backoff

---

## 📄 Arquivos Raiz

### app.ts

**Responsabilidade**: Configuração do Express

```typescript
export class App {
  private app: Express;

  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandlers();
  }
}
```

### server.ts

**Responsabilidade**: Entry point, inicialização

```typescript
async function start() {
  await DatabaseManager.initialize();
  const app = new App().getApp();
  const server = app.listen(PORT);
  setupGracefulShutdown(server);
}
```

---

## 📂 tests/ - Testes

```
tests/
├── unit/                    # Testes unitários
│   ├── services/
│   ├── repositories/
│   └── utils/
├── integration/             # Testes de integração
│   └── api/
├── load/                    # Testes de carga (k6)
│   ├── smoke.test.js
│   ├── load.test.js
│   └── spike.test.js
└── helpers/                 # Helpers de teste
    └── database.helper.ts
```

---

## 📂 docs/ - Documentação

```
docs/
├── README.md                # Índice da documentação
├── ARCHITECTURE.md          # Arquitetura do sistema
├── SETUP.md                 # Setup do ambiente
├── PROJECT-STRUCTURE.md     # Este arquivo
├── API.md                   # Documentação da API
├── CHANGELOG.md             # Histórico de mudanças
├── *-GUIDE.md              # Guias específicos
└── CHECKLIST_*.md          # Checklists
```

---

## 🎨 Convenções de Código

### Nomenclatura

- **Arquivos**: `camelCase.ts` (ex: `informacoesGerais.controller.ts`)
- **Classes**: `PascalCase` (ex: `DatabaseManager`)
- **Funções**: `camelCase` (ex: `getByItemCodigo`)
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `DEFAULT_TIMEOUT`)
- **Interfaces**: `PascalCase` sem prefixo I (ex: `CacheAdapter`)
- **Types**: `PascalCase` (ex: `UserTier`)

### Estrutura de Arquivo

```typescript
// 1. Imports
import { Express } from 'express';
import { log } from '@shared/utils/logger';

// 2. Types e Interfaces
interface Config {
  // ...
}

// 3. Constantes
const DEFAULT_PORT = 3000;

// 4. Classe/Função Principal
export class MyClass {
  // ...
}

// 5. Helpers (se necessário)
function helperFunction() {
  // ...
}
```

### Path Aliases

Configurados em `tsconfig.json`:

```typescript
// Ao invés de:
import { log } from '../../../shared/utils/logger';

// Use:
import { log } from '@shared/utils/logger';
```

**Aliases disponíveis**:
- `@api/*` → `src/api/*`
- `@config/*` → `src/config/*`
- `@infrastructure/*` → `src/infrastructure/*`
- `@shared/*` → `src/shared/*`

---

## 🔄 Fluxo de uma Requisição

```
1. Request HTTP
   ↓
2. Middlewares globais (app.ts)
   - correlationId
   - requestLogger
   - timeout
   - compression
   - helmet
   ↓
3. Route specific middlewares
   - apiKeyAuth
   - userRateLimit
   - cache
   - validators
   ↓
4. Controller
   - Extrai parâmetros
   - Chama service
   ↓
5. Service
   - Lógica de negócio
   - Chama repositories
   ↓
6. Repository
   - Constrói query
   - Executa via DatabaseManager
   ↓
7. DatabaseManager
   - Gerencia pool
   - Executa query
   - Coleta métricas
   ↓
8. Response
   - Formatado pelo controller
   - Passa por middlewares de response
   - Retorna ao cliente
```

---

## 📊 Diagrama de Dependências

```
server.ts
  └── app.ts
       ├── config/*
       ├── infrastructure/
       │    ├── database/
       │    └── metrics/
       ├── shared/
       │    ├── middlewares/
       │    ├── utils/
       │    └── errors/
       └── api/
            └── lor0138/
                 └── controller
                      └── service
                           └── repository
                                └── DatabaseManager
```

---

## 🔗 Ver Também

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detalhes de arquitetura
- [API.md](./API.md) - Documentação da API
- [SETUP.md](./SETUP.md) - Como configurar
- [TESTING.md](./TESTING.md) - Como testar

---

**Última Atualização**: 2025-01-06
**Mantenedor**: Equipe LOR0138