# Validate Middleware

> Middleware de validação de dados de requisição usando Joi

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Fontes de Validação](#fontes-de-validação)
- [API Reference](#api-reference)
- [Schemas Joi](#schemas-joi)
- [Exemplos de Uso](#exemplos-de-uso)
- [Comportamento](#comportamento)
- [Erros e Respostas](#erros-e-respostas)
- [Integração](#integração)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

---

## Visão Geral

### O que é?

Middleware de validação de dados de requisição (body, params, query) usando schemas Joi. Valida, sanitiza e lança erros estruturados para dados inválidos.

### Características

- ✅ **3 fontes** - body, params, query
- ✅ **Validação Joi** - Schemas declarativos
- ✅ **Sanitização** - Remove campos desconhecidos
- ✅ **Todos os erros** - Coleta múltiplos erros
- ✅ **Substituição** - Dados sanitizados substituem originais
- ✅ **Erros estruturados** - ValidationError com detalhes

### Tecnologias

- **Joi** - Validação de schemas
- **Express** - Framework web
- **TypeScript** - Tipagem forte

---

## Fontes de Validação

### 1. body

Valida corpo da requisição (POST, PUT, PATCH).

```typescript
// POST /items
{
  "codigo": "7530110",
  "descricao": "Produto X"
}
```

**Uso:**
```typescript
validate(itemSchema, 'body')
```

---

### 2. params

Valida parâmetros de URL.

```typescript
// GET /items/:itemCodigo
// URL: /items/7530110
req.params = { itemCodigo: '7530110' }
```

**Uso:**
```typescript
validate(paramsSchema, 'params')
```

---

### 3. query

Valida query string.

```typescript
// GET /items?page=1&limit=10
req.query = { page: '1', limit: '10' }
```

**Uso:**
```typescript
validate(querySchema, 'query')
```

---

## API Reference

### validate()

```typescript
function validate(
  schema: ObjectSchema,
  source?: ValidationSource
): RequestHandler
```

Cria middleware de validação para dados de requisição.

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| schema | ObjectSchema | ✅ | - | Schema Joi de validação |
| source | ValidationSource | ❌ | 'body' | Fonte dos dados |

**ValidationSource:**
```typescript
type ValidationSource = 'body' | 'params' | 'query'
```

**Retorno:**
- `RequestHandler` - Middleware Express configurado

**Comportamento:**
1. Extrai dados de `req[source]`
2. Valida com schema Joi
3. Se válido: substitui `req[source]` com dados sanitizados
4. Se inválido: lança `ValidationError`

**Exemplo:**
```typescript
import { validate } from '@shared/middlewares/validate.middleware';
import Joi from 'joi';

const itemSchema = Joi.object({
  codigo: Joi.string().required(),
  descricao: Joi.string().required()
});

router.post('/items',
  validate(itemSchema),  // valida body
  controller.create
);
```

---

### ValidationSource

```typescript
type ValidationSource = 'body' | 'params' | 'query'
```

Tipo das fontes de dados validáveis.

| Valor | Fonte | Quando Usar |
|-------|-------|-------------|
| `'body'` | req.body | POST, PUT, PATCH |
| `'params'` | req.params | Parâmetros de URL |
| `'query'` | req.query | Query string |

---

## Schemas Joi

### Schema Básico

```typescript
import Joi from 'joi';

const itemSchema = Joi.object({
  codigo: Joi.string().required(),
  descricao: Joi.string().required(),
  preco: Joi.number().positive().required()
});
```

### Schema com Validações Customizadas

```typescript
const itemSchema = Joi.object({
  // String obrigatória, 8 caracteres
  codigo: Joi.string()
    .length(8)
    .required()
    .messages({
      'string.length': 'Código deve ter 8 caracteres',
      'any.required': 'Código é obrigatório'
    }),

  // String opcional, min 3 caracteres
  descricao: Joi.string()
    .min(3)
    .max(100)
    .optional(),

  // Número positivo
  preco: Joi.number()
    .positive()
    .precision(2)
    .required(),

  // Array de strings
  tags: Joi.array()
    .items(Joi.string())
    .min(1)
    .required(),

  // Enum
  status: Joi.string()
    .valid('ativo', 'inativo')
    .default('ativo'),

  // Data futura
  dataValidade: Joi.date()
    .greater('now')
    .required()
});
```

### Schema para Params

```typescript
const paramsSchema = Joi.object({
  itemCodigo: Joi.string()
    .length(8)
    .required()
});

router.get('/items/:itemCodigo',
  validate(paramsSchema, 'params'),
  controller.getItem
);
```

### Schema para Query

```typescript
const querySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),

  sort: Joi.string()
    .valid('asc', 'desc')
    .default('asc'),

  search: Joi.string()
    .min(3)
    .optional()
});

router.get('/items',
  validate(querySchema, 'query'),
  controller.listItems
);
```

---

## Exemplos de Uso

### Exemplo 1: Validar Body (POST)

```typescript
// routes/item.routes.ts
import { Router } from 'express';
import { validate } from '@shared/middlewares/validate.middleware';
import Joi from 'joi';
import { ItemController } from '../controllers/ItemController';

const router = Router();

const createItemSchema = Joi.object({
  codigo: Joi.string().length(8).required(),
  descricao: Joi.string().min(3).max(100).required(),
  preco: Joi.number().positive().required(),
  status: Joi.string().valid('ativo', 'inativo').default('ativo')
});

router.post('/items',
  validate(createItemSchema),  // body
  ItemController.create
);

export default router;
```

**Request:**
```bash
curl -X POST http://api/items \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "7530110",
    "descricao": "Produto X",
    "preco": 99.90
  }'
```

**Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "codigo": "7530110",
    "descricao": "Produto X",
    "preco": 99.90,
    "status": "ativo"
  }
}
```

**Erro (400):**
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Código deve ter 8 caracteres",
  "details": {
    "codigo": "Código deve ter 8 caracteres",
    "preco": "Preço deve ser positivo"
  }
}
```

---

### Exemplo 2: Validar Params (GET)

```typescript
const paramsSchema = Joi.object({
  itemCodigo: Joi.string().length(8).required()
});

router.get('/items/:itemCodigo',
  validate(paramsSchema, 'params'),
  ItemController.getItem
);
```

**Request:**
```bash
curl http://api/items/7530110
```

**Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "codigo": "7530110",
    "descricao": "Produto X"
  }
}
```

**Erro (400):**
```bash
# URL: /items/123
```
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Código deve ter 8 caracteres",
  "details": {
    "itemCodigo": "Código deve ter 8 caracteres"
  }
}
```

---

### Exemplo 3: Validar Query (GET)

```typescript
const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('asc', 'desc').default('asc'),
  search: Joi.string().min(3).optional()
});

router.get('/items',
  validate(listQuerySchema, 'query'),
  ItemController.listItems
);
```

**Request:**
```bash
curl "http://api/items?page=2&limit=20&sort=desc&search=produto"
```

**Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 100
    }
  }
}
```

**Erro (400):**
```bash
# URL: /items?page=0&limit=500
```
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Page deve ser no mínimo 1",
  "details": {
    "page": "Page deve ser no mínimo 1",
    "limit": "Limit não pode ser maior que 100"
  }
}
```

---

### Exemplo 4: Validar Body (PUT)

```typescript
const updateItemSchema = Joi.object({
  descricao: Joi.string().min(3).max(100).optional(),
  preco: Joi.number().positive().optional(),
  status: Joi.string().valid('ativo', 'inativo').optional()
}).min(1); // Pelo menos 1 campo obrigatório

router.put('/items/:itemCodigo',
  validate(paramsSchema, 'params'),
  validate(updateItemSchema, 'body'),
  ItemController.update
);
```

**Request:**
```bash
curl -X PUT http://api/items/7530110 \
  -H "Content-Type: application/json" \
  -d '{
    "preco": 109.90,
    "status": "inativo"
  }'
```

---

### Exemplo 5: Múltiplas Validações

```typescript
// Validar params E body
router.put('/items/:itemCodigo',
  validate(paramsSchema, 'params'),
  validate(updateItemSchema, 'body'),
  ItemController.update
);

// Validar params E query
router.get('/items/:familiaId/list',
  validate(familiaParamsSchema, 'params'),
  validate(listQuerySchema, 'query'),
  ItemController.listByFamilia
);
```

---

## Comportamento

### Opção: abortEarly

```typescript
schema.validate(data, {
  abortEarly: false  // Coleta TODOS os erros
});
```

**abortEarly: true** (padrão Joi):
- Para na primeira validação que falhar
- Retorna apenas 1 erro

**abortEarly: false** (usado no middleware):
- Continua validando todos os campos
- Retorna TODOS os erros encontrados

**Benefício:**
- Cliente recebe lista completa de erros
- Pode corrigir todos de uma vez
- Melhor UX

**Exemplo:**
```json
{
  "details": {
    "codigo": "Código é obrigatório",
    "descricao": "Descrição muito curta",
    "preco": "Preço deve ser positivo"
  }
}
```

---

### Opção: stripUnknown

```typescript
schema.validate(data, {
  stripUnknown: true  // Remove campos desconhecidos
});
```

**stripUnknown: false** (padrão Joi):
- Campos extras causam erro de validação
- Requisição é rejeitada

**stripUnknown: true** (usado no middleware):
- Campos extras são **silenciosamente removidos**
- Apenas campos do schema são mantidos
- Requisição continua

**Benefício:**
- Mais flexível
- Cliente pode enviar dados extras (ignorados)
- Segurança: apenas campos esperados chegam ao controller

**Exemplo:**

**Request:**
```json
{
  "codigo": "7530110",
  "descricao": "Produto X",
  "preco": 99.90,
  "campoExtra": "ignorado",
  "outro": "também ignorado"
}
```

**Após validação (req.body):**
```json
{
  "codigo": "7530110",
  "descricao": "Produto X",
  "preco": 99.90
}
```

---

### Substituição de Dados

```typescript
// Substitui dados originais pelos sanitizados
req[source] = value;
```

**Por que substituir?**

1. **Dados sanitizados:**
   - Campos extras removidos
   - Tipos convertidos (string → number)
   - Defaults aplicados

2. **Segurança:**
   - Controller recebe apenas dados validados
   - Não há campos inesperados

3. **Tipos corretos:**
   - Query string sempre vem como string
   - Joi converte para tipos corretos

**Exemplo:**

**Request:**
```bash
# Query: page=2&limit=20
req.query = { page: '2', limit: '20' }  // strings
```

**Após validação:**
```typescript
req.query = { page: 2, limit: 20 }  // numbers
```

---

## Erros e Respostas

### ValidationError

```typescript
throw new ValidationError(message, details);
```

Erro customizado lançado quando validação falha.

**Estrutura:**
```typescript
{
  name: 'ValidationError',
  message: string,           // Primeira mensagem de erro
  statusCode: 400,
  details: Record<string, string>  // Todos os erros
}
```

---

### Resposta de Erro

**Status:** 400 Bad Request

**Body:**
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Código é obrigatório",
  "details": {
    "codigo": "Código é obrigatório",
    "descricao": "Descrição muito curta",
    "preco": "Preço deve ser positivo"
  }
}
```

---

### Estrutura de Details

```typescript
const details = error.details.reduce((acc, detail) => {
  acc[detail.path.join('.')] = detail.message;
  return acc;
}, {} as Record<string, string>);
```

**Formato:**
- **Chave:** Caminho do campo (ex: `"usuario.email"`)
- **Valor:** Mensagem de erro

**Exemplo com campos aninhados:**

**Schema:**
```typescript
const schema = Joi.object({
  usuario: Joi.object({
    email: Joi.string().email().required(),
    senha: Joi.string().min(8).required()
  })
});
```

**Erro:**
```json
{
  "details": {
    "usuario.email": "Email inválido",
    "usuario.senha": "Senha deve ter no mínimo 8 caracteres"
  }
}
```

---

## Integração

### Com Controllers

```typescript
// ItemController.ts
import { Request, Response } from 'express';
import { asyncHandler } from '@shared/middlewares/asyncHandler.middleware';

export class ItemController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    // req.body já está validado e sanitizado
    const { codigo, descricao, preco } = req.body;

    const item = await ItemService.create({
      codigo,
      descricao,
      preco
    });

    res.status(201).json({
      success: true,
      data: item
    });
  });
}
```

**⚠️ IMPORTANTE:**
- Dados em `req.body` já foram validados
- Não precisa validar novamente
- Tipos estão corretos (conversão Joi)

---

### Com Error Handler

```typescript
// errorHandler.middleware.ts
import { ValidationError } from '@shared/errors/CustomErrors';

export function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: err.name,
      message: err.message,
      details: err.details  // Todos os erros
    });
  }

  // Outros erros...
}
```

---

### Ordem de Middlewares

```typescript
router.post('/items',
  correlationId,           // 1º
  apiKeyAuth,              // 2º
  validate(schema),        // 3º - Valida ANTES de processar
  userRateLimit,           // 4º
  controller               // 5º
);
```

**Por que validate cedo?**
- Falha rápido (fail fast)
- Não desperdiça recursos em dados inválidos
- Não conta para rate limit (se antes)

---

## Boas Práticas

### ✅ DO

**1. Schemas em arquivos separados**
```typescript
// validators/item.validators.ts
import Joi from 'joi';

export const createItemSchema = Joi.object({
  codigo: Joi.string().length(8).required(),
  descricao: Joi.string().min(3).required()
});

export const updateItemSchema = Joi.object({
  descricao: Joi.string().min(3).optional()
}).min(1);

// routes/item.routes.ts
import { createItemSchema, updateItemSchema } from '../validators/item.validators';

router.post('/items', validate(createItemSchema), controller.create);
```

**2. Mensagens customizadas**
```typescript
// ✅ Mensagens claras e em português
const schema = Joi.object({
  codigo: Joi.string().required().messages({
    'string.empty': 'Código não pode estar vazio',
    'any.required': 'Código é obrigatório'
  })
});
```

**3. Valide params e body separadamente**
```typescript
// ✅ Validação explícita
router.put('/items/:itemCodigo',
  validate(paramsSchema, 'params'),
  validate(updateSchema, 'body'),
  controller.update
);
```

**4. Use defaults em query params**
```typescript
// ✅ Valores padrão sensatos
const querySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10)
});
```

**5. Valide antes de operações custosas**
```typescript
// ✅ Fail fast
router.post('/heavy',
  validate(schema),        // Primeiro
  heavyOperationTimeout,   // Depois
  controller
);
```

---

### ❌ DON'T

**1. Não valide dentro do controller**
```typescript
// ❌ Validação manual no controller
export class ItemController {
  static create = async (req, res) => {
    if (!req.body.codigo) {
      return res.status(400).json({ error: 'Código obrigatório' });
    }
    // ...
  };
}

// ✅ Use middleware
router.post('/items', validate(schema), controller.create);
```

**2. Não use abortEarly: true**
```typescript
// ❌ Retorna apenas primeiro erro
schema.validate(data, { abortEarly: true });

// ✅ Retorna todos os erros
schema.validate(data, { abortEarly: false });
```

**3. Não permita campos desconhecidos em produção**
```typescript
// ❌ Campos extras causam erro
schema.validate(data, { stripUnknown: false });

// ✅ Remove campos extras
schema.validate(data, { stripUnknown: true });
```

**4. Não ignore erros de validação**
```typescript
// ❌ Try/catch sem re-throw
try {
  validate(schema)(req, res, next);
} catch (error) {
  console.log(error);  // Engole erro
}

// ✅ Middleware já lança erro corretamente
router.post('/items', validate(schema), controller);
```

**5. Não valide depois de processar**
```typescript
// ❌ Validação muito tarde
router.post('/items',
  heavyProcessing,
  validate(schema),    // Tarde demais
  controller
);

// ✅ Validação primeiro
router.post('/items',
  validate(schema),    // Primeiro
  heavyProcessing,
  controller
);
```

---

## Troubleshooting

### Problema: Erro "schema is not defined"

**Sintoma:**
```
TypeError: schema is not defined
```

**Causa:**
- Schema não foi importado
- Typo no nome do schema

**Solução:**
```typescript
// ✅ Import correto
import { createItemSchema } from '../validators/item.validators';

router.post('/items',
  validate(createItemSchema),
  controller.create
);
```

---

### Problema: Validação passa mas dados estão errados

**Sintoma:**
- Validação não rejeita dados inválidos
- Campos obrigatórios faltando

**Causa:**
- Schema não corresponde aos dados
- Campos marcados como `.optional()`

**Solução:**
```typescript
// ❌ Tudo opcional
const schema = Joi.object({
  codigo: Joi.string().optional(),
  descricao: Joi.string().optional()
});

// ✅ Campos obrigatórios
const schema = Joi.object({
  codigo: Joi.string().required(),
  descricao: Joi.string().required()
});
```

---

### Problema: Query params sempre strings

**Sintoma:**
```typescript
// req.query = { page: '1', limit: '10' }
// Esperado: numbers
```

**Causa:**
- Query string sempre vem como string
- Schema não converte tipos

**Solução:**
```typescript
// ✅ Joi converte automaticamente
const querySchema = Joi.object({
  page: Joi.number().integer().default(1),    // Converte string → number
  limit: Joi.number().integer().default(10)
});

// Após validação:
// req.query = { page: 1, limit: 10 }  // numbers
```

---

### Problema: Mensagens de erro em inglês

**Sintoma:**
```json
{
  "message": "\"codigo\" is required"
}
```

**Causa:**
- Mensagens padrão do Joi são em inglês

**Solução:**
```typescript
// ✅ Mensagens customizadas em português
const schema = Joi.object({
  codigo: Joi.string().required().messages({
    'string.empty': 'Código não pode estar vazio',
    'any.required': 'Código é obrigatório'
  })
});
```

---

### Problema: Campos extras são rejeitados

**Sintoma:**
- Cliente envia campo extra
- Validação falha

**Causa:**
- `stripUnknown: false` (padrão Joi)

**Solução:**
```typescript
// Middleware já usa stripUnknown: true
// Campos extras são removidos silenciosamente
```

---

## Referências

### Arquivos Relacionados

- `CustomErrors.ts` - ValidationError
- `errorHandler.middleware.ts` - Tratamento de erros
- `asyncHandler.middleware.ts` - Wrap async
- `item.validators.ts` - Schemas de exemplo

### Links Externos

- [Joi Documentation](https://joi.dev/api/) - Documentação oficial
- [Joi Validation Examples](https://joi.dev/api/?v=17.6.0#example) - Exemplos

### Conceitos

- **Schema Validation** - Validação baseada em schema
- **Data Sanitization** - Limpeza de dados
- **Fail Fast** - Falhar cedo
- **Type Coercion** - Conversão de tipos
- **Strip Unknown** - Remover campos desconhecidos

---

## Resumo

### O que é?

Middleware de validação de dados de requisição (body, params, query) usando schemas Joi declarativos.

### Função

```typescript
validate(schema: ObjectSchema, source?: ValidationSource)
```

**Parâmetros:**
- `schema` - Schema Joi
- `source` - 'body' | 'params' | 'query' (padrão: 'body')

### Comportamento

1. Extrai dados de `req[source]`
2. Valida com Joi
3. Remove campos desconhecidos (`stripUnknown: true`)
4. Coleta todos os erros (`abortEarly: false`)
5. Substitui dados com versão sanitizada
6. Lança `ValidationError` se inválido

### Fontes

| Fonte | Quando Usar | Exemplo |
|-------|-------------|---------|
| body | POST, PUT, PATCH | Dados do corpo |
| params | GET, PUT, DELETE | Parâmetros de URL |
| query | GET | Query string |

### Opções Joi

| Opção | Valor | Propósito |
|-------|-------|-----------|
| abortEarly | false | Coletar todos os erros |
| stripUnknown | true | Remover campos extras |

---

**Última atualização:** 2025-10-07