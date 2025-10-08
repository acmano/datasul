# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.5.0] - 2025-01-06

### 🎨 Refatoração e Documentação Completa

#### Changed
- **REFATORAÇÃO COMPLETA**: Todos os arquivos refatorados com padrão consistente
- **DOCUMENTAÇÃO JSDoc**: Todos os métodos documentados com propósito, parâmetros e retornos
- **PONTOS CRÍTICOS**: Destacados em todos os arquivos
- **EXEMPLOS PRÁTICOS**: Adicionados em todas as funções principais

#### Arquivos Refatorados (46 arquivos)

**Configuração**:
- `src/config/app.config.ts`
- `src/config/cors.middleware.ts`
- `src/config/env.config.ts`
- `src/config/databaseConfig.ts`
- `src/config/odbcConfig.ts`
- `src/config/serverConfig.ts`
- `src/config/sqlServerConfig.ts`
- `src/config/swagger.config.ts`
- `src/config/cachePresets.ts`

**Database**:
- `src/infrastructure/database/DatabaseManager.ts`
- `src/infrastructure/database/connections/MockConnection.ts`
- `src/infrastructure/database/connections/OdbcConnection.ts`
- `src/infrastructure/database/connections/SqlServerConnection.ts`
- `src/infrastructure/database/types/index.ts`

**Métricas**:
- `src/infrastructure/metrics/MetricsManager.ts`
- `src/infrastructure/metrics/helpers/databaseMetrics.ts`
- `src/infrastructure/metrics/types/index.ts`
- `src/api/metrics/routes.ts`

**Middlewares**:
- `src/shared/middlewares/errorHandler.middleware.ts`
- `src/shared/middlewares/timeout.middleware.ts`
- `src/shared/middlewares/correlationId.middleware.ts`
- `src/shared/middlewares/metrics.middleware.ts`
- `src/shared/middlewares/rateLimiter.middleware.ts`
- `src/shared/middlewares/requestLogger.middleware.ts`
- `src/shared/middlewares/helmet.middleware.ts`
- `src/shared/middlewares/compression.middleware.ts`
- `src/shared/middlewares/cache.middleware.ts`
- `src/shared/middlewares/apiKeyAuth.middleware.ts`
- `src/shared/middlewares/userRateLimit.middleware.ts`

**Erros**:
- `src/shared/errors/AppError.ts`
- `src/shared/errors/CustomErrors.ts`
- `src/shared/errors/index.ts`

**Utilitários**:
- `src/shared/utils/logger.ts`
- `src/shared/utils/configValidator.ts`
- `src/shared/utils/cacheManager.ts`
- `src/shared/utils/gracefulShutdown.ts`
- `src/shared/utils/retry.ts`
- `src/shared/utils/UserRateLimiter.ts`

**Cache**:
- `src/shared/utils/cache/CacheAdapter.ts`
- `src/shared/utils/cache/LayeredCacheAdapter.ts`
- `src/shared/utils/cache/MemoryCacheAdapter.ts`
- `src/shared/utils/cache/RedisCacheAdapter.ts`

**API - InformaçõesGerais**:
- `src/api/lor0138/item/dadosCadastrais/informacoesGerais/controller/informacoesGerais.controller.ts`
- `src/api/lor0138/item/dadosCadastrais/informacoesGerais/service/informacoesGerais.service.ts`
- `src/api/lor0138/item/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository.ts`
- `src/api/lor0138/item/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators.ts`
- `src/api/lor0138/item/dadosCadastrais/informacoesGerais/routes/informacoesGerais.routes.ts`
- `src/api/lor0138/item/dadosCadastrais/informacoesGerais/types/informacoesGerais.types.ts`

**Tipos**:
- `src/shared/types/express/index.d.ts`
- `src/shared/types/metrics.types.ts`

**Rotas**:
- `src/api/admin/routes/admin.routes.ts`
- `src/api/healthCheck/routes/healthCheck.routes.ts`
- `test-timeout.routes.ts`

**Core**:
- `src/app.ts`
- `src/server.ts`

#### Documentação Criada/Atualizada
- `docs/README.md` - Índice completo da documentação
- `docs/CHANGELOG.md` - Este arquivo
- Revisão de todos os guias existentes

---

## [1.4.0] - 2025-01-04

### ✨ Features

#### Added
- **API Key Authentication**: Sistema completo de autenticação via API Key
  - Tiers: FREE, PREMIUM, ENTERPRISE, ADMIN
  - Limites por tier configuráveis
  - Validação e gestão de keys

- **User Rate Limiting**: Rate limiting por usuário com múltiplas janelas
  - Janelas: minuto, hora, dia
  - Algoritmo sliding window
  - Estatísticas por usuário

- **Admin Routes**: Endpoints administrativos
  - Gestão de API Keys
  - Estatísticas de rate limiting
  - Reset de limites
  - Atualização de tiers

#### Files Added
- `src/shared/types/apiKey.types.ts`
- `src/shared/services/ApiKeyService.ts`
- `src/shared/utils/UserRateLimiter.ts`
- `src/shared/middlewares/apiKeyAuth.middleware.ts`
- `src/shared/middlewares/userRateLimit.middleware.ts`
- `src/api/admin/routes/admin.routes.ts`
- `docs/API_Key_Rate_Limit.md`

---

## [1.3.0] - 2025-01-03

### ✨ Features

#### Added
- **Graceful Shutdown**: Sistema completo de shutdown gracioso
  - Captura sinais: SIGTERM, SIGINT, SIGQUIT
  - Fecha servidor HTTP ordenadamente
  - Aguarda requisições ativas (máx 5s)
  - Fecha conexões de banco de dados
  - Timeout configurável (padrão 10s)
  - Callbacks customizáveis

- **Retry com Backoff**: Retry automático em operações de banco
  - Exponential backoff
  - Jitter configurável
  - Detecção de erros retryable
  - Máximo de tentativas configurável

#### Files Added
- `src/shared/utils/gracefulShutdown.ts`
- `src/shared/utils/retry.ts`
- `docs/GRACEFUL-SHUTDOWN-GUIDE.md`
- `docs/RETRY-GUIDE.md`

#### Changed
- `src/server.ts`: Integração com graceful shutdown
- `src/infrastructure/database/connections/SqlServerConnection.ts`: Uso de retry
- `src/infrastructure/database/connections/OdbcConnection.ts`: Uso de retry
- `.env`: Adicionadas variáveis de retry

---

## [1.2.0] - 2025-01-02

### ✨ Features

#### Added
- **Sistema de Cache em Camadas**:
  - L1: MemoryCacheAdapter (cache local ultra-rápido)
  - L2: RedisCacheAdapter (cache distribuído)
  - Layered: Combinação L1 + L2 com promoção automática
  - Interface CacheAdapter unificada
  - CacheManager para gestão centralizada

- **Endpoints de Gestão de Cache**:
  - `GET /cache/stats` - Estatísticas do cache
  - `GET /cache/keys` - Listar chaves
  - `POST /cache/clear` - Limpar cache
  - `DELETE /cache/invalidate/:pattern` - Invalidar por padrão

- **Cache Middleware**: Middleware HTTP para cache automático de respostas

#### Files Added
- `src/shared/utils/cache/CacheAdapter.ts`
- `src/shared/utils/cache/MemoryCacheAdapter.ts`
- `src/shared/utils/cache/RedisCacheAdapter.ts`
- `src/shared/utils/cache/LayeredCacheAdapter.ts`
- `src/shared/utils/cacheManager.ts`
- `src/shared/middlewares/cache.middleware.ts`
- `src/config/cachePresets.ts`
- `docs/CACHE-GUIDE.md`

#### Changed
- `.env`: Adicionadas variáveis de cache (CACHE_ENABLED, CACHE_STRATEGY, etc)
- `src/app.ts`: Integração com sistema de cache
- `package.json`: Adicionadas dependências node-cache e ioredis

---

## [1.1.0] - 2025-01-01

### ✨ Features

#### Added
- **Correlation ID**: Request tracing end-to-end
  - Geração automática de UUID v4
  - Aceitação de ID do cliente via headers
  - Propagação em todos os logs
  - Documentação no Swagger

- **Sistema de Métricas Prometheus**:
  - Métricas HTTP (requests, duration, in-progress)
  - Métricas de Database (queries, connections, errors)
  - Métricas de Rate Limiting
  - Métricas de Health Check
  - Endpoint `/metrics` para scraping

- **Timeouts Configuráveis**:
  - Timeout HTTP por rota
  - Timeout de conexão DB
  - Timeout de request DB
  - Timeout de health check

#### Files Added
- `src/shared/types/express/index.d.ts`
- `src/shared/middlewares/correlationId.middleware.ts`
- `src/shared/middlewares/timeout.middleware.ts`
- `src/infrastructure/metrics/MetricsManager.ts`
- `src/infrastructure/metrics/helpers/databaseMetrics.ts`
- `src/shared/types/metrics.types.ts`
- `src/api/metrics/routes.ts`
- `docs/CORRELATION-ID-GUIDE.md`
- `docs/TIMEOUTS.md`
- `docs/METRICS-GUIDE.md`

#### Changed
- `src/app.ts`: Integração com correlation ID e métricas
- `tsconfig.json`: Configuração de typeRoots para tipos customizados
- `.env`: Adicionadas variáveis de timeout

---

## [1.0.0] - 2024-12-30

### 🎉 Release Inicial

#### Added
- **Arquitetura Base**:
  - Express.js com TypeScript
  - Padrão MVC/Clean Architecture
  - Validação com Joi
  - Logging com Winston
  - Documentação com Swagger/OpenAPI

- **Conexão com Datasul**:
  - SQL Server via mssql
  - ODBC via odbc (fallback)
  - Mock data para desenvolvimento
  - DatabaseManager com pool de conexões
  - Retry automático em falhas de conexão

- **API InformaçõesGerais**:
  - Endpoint `GET /api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo`
  - Validação de item código
  - Suporte a CORS
  - Rate limiting global

- **Health Check**:
  - Endpoint `/health`
  - Verificação de conexão DB
  - Status de cache e métricas

- **Documentação**:
  - Swagger UI em `/api-docs`
  - OpenAPI spec em `/api-docs.json`
  - README.md com instruções de setup
  - ARCHITECTURE.md com detalhes técnicos

#### Files Structure
```
src/
├── api/
│   ├── lor0138/item/dadosCadastrais/informacoesGerais/
│   ├── healthCheck/
│   └── metrics/
├── config/
├── infrastructure/
│   ├── database/
│   └── metrics/
├── shared/
│   ├── errors/
│   ├── middlewares/
│   ├── types/
│   └── utils/
├── app.ts
└── server.ts
```

---

## [0.1.0] - 2024-12-15

### 🚧 Versão Beta

#### Added
- Proof of Concept inicial
- Conexão básica com SQL Server
- Query simples de teste
- Estrutura de projeto base

---

## Tipos de Mudanças

- `Added` - Novas funcionalidades
- `Changed` - Mudanças em funcionalidades existentes
- `Deprecated` - Funcionalidades obsoletas (serão removidas)
- `Removed` - Funcionalidades removidas
- `Fixed` - Correções de bugs
- `Security` - Correções de segurança

---

## Links

- [Repositório](https://github.com/seu-usuario/lor0138)
- [Issues](https://github.com/seu-usuario/lor0138/issues)
- [Documentação](./docs/README.md)

---

**Mantenedor**: Equipe LOR0138
**Última Atualização**: 2025-01-06