#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

LORDTSAPI="/home/mano/projetos/datasul/lordtsapi"

cd "$LORDTSAPI"

echo -e "${BLUE}=== Gerando testes para todas as entidades ===${NC}\n"

# Aplicar para cada entidade
./generate-entity-complete.sh grupoDeEstoque GrupoDeEstoque ge-codigo descricao grup-estoque

./generate-entity-complete.sh familiaComercial FamiliaComercial fm-cod-com descricao fam-comerc

./generate-entity-complete.sh estabelecimento Estabelecimento cod-estabel nome estabelec

echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}✓ Todas as entidades processadas!${NC}"
echo -e "${GREEN}=====================================${NC}\n"

echo -e "${BLUE}Testar tudo:${NC}"
echo "  npm test"
echo ""
echo -e "${BLUE}Testar por entidade:${NC}"
echo "  npm test -- grupoDeEstoque"
echo "  npm test -- familiaComercial"
echo "  npm test -- estabelecimento"
