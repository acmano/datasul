# Middleware de Autenticação por API Key

**Arquivo:** `src/shared/middlewares/apiKeyAuth.middleware.ts`
**Tipo:** Middleware Express
**Propósito:** Autenticação baseada em API Keys

---

## Visão Geral

Middleware que fornece autenticação baseada em API Keys com suporte a múltiplas fontes de entrada e dois modos de operação.

### Funcionalidades

- ✅ Validação de API Keys
- ✅ Verificação de expiração
- ✅ Suporte a múltiplas fontes de entrada
- ✅ Modo obrigatório e opcional
- ✅ Logging de autenticações
- ✅ Mascaramento de keys nos logs
- ✅ Integração com rate limiting
- ✅ Informações do usuário no request

---

## Fontes de API Key

O middleware busca a API Key em **3 fontes diferentes**, seguindo esta ordem de prioridade:

### 1. Header X-API-Key (Recomendado)

```http
GET /api/protected HTTP/1.1
Host: api.example.com
X-API-Key: premium-a1b2c3d4e5f6
```

**Por que usar:**
- ✅ Formato específico para API Keys
- ✅ Não confunde com outros tokens
- ✅ Padrão amplamente usado
- ✅ Mais semântico

### 2. Header Authorization Bearer

```http
GET /api/protected HTTP/1.1
Host: api.example.com
Authorization: Bearer premium-a1b2c3d4e5f6
```

**Por que usar:**
- ✅ Padrão OAuth 2.0
- ✅ Compatível com muitas ferramentas
- ✅ Bem suportado por bibliotecas
- ✅ Fácil integração

### 3. Query Parameter (Menos Seguro)

```http
GET /api/protected?api_key=premium-a1b2c3d4e5f6 HTTP/1.1
Host: api.example.com
```

**⚠️ Cuidados:**
- ❌ Aparece nos logs do servidor
- ❌ Fica no histórico do browser
- ❌ Visível na barra de endereço
- ❌ Pode ser compartilhado acidentalmente
- ⚠️ Use apenas em desenvolvimento ou casos específicos

---

## Middlewares Disponíveis

### 1. apiKeyAuth (Obrigatório)

Middleware que **requer** API Key válida para acesso.

**Comportamento:**
- ✅ Valida API Key obrigatoriamente
- ❌ Bloqueia se não fornecida (401)
- ❌ Bloqueia se inválida/expirada (401)
- ✅ Adiciona `req.user` e `req.apiKey`

**Quando usar:**
- Endpoints privados
- Dados sensíveis
- Operações de escrita
- Recursos restritos

### 2. optionalApiKeyAuth (Opcional)

Middleware que permite acesso **com ou sem** API Key.

**Comportamento:**
- ✅ Valida se API Key fornecida
- ✅ Permite sem API Key
- ✅ Ignora keys inválidas silenciosamente
- ✅ Adiciona `req.user` se autenticado

**Quando usar:**
- Endpoints públicos com features extras
- Rate limiting diferenciado
- Analytics de uso
- Migração gradual

---

## Fluxo de Execução

### apiKeyAuth (Obrigatório)

```
Request recebido
    ↓
Extrair API Key
    ├─ X-API-Key header
    ├─ Authorization Bearer
    └─ Query parameter api_key
    ↓
API Key encontrada? ──NO──→ AuthenticationError (401)
    ↓ YES
Validar com ApiKeyService
    ↓
Key válida e não expirada? ──NO──→ AuthenticationError (401)
    ↓ YES
Adicionar req.apiKey e req.user
    ↓
Log de autenticação
    ↓
Próximo middleware (next)
```

### optionalApiKeyAuth (Opcional)

```
Request recebido
    ↓
Extrair API Key
    ↓
API Key encontrada? ──NO──→ Continuar sem auth (next)
    ↓ YES
Validar com ApiKeyService
    ↓
Key válida? ──NO──→ Ignorar e continuar (next)
    ↓ YES
Adicionar req.apiKey e req.user
    ↓
Log de autenticação
    ↓
Próximo middleware (next)
```

---

## Propriedades do Request

Após autenticação bem-sucedida, o middleware adiciona:

### req.apiKey

Configuração completa da API Key.

```typescript
interface ApiKeyConfig {
  key: string;        // API Key completa
  userId: string;     // ID do usuário
  userName: string;   // Nome do usuário
  tier: UserTier;     // Tier de acesso
  active: boolean;    // Se está ativa
  createdAt: Date;    // Data de criação
  expiresAt?: Date;   // Data de expiração (opcional)
}
```

### req.user

Informações do usuário (atalho para facilitar acesso).

```typescript
interface RequestUser {
  id: string;     // ID do usuário
  name: string;   // Nome do usuário
  tier: UserTier; // Tier de acesso
}
```

---

## Documentação das Funções

### apiKeyAuth()

Middleware de autenticação **obrigatória** por API Key.

**Assinatura:**
```typescript
async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void>
```

**Parâmetros:**
- `req` - Request do Express (modificado com `apiKey` e `user`)
- `res` - Response do Express
- `next` - Callback para próximo middleware

**Throws:**
- `AuthenticationError` (401) - Se API Key não fornecida
- `AuthenticationError` (401) - Se API Key inválida ou expirada

**Uso:**
```typescript
import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';

router.get('/protected', apiKeyAuth, controller);
```

---

### optionalApiKeyAuth()

Middleware de autenticação **opcional** por API Key.

**Assinatura:**
```typescript
async function optionalApiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void>
```

**Parâmetros:**
- `req` - Request do Express (modificado se API Key válida)
- `res` - Response do Express
- `next` - Callback para próximo middleware

**Throws:**
- Nenhum erro (nunca bloqueia)

**Uso:**
```typescript
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';

router.get('/public', optionalApiKeyAuth, controller);
```

---

### extractApiKey() (privada)

Extrai API Key do request de múltiplas fontes.

**Assinatura:**
```typescript
function extractApiKey(req: Request): string | null
```

**Retorna:**
- `string` - API Key encontrada
- `null` - Nenhuma API Key encontrada

**Ordem de busca:**
1. Header `X-API-Key`
2. Header `Authorization: Bearer`
3. Query parameter `api_key`

---

### maskApiKey() (privada)

Mascara API Key para exibição segura em logs.

**Assinatura:**
```typescript
function maskApiKey(apiKey: string): string
```

**Parâmetros:**
- `apiKey` - API Key completa

**Retorna:**
- String mascarada mostrando primeiros e últimos 4 caracteres

**Exemplos:**
```typescript
maskApiKey('premium-key-abc123')
// → "prem...c123"

maskApiKey('free-demo-key-123456')
// → "free...3456"

maskApiKey('short')
// → "***"
```

---

## Exemplos de Uso

### Exemplo 1: Endpoint Protegido

```typescript
import { Router } from 'express';
import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';

const router = Router();

router.get('/protected', apiKeyAuth, (req, res) => {
  // API Key já validada
  const { id, name, tier } = req.user!;

  res.json({
    message: `Olá ${name}!`,
    tier,
    userId: id
  });
});
```

**Testando:**
```bash
# Sucesso
curl -H "X-API-Key: premium-key-abc123" \
  http://localhost:3000/api/protected

# Erro 401
curl http://localhost:3000/api/protected
```

---

### Exemplo 2: Com Rate Limiting

```typescript
import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';

router.get('/data',
  apiKeyAuth,      // 1. Valida API Key
  userRateLimit,   // 2. Verifica rate limit por tier
  controller       // 3. Executa lógica
);
```

---

### Exemplo 3: Endpoint Público com Features Extras

```typescript
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';

router.get('/articles/:id',
  optionalApiKeyAuth,
  (req, res) => {
    const article = getArticle(req.params.id);

    // Conteúdo base (público)
    const response = {
      id: article.id,
      title: article.title,
      excerpt: article.excerpt
    };

    // Se autenticado, adiciona conteúdo extra
    if (req.user) {
      response.fullContent = article.content;
      response.relatedArticles = article.related;
      response.userTier = req.user.tier;
    }

    res.json(response);
  }
);
```

**Testando:**
```bash
# Com autenticação (conteúdo completo)
curl -H "X-API-Key: premium-key-abc123" \
  http://localhost:3000/api/articles/123

# Sem autenticação (apenas excerpt)
curl http://localhost:3000/api/articles/123
```

---

### Exemplo 4: Acessando Dados do Usuário

```typescript
router.get('/profile', apiKeyAuth, (req, res) => {
  // Forma 1: via req.user (atalho)
  console.log(req.user.id);      // 'user-001'
  console.log(req.user.name);    // 'Premium User'
  console.log(req.user.tier);    // UserTier.PREMIUM

  // Forma 2: via req.apiKey (completo)
  console.log(req.apiKey.key);        // API Key completa
  console.log(req.apiKey.createdAt);  // Data de criação
  console.log(req.apiKey.expiresAt);  // Data de expiração
  console.log(req.apiKey.active);     // Status

  res.json({
    user: req.user,
    keyCreated: req.apiKey.createdAt
  });
});
```

---

### Exemplo 5: Rate Limiting Diferenciado

```typescript
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';

router.get('/public-data',
  optionalApiKeyAuth,  // Autentica se possível
  userRateLimit,       // Rate limit adaptativo
  controller
);

// Limites aplicados:
// - Autenticado FREE: 20 req/min
// - Autenticado PREMIUM: 60 req/min
// - Autenticado ENTERPRISE: ilimitado
// - Não autenticado (IP): 10 req/min
```

---

### Exemplo 6: Verificação Manual no Controller

```typescript
router.post('/create', optionalApiKeyAuth, (req, res) => {
  // Operação sensível requer autenticação
  if (!req.user) {
    return res.status(401).json({
      error: 'Autenticação necessária para criar recursos'
    });
  }

  // Apenas premium pode criar
  if (req.user.tier !== UserTier.PREMIUM) {
    return res.status(403).json({
      error: 'Recurso disponível apenas para tier Premium'
    });
  }

  // Prosseguir com criação
  const resource = createResource(req.body, req.user.id);
  res.json({ success: true, resource });
});
```

---

### Exemplo 7: Analytics de Uso

```typescript
router.get('/popular-items',
  optionalApiKeyAuth,
  (req, res) => {
    const items = getPopularItems();

    // Registra visualização
    analytics.track({
      event: 'popular_items_view',
      authenticated: !!req.user,
      userId: req.user?.id || 'anonymous',
      tier: req.user?.tier || 'free',
      timestamp: new Date()
    });

    res.json(items);
  }
);
```

---

## Respostas de Erro

### Erro 401 - API Key Não Fornecida

```json
{
  "error": "AuthenticationError",
  "message": "API Key não fornecida. Forneça via header X-API-Key ou Authorization: Bearer <key>",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "path": "/api/protected",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Erro 401 - API Key Inválida

```json
{
  "error": "AuthenticationError",
  "message": "API Key inválida ou expirada: prem...c123",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "path": "/api/protected",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Observações:**
- ✅ API Key é mascarada na mensagem de erro
- ✅ CorrelationId permite rastrear nos logs
- ✅ Timestamp preciso do erro
- ✅ Path mostra qual endpoint falhou

---

## Testando no Terminal

### Usando curl

```bash
# Formato 1: Header X-API-Key (recomendado)
curl -H "X-API-Key: premium-key-abc123" \
  http://localhost:3000/api/protected

# Formato 2: Bearer token
curl -H "Authorization: Bearer premium-key-abc123" \
  http://localhost:3000/api/protected

# Formato 3: Query parameter (menos seguro)
curl "http://localhost:3000/api/protected?api_key=premium-key-abc123"

# Sem API Key (erro 401)
curl http://localhost:3000/api/protected
```

### Usando HTTPie

```bash
# Header X-API-Key
http GET localhost:3000/api/protected X-API-Key:premium-key-abc123

# Bearer token
http GET localhost:3000/api/protected Authorization:"Bearer premium-key-abc123"

# Query parameter
http GET localhost:3000/api/protected api_key==premium-key-abc123
```

### Usando Postman

1. **Tab Authorization:**
   - Type: API Key
   - Key: X-API-Key
   - Value: premium-key-abc123
   - Add to: Header

2. **Ou manualmente em Headers:**
   - Key: `X-API-Key`
   - Value: `premium-key-abc123`

---

## Segurança

### ✅ Boas Práticas

#### 1. Sempre use HTTPS em Produção

```typescript
// ❌ NÃO FAÇA
http://api.example.com/data?api_key=secret123

// ✅ FAÇA
https://api.example.com/data
Headers: X-API-Key: secret123
```

#### 2. Prefira Headers sobre Query Params

```typescript
// ❌ Menos seguro
GET /api/data?api_key=secret123

// ✅ Mais seguro
GET /api/data
X-API-Key: secret123
```

#### 3. Rotacione Keys Periodicamente

```typescript
// Implementar rotação automática
const keyAge = Date.now() - req.apiKey.createdAt.getTime();
const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 dias

if (keyAge > maxAge) {
  log.warn('API Key antiga, solicite rotação', {
    userId: req.user.id,
    keyAge: `${Math.floor(keyAge / (24*60*60*1000))} dias`
  });
}
```

#### 4. Monitore Uso Suspeito

```typescript
// Alertar sobre tentativas de keys inválidas
if (!keyConfig) {
  log.warn('Tentativa de acesso com key inválida', {
    maskedKey: maskApiKey(apiKey),
    ip: req.ip,
    path: req.path
  });
}
```

### ⚠️ Cuidados

#### 1. Query Parameters

- ❌ Aparecem em logs
- ❌ Ficam no histórico
- ❌ Podem ser compartilhados
- ✅ Use apenas em desenvolvimento

#### 2. Mascaramento de Keys

```typescript
// ✅ Sempre mascare nos logs
log.info('Auth success', { key: maskApiKey(apiKey) });

// ❌ Nunca logue keys completas
log.info('Auth success', { key: apiKey }); // PERIGOSO!
```

#### 3. Erro Silencioso no optionalApiKeyAuth

```typescript
// optionalApiKeyAuth ignora erros
// Para segurança contra enumeração de keys

// ✅ Key inválida → Continua sem autenticação
// ❌ NÃO retorna "key inválida" (previne enumeração)
```

---

## Integração com Outros Middlewares

### Com Rate Limiting

```typescript
router.get('/data',
  apiKeyAuth,         // 1. Autentica
  userRateLimit,      // 2. Aplica rate limit por tier
  controller
);
```

### Com Logging

```typescript
router.get('/data',
  requestLogger,      // 1. Loga request
  apiKeyAuth,         // 2. Autentica
  responseLogger,     // 3. Loga response
  controller
);
```

### Com Validação

```typescript
router.post('/items',
  apiKeyAuth,              // 1. Autentica
  validateRequest(schema), // 2. Valida body
  controller
);
```

---

## Diferenças Entre os Middlewares

| Aspecto | apiKeyAuth | optionalApiKeyAuth |
|---------|------------|-------------------|
| **API Key obrigatória** | ✅ Sim | ❌ Não |
| **Bloqueia sem key** | ✅ Sim (401) | ❌ Não |
| **Bloqueia key inválida** | ✅ Sim (401) | ❌ Não (ignora) |
| **Adiciona req.user** | ✅ Sempre | ✅ Se válida |
| **Uso típico** | Endpoints privados | Endpoints públicos |
| **Rate limiting** | Por tier | Por tier ou IP |

---

## Logs Gerados

### Log de Sucesso

```json
{
  "level": "debug",
  "message": "Autenticação via API Key",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-001",
  "tier": "PREMIUM",
  "apiKey": "prem...c123",
  "timestamp": "2025-10-06T12:00:00.000Z"
}
```

### Log de Falha

```json
{
  "level": "warn",
  "message": "Tentativa de acesso com key inválida",
  "maskedKey": "inva...d123",
  "ip": "192.168.1.100",
  "path": "/api/protected",
  "timestamp": "2025-10-06T12:00:00.000Z"
}
```

---

## Referências

### Arquivos Relacionados

- `ApiKeyService.ts` - Validação de API Keys
- `userRateLimit.middleware.ts` - Rate limiting por tier
- `errors.ts` - AuthenticationError
- `logger.ts` - Sistema de logs

### Documentos

- `API_Key_Rate_Limit.md` - Guia completo de API Keys e Rate Limiting
- `AUTHENTICATION.md` - Guia de autenticação do projeto

### Padrões Utilizados

- **API Key Authentication** - Autenticação stateless
- **Bearer Token** - Padrão OAuth 2.0
- **Rate Limiting** - Controle de requisições por tier
- **Correlation ID** - Rastreamento de requisições

---

## Resumo

### O que é

Middleware Express para autenticação baseada em API Keys com dois modos de operação.

### Exports

- **apiKeyAuth** - Middleware obrigatório (bloqueia sem key)
- **optionalApiKeyAuth** - Middleware opcional (permite sem key)

### Fontes de API Key

1. Header `X-API-Key` (recomendado)
2. Header `Authorization: Bearer`
3. Query parameter `api_key` (menos seguro)

### Quando usar

- **apiKeyAuth** → Endpoints privados, operações sensíveis
- **optionalApiKeyAuth** → Endpoints públicos com features extras

### Vantagens

- ✅ Múltiplas fontes de entrada
- ✅ Mascaramento automático em logs
- ✅ Integração com rate limiting
- ✅ Modo obrigatório e opcional
- ✅ Validação automática de expiração
- ✅ Informações do usuário no request
- ✅ Correlation ID para rastreamento