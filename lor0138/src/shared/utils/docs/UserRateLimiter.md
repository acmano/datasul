# User Rate Limiter

> **Sistema de rate limiting por usuário com múltiplas janelas de tempo**

Rate limiter baseado em sliding window com três janelas simultâneas (minuto, hora, dia) e limites por tier de usuário.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Conceitos](#conceitos)
- [Tiers e Limites](#tiers-e-limites)
- [Algoritmo](#algoritmo)
- [API](#api)
- [Integração](#integração)
- [Exemplos de Uso](#exemplos-de-uso)
- [Monitoramento](#monitoramento)
- [Limitações](#limitações)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

### O que é?

**UserRateLimiter** é um sistema de controle de taxa de requisições por usuário usando sliding window com três janelas de tempo simultâneas.

### Características Principais

- ✅ **Multi-Window** - 3 janelas simultâneas (minuto, hora, dia)
- ✅ **Tier-Based** - Limites diferentes por nível de usuário
- ✅ **Sliding Window** - Janelas deslizantes automáticas
- ✅ **In-Memory** - Rápido e eficiente (Map)
- ✅ **Auto-Cleanup** - Garbage collection automático
- ✅ **Observable** - Estatísticas e logs detalhados
- ✅ **Type Safe** - Interface TypeScript completa

### Quando Usar?

| Cenário | Descrição |
|---------|-----------|
| **API Protection** | Proteger endpoints contra abuso |
| **Fair Usage** | Garantir uso justo entre usuários |
| **Tier Enforcement** | Diferenciar usuários por plano |
| **DoS Prevention** | Prevenir ataques de negação de serviço |
| **Quota Management** | Controlar quotas diárias/horárias |

---

## Conceitos

### Sliding Window

Janela de tempo que "desliza" continuamente ao invés de resetar em intervalos fixos.

**Fixed Window (Problema):**
```
00:00 ──────────── 01:00 ──────────── 02:00
  │                 │                 │
  └─ Reset          └─ Reset          └─ Reset

Usuário pode fazer:
- 100 req às 00:59
- 100 req às 01:00
= 200 req em 1 minuto! ❌
```

**Sliding Window (Solução):**
```
Qualquer momento
     │
     ▼
─────┼─────────────────────────────────
     │◄──── 60 segundos ────►│
     │                       │
  Começo                   Fim

Janela sempre cobre últimos 60 segundos
Limite respeitado em qualquer ponto ✅
```

**Implementação:**
- Cada janela tem `resetAt` timestamp
- Quando `now >= resetAt`: reseta contador
- Novo `resetAt = now + duration`

---

### Multi-Window Rate Limiting

Sistema com múltiplas janelas simultâneas, cada uma com seu próprio limite.

**Por que 3 janelas?**

| Janela | Propósito | Protege Contra |
|--------|-----------|----------------|
| **Minuto** | Anti-burst | Spam, ataques rápidos |
| **Hora** | Uso sustentado | Scraping, abuso moderado |
| **Dia** | Quota diária | Uso excessivo, planos |

**Exemplo de Proteção:**

```
Usuário tenta 1000 req/minuto:
✅ Minuto: BLOQUEADO (limite: 10/min)
❌ Hora: Não chega a verificar
❌ Dia: Não chega a verificar
```

```
Usuário tenta 200 req/hora (2/min):
✅ Minuto: OK (2 < 10)
✅ Hora: BLOQUEADO (200 > 100)
❌ Dia: Não chega a verificar
```

**Regra:**
Requisição bloqueada se **QUALQUER** janela exceder limite.

---

### Algoritmo de Verificação

```
1. Buscar record do usuário
   │
   ├─ Existe? → Usar existing
   └─ Não existe? → Criar novo

2. Resetar janelas expiradas
   │
   ├─ now >= minute.resetAt? → Reset
   ├─ now >= hour.resetAt? → Reset
   └─ now >= day.resetAt? → Reset

3. Verificar todas as janelas
   │
   ├─ Minuto: count < limit?
   ├─ Hora: count < limit?
   └─ Dia: count < limit?

4. Decisão
   │
   ├─ Alguma excedida?
   │  └─ Retornar FALSE + retry info
   │
   └─ Todas OK?
      ├─ Incrementar contadores
      └─ Retornar TRUE + remaining
```

---

## Tiers e Limites

### Hierarquia de Tiers

```
FREE         ← Básico (gratuito)
  ↓
PREMIUM      ← Pago (individual)
  ↓
ENTERPRISE   ← Pago (empresas)
  ↓
ADMIN        ← Administrativo
```

---

### Limites por Tier

| Tier | Por Minuto | Por Hora | Por Dia | Uso |
|------|------------|----------|---------|-----|
| **FREE** | 10 | 100 | 1,000 | Teste, hobby |
| **PREMIUM** | 60 | 1,000 | 10,000 | Profissional |
| **ENTERPRISE** | 300 | 10,000 | 100,000 | Empresas |
| **ADMIN** | 1,000 | 50,000 | 1,000,000 | Admin/Interno |

---

### Progressão de Limites

**Por Minuto:**
```
FREE:       10 req/min   (baseline)
PREMIUM:    60 req/min   (6x)
ENTERPRISE: 300 req/min  (30x)
ADMIN:      1000 req/min (100x)
```

**Por Hora:**
```
FREE:       100 req/h    (baseline)
PREMIUM:    1,000 req/h  (10x)
ENTERPRISE: 10,000 req/h (100x)
ADMIN:      50,000 req/h (500x)
```

**Por Dia:**
```
FREE:       1k req/dia      (baseline)
PREMIUM:    10k req/dia     (10x)
ENTERPRISE: 100k req/dia    (100x)
ADMIN:      1M req/dia      (1000x)
```

---

### Cenários de Uso

**FREE (Usuário testando):**
```
10 req/min = 1 req a cada 6 segundos
100 req/h  = 1 req a cada 36 segundos (média)
1k req/dia = 1 req a cada 86 segundos (média)
```

**PREMIUM (Desenvolvedor ativo):**
```
60 req/min  = 1 req/segundo
1k req/h    = 1 req a cada 3.6 segundos (média)
10k req/dia = 1 req a cada 8.6 segundos (média)
```

**ENTERPRISE (Aplicação em produção):**
```
300 req/min  = 5 req/segundo
10k req/h    = 2.7 req/segundo (média)
100k req/dia = 1.15 req/segundo (média)
```

---

## API

### RateLimitResult Interface

```typescript
interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}
```

**Campos:**
- `allowed` - Se requisição é permitida
- `limit` - Limite da janela verificada
- `remaining` - Requisições restantes
- `resetAt` - Timestamp quando reseta (ms)
- `retryAfter` - Segundos até poder tentar (apenas se `allowed=false`)

---

### UserRateLimiter.check()

Verifica se requisição está dentro do rate limit.

**Assinatura:**
```typescript
static check(userId: string, tier: UserTier): RateLimitResult
```

**Parâmetros:**
- `userId: string` - ID único do usuário
- `tier: UserTier` - Tier do usuário (FREE, PREMIUM, etc)

**Retorno:** `RateLimitResult`

**Exemplo - Permitido:**
```typescript
const result = UserRateLimiter.check('user-123', UserTier.PREMIUM);

// Resultado:
{
  allowed: true,
  limit: 60,        // Limite por minuto
  remaining: 45,    // 45 requisições restantes
  resetAt: 1704384060000  // Reset em 1 minuto
}
```

**Exemplo - Bloqueado:**
```typescript
const result = UserRateLimiter.check('user-123', UserTier.FREE);

// Resultado:
{
  allowed: false,
  limit: 10,
  remaining: 0,
  resetAt: 1704384060000,
  retryAfter: 45    // Aguardar 45 segundos
}
```

**Comportamento:**
1. Busca ou cria record do usuário
2. Reseta janelas expiradas
3. Verifica todas as janelas (minuto, hora, dia)
4. Se alguma excedida: retorna janela mais restritiva
5. Se todas OK: incrementa contadores

---

### UserRateLimiter.getStats()

Retorna estatísticas de uso.

**Assinatura:**
```typescript
static getStats(userId?: string): any
```

**Parâmetros:**
- `userId?: string` - ID do usuário (opcional)

**Retorno:**
- Com `userId`: Estatísticas do usuário específico
- Sem `userId`: Estatísticas gerais

**Exemplo - Usuário Específico:**
```typescript
const stats = UserRateLimiter.getStats('user-123');

// Retorna:
{
  userId: 'user-123',
  tier: 'premium',
  usage: {
    minute: {
      current: 45,
      limit: 60,
      remaining: 15,
      resetAt: Date(2025-10-07T14:31:00Z)
    },
    hour: {
      current: 523,
      limit: 1000,
      remaining: 477,
      resetAt: Date(2025-10-07T15:30:00Z)
    },
    day: {
      current: 7234,
      limit: 10000,
      remaining: 2766,
      resetAt: Date(2025-10-08T14:30:00Z)
    }
  }
}
```

**Exemplo - Estatísticas Gerais:**
```typescript
const stats = UserRateLimiter.getStats();

// Retorna:
{
  totalUsers: 1523,
  byTier: {
    free: 1200,
    premium: 280,
    enterprise: 40,
    admin: 3
  }
}
```

---

### UserRateLimiter.resetUser()

Reseta limites de um usuário (admin).

**Assinatura:**
```typescript
static resetUser(userId: string): void
```

**Parâmetros:**
- `userId: string` - ID do usuário a resetar

**Comportamento:**
- Remove record do usuário
- Próxima requisição cria novo record com contadores zerados

**Exemplo:**
```typescript
// Admin resetando usuário bloqueado
UserRateLimiter.resetUser('user-123');

// Log gerado:
// Rate limit resetado { userId: 'user-123' }

// Próxima requisição do usuário:
const result = UserRateLimiter.check('user-123', tier);
// result.remaining = limit (contadores zerados)
```

⚠️ **Atenção:** Operação administrativa, requer autenticação!

---

### UserRateLimiter.cleanup()

Limpa records antigos (garbage collection).

**Assinatura:**
```typescript
static cleanup(): void
```

**Comportamento:**
- Remove records inativos (sem uso há 48h+)
- Executado automaticamente a cada hora
- Pode ser chamado manualmente

**Critério de Remoção:**
```
Record removido se:
now > record.day.resetAt + 24h

Ou seja:
Última janela de dia expirou há mais de 24h
```

**Exemplo:**
```typescript
// Manual cleanup
UserRateLimiter.cleanup();

// Log gerado:
// Rate limiter cleanup { recordsRemaining: 1523 }
```

---

## Integração

### Middleware Express

```typescript
import { UserRateLimiter } from '@shared/utils/UserRateLimiter';
import { UserTier } from '@shared/types/apiKey.types';

function userRateLimitMiddleware(req, res, next) {
  const userId = req.user?.id;
  const tier = req.user?.tier || UserTier.FREE;

  if (!userId) {
    return next();  // Sem usuário, sem rate limit
  }

  const result = UserRateLimiter.check(userId, tier);

  // Headers RFC 6585
  res.setHeader('X-RateLimit-Limit', result.limit.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', result.resetAt.toString());

  if (!result.allowed) {
    res.setHeader('Retry-After', result.retryAfter!.toString());

    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${result.retryAfter}s`,
      limit: result.limit,
      resetAt: new Date(result.resetAt).toISOString()
    });
  }

  next();
}

// Aplicar em rotas
app.use('/api', userRateLimitMiddleware);
```

---

### Controller

```typescript
import { UserRateLimiter } from '@shared/utils/UserRateLimiter';

export class ItemController {
  static getItem = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const tier = req.user.tier;

    // Verificar rate limit
    const rateLimit = UserRateLimiter.check(userId, tier);

    if (!rateLimit.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded. Retry after ${rateLimit.retryAfter}s`
      );
    }

    // Processar requisição
    const item = await ItemService.find(req.params.codigo);

    res.json({
      success: true,
      data: item,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        resetAt: new Date(rateLimit.resetAt)
      }
    });
  });
}
```

---

### Admin Endpoints

```typescript
// GET /admin/rate-limits
app.get('/admin/rate-limits', adminOnly, (req, res) => {
  const stats = UserRateLimiter.getStats();
  res.json(stats);
});

// GET /admin/rate-limits/:userId
app.get('/admin/rate-limits/:userId', adminOnly, (req, res) => {
  const stats = UserRateLimiter.getStats(req.params.userId);

  if (!stats) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(stats);
});

// DELETE /admin/rate-limits/:userId
app.delete('/admin/rate-limits/:userId', adminOnly, (req, res) => {
  UserRateLimiter.resetUser(req.params.userId);

  res.json({
    success: true,
    message: 'Rate limit reset successfully'
  });
});

// POST /admin/rate-limits/cleanup
app.post('/admin/rate-limits/cleanup', adminOnly, (req, res) => {
  UserRateLimiter.cleanup();

  res.json({
    success: true,
    message: 'Cleanup completed'
  });
});
```

---

## Exemplos de Uso

### 1. Verificação Básica

```typescript
import { UserRateLimiter } from '@shared/utils/UserRateLimiter';
import { UserTier } from '@shared/types/apiKey.types';

// Usuário FREE fazendo requisição
const result = UserRateLimiter.check('user-123', UserTier.FREE);

if (result.allowed) {
  console.log(`✅ Permitido. Restantes: ${result.remaining}`);
  // Processar requisição
} else {
  console.log(`❌ Bloqueado. Retry em ${result.retryAfter}s`);
  // Retornar 429
}
```

---

### 2. Headers de Rate Limit

```typescript
function addRateLimitHeaders(res, result: RateLimitResult) {
  res.setHeader('X-RateLimit-Limit', result.limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetAt);

  if (!result.allowed) {
    res.setHeader('Retry-After', result.retryAfter!);
  }
}

// Uso no middleware
app.use((req, res, next) => {
  const result = UserRateLimiter.check(req.user.id, req.user.tier);

  addRateLimitHeaders(res, result);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: result.retryAfter
    });
  }

  next();
});
```

---

### 3. Dashboard de Estatísticas

```typescript
app.get('/dashboard/rate-limits', async (req, res) => {
  const userId = req.user.id;
  const stats = UserRateLimiter.getStats(userId);

  res.render('dashboard', {
    user: req.user,
    rateLimit: {
      minute: {
        used: stats.usage.minute.current,
        total: stats.usage.minute.limit,
        percentage: (stats.usage.minute.current / stats.usage.minute.limit) * 100,
        resetAt: stats.usage.minute.resetAt
      },
      hour: {
        used: stats.usage.hour.current,
        total: stats.usage.hour.limit,
        percentage: (stats.usage.hour.current / stats.usage.hour.limit) * 100,
        resetAt: stats.usage.hour.resetAt
      },
      day: {
        used: stats.usage.day.current,
        total: stats.usage.day.limit,
        percentage: (stats.usage.day.current / stats.usage.day.limit) * 100,
        resetAt: stats.usage.day.resetAt
      }
    }
  });
});
```

---

### 4. Upgrade de Tier

```typescript
async function upgradeTier(userId: string, newTier: UserTier) {
  // Atualizar tier no banco
  await database.updateUser(userId, { tier: newTier });

  // Resetar rate limit para aplicar novos limites
  UserRateLimiter.resetUser(userId);

  log.info('Tier upgraded', {
    userId,
    newTier,
    limits: RATE_LIMIT_CONFIGS[newTier].limits
  });
}

// Uso
await upgradeTier('user-123', UserTier.PREMIUM);
```

---

### 5. Monitoramento e Alertas

```typescript
setInterval(() => {
  const stats = UserRateLimiter.getStats();

  // Métricas
  metrics.gauge('rate_limiter.total_users', stats.totalUsers);
  metrics.gauge('rate_limiter.free_users', stats.byTier.free);
  metrics.gauge('rate_limiter.premium_users', stats.byTier.premium);

  // Alerta se muitos usuários ativos
  if (stats.totalUsers > 10000) {
    alerts.notify('High active users in rate limiter', {
      count: stats.totalUsers
    });
  }
}, 60000);  // A cada minuto
```

---

## Monitoramento

### Métricas Importantes

**Usuários Ativos:**
```typescript
const stats = UserRateLimiter.getStats();
console.log('Total users:', stats.totalUsers);
console.log('By tier:', stats.byTier);
```

**Taxa de Bloqueio:**
```typescript
let totalRequests = 0;
let blockedRequests = 0;

// No middleware
const result = UserRateLimiter.check(userId, tier);
totalRequests++;

if (!result.allowed) {
  blockedRequests++;
}

// Taxa de bloqueio
const blockRate = (blockedRequests / totalRequests) * 100;
console.log(`Block rate: ${blockRate}%`);
```

**Uso por Usuário:**
```typescript
const stats = UserRateLimiter.getStats('user-123');

console.log('Usage:', {
  minute: `${stats.usage.minute.current}/${stats.usage.minute.limit}`,
  hour: `${stats.usage.hour.current}/${stats.usage.hour.limit}`,
  day: `${stats.usage.day.current}/${stats.usage.day.limit}`
});
```

---

### Logs

**Rate Limit Excedido:**
```
WARN Rate limit excedido {
  userId: 'user-123',
  tier: 'free',
  limit: 10,
  resetAt: 2025-10-07T14:31:00.000Z
}
```

**Cleanup:**
```
DEBUG Rate limiter cleanup {
  recordsRemaining: 1523
}
```

**Reset Manual:**
```
INFO Rate limit resetado {
  userId: 'user-123'
}
```

---

## Limitações

### In-Memory Storage

**Problema:**
- Dados voláteis (perdem em restart)
- Não compartilhado entre instâncias
- Cresce com número de usuários

**Impacto:**
```
Single instance:
✅ Funciona perfeitamente

Multiple instances (load balancer):
❌ Cada instância tem contadores separados
❌ Usuário pode contornar limites alternando instâncias

Restart:
❌ Todos contadores resetam
```

**Solução:**
```typescript
// Para produção com múltiplas instâncias,
// substituir por Redis:

class UserRateLimiter {
  static async check(userId, tier) {
    // Usar Redis ao invés de Map
    const key = `rate:${userId}:minute`;
    const count = await redis.incr(key);
    await redis.expire(key, 60);

    if (count > limit) {
      return { allowed: false, ... };
    }

    return { allowed: true, ... };
  }
}
```

---

### Memory Leak Risk

**Problema:**
- Map cresce indefinidamente
- Usuários inativos não são removidos automaticamente

**Mitigação:**
- Cleanup automático a cada hora
- Remove records inativos há 48h+

**Monitoramento:**
```typescript
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  const recordCount = UserRateLimiter.getStats().totalUsers;

  console.log('Memory:', memoryUsage.heapUsed / 1024 / 1024, 'MB');
  console.log('Records:', recordCount);

  // Alerta se muito grande
  if (recordCount > 100000) {
    alert('Rate limiter records too high');
  }
}, 60000);
```

---

### Precision Trade-offs

**Sliding Window vs Fixed Window:**

Implementação atual usa **pseudo-sliding window**:
- Janelas resetam em intervalos fixos
- Não é sliding window verdadeiro
- Mais eficiente mas menos preciso

**Exemplo:**
```
Janela de minuto reseta exatamente em:
14:30:00, 14:31:00, 14:32:00, etc

Usuário pode:
- 10 req às 14:30:59
- 10 req às 14:31:00
= 20 req em 1 segundo

True sliding window:
- Conta últimos 60s sempre
- Nunca permite mais de 10/min
- Mais complexo e custoso
```

---

## Boas Práticas

### ✅ DO

**1. Use headers padrão**
```typescript
// ✅ Headers RFC 6585
res.setHeader('X-RateLimit-Limit', result.limit);
res.setHeader('X-RateLimit-Remaining', result.remaining);
res.setHeader('X-RateLimit-Reset', result.resetAt);
res.setHeader('Retry-After', result.retryAfter);
```

**2. Inclua info no erro**
```typescript
// ✅ Erro informativo
return res.status(429).json({
  error: 'Too Many Requests',
  message: `Rate limit: ${result.limit} req/min. Retry in ${result.retryAfter}s`,
  limit: result.limit,
  remaining: 0,
  resetAt: new Date(result.resetAt).toISOString()
});
```

**3. Monitore estatísticas**
```typescript
// ✅ Métricas em dashboard
const stats = UserRateLimiter.getStats();
metrics.gauge('rate_limiter.users', stats.totalUsers);
```

**4. Use tiers apropriados**
```typescript
// ✅ Tier baseado em plano
const tier = user.subscription === 'pro'
  ? UserTier.PREMIUM
  : UserTier.FREE;
```

**5. Reset ao mudar tier**
```typescript
// ✅ Aplicar novos limites imediatamente
async function upgradeTier(userId, newTier) {
  await db.updateUser(userId, { tier: newTier });
  UserRateLimiter.resetUser(userId);  // Importante!
}
```

---

### ❌ DON'T

**1. Não confie apenas em memória para produção**
```typescript
// ❌ Single point of failure
// Em múltiplas instâncias, cada uma tem contadores separados

// ✅ Use Redis para produção
```

**2. Não exponha reset endpoint publicamente**
```typescript
// ❌ Qualquer um pode resetar
app.post('/rate-limit/reset/:userId', (req, res) => {
  UserRateLimiter.resetUser(req.params.userId);
});

// ✅ Apenas admin
app.post('/admin/rate-limit/reset/:userId', adminOnly, (req, res) => {
  UserRateLimiter.resetUser(req.params.userId);
});
```

**3. Não esqueça de incrementar contadores**
```typescript
// ❌ Verifica mas não incrementa
const result = UserRateLimiter.check(userId, tier);
// ... processa requisição sem incrementar

// ✅ check() já incrementa automaticamente
```

**4. Não ignore cleanup**
```typescript
// ❌ Memory leak
// Sem cleanup, Map cresce infinitamente

// ✅ Cleanup automático ativo (já implementado)
```

**5. Não use tiers errados**
```typescript
// ❌ Todos como FREE
const result = UserRateLimiter.check(userId, UserTier.FREE);

// ✅ Tier do usuário
const result = UserRateLimiter.check(userId, user.tier);
```

---

## Troubleshooting

### Limites não resetam

**Sintomas:**
- Contador não zera
- Sempre bloqueado

**Verificar:**
```typescript
const stats = UserRateLimiter.getStats('user-123');
console.log('Reset times:', {
  minute: stats.usage.minute.resetAt,
  hour: stats.usage.hour.resetAt,
  day: stats.usage.day.resetAt
});

// Verificar se resetAt está no futuro
const now = Date.now();
console.log('Now:', new Date(now));
```

**Solução:**
```typescript
// Reset manual
UserRateLimiter.resetUser('user-123');
```

---

### Memory usage alto

**Sintomas:**
- Processo usa muita RAM
- Lentidão progressiva

**Verificar:**
```typescript
const stats = UserRateLimiter.getStats();
console.log('Total records:', stats.totalUsers);

const memoryUsage = process.memoryUsage();
console.log('Heap used:', memoryUsage.heapUsed / 1024 / 1024, 'MB');
```

**Solução:**
```typescript
// 1. Cleanup manual
UserRateLimiter.cleanup();

// 2. Verificar se cleanup automático está rodando
// (setInterval no final do arquivo)

// 3. Considerar Redis para produção
```

---

### Contadores inconsistentes (múltiplas instâncias)

**Sintomas:**
- Usuário ultrapassa limites
- Contadores diferentes por servidor

**Causa:**
- In-memory não é compartilhado
- Cada instância tem sua própria Map

**Solução:**
```typescript
// Migrar para Redis (distribuído)

import Redis from 'ioredis';
const redis = new Redis();

class UserRateLimiter {
  static async check(userId, tier) {
    const key = `rate:${userId}:minute`;

    // Atomic increment
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, 60);

    const [[, count]] = await pipeline.exec();

    if (count > limit) {
      return { allowed: false };
    }

    return { allowed: true };
  }
}
```

---

### Usuário sempre bloqueado

**Sintomas:**
- Usuário não consegue fazer requisições
- Sempre retorna 429

**Verificar:**
```typescript
const stats = UserRateLimiter.getStats('user-123');
console.log('Usage:', stats.usage);
console.log('Tier:', stats.tier);

// Verificar limites do tier
const config = RATE_LIMIT_CONFIGS[stats.tier];
console.log('Limits:', config.limits);
```

**Solução:**
```typescript
// 1. Reset do usuário
UserRateLimiter.resetUser('user-123');

// 2. Verificar tier correto
// Talvez tier errado (FREE ao invés de PREMIUM)

// 3. Upgrade de tier se necessário
await upgradeTier('user-123', UserTier.PREMIUM);
```

---

## Referências

### Arquivos Relacionados

- `apiKey.types.ts` - Definição de tiers e limites
- `userRateLimit.middleware.ts` - Middleware
- `apiKeyAuth.middleware.ts` - Autenticação
- `logger.ts` - Sistema de logs

### Algoritmos

- [Token Bucket](https://en.wikipedia.org/wiki/Token_bucket) - Alternativa
- [Leaky Bucket](https://en.wikipedia.org/wiki/Leaky_bucket) - Alternativa
- [Sliding Window](https://konghq.com/blog/engineering/how-to-design-a-scalable-rate-limiting-algorithm) - Kong HQ

### Especificações

- [RFC 6585 - HTTP 429](https://tools.ietf.org/html/rfc6585#section-4) - Too Many Requests
- [RFC 7231 - Retry-After](https://tools.ietf.org/html/rfc7231#section-7.1.3) - Header

### Conceitos

- **Rate Limiting** - Controle de taxa de requisições
- **Sliding Window** - Janela deslizante
- **Multi-Window** - Múltiplas janelas simultâneas
- **Tier-Based** - Limites por nível
- **Garbage Collection** - Limpeza de memória

---

**Última atualização:** 2025-10-07