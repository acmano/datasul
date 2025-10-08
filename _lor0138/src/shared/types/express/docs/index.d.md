# Express Types

> Extensões de tipos do Express com propriedades customizadas

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Propriedades Adicionadas](#propriedades-adicionadas)
- [Configuração TypeScript](#configuração-typescript)
- [Exemplos de Uso](#exemplos-de-uso)
- [Middlewares Relacionados](#middlewares-relacionados)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

---

## Visão Geral

### O que é?

Arquivo de declaração de tipos TypeScript que estende a interface `Request` do Express com propriedades customizadas utilizadas pela aplicação.

### Características

- ✅ **5 propriedades** - id, startTime, timedout, apiKey, user
- ✅ **Global** - Disponível em toda a aplicação
- ✅ **Auto-carregado** - Via tsconfig.json
- ✅ **Type-safe** - Tipagem forte
- ✅ **Não requer import** - Declaração global

### Tecnologias

- **TypeScript** - Sistema de tipos
- **Express** - Framework web
- **Ambient Declarations** - Declarações globais

---

## Propriedades Adicionadas

### 1. id (Correlation ID)

```typescript
id: string
```

**O que é:**
- Correlation ID único para rastreamento da requisição

**Definido por:**
- `correlationId.middleware.ts`

**Formato:**
- UUID v4 (gerado) ou string customizada (cliente)

**Headers Aceitos:**
- `X-Correlation-ID`
- `X-Request-ID`
- `correlation-id`

**Características:**
- Gerado automaticamente se não fornecido
- Propagado em todos os logs
- Retornado no header de resposta `X-Correlation-ID`
- Permite rastreamento end-to-end

**Exemplo:**
```typescript
// Em qualquer controller/middleware
log.info('Processing request', {
  correlationId: req.id
});

// Valor típico
req.id // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

---

### 2. startTime

```typescript
startTime?: number
```

**O que é:**
- Timestamp de quando a requisição foi recebida (ms desde epoch)

**Definido por:**
- `correlationId.middleware.ts`

**Formato:**
- `Date.now()` - milissegundos desde 1970

**Usado para:**
- Calcular duração da requisição
- Métricas de performance
- Logs de latência

**Exemplo:**
```typescript
// Calcular duração
const duration = Date.now() - req.startTime!;
log.info('Request completed', {
  correlationId: req.id,
  duration: `${duration}ms`
});

// Valor típico
req.startTime // 1696599600000
```

**⚠️ IMPORTANTE:**
Propriedade opcional (`?`), sempre verificar se existe antes de usar.

---

### 3. timedout

```typescript
timedout?: boolean
```

**O que é:**
- Flag indicando se a requisição atingiu timeout

**Definido por:**
- `timeout.middleware.ts` (connect-timeout)

**Valores:**
- `true` - Requisição abortada por timeout
- `false` / `undefined` - Dentro do limite

**Usado para:**
- Logging de timeouts
- Métricas
- Parar processamento de requests abortados

**Exemplo:**
```typescript
// Controller com verificação de timeout
async function handler(req, res) {
  // Verificar se timeout antes de operação pesada
  if (req.timedout) {
    log.warn('Request timed out', {
      correlationId: req.id
    });
    return; // Não processar
  }

  await heavyOperation();
  res.json({ success: true });
}
```

**⚠️ CRÍTICO:**
Sempre verificar `req.timedout` antes de operações custosas para evitar desperdício de recursos.

---

### 4. apiKey

```typescript
apiKey?: ApiKeyConfig
```

**O que é:**
- Configuração completa da API Key utilizada

**Definido por:**
- `apiKeyAuth.middleware.ts`

**Estrutura:**
```typescript
interface ApiKeyConfig {
  key: string;
  userId: string;
  userName: string;
  tier: UserTier;
  active: boolean;
  createdAt: Date;
  expiresAt?: Date;
}
```

**Valores:**
- Objeto `ApiKeyConfig` - Requisição autenticada
- `undefined` - Requisição não autenticada

**Usado para:**
- Auditoria detalhada
- Logging completo
- Debugging

**Exemplo:**
```typescript
// Auditoria detalhada
if (req.apiKey) {
  await AuditLog.create({
    userId: req.apiKey.userId,
    userName: req.apiKey.userName,
    tier: req.apiKey.tier,
    action: 'DELETE_ITEM',
    keyCreatedAt: req.apiKey.createdAt,
    keyExpiresAt: req.apiKey.expiresAt
  });
}
```

**⚠️ SENSÍVEL:**
Contém a API Key completa. NUNCA logar `req.apiKey.key` - sempre mascarar.

---

### 5. user

```typescript
user?: {
  id: string;
  name: string;
  tier: UserTier;
}
```

**O que é:**
- Dados simplificados do usuário autenticado

**Definido por:**
- `apiKeyAuth.middleware.ts`

**Campos:**
- `id` - ID único do usuário
- `name` - Nome para exibição
- `tier` - FREE | PREMIUM | ENTERPRISE | ADMIN

**Valores:**
- Objeto com dados - Requisição autenticada
- `undefined` - Requisição não autenticada

**Usado para:**
- Rate limiting (tier-based)
- Controle de acesso (RBAC)
- Logging simplificado
- Business logic

**Exemplo:**
```typescript
// Controle de acesso baseado em tier
if (req.user?.tier === UserTier.ADMIN) {
  // Acesso administrativo permitido
  await performAdminAction();
} else {
  throw new AuthorizationError('Admin access required');
}

// Rate limiting
const limit = {
  [UserTier.FREE]: 10,
  [UserTier.PREMIUM]: 60,
  [UserTier.ENTERPRISE]: 300,
  [UserTier.ADMIN]: 1000
}[req.user!.tier];
```

**⚠️ IMPORTANTE:**
Sempre usar optional chaining (`?.`) ou verificar existência antes de acessar.

---

## Configuração TypeScript

### tsconfig.json

```json
{
  "compilerOptions": {
    "typeRoots": [
      "./node_modules/@types",
      "./src/shared/types"
    ]
  }
}
```

**O que faz:**
- Adiciona `./src/shared/types` aos type roots
- TypeScript carrega automaticamente arquivos `.d.ts`
- Extensões ficam disponíveis globalmente

### Estrutura de Pastas

```
src/
└── shared/
    └── types/
        ├── express/
        │   └── index.d.ts      ← Este arquivo
        ├── apiKey.types.ts
        └── other.types.ts
```

### Auto-carregamento

**Não é necessário:**
```typescript
// ❌ NÃO PRECISA
import { Request } from '@shared/types/express';
```

**Funciona automaticamente:**
```typescript
// ✅ JÁ ESTÁ DISPONÍVEL
import { Request } from 'express';

function handler(req: Request, res: Response) {
  console.log(req.id);        // ✅ TypeScript reconhece
  console.log(req.user);      // ✅ TypeScript reconhece
  console.log(req.startTime); // ✅ TypeScript reconhece
}
```

---

## Exemplos de Uso

### Controller Básico

```typescript
import { Request, Response } from 'express';
import { log } from '@shared/utils/logger';

export class ItemController {
  static async getItem(req: Request, res: Response) {
    // Correlation ID (sempre presente)
    const correlationId = req.id;

    // User (pode não existir)
    const userId = req.user?.id;
    const tier = req.user?.tier;

    log.info('Fetching item', {
      correlationId,
      userId,
      tier,
      itemCodigo: req.params.itemCodigo
    });

    // Verificar timeout
    if (req.timedout) {
      log.warn('Request timed out', { correlationId });
      return;
    }

    const item = await ItemService.getItem(req.params.itemCodigo);

    res.json({
      success: true,
      data: item
    });
  }
}
```

---

### Middleware com Verificações

```typescript
import { Request, Response, NextFunction } from 'express';

export function customMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Verificar autenticação
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      correlationId: req.id
    });
  }

  // 2. Verificar tier
  if (req.user.tier === UserTier.FREE) {
    return res.status(403).json({
      success: false,
      error: 'Premium feature',
      correlationId: req.id
    });
  }

  // 3. Verificar timeout
  if (req.timedout) {
    log.warn('Timeout detected in middleware', {
      correlationId: req.id,
      userId: req.user.id
    });
    return;
  }

  // 4. Adicionar info customizada
  log.debug('Middleware passed', {
    correlationId: req.id,
    userId: req.user.id,
    tier: req.user.tier
  });

  next();
}
```

---

### Auditoria Completa

```typescript
import { Request } from 'express';

export class AuditService {
  static async logAction(
    req: Request,
    action: string,
    details: any
  ) {
    await AuditLog.create({
      // Rastreamento
      correlationId: req.id,
      timestamp: new Date(),

      // Usuário
      userId: req.user?.id,
      userName: req.user?.name,
      tier: req.user?.tier,

      // API Key (se disponível)
      apiKeyUsed: req.apiKey?.key,
      apiKeyCreatedAt: req.apiKey?.createdAt,
      apiKeyExpiresAt: req.apiKey?.expiresAt,

      // Requisição
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),

      // Ação
      action,
      details,

      // Performance
      duration: req.startTime ? Date.now() - req.startTime : undefined
    });
  }
}

// Uso em controller
await AuditService.logAction(req, 'DELETE_ITEM', {
  itemCodigo: req.params.itemCodigo
});
```

---

### Rate Limiting Customizado

```typescript
import { Request, Response, NextFunction } from 'express';

const rateLimits = new Map<string, number>();

export function customRateLimit(req: Request, res: Response, next: NextFunction) {
  // Key baseada em user ou IP
  const key = req.user?.id || req.ip;

  // Limite baseado em tier
  const limit = req.user ? {
    [UserTier.FREE]: 10,
    [UserTier.PREMIUM]: 60,
    [UserTier.ENTERPRISE]: 300,
    [UserTier.ADMIN]: 1000
  }[req.user.tier] : 5; // Anônimos: 5/min

  // Verificar limite
  const current = rateLimits.get(key) || 0;

  if (current >= limit) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      correlationId: req.id,
      limit,
      resetIn: 60
    });
  }

  // Incrementar contador
  rateLimits.set(key, current + 1);

  // Resetar após 1 minuto
  setTimeout(() => rateLimits.delete(key), 60000);

  next();
}
```

---

### Logs Estruturados

```typescript
import { Request } from 'express';
import { log } from '@shared/utils/logger';

export function structuredLog(req: Request, level: string, message: string, extra?: any) {
  log[level](message, {
    // Contexto da requisição
    correlationId: req.id,
    userId: req.user?.id,
    tier: req.user?.tier,

    // Performance
    duration: req.startTime ? Date.now() - req.startTime : undefined,
    timedout: req.timedout,

    // Request info
    method: req.method,
    path: req.path,
    ip: req.ip,

    // Extra data
    ...extra
  });
}

// Uso
structuredLog(req, 'info', 'Item created', {
  itemCodigo: newItem.codigo,
  itemDescricao: newItem.descricao
});
```

---

## Middlewares Relacionados

### Ordem de Execução

```typescript
import express from 'express';

const app = express();

// 1. correlationId - Define req.id, req.startTime
app.use(correlationId);

// 2. requestTimeout - Define req.timedout
app.use(requestTimeout);

// 3. apiKeyAuth - Define req.apiKey, req.user
app.use(apiKeyAuth);

// 4. Seus middlewares podem usar todas as propriedades
app.use(customMiddleware);

// 5. Rotas
app.use('/api', routes);
```

### Dependências

| Propriedade | Middleware | Obrigatório |
|-------------|------------|-------------|
| `req.id` | correlationId | ✅ Sim |
| `req.startTime` | correlationId | ✅ Sim |
| `req.timedout` | requestTimeout | ❌ Não |
| `req.apiKey` | apiKeyAuth | ❌ Não |
| `req.user` | apiKeyAuth | ❌ Não |

---

## Boas Práticas

### ✅ DO

**1. Sempre use req.id em logs**
```typescript
// ✅ Facilita rastreamento
log.info('Processing', { correlationId: req.id });
```

**2. Verifique existência de propriedades opcionais**
```typescript
// ✅ Safe
if (req.user?.tier === UserTier.ADMIN) {
  // ...
}

// ❌ Perigoso
if (req.user.tier === UserTier.ADMIN) {
  // Erro se req.user undefined
}
```

**3. Use startTime para métricas**
```typescript
// ✅ Performance tracking
const duration = req.startTime ? Date.now() - req.startTime : 0;
log.info('Completed', { duration });
```

**4. Verifique timeout antes de operações pesadas**
```typescript
// ✅ Evita desperdício
if (req.timedout) return;
await heavyOperation();
```

**5. Use user.tier para controle de acesso**
```typescript
// ✅ Role-based access
if (req.user?.tier === UserTier.ADMIN) {
  // Admin only
}
```

---

### ❌ DON'T

**1. Não assuma que propriedades opcionais existem**
```typescript
// ❌ Pode dar erro
const userId = req.user.id;

// ✅ Safe
const userId = req.user?.id;
```

**2. Não logue API Key completa**
```typescript
// ❌ Vazamento de segurança
log.info('Auth', { apiKey: req.apiKey?.key });

// ✅ Mascarado ou apenas userId
log.info('Auth', { userId: req.user?.id });
```

**3. Não ignore req.timedout**
```typescript
// ❌ Processa requisição abortada
async function handler(req, res) {
  await heavyOperation(); // Desperdício se timeout
}

// ✅ Verifica timeout
async function handler(req, res) {
  if (req.timedout) return;
  await heavyOperation();
}
```

**4. Não modifique propriedades diretamente**
```typescript
// ❌ Não sobrescrever
req.id = 'custom-id';

// ✅ Propriedades são read-only após serem definidas
```

**5. Não dependa de propriedades não inicializadas**
```typescript
// ❌ startTime pode ser undefined
const duration = Date.now() - req.startTime;

// ✅ Verificar primeiro
const duration = req.startTime ? Date.now() - req.startTime : 0;
```

---

## Troubleshooting

### Problema: TypeScript não reconhece propriedades

**Sintoma:**
```typescript
// Erro: Property 'id' does not exist on type 'Request'
console.log(req.id);
```

**Causa:**
- tsconfig.json não configurado corretamente
- typeRoots não inclui pasta de tipos

**Solução:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "typeRoots": [
      "./node_modules/@types",
      "./src/shared/types"  // ← Adicionar
    ]
  }
}
```

---

### Problema: req.user sempre undefined

**Sintoma:**
```typescript
console.log(req.user); // undefined
```

**Causa:**
- Middleware `apiKeyAuth` não registrado
- Registrado após uso
- API Key inválida

**Diagnóstico:**
```typescript
// Verificar ordem de middlewares
app.use(correlationId);
app.use(apiKeyAuth);  // Antes das rotas
app.use('/api', routes);
```

**Solução:**
```typescript
// Registrar apiKeyAuth ANTES das rotas
app.use(apiKeyAuth);
```

---

### Problema: req.id sempre undefined

**Sintoma:**
```typescript
console.log(req.id); // undefined
```

**Causa:**
- Middleware `correlationId` não registrado

**Solução:**
```typescript
// Registrar correlationId PRIMEIRO
app.use(correlationId);
```

---

### Problema: startTime incorreto

**Sintoma:**
- Duração negativa
- Duração muito grande

**Causa:**
- startTime não foi definido
- startTime sobrescrito

**Solução:**
```typescript
// Sempre verificar se startTime existe
const duration = req.startTime ? Date.now() - req.startTime : 0;

if (duration < 0) {
  log.error('Invalid duration', {
    startTime: req.startTime,
    now: Date.now()
  });
}
```

---

### Problema: IntelliSense não funciona

**Sintoma:**
- Autocompletar não sugere propriedades customizadas

**Causa:**
- VS Code não recarregou tipos
- TypeScript server precisa reiniciar

**Solução:**
1. Reabrir VS Code
2. OU Command Palette → "TypeScript: Restart TS Server"
3. OU deletar pasta `.vscode` e reabrir

---

## Referências

### Arquivos Relacionados

- `correlationId.middleware.ts` - Define req.id, req.startTime
- `timeout.middleware.ts` - Define req.timedout
- `apiKeyAuth.middleware.ts` - Define req.apiKey, req.user
- `apiKey.types.ts` - Types de API Key
- `tsconfig.json` - Configuração TypeScript

### Links Externos

- [TypeScript Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html) - Documentação oficial
- [Express TypeScript](https://expressjs.com/en/advanced/developing-template-engines.html) - Express com TypeScript
- [Ambient Declarations](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html) - Declarações globais

### Conceitos

- **Type Declaration** - Declaração de tipos
- **Ambient Declaration** - Declaração global
- **Module Augmentation** - Estender módulos existentes
- **Type Roots** - Raízes de tipos
- **Interface Merging** - Mesclagem de interfaces

---

## Resumo

### O que é?

Arquivo de declaração de tipos que estende `Request` do Express com 5 propriedades customizadas.

### Propriedades

| Propriedade | Tipo | Definido Por | Obrigatório |
|-------------|------|--------------|-------------|
| **id** | string | correlationId | ✅ |
| **startTime** | number? | correlationId | ❌ |
| **timedout** | boolean? | timeout | ❌ |
| **apiKey** | ApiKeyConfig? | apiKeyAuth | ❌ |
| **user** | object? | apiKeyAuth | ❌ |

### Configuração

```json
{
  "typeRoots": [
    "./node_modules/@types",
    "./src/shared/types"
  ]
}
```

### Uso

```typescript
// Auto-disponível, sem import necessário
import { Request, Response } from 'express';

function handler(req: Request, res: Response) {
  console.log(req.id);           // ✅ TypeScript reconhece
  console.log(req.user?.tier);   // ✅ TypeScript reconhece
  console.log(req.startTime);    // ✅ TypeScript reconhece
}
```

### Ordem de Middlewares

```typescript
1. correlationId   // req.id, req.startTime
2. requestTimeout  // req.timedout
3. apiKeyAuth      // req.apiKey, req.user
4. Rotas           // Todas propriedades disponíveis
```

---

**Última atualização:** 2025-10-07