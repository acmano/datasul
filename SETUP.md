# Estrutura do Projeto

```
datasul/
├── lordtsapi/                # Backend - API REST
├── lordtsapiSharedTypes/     # Types compartilhados entre backend e frontend
├── lor0138/                  # Frontend - React + Ant Design
└── setup_guide.md           # Guia completo de setup
```

## Desenvolvimento

### Backend (lordtsapi)

```bash
cd lordtsapi
npm run dev          # Desenvolvimento com hot reload
npm run build        # Build produção
npm test             # Testes unitários
npm run test:integration  # Testes de integração
```

### Frontend (lor0138)

```bash
cd lor0138
npm start            # Servidor de desenvolvimento
npm run build        # Build de produção
npm test             # Testes
```

### Shared Types (lordtsapiSharedTypes)

```bash
cd lordtsapiSharedTypes
npm run build       # Compila types
npm run watch       # Watch mode
```

**Importante:** Rode `npm run build` no lordtsapiSharedTypes sempre que modificar types!

### Workflow para Modificar Types

1. Modificar types em `lordtsapiSharedTypes/src/`
2. Build: `cd lordtsapiSharedTypes && npm run build`
3. Types disponíveis automaticamente em lordtsapi e lor0138

## Adicionar Types Compartilhados

### 1. Criar type em lordtsapiSharedTypes

```typescript
// lordtsapiSharedTypes/src/types/entities/item.types.ts
export interface ItemData {
  codigo: string;
  descricao: string;
  // ... outros campos
}
```

### 2. Exportar no index

```typescript
// lordtsapiSharedTypes/src/types/entities/index.ts
export * from './item.types';
```

### 3. Build

```bash
cd lordtsapiSharedTypes
npm run build
```

### 4. Usar nos projetos

**No Backend (lordtsapi):**
```typescript
// lordtsapi/src/item/dadosCadastrais/informacoesGerais/types.ts
import { ItemData } from '@acmano/lordtsapi-shared-types';

const data: ItemData = { ... };
```

**No Frontend (lor0138):**
```typescript
// lor0138/src/modules/item/types.ts
import { ItemData } from '@acmano/lordtsapi-shared-types';

const item: ItemData = { ... };
```

## Git

Cada projeto tem seu repositório:

```bash
# Backend
cd lordtsapi
git init
git remote add origin https://github.com/acmano/lordtsapiBackend.git

# Shared Types
cd lordtsapiSharedTypes
git init
git remote add origin https://github.com/acmano/lordtsapiSharedTypes.git

# Frontend
cd lor0138
git init
git remote add origin <repo-lor0138>
```

## URLs de Produção

- **API**: http://lor0138.lorenzetti.ibe:3001
- **Swagger**: http://lor0138.lorenzetti.ibe:3001/api-docs
- **Health Check**: http://lor0138.lorenzetti.ibe:3001/health
