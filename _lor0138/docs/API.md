# API.md - Documentação da API LOR0138

## 📋 Índice

- [Visão Geral](#visão-geral)
- [URL Base](#url-base)
- [Autenticação](#autenticação)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Raiz](#raiz)
  - [Health Check](#health-check)
  - [Informações Gerais do Item](#informações-gerais-do-item)
  - [Cache](#cache)
  - [Métricas](#métricas)
  - [Admin](#admin)
- [Headers HTTP](#headers-http)
- [Códigos de Status](#códigos-de-status)
- [Exemplos de Uso](#exemplos-de-uso)
- [Tratamento de Erros](#tratamento-de-erros)
- [Paginação e Filtros](#paginação-e-filtros)
- [Swagger UI](#swagger-ui)

---

## 🎯 Visão Geral

API REST para consulta de dados do ERP Totvs Datasul (Progress OpenEdge) através de SQL Server com Linked Server.

**Características:**
- ✅ RESTful design
- ✅ Autenticação por API Key (opcional)
- ✅ Rate limiting por usuário/tier
- ✅ Cache inteligente
- ✅ Correlation ID para rastreamento
- ✅ Documentação Swagger/OpenAPI
- ✅ Métricas Prometheus
- ✅ Graceful shutdown
- ✅ Health checks (liveness + readiness)

---

## 🌐 URL Base

### Desenvolvimento
```
http://localhost:3000
```

### Produção
```
http://lor0138.lorenzetti.ibe:3000
```

### API Prefix
```
/api
```

---

## 🔐 Autenticação

### Tipos de Autenticação

#### 1. Sem Autenticação (Público)
Alguns endpoints são públicos e não requerem autenticação:
- `GET /` - Informações da API
- `GET /health` - Health check básico
- `GET /api-docs` - Documentação Swagger

#### 2. API Key (Opcional)
Endpoints podem aceitar API Key opcional para acesso com benefícios:
- Rate limits mais generosos
- Acesso a recursos premium
- Rastreamento de uso

**Header:**
```http
X-API-Key: sua-api-key-aqui
```

#### 3. API Key (Obrigatória)
Endpoints administrativos requerem API Key com privilégios:
- `/admin/*` - Rotas de administração
- `/cache/invalidate/*` - Invalidação de cache

---

## ⏱️ Rate Limiting

### Tiers Disponíveis

| Tier | Por Minuto | Por Hora | Por Dia | Burst |
|------|------------|----------|---------|-------|
| **Anonymous** | 10 | 100 | 1,000 | 5 |
| **Free** | 10 | 100 | 1,000 | 5 |
| **Premium** | 60 | 1,000 | 10,000 | 20 |
| **Enterprise** | 300 | 10,000 | 100,000 | 100 |
| **Admin** | 1,000 | 50,000 | 1,000,000 | 500 |

### Headers de Rate Limit

Toda resposta inclui headers informativos:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1633024800
```

### Resposta ao Exceder Limite

**Status:** `429 Too Many Requests`

```json
{
  "error": "RateLimitError",
  "message": "Muitas requisições. Tente novamente em alguns segundos.",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "path": "/api/...",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "details": {
    "retryAfter": 45
  }
}
```

---

## 📡 Endpoints

### Raiz

#### `GET /`

Informações básicas da API e links úteis.

**Autenticação:** Não requer

**Resposta:** `200 OK`

```json
{
  "message": "Datasul API",
  "version": "1.0.0",
  "documentation": "/api-docs",
  "health": "/health",
  "metrics": "/metrics",
  "endpoints": {
    "informacoesGerais": "/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo"
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Health Check

#### `GET /health`

Health check completo do sistema.

**Autenticação:** Não requer

**Resposta:** `200 OK` (healthy/degraded) ou `503 Service Unavailable` (unhealthy)

```json
{
  "status": "healthy",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 45,
      "mode": "REAL",
      "message": "Conectado ao banco de dados",
      "lastCheck": "2025-10-06T12:00:00.000Z"
    },
    "memory": {
      "status": "ok",
      "used": 125829120,
      "total": 268435456,
      "percentage": 46.875,
      "message": "Memória OK"
    }
  }
}
```

#### `GET /health/live`

Liveness probe - verifica se aplicação está viva.

**Kubernetes/Docker:** Use para restart automático

**Resposta:** `200 OK`

```json
{
  "status": "alive",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "uptime": 3600
}
```

#### `GET /health/ready`

Readiness probe - verifica se aplicação está pronta para receber tráfego.

**Load Balancers:** Use para rotear tráfego

**Resposta:** `200 OK` (ready) ou `503 Service Unavailable` (not ready)

```json
{
  "status": "ready",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "uptime": 3600
}
```

---

### Informações Gerais do Item

#### `GET /api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo`

Busca informações cadastrais completas de um item no ERP Datasul.

**Autenticação:** Opcional (API Key)

**Rate Limit:** Sim (por tier)

**Cache:** 10 minutos (600 segundos)

**Parâmetros:**

| Nome | Tipo | Local | Obrigatório | Descrição |
|------|------|-------|-------------|-----------|
| `itemCodigo` | string | path | Sim | Código do item no ERP |

**Headers Opcionais:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `X-API-Key` | string | API Key para rate limit melhorado |
| `X-Correlation-ID` | uuid | ID para rastreamento (auto-gerado se omitido) |

**Exemplo de Requisição:**

```bash
curl -X GET \
  'http://lor0138.lorenzetti.ibe:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110' \
  -H 'X-API-Key: sua-api-key' \
  -H 'X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000'
```

**Resposta:** `200 OK`

```json
{
  "success": true,
  "data": {
    "dadosGerais": {
      "codigo": "7530110",
      "descricao": "VALVULA DE ESFERA 1/2\" BRONZE",
      "unidadeMedida": "UN",
      "pesoLiquido": 0.150,
      "pesoBruto": 0.200,
      "situacao": "Ativo",
      "tipoItem": "Produto Acabado",
      "fabricante": "Lorenzetti S.A.",
      "ultimaAtualizacao": "2025-10-01T10:30:00.000Z"
    },
    "unidadesMedida": [
      {
        "unidade": "UN",
        "fatorConversao": 1.0,
        "descricao": "Unidade",
        "padrao": true
      },
      {
        "unidade": "CX",
        "fatorConversao": 12.0,
        "descricao": "Caixa com 12 unidades",
        "padrao": false
      }
    ],
    "estabelecimentos": [
      {
        "codigo": "01.01",
        "nome": "CD São Paulo",
        "ativo": true,
        "estoqueAtual": 1500.0,
        "estoqueMinimo": 100.0,
        "estoqueMaximo": 3000.0,
        "pontoReposicao": 500.0,
        "localEstoque": "A-12-03",
        "ultimaMovimentacao": "2025-10-05T15:20:00.000Z"
      },
      {
        "codigo": "02.01",
        "nome": "Fábrica Joinville",
        "ativo": true,
        "estoqueAtual": 3200.0,
        "estoqueMinimo": 500.0,
        "estoqueMaximo": 5000.0,
        "pontoReposicao": 1000.0,
        "localEstoque": "B-05-12",
        "ultimaMovimentacao": "2025-10-06T09:45:00.000Z"
      }
    ]
  },
  "metadata": {
    "timestamp": "2025-10-06T12:00:00.000Z",
    "cached": false,
    "executionTime": 234,
    "correlationId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Erros Possíveis:**

| Status | Erro | Descrição |
|--------|------|-----------|
| `400` | `ValidationError` | Código de item inválido |
| `404` | `ItemNotFoundError` | Item não encontrado |
| `408` | `TimeoutError` | Requisição excedeu tempo limite |
| `429` | `RateLimitError` | Rate limit excedido |
| `500` | `DatabaseError` | Erro ao consultar banco |
| `503` | `ServiceUnavailableError` | Banco offline (modo degradado) |

---

### Cache

#### `GET /cache/stats`

Estatísticas do cache do sistema.

**Autenticação:** Não requer

**Resposta:** `200 OK`

```json
{
  "hits": 1523,
  "misses": 234,
  "keys": 45,
  "ksize": 12345,
  "vsize": 234567,
  "hitRate": 86.7
}
```

#### `DELETE /cache/invalidate/:pattern`

Invalida cache por padrão de chaves.

**Autenticação:** Requer API Key admin

**Parâmetros:**

| Nome | Tipo | Descrição | Exemplo |
|------|------|-----------|---------|
| `pattern` | string | Padrão de chaves (suporta `*`) | `item:*` |

**Exemplos de Padrões:**

```
item:*                 # Todos os itens
item:7530110:*         # Item específico
GET:/api/*             # Todas as requisições GET
estabelecimento:*      # Todos os estabelecimentos
```

**Resposta:** `200 OK`

```json
{
  "success": true,
  "deletedCount": 12,
  "pattern": "item:*"
}
```

---

### Métricas

#### `GET /metrics`

Métricas do sistema no formato Prometheus.

**Autenticação:** Não requer

**Headers de Resposta:**
```
Content-Type: text/plain; version=0.0.4; charset=utf-8
```

**Métricas Disponíveis:**

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `http_requests_total` | Counter | Total de requisições HTTP |
| `http_request_duration_seconds` | Histogram | Duração das requisições |
| `http_requests_active` | Gauge | Requisições ativas |
| `cache_hits_total` | Counter | Total de cache hits |
| `cache_misses_total` | Counter | Total de cache misses |
| `database_query_duration_seconds` | Histogram | Duração das queries |
| `database_connections_active` | Gauge | Conexões ativas |
| `rate_limit_requests_allowed` | Counter | Requisições permitidas |
| `rate_limit_requests_blocked` | Counter | Requisições bloqueadas |

**Exemplo de Resposta:**

```
# HELP http_requests_total Total de requisições HTTP
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo",status_code="200"} 1523

# HELP http_request_duration_seconds Duração das requisições HTTP
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/health",le="0.1"} 450
http_request_duration_seconds_bucket{method="GET",route="/health",le="0.5"} 498
http_request_duration_seconds_bucket{method="GET",route="/health",le="1"} 500
http_request_duration_seconds_sum{method="GET",route="/health"} 23.5
http_request_duration_seconds_count{method="GET",route="/health"} 500

# HELP cache_hits_total Total de cache hits
# TYPE cache_hits_total counter
cache_hits_total{route="/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo"} 1289

# HELP cache_misses_total Total de cache misses
# TYPE cache_misses_total counter
cache_misses_total{route="/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo"} 234
```

---

### Admin

#### `POST /admin/api-keys`

Cria uma nova API Key.

**Autenticação:** Requer API Key admin

**Body:**

```json
{
  "userId": "user-001",
  "tier": "premium",
  "description": "API Key para aplicação mobile"
}
```

**Resposta:** `201 Created`

```json
{
  "apiKey": "pk_live_abcdef123456",
  "userId": "user-001",
  "tier": "premium",
  "createdAt": "2025-10-06T12:00:00.000Z"
}
```

#### `GET /admin/api-keys`

Lista todas as API Keys.

**Autenticação:** Requer API Key admin

**Resposta:** `200 OK`

```json
{
  "keys": [
    {
      "apiKey": "pk_live_***3456",
      "userId": "user-001",
      "tier": "premium",
      "active": true,
      "createdAt": "2025-10-06T12:00:00.000Z",
      "lastUsed": "2025-10-06T11:55:00.000Z"
    }
  ],
  "total": 1
}
```

#### `DELETE /admin/api-keys/:apiKey`

Revoga uma API Key.

**Autenticação:** Requer API Key admin

**Resposta:** `200 OK`

```json
{
  "message": "API Key revogada com sucesso",
  "apiKey": "pk_live_***3456"
}
```

#### `GET /admin/api-keys/:userId/usage`

Estatísticas de uso de um usuário.

**Autenticação:** Requer API Key admin

**Resposta:** `200 OK`

```json
{
  "userId": "user-001",
  "tier": "premium",
  "usage": {
    "minute": { "count": 15, "limit": 60, "remaining": 45 },
    "hour": { "count": 234, "limit": 1000, "remaining": 766 },
    "day": { "count": 1523, "limit": 10000, "remaining": 8477 }
  },
  "lastReset": "2025-10-06T12:00:00.000Z"
}
```

---

## 📨 Headers HTTP

### Headers de Requisição

| Header | Obrigatório | Descrição |
|--------|-------------|-----------|
| `X-API-Key` | Condicional | API Key para autenticação |
| `X-Correlation-ID` | Não | UUID para rastreamento (auto-gerado se omitido) |
| `Content-Type` | Para POST/PUT | Tipo do conteúdo (application/json) |
| `Accept` | Não | Formato desejado (application/json) |

### Headers de Resposta

| Header | Sempre | Descrição |
|--------|--------|-----------|
| `X-Correlation-ID` | Sim | ID de rastreamento da requisição |
| `X-RateLimit-Limit` | Sim | Limite de requisições |
| `X-RateLimit-Remaining` | Sim | Requisições restantes |
| `X-RateLimit-Reset` | Sim | Timestamp do reset |
| `X-Cache` | Endpoints cacheados | Status do cache (HIT/MISS) |
| `Content-Type` | Sim | Tipo do conteúdo |
| `Cache-Control` | Sim | Diretivas de cache |

---

## 🔢 Códigos de Status

### Sucesso (2xx)

| Código | Nome | Descrição |
|--------|------|-----------|
| `200` | OK | Requisição bem-sucedida |
| `201` | Created | Recurso criado com sucesso |
| `204` | No Content | Requisição bem-sucedida sem conteúdo |

### Erro do Cliente (4xx)

| Código | Nome | Descrição |
|--------|------|-----------|
| `400` | Bad Request | Requisição inválida |
| `401` | Unauthorized | Autenticação necessária |
| `403` | Forbidden | Sem permissão |
| `404` | Not Found | Recurso não encontrado |
| `408` | Request Timeout | Requisição expirou |
| `429` | Too Many Requests | Rate limit excedido |

### Erro do Servidor (5xx)

| Código | Nome | Descrição |
|--------|------|-----------|
| `500` | Internal Server Error | Erro interno do servidor |
| `503` | Service Unavailable | Serviço indisponível |
| `504` | Gateway Timeout | Timeout no banco de dados |

---

## 💡 Exemplos de Uso

### cURL

#### Requisição Simples

```bash
curl -X GET 'http://localhost:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110'
```

#### Com API Key

```bash
curl -X GET \
  'http://localhost:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110' \
  -H 'X-API-Key: sua-api-key'
```

#### Com Correlation ID

```bash
curl -X GET \
  'http://localhost:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110' \
  -H 'X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000'
```

### JavaScript (Fetch)

```javascript
const response = await fetch(
  'http://localhost:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110',
  {
    headers: {
      'X-API-Key': 'sua-api-key',
      'X-Correlation-ID': crypto.randomUUID()
    }
  }
);

const data = await response.json();
console.log(data);
```

### Python (Requests)

```python
import requests
import uuid

url = 'http://localhost:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110'
headers = {
    'X-API-Key': 'sua-api-key',
    'X-Correlation-ID': str(uuid.uuid4())
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)
```

### Node.js (Axios)

```javascript
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const response = await axios.get(
  'http://localhost:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110',
  {
    headers: {
      'X-API-Key': 'sua-api-key',
      'X-Correlation-ID': uuidv4()
    }
  }
);

console.log(response.data);
```

---

## ⚠️ Tratamento de Erros

### Formato Padrão de Erro

Todos os erros seguem o mesmo formato:

```json
{
  "error": "TipoDoErro",
  "message": "Mensagem descritiva do erro",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "path": "/api/...",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "details": {
    // Informações adicionais específicas do erro
  }
}
```

### Exemplos por Tipo

#### ValidationError (400)

```json
{
  "error": "ValidationError",
  "message": "Código do item inválido",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "path": "/api/lor0138/item/dadosCadastrais/informacoesGerais/INVALIDO",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "details": {
    "field": "itemCodigo",
    "value": "INVALIDO",
    "constraints": [
      "Deve conter apenas números e letras",
      "Máximo de 16 caracteres"
    ]
  }
}
```

#### ItemNotFoundError (404)

```json
{
  "error": "ItemNotFoundError",
  "message": "Item '9999999' não encontrado",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "path": "/api/lor0138/item/dadosCadastrais/informacoesGerais/9999999",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "details": {
    "itemCodigo": "9999999"
  }
}
```

#### RateLimitError (429)

```json
{
  "error": "RateLimitError",
  "message": "Muitas requisições. Tente novamente em alguns segundos.",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "path": "/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "details": {
    "retryAfter": 45,
    "limit": 10,
    "windowMs": 60000
  }
}
```

#### DatabaseError (500)

```json
{
  "error": "DatabaseError",
  "message": "Erro ao consultar banco de dados",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "path": "/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "details": {
    "code": "ECONNREFUSED",
    "mode": "Tentando modo degradado (MOCK)"
  }
}
```

#### TimeoutError (408)

```json
{
  "error": "TimeoutError",
  "message": "A requisição demorou muito tempo para ser processada",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "path": "/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "details": {
    "timeout": 30000,
    "elapsed": 30150
  }
}
```

---

## 📄 Paginação e Filtros

### Paginação (Futuro)

Quando implementado, seguirá o padrão:

**Query Parameters:**

| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| `page` | number | 1 | Número da página |
| `limit` | number | 20 | Itens por página |
| `sort` | string | - | Campo para ordenação |
| `order` | string | asc | Direção (asc/desc) |

**Exemplo:**

```
GET /api/items?page=1&limit=20&sort=codigo&order=asc
```

**Resposta:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 📚 Swagger UI

### Acessar Documentação Interativa

```
http://localhost:3000/api-docs
```

### Recursos do Swagger

- ✅ Documentação completa de todos os endpoints
- ✅ Exemplos de requisições e respostas
- ✅ Try it out - teste direto no navegador
- ✅ Schemas de dados
- ✅ Códigos de erro
- ✅ Headers e autenticação

### Download da Especificação OpenAPI

```
GET http://localhost:3000/api-docs.json
```

---

## 🔒 Segurança

### Headers de Segurança

Todos os responses incluem headers de segurança:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'
```

### CORS

**Origens Permitidas:**

Configuradas via `CORS_ALLOWED_ORIGINS` no `.env`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://lor0138.lorenzetti.ibe:3000
```

### SQL Injection

✅ Todas as queries usam **parametrização** - 100% protegido contra SQL Injection

### Rate Limiting

✅ Implementado por IP e por usuário

### API Key

✅ Armazenamento seguro (hash SHA-256)

---

## 📊 Monitoramento

### Métricas para Prometheus

Configure scraping no `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'lor0138-api'
    static_configs:
      - targets: ['lor0138.lorenzetti.ibe:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Logs Estruturados

Todos os logs são estruturados em JSON com:
- `level` - Nível do log
- `message` - Mensagem
- `correlationId` - ID de rastreamento
- `timestamp` - Data/hora
- `context` - Contexto adicional

**Exemplo:**

```json
{
  "level": "info",
  "message": "HTTP Request",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "method": "GET",
  "url": "/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110",
  "statusCode": 200,
  "duration": 234
}
```

---

## 🚀 Performance

### Tempos de Resposta Esperados

| Endpoint | Target | Cached |
|----------|--------|--------|
| `/health` | < 100ms | - |
| `/api/...` (primeiro acesso) | < 500ms | - |
| `/api/...` (cacheado) | < 50ms | ✅ |
| `/metrics` | < 50ms | - |

### Otimizações Implementadas

- ✅ Cache em memória (10 minutos)
- ✅ Connection pooling
- ✅ Query optimization
- ✅ Compression (gzip)
- ✅ Keep-alive connections

---

## 🔄 Versionamento

### Versão Atual

```
v1.0.0
```

### Política de Versionamento

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR** - Mudanças incompatíveis
- **MINOR** - Novas funcionalidades compatíveis
- **PATCH** - Correções de bugs

### Versionamento de API (Futuro)

Quando necessário, será implementado via URL:

```
/api/v2/...
```

---

## 📞 Suporte

### Problemas Comuns

#### Rate Limit Excedido

**Solução:** Aguarde o tempo indicado em `retryAfter` ou solicite upgrade do tier

#### Item Não Encontrado

**Solução:** Verifique se o código do item está correto e existe no ERP

#### Timeout

**Solução:** Query demorada - será cacheada na próxima requisição

#### 503 - Banco Offline

**Solução:** Sistema em modo degradado (MOCK) - aguarde reconexão

### Contato

- **Issues:** [GitHub Issues](https://github.com/...)
- **Email:** suporte@lorenzetti.com.br
- **Documentação:** http://lor0138.lorenzetti.ibe:3000/api-docs

---

**Última atualização:** 2025-10-06
**Versão da API:** 1.0.0
**Mantenedor:** Projeto LOR0138