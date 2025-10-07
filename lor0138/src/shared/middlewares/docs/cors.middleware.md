# Middleware de CORS

**Arquivo:** `src/shared/middlewares/cors.middleware.ts`
**Tipo:** Middleware Express
**Propósito:** Configuração de CORS para rede interna

---

## Visão Geral

Implementa Cross-Origin Resource Sharing (CORS) configurado para permitir acesso apenas de origens autorizadas da rede interna.

### O que é CORS?

**CORS (Cross-Origin Resource Sharing)** é um mecanismo de segurança do navegador que controla quais domínios podem acessar recursos de uma API.

**Problema que resolve:**
```
Browser executa: https://frontend.com
Tenta acessar: https://api.com/data

❌ Sem CORS: Blocked by CORS policy
✅ Com CORS: Access-Control-Allow-Origin: https://frontend.com
```

**Por que é importante:**
- 🔒 **Segurança**: Impede acessos não autorizados
- 🛡️ **Proteção**: Bloqueia ataques de sites maliciosos
- ✅ **Controle**: Define quem pode acessar a API
- 🎯 **Granularidade**: Controla métodos, headers, etc

---

## Origens Permitidas

### Domínios Internos

```typescript
const allowedDomains = [
  'lorenzetti.ibe',      // Domínio principal
  appConfig.baseUrl,     // Configuração do app
];
```

**Aceita:**
- `http://lorenzetti.ibe`
- `http://app.lorenzetti.ibe`
- `http://sistema.lorenzetti.ibe`
- `http://any-subdomain.lorenzetti.ibe`

### IPs Privados (Classe A)

**Range:** `10.0.0.0` - `10.255.255.255`

```typescript
// Padrão: 10.x.x.x
const ipPattern = /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
```

**Aceita:**
- `http://10.0.0.1`
- `http://10.1.2.3`
- `http://10.100.200.150`
- Qualquer IP no range 10.x.x.x

### Localhost

**Aceita:**
- `http://127.0.0.1:3000` (IPv4)
- `http://[::1]:3000` (IPv6)
- `http://localhost:3000` (se resolve para IPs acima)

### Requisições Sem Origin

**Aceita:** Requisições sem header `Origin`

**Exemplos:**
- Postman
- cURL
- Aplicativos mobile nativos
- Requisições server-to-server

---

## Configuração

### CorsOptions

```typescript
{
  origin: Function,          // Validação dinâmica
  credentials: true,         // Permite cookies/auth
  methods: [...],           // Métodos HTTP permitidos
  allowedHeaders: [...],    // Headers aceitos do cliente
  exposedHeaders: [...],    // Headers visíveis ao cliente
  maxAge: 86400            // Cache preflight (24h)
}
```

---

#### origin (Validação Dinâmica)

Função que valida cada origem:

```typescript
origin: (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);   // ✅ Permite
  } else {
    callback(null, false);  // ❌ Bloqueia
  }
}
```

---

#### credentials: true

Permite envio de **cookies** e **headers de autenticação**.

**Habilita:**
- Cookies (session, auth tokens)
- Authorization headers
- Client certificates

**Request deve incluir:**
```javascript
fetch(url, {
  credentials: 'include'  // ← Necessário
})
```

---

#### methods

Métodos HTTP permitidos:

```typescript
methods: [
  'GET',     // Leitura
  'POST',    // Criação
  'PUT',     // Atualização completa
  'DELETE',  // Remoção
  'PATCH',   // Atualização parcial
  'OPTIONS'  // Preflight
]
```

---

#### allowedHeaders

Headers que o **cliente pode enviar**:

```typescript
allowedHeaders: [
  'Content-Type',      // Tipo do body
  'Authorization',     // Token de autenticação
  'X-Requested-With',  // Identificador AJAX
  'Accept',           // Formatos aceitos
]
```

**Cliente envia:**
```http
Content-Type: application/json
Authorization: Bearer abc123
X-Requested-With: XMLHttpRequest
```

---

#### exposedHeaders

Headers que o **cliente pode ler** da resposta:

```typescript
exposedHeaders: [
  'RateLimit-Limit',      // Limite de requisições
  'RateLimit-Remaining',  // Requisições restantes
  'RateLimit-Reset',      // Quando reseta
]
```

**Cliente lê:**
```javascript
const limit = response.headers.get('RateLimit-Limit');
const remaining = response.headers.get('RateLimit-Remaining');
```

**⚠️ Importante:**
- Headers padrão (Content-Type, etc) são sempre visíveis
- Headers customizados precisam estar em `exposedHeaders`

---

#### maxAge: 86400

Cache de **preflight request** (24 horas).

**O que é preflight:**
- Request OPTIONS antes da request real
- Browser verifica se pode fazer a request
- Cache evita fazer OPTIONS toda vez

**Sem cache:**
```
OPTIONS /api/items  ← Preflight
GET /api/items      ← Request real

POST /api/items
OPTIONS /api/items  ← Preflight novamente
POST /api/items     ← Request real
```

**Com cache (24h):**
```
OPTIONS /api/items  ← Preflight (cached)
GET /api/items      ← Request real

POST /api/items     ← Usa cache (sem OPTIONS)
```

---

## Modo Desenvolvimento

### CORS_ALLOW_ALL

Em desenvolvimento, pode permitir **qualquer origem**:

```env
# .env.development
NODE_ENV=development
CORS_ALLOW_ALL=true
```

**Comportamento:**
```typescript
if (NODE_ENV === 'development' && CORS_ALLOW_ALL === 'true') {
  // ✅ Permite QUALQUER origem
  callback(null, true);
}
```

**⚠️ NUNCA use em produção!**

---

## Middlewares

### corsMiddleware

Middleware CORS principal.

**Uso:**
```typescript
import { corsMiddleware } from '@shared/middlewares/cors.middleware';

// Registrar no app (ANTES das rotas)
app.use(corsMiddleware);
```

**O que faz:**
- Valida origem da requisição
- Adiciona headers CORS na resposta
- Trata preflight requests (OPTIONS)
- Cache de preflight por 24h

---

### corsOriginValidator

Validador adicional que **bloqueia ativamente** origens não autorizadas.

**Uso:**
```typescript
import {
  corsMiddleware,
  corsOriginValidator
} from '@shared/middlewares/cors.middleware';

// Ambos para segurança extra
app.use(corsMiddleware);
app.use(corsOriginValidator);
```

**Diferença:**

| Aspecto | corsMiddleware | corsOriginValidator |
|---------|---------------|-------------------|
| **Não retorna header** | ✅ | ✅ |
| **Bloqueia com 403** | ❌ | ✅ |
| **Log de bloqueio** | ❌ | ✅ |

**corsOriginValidator bloqueia explicitamente:**
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "success": false,
  "error": "Acesso negado - Origem não autorizada"
}
```

---

## Setup

### Instalação

```bash
npm install cors
npm install --save-dev @types/cors
```

### Configuração no App

```typescript
// src/app.ts
import express from 'express';
import helmet from 'helmet';
import { corsMiddleware, corsOriginValidator } from '@shared/middlewares/cors.middleware';

const app = express();

// ORDEM IMPORTANTE:
app.use(helmet());              // 1. Segurança
app.use(corsMiddleware);        // 2. CORS
app.use(corsOriginValidator);   // 3. Validador extra
app.use(express.json());        // 4. Body parsers
// ... rotas

export default app;
```

### Variáveis de Ambiente

```env
# .env.production
NODE_ENV=production
# CORS_ALLOW_ALL não deve existir ou ser false

# .env.development
NODE_ENV=development
CORS_ALLOW_ALL=true  # Apenas para facilitar desenvolvimento local
```

---

## Exemplos de Uso

### Exemplo 1: Frontend Autorizado

**Frontend:** `http://app.lorenzetti.ibe`

```javascript
// Frontend
fetch('http://api.lorenzetti.ibe/items', {
  method: 'GET',
  credentials: 'include',  // Para cookies
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

**Request:**
```http
GET /items HTTP/1.1
Host: api.lorenzetti.ibe
Origin: http://app.lorenzetti.ibe
Content-Type: application/json
Authorization: Bearer token123
```

**Response:**
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://app.lorenzetti.ibe
Access-Control-Allow-Credentials: true
Content-Type: application/json

{
  "success": true,
  "data": [...]
}
```

---

### Exemplo 2: IP Privado Autorizado

**Frontend:** `http://10.1.2.3:8080`

```javascript
fetch('http://10.0.0.100:3000/api/items')
  .then(res => res.json());
```

**Response:**
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://10.1.2.3:8080
Access-Control-Allow-Credentials: true
```

✅ **Permitido** (IP 10.x.x.x)

---

### Exemplo 3: Origem Não Autorizada (Bloqueada)

**Frontend:** `http://malicious-site.com`

```javascript
fetch('http://api.lorenzetti.ibe/items')
  .then(res => res.json());
```

**Comportamento:**

**Com corsMiddleware apenas:**
```http
HTTP/1.1 200 OK
# Sem header Access-Control-Allow-Origin
# Browser bloqueia a resposta
```

**Com corsOriginValidator:**
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "success": false,
  "error": "Acesso negado - Origem não autorizada"
}
```

**Console do browser:**
```
Access to fetch at 'http://api.lorenzetti.ibe/items'
from origin 'http://malicious-site.com' has been blocked by CORS policy
```

---

### Exemplo 4: Preflight Request

**Frontend faz POST com header customizado:**

```javascript
fetch('http://api.lorenzetti.ibe/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify({ name: 'Item 1' })
});
```

**Browser envia OPTIONS primeiro (preflight):**

```http
OPTIONS /items HTTP/1.1
Host: api.lorenzetti.ibe
Origin: http://app.lorenzetti.ibe
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization,content-type
```

**Servidor responde:**

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://app.lorenzetti.ibe
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,Accept
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

**Browser cacheia resposta (24h) e envia POST real:**

```http
POST /items HTTP/1.1
Host: api.lorenzetti.ibe
Origin: http://app.lorenzetti.ibe
Content-Type: application/json
Authorization: Bearer token123

{"name":"Item 1"}
```

---

### Exemplo 5: Postman (Sem Origin)

**Postman não envia header Origin:**

```http
GET /items HTTP/1.1
Host: api.lorenzetti.ibe
# Sem header Origin
```

**Servidor permite:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
# Sem headers CORS (desnecessário)

{"success":true,"data":[...]}
```

✅ **Permitido** (requisições sem origin são aceitas)

---

## Testando CORS

### Com curl

```bash
# Simular origem autorizada
curl -H "Origin: http://app.lorenzetti.ibe" \
  -v http://localhost:3000/api/items

# Verificar headers de resposta:
# < Access-Control-Allow-Origin: http://app.lorenzetti.ibe
# < Access-Control-Allow-Credentials: true

# Simular origem não autorizada
curl -H "Origin: http://malicious.com" \
  -v http://localhost:3000/api/items

# Sem header Access-Control-Allow-Origin
# Ou 403 se corsOriginValidator estiver ativo
```

### Com Browser DevTools

**1. Abrir Network tab**

**2. Fazer request de frontend**

**3. Ver headers:**

**Request Headers:**
```
Origin: http://app.lorenzetti.ibe
```

**Response Headers:**
```
Access-Control-Allow-Origin: http://app.lorenzetti.ibe
Access-Control-Allow-Credentials: true
```

---

### Testes Automatizados

```typescript
// test/cors.test.ts
import request from 'supertest';
import app from '../src/app';

describe('CORS Middleware', () => {
  it('should allow internal domain', async () => {
    const response = await request(app)
      .get('/api/items')
      .set('Origin', 'http://app.lorenzetti.ibe')
      .expect(200);

    expect(response.headers['access-control-allow-origin'])
      .toBe('http://app.lorenzetti.ibe');
  });

  it('should allow private IP (10.x.x.x)', async () => {
    const response = await request(app)
      .get('/api/items')
      .set('Origin', 'http://10.1.2.3')
      .expect(200);

    expect(response.headers['access-control-allow-origin'])
      .toBe('http://10.1.2.3');
  });

  it('should allow localhost', async () => {
    const response = await request(app)
      .get('/api/items')
      .set('Origin', 'http://127.0.0.1:3000')
      .expect(200);

    expect(response.headers['access-control-allow-origin'])
      .toBe('http://127.0.0.1:3000');
  });

  it('should block unauthorized origin with corsOriginValidator', async () => {
    const response = await request(app)
      .get('/api/items')
      .set('Origin', 'http://malicious.com')
      .expect(403);

    expect(response.body).toEqual({
      success: false,
      error: 'Acesso negado - Origem não autorizada',
    });
  });

  it('should allow requests without origin', async () => {
    const response = await request(app)
      .get('/api/items')
      .expect(200);

    // Sem header Origin, sem header CORS
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('should handle preflight request', async () => {
    const response = await request(app)
      .options('/api/items')
      .set('Origin', 'http://app.lorenzetti.ibe')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(response.headers['access-control-allow-methods'])
      .toContain('POST');
    expect(response.headers['access-control-max-age'])
      .toBe('86400');
  });
});
```

---

## Segurança

### Validação de Origem

A função `isAllowedOrigin()` valida:

1. **URL parsing** - Rejeita URLs malformadas
2. **Domínios internos** - Lista whitelist
3. **Subdomínios** - Aceita `*.lorenzetti.ibe`
4. **IPs privados** - Range 10.x.x.x
5. **Localhost** - 127.0.0.1 e ::1

### Proteção Contra Ataques

**1. CSRF (Cross-Site Request Forgery)**
```typescript
credentials: true  // Requer origem específica, não aceita *
```

**2. XSS (Cross-Site Scripting)**
```typescript
// CORS não previne XSS diretamente
// Use helmet() + CSP para proteção
```

**3. Data Exfiltration**
```typescript
// Bloqueia origens não autorizadas
// Dados não vazam para sites maliciosos
```

---

## Troubleshooting

### Erro: CORS policy blocked

**Erro no browser:**
```
Access to fetch at 'http://api.com/items' from origin 'http://frontend.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

**Causas:**

**1. Origem não está na whitelist**
```typescript
// Adicionar domínio em allowedDomains
const allowedDomains = [
  'lorenzetti.ibe',
  'novo-dominio.com',  // ← Adicionar aqui
];
```

**2. Middleware não registrado**
```typescript
// Registrar no app.ts
app.use(corsMiddleware);
```

**3. Ordem errada dos middlewares**
```typescript
// ❌ Errado
app.use(express.json());
app.use(corsMiddleware);

// ✅ Correto
app.use(corsMiddleware);
app.use(express.json());
```

---

### Preflight request failed

**Erro:**
```
Response to preflight request doesn't pass access control check
```

**Causa:** Header customizado não está em `allowedHeaders`

**Solução:**
```typescript
allowedHeaders: [
  'Content-Type',
  'Authorization',
  'X-Custom-Header',  // ← Adicionar
],
```

---

### Cannot read header from response

**Erro:**
```javascript
const value = response.headers.get('X-Custom-Header');
// null - header exists but not readable
```

**Causa:** Header não está em `exposedHeaders`

**Solução:**
```typescript
exposedHeaders: [
  'RateLimit-Limit',
  'X-Custom-Header',  // ← Adicionar
],
```

---

### Credentials not working

**Erro:** Cookies não são enviados

**Causa:** Falta `credentials: 'include'` no fetch

**Solução:**
```javascript
fetch(url, {
  credentials: 'include'  // ← Necessário
})
```

**E no servidor:**
```typescript
credentials: true  // ← Já configurado
```

---

## Boas Práticas

### ✅ DO

**1. Use whitelist específica**
```typescript
const allowedDomains = [
  'app.lorenzetti.ibe',
  'sistema.lorenzetti.ibe'
];
```

**2. Valide origens rigorosamente**
```typescript
function isAllowedOrigin(origin) {
  // Validação explícita
  return allowedDomains.includes(hostname);
}
```

**3. Use corsOriginValidator em produção**
```typescript
app.use(corsMiddleware);
app.use(corsOriginValidator);  // Segurança extra
```

**4. Configure maxAge adequado**
```typescript
maxAge: 86400  // 24h - reduz preflights
```

**5. Exponha apenas headers necessários**
```typescript
exposedHeaders: [
  'RateLimit-Limit'  // Apenas o necessário
]
```

---

### ❌ DON'T

**1. Não use '*' com credentials**
```typescript
// ❌ Inseguro e não funciona
origin: '*',
credentials: true

// ✅ Específico e seguro
origin: isAllowedOrigin,
credentials: true
```

**2. Não desabilite CORS em produção**
```typescript
// ❌ NUNCA faça isso em produção
if (NODE_ENV === 'production') {
  // Sem CORS
}
```

**3. Não permita qualquer origem em produção**
```typescript
// ❌ Perigoso
CORS_ALLOW_ALL=true  // Apenas development!
```

**4. Não ignore preflights**
```typescript
// ❌ Bloqueia OPTIONS
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(403);  // Errado!
  }
  next();
});

// ✅ CORS middleware trata OPTIONS
app.use(corsMiddleware);
```

**5. Não esqueça de atualizar allowedHeaders**
```typescript
// ❌ Header customizado não funciona
// Request com X-Custom-Header: value
// Preflight falha

// ✅ Adicionar em allowedHeaders
allowedHeaders: [..., 'X-Custom-Header']
```

---

## Adicionando Novas Origens

### Adicionar Domínio

```typescript
const allowedDomains = [
  'lorenzetti.ibe',
  'novo-sistema.lorenzetti.ibe',  // ← Novo domínio
];
```

### Adicionar Range de IPs

Para adicionar outros ranges (Classe B, C):

```typescript
function isAllowedOrigin(origin: string | undefined): boolean {
  // ... código existente

  // Classe B (172.16.0.0 - 172.31.255.255)
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }

  // Classe C (192.168.0.0 - 192.168.255.255)
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }

  // ... resto do código
}
```

---

## Monitoramento

### Log de Bloqueios

```typescript
if (origin && !isAllowedOrigin(origin)) {
  console.warn(`Origem bloqueada: ${origin}`);
  // Enviar para sistema de monitoramento
  monitoring.trackBlockedOrigin(origin);
}
```

### Métricas

```typescript
// Contador de origens bloqueadas
let blockedOrigins = 0;

export function corsOriginValidator(req, res, next) {
  if (origin && !isAllowedOrigin(origin)) {
    blockedOrigins++;
    metrics.increment('cors.blocked', { origin });
    // ...
  }
}
```

---

## Referências

### Arquivos Relacionados

- `app.config.ts` - Configuração base (baseUrl)
- `app.ts` - Setup da aplicação
- `helmet.middleware.ts` - Outros headers de segurança

### Links Externos

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [cors npm](https://github.com/expressjs/cors)
- [OWASP: CORS](https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny)

### Conceitos

- **CORS** - Cross-Origin Resource Sharing
- **Preflight** - Request OPTIONS de verificação
- **Same-Origin Policy** - Política de mesma origem
- **Whitelist** - Lista de origens permitidas

---

## Resumo

### O que é

Middleware que configura CORS para permitir acesso apenas de origens autorizadas da rede interna.

### Origens Permitidas

- ✅ Domínios internos: `*.lorenzetti.ibe`
- ✅ IPs privados: `10.x.x.x`
- ✅ Localhost: `127.0.0.1`, `::1`
- ✅ Sem origin: Postman, curl, mobile

### Exports

- **corsMiddleware** - Middleware CORS principal
- **corsOriginValidator** - Validador adicional (bloqueia 403)

### Configuração

- **credentials**: true (permite cookies)
- **methods**: GET, POST, PUT, DELETE, PATCH
- **maxAge**: 24h (cache preflight)
- **Development**: Configurável via CORS_ALLOW_ALL

### Segurança

- 🔒 Whitelist específica
- 🛡️ Validação rigorosa
- ✅ Bloqueio de origens não autorizadas
- ⚠️ Nunca use `*` com credentials