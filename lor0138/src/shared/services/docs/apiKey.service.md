# API Key Service

> Serviço centralizado para gerenciamento de autenticação via API Keys

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura de API Key](#estrutura-de-api-key)
- [Arquitetura](#arquitetura)
- [API Reference](#api-reference)
- [Segurança](#segurança)
- [Estados e Lifecycle](#estados-e-lifecycle)
- [Migração para Produção](#migração-para-produção)
- [Exemplos de Uso](#exemplos-de-uso)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

---

## Visão Geral

### O que é?

Serviço singleton para gerenciar autenticação via API Keys. Implementa CRUD completo de keys, validação, expiração e estatísticas.

### Características

- ✅ **Geração segura** - crypto.randomBytes (128 bits)
- ✅ **Validação completa** - Existência, ativo, expiração
- ✅ **4 tiers** - Free, Premium, Enterprise, Admin
- ✅ **Expiração** - Opcional, configurável por dias
- ✅ **Revogação** - Desativa keys comprometidas
- ✅ **Estatísticas** - Por tier, status, totais
- ✅ **Mascaramento** - Logs seguros

### Tecnologias

- **crypto** - Geração segura de bytes aleatórios
- **Map** - Storage de alto desempenho (O(1))
- **TypeScript** - Tipagem forte

---

## Estrutura de API Key

### Formato

```
[tier]-[random-hex]

Exemplos:
free-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
premium-x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2
enterprise-1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
admin-9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k
```

### Componentes

| Parte | Descrição | Exemplo |
|-------|-----------|---------|
| **Prefix** | Tier em lowercase | `premium` |
| **Separador** | Hífen | `-` |
| **Random** | 16 bytes hex (32 chars) | `a1b2c3d4...` |
| **Comprimento** | ~40 caracteres | Total |

### Por que Este Formato?

**Prefix (tier):**
- Identificação visual rápida
- Facilita filtragem e busca
- Logs mais legíveis

**Random hex:**
- Criptograficamente seguro
- 128 bits de entropia (2^128 possibilidades)
- Impossível brute force

---

## Arquitetura

### Padrão Atual: Singleton + Memória

```typescript
ApiKeyService (Singleton)
  ↓
Map<string, ApiKeyConfig> (memória)
  ↓
Perdido ao reiniciar servidor
```

**Métodos estáticos:**
- Todos os métodos são `static`
- Uma única instância de dados
- Estado compartilhado em Map

**Storage:**
```typescript
private static apiKeys: Map<string, ApiKeyConfig>
```

**Por que Map?**
- Lookup O(1) vs Array O(n)
- Key como índice natural
- Fácil verificar existência
- Performance em validação

---

### Estrutura ApiKeyConfig

```typescript
interface ApiKeyConfig {
  key: string;              // API Key completa (unique)
  userId: string;           // ID do usuário dono
  userName: string;         // Nome para logs/admin
  tier: UserTier;          // free | premium | enterprise | admin
  active: boolean;         // true = válida, false = revogada
  createdAt: Date;         // Timestamp de criação
  expiresAt?: Date;        // Opcional - quando expira
}
```

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| key | string | ✅ | API Key única |
| userId | string | ✅ | Dono da key |
| userName | string | ✅ | Para identificação |
| tier | UserTier | ✅ | Plano do usuário |
| active | boolean | ✅ | Status (ativa/revogada) |
| createdAt | Date | ✅ | Quando foi criada |
| expiresAt | Date | ❌ | Quando expira (opcional) |

---

### Limitações (Memória)

❌ **Problemas:**
- Dados perdidos ao reiniciar
- Não funciona em cluster (múltiplos servidores)
- Sem auditoria de mudanças
- Sem backup automático
- Limite de memória

⚠️ **APENAS PARA DESENVOLVIMENTO**

---

## API Reference

### initialize()

```typescript
static initialize(): void
```

Inicializa API keys de exemplo para desenvolvimento/testes.

**O que faz:**
- Cria 4 keys de exemplo (uma por tier)
- Adiciona ao Map interno
- Loga quantas keys foram criadas

**Keys Criadas:**

| Tier | Key | User | Limites |
|------|-----|------|---------|
| Free | `free-demo-key-123456` | user-001 | 10/min, 100/h, 1k/dia |
| Premium | `premium-key-abc123` | user-002 | 60/min, 1k/h, 10k/dia |
| Enterprise | `enterprise-key-xyz789` | user-003 | 300/min, 10k/h, 100k/dia |
| Admin | `admin-key-superuser` | admin-001 | 1k/min, 50k/h, 1M/dia |

**Quando chamar:**
- No startup da aplicação (server.ts)
- Antes de qualquer uso de API Keys
- Uma única vez por ciclo de vida

**Exemplo:**
```typescript
// server.ts
ApiKeyService.initialize();
log.info('API Key system ready');
```

**Uso em Testes:**
```bash
# Testar como Free
curl -H "X-API-Key: free-demo-key-123456" /api/endpoint

# Testar como Premium
curl -H "X-API-Key: premium-key-abc123" /api/endpoint

# Testar como Admin
curl -H "X-API-Key: admin-key-superuser" /admin/api-keys
```

**⚠️ SEGURANÇA:**
- Keys de exemplo são conhecidas publicamente
- **NUNCA** usar em produção
- Trocar imediatamente ao fazer deploy

---

### validateKey()

```typescript
static async validateKey(apiKey: string): Promise<ApiKeyConfig | null>
```

Valida uma API Key e retorna sua configuração se válida.

**Critérios de Validação:**
1. ✅ Key existe no sistema?
2. ✅ Key está ativa (não revogada)?
3. ✅ Key não expirou?

**Retorno:**
- `ApiKeyConfig` - Se todos os critérios passarem
- `null` - Se qualquer critério falhar

**Fluxo:**

```
Request
  ↓
Key existe? ──NO──> return null (inválida)
  ↓ YES
Key ativa? ──NO──> return null (revogada)
  ↓ YES
Key expirou? ──YES──> return null (expirada)
  ↓ NO
return ApiKeyConfig ✅
```

**Performance:**
- Map.get(): O(1) - muito rápido
- Date comparison: O(1)
- Total: < 1ms tipicamente

**Logs:**

**Key inválida:**
```json
{
  "level": "warn",
  "message": "API Key inválida",
  "apiKey": "free...6789"
}
```

**Key inativa:**
```json
{
  "level": "warn",
  "message": "API Key inativa",
  "apiKey": "prem...c123",
  "userId": "user-002"
}
```

**Key expirada:**
```json
{
  "level": "warn",
  "message": "API Key expirada",
  "apiKey": "ente...z789",
  "userId": "user-003",
  "expiresAt": "2025-10-01T00:00:00.000Z"
}
```

**Exemplo:**
```typescript
// Validação simples
const keyConfig = await ApiKeyService.validateKey('premium-key-abc123');
if (keyConfig) {
  console.log(`Usuário: ${keyConfig.userName}, Tier: ${keyConfig.tier}`);
}

// Uso com autenticação
const apiKey = req.headers['x-api-key'];
const keyConfig = await ApiKeyService.validateKey(apiKey);
if (!keyConfig) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

---

### generateKey()

```typescript
static async generateKey(
  userId: string,
  userName: string,
  tier: UserTier = UserTier.FREE,
  expiresInDays?: number
): Promise<string>
```

Gera uma nova API Key segura para um usuário.

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| userId | string | ✅ | - | ID único do usuário |
| userName | string | ✅ | - | Nome para logs/admin |
| tier | UserTier | ❌ | FREE | Tier da API Key |
| expiresInDays | number | ❌ | undefined | Dias até expirar |

**Algoritmo de Geração:**

1. **Prefix baseado em tier**
   ```typescript
   const prefix = tier.toLowerCase(); // 'PREMIUM' → 'premium'
   ```

2. **Random bytes criptográfico**
   ```typescript
   const randomPart = crypto.randomBytes(16).toString('hex');
   // 16 bytes = 128 bits = 32 chars hex
   ```

3. **Combinar**
   ```typescript
   const apiKey = `${prefix}-${randomPart}`;
   // 'premium-a1b2c3d4e5f6g7h8...'
   ```

**Entropia e Segurança:**

```
crypto.randomBytes(16):
- 16 bytes = 128 bits de entropia
- 2^128 = 340,282,366,920,938,463,463,374,607,431,768,211,456 possibilidades
- Impossível brute force
- CSPRNG (Cryptographically Secure PRNG)
```

**Colisão:**
- Probabilidade: ~0% (até bilhões de keys)
- Birthday paradox: precisa ~2^64 keys para 50% de colisão
- Na prática: impossível colidir

**Expiração:**

**Sem expiração:**
```typescript
const key = await ApiKeyService.generateKey('user-001', 'John', UserTier.PREMIUM);
// expiresAt: undefined
// Key válida para sempre (até ser revogada)
```

**Com expiração (30 dias):**
```typescript
const key = await ApiKeyService.generateKey('user-001', 'John', UserTier.PREMIUM, 30);
// expiresAt: now + 30 days
// Key expira automaticamente em 30 dias
```

**Cálculo:**
```
now = Date.now()           // 1696599600000 (ms)
days = 30
ms_per_day = 86400000
expires = now + (days * ms_per_day)
```

**Exemplo:**
```typescript
// Novo usuário Free (expira em 30 dias)
const key = await ApiKeyService.generateKey(
  'user-123',
  'John Doe',
  UserTier.FREE,
  30
);

// Upgrade para Premium (permanente)
const key = await ApiKeyService.generateKey(
  'user-123',
  'John Doe',
  UserTier.PREMIUM
  // Sem expiresInDays = permanente
);

// Key temporária para teste (7 dias)
const key = await ApiKeyService.generateKey(
  'test-user',
  'Test Account',
  UserTier.PREMIUM,
  7
);
```

---

### revokeKey()

```typescript
static async revokeKey(apiKey: string): Promise<boolean>
```

Revoga uma API Key.

**Retorno:**
- `true` - Key revogada com sucesso
- `false` - Key não encontrada

**O que faz:**
1. Busca key no Map
2. Se encontrada: marca `active = false`
3. Loga revogação
4. Retorna resultado

**Exemplo:**
```typescript
// Revogar key comprometida
const revoked = await ApiKeyService.revokeKey('premium-key-abc123');

if (revoked) {
  console.log('Key revogada com sucesso');
} else {
  console.log('Key não encontrada');
}
```

**Log:**
```json
{
  "level": "info",
  "message": "API Key revogada",
  "userId": "user-002",
  "apiKey": "prem...c123"
}
```

---

### getUserKeys()

```typescript
static async getUserKeys(userId: string): Promise<ApiKeyConfig[]>
```

Lista todas as API Keys de um usuário.

**Retorno:**
- Array de `ApiKeyConfig` (vazio se usuário não tem keys)

**Exemplo:**
```typescript
// Listar keys do usuário
const keys = await ApiKeyService.getUserKeys('user-001');

keys.forEach(key => {
  console.log(`Key: ${key.key}`);
  console.log(`Tier: ${key.tier}`);
  console.log(`Ativa: ${key.active}`);
  console.log(`Criada: ${key.createdAt}`);
  console.log('---');
});
```

---

### updateUserTier()

```typescript
static async updateUserTier(userId: string, newTier: UserTier): Promise<void>
```

Atualiza o tier de todas as keys de um usuário.

**O que faz:**
1. Busca todas as keys do usuário
2. Atualiza tier de cada key
3. Loga quantas keys foram atualizadas

**Exemplo:**
```typescript
// Upgrade de Free para Premium
await ApiKeyService.updateUserTier('user-001', UserTier.PREMIUM);

// Downgrade de Enterprise para Premium
await ApiKeyService.updateUserTier('user-003', UserTier.PREMIUM);
```

**Log:**
```json
{
  "level": "info",
  "message": "Tier do usuário atualizado",
  "userId": "user-001",
  "newTier": "premium",
  "keysUpdated": 3
}
```

---

### getStats()

```typescript
static getStats(): object
```

Retorna estatísticas de API Keys.

**Retorno:**
```typescript
{
  total: number,
  active: number,
  inactive: number,
  byTier: {
    free: number,
    premium: number,
    enterprise: number,
    admin: number
  }
}
```

**Exemplo:**
```typescript
const stats = ApiKeyService.getStats();

console.log(`Total: ${stats.total}`);
console.log(`Ativas: ${stats.active}`);
console.log(`Inativas: ${stats.inactive}`);
console.log(`Free: ${stats.byTier.free}`);
console.log(`Premium: ${stats.byTier.premium}`);
```

**Resposta:**
```json
{
  "total": 12,
  "active": 10,
  "inactive": 2,
  "byTier": {
    "free": 5,
    "premium": 4,
    "enterprise": 2,
    "admin": 1
  }
}
```

---

### maskKey() (privado)

```typescript
private static maskKey(apiKey: string): string
```

Mascara API Key para logs (segurança).

**Formato:**
```
"premium-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
↓
"prem...o5p6"
```

**Lógica:**
- Se key ≤ 8 chars: retorna `'***'`
- Senão: mostra 4 primeiros + ... + 4 últimos

**Exemplo:**
```typescript
ApiKeyService.maskKey('premium-abc123xyz789')
// "prem...9789"

ApiKeyService.maskKey('short')
// "***"
```

---

## Segurança

### Geração Segura

**crypto.randomBytes(16):**
- Usa `/dev/urandom` (Linux) ou `CryptGenRandom` (Windows)
- Criptograficamente seguro (CSPRNG)
- 128 bits de entropia
- Imprevisível

**Força:**
```
2^128 = 340,282,366,920,938,463,463,374,607,431,768,211,456
```

Para contexto:
- Número de átomos no universo: ~10^80
- Idade do universo em segundos: ~10^17

**Impossível brute force** mesmo com todos os computadores do mundo.

---

### Mascaramento para Logs

**❌ NUNCA:**
```typescript
log.info('Key criada', { apiKey: 'premium-abc123xyz789' }); // ERRADO!
```

**✅ SEMPRE:**
```typescript
log.info('Key criada', { apiKey: this.maskKey('premium-abc123xyz789') });
// "prem...9789"
```

**Por quê?**
- Logs podem vazar
- Logs são persistidos
- Logs podem ser acessados por muitos
- Logs podem ir para sistemas de terceiros

---

### Rotação de Keys

**Boas práticas:**

| Tier | Rotação Recomendada |
|------|---------------------|
| Free | 30 dias |
| Premium | 90 dias |
| Enterprise | 180 dias |
| Admin | 365 dias |

**Implementação:**
```typescript
// Ao criar key
const expiresInDays = {
  [UserTier.FREE]: 30,
  [UserTier.PREMIUM]: 90,
  [UserTier.ENTERPRISE]: 180,
  [UserTier.ADMIN]: 365
}[tier];

const key = await ApiKeyService.generateKey(
  userId,
  userName,
  tier,
  expiresInDays
);
```

---

### Armazenamento

**❌ NÃO em produção:**
```typescript
// Memória = perdido ao reiniciar
private static apiKeys: Map<string, ApiKeyConfig>
```

**✅ Produção:**

**Opção 1: Hash com bcrypt**
```typescript
// Gerar
const apiKey = generateRandomKey();
const hashedKey = await bcrypt.hash(apiKey, 10);
await db.query('INSERT INTO api_keys (key_hash, ...) VALUES ($1, ...)', [hashedKey]);

// Validar
const keys = await db.query('SELECT key_hash FROM api_keys WHERE user_id = $1', [userId]);
for (const keyConfig of keys) {
  if (await bcrypt.compare(apiKey, keyConfig.key_hash)) {
    return keyConfig;
  }
}
```

**Opção 2: Prefix + Hash**
```typescript
// Armazenar prefix para busca rápida
const [prefix, random] = apiKey.split('-');
const hashedRandom = await bcrypt.hash(random, 10);

await db.query(
  'INSERT INTO api_keys (prefix, key_hash, ...) VALUES ($1, $2, ...)',
  [prefix, hashedRandom]
);

// Buscar por prefix primeiro
const keys = await db.query(
  'SELECT * FROM api_keys WHERE prefix = $1',
  [prefix]
);
```

---

## Estados e Lifecycle

### Estados

**1. CRIADA**
```typescript
{
  active: true,
  expiresAt: undefined | futuro
}
// Estado: Válida ✅
```

**2. REVOGADA**
```typescript
{
  active: false,
  expiresAt: qualquer
}
// Estado: Inválida ❌
```

**3. EXPIRADA**
```typescript
{
  active: true,
  expiresAt: passado
}
// Estado: Inválida ❌
```

**4. REVOGADA + EXPIRADA**
```typescript
{
  active: false,
  expiresAt: passado
}
// Estado: Inválida ❌
```

---

### Transições de Estado

```
CRIADA ──revokeKey()──> REVOGADA
  │
  └──tempo passa──> EXPIRADA

REVOGADA ──tempo passa──> REVOGADA + EXPIRADA

[Não há volta: uma vez revogada/expirada, permanece assim]
```

**Irreversível:**
- Não há método `unrevokeKey()`
- Key expirada não pode ser renovada
- Única solução: gerar nova key

---

## Migração para Produção

### Limitações Atuais

❌ **Memória:**
- Dados perdidos ao reiniciar
- Não funciona em cluster
- Sem auditoria
- Sem backup
- Limite de memória

---

### Opção 1: PostgreSQL

**Schema:**
```sql
CREATE TABLE api_keys (
  key VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revoked_by VARCHAR(64),
  last_used_at TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_tier (tier),
  INDEX idx_active (active)
);
```

**Código:**
```typescript
static async validateKey(apiKey: string) {
  const result = await db.query(
    `SELECT * FROM api_keys
     WHERE key = $1
     AND active = true
     AND (expires_at IS NULL OR expires_at > NOW())`,
    [apiKey]
  );

  return result.rows[0] || null;
}
```

---

### Opção 2: MongoDB

**Schema:**
```javascript
{
  _id: ObjectId,
  key: String (unique, indexed),
  userId: String (indexed),
  userName: String,
  tier: String (indexed),
  active: Boolean (indexed),
  createdAt: Date,
  expiresAt: Date,
  revokedAt: Date,
  revokedBy: String,
  lastUsedAt: Date,
  metadata: Object
}
```

**Código:**
```typescript
static async validateKey(apiKey: string) {
  return await ApiKey.findOne({
    key: apiKey,
    active: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
}
```

---

### Opção 3: Redis Cache + DB

**Arquitetura:**
```
Request
  ↓
Redis (cache) ──HIT──> return cached
  ↓ MISS
Database ──FOUND──> cache + return
  ↓ NOT FOUND
return null
```

**Código:**
```typescript
static async validateKey(apiKey: string) {
  // 1. Try cache
  const cached = await redis.get(`apikey:${apiKey}`);
  if (cached) return JSON.parse(cached);

  // 2. Query database
  const keyConfig = await db.query(
    'SELECT * FROM api_keys WHERE key = $1 AND active = true',
    [apiKey]
  );

  // 3. Cache valid keys
  if (keyConfig) {
    await redis.setex(`apikey:${apiKey}`, 3600, JSON.stringify(keyConfig));
  }

  return keyConfig;
}
```

---

## Exemplos de Uso

### Startup da Aplicação

```typescript
// server.ts
import { ApiKeyService } from '@shared/services/apiKey.service';

// Inicializar API Keys
ApiKeyService.initialize();
log.info('API Key system ready');

// Verificar stats
const stats = ApiKeyService.getStats();
log.info('API Keys loaded', stats);
```

---

### Admin: Gerar Nova Key

```typescript
// AdminController.ts
import { ApiKeyService } from '@shared/services/apiKey.service';
import { UserTier } from '@shared/types/apiKey.types';

export class AdminController {
  static async generateKey(req, res) {
    const { userId, userName, tier, expiresInDays } = req.body;

    const apiKey = await ApiKeyService.generateKey(
      userId,
      userName,
      tier,
      expiresInDays
    );

    res.json({
      success: true,
      apiKey,
      message: 'API Key gerada com sucesso'
    });
  }
}
```

---

### Admin: Revogar Key

```typescript
export class AdminController {
  static async revokeKey(req, res) {
    const { apiKey } = req.params;

    const revoked = await ApiKeyService.revokeKey(apiKey);

    if (revoked) {
      res.json({
        success: true,
        message: 'API Key revogada'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'API Key não encontrada'
      });
    }
  }
}
```

---

### Admin: Listar Keys do Usuário

```typescript
export class AdminController {
  static async listUserKeys(req, res) {
    const { userId } = req.params;

    const keys = await ApiKeyService.getUserKeys(userId);

    res.json({
      success: true,
      count: keys.length,
      keys: keys.map(k => ({
        key: ApiKeyService.maskKey(k.key), // Mascarado
        tier: k.tier,
        active: k.active,
        createdAt: k.createdAt,
        expiresAt: k.expiresAt
      }))
    });
  }
}
```

---

### Admin: Estatísticas

```typescript
export class AdminController {
  static getStats(req, res) {
    const stats = ApiKeyService.getStats();

    res.json({
      success: true,
      stats
    });
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "stats": {
    "total": 12,
    "active": 10,
    "inactive": 2,
    "byTier": {
      "free": 5,
      "premium": 4,
      "enterprise": 2,
      "admin": 1
    }
  }
}
```

---

## Boas Práticas

### ✅ DO

**1. Sempre mascare keys em logs**
```typescript
// ✅ Correto
log.info('Key validada', {
  apiKey: ApiKeyService.maskKey(apiKey)
});
```

**2. Use expiração para keys temporárias**
```typescript
// ✅ Trial de 7 dias
const key = await ApiKeyService.generateKey(
  userId,
  userName,
  UserTier.PREMIUM,
  7
);
```

**3. Revogue keys comprometidas imediatamente**
```typescript
// ✅ Ação rápida
await ApiKeyService.revokeKey(compromisedKey);
log.warn('Key comprometida revogada', { userId });
```

**4. Retorne key completa apenas UMA VEZ**
```typescript
// ✅ Ao gerar
const apiKey = await ApiKeyService.generateKey(...);
res.json({ apiKey }); // Única vez

// ✅ Depois sempre mascarado
const masked = ApiKeyService.maskKey(apiKey);
```

**5. Rotacione keys regularmente**
```typescript
// ✅ Implementar job de notificação
if (key.expiresAt && key.expiresAt < addDays(new Date(), 7)) {
  await emailService.sendKeyExpirationWarning(userId);
}
```

---

### ❌ DON'T

**1. Não logue keys completas**
```typescript
// ❌ Perigo de vazamento
log.info('Key criada', { apiKey: 'premium-abc123...' });

// ✅ Sempre mascarar
log.info('Key criada', { apiKey: this.maskKey(apiKey) });
```

**2. Não use em produção com memória**
```typescript
// ❌ Dados perdidos ao reiniciar
private static apiKeys: Map<string, ApiKeyConfig>

// ✅ Usar banco de dados
const keyConfig = await db.query('SELECT * FROM api_keys...');
```

**3. Não ignore expiração**
```typescript
// ❌ Não verifica expiresAt
if (keyConfig && keyConfig.active) {
  return keyConfig; // Pode estar expirada!
}

// ✅ Verificar expiração
if (keyConfig.expiresAt && keyConfig.expiresAt < new Date()) {
  return null;
}
```

**4. Não reutilize keys revogadas**
```typescript
// ❌ Tentar "desrevogar"
keyConfig.active = true; // NÃO FAÇA ISSO

// ✅ Gerar nova key
const newKey = await ApiKeyService.generateKey(...);
```

**5. Não envie keys por email não criptografado**
```typescript
// ❌ Plain text email
await emailService.send({
  to: user.email,
  subject: 'Sua API Key',
  body: `Key: ${apiKey}` // INSEGURO!
});

// ✅ Link seguro (HTTPS)
const secureLink = `https://app.com/keys/reveal?token=${oneTimeToken}`;
await emailService.send({
  body: `Acesse: ${secureLink}`
});
```

---

## Troubleshooting

### Problema: Keys não persistem

**Sintoma:**
- Keys desaparecem ao reiniciar
- Usuários perdem acesso

**Causa:**
- Storage em memória

**Solução:**
```typescript
// Migrar para banco de dados
// Ver seção "Migração para Produção"
```

---

### Problema: Keys não funcionam em cluster

**Sintoma:**
- Keys funcionam em um servidor mas não em outro
- Comportamento inconsistente

**Causa:**
- Map não é compartilhado entre processos

**Solução:**
```typescript
// Usar Redis ou banco de dados compartilhado
// Ver "Opção 3: Redis Cache + DB"
```

---

### Problema: validateKey() sempre retorna null

**Sintoma:**
- Keys válidas não são reconhecidas

**Diagnóstico:**
```typescript
// Verificar se initialize() foi chamado
const stats = ApiKeyService.getStats();
console.log(stats); // total: 0 = não inicializado

// Verificar se key existe
const allKeys = Array.from(ApiKeyService['apiKeys'].keys());
console.log(allKeys); // Lista todas as keys
```

**Solução:**
```typescript
// Chamar initialize() no startup
ApiKeyService.initialize();
```

---

### Problema: Keys expiram muito rápido

**Sintoma:**
- Usuários reclamam de expiração frequente

**Diagnóstico:**
```typescript
const key = await ApiKeyService.getUserKeys(userId);
console.log(key[0].expiresAt); // Ver data de expiração
```

**Solução:**
```typescript
// Aumentar tempo de expiração
const key = await ApiKeyService.generateKey(
  userId,
  userName,
  tier,
  90 // 90 dias ao invés de 30
);
```

---

## Referências

### Arquivos Relacionados

- `apiKey.types.ts` - Types (UserTier, ApiKeyConfig)
- `apiKeyAuth.middleware.ts` - Middleware de autenticação
- `userRateLimit.middleware.ts` - Rate limiting por tier
- `logger.ts` - Sistema de logging

### Links Externos

- [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) - Node.js Crypto
- [OWASP API Security](https://owasp.org/www-project-api-security/) - Segurança de APIs
- [RFC 6749 OAuth 2.0](https://tools.ietf.org/html/rfc6749) - Bearer Tokens

### Conceitos

- **API Key** - Chave de autenticação
- **Tier** - Nível/plano do usuário
- **CSPRNG** - Cryptographically Secure PRNG
- **Singleton** - Padrão de design
- **Rate Limiting** - Controle de taxa

---

## Resumo

### O que é?

Serviço singleton para gerenciar autenticação via API Keys com CRUD completo, validação e estatísticas.

### Métodos

| Método | Tipo | Descrição |
|--------|------|-----------|
| initialize() | void | Inicializa keys de exemplo |
| validateKey() | Promise<ApiKeyConfig\|null> | Valida key |
| generateKey() | Promise<string> | Gera nova key |
| revokeKey() | Promise<boolean> | Revoga key |
| getUserKeys() | Promise<ApiKeyConfig[]> | Lista keys do usuário |
| updateUserTier() | Promise<void> | Atualiza tier |
| getStats() | object | Estatísticas |

### Formato de Key

```
[tier]-[32-char-hex]
free-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Segurança

- **Entropia:** 128 bits (2^128 possibilidades)
- **Algoritmo:** crypto.randomBytes (CSPRNG)
- **Mascaramento:** Logs sempre com `maskKey()`
- **Rotação:** 30-365 dias dependendo do tier

### Storage

- **Desenvolvimento:** Map em memória
- **Produção:** PostgreSQL/MongoDB + Redis cache

---

**Última atualização:** 2025-10-07