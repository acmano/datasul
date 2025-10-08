# App - Aplicação Express Principal

> **Coração do sistema - configuração central da aplicação**

Arquivo que inicializa e configura toda a aplicação Express, incluindo middlewares, rotas, tratamento de erros e integrações.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Ordem de Inicialização](#ordem-de-inicialização)
- [Middlewares](#middlewares)
- [Rotas](#rotas)
- [Health Check](#health-check)
- [Cache Management](#cache-management)
- [Error Handling](#error-handling)
- [Segurança](#segurança)
- [Boas Práticas](#boas-práticas)

---

## Visão Geral

### O que é?

**App** é a classe principal que encapsula toda a configuração da aplicação Express, desde middlewares de segurança até tratamento global de erros.

### Responsabilidades

1. **Configuração de Middlewares** - Segurança, logging, métricas, parsing
2. **Registro de Rotas** - API, documentação, admin, health checks
3. **Tratamento de Erros** - Catch-all para erros não tratados
4. **Integração de Sistemas** - Banco, cache, métricas

### Características

- ✅ **Singleton Pattern** - Uma única instância
- ✅ **Fail-Safe** - Continua funcionando se métricas falharem
- ✅ **Ordem Crítica** - Middlewares em sequência específica
- ✅ **Logging Estruturado** - Winston com correlation ID
- ✅ **Observable** - Métricas Prometheus

---

## Arquitetura

### Diagrama de Inicialização

```
App Constructor
    ↓
┌─────────────────────────────┐
│ 1. initializeMetrics()      │ → MetricsManager
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ 2. setupMiddlewares()       │ → 9 middlewares em ordem
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ 3. setupRoutes()            │ → Rotas da aplicação
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ 4. setupErrorHandling()     │ → Error handler global
└─────────────────────────────┘
```

### Integrações

| Sistema | Papel | Crítico? |
|---------|-------|----------|
| **DatabaseManager** | Conexão SQL Server/ODBC | ✅ Sim |
| **CacheManager** | Sistema de cache L1/L2 | ❌ Opcional |
| **MetricsManager** | Métricas Prometheus | ❌ Opcional |
| **Swagger** | Documentação OpenAPI | ❌ Opcional |
| **Winston** | Logging estruturado | ✅ Sim |

---

## Ordem de Inicialização

### Por que a ordem importa?

Cada passo depende do anterior. Alterar a ordem pode quebrar funcionalidades ou criar vulnerabilidades.

### 1. Métricas (Primeiro)

```typescript
initializeMetrics()
```

**Por quê primeiro?**
- Precisa estar pronto antes de coletar dados
- Middlewares dependem do MetricsManager
- Falha não deve parar aplicação

**O que faz:**
- Cria instância do MetricsManager
- Registra contadores e gauges
- Graceful degradation se falhar

---

### 2. Middlewares (Ordem Crítica)

```typescript
setupMiddlewares()
```

**9 middlewares em ordem específica:**

```
1. Correlation ID  ← Tracking
2. Métricas        ← Observabilidade
3. Logging         ← Auditoria
4. Security        ← Proteção
5. CORS            ← Cross-origin
6. Parsing         ← Processamento
7. Compression     ← Performance
8. Timeout         ← Controle
9. Rate Limiting   ← Proteção
```

---

### 3. Rotas (Após Middlewares)

```typescript
setupRoutes()
```

**Ordem das rotas:**

```
1. /metrics       ← Prometheus
2. /health        ← Health check
3. /cache/*       ← Gerenciamento
4. /api-docs      ← Swagger
5. /admin/*       ← Admin
6. /api/*         ← API principal
7. /              ← Root
8. *              ← 404 (catch-all)
```

**Por que esta ordem?**
- Mais específicas primeiro
- Catch-all por último
- Se catch-all viesse primeiro, capturaria tudo!

---

### 4. Error Handler (Último)

```typescript
setupErrorHandling()
```

**Por quê último?**
- Precisa capturar erros de TUDO
- Se viesse antes, não capturaria erros das rotas
- Express processa na ordem de registro

---

## Middlewares

### Ordem Crítica

⚠️ **NÃO ALTERAR A ORDEM SEM ENTENDER O IMPACTO!**

A ordem é fundamental. Middlewares são executados sequencialmente.

### 1. Correlation ID

**Propósito:** Tracking e rastreamento de requisições

**Posição:** Primeiro (todos dependem dele)

**O que faz:**
- Gera ou aceita UUID único (v4)
- Adiciona `req.id`
- Retorna header `X-Correlation-ID`

**Por que primeiro?**
- Todos logs precisam do correlation ID
- Se vier depois, alguns logs ficam sem ID

**Exemplo:**
```
Cliente → [X-Correlation-ID: abc-123]
Servidor → logs com correlationId: abc-123
Servidor → [X-Correlation-ID: abc-123]
```

---

### 2. Métricas

**Propósito:** Coleta de dados de performance

**Posição:** Logo após correlation ID

**O que faz:**
- Mede duração total
- Conta requisições por rota/método/status
- Registra em Prometheus

**Por que após correlation ID?**
- Para capturar tempo TOTAL
- Incluindo tempo de outros middlewares

**Métricas coletadas:**
- `http_requests_total` - Total de requisições
- `http_request_duration_seconds` - Latência
- `http_requests_in_progress` - Requisições ativas

---

### 3. Logging

**Propósito:** Auditoria e debug

**Posição:** Após correlation ID

**O que faz:**
- Armazena `req.startTime`
- Registra informações ao finalizar
- Log estruturado (JSON)

**Por que após correlation ID?**
- Precisa do ID para logar corretamente

**Informações logadas:**
```json
{
  "level": "info",
  "message": "HTTP Request",
  "correlationId": "abc-123",
  "method": "GET",
  "url": "/api/items",
  "statusCode": 200,
  "duration": 45,
  "userAgent": "Mozilla/5.0..."
}
```

---

### 4. Security Headers (Helmet)

**Propósito:** Proteção contra ataques

**Posição:** Antes de qualquer processamento

**O que faz:**
- Adiciona 15+ headers de segurança
- Previne XSS, clickjacking, MIME sniffing

**Headers adicionados:**
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=15552000`
- Etc.

**⚠️ CSP Desabilitado:**
```typescript
helmet({ contentSecurityPolicy: false })
```

**Por quê?**
- Swagger UI precisa inline scripts/styles
- CSP estrito bloquearia Swagger

**Produção:**
- Servir Swagger em subdomínio separado
- Ou usar nonces/hashes
- Ou desabilitar Swagger

---

### 5. CORS

**Propósito:** Cross-Origin Resource Sharing

**Posição:** Antes de parsing

**O que faz:**
- Permite requisições de outras origens
- Responde preflight requests (OPTIONS)

**Configuração:**
```typescript
{
  origin: process.env.CORS_ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  exposedHeaders: ['X-Correlation-ID']
}
```

**Preflight:**
```
1. OPTIONS /api/items (preflight)
2. 204 com headers CORS
3. POST /api/items (requisição real)
4. 201 com dados
```

**Por que antes de parsing?**
- Preflight requests não têm body
- Precisa responder antes de parsear

---

### 6. Body Parsing

**Propósito:** Converter body em objetos JavaScript

**Posição:** Após CORS

**Dois parsers:**

**JSON Parser:**
```typescript
express.json({ limit: '10mb' })
```
- Para `Content-Type: application/json`
- Converte JSON → objeto
- Limite de 10MB (anti-DoS)

**URL-Encoded Parser:**
```typescript
express.urlencoded({ extended: true, limit: '10mb' })
```
- Para `Content-Type: application/x-www-form-urlencoded`
- Converte form data → objeto
- `extended: true` permite objetos aninhados

**Por que após CORS?**
- Não faz sentido parsear se CORS bloqueou

---

### 7. Compression

**Propósito:** Reduzir tamanho das respostas

**Posição:** Após parsing

**O que faz:**
- Comprime com gzip/deflate/brotli
- Reduz bandwidth em 70-90%
- Response > 1KB

**Exemplo:**
```
JSON sem compressão: 100KB
JSON com gzip: 15KB (85% redução!)
```

**Por que após parsing?**
- Comprime RESPOSTAS, não requisições
- Parsing é de entrada, compression é de saída

---

### 8. Timeout

**Propósito:** Limite de tempo para requisições

**Posição:** Após parsing

**Configuração:**
```typescript
timeout('30s')
```

**O que faz:**
- Inicia timer quando requisição chega
- Se > 30s, seta `req.timedout = true`
- Error handler trata com 408

**Por que 30 segundos?**
- 5s seria pouco para queries complexas
- 60s seria muito (usuário desistiu)
- 30s é bom balanço

**Middleware seguinte:**
```typescript
(req, res, next) => {
  if (!req.timedout) next();
}
```

---

### 9. Rate Limiting

**Propósito:** Proteção contra abuso

**Posição:** Por último (mediu/logou antes de bloquear)

**Configuração:**
```typescript
{
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,                   // 100 req/IP
  standardHeaders: true
}
```

**Algoritmo:**
- Fixed Window Counter
- 100 req em 15 min = ~6.67 req/min

**Exceção Admin:**
```typescript
if (apiKey === 'admin-key-superuser') {
  return next();
}
```

**Response quando excede (429):**
```json
{
  "error": "Rate limit excedido",
  "message": "Muitas requisições. Tente novamente em alguns minutos.",
  "timestamp": "2025-10-07T...",
  "path": "/api/items",
  "correlationId": "abc-123"
}
```

**Headers:**
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: 1234567890`
- `Retry-After: 900`

---

## Rotas

### Estrutura

```
/metrics              → Prometheus
/health               → Health check
/cache/stats          → Cache stats
/cache/keys           → List keys
/cache/clear          → Clear cache
/cache/invalidate/:p  → Invalidate pattern
/api-docs             → Swagger UI
/api-docs.json        → OpenAPI spec
/admin/*              → Admin routes
/api/*                → Business API
/                     → API info
*                     → 404
```

### Ordem de Registro

**Específicas → Genéricas → Catch-all**

```typescript
// ✅ Correto
app.use('/api/items', itemRoutes);  // Específica
app.use('/', rootRoute);             // Genérica
app.use('*', handle404);             // Catch-all

// ❌ Errado
app.use('*', handle404);             // Captura tudo!
app.use('/api/items', itemRoutes);  // Nunca executado
```

---

## Health Check

### Endpoint

```
GET /health
```

### O que verifica

| Componente | Verificação | Crítico? |
|------------|-------------|----------|
| **Database** | Conectividade, response time | ✅ Sim |
| **Cache** | Habilitado, ready | ❌ Não |
| **Metrics** | Sistema ativo | ❌ Não |

### Response (200 OK)

```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T...",
  "database": {
    "connected": true,
    "responseTime": 12,
    "status": "healthy",
    "type": "sqlserver"
  },
  "cache": {
    "enabled": true,
    "strategy": "layered",
    "ready": true
  },
  "metrics": {
    "enabled": true,
    "endpoint": "/metrics"
  }
}
```

### Response (503 Unhealthy)

```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-07T...",
  "database": {
    "connected": false,
    "responseTime": 0,
    "status": "unhealthy",
    "type": "unknown"
  },
  ...
}
```

### Métricas

Durante health check, registra:

```
healthCheckDuration{component="database"} = 0.012
healthCheckStatus{component="database"} = 1
healthCheckStatus{component="api"} = 1
```

### Usado por

- Load balancers (rotear apenas para saudáveis)
- Kubernetes (liveness/readiness probes)
- Monitoramento (alertas)
- DevOps (validar deploy)

---

## Cache Management

### Endpoints

#### GET /cache/stats

Estatísticas de uso.

**Response:**
```json
{
  "stats": {
    "hits": 150,
    "misses": 30,
    "keys": 45,
    "hitRate": 83.33
  },
  "config": {
    "stdTTL": 300,
    "checkperiod": 600,
    "enabled": true
  }
}
```

---

#### GET /cache/keys

Lista chaves em cache.

**Query params:**
- `pattern` (opcional) - Filtrar por padrão

**Examples:**
```
GET /cache/keys
GET /cache/keys?pattern=item:*
```

**Response:**
```json
{
  "keys": [
    "item:7530110:informacoesGerais",
    "GET:/health"
  ],
  "count": 2
}
```

---

#### POST /cache/clear

Limpa todo o cache.

**⚠️ Operação destrutiva!**

**Response:**
```json
{
  "success": true,
  "message": "Cache limpo com sucesso"
}
```

**Impacto:**
- Próximas requisições = cache miss
- Aumento de carga no banco
- Latência maior temporariamente

**Quando usar:**
- Após deploy com mudanças
- Após atualização em massa
- Forçar refresh de dados

---

#### DELETE /cache/invalidate/:pattern

Invalida cache por padrão (wildcards).

**Examples:**
```
DELETE /cache/invalidate/item:*
DELETE /cache/invalidate/item:7530110:*
DELETE /cache/invalidate/GET:/api/*
```

**Response:**
```json
{
  "success": true,
  "deletedCount": 12,
  "pattern": "item:*"
}
```

**Vantagem:**
- Invalidação seletiva
- Mantém cache válido de outros dados

---

### Segurança

⚠️ **ATENÇÃO:** Endpoints administrativos!

**Em produção:**
- ✅ Adicionar autenticação (API key)
- ✅ Restringir por IP (rede interna)
- ✅ Rate limiting específico
- ✅ Logar operações
- ✅ Alertar em operações destrutivas

**Atualmente:**
- ❌ Públicos (sem autenticação)
- OK para dev, **INSEGURO** para prod

---

## Error Handling

### Error Handler Global

**Deve ser o último middleware!**

### Tipos de Erros

#### 1. Timeout (408)

```typescript
if (err.message === 'Response timeout' || req.timedout)
```

**Response:**
```json
{
  "error": "Timeout",
  "message": "A requisição demorou muito tempo",
  "timestamp": "...",
  "path": "/api/...",
  "correlationId": "abc-123"
}
```

---

#### 2. AppError (Customizado)

```typescript
if (err instanceof AppError)
```

**Características:**
- `statusCode` - HTTP status
- `isOperational` - Se esperado
- `context` - Dados adicionais
- `name` - Nome da classe
- `message` - Descrição

**Response:**
```json
{
  "error": "ItemNotFoundError",
  "message": "Item não encontrado",
  "timestamp": "...",
  "path": "...",
  "correlationId": "...",
  "details": {
    "itemCodigo": "7530110"
  }
}
```

**Logging:**
- Operacional → `WARNING`
- Não operacional → `ERROR`

---

#### 3. Generic Error (500)

```typescript
// Qualquer erro não tratado
```

**Response (Produção):**
```json
{
  "error": "Erro interno",
  "message": "Ocorreu um erro ao processar sua requisição",
  "timestamp": "...",
  "path": "...",
  "correlationId": "..."
}
```

**Response (Desenvolvimento):**
```json
{
  "error": "Erro interno",
  "message": "TypeError: Cannot read property 'id' of undefined",
  ...
}
```

**Logging:**
- Sempre `ERROR`
- Stack trace completo
- Provavelmente bug

---

### Dev vs Prod

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| **Mensagem** | Completa | Genérica |
| **Stack** | ✅ Sim | ❌ Não |
| **Detalhes** | ✅ Todos | ❌ Mínimos |

**Por quê?**
- Stack revela estrutura do código
- Mensagens podem ter info sensível
- Atacantes usam erros para mapear

**Correlação:**
- Cliente reporta erro com ID
- Equipe busca logs pelo ID
- Vê stack trace completo

---

## Segurança

### Headers (Helmet)

Adiciona 15+ headers de segurança:

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-Download-Options: noopen`
- `X-Permitted-Cross-Domain-Policies: none`
- `Referrer-Policy: no-referrer`
- `Strict-Transport-Security: max-age=15552000`

**CSP desabilitado:**
```typescript
helmet({ contentSecurityPolicy: false })
```

---

### CORS

Controla quais origens podem acessar:

```typescript
{
  origin: process.env.CORS_ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: [...],
  exposedHeaders: ['X-Correlation-ID']
}
```

**Produção:**
```bash
CORS_ALLOWED_ORIGINS=https://app.empresa.com,https://admin.empresa.com
```

---

### Rate Limiting

Limita requisições por IP:

- **Window:** 15 minutos
- **Max:** 100 requisições
- **Exceção:** Admin API key

**Previne:**
- DDoS attacks
- Brute force
- Scraping abusivo

---

### Timeout

Limita tempo de execução:

- **Timeout:** 30 segundos
- **Response:** 408 Request Timeout

**Previne:**
- Recursos travados
- Deadlocks
- Queries longas

---

## Boas Práticas

### ✅ DO

**1. Respeite a ordem dos middlewares**
```typescript
// ✅ Ordem correta
correlation → metrics → logging → ...
```

**2. Use variáveis de ambiente**
```typescript
// ✅ Configurável
origin: process.env.CORS_ALLOWED_ORIGINS
```

**3. Sempre inclua correlation ID**
```typescript
// ✅ Em todos os logs/responses
correlationId: req.id
```

**4. Trate erros apropriadamente**
```typescript
// ✅ AppError para erros de negócio
throw new ItemNotFoundError(codigo);
```

**5. Monitore métricas**
```typescript
// ✅ Health checks e métricas
/health, /metrics
```

---

### ❌ DON'T

**1. Não altere ordem dos middlewares**
```typescript
// ❌ Ordem errada quebra funcionalidades
```

**2. Não exponha detalhes em produção**
```typescript
// ❌ Stack trace para clientes
res.json({ stack: err.stack })
```

**3. Não use CORS_ALLOWED_ORIGINS=* em produção**
```typescript
// ❌ Permite qualquer origem
origin: '*'
```

**4. Não desabilite security headers sem motivo**
```typescript
// ❌ Vulnerável
app.use(helmet({ /* tudo desabilitado */ }))
```

**5. Não esqueça de logar**
```typescript
// ❌ Erro silencioso
try { ... } catch (e) { }
```

---

## Referências

### Arquivos Relacionados

- `server.ts` - Inicialização do servidor
- `correlationId.middleware.ts` - Correlation ID
- `metrics.middleware.ts` - Métricas
- `logger.ts` - Sistema de logs
- `errors.ts` - Erros customizados

### Bibliotecas

- [Express](https://expressjs.com/) - Framework web
- [Helmet](https://helmetjs.github.io/) - Security headers
- [CORS](https://github.com/expressjs/cors) - Cross-origin
- [compression](https://github.com/expressjs/compression) - Gzip
- [express-rate-limit](https://github.com/nfriedly/express-rate-limit) - Rate limiting
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) - Swagger

### Conceitos

- **Middleware** - Função que intercepta requisições
- **Correlation ID** - UUID para rastreamento
- **CORS** - Cross-Origin Resource Sharing
- **CSP** - Content Security Policy
- **Rate Limiting** - Controle de taxa
- **Health Check** - Verificação de saúde
- **Error Handler** - Tratamento global de erros

---

**Última atualização:** 2025-10-07