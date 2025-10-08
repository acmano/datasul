# Sistema de Erros Customizados

**Arquivo:** `src/shared/errors/errors.ts`
**Tipo:** Index/Barrel - Ponto de entrada centralizado
**Propósito:** Exportar todas as classes de erro e tipos relacionados

---

## Visão Geral

Este módulo exporta todas as classes de erro e tipos relacionados, permitindo importações simplificadas em todo o projeto.

### Hierarquia de Erros

```
AppError (classe base)
    ├── 404 - Not Found
    │   ├── ItemNotFoundError
    │   └── EstabelecimentoNotFoundError
    │
    ├── 400 - Bad Request
    │   └── ValidationError
    │
    ├── 401 - Unauthorized
    │   └── AuthenticationError
    │
    ├── 403 - Forbidden
    │   └── AuthorizationError
    │
    ├── 422 - Unprocessable Entity
    │   └── BusinessRuleError
    │
    ├── 429 - Too Many Requests
    │   └── RateLimitError
    │
    ├── 500 - Internal Server Error
    │   ├── DatabaseError
    │   ├── CacheError
    │   └── ConfigurationError
    │
    └── 503 - Service Unavailable
        ├── ConnectionTimeoutError
        └── ExternalServiceError
```

---

## Benefícios

### ✅ Status Codes HTTP Apropriados
Cada erro já vem com o status HTTP correto automaticamente configurado.

### ✅ Contexto Adicional para Debugging
Propriedade `context` permite adicionar informações extras sobre o erro.

### ✅ Distinção entre Erros Operacionais e Críticos
Flag `isOperational` identifica se o erro era esperado (true) ou é um bug (false).

### ✅ Respostas JSON Padronizadas
Middleware `errorHandler` gera respostas consistentes automaticamente.

### ✅ Logs Estruturados e Informativos
Erros incluem correlationId para rastreamento em logs.

---

## Importação

### ✅ Forma Recomendada

```typescript
// Import de múltiplas classes de uma vez
import {
  ItemNotFoundError,
  ValidationError,
  DatabaseError
} from '@shared/errors';
```

### ❌ Forma NÃO Recomendada

```typescript
// Evite imports de arquivos individuais
import { ItemNotFoundError } from '@shared/errors/CustomErrors';
import { ValidationError } from '@shared/errors/CustomErrors';
```

**Por quê?**
- ✅ Imports mais limpos e organizados
- ✅ Um único ponto de entrada
- ✅ Facilita refatoração futura
- ✅ Segue padrão barrel exports

---

## Classes de Erro

### AppError (Classe Base)

**Descrição:**
Classe abstrata que estende `Error` nativo do JavaScript.
Todos os erros customizados da aplicação herdam desta classe.

**Propriedades:**
- `statusCode`: Status HTTP apropriado (404, 400, 500, etc)
- `isOperational`: `true` para erros esperados, `false` para bugs
- `context`: Objeto com dados adicionais para debugging

**Exemplo de Criação:**
```typescript
class MeuErro extends AppError {
  constructor(mensagem: string) {
    super(400, mensagem, true, { campo: 'valor' });
  }
}
```

**Referência:**
Ver `AppError.ts` para implementação completa.

---

### CustomErrors (Erros Específicos)

Conjunto de classes de erro pré-definidas para os casos mais comuns.
Cada classe já vem configurada com status code e mensagem apropriada.

---

#### 404 - Not Found

##### ItemNotFoundError

Item não encontrado no sistema.

```typescript
throw new ItemNotFoundError('7530110');
// → 404: "Item 7530110 não encontrado"
```

**Contexto adicionado:**
```json
{
  "itemCodigo": "7530110"
}
```

##### EstabelecimentoNotFoundError

Estabelecimento não encontrado no sistema.

```typescript
throw new EstabelecimentoNotFoundError('001');
// → 404: "Estabelecimento 001 não encontrado"
```

---

#### 400 - Bad Request

##### ValidationError

Erro de validação de dados fornecidos pelo usuário.

```typescript
throw new ValidationError('Dados inválidos', {
  itemCodigo: 'Obrigatório',
  quantidade: 'Deve ser maior que zero'
});
// → 400: "Dados inválidos"
```

**Contexto adicionado:**
```json
{
  "fields": {
    "itemCodigo": "Obrigatório",
    "quantidade": "Deve ser maior que zero"
  }
}
```

---

#### 401 - Unauthorized

##### AuthenticationError

Usuário não está autenticado no sistema.

```typescript
throw new AuthenticationError('Token inválido ou expirado');
// → 401: "Token inválido ou expirado"
```

---

#### 403 - Forbidden

##### AuthorizationError

Usuário não tem permissão para acessar o recurso.

```typescript
throw new AuthorizationError('Sem permissão para deletar itens');
// → 403: "Sem permissão para deletar itens"
```

---

#### 422 - Unprocessable Entity

##### BusinessRuleError

Regra de negócio foi violada.

```typescript
throw new BusinessRuleError(
  'Não é possível excluir item com estoque',
  { estoqueAtual: 150 }
);
// → 422: "Não é possível excluir item com estoque"
```

---

#### 429 - Too Many Requests

##### RateLimitError

Limite de requisições por período foi excedido.

```typescript
throw new RateLimitError('Limite de 100 requisições/minuto excedido');
// → 429: "Limite de 100 requisições/minuto excedido"
```

---

#### 500 - Internal Server Error

##### DatabaseError

Erro ao interagir com o banco de dados.

```typescript
try {
  await database.query('SELECT ...');
} catch (error) {
  throw new DatabaseError('Falha na query de items', error);
}
// → 500: "Erro no banco de dados: Falha na query de items"
```

**Contexto adicionado:**
```json
{
  "originalMessage": "Connection timeout",
  "originalError": { /* error original */ }
}
```

##### CacheError

Erro ao interagir com sistema de cache (Redis, Memcached, etc).

```typescript
throw new CacheError('Falha ao salvar no Redis');
// → 500: "Erro no cache: Falha ao salvar no Redis"
```

##### ConfigurationError

Erro de configuração da aplicação ou ambiente.

```typescript
throw new ConfigurationError('Variável DATABASE_URL não definida');
// → 500: "Erro de configuração: Variável DATABASE_URL não definida"
```

---

#### 503 - Service Unavailable

##### ConnectionTimeoutError

Timeout ao tentar estabelecer conexão.

```typescript
throw new ConnectionTimeoutError('Banco de dados não respondeu em 30s');
// → 503: "Timeout de conexão: Banco de dados não respondeu em 30s"
```

##### ExternalServiceError

Serviço externo falhou ou está indisponível.

```typescript
throw new ExternalServiceError('API de pagamento offline');
// → 503: "Serviço externo falhou: API de pagamento offline"
```

---

## Tipos Exportados

### ErrorDetails

**Tipo:** `Record<string, any>`

Objeto chave-valor com informações adicionais sobre o erro.
Usado na propriedade `context` do AppError.

**Casos de uso:**
- Campos de validação que falharam
- IDs de recursos não encontrados
- Parâmetros que causaram o erro
- Dados de debug

**Exemplos:**

```typescript
// Exemplo genérico
const details: ErrorDetails = {
  itemCodigo: '7530110',
  tentativas: 3,
  timeout: 30000
};

throw new AppError(500, 'Falha ao processar', true, details);
```

```typescript
// Exemplo em ValidationError
const details: ErrorDetails = {
  itemCodigo: 'Campo obrigatório',
  quantidade: 'Deve ser maior que zero',
  estabCodigo: 'Formato inválido'
};

throw new ValidationError('Dados inválidos', details);
```

---

### ErrorResponse

**Tipo:** Estrutura da resposta JSON de erro

```typescript
type ErrorResponse = {
  error: string;          // Nome da classe de erro
  message: string;        // Mensagem descritiva do erro
  timestamp: string;      // Data/hora do erro (ISO 8601)
  path: string;           // URL da requisição que causou o erro
  correlationId: string;  // ID único para rastreamento
  details?: ErrorDetails; // Contexto adicional (opcional)
};
```

**Descrição:**
Formato padronizado de resposta de erro retornado pela API.
Gerado automaticamente pelo `errorHandler` middleware.

**Campos:**

- **error**: Nome da classe (ex: `"ItemNotFoundError"`)
- **message**: Mensagem legível (ex: `"Item 7530110 não encontrado"`)
- **timestamp**: Momento exato do erro
- **path**: Endpoint que foi chamado
- **correlationId**: Para rastrear logs relacionados
- **details**: Dados adicionais do contexto do erro

---

#### Exemplos de Response

##### Response 404 - Item Not Found

```json
{
  "error": "ItemNotFoundError",
  "message": "Item 7530110 não encontrado",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "path": "/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "details": {
    "itemCodigo": "7530110"
  }
}
```

##### Response 400 - Validation Error

```json
{
  "error": "ValidationError",
  "message": "Dados inválidos",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "path": "/api/items",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "details": {
    "fields": {
      "itemCodigo": "Obrigatório",
      "quantidade": "Deve ser maior que zero"
    }
  }
}
```

##### Response 500 - Database Error

```json
{
  "error": "DatabaseError",
  "message": "Erro no banco de dados: Connection timeout",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "path": "/api/items/7530110",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "details": {
    "originalMessage": "ETIMEDOUT",
    "stack": "Error: ETIMEDOUT\n    at ..."
  }
}
```

**Observações:**

💡 O campo `details` é opcional e só aparece se o erro tiver contexto.

🔒 Em **produção**, stack traces NÃO são incluídas por segurança.

🔍 Use o `correlationId` para buscar todos os logs relacionados:
```bash
grep "550e8400-e29b-41d4-a716-446655440000" logs/app.log
```

---

## Exemplos de Uso

### Uso em Controller

```typescript
import { ItemNotFoundError, ValidationError } from '@shared/errors';

export class ItemController {
  static getItem = asyncHandler(async (req, res) => {
    const { itemCodigo } = req.params;

    // Validação de parâmetro
    if (!itemCodigo) {
      throw new ValidationError('Código obrigatório');
    }

    // Buscar item
    const item = await ItemService.find(itemCodigo);

    // Item não encontrado
    if (!item) {
      throw new ItemNotFoundError(itemCodigo);
    }

    res.json({ success: true, data: item });
  });
}
```

---

### Uso em Service

```typescript
import { ItemNotFoundError, DatabaseError } from '@shared/errors';

export class ItemService {
  static async find(codigo: string) {
    try {
      const item = await Repository.findByCodigo(codigo);

      if (!item) {
        throw new ItemNotFoundError(codigo);
      }

      return item;
    } catch (error) {
      // Re-lança erros customizados
      if (error instanceof ItemNotFoundError) {
        throw error;
      }

      // Converte erros genéricos em DatabaseError
      throw new DatabaseError('Falha ao buscar item', error);
    }
  }
}
```

---

### Uso em Middleware

```typescript
import { AuthenticationError } from '@shared/errors';

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    throw new AuthenticationError('Token não fornecido');
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    throw new AuthenticationError('Token inválido');
  }
};
```

---

## Boas Práticas

### ✅ DO

```typescript
// Lançar erro específico com contexto
throw new ItemNotFoundError('7530110');

// Adicionar detalhes relevantes
throw new ValidationError('Dados inválidos', {
  itemCodigo: 'Obrigatório',
  quantidade: 'Deve ser maior que zero'
});

// Re-lançar erros customizados
if (error instanceof ItemNotFoundError) {
  throw error;
}
```

### ❌ DON'T

```typescript
// Lançar Error genérico
throw new Error('Item não encontrado');

// Perder contexto do erro
throw new DatabaseError('Erro');

// Capturar e ignorar erros customizados
catch (error) {
  console.log(error);
  return null; // ❌ Erro silenciado
}
```

---

## Referências

### Arquivos Relacionados

- `AppError.ts` - Implementação da classe base
- `CustomErrors.ts` - Implementação de cada erro específico
- `errorHandler.middleware.ts` - Middleware que processa erros
- `ERROR_HANDLING.md` - Guia completo sobre tratamento de erros

### Padrões Utilizados

- **Error Hierarchy** - Erros herdam de uma classe base comum
- **Operational vs Programmer Errors** - Flag `isOperational`
- **Correlation ID** - Rastreamento de requisições entre logs
- **Error Context** - Informações adicionais para debugging

---

## Resumo

### O que é

Ponto de entrada centralizado para importar todas as classes de erro e tipos relacionados do sistema.

### Exports

- **AppError**: Classe base abstrata
- **CustomErrors**: 13 erros específicos por status HTTP
- **Types**: ErrorDetails, ErrorResponse

### Quando usar

- **Controller**: Para lançar erros de validação e negócio
- **Service**: Para lançar erros de domínio e dados
- **Middleware**: Para lançar erros de autenticação/autorização
- **Repository**: Para lançar erros de banco/infraestrutura

### Vantagens

- ✅ Status HTTP apropriados automaticamente
- ✅ Respostas JSON padronizadas
- ✅ Contexto rico para debugging
- ✅ Rastreabilidade via correlationId
- ✅ Importação simplificada
- ✅ Fácil manutenção e extensão