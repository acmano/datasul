# Documentação - AppError: Classe Base de Erros

**Módulo:** `AppError`
**Categoria:** Errors
**Subcategoria:** Core
**Arquivo:** `src/shared/errors/AppError.ts`

---

## Visão Geral

Classe base para todos os erros customizados da aplicação. Estende `Error` nativo do JavaScript com propriedades adicionais para tratamento padronizado de erros HTTP.

---

## Propósito

### Objetivos

- ✅ **Padronizar** erros da aplicação
- ✅ **Adicionar** statusCode HTTP aos erros
- ✅ **Diferenciar** erros operacionais de bugs
- ✅ **Incluir** contexto adicional para debugging
- ✅ **Manter** stack trace correto

### Por Que Uma Classe Base?

**❌ Sem AppError:**
```typescript
// Inconsistente e difícil de tratar
throw new Error('Item não encontrado');
throw { statusCode: 404, message: '...' };
throw 'Erro de validação';
```

**✅ Com AppError:**
```typescript
// Padronizado e tipado
throw new ItemNotFoundError('7530110');
throw new ValidationError('Campo inválido');
throw new DatabaseError('Connection timeout');
```

---

## Arquitetura

### Hierarquia de Classes

```
Error (JavaScript nativo)
  ↓
AppError (classe base abstrata)
  ├─ ItemNotFoundError (404)
  ├─ FamiliaNotFoundError (404)
  ├─ ValidationError (400)
  ├─ DatabaseError (500)
  ├─ AuthenticationError (401)
  ├─ AuthorizationError (403)
  ├─ RateLimitError (429)
  └─ TimeoutError (503)
```

### Características

| Característica | Descrição |
|----------------|-----------|
| **Base** | Estende `Error` nativo |
| **Abstrata** | Não instanciar diretamente |
| **Readonly** | Propriedades imutáveis |
| **TypeScript** | Tipagem forte |
| **Stack Trace** | Otimizado com `captureStackTrace` |
| **Prototype** | Corrigido com `setPrototypeOf` |

---

## Padrões de Projeto

### Error Object Pattern

**Conceito:** Encapsular informações de erro em objetos estruturados

**Benefícios:**
- Consistência na estrutura
- Facilita tratamento
- Permite extensibilidade

### Operational Error Pattern

**Conceito:** Distinguir erros esperados (operacionais) de bugs (programáticos)

**Benefícios:**
- Decisões inteligentes de tratamento
- Logs apropriados
- Alertas configurados corretamente

### Context Pattern

**Conceito:** Armazenar dados adicionais relacionados ao erro

**Benefícios:**
- Debugging facilitado
- Troubleshooting eficiente
- Informações completas em logs

---

## Propriedades

### 1. statusCode

**Tipo:** `number`
**Modificadores:** `public readonly`
**Obrigatório:** Sim

#### Descrição

Código de status HTTP associado ao erro. Segue o padrão HTTP Status Codes (RFC 7231).

#### Códigos Comuns

| Código | Nome | Uso |
|--------|------|-----|
| **400** | Bad Request | Validação falhou |
| **401** | Unauthorized | Não autenticado |
| **403** | Forbidden | Não autorizado |
| **404** | Not Found | Recurso não existe |
| **422** | Unprocessable Entity | Regra de negócio |
| **429** | Too Many Requests | Rate limit excedido |
| **500** | Internal Server Error | Erro do servidor |
| **503** | Service Unavailable | Timeout, serviço offline |

#### Uso

```typescript
const error = new AppError(404, 'Recurso não encontrado');
console.log(error.statusCode); // 404

// No errorHandler middleware
if (err instanceof AppError) {
  res.status(err.statusCode).json({ ... });
}
```

#### Características

- **readonly:** Não pode ser alterado após criação
- **public:** Acessível pelo errorHandler
- **Numérico:** Sempre inteiro (200-599)

---

### 2. isOperational

**Tipo:** `boolean`
**Modificadores:** `public readonly`
**Obrigatório:** Não (padrão: `true`)

#### Descrição

Flag booleana que diferencia dois tipos fundamentais de erros.

#### Tipos de Erro

##### Erro Operacional (`isOperational = true`)

**Características:**
- ✅ Esperado e previsto no fluxo
- ✅ Não indica bug no código
- ✅ Pode ser tratado graciosamente
- ✅ Log level: `warn`

**Exemplos:**
- Item não encontrado (404)
- Validação falhou (400)
- Timeout de conexão (503)
- Rate limit excedido (429)
- Credenciais inválidas (401)

**Quando ocorre:**
- Usuário fornece dados inválidos
- Recurso solicitado não existe
- Sistema externo está indisponível temporariamente
- Limite de uso atingido

##### Erro Programático (`isOperational = false`)

**Características:**
- ❌ Inesperado, indica bug
- ❌ Requer investigação e correção
- ❌ Não deveria acontecer
- ❌ Log level: `error`

**Exemplos:**
- `TypeError: Cannot read property 'x' of undefined`
- `ReferenceError: variable is not defined`
- Configuração inválida detectada
- Null pointer exception
- Divisão por zero não tratada

**Quando ocorre:**
- Bug no código
- Lógica incorreta
- Falta de validação interna
- Estado inconsistente

#### Uso no Error Handler

```typescript
// Determina nível de log
if (err.isOperational) {
  log.warn('Erro operacional', { ... });
} else {
  log.error('BUG! Erro programático - investigar!', { ... });
  // Envia alerta para equipe
  sendAlertToTeam(err);
}

// Decide se inclui detalhes na resposta
if (err.isOperational) {
  // Resposta com mensagem amigável
  res.json({ error: err.message });
} else {
  // Resposta genérica (não expor bug)
  res.json({ error: 'Internal Server Error' });
}
```

#### Exemplos

```typescript
// Erro operacional (esperado)
const notFoundError = new AppError(404, 'Item não encontrado', true);
console.log(notFoundError.isOperational); // true

// Erro programático (bug)
const configError = new AppError(500, 'Config inválida', false);
console.log(configError.isOperational); // false

// Padrão é true (assume operacional)
const error = new AppError(400, 'Validação falhou');
console.log(error.isOperational); // true (padrão)
```

---

### 3. context

**Tipo:** `Record<string, any> | undefined`
**Modificadores:** `public readonly`
**Obrigatório:** Não (opcional)

#### Descrição

Objeto livre que armazena informações extras relacionadas ao erro. Ajuda a entender e debugar o problema.

#### Casos de Uso

| Uso | Exemplo |
|-----|---------|
| **Parâmetros que causaram erro** | `{ itemCodigo: '7530110' }` |
| **IDs de recursos** | `{ userId: 123, orderId: 456 }` |
| **Detalhes de validação** | `{ fields: { email: 'inválido' } }` |
| **Erro original** | `{ originalError: err.message }` |
| **Estado da aplicação** | `{ retries: 3, timeout: 30000 }` |

#### Visibilidade

| Ambiente | Context Exposto? | Motivo |
|----------|------------------|--------|
| **Development** | ✅ Sim | Facilita debugging |
| **Production** | ❌ Não | Segurança (não expor internals) |
| **Logs** | ✅ Sim | Troubleshooting |

#### Exemplos

**Erro com contexto de validação:**
```typescript
const error = new AppError(400, 'Validação falhou', true, {
  fields: {
    email: 'Formato inválido',
    age: 'Deve ser maior que 18'
  },
  receivedData: {
    email: 'invalid-email',
    age: 15
  }
});
```

**Erro com ID do recurso:**
```typescript
const error = new AppError(404, 'Item não encontrado', true, {
  itemCodigo: '7530110',
  tentativasAnteriores: 3,
  ultimaTentativa: new Date().toISOString()
});
```

**Erro com detalhes de timeout:**
```typescript
const error = new AppError(503, 'Timeout', true, {
  service: 'SQL Server',
  timeout: 30000,
  host: '10.105.0.4',
  query: 'SELECT * FROM familia...'
});
```

**Erro sem contexto (válido):**
```typescript
const error = new AppError(500, 'Erro interno');
console.log(error.context); // undefined
```

#### ⚠️ Importante

**NÃO incluir dados sensíveis:**
```typescript
// ❌ ERRADO - expõe dados sensíveis
const error = new AppError(401, 'Auth falhou', true, {
  password: 'secret123',  // NUNCA!
  token: 'abc123xyz',     // NUNCA!
  apiKey: 'sk-...'        // NUNCA!
});

// ✅ CORRETO - dados seguros
const error = new AppError(401, 'Auth falhou', true, {
  username: 'joao',       // OK
  reason: 'invalid_password',  // OK
  attempts: 3             // OK
});
```

---

## Construtor

### Assinatura

```typescript
constructor(
  statusCode: number,
  message: string,
  isOperational: boolean = true,
  context?: Record<string, any>
)
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `statusCode` | `number` | Sim | - | Código HTTP (200-599) |
| `message` | `string` | Sim | - | Mensagem descritiva |
| `isOperational` | `boolean` | Não | `true` | Se é erro operacional |
| `context` | `Record<string, any>` | Não | `undefined` | Dados adicionais |

---

## Fluxo de Inicialização

### Etapas do Construtor

```
1. super(message)
   └─ Inicializa Error nativo

2. this.statusCode = statusCode
   └─ Define código HTTP

3. this.isOperational = isOperational
   └─ Define tipo de erro

4. this.context = context
   └─ Armazena contexto

5. Error.captureStackTrace(this, this.constructor)
   └─ Otimiza stack trace (V8)

6. Object.setPrototypeOf(this, new.target.prototype)
   └─ Corrige prototype chain (TypeScript)

7. this.name = this.constructor.name
   └─ Define nome da classe
```

---

## Conceitos Avançados

### 1. Error.captureStackTrace()

**Propósito:** Otimização do V8 para melhorar legibilidade do stack trace

#### Como Funciona

```typescript
Error.captureStackTrace(this, this.constructor);
```

**Sem captureStackTrace:**
```
Error: Item não encontrado
  at new AppError (AppError.ts:150)        ← ruído
  at new ItemNotFoundError (errors.ts:10)  ← ruído
  at Service.getItem (service.ts:45)       ← útil
  at Controller.get (controller.ts:20)     ← útil
```

**Com captureStackTrace:**
```
Error: Item não encontrado
  at Service.getItem (service.ts:45)       ← direto ao ponto!
  at Controller.get (controller.ts:20)     ← útil
```

#### Parâmetros

| Parâmetro | Descrição |
|-----------|-----------|
| `this` | Objeto onde armazenar stack |
| `this.constructor` | Remove frames até este ponto |

#### Benefícios

- ✅ Remove ruído do stack trace
- ✅ Foca no código relevante
- ✅ Melhora debugging
- ✅ Stack começa onde erro foi lançado

**Nota:** Específico do V8 (Node.js). Não disponível em todos os engines JavaScript.

---

### 2. Object.setPrototypeOf()

**Propósito:** Corrigir prototype chain ao estender Error em TypeScript

#### O Problema

Em TypeScript/ES6, estender classes built-in (como `Error`) tem problemas de prototype chain devido a como ES5/ES6 tratam objetos nativos.

**Sintomas sem o fix:**
- `instanceof` pode falhar
- Métodos customizados não acessíveis
- Prototype chain quebrado
- Herança não funciona corretamente

#### A Solução

```typescript
Object.setPrototypeOf(this, new.target.prototype);
```

**new.target:**
- Referência ao construtor que foi chamado
- Em classe base: `AppError`
- Em classe filha: `ItemNotFoundError`, `ValidationError`, etc.

**new.target.prototype:**
- Prototype da classe que está sendo instanciada
- Garante que métodos e propriedades estejam acessíveis

#### Exemplo do Problema

```typescript
// Sem Object.setPrototypeOf
class AppError extends Error {
  constructor(message: string) {
    super(message);
    // Faltando: Object.setPrototypeOf(...)
  }
}

class ItemNotFoundError extends AppError {
  getDetails() { return 'Item not found'; }
}

const error = new ItemNotFoundError('...');
console.log(error instanceof ItemNotFoundError); // ❌ false (deveria ser true!)
error.getDetails(); // ❌ TypeError: getDetails is not a function
```

```typescript
// Com Object.setPrototypeOf
class AppError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // ✅ Fix
  }
}

class ItemNotFoundError extends AppError {
  getDetails() { return 'Item not found'; }
}

const error = new ItemNotFoundError('...');
console.log(error instanceof ItemNotFoundError); // ✅ true
error.getDetails(); // ✅ 'Item not found'
```

#### Referência

[TypeScript Wiki - Breaking Changes](https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)

---

### 3. this.name = this.constructor.name

**Propósito:** Identificar tipo específico do erro

#### Como Funciona

```typescript
this.name = this.constructor.name;
```

**this.constructor.name:**
- Nome da classe que está sendo instanciada
- `'AppError'` se instanciado diretamente
- `'ItemNotFoundError'` se via classe filha
- `'ValidationError'` se via classe filha

#### Uso

```typescript
const error1 = new AppError(500, 'Erro');
console.log(error1.name); // 'AppError'

const error2 = new ItemNotFoundError('7530110');
console.log(error2.name); // 'ItemNotFoundError'

const error3 = new ValidationError('Campo inválido');
console.log(error3.name); // 'ValidationError'
```

#### Aparece Em

**Logs:**
```
[ItemNotFoundError] Item 7530110 não encontrado
[ValidationError] Campo email inválido
[DatabaseError] Connection timeout
```

**JSON de Resposta:**
```json
{
  "error": "ItemNotFoundError",
  "message": "Item 7530110 não encontrado"
}
```

**Stack Trace:**
```
ItemNotFoundError: Item não encontrado
  at Service.getItem (service.ts:45)
  at Controller.get (controller.ts:20)
```

---

## Criando Erros Customizados

### Padrão Recomendado

```typescript
export class ItemNotFoundError extends AppError {
  constructor(itemCodigo: string) {
    super(
      404,                                      // statusCode
      `Item ${itemCodigo} não encontrado`,     // message
      true,                                     // isOperational
      { itemCodigo }                            // context
    );
  }
}
```

### Anatomia de um Erro Customizado

#### 1. Estender AppError

```typescript
export class MyCustomError extends AppError {
  // ...
}
```

#### 2. Construtor com Parâmetros Específicos

```typescript
constructor(specificParam: string, additionalInfo?: any) {
  // ...
}
```

#### 3. Chamar super() com Valores Apropriados

```typescript
super(
  statusCode,      // Código HTTP apropriado
  message,         // Mensagem descritiva
  isOperational,   // true para erros esperados
  context          // Dados relevantes
);
```

---

## Exemplos Completos

### Exemplo 1: Erro de Recurso Não Encontrado

```typescript
export class ItemNotFoundError extends AppError {
  constructor(itemCodigo: string) {
    super(
      404,
      `Item ${itemCodigo} não encontrado`,
      true,
      { itemCodigo }
    );
  }
}

// Uso
throw new ItemNotFoundError('7530110');
```

### Exemplo 2: Erro de Validação

```typescript
export class ValidationError extends AppError {
  constructor(
    message: string,
    fields?: Record<string, string>
  ) {
    super(
      400,
      message,
      true,
      { fields }
    );
  }
}

// Uso
throw new ValidationError('Validação falhou', {
  email: 'Formato inválido',
  age: 'Deve ser maior que 18'
});
```

### Exemplo 3: Erro de Banco de Dados

```typescript
export class DatabaseError extends AppError {
  constructor(
    message: string,
    originalError?: Error
  ) {
    super(
      500,
      message,
      true,  // Operacional: banco offline é esperado
      {
        originalError: originalError?.message,
        stack: originalError?.stack
      }
    );
  }
}

// Uso
try {
  await database.query('...');
} catch (err) {
  throw new DatabaseError('Falha ao consultar banco', err);
}
```

### Exemplo 4: Erro de Autenticação

```typescript
export class AuthenticationError extends AppError {
  constructor(
    reason: string,
    username?: string
  ) {
    super(
      401,
      'Autenticação falhou',
      true,
      { reason, username }
    );
  }
}

// Uso
throw new AuthenticationError('invalid_credentials', 'joao');
```

### Exemplo 5: Erro de Rate Limit

```typescript
export class RateLimitError extends AppError {
  constructor(
    limit: number,
    retryAfter: number
  ) {
    super(
      429,
      'Rate limit excedido',
      true,
      { limit, retryAfter }
    );
  }
}

// Uso
throw new RateLimitError(100, 60);
```

---

## Uso no Error Handler

### Middleware de Tratamento de Erros

```typescript
// middleware/errorHandler.ts
import { AppError } from '@shared/errors/AppError';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Identifica se é AppError
  if (err instanceof AppError) {
    // Loga apropriadamente
    if (err.isOperational) {
      log.warn('Erro operacional', {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        context: err.context
      });
    } else {
      log.error('Erro programático! Investigar!', {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        context: err.context,
        stack: err.stack
      });
    }

    // Retorna resposta HTTP
    return res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && {
        context: err.context,
        stack: err.stack
      })
    });
  }

  // Erro não tratado (não é AppError)
  log.error('Erro não tratado!', {
    error: err.message,
    stack: err.stack
  });

  res.status(500).json({
    error: 'InternalServerError',
    message: 'Erro interno do servidor'
  });
}
```

---

## Testes

### Exemplo de Teste Unitário

```typescript
import { AppError } from './AppError';

describe('AppError', () => {
  it('deve criar erro com todos os parâmetros', () => {
    const error = new AppError(
      404,
      'Recurso não encontrado',
      true,
      { id: 123 }
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Recurso não encontrado');
    expect(error.isOperational).toBe(true);
    expect(error.context).toEqual({ id: 123 });
    expect(error.name).toBe('AppError');
    expect(error.stack).toBeDefined();
  });

  it('deve usar padrão isOperational = true', () => {
    const error = new AppError(400, 'Bad request');
    expect(error.isOperational).toBe(true);
  });

  it('deve aceitar context undefined', () => {
    const error = new AppError(500, 'Internal error');
    expect(error.context).toBeUndefined();
  });

  it('deve ter stack trace correto', () => {
    const error = new AppError(404, 'Not found');
    expect(error.stack).toContain('AppError');
    expect(error.stack).toContain('Not found');
  });

  it('deve manter prototype chain correto', () => {
    class CustomError extends AppError {
      customMethod() {
        return 'custom';
      }
    }

    const error = new CustomError(400, 'Custom error');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(CustomError);
    expect(error.customMethod()).toBe('custom');
  });
});
```

---

## Boas Práticas

### ✅ Fazer

1. **Sempre estender AppError para erros customizados**
   ```typescript
   class MyError extends AppError { }
   ```

2. **Usar statusCode apropriado**
   ```typescript
   404 para "não encontrado"
   400 para "validação falhou"
   500 para "erro de sistema"
   ```

3. **Definir isOperational corretamente**
   ```typescript
   true para erros esperados
   false para bugs
   ```

4. **Incluir context relevante**
   ```typescript
   { itemCodigo, tentativas, timestamp }
   ```

5. **Mensagens descritivas**
   ```typescript
   'Item 7530110 não encontrado'  // ✅ específico
   'Erro'                          // ❌ vago
   ```

### ❌ Evitar

1. **Instanciar AppError diretamente**
   ```typescript
   // ❌ Evite
   throw new AppError(404, '...');

   // ✅ Prefira
   throw new ItemNotFoundError('7530110');
   ```

2. **Context com dados sensíveis**
   ```typescript
   // ❌ NUNCA
   { password: '...', token: '...', apiKey: '...' }
   ```

3. **Mensagens genéricas**
   ```typescript
   // ❌ Ruim
   'Erro ao processar'

   // ✅ Bom
   'Falha ao conectar ao SQL Server após 3 tentativas'
   ```

4. **isOperational incorreto**
   ```typescript
   // ❌ Errado
   new AppError(500, 'Cannot read property x', true)  // Bug = false!

   // ✅ Correto
   new AppError(500, 'Config inválida detectada', false)
   ```

---

## Referências

### Documentação Relacionada

- `CustomErrors.md` - Erros customizados específicos
- `errorHandler.middleware.md` - Middleware de tratamento
- [MDN - Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
- [Node.js - Error.captureStackTrace](https://nodejs.org/api/errors.html#errors_error_capturestacktrace_targetobject_constructoropt)

### Artigos

- [Error Handling Best Practices](https://expressjs.com/en/guide/error-handling.html)
- [Operational vs Programmer Errors](https://www.joyent.com/node-js/production/design/errors)
- [TypeScript and Error](https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md)

---

## Resumo

**AppError é:**
- ✅ Classe base para todos os erros customizados
- ✅ Estende Error nativo com funcionalidades extras
- ✅ Adiciona statusCode, isOperational, context
- ✅ Otimiza stack trace com captureStackTrace
- ✅ Corrige prototype chain com setPrototypeOf
- ✅ Permite herança para erros específicos

**Use para:**
- ✅ Padronizar erros HTTP
- ✅ Distinguir erros operacionais de bugs
- ✅ Incluir contexto para debugging
- ✅ Facilitar tratamento no errorHandler

**Não use para:**
- ❌ Instanciar diretamente (crie classes filhas)
- ❌ Armazenar dados sensíveis no context
- ❌ Erros que não precisam de HTTP status