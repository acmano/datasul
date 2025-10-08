# Estrutura do Projeto

```
datasul/
├── lordtsapi/          # Backend - API REST
├── shared-types/       # Types compartilhados
├── lor0138/            # Frontend 1 (futuro)
└── outros frontends/   # (futuros)
```

## Desenvolvimento

### Backend (lordtsapi)

```bash
cd lordtsapi
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm test            # Testes
```

### Shared Types

```bash
cd shared-types
npm run build       # Compila types
npm run watch      # Watch mode
```

**Importante:** Rode `npm run build` no shared-types sempre que modificar types!

### Workflow

1. Modificar types em `shared-types/src/`
2. Build: `cd shared-types && npm run build`
3. Types disponíveis automaticamente em lordtsapi

## Adicionar Types Compartilhados

### 1. Criar type em shared-types

```typescript
// shared-types/src/types/api/item.types.ts
export interface ItemResponse {
  id: string;
  nome: string;
}
```

### 2. Exportar no index

```typescript
// shared-types/src/types/api/index.ts
export * from './item.types';
```

### 3. Build

```bash
cd shared-types
npm run build
```

### 4. Usar em lordtsapi

```typescript
// lordtsapi/src/api/lor0138/item/.../controller.ts
import { ItemResponse } from '@datasul/shared-types';

const data: ItemResponse = { ... };
```

## Futuros Frontends

Para adicionar novo frontend:

```bash
cd datasul
npx create-react-app lor0138
cd lor0138
npm install file:../shared-types
```

Depois usar:
```typescript
import { ItemResponse } from '@datasul/shared-types';
```

## Git

Cada projeto tem seu repositório:

```bash
# Backend
cd lordtsapi
git init
git remote add origin <repo-lordtsapi>

# Shared Types
cd shared-types
git init
git remote add origin <repo-shared-types>

# Frontend (futuro)
cd lor0138
git init
git remote add origin <repo-lor0138>
```
