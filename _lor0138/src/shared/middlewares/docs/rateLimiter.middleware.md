# Rate Limiter Middleware

> Middlewares de Rate Limiting para proteger a API contra abuso e garantir disponibilidade do serviço

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tipos de Rate Limiters](#tipos-de-rate-limiters)
- [API Reference](#api-reference)
- [Exemplos de Uso](#exemplos-de-uso)
- [Configurações](#configurações)
- [Headers de Resposta](#headers-de-resposta)
- [Ambientes](#ambientes)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

---

## Visão Geral

### O que é?

Sistema de rate limiting para proteger a API contra requisições excessivas, abuso e garantir disponibilidade do serviço. Implementa diferentes estratégias baseadas em IP, endpoint e recurso específico.

### Características

- ✅ **Múltiplas estratégias** - Geral, restritivo e por recurso
- ✅ **Headers RFC** - RateLimit-* padrão
- ✅ **Status 429** - Too Many Requests
- ✅ **Skip em dev** - Configurável via env vars
- ✅ **Customizável** - Factory para casos específicos
- ✅ **IPv4/IPv6** - Suporte automático

### Tecnologias

- **express-rate-limit** - ^6.x (rate limiting)
- **Express** - Framework web
- **TypeScript** - Tipagem

---

## Tipos de Rate Limiters

### 1. apiLimiter - Geral

Rate limiter geral para toda a API. Aplica limite baseado em IP.

**Configuração:**
- Window: **15 minutos**
- Limite: **100 requisições** por IP
- Skip em dev: **Sim** (se SKIP_RATE_LIMIT=true)

**Quando usar:**
- Proteção geral da API
- Endpoints públicos
- Base de todos os limites

### 2. strictLimiter - Restritivo

Rate limiter mais agressivo para endpoints críticos ou custosos.

**Configuração:**
- Window: **5 minutos**
- Limite: **20 requisições** por IP
- Skip em dev: **Não** (sempre ativo)

**Quando usar:**
- Relatórios complexos
- Operações de escrita (POST, PUT, DELETE)
- Queries com múltiplos JOINs
- Jobs assíncronos
- APIs de terceiros (proxies)

### 3. itemLimiter - Por Recurso

Rate limiter baseado em combinação de IP + recurso para prevenir consultas repetidas.

**Configuração:**
- Window: **1 minuto**
- Limite: **10 requisições** por item
- Key: `item:{itemCodigo}` (sem IP)
- Skip em dev: **Sim** (se SKIP_RATE_LIMIT=true)

**Quando usar:**
- Prevenir scraping de catálogo
- Limitar consultas repetidas do mesmo recurso
- Proteger cache de requisições excessivas

---

## API Reference

### apiLimiter

```typescript
export const apiLimiter: RateLimitRequestHandler
```

Rate limiter geral para toda a API.

**Configuração:**
```typescript
{
  windowMs: 900000,    // 15 minutos
  max: 100,            // 100 req/IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: development + SKIP_RATE_LIMIT
}
```

**Exemplo:**
```typescript
import { apiLimiter } from '@shared/middlewares/rateLimiter.middleware';

app.use('/api', apiLimiter);
```

---

### strictLimiter

```typescript
export const strictLimiter: RateLimitRequestHandler
```

Rate limiter restritivo para endpoints críticos.

**Configuração:**
```typescript
{
  windowMs: 300000,    // 5 minutos
  max: 20,             // 20 req/IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: undefined      // Sempre ativo
}
```

**Exemplo:**
```typescript
import { strictLimiter } from '@shared/middlewares/rateLimiter.middleware';

router.get('/relatorios/complexo', strictLimiter, controller.getRelatorio);
router.post('/items', strictLimiter, controller.createItem);
```

---

### itemLimiter

```typescript
export const itemLimiter: RateLimitRequestHandler
```

Rate limiter por recurso específico (item).

**Configuração:**
```typescript
{
  windowMs: 60000,     // 1 minuto
  max: 10,             // 10 req/item
  keyGenerator: (req) => `item:${req.params.itemCodigo}`,
  standardHeaders: true,
  legacyHeaders: false,
  skip: development + SKIP_RATE_LIMIT
}
```

**Exemplo:**
```typescript
import { itemLimiter } from '@shared/middlewares/rateLimiter.middleware';

router.get('/items/:itemCodigo', itemLimiter, controller.getItem);
```

**⚠️ IMPORTANTE:**
- A chave é baseada **APENAS no itemCodigo**
- **NÃO considera IP** (diferente de apiLimiter)
- Todos os clientes compartilham o mesmo limite por item

---

### createCustomRateLimiter()

```typescript
function createCustomRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipInDev?: boolean;
  keyGenerator?: (req: Request) => string;
}): RateLimitRequestHandler
```

Factory function para criar middlewares de rate limiting customizados.

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| windowMs | number | ✅ | Janela de tempo em ms |
| max | number | ✅ | Número máximo de requisições |
| message | string | ❌ | Mensagem de erro customizada |
| skipInDev | boolean | ❌ | Skip em desenvolvimento (default: false) |
| keyGenerator | Function | ❌ | Função para gerar chave customizada |

**Exemplo:**
```typescript
const customLimiter = createCustomRateLimiter({
  windowMs: 60000,  // 1 minuto
  max: 5,           // 5 requisições
  message: 'Limite customizado excedido',
  skipInDev: true,
  keyGenerator: (req) => req.headers['x-user-id'] || req.ip
});

router.post('/expensive-operation', customLimiter, controller.handle);
```

---

## Exemplos de Uso

### Setup Geral da API

```typescript
// app.ts
import express from 'express';
import { apiLimiter } from '@shared/middlewares/rateLimiter.middleware';

const app = express();

// Rate limiter geral para toda a API
app.use('/api', apiLimiter);

// Rotas...
app.use('/api/items', itemRoutes);
app.use('/api/familias', familiaRoutes);
```

### Protegendo Endpoints Específicos

```typescript
// routes/item.routes.ts
import { Router } from 'express';
import { strictLimiter, itemLimiter } from '@shared/middlewares/rateLimiter.middleware';
import { ItemController } from '../controllers/ItemController';

const router = Router();

// Rate limit geral (apiLimiter) já aplicado em app.ts

// Consulta de item - rate limit por recurso
router.get('/:itemCodigo', itemLimiter, ItemController.getItem);

// Lista de itens - rate limit geral (apiLimiter)
router.get('/', ItemController.listItems);

// Criação de item - rate limit restritivo
router.post('/', strictLimiter, ItemController.createItem);

// Atualização - rate limit restritivo
router.put('/:itemCodigo', strictLimiter, ItemController.updateItem);

// Deleção - rate limit restritivo
router.delete('/:itemCodigo', strictLimiter, ItemController.deleteItem);

export default router;
```

### Rate Limiter Customizado

```typescript
// Rate limiter para uploads (5 por hora)
const uploadLimiter = createCustomRateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hora
  max: 5,
  message: 'Limite de uploads excedido. Aguarde 1 hora.',
  skipInDev: false  // Sempre ativo (mesmo em dev)
});

router.post('/upload', uploadLimiter, uploadMiddleware, controller.upload);
```

### Rate Limiter por Usuário Autenticado

```typescript
const userLimiter = createCustomRateLimiter({
  windowMs: 60000,  // 1 minuto
  max: 30,
  keyGenerator: (req) => {
    // Usa user ID se autenticado, senão IP
    return req.user?.id || req.ip;
  },
  message: 'Limite de requisições por usuário excedido'
});

router.get('/dashboard', authMiddleware, userLimiter, controller.getDashboard);
```

### Combinando Múltiplos Limiters

```typescript
// Endpoint com dupla proteção
router.post(
  '/relatorios/complexo',
  apiLimiter,      // 100 req/15min (geral)
  strictLimiter,   // 20 req/5min (endpoint)
  controller.getRelatorioComplexo
);
```

---

## Configurações

### Variáveis de Ambiente

```bash
# .env

# Ambiente (development, production)
NODE_ENV=development

# Skip rate limiting em desenvolvimento
SKIP_RATE_LIMIT=true
```

### Comportamento por Ambiente

| Limiter | Development | Production |
|---------|------------|------------|
| apiLimiter | Skip se SKIP_RATE_LIMIT=true | Sempre ativo |
| strictLimiter | Sempre ativo | Sempre ativo |
| itemLimiter | Skip se SKIP_RATE_LIMIT=true | Sempre ativo |

---

## Headers de Resposta

### Headers Padrão RFC

Quando o rate limit é aplicado, os seguintes headers são retornados:

```http
HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1672531200
```

| Header | Descrição |
|--------|-----------|
| RateLimit-Limit | Número máximo de requisições permitidas |
| RateLimit-Remaining | Número de requisições restantes |
| RateLimit-Reset | Timestamp Unix quando o limite reseta |

### Resposta 429 (Too Many Requests)

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1672531200

{
  "success": false,
  "error": "Limite de requisições excedido. Aguarde alguns minutos."
}
```

---

## Ambientes

### Desenvolvimento

```typescript
// .env
NODE_ENV=development
SKIP_RATE_LIMIT=true

// apiLimiter e itemLimiter são DESATIVADOS
// strictLimiter permanece ATIVO
```

**Quando desativar:**
- Testes locais intensivos
- Debugging
- Desenvolvimento rápido

**Quando manter ativo:**
- Testar comportamento de rate limiting
- Validar mensagens de erro
- Simular produção

### Produção

```typescript
// .env
NODE_ENV=production

// TODOS os limiters estão ATIVOS
// Não há skip de rate limiting
```

**Recomendações:**
- Monitore métricas de rate limiting
- Ajuste limites baseado no uso real
- Configure alertas para 429s frequentes

---

## Boas Práticas

### ✅ DO

**1. Use rate limit em camadas**
```typescript
// ✅ Camadas de proteção
app.use('/api', apiLimiter);              // Geral
router.post('/items', strictLimiter, ...); // Específico
```

**2. Configure limites apropriados**
```typescript
// ✅ Baseado no uso real
max: 100  // Para 95% dos usuários (evita false positives)
```

**3. Use keyGenerator para APIs autenticadas**
```typescript
// ✅ Limite por usuário
keyGenerator: (req) => req.user?.id || req.ip
```

**4. Use Redis em produção com load balancer**
```typescript
// ✅ Compartilhado entre servidores
import RedisStore from 'rate-limit-redis';
import { redisClient } from './redis';

const limiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  // ...
});
```

**5. Informe o usuário claramente**
```typescript
// ✅ Mensagem clara e acionável
message: {
  success: false,
  error: 'Limite de 100 requisições por 15 minutos excedido. Aguarde.'
}
```

---

### ❌ DON'T

**1. Não use limites muito baixos**
```typescript
// ❌ Muito restritivo (frustra usuários legítimos)
max: 5

// ✅ Balanceado
max: 100
```

**2. Não esqueça de rate limit em endpoints críticos**
```typescript
// ❌ Operação custosa sem proteção
router.post('/expensive-operation', controller.handle);

// ✅ Com proteção adequada
router.post('/expensive-operation', strictLimiter, controller.handle);
```

**3. Não use apenas IP em APIs públicas**
```typescript
// ❌ Usuários atrás de proxy compartilham limite
keyGenerator: (req) => req.ip

// ✅ Use user ID se disponível
keyGenerator: (req) => req.user?.id || req.ip
```

**4. Não ignore headers de rate limit**
```typescript
// ❌ Cliente não sabe quando pode tentar novamente
standardHeaders: false

// ✅ Cliente pode programar retry
standardHeaders: true
```

**5. Não use memória em produção com load balancer**
```typescript
// ❌ Cada servidor tem seu próprio limite
// Se max=100 e 3 servidores = 300 req total (falha de segurança)

// ✅ Use Redis (compartilhado entre todos os servidores)
import RedisStore from 'rate-limit-redis';
store: new RedisStore({ client: redisClient })
```

---

## Troubleshooting

### Problema: Rate limit muito agressivo

**Sintoma:**
- Muitos 429s para usuários legítimos
- Reclamações de usuários

**Solução:**
```typescript
// Aumente o limite ou a janela
max: 200,           // 100 → 200
windowMs: 1800000,  // 15min → 30min
```

---

### Problema: Rate limit não funciona com load balancer

**Sintoma:**
- Limite parece ser multiplicado pelo número de servidores
- Inconsistência entre requisições

**Solução:**
```typescript
// Use Redis como store compartilhado
import RedisStore from 'rate-limit-redis';
import { redisClient } from './config/redis';

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:' // Prefixo para organizar chaves
  }),
  // ...
});
```

---

### Problema: Usuários atrás de proxy compartilham limite

**Sintoma:**
- Múltiplos usuários bloqueados juntos
- Limite atingido muito rápido

**Solução:**
```typescript
// 1. Configure trust proxy no Express
app.set('trust proxy', 1);

// 2. Use user ID quando disponível
const userLimiter = createCustomRateLimiter({
  keyGenerator: (req) => {
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    // Fallback para IP real (após proxy)
    return req.ip;
  },
  // ...
});
```

---

### Problema: Rate limit ativo em desenvolvimento

**Sintoma:**
- Desenvolvimento lento
- Muitos 429s durante testes

**Solução:**
```bash
# .env
NODE_ENV=development
SKIP_RATE_LIMIT=true
```

---

## Referências

### Arquivos Relacionados

- `metrics.middleware.ts` - Métricas de rate limiting
- `apiKeyAuth.middleware.ts` - Autenticação
- `app.ts` - Setup da aplicação
- `redis.config.ts` - Configuração Redis

### Links Externos

- [express-rate-limit](https://github.com/nfriedly/express-rate-limit) - Documentação oficial
- [rate-limit-redis](https://github.com/wyattjoh/rate-limit-redis) - Store Redis
- [RFC 6585 - 429 Status](https://tools.ietf.org/html/rfc6585#section-4) - Status 429
- [RFC 7231 - HTTP Semantics](https://tools.ietf.org/html/rfc7231) - Semântica HTTP

### Conceitos

- **Rate Limiting** - Técnica para limitar taxa de requisições
- **Window** - Janela de tempo para contagem
- **Throttling** - Desacelerar requisições excessivas
- **Token Bucket** - Algoritmo de rate limiting
- **Sliding Window** - Janela deslizante de tempo

---

## Resumo

### O que é?

Sistema de middlewares de rate limiting para proteger API contra abuso e requisições excessivas usando diferentes estratégias.

### Exports

| Export | Tipo | Descrição |
|--------|------|-----------|
| apiLimiter | Middleware | Geral (100/15min por IP) |
| strictLimiter | Middleware | Restritivo (20/5min por IP) |
| itemLimiter | Middleware | Por recurso (10/1min por item) |
| createCustomRateLimiter | Function | Factory customizado |

### Quando Usar

- ✅ **Sempre** - Em todas as APIs públicas
- ✅ **Endpoints críticos** - Operações custosas
- ✅ **Operações de escrita** - POST, PUT, DELETE
- ✅ **Recursos populares** - Itens muito consultados

### Armazenamento

| Ambiente | Store | Motivo |
|----------|-------|--------|
| Desenvolvimento | Memória | Simples, rápido |
| Servidor único | Memória | Suficiente |
| Load balancer | Redis | Compartilhado entre servidores |

---

**Última atualização:** 2025-10-07