# Documentação - Controller: Informações Gerais da Família

**Módulo:** `InformacoesGeraisController`
**Categoria:** Controllers
**Subcategoria:** Familia/DadosCadastrais
**Arquivo:** `src/api/lor0138/familia/dadosCadastrais/informacoesGerais/controller/informacoesGerais.controller.ts`

---

## Visão Geral

Responsável por gerenciar requisições HTTP para consulta de informações gerais de famílias no sistema Datasul.

---

## Responsabilidades

O Controller é responsável por:

- ✅ **Extrair** parâmetros da requisição
- ✅ **Delegar** processamento para o Service
- ✅ **Formatar** resposta HTTP
- ✅ **Tratar** erros através do asyncHandler

⚠️ **Validação** agora é feita pelo middleware `validateRequest` antes do controller

---

## Arquitetura

### Posicionamento na Camada

```
┌──────────────────────────────────────────────────────┐
│ HTTP Request                                         │
│ └─ GET /api/.../informacoesGerais/:familiaCodigo    │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ Middlewares                                          │
│ ├─ optionalApiKeyAuth                                │
│ ├─ userRateLimit                                     │
│ ├─ cacheMiddleware                                   │
│ └─ validateRequest (Validação Joi) ← NOVO!          │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ Controller                                           │
│ ├─ Extrai parâmetros (já validados!)                │
│ ├─ Chama Service                                     │
│ └─ Retorna resposta HTTP                             │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ Service                                              │
│ └─ Lógica de negócio                                │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ Repository                                           │
│ └─ Acesso aos dados                                 │
└──────────────────────────────────────────────────────┘
```

### Mudança Importante

**❌ Antes:**
- Controller fazia validações manuais
- `if` checks para campo vazio e tamanho

**✅ Agora:**
- Middleware `validateRequest` valida ANTES do controller
- Controller recebe dados **já validados e sanitizados**
- Controller mais limpo e focado

### Padrão asyncHandler

**O que é?**

Wrapper que captura automaticamente erros assíncronos e os passa para o middleware de tratamento de erros.

**Benefícios:**
- ✅ Elimina try/catch manual
- ✅ Reduz boilerplate
- ✅ Garante que erros sejam tratados
- ✅ Código mais limpo e legível

**Sintaxe:**

```typescript
// Com asyncHandler (recomendado)
static getInformacoesGerais = asyncHandler(
  async (req, res, next) => {
    // código aqui
    // erros são capturados automaticamente
  }
);

// Sem asyncHandler (antigo - não recomendado)
static async getInformacoesGerais(req, res, next) {
  try {
    // código aqui
  } catch (error) {
    next(error); // deve chamar next manualmente
  }
}
```

---

## Endpoints

### GET /:familiaCodigo

**URL Completa:**
```
GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/:familiaCodigo
```

**Descrição:** Busca informações gerais de uma família do sistema Datasul.

---

## Classe: InformacoesGeraisController

### Estrutura

```typescript
export class InformacoesGeraisController {
  static getInformacoesGerais = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void>
  );
}
```

---

## Método: getInformacoesGerais

### Assinatura

```typescript
static getInformacoesGerais = asyncHandler(
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>
)
```

### Parâmetros

#### req: Request

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `req.params.familiaCodigo` | `string` | Código da família a ser consultada (obrigatório) |

#### res: Response

Objeto de resposta Express usado para retornar dados ao cliente.

#### next: NextFunction

Função para passar controle ao próximo middleware (gerenciado automaticamente pelo asyncHandler).

### Retorno

**Tipo:** `Promise<void>`

**Efeito Colateral:** Envia resposta HTTP JSON

**Estrutura da Resposta:**

```typescript
{
  success: boolean;  // Sempre true em caso de sucesso
  data: {
    identificacaoFamiliaCodigo: string;
    identificacaoFamiliaDescricao: string;
  };
}
```

---

## Fluxo de Execução

### Etapas do Método

```
1. Extrai familiaCodigo (já validado pelo middleware)
   ↓
2. Delega ao Service
   ↓
3. Verifica resultado
   ↓
4. Retorna HTTP 200 + dados
```

### Detalhamento das Etapas

#### Etapa 1: Extração de Parâmetros

```typescript
const { familiaCodigo } = req.params;
```

**Origem:** URL path parameter

**Importante:** ⚠️ Valor já foi **validado e sanitizado** pelo middleware `validateRequest`

**Exemplo:**
```
URL: /api/.../informacoesGerais/450000
familiaCodigo = "450000" (já validado!)
```

#### Etapa 2: Delegação ao Service

```typescript
const result = await InformacoesGeraisService.getInformacoesGerais(familiaCodigo);
```

**Service pode lançar:**
- `FamiliaNotFoundError` (404) - Família não existe
- `DatabaseError` (500) - Erro de conexão/query

**Nota:** asyncHandler captura esses erros automaticamente.

#### Etapa 3: Verificação de Resultado

```typescript
if (!result) {
  throw new FamiliaNotFoundError(familiaCodigo);
}
```

**Propósito:** Camada extra de segurança

**Nota:** Service já lança `FamiliaNotFoundError`, mas mantido por redundância.

#### Etapa 4: Resposta de Sucesso

```typescript
res.json({
  success: true,
  data: result,
});
```

**HTTP Status:** 200 OK

**Content-Type:** `application/json`

---

## Validações

### ⚠️ Validação Agora é no Middleware!

**Antes (❌ removido):**
- Controller validava manualmente
- `if (!familiaCodigo || familiaCodigo.trim() === '')`
- `if (familiaCodigo.length > 16)`

**Agora (✅ correto):**
- Middleware `validateRequest` valida ANTES do controller
- Usa schema Joi: `familiaParamsSchema`
- Controller recebe dados **já validados**

### Validações Aplicadas (pelo Middleware)

| Validação | Implementação | Camada |
|-----------|---------------|--------|
| Campo obrigatório | `required()` | Joi |
| Tamanho mínimo (1) | `min(1)` | Joi |
| Tamanho máximo (8) | `max(8)` | Joi |
| Formato alfanumérico | `alphanumeric()` | Joi Extension |
| Sanitização | `coerce()` | Joi Extension |
| SQL Injection | `validate()` | Joi Extension |
| Command Injection | `validate()` | Joi Extension |

**Documentação:** Ver `informacoesGerais.validators.md`

---

## Exceções Lançadas

### FamiliaNotFoundError

**Status Code:** `404 Not Found`

**Quando:** Família não existe no banco

**Lançado por:** Controller (verificação redundante) ou Service

**Estrutura:**
```typescript
throw new FamiliaNotFoundError(familiaCodigo);
```

**Resposta HTTP:**
```json
{
  "error": "FamiliaNotFoundError",
  "message": "Família 450000 não encontrada",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/.../informacoesGerais/450000"
}
```

### DatabaseError

**Status Code:** `500 Internal Server Error`

**Quando:** Erro técnico no banco de dados

**Lançado por:** Service (não pelo Controller)

**Resposta HTTP:**
```json
{
  "error": "DatabaseError",
  "message": "Falha ao buscar informações da família",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/.../informacoesGerais/450000"
}
```

### ValidationError (Middleware)

**Status Code:** `400 Bad Request`

**Quando:** Parâmetro inválido

**Lançado por:** Middleware `validateRequest` (ANTES do controller)

**Resposta HTTP:**
```json
{
  "error": "ValidationError",
  "message": "Código da familia não pode estar vazio",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/.../informacoesGerais/"
}
```

**Nota:** ⚠️ Controller **não lança mais** `ValidationError` - isso é feito pelo middleware!

---

## Exemplos de Uso

### Exemplo 1: Requisição Válida

**Request:**
```http
GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/450000
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "identificacaoFamiliaCodigo": "450000",
    "identificacaoFamiliaDescricao": "FAMÍLIA TESTE"
  }
}
```

---

### Exemplo 2: Campo Vazio (Erro do Middleware)

**Request:**
```http
GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/
```

**Response (400):**
```json
{
  "error": "ValidationError",
  "message": "Código da familia é obrigatório",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/lor0138/familia/dadosCadastrais/informacoesGerais/"
}
```

⚠️ **Nota:** Erro lançado pelo **middleware**, não pelo controller

---

### Exemplo 3: Tamanho Excedido (Erro do Middleware)

**Request:**
```http
GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/123456789
```

**Response (400):**
```json
{
  "error": "ValidationError",
  "message": "Código da familia não pode ter mais de 8 caracteres",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/.../informacoesGerais/123456789"
}
```

⚠️ **Nota:** Erro lançado pelo **middleware**, não pelo controller

---

### Exemplo 4: Família Não Encontrada

**Request:**
```http
GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/INVALID
```

**Response (404):**
```json
{
  "error": "FamiliaNotFoundError",
  "message": "Família INVALID não encontrada",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/lor0138/familia/dadosCadastrais/informacoesGerais/INVALID"
}
```

⚠️ **Nota:** Erro lançado pelo **Service** (propagado pelo controller)

---

### Exemplo 5: Erro de Banco de Dados

**Request:**
```http
GET /api/lor0138/familia/dadosCadastrais/informacoesGerais/450000
```

**Response (500):**
```json
{
  "error": "DatabaseError",
  "message": "Falha ao buscar informações da família",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "path": "/api/lor0138/familia/dadosCadastrais/informacoesGerais/450000"
}
```

⚠️ **Nota:** Erro lançado pelo **Service** (propagado pelo controller)

---

## Pontos Críticos

### 1. Validação Delegada ao Middleware

⚠️ **Importante:**

```typescript
// ❌ ANTIGO (removido)
if (!familiaCodigo || familiaCodigo.trim() === '') {
  throw new ValidationError('...');
}

// ✅ NOVO (middleware faz isso)
const { familiaCodigo } = req.params; // Já validado!
```

**Por quê?**
- Separação de responsabilidades
- Controller foca em lógica de controle
- Validação reutilizável (middleware)
- Código mais limpo

### 2. Verificação Redundante de Resultado

```typescript
if (!result) {
  throw new FamiliaNotFoundError(familiaCodigo);
}
```

**Por quê redundante?**
- Service já lança `FamiliaNotFoundError` se não encontrar
- Esta verificação nunca deveria executar

**Por que manter?**
- Camada extra de segurança
- Previne null pointer exceptions
- Defense in depth

### 3. asyncHandler Captura Todos os Erros

**Erros capturados automaticamente:**
- FamiliaNotFoundError (do Service)
- DatabaseError (do Service)
- Qualquer erro assíncrono

**Não precisa:**
```typescript
// ❌ NÃO NECESSÁRIO
try {
  // código
} catch (error) {
  next(error);
}
```

---

## Boas Práticas Implementadas

### ✅ Single Responsibility

Cada método tem uma única responsabilidade clara:
- Controller: extrair params e chamar Service
- Middleware: validar entrada
- Service: lógica de negócio

### ✅ Separation of Concerns

- **Middleware:** Validação
- **Controller:** Controle de fluxo e resposta HTTP
- **Service:** Lógica de negócio
- **Repository:** Acesso a dados

### ✅ Error Handling

Usa custom errors específicos para cada situação:
- `FamiliaNotFoundError` → 404
- `DatabaseError` → 500
- `ValidationError` (middleware) → 400

### ✅ Consistent Response Format

```typescript
{
  success: boolean;
  data?: Object;
  error?: string;
}
```

### ✅ TypeScript Strict

Tipos explícitos em parâmetros e retornos.

### ✅ Código Limpo

- Sem validações manuais
- Sem try/catch explícitos
- Focado em responsabilidade única

---

## Comparação: Antes vs Depois

### Antes (Com Validação Manual)

```typescript
// ❌ ~30 linhas
static getInformacoesGerais = asyncHandler(
  async (req, res, next) => {
    const { familiaCodigo } = req.params;

    // Validação 1
    if (!familiaCodigo || familiaCodigo.trim() === '') {
      throw new ValidationError('Código da família é obrigatório', {
        familiaCodigo: 'Campo vazio ou ausente'
      });
    }

    // Validação 2
    if (familiaCodigo.length > 16) {
      throw new ValidationError('Código da família inválido', {
        familiaCodigo: 'Máximo de 16 caracteres'
      });
    }

    const result = await InformacoesGeraisService.getInformacoesGerais(familiaCodigo);

    if (!result) {
      throw new FamiliaNotFoundError(familiaCodigo);
    }

    res.json({
      success: true,
      data: result,
    });
  }
);
```

### Depois (Com Middleware Joi)

```typescript
// ✅ ~15 linhas
static getInformacoesGerais = asyncHandler(
  async (req, res, next) => {
    const { familiaCodigo } = req.params; // Já validado!

    const result = await InformacoesGeraisService.getInformacoesGerais(familiaCodigo);

    if (!result) {
      throw new FamiliaNotFoundError(familiaCodigo);
    }

    res.json({
      success: true,
      data: result,
    });
  }
);
```

### Diferenças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Linhas de código** | ~30 | ~15 |
| **Validações** | No controller | No middleware |
| **Manutenibilidade** | Média | Alta |
| **Reutilização** | Baixa | Alta (middleware) |
| **Separação** | Misturada | Clara |
| **Testabilidade** | Média | Alta |

**Redução:** 50% menos código no controller! 🚀

---

## Dependências

### Internas

| Dependência | Tipo | Uso |
|-------------|------|-----|
| `InformacoesGeraisService` | Service | Lógica de negócio |
| `FamiliaNotFoundError` | Custom Error | Família não encontrada (404) |
| `asyncHandler` | Middleware | Tratamento de erros async |

**Removido:** ❌ `ValidationError` - agora lançado pelo middleware

### Express

| Dependência | Tipo | Uso |
|-------------|------|-----|
| `Request` | Interface | Objeto de requisição |
| `Response` | Interface | Objeto de resposta |
| `NextFunction` | Type | Próximo middleware |

---

## Manutenção

### Modificando Resposta

```typescript
// Adicionar campo na resposta
res.json({
  success: true,
  data: result,
  timestamp: new Date().toISOString(), // Novo campo
  version: '1.0' // Novo campo
});
```

### Tratando Novo Tipo de Erro

```typescript
// Service lança novo erro customizado
// asyncHandler captura automaticamente
// errorHandler middleware já trata
// Nada precisa mudar no Controller!
```

### Adicionando Nova Validação

⚠️ **Não adicione validação aqui!**

Validações devem ser adicionadas no **schema Joi**:

```typescript
// ❌ Não fazer no Controller
if (someCondition) {
  throw new ValidationError('...');
}

// ✅ Fazer no Schema Joi
// validators/informacoesGerais.validators.ts
export const familiaParamsSchema = ExtendedJoi.object({
  familiaCodigo: ExtendedJoi.secureCode()
    .alphanumeric()
    .min(1)
    .max(8)
    .custom((value, helpers) => {
      // Nova validação customizada
      if (someCondition) {
        return helpers.error('...');
      }
      return value;
    })
    .required()
});
```

---

## Testes

### Casos de Teste Recomendados

1. **Sucesso:** Família válida encontrada
2. **Not Found:** Família não existe
3. **Database Error:** Erro de conexão

**Nota:** Testes de validação agora são no **middleware**, não no controller!

### Exemplo de Teste Unitário

```typescript
import { InformacoesGeraisController } from './informacoesGerais.controller';
import { InformacoesGeraisService } from '../service/informacoesGerais.service';
import { FamiliaNotFoundError } from '@shared/errors/CustomErrors';

jest.mock('../service/informacoesGerais.service');

describe('InformacoesGeraisController', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = { params: { familiaCodigo: '450000' } };
    res = {
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('deve retornar dados quando família existe', async () => {
    const mockData = {
      identificacaoFamiliaCodigo: '450000',
      identificacaoFamiliaDescricao: 'FAMÍLIA TESTE',
    };

    InformacoesGeraisService.getInformacoesGerais = jest.fn().mockResolvedValue(mockData);

    await InformacoesGeraisController.getInformacoesGerais(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockData,
    });
  });

  it('deve lançar FamiliaNotFoundError quando Service retorna null', async () => {
    InformacoesGeraisService.getInformacoesGerais = jest.fn().mockResolvedValue(null);

    await expect(
      InformacoesGeraisController.getInformacoesGerais(req, res, next)
    ).rejects.toThrow(FamiliaNotFoundError);
  });

  it('deve propagar erros do Service', async () => {
    const error = new Error('Database error');
    InformacoesGeraisService.getInformacoesGerais = jest.fn().mockRejectedValue(error);

    await expect(
      InformacoesGeraisController.getInformacoesGerais(req, res, next)
    ).rejects.toThrow(error);
  });
});
```

---

## Referências

### Documentação Relacionada

- `informacoesGerais.service.md` - Service Layer
- `informacoesGerais.validators.md` - Schema Joi (validação)
- `validateRequest.middleware.md` - Middleware de validação
- `errorHandler.middleware.md` - Tratamento de erros
- `CustomErrors.md` - Erros customizados

### Padrões de Projeto

- [Controller Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Error Handling Best Practices](https://expressjs.com/en/guide/error-handling.html)
- [Async/Await Error Handling](https://javascript.info/async-await)

---

## Resumo

**Controller faz:**
- ✅ Extrai parâmetros da URL (já validados)
- ✅ Delega ao Service
- ✅ Retorna resposta HTTP formatada
- ✅ Propaga erros via asyncHandler

**Controller NÃO faz:**
- ❌ Validação de entrada (feita pelo middleware)
- ❌ Lógica de negócio (feita pelo Service)
- ❌ Acesso direto ao banco (feito pelo Repository)
- ❌ Sanitização (feita pela extensão Joi)

**Padrão-chave:**
- 🎯 asyncHandler para tratamento automático de erros async
- 🎯 Middleware Joi para validação antes do controller
- 🎯 Separação clara de responsabilidades

**Mudança importante:**
- ❌ Antes: Controller validava manualmente (~30 linhas)
- ✅ Agora: Middleware valida com Joi (~15 linhas no controller)