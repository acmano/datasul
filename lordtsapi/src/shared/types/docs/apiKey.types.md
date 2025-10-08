# API Key Types - Documentação Completa

> **Módulo:** `shared/types/apiKey.types`
> **Versão:** 1.0.0
> **Arquivo:** `src/shared/types/apiKey.types.ts`

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Tiers](#arquitetura-de-tiers)
3. [Sistema de Rate Limiting](#sistema-de-rate-limiting)
4. [UserTier (Enum)](#usertier-enum)
5. [ApiKeyConfig (Interface)](#apikeyconfig-interface)
6. [RateLimitConfig (Interface)](#ratelimitconfig-interface)
7. [RATE_LIMIT_CONFIGS (Constant)](#rate_limit_configs-constant)
8. [Express Request Extensions](#express-request-extensions)
9. [Comparação com Mercado](#comparação-com-outras-plataformas)
10. [Cálculo de Custos e ROI](#cálculo-de-custos-e-roi)
11. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

Define todos os tipos relacionados ao sistema de autenticação via API Key e rate limiting por tier de usuário.

### Componentes Principais

| Componente | Tipo | Descrição |
|------------|------|-----------|
| **UserTier** | Enum | Planos disponíveis (FREE, PREMIUM, ENTERPRISE, ADMIN) |
| **ApiKeyConfig** | Interface | Configuração completa de uma API Key |
| **RateLimitConfig** | Interface | Configuração de limites por tier |
| **RATE_LIMIT_CONFIGS** | Constant | Mapeamento de limites por tier |
| **Express Extensions** | Global | Tipos para `req.user` e `req.apiKey` |

---

## 🏗️ Arquitetura de Tiers

### Modelo de Negócio

Sistema **freemium** com 4 tiers progressivos:

#### 1. **FREE** - Gratuito

- **Para:** Usuários experimentando a plataforma
- **Limites:** Baixos para prevenir abuso
- **Upgrade path:** Premium
- **Caso de uso:** Desenvolvimento, testes, hobby projects

#### 2. **PREMIUM** - Pago ($)

- **Para:** Usuários regulares
- **Limites:** Médios para uso profissional
- **Upgrade path:** Enterprise
- **Caso de uso:** Apps profissionais, SaaS B2B

#### 3. **ENTERPRISE** - Pago ($$$)

- **Para:** Empresas e alto volume
- **Limites:** Altos para integração em sistemas
- **Upgrade path:** Admin (caso especial)
- **Caso de uso:** Sistemas críticos, microserviços

#### 4. **ADMIN** - Especial

- **Para:** Administradores do sistema
- **Limites:** Muito altos (quase ilimitado)
- **Não é um plano comercial**
- **Caso de uso:** Operações internas, monitoring, jobs

### Progressão de Limites

```
Free < Premium < Enterprise < Admin
10   < 60      < 300        < 1000  (req/min)
```

**Multiplicadores:**
- Premium = 6x Free
- Enterprise = 5x Premium (30x Free)
- Admin = 3.3x Enterprise (100x Free)

---

## ⏱️ Sistema de Rate Limiting

### Múltiplas Janelas de Tempo

Cada tier tem **3 limites simultâneos**:

#### 1. Por Minuto (curto prazo)

- **Objetivo:** Prevenir bursts e spam
- **Janela:** 60 segundos deslizante
- **Reset:** Contínuo
- **Uso:** Proteção imediata contra abuso

#### 2. Por Hora (médio prazo)

- **Objetivo:** Controlar uso sustentado
- **Janela:** 3600 segundos deslizante
- **Reset:** Contínuo
- **Uso:** Quota horária total

#### 3. Por Dia (longo prazo)

- **Objetivo:** Quota diária total
- **Janela:** 86400 segundos deslizante
- **Reset:** Contínuo
- **Uso:** Billing e analytics

> ⚠️ **IMPORTANTE:** TODOS os limites devem estar OK para permitir request. Se QUALQUER limite excedido → request bloqueado.

### Burst Allowance

Permite bursts temporários acima do limite por minuto.

**Exemplo (Free tier):**

```
Limite: 10 req/min
Burst: 5 req
Permite: até 15 req em um segundo
```

#### Sem Burst Allowance ❌

- Cliente teria que espaçar requests igualmente
- 1 request a cada 6 segundos
- Ineficiente e limitante

#### Com Burst Allowance ✅

- Cliente pode fazer 15 requests imediatamente
- Depois aguarda até próximo minuto
- Mais flexível e realista

**Algoritmo (Token Bucket):**

```typescript
const tokens = limit + burstAllowance;  // 15 tokens
const refillRate = limit / 60;  // 0.167 tokens/segundo

if (currentTokens >= 1) {
  currentTokens -= 1;  // Consome 1 token
  allowRequest();
} else {
  denyRequest();
  retryAfter = Math.ceil((1 - currentTokens) / refillRate);
}
```

---

## 🎫 UserTier (Enum)

Tiers de usuário que definem limites de rate limiting.

### Por Que Enum e Não Union Type?

**Enum:**
```typescript
enum UserTier { FREE = 'free' }
// Namespace + valores + type checking
// UserTier.FREE é autocomplete
```

**Union Type:**
```typescript
type UserTier = 'free' | 'premium';
// Apenas type checking, sem namespace
// Precisa lembrar strings exatas
```

### Benefícios do Enum

- ✅ Autocomplete no IDE
- ✅ Refactoring seguro (renomear valor)
- ✅ Namespace (UserTier.FREE vs 'free')
- ✅ Runtime value (pode iterar)
- ✅ Documentação clara

### String Enum vs Numeric Enum

**String Enum (nossa escolha):**
```typescript
enum UserTier { FREE = 'free' }
// Valor: 'free' (legível em logs/DB)
```

**Numeric Enum:**
```typescript
enum UserTier { FREE = 0 }
// Valor: 0 (não legível em logs)
```

**Por que String?**
- Valores são legíveis em logs
- Compatível com JSON direto
- Facilita debugging
- Melhor para persistência em DB

### Valores

| Tier | String | Req/Min | Req/Hora | Req/Dia | Burst |
|------|--------|---------|----------|---------|-------|
| **FREE** | `'free'` | 10 | 100 | 1.000 | 5 |
| **PREMIUM** | `'premium'` | 60 | 1.000 | 10.000 | 20 |
| **ENTERPRISE** | `'enterprise'` | 300 | 10.000 | 100.000 | 100 |
| **ADMIN** | `'admin'` | 1.000 | 50.000 | 1.000.000 | 500 |

### Uso em Código

```typescript
// Comparação
if (user.tier === UserTier.FREE) { ... }

// Switch
switch (user.tier) {
  case UserTier.FREE: ...
  case UserTier.PREMIUM: ...
}

// Iterar (runtime)
Object.values(UserTier).forEach(tier => {
  console.log(tier); // 'free', 'premium', ...
});
```

### Persistência em Database

**PostgreSQL:**
```sql
CREATE TYPE user_tier AS ENUM ('free', 'premium', 'enterprise', 'admin');

CREATE TABLE users (
  id UUID PRIMARY KEY,
  tier user_tier NOT NULL DEFAULT 'free'
);
```

**MySQL:**
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  tier ENUM('free', 'premium', 'enterprise', 'admin') NOT NULL DEFAULT 'free'
);
```

---

## 🔑 ApiKeyConfig (Interface)

Configuração completa de uma API Key. Contém todos os metadados necessários para validação e auditoria.

### Lifecycle de uma API Key

#### 1. CRIAÇÃO

```typescript
const config: ApiKeyConfig = {
  key: 'premium-abc123...',
  userId: 'user-001',
  userName: 'John Doe',
  tier: UserTier.PREMIUM,
  active: true,
  createdAt: new Date()
};
```

#### 2. USO (validação)

```typescript
const config = await ApiKeyService.validateKey(apiKey);
if (config && config.active) {
  // Key válida
}
```

#### 3. REVOGAÇÃO

```typescript
config.active = false;
// Key não pode mais ser usada
```

#### 4. EXPIRAÇÃO (automática)

```typescript
if (config.expiresAt && config.expiresAt < new Date()) {
  // Key expirou automaticamente
}
```

### Campos da Interface

#### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **key** | `string` | API Key completa: `[tier]-[32-char-hex]` |
| **userId** | `string` | ID único do usuário dono da key |
| **userName** | `string` | Nome do usuário para exibição |
| **tier** | `UserTier` | Tier/plano que define rate limits |
| **active** | `boolean` | Se key está ativa (`true`) ou revogada (`false`) |
| **createdAt** | `Date` | Timestamp de criação da key |

#### Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **expiresAt** | `Date?` | Data/hora de expiração (`undefined` = permanente) |
| **metadata** | `Record<string, any>?` | Metadados customizados |

### Metadata: Extensibilidade

Campo `metadata` permite adicionar dados customizados sem mudar schema:

```typescript
const config: ApiKeyConfig = {
  // ... campos obrigatórios
  metadata: {
    // IP whitelisting
    allowedIPs: ['192.168.1.0/24', '10.0.0.1'],

    // Scopes/permissions
    scopes: ['read:items', 'write:items'],

    // Analytics
    totalRequests: 1234,
    lastUsedAt: new Date(),

    // Business info
    companyId: 'company-123',
    department: 'Engineering',
    costCenter: 'CC-456'
  }
};
```

### Persistência

#### PostgreSQL

```sql
CREATE TABLE api_keys (
  key VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  metadata JSONB,  -- JSONB para metadata

  INDEX idx_user_id (user_id),
  INDEX idx_active (active),
  INDEX idx_expires_at (expires_at)
);
```

#### MongoDB

```javascript
{
  _id: ObjectId,
  key: String,
  userId: String,
  userName: String,
  tier: String,
  active: Boolean,
  createdAt: Date,
  expiresAt: Date,
  metadata: Object  // Flexible schema
}
```

### Segurança

⚠️ **NUNCA expor key completa em APIs públicas:**

```typescript
// ❌ ERRADO
res.json({ apiKey: config.key });

// ✅ CORRETO
res.json({
  apiKey: maskKey(config.key),  // 'prem...c123'
  userId: config.userId,
  tier: config.tier
});
```

---

## 📊 RateLimitConfig (Interface)

Configuração de rate limiting para um tier específico. Define todos os limites e comportamentos de throttling.

### Estrutura de Limites

```typescript
limits: {
  perMinute: X,  // Janela de 60s
  perHour: Y,    // Janela de 3600s
  perDay: Z      // Janela de 86400s
}
```

### Relação Entre Limites

**Matematicamente:**
```
perDay ≥ perHour * 24
perHour ≥ perMinute * 60
```

**Na prática (com burst):**
```
perDay < perHour * 24  (usuário não sustenta max toda hora)
perHour < perMinute * 60  (usuário não sustenta max todo minuto)
```

### Algoritmo de Burst (Token Bucket)

```typescript
// Bucket token algorithm
const tokens = limit + burstAllowance;  // 15 tokens
const refillRate = limit / 60;  // 0.167 tokens/segundo

if (currentTokens >= 1) {
  currentTokens -= 1;  // Consome 1 token
  allowRequest();
} else {
  denyRequest();
  retryAfter = Math.ceil((1 - currentTokens) / refillRate);
}
```

### Casos de Uso por Tier

#### FREE (hobby/teste)
- Website pessoal fazendo 1 request/página
- App mobile com poucos usuários
- Testes e desenvolvimento

#### PREMIUM (profissional)
- SaaS B2B com usuários simultâneos
- Dashboard com auto-refresh
- Integração moderada

#### ENTERPRISE (escala)
- Sistema empresarial crítico
- Microserviços comunicando
- Integrações de alto volume

#### ADMIN (sistema)
- Jobs internos e cron
- Monitoring e health checks
- Operações administrativas

---

## 🗺️ RATE_LIMIT_CONFIGS (Constant)

Mapeamento de configurações de rate limit por tier.

### Estrutura

```typescript
Record<UserTier, RateLimitConfig>

// Equivalente a:
{
  [UserTier.FREE]: RateLimitConfig,
  [UserTier.PREMIUM]: RateLimitConfig,
  [UserTier.ENTERPRISE]: RateLimitConfig,
  [UserTier.ADMIN]: RateLimitConfig
}
```

### Tabela de Limites

| Tier | Min | Hora | Dia | Burst | Multiplicador |
|------|-----|------|-----|-------|---------------|
| **Free** | 10 | 100 | 1K | 5 | 1x (base) |
| **Premium** | 60 | 1K | 10K | 20 | 6x |
| **Enterprise** | 300 | 10K | 100K | 100 | 30x |
| **Admin** | 1000 | 50K | 1M | 500 | 100x |

### Justificativa dos Valores

#### FREE (10/min)
- Suficiente para testes e desenvolvimento
- Baixo o bastante para prevenir abuso
- Incentiva upgrade para uso real

#### PREMIUM (60/min)
- 1 request/segundo sustentado
- Adequado para apps profissionais
- Bom equilíbrio custo/benefício

#### ENTERPRISE (300/min)
- 5 requests/segundo sustentado
- Permite integração enterprise
- Suporta alto throughput

#### ADMIN (1000/min)
- 16 requests/segundo sustentado
- Praticamente ilimitado para ops
- Permite jobs pesados

### Modificar Limites

```typescript
// Aumentar limite Premium
RATE_LIMIT_CONFIGS[UserTier.PREMIUM].limits.perMinute = 100;

// Ou criar novo config
const customConfigs = {
  ...RATE_LIMIT_CONFIGS,
  [UserTier.PREMIUM]: {
    ...RATE_LIMIT_CONFIGS[UserTier.PREMIUM],
    limits: {
      perMinute: 100,
      perHour: 2000,
      perDay: 20000
    }
  }
};
```

### Validação dos Limites

Garantir consistência matemática:

```typescript
function validateLimits(config: RateLimitConfig): boolean {
  const { perMinute, perHour, perDay } = config.limits;

  // Hora deve ser >= minuto * 60 (com folga)
  if (perHour < perMinute * 30) return false;

  // Dia deve ser >= hora * 24 (com folga)
  if (perDay < perHour * 12) return false;

  return true;
}
```

---

## 🔌 Express Request Extensions

Estende o tipo `Request` do Express para incluir dados de autenticação.

### Module Augmentation

TypeScript permite "augmentar" tipos de bibliotecas externas:

```typescript
declare global {
  namespace Express {
    interface Request {
      // Novos campos
    }
  }
}
```

### Por Que Global?

`Express.Request` é um tipo global usado em todo o projeto. Precisamos que TODOS os arquivos vejam os novos campos automaticamente.

**Sem augmentation:**
```typescript
// ❌ Erro: Property 'user' does not exist on type 'Request'
const userId = req.user.id;
```

**Com augmentation:**
```typescript
// ✅ TypeScript sabe sobre req.user
const userId = req.user.id;  // Type-safe!
```

### Campos Adicionados

#### 1. req.apiKey

**Tipo:** `ApiKeyConfig | undefined`

**Populado por:** `apiKeyAuth` ou `optionalApiKeyAuth` middleware

**Quando usar:**
- Precisa de metadados da key (metadata, expiresAt)
- Quer auditar uso detalhado
- Precisa verificar campos extras

**Exemplo:**
```typescript
// Verificar se key expira em breve
if (req.apiKey?.expiresAt) {
  const daysUntilExpiry = differenceInDays(req.apiKey.expiresAt, new Date());
  if (daysUntilExpiry < 7) {
    res.setHeader('X-Warning', 'API Key expires soon');
  }
}

// Acessar metadata customizada
const allowedIPs = req.apiKey?.metadata?.allowedIPs || [];
if (!allowedIPs.includes(req.ip)) {
  throw new AuthorizationError('IP not allowed');
}
```

#### 2. req.user

**Tipo:** `{ id: string; name: string; tier: UserTier } | undefined`

**Populado por:** `apiKeyAuth` ou `optionalApiKeyAuth` middleware

**Quando usar:**
- Na maioria dos casos (acesso rápido a id/tier)
- Rate limiting
- Logs
- Business logic

**Exemplo:**
```typescript
// Uso típico em controller
router.get('/data', apiKeyAuth, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const data = await fetchUserData(req.user.id);
  res.json({ data, userName: req.user.name });
});

// Rate limiting
const config = RATE_LIMIT_CONFIGS[req.user!.tier];
if (userRequests > config.limits.perMinute) {
  throw new RateLimitError();
}

// Logs
log.info('User action', {
  userId: req.user.id,
  userName: req.user.name,
  tier: req.user.tier,
  action: 'data_fetch'
});
```

### Fluxo de População

```
Request
  ↓
apiKeyAuth middleware
  ↓
1. Extrai API Key do header
2. Valida key (ApiKeyService.validateKey)
3. Popula req.apiKey com config completa
4. Popula req.user com dados simplificados
  ↓
Controller (req.user disponível)
```

### Optional vs Required

Campos são **OPCIONAIS (?)** porque:
- Nem toda rota usa autenticação
- Alguns endpoints são públicos
- `optionalApiKeyAuth` pode não popular

```typescript
// Rota sem auth: req.user = undefined
router.get('/public', controller);

// Rota com auth opcional: req.user pode ou não existir
router.get('/hybrid', optionalApiKeyAuth, controller);

// Rota com auth obrigatória: req.user sempre existe
router.get('/private', apiKeyAuth, controller);
// Mas TypeScript não garante isso, então sempre check:
if (!req.user) throw new AuthenticationError();
```

### Type Guards

Helper para garantir user existe:

```typescript
function requireAuth(req: Request): asserts req is Request & {
  user: NonNullable<typeof req.user>
} {
  if (!req.user) {
    throw new AuthenticationError();
  }
}

// Uso:
router.get('/profile', (req, res) => {
  requireAuth(req);
  // Aqui TypeScript SABE que req.user existe
  const userId = req.user.id;  // Sem ! ou ?
});
```

---

## 📈 Comparação com Outras Plataformas

### Nossos Limites vs Mercado

| Tier | Nosso (req/min) | Stripe | GitHub | AWS |
|------|----------------|--------|--------|-----|
| **Free** | 10 | 100 | 60 | 5 |
| **Premium** | 60 | 1000 | 5000 | 50 |
| **Enterprise** | 300 | Custom | Custom | Custom |

### Análise

**Nossos limites são:**
- **Conservadores no Free** → previne abuso
- **Competitivos no Premium** → bom para uso profissional
- **Generosos no Enterprise** → permite integração

---

## 💰 Cálculo de Custos e ROI

### Exemplo de Pricing

```
Free: $0/mês
= $0 por 1.000 req/dia
= $0/milhão

Premium: $50/mês
= $0.005 por request
= $5/milhão

Enterprise: $500/mês
= $0.0005 por request
= $0.50/milhão
```

### Break-Even Points

**Free → Premium:**
- Após **100 req/dia** (~3 req/hora)
- Se usar mais, vale a pena Premium

**Premium → Enterprise:**
- Após **10.000 req/dia** (~7 req/min)
- Se usar mais, vale a pena Enterprise

---

## 💡 Exemplos de Uso

### Criar Usuário Free

```typescript
const user = {
  id: 'user-001',
  tier: UserTier.FREE
};
```

### Upgrade para Premium

```typescript
user.tier = UserTier.PREMIUM;
await ApiKeyService.updateUserTier(user.id, UserTier.PREMIUM);
```

### Verificar Tier

```typescript
if (req.user?.tier === UserTier.ADMIN) {
  // Acesso admin
}
```

### Buscar Config de Tier

```typescript
const premiumConfig = RATE_LIMIT_CONFIGS[UserTier.PREMIUM];
console.log(premiumConfig.limits.perMinute);  // 60
```

### Iterar Todos os Tiers

```typescript
Object.entries(RATE_LIMIT_CONFIGS).forEach(([tier, config]) => {
  console.log(`${tier}: ${config.limits.perMinute} req/min`);
});
```

### Validar Rate Limit

```typescript
const userTier = req.user.tier;
const config = RATE_LIMIT_CONFIGS[userTier];

if (userRequests > config.limits.perMinute) {
  throw new RateLimitError(`Limite excedido: ${config.limits.perMinute} req/min`);
}
```

### Key Permanente

```typescript
const permanentKey: ApiKeyConfig = {
  key: 'premium-abc123...',
  userId: 'user-001',
  userName: 'John Doe',
  tier: UserTier.PREMIUM,
  active: true,
  createdAt: new Date()
  // expiresAt: undefined (permanente)
};
```

### Key com Expiração

```typescript
const trialKey: ApiKeyConfig = {
  key: 'premium-xyz789...',
  userId: 'user-002',
  userName: 'Jane Smith',
  tier: UserTier.PREMIUM,
  active: true,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 dias
};
```

### Key com Metadata

```typescript
const restrictedKey: ApiKeyConfig = {
  key: 'enterprise-def456...',
  userId: 'user-003',
  userName: 'Corp Inc',
  tier: UserTier.ENTERPRISE,
  active: true,
  createdAt: new Date(),
  metadata: {
    allowedIPs: ['203.0.113.0/24'],
    scopes: ['read:items', 'write:items'],
    companyId: 'company-123'
  }
};
```

---

**Última atualização:** 2025-10-07