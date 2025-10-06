#!/bin/bash

# ============================================
# Script de Verificação do Redis
# lor0138.lorenzetti.ibe
# ============================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

# ============================================
# 1. Verificar se Redis está instalado
# ============================================
print_header "1. Verificando Instalação do Redis"

if command -v redis-cli &> /dev/null; then
  REDIS_VERSION=$(redis-cli --version)
  print_success "Redis CLI instalado: $REDIS_VERSION"
else
  print_error "Redis CLI não encontrado!"
  echo "Instale com: sudo apt install redis-tools"
  exit 1
fi

if command -v redis-server &> /dev/null; then
  print_success "Redis Server instalado"
else
  print_info "Redis Server não encontrado no PATH (pode estar instalado via serviço)"
fi

# ============================================
# 2. Verificar se Redis está rodando
# ============================================
print_header "2. Verificando se Redis está Rodando"

# Método 1: systemctl
if systemctl is-active --quiet redis-server 2>/dev/null; then
  print_success "Redis está rodando (systemctl)"
  REDIS_STATUS=$(systemctl status redis-server --no-pager | head -n 5)
  echo "$REDIS_STATUS"
elif systemctl is-active --quiet redis 2>/dev/null; then
  print_success "Redis está rodando (systemctl)"
  REDIS_STATUS=$(systemctl status redis --no-pager | head -n 5)
  echo "$REDIS_STATUS"
else
  print_info "Não encontrado via systemctl, verificando processo..."
  
  # Método 2: ps
  if pgrep -x redis-server > /dev/null; then
    print_success "Redis está rodando (processo encontrado)"
    ps aux | grep redis-server | grep -v grep
  else
    print_error "Redis NÃO está rodando!"
    echo ""
    echo "Inicie com um dos comandos:"
    echo "  sudo systemctl start redis-server"
    echo "  sudo systemctl start redis"
    exit 1
  fi
fi

# ============================================
# 3. Descobrir Porta
# ============================================
print_header "3. Descobrindo Porta do Redis"

# Tentar descobrir porta pelo netstat/ss
if command -v ss &> /dev/null; then
  REDIS_PORT=$(ss -tlnp 2>/dev/null | grep redis | awk '{print $4}' | grep -oP ':\K\d+' | head -1)
elif command -v netstat &> /dev/null; then
  REDIS_PORT=$(netstat -tlnp 2>/dev/null | grep redis | awk '{print $4}' | grep -oP ':\K\d+' | head -1)
fi

if [ -n "$REDIS_PORT" ]; then
  print_success "Redis escutando na porta: $REDIS_PORT"
else
  print_info "Não foi possível detectar porta automaticamente"
  print_info "Tentando porta padrão: 6379"
  REDIS_PORT=6379
fi

# ============================================
# 4. Testar Conexão (localhost)
# ============================================
print_header "4. Testando Conexão - localhost"

if redis-cli -p "$REDIS_PORT" ping > /dev/null 2>&1; then
  print_success "Conexão OK em localhost:$REDIS_PORT"
  
  # Verificar se precisa de senha
  REDIS_AUTH=$(redis-cli -p "$REDIS_PORT" CONFIG GET requirepass 2>/dev/null | tail -1)
  
  if [ "$REDIS_AUTH" = "" ]; then
    print_success "Redis SEM senha (autenticação desabilitada)"
    NEEDS_PASSWORD="false"
  else
    print_info "Redis COM senha: $REDIS_AUTH"
    NEEDS_PASSWORD="true"
  fi
else
  print_error "Falha ao conectar em localhost:$REDIS_PORT"
  print_info "Tentando com autenticação..."
  
  echo ""
  read -sp "Digite a senha do Redis (ou Enter para pular): " REDIS_PASS
  echo ""
  
  if [ -n "$REDIS_PASS" ]; then
    if redis-cli -p "$REDIS_PORT" -a "$REDIS_PASS" ping > /dev/null 2>&1; then
      print_success "Conexão OK com senha"
      NEEDS_PASSWORD="true"
    else
      print_error "Senha incorreta ou outro erro"
      exit 1
    fi
  else
    print_error "Não foi possível conectar ao Redis"
    exit 1
  fi
fi

# ============================================
# 5. Testar Conexão (hostname)
# ============================================
print_header "5. Testando Conexão - lor0138.lorenzetti.ibe"

HOSTNAME="lor0138.lorenzetti.ibe"

if [ "$NEEDS_PASSWORD" = "true" ]; then
  if redis-cli -h "$HOSTNAME" -p "$REDIS_PORT" -a "$REDIS_PASS" ping > /dev/null 2>&1; then
    print_success "Conexão OK em $HOSTNAME:$REDIS_PORT (com senha)"
  else
    print_error "Falha ao conectar via hostname"
    print_info "Verifique se Redis aceita conexões remotas"
  fi
else
  if redis-cli -h "$HOSTNAME" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
    print_success "Conexão OK em $HOSTNAME:$REDIS_PORT"
  else
    print_error "Falha ao conectar via hostname"
    print_info "Verifique configuração bind no redis.conf"
  fi
fi

# ============================================
# 6. Verificar Configurações
# ============================================
print_header "6. Configurações do Redis"

if [ "$NEEDS_PASSWORD" = "true" ]; then
  REDIS_CMD="redis-cli -h $HOSTNAME -p $REDIS_PORT -a $REDIS_PASS"
else
  REDIS_CMD="redis-cli -h $HOSTNAME -p $REDIS_PORT"
fi

echo "📋 Informações do Servidor:"
echo ""

# Bind address
BIND_ADDR=$($REDIS_CMD CONFIG GET bind 2>/dev/null | tail -1)
if [ -n "$BIND_ADDR" ] && [ "$BIND_ADDR" != "" ]; then
  echo "  Bind Address: $BIND_ADDR"
else
  echo "  Bind Address: (todas as interfaces)"
fi

# Protected mode
PROTECTED=$($REDIS_CMD CONFIG GET protected-mode 2>/dev/null | tail -1)
echo "  Protected Mode: $PROTECTED"

# Max memory
MAXMEM=$($REDIS_CMD CONFIG GET maxmemory 2>/dev/null | tail -1)
echo "  Max Memory: $MAXMEM (0 = ilimitado)"

# Databases
DATABASES=$($REDIS_CMD CONFIG GET databases 2>/dev/null | tail -1)
echo "  Databases: $DATABASES (0 até $(($DATABASES - 1)))"

# Versão
REDIS_INFO_VERSION=$($REDIS_CMD INFO server 2>/dev/null | grep redis_version | cut -d: -f2 | tr -d '\r')
echo "  Versão: $REDIS_INFO_VERSION"

# ============================================
# 7. Gerar Configuração para .env
# ============================================
print_header "7. Configuração para o Projeto"

echo "Adicione ao seu .env:"
echo ""
echo "# ============================================"
echo "# REDIS - Configuração Descoberta"
echo "# ============================================"
echo ""

if [ "$NEEDS_PASSWORD" = "true" ]; then
  echo "CACHE_REDIS_URL=redis://:${REDIS_PASS}@${HOSTNAME}:${REDIS_PORT}"
else
  echo "CACHE_REDIS_URL=redis://${HOSTNAME}:${REDIS_PORT}"
fi

echo ""
echo "# Timeouts"
echo "CACHE_REDIS_CONNECT_TIMEOUT=5000"
echo "CACHE_REDIS_COMMAND_TIMEOUT=3000"
echo "CACHE_REDIS_MAX_RETRIES=3"

# ============================================
# 8. Teste Rápido
# ============================================
print_header "8. Teste Rápido de Leitura/Escrita"

TEST_KEY="lor0138:test:$(date +%s)"
TEST_VALUE="Hello from lor0138!"

echo "Escrevendo chave de teste: $TEST_KEY"
if $REDIS_CMD SET "$TEST_KEY" "$TEST_VALUE" EX 60 > /dev/null 2>&1; then
  print_success "SET OK"
  
  echo "Lendo chave de teste..."
  READ_VALUE=$($REDIS_CMD GET "$TEST_KEY" 2>/dev/null)
  
  if [ "$READ_VALUE" = "$TEST_VALUE" ]; then
    print_success "GET OK - Valor: $READ_VALUE"
    
    echo "Removendo chave de teste..."
    $REDIS_CMD DEL "$TEST_KEY" > /dev/null 2>&1
    print_success "DEL OK"
  else
    print_error "Valor lido diferente do esperado"
  fi
else
  print_error "Falha ao escrever chave de teste"
fi

# ============================================
# Resumo Final
# ============================================
print_header "✅ Resumo"

echo "Redis está configurado e funcionando!"
echo ""
echo "Configurações:"
echo "  🌐 Hostname: $HOSTNAME"
echo "  🔌 Porta: $REDIS_PORT"
echo "  🔐 Senha: $([ "$NEEDS_PASSWORD" = "true" ] && echo "SIM" || echo "NÃO")"
echo "  📦 Database: 0 (padrão)"
echo "  🔒 TLS: NÃO (redis://)"
echo ""
echo "Próximos passos:"
echo "  1. Copie a configuração CACHE_REDIS_URL acima"
echo "  2. Adicione no arquivo .env do projeto"
echo "  3. Reinicie a aplicação: npm run dev"
echo "  4. Verifique logs de inicialização do cache"
echo ""

print_success "Script concluído!"