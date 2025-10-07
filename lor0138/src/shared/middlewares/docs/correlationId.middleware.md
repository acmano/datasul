# Middleware de Correlation ID

**Arquivo:** `src/shared/middlewares/correlationId.middleware.ts`
**Tipo:** Middleware Express
**Propósito:** Rastreamento end-to-end de requisições

---

## Visão Geral

Implementa rastreamento de requisições através de um identificador único (UUID v4) que acompanha toda a jornada da request pelo sistema.

### O que é Correlation ID?

Um **Correlation ID** (também chamado Request ID ou Trace ID) é um identificador único que:
- É atribuído a cada requisição HTTP
- Acompanha a requisição através de todo o sistema
- Permite rastrear logs relacionados à mesma requisição
- Facilita debugging e troubleshooting
- Conecta operações distribuídas

### Benefícios

| Benefício | Impacto |
|-----------|---------|
| **Debug facilitado** | Rastreie uma requisição específica nos logs |
| **Correlação entre sistemas** | Mesmo ID em múltiplos microserviços |
| **Métricas precisas** | Agrupe dados por requisição |
| **Troubleshooting rápido** | Identifique problemas específicos |
| **Auditoria completa** | Histórico completo de uma operação |

---

## Como Funciona

### Fluxo de Execução

```
Cliente faz requisição
    ↓
Middleware verifica headers:
  - X-Correlation-ID
  - X-Request-ID
  - correlation-id
    ↓
ID encontrado? ──NO──→ Gera UUID v4
    ↓ YES              ↓
Usa ID do cliente ←────┘
    ↓
Adiciona ao req.id
    ↓
Adiciona req.startTime (timestamp)
    ↓
Define header de resposta (X-Correlation-ID)
    ↓
Próximo middleware
```

### Headers Suportados

**Ordem de prioridade:**

1. **X-Correlation-ID** (recomendado)
2. **X-Request-ID** (compatibilidade)
3. **correlation-id** (alternativa lowercase)

### Estrutura do Request

Após middleware, o request contém:

```typescript
interface Request {
  id: string;          // Correlation ID (UUID v4)
  startTime: number;   // Timestamp em ms
  // ... outros campos
}
```

---

## Setup

### 1. Extensão de Tipos

Crie ou edite `src/types/express.d.ts`:

```typescript
// src/types/express.d.ts

declare global {
  namespace Express {
    interface Request {
      id: string;         // Correlation ID
      startTime?: number; // Timestamp da requisição
    }
  }
}

export {};
```

### 2. Instalação do UUID

```bash
npm install uuid
npm install --save-dev @types/uuid
```

### 3. Registro do Middleware

```typescript
// src/app.ts
import express from 'express';
import { correlationIdMiddleware } from '@shared/middlewares/correlationId.middleware';

const app = express();

// ⚠️ IMPORTANTE: Deve ser o PRIMEIRO middleware
app.use(correlationIdMiddleware);

// Outros middlewares depois
app.use(express.json());
app.use(helmet());
// ... etc
```

**⚠️ CRÍTICO:** Deve ser o primeiro middleware para garantir que todos os logs subsequentes tenham acesso ao ID.

---

## Exemplos de Uso

### Exemplo 1: Cliente Envia ID

**Request:**
```http
GET /api/items/7530110 HTTP/1.1
Host: api.example.com
X-Correlation-ID: my-trace-001
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Correlation-ID: my-trace-001

{
  "success": true,
  "data": { ... }
}
```

### Exemplo 2: Servidor Gera ID

**Request:**
```http
GET /api/items/7530110 HTTP/1.1
Host: api.example.com
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000

{
  "success": true,
  "data": { ... }
}
```

---

## Integração com Logs

### Log Básico

```typescript
import { log } from '@shared/utils/logger';

export const getItem = async (req: Request, res: Response) => {
  const { itemCodigo } = req.params;

  // ✅ Sempre inclua correlationId nos logs
  log.info('Buscando item', {
    correlationId: req.id,
    itemCodigo
  });

  const item = await ItemService.find(itemCodigo);

  log.info('Item encontrado', {
    correlationId: req.id,
    itemCodigo,
    found: !!item
  });

  res.json({ success: true, data: item });
};
```

### Usando Helper `withCorrelationId`

```typescript
import { withCorrelationId } from '@shared/middlewares/correlationId.middleware';
import { log } from '@shared/utils/logger';

export const getItem = async (req: Request, res: Response) => {
  const { itemCodigo } = req.params;

  // ✅ Helper adiciona correlationId automaticamente
  log.info(withCorrelationId(req, {
    message: 'Buscando item',
    itemCodigo
  }));

  const item = await ItemService.find(itemCodigo);

  log.info(withCorrelationId(req, {
    message: 'Item encontrado',
    itemCodigo,
    found: !!item
  }));

  res.json({ success: true, data: item });
};
```

### Em Services

```typescript
// src/services/ItemService.ts
import { withCorrelationId } from '@shared/middlewares/correlationId.middleware';
import { log } from '@shared/utils/logger';

export class ItemService {
  static async find(itemCodigo: string, req: Request) {
    log.debug(withCorrelationId(req, {
      action: 'service.find',
      itemCodigo
    }));

    try {
      const item = await ItemRepository.findByCodigo(itemCodigo);

      log.info(withCorrelationId(req, {
        action: 'service.find.success',
        itemCodigo,
        found: !!item
      }));

      return item;
    } catch (error) {
      log.error(withCorrelationId(req, {
        action: 'service.find.error',
        itemCodigo,
        error
      }));
      throw error;
    }
  }
}
```

### Em Repositories

```typescript
// src/repositories/ItemRepository.ts
import { withCorrelationId } from '@shared/middlewares/correlationId.middleware';
import { log } from '@shared/utils/logger';

export class ItemRepository {
  static async findByCodigo(codigo: string, req: Request) {
    log.debug(withCorrelationId(req, {
      action: 'repository.findByCodigo',
      codigo,
      query: 'SELECT * FROM item WHERE codigo = ?'
    }));

    const startTime = Date.now();
    const result = await db.query('SELECT * FROM item WHERE codigo = ?', [codigo]);
    const duration = Date.now() - startTime;

    log.debug(withCorrelationId(req, {
      action: 'repository.findByCodigo.completed',
      codigo,
      duration,
      found: result.length > 0
    }));

    return result[0] || null;
  }
}
```

---

## Rastreamento Distribuído

### Cenário: Microserviços

Quando uma requisição passa por múltiplos serviços, o mesmo Correlation ID deve ser propagado.

#### Serviço A (Gateway/BFF)

```typescript
// api-gateway/src/controllers/OrderController.ts
export const createOrder = async (req: Request, res: Response) => {
  const correlationId = req.id;

  log.info(withCorrelationId(req, {
    action: 'createOrder.start'
  }));

  // Propaga Correlation ID para outros serviços
  const inventory = await fetch('http://inventory-service/api/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId // ← Propaga
    },
    body: JSON.stringify({ items: req.body.items })
  });

  const payment = await fetch('http://payment-service/api/charge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId // ← Propaga
    },
    body: JSON.stringify({ amount: req.body.total })
  });

  log.info(withCorrelationId(req, {
    action: 'createOrder.completed',
    inventory: inventory.status,
    payment: payment.status
  }));

  res.json({ success: true });
};
```

#### Serviço B (Inventory)

```typescript
// inventory-service/src/app.ts
import { correlationIdMiddleware } from '@shared/middlewares/correlationId.middleware';

app.use(correlationIdMiddleware); // ← Aceita ID do gateway

app.post('/api/check', async (req: Request, res: Response) => {
  // req.id contém o mesmo ID do gateway
  log.info(withCorrelationId(req, {
    service: 'inventory',
    action: 'check',
    items: req.body.items
  }));

  // ... lógica
});
```

#### Serviço C (Payment)

```typescript
// payment-service/src/app.ts
import { correlationIdMiddleware } from '@shared/middlewares/correlationId.middleware';

app.use(correlationIdMiddleware); // ← Aceita ID do gateway

app.post('/api/charge', async (req: Request, res: Response) => {
  // req.id contém o mesmo ID do gateway
  log.info(withCorrelationId(req, {
    service: 'payment',
    action: 'charge',
    amount: req.body.amount
  }));

  // ... lógica
});
```

#### Logs Correlacionados

```json
// Gateway
{
  "level": "info",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "service": "api-gateway",
  "action": "createOrder.start",
  "timestamp": "2025-10-07T10:00:00.000Z"
}

// Inventory Service
{
  "level": "info",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "service": "inventory",
  "action": "check",
  "items": [...],
  "timestamp": "2025-10-07T10:00:00.100Z"
}

// Payment Service
{
  "level": "info",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "service": "payment",
  "action": "charge",
  "amount": 99.90,
  "timestamp": "2025-10-07T10:00:00.250Z"
}

// Gateway
{
  "level": "info",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "service": "api-gateway",
  "action": "createOrder.completed",
  "timestamp": "2025-10-07T10:00:00.500Z"
}
```

**Buscar nos logs:**
```bash
grep "550e8400-e29b-41d4-a716-446655440000" logs/*.log

# Retorna TODOS os logs relacionados à requisição
# em TODOS os serviços
```

---

## Helper Functions

### getCorrelationId()

Obtém Correlation ID do request de forma segura.

**Assinatura:**
```typescript
function getCorrelationId(req: Request): string
```

**Uso:**
```typescript
import { getCorrelationId } from '@shared/middlewares/correlationId.middleware';

function helper(req: Request) {
  const correlationId = getCorrelationId(req);

  // Garantido retornar string válida
  // Retorna 'unknown' apenas em edge cases

  log.info('Processando', { correlationId });
}
```

---

### withCorrelationId()

Adiciona Correlation ID em objetos de log automaticamente.

**Assinatura:**
```typescript
function withCorrelationId(
  req: Request,
  logData: Record<string, any>
): Record<string, any>
```

**Benefícios:**
- ✅ Evita repetição manual
- ✅ Garante consistência
- ✅ correlationId sempre primeiro
- ✅ Não modifica objeto original

**Comparação:**

```typescript
// ❌ Manual (repetitivo)
log.info({
  correlationId: req.id,
  message: 'Processando',
  itemCodigo: '7530110'
});

log.info({
  correlationId: req.id,
  message: 'Finalizado',
  itemCodigo: '7530110',
  success: true
});

// ✅ Com helper (limpo)
log.info(withCorrelationId(req, {
  message: 'Processando',
  itemCodigo: '7530110'
}));

log.info(withCorrelationId(req, {
  message: 'Finalizado',
  itemCodigo: '7530110',
  success: true
}));
```

---

## Métricas de Performance

### Usando req.startTime

O middleware adiciona `req.startTime` para cálculo de duração:

```typescript
export const getItems = async (req: Request, res: Response) => {
  log.info(withCorrelationId(req, {
    action: 'getItems.start'
  }));

  const items = await ItemService.findAll();

  // Calcular duração total da requisição
  const duration = Date.now() - (req.startTime || Date.now());

  log.info(withCorrelationId(req, {
    action: 'getItems.completed',
    duration,
    itemCount: items.length
  }));

  res.json({ success: true, data: items });
};
```

### Middleware de Logging de Duração

```typescript
// src/middlewares/requestLogger.middleware.ts
import { correlationIdMiddleware } from './correlationId.middleware';

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Registrar início
  log.info(withCorrelationId(req, {
    event: 'request.start',
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  }));

  // Interceptar finalização
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now());

    log.info(withCorrelationId(req, {
      event: 'request.completed',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration
    }));
  });

  next();
};

// Setup
app.use(correlationIdMiddleware);    // 1. Primeiro
app.use(requestLoggerMiddleware);    // 2. Depois
```

---

## Testando

### Com curl

```bash
# Sem Correlation ID (servidor gera)
curl -v http://localhost:3000/api/items

# Response inclui:
# < X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000

# Com Correlation ID customizado
curl -v \
  -H "X-Correlation-ID: my-custom-trace-001" \
  http://localhost:3000/api/items

# Response retorna o mesmo:
# < X-Correlation-ID: my-custom-trace-001
```

### Com HTTPie

```bash
# Sem ID
http GET localhost:3000/api/items

# Com ID
http GET localhost:3000/api/items X-Correlation-ID:my-trace-001
```

### Com Postman

**1. Adicionar header:**
- Key: `X-Correlation-ID`
- Value: `my-custom-id-123`

**2. Verificar response headers:**
- Ver `X-Correlation-ID` no response

---

### Testes Automatizados

```typescript
// test/correlationId.test.ts
import request from 'supertest';
import app from '../src/app';
import { v4 as uuidv4 } from 'uuid';

describe('Correlation ID Middleware', () => {
  it('should generate UUID if not provided', async () => {
    const response = await request(app)
      .get('/api/items')
      .expect(200);

    const correlationId = response.headers['x-correlation-id'];

    expect(correlationId).toBeDefined();
    expect(correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should use client correlation ID if provided', async () => {
    const clientId = 'my-custom-trace-001';

    const response = await request(app)
      .get('/api/items')
      .set('X-Correlation-ID', clientId)
      .expect(200);

    expect(response.headers['x-correlation-id']).toBe(clientId);
  });

  it('should accept X-Request-ID header', async () => {
    const clientId = 'request-id-123';

    const response = await request(app)
      .get('/api/items')
      .set('X-Request-ID', clientId)
      .expect(200);

    expect(response.headers['x-correlation-id']).toBe(clientId);
  });

  it('should prioritize X-Correlation-ID over X-Request-ID', async () => {
    const correlationId = 'correlation-123';
    const requestId = 'request-456';

    const response = await request(app)
      .get('/api/items')
      .set('X-Correlation-ID', correlationId)
      .set('X-Request-ID', requestId)
      .expect(200);

    // Deve usar X-Correlation-ID
    expect(response.headers['x-correlation-id']).toBe(correlationId);
  });

  it('should add startTime to request', async () => {
    let capturedStartTime: number | undefined;

    app.get('/test-start-time', (req, res) => {
      capturedStartTime = req.startTime;
      res.json({ ok: true });
    });

    await request(app)
      .get('/test-start-time')
      .expect(200);

    expect(capturedStartTime).toBeDefined();
    expect(typeof capturedStartTime).toBe('number');
    expect(capturedStartTime).toBeLessThanOrEqual(Date.now());
  });
});
```

---

## Busca em Logs

### Grep por Correlation ID

```bash
# Buscar em arquivo específico
grep "550e8400-e29b-41d4-a716-446655440000" logs/app.log

# Buscar em todos os logs
grep -r "550e8400-e29b-41d4-a716-446655440000" logs/

# Com contexto (linhas antes/depois)
grep -C 5 "550e8400-e29b-41d4-a716-446655440000" logs/app.log
```

### Usando jq (JSON logs)

```bash
# Filtrar por correlationId
cat logs/app.json | jq 'select(.correlationId == "550e8400")'

# Ver timeline de uma requisição
cat logs/app.json | \
  jq 'select(.correlationId == "550e8400") | {timestamp, action, duration}'

# Contar eventos por correlationId
cat logs/app.json | \
  jq -r '.correlationId' | sort | uniq -c | sort -nr
```

### ELK Stack

```json
// Kibana query
{
  "query": {
    "match": {
      "correlationId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

---

## Boas Práticas

### ✅ DO

**1. Sempre inclua correlationId nos logs**
```typescript
log.info(withCorrelationId(req, {
  action: 'processing',
  data: {...}
}));
```

**2. Propague entre serviços**
```typescript
await fetch(url, {
  headers: {
    'X-Correlation-ID': req.id
  }
});
```

**3. Use em erros e exceptions**
```typescript
catch (error) {
  log.error(withCorrelationId(req, {
    error: error.message,
    stack: error.stack
  }));
}
```

**4. Registre como primeiro middleware**
```typescript
app.use(correlationIdMiddleware); // Primeiro!
app.use(express.json());
```

**5. Use helper withCorrelationId**
```typescript
// ✅ Consistente e limpo
log.info(withCorrelationId(req, { action: 'start' }));
```

---

### ❌ DON'T

**1. Não esqueça correlationId nos logs**
```typescript
// ❌ Log sem contexto
log.info({ action: 'processing' });

// ✅ Log rastreável
log.info(withCorrelationId(req, { action: 'processing' }));
```

**2. Não registre depois de outros middlewares**
```typescript
// ❌ Ordem errada
app.use(express.json());
app.use(correlationIdMiddleware);

// ✅ Ordem correta
app.use(correlationIdMiddleware);
app.use(express.json());
```

**3. Não perca o ID em chamadas assíncronas**
```typescript
// ❌ Perde contexto
setTimeout(() => {
  log.info({ message: 'Delayed' }); // Sem correlationId
}, 1000);

// ✅ Mantém contexto
const correlationId = req.id;
setTimeout(() => {
  log.info({ correlationId, message: 'Delayed' });
}, 1000);
```

**4. Não modifique o correlationId**
```typescript
// ❌ Não altere
req.id = 'novo-id';

// ✅ Use o gerado/fornecido
const id = req.id;
```

---

## Troubleshooting

### Correlation ID não aparece

**Causa:** Middleware não registrado

**Solução:**
```typescript
// Adicionar no app.ts
app.use(correlationIdMiddleware);
```

---

### req.id é undefined

**Causa:** Types não configurados

**Solução:**
```typescript
// src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime?: number;
    }
  }
}
```

---

### Logs sem correlationId

**Causa:** Esqueceu de incluir nos logs

**Solução:**
```typescript
// Use helper
log.info(withCorrelationId(req, { action: 'test' }));
```

---

### IDs diferentes entre serviços

**Causa:** Não propagou o header

**Solução:**
```typescript
// Propagar explicitamente
await fetch(url, {
  headers: {
    'X-Correlation-ID': req.id
  }
});
```

---

## Referências

### Arquivos Relacionados

- `logger.ts` - Sistema de logs
- `express.d.ts` - Extensão de tipos
- `errorHandler.middleware.ts` - Erros incluem correlationId

### Padrões

- **Correlation ID Pattern** - Rastreamento distribuído
- **Request Tracing** - Telemetria de requisições
- **UUID v4** - Identificador único universal

---

## Resumo

### O que é

Middleware que adiciona identificador único a cada requisição para rastreamento end-to-end.

### Exports

- **correlationIdMiddleware** - Middleware principal
- **getCorrelationId** - Helper para obter ID
- **withCorrelationId** - Helper para logs

### Benefícios

- ✅ Debug facilitado
- ✅ Rastreamento distribuído
- ✅ Métricas precisas
- ✅ Troubleshooting rápido
- ✅ Auditoria completa

### Setup

1. ✅ Adicionar tipos (express.d.ts)
2. ✅ Registrar como primeiro middleware
3. ✅ Incluir em todos os logs
4. ✅ Propagar entre serviços