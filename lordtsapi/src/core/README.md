# Core - Lógica de Negócio Pura

## 📋 Responsabilidade

A camada **Core** contém **lógica de negócio pura** que não depende de nenhuma tecnologia, framework ou biblioteca externa. São funções e utilitários que implementam regras de negócio fundamentais do domínio.

**Princípio chave:** Zero dependências externas. Apenas TypeScript puro.

## ✅ O que esta camada PODE fazer

- ✅ Validar códigos de item (formato, tamanho, caracteres permitidos)
- ✅ Manipular strings (trim, normalize, format)
- ✅ Implementar type guards para validação de tipos
- ✅ Validar regras de negócio puras (ex: código não pode ter espaços)
- ✅ Funções matemáticas ou de formatação
- ✅ Constantes de negócio (ex: tamanhos máximos, caracteres permitidos)

## ❌ O que esta camada NÃO PODE fazer

- ❌ Importar Express, Joi, ou qualquer framework
- ❌ Acessar banco de dados
- ❌ Fazer chamadas HTTP
- ❌ Usar logger (Winston)
- ❌ Acessar variáveis de ambiente
- ❌ Importar de @infrastructure, @shared, @presentation
- ❌ Usar classes (preferir funções puras)

## 📁 Estrutura

```
src/core/
├── validators/
│   └── codeValidators.ts    # Validações de códigos (item, família, etc)
├── utils/
│   ├── stringUtils.ts       # Manipulação de strings
│   └── typeGuards.ts        # Type guards TypeScript
└── README.md
```

## 💡 Exemplos

### ✅ BOM - Validação Pura

```typescript
// src/core/validators/codeValidators.ts

/**
 * Valida formato de código de item
 * @pure - Sem side effects, sem dependências externas
 */
export function isValidItemCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  const trimmed = code.trim();

  // Regras de negócio puras
  if (trimmed.length === 0 || trimmed.length > 16) {
    return false;
  }

  // Apenas caracteres alfanuméricos e hífen
  const validPattern = /^[A-Z0-9-]+$/;
  return validPattern.test(trimmed);
}

/**
 * Normaliza código para formato padrão
 * @pure - Sempre retorna mesmo resultado para mesma entrada
 */
export function normalizeItemCode(code: string): string {
  return code.trim().toUpperCase();
}
```

### ✅ BOM - Type Guard Puro

```typescript
// src/core/utils/typeGuards.ts

/**
 * Verifica se valor é string não-vazia
 * @pure - Type guard TypeScript puro
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Verifica se valor é número positivo
 * @pure
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}
```

### ❌ RUIM - Dependências Externas

```typescript
// ❌ NÃO FAÇA ISSO EM CORE

import Joi from 'joi'; // ❌ Dependência externa
import { log } from '@shared/utils/logger'; // ❌ Infraestrutura

export function validateItemCode(code: string): boolean {
  // ❌ Usando Joi em vez de lógica pura
  const schema = Joi.string().max(16).required();
  const result = schema.validate(code);

  // ❌ Usando logger
  log.debug('Validating code', { code });

  return !result.error;
}
```

### ✅ BOM - String Utils Puros

```typescript
// src/core/utils/stringUtils.ts

/**
 * Remove espaços extras e normaliza string
 * @pure - Sem dependências, sem side effects
 */
export function normalizeWhitespace(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Trunca string mantendo integridade de palavras
 * @pure
 */
export function truncateWords(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;

  const truncated = str.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}
```

## 🔗 Dependências

### Dependências Permitidas

- ✅ **Nenhuma!** Core é independente de tudo.
- ✅ Apenas TypeScript built-in types

### Camadas que podem importar Core

- ✅ **domain** → Core
- ✅ **application** → Core
- ✅ **presentation** → Core
- ✅ **infrastructure** → Core
- ✅ **shared** → Core

### Camadas que Core NÃO pode importar

- ❌ Core → domain
- ❌ Core → application
- ❌ Core → presentation
- ❌ Core → infrastructure
- ❌ Core → shared

## 📊 Diagrama de Dependências

```
┌─────────────────────────────────────┐
│         presentation                │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│         application                 │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│           domain                    │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│            core         ◄───────────┼─── Todas as camadas
│    (Lógica Pura)                    │    podem importar
└─────────────────────────────────────┘
             ▲
             │
        Zero imports
```

## 🎯 Boas Práticas

### ✅ DO

1. **Funções puras** - Mesma entrada = mesma saída
2. **Sem side effects** - Não modifica estado externo
3. **Testável facilmente** - Sem mocks necessários
4. **Documentação clara** - JSDoc com exemplos
5. **Tipos fortes** - Evitar `any`, usar generics quando apropriado
6. **Naming descritivo** - `isValidItemCode` melhor que `validate`

### ❌ DON'T

1. ❌ Importar bibliotecas externas (Joi, lodash, etc)
2. ❌ Usar classes (preferir funções)
3. ❌ Acessar variáveis de ambiente
4. ❌ Fazer I/O (leitura de arquivos, HTTP, DB)
5. ❌ Usar console.log (nem mesmo para debug)
6. ❌ Depender de outras camadas

## 🧪 Testabilidade

Core é a camada **mais fácil de testar**:

```typescript
// __tests__/codeValidators.test.ts

import { isValidItemCode, normalizeItemCode } from '../codeValidators';

describe('isValidItemCode', () => {
  it('aceita código válido', () => {
    expect(isValidItemCode('ITEM-001')).toBe(true);
    expect(isValidItemCode('ABC123')).toBe(true);
  });

  it('rejeita código inválido', () => {
    expect(isValidItemCode('')).toBe(false);
    expect(isValidItemCode('   ')).toBe(false);
    expect(isValidItemCode('ITEM 001')).toBe(false); // espaço
    expect(isValidItemCode('x'.repeat(17))).toBe(false); // > 16 chars
  });
});

// ✅ Sem mocks necessários!
// ✅ Testes rápidos (milissegundos)
// ✅ 100% determinístico
```

## 📚 Referências

### Conceitos

- **Pure Functions** - Função sem side effects
- **Type Guards** - Narrowing de tipos TypeScript
- **Business Logic** - Regras fundamentais do domínio
- **Zero Dependencies** - Código independente de frameworks

### Leitura Recomendada

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell)
- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

### Arquivos Relacionados

- `src/domain/` - Usa validações de Core
- `src/application/` - Usa type guards de Core
- `tsconfig.json` - Path alias @core/*

---

**Última atualização:** 2025-10-20
**Camada:** Core (Zero Dependencies)
**Princípio:** Lógica de negócio pura, sem dependências externas
