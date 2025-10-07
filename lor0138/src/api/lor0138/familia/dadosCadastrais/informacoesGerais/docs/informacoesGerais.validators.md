# Documentação - Validators: Informações Gerais de Famílias

**Módulo:** `InformacoesGeraisValidators`
**Categoria:** Validators
**Arquivo:** `src/api/lor0138/familia/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators.ts`

---

## Visão Geral

Schema de validação Joi para parâmetros de consulta de informações gerais de famílias, com sanitização automática e proteção contra múltiplos vetores de ataque.

---

## Mudança de Abordagem

### ❌ Antes: Validação Manual

- Funções personalizadas de sanitização
- Validações imperativas com if/else
- ~100 linhas de código
- Difícil de manter e testar

### ✅ Agora: Joi + Extensão secureCode

- Schema declarativo
- Sanitização automática via coerce
- ~20 linhas de código
- Fácil de manter e reutilizar

---

## Schema: familiaParamsSchema

### Estrutura Completa

```typescript
import { ExtendedJoi } from '@shared/validators/joi';

export const familiaParamsSchema = ExtendedJoi.object({
  familiaCodigo: ExtendedJoi.secureCode()
    .alphanumeric()
    .min(1)
    .max(8)
    .required()
    .messages({
      'any.required': 'Código da familia é obrigatório',
      'string.empty': 'Código da familia não pode estar vazio',
      'string.min': 'Código da familia não pode estar vazio',
      'string.max': 'Código da familia não pode ter mais de 8 caracteres',
      'secureCode.invalidChars': 'Código da familia deve conter apenas letras e números',
    }),
});
```

---

## Componentes do Schema

### 1. ExtendedJoi.object()

**Tipo:** Container do schema

**Propósito:** Define objeto com campos a serem validados

### 2. ExtendedJoi.secureCode()

**Tipo:** Tipo customizado (extensão Joi)

**Propósito:** Validação segura com sanitização automática

**Recursos:**
- ✅ Sanitização automática (coerce)
- ✅ Detecção de SQL Injection
- ✅ Detecção de Command Injection
- ✅ Remoção de caracteres perigosos

**Documentação:** Ver `secureCode.extension.md`

### 3. .alphanumeric()

**Tipo:** Rule customizada

**Pattern:** `/^[A-Za-z0-9]+$/`

**Valida:** Apenas letras (A-Z, a-z) e números (0-9)

**Bloqueia:**
- Espaços
- Caracteres especiais (`!@#$%^&*()`)
- Pontuação (`,.:;`)
- Símbolos (`-_+=[]{}`)

### 4. .min(1)

**Tipo:** Validação de tamanho mínimo

**Regra:** String deve ter pelo menos 1 caractere

**Mensagem customizada:** `"Código da familia não pode estar vazio"`

### 5. .max(8)

**Tipo:** Validação de tamanho máximo

**Regra:** String não pode ter mais de 8 caracteres

**Motivo:** Limite do banco de dados Progress/Datasul

**Mensagem customizada:** `"Código da familia não pode ter mais de 8 caracteres"`

### 6. .required()

**Tipo:** Campo obrigatório

**Regra:** Campo deve estar presente e não ser `undefined`

**Mensagem customizada:** `"Código da familia é obrigatório"`

### 7. .messages()

**Tipo:** Mensagens de erro customizadas

**Propósito:** Sobrescrever mensagens padrão do Joi

**Mapeamento:**

| Erro Joi | Mensagem Customizada |
|----------|---------------------|
| `any.required` | Código da familia é obrigatório |
| `string.empty` | Código da familia não pode estar vazio |
| `string.min` | Código da familia não pode estar vazio |
| `string.max` | Código da familia não pode ter mais de 8 caracteres |
| `secureCode.invalidChars` | Código da familia deve conter apenas letras e números |

---

## Fluxo de Validação

### Ordem de Execução

```
1. coerce (Extensão secureCode)
   └─ Sanitização automática

2. validate (Extensão secureCode)
   ├─ Detecção SQL Injection
   └─ Detecção Command Injection

3. alphanumeric (Rule)
   └─ Valida formato [A-Za-z0-9]+

4. required
   └─ Verifica presença do campo

5. min(1)
   └─ Verifica tamanho mínimo

6. max(8)
   └─ Verifica tamanho máximo
```

---

## Camadas de Proteção

### Defense in Depth

| Camada | Proteção | Implementação |
|--------|----------|---------------|
| **1. Sanitização** | Remove chars perigosos | coerce (secureCode) |
| **2. Detecção SQL** | Bloqueia keywords SQL | validate (secureCode) |
| **3. Detecção Command** | Bloqueia padrões shell | validate (secureCode) |
| **4. Whitelist** | Apenas alfanumérico | alphanumeric rule |
| **5. Tamanho** | min(1) max(8) | Joi built-in |

---

## Sanitização Automática

### Como Funciona

A extensão `secureCode` aplica sanitização **automaticamente** via `coerce`:

```typescript
// Input
'  ABC123  '

// Após coerce (sanitização)
'ABC123'  // Trim automático

// Após validate
'ABC123'  // Sem keywords SQL/Command

// Após alphanumeric
'ABC123'  // Formato válido ✅
```

### Transformações Aplicadas

| Transformação | Pattern | Exemplo |
|---------------|---------|---------|
| **Trim** | `.trim()` | `'  ABC  '` → `'ABC'` |
| **Controle** | `/[\x00-\x1F\x7F]/g` | `'ABC\x00'` → `'ABC'` |
| **Path Traversal** | `/\.\./g` | `'../../ABC'` → `'ABC'` |
| **Barras** | `/[\/\\]/g` | `'/ABC/'` → `'ABC'` |
| **SQL Chars** | `/[';"\-\-]/g` | `'ABC";'` → `'ABC'` |
| **Tags HTML** | `/<[^>]*>/g` | `'<b>ABC</b>'` → `'ABC'` |

---

## Uso com Middleware

### Integração com validateRequest

```typescript
// routes/informacoesGerais.routes.ts
import { validateRequest } from '@shared/middlewares/validateRequest.middleware';
import { familiaParamsSchema } from '../validators/informacoesGerais.validators';

router.get(
  '/:familiaCodigo',
  validateRequest({ params: familiaParamsSchema }),  // Valida params
  InformacoesGeraisController.getInformacoesGerais
);
```

**Como funciona:**

1. Middleware extrai `req.params`
2. Executa `familiaParamsSchema.validate(req.params)`
3. Se erro: retorna 400 com mensagem
4. Se sucesso: continua para controller
5. **Valor sanitizado** substitui original em `req.params`

---

## Exemplos de Validação

### ✅ Casos Válidos

```typescript
// Input → Output (sanitizado)
'ABC123'     → { familiaCodigo: 'ABC123' }
'450000'     → { familiaCodigo: '450000' }
'  ABC  '    → { familiaCodigo: 'ABC' }       // Trim automático
'12345678'   → { familiaCodigo: '12345678' }
'a1'         → { familiaCodigo: 'a1' }
```

### ❌ Casos Inválidos

#### Erro: Campo Vazio

```typescript
// Input
{ familiaCodigo: '' }

// Erro
{
  message: 'Código da familia não pode estar vazio',
  path: ['familiaCodigo'],
  type: 'string.empty'
}
```

#### Erro: Campo Ausente

```typescript
// Input
{}

// Erro
{
  message: 'Código da familia é obrigatório',
  path: ['familiaCodigo'],
  type: 'any.required'
}
```

#### Erro: Tamanho Excedido

```typescript
// Input
{ familiaCodigo: '123456789' }  // 9 caracteres

// Erro
{
  message: 'Código da familia não pode ter mais de 8 caracteres',
  path: ['familiaCodigo'],
  type: 'string.max'
}
```

#### Erro: Formato Inválido

```typescript
// Input
{ familiaCodigo: 'ABC-123' }

// Erro
{
  message: 'Código da familia deve conter apenas letras e números',
  path: ['familiaCodigo'],
  type: 'secureCode.invalidChars'
}
```

#### Erro: SQL Injection

```typescript
// Input
{ familiaCodigo: 'SELECT123' }

// Erro
{
  message: 'Código da familia contém padrões não permitidos',
  path: ['familiaCodigo'],
  type: 'secureCode.sqlInjection'
}
```

#### Erro: Command Injection

```typescript
// Input
{ familiaCodigo: 'cmd&&ls' }

// Erro
{
  message: 'Código da familia contém caracteres não permitidos',
  path: ['familiaCodigo'],
  type: 'secureCode.commandInjection'
}
```

---

## Comparação: Antes vs Depois

### Antes (Validação Manual)

```typescript
// ~100 linhas de código

const MAX_LENGTH = 8;
const MIN_LENGTH = 1;
const PATTERN = /^[A-Za-z0-9]+$/;
const SQL_KEYWORDS = ['SELECT', 'INSERT', ...];
const DANGEROUS_PATTERNS = ['&&', '||', ...];

function sanitize(value: string): string {
  let sanitized = value.trim();
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  // ... mais 5 linhas
  return sanitized;
}

function validate(data: any): ValidationResult {
  if (!data.familiaCodigo) {
    return { valid: false, error: '...' };
  }

  if (typeof data.familiaCodigo !== 'string') {
    return { valid: false, error: '...' };
  }

  const sanitized = sanitize(data.familiaCodigo);

  if (sanitized.length === 0) {
    return { valid: false, error: '...' };
  }

  if (sanitized.length > MAX_LENGTH) {
    return { valid: false, error: '...' };
  }

  // ... mais 20 linhas de validação

  return { valid: true, data: { familiaCodigo: sanitized } };
}
```

**Problemas:**
- ❌ 100+ linhas de código
- ❌ Difícil de testar
- ❌ Difícil de manter
- ❌ Propenso a bugs
- ❌ Não reutilizável

### Depois (Joi + secureCode)

```typescript
// ~20 linhas de código

import { ExtendedJoi } from '@shared/validators/joi';

export const familiaParamsSchema = ExtendedJoi.object({
  familiaCodigo: ExtendedJoi.secureCode()
    .alphanumeric()
    .min(1)
    .max(8)
    .required()
    .messages({
      'any.required': 'Código da familia é obrigatório',
      'string.empty': 'Código da familia não pode estar vazio',
      'string.min': 'Código da familia não pode estar vazio',
      'string.max': 'Código da familia não pode ter mais de 8 caracteres',
      'secureCode.invalidChars': 'Código da familia deve conter apenas letras e números',
    }),
});
```

**Vantagens:**
- ✅ 80% menos código
- ✅ Declarativo e legível
- ✅ Fácil de testar
- ✅ Fácil de manter
- ✅ Reutilizável em outros endpoints

---

## Segurança

### Vetores de Ataque Protegidos

| Vetor | Proteção | Camada |
|-------|----------|--------|
| **SQL Injection** | Detecção de keywords | secureCode.validate() |
| **XSS** | Remoção de tags HTML | secureCode.coerce() |
| **Command Injection** | Detecção de padrões | secureCode.validate() |
| **Path Traversal** | Remoção de `../` | secureCode.coerce() |
| **Null Bytes** | Remoção de \x00 | secureCode.coerce() |

### Exemplos de Ataques Bloqueados

```typescript
// SQL Injection
'SELECT * FROM users'    → Error: SQL keywords
"'; DROP TABLE--"        → Error: SQL chars + keywords

// XSS
'<script>alert()</script>' → Error: Sanitizado + formato inválido

// Command Injection
'cmd && rm -rf'          → Error: Padrões perigosos
'$(whoami)'              → Error: Command substitution

// Path Traversal
'../../../etc/passwd'    → Error: Sanitizado + formato inválido
```

---

## Testes

### Exemplo de Teste Unitário

```typescript
import { familiaParamsSchema } from './informacoesGerais.validators';

describe('familiaParamsSchema', () => {
  it('deve validar código válido', () => {
    const result = familiaParamsSchema.validate({ familiaCodigo: 'ABC123' });
    expect(result.error).toBeUndefined();
    expect(result.value.familiaCodigo).toBe('ABC123');
  });

  it('deve rejeitar código vazio', () => {
    const result = familiaParamsSchema.validate({ familiaCodigo: '' });
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('não pode estar vazio');
  });

  it('deve rejeitar código com mais de 8 caracteres', () => {
    const result = familiaParamsSchema.validate({ familiaCodigo: '123456789' });
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('mais de 8 caracteres');
  });

  it('deve rejeitar formato inválido', () => {
    const result = familiaParamsSchema.validate({ familiaCodigo: 'ABC-123' });
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('apenas letras e números');
  });

  it('deve sanitizar automaticamente', () => {
    const result = familiaParamsSchema.validate({ familiaCodigo: '  ABC123  ' });
    expect(result.error).toBeUndefined();
    expect(result.value.familiaCodigo).toBe('ABC123');
  });

  it('deve detectar SQL injection', () => {
    const result = familiaParamsSchema.validate({ familiaCodigo: 'SELECT123' });
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('padrões não permitidos');
  });
});
```

---

## Manutenção

### Alterando Tamanho Máximo

```typescript
export const familiaParamsSchema = ExtendedJoi.object({
  familiaCodigo: ExtendedJoi.secureCode()
    .alphanumeric()
    .min(1)
    .max(16)  // Alterar de 8 para 16
    .required()
    .messages({
      'string.max': 'Código da familia não pode ter mais de 16 caracteres',  // Atualizar mensagem
    }),
});
```

### Alterando para Apenas Numérico

```typescript
export const familiaParamsSchema = ExtendedJoi.object({
  familiaCodigo: ExtendedJoi.secureCode()
    .numeric()  // Alterar de alphanumeric para numeric
    .min(1)
    .max(8)
    .required()
    .messages({
      'secureCode.invalidChars': 'Código da familia deve conter apenas números',  // Atualizar mensagem
    }),
});
```

### Adicionando Novo Campo

```typescript
export const familiaParamsSchema = ExtendedJoi.object({
  familiaCodigo: ExtendedJoi.secureCode()
    .alphanumeric()
    .min(1)
    .max(8)
    .required()
    .messages({ ... }),

  // Novo campo
  estabelecimento: ExtendedJoi.secureCode()
    .numeric()
    .length(3)
    .required()
    .messages({
      'any.required': 'Estabelecimento é obrigatório',
      'string.length': 'Estabelecimento deve ter exatamente 3 dígitos',
      'secureCode.invalidChars': 'Estabelecimento deve conter apenas números',
    }),
});
```

---

## Referências

### Documentação Relacionada

- `secureCode.extension.md` - Extensão Joi customizada
- `joi.md` - Wrapper ExtendedJoi
- `informacoesGerais.controller.md` - Uso no Controller
- `validateRequest.middleware.md` - Middleware de validação
- [Joi Documentation](https://joi.dev/api/) - Documentação oficial

### Segurança

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [OWASP XSS](https://owasp.org/www-community/attacks/xss/)
- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)

---

## Resumo

**Schema define:**
- ✅ Campo `familiaCodigo`
- ✅ Tipo `secureCode` (com sanitização)
- ✅ Formato `alphanumeric` (A-Z, a-z, 0-9)
- ✅ Tamanho `min(1) max(8)`
- ✅ Obrigatório `required()`
- ✅ Mensagens customizadas

**Benefícios:**
- 🚀 80% menos código que validação manual
- 🔒 Segurança em múltiplas camadas
- ♻️ Reutilizável em outros endpoints
- 📝 Declarativo e legível
- 🧪 Fácil de testar
- 🛠️ Fácil de manter

- ✅ **SQL Injection**
- ✅ **XSS (Cross-Site Scripting)**
- ✅ **Command Injection**
- ✅ **Path Traversal**

---

## Camadas de Proteção

### Defense in Depth

Mesmo usando prepared statements (que protege contra SQL injection), mantemos validação rigorosa como camada adicional de segurança.

### 5 Camadas de Segurança

1. **Validação de tipo e presença**
2. **Sanitização** (remoção de caracteres perigosos)
3. **Validação de formato** (whitelist)
4. **Validação de tamanho** (min/max)
5. **Detecção de padrões maliciosos**

---

## Constantes de Configuração

### Tamanhos Permitidos

| Constante | Valor | Descrição |
|-----------|-------|-----------|
| `MAX_FAMILIA_CODIGO_LENGTH` | `8` | Tamanho máximo do código (baseado no Progress/Datasul) |
| `MIN_FAMILIA_CODIGO_LENGTH` | `1` | Tamanho mínimo do código |

### Padrão de Validação

| Constante | Padrão | Descrição |
|-----------|--------|-----------|
| `VALID_FAMILIA_CODIGO_PATTERN` | `/^[A-Za-z0-9]+$/` | Permite apenas letras e números |

### SQL Keywords Bloqueadas

```typescript
const SQL_KEYWORDS = [
  'SELECT', 'INSERT', 'UPDATE', 'DELETE',
  'DROP', 'CREATE', 'ALTER', 'EXEC', 'UNION'
];
```

### Padrões Perigosos Bloqueados

| Padrão | Tipo de Ataque | Descrição |
|--------|----------------|-----------|
| `&&` | Command Injection | Shell AND |
| `\|\|` | Command Injection | Shell OR |
| `\|` | Command Injection | Pipe |
| `` ` `` | Command Injection | Backtick (command substitution) |
| `$` | Command Injection | Variable expansion |
| `$(` | Command Injection | Command substitution |
| `${` | Command Injection | Variable substitution |

---

## Funções

### 1. sanitizeFamiliaCodigo

**Tipo:** Função auxiliar privada

Sanitiza o código da família removendo caracteres perigosos.

#### Camadas de Sanitização

1. **Remove espaços** nas extremidades
2. **Remove caracteres de controle** não imprimíveis (ASCII 0-31 e 127)
3. **Remove tentativas de path traversal** (`../`)
4. **Remove barras** (`/`, `\`)
5. **Remove caracteres SQL perigosos** (`'`, `"`, `;`, `--`)
6. **Remove tags HTML/XML** (`<script>`, etc.)

#### Por que sanitizar se usamos prepared statements?

- **Defense in depth** (múltiplas camadas de proteção)
- Previne outros tipos de ataque (XSS, path traversal)
- Garante dados limpos em logs e mensagens de erro
- Protege contra bugs futuros no código

#### Assinatura

```typescript
function sanitizeFamiliaCodigo(value: string): string
```

#### Exemplos

| Entrada | Saída | Motivo |
|---------|-------|--------|
| `'  ABC123  '` | `'ABC123'` | Remove espaços |
| `'<script>alert()</script>'` | `'scriptalert'` | Remove tags HTML |
| `'ABC"; DROP TABLE--'` | `'ABC DROP TABLE'` | Remove caracteres SQL |
| `'../../../etc/passwd'` | `'etcpasswd'` | Remove path traversal |

#### Nota Importante

Esta função é **intencionalmente agressiva** na remoção de caracteres para maximizar a segurança.

---

### 2. isValidFamiliaCodigoFormat

**Tipo:** Função auxiliar privada

Valida formato do código da família usando **abordagem whitelist**.

#### Whitelist vs Blacklist

**Whitelist** (usado aqui) é mais seguro que **blacklist**:
- ✅ Permite apenas caracteres explicitamente seguros
- ✅ Bloqueia tudo que não está na lista
- ❌ Blacklist pode ser bypassed com caracteres não previstos

#### Caracteres Permitidos

- **Letras maiúsculas:** A-Z
- **Letras minúsculas:** a-z
- **Números:** 0-9

#### Caracteres NÃO Permitidos

- Espaços
- Caracteres especiais: `!@#$%^&*()`
- Pontuação: `.,;:`
- Símbolos: `-_+=[]{}`

#### Assinatura

```typescript
function isValidFamiliaCodigoFormat(value: string): boolean
```

#### Exemplos

| Entrada | Resultado | Motivo |
|---------|-----------|--------|
| `'ABC123'` | `true` | Apenas alfanuméricos |
| `'450000'` | `true` | Apenas números |
| `'Item-123'` | `false` | Hífen não permitido |
| `'A B C'` | `false` | Espaços não permitidos |
| `'A@B'` | `false` | @ não permitido |

---

### 3. validateFamiliaInformacoesGeraisRequest

**Tipo:** Função principal (exportada)

Valida os parâmetros de busca de informações gerais da família.

#### Fluxo de Validação (9 Camadas)

```
1. ✅ Presença          → familiaCodigo foi fornecido?
2. ✅ Tipo              → é string?
3. ✅ Sanitização       → remove caracteres perigosos
4. ✅ Vazio             → não ficou vazio após sanitização?
5. ✅ Tamanho máximo    → ≤ 8 caracteres?
6. ✅ Tamanho mínimo    → ≥ 1 caractere?
7. ✅ Formato           → apenas A-Z, a-z, 0-9?
8. ✅ SQL Keywords      → não contém SELECT, DROP, etc?
9. ✅ Command Injection → não contém &&, ||, |, etc?
```

#### Assinatura

```typescript
function validateFamiliaInformacoesGeraisRequest(
  data: any
): ValidationResult<FamiliaInformacoesGeraisRequestDTO>
```

#### Tipo de Retorno

```typescript
interface ValidationResult<T> {
  valid: boolean;      // Indica se validação passou
  error?: string;      // Mensagem de erro (se valid = false)
  data?: T;            // Dados validados e sanitizados (se valid = true)
}
```

#### Exemplos de Uso

**✅ Caso Válido**

```typescript
const result = validateFamiliaInformacoesGeraisRequest({
  familiaCodigo: '450000'
});

// Resultado:
// {
//   valid: true,
//   data: { familiaCodigo: '450000' }
// }
```

**✅ Sanitização Automática**

```typescript
const result = validateFamiliaInformacoesGeraisRequest({
  familiaCodigo: '  ABC123  '
});

// Resultado:
// {
//   valid: true,
//   data: { familiaCodigo: 'ABC123' } // espaços removidos
// }
```

**❌ Caso Inválido: Campo Vazio**

```typescript
const result = validateFamiliaInformacoesGeraisRequest({});

// Resultado:
// {
//   valid: false,
//   error: 'Código da familia é obrigatório'
// }
```

**❌ Caso Inválido: SQL Injection**

```typescript
const result = validateFamiliaInformacoesGeraisRequest({
  familiaCodigo: "'; DROP TABLE--"
});

// Resultado:
// {
//   valid: false,
//   error: 'Código da familia contém padrões não permitidos'
// }
```

**❌ Caso Inválido: Tamanho Excedido**

```typescript
const result = validateFamiliaInformacoesGeraisRequest({
  familiaCodigo: '123456789' // 9 caracteres
});

// Resultado:
// {
//   valid: false,
//   error: 'Código da familia não pode ter mais de 8 caracteres'
// }
```

**❌ Caso Inválido: Formato Incorreto**

```typescript
const result = validateFamiliaInformacoesGeraisRequest({
  familiaCodigo: 'ABC-123'
});

// Resultado:
// {
//   valid: false,
//   error: 'Código da familia contém caracteres inválidos...'
// }
```

#### Uso no Controller

```typescript
// No controller
const validation = validateFamiliaInformacoesGeraisRequest(req.params);

if (!validation.valid) {
  throw new ValidationError(validation.error);
}

const { familiaCodigo } = validation.data!;
// familiaCodigo está validado e sanitizado
```

---

## Detalhamento das Camadas de Validação

### Camada 1: Validação de Presença

**Verifica:** Campo `familiaCodigo` existe?

**Erro:** `"Código da familia é obrigatório"`

---

### Camada 2: Validação de Tipo

**Verifica:** Campo é do tipo `string`?

**Erro:** `"Código da familia deve ser uma string"`

---

### Camada 3: Sanitização

**Ação:** Remove automaticamente caracteres perigosos

**Função:** `sanitizeFamiliaCodigo()`

---

### Camada 4: Validação Pós-Sanitização

**Verifica:** String não ficou vazia após sanitização?

**Erro:** `"Código da familia inválido ou contém apenas caracteres não permitidos"`

**Motivo:** Se todos os caracteres eram perigosos, a string fica vazia

---

### Camada 5: Validação de Tamanho Máximo

**Verifica:** Comprimento ≤ 8 caracteres?

**Erro:** `"Código da familia não pode ter mais de 8 caracteres"`

**Referência:** Baseado no schema do Progress/Datasul

---

### Camada 6: Validação de Tamanho Mínimo

**Verifica:** Comprimento ≥ 1 caractere?

**Erro:** `"Código da familia não pode estar vazio"`

---

### Camada 7: Validação de Formato (Whitelist)

**Verifica:** Contém apenas `[A-Za-z0-9]`?

**Erro:** `"Código da familia contém caracteres inválidos..."`

**Função:** `isValidFamiliaCodigoFormat()`

---

### Camada 8: Detecção de SQL Injection

**Verifica:** Não contém keywords SQL?

**Keywords Bloqueadas:** SELECT, INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, EXEC, UNION

**Erro:** `"Código da familia contém padrões não permitidos"`

**Nota:** Redundante com prepared statements, mas é uma camada extra de segurança

---

### Camada 9: Detecção de Command Injection

**Verifica:** Não contém padrões de command injection?

**Padrões Bloqueados:** `&&`, `||`, `|`, `` ` ``, `$`, `$(`, `${`

**Erro:** `"Código da familia contém caracteres não permitidos"`

**Motivo:** Previne ataques caso código seja usado em comandos shell

---

## Mensagens de Erro

| Mensagem | Causa | Camada |
|----------|-------|--------|
| `"Código da familia é obrigatório"` | Campo não fornecido | 1 |
| `"Código da familia deve ser uma string"` | Tipo incorreto | 2 |
| `"Código da familia inválido ou contém apenas caracteres não permitidos"` | String vazia pós-sanitização | 4 |
| `"Código da familia não pode ter mais de 8 caracteres"` | Tamanho > 8 | 5 |
| `"Código da familia não pode estar vazio"` | Tamanho < 1 | 6 |
| `"Código da familia contém caracteres inválidos. Use apenas letras, números e caracteres básicos"` | Formato inválido | 7 |
| `"Código da familia contém padrões não permitidos"` | SQL keywords detectadas | 8 |
| `"Código da familia contém caracteres não permitidos"` | Command injection detectada | 9 |

---

## Boas Práticas de Uso

### ✅ SEMPRE Fazer

- Use esta validação **ANTES** de qualquer query
- Confie apenas nos dados retornados em `validation.data`
- Trate erros adequadamente no controller
- Mantenha os logs de tentativas suspeitas

### ❌ NUNCA Fazer

- **NÃO** confie em dados do cliente sem validação
- **NÃO** bypasse esta validação
- **NÃO** use `data.familiaCodigo` diretamente (use `validation.data`)
- **NÃO** desabilite sanitização

---

## Segurança

### Vetores de Ataque Cobertos

| Vetor | Proteção | Exemplo Bloqueado |
|-------|----------|-------------------|
| **SQL Injection** | Keywords + Sanitização | `'; DROP TABLE--` |
| **XSS** | Remoção de tags HTML | `<script>alert()</script>` |
| **Command Injection** | Detecção de padrões shell | `; ls -la && rm -rf` |
| **Path Traversal** | Remoção de `../` e barras | `../../../etc/passwd` |

### Princípios Aplicados

1. **Defense in Depth** - Múltiplas camadas de proteção
2. **Whitelist over Blacklist** - Permite apenas o seguro
3. **Fail Secure** - Em caso de dúvida, bloqueia
4. **Least Privilege** - Aceita apenas o mínimo necessário

---

## Observações Críticas

⚠️ **CRÍTICO:**
- **SEMPRE** use esta validação antes de queries
- **NÃO** confie em dados do cliente
- **NÃO** bypasse esta validação
- Sanitização é **automática** e **obrigatória**

🔒 **SEGURANÇA:**
- Protege contra SQL Injection
- Protege contra XSS
- Protege contra Command Injection
- Protege contra Path Traversal

---

## Manutenção

### Atualizando Validações

Se precisar modificar as regras:

1. Atualize as constantes (`MAX_FAMILIA_CODIGO_LENGTH`, etc.)
2. Adicione/remova keywords em `SQL_KEYWORDS`
3. Adicione/remova padrões em `DANGEROUS_PATTERNS`
4. Teste extensivamente antes de deploy
5. Documente as mudanças

### Testes Recomendados

- Casos válidos (happy path)
- Casos inválidos (cada camada)
- Tentativas de bypass
- Performance (validação deve ser rápida)
- Edge cases (strings vazias, caracteres especiais)