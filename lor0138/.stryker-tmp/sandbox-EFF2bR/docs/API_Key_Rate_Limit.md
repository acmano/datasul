# 🔑 Guia - API Key e Rate Limiting por Usuário

## 📋 Visão Geral

Sistema completo de autenticação por API Key com rate limiting por usuário/tier.

### Tiers Disponíveis:

| Tier | Por Minuto | Por Hora | Por Dia | Burst |
|------|------------|----------|---------|-------|
| **Free** | 10 | 100 | 1,000 | 5 |
| **Premium** | 60 | 1,000 | 10,000 | 20 |
| **Enterprise** | 300 | 10,000 | 100,000 | 100 |
| **Admin** | 1,000 | 50,000 | 1,000,000 | 500 |

---

## 📦 Arquivos Criados

```
src/
├── shared/
│   ├── types/
│   │   └── apiKey.types.ts          # Types e configs de tiers
│   ├── services/
│   │   └── ApiKeyService.ts         # Gerenciamento de API Keys
│   ├── utils/
│   │   └── UserRateLimiter.ts       # Rate limiter por usuário
│   └── middlewares/
│       ├── apiKeyAuth.middleware.ts       # Autenticação
│       └── userRateLimit.middleware.ts    # Rate limiting
├── api/
│   └── admin/
│       └── routes/
│           └── admin.routes.ts      # Rotas de administração
└── server.ts                        # Inicialização do sistema
```

---

## 🔧 Como Usar

### 1️⃣ Atualizar app.ts

Adicione as rotas de admin no `app.ts`:

```typescript
// Importar rotas de admin
import adminRoutes from './api/admin/routes/admin.routes';

// No método setupRoutes(), adicionar:
this.app.use('/admin', adminRoutes);
```

### 2️⃣ Proteger Endpoints com API Key

**Opção A: Autenticação obrigatória + Rate limit**
```typescript
import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';

router.get('/protected', 
  apiKeyAuth,           // Requer API Key
  userRateLimit,        // Rate limit por usuário
  controller
);
```

**Opção B: Autenticação opcional**
```typescript
import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';

router.get('/public', 
  optionalApiKeyAuth,   // API Key opcional
  userRateLimit,        // Rate limit por usuário ou IP
  controller
);
```

**Opção C: Rate limit customizado**
```typescript
import { createUserRateLimit } from '@shared/middlewares/userRateLimit.middleware';

router.get('/heavy', 
  apiKeyAuth,
  createUserRateLimit({ 
    multiplier: 0.5  // 50% do limite normal
  }),
  controller
);
```

---

## 🧪 Testes

### API Keys de Exemplo

```bash
# Free Tier
export API_KEY_FREE="free-demo-key-123456"

# Premium Tier
export API_KEY_PREMIUM="premium-key-abc123"

# Enterprise Tier
export API_KEY_ENTERPRISE="enterprise-key-xyz789"

# Admin
export API_KEY_ADMIN="admin-key-superuser"
```

### 1️⃣ Testar Autenticação

```bash
# Sem API Key (deve retornar 401)
curl http://localhost:3000/admin/api-keys

# Com API Key válida (header)
curl -H "X-API-Key: admin-key-superuser" \
  http://localhost:3000/admin/api-keys

# Com API Key (Bearer token)
curl -H "Authorization: Bearer admin-key-superuser" \
  http://localhost:3000/admin/api-keys

# Com API Key (query parameter)
curl "http://localhost:3000/admin/api-keys?api_key=admin-key-superuser"
```

### 2️⃣ Testar Rate Limiting

```bash
# FREE: 10 req/min - Fazer 11 requisições rápidas
for i in {1..11}; do
  curl -H "X-API-Key: free-demo-key-123456" \
    http://localhost:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110
  echo "Req $i"
done

# A 11ª deve retornar 429:
# {
#   "error": "RateLimitError",
#   "message": "Muitas requisições...",
#   "details": { "retryAfter": 30 }
# }
```

### 3️⃣ Verificar Headers de Rate Limit

```bash
curl -i -H "X-API-Key: premium-key-abc123" \
  http://localhost:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110

# Headers retornados:
# X-RateLimit-Limit: 60
# X-RateLimit-Remaining: 59
# X-RateLimit-Reset: 2025-10-05T01:31:00.000Z
# Retry-After: 45  (se excedido)
```

### 4️⃣ Ver Estatísticas (Admin)

```bash
# Stats gerais
curl -H "X-API-Key: admin-key-superuser" \
  http://localhost:3000/admin/rate-limit/stats

# Stats de usuário específico
curl -H "X-API-Key: admin-key-superuser" \
  "http://localhost:3000/admin/rate-limit/stats?userId=user-001"

# Resposta:
# {
#   "userId": "user-001",
#   "tier": "free",
#   "usage": {
#     "minute": { "current": 8, "limit": 10, "remaining": 2 },
#     "hour": { "current": 45, "limit": 100, "remaining": 55 },
#     "day": { "current": 234, "limit": 1000, "remaining": 766 }
#   }
# }
```

### 5️⃣ Gerar Nova API Key (Admin)

```bash
curl -X POST \
  -H "X-API-Key: admin-key-superuser" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-999",
    "userName": "New User",
    "tier": "premium",
    "expiresInDays": 30
  }' \
  http://localhost:3000/admin/api-keys/generate

# Resposta:
# {
#   "success": true,
#   "data": {
#     "apiKey": "premium-a1b2c3d4e5f6...",
#     "userId": "user-999",
#     "userName": "New User",
#     "tier": "premium",
#     "expiresInDays": 30
#   }
# }
```

### 6️⃣ Revogar API Key (Admin)

```bash
curl -X POST \
  -H "X-API-Key: admin-key-superuser" \
  http://localhost:3000/admin/api-keys/free-demo-key-123456/revoke

# Resposta:
# {
#   "success": true,
#   "message": "API Key revogada"
# }
```

### 7️⃣ Resetar Rate Limit (Admin)

```bash
curl -X POST \
  -H "X-API-Key: admin-key-superuser" \
  http://localhost:3000/admin/rate-limit/reset/user-001

# Resposta:
# {
#   "success": true,
#   "message": "Rate limit resetado para usuário user-001"
# }
```

### 8️⃣ Atualizar Tier de Usuário (Admin)

```bash
curl -X PUT \
  -H "X-API-Key: admin-key-superuser" \
  -H "Content-Type: application/json" \
  -d '{"tier": "enterprise"}' \
  http://localhost:3000/admin/users/user-001/tier

# Resposta:
# {
#   "success": true,
#   "message": "Tier atualizado para enterprise",
#   "data": {
#     "userId": "user-001",
#     "tier": "enterprise"
#   }
# }
```

---

## 📊 Exemplo de Endpoint Protegido

```typescript
// src/api/exemplo/routes/exemplo.routes.ts

import { Router } from 'express';
import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';

const router = Router();

router.get('/data',
  apiKeyAuth,      // 1. Autenticar usuário
  userRateLimit,   // 2. Verificar rate limit
  async (req, res) => {
    // req.user está disponível aqui
    const { id, name, tier } = req.user!;

    res.json({
      success: true,
      message: `Olá ${name}!`,
      data: {
        userId: id,
        tier,
        // ... seus dados
      },
      correlationId: req.id
    });
  }
);

export default router;
```

---

## ⚠️ Erros Comuns

### 401 - API Key não fornecida
```json
{
  "error": "AuthenticationError",
  "message": "API Key não fornecida",
  "details": {
    "hint": "Forneça via header X-API-Key ou Authorization: Bearer <key>"
  }
}
```

### 401 - API Key inválida
```json
{
  "error": "AuthenticationError",
  "message": "API Key inválida ou expirada",
  "details": {
    "apiKey": "free...3456"
  }
}
```

### 429 - Rate Limit Excedido
```json
{
  "error": "RateLimitError",
  "message": "Muitas requisições. Tente novamente em alguns segundos.",
  "timestamp": "2025-10-05T01:30:00.000Z",
  "path": "/api/...",
  "correlationId": "...",
  "details": {
    "retryAfter": 45
  }
}
```

### 403 - Sem Permissão (Admin)
```json
{
  "error": "AuthorizationError",
  "message": "Apenas administradores podem listar todas as API Keys"
}
```

---

## 🔒 Segurança

### Boas Práticas:

1. **Nunca commite API Keys** no código
2. **Use HTTPS** em produção
3. **Rotacione keys** periodicamente
4. **Monitore uso** suspeito
5. **Revogue keys** comprometidas imediatamente

### Headers de Segurança:

```http
X-API-Key: sua-api-key-aqui
X-Correlation-ID: id-para-rastreamento
```

---

## 📈 Monitoramento

### Logs Importantes:

```typescript
// Autenticação bem-sucedida
log.debug('Autenticação via API Key', {
  userId: 'user-001',
  tier: 'premium'
});

// Rate limit excedido
log.warn('Rate limit excedido', {
  userId: 'user-001',
  tier: 'free',
  limit: 10,
  resetAt: '2025-10-05T01:31:00.000Z'
});

// API Key revogada
log.info('API Key revogada', {
  userId: 'user-001'
});
```

---

## 🚀 Próximos Passos

1. **Persistir API Keys** - Mover de memória para banco de dados
2. **Webhooks** - Notificar quando rate limit excedido
3. **Dashboard** - Interface web para gerenciar keys
4. **Analytics** - Gráficos de uso por usuário/tier
5. **Redis** - Rate limiting distribuído

---

## ✅ Checklist de Implementação

- [ ] Criar tipos e configs (`apiKey.types.ts`)
- [ ] Implementar `ApiKeyService`
- [ ] Implementar `UserRateLimiter`
- [ ] Criar middleware `apiKeyAuth`
- [ ] Criar middleware `userRateLimit`
- [ ] Criar rotas admin
- [ ] Atualizar `server.ts` para inicializar
- [ ] Atualizar `app.ts` com rotas admin
- [ ] Proteger endpoints existentes
- [ ] Testar todos os cenários
- [ ] Documentar no Swagger

---

**Sistema production-ready com autenticação e rate limiting por usuário!**