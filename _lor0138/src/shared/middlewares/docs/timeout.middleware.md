# Timeout Middleware

> Middlewares de timeout para limitar tempo de execução de requisições HTTP

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tipos de Timeout](#tipos-de-timeout)
- [API Reference](#api-reference)
- [Exemplos de Uso](#exemplos-de-uso)
- [Comportamento](#comportamento)
- [Status Codes](#status-codes)
- [Ordem de Middlewares](#ordem-de-middlewares)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

---

## Visão Geral

### O que é?

Sistema de middlewares para limitar o tempo de execução de requisições HTTP, prevenindo que requests lentos bloqueiem o servidor indefinidamente.

### Características

- ✅ **3 tipos de timeout** - DEFAULT (30s), HEAVY (60s), HEALTH_CHECK (5s)
- ✅ **Status 503** - Service Unavailable (apropriado para timeouts)
- ✅ **Halt on timeout** - Para execução após timeout
- ✅ **Error handler** - Captura e responde timeouts
- ✅ **Configurável** - Timeouts por tipo de operação
- ✅ **Logs** - Registra timeouts para análise

### Tecnologias

- **connect-timeout** - Middleware de timeout
- **Express** - Framework web
- **TypeScript** - Tipagem forte

---

## Tipos de Timeout

### 1. DEFAULT (30 segundos)

Timeout padrão para requisições normais.

**Quando usar:**
- Requisições GET/POST/PUT/DELETE comuns
- Queries simples no banco
- Operações CRUD

**Configuração:**
```typescript
requestTimeout // 30s
```

---

### 2. HEAVY (60 segundos)

Timeout estendido para operações pesadas.

**Quando usar:**
- Geração de relatórios complexos
- Exports de dados volumosos
- Processamento de arquivos grandes
- Queries complexas com múltiplos JOINs
- Operações batch

**Configuração:**
```typescript
heavyOperationTimeout // 60s
```

---

### 3. HEALTH_CHECK (5 segundos)

Timeout curto para health checks que devem responder rapidamente.

**Quando usar:**
- Endpoints `/health`
- Liveness probes (Kubernetes)
- Readiness probes (Kubernetes)

**Configuração:**
```typescript
healthCheckTimeout // 5s
```

**⚠️ IMPORTANTE:**
Health checks lentos indicam problema e devem falhar fast.

---

## API Reference

### requestTimeout

```typescript
export const requestTimeout: RequestHandler
```

Middleware de timeout global para todas as requisições (30s).

**Comportamento:**
- Define timeout de 30s
- Marca `req.timedout = true` quando timeout ocorre
- NÃO envia resposta automaticamente

**Exemplo:**
```typescript
app.use(requestTimeout);
```

**⚠️ ORDEM:**
Coloque ANTES das rotas mas DEPOIS de middlewares de parsing (body-parser).

---

### heavyOperationTimeout

```typescript
export const heavyOperationTimeout: RequestHandler
```

Middleware de timeout para operações pesadas (60s).

**Comportamento:**
- Define timeout de 60s
- Marca `req.timedout = true` quando timeout ocorre
- Use em rotas específicas

**Exemplo:**
```typescript
router.get('/reports/full',
  heavyOperationTimeout,
  haltOnTimedout,
  controller.generateReport
);
```

**⚠️ USO:**
Apenas em rotas que realmente precisam de mais tempo.

---

### healthCheckTimeout

```typescript
export const healthCheckTimeout: RequestHandler
```

Middleware de timeout para health checks (5s).

**Comportamento:**
- Define timeout de 5s
- Health checks devem responder rapidamente
- Timeout = sistema unhealthy

**Exemplo:**
```typescript
router.get('/health', healthCheckTimeout, healthController.check);
```

**⚠️ CRÍTICO:**
Health checks DEVEM responder em < 5s.

---

### timeoutErrorHandler()

```typescript
function timeoutErrorHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void
```

Handler que captura timeouts e envia resposta apropriada.

**Comportamento:**
1. Verifica se `req.timedout === true`
2. Se não, passa para próximo middleware (`next()`)
3. Se sim, envia erro 503 Service Unavailable
4. Loga o timeout com detalhes

**Resposta:**
```json
{
  "success": false,
  "error": "Request Timeout",
  "message": "A requisição demorou muito para ser processada...",
  "details": {
    "timeout": "30s",
    "suggestion": "Tente novamente em alguns instantes..."
  }
}
```

**Exemplo:**
```typescript
app.use(requestTimeout);
// ... rotas ...
app.use(timeoutErrorHandler);
```

**⚠️ ORDEM:**
- Deve vir DEPOIS do middleware de timeout
- Deve vir ANTES dos handlers 404/500

---

### haltOnTimedout()

```typescript
function haltOnTimedout(
  req: Request,
  res: Response,
  next: NextFunction
): void
```

Middleware que previne execução após timeout.

**Comportamento:**
- Se `req.timedout === false` → chama `next()` (continua)
- Se `req.timedout === true` → NÃO chama `next()` (para)

**Exemplo:**
```typescript
router.post('/process',
  heavyOperationTimeout,
  haltOnTimedout, // Para execução se timeout
  async (req, res) => {
    // Se timeout, este código NÃO executa
    const result = await heavyProcessing(req.body);
    res.json(result);
  }
);
```

**⚠️ USO:**
Use em rotas com operações custosas para evitar desperdício de recursos.

---

### timeoutConfig

```typescript
export const timeoutConfig: {
  default: string;
  heavy: string;
  healthCheck: string;
}
```

Configuração de timeout para exportação.

**Valores:**
```typescript
{
  default: '30s',
  heavy: '60s',
  healthCheck: '5s'
}
```

**Exemplo:**
```typescript
import { timeoutConfig } from './timeout.middleware';

console.log(`Timeout padrão: ${timeoutConfig.default}`);
// Output: "Timeout padrão: 30s"
```

---

## Exemplos de Uso

### Setup Global

```typescript
// app.ts
import express from 'express';
import { requestTimeout, timeoutErrorHandler } from '@shared/middlewares/timeout.middleware';

const app = express();

// Body parsing (ANTES do timeout)
app.use(express.json());

// Timeout global (30s)
app.use(requestTimeout);

// Rotas
app.use('/api', routes);

// Handler de timeout (ANTES de 404/500)
app.use(timeoutErrorHandler);

// Handlers de erro
app.use(notFoundHandler);
app.use(errorHandler);
```

---

### Operações Pesadas

```typescript
// routes/report.routes.ts
import { Router } from 'express';
import { heavyOperationTimeout, haltOnTimedout } from '@shared/middlewares/timeout.middleware';
import { ReportController } from '../controllers/ReportController';

const router = Router();

// Relatório completo (60s)
router.get('/full',
  heavyOperationTimeout,
  haltOnTimedout,
  ReportController.generateFullReport
);

// Export de dados (60s)
router.get('/export/items',
  heavyOperationTimeout,
  haltOnTimedout,
  ReportController.exportItems
);

// Relatório com filtros complexos (60s)
router.post('/sales',
  heavyOperationTimeout,
  haltOnTimedout,
  ReportController.generateSalesReport
);

export default router;
```

---

### Health Checks

```typescript
// routes/health.routes.ts
import { Router } from 'express';
import { healthCheckTimeout } from '@shared/middlewares/timeout.middleware';
import { HealthController } from '../controllers/HealthController';

const router = Router();

// Health check básico (5s)
router.get('/', healthCheckTimeout, HealthController.check);

// Liveness probe (5s)
router.get('/live', healthCheckTimeout, HealthController.liveness);

// Readiness probe (5s)
router.get('/ready', healthCheckTimeout, HealthController.readiness);

export default router;
```

---

### Timeout por Rota

```typescript
// routes/item.routes.ts
import { Router } from 'express';
import { requestTimeout, heavyOperationTimeout, haltOnTimedout } from '@shared/middlewares/timeout.middleware';
import { ItemController } from '../controllers/ItemController';

const router = Router();

// Rotas normais usam timeout global (30s)
router.get('/:itemCodigo', ItemController.getItem);
router.post('/', ItemController.createItem);

// Rota pesada usa timeout estendido (60s)
router.get('/export/all',
  heavyOperationTimeout,
  haltOnTimedout,
  ItemController.exportAll
);

export default router;
```

---

### Controller com Timeout Check

```typescript
// ItemController.ts
import { Request, Response } from 'express';
import { log } from '@shared/utils/logger';

export class ItemController {
  static async exportAll(req: Request, res: Response) {
    try {
      log.info('Iniciando export de items');

      // Processar em chunks
      const items = await ItemService.getAllInChunks();

      // Verificar timeout antes de operações pesadas
      if (req.timedout) {
        log.warn('Export cancelado por timeout');
        return; // haltOnTimedout já impediu chegada aqui
      }

      // Gerar CSV
      const csv = await CsvService.generate(items);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=items.csv');
      res.send(csv);

    } catch (error) {
      log.error('Erro no export', { error: error.message });
      throw error;
    }
  }
}
```

---

## Comportamento

### Como Funciona

1. **Middleware registrado:**
   ```typescript
   app.use(requestTimeout); // 30s
   ```

2. **Requisição chega:**
   - Timer de 30s inicia
   - Requisição segue normalmente

3. **Se responder em < 30s:**
   - Tudo OK
   - `req.timedout = false`
   - Resposta enviada normalmente

4. **Se demorar > 30s:**
   - Timer expira
   - `req.timedout = true`
   - `timeoutErrorHandler` captura
   - Envia status 503

### req.timedout

Propriedade booleana adicionada ao Request pelo `connect-timeout`.

```typescript
// Verificar se timeout ocorreu
if (req.timedout) {
  // Parar execução
  return;
}
```

**Valores:**
- `false` - Timeout NÃO ocorreu (dentro do limite)
- `true` - Timeout OCORREU (excedeu limite)

### Interceptação de Resposta

```typescript
// Middleware de timeout NÃO envia resposta
export const requestTimeout = timeout('30s');

// timeoutErrorHandler envia resposta
export const timeoutErrorHandler = (req, res, next) => {
  if (req.timedout) {
    res.status(503).json({ error: 'Timeout' });
  } else {
    next();
  }
};
```

---

## Status Codes

### Por que 503 e não 408?

#### ❌ 408 Request Timeout

**Uso correto:**
- Cliente demorou muito para **enviar** a requisição
- Timeout no **upload** de dados
- Timeout de **idle connection**

**Problema:**
- Implica que o **cliente** foi lento
- Nosso timeout é **server-side** (processamento)

---

#### ✅ 503 Service Unavailable

**Uso correto:**
- Servidor não conseguiu processar em tempo hábil
- Timeout no **processamento** server-side
- Indica problema **temporário**

**Vantagens:**
- Status correto para timeout de processamento
- Cliente sabe que pode **tentar novamente**
- Não culpa o cliente

---

### Resposta de Timeout

```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json

{
  "success": false,
  "error": "Request Timeout",
  "message": "A requisição demorou muito para ser processada e foi cancelada pelo servidor.",
  "details": {
    "timeout": "30s",
    "suggestion": "Tente novamente em alguns instantes. Se o problema persistir, contate o suporte."
  }
}
```

---

## Ordem de Middlewares

### Ordem Correta

```typescript
// app.ts
import express from 'express';

const app = express();

// 1. CORS (primeiro)
app.use(cors());

// 2. Body parsing (ANTES de timeout)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Timeout global
app.use(requestTimeout);

// 4. Request Logger
app.use(requestLogger);

// 5. Rate Limiting
app.use(rateLimiter);

// 6. Rotas
app.use('/api', routes);

// 7. Timeout Error Handler (ANTES de 404/500)
app.use(timeoutErrorHandler);

// 8. Not Found (404)
app.use(notFoundHandler);

// 9. Error Handler (500)
app.use(errorHandler);
```

### Por que essa ordem?

1. **Body parsing ANTES de timeout:**
   - Timeout começa após body estar parseado
   - Evita timeout durante upload

2. **Timeout Error Handler ANTES de 404/500:**
   - Captura timeouts antes de outros erros
   - Evita que timeouts sejam tratados como 500

3. **Request Logger DEPOIS de timeout:**
   - Logger registra tempo real da requisição
   - Inclui tempo de parsing do body

---

## Boas Práticas

### ✅ DO

**1. Use timeout global**
```typescript
// ✅ Protege toda a aplicação
app.use(requestTimeout);
```

**2. Use timeout estendido para operações pesadas**
```typescript
// ✅ Timeout apropriado
router.get('/reports/heavy',
  heavyOperationTimeout,
  haltOnTimedout,
  controller.generateReport
);
```

**3. Use haltOnTimedout em operações custosas**
```typescript
// ✅ Para execução se timeout
router.post('/process',
  heavyOperationTimeout,
  haltOnTimedout,
  expensiveController.process
);
```

**4. Sempre use timeoutErrorHandler**
```typescript
// ✅ Captura e responde timeouts
app.use(requestTimeout);
app.use(routes);
app.use(timeoutErrorHandler);
```

**5. Health checks com timeout curto**
```typescript
// ✅ Health check deve ser rápido
router.get('/health', healthCheckTimeout, healthController.check);
```

---

### ❌ DON'T

**1. Não esqueça timeoutErrorHandler**
```typescript
// ❌ Timeout ocorre mas cliente não recebe resposta
app.use(requestTimeout);
app.use(routes);
// Faltou timeoutErrorHandler!

// ✅ Com handler
app.use(requestTimeout);
app.use(routes);
app.use(timeoutErrorHandler);
```

**2. Não coloque timeout ANTES de body parsing**
```typescript
// ❌ Timeout durante upload
app.use(requestTimeout);
app.use(express.json());

// ✅ Body parsing primeiro
app.use(express.json());
app.use(requestTimeout);
```

**3. Não use timeout curto em operações pesadas**
```typescript
// ❌ Timeout muito curto para operação pesada
router.get('/reports/complex', requestTimeout, controller.generate);

// ✅ Timeout estendido
router.get('/reports/complex', heavyOperationTimeout, controller.generate);
```

**4. Não ignore req.timedout**
```typescript
// ❌ Continua processando após timeout
async function handler(req, res) {
  await heavyProcessing(); // Continua mesmo com timeout
  res.json(result);
}

// ✅ Para se timeout
async function handler(req, res) {
  if (req.timedout) return;
  await heavyProcessing();
  res.json(result);
}
```

**5. Não use timeout longo em health checks**
```typescript
// ❌ Health check lento indica problema
router.get('/health', heavyOperationTimeout, healthController.check);

// ✅ Health check rápido
router.get('/health', healthCheckTimeout, healthController.check);
```

---

## Troubleshooting

### Problema: Cliente não recebe resposta de timeout

**Sintoma:**
- Timeout ocorre no servidor
- Cliente fica esperando indefinidamente

**Causa:**
- `timeoutErrorHandler` não registrado

**Solução:**
```typescript
// Registre o handler DEPOIS das rotas
app.use(requestTimeout);
app.use(routes);
app.use(timeoutErrorHandler); // ← Adicionar
```

---

### Problema: Body parsing com timeout

**Sintoma:**
- Upload de arquivo sempre dá timeout
- Requisições grandes sempre falham

**Causa:**
- Timeout registrado ANTES de body parsing
- Timeout conta tempo de upload

**Solução:**
```typescript
// ❌ Errado
app.use(requestTimeout);
app.use(express.json());

// ✅ Correto
app.use(express.json());
app.use(requestTimeout);
```

---

### Problema: Operação continua após timeout

**Sintoma:**
- Timeout acontece
- Servidor continua processando
- Logs mostram conclusão após timeout

**Causa:**
- Não usa `haltOnTimedout`
- Não verifica `req.timedout`

**Solução:**
```typescript
// Adicionar haltOnTimedout
router.post('/heavy',
  heavyOperationTimeout,
  haltOnTimedout, // ← Adicionar
  controller.process
);

// Ou verificar manualmente
async function controller(req, res) {
  if (req.timedout) return; // ← Adicionar
  await processing();
}
```

---

### Problema: Timeout muito curto/longo

**Sintoma:**
- Timeouts frequentes em operações normais
- Ou operações lentas nunca dão timeout

**Causa:**
- Timeout inadequado para o tipo de operação

**Solução:**
```typescript
// Operações rápidas (30s)
router.get('/items', requestTimeout, controller.list);

// Operações pesadas (60s)
router.get('/reports', heavyOperationTimeout, controller.generate);

// Health checks (5s)
router.get('/health', healthCheckTimeout, controller.check);
```

---

### Problema: Headers já enviados

**Sintoma:**
```
Error: Cannot set headers after they are sent
```

**Causa:**
- Resposta enviada
- `timeoutErrorHandler` tenta enviar novamente

**Solução:**
```typescript
// timeoutErrorHandler já verifica isso
export const timeoutErrorHandler = (req, res, next) => {
  if (!req.timedout) {
    next();
    return;
  }

  // Verifica se já enviou
  if (res.headersSent) {
    return; // ← Não tenta enviar novamente
  }

  res.status(503).json({ error: 'Timeout' });
};
```

---

## Referências

### Arquivos Relacionados

- `requestLogger.middleware.ts` - Logging de requisições
- `errorHandler.middleware.ts` - Tratamento de erros
- `rateLimiter.middleware.ts` - Rate limiting
- `app.ts` - Setup da aplicação

### Links Externos

- [connect-timeout](https://github.com/expressjs/timeout) - Documentação oficial
- [HTTP 503](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) - Service Unavailable
- [HTTP 408](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408) - Request Timeout
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html) - Guia oficial

### Conceitos

- **Timeout** - Limite de tempo para operação
- **Service Unavailable** - Status 503 HTTP
- **Halt on Timeout** - Parar execução após timeout
- **Health Check** - Verificação de saúde da aplicação
- **Middleware Chain** - Cadeia de middlewares Express

---

## Resumo

### O que é?

Sistema de middlewares para limitar tempo de execução de requisições, prevenindo que requests lentos bloqueiem o servidor.

### Exports

| Export | Tipo | Timeout | Descrição |
|--------|------|---------|-----------|
| requestTimeout | Middleware | 30s | Global (padrão) |
| heavyOperationTimeout | Middleware | 60s | Operações pesadas |
| healthCheckTimeout | Middleware | 5s | Health checks |
| timeoutErrorHandler | Function | - | Handler de timeouts |
| haltOnTimedout | Function | - | Para execução |
| timeoutConfig | Object | - | Configuração |

### Quando Usar

| Cenário | Timeout | Middleware |
|---------|---------|------------|
| **Requisições normais** | 30s | requestTimeout |
| **Relatórios complexos** | 60s | heavyOperationTimeout |
| **Exports volumosos** | 60s | heavyOperationTimeout |
| **Health checks** | 5s | healthCheckTimeout |

### Status Code

- **503 Service Unavailable** - Timeout no processamento server-side
- ~~408 Request Timeout~~ - NÃO usar (implica cliente lento)

### Ordem de Middlewares

```typescript
1. CORS
2. Body parsing       ← ANTES de timeout
3. Timeout global     ← requestTimeout
4. Request Logger
5. Rotas
6. Timeout Handler    ← timeoutErrorHandler
7. 404 Handler
8. 500 Handler
```

---

**Última atualização:** 2025-10-07