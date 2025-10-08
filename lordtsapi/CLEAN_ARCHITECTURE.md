# Clean Architecture - Estrutura de Pastas

## Nova Estrutura

```
src/
├── item/dadosCadastrais/informacoesGerais/
│   ├── controller.ts          # Controller
│   ├── service.ts             # Business logic
│   ├── repository.ts          # Data access
│   ├── routes.ts              # Route definitions
│   ├── types.ts               # TypeScript types
│   ├── validators.ts          # Joi schemas
│   ├── mappers/               # Data transformers (opcional)
│   ├── docs/                  # Documentation (opcional)
│   └── __tests__/            # Tests
│
├── familia/dadosCadastrais/informacoesGerais/
│   ├── controller.ts
│   ├── service.ts
│   ├── repository.ts
│   ├── routes.ts
│   ├── types.ts
│   └── validators.ts
│
└── ... (outros endpoints)
```

## Antes vs Depois

### ANTES (Pastas + Sufixos)

```
familia/dadosCadastrais/informacoesGerais/
├── controller/
│   └── informacoesGerais.controller.ts    ❌ Redundante
├── service/
│   └── informacoesGerais.service.ts       ❌ Redundante
├── repository/
│   └── informacoesGerais.repository.ts    ❌ Redundante
└── ... etc
```

**Imports:**
```typescript
import { X } from './controller/informacoesGerais.controller';
```

### DEPOIS (Clean Architecture)

```
familia/dadosCadastrais/informacoesGerais/
├── controller.ts      ✅ Limpo
├── service.ts         ✅ Limpo
├── repository.ts      ✅ Limpo
└── ... etc
```

**Imports:**
```typescript
import { X } from './controller';
```

## Princípios

1. **Caminho identifica o domínio** - `familia/dadosCadastrais/informacoesGerais/`
2. **Nome do arquivo identifica a camada** - `controller.ts`, `service.ts`
3. **Sem redundância** - Não repetir "informacoesGerais" no nome do arquivo
4. **Flat quando possível** - Arquivos na raiz do endpoint

## Vantagens

- ✓ Menos níveis de pasta
- ✓ Imports mais curtos
- ✓ Fácil navegação
- ✓ Padrão Clean Architecture/DDD
- ✓ IDE autocomplete melhor

## Criando Novos Endpoints

```bash
# Estrutura mínima
mkdir -p src/novaEntidade/categoria/subcategoria
cd src/novaEntidade/categoria/subcategoria

# Arquivos
touch controller.ts
touch service.ts
touch repository.ts
touch routes.ts
touch types.ts
touch validators.ts
```

## Classes/Exports

Mesmo sem sufixo no arquivo, mantenha nomes descritivos nas classes:

```typescript
// controller.ts
export class InformacoesGeraisController { }

// service.ts
export class InformacoesGeraisService { }

// repository.ts
export class InformacoesGeraisRepository { }
```

**Rationale:** O caminho dá contexto, a classe dá especificidade.
