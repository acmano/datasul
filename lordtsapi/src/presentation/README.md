# Presentation - Interface HTTP (Routes e Controllers)

## 📋 Responsabilidade

A camada **Presentation** contém todos os **detalhes de interface HTTP**: rotas, controllers, parsing de requisições, formatação de respostas. É a camada mais externa que interage com o usuário/cliente.

**Princípio chave:** Traduzir HTTP para lógica de aplicação e vice-versa.

## ✅ O que esta camada PODE fazer

- ✅ Definir **rotas HTTP** (GET, POST, PUT, DELETE)
- ✅ Criar **controllers** (lógica de apresentação)
- ✅ Fazer **parsing** de request (body, query, params)
- ✅ Formatar **responses** (JSON, XML, etc)
- ✅ Usar **middlewares** HTTP (autenticação, validação)
- ✅ Chamar **use cases** de @application
- ✅ Converter erros para status HTTP apropriados
- ✅ Documentação OpenAPI/Swagger

## ❌ O que esta camada NÃO PODE fazer

- ❌ Implementar lógica de negócio (vai em @domain)
- ❌ Implementar use cases (vai em @application)
- ❌ Acessar banco de dados diretamente (vai em @infrastructure)
- ❌ Conter regras de validação de negócio (vai em @domain ou @application)

## 📁 Estrutura

```
src/presentation/
├── admin/
│   ├── routes/
│   │   ├── admin.routes.ts      # Rotas administrativas
│   │   └── docs/
│   │       └── admin.routes.md
│   └── index.ts
├── metrics/
│   ├── routes.ts                 # Rotas de métricas
│   ├── docs/
│   │   └── routes.md
│   └── index.ts
├── test/
│   ├── test-timeout.routes.ts   # Rotas de teste
│   └── index.ts
└── README.md
```

## 💡 Exemplos

### ✅ BOM - Route com Controller

```typescript
// src/presentation/admin/routes/admin.routes.ts

import { Router, Request, Response } from 'express';
import { ApiKeyService } from '@shared/services/apiKey.service';
import { UserTier } from '@shared/types/apiKey.types';
import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { AuthorizationError, ValidationError } from '@shared/errors/errors';

const router = Router();

/**
 * @openapi
 * /admin/api-keys:
 *   get:
 *     summary: Listar todas as API Keys
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Lista de API Keys
 */
router.get('/api-keys', apiKeyAuth, async (req: Request, res: Response) => {
  // 1. Autorização (lógica de apresentação)
  if (req.user?.tier !== UserTier.ADMIN) {
    throw new AuthorizationError('Apenas administradores podem listar todas as API Keys');
  }

  // 2. Chamar serviço/use case
  const stats = ApiKeyService.getStats();

  // 3. Formatar response
  res.json({
    success: true,
    data: stats,
    correlationId: req.id
  });
});

export default router;
```

### ✅ BOM - Controller com Validação de Request

```typescript
// Exemplo de controller com validação

router.post('/api-keys/generate', apiKeyAuth, async (req: Request, res: Response) => {
  // 1. Autorização
  if (req.user?.tier !== UserTier.ADMIN) {
    throw new AuthorizationError('Apenas administradores podem gerar API Keys');
  }

  // 2. Parsing e validação de request
  const { userId, userName, tier, expiresInDays } = req.body;

  if (!userId || !userName || !tier) {
    const missingFields: Record<string, string> = {};
    if (!userId) missingFields.userId = 'Obrigatório';
    if (!userName) missingFields.userName = 'Obrigatório';
    if (!tier) missingFields.tier = 'Obrigatório';

    throw new ValidationError('userId, userName e tier são obrigatórios', missingFields);
  }

  // 3. Chamar serviço/use case
  const apiKey = await ApiKeyService.generateKey(userId, userName, tier, expiresInDays);

  // 4. Formatar response com status code apropriado
  res.status(201).json({
    success: true,
    data: { apiKey, userId, userName, tier, expiresInDays },
    correlationId: req.id
  });
});
```

### ✅ BOM - Route com Use Case

```typescript
// Exemplo ideal: Controller chama Use Case

import { GetItemUseCase } from '@application/use-cases/item/GetItemUseCase';
import { ItemMapper } from '@application/mappers/ItemMapper';

router.get('/item/:codigo', async (req: Request, res: Response) => {
  // 1. Parsing de parâmetros
  const { codigo } = req.params;

  // 2. Chamar use case
  const useCase = new GetItemUseCase();
  const itemDTO = await useCase.execute(codigo);

  // 3. Formatar response
  res.json({
    success: true,
    data: itemDTO,
    correlationId: req.id
  });
});
```

### ❌ RUIM - Controller com Lógica de Negócio

```typescript
// ❌ NÃO FAÇA ISSO EM PRESENTATION

router.post('/item', async (req: Request, res: Response) => {
  const { codigo, descricao, unidade } = req.body;

  // ❌ Lógica de negócio no controller (deveria estar em @domain)
  if (codigo.length > 16) {
    return res.status(400).json({ error: 'Código muito longo' });
  }

  // ❌ Acessando banco diretamente (deveria usar use case)
  await DatabaseManager.queryEmp(
    `INSERT INTO item VALUES ('${codigo}', '${descricao}', '${unidade}')`
  );

  // ❌ Regra de negócio no controller
  const ativo = descricao.includes('ATIVO');

  res.json({ codigo, descricao, unidade, ativo });
});
```

### ✅ BOM - Error Handling

```typescript
// src/presentation/middlewares/errorHandler.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, NotFoundError } from '@shared/errors/errors';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Mapear erro para status HTTP apropriado
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: 'ValidationError',
      message: error.message,
      details: error.details,
      correlationId: req.id
    });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: 'NotFoundError',
      message: error.message,
      correlationId: req.id
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
      correlationId: req.id
    });
  }

  // Erro não tratado
  console.error('Erro não tratado:', error);
  return res.status(500).json({
    error: 'InternalServerError',
    message: 'Erro interno do servidor',
    correlationId: req.id
  });
}
```

### ✅ BOM - Middleware de Validação

```typescript
// src/presentation/middlewares/validation.middleware.ts

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * Middleware de validação HTTP
 * Valida request antes de chegar no controller
 */
export function validateRequest(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.reduce((acc, detail) => {
        acc[detail.path.join('.')] = detail.message;
        return acc;
      }, {} as Record<string, string>);

      return res.status(400).json({
        error: 'ValidationError',
        message: 'Dados inválidos',
        details,
        correlationId: req.id
      });
    }

    // Substituir body pelo valor validado
    req.body = value;
    next();
  };
}

// Uso:
const createItemSchema = Joi.object({
  codigo: Joi.string().max(16).required(),
  descricao: Joi.string().max(120).required(),
  unidade: Joi.string().max(2).required(),
});

router.post('/item', validateRequest(createItemSchema), async (req, res) => {
  // req.body já está validado aqui
  const useCase = new CreateItemUseCase();
  const result = await useCase.execute(req.body);
  res.json(result);
});
```

## 🔗 Dependências

### Dependências Permitidas

- ✅ **@application** - Usar use cases e DTOs
- ✅ **@shared** - Usar middlewares, errors, types
- ✅ **Express** - Framework HTTP
- ✅ **Joi** - Validação de schema HTTP

### Camadas que podem importar Presentation

- ❌ **Nenhuma!** Presentation é a camada mais externa

### Camadas que Presentation NÃO pode importar

- ❌ presentation → domain (use @application)
- ❌ presentation → infrastructure (use @application)

## 📊 Diagrama de Dependências

```
┌─────────────────────────────────────┐
│         presentation                │◄─── Cliente HTTP
│    (routes, controllers)            │
└────────────┬────────────────────────┘
             │
             │ chama use cases
             │
┌────────────▼────────────────────────┐
│         application                 │
│    (use cases retornam DTOs)        │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│           domain                    │
└─────────────────────────────────────┘
```

## 🎯 Boas Práticas

### ✅ DO - Routes

1. **RESTful** - Usar verbos HTTP apropriados (GET, POST, PUT, DELETE)
2. **Naming consistente** - `/item/:codigo`, `/item/search`
3. **Middleware chain** - auth → validation → controller
4. **Async/await** - Usar async nos handlers
5. **Error handling** - Deixar middleware de erro capturar
6. **Status codes** - Usar códigos HTTP corretos (200, 201, 400, 404, 500)

### ✅ DO - Controllers

1. **Thin controllers** - Delegar para use cases
2. **Parsing** - Extrair e validar dados do request
3. **Formatting** - Estrutura consistente de response
4. **Correlation ID** - Incluir em todas as responses
5. **Documentation** - OpenAPI/Swagger annotations

### ✅ DO - Responses

```typescript
// ✅ Formato consistente de sucesso
{
  "success": true,
  "data": { ... },
  "correlationId": "uuid"
}

// ✅ Formato consistente de erro
{
  "error": "ValidationError",
  "message": "Dados inválidos",
  "details": { "codigo": "Campo obrigatório" },
  "correlationId": "uuid"
}
```

### ❌ DON'T

1. ❌ Implementar lógica de negócio em controllers
2. ❌ Acessar banco de dados diretamente
3. ❌ Fazer cálculos complexos (delegar para @domain ou @application)
4. ❌ Retornar entidades diretamente (usar DTOs)
5. ❌ Controllers gordos (fat controllers)
6. ❌ Misturar validação de negócio com validação HTTP

## 🧪 Testabilidade

Presentation usa testes E2E com supertest:

```typescript
// __tests__/admin.routes.e2e.test.ts

import request from 'supertest';
import { app } from '../../../app';

describe('GET /admin/api-keys', () => {
  it('retorna 200 com API key de admin', async () => {
    const response = await request(app)
      .get('/admin/api-keys')
      .set('X-API-Key', 'admin-key-superuser')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('total');
    expect(response.body).toHaveProperty('correlationId');
  });

  it('retorna 403 sem API key de admin', async () => {
    const response = await request(app)
      .get('/admin/api-keys')
      .set('X-API-Key', 'free-demo-key-123456')
      .expect(403);

    expect(response.body.error).toBe('AuthorizationError');
  });

  it('retorna 401 sem API key', async () => {
    await request(app)
      .get('/admin/api-keys')
      .expect(401);
  });
});

// ✅ Testa HTTP end-to-end
// ✅ Valida status codes
// ✅ Valida estrutura de responses
```

## 📄 Documentação OpenAPI

```typescript
/**
 * @openapi
 * /admin/api-keys/generate:
 *   post:
 *     summary: Gerar nova API Key
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userName
 *               - tier
 *             properties:
 *               userId:
 *                 type: string
 *               userName:
 *                 type: string
 *               tier:
 *                 type: string
 *                 enum: [free, premium, enterprise, admin]
 *     responses:
 *       201:
 *         description: API Key gerada com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Não autorizado
 */
```

## 📚 Referências

### Conceitos

- **Presentation Layer** - Camada de interface com usuário
- **Controller** - Lógica de apresentação (parsing, formatting)
- **Route** - Mapeamento de URL para handler
- **Middleware** - Processamento intermediário de requests
- **RESTful API** - Arquitetura de APIs HTTP

### Leitura Recomendada

- [REST API Design](https://restfulapi.net/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [OpenAPI Specification](https://swagger.io/specification/)

### Arquivos Relacionados

- `src/application/` - Use cases chamados pelos controllers
- `src/shared/middlewares/` - Middlewares HTTP
- `src/app.ts` - Configuração do Express
- `tsconfig.json` - Path alias @presentation/*

---

**Última atualização:** 2025-10-20
**Camada:** Presentation (HTTP Interface)
**Princípio:** Traduzir HTTP para lógica de aplicação
