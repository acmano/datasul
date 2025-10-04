#!/bin/bash
# ============================================
# Verificação Rápida do Redis
# Execute: bash redis-quick-check.sh
# ============================================

echo "🔍 Verificando Redis em lor0138.lorenzetti.ibe..."
echo ""

# 1. Redis está rodando?
echo "1️⃣ Redis rodando?"
if systemctl is-active --quiet redis-server 2>/dev/null; then
  echo "   ✅ SIM"
else
  echo "   ❌ NÃO - Execute: sudo systemctl start redis-server"
  exit 1
fi

# 2. Qual porta?
echo ""
echo "2️⃣ Porta:"
PORT=$(ss -tlnp 2>/dev/null | grep redis | awk '{print $4}' | grep -oP ':\K\d+' | head -1)
if [ -n "$PORT" ]; then
  echo "   ✅ $PORT"
else
  echo "   ⚠️  Não detectado, assumindo 6379"
  PORT=6379
fi

# 3. Tem senha?
echo ""
echo "3️⃣ Autenticação:"
PASS=$(redis-cli CONFIG GET requirepass 2>/dev/null | tail -1)
if [ -z "$PASS" ] || [ "$PASS" = "" ]; then
  echo "   ✅ SEM senha"
  HAS_PASSWORD=false
else
  echo "   🔐 COM senha: $PASS"
  HAS_PASSWORD=true
fi

# 4. Conexão via hostname funciona?
echo ""
echo "4️⃣ Testando hostname lor0138.lorenzetti.ibe..."
if redis-cli -h lor0138.lorenzetti.ibe -p $PORT ping &>/dev/null; then
  echo "   ✅ OK"
else
  echo "   ❌ FALHOU - Redis precisa aceitar conexões remotas"
  echo "   Execute:"
  echo "   sudo nano /etc/redis/redis.conf"
  echo "   Mude 'bind 127.0.0.1' para 'bind 0.0.0.0'"
  echo "   sudo systemctl restart redis-server"
fi

# 5. Gerar configuração
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 CONFIGURAÇÃO PARA O .env:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$HAS_PASSWORD" = true ]; then
  echo "CACHE_REDIS_URL=redis://:${PASS}@lor0138.lorenzetti.ibe:${PORT}"
else
  echo "CACHE_REDIS_URL=redis://lor0138.lorenzetti.ibe:${PORT}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Copie a linha acima e adicione no .env do projeto!"
echo ""