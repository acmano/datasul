#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

DATASUL_ROOT="/home/mano/projetos/datasul"
SHARED_TYPES="$DATASUL_ROOT/lordtsapiSharedTypes"

echo -e "${BLUE}=== Setup LordtsAPI + Shared Types ===${NC}\n"

cd "$DATASUL_ROOT"

# 1. Verificar estrutura existente
echo -e "${BLUE}1. Verificando estrutura...${NC}"

if [ ! -d "lordtsapi" ]; then
    echo -e "${YELLOW}ERRO: lordtsapi não encontrado${NC}"
    exit 1
fi

if [ ! -d "lordtsapiSharedTypes" ]; then
    echo -e "${YELLOW}ERRO: lordtsapiSharedTypes não encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}   ✓ Estrutura verificada${NC}"

# 2. Instalar dependências do shared types
echo -e "${BLUE}2. Instalando dependências do lordtsapiSharedTypes...${NC}"
cd "$SHARED_TYPES"
npm install
npm run build

echo -e "${GREEN}   ✓ lordtsapiSharedTypes configurado${NC}"

# 3. Instalar dependências do lordtsapi
echo -e "${BLUE}3. Instalando dependências do lordtsapi...${NC}"
cd "$DATASUL_ROOT/lordtsapi"
npm install

echo -e "${GREEN}   ✓ lordtsapi configurado${NC}"

# 4. Instalar dependências do lor0138
if [ -d "$DATASUL_ROOT/lor0138" ]; then
    echo -e "${BLUE}4. Instalando dependências do lor0138...${NC}"
    cd "$DATASUL_ROOT/lor0138"
    npm install
    echo -e "${GREEN}   ✓ lor0138 configurado${NC}"
fi

echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}✓ Setup completo!${NC}"
echo -e "${GREEN}=====================================${NC}\n"

echo -e "${BLUE}Estrutura do projeto:${NC}"
echo "  lordtsapi/              # Backend - API REST"
echo "  lordtsapiSharedTypes/   # Types compartilhados"
echo "  lor0138/                # Frontend - React"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. cd lordtsapi"
echo "2. cp .env.example .env (configurar variáveis)"
echo "3. npm run build"
echo "4. npm run dev"
echo ""
echo -e "${BLUE}Documentação:${NC}"
echo "  $DATASUL_ROOT/SETUP.md"
echo "  $DATASUL_ROOT/setup_guide.md (guia completo)"
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC}"
echo "  • Sempre buildar lordtsapiSharedTypes após modificações:"
echo "    cd lordtsapiSharedTypes && npm run build"
echo "  • O pacote @acmano/lordtsapi-shared-types é usado por lordtsapi e lor0138"
echo ""
