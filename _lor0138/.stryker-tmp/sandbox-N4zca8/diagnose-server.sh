#!/bin/bash

# ============================================
# Diagnóstico do Servidor lor0138
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Diagnosticando servidor lor0138...${NC}\n"

# 1. Processo Node rodando?
echo -e "${BLUE}1️⃣ Verificando processos Node.js...${NC}"
if pgrep -f "node.*server" > /dev/null; then
  echo -e "${GREEN}✅ Processo Node encontrado:${NC}"
  ps aux | grep -E "node.*(server|lor0138)" | grep -v grep
else
  echo -e "${RED}❌ Nenhum processo Node rodando${NC}"
  echo -e "${YELLOW}A aplicação não foi iniciada ou crashou${NC}"
fi

echo ""

# 2. Porta 3000 em uso?
echo -e "${BLUE}2️⃣ Verificando porta 3000...${NC}"
if ss -tlnp 2>/dev/null | grep ":3000" > /dev/null; then
  echo -e "${GREEN}✅ Porta 3000 em uso:${NC}"
  ss -tlnp 2>/dev/null | grep ":3000"
else
  echo -e "${RED}❌ Porta 3000 não está em uso${NC}"
  echo -e "${YELLOW}Servidor não está escutando${NC}"
fi

echo ""

# 3. Últimos logs
echo -e "${BLUE}3️⃣ Últimos logs da aplicação:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f "logs/combined.log" ]; then
  echo -e "${GREEN}Logs em logs/combined.log:${NC}"
  tail -50 logs/combined.log
elif [ -f "logs/error.log" ]; then
  echo -e "${GREEN}Logs em logs/error.log:${NC}"
  tail -50 logs/error.log
else
  echo -e "${YELLOW}Arquivo de log não encontrado${NC}"
  echo -e "${YELLOW}Execute: npm run dev${NC}"
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 4. Verificar package.json
echo ""
echo -e "${BLUE}4️⃣ Verificando configuração...${NC}"

if [ -f "package.json" ]; then
  DEV_SCRIPT=$(grep '"dev":' package.json)
  echo -e "${GREEN}Script dev:${NC} $DEV_SCRIPT"
else
  echo -e "${RED}❌ package.json não encontrado${NC}"
fi

# 5. Verificar .env
echo ""
echo -e "${BLUE}5️⃣ Verificando .env...${NC}"

if [ -f ".env" ]; then
  echo -e "${GREEN}✅ .env encontrado${NC}"
  
  # Verificar variáveis críticas
  if grep -q "PORT=3000" .env; then
    echo -e "${GREEN}  ✅ PORT=3000${NC}"
  else
    echo -e "${YELLOW}  ⚠️  PORT não definida${NC}"
  fi
  
  if grep -q "DB_SERVER=" .env; then
    echo -e "${GREEN}  ✅ DB_SERVER definido${NC}"
  else
    echo -e "${RED}  ❌ DB_SERVER não definido${NC}"
  fi
  
  if grep -q "CACHE_REDIS_URL=" .env; then
    echo -e "${GREEN}  ✅ CACHE_REDIS_URL definido${NC}"
  else
    echo -e "${YELLOW}  ⚠️  CACHE_REDIS_URL não definido${NC}"
  fi
else
  echo -e "${RED}❌ .env não encontrado${NC}"
fi

# 6. Verificar node_modules
echo ""
echo -e "${BLUE}6️⃣ Verificando dependências...${NC}"

if [ -d "node_modules" ]; then
  echo -e "${GREEN}✅ node_modules existe${NC}"
  
  # Verificar ioredis
  if [ -d "node_modules/ioredis" ]; then
    echo -e "${GREEN}  ✅ ioredis instalado${NC}"
  else
    echo -e "${RED}  ❌ ioredis NÃO instalado${NC}"
    echo -e "${YELLOW}  Execute: npm install ioredis @types/ioredis${NC}"
  fi
else
  echo -e "${RED}❌ node_modules não existe${NC}"
  echo -e "${YELLOW}Execute: npm install${NC}"
fi

# 7. Verificar TypeScript
echo ""
echo -e "${BLUE}7️⃣ Verificando compilação TypeScript...${NC}"

if [ -d "dist" ]; then
  echo -e "${GREEN}✅ Pasta dist/ existe${NC}"
  DIST_FILES=$(find dist -name "*.js" 2>/dev/null | wc -l)
  echo -e "  Arquivos .js compilados: $DIST_FILES"
else
  echo -e "${YELLOW}⚠️  Pasta dist/ não existe${NC}"
  echo -e "${YELLOW}  (Normal se usando ts-node-dev)${NC}"
fi

# 8. Recomendações
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Próximos Passos:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if ! pgrep -f "node.*server" > /dev/null; then
  echo -e "${YELLOW}1. Iniciar aplicação:${NC}"
  echo -e "   ${GREEN}npm run dev${NC}"
  echo ""
fi

if [ ! -d "node_modules/ioredis" ]; then
  echo -e "${YELLOW}2. Instalar ioredis:${NC}"
  echo -e "   ${GREEN}npm install ioredis @types/ioredis${NC}"
  echo ""
fi

echo -e "${YELLOW}3. Ver logs em tempo real:${NC}"
echo -e "   ${GREEN}tail -f logs/combined.log${NC}"
echo ""

echo -e "${YELLOW}4. Se houver erro, compartilhe os logs acima${NC}"
echo ""