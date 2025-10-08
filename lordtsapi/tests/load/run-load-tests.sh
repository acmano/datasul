#!/bin/bash
# tests/load/run-load-tests.sh
# Script para executar todos os testes de carga k6

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuração
API_URL="${API_URL:-http://localhost:3000}"
RESULTS_DIR="load-results"

# Criar diretório de resultados
mkdir -p "$RESULTS_DIR"

echo "======================================"
echo "  Testes de Carga k6 - API LOR0138"
echo "======================================"
echo ""
echo "API URL: $API_URL"
echo "Resultados: $RESULTS_DIR/"
echo ""

# Função para executar teste
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo ""
    echo -e "${YELLOW}Executando: $test_name${NC}"
    echo "--------------------------------------"
    
    if k6 run \
        --out json="$RESULTS_DIR/${test_name}-raw.json" \
        -e API_URL="$API_URL" \
        "$test_file"; then
        echo -e "${GREEN}✅ $test_name concluído${NC}"
    else
        echo -e "${RED}❌ $test_name falhou${NC}"
        return 1
    fi
}

# Menu de seleção
echo "Escolha o teste a executar:"
echo "1) Smoke Test (30s - 1 usuário)"
echo "2) Load Test (16min - até 100 usuários)"
echo "3) Stress Test (26min - até 500 usuários)"
echo "4) Spike Test (7min - pico súbito)"
echo "5) Executar TODOS os testes"
echo "6) Sair"
echo ""
read -p "Opção [1-6]: " choice

case $choice in
    1)
        run_test "smoke" "tests/load/smoke.test.js"
        ;;
    2)
        run_test "load" "tests/load/load.test.js"
        ;;
    3)
        echo -e "${YELLOW}⚠️  Stress test é intensivo e pode demorar 26 minutos${NC}"
        read -p "Continuar? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            run_test "stress" "tests/load/stress.test.js"
        fi
        ;;
    4)
        run_test "spike" "tests/load/spike.test.js"
        ;;
    5)
        echo -e "${YELLOW}⚠️  Executar todos os testes pode demorar >1 hora${NC}"
        read -p "Continuar? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            run_test "smoke" "tests/load/smoke.test.js"
            sleep 5
            run_test "load" "tests/load/load.test.js"
            sleep 10
            run_test "spike" "tests/load/spike.test.js"
            sleep 10
            run_test "stress" "tests/load/stress.test.js"
        fi
        ;;
    6)
        echo "Saindo..."
        exit 0
        ;;
    *)
        echo -e "${RED}Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo -e "${GREEN}Testes concluídos!${NC}"
echo "======================================"
echo ""
echo "Resultados salvos em: $RESULTS_DIR/"
echo ""

# Mostrar HTML reports se existirem
if [ -f "$RESULTS_DIR/load-summary.html" ]; then
    echo "Relatório HTML disponível:"
    echo "  file://$(pwd)/$RESULTS_DIR/load-summary.html"
fi

echo ""
echo "Para visualizar resultados JSON:"
echo "  cat $RESULTS_DIR/*.json | jq"
echo ""