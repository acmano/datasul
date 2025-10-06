# Testes de Carga - k6

Guia completo para executar testes de performance na API LOR0138.

## Instalação do k6

### Ubuntu/Debian

```bash
# Via APT
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Ou via Snap (mais simples)
sudo snap install k6
```

### Verificar Instalação

```bash
k6 version
```

## Tipos de Teste

### 1. Smoke Test (Teste de Fumaça)
**Objetivo:** Validar que a API funciona sob carga mínima

- **Duração:** 30 segundos
- **Usuários:** 1 VU
- **Quando usar:** Antes de qualquer outro teste
- **Threshold:** 95% das respostas < 500ms

```bash
k6 run tests/load/smoke.test.js
```

### 2. Load Test (Teste de Carga)
**Objetivo:** Avaliar performance sob carga normal e picos

- **Duração:** 16 minutos
- **Usuários:** 10 → 50 → 100 → 50 → 0
- **Quando usar:** Validar performance em produção
- **Threshold:** p(95) < 1s, p(99) < 2s

```bash
k6 run tests/load/load.test.js
```

### 3. Stress Test (Teste de Stress)
**Objetivo:** Encontrar o limite da API

- **Duração:** 26 minutos
- **Usuários:** 50 → 100 → 200 → 300 → 400 → 500
- **Quando usar:** Identificar ponto de quebra
- **Threshold:** p(99) < 5s (tolerante)

```bash
k6 run tests/load/stress.test.js
```

### 4. Spike Test (Teste de Pico)
**Objetivo:** Simular aumento súbito de tráfego

- **Duração:** 7 minutos
- **Usuários:** 10 → 500 (súbito) → 10
- **Quando usar:** Testar auto-scaling e rate limiting
- **Threshold:** p(90) < 3s

```bash
k6 run tests/load/spike.test.js
```

## Executar Testes

### Via Script Interativo

```bash
chmod +x tests/load/run-load-tests.sh
./tests/load/run-load-tests.sh
```

### Manualmente

```bash
# Com URL customizada
k6 run -e API_URL=http://lor0138.lorenzetti.ibe:3000 tests/load/smoke.test.js

# Com output JSON
k6 run --out json=results.json tests/load/load.test.js

# Com mais usuários virtuais
k6 run --vus 10 --duration 30s tests/load/smoke.test.js
```

## Análise de Resultados

### Estrutura de Resultados

```
load-results/
├── smoke-summary.json          # Resultado do smoke test
├── load-summary.json           # Resultado do load test
├── load-summary.html           # Relatório HTML visual
├── stress-summary.json         # Resultado do stress test
└── spike-summary.json          # Resultado do spike test
```

### Métricas Importantes

**http_req_duration**
- Tempo total de resposta da requisição
- p(95): 95% das requisições abaixo deste valor
- p(99): 99% das requisições abaixo deste valor

**http_req_failed**
- Taxa de falha das requisições
- Status >= 400 ou timeout

**http_reqs**
- Total de requisições
- Taxa de requisições/segundo

**vus (Virtual Users)**
- Número de usuários simultâneos
- Max: pico de usuários

### Interpretar Resultados

**Sucesso:**
```
✅ http_req_duration.....p(95) < 1000ms
✅ http_req_failed.......rate < 0.05
```

**Falha:**
```
❌ http_req_duration.....p(95) < 1000ms (actual: 2453ms)
❌ http_req_failed.......rate < 0.05 (actual: 0.12)
```

## Thresholds Recomendados

### Produção
- p(95) < 500ms
- p(99) < 1000ms
- Taxa de erro < 1%

### Desenvolvimento
- p(95) < 1000ms
- p(99) < 2000ms
- Taxa de erro < 5%

### Stress/Spike
- p(99) < 5000ms
- Taxa de erro < 15%

## Troubleshooting

### Teste Falha Imediatamente

**Causa:** API não está rodando

**Solução:**
```bash
# Verificar se API está up
curl http://localhost:3000/health

# Iniciar API
npm run dev
```

### Alta Taxa de Erro

**Causa:** Rate limiting ou timeout

**Solução:**
- Aumentar timeout no teste
- Ajustar rate limit da API
- Reduzir número de VUs

### Memória Esgotada

**Causa:** Muitos VUs para a máquina

**Solução:**
```bash
# Reduzir VUs ou usar distributed testing
k6 run --vus 50 tests/load/stress.test.js
```

### Resultados HTML Não Gerados

**Causa:** Teste não concluiu ou sem permissão

**Solução:**
```bash
mkdir -p load-results
chmod 755 load-results
```

## Integração CI/CD

### GitHub Actions (exemplo)

```yaml
- name: Run Load Tests
  run: |
    k6 run \
      --out json=results.json \
      -e API_URL=${{ secrets.API_URL }} \
      tests/load/smoke.test.js
```

### Jenkins (exemplo)

```groovy
stage('Load Test') {
  steps {
    sh 'k6 run tests/load/smoke.test.js'
  }
}
```

## Boas Práticas

1. **Sempre começar com Smoke Test**
   - Valida que API está funcional

2. **Escalar progressivamente**
   - Smoke → Load → Spike → Stress

3. **Monitorar servidor durante testes**
   - CPU, memória, network
   - Logs de erro

4. **Testar em ambiente similar a produção**
   - Mesma configuração de hardware
   - Mesmo banco de dados

5. **Documentar baselines**
   - Guardar resultados anteriores
   - Comparar evolução

## Comparação com Ferramentas

| Ferramenta | Linguagem | Pros | Contras |
|------------|-----------|------|---------|
| k6 | JavaScript | Fácil, rápido, scriptável | - |
| Artillery | JavaScript | YAML config | Menos features |
| JMeter | Java | GUI, plugins | Pesado, complexo |
| Gatling | Scala | Relatórios | Curva de aprendizado |

## Próximos Passos

Após validar testes de carga:

1. **FASE 3: Mutation Testing com Stryker**
   - Qualidade dos testes unitários
   - Cobertura de mutação

---

**Última atualização:** 2025-01-05  
**Mantenedor:** Projeto LOR0138