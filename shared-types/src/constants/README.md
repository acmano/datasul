# Shared Constants

Constantes compartilhadas entre lordtsapi e futuros frontends.

## Database Constants

### Linked Servers

```typescript
import { LINKED_SERVERS } from '@datasul/shared-types';

// Usar em queries
const query = `
  FROM OPENQUERY (${LINKED_SERVERS.PRD_EMS2EMP}, '...')
`;
```

### Tabelas Progress

```typescript
import { PROGRESS_TABLES } from '@datasul/shared-types';

// Tabelas completas (pub.*)
const query = `
  SELECT * FROM ${PROGRESS_TABLES.ITEM}
`;
```

### Helpers

```typescript
import { getProgressColumn, getProgressTable } from '@datasul/shared-types';

// Colunas com aspas
const col = getProgressColumn('it-codigo'); // "it-codigo"

// Tabelas com schema
const table = getProgressTable('item'); // pub.item
```

### Query Config

```typescript
import { QUERY_CONFIG } from '@datasul/shared-types';

// Limites configuráveis
const max = QUERY_CONFIG.MAX_ESTABELECIMENTOS_PARALELO; // 50
const timeout = QUERY_CONFIG.DEFAULT_TIMEOUT; // 30000ms
```

## Vantagens

- ✓ **Single Source of Truth**: Mudar linked server em único lugar
- ✓ **Type-Safe**: TypeScript valida uso correto
- ✓ **Autocomplete**: IDE sugere valores disponíveis
- ✓ **Refactoring**: Renomear funciona automaticamente
- ✓ **Documentação**: JSDoc inline explica cada constante
- ✓ **Manutenção**: Fácil adicionar novos valores

## Migration Guide

### Antes (hardcoded)

```typescript
const query = `
  FROM OPENQUERY (PRD_EMS2EMP, '
    SELECT * FROM pub.item
  ')
`;
```

### Depois (usando constants)

```typescript
import { LINKED_SERVERS, PROGRESS_TABLES } from '@datasul/shared-types';

const query = `
  FROM OPENQUERY (${LINKED_SERVERS.PRD_EMS2EMP}, '
    SELECT * FROM ${PROGRESS_TABLES.ITEM}
  ')
`;
```

## Quando Adicionar Novas Constants

Adicione em `shared-types/src/constants/database.constants.ts` quando:

- ✓ Valor aparece em 2+ lugares
- ✓ Valor pode mudar entre ambientes
- ✓ Valor tem significado de negócio
- ✗ Valor é específico de um único endpoint
