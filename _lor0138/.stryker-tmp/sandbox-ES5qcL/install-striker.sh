#!/bin/bash

# Script de Instalação do Stryker Mutator
# Mutation Testing para validação de qualidade dos testes

echo "🧬 Instalando Stryker Mutator..."
echo "=================================="
echo ""

# Dependências principais do Stryker
npm install --save-dev \
  @stryker-mutator/core@latest \
  @stryker-mutator/typescript-checker@latest \
  @stryker-mutator/jest-runner@latest \
  @stryker-mutator/html-reporter@latest

echo ""
echo "✅ Dependências instaladas com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Criar arquivo stryker.conf.json"
echo "2. Adicionar scripts no package.json"
echo "3. Executar mutation testing"
echo ""
echo "Use: npm run test:mutation"