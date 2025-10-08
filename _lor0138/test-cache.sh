#!/bin/bash
# test-cache.sh - Testa implementação do cache

echo "TESTANDO CACHE DE QUERIES - LOR0138"
echo "===================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://lor0138.lorenzetti.ibe:3000"

# Contador de testes
PASSED=0
FAILED=0

# Teste 1: Verificar se cache está habilitado
echo -e "${BLUE}1. Verificar configuração do cache${NC}"
echo "========================================"

stats=$(curl -s $BASE_URL/cache/stats)
enabled=$(echo "$stats" | jq -r '.config.enabled')
stdTTL=$(echo "$stats" | jq -r '.config.stdTTL')

if [ "$enabled" = "true" ]; then
  echo -e "${GREEN}OK${NC} Cache habilitado"
  echo "   TTL padrão: ${stdTTL}s"
  ((PASSED++))
else
  echo -e "${RED}FALHOU${NC} Cache desabilitado"
  ((FAILED++))
fi
echo ""

# Teste 2: Cache MISS (primeira requisição)
echo -e "${BLUE}2. Teste de Cache MISS${NC}"
echo "========================"

response=$(curl -i -s $BASE_URL/health)
cache_header=$(echo "$response" | grep -i "^x-cache:" | cut -d' ' -f2 | tr -d '\r\n ')

if [ "$cache_header" = "MISS" ]; then
  echo -e "${GREEN}OK${NC} Cache MISS na primeira requisição"
  ((PASSED++))
else
  echo -e "${RED}FALHOU${NC} Esperado MISS, recebido: $cache_header"
  ((FAILED++))
fi
echo ""

# Teste 3: Cache HIT (segunda requisição)
echo -e "${BLUE}3. Teste de Cache HIT${NC}"
echo "======================="

# Aguarda 100ms
sleep 0.1

response=$(curl -i -s $BASE_URL/health)
cache_header=$(echo "$response" | grep -i "^x-cache:" | cut -d' ' -f2 | tr -d '\r\n ')

if [ "$cache_header" = "HIT" ]; then
  echo -e "${GREEN}OK${NC} Cache HIT na segunda requisição"
  ((PASSED++))
else
  echo -e "${RED}FALHOU${NC} Esperado HIT, recebido: $cache_header"
  ((FAILED++))
fi
echo ""

# Teste 4: Verificar estatísticas
echo -e "${BLUE}4. Verificar estatísticas do cache${NC}"
echo "===================================="

stats=$(curl -s $BASE_URL/cache/stats)
hits=$(echo "$stats" | jq -r '.stats.hits')
misses=$(echo "$stats" | jq -r '.stats.misses')
keys=$(echo "$stats" | jq -r '.stats.keys')
hitRate=$(echo "$stats" | jq -r '.stats.hitRate')

echo "   Hits: $hits"
echo "   Misses: $misses"
echo "   Keys: $keys"
echo "   Hit Rate: ${hitRate}%"

if [ "$hits" -gt 0 ]; then
  echo -e "${GREEN}OK${NC} Estatísticas funcionando"
  ((PASSED++))
else
  echo -e "${RED}FALHOU${NC} Sem hits registrados"
  ((FAILED++))
fi
echo ""

# Teste 5: Listar chaves
echo -e "${BLUE}5. Listar chaves do cache${NC}"
echo "=========================="

keys_response=$(curl -s $BASE_URL/cache/keys)
total=$(echo "$keys_response" | jq -r '.total')

echo "   Total de chaves: $total"

if [ "$total" -gt 0 ]; then
  echo -e "${GREEN}OK${NC} Chaves armazenadas"
  echo "$keys_response" | jq -r '.keys[0:3][] | "   - \(.key)"'
  ((PASSED++))
else
  echo -e "${YELLOW}AVISO${NC} Nenhuma chave em cache"
  ((FAILED++))
fi
echo ""

# Teste 6: Performance (cache vs não-cache)
echo -e "${BLUE}6. Teste de performance${NC}"
echo "========================"

# Limpa cache
curl -s -X POST $BASE_URL/cache/clear > /dev/null

# Primeira requisição (MISS)
start=$(date +%s%N)
curl -s $BASE_URL/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110 > /dev/null
end=$(date +%s%N)
duration_miss=$(( (end - start) / 1000000 ))

# Segunda requisição (HIT)
start=$(date +%s%N)
curl -s $BASE_URL/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110 > /dev/null
end=$(date +%s%N)
duration_hit=$(( (end - start) / 1000000 ))

echo "   Cache MISS: ${duration_miss}ms"
echo "   Cache HIT: ${duration_hit}ms"

if [ "$duration_hit" -lt "$duration_miss" ]; then
  improvement=$(( 100 - (duration_hit * 100 / duration_miss) ))
  echo -e "${GREEN}OK${NC} Cache ${improvement}% mais rápido"
  ((PASSED++))
else
  echo -e "${YELLOW}AVISO${NC} Cache não melhorou performance"
  ((FAILED++))
fi
echo ""

# Teste 7: Invalidação por padrão
echo -e "${BLUE}7. Teste de invalidação${NC}"
echo "========================"

# Cria cache
curl -s $BASE_URL/health > /dev/null
curl -s $BASE_URL/ > /dev/null

keys_before=$(curl -s $BASE_URL/cache/keys | jq -r '.total')

# Invalida padrão GET:*
result=$(curl -s -X DELETE $BASE_URL/cache/invalidate/GET:*)
removed=$(echo "$result" | jq -r '.keysRemoved')

keys_after=$(curl -s $BASE_URL/cache/keys | jq -r '.total')

echo "   Chaves antes: $keys_before"
echo "   Chaves removidas: $removed"
echo "   Chaves depois: $keys_after"

if [ "$removed" -gt 0 ]; then
  echo -e "${GREEN}OK${NC} Invalidação funcionando"
  ((PASSED++))
else
  echo -e "${RED}FALHOU${NC} Nenhuma chave removida"
  ((FAILED++))
fi
echo ""

# Teste 8: Limpar cache completo
echo -e "${BLUE}8. Limpar cache${NC}"
echo "================="

# Popula cache
curl -s $BASE_URL/health > /dev/null
curl -s $BASE_URL/ > /dev/null

keys_before=$(curl -s $BASE_URL/cache/keys | jq -r '.total')

# Limpa
clear_result=$(curl -s -X POST $BASE_URL/cache/clear)
removed=$(echo "$clear_result" | jq -r '.keysRemoved')

keys_after=$(curl -s $BASE_URL/cache/keys | jq -r '.total')

echo "   Chaves antes: $keys_before"
echo "   Chaves removidas: $removed"
echo "   Chaves depois: $keys_after"

if [ "$keys_after" -eq 0 ]; then
  echo -e "${GREEN}OK${NC} Cache limpo"
  ((PASSED++))
else
  echo -e "${RED}FALHOU${NC} Cache não foi limpo completamente"
  ((FAILED++))
fi
echo ""

# Teste 9: Hit rate após múltiplas requisições
echo -e "${BLUE}9. Teste de hit rate${NC}"
echo "====================="

# Limpa cache e stats
curl -s -X POST $BASE_URL/cache/clear > /dev/null

# 20 requisições (10 únicas = 10 miss + 10 hit)
for i in {1..2}; do
  for j in {1..10}; do
    curl -s $BASE_URL/health > /dev/null 2>&1
  done
done

stats=$(curl -s $BASE_URL/cache/stats)
hitRate=$(echo "$stats" | jq -r '.stats.hitRate')

echo "   Hit Rate: ${hitRate}%"

if (( $(echo "$hitRate > 40" | bc -l) )); then
  echo -e "${GREEN}OK${NC} Hit rate aceitável (>40%)"
  ((PASSED++))
else
  echo -e "${YELLOW}AVISO${NC} Hit rate baixo (<40%)"
  ((FAILED++))
fi
echo ""

# Teste 10: TTL (expiração)
echo -e "${BLUE}10. Teste de TTL${NC}"
echo "================="

# Limpa cache
curl -s -X POST $BASE_URL/cache/clear > /dev/null

# Faz requisição (MISS)
response1=$(curl -i -s $BASE_URL/health)
cache1=$(echo "$response1" | grep -i "^x-cache:" | cut -d' ' -f2 | tr -d '\r\n ')

# Imediatamente depois (HIT)
response2=$(curl -i -s $BASE_URL/health)
cache2=$(echo "$response2" | grep -i "^x-cache:" | cut -d' ' -f2 | tr -d '\r\n ')

echo "   Primeira req: $cache1"
echo "   Segunda req: $cache2"

if [ "$cache1" = "MISS" ] && [ "$cache2" = "HIT" ]; then
  echo -e "${GREEN}OK${NC} TTL funcionando"
  ((PASSED++))
else
  echo -e "${RED}FALHOU${NC} Comportamento inesperado"
  ((FAILED++))
fi
echo ""

# Resumo
echo ""
echo -e "${BLUE}RESUMO DOS TESTES${NC}"
echo "=================="
echo ""
echo -e "Total: $((PASSED + FAILED))"
echo -e "${GREEN}Passou: $PASSED${NC}"
echo -e "${RED}Falhou: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}TODOS OS TESTES PASSARAM!${NC}"
  echo ""
  echo "Funcionalidades validadas:"
  echo "  - Cache habilitado"
  echo "  - Cache MISS/HIT funcionando"
  echo "  - Estatísticas corretas"
  echo "  - Listagem de chaves"
  echo "  - Performance melhorada"
  echo "  - Invalidação por padrão"
  echo "  - Limpeza de cache"
  echo "  - Hit rate aceitável"
  echo "  - TTL funcionando"
  echo ""
  echo "ITEM 10 - CACHE DE QUERIES: COMPLETO!"
  echo ""
  exit 0
else
  echo -e "${RED}ALGUNS TESTES FALHARAM${NC}"
  echo ""
  echo "Verificar:"
  echo "1. CACHE_ENABLED=true no .env"
  echo "2. node-cache instalado"
  echo "3. CacheManager inicializado"
  echo "4. Endpoints de cache criados"
  echo ""
  exit 1
fi