# Arquitetura Integrada - lor0138 & lordtsapi

**Data**: 2025-10-25
**Status**: Proposta de Arquitetura Target

---

## Visão Geral da Integração

### Estado Atual (Silos)

```
┌─────────────────────────────────────────────────────────────┐
│                    ESTADO ATUAL (SILOS)                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   Frontend (lor0138)     │
│                          │      ❌ Sem Correlation ID
│  - React 19 + TS         │      ❌ Logs apenas console.log
│  - Ant Design            │      ❌ Sem health check
│  - Bearer Token          │      ❌ Testes <5%
│  - console.log           │
│  - Build lento (CRA)     │
└──────────────────────────┘
           │
           │ HTTP (axios)
           │ ❌ Sem headers de rastreamento
           │
           ▼
┌──────────────────────────┐
│   Backend (lordtsapi)    │
│                          │      ✅ Correlation ID
│  - Node.js + Express     │      ✅ Elasticsearch + Kibana
│  - TypeScript            │      ✅ Redis Cache
│  - API Keys + Rate Limit │      ✅ Prometheus Metrics
│  - Elasticsearch         │      ✅ 22 conexões ODBC
│  - Redis                 │      ✅ Testes 75%
│  - Correlation ID        │
└──────────────────────────┘
           │
           ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│  Elasticsearch + Kibana  │      │   Datasul + Informix     │
│                          │      │   (22 conexões)          │
│  - Logs backend only     │      │                          │
│  - Sem logs frontend     │      │  - Progress OpenEdge     │
│  - Difícil rastrear E2E  │      │  - SQL Server            │
└──────────────────────────┘      └──────────────────────────┘
```

**Problemas**:
- ❌ Frontend e Backend em silos separados
- ❌ Troubleshooting demora 10-15 minutos
- ❌ Impossível rastrear erro frontend → backend
- ❌ Recursos enterprise do backend não aproveitados

---

### Estado Target (Integrado)

```
┌─────────────────────────────────────────────────────────────┐
│              ESTADO TARGET (INTEGRADO E2E)                   │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              Frontend (lor0138) - Modernizado                │
│                                                              │
│  ✅ Captura Correlation ID (X-Correlation-ID)               │
│  ✅ Exibe ID em erros (copiável)                            │
│  ✅ Envia logs para Elasticsearch via backend               │
│  ✅ Health check proativo                                    │
│  ✅ Rate limit feedback (X-RateLimit-*)                     │
│  ✅ Cache awareness (X-Cache: HIT/MISS)                     │
│  ✅ Vite (build 5x mais rápido)                             │
│  ✅ Testes 60%+ (E2E Cypress + Unit)                        │
│  ✅ API Key (ao invés de Bearer)                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP (axios)
                           │ Headers:
                           │   X-API-Key: xxxxx
                           │   Accept-Encoding: gzip
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              Backend (lordtsapi) - Aprimorado                │
│                                                              │
│  ✅ Correlation ID (gerado ou recebido)                     │
│  ✅ Endpoint POST /api/logs/frontend (novo)                 │
│  ✅ Headers de resposta:                                     │
│     - X-Correlation-ID                                       │
│     - X-Cache: HIT|MISS                                      │
│     - X-Cache-Age: 120s                                      │
│     - X-RateLimit-Limit: 60                                  │
│     - X-RateLimit-Remaining: 45                              │
│     - X-RateLimit-Reset: timestamp                           │
│  ✅ Testes de contrato (Pact) com frontend                  │
│  ✅ Mock server para E2E frontend                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
           │                                    │
           │                                    │
           ▼                                    ▼
┌────────────────────────┐          ┌────────────────────────┐
│  Elasticsearch+Kibana  │          │  Datasul + Informix    │
│                        │          │  (22 conexões)         │
│  ✅ Logs frontend      │          │                        │
│  ✅ Logs backend       │          │  Correlation ID        │
│  ✅ Correlation ID E2E │          │  propagado             │
│  ✅ Dashboard unificado│          │                        │
│                        │          │                        │
│  Índices:              │          └────────────────────────┘
│  - lordtsapi-logs-*    │
│  - lor0138-logs-*      │
└────────────────────────┘
```

**Benefícios**:
- ✅ Rastreamento end-to-end com mesmo Correlation ID
- ✅ Troubleshooting em 2 minutos (vs 15 minutos)
- ✅ Transparência de cache e rate limit para usuário
- ✅ Monitoramento unificado (Kibana + Prometheus)

---

## Fluxo de Correlation ID End-to-End

### Cenário: Usuário busca item "7530110"

```
┌─────────────────────────────────────────────────────────────┐
│                  FLUXO DE CORRELATION ID                     │
└─────────────────────────────────────────────────────────────┘

1. USUÁRIO CLICA "BUSCAR"
   ↓
   ┌──────────────────────────────────────────────────────────┐
   │ Frontend (lor0138)                                       │
   │                                                          │
   │ 1.1 Gera Correlation ID (opcional)                       │
   │     correlationId = "frontend-abc-123"                   │
   │                                                          │
   │ 1.2 Envia requisição:                                    │
   │     GET /api/item/7530110                                │
   │     Headers:                                             │
   │       X-Correlation-ID: frontend-abc-123                 │
   │       X-API-Key: premium-key-abc123                      │
   │       Accept-Encoding: gzip                              │
   └──────────────────────────────────────────────────────────┘
                           │
                           │ HTTP Request
                           │
                           ▼
   ┌──────────────────────────────────────────────────────────┐
   │ Backend (lordtsapi)                                      │
   │                                                          │
   │ 2.1 Middleware: Correlation ID                           │
   │     - Recebe: "frontend-abc-123"                         │
   │     - Armazena em req.id                                 │
   │     - Logs incluem correlationId                         │
   │                                                          │
   │ 2.2 Middleware: API Key Auth                             │
   │     - Valida: premium-key-abc123                         │
   │     - Identifica: user-001 (tier: premium)               │
   │                                                          │
   │ 2.3 Middleware: Rate Limit                               │
   │     - Verifica: 45/60 requisições usadas                 │
   │     - Permite: continuar                                 │
   │                                                          │
   │ 2.4 Controller → Service → Repository                    │
   │     - Busca item "7530110"                               │
   │                                                          │
   │ 2.5 Cache Check                                          │
   │     - Verifica Redis: MISS                               │
   │     - Busca no banco                                     │
   │     - Armazena em cache                                  │
   │                                                          │
   │ 2.6 Log estruturado:                                     │
   │     {                                                    │
   │       "level": "info",                                   │
   │       "message": "Item encontrado",                      │
   │       "correlationId": "frontend-abc-123",               │
   │       "itemCodigo": "7530110",                           │
   │       "userId": "user-001",                              │
   │       "tier": "premium",                                 │
   │       "cache": "MISS",                                   │
   │       "duration": 125                                    │
   │     }                                                    │
   │     → Enviado para Elasticsearch                         │
   └──────────────────────────────────────────────────────────┘
                           │
                           │ HTTP Response
                           │ Headers:
                           │   X-Correlation-ID: frontend-abc-123
                           │   X-Cache: MISS
                           │   X-RateLimit-Limit: 60
                           │   X-RateLimit-Remaining: 44
                           │   X-RateLimit-Reset: 2025-10-25T15:00:00Z
                           │
                           ▼
   ┌──────────────────────────────────────────────────────────┐
   │ Frontend (lor0138)                                       │
   │                                                          │
   │ 3.1 Captura headers de resposta                          │
   │     - correlationId = "frontend-abc-123"                 │
   │     - cache = "MISS"                                     │
   │     - rateLimit = { remaining: 44, limit: 60 }           │
   │                                                          │
   │ 3.2 Armazena em contexto React                           │
   │     useCorrelationStore.setId(correlationId)             │
   │     useCacheStore.setCacheStatus("MISS")                 │
   │     useRateLimitStore.setLimits({ remaining: 44 })       │
   │                                                          │
   │ 3.3 Renderiza UI                                         │
   │     - Exibe dados do item                                │
   │     - Badge: "🔄 Dados carregados do banco"              │
   │     - (Se cache HIT: "✅ Dados em cache")                │
   │                                                          │
   │ 3.4 Log local (enviado para Elasticsearch)               │
   │     {                                                    │
   │       "level": "info",                                   │
   │       "message": "Item renderizado",                     │
   │       "correlationId": "frontend-abc-123",               │
   │       "itemCodigo": "7530110",                           │
   │       "renderTime": 45                                   │
   │     }                                                    │
   │     → POST /api/logs/frontend                            │
   └──────────────────────────────────────────────────────────┘
                           │
                           │ Logs enviados
                           │
                           ▼
   ┌──────────────────────────────────────────────────────────┐
   │ Elasticsearch + Kibana                                   │
   │                                                          │
   │ 4.1 Índices:                                             │
   │     - lordtsapi-logs-2025.10.25                          │
   │     - lor0138-logs-2025.10.25                            │
   │                                                          │
   │ 4.2 Busca por Correlation ID: "frontend-abc-123"         │
   │                                                          │
   │     Resultado (Kibana):                                  │
   │     ┌──────────────────────────────────────────────┐    │
   │     │ Jornada Completa                             │    │
   │     ├──────────────────────────────────────────────┤    │
   │     │ 14:30:00.000 [lor0138]    Click no botão    │    │
   │     │ 14:30:00.125 [lordtsapi]  Request recebido  │    │
   │     │ 14:30:00.150 [lordtsapi]  Busca no banco    │    │
   │     │ 14:30:00.275 [lordtsapi]  Item encontrado   │    │
   │     │ 14:30:00.320 [lor0138]    Item renderizado  │    │
   │     └──────────────────────────────────────────────┘    │
   │                                                          │
   │     Duração total: 320ms                                 │
   └──────────────────────────────────────────────────────────┘
```

---

## Fluxo de Erro com Rastreamento

### Cenário: Erro ao buscar item inválido

```
┌─────────────────────────────────────────────────────────────┐
│              FLUXO DE ERRO COM RASTREAMENTO                  │
└─────────────────────────────────────────────────────────────┘

1. USUÁRIO BUSCA ITEM INVÁLIDO "XXXX"
   ↓
   Frontend envia: GET /api/item/XXXX
   Headers: X-Correlation-ID: error-trace-456
   ↓
2. BACKEND VALIDA E REJEITA
   ↓
   Response: 400 Bad Request
   Body: {
     "error": "ValidationError",
     "message": "Código de item inválido",
     "correlationId": "error-trace-456"
   }
   Headers: X-Correlation-ID: error-trace-456
   ↓
3. FRONTEND CAPTURA ERRO
   ↓
   Error Boundary exibe:
   ┌─────────────────────────────────────────────────────┐
   │ ❌ Erro ao buscar item                              │
   │                                                     │
   │ Código de item inválido                            │
   │                                                     │
   │ ID de rastreamento:                                 │
   │ ┌────────────────────────┐  ┌──────────────┐       │
   │ │ error-trace-456        │  │ 📋 Copiar    │       │
   │ └────────────────────────┘  └──────────────┘       │
   │                                                     │
   │ Use este ID ao reportar o problema para o suporte. │
   └─────────────────────────────────────────────────────┘
   ↓
4. FRONTEND ENVIA LOG PARA ELASTICSEARCH
   ↓
   POST /api/logs/frontend
   Body: {
     "level": "error",
     "message": "Validation error",
     "correlationId": "error-trace-456",
     "error": "Código de item inválido",
     "stack": "Error: ...",
     "url": "/item/XXXX",
     "userAgent": "Chrome/120.0"
   }
   ↓
5. DEVOPS RECEBE ALERTA (Kibana)
   ↓
   Busca: "error-trace-456" no Kibana
   ↓
   Vê jornada completa:
   - Frontend: Usuário digitou "XXXX"
   - Backend: Validação falhou
   - Frontend: Erro exibido
   ↓
6. RESOLUÇÃO RÁPIDA (2 minutos)
   ↓
   DevOps identifica: Usuário tentou buscar item não cadastrado
   Ação: Melhorar mensagem de erro
```

**Benefícios**:
- ✅ Troubleshooting em 2 minutos (vs 15 minutos sem Correlation ID)
- ✅ Usuário pode reportar ID específico
- ✅ DevOps vê contexto completo (frontend + backend)

---

## Integração com Cache Redis

```
┌─────────────────────────────────────────────────────────────┐
│              INTEGRAÇÃO COM CACHE REDIS                      │
└─────────────────────────────────────────────────────────────┘

PRIMEIRA REQUISIÇÃO (CACHE MISS)
──────────────────────────────────
Frontend: GET /api/item/7530110
   ↓
Backend:
   1. Verifica Redis: KEY "item:7530110" → NÃO EXISTE
   2. Busca no banco: SELECT * FROM item WHERE codigo = '7530110'
   3. Armazena no Redis: SET "item:7530110" <data> EX 600
   4. Retorna resposta
   ↓
Response Headers:
   X-Cache: MISS
   X-Cache-Age: 0
   ↓
Frontend exibe:
   ┌──────────────────────────────────┐
   │ Item: 7530110                    │
   │ Descrição: Resistor 10k          │
   │                                  │
   │ 🔄 Carregado do banco            │
   └──────────────────────────────────┘


SEGUNDA REQUISIÇÃO (CACHE HIT)
──────────────────────────────
Frontend: GET /api/item/7530110
   ↓
Backend:
   1. Verifica Redis: KEY "item:7530110" → EXISTE!
   2. Retorna direto do cache (sem banco)
   3. Tempo de resposta: 5ms (vs 125ms no banco)
   ↓
Response Headers:
   X-Cache: HIT
   X-Cache-Age: 45  # segundos desde que foi cacheado
   X-Cache-Expires: 2025-10-25T14:40:00Z
   ↓
Frontend exibe:
   ┌──────────────────────────────────┐
   │ Item: 7530110                    │
   │ Descrição: Resistor 10k          │
   │                                  │
   │ ✅ Dados em cache (45s atrás)    │
   │ 🔄 [Recarregar]                  │
   └──────────────────────────────────┘

USUÁRIO CLICA "RECARREGAR"
───────────────────────────
Frontend: GET /api/item/7530110?bypass-cache=true
   ↓
Backend:
   1. Ignora cache (devido a query param)
   2. Busca no banco
   3. Atualiza cache
   ↓
Response Headers:
   X-Cache: REFRESH
   X-Cache-Age: 0
```

---

## Rate Limit com Feedback UI

```
┌─────────────────────────────────────────────────────────────┐
│              RATE LIMIT COM FEEDBACK PROATIVO                │
└─────────────────────────────────────────────────────────────┘

TIER: PREMIUM (60 req/min)
─────────────────────────────

Requisição #1-50: Normal
Response Headers:
   X-RateLimit-Limit: 60
   X-RateLimit-Remaining: 10  # ⚠️ 10/60 restantes
   X-RateLimit-Reset: 2025-10-25T14:31:00Z
   ↓
Frontend detecta: remaining < 20%
   ↓
Exibe banner:
   ┌──────────────────────────────────────────────────────┐
   │ ⚠️ Atenção: Você está próximo do limite             │
   │    10/60 requisições restantes                       │
   │    Redefine em: 30 segundos                          │
   └──────────────────────────────────────────────────────┘


Requisição #61: BLOQUEADO
Response: 429 Too Many Requests
Body: {
   "error": "RateLimitError",
   "message": "Limite excedido",
   "details": { "retryAfter": 45 }
}
   ↓
Frontend exibe modal:
   ┌──────────────────────────────────────────────────────┐
   │ ❌ Limite de requisições excedido                    │
   │                                                      │
   │ Você atingiu o limite de 60 requisições por minuto. │
   │                                                      │
   │ Tente novamente em: 45 segundos                     │
   │                                                      │
   │ ┌──────────────────────────────────────────┐        │
   │ │ [Countdown: 44...43...42...41...]        │        │
   │ └──────────────────────────────────────────┘        │
   │                                                      │
   │ Seu plano: Premium (60 req/min)                     │
   │ Para mais requisições, entre em contato.            │
   └──────────────────────────────────────────────────────┘
   ↓
Frontend desabilita ações temporariamente
   - Botões de busca: disabled
   - Auto-refresh: pausado
   ↓
Após 45 segundos:
   - Ações reabilitadas
   - Banner desaparece
```

---

## Stack Tecnológica Integrada

```
┌─────────────────────────────────────────────────────────────┐
│                    STACK TECNOLÓGICA                         │
└─────────────────────────────────────────────────────────────┘

FRONTEND (lor0138)
──────────────────
┌────────────────────────────────────────────────────────┐
│ Camada de Apresentação                                 │
│ - React 19.2 + TypeScript 4.9                          │
│ - Ant Design 5.27 (UI Components)                      │
│ - React Router DOM 6.30 (Routing)                      │
│ - Vite 5.x (Build Tool) ← MIGRAR DE CRA               │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ Camada de Estado                                       │
│ - React Context (State Management)                     │
│ - Custom Hooks (useCorrelation, useCache)             │
│ - Zustand (opcional para estado global)               │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ Camada de Comunicação                                  │
│ - Axios 1.12 (HTTP Client)                             │
│ - Interceptors (Correlation ID, API Key, Logs)        │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ Camada de Testes                                       │
│ - Jest + React Testing Library (Unit)                 │
│ - Cypress 15.5 (E2E)                                   │
│ - Pact (Contract Testing) ← NOVO                      │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ Camada de Observabilidade                              │
│ - Logging Service → Elasticsearch ← NOVO               │
│ - Error Boundary (Captura de erros) ← NOVO            │
│ - Correlation ID Tracking ← NOVO                       │
└────────────────────────────────────────────────────────┘

BACKEND (lordtsapi)
───────────────────
┌────────────────────────────────────────────────────────┐
│ Camada de API                                          │
│ - Express 4.18 + TypeScript 5.3                        │
│ - Helmet (Security Headers)                            │
│ - Compression (gzip/deflate)                           │
│ - CORS                                                 │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ Camada de Autenticação                                 │
│ - API Keys (Custom)                                    │
│ - Rate Limiting (express-rate-limit)                   │
│ - Tiers: Free/Premium/Enterprise/Admin                │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ Camada de Cache                                        │
│ - Redis (ioredis) - Camada distribuída                │
│ - Node-cache - Camada em memória                      │
│ - Layered Strategy (Memory → Redis → DB)              │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ Camada de Dados                                        │
│ - ODBC (22 conexões Datasul + Informix)               │
│ - SQL Server (mssql)                                   │
│ - Connection Pooling                                   │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ Camada de Observabilidade                              │
│ - Winston (Logging estruturado)                        │
│ - Elasticsearch + Kibana (Log persistence)            │
│ - Prometheus + Grafana (Metrics)                       │
│ - Correlation ID (UUID v4)                             │
│ - Health Checks (22 conexões)                          │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ Camada de Testes                                       │
│ - Jest (Unit + Integration)                            │
│ - Supertest (E2E API)                                  │
│ - Testcontainers (DB Integration)                      │
│ - Stryker (Mutation Testing)                           │
│ - Pact (Contract Testing) ← NOVO                      │
└────────────────────────────────────────────────────────┘

INFRAESTRUTURA
──────────────
┌────────────────────────────────────────────────────────┐
│ Logs & Monitoring                                      │
│ - Elasticsearch 8.11 (Log storage)                     │
│ - Kibana (Log visualization)                           │
│ - Prometheus (Metrics collection)                      │
│ - Grafana (Metrics visualization)                      │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ Cache                                                  │
│ - Redis 5.x (Distributed cache)                        │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ Databases                                              │
│ - Datasul (Progress OpenEdge) - 18 conexões           │
│ - Informix - 4 conexões                                │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ CI/CD                                                  │
│ - GitHub Actions                                       │
│ - GitHub Packages (@acmano/lordtsapi-shared-types)    │
│ - Docker (containerização)                             │
└────────────────────────────────────────────────────────┘
```

---

## Checklist de Implementação

### Sprint 1-2: Quick Wins + Fundação

#### Backend
- [ ] Criar endpoint `POST /api/logs/frontend`
- [ ] Adicionar headers de cache nas respostas (`X-Cache`, `X-Cache-Age`)
- [ ] Validar Correlation ID recebido do frontend
- [ ] Configurar índice Elasticsearch para frontend (`lor0138-logs-*`)
- [ ] Documentar novos endpoints no Swagger

#### Frontend
- [ ] Capturar `X-Correlation-ID` em axios interceptor
- [ ] Armazenar Correlation ID em React Context
- [ ] Exibir Correlation ID em mensagens de erro (copiável)
- [ ] Implementar serviço de logging frontend
- [ ] Enviar logs para `POST /api/logs/frontend`
- [ ] Capturar erros com Error Boundary

#### DevOps
- [ ] Configurar índice Elasticsearch `lor0138-logs-*`
- [ ] Criar dashboard Kibana para logs frontend
- [ ] Configurar ILM para índice frontend (retenção 30 dias)
- [ ] Atualizar workflow GitHub Actions (auth segura)

---

## Benefícios Mensuráveis

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Tempo de troubleshooting** | 15 min | 2 min | 87% ↓ |
| **Logs correlacionados** | 0% | 95% | - |
| **Cobertura de testes frontend** | <5% | 60% | 12x ↑ |
| **Tempo de build (dev)** | 45s | 5s | 90% ↓ |
| **HMR (hot reload)** | 3-5s | <100ms | 97% ↓ |
| **Bugs detectados antes de prod** | 20% | 80% | 4x ↑ |

---

## Conclusão

Esta arquitetura integrada aproveita ao máximo os recursos enterprise já existentes no backend (Elasticsearch, Redis, Correlation ID, API Keys) e os estende para o frontend, criando uma experiência de desenvolvimento e troubleshooting de classe mundial.

**Próximo Passo**: Implementar Quick Wins (24 horas) para validar benefícios.

---

_Documento gerado com Claude Code em 2025-10-25_
