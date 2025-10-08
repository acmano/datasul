#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

DATASUL_ROOT="/home/mano/projetos/datasul"
SOURCE="$DATASUL_ROOT/_lor0138"
TARGET_API="$DATASUL_ROOT/lordtsapi"
SHARED_TYPES="$DATASUL_ROOT/shared-types"

echo -e "${BLUE}=== Setup LordtsAPI + Shared Types ===${NC}\n"

# Verificar source
if [ ! -d "$SOURCE" ]; then
    echo -e "${YELLOW}ERRO: $SOURCE não encontrado${NC}"
    exit 1
fi

cd "$DATASUL_ROOT"

# 1. Copiar _lor0138 para lordtsapi
echo -e "${BLUE}1. Criando lordtsapi...${NC}"
mkdir -p "$TARGET_API"

# Copiar estrutura completa (exceto logs, node_modules, cache)
echo -e "   Copiando arquivos..."
rsync -av --exclude='node_modules' \
          --exclude='dist' \
          --exclude='logs/*.log' \
          --exclude='load-results' \
          --exclude='reports' \
          --exclude='.env' \
          "$SOURCE/" "$TARGET_API/"

# Copiar .env.example como template
cp "$SOURCE/.env.example" "$TARGET_API/.env.example"

echo -e "${GREEN}   ✓ lordtsapi criado${NC}"

# 2. Criar shared-types
echo -e "${BLUE}2. Criando shared-types...${NC}"
mkdir -p "$SHARED_TYPES/src"/{types/{api,entities},constants,validators/schemas,enums,utils}

# package.json do shared-types
cat > "$SHARED_TYPES/package.json" << 'EOF'
{
  "name": "@datasul/shared-types",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "joi": "^17.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
EOF

# tsconfig.json do shared-types
cat > "$SHARED_TYPES/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# index.ts principal
cat > "$SHARED_TYPES/src/index.ts" << 'EOF'
// Types
export * from './types';

// Constants
export * from './constants';

// Validators (schemas Joi compartilhados)
export * from './validators';

// Enums
export * from './enums';

// Utils (funções puras)
export * from './utils';
EOF

# Barrel exports
cat > "$SHARED_TYPES/src/types/index.ts" << 'EOF'
// Re-export all types
export * from './api';
export * from './entities';
EOF

mkdir -p "$SHARED_TYPES/src/types/api"
cat > "$SHARED_TYPES/src/types/api/index.ts" << 'EOF'
// API Request/Response types
// Exemplo:
// export * from './item.types';
// export * from './familia.types';
EOF

mkdir -p "$SHARED_TYPES/src/types/entities"
cat > "$SHARED_TYPES/src/types/entities/index.ts" << 'EOF'
// Domain entities
EOF

cat > "$SHARED_TYPES/src/constants/index.ts" << 'EOF'
// Shared constants
// Exemplo:
// export const API_VERSION = 'v1';
// export const MAX_PAGE_SIZE = 100;
EOF

cat > "$SHARED_TYPES/src/validators/index.ts" << 'EOF'
// Shared validators (Joi schemas)
EOF

cat > "$SHARED_TYPES/src/enums/index.ts" << 'EOF'
// Shared enums
EOF

cat > "$SHARED_TYPES/src/utils/index.ts" << 'EOF'
// Shared pure functions
EOF

# README
cat > "$SHARED_TYPES/README.md" << 'EOF'
# @datasul/shared-types

Types, constants, validators e utils compartilhados entre:
- lordtsapi (backend)
- lor0138 (frontend - futuro)
- Outros frontends

## Estrutura

```
src/
├── types/
│   ├── api/          # Request/Response types
│   └── entities/     # Domain entities
├── constants/        # Constantes compartilhadas
├── validators/       # Joi schemas
├── enums/           # Enums
└── utils/           # Funções puras
```

## Uso

```typescript
// Em lordtsapi ou frontends
import { ItemType, API_VERSION } from '@datasul/shared-types';
```

## Build

```bash
npm run build        # Compila para dist/
npm run watch       # Watch mode
```
EOF

echo -e "${GREEN}   ✓ shared-types criado${NC}"

# 3. Configurar path dependency no lordtsapi
echo -e "${BLUE}3. Configurando dependencies...${NC}"

# Adicionar shared-types ao package.json do lordtsapi
node << 'NODEJS'
const fs = require('fs');
const path = require('path');

const pkgPath = '/home/mano/projetos/datasul/lordtsapi/package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Adicionar dependency
if (!pkg.dependencies) pkg.dependencies = {};
pkg.dependencies['@datasul/shared-types'] = 'file:../shared-types';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('   ✓ Dependency adicionada ao lordtsapi');
NODEJS

# Atualizar tsconfig.json do lordtsapi para incluir paths
node << 'NODEJS'
const fs = require('fs');
const tsconfigPath = '/home/mano/projetos/datasul/lordtsapi/tsconfig.json';
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

if (!tsconfig.compilerOptions.paths) {
  tsconfig.compilerOptions.paths = {};
}
tsconfig.compilerOptions.paths['@datasul/shared-types'] = ['../shared-types/src'];
tsconfig.compilerOptions.paths['@datasul/shared-types/*'] = ['../shared-types/src/*'];

fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
console.log('   ✓ Paths configurados no tsconfig');
NODEJS

echo -e "${GREEN}   ✓ Dependencies configuradas${NC}"

# 4. Instalar dependências
echo -e "${BLUE}4. Instalando dependências...${NC}"

cd "$SHARED_TYPES"
npm install

cd "$TARGET_API"
npm install

echo -e "${GREEN}   ✓ Dependências instaladas${NC}"

# 5. Criar .gitignore no shared-types
cat > "$SHARED_TYPES/.gitignore" << 'EOF'
node_modules/
dist/
*.log
.DS_Store
EOF

# 6. Documentação de uso
cat > "$DATASUL_ROOT/SETUP.md" << 'EOF'
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
EOF

echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}✓ Setup completo!${NC}"
echo -e "${GREEN}=====================================${NC}\n"

echo -e "${BLUE}Estrutura criada:${NC}"
echo "  $TARGET_API/"
echo "  $SHARED_TYPES/"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. cd lordtsapi"
echo "2. cp .env.example .env (configurar variáveis)"
echo "3. npm run build"
echo "4. npm run dev"
echo ""
echo -e "${BLUE}Documentação:${NC}"
echo "  $DATASUL_ROOT/SETUP.md"
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC}"
echo "  • Sempre buildar shared-types após modificações: cd shared-types && npm run build"
echo "  • Path dependency sincroniza automaticamente"
echo ""
