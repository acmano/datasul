# Documentação - Routes: Informações Gerais de Famílias

**Módulo:** `InformacoesGeraisRoutes`
**Categoria:** Routes
**Arquivo:** `src/api/lor0138/familia/dadosCadastrais/informacoesGerais/routes/informacoesGerais.routes.ts`

---

## Visão Geral

Define os endpoints para consulta de informações cadastrais de famílias do ERP Totvs Datasul/Progress através do SQL Server com Linked Server.

---

## Endpoints Disponíveis

### GET /:familiaCodigo

Busca informações gerais de uma família específica.

**URL:** `GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/:familiaCodigo`

---

## Arquitetura da Rota

### Camadas de Proteção e Otimização

```
┌─────────────────────────────────────────────────────────────┐
│                      Cliente (HTTP Request)                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. optionalApiKeyAuth                                        │
│    └─ Autentica se tiver API Key (opcional)                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. userRateLimit                                             │
│    └─ Rate limit por usuário/tier ou IP                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. familiaCache                                              │
│    └─ Cache HTTP de resposta (10 min)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Controller                                                │
│    └─ Lógica de controle e validação                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Service                                                   │
│    └─ Lógica de negócio                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Repository                                                │
│    └─ Acesso aos dados                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. DatabaseManager                                           │
│    └─ Gerenciamento de conexão                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. SQL Server (Linked Server)                               │
│    └─ Progress/Datasul                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Middlewares Aplicados

### 1. optionalApiKeyAuth

**Propósito:** Autenticação opcional por API Key

**Comportamento:**

| Condição | Ação |
|----------|------|
| **Com API Key válida** | Autentica usuário e aplica rate limit por tier |
| **Sem API Key** | Permite acesso com rate limit padrão por IP |
| **API Key inválida** | Retorna erro 401 Unauthorized |

**Headers:**
- `X-API-Key`: API Key do usuário (opcional)

**Exemplo:**
```http
GET /api/.../450000
X-API-Key: api_key_premium_abc123xyz789
```

---

### 2. userRateLimit

**Propósito:** Rate limiting inteligente por tier ou IP

**Configuração por Tier:**

| Tier | Rate Limit | Descrição |
|------|------------|-----------|
| **Free** | 10 req/min | Acesso básico gratuito |
| **Premium** | 60 req/min | Plano pago intermediário |
| **Enterprise** | 300 req/min | Plano corporativo |
| **Sem API Key** | 10 req/min | Limite por IP público |

**Headers de Resposta:**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1696435200
```

**Erro 429 (Rate Limit Exceeded):**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit excedido. Tente novamente em 45 segundos",
  "retryAfter": 45
}
```

---

### 3. familiaCache

**Propósito:** Cache HTTP de respostas para otimização

**Configuração:**

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| **TTL** | 600s (10 min) | Tempo de vida do cache |
| **Key Generator** | `familia:{familiaCodigo}` | Formato da chave |
| **Condition** | `statusCode === 200` | Cacheia apenas sucessos |

**Geração de Chave:**
```typescript
keyGenerator: (req) => `familia:${req.params.familiaCodigo}`

// Exemplos:
// familia:450000
// familia:ABC123
```

**Headers de Resposta:**

**Cache HIT (dados do cache):**
```http
X-Cache: HIT
X-Cache-Key: familia:450000
```

**Cache MISS (dados do banco):**
```http
X-Cache: MISS
X-Cache-Key: familia:450000
```

**Performance:**

| Cenário | Tempo de Resposta |
|---------|-------------------|
| **Cache HIT** | < 1ms (instantâneo) |
| **Cache MISS** | ~50-500ms (depende do banco) |

**Invalidação:**
- **Automática:** Após 10 minutos (TTL)
- **Manual:** Limpeza de cache administrativo

---

## Fluxo de Requisição Completo

### 1. Cliente Envia Request

```http
GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/450000
X-API-Key: api_key_premium_abc123xyz789
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
```

### 2. optionalApiKeyAuth

- Valida API Key
- Identifica tier: Premium
- Adiciona info do usuário ao `req.user`

### 3. userRateLimit

- Verifica limite: 60 req/min (Premium)
- Decrementa contador
- Adiciona headers de rate limit

### 4. familiaCache

- Verifica se existe em cache: `familia:450000`
- **Se HIT:** Retorna resposta cacheada (< 1ms)
- **Se MISS:** Continua para controller

### 5. Controller (importação dinâmica)

```typescript
const { InformacoesGeraisController } = await import(
  '../controller/informacoesGerais.controller'
);
```

**Por que importação dinâmica?**
- Evita dependências circulares
- Melhora inicialização da aplicação
- Carrega módulos sob demanda

### 6. Controller Executa

- Valida parâmetros (`familiaCodigo`)
- Chama Service
- Formata resposta

### 7. Service Processa

- Chama Repository
- Aplica regras de negócio
- Trata erros

### 8. Repository Busca Dados

- Executa query SQL
- Retorna dados brutos

### 9. DatabaseManager

- Gerencia pool de conexões
- Executa query no SQL Server
- Trata timeouts

### 10. SQL Server + Linked Server

- Acessa Progress/Datasul
- Retorna dados

### 11. Resposta ao Cliente

```json
{
  "success": true,
  "data": {
    "identificacaoFamiliaCodigo": "450000",
    "identificacaoFamiliaDescricao": "FAMÍLIA TESTE"
  }
}
```

**Headers:**
```http
HTTP/1.1 200 OK
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
X-Cache: MISS
X-Cache-Key: familia:450000
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1696435200
```

---

## Validações Aplicadas

### Validação do Parâmetro familiaCodigo

| Validação | Regra | Erro |
|-----------|-------|------|
| **Presença** | Campo obrigatório | 400 Bad Request |
| **Tipo** | Deve ser string | 400 Bad Request |
| **Tamanho** | 1-8 caracteres | 400 Bad Request |
| **Formato** | Apenas `[A-Za-z0-9]` | 400 Bad Request |
| **SQL Injection** | Sem keywords SQL | 400 Bad Request |
| **XSS** | Sem tags HTML | 400 Bad Request |

**Exemplos Válidos:**
- `450000`
- `ABC123`
- `Fam001`

**Exemplos Inválidos:**
- `ABC-123` (hífen não permitido)
- `'; DROP TABLE--` (SQL injection)
- `<script>alert()</script>` (XSS)
- `../../../etc/passwd` (path traversal)

---

## Respostas HTTP

### 200 OK - Sucesso

```json
{
  "success": true,
  "data": {
    "identificacaoFamiliaCodigo": "450000",
    "identificacaoFamiliaDescricao": "FAMÍLIA TESTE"
  }
}
```

**Headers:**
```http
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
X-Cache: HIT
X-Cache-Key: familia:450000
```

---

### 400 Bad Request - Parâmetro Inválido

```json
{
  "error": "Bad Request",
  "message": "Código da familia contém caracteres inválidos. Use apenas letras, números e caracteres básicos",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/lor0138/familia/dadosCadastrais/informacoesGerais/ABC-123",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 404 Not Found - Família Não Encontrada

```json
{
  "error": "Not Found",
  "message": "Família 999999 não encontrado",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/lor0138/familia/dadosCadastrais/informacoesGerais/999999",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 429 Too Many Requests - Rate Limit Excedido

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit excedido. Tente novamente em 45 segundos",
  "retryAfter": 45,
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/lor0138/familia/dadosCadastrais/informacoesGerais/450000",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Headers:**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1696435200
Retry-After: 45
```

---

### 500 Internal Server Error - Erro Interno

```json
{
  "error": "Internal Server Error",
  "message": "Falha ao buscar informações da família",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/lor0138/familia/dadosCadastrais/informacoesGerais/450000",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 504 Gateway Timeout - Timeout

```json
{
  "error": "Gateway Timeout",
  "message": "A consulta ao banco de dados demorou mais de 30 segundos",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/lor0138/familia/dadosCadastrais/informacoesGerais/450000",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Headers da Requisição

### Obrigatórios

Nenhum header é obrigatório.

### Opcionais

| Header | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `X-API-Key` | string | API Key para autenticação | `api_key_premium_abc123xyz789` |
| `X-Correlation-ID` | uuid | ID de correlação para rastreamento | `550e8400-e29b-41d4-a716-446655440000` |

---

## Headers da Resposta

### Sempre Presentes

| Header | Descrição | Exemplo |
|--------|-----------|---------|
| `X-Correlation-ID` | ID de correlação | `550e8400-e29b-41d4-a716-446655440000` |
| `Content-Type` | Tipo de conteúdo | `application/json` |

### Condicionais

| Header | Quando | Exemplo |
|--------|--------|---------|
| `X-Cache` | Sempre | `HIT` ou `MISS` |
| `X-Cache-Key` | Sempre | `familia:450000` |
| `X-RateLimit-Limit` | Com rate limit | `60` |
| `X-RateLimit-Remaining` | Com rate limit | `59` |
| `X-RateLimit-Reset` | Com rate limit | `1696435200` |
| `Retry-After` | Erro 429 | `45` |

---

## Performance

### Benchmarks

| Cenário | Tempo Médio | P95 | P99 |
|---------|-------------|-----|-----|
| **Cache HIT** | < 1ms | 2ms | 5ms |
| **Cache MISS (DB rápido)** | ~50ms | 100ms | 200ms |
| **Cache MISS (DB lento)** | ~200ms | 400ms | 500ms |
| **Timeout** | 30s | - | - |

### Otimizações Implementadas

1. **Cache HTTP (10 min)**
   - Reduz 99% das queries ao banco
   - Resposta instantânea para dados cacheados

2. **Importação Dinâmica**
   - Carrega controller sob demanda
   - Melhora startup da aplicação

3. **Connection Pooling**
   - Reutiliza conexões SQL
   - Reduz overhead de conexão

4. **Rate Limiting**
   - Protege contra overload
   - Distribui carga uniformemente

---

## Segurança

### Proteções Implementadas

| Vetor de Ataque | Proteção | Camada |
|-----------------|----------|--------|
| **SQL Injection** | Validação + Sanitização | Validator |
| **XSS** | Remoção de tags HTML | Validator |
| **Command Injection** | Detecção de padrões | Validator |
| **Path Traversal** | Remoção de `../` | Validator |
| **Brute Force** | Rate Limiting | Middleware |
| **DDoS** | Rate Limiting + Cache | Middleware |

### Autenticação

- **Opcional:** Endpoint público com limite por IP
- **Com API Key:** Autenticação + limite por tier
- **Sem API Key:** Acesso limitado por IP

---

## Integração com Swagger

### Documentação OpenAPI

A rota está completamente documentada no padrão OpenAPI 3.0, incluindo:

- ✅ **Parâmetros** (path, query, headers)
- ✅ **Schemas** de request/response
- ✅ **Exemplos** de uso
- ✅ **Códigos de status** e erros
- ✅ **Headers** de entrada/saída
- ✅ **Descrições** detalhadas

### Acesso à Documentação

**Swagger UI:** `GET /api-docs`

**Endpoint da Rota:**
```
GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/{familiaCodigo}
```

---

## Exemplos de Uso

### Exemplo 1: Busca Básica (sem API Key)

**Request:**
```bash
curl -X GET \
  'http://localhost:3000/api/lor0138/familia/dadosCadastrais/informacoesGerais/450000'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "identificacaoFamiliaCodigo": "450000",
    "identificacaoFamiliaDescricao": "FAMÍLIA TESTE"
  }
}
```

---

### Exemplo 2: Busca com API Key Premium

**Request:**
```bash
curl -X GET \
  'http://localhost:3000/api/lor0138/familia/dadosCadastrais/informacoesGerais/450000' \
  -H 'X-API-Key: api_key_premium_abc123xyz789' \
  -H 'X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "identificacaoFamiliaCodigo": "450000",
    "identificacaoFamiliaDescricao": "FAMÍLIA TESTE"
  }
}
```

**Headers:**
```http
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
X-Cache: HIT
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
```

---

### Exemplo 3: Código Inválido

**Request:**
```bash
curl -X GET \
  'http://localhost:3000/api/lor0138/familia/dadosCadastrais/informacoesGerais/ABC-123'
```

**Response (400):**
```json
{
  "error": "Bad Request",
  "message": "Código da familia contém caracteres inválidos. Use apenas letras, números e caracteres básicos",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/lor0138/familia/dadosCadastrais/informacoesGerais/ABC-123"
}
```

---

### Exemplo 4: Família Não Encontrada

**Request:**
```bash
curl -X GET \
  'http://localhost:3000/api/lor0138/familia/dadosCadastrais/informacoesGerais/999999'
```

**Response (404):**
```json
{
  "error": "Not Found",
  "message": "Família 999999 não encontrado",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/lor0138/familia/dadosCadastrais/informacoesGerais/999999"
}
```

---

## Troubleshooting

### Cache não está funcionando

**Sintomas:**
- Todas as respostas têm `X-Cache: MISS`
- Performance ruim mesmo para dados idênticos

**Soluções:**
1. Verificar se Redis está rodando
2. Verificar configuração do `cacheMiddleware`
3. Verificar se `condition` está correto (apenas 200)

---

### Rate limit muito restritivo

**Sintomas:**
- Muitos erros 429
- `X-RateLimit-Remaining: 0`

**Soluções:**
1. Usar API Key com tier mais alto
2. Aguardar reset do contador
3. Distribuir requisições ao longo do tempo

---

### Timeout frequente (504)

**Sintomas:**
- Erros 504 Gateway Timeout
- Requisições demoram 30+ segundos

**Soluções:**
1. Verificar saúde do SQL Server
2. Verificar saúde do Linked Server
3. Verificar índices nas tabelas
4. Verificar carga do Progress/Datasul

---

## Manutenção

### Alterando TTL do Cache

```typescript
const familiaCache = cacheMiddleware({
  ttl: 1200, // Alterar para 20 minutos
  // ...
});
```

### Alterando Rate Limits

Editar configuração no arquivo de middlewares:
```typescript
// userRateLimit.middleware.ts
const TIER_LIMITS = {
  free: 20,      // Aumentar de 10 para 20
  premium: 100,  // Aumentar de 60 para 100
  // ...
};
```

### Adicionando Novos Middlewares

```typescript
router.get(
  '/:familiaCodigo',
  optionalApiKeyAuth,
  userRateLimit,
  novoMiddleware,  // Adicionar aqui
  familiaCache,
  async (req, res, next) => {
    // ...
  }
);
```

---

## Referências

### Documentação Relacionada

- `informacoesGerais.controller.md` - Controller
- `informacoesGerais.service.md` - Service
- `informacoesGerais.validators.md` - Validators
- `cache.middleware.md` - Middleware de cache
- `userRateLimit.middleware.md` - Middleware de rate limit

### Padrões Utilizados

- RESTful API Design
- OpenAPI 3.0 Specification
- Express.js Router
- Middleware Pattern