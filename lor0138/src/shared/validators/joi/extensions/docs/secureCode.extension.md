# Documentação - Extensão Joi: secureCode

**Módulo:** `SecureCodeExtension`
**Categoria:** Validators
**Arquivo:** `src/shared/validators/extensions/secureCode.extension.ts`

---

## Visão Geral

Extensão customizada do Joi para validação e sanitização segura de códigos (itens, famílias, estabelecimentos, etc.) com proteção contra múltiplos vetores de ataque.

---

## Propósito

Criar um tipo customizado de validação Joi chamado `secureCode` que:

- ✅ **Sanitiza** automaticamente inputs perigosos
- ✅ **Valida** formato (alfanumérico ou numérico)
- ✅ **Detecta** padrões de SQL Injection
- ✅ **Detecta** padrões de Command Injection
- ✅ **Reutilizável** em múltiplos schemas

---

## Arquitetura

### Fluxo de Validação

```
Input (string)
    ↓
1. coerce() - Sanitização Automática
    ↓
2. validate() - Detecção de Padrões Perigosos
    ↓
3. rules.alphanumeric() ou rules.numeric() - Validação de Formato
    ↓
Output (string sanitizado e validado)
```

### Integração com Joi

```typescript
import Joi from 'joi';
import { secureCodeExtension } from './extensions/secureCode.extension';

// Estende Joi com tipo customizado
const ExtendedJoi = Joi.extend(secureCodeExtension);

// Agora pode usar:
ExtendedJoi.secureCode().alphanumeric().min(1).max(8)
```

---

## Estrutura da Extensão

### Tipo: secureCode

```typescript
{
  type: 'secureCode',        // Nome do tipo customizado
  base: Joi.string(),        // Baseado em string
  messages: { ... },         // Mensagens de erro customizadas
  rules: { ... },            // Regras de validação
  coerce: (value) => { ... }, // Sanitização automática
  validate: (value) => { ... } // Validação de segurança
}
```

---

## Constantes de Segurança

### SQL Keywords Bloqueadas

```typescript
const SQL_KEYWORDS = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'CREATE',
  'ALTER',
  'EXEC',
  'UNION'
];
```

**Propósito:** Detectar tentativas de SQL Injection

**Comportamento:** Case-insensitive (converte para uppercase antes de verificar)

### Padrões Perigosos de Command Injection

```typescript
const DANGEROUS_PATTERNS = [
  '&&',   // Shell AND
  '||',   // Shell OR
  '|',    // Pipe
  '`',    // Backtick (command substitution)
  '$',    // Variable expansion
  '$(',   // Command substitution
  '${'    // Variable substitution
];
```

**Propósito:** Detectar tentativas de Command Injection

---

## Componentes da Extensão

### 1. Messages (Mensagens de Erro)

```typescript
messages: {
  'secureCode.sqlInjection': '{{#label}} contém padrões não permitidos',
  'secureCode.commandInjection': '{{#label}} contém caracteres não permitidos',
  'secureCode.invalidChars': '{{#label}} contém caracteres inválidos',
}
```

**Uso do `{{#label}}`:**
- Substitui pelo nome do campo automaticamente
- Exemplo: `"Código da familia contém padrões não permitidos"`

---

### 2. Rules (Regras de Validação)

#### Rule: alphanumeric

**Propósito:** Valida que string contém apenas letras e números

**Pattern:** `/^[A-Za-z0-9]+$/`

**Uso:**
```typescript
ExtendedJoi.secureCode().alphanumeric()
```

**Validação:**
```typescript
validate(value, helpers) {
  if (!/^[A-Za-z0-9]+$/.test(value)) {
    return helpers.error('secureCode.invalidChars');
  }
  return value;
}
```

**Exemplos:**

| Input | Válido? | Motivo |
|-------|---------|--------|
| `'ABC123'` | ✅ Sim | Apenas letras e números |
| `'450000'` | ✅ Sim | Apenas números |
| `'ABC-123'` | ❌ Não | Hífen não permitido |
| `'A B C'` | ❌ Não | Espaços não permitidos |
| `'A@B'` | ❌ Não | @ não permitido |

---

#### Rule: numeric

**Propósito:** Valida que string contém apenas números

**Pattern:** `/^[0-9]+$/`

**Uso:**
```typescript
ExtendedJoi.secureCode().numeric()
```

**Validação:**
```typescript
validate(value, helpers) {
  if (!/^[0-9]+$/.test(value)) {
    return helpers.error('secureCode.invalidChars');
  }
  return value;
}
```

**Exemplos:**

| Input | Válido? | Motivo |
|-------|---------|--------|
| `'123456'` | ✅ Sim | Apenas números |
| `'001'` | ✅ Sim | Zeros à esquerda OK |
| `'ABC123'` | ❌ Não | Contém letras |
| `'12.34'` | ❌ Não | Contém ponto |
| `'-123'` | ❌ Não | Contém hífen |

---

### 3. Coerce (Sanitização Automática)

**Execução:** ANTES da validação (primeiro passo)

**Propósito:** Limpar automaticamente inputs perigosos

```typescript
coerce(value, helpers) {
  if (typeof value !== 'string') return { value };

  let sanitized = value.trim();
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');  // Remove controle
  sanitized = sanitized.replace(/\.\./g, '');              // Remove path traversal
  sanitized = sanitized.replace(/[\/\\]/g, '');            // Remove barras
  sanitized = sanitized.replace(/[';"\-\-]/g, '');         // Remove SQL chars
  sanitized = sanitized.replace(/<[^>]*>/g, '');           // Remove tags HTML

  return { value: sanitized };
}
```

#### Camadas de Sanitização

| Ordem | Ação | Pattern | Previne |
|-------|------|---------|---------|
| 1 | Trim | `.trim()` | Espaços em branco |
| 2 | Caracteres de controle | `/[\x00-\x1F\x7F]/g` | Null bytes, newlines |
| 3 | Path traversal | `/\.\./g` | `../../etc/passwd` |
| 4 | Barras | `/[\/\\]/g` | Path traversal adicional |
| 5 | Caracteres SQL | `/[';"\-\-]/g` | SQL injection |
| 6 | Tags HTML | `/<[^>]*>/g` | XSS |

#### Exemplos de Sanitização

| Input | Output | Sanitização Aplicada |
|-------|--------|----------------------|
| `'  ABC  '` | `'ABC'` | Trim |
| `'ABC\x00123'` | `'ABC123'` | Remove null byte |
| `'../../../etc'` | `'etc'` | Remove path traversal |
| `'/root/file'` | `'rootfile'` | Remove barras |
| `"ABC'; DROP--"` | `'ABC DROP'` | Remove SQL chars |
| `'<script>alert()</script>'` | `'scriptalert'` | Remove tags |

---

### 4. Validate (Validação de Segurança)

**Execução:** DEPOIS da sanitização e ANTES das rules

**Propósito:** Detectar padrões maliciosos que sobreviveram à sanitização

```typescript
validate(value, helpers) {
  // Detecta SQL Injection
  const upper = value.toUpperCase();
  for (const keyword of SQL_KEYWORDS) {
    if (upper.includes(keyword)) {
      return helpers.error('secureCode.sqlInjection');
    }
  }

  // Detecta Command Injection
  for (const pattern of DANGEROUS_PATTERNS) {
    if (value.includes(pattern)) {
      return helpers.error('secureCode.commandInjection');
    }
  }

  return value;
}
```

#### Detecção de SQL Injection

**Como funciona:**
1. Converte valor para uppercase
2. Verifica se contém alguma keyword SQL
3. Se encontrar, retorna erro `secureCode.sqlInjection`

**Exemplos:**

| Input | Detecta? | Keyword Encontrada |
|-------|----------|-------------------|
| `'SELECT123'` | ✅ Sim | SELECT |
| `'mydrop'` | ✅ Sim | DROP |
| `'UNION'` | ✅ Sim | UNION |
| `'ABC123'` | ❌ Não | Nenhuma |

#### Detecção de Command Injection

**Como funciona:**
1. Verifica se valor contém algum padrão perigoso
2. Se encontrar, retorna erro `secureCode.commandInjection`

**Exemplos:**

| Input | Detecta? | Pattern Encontrado |
|-------|----------|-------------------|
| `'cmd && ls'` | ✅ Sim | && |
| `'test\|grep'` | ✅ Sim | \| |
| `'echo $VAR'` | ✅ Sim | $ |
| `'ABC123'` | ❌ Não | Nenhum |

---

## Uso Completo

### Exemplo Básico

```typescript
import { ExtendedJoi } from '@shared/validators/joi';

const schema = ExtendedJoi.object({
  codigo: ExtendedJoi.secureCode()
    .alphanumeric()
    .min(1)
    .max(8)
    .required()
});

// Teste
const result = schema.validate({ codigo: '  ABC123  ' });
// result.value.codigo = 'ABC123' (sanitizado automaticamente)
```

### Exemplo com Mensagens Customizadas

```typescript
const schema = ExtendedJoi.object({
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

### Exemplo com Numeric

```typescript
const schema = ExtendedJoi.object({
  estabelecimento: ExtendedJoi.secureCode()
    .numeric()  // Apenas números
    .length(3)
    .required()
});
```

---

## Cenários de Teste

### ✅ Casos Válidos

```typescript
// Alfanumérico
'ABC123'     → 'ABC123'
'450000'     → '450000'
'Item001'    → 'Item001'
'  ABC  '    → 'ABC' (sanitizado)

// Numérico
'123'        → '123'
'001'        → '001'
'  456  '    → '456' (sanitizado)
```

### ❌ Casos Inválidos

```typescript
// Formato inválido
'ABC-123'    → Error: secureCode.invalidChars
'A B C'      → Error: secureCode.invalidChars
'A@B'        → Error: secureCode.invalidChars

// SQL Injection
'SELECT123'  → Error: secureCode.sqlInjection
'DROP'       → Error: secureCode.sqlInjection

// Command Injection
'cmd && ls'  → Error: secureCode.commandInjection
'echo $VAR'  → Error: secureCode.commandInjection
```

---

## Vantagens da Extensão

### 1. Reutilização

✅ Define uma vez, usa em todos os schemas

```typescript
// Família
ExtendedJoi.secureCode().alphanumeric().max(8)

// Item
ExtendedJoi.secureCode().alphanumeric().max(16)

// Estabelecimento
ExtendedJoi.secureCode().numeric().length(3)
```

### 2. Sanitização Automática

✅ Não precisa chamar função de sanitização manualmente

```typescript
// Antes (manual)
const sanitized = sanitizeCode(req.params.codigo);

// Depois (automático via coerce)
const { value } = schema.validate(req.params);
// value.codigo já está sanitizado!
```

### 3. Validações em Camadas

✅ Defense in Depth

```
1. Coerce    → Sanitiza
2. Validate  → Detecta padrões maliciosos
3. Rules     → Valida formato
```

### 4. Mensagens Customizáveis

✅ Cada schema pode ter mensagens específicas

```typescript
.messages({
  'secureCode.invalidChars': 'Código da familia deve conter apenas letras e números',
})
```

---

## Comparação: Antes vs Depois

### Antes (Validação Manual)

```typescript
function sanitizeCode(value: string): string {
  let sanitized = value.trim();
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  // ... mais 5 linhas de sanitização
  return sanitized;
}

function validateCode(value: string): boolean {
  if (!/^[A-Za-z0-9]+$/.test(value)) return false;
  // ... mais 10 linhas de validação
  return true;
}

// Uso
const sanitized = sanitizeCode(req.params.codigo);
if (!validateCode(sanitized)) {
  throw new ValidationError('...');
}
```

### Depois (Joi Extension)

```typescript
const schema = ExtendedJoi.object({
  codigo: ExtendedJoi.secureCode().alphanumeric().max(8).required()
});

// Uso
const { value, error } = schema.validate(req.params);
if (error) throw new ValidationError(error.message);
```

**Redução:**
- ❌ ~30 linhas de código
- ✅ 3 linhas de código
- 🚀 90% menos código!

---

## Segurança

### Vetores de Ataque Cobertos

| Vetor | Proteção | Camada |
|-------|----------|--------|
| **SQL Injection** | Detecção de keywords | validate() |
| **XSS** | Remoção de tags HTML | coerce() |
| **Command Injection** | Detecção de padrões | validate() |
| **Path Traversal** | Remoção de `../` | coerce() |
| **Null Bytes** | Remoção de \x00 | coerce() |

### Defense in Depth

1. **Sanitização** (coerce) - Remove caracteres perigosos
2. **Detecção** (validate) - Identifica padrões maliciosos
3. **Whitelist** (rules) - Permite apenas formato seguro

---

## Limitações

### 1. Baseado em String

⚠️ Só funciona com strings

```typescript
// ❌ Não funciona
ExtendedJoi.secureCode().validate(123)

// ✅ Funciona
ExtendedJoi.secureCode().validate('123')
```

### 2. Sanitização Agressiva

⚠️ Remove caracteres que podem ser legítimos

```typescript
// Entrada: "O'Brien"
// Saída: "OBrien" (apóstrofo removido)
```

**Solução:** Para nomes, use validação diferente (não secureCode)

### 3. Case-Insensitive na Detecção

⚠️ Keywords SQL são detectadas independente de case

```typescript
// Todos são bloqueados:
'SELECT', 'select', 'SeLeCt'
```

---

## Manutenção

### Adicionar Nova Keyword SQL

```typescript
const SQL_KEYWORDS = [
  'SELECT',
  'INSERT',
  'TRUNCATE',  // Nova keyword
];
```

### Adicionar Novo Padrão Perigoso

```typescript
const DANGEROUS_PATTERNS = [
  '&&',
  '||',
  ';',  // Novo padrão
];
```

### Criar Nova Rule

```typescript
rules: {
  alphanumeric: { ... },
  numeric: { ... },
  alphanumericWithDash: {  // Nova rule
    validate(value, helpers) {
      if (!/^[A-Za-z0-9\-]+$/.test(value)) {
        return helpers.error('secureCode.invalidChars');
      }
      return value;
    },
  },
},
```

---

## Referências

### Documentação Relacionada

- `joi.md` - Wrapper ExtendedJoi
- `informacoesGerais.validators.md` - Uso em schemas
- [Joi Extensions](https://joi.dev/api/?v=17.9.1#extensions) - Documentação oficial

### Segurança

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [OWASP XSS](https://owasp.org/www-community/attacks/xss/)

---

## Resumo

**Extensão cria:**
- ✅ Tipo customizado `secureCode`
- ✅ Sanitização automática (coerce)
- ✅ Detecção de padrões maliciosos (validate)
- ✅ Rules reutilizáveis (alphanumeric, numeric)
- ✅ Mensagens de erro customizáveis

**Benefícios:**
- 🚀 90% menos código de validação
- 🔒 Segurança em camadas (Defense in Depth)
- ♻️ Reutilizável em múltiplos schemas
- 📝 Mensagens de erro flexíveis
- 🎯 Fácil de manter e estender