# User Rate Limit Middleware

> Rate limiting baseado no tier/plano do usuário autenticado via API Key

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Limites por Tier](#limites-por-tier)
- [Arquitetura e Dependências](#arquitetura-e-dependências)
- [API Reference](#api-reference)
- [Casos de Uso](#casos-de-uso)
- [Headers HTTP](#headers-http)
- [Logs](#logs)
- [Performance](#performance)
- [Segurança](#segurança)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

---

## Visão Geral

### O que é?

Middleware de rate limiting baseado no tier/plano do usuário autenticado via API Key. Cada tier tem limites diferentes de requisições por minuto, hora e dia.

### Características

- ✅ **4 tiers** - Free, Premium, Enterprise, Admin
- ✅ **3 períodos** - Minuto, Hora, Dia
- ✅ **Headers RFC** - X-RateLimit-* padrão
- ✅ **Customizável** - Factory para casos específicos
- ✅ **Sliding window** - Mais justo que fixed window
- ✅ **Fallback** - Passa sem limite se não autenticado

### Tecnologias

- **UserRateLimiter** - Lógica de contadores
- **Express** - Framework web
- **TypeScript** - Tipagem forte

---

## Limites por Tier

### Tabela de Limites

| Tier | Por Minuto | Por Hora | Por Dia |
|------|------------|----------|---------|
| **Free** | 10 | 100 | 1.000 |
| **Premium** | 60 | 1.000 | 10.000 |
| **Enterprise** | 300 | 10.000 | 100.000 |
| **Admin** | 1.000 | 50.000 | 1.000.000 |

### Múltiplos Períodos

O sistema verifica **simultaneamente** os três períodos:

```typescript
// Exemplo: Free tier
- Minuto: 10 req/min   // Burst protection
- Hora: 100 req/hora   // Uso moderado
- Dia: 1.000 req/dia   // Uso total
```

**Bloqueio ocorre se qualquer limite for excedido.**

### Por que Três Períodos?

1. **Minuto** - Previne burst attacks (rajadas)
2. **Hora** - Controla uso sustentado
3. **Dia** - Limita volume total

---

## Arquitetura e Dependências

### Dependências Obrigatórias

#### 1. correlationId Middleware (ANTES)

Popula `req.id` para logs e rastreamento.

**Sem ele:**
- Logs não terão correlation ID
- Dificulta debugging

#### 2. apiKeyAuth Middleware (ANTES)

Popula `req.user` com `{ id, tier, name }`.

**Sem ele:**
- Rate limit será por IP (fallback)
- Não aplica limites por tier

#### 3. optionalApiKeyAuth (Alternativa)

Popula `req.user` SE houver API Key.

**Quando usar:**
- Endpoints públicos
- Autenticação opcional

---

### Ordem Correta de Middlewares

```typescript
router.get('/endpoint',
  correlationId,      // 1º - Correlation ID
  apiKeyAuth,         // 2º - Autenticação
  userRateLimit,      // 3º - Rate limit
  controller          // 4º - Lógica de negócio
);
```

**⚠️ CRÍTICO:**
Se ordem estiver errada, rate limit não funciona corretamente.

---

## API Reference

### userRateLimit()

```typescript
function userRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void
```

Middleware principal de rate limiting por usuário autenticado.

**Fluxo:**

1. **Verificação de Autenticação**
   - Se `req.user` existe → usa tier do usuário
   - Se `req.user` NÃO existe → passa sem rate limit

2. **Consulta ao UserRateLimiter**
   - Chama `UserRateLimiter.check(userId, tier)`
   - Retorna: `{ allowed, limit, remaining, resetAt, retryAfter }`

3. **Adiciona Headers HTTP**
   - `X-RateLimit-Limit`: Limite total
   - `X-RateLimit-Remaining`: Requisições restantes
   - `X-RateLimit-Reset`: Quando reseta (ISO 8601)
   - `Retry-After`: Segundos até poder tentar (se excedido)

4. **Decisão**
   - Se `allowed = true` → passa para próximo middleware
   - Se `allowed = false` → lança `RateLimitError` (429)

**Exemplo:**
```typescript
router.get('/protected',
  apiKeyAuth,
  userRateLimit,
  controller
);
```

---

### createUserRateLimit()

```typescript
function createUserRateLimit(
  options?: UserRateLimitOptions
): RequestHandler
```

Factory para criação de middleware de rate limit customizado.

**Opções:**

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| skipAuthenticated | boolean | false | Pula rate limit para autenticados |
| multiplier | number | 1 | Multiplicador dos limites padrão |

**Exemplo:**
```typescript
const heavyLimit = createUserRateLimit({ multiplier: 0.5 });

router.post('/heavy-operation',
  apiKeyAuth,
  heavyLimit,
  controller
);
```

---

### UserRateLimitOptions

```typescript
interface UserRateLimitOptions {
  skipAuthenticated?: boolean;
  multiplier?: number;
}
```

**skipAuthenticated:**
- `true` - Pula rate limit para usuários autenticados
- `false` - Aplica rate limit para todos (padrão)

**multiplier:**
- `< 1.0` - Reduz limite (endpoints pesados)
- `= 1.0` - Limite padrão (não altera)
- `> 1.0` - Aumenta limite (endpoints leves)

---

## Casos de Uso

### Caso 1: Endpoint Protegido (Autenticação Obrigatória)

Apenas usuários autenticados podem acessar.

```typescript
import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';

router.get('/protected',
  apiKeyAuth,        // Falha sem API Key
  userRateLimit,     // Rate limit por tier
  controller
);
```

**Request:**
```bash
curl -H "X-API-Key: premium-abc123" http://api/protected
```

**Response (200 OK):**
```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2025-10-07T10:30:00.000Z

{"success": true, "data": {...}}
```

**Response (429 Too Many Requests):**
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-10-07T10:30:00.000Z
Retry-After: 45

{
  "error": "RateLimitError",
  "message": "Muitas requisições. Tente novamente em alguns segundos."
}
```

---

### Caso 2: Endpoint Público com Rate Limit Opcional

Público, mas com rate limit diferenciado para autenticados.

```typescript
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';

router.get('/public',
  optionalApiKeyAuth,  // API Key opcional
  userRateLimit,       // Se autenticado: tier limit; se não: passa
  controller
);
```

**Request sem API Key:**
```bash
curl http://api/public
# Passa sem rate limit (fallback)
```

**Request com API Key:**
```bash
curl -H "X-API-Key: free-xyz789" http://api/public
# Rate limit: 10 req/min (Free tier)
```

---

### Caso 3: Rate Limit Customizado (Reduzir Limite)

Endpoint pesado: reduz limite para 50%.

```typescript
const heavyRateLimit = createUserRateLimit({ multiplier: 0.5 });

router.post('/heavy-operation',
  apiKeyAuth,
  heavyRateLimit,    // Premium: 30 req/min (60 * 0.5)
  controller
);
```

**Efeito:**

| Tier | Padrão | Com 0.5x | Com 0.25x |
|------|--------|----------|-----------|
| Free | 10/min | 5/min | 2.5/min |
| Premium | 60/min | 30/min | 15/min |
| Enterprise | 300/min | 150/min | 75/min |

**Quando reduzir (< 1):**
- Relatórios complexos
- Exports volumosos
- Operações de escrita
- Processamento CPU-intensive
- Queries com múltiplos JOINs

---

### Caso 4: Rate Limit Customizado (Aumentar Limite)

Endpoint leve em cache: aumenta limite para 5x.

```typescript
const cachedLimit = createUserRateLimit({ multiplier: 5 });

router.get('/popular-items',
  optionalApiKeyAuth,
  cachedLimit,    // Free: 50/min (10 * 5)
  controller
);
```

**Efeito:**

| Tier | Padrão | Com 2x | Com 5x |
|------|--------|--------|--------|
| Free | 10/min | 20/min | 50/min |
| Premium | 60/min | 120/min | 300/min |
| Enterprise | 300/min | 600/min | 1500/min |

**Quando aumentar (> 1):**
- Dados em cache (resposta rápida)
- Health checks
- Endpoints muito leves
- Reads simples sem joins

---

### Caso 5: Pular Rate Limit para Autenticados

Proteger apenas anônimos.

```typescript
const anonOnlyLimit = createUserRateLimit({ skipAuthenticated: true });

router.get('/hybrid',
  optionalApiKeyAuth,
  anonOnlyLimit,     // Apenas anônimos são limitados
  controller
);
```

**Comportamento:**

| Requisição | Rate Limit |
|------------|------------|
| Sem API Key | ✅ Aplicado (fallback) |
| Com API Key (Free) | ❌ Pulado |
| Com API Key (Premium) | ❌ Pulado |

**Quando usar:**
- Conteúdo público com "paywall suave"
- API pública com premium ilimitado
- Busca pública limitada

---

### Caso 6: Combinação de Opções

Autenticados ilimitados, anônimos muito restritos.

```typescript
const hybridLimit = createUserRateLimit({
  skipAuthenticated: true,  // Autenticados: sem limite
  multiplier: 0.1           // Anônimos: 10% do padrão
});

router.get('/premium-content',
  optionalApiKeyAuth,
  hybridLimit,
  controller
);
```

**Resultado:**
- **Autenticados:** Sem limite
- **Anônimos:** 1 req/min (10 * 0.1)

---

## Headers HTTP

### Headers de Resposta

Todo response inclui headers informativos seguindo RFC 6585:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2025-10-07T10:30:00.000Z
```

| Header | Descrição | Exemplo |
|--------|-----------|---------|
| X-RateLimit-Limit | Limite total no período | 60 |
| X-RateLimit-Remaining | Requisições restantes | 45 |
| X-RateLimit-Reset | Timestamp de reset (ISO 8601) | 2025-10-07T10:30:00.000Z |

### Header Retry-After

Adicionado apenas quando limite é excedido (429):

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
```

**Valor:** Segundos até poder tentar novamente.

### Cliente Inteligente

```javascript
// Frontend - implementar retry
fetch('/api/endpoint', {
  headers: { 'X-API-Key': apiKey }
})
.then(response => {
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`Aguardar ${retryAfter}s`);

    // Retry após delay
    setTimeout(() => retry(), retryAfter * 1000);
  }
});
```

---

## Logs

### Log 1: Sem Autenticação (Debug)

```json
{
  "level": "debug",
  "message": "Rate limit por IP (sem autenticação)",
  "correlationId": "req-001",
  "ip": "192.168.1.100"
}
```

**Quando ocorre:**
- `req.user` não existe
- Endpoint público sem API Key

---

### Log 2: Rate Limit OK (Debug)

```json
{
  "level": "debug",
  "message": "Rate limit OK",
  "correlationId": "req-001",
  "userId": "user-premium-001",
  "tier": "premium",
  "remaining": 45,
  "limit": 60
}
```

**Quando ocorre:**
- Requisição dentro do limite
- Usuário autenticado

---

### Log 3: Rate Limit Excedido (Warn)

```json
{
  "level": "warn",
  "message": "Rate limit por usuário excedido",
  "correlationId": "req-002",
  "userId": "user-free-002",
  "tier": "free",
  "limit": 10,
  "resetAt": "2025-10-07T10:16:00.000Z"
}
```

**Quando ocorre:**
- Limite excedido
- Status 429 será retornado

---

## Performance

### Impacto

**Latência:** Baixo (< 1ms por request)
- Consulta a `Map` em memória (O(1))
- Cálculos simples de contador
- Sem I/O (não acessa banco/redis)

**Memória:** Baixo (< 1KB por usuário)
- 1.000 usuários ≈ 1MB de RAM
- Limpeza automática de contadores expirados

### Escalabilidade

**⚠️ LIMITAÇÃO:**
- Rate limit é **POR SERVIDOR** (não distribuído)
- Em cluster: limite efetivo = N × limite configurado

**Exemplo:**
```
3 servidores com Premium (60/min)
= 180 req/min total (60 × 3)
```

**Solução:**
- Integrar `UserRateLimiter` com Redis
- Contadores compartilhados entre servidores

---

## Segurança

### Prevenção de Abuso

**Proteções:**
- ✅ **Múltiplos períodos** - Minuto + Hora + Dia
- ✅ **Sliding window** - Mais justo que fixed window
- ✅ **Headers informativos** - Cliente sabe quando retry
- ✅ **Logs de abuso** - Monitoramento de usuários problemáticos

### Limitações

**LIMITAÇÃO 1: Por User ID, não por IP**
- Atacante com muitas API Keys pode contornar
- Recomendado: combinar com rate limit por IP global

**Mitigação:**
```typescript
router.get('/sensitive',
  globalIpRateLimit,              // 100/min por IP
  apiKeyAuth,
  userRateLimit,                  // Por tier
  controller
);
```

**LIMITAÇÃO 2: skipAuthenticated Permite Ilimitado**
- Autenticados podem fazer requests ilimitados
- Atacante com key válida contorna limite

**Mitigação:**
```typescript
router.get('/public',
  globalIpRateLimit,              // Proteção base
  optionalApiKeyAuth,
  createUserRateLimit({
    skipAuthenticated: true       // Apenas anônimos limitados
  }),
  controller
);
```

---

## Boas Práticas

### ✅ DO

**1. Use com apiKeyAuth para endpoints protegidos**
```typescript
// ✅ Ordem correta
router.get('/protected',
  apiKeyAuth,
  userRateLimit,
  controller
);
```

**2. Use optionalApiKeyAuth para endpoints públicos**
```typescript
// ✅ Público com rate limit diferenciado
router.get('/public',
  optionalApiKeyAuth,
  userRateLimit,
  controller
);
```

**3. Reduza limite para operações pesadas**
```typescript
// ✅ Endpoint pesado = menos requisições
const heavyLimit = createUserRateLimit({ multiplier: 0.5 });
router.post('/reports', apiKeyAuth, heavyLimit, controller);
```

**4. Aumente limite para dados em cache**
```typescript
// ✅ Cache rápido = mais requisições
const cachedLimit = createUserRateLimit({ multiplier: 5 });
router.get('/cached', optionalApiKeyAuth, cachedLimit, controller);
```

**5. Combine com rate limit por IP**
```typescript
// ✅ Dupla proteção
router.get('/sensitive',
  globalIpRateLimit,
  apiKeyAuth,
  userRateLimit,
  controller
);
```

---

### ❌ DON'T

**1. Não use sem apiKeyAuth/optionalApiKeyAuth**
```typescript
// ❌ userRateLimit não funciona (req.user vazio)
router.get('/protected', userRateLimit, controller);

// ✅ Adicione autenticação antes
router.get('/protected', apiKeyAuth, userRateLimit, controller);
```

**2. Não esqueça correlationId**
```typescript
// ❌ Logs sem correlation ID
router.get('/endpoint', apiKeyAuth, userRateLimit, controller);

// ✅ Adicione correlation ID
router.get('/endpoint', correlationId, apiKeyAuth, userRateLimit, controller);
```

**3. Não use multiplier muito alto em endpoints críticos**
```typescript
// ❌ Muitas requisições em endpoint sensível
const writeLimit = createUserRateLimit({ multiplier: 10 });
router.post('/admin/delete', apiKeyAuth, writeLimit, controller);

// ✅ Reduza em operações de escrita
const writeLimit = createUserRateLimit({ multiplier: 0.3 });
router.post('/admin/delete', apiKeyAuth, writeLimit, controller);
```

**4. Não use skipAuthenticated sem proteção de IP**
```typescript
// ❌ Autenticados podem fazer requests ilimitados
router.get('/public',
  optionalApiKeyAuth,
  createUserRateLimit({ skipAuthenticated: true }),
  controller
);

// ✅ Adicione proteção de IP
router.get('/public',
  globalIpRateLimit,
  optionalApiKeyAuth,
  createUserRateLimit({ skipAuthenticated: true }),
  controller
);
```

**5. Não ignore headers de rate limit no frontend**
```javascript
// ❌ Não verifica limite
fetch('/api/endpoint');

// ✅ Implementa retry inteligente
fetch('/api/endpoint')
  .then(response => {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (remaining < 5) {
      console.warn('Perto do limite!');
    }
  });
```

---

## Troubleshooting

### Problema: Rate limit não funciona

**Sintoma:**
- Requisições não são limitadas
- Headers de rate limit não aparecem

**Causa:**
- `apiKeyAuth` não está antes de `userRateLimit`
- `req.user` não está populado

**Solução:**
```typescript
// ❌ Errado
router.get('/endpoint', userRateLimit, apiKeyAuth, controller);

// ✅ Correto
router.get('/endpoint', apiKeyAuth, userRateLimit, controller);
```

---

### Problema: Logs sem correlationId

**Sintoma:**
- Logs de rate limit sem `correlationId`
- Difícil rastrear requisições

**Causa:**
- `correlationId` middleware não registrado
- Ou registrado após `userRateLimit`

**Solução:**
```typescript
// Ordem correta
router.get('/endpoint',
  correlationId,     // 1º
  apiKeyAuth,        // 2º
  userRateLimit,     // 3º
  controller
);
```

---

### Problema: Headers não aparecem no cliente

**Sintoma:**
- Cliente não consegue ler `X-RateLimit-*`
- `response.headers.get('X-RateLimit-Limit')` retorna null

**Causa:**
- CORS não expõe headers customizados

**Solução:**
```typescript
// cors.config.ts
app.use(cors({
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After'
  ]
}));
```

---

### Problema: Limite multiplicado em cluster

**Sintoma:**
- Em cluster com 3 servidores
- Free (10/min) permite 30 req/min
- Limite efetivo = 3× configurado

**Causa:**
- Rate limit não é distribuído
- Cada servidor tem seus próprios contadores

**Solução:**
```typescript
// Integrar UserRateLimiter com Redis
import Redis from 'ioredis';

const redis = new Redis();

// Modificar UserRateLimiter para usar Redis
// (implementação necessária)
```

---

### Problema: multiplier não funciona

**Sintoma:**
- `multiplier: 0.5` não reduz limite
- Headers mostram limite original

**Causa:**
- Multiplier só afeta headers enviados
- Lógica interna usa limite padrão

**Solução:**
```typescript
// ⚠️ LIMITAÇÃO CONHECIDA
// Multiplier apenas ajusta headers
// UserRateLimiter sempre usa limite padrão do tier

// Workaround: ajuste o tier do usuário diretamente
```

---

## Referências

### Arquivos Relacionados

- `UserRateLimiter.ts` - Lógica de contadores
- `apiKeyAuth.middleware.ts` - Autenticação
- `correlationId.middleware.ts` - Correlation ID
- `errorHandler.middleware.ts` - Tratamento de erros
- `apiKey.types.ts` - Tipos de tier

### Links Externos

- [RFC 6585 - 429 Status](https://tools.ietf.org/html/rfc6585#section-4) - Status 429
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques) - Google Cloud

### Conceitos

- **Rate Limiting** - Limitar taxa de requisições
- **Tier** - Nível/plano do usuário
- **Sliding Window** - Janela deslizante de tempo
- **Burst Protection** - Proteção contra rajadas
- **Retry-After** - Header de retry

---

## Resumo

### O que é?

Middleware de rate limiting baseado no tier/plano do usuário autenticado, com limites diferenciados por Free, Premium, Enterprise e Admin.

### Exports

| Export | Tipo | Descrição |
|--------|------|-----------|
| userRateLimit | Middleware | Middleware principal |
| createUserRateLimit | Function | Factory customizado |
| UserRateLimitOptions | Interface | Opções de configuração |

### Limites por Tier

| Tier | Por Minuto | Por Hora | Por Dia |
|------|------------|----------|---------|
| Free | 10 | 100 | 1.000 |
| Premium | 60 | 1.000 | 10.000 |
| Enterprise | 300 | 10.000 | 100.000 |
| Admin | 1.000 | 50.000 | 1.000.000 |

### Dependências

```typescript
1. correlationId   // Primeiro
2. apiKeyAuth      // Segundo
3. userRateLimit   // Terceiro
4. controller      // Último
```

### Opções do Factory

| Opção | Padrão | Quando Usar |
|-------|--------|-------------|
| skipAuthenticated | false | Limitar apenas anônimos |
| multiplier | 1 | Ajustar limites (< 1 reduz, > 1 aumenta) |

---

**Última atualização:** 2025-10-07