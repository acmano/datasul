# Security Headers - Documentação

## Headers Implementados

### 1. Content-Security-Policy (CSP)
**Proteção:** Cross-Site Scripting (XSS), Data Injection

Define fontes autorizadas de conteúdo (scripts, estilos, imagens, etc.).

```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:;
```

### 2. Strict-Transport-Security (HSTS)
**Proteção:** Man-in-the-Middle, Protocol Downgrade

Força o navegador a usar HTTPS por 1 ano.

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

⚠️ **Atenção:** Desabilite em desenvolvimento local se não usar HTTPS.

### 3. X-Frame-Options
**Proteção:** Clickjacking

Impede que a página seja carregada em frames/iframes.

```
X-Frame-Options: DENY
```

### 4. X-Content-Type-Options
**Proteção:** MIME Type Sniffing

Impede o navegador de "adivinhar" o tipo MIME de arquivos.

```
X-Content-Type-Options: nosniff
```

### 5. X-XSS-Protection
**Proteção:** Cross-Site Scripting (XSS)

Ativa proteção XSS do navegador (legacy, mas ainda útil).

```
X-XSS-Protection: 1; mode=block
```

### 6. Referrer-Policy
**Proteção:** Information Leakage

Controla quais informações de referência são enviadas.

```
Referrer-Policy: strict-origin-when-cross-origin
```

### 7. Permissions-Policy
**Proteção:** Feature Abuse

Desabilita APIs perigosas do navegador.

```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
```

### 8. X-Powered-By (Removido)
**Proteção:** Information Disclosure

Remove header que revela tecnologia do servidor.

❌ Antes: `X-Powered-By: Express`  
✅ Depois: (header removido)

---

## Como Testar

### 1. Teste Manual com curl

```bash
curl -I http://localhost:3000/health
```

Você deve ver todos esses headers na resposta.

### 2. Teste Específico de Cada Header

```bash
# CSP
curl -I http://localhost:3000/health | grep -i "content-security-policy"

# HSTS
curl -I http://localhost:3000/health | grep -i "strict-transport-security"

# X-Frame-Options
curl -I http://localhost:3000/health | grep -i "x-frame-options"

# Verifica que X-Powered-By foi removido
curl -I http://localhost:3000/health | grep -i "x-powered-by"
# Não deve retornar nada!
```

### 3. Teste Online (Após Deploy)

Use ferramentas online para avaliar os headers de segurança:

- **Security Headers:** https://securityheaders.com
- **Mozilla Observatory:** https://observatory.mozilla.org
- **SSL Labs:** https://www.ssllabs.com/ssltest/

Meta: **Nota A** ou superior

---

## Ajustes para Ambientes Específicos

### Desenvolvimento Local (sem HTTPS)

Se você NÃO usa HTTPS em desenvolvimento, desabilite HSTS:

```typescript
// src/shared/middlewares/helmet.middleware.ts
export const helmetMiddleware = helmet({
  hsts: process.env.NODE_ENV === 'production' 
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  // ... resto da config
});
```

### Integração com Frontend

Se você tiver um frontend consumindo essa API, ajuste CSP:

```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    connectSrc: ["'self'", 'https://seu-frontend.com'], // ← Adicione seu frontend
    // ...
  },
},
```

---

## Monitoramento

Monitore violações de CSP com Report-URI:

```typescript
contentSecurityPolicy: {
  directives: {
    // ...
    reportUri: '/api/csp-report', // ← Endpoint para receber violações
  },
},
```

Depois crie o endpoint:

```typescript
app.post('/api/csp-report', express.json(), (req, res) => {
  console.error('CSP Violation:', req.body);
  res.status(204).send();
});
```

---

## Troubleshooting

### "Refused to load stylesheet because it violates CSP"

Adicione o domínio à diretiva `styleSrc`:

```typescript
styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.exemplo.com'],
```

### "Refused to execute inline script"

Evite scripts inline. Use arquivos `.js` externos ou adicione nonces.

### Health check retorna erro 404

Certifique-se que o health check está ANTES das rotas da API no `app.ts`.

---

## Referências

- [Helmet.js Documentation](https://helmetjs.github.io/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN - CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)