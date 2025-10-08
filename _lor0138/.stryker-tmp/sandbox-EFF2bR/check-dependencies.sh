#!/bin/bash

# Script para verificar e instalar dependências faltantes
# Analisa os imports do código e verifica se estão no package.json

echo "🔍 Verificando dependências do projeto..."
echo ""

# Dependências de produção identificadas no código
PROD_DEPS=(
  "prom-client"
  "node-cache"
  "ioredis"
)

# Dependências de desenvolvimento
DEV_DEPS=(
  "@types/node-cache"
  "@types/ioredis"
)

# Verificar quais faltam
MISSING_PROD=()
MISSING_DEV=()

echo "📦 Dependências de produção:"
for dep in "${PROD_DEPS[@]}"; do
  if npm list "$dep" &>/dev/null; then
    echo "  ✅ $dep"
  else
    echo "  ❌ $dep (faltando)"
    MISSING_PROD+=("$dep")
  fi
done

echo ""
echo "🔧 Dependências de desenvolvimento:"
for dep in "${DEV_DEPS[@]}"; do
  if npm list "$dep" &>/dev/null; then
    echo "  ✅ $dep"
  else
    echo "  ❌ $dep (faltando)"
    MISSING_DEV+=("$dep")
  fi
done

echo ""

# Instalar faltantes
if [ ${#MISSING_PROD[@]} -gt 0 ]; then
  echo "📥 Instalando dependências de produção faltantes..."
  npm install "${MISSING_PROD[@]}"
  echo ""
fi

if [ ${#MISSING_DEV[@]} -gt 0 ]; then
  echo "📥 Instalando dependências de desenvolvimento faltantes..."
  npm install --save-dev "${MISSING_DEV[@]}"
  echo ""
fi

if [ ${#MISSING_PROD[@]} -eq 0 ] && [ ${#MISSING_DEV[@]} -eq 0 ]; then
  echo "✅ Todas as dependências estão instaladas!"
else
  echo "✅ Dependências instaladas com sucesso!"
fi

echo ""
echo "🧪 Executando testes para validar..."
npm run test:unit