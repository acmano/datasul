# Documentação - ExtendedJoi Wrapper

**Módulo:** `ExtendedJoi`
**Categoria:** Validators
**Arquivo:** `src/shared/validators/joi.ts`

---

## Visão Geral

Wrapper que estende o Joi padrão com tipos customizados de validação, atualmente incluindo o tipo `secureCode` para validação segura de códigos.

---

## Propósito

Fornecer um ponto central de importação para:
- ✅ **ExtendedJoi** - Joi com extensões customizadas
- ✅ **Joi** - Joi original (sem extensões)

---

## Exports

### ExtendedJoi

**Tipo:** `Joi.Root & SecureCodeExtension`

**Uso:** Validações que precisam do tipo `secureCode`

**Exemplo:**
```typescript
import { ExtendedJoi } from '@shared/validators/joi';

const schema = ExtendedJoi.object({
  codigo: ExtendedJoi.secureCode().alphanumeric().max(8)
});
```

### Joi

**Tipo:** `Joi.Root` (original)

**Uso:** Validações padrão sem extensões customizadas

**Exemplo:**
```typescript
import { Joi } from '@shared/validators/joi';

const schema = Joi.object({
  email: Joi.string().email(),
  idade: Joi.number().min(18)
});
```

---

## Quando Usar Cada Um?

### Use ExtendedJoi quando:

✅ Validar **códigos** (items, famílias, estabelecimentos)
✅ Precisar de **sanitização automática**
✅ Precisar de **detecção de SQL/Command Injection**
✅ Usar rules customizadas (`.alphanumeric()`, `.numeric()`)

**Exemplos:**
```typescript
// Código de família
ExtendedJoi.secureCode().alphanumeric().max(8)

// Código de item
ExtendedJoi.secureCode().alphanumeric().max(16)

// Código de estabelecimento
ExtendedJoi.secureCode().numeric().length(3)
```

### Use Joi (original) quando:

✅ Validar **dados comuns** (email, números, datas)
✅ **Não** precisar de sanitização de segurança
✅ Usar apenas tipos padrão do Joi

**Exemplos:**
```typescript
// Email
Joi.string().email()

// Número
Joi.number().min(0).max(100)

// Data
Joi.date().iso()

// Boolean
Joi.boolean()
```

---

## Estrutura do Arquivo

```typescript
import Joi from 'joi';
import { secureCodeExtension } from './extensions/secureCode.extension';

// ExtendedJoi = Joi + secureCodeExtension
export const ExtendedJoi = Joi.extend(secureCodeExtension);

// Joi original também disponível
export { Joi };
```

---

## Exemplos de Uso

### Exemplo 1: Schema com ExtendedJoi

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
      'secureCode.invalidChars': 'Código deve conter apenas letras e números',
    }),
});
```

### Exemplo 2: Schema Misto (ExtendedJoi + Joi)

```typescript
import { ExtendedJoi, Joi } from '@shared/validators/joi';

export const userSchema = ExtendedJoi.object({
  // Usa ExtendedJoi para código
  userCode: ExtendedJoi.secureCode()
    .alphanumeric()
    .max(10)
    .required(),

  // Usa Joi para email
  email: Joi.string()
    .email()
    .required(),

  // Usa Joi para idade
  idade: Joi.number()
    .min(18)
    .max(120)
    .required(),
});
```

### Exemplo 3: Apenas Joi (Sem Extensões)

```typescript
import { Joi } from '@shared/validators/joi';

export const configSchema = Joi.object({
  timeout: Joi.number().min(1000).max(60000),
  retries: Joi.number().min(0).max(5),
  enabled: Joi.boolean().default(true),
});
```

---

## Vantagens da Abordagem

### 1. Importação Única

✅ Um único arquivo de importação

```typescript
// ✅ Bom
import { ExtendedJoi } from '@shared/validators/joi';

// ❌ Ruim (antes)
import Joi from 'joi';
import { secureCodeExtension } from './extensions/secureCode.extension';
const ExtendedJoi = Joi.extend(secureCodeExtension);
```

### 2. Flexibilidade

✅ Pode usar ambos no mesmo arquivo

```typescript
import { ExtendedJoi, Joi } from '@shared/validators/joi';

// ExtendedJoi para códigos
const codigoSchema = ExtendedJoi.secureCode().max(8);

// Joi para outros campos
const emailSchema = Joi.string().email();
```

### 3. Manutenibilidade

✅ Adicionar novas extensões em um único lugar

```typescript
// Futuramente adicionar mais extensões
import { secureCodeExtension } from './extensions/secureCode.extension';
import { customDateExtension } from './extensions/customDate.extension';

export const ExtendedJoi = Joi
  .extend(secureCodeExtension)
  .extend(customDateExtension);
```

---

## Extensões Disponíveis

### secureCode

**Descrição:** Validação segura de códigos com sanitização e detecção de padrões maliciosos

**Rules:**
- `.alphanumeric()` - Apenas letras e números
- `.numeric()` - Apenas números

**Recursos:**
- Sanitização automática (coerce)
- Detecção de SQL Injection
- Detecção de Command Injection

**Uso:**
```typescript
ExtendedJoi.secureCode().alphanumeric().max(8)
```

**Documentação:** Ver `secureCode.extension.md`

---

## Como Adicionar Nova Extensão

### 1. Criar Arquivo da Extensão

```typescript
// src/shared/validators/extensions/myCustom.extension.ts
export const myCustomExtension: Joi.Extension = {
  type: 'myCustom',
  base: Joi.string(),
  // ... implementação
};
```

### 2. Importar e Estender no joi.ts

```typescript
import { secureCodeExtension } from './extensions/secureCode.extension';
import { myCustomExtension } from './extensions/myCustom.extension';

export const ExtendedJoi = Joi
  .extend(secureCodeExtension)
  .extend(myCustomExtension);  // Nova extensão
```

### 3. Usar a Nova Extensão

```typescript
import { ExtendedJoi } from '@shared/validators/joi';

const schema = ExtendedJoi.object({
  field: ExtendedJoi.myCustom()  // Novo tipo disponível
});
```

---

## TypeScript Support

### Tipos Inferidos Automaticamente

```typescript
import { ExtendedJoi } from '@shared/validators/joi';

const schema = ExtendedJoi.object({
  codigo: ExtendedJoi.secureCode().alphanumeric().max(8).required()
});

// TypeScript infere tipo automaticamente
type SchemaType = typeof schema;
// { codigo: string }
```

### Validação com Tipos

```typescript
import { ExtendedJoi } from '@shared/validators/joi';

interface FamiliaParams {
  familiaCodigo: string;
}

const schema: Joi.ObjectSchema<FamiliaParams> = ExtendedJoi.object({
  familiaCodigo: ExtendedJoi.secureCode().alphanumeric().max(8).required()
});
```

---

## Comparação: Imports

### Antes (Sem Wrapper)

```typescript
// Cada arquivo precisava fazer isso:
import Joi from 'joi';
import { secureCodeExtension } from '@shared/validators/extensions/secureCode.extension';

const ExtendedJoi = Joi.extend(secureCodeExtension);

// Agora pode usar ExtendedJoi
```

**Problemas:**
- ❌ Repetição em todos os arquivos
- ❌ Propenso a erros (esquecer de estender)
- ❌ Difícil de manter

### Depois (Com Wrapper)

```typescript
// Simples e direto:
import { ExtendedJoi } from '@shared/validators/joi';

// Pronto para usar!
```

**Benefícios:**
- ✅ Uma linha de import
- ✅ Sem repetição
- ✅ Centralizado
- ✅ Fácil de manter

---

## Padrão de Uso Recomendado

### Para Validators de Rotas

```typescript
// src/api/.../validators/myResource.validators.ts
import { ExtendedJoi } from '@shared/validators/joi';

export const myResourceParamsSchema = ExtendedJoi.object({
  codigo: ExtendedJoi.secureCode().alphanumeric().max(8).required()
});
```

### Para Validators de Body

```typescript
// src/api/.../validators/myResource.validators.ts
import { ExtendedJoi, Joi } from '@shared/validators/joi';

export const myResourceBodySchema = ExtendedJoi.object({
  // Códigos usam ExtendedJoi
  codigo: ExtendedJoi.secureCode().alphanumeric().max(8),

  // Outros campos usam Joi
  nome: Joi.string().min(3).max(100),
  ativo: Joi.boolean().default(true),
  preco: Joi.number().min(0),
});
```

---

## Referências

### Documentação Relacionada

- `secureCode.extension.md` - Extensão de validação segura
- `informacoesGerais.validators.md` - Exemplo de uso em schemas
- [Joi Documentation](https://joi.dev/api/) - Documentação oficial
- [Joi Extensions](https://joi.dev/api/?v=17.9.1#extensions) - Como criar extensões

### Arquivos do Projeto

```
src/shared/validators/
├── joi.ts                              # Este arquivo (wrapper)
├── extensions/
│   └── secureCode.extension.ts        # Extensão secureCode
└── schemas/
    └── familia.validators.ts           # Usa ExtendedJoi
```

---

## Manutenção

### Adicionar Nova Extensão

1. Criar arquivo em `extensions/`
2. Importar no `joi.ts`
3. Adicionar ao `.extend()`
4. Documentar uso

### Remover Extensão

1. Remover do `.extend()`
2. Remover import
3. Atualizar documentação
4. Verificar usos no projeto

### Atualizar Joi

```bash
npm update joi
```

Testar se extensões ainda funcionam após update.

---

## Resumo

**O que é:**
- Wrapper que estende Joi com tipos customizados

**Exports:**
- `ExtendedJoi` - Joi + extensões customizadas
- `Joi` - Joi original (sem extensões)

**Quando usar:**
- `ExtendedJoi` → Para códigos e validações com segurança
- `Joi` → Para validações padrão (email, número, data)

**Vantagens:**
- ✅ Importação única
- ✅ Flexível (pode usar ambos)
- ✅ Fácil de estender
- ✅ Centralizado