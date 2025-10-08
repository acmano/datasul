#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

LORDTSAPI="/home/mano/projetos/datasul/lordtsapi"

cd "$LORDTSAPI"

echo -e "${BLUE}=== Corrigindo estrutura lordtsapi ===${NC}\n"

# 1. Mover módulos para raiz do src/
echo -e "${BLUE}1. Movendo módulos...${NC}"

# Verificar se existe a estrutura antiga
if [ ! -d "src/api/lor0138" ]; then
    echo -e "${YELLOW}ERRO: src/api/lor0138 não encontrado${NC}"
    exit 1
fi

# Mover cada módulo
for module in item familia grupoDeEstoque familiaComercial estabelecimento; do
    if [ -d "src/api/lor0138/$module" ]; then
        echo -e "   Movendo $module..."
        mv "src/api/lor0138/$module" "src/"
    fi
done

echo -e "${GREEN}   ✓ Módulos movidos${NC}"

# 2. Remover diretórios vazios
echo -e "${BLUE}2. Limpando diretórios vazios...${NC}"
rm -rf "src/api/lor0138"
# Manter src/api/ para outros endpoints (test, admin, metrics)
echo -e "${GREEN}   ✓ Limpeza concluída${NC}"

# 3. Ajustar imports
echo -e "${BLUE}3. Ajustando imports...${NC}"

# Função para ajustar imports em um arquivo
fix_imports() {
    local file="$1"
    
    # Backup
    cp "$file" "$file.bak"
    
    # Substituir imports que referenciam api/lor0138
    sed -i "s|from ['\"].*api/lor0138/\([^'\"]*\)['\"]|from '@/\1'|g" "$file"
    sed -i "s|from ['\"].*\\.\\./\\.\\./\\.\\./\\.\\./\\.\\./api/lor0138/\([^'\"]*\)['\"]|from '@/\1'|g" "$file"
    sed -i "s|from ['\"].*\\.\\./\\.\\./\\.\\./\\.\\./api/lor0138/\([^'\"]*\)['\"]|from '@/\1'|g" "$file"
    sed -i "s|from ['\"].*\\.\\./\\.\\./\\.\\./api/lor0138/\([^'\"]*\)['\"]|from '@/\1'|g" "$file"
    sed -i "s|from ['\"].*\\.\\./\\.\\./api/lor0138/\([^'\"]*\)['\"]|from '@/\1'|g" "$file"
    sed -i "s|from ['\"].*\\.\\./.*/api/lor0138/\([^'\"]*\)['\"]|from '@/\1'|g" "$file"
}

# Encontrar todos os arquivos .ts (exceto node_modules e dist)
find src -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
    if grep -q "api/lor0138" "$file" 2>/dev/null; then
        echo -e "   Ajustando $file..."
        fix_imports "$file"
    fi
done

# Ajustar app.ts se existir
if [ -f "src/app.ts" ]; then
    if grep -q "api/lor0138" "src/app.ts"; then
        echo -e "   Ajustando src/app.ts..."
        fix_imports "src/app.ts"
    fi
fi

echo -e "${GREEN}   ✓ Imports ajustados${NC}"

# 4. Atualizar tsconfig.json com paths corretos
echo -e "${BLUE}4. Atualizando tsconfig.json...${NC}"

# Adicionar/atualizar paths no tsconfig
node << 'NODEJS'
const fs = require('fs');
const tsconfigPath = './tsconfig.json';
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
if (!tsconfig.compilerOptions.paths) tsconfig.compilerOptions.paths = {};

// Paths para os módulos
tsconfig.compilerOptions.paths['@/*'] = ['./src/*'];
tsconfig.compilerOptions.paths['@item/*'] = ['./src/item/*'];
tsconfig.compilerOptions.paths['@familia/*'] = ['./src/familia/*'];
tsconfig.compilerOptions.paths['@grupoDeEstoque/*'] = ['./src/grupoDeEstoque/*'];
tsconfig.compilerOptions.paths['@familiaComercial/*'] = ['./src/familiaComercial/*'];
tsconfig.compilerOptions.paths['@estabelecimento/*'] = ['./src/estabelecimento/*'];
tsconfig.compilerOptions.paths['@config/*'] = ['./src/config/*'];
tsconfig.compilerOptions.paths['@infrastructure/*'] = ['./src/infrastructure/*'];
tsconfig.compilerOptions.paths['@shared/*'] = ['./src/shared/*'];

// Manter shared-types
tsconfig.compilerOptions.paths['@datasul/shared-types'] = ['../shared-types/src'];
tsconfig.compilerOptions.paths['@datasul/shared-types/*'] = ['../shared-types/src/*'];

// Adicionar baseUrl se não existir
if (!tsconfig.compilerOptions.baseUrl) {
    tsconfig.compilerOptions.baseUrl = './src';
}

fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
console.log('   ✓ tsconfig.json atualizado');
NODEJS

echo -e "${GREEN}   ✓ tsconfig.json configurado${NC}"

# 5. Atualizar tsconfig.paths.json se existir
if [ -f "tsconfig.paths.json" ]; then
    echo -e "${BLUE}5. Atualizando tsconfig.paths.json...${NC}"
    
    node << 'NODEJS'
const fs = require('fs');
const tsconfigPath = './tsconfig.paths.json';
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
if (!tsconfig.compilerOptions.paths) tsconfig.compilerOptions.paths = {};

tsconfig.compilerOptions.paths['@/*'] = ['./src/*'];
tsconfig.compilerOptions.paths['@item/*'] = ['./src/item/*'];
tsconfig.compilerOptions.paths['@familia/*'] = ['./src/familia/*'];
tsconfig.compilerOptions.paths['@grupoDeEstoque/*'] = ['./src/grupoDeEstoque/*'];
tsconfig.compilerOptions.paths['@familiaComercial/*'] = ['./src/familiaComercial/*'];
tsconfig.compilerOptions.paths['@estabelecimento/*'] = ['./src/estabelecimento/*'];
tsconfig.compilerOptions.paths['@config/*'] = ['./src/config/*'];
tsconfig.compilerOptions.paths['@infrastructure/*'] = ['./src/infrastructure/*'];
tsconfig.compilerOptions.paths['@shared/*'] = ['./src/shared/*'];
tsconfig.compilerOptions.paths['@datasul/shared-types'] = ['../shared-types/src'];
tsconfig.compilerOptions.paths['@datasul/shared-types/*'] = ['../shared-types/src/*'];

if (!tsconfig.compilerOptions.baseUrl) {
    tsconfig.compilerOptions.baseUrl = './src';
}

fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
console.log('   ✓ tsconfig.paths.json atualizado');
NODEJS

    echo -e "${GREEN}   ✓ tsconfig.paths.json configurado${NC}"
fi

# 6. Remover backups se tudo der certo
echo -e "${BLUE}6. Limpando backups...${NC}"
find src -name "*.bak" -delete
echo -e "${GREEN}   ✓ Backups removidos${NC}"

# 7. Testar compilação
echo -e "${BLUE}7. Testando compilação...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}=====================================${NC}"
    echo -e "${GREEN}✓ Estrutura corrigida com sucesso!${NC}"
    echo -e "${GREEN}=====================================${NC}\n"
    echo -e "${BLUE}Nova estrutura:${NC}"
    echo "  src/"
    echo "  ├── item/"
    echo "  ├── familia/"
    echo "  ├── grupoDeEstoque/"
    echo "  ├── familiaComercial/"
    echo "  ├── estabelecimento/"
    echo "  ├── api/          (test, admin, metrics)"
    echo "  ├── config/"
    echo "  ├── infrastructure/"
    echo "  ├── shared/"
    echo "  ├── app.ts"
    echo "  └── server.ts"
    echo ""
    echo -e "${BLUE}Próximo passo:${NC}"
    echo "  npm run dev"
else
    echo -e "\n${YELLOW}=====================================${NC}"
    echo -e "${YELLOW}⚠ Erros de compilação detectados${NC}"
    echo -e "${YELLOW}=====================================${NC}\n"
    echo -e "Verifique os erros acima e ajuste manualmente se necessário."
    echo -e "Backups dos arquivos originais foram mantidos com extensão .bak"
fi
