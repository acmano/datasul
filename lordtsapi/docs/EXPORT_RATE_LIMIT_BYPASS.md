# Export Rate Limit Bypass

## 📋 Visão Geral

Sistema de bypass de rate limiting para operações de exportação em massa, permitindo que usuários autorizados exportem grandes volumes de dados sem serem bloqueados pelo rate limiter.

## 🎯 Problema Resolvido

**Situação Anterior:**
- Exportações retornam até 10.000 registros
- Cada registro conta como requisição no rate limiter
- Usuários eram bloqueados ao fazer exportações massivas
- Limite padrão: 10-60 req/min dependendo do tier

**Solução Implementada:**
- Header especial `X-Export-Request: true` identifica requisições de exportação
- Permissões baseadas em tier concedem bypass automático
- Logs detalhados para auditoria
- Zero impacto em requisições normais

## 🔐 Arquitetura da Solução

### 1. Sistema de Permissões

**Arquivo:** `src/shared/utils/permissions.ts`

```typescript
export enum Permission {
  EXPORT_UNLIMITED = 'export:unlimited',
  EXPORT_BYPASS_RATE_LIMIT = 'export:bypass-rate-limit',
  // ... outras permissões
}
```

**Permissões por Tier:**

| Tier | Permissões de Exportação |
|------|-------------------------|
| **free** | Nenhuma (rate limit aplicado) |
| **premium** | `export:unlimited` |
| **enterprise** | `export:unlimited`, `export:bypass-rate-limit` |
| **admin** | Todas as permissões |

### 2. Middleware de Rate Limiting

**Arquivo:** `src/shared/middlewares/userRateLimit.middleware.ts`

**Fluxo de Decisão:**

```
Requisição Recebida
    ↓
Verificar header X-Export-Request
    ↓
X-Export-Request === 'true'?
    ├─ NÃO → Aplicar rate limit normal
    └─ SIM → Verificar permissões
              ↓
        Tem export:unlimited OU export:bypass-rate-limit?
              ├─ SIM → ✅ Bypass (next())
              └─ NÃO → ⚠️ Log warning + Aplicar rate limit
```

**Código:**

```typescript
const isExportRequest = req.headers['x-export-request'] === 'true';
const hasExportPermission =
  permissions?.includes('export:unlimited') ||
  permissions?.includes('export:bypass-rate-limit');

if (isExportRequest && hasExportPermission) {
  log.info('Rate limit bypassed for export request', {
    correlationId: req.id,
    userId,
    path: req.path,
  });

  res.setHeader('X-RateLimit-Bypassed', 'export');
  return next();
}
```

### 3. Autenticação com Permissões

**Arquivo:** `src/shared/middlewares/apiKeyAuth.middleware.ts`

O middleware de autenticação foi modificado para adicionar automaticamente as permissões baseadas no tier do usuário:

```typescript
import { addDefaultPermissions } from '@shared/utils/permissions';

req.user = {
  id: keyConfig.userId,
  name: keyConfig.userName,
  tier: keyConfig.tier,
  permissions: addDefaultPermissions(keyConfig.tier), // ✨ NOVO
};
```

### 4. Frontend - Serviço de Exportação

**Arquivo:** `lor0138/src/shared/services/exportApi.service.ts`

```typescript
// Adiciona automaticamente o header
const exportHeaders = {
  'X-Export-Request': 'true',  // ✨ Header especial
  'X-API-Key': apiKey,
};

const response = await fetch(url, {
  method: 'GET',
  headers: exportHeaders,
});
```

**Funções Disponíveis:**

```typescript
// Exportar items
await exportItemsToExcel({ q: 'teste', limit: 10000 });
await exportItemsToCSV({ familia: 'ABC', limit: 5000 });

// Exportar estrutura
await exportEstrutura('7530110', 'xlsx');
await exportEstrutura('7530110', 'pdf', '2025-01-15');

// Helper para download direto
await downloadItemsExcel({ q: 'teste' });
```

## 📡 Headers HTTP

### Request Headers

```http
GET /api/v2/item/export/excel?limit=10000
X-API-Key: premium-abc123def456...
X-Export-Request: true
```

### Response Headers (Bypass Concedido)

```http
HTTP/1.1 200 OK
X-RateLimit-Bypassed: export
X-RateLimit-Bypass-Reason: export-permission-granted
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="items_2025-01-15.xlsx"
```

### Response Headers (Bypass Negado)

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-01-15T10:30:00.000Z
Retry-After: 45
```

## 🔍 Logs e Auditoria

### Log de Bypass Bem-Sucedido

```json
{
  "level": "info",
  "message": "Rate limit bypassed for export request",
  "correlationId": "uuid-123-456",
  "userId": "user-abc-def",
  "path": "/api/v2/item/export/excel",
  "method": "GET",
  "tier": "premium",
  "permissions": ["export:unlimited"],
  "timestamp": "2025-01-15T10:15:00.000Z"
}
```

### Log de Tentativa Sem Permissão

```json
{
  "level": "warn",
  "message": "Export request denied - missing export:unlimited permission",
  "correlationId": "uuid-789-012",
  "userId": "user-free-tier",
  "path": "/api/v2/item/export/excel",
  "tier": "free",
  "permissions": [],
  "timestamp": "2025-01-15T10:16:00.000Z"
}
```

## 🚀 Como Usar

### Backend - Conceder Permissão

**Opção 1: Automático por Tier (Recomendado)**

Ao criar/atualizar API Key com tier `premium` ou superior, as permissões são concedidas automaticamente:

```typescript
// API Key Service
const apiKey = await ApiKeyService.createKey({
  userId: 'user123',
  userName: 'João Silva',
  tier: UserTier.PREMIUM,  // ✅ Recebe export:unlimited automaticamente
});
```

**Opção 2: Permissões Customizadas**

```typescript
// Adicionar permissão manualmente
req.user.permissions = [
  ...req.user.permissions,
  Permission.EXPORT_UNLIMITED,
];
```

### Frontend - Fazer Exportação

**Método 1: Usar Serviço (Recomendado)**

```typescript
import { downloadItemsExcel } from '@/shared/services/exportApi.service';

// Exportar e fazer download automaticamente
try {
  await downloadItemsExcel({
    q: 'produto',
    familia: 'ABC',
    limit: 10000
  });
  message.success('Exportação concluída!');
} catch (error) {
  message.error('Erro na exportação');
}
```

**Método 2: Fetch Manual**

```typescript
const response = await fetch('/api/v2/item/export/excel?limit=10000', {
  headers: {
    'X-Export-Request': 'true',  // ✨ Importante!
    'X-API-Key': apiKey,
  },
});

if (response.ok) {
  const blob = await response.blob();
  // ... fazer download
}
```

## 🧪 Testando

### 1. Testar sem Permissão (Free Tier)

```bash
# Deve aplicar rate limit normal
curl -H "X-API-Key: free-123..." \
     -H "X-Export-Request: true" \
     "http://localhost:3000/api/v2/item/export/excel?limit=10000"

# Resposta: 429 Too Many Requests (após limite)
```

### 2. Testar com Permissão (Premium/Enterprise)

```bash
# Deve fazer bypass do rate limit
curl -H "X-API-Key: premium-456..." \
     -H "X-Export-Request: true" \
     "http://localhost:3000/api/v2/item/export/excel?limit=10000"

# Resposta: 200 OK + Headers de bypass
# X-RateLimit-Bypassed: export
```

### 3. Verificar Logs

```bash
# Backend logs
tail -f logs/application.log | grep "Rate limit bypassed"

# Deve aparecer:
# [INFO] Rate limit bypassed for export request { userId: '...', path: '/api/v2/item/export/excel' }
```

## 📊 Endpoints de Exportação

| Endpoint | Formato | Limite | Header Obrigatório |
|----------|---------|--------|-------------------|
| `/api/v2/item/export/excel` | XLSX | 10.000 | X-Export-Request |
| `/api/v2/item/export/csv` | CSV | 10.000 | X-Export-Request |
| `/api/engenharia/estrutura/export/:item/:format` | CSV/XLSX/PDF | - | X-Export-Request |

## 🔒 Segurança

### ✅ Proteções Implementadas

1. **Autenticação Obrigatória**
   - Apenas usuários autenticados podem fazer exportações
   - API Key validada antes de verificar permissões

2. **Autorização por Tier**
   - Free tier: sem bypass (rate limit aplicado)
   - Premium+: bypass automático
   - Permissões verificadas em tempo de execução

3. **Auditoria Completa**
   - Todos os bypasses são logados (INFO level)
   - Tentativas negadas são logadas (WARN level)
   - Include correlationId para rastreamento

4. **Header Explícito**
   - Bypass só funciona com header `X-Export-Request: true`
   - Previne bypasses acidentais
   - Cliente deve declarar intenção

### ⚠️ Considerações

1. **Não é Abuso-Proof**
   - Usuário premium pode fazer exportações ilimitadas
   - Monitorar logs para detectar abuso
   - Considerar quotas por hora/dia se necessário

2. **Custo de Infraestrutura**
   - Exportações massivas consomem recursos
   - Monitorar uso de CPU/memória
   - Considerar rate limit secundário se necessário

## 📈 Métricas e Monitoramento

### Métricas Prometheus

```prometheus
# Total de bypasses concedidos
rate_limit_bypassed_total{reason="export"}

# Tentativas de bypass negadas
rate_limit_bypass_denied_total{reason="missing_permission"}

# Exportações por tier
exports_total{tier="premium", format="excel"}
```

### Queries Úteis

```promql
# Taxa de bypasses por minuto
rate(rate_limit_bypassed_total{reason="export"}[5m])

# % de exportações vs requisições normais
exports_total / http_requests_total

# Usuários que mais exportam
topk(10, sum by (user_id) (exports_total))
```

## 🔄 Evolução Futura

### Possíveis Melhorias

1. **Quotas por Usuário**
   ```typescript
   // Limitar exportações por dia/mês
   const quota = await ExportQuotaService.check(userId);
   if (quota.exceeded) {
     throw new QuotaExceededError();
   }
   ```

2. **Exportações Assíncronas**
   ```typescript
   // Para datasets muito grandes
   const jobId = await ExportService.enqueueExport(filters);
   // Notificar usuário quando pronto
   ```

3. **Cache de Exportações**
   ```typescript
   // Reutilizar exportações idênticas recentes
   const cacheKey = hash(filters);
   const cached = await ExportCache.get(cacheKey);
   ```

4. **Rate Limit Secundário**
   ```typescript
   // Limite menor para exportações (ex: 10/hora)
   const exportLimiter = new ExportRateLimiter({
     perHour: 10,
   });
   ```

## 📞 Suporte

**Problemas Comuns:**

1. **"Rate limit excedido" mesmo com tier premium**
   - ✅ Verificar se header `X-Export-Request: true` está presente
   - ✅ Confirmar tier da API Key no admin panel
   - ✅ Verificar logs: "Export request denied - missing export:unlimited permission"

2. **Bypass não funciona**
   - ✅ Confirmar autenticação válida (API Key correta)
   - ✅ Verificar tier da API Key (deve ser premium+)
   - ✅ Confirmar header case-sensitive: `X-Export-Request` (não `x-export-request`)

3. **Como conceder permissão para usuário específico?**
   - Atualizar tier da API Key para `premium` ou superior
   - Ou adicionar permissão customizada: `req.user.permissions.push('export:unlimited')`

**Documentos Relacionados:**
- [Rate Limiting](./RATE_LIMITING.md)
- [API Keys](./API_KEYS.md)
- [Permissions System](./PERMISSIONS.md)

---

**Última atualização:** 2025-01-15
**Versão:** 1.0.0
**Autor:** Sistema LordtsAPI
