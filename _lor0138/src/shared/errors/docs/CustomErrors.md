# Documentação - CustomErrors: Erros Específicos

**Módulo:** `CustomErrors`
**Categoria:** Errors
**Subcategoria:** Specific
**Arquivo:** `src/shared/errors/CustomErrors.ts`

---

## Visão Geral

Coleção de classes de erro específicas que estendem `AppError`. Cada classe representa um tipo específico de erro da aplicação, com statusCode, mensagem e contexto apropriados.

---

## Propósito

### Objetivos

- ✅ Substituir erros genéricos por erros tipados e descritivos
- ✅ Padronizar mensagens de erro
- ✅ Facilitar tratamento específico por tipo de erro
- ✅ Melhorar debugging com contexto rico
- ✅ Garantir statusCode HTTP correto

### Benefícios

| Benefício | Descrição |
|-----------|-----------|
| **Type Safety** | TypeScript sabe o tipo do erro |
| **Autocomplete** | IDE sugere propriedades corretas |
| **Mensagens Padronizadas** | Consistência na comunicação |
| **Context Automático** | Dados relevantes sempre incluídos |
| **StatusCode Correto** | HTTP status apropriado |
| **Logs Estruturados** | Informações organizadas |

---

## Padrão de Uso

### ❌ Antes (Genérico)

```typescript
throw new Error('Item não encontrado');
throw new Error('Validação falhou');
throw { statusCode: 404, message: '...' };
```

**Problemas:**
- Sem tipo específico
- statusCode manual
- Context ausente
- Difícil de tratar

### ✅ Depois (Customizado)

```typescript
throw new ItemNotFoundError('7530110');
throw new ValidationError('Campo inválido', { email: 'Formato inválido' });
throw new DatabaseError('Connection timeout', originalError);
```

**Vantagens:**
- Tipo específico
- statusCode automático
- Context incluído
- Fácil tratamento

---

## Categorias de Erro

### Tabela de Categorias

| Categoria | Status | Operacional | Exemplos |
|-----------|--------|-------------|----------|
| **Not Found** | 404 | ✅ Sim | Item, Família, Estabelecimento |
| **Validation** | 400 | ✅ Sim | Dados inválidos |
| **Database** | 500 | ✅ Sim | Query falhou, Connection lost |
| **Timeout** | 503 | ✅ Sim | Connection timeout, Service unavailable |
| **Cache** | 500 | ✅ Sim | Redis offline, Cache set failed |
| **Authentication** | 401 | ✅ Sim | Não autenticado |
| **Authorization** | 403 | ✅ Sim | Sem permissão |
| **Rate Limit** | 429 | ✅ Sim | Limite excedido |
| **Configuration** | 500 | ❌ **NÃO** | Env var ausente, Config inválida |
| **Business Rule** | 422 | ✅ Sim | Regra de negócio violada |

---

## Categoria: Not Found (404)

Erros para recursos que não existem no sistema.

### 1. ItemNotFoundError

**Quando usar:**
- Busca de item por código retorna vazio
- Item foi deletado ou nunca existiu
- Usuário tenta acessar item inexistente

**Construtor:**
```typescript
constructor(itemCodigo: string)
```

**Propriedades:**
- **statusCode:** 404
- **isOperational:** true
- **message:** `"Item {codigo} não encontrado"`
- **context:** `{ itemCodigo: string }`

**Exemplos:**

```typescript
// No Service
const item = await repository.findByCode('7530110');
if (!item) {
  throw new ItemNotFoundError('7530110');
}
```

```typescript
// Tratamento específico
try {
  return await getItem('INVALID');
} catch (error) {
  if (error instanceof ItemNotFoundError) {
    console.log('Item não existe:', error.context.itemCodigo);
    // Sugerir itens similares
  }
}
```

**Resposta HTTP:**
```json
{
  "error": "ItemNotFoundError",
  "message": "Item 7530110 não encontrado",
  "statusCode": 404,
  "context": { "itemCodigo": "7530110" }
}
```

---

### 2. FamiliaNotFoundError

**Quando usar:**
- Busca de família por código retorna vazio
- Família foi deletada ou nunca existiu
- Usuário tenta acessar família inexistente

**Construtor:**
```typescript
constructor(familiaCodigo: string)
```

**Propriedades:**
- **statusCode:** 404
- **isOperational:** true
- **message:** `"Familia {codigo} não encontrada"`
- **context:** `{ familiaCodigo: string }`

**Exemplos:**

```typescript
// No Service
const familia = await repository.findByCode('450000');
if (!familia) {
  throw new FamiliaNotFoundError('450000');
}
```

**Resposta HTTP:**
```json
{
  "error": "FamiliaNotFoundError",
  "message": "Familia 450000 não encontrada",
  "statusCode": 404,
  "context": { "familiaCodigo": "450000" }
}
```

---

### 3. EstabelecimentoNotFoundError

**Quando usar:**
- Busca de estabelecimento (filial) retorna vazio
- Estabelecimento foi desativado ou nunca existiu
- Usuário tenta acessar estabelecimento inexistente

**Construtor:**
```typescript
constructor(estabCodigo: string)
```

**Propriedades:**
- **statusCode:** 404
- **isOperational:** true
- **message:** `"Estabelecimento {codigo} não encontrado"`
- **context:** `{ estabCodigo: string }`

**Exemplos:**

```typescript
const estab = await repository.findByCode('99.99');
if (!estab) {
  throw new EstabelecimentoNotFoundError('99.99');
}
```

**Resposta HTTP:**
```json
{
  "error": "EstabelecimentoNotFoundError",
  "message": "Estabelecimento 99.99 não encontrado",
  "statusCode": 404,
  "context": { "estabCodigo": "99.99" }
}
```

---

## Categoria: Validation (400)

Erros quando dados de entrada falham na validação.

### ValidationError

**Quando usar:**
- Campos obrigatórios ausentes
- Formato de dado inválido
- Valor fora do range permitido
- Falha em regra de validação

**Construtor:**
```typescript
constructor(
  message: string,
  fields?: Record<string, string>
)
```

**Parâmetros:**
- **message:** Mensagem geral do erro
- **fields:** (Opcional) Detalhes por campo

**Propriedades:**
- **statusCode:** 400
- **isOperational:** true
- **message:** Customizada
- **context:** `{ fields?: Record<string, string> }`

**Exemplos:**

**Validação simples:**
```typescript
if (!itemCodigo) {
  throw new ValidationError('Código do item é obrigatório');
}
```

**Validação com múltiplos campos:**
```typescript
throw new ValidationError('Dados inválidos', {
  email: 'Formato inválido',
  idade: 'Deve ser maior que 18',
  telefone: 'Obrigatório'
});
```

**Uso em validator:**
```typescript
function validateItem(data: any) {
  const errors: Record<string, string> = {};

  if (!data.codigo) errors.codigo = 'Obrigatório';
  if (data.codigo?.length > 16) errors.codigo = 'Máximo 16 caracteres';
  if (!data.descricao) errors.descricao = 'Obrigatório';

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validação falhou', errors);
  }
}
```

**Resposta HTTP:**
```json
{
  "error": "ValidationError",
  "message": "Dados inválidos",
  "statusCode": 400,
  "context": {
    "fields": {
      "email": "Formato inválido",
      "idade": "Deve ser maior que 18",
      "telefone": "Obrigatório"
    }
  }
}
```

---

## Categoria: Database (500)

Erros relacionados ao banco de dados.

### DatabaseError

**Quando usar:**
- Query SQL falha
- Constraint violation
- Deadlock
- Erro de sintaxe SQL
- Conexão perdida durante query

**Construtor:**
```typescript
constructor(
  message: string,
  originalError?: Error
)
```

**Parâmetros:**
- **message:** Descrição do erro
- **originalError:** (Opcional) Erro original do banco

**Propriedades:**
- **statusCode:** 500
- **isOperational:** true
- **message:** `"Erro no banco de dados: {detalhe}"`
- **context:** `{ originalMessage, stack (dev only) }`

**Segurança:**
- Stack trace só em desenvolvimento
- Evita vazamento de informações em produção

**Exemplos:**

```typescript
// Captura e encapsula erro de banco
try {
  await connection.query('SELECT * FROM item WHERE ...');
} catch (error) {
  throw new DatabaseError('Falha ao buscar item', error as Error);
}
```

```typescript
// Tratamento de deadlock
try {
  await transaction.commit();
} catch (error) {
  if (error.code === 'DEADLOCK') {
    throw new DatabaseError('Deadlock detectado', error);
  }
  throw error;
}
```

**Resposta HTTP (Development):**
```json
{
  "error": "DatabaseError",
  "message": "Erro no banco de dados: Connection timeout",
  "statusCode": 500,
  "context": {
    "originalMessage": "ETIMEDOUT",
    "stack": "Error: ETIMEDOUT\n  at ..."
  }
}
```

**Resposta HTTP (Production):**
```json
{
  "error": "DatabaseError",
  "message": "Erro no banco de dados: Connection timeout",
  "statusCode": 500,
  "context": {
    "originalMessage": "ETIMEDOUT"
  }
}
```

---

## Categoria: Timeout / Service (503)

Erros de timeout e serviços indisponíveis.

### 1. ConnectionTimeoutError

**Quando usar:**
- Conexão com banco de dados timeout
- API externa não responde
- Serviço lento ou sobrecarregado
- Network issues

**Construtor:**
```typescript
constructor(service: string, timeout: number)
```

**Parâmetros:**
- **service:** Nome do serviço (ex: "SQL Server", "API Externa")
- **timeout:** Tempo limite em milissegundos

**Propriedades:**
- **statusCode:** 503
- **isOperational:** true
- **message:** `"Timeout ao conectar com {serviço} após {ms}ms"`
- **context:** `{ service: string, timeout: number }`

**Retry:** Cliente pode tentar novamente (503 indica temporário)

**Exemplos:**

```typescript
const timeout = 30000; // 30s
const startTime = Date.now();

try {
  await connection.connect();
} catch (error) {
  if (Date.now() - startTime >= timeout) {
    throw new ConnectionTimeoutError('SQL Server', timeout);
  }
  throw error;
}
```

```typescript
// Com Promise.race para timeout
const queryPromise = database.query('...');
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Timeout')), 30000);
});

try {
  await Promise.race([queryPromise, timeoutPromise]);
} catch (error) {
  throw new ConnectionTimeoutError('Database', 30000);
}
```

**Resposta HTTP:**
```json
{
  "error": "ConnectionTimeoutError",
  "message": "Timeout ao conectar com SQL Server após 30000ms",
  "statusCode": 503,
  "context": {
    "service": "SQL Server",
    "timeout": 30000
  }
}
```

---

### 2. ExternalServiceError

**Quando usar:**
- API externa retorna 5xx
- Microserviço está offline
- Serviço retorna resposta inválida
- Integração falha

**Construtor:**
```typescript
constructor(service: string, message: string)
```

**Propriedades:**
- **statusCode:** 503
- **isOperational:** true
- **message:** `"Erro no serviço {nome}: {detalhe}"`
- **context:** `{ service: string }`

**Exemplos:**

```typescript
const response = await fetch('https://api.externa.com/data');
if (!response.ok) {
  throw new ExternalServiceError(
    'API Externa',
    `Status ${response.status}: ${response.statusText}`
  );
}
```

```typescript
// Microserviço offline
try {
  await microservice.call();
} catch (error) {
  throw new ExternalServiceError(
    'Microserviço de Pagamentos',
    'Serviço indisponível'
  );
}
```

**Resposta HTTP:**
```json
{
  "error": "ExternalServiceError",
  "message": "Erro no serviço API Externa: Status 503",
  "statusCode": 503,
  "context": { "service": "API Externa" }
}
```

---

## Categoria: Cache (500)

Erros em operações de cache.

### CacheError

**Quando usar:**
- Falha ao salvar no cache
- Falha ao recuperar do cache
- Falha ao invalidar cache
- Redis/Memcached offline

**Construtor:**
```typescript
constructor(operation: string, message: string)
```

**Parâmetros:**
- **operation:** Operação que falhou (get, set, delete, etc)
- **message:** Descrição do erro

**Propriedades:**
- **statusCode:** 500
- **isOperational:** true
- **message:** `"Erro no cache ({operação}): {detalhe}"`
- **context:** `{ operation: string }`

**⚠️ Importante:** Aplicação deve continuar funcionando mesmo com cache offline (degraded mode - busca direto do banco)

**Exemplos:**

```typescript
// Degraded mode - não falha se cache offline
try {
  await cache.set('key', value);
} catch (error) {
  // Log mas não falha
  log.warn(new CacheError('set', error.message));
  // Continua sem cache
}
```

```typescript
// Get com fallback
let data;
try {
  data = await cache.get('key');
} catch (error) {
  log.warn(new CacheError('get', error.message));
  data = null; // Força busca no banco
}

if (!data) {
  data = await database.query();
}
```

**Resposta HTTP:**
```json
{
  "error": "CacheError",
  "message": "Erro no cache (set): Connection refused",
  "statusCode": 500,
  "context": { "operation": "set" }
}
```

---

## Categoria: Authentication / Authorization

Erros de autenticação e autorização.

### 1. AuthenticationError (401)

**Quando usar:**
- Token ausente
- Token inválido ou expirado
- Credenciais incorretas
- Sessão expirada

**Construtor:**
```typescript
constructor(message: string = 'Não autenticado')
```

**Propriedades:**
- **statusCode:** 401
- **isOperational:** true
- **message:** "Não autenticado" (padrão) ou customizada

**Resposta:** Cliente deve redirecionar para login ou refresh token

**Exemplos:**

```typescript
// Token ausente
const token = req.headers.authorization;
if (!token) {
  throw new AuthenticationError();
}
```

```typescript
// Token expirado
if (isTokenExpired(token)) {
  throw new AuthenticationError('Token expirado. Faça login novamente.');
}
```

```typescript
// Credenciais inválidas
const user = await validateCredentials(username, password);
if (!user) {
  throw new AuthenticationError('Usuário ou senha incorretos');
}
```

**Resposta HTTP:**
```json
{
  "error": "AuthenticationError",
  "message": "Token expirado. Faça login novamente.",
  "statusCode": 401
}
```

---

### 2. AuthorizationError (403)

**Quando usar:**
- Usuário não tem role necessário
- Recurso pertence a outro usuário
- Ação bloqueada por permissão
- Tentativa de acesso a recurso restrito

**Diferença de AuthenticationError:**
- **401:** Não autenticado (precisa fazer login)
- **403:** Autenticado mas sem permissão (já logado)

**Construtor:**
```typescript
constructor(message: string = 'Não autorizado')
```

**Propriedades:**
- **statusCode:** 403
- **isOperational:** true
- **message:** "Não autorizado" (padrão) ou customizada

**Exemplos:**

```typescript
// Verificação de role
if (req.user.role !== 'admin') {
  throw new AuthorizationError('Apenas administradores podem acessar');
}
```

```typescript
// Recurso de outro usuário
if (resource.ownerId !== req.user.id) {
  throw new AuthorizationError('Você não tem permissão para este recurso');
}
```

```typescript
// Ação específica bloqueada
if (!req.user.permissions.includes('DELETE_ITEM')) {
  throw new AuthorizationError('Você não tem permissão para deletar itens');
}
```

**Resposta HTTP:**
```json
{
  "error": "AuthorizationError",
  "message": "Apenas administradores podem acessar",
  "statusCode": 403
}
```

---

## Categoria: Rate Limit (429)

Erros de limite de requisições.

### RateLimitError

**Quando usar:**
- Muitas requisições em curto período
- Limite de API excedido
- Proteção contra abuso/DDoS

**Construtor:**
```typescript
constructor(retryAfter?: number)
```

**Parâmetros:**
- **retryAfter:** (Opcional) Segundos para retry

**Propriedades:**
- **statusCode:** 429
- **isOperational:** true
- **message:** "Muitas requisições. Tente novamente em alguns segundos."
- **context:** `{ retryAfter?: number }`

**Retry-After:** Tempo em segundos que cliente deve aguardar antes de tentar novamente

**Exemplos:**

```typescript
const limit = rateLimiter.check(userId);
if (limit.exceeded) {
  throw new RateLimitError(limit.retryAfter);
}
```

```typescript
// Com sliding window
const requests = await getRequestCount(userId, '1m');
if (requests > 100) {
  const retryAfter = calculateRetryAfter(requests);
  throw new RateLimitError(retryAfter);
}
```

**Resposta HTTP:**
```json
{
  "error": "RateLimitError",
  "message": "Muitas requisições. Tente novamente em alguns segundos.",
  "statusCode": 429,
  "context": { "retryAfter": 60 }
}
```

**Header Retry-After:**
```typescript
// Middleware pode adicionar header
if (error instanceof RateLimitError && error.context.retryAfter) {
  res.setHeader('Retry-After', error.context.retryAfter);
}
```

---

## Categoria: Configuration (500)

Erros de configuração da aplicação.

### ConfigurationError

**⚠️ Importante: isOperational = FALSE (é um BUG!)**

**Quando usar:**
- Variável de ambiente ausente
- Arquivo de config inválido
- Configuração conflitante
- Setup incorreto

**Construtor:**
```typescript
constructor(message: string)
```

**Propriedades:**
- **statusCode:** 500
- **isOperational:** **false** (BUG!)
- **message:** `"Erro de configuração: {detalhe}"`

**⚠️ Características:**
- **NÃO é erro operacional** (é bug de configuração)
- Deve ser corrigido antes de deploy
- Aplicação não deve iniciar com erro de config
- Log level: ERROR (não WARN)

**Exemplos:**

```typescript
// Env var obrigatória
if (!process.env.DATABASE_URL) {
  throw new ConfigurationError('DATABASE_URL não configurada');
}
```

```typescript
// Validação de config
if (config.timeout < 0) {
  throw new ConfigurationError('Timeout não pode ser negativo');
}

if (config.maxConnections > 1000) {
  throw new ConfigurationError('maxConnections excede limite (1000)');
}
```

```typescript
// Configuração conflitante
if (config.useCache && !config.redisUrl) {
  throw new ConfigurationError('useCache habilitado mas redisUrl não configurada');
}
```

**Log (erro não operacional):**
```json
{
  "level": "error",
  "message": "Erro de configuração: DATABASE_URL não configurada",
  "isOperational": false,
  "alert": true
}
```

**Resposta HTTP:**
```json
{
  "error": "ConfigurationError",
  "message": "Erro de configuração: DATABASE_URL não configurada",
  "statusCode": 500
}
```

---

## Categoria: Business Rule (422)

Erros de regra de negócio.

### BusinessRuleError

**Quando usar:**
- Regra de negócio não satisfeita
- Estado inválido para operação
- Constraint de domínio violada
- Workflow incorreto

**Diferença de ValidationError:**
- **400 (ValidationError):** Formato/tipo de dado inválido
- **422 (BusinessRuleError):** Dados válidos mas regra de negócio falha

**Construtor:**
```typescript
constructor(message: string, rule?: string)
```

**Parâmetros:**
- **message:** Descrição da regra violada
- **rule:** (Opcional) Código/nome da regra

**Propriedades:**
- **statusCode:** 422
- **isOperational:** true
- **message:** Descrição da regra
- **context:** `{ rule?: string }`

**Exemplos de Regras:**
- Não pode vender item com estoque negativo
- Pedido já foi fechado, não pode ser editado
- Usuário menor de idade não pode fazer compra
- Valor do pedido abaixo do mínimo

**Exemplos:**

```typescript
// Estoque insuficiente
if (item.estoque < quantidade) {
  throw new BusinessRuleError(
    'Estoque insuficiente para esta operação',
    'ESTOQUE_INSUFICIENTE'
  );
}
```

```typescript
// Pedido fechado
if (pedido.status === 'FECHADO') {
  throw new BusinessRuleError(
    'Pedido já foi fechado e não pode ser alterado',
    'PEDIDO_FECHADO'
  );
}
```

```typescript
// Idade mínima
if (user.idade < 18) {
  throw new BusinessRuleError(
    'Usuário deve ter pelo menos 18 anos',
    'IDADE_MINIMA'
  );
}
```

```typescript
// Valor mínimo
if (pedido.total < 50) {
  throw new BusinessRuleError(
    'Valor mínimo do pedido é R$ 50,00',
    'VALOR_MINIMO'
  );
}
```

**Resposta HTTP:**
```json
{
  "error": "BusinessRuleError",
  "message": "Estoque insuficiente para esta operação",
  "statusCode": 422,
  "context": { "rule": "ESTOQUE_INSUFICIENTE" }
}
```

---

## Guia de Uso

### Quando Usar Qual Erro?

| Situação | Erro | Status |
|----------|------|--------|
| Recurso não existe | `ItemNotFoundError` | 404 |
| Dados inválidos (formato) | `ValidationError` | 400 |
| Regra de negócio violada | `BusinessRuleError` | 422 |
| Erro de banco | `DatabaseError` | 500 |
| Timeout de conexão | `ConnectionTimeoutError` | 503 |
| Serviço externo falhou | `ExternalServiceError` | 503 |
| Cache offline | `CacheError` | 500 |
| Não autenticado | `AuthenticationError` | 401 |
| Sem permissão | `AuthorizationError` | 403 |
| Rate limit excedido | `RateLimitError` | 429 |
| Config incorreta | `ConfigurationError` | 500 |

---

## Tratamento de Erros

### No Error Handler

```typescript
import { AppError } from '@shared/errors/AppError';
import * as CustomErrors from '@shared/errors/CustomErrors';

export function errorHandler(err: Error, req, res, next) {
  // Identifica tipo específico
  if (err instanceof CustomErrors.ItemNotFoundError) {
    log.warn('Item não encontrado', err.context);
  } else if (err instanceof CustomErrors.ValidationError) {
    log.warn('Validação falhou', err.context);
  } else if (err instanceof CustomErrors.ConfigurationError) {
    log.error('BUG de config!', err); // isOperational = false
    sendAlertToTeam(err);
  } else if (err instanceof AppError) {
    // Qualquer outro AppError
    if (err.isOperational) {
      log.warn('Erro operacional', err);
    } else {
      log.error('Erro programático!', err);
    }
  }

  // Retorna resposta
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && {
        context: err.context
      })
    });
  } else {
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Erro interno'
    });
  }
}
```

---

## Boas Práticas

### ✅ Fazer

1. **Use erro específico**
   ```typescript
   throw new ItemNotFoundError('7530110');
   ```

2. **Inclua context relevante**
   ```typescript
   throw new ValidationError('Dados inválidos', {
     email: 'Formato inválido'
   });
   ```

3. **Encapsule erros de terceiros**
   ```typescript
   try {
     await db.query();
   } catch (error) {
     throw new DatabaseError('Query falhou', error);
   }
   ```

4. **Diferencia 400 vs 422**
   ```typescript
   // 400: formato inválido
   throw new ValidationError('Email inválido');

   // 422: regra de negócio
   throw new BusinessRuleError('Estoque insuficiente');
   ```

### ❌ Evitar

1. **Erro genérico**
   ```typescript
   // ❌ Ruim
   throw new Error('Item não encontrado');

   // ✅ Bom
   throw new ItemNotFoundError('7530110');
   ```

2. **StatusCode manual**
   ```typescript
   // ❌ Ruim
   throw { statusCode: 404, message: '...' };

   // ✅ Bom
   throw new ItemNotFoundError('7530110');
   ```

3. **Context sensível**
   ```typescript
   // ❌ NUNCA
   throw new ValidationError('...', {
     password: 'abc123'
   });
   ```

4. **isOperational incorreto**
   ```typescript
   // ❌ ConfigurationError com isOperational true
   // ConfigurationError já define como false
   ```

---

## Testes

### Exemplo de Suite de Testes

```typescript
import * as CustomErrors from './CustomErrors';

describe('CustomErrors', () => {
  describe('ItemNotFoundError', () => {
    it('deve ter status 404', () => {
      const error = new CustomErrors.ItemNotFoundError('7530110');
      expect(error.statusCode).toBe(404);
    });

    it('deve ter mensagem específica', () => {
      const error = new CustomErrors.ItemNotFoundError('7530110');
      expect(error.message).toBe('Item 7530110 não encontrado');
    });

    it('deve incluir itemCodigo no context', () => {
      const error = new CustomErrors.ItemNotFoundError('7530110');
      expect(error.context).toEqual({ itemCodigo: '7530110' });
    });

    it('deve ser operacional', () => {
      const error = new CustomErrors.ItemNotFoundError('7530110');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('ConfigurationError', () => {
    it('deve ser NÃO operacional', () => {
      const error = new CustomErrors.ConfigurationError('Env var ausente');
      expect(error.isOperational).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('deve aceitar fields opcional', () => {
      const error = new CustomErrors.ValidationError('Erro', {
        email: 'inválido'
      });
      expect(error.context.fields).toEqual({ email: 'inválido' });
    });
  });
});
```

---

## Referências

### Documentação Relacionada

- `AppError.md` - Classe base
- `errorHandler.middleware.md` - Tratamento centralizado
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

## Resumo

**CustomErrors fornece:**
- ✅ 11 erros específicos e tipados
- ✅ StatusCode HTTP automático
- ✅ Context rico para debugging
- ✅ Mensagens padronizadas
- ✅ Type safety completo

**Organize por categoria:**
- 404: Not Found (Item, Família, Estabelecimento)
- 400: Validation
- 422: Business Rule
- 500: Database, Cache, Configuration
- 503: Timeout, External Service
- 401/403: Authentication, Authorization
- 429: Rate Limit

**Use sempre o erro mais específico disponível!**