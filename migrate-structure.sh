#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SOURCE="/home/mano/projetos/datasul/_lor0138"
TARGET="/home/mano/projetos/datasul/lor0138"

echo -e "${BLUE}=== Migração de Estrutura LOR0138 ===${NC}\n"

# Verificar se source existe
if [ ! -d "$SOURCE" ]; then
    echo -e "${YELLOW}ERRO: Diretório source não encontrado: $SOURCE${NC}"
    exit 1
fi

echo -e "${BLUE}Criando estrutura do projeto...${NC}"

# Criar estrutura base
mkdir -p "$TARGET"
cd "$TARGET"

# Estrutura de diretórios
mkdir -p src/api/lor0138/{item,familia,grupoDeEstoque,familiaComercial,estabelecimento}/dadosCadastrais/informacoesGerais/{controller,service,repository,routes,validators,types,mappers/{__tests__},docs}
mkdir -p src/api/{test,admin/routes/docs,metrics/docs}
mkdir -p src/config
mkdir -p src/shared/{middlewares/docs,utils/docs,types/{express/docs,docs},constants,exceptions,services/docs,controllers,routes/docs,errors/docs,validators/joi/{extensions/docs,docs}}
mkdir -p src/infrastructure/{database/{connections,config,types},metrics/{helpers,types}}
mkdir -p src/docs
mkdir -p scripts
mkdir -p docs
mkdir -p tests/{unit/api/lor0138/item/dadosCadastrais/informacoesGerais/{repositories,services,validators},integration/api/lor0138/item/dadosCadastrais/informacoesGerais/{controllers,routes},e2e/api/{docs,lor0138/item/dadosCadastrais/informacoesGerais},mocks,helpers,factories,load}
mkdir -p .vscode
mkdir -p files

echo -e "${GREEN}✓ Estrutura criada${NC}"
echo -e "${BLUE}Copiando arquivos raiz...${NC}"

# Copiar arquivos raiz
cp "$SOURCE/package.json" .
cp "$SOURCE/package-lock.json" .
cp "$SOURCE/tsconfig.json" .
cp "$SOURCE/tsconfig.test.json" .
cp "$SOURCE/tsconfig.paths.json" .
cp "$SOURCE/jest.config.ts" .
cp "$SOURCE/.env" .
cp "$SOURCE/.env.example" .
cp "$SOURCE/.env.production.example" .
cp "$SOURCE/.eslintrc.json" .
cp "$SOURCE/.gitignore" .
cp "$SOURCE/.prettierignore" .
cp "$SOURCE/.prettierrc" .
cp "$SOURCE/ARCHITECTURE.md" .
cp "$SOURCE/README.md" .
cp "$SOURCE/ecosystem.config.js" .
cp "$SOURCE/striker.config.json" .
cp "$SOURCE/lor0138.code-workspace" .
cp "$SOURCE/claude.txt" . 2>/dev/null || true
cp "$SOURCE/novosChats.txt" . 2>/dev/null || true
cp "$SOURCE/dashboard-lor0138.json" . 2>/dev/null || true
cp "$SOURCE/response-compressed.json" . 2>/dev/null || true

# Scripts shell raiz
for file in "$SOURCE"/*.sh; do
    [ -f "$file" ] && cp "$file" .
done

# Scripts TypeScript raiz
cp "$SOURCE/test-current-config.ts" . 2>/dev/null || true
cp "$SOURCE/test-config.ts" . 2>/dev/null || true

echo -e "${GREEN}✓ Arquivos raiz copiados${NC}"
echo -e "${BLUE}Copiando src/api/lor0138...${NC}"

# src/api/lor0138/item
cp -r "$SOURCE/src/api/lor0138/item/dadosCadastrais/informacoesGerais/"* src/api/lor0138/item/dadosCadastrais/informacoesGerais/

# src/api/lor0138/familia
cp -r "$SOURCE/src/api/lor0138/familia/dadosCadastrais/informacoesGerais/"* src/api/lor0138/familia/dadosCadastrais/informacoesGerais/

# src/api/lor0138/grupoDeEstoque
cp -r "$SOURCE/src/api/lor0138/grupoDeEstoque/dadosCadastrais/informacoesGerais/"* src/api/lor0138/grupoDeEstoque/dadosCadastrais/informacoesGerais/

# src/api/lor0138/familiaComercial
cp -r "$SOURCE/src/api/lor0138/familiaComercial/dadosCadastrais/informacoesGerais/"* src/api/lor0138/familiaComercial/dadosCadastrais/informacoesGerais/

# src/api/lor0138/estabelecimento
cp -r "$SOURCE/src/api/lor0138/estabelecimento/dadosCadastrais/informacoesGerais/"* src/api/lor0138/estabelecimento/dadosCadastrais/informacoesGerais/

echo -e "${GREEN}✓ APIs lor0138 copiadas${NC}"
echo -e "${BLUE}Copiando src/api outras pastas...${NC}"

# src/api outras pastas
cp -r "$SOURCE/src/api/test/"* src/api/test/ 2>/dev/null || true
cp -r "$SOURCE/src/api/admin/"* src/api/admin/ 2>/dev/null || true
cp -r "$SOURCE/src/api/metrics/"* src/api/metrics/ 2>/dev/null || true

echo -e "${GREEN}✓ Outras APIs copiadas${NC}"
echo -e "${BLUE}Copiando src/config...${NC}"

# src/config
cp "$SOURCE/src/config/"*.ts src/config/

echo -e "${GREEN}✓ Config copiado${NC}"
echo -e "${BLUE}Copiando src/shared...${NC}"

# src/shared
cp "$SOURCE/src/shared/middlewares/"*.ts src/shared/middlewares/ 2>/dev/null || true
cp -r "$SOURCE/src/shared/middlewares/docs/"* src/shared/middlewares/docs/ 2>/dev/null || true
cp "$SOURCE/src/shared/utils/"*.ts src/shared/utils/ 2>/dev/null || true
cp -r "$SOURCE/src/shared/utils/docs/"* src/shared/utils/docs/ 2>/dev/null || true
cp "$SOURCE/src/shared/types/"*.ts src/shared/types/ 2>/dev/null || true
cp -r "$SOURCE/src/shared/types/docs/"* src/shared/types/docs/ 2>/dev/null || true
cp "$SOURCE/src/shared/types/express/"*.ts src/shared/types/express/ 2>/dev/null || true
cp -r "$SOURCE/src/shared/types/express/docs/"* src/shared/types/express/docs/ 2>/dev/null || true
cp "$SOURCE/src/shared/services/"*.ts src/shared/services/ 2>/dev/null || true
cp -r "$SOURCE/src/shared/services/docs/"* src/shared/services/docs/ 2>/dev/null || true
cp "$SOURCE/src/shared/controllers/"*.ts src/shared/controllers/ 2>/dev/null || true
cp "$SOURCE/src/shared/routes/"*.ts src/shared/routes/ 2>/dev/null || true
cp -r "$SOURCE/src/shared/routes/docs/"* src/shared/routes/docs/ 2>/dev/null || true
cp "$SOURCE/src/shared/errors/"*.ts src/shared/errors/ 2>/dev/null || true
cp -r "$SOURCE/src/shared/errors/docs/"* src/shared/errors/docs/ 2>/dev/null || true
cp "$SOURCE/src/shared/validators/"*.ts src/shared/validators/ 2>/dev/null || true
cp "$SOURCE/src/shared/validators/joi/"*.ts src/shared/validators/joi/ 2>/dev/null || true
cp -r "$SOURCE/src/shared/validators/joi/docs/"* src/shared/validators/joi/docs/ 2>/dev/null || true
cp "$SOURCE/src/shared/validators/joi/extensions/"*.ts src/shared/validators/joi/extensions/ 2>/dev/null || true
cp -r "$SOURCE/src/shared/validators/joi/extensions/docs/"* src/shared/validators/joi/extensions/docs/ 2>/dev/null || true

echo -e "${GREEN}✓ Shared copiado${NC}"
echo -e "${BLUE}Copiando src/infrastructure...${NC}"

# src/infrastructure
cp "$SOURCE/src/infrastructure/database/"*.ts src/infrastructure/database/ 2>/dev/null || true
cp "$SOURCE/src/infrastructure/database/connections/"*.ts src/infrastructure/database/connections/ 2>/dev/null || true
cp "$SOURCE/src/infrastructure/database/config/"*.ts src/infrastructure/database/config/ 2>/dev/null || true
cp "$SOURCE/src/infrastructure/database/types/"*.ts src/infrastructure/database/types/ 2>/dev/null || true
cp "$SOURCE/src/infrastructure/metrics/"*.ts src/infrastructure/metrics/ 2>/dev/null || true
cp "$SOURCE/src/infrastructure/metrics/helpers/"*.ts src/infrastructure/metrics/helpers/ 2>/dev/null || true
cp "$SOURCE/src/infrastructure/metrics/types/"*.ts src/infrastructure/metrics/types/ 2>/dev/null || true

echo -e "${GREEN}✓ Infrastructure copiado${NC}"
echo -e "${BLUE}Copiando src raiz e docs...${NC}"

# src raiz
cp "$SOURCE/src/server.ts" src/
cp "$SOURCE/src/app.ts" src/

# src/docs
cp -r "$SOURCE/src/docs/"* src/docs/ 2>/dev/null || true

# docs
cp -r "$SOURCE/docs/"* docs/ 2>/dev/null || true

echo -e "${GREEN}✓ Docs copiados${NC}"
echo -e "${BLUE}Copiando tests...${NC}"

# tests
cp -r "$SOURCE/tests/"* tests/ 2>/dev/null || true

echo -e "${GREEN}✓ Tests copiados${NC}"
echo -e "${BLUE}Copiando configurações IDE...${NC}"

# .vscode
cp -r "$SOURCE/.vscode/"* .vscode/ 2>/dev/null || true

echo -e "${GREEN}✓ IDE configs copiados${NC}"
echo -e "${BLUE}Instalando dependências...${NC}"

npm install

echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}✓ Migração completa!${NC}"
echo -e "${GREEN}=====================================${NC}\n"
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. cd $TARGET"
echo "2. npm test"
echo "3. npm run dev"
echo ""
