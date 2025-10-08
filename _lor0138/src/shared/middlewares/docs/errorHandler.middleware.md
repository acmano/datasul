# Middleware de Tratamento de Erros

**Arquivo:** `src/shared/middlewares/errorHandler.middleware.ts`
**Tipo:** Middleware Express
**Propósito:** Tratamento centralizado de erros

---

## Visão Geral

Sistema de tratamento centralizado de erros para Express com suporte completo a erros customizados, sanitização de mensagens sensíveis, logging diferenciado e respostas padronizadas.

### Responsabilidades

- ✅ Capturar todos os erros não tratados
- ✅ Identificar tipo de erro (operacional vs sistema)
- ✅ Sanitizar informações sensíveis
- ✅ Registrar logs apropriados
- ✅ Retornar resposta HTTP padronizada
- ✅ Prevenir leak de informações em produção

### Padrões de Projeto

- **Error Handler Pattern** - Tratamento centralizado
- **Fail Safe Pattern** - Não propaga erros do handler
- **Sanitization Pattern** - Remove dados sensíveis

---

## Componentes

### 1. sanitizeErrorMessage()

Remove informações sensíveis das mensagens de erro.

**O que sanitiza:**
- Caminhos de arquivos do servidor
- Queries SQL completas
- Endereços IP de servidores
- Credenciais de banco de dados
- Senhas e tokens

**Propósito:**
- 🔒 **Segurança**: Previne vazamento de informações
- ⚖️ **Compliance**: LGPD/GDPR
- 👤 **UX**: Mensagens amigáveis ao usuário
- 🔍 **Debug**: Detalhes técnicos apenas nos logs

---

### 2. errorHandler()

Middleware global de tratamento de erros (4 parâmetros).

**Características:**
- Última defesa contra erros
- 4 parâmetros obrigatórios (assinatura Express)
- Logging diferenciado por tipo
- Respostas diferentes por ambiente

---

### 3. notFoundHandler()

Middleware para capturar rotas 404.

**Quando usa:**
- Requisição não bate em nenhuma rota
- Antes do errorHandler
- Qualquer método HTTP

---

### 4. asyncHandler()

Wrapper para funções assíncronas que elimina try/catch.

**Benefícios:**
- Código mais limpo
- Previne "unhandled promise rejection"
- Captura automática de erros

---

## Setup

### Registro no App

```typescript
// src/app.ts
import express from 'express';
import {
  errorHandler,
  notFoundHandler
} from '@shared/middlewares/errorHandler.middleware';

const app = express();

// Middlewares e rotas...
app.use('/api', routes);

// ⚠️ ORDEM IMPORTANTE:
app.use(notFoundHandler);    // 1. Captura 404
app.use(errorHandler);       // 2. Trata todos os erros (ÚLTIMO)

export default app;
```

**Ordem crítica:**
1. ✅ Todas as rotas primeiro
2. ✅ notFoundHandler depois
3. ✅ errorHandler por último

---

## Sanitização de Mensagens

### sanitizeErrorMessage()

**Padrões removidos:**

| Tipo | Original | Sanitizado |
|------|----------|------------|
| Caminho | `/home/app/src/file.ts` | `[arquivo]` |
| SQL SELECT | `SELECT * FROM item` | `consulta SQL` |
| SQL INSERT | `INSERT INTO item` | `operação de inserção` |
| SQL UPDATE | `UPDATE item SET` | `operação de atualização` |
| IP | `192.168.1.100:1433` | `[servidor]` |
| User | `user=admin` | `user=[oculto]` |
| Password | `password=123` | `password=[oculto]` |

### Exemplos

**Exemplo 1: Query SQL**
```typescript
// Erro original
const error = new Error(
  'Query failed: SELECT * FROM item WHERE user=admin password=123'
);

// Sanitizado
sanitizeErrorMessage(error);
// "Query failed: consulta SQL WHERE user=[oculto] password=[oculto]"
```

**Exemplo 2: Caminho de Arquivo**
```typescript
// Erro original
const error = new Error(
  'Error in /home/app/src/controllers/item.controller.ts'
);

// Sanitizado
sanitizeErrorMessage(error);
// "Error in [arquivo]"
```

**Exemplo 3: IP de Servidor**
```typescript
// Erro original
const error = new Error('Connection failed to 10.105.0.4:1433');

// Sanitizado
sanitizeErrorMessage(error);
// "Connection failed to [servidor]"
```

---

## errorHandler Middleware

### Fluxo de Execução

```
Erro ocorre
    ↓
Verifica res.headersSent
    ├─ true → next(err) (evita double-response)
    └─ false → continua
    ↓
Identifica tipo de erro
    ├─ AppError → extrai statusCode, isOperational, context
    └─ Error → statusCode=500, isOperational=false
    ↓
Logging diferenciado
    ├─ isOperational=true → log.warn (erro esperado)
    └─ isOperational=false → log.error (erro inesperado)
    ↓
Monta resposta por ambiente
    ├─ Development → informações completas + stack
    └─ Production → mensagem sanitizada
    ↓
Envia resposta JSON
```

### Tipos de Erro

**Erro Operacional (Esperado)**
- AppError e subclasses
- ValidationError, ItemNotFoundError, etc
- Log level: `warn`
- Não inclui stack trace

**Erro Não Operacional (Inesperado)**
- Error genérico do JavaScript/Node.js
- TypeError, ReferenceError, etc
- Log level: `error`
- Inclui stack trace completo

---

### Respostas por Ambiente

#### Development

**Características:**
- ✅ Mensagem completa sem sanitização
- ✅ Stack trace (primeiras 5 linhas)
- ✅ Context completo
- ✅ Nome do erro

**Exemplo:**
```json
{
  "error": "ValidationError",
  "message": "Código é obrigatório",
  "timestamp": "2025-10-07T14:30:00.000Z",
  "path": "/api/items",
  "requestId": "abc-123",
  "context": {
    "field": "codigo"
  },
  "stack": [
    "at validateCodigo (/src/validators/item.ts:10:5)",
    "at ItemController.getItem (/src/controllers/item.ts:25:10)",
    "at Layer.handle (/node_modules/express/lib/router/layer.js:95:5)",
    "at next (/node_modules/express/lib/router/route.js:137:13)",
    "at Route.dispatch (/node_modules/express/lib/router/route.js:112:3)"
  ]
}
```

---

#### Production

**Características:**
- ✅ Mensagem sanitizada
- ❌ Sem stack trace
- ❌ Sem detalhes técnicos
- ✅ Mensagem genérica para erros de sistema

**Erro Operacional:**
```json
{
  "error": "ValidationError",
  "message": "Código é obrigatório",
  "timestamp": "2025-10-07T14:30:00.000Z",
  "path": "/api/items",
  "requestId": "abc-123"
}
```

**Erro de Sistema:**
```json
{
  "error": "Error",
  "message": "Erro interno do servidor. Tente novamente mais tarde.",
  "timestamp": "2025-10-07T14:30:00.000Z",
  "path": "/api/items",
  "requestId": "abc-123"
}
```

---

## notFoundHandler Middleware

### Funcionamento

```
Requisição não bate em nenhuma rota
    ↓
notFoundHandler é executado
    ↓
Cria AppError 404 com detalhes
    ↓
Passa erro via next(error)
    ↓
errorHandler processa o erro
    ↓
Resposta 404 enviada
```

### Exemplo

**Request:**
```http
GET /api/rota-inexistente HTTP/1.1
Host: api.example.com
```

**Response:**
```json
{
  "error": "AppError",
  "message": "Rota não encontrada: GET /api/rota-inexistente",
  "timestamp": "2025-10-07T14:30:00.000Z",
  "path": "/api/rota-inexistente",
  "requestId": "abc-123",
  "context": {
    "method": "GET",
    "path": "/api/rota-inexistente"
  }
}
```

---

## asyncHandler Helper

### O Problema

**Sem asyncHandler** (verboso):
```typescript
export const getItem = async (req, res, next) => {
  try {
    const item = await ItemService.getItem(req.params.id);

    if (!item) {
      throw new ItemNotFoundError(req.params.id);
    }

    res.json({ success: true, data: item });
  } catch (error) {
    next(error); // Manual!
  }
};
```

### A Solução

**Com asyncHandler** (limpo):
```typescript
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';

export const getItem = asyncHandler(async (req, res) => {
  const item = await ItemService.getItem(req.params.id);

  if (!item) {
    throw new ItemNotFoundError(req.params.id);
  }

  res.json({ success: true, data: item });
  // Erros capturados automaticamente!
});
```

### Benefícios

| Aspecto | Sem asyncHandler | Com asyncHandler |
|---------|-----------------|------------------|
| **Try/catch** | Manual | Automático |
| **Linhas de código** | +5 | +1 |
| **Legibilidade** | Média | Alta |
| **Manutenção** | Trabalhosa | Fácil |
| **Erros não tratados** | Possível | Impossível |

---

## Exemplos de Uso

### Exemplo 1: Erro de Validação (400)

**Controller:**
```typescript
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { ValidationError } from '@shared/errors';

export const createItem = asyncHandler(async (req, res) => {
  const { codigo, nome } = req.body;

  if (!codigo) {
    throw new ValidationError('Código é obrigatório', { field: 'codigo' });
  }

  const item = await ItemService.create({ codigo, nome });
  res.status(201).json({ success: true, data: item });
});
```

**Response (Production):**
```json
{
  "error": "ValidationError",
  "message": "Código é obrigatório",
  "timestamp": "2025-10-07T14:30:00.000Z",
  "path": "/api/items",
  "requestId": "abc-123"
}
```

---

### Exemplo 2: Item Não Encontrado (404)

**Controller:**
```typescript
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { ItemNotFoundError } from '@shared/errors';

export const getItem = asyncHandler(async (req, res) => {
  const { itemCodigo } = req.params;

  const item = await ItemService.find(itemCodigo);

  if (!item) {
    throw new ItemNotFoundError(itemCodigo);
  }

  res.json({ success: true, data: item });
});
```

**Response:**
```json
{
  "error": "ItemNotFoundError",
  "message": "Item 7530110 não encontrado",
  "timestamp": "2025-10-07T14:30:00.000Z",
  "path": "/api/items/7530110",
  "requestId": "abc-123",
  "context": {
    "itemCodigo": "7530110"
  }
}
```

---

### Exemplo 3: Erro de Banco (500)

**Service:**
```typescript
export class ItemService {
  static async find(codigo: string) {
    try {
      const item = await db.query('SELECT * FROM item WHERE codigo = ?', [codigo]);
      return item[0] || null;
    } catch (error) {
      // Erro de banco é capturado
      throw new DatabaseError('Falha ao buscar item', error);
    }
  }
}
```

**Response (Development):**
```json
{
  "error": "DatabaseError",
  "message": "Erro no banco de dados: Falha ao buscar item",
  "timestamp": "2025-10-07T14:30:00.000Z",
  "path": "/api/items/7530110",
  "requestId": "abc-123",
  "context": {
    "originalMessage": "Connection timeout",
    "query": "SELECT * FROM item WHERE codigo = ?"
  },
  "stack": [
    "at ItemService.find (/src/services/ItemService.ts:15:7)",
    "at ItemController.getItem (/src/controllers/ItemController.ts:25:10)",
    "....."
  ]
}
```

**Response (Production):**
```json
{
  "error": "DatabaseError",
  "message": "Erro no banco de dados: Falha ao buscar item",
  "timestamp": "2025-10-07T14:30:00.000Z",
  "path": "/api/items/7530110",
  "requestId": "abc-123"
}
```

---

### Exemplo 4: Erro Não Tratado (TypeError - 500)

**Controller com bug:**
```typescript
export const getItem = asyncHandler(async (req, res) => {
  const item = await ItemService.find(req.params.id);

  // Bug: tentando acessar propriedade de null
  const nome = item.nome.toUpperCase();

  res.json({ success: true, data: { nome } });
});
```

**Response (Development):**
```json
{
  "error": "TypeError",
  "message": "Cannot read property 'toUpperCase' of undefined",
  "timestamp": "2025-10-07T14:30:00.000Z",
  "path": "/api/items/7530110",
  "requestId": "abc-123",
  "stack": [
    "at ItemController.getItem (/src/controllers/ItemController.ts:28:32)",
    "at Layer.handle (/node_modules/express/lib/router/layer.js:95:5)",
    "..."
  ]
}
```

**Response (Production):**
```json
{
  "error": "Error",
  "message": "Erro interno do servidor. Tente novamente mais tarde.",
  "timestamp": "2025-10-07T14:30:00.000Z",
  "path": "/api/items/7530110",
  "requestId": "abc-123"
}
```

---

## Logging

### Erro Operacional (warn)

```json
{
  "level": "warn",
  "message": "Erro operacional",
  "requestId": "abc-123",
  "method": "GET",
  "url": "/api/items/7530110",
  "statusCode": 404,
  "message": "Item 7530110 não encontrado",
  "context": {
    "itemCodigo": "7530110"
  },
  "timestamp": "2025-10-07T14:30:00.000Z"
}
```

### Erro Não Operacional (error)

```json
{
  "level": "error",
  "message": "Erro não operacional",
  "requestId": "abc-123",
  "method": "GET",
  "url": "/api/items/7530110",
  "error": "Cannot read property 'toUpperCase' of undefined",
  "stack": "TypeError: Cannot read property 'toUpperCase' of undefined\n    at ItemController.getItem...",
  "timestamp": "2025-10-07T14:30:00.000Z"
}
```

---

## Integração com AppError

### Classes de Erro Customizadas

```typescript
// src/shared/errors/CustomErrors.ts
import { AppError } from './AppError';

export class ItemNotFoundError extends AppError {
  constructor(itemCodigo: string) {
    super(
      404,                              // statusCode
      `Item ${itemCodigo} não encontrado`, // message
      true,                             // isOperational
      { itemCodigo }                    // context
    );
    this.name = 'ItemNotFoundError';
  }
}
```

### Uso em Controller

```typescript
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { ItemNotFoundError } from '@shared/errors';

export const getItem = asyncHandler(async (req, res) => {
  const item = await ItemService.find(req.params.id);

  if (!item) {
    // errorHandler captura e processa automaticamente
    throw new ItemNotFoundError(req.params.id);
  }

  res.json({ success: true, data: item });
});
```

---

## Boas Práticas

### ✅ DO

**1. Use asyncHandler em todos os controllers async**
```typescript
// ✅ Sempre use asyncHandler
export const getItem = asyncHandler(async (req, res) => {
  // ... lógica
});
```

**2. Lance erros customizados específicos**
```typescript
// ✅ Erro específico com contexto
throw new ItemNotFoundError(itemCodigo);

// ❌ Erro genérico
throw new Error('Item não encontrado');
```

**3. Registre errorHandler por último**
```typescript
// ✅ Ordem correta
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);
```

**4. Use isOperational apropriadamente**
```typescript
// ✅ Erro operacional (esperado)
new ValidationError('Campo obrigatório');  // isOperational: true

// ✅ Erro de sistema (inesperado)
new Error('TypeError');  // isOperational: false
```

**5. Inclua context nos erros customizados**
```typescript
// ✅ Com contexto
throw new ValidationError('Dados inválidos', {
  field: 'codigo',
  value: req.body.codigo
});
```

---

### ❌ DON'T

**1. Não tente enviar resposta após headers enviados**
```typescript
// ❌ Double-response
res.json({ data: item });
res.status(500).json({ error: 'Erro' });  // Crasharia

// ✅ errorHandler verifica res.headersSent
if (res.headersSent) {
  return next(err);
}
```

**2. Não use try/catch com asyncHandler**
```typescript
// ❌ Redundante
export const getItem = asyncHandler(async (req, res) => {
  try {
    const item = await ItemService.find(req.params.id);
    res.json({ data: item });
  } catch (error) {
    throw error;  // asyncHandler já faz isso
  }
});

// ✅ Deixe asyncHandler capturar
export const getItem = asyncHandler(async (req, res) => {
  const item = await ItemService.find(req.params.id);
  res.json({ data: item });
});
```

**3. Não exponha detalhes técnicos em production**
```typescript
// ❌ Expõe stack trace em production
res.status(500).json({
  error: error.message,
  stack: error.stack  // Perigoso!
});

// ✅ errorHandler sanitiza automaticamente
throw new DatabaseError('Falha na query');
// Resposta: mensagem sanitizada, sem stack
```

**4. Não ignore erros silenciosamente**
```typescript
// ❌ Ignora erro
try {
  await someOperation();
} catch (error) {
  // Sem log, sem throw
}

// ✅ Sempre logue e/ou lance
try {
  await someOperation();
} catch (error) {
  log.error('Erro na operação', { error });
  throw error;
}
```

**5. Não registre errorHandler antes das rotas**
```typescript
// ❌ Ordem errada
app.use(errorHandler);
app.use('/api', routes);

// ✅ Ordem correta
app.use('/api', routes);
app.use(errorHandler);
```

---

## Troubleshooting

### Erro: Cannot set headers after they are sent

**Causa:**
Tentativa de enviar resposta após headers já enviados.

**Solução:**
```typescript
// errorHandler verifica automaticamente
if (res.headersSent) {
  return next(err);
}
```

---

### Erro não está sendo capturado

**Causa 1:** Função não usa asyncHandler
```typescript
// ❌ Erro não capturado
export const getItem = async (req, res) => {
  const item = await ItemService.find(req.params.id);
};

// ✅ Com asyncHandler
export const getItem = asyncHandler(async (req, res) => {
  const item = await ItemService.find(req.params.id);
});
```

**Causa 2:** errorHandler não registrado
```typescript
// ✅ Registrar no app.ts
app.use(errorHandler);
```

---

### Stack trace não aparece em logs

**Causa:**
Erro é operacional (isOperational: true)

**Comportamento esperado:**
- Operacional → `log.warn` sem stack
- Não operacional → `log.error` com stack

---

## Referências

### Arquivos Relacionados

- `AppError.ts` - Classe base de erros
- `CustomErrors.ts` - Erros específicos
- `logger.ts` - Sistema de logs
- `errors.ts` - Exports centralizados

### Padrões

- **Error Handler Pattern** - Tratamento centralizado
- **Fail Safe** - Nunca propaga erro do handler
- **Sanitization** - Remove informações sensíveis

---

## Resumo

### O que é

Middleware de tratamento centralizado de erros com sanitização, logging diferenciado e respostas padronizadas.

### Exports

- **errorHandler** - Middleware global (4 params)
- **notFoundHandler** - Captura 404
- **asyncHandler** - Wrapper para async functions

### Características

- ✅ Sanitização automática de mensagens
- ✅ Logging diferenciado (warn/error)
- ✅ Respostas por ambiente (dev/prod)
- ✅ Integração com AppError
- ✅ Previne leaks de informação

### Setup

1. Registrar após todas as rotas
2. notFoundHandler antes de errorHandler
3. Usar asyncHandler em controllers
4. Lançar erros customizados específicos