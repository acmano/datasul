# Sistema de Tratamento de Erros

## Visão Geral

Sistema de erros customizados com classes específicas para cada tipo de problema, substituindo mensagens genéricas por erros tipados e informativos.

---

## Estrutura

```
src/shared/errors/
├── AppError.ts          # Classe base
└── CustomErrors.ts      # Erros específicos
```

---

## Classe Base: AppError

```typescript
class AppError extends Error {
  statusCode: number;        // HTTP status code
  isOperational: boolean;    // Erro operacional (esperado)?
  context?: Record<string, any>;  // Dados adicionais
}
```

**Propriedades:**
- `statusCode`: Status HTTP apropriado (404, 400, 500, etc)
- `isOperational`: 
  - `true` = esperado (validação, not found, etc)
  - `false` = inesperado (bug, sistema)
- `context`: Dados adicionais para debug

---

## Erros Disponíveis

### Not Found (404)

```typescript
// Item não encontrado
throw new ItemNotFoundError('7530110');
// → 404: "Item 7530110 não encontrado"

// Estabelecimento não encontrado
throw new EstabelecimentoNotFoundError('101');
// → 404: "Estabelecimento 101 não encontrado"
```

### Validação (400)

```typescript
throw new ValidationError('Código do item é obrigatório', {
  itemCodigo: 'Campo vazio'
});
// → 400: "Código do item é obrigatório"
//   context: { fields: { itemCodigo: 'Campo vazio' } }
```

### Banco de Dados (500)

```typescript
throw new DatabaseError('Falha na query', originalError);
// → 500: "Erro no banco de dados: Falha na query"
```

### Timeout (503)

```typescript
throw new ConnectionTimeoutError('SQL Server', 15000);
// → 503: "Timeout ao conectar com SQL Server após 15000ms"
```

### Autenticação/Autorização

```typescript
throw new AuthenticationError();
// → 401: "Não autenticado"

throw new AuthorizationError('Sem permissão para este recurso');
// → 403: "Sem permissão para este recurso"
```

### Rate Limit (429)

```typescript
throw new RateLimitError(60);
// → 429: "Muitas requisições. Tente novamente em alguns segundos."
//   context: { retryAfter: 60 }
```

### Business Rule (422)

```typescript
throw new BusinessRuleError(
  'Item não pode ser vendido com estoque negativo',
  'ESTOQUE_NEGATIVO'
);
// → 422: "Item não pode ser vendido com estoque negativo"
//   context: { rule: 'ESTOQUE_NEGATIVO' }
```

---

## Uso no Controller

### Com asyncHandler (Recomendado)

```typescript
import { asyncHandler } from '@shared/middlewares/errorHandler.middleware';
import { ItemNotFoundError, ValidationError } from '@shared/errors/CustomErrors';

export class ItemController {
  
  static getItem = asyncHandler(async (req, res) => {
    const { itemCodigo } = req.params;

    // Validação
    if (!itemCodigo) {
      throw new ValidationError('Código obrigatório');
    }

    // Buscar
    const item = await ItemService.getItem(itemCodigo);

    // Verificar
    if (!item) {
      throw new ItemNotFoundError(itemCodigo);
    }

    // Resposta
    res.json({ success: true, data: item });
  });
}
```

### Sem asyncHandler (Antiga)

```typescript
export class ItemController {
  
  static async getItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemCodigo } = req.params;

      if (!itemCodigo) {
        throw new ValidationError('Código obrigatório');
      }

      const item = await ItemService.getItem(itemCodigo);

      if (!item) {
        throw new ItemNotFoundError(itemCodigo);
      }

      res.json({ success: true, data: item });
    } catch (error) {
      next(error); // Importante: passar para middleware
    }
  }
}
```

---

## Uso no Service

```typescript
import { ItemNotFoundError, DatabaseError } from '@shared/errors/CustomErrors';

export class ItemService {
  
  static async getItem(codigo: string) {
    try {
      const item = await Repository.findByCodigo(codigo);
      
      if (!item) {
        throw new ItemNotFoundError(codigo);
      }
      
      return item;
      
    } catch (error) {
      // Re-lançar erros customizados
      if (error instanceof ItemNotFoundError) {
        throw error;
      }

      // Converter erros de banco
      throw new DatabaseError(
        'Falha ao buscar item',
        error instanceof Error ? error : undefined
      );
    }
  }
}
```

---

## Registro no App

```typescript
// src/app.ts

import { errorHandler, notFoundHandler } from '@shared/middlewares/errorHandler.middleware';

export class App {
  
  setupMiddlewares() {
    // ... outros middlewares
  }

  setupRoutes() {
    // ... suas rotas
  }

  setupErrorHandlers() {
    // 1. Rotas não encontradas (404)
    this.app.use(notFoundHandler);

    // 2. Handler global de erros (DEVE SER O ÚLTIMO)
    this.app.use(errorHandler);
  }

  initialize() {
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandlers(); // Importante: por último
  }
}
```

---

## Resposta de Erro

### Estrutura JSON

```json
{
  "error": "ItemNotFoundError",
  "message": "Item 7530110 não encontrado",
  "timestamp": "2025-10-04T21:30:00.000Z",
  "path": "/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "context": {
    "itemCodigo": "7530110"
  }
}
```

### Em Desenvolvimento

```json
{
  "error": "DatabaseError",
  "message": "Erro no banco de dados: Connection timeout",
  "timestamp": "2025-10-04T21:30:00.000Z",
  "path": "/api/items",
  "requestId": "...",
  "context": {
    "originalMessage": "ETIMEDOUT"
  },
  "stack": "DatabaseError: ...\n    at ..."
}
```

---

## Logs Automáticos

### Erros Operacionais (warn)

```
[warn] Erro operacional {
  requestId: "...",
  method: "GET",
  url: "/api/item/999",
  statusCode: 404,
  message: "Item 999 não encontrado",
  context: { itemCodigo: "999" }
}
```

### Erros Não Operacionais (error)

```
[error] Erro não operacional {
  requestId: "...",
  method: "GET",
  url: "/api/items",
  error: "Cannot read property 'id' of undefined",
  stack: "TypeError: ...\n    at ..."
}
```

---

## Criar Novos Erros

```typescript
// src/shared/errors/CustomErrors.ts

export class EstoqueInsuficienteError extends AppError {
  constructor(itemCodigo: string, disponivel: number, solicitado: number) {
    super(
      422,
      `Estoque insuficiente para item ${itemCodigo}`,
      true,
      {
        itemCodigo,
        disponivel,
        solicitado,
        faltante: solicitado - disponivel
      }
    );
  }
}
```

**Uso:**

```typescript
if (estoque < quantidade) {
  throw new EstoqueInsuficienteError(itemCodigo, estoque, quantidade);
}
```

---

## Migração Gradual

### Antes (Genérico)

```typescript
if (!item) {
  return res.status(404).json({ 
    error: 'Item não encontrado' 
  });
}
```

### Depois (Específico)

```typescript
if (!item) {
  throw new ItemNotFoundError(itemCodigo);
}
```

**Benefícios:**
- Status code correto automaticamente
- Mensagem padronizada
- Context com dados relevantes
- Logs automáticos
- Stack trace em dev

---

## Checklist de Implementação

- [ ] Criar AppError.ts
- [ ] Criar CustomErrors.ts
- [ ] Criar errorHandler.middleware.ts
- [ ] Registrar middlewares no app.ts
- [ ] Migrar controllers para asyncHandler
- [ ] Substituir erros genéricos por customizados
- [ ] Testar respostas de erro
- [ ] Verificar logs

---

## Troubleshooting

**Erro: Headers already sent**

```typescript
// Problema: resposta enviada antes do throw
res.json({ data });
throw new Error(); // ❌

// Solução: throw ANTES de res
if (error) throw new Error(); // ✅
res.json({ data });
```

**Erro não é capturado**

```typescript
// Problema: não passa para next()
try {
  throw new Error();
} catch (error) {
  console.error(error); // ❌ engoliu o erro
}

// Solução: passar para next()
try {
  throw new Error();
} catch (error) {
  next(error); // ✅
}

// Ou usar asyncHandler
asyncHandler(async (req, res) => {
  throw new Error(); // ✅ automaticamente capturado
});
```

---

Última atualização: 2025-10-04