# Middleware de Segurança (Helmet)

**Arquivo:** `src/shared/middlewares/helmet.middleware.ts`
**Tipo:** Middleware Express
**Propósito:** Proteção via headers HTTP de segurança

---

## Visão Geral

Implementa proteções de segurança através de headers HTTP usando Helmet.js. Protege contra vulnerabilidades comuns da web.

### Proteções Implementadas

- 🛡️ **XSS** - Cross-Site Scripting
- 🔒 **Clickjacking** - X-Frame-Options
- 📦 **MIME Sniffing** - X-Content-Type-Options
- 🌐 **DNS Prefetch Control**
- 🔐 **HSTS** - HTTP Strict Transport Security
- 📜 **CSP** - Content Security Policy
- 🕵️ **Information Disclosure** - Remove headers sensíveis

---

## Setup

### Instalação

```bash
npm install helmet
npm install --save-dev @types/helmet
```

### Registro no App

```typescript
// src/app.ts
import express from 'express';
import {
  helmetMiddleware,
  customSecurityHeaders
} from '@shared/middlewares/helmet.middleware';

const app = express();

// ⚠️ Deve ser um dos PRIMEIROS middlewares
app.use(helmetMiddleware);
app.use(customSecurityHeaders);

// Outros middlewares depois...
app.use(cors());
app.use(express.json());

export default app;
```

**Ordem recomendada:**
1. ✅ Helmet
2. ✅ Custom Security Headers
3. ✅ CORS
4. ✅ Compression
5. ✅ Body parsers
6. ✅ Rotas

---

## Headers de Segurança

### 1. Content-Security-Policy (CSP)

**O que é:**
Define fontes permitidas para diferentes tipos de conteúdo (scripts, estilos, imagens, etc).

**Protege contra:**
- ✅ Cross-Site Scripting (XSS)
- ✅ Injeção de código malicioso
- ✅ Clickjacking
- ✅ Data injection attacks

**Header enviado:**
```http
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
```

---

#### Diretivas Configuradas

**defaultSrc: ["'self'"]**
- Fallback para outras diretivas não especificadas
- Permite apenas recursos do próprio domínio

**styleSrc: ["'self'", "'unsafe-inline'"]**
- Permite CSS do próprio domínio
- Permite inline styles (para compatibilidade)
- ⚠️ `'unsafe-inline'` reduz segurança, mas necessário para muitos frameworks

**scriptSrc: ["'self'"]**
- Permite apenas scripts do próprio domínio
- ❌ Bloqueia scripts inline
- ❌ Bloqueia scripts de CDNs externos

**imgSrc: ["'self'", 'data:', 'https:']**
- Permite imagens do próprio domínio
- Permite data URIs (base64)
- Permite imagens de qualquer HTTPS

**connectSrc: ["'self'"]**
- Controla destinos de fetch/XHR/WebSocket
- Apenas próprio domínio

**fontSrc: ["'self'"]**
- Permite fontes apenas do próprio domínio

**objectSrc: ["'none'"]**
- Bloqueia plugins (Flash, Java, etc)
- ✅ Recomendado: plugins são inseguros

**mediaSrc: ["'self'"]**
- Permite áudio/vídeo apenas do próprio domínio

**frameSrc: ["'none'"]**
- Bloqueia incorporação de iframes
- Previne clickjacking

---

#### Personalizando CSP

**Exemplo: Permitir CDN de fontes**
```typescript
contentSecurityPolicy: {
  directives: {
    ...
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    styleSrc: ["'self'", 'https://fonts.googleapis.com'],
  }
}
```

**Exemplo: Permitir API externa**
```typescript
connectSrc: ["'self'", 'https://api.example.com']
```

---

### 2. HTTP Strict Transport Security (HSTS)

**O que é:**
Força navegadores a acessarem o site apenas via HTTPS.

**Protege contra:**
- ✅ Man-in-the-Middle attacks
- ✅ Protocol downgrade attacks
- ✅ Cookie hijacking

**Header enviado:**
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Configuração:**
```typescript
hsts: {
  maxAge: 31536000,        // 1 ano em segundos
  includeSubDomains: true, // Aplica a subdomínios
  preload: true,          // HSTS preload list
}
```

**⚠️ Atenção:**

1. **Desabilite em development sem HTTPS:**
```typescript
// Development sem HTTPS
hsts: false
```

2. **Uma vez ativado, navegadores forçam HTTPS pelo período:**
- Usuário não consegue acessar via HTTP
- Para reverter, envie `max-age=0`

3. **Preload List:**
- Navegadores carregam lista de sites HSTS
- Para incluir seu site: https://hstspreload.org/
- ⚠️ Difícil de reverter!

---

### 3. X-Frame-Options

**O que é:**
Controla se o site pode ser incorporado em frames/iframes.

**Protege contra:**
- ✅ Clickjacking attacks
- ✅ UI redress attacks

**Header enviado:**
```http
X-Frame-Options: DENY
```

**Opções:**

| Valor | Comportamento |
|-------|---------------|
| `DENY` | Bloqueia completamente |
| `SAMEORIGIN` | Permite apenas mesmo domínio |

**Configuração:**
```typescript
frameguard: {
  action: 'deny'  // ou 'sameorigin'
}
```

---

### 4. X-Content-Type-Options

**O que é:**
Impede que navegador "adivinhe" o tipo MIME de arquivos.

**Protege contra:**
- ✅ MIME type sniffing attacks
- ✅ Drive-by downloads

**Header enviado:**
```http
X-Content-Type-Options: nosniff
```

**Por que é importante:**

Sem `nosniff`:
```
Servidor envia: Content-Type: text/plain
Arquivo contém: <script>alert('XSS')</script>
Browser "adivinha": É JavaScript! Executa.
```

Com `nosniff`:
```
Servidor envia: Content-Type: text/plain
Browser respeita: Trata como texto, não executa.
```

**Configuração:**
```typescript
noSniff: true
```

---

### 5. X-XSS-Protection

**O que é:**
Ativa filtro XSS embutido nos navegadores (legacy).

**Protege contra:**
- ✅ Reflected XSS attacks

**Header enviado:**
```http
X-XSS-Protection: 1; mode=block
```

**Valores:**

| Valor | Comportamento |
|-------|---------------|
| `0` | Desabilita filtro |
| `1` | Habilita filtro |
| `1; mode=block` | Bloqueia página se XSS detectado |

**⚠️ Nota:**
- Header **legacy** (navegadores modernos já removeram)
- Ainda útil para suportar navegadores antigos
- CSP é proteção mais moderna e robusta

**Configuração:**
```typescript
xssFilter: true
```

---

### 6. Referrer-Policy

**O que é:**
Controla quais informações são enviadas no header `Referer`.

**Protege contra:**
- ✅ Information leakage
- ✅ Privacy violations

**Header enviado:**
```http
Referrer-Policy: strict-origin-when-cross-origin
```

**Políticas:**

| Política | Comportamento |
|----------|---------------|
| `no-referrer` | Nunca envia referer |
| `same-origin` | Apenas para mesmo domínio |
| `strict-origin` | Apenas origem (sem path) |
| `strict-origin-when-cross-origin` | ✅ Recomendado: completo para mesmo domínio, apenas origem para outros |

**Exemplo:**

```
Navegando de: https://app.example.com/page1
Para: https://app.example.com/page2
Referer: https://app.example.com/page1 (completo)

Navegando de: https://app.example.com/page1
Para: https://external.com/page
Referer: https://app.example.com/ (apenas origem)
```

**Configuração:**
```typescript
referrerPolicy: {
  policy: 'strict-origin-when-cross-origin'
}
```

---

### 7. Permissions-Policy

**O que é:**
Desabilita APIs perigosas do navegador que a aplicação não usa.

**Protege contra:**
- ✅ Uso não autorizado de APIs
- ✅ Exploits de features
- ✅ Privacy violations

**Header enviado:**
```http
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
```

**APIs bloqueadas:**

| API | O que faz |
|-----|-----------|
| `geolocation` | Localização GPS |
| `microphone` | Acesso ao microfone |
| `camera` | Acesso à câmera |
| `payment` | Payment Request API |
| `usb` | WebUSB API |

**Sintaxe:**
- `feature=()` - Bloqueia para todos
- `feature=(self)` - Permite apenas próprio domínio
- `feature=(self "https://example.com")` - Permite domínio específico

**Configuração:**
```typescript
res.setHeader(
  'Permissions-Policy',
  'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
);
```

---

### 8. Headers Removidos

**X-Powered-By**
```http
❌ X-Powered-By: Express
```
- Expõe tecnologia usada (Express)
- Information disclosure
- ✅ Helmet remove automaticamente

**Server**
```http
❌ Server: nginx/1.18.0
```
- Expõe servidor e versão
- Facilita ataques direcionados
- ✅ customSecurityHeaders remove

---

## Configuração por Ambiente

### getHelmetConfig()

Factory function para configuração dinâmica baseada no ambiente.

**Uso:**
```typescript
import { getHelmetConfig } from '@shared/middlewares/helmet.middleware';
import helmet from 'helmet';

const helmetConfig = getHelmetConfig(process.env.NODE_ENV);
app.use(helmet(helmetConfig));
```

**Diferenças:**

| Feature | Development | Production |
|---------|-------------|------------|
| **CSP** | ✅ Ativo | ✅ Ativo |
| **HSTS** | ❌ Desabilitado | ✅ Ativo |
| **Headers gerais** | ✅ Ativos | ✅ Ativos |

**Por que desabilitar HSTS em development:**
- Development geralmente usa HTTP (não HTTPS)
- HSTS força HTTPS
- Causa erro "Site inacessível"

---

## Testando Headers

### Com curl

```bash
# Ver todos os headers
curl -I http://localhost:3000/health

# Verificar header específico
curl -I http://localhost:3000/health | grep "Content-Security-Policy"
```

### Com Browser DevTools

1. Abrir DevTools (F12)
2. Tab Network
3. Fazer requisição
4. Ver Response Headers

---

### getSecurityHeaders()

Utilitário que lista todos os headers implementados.

**Uso em testes:**
```typescript
import { getSecurityHeaders } from '@shared/middlewares/helmet.middleware';
import request from 'supertest';
import app from '../src/app';

describe('Security Headers', () => {
  it('should have all security headers', async () => {
    const response = await request(app).get('/health');

    const headers = getSecurityHeaders();

    headers.forEach(header => {
      expect(response.headers[header.toLowerCase()]).toBeDefined();
    });
  });
});
```

---

### Testes Completos

```typescript
// test/security.test.ts
import request from 'supertest';
import app from '../src/app';

describe('Security Middlewares', () => {
  it('should have Content-Security-Policy', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('should have HSTS in production', async () => {
    const response = await request(app).get('/health');

    if (process.env.NODE_ENV === 'production') {
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    }
  });

  it('should have X-Frame-Options: DENY', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('should have X-Content-Type-Options: nosniff', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should have Referrer-Policy', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should have Permissions-Policy', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['permissions-policy']).toBeDefined();
  });

  it('should not have X-Powered-By', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('should not have Server header', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['server']).toBeUndefined();
  });
});
```

---

## Troubleshooting

### CSP bloqueando recursos

**Sintoma:**
Console do browser mostra erros CSP:
```
Refused to load the script 'https://cdn.example.com/script.js'
because it violates the following Content Security Policy directive: "script-src 'self'"
```

**Causa:**
Recurso externo não está na whitelist.

**Solução:**
Adicionar domínio permitido:
```typescript
contentSecurityPolicy: {
  directives: {
    scriptSrc: ["'self'", 'https://cdn.example.com'],
  }
}
```

---

### Inline scripts bloqueados

**Sintoma:**
```html
<script>
  console.log('Hello');
</script>
```
Erro: `Refused to execute inline script`

**Causa:**
CSP bloqueia inline scripts por padrão.

**Soluções:**

**1. Mover para arquivo externo (recomendado):**
```html
<script src="/js/app.js"></script>
```

**2. Usar nonce (para casos específicos):**
```typescript
// Gerar nonce único por requisição
const nonce = crypto.randomBytes(16).toString('base64');

contentSecurityPolicy: {
  directives: {
    scriptSrc: ["'self'", `'nonce-${nonce}'`],
  }
}

// No HTML
<script nonce="${nonce}">
  console.log('Hello');
</script>
```

**3. Permitir unsafe-inline (menos seguro):**
```typescript
scriptSrc: ["'self'", "'unsafe-inline'"]  // ⚠️ Reduz segurança
```

---

### HSTS causando erro em development

**Sintoma:**
Navegador bloqueia acesso via HTTP em desenvolvimento.

**Causa:**
HSTS foi habilitado e navegador força HTTPS.

**Solução:**

**1. Desabilitar HSTS em development:**
```typescript
hsts: process.env.NODE_ENV === 'production'
  ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    }
  : false
```

**2. Limpar HSTS do navegador:**
- Chrome: `chrome://net-internals/#hsts`
- Digite domínio e clique "Delete"

---

### Fonts não carregam de CDN

**Sintoma:**
```
Refused to load the font 'https://fonts.gstatic.com/...'
because it violates the following Content Security Policy directive: "font-src 'self'"
```

**Solução:**
```typescript
fontSrc: ["'self'", 'https://fonts.gstatic.com'],
styleSrc: ["'self'", 'https://fonts.googleapis.com'],
```

---

## Boas Práticas

### ✅ DO

**1. Registre Helmet como primeiro middleware**
```typescript
app.use(helmetMiddleware);
app.use(customSecurityHeaders);
// Outros depois...
```

**2. Use HSTS apenas com HTTPS em produção**
```typescript
hsts: isProduction ? {...} : false
```

**3. Mantenha CSP restritivo**
```typescript
// ✅ Específico
scriptSrc: ["'self'", 'https://trusted-cdn.com']

// ❌ Muito permissivo
scriptSrc: ["'self'", 'https:', "'unsafe-inline'"]
```

**4. Teste headers regularmente**
```typescript
// Testes automatizados
const headers = getSecurityHeaders();
headers.forEach(h => expect(response.headers).toHaveProperty(h));
```

**5. Monitore console do browser**
- Verifique erros de CSP
- Ajuste políticas conforme necessário

---

### ❌ DON'T

**1. Não habilite HSTS sem HTTPS**
```typescript
// ❌ Development sem HTTPS
hsts: { maxAge: 31536000 }

// ✅ Apenas com HTTPS
hsts: hasHttps ? {...} : false
```

**2. Não use 'unsafe-inline' desnecessariamente**
```typescript
// ❌ Reduz segurança
scriptSrc: ["'self'", "'unsafe-inline'"]

// ✅ Mova scripts para arquivos
scriptSrc: ["'self'"]
```

**3. Não permita tudo no CSP**
```typescript
// ❌ Anula proteção
defaultSrc: ['*']

// ✅ Seja específico
defaultSrc: ["'self'"]
```

**4. Não ignore warnings do console**
```
⚠️ Content Security Policy violation
```
Investigue e corrija!

**5. Não remova headers sem entender**
```typescript
// ❌ Sem saber por quê
frameguard: false

// ✅ Mantenha proteções ativas
frameguard: { action: 'deny' }
```

---

## Verificação de Segurança

### Tools Online

**1. Security Headers**
https://securityheaders.com/

- Escaneia headers do site
- Dá nota A-F
- Sugere melhorias

**2. Mozilla Observatory**
https://observatory.mozilla.org/

- Análise completa de segurança
- Recomendações detalhadas
- Scan gratuito

**3. CSP Evaluator**
https://csp-evaluator.withgoogle.com/

- Valida política CSP
- Identifica vulnerabilidades
- Sugere melhorias

---

## Checklist de Segurança

- [ ] Helmet registrado como primeiro middleware
- [ ] HSTS habilitado em produção com HTTPS
- [ ] CSP configurado adequadamente
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy configurada
- [ ] Permissions-Policy desabilita APIs não usadas
- [ ] X-Powered-By removido
- [ ] Server header removido
- [ ] Headers testados automaticamente
- [ ] Console do browser sem erros CSP
- [ ] Scan em securityheaders.com (nota A)

---

## Referências

### Arquivos Relacionados

- `app.ts` - Setup da aplicação
- `cors.middleware.ts` - CORS

### Links Externos

- [Helmet.js Docs](https://helmetjs.github.io/)
- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
- [MDN: CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN: HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [Security Headers Scanner](https://securityheaders.com/)

### Padrões

- **Defense in Depth** - Múltiplas camadas de segurança
- **Secure by Default** - Configuração mais restritiva possível
- **Least Privilege** - Permissões mínimas necessárias

---

## Resumo

### O que é

Middleware que adiciona headers HTTP de segurança usando Helmet.js para proteger contra vulnerabilidades comuns.

### Exports

- **helmetMiddleware** - Configuração principal
- **customSecurityHeaders** - Headers adicionais
- **getHelmetConfig** - Factory por ambiente
- **getSecurityHeaders** - Lista de headers (testes)

### Proteções

- 🛡️ XSS, Clickjacking, MIME Sniffing
- 🔐 HSTS, CSP, Permissions-Policy
- 🕵️ Remove headers sensíveis

### Setup

1. Instalar helmet
2. Registrar como primeiro middleware
3. Adicionar customSecurityHeaders
4. Testar headers
5. Verificar em securityheaders.com