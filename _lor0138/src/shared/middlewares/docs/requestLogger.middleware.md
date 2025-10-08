# Request Logger Middleware

> Middleware de logging de requisições HTTP com tracking, métricas e auditoria

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [API Reference](#api-reference)
- [Exemplos de Uso](#exemplos-de-uso)
- [Extensões de Tipos](#extensões-de-tipos)
- [Níveis de Log](#níveis-de-log)
- [Headers de Resposta](#headers-de-resposta)
- [Integração com Outros Middlewares](#integração-com-outros-middlewares)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

---

## Visão Geral

### O que é?

Middleware responsável por registrar logs detalhados de todas as requisições HTTP que passam pela aplicação. Captura informações de entrada, saída, duração e erros, facilitando debugging e auditoria.

### Características

- ✅ **ID único** - UUID v4 para cada requisição
- ✅ **Tracking completo** - Início e fim de requisição
- ✅ **Métricas** - Duração calculada automaticamente
- ✅ **Headers** - X-Request-ID em resposta
- ✅ **Níveis inteligentes** - Log automático baseado em status
- ✅ **Interceptação** - Captura erros de servidor (5xx)

### Tecnologias

- **uuid** - Geração de IDs únicos
- **Winston** - Sistema de logging
- **Express** - Framework web
- **TypeScript** - Tipagem forte

---

## Funcionalidades

### 1. Geração de Request ID

Cada requisição recebe um UUID v4 único para tracking end-to-end.

```typescript
// Gerado automaticamente
req.requestId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
```

### 2. Cálculo de Duração

Marca timestamp de início e calcula duração total da requisição.

```typescript
// Início marcado
req.startTime = Date.now()

// Duração calculada ao fim
duration = Date.now() - req.startTime  // ms
```

### 3. Níveis de Log Automáticos

Seleciona nível apropriado baseado no status code HTTP.

| Status Code | Nível | Descrição |
|-------------|-------|-----------|
| 200-399 | `http` | Sucesso |
| 400-499 | `warn` | Erro cliente |
| 500-599 | `error` | Erro servidor |

### 4. Headers de Resposta

Adiciona Request ID no header para rastreamento pelo cliente.

```http
X-Request-ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
```

### 5. Interceptação de Resposta

Sobrescreve `res.send()` para capturar resposta final.

```typescript
// Transparente - não afeta funcionalidade
const originalSend = res.send
res.send = function(data) {
  // ... logging
  return originalSend.call(this, data)
}
```

### 6. Logs Detalhados de Erros

Para erros 5xx, loga corpo da resposta para debugging.

```typescript
if (res.statusCode >= 500) {
  log.error('Erro no servidor', {
    requestId: req.requestId,
    response: JSON.stringify(data)
  })
}
```

---

## API Reference

### requestLogger()

```typescript
function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void
```

Middleware principal de logging de requisições.

**Fluxo de execução:**

1. Gera `requestId` único (UUID v4)
2. Marca `startTime` (timestamp)
3. Adiciona header `X-Request-ID`
4. Loga início da requisição
5. Intercepta `res.send()`
6. Calcula duração ao finalizar
7. Escolhe nível de log apropriado
8. Loga resposta com detalhes

**Exemplo:**
```typescript
import { requestLogger } from '@shared/middlewares/requestLogger.middleware';

app.use(requestLogger);
```

**⚠️ IMPORTANTE:**
- Deve ser registrado **APÓS** `correlationId.middleware`
- Não interfere no fluxo da requisição
- Intercepta `res.send()` de forma transparente

---

### getRequestId()

```typescript
function getRequestId(req: Request): string
```

Extrai Request ID do objeto de requisição.

**Parâmetros:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| req | Request | Objeto de requisição Express |

**Retorno:**
- `string` - Request ID ou 'unknown' se não encontrado

**Exemplo:**
```typescript
import { getRequestId } from '@shared/middlewares/requestLogger.middleware';

const requestId = getRequestId(req);
console.log(`Processing request: ${requestId}`);
```

---

### withRequestId()

```typescript
function withRequestId(
  req: Request,
  logData: Record<string, any>
): Record<string, any>
```

Adiciona Request ID em objetos de log.

**Parâmetros:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| req | Request | Objeto de requisição Express |
| logData | Record<string, any> | Dados a serem logados |

**Retorno:**
- `Record<string, any>` - Objeto com Request ID adicionado

**Exemplo:**
```typescript
import { withRequestId } from '@shared/middlewares/requestLogger.middleware';

log.info('Processando item', withRequestId(req, {
  itemCodigo: '7530110',
  action: 'fetch'
}));

// Log: { requestId: 'uuid...', itemCodigo: '7530110', action: 'fetch' }
```

---

### getRequestDuration()

```typescript
function getRequestDuration(req: Request): number
```

Calcula duração de uma requisição.

**Parâmetros:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| req | Request | Objeto de requisição Express |

**Retorno:**
- `number` - Duração em milissegundos (0 se startTime não definido)

**Exemplo:**
```typescript
import { getRequestDuration } from '@shared/middlewares/requestLogger.middleware';

const duration = getRequestDuration(req);
console.log(`Request took ${duration}ms`);

if (duration > 1000) {
  log.warn('Requisição lenta', { duration });
}
```

---

### formatRequestInfo()

```typescript
function formatRequestInfo(req: Request): object
```

Formata informações da requisição para log.

**Parâmetros:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| req | Request | Objeto de requisição Express |

**Retorno:**
- `object` - Objeto com informações formatadas

**Propriedades retornadas:**
```typescript
{
  requestId: string,
  method: string,
  url: string,
  path: string,
  query: object,
  params: object,
  ip: string,
  userAgent: string,
  referer: string,
  startTime: number
}
```

**Exemplo:**
```typescript
import { formatRequestInfo } from '@shared/middlewares/requestLogger.middleware';

const info = formatRequestInfo(req);
log.info('Request details', info);

// Log completo com todas as informações
```

---

## Exemplos de Uso

### Setup Básico

```typescript
// app.ts
import express from 'express';
import { requestLogger } from '@shared/middlewares/requestLogger.middleware';

const app = express();

// Registrar logo no início (após CORS, antes das rotas)
app.use(requestLogger);

// Rotas...
app.use('/api/items', itemRoutes);
```

### Com Correlation ID

```typescript
// app.ts
import { correlationId } from '@shared/middlewares/correlationId.middleware';
import { requestLogger } from '@shared/middlewares/requestLogger.middleware';

// Ordem IMPORTANTE:
app.use(correlationId);  // Primeiro
app.use(requestLogger);  // Depois
```

### Usando Helpers em Controller

```typescript
// ItemController.ts
import { Request, Response } from 'express';
import {
  getRequestId,
  withRequestId,
  getRequestDuration
} from '@shared/middlewares/requestLogger.middleware';
import { log } from '@shared/utils/logger';

export class ItemController {
  static async getItem(req: Request, res: Response) {
    // Logar com Request ID
    log.info('Buscando item', withRequestId(req, {
      itemCodigo: req.params.itemCodigo
    }));

    try {
      const item = await ItemService.find(req.params.itemCodigo);

      // Logar sucesso com duração
      const duration = getRequestDuration(req);
      log.info('Item encontrado', withRequestId(req, {
        itemCodigo: req.params.itemCodigo,
        duration
      }));

      res.json({ success: true, data: item });
    } catch (error) {
      log.error('Erro ao buscar item', withRequestId(req, {
        itemCodigo: req.params.itemCodigo,
        error: error.message
      }));

      throw error;
    }
  }
}
```

### Métricas de Performance

```typescript
// PerformanceMonitor.ts
import { Request, Response, NextFunction } from 'express';
import { getRequestDuration, withRequestId } from '@shared/middlewares/requestLogger.middleware';
import { log } from '@shared/utils/logger';

export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  // Interceptar fim da requisição
  res.on('finish', () => {
    const duration = getRequestDuration(req);

    // Alertar se requisição demorou mais de 1 segundo
    if (duration > 1000) {
      log.warn('Requisição lenta detectada', withRequestId(req, {
        duration,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode
      }));
    }
  });

  next();
}

// app.ts
app.use(requestLogger);
app.use(performanceMonitor);
```

### Auditoria de Ações

```typescript
// AuditService.ts
import { Request } from 'express';
import { getRequestId, formatRequestInfo } from '@shared/middlewares/requestLogger.middleware';

export class AuditService {
  static async logAction(req: Request, action: string, details: any) {
    const requestInfo = formatRequestInfo(req);

    await AuditLog.create({
      requestId: getRequestId(req),
      action,
      details,
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent,
      timestamp: new Date()
    });
  }
}

// Controller
await AuditService.logAction(req, 'UPDATE_ITEM', {
  itemCodigo: req.params.itemCodigo,
  changes: req.body
});
```

---

## Extensões de Tipos

### Express.Request

O middleware estende o tipo `Request` do Express com propriedades customizadas:

```typescript
declare global {
  namespace Express {
    interface Request {
      requestId: string;    // UUID v4 único
      startTime?: number;   // Timestamp em ms
    }
  }
}
```

**Uso:**
```typescript
// Tipos disponíveis automaticamente
function handler(req: Request, res: Response) {
  console.log(req.requestId);  // ✅ TypeScript reconhece
  console.log(req.startTime);  // ✅ TypeScript reconhece
}
```

---

## Níveis de Log

### Mapeamento Status → Nível

```typescript
const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
```

| Status Range | Nível | Quando Usar |
|--------------|-------|-------------|
| 200-399 | `http` | Requisições bem-sucedidas |
| 400-499 | `warn` | Erros do cliente (bad request, not found, etc) |
| 500-599 | `error` | Erros do servidor (crash, timeout, etc) |

### Exemplos de Logs

**Sucesso (200):**
```json
{
  "level": "http",
  "message": "Requisição finalizada",
  "requestId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "method": "GET",
  "url": "/api/items/7530110",
  "statusCode": 200,
  "duration": 45,
  "ip": "192.168.1.100"
}
```

**Erro Cliente (404):**
```json
{
  "level": "warn",
  "message": "Requisição finalizada",
  "requestId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "method": "GET",
  "url": "/api/items/invalid",
  "statusCode": 404,
  "duration": 12,
  "ip": "192.168.1.100"
}
```

**Erro Servidor (500):**
```json
{
  "level": "error",
  "message": "Erro no servidor",
  "requestId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "method": "POST",
  "url": "/api/items",
  "statusCode": 500,
  "response": "{\"success\":false,\"error\":\"Database connection failed\"}",
  "duration": 5000
}
```

---

## Headers de Resposta

### X-Request-ID

Todo response inclui header `X-Request-ID` para rastreamento end-to-end.

**Exemplo de Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-ID: f47ac10b-58cc-4372-a567-0e02b2c3d479

{
  "success": true,
  "data": { ... }
}
```

**Uso pelo Cliente:**
```javascript
// Frontend - capturar Request ID para suporte
fetch('/api/items/7530110')
  .then(response => {
    const requestId = response.headers.get('X-Request-ID');
    console.log('Request ID:', requestId);
    // Enviar para analytics ou suporte
  });
```

**Uso em Logs Agregados:**
```bash
# Buscar todos os logs de uma requisição específica
grep "f47ac10b-58cc-4372-a567-0e02b2c3d479" app.log

# Ou usando ferramenta de log
tail -f app.log | grep "f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

---

## Integração com Outros Middlewares

### Ordem Correta

```typescript
// app.ts
import express from 'express';
import { correlationId } from '@shared/middlewares/correlationId.middleware';
import { requestLogger } from '@shared/middlewares/requestLogger.middleware';
import { rateLimiter } from '@shared/middlewares/rateLimiter.middleware';
import { errorHandler } from '@shared/middlewares/errorHandler.middleware';

const app = express();

// 1. CORS (primeiro de tudo)
app.use(cors());

// 2. Body parsing
app.use(express.json());

// 3. Correlation ID (antes de logs)
app.use(correlationId);

// 4. Request Logger (após correlation)
app.use(requestLogger);

// 5. Rate Limiting
app.use(rateLimiter);

// 6. Rotas
app.use('/api', routes);

// 7. Error Handler (último)
app.use(errorHandler);
```

### Com Correlation ID

```typescript
// Se correlationId.middleware estiver ativo
app.use(correlationId);  // req.id
app.use(requestLogger);  // req.requestId

// Em controllers, prefira req.id (mais robusto)
const id = req.id || req.requestId;
```

### Com Error Handler

```typescript
// errorHandler.middleware.ts
import { getRequestId } from '@shared/middlewares/requestLogger.middleware';

export function errorHandler(err, req, res, next) {
  const requestId = getRequestId(req);

  log.error('Erro capturado', {
    requestId,
    error: err.message,
    stack: err.stack
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message,
    requestId  // Incluir na resposta
  });
}
```

---

## Boas Práticas

### ✅ DO

**1. Use Request ID em todos os logs**
```typescript
// ✅ Sempre correlacione logs
log.info('Processando', withRequestId(req, { itemCodigo }));
```

**2. Monitore duração de requisições**
```typescript
// ✅ Detecte requisições lentas
if (getRequestDuration(req) > 1000) {
  log.warn('Requisição lenta', withRequestId(req, { duration }));
}
```

**3. Use formatRequestInfo() para debug**
```typescript
// ✅ Log completo quando necessário
if (DEBUG_MODE) {
  log.debug('Request detalhado', formatRequestInfo(req));
}
```

**4. Inclua Request ID em respostas de erro**
```typescript
// ✅ Cliente pode reportar o ID
res.status(500).json({
  success: false,
  error: 'Erro interno',
  requestId: getRequestId(req)
});
```

**5. Registre requestLogger cedo na cadeia**
```typescript
// ✅ Logo após CORS e body parsing
app.use(cors());
app.use(express.json());
app.use(requestLogger);  // Cedo
```

---

### ❌ DON'T

**1. Não registre requestLogger muito tarde**
```typescript
// ❌ Muitos middlewares antes = logs incompletos
app.use(routes);
app.use(requestLogger);  // Tarde demais

// ✅ Registre cedo
app.use(requestLogger);
app.use(routes);
```

**2. Não crie Request IDs manualmente**
```typescript
// ❌ Conflito com middleware
req.requestId = 'custom-id';

// ✅ Use o gerado automaticamente
const id = getRequestId(req);
```

**3. Não ignore logs de erro 5xx**
```typescript
// ❌ Erro silencioso
try {
  // ...
} catch (error) {
  res.status(500).send('Error');
}

// ✅ Sempre logue com contexto
try {
  // ...
} catch (error) {
  log.error('Erro no processamento', withRequestId(req, {
    error: error.message
  }));
  res.status(500).json({ success: false, error: error.message });
}
```

**4. Não faça log de dados sensíveis**
```typescript
// ❌ Expõe informações sensíveis
log.info('Login', withRequestId(req, {
  password: req.body.password,  // NUNCA!
  creditCard: req.body.card     // NUNCA!
}));

// ✅ Omita dados sensíveis
log.info('Login', withRequestId(req, {
  username: req.body.username,
  ip: req.ip
}));
```

**5. Não sobrescreva res.send() novamente**
```typescript
// ❌ Conflito com requestLogger
res.send = function(data) {
  // Customização
};

// ✅ Use events ou outros hooks
res.on('finish', () => {
  // Custom logic
});
```

---

## Troubleshooting

### Problema: Request ID undefined

**Sintoma:**
```typescript
getRequestId(req) // 'unknown'
req.requestId     // undefined
```

**Causa:**
- `requestLogger` não registrado
- Registrado após uso do `req.requestId`

**Solução:**
```typescript
// app.ts
app.use(requestLogger);  // Registre ANTES das rotas
app.use('/api', routes);
```

---

### Problema: Duração sempre 0

**Sintoma:**
```typescript
getRequestDuration(req) // sempre 0
```

**Causa:**
- `startTime` não definido
- Requisição não passou pelo middleware

**Solução:**
```typescript
// Verifique ordem dos middlewares
app.use(requestLogger);  // Deve ser primeiro

// Ou use default
const duration = req.startTime ? Date.now() - req.startTime : 0;
```

---

### Problema: Logs duplicados

**Sintoma:**
- Mesma requisição logada múltiplas vezes

**Causa:**
- `requestLogger` registrado múltiplas vezes
- Middleware aplicado em rotas E globalmente

**Solução:**
```typescript
// ❌ Duplicado
app.use(requestLogger);
app.use('/api', requestLogger, routes);

// ✅ Apenas uma vez (globalmente)
app.use(requestLogger);
app.use('/api', routes);
```

---

### Problema: Logs de erro 5xx não aparecem

**Sintoma:**
- Status 500 mas sem log `error`

**Causa:**
- Erro lançado após `res.send()`
- Response enviado antes do erro

**Solução:**
```typescript
// ✅ Use try/catch em controllers
try {
  const result = await service.process();
  res.json(result);
} catch (error) {
  log.error('Erro no service', withRequestId(req, {
    error: error.message
  }));
  next(error);  // Delegar para errorHandler
}
```

---

## Referências

### Arquivos Relacionados

- `logger.ts` - Sistema de logging Winston
- `correlationId.middleware.ts` - Correlation ID
- `errorHandler.middleware.ts` - Tratamento de erros
- `metrics.middleware.ts` - Métricas de performance

### Links Externos

- [UUID v4 RFC](https://tools.ietf.org/html/rfc4122) - Padrão UUID
- [Winston Logger](https://github.com/winstonjs/winston) - Sistema de logging
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) - Status codes HTTP

### Conceitos

- **Request ID** - Identificador único de requisição
- **Correlation ID** - ID para rastrear requisições distribuídas
- **Logging Levels** - Níveis de severidade de logs
- **Interceptor Pattern** - Padrão de interceptação de métodos
- **Middleware Chain** - Cadeia de middlewares Express

---

## Resumo

### O que é?

Middleware de logging que registra detalhes de todas as requisições HTTP, incluindo ID único, duração, status e informações de debugging.

### Exports

| Export | Tipo | Descrição |
|--------|------|-----------|
| requestLogger | Middleware | Middleware principal |
| getRequestId | Function | Extrai Request ID |
| withRequestId | Function | Enriquece logs com ID |
| getRequestDuration | Function | Calcula duração |
| formatRequestInfo | Function | Formata info da request |

### Quando Usar

- ✅ **Sempre** - Em todas as aplicações Express
- ✅ **Debugging** - Rastrear requisições problemáticas
- ✅ **Auditoria** - Compliance e logs de acesso
- ✅ **Performance** - Identificar requisições lentas

### Ordem de Middlewares

```typescript
1. CORS
2. Body parsing
3. Correlation ID
4. Request Logger  ← Este middleware
5. Rate Limiting
6. Rotas
7. Error Handler
```

---

**Última atualização:** 2025-10-07