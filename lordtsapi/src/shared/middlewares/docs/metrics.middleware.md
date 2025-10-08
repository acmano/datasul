# Middleware de Métricas (Prometheus)

**Arquivo:** `src/shared/middlewares/metrics.middleware.ts`
**Tipo:** Middleware Express
**Propósito:** Coleta automática de métricas HTTP para Prometheus

---

## Visão Geral

Middleware que intercepta todas as requisições HTTP e coleta métricas automaticamente para monitoramento via Prometheus e visualização em Grafana.

### O que é Prometheus?

**Prometheus** é um sistema de monitoramento e alertas open-source que coleta e armazena métricas em séries temporais.

**Fluxo:**
```
API Express
    ↓
Métricas coletadas
    ↓
Endpoint /metrics expõe dados
    ↓
Prometheus faz scraping
    ↓
Grafana visualiza dashboards
```

### Métricas Coletadas

| Métrica | Tipo | O que mede |
|---------|------|------------|
| `httpRequestsTotal` | Counter | Total de requisições |
| `httpRequestDuration` | Histogram | Duração das requisições |
| `httpRequestsInProgress` | Gauge | Requisições em andamento |
| `rateLimitRequestsBlocked` | Counter | Bloqueios por rate limit |
| `rateLimitRequestsAllowed` | Counter | Requisições permitidas |

---

## Tipos de Métricas

### Counter

Contador que **só aumenta** (nunca diminui).

**Uso:** Contagens de eventos totais.

**Exemplos:**
- Total de requisições
- Total de erros
- Total de bloqueios

**Operações:**
- `inc()` - Incrementa
- `inc(n)` - Incrementa por n

**Queries PromQL:**
```promql
# Total de requisições
httpRequestsTotal

# Taxa de crescimento (por segundo)
rate(httpRequestsTotal[5m])

# Total de erros (status 5xx)
httpRequestsTotal{status_code=~"5.."}
```

---

### Gauge

Valor que **pode aumentar ou diminuir**.

**Uso:** Medições instantâneas.

**Exemplos:**
- Requisições em progresso
- Uso de memória
- Conexões ativas

**Operações:**
- `inc()` - Incrementa
- `dec()` - Decrementa
- `set(n)` - Define valor

**Queries PromQL:**
```promql
# Requisições em andamento
httpRequestsInProgress

# Média nos últimos 5min
avg_over_time(httpRequestsInProgress[5m])

# Máximo atingido
max_over_time(httpRequestsInProgress[1h])
```

---

### Histogram

Distribui observações em **buckets** (intervalos).

**Uso:** Distribuição de valores (duração, tamanho, etc).

**Exemplos:**
- Duração de requisições
- Tamanho de respostas
- Latência de queries

**Operações:**
- `observe(value)` - Registra observação

**Métricas geradas:**
- `_sum` - Soma de todos os valores
- `_count` - Quantidade de observações
- `_bucket` - Contagem por intervalo

**Queries PromQL:**
```promql
# Latência média
rate(httpRequestDuration_sum[5m]) / rate(httpRequestDuration_count[5m])

# Percentil 95 (95% das requisições)
histogram_quantile(0.95, rate(httpRequestDuration_bucket[5m]))

# Percentil 99 (99% das requisições)
histogram_quantile(0.99, rate(httpRequestDuration_bucket[5m]))
```

---

## Setup

### Registro no App

```typescript
// src/app.ts
import express from 'express';
import { correlationIdMiddleware } from '@shared/middlewares/correlationId.middleware';
import { metricsMiddleware } from '@shared/middlewares/metrics.middleware';

const app = express();

// ⚠️ ORDEM IMPORTANTE:
app.use(correlationIdMiddleware);  // 1. Primeiro (tracking)
app.use(metricsMiddleware);        // 2. Segundo (métricas)
// ... outros middlewares
app.use('/api', routes);           // 3. Rotas depois

export default app;
```

### Endpoint de Métricas

```typescript
// src/api/routes/metrics.routes.ts
import { Router } from 'express';
import { metricsManager } from '@infrastructure/metrics/MetricsManager';

const router = Router();

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', metricsManager.register.contentType);
  res.end(await metricsManager.register.metrics());
});

export default router;
```

---

## metricsMiddleware

### Funcionamento

```
Request recebida
    ↓
Ignora /metrics? ──YES──→ next() (previne loop)
    ↓ NO
Captura startTime
    ↓
Normaliza rota (/api/item/123 → /api/item/:id)
    ↓
Incrementa httpRequestsInProgress
    ↓
Executa handler (next)
    ↓
Event 'finish' dispara
    ↓
Calcula duration
    ↓
Decrementa httpRequestsInProgress
    ↓
Incrementa httpRequestsTotal
    ↓
Observa httpRequestDuration
```

### Labels Coletadas

**method**
- Método HTTP
- Valores: GET, POST, PUT, DELETE, PATCH

**route**
- Rota normalizada
- Ex: `/api/item/:id`

**status_code**
- Status HTTP da resposta
- Valores: 200, 201, 400, 404, 500, etc

### Exemplo de Métricas Exportadas

```promql
# Counter - Total de requisições
httpRequestsTotal{method="GET",route="/api/item/:id",status_code="200"} 1523

# Gauge - Requisições em progresso
httpRequestsInProgress{method="GET",route="/api/item/:id"} 3

# Histogram - Duração
httpRequestDuration_bucket{method="GET",route="/api/item/:id",status_code="200",le="0.1"} 1200
httpRequestDuration_bucket{method="GET",route="/api/item/:id",status_code="200",le="0.5"} 1500
httpRequestDuration_bucket{method="GET",route="/api/item/:id",status_code="200",le="1"} 1520
httpRequestDuration_sum{method="GET",route="/api/item/:id",status_code="200"} 156.8
httpRequestDuration_count{method="GET",route="/api/item/:id",status_code="200"} 1523
```

---

## Normalização de Rotas

### O Problema: Cardinalidade Alta

**Sem normalização:**
```
/api/item/7530110 → Métrica 1
/api/item/7530111 → Métrica 2
/api/item/7530112 → Métrica 3
...
/api/item/9999999 → Métrica N

Resultado: Milhões de séries temporais
Prometheus: Out of Memory 💥
```

**Com normalização:**
```
/api/item/7530110 → /api/item/:id
/api/item/7530111 → /api/item/:id
/api/item/7530112 → /api/item/:id
...

Resultado: 1 série temporal
Prometheus: Feliz ✅
```

### Padrões Detectados

**1. Item Codes específicos**
```typescript
// Padrão
/api/lor0138/item/dadosCadastrais/informacoesGerais/[CÓDIGO]

// Exemplos
/api/.../informacoesGerais/7530110
  → /api/.../informacoesGerais/:itemCodigo

/api/.../informacoesGerais/ABC123
  → /api/.../informacoesGerais/:itemCodigo
```

**2. UUIDs**
```typescript
// Padrão
[8-4-4-4-12 hex digits]

// Exemplo
/api/user/550e8400-e29b-41d4-a716-446655440000
  → /api/user/:uuid
```

**3. IDs numéricos**
```typescript
// Padrão
/..../[número]

// Exemplos
/api/order/12345
  → /api/order/:id

/api/product/999
  → /api/product/:id
```

### Adicionar Novos Padrões

```typescript
const patterns = [
  // ... padrões existentes

  // Códigos de barras (EAN-13)
  {
    regex: /\/\d{13}$/,
    replacement: '/:barcode',
  },

  // SKUs alfanuméricos
  {
    regex: /\/[A-Z]{3}\d{6}$/i,
    replacement: '/:sku',
  },

  // Slugs de produtos
  {
    regex: /\/products\/[a-z0-9-]+$/,
    replacement: '/products/:slug',
  },
];
```

---

## rateLimitMetricsMiddleware

### Funcionamento

```
Rate limiter executado
    ↓
rateLimitMetricsMiddleware executado
    ↓
Normaliza rota
    ↓
Obtém userId (ou 'anonymous')
    ↓
Status 429? ──YES──→ Incrementa rateLimitRequestsBlocked
    ↓ NO
Incrementa rateLimitRequestsAllowed
```

### Uso com Rate Limiter

```typescript
import { rateLimiter } from '@shared/middlewares/rateLimiter.middleware';
import { rateLimitMetricsMiddleware } from '@shared/middlewares/metrics.middleware';

// Ordem correta
router.get('/api/items',
  rateLimiter,                  // 1. Aplica rate limit
  rateLimitMetricsMiddleware,   // 2. Coleta métricas
  itemController.getItems       // 3. Handler
);
```

### Labels Coletadas

**route** - Rota normalizada
**user_id** - ID do usuário ou 'anonymous'
**reason** - Motivo do bloqueio (apenas em blocked)

### Exemplo de Métricas

```promql
# Requisições bloqueadas
rateLimitRequestsBlocked{route="/api/items",user_id="user-123",reason="rate_limit_exceeded"} 45

# Requisições permitidas
rateLimitRequestsAllowed{route="/api/items",user_id="user-123"} 955
```

---

## Queries PromQL

### Requisições por Segundo

```promql
# Total (todas as rotas)
rate(httpRequestsTotal[5m])

# Por rota
rate(httpRequestsTotal{route="/api/item/:id"}[5m])

# Por método
rate(httpRequestsTotal{method="POST"}[5m])
```

### Taxa de Erro

```promql
# Percentual de erros 5xx
sum(rate(httpRequestsTotal{status_code=~"5.."}[5m]))
/
sum(rate(httpRequestsTotal[5m]))
* 100

# Erros 4xx
sum(rate(httpRequestsTotal{status_code=~"4.."}[5m]))
```

### Latência

```promql
# Latência média (p50)
histogram_quantile(0.50, rate(httpRequestDuration_bucket[5m]))

# Latência p95 (95% das requisições)
histogram_quantile(0.95, rate(httpRequestDuration_bucket[5m]))

# Latência p99 (99% das requisições)
histogram_quantile(0.99, rate(httpRequestDuration_bucket[5m]))
```

### Requisições em Progresso

```promql
# Atual
httpRequestsInProgress

# Média nos últimos 5min
avg_over_time(httpRequestsInProgress[5m])

# Pico nas últimas 24h
max_over_time(httpRequestsInProgress[24h])
```

### Top Rotas Mais Lentas

```promql
# Top 10 rotas com maior latência média
topk(10,
  rate(httpRequestDuration_sum[5m])
  /
  rate(httpRequestDuration_count[5m])
)
```

### Top Rotas Mais Acessadas

```promql
# Top 10 rotas com mais requisições
topk(10, rate(httpRequestsTotal[5m]))
```

### Rate Limiting

```promql
# Taxa de bloqueio
rate(rateLimitRequestsBlocked[5m])
/
(rate(rateLimitRequestsBlocked[5m]) + rate(rateLimitRequestsAllowed[5m]))
* 100

# Top 10 usuários mais bloqueados
topk(10, rate(rateLimitRequestsBlocked[5m]))

# Bloqueios por rota
sum by (route) (rate(rateLimitRequestsBlocked[5m]))
```

---

## Dashboard Grafana

### Painel 1: Overview

**Métricas principais:**

```promql
# Total de Requisições (últimas 24h)
sum(increase(httpRequestsTotal[24h]))

# Taxa de Requisições (req/s)
sum(rate(httpRequestsTotal[5m]))

# Taxa de Erro
sum(rate(httpRequestsTotal{status_code=~"5.."}[5m]))
/ sum(rate(httpRequestsTotal[5m])) * 100

# Latência p95
histogram_quantile(0.95, rate(httpRequestDuration_bucket[5m]))
```

### Painel 2: Performance

**Gráfico de Latência:**
```promql
# p50, p95, p99 em um gráfico
histogram_quantile(0.50, rate(httpRequestDuration_bucket[5m]))
histogram_quantile(0.95, rate(httpRequestDuration_bucket[5m]))
histogram_quantile(0.99, rate(httpRequestDuration_bucket[5m]))
```

**Requisições em Progresso:**
```promql
httpRequestsInProgress
```

### Painel 3: Rotas

**Tabela de Top Rotas:**
```promql
# Ordenar por volume
topk(20, sum by (route) (rate(httpRequestsTotal[5m])))
```

### Painel 4: Erros

**Gráfico de Erros por Status:**
```promql
sum by (status_code) (rate(httpRequestsTotal{status_code=~"[45].."}[5m]))
```

### Painel 5: Rate Limiting

**Taxa de Bloqueio:**
```promql
sum(rate(rateLimitRequestsBlocked[5m])) * 100
/
(sum(rate(rateLimitRequestsBlocked[5m])) + sum(rate(rateLimitRequestsAllowed[5m])))
```

**Top Usuários Bloqueados:**
```promql
topk(10, sum by (user_id) (rate(rateLimitRequestsBlocked[5m])))
```

---

## Alertas Prometheus

### Latência Alta

```yaml
- alert: HighLatency
  expr: histogram_quantile(0.95, rate(httpRequestDuration_bucket[5m])) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Latência p95 acima de 1s"
    description: "p95 está em {{ $value }}s"
```

### Taxa de Erro Alta

```yaml
- alert: HighErrorRate
  expr: |
    sum(rate(httpRequestsTotal{status_code=~"5.."}[5m]))
    /
    sum(rate(httpRequestsTotal[5m]))
    > 0.05
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Taxa de erro acima de 5%"
    description: "Taxa de erro em {{ $value | humanizePercentage }}"
```

### Requisições em Progresso Alta

```yaml
- alert: TooManyRequestsInProgress
  expr: httpRequestsInProgress > 100
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Mais de 100 requisições em progresso"
    description: "{{ $value }} requisições ativas"
```

---

## Troubleshooting

### Métricas não aparecem

**Causa:** Middleware não registrado

**Solução:**
```typescript
// Registrar ANTES das rotas
app.use(metricsMiddleware);
app.use('/api', routes);
```

---

### Loop infinito de /metrics

**Causa:** Middleware não ignora /metrics

**Solução:**
```typescript
if (req.path === '/metrics') {
  return next();
}
```

---

### Cardinalidade explodindo

**Sintoma:** Prometheus com uso alto de memória

**Causa:** Rotas não estão sendo normalizadas

**Verificar:**
```bash
# Ver rotas únicas
curl http://localhost:9090/api/v1/label/route/values
```

**Solução:** Adicionar padrão em `normalizeRoute()`

---

### Duração sempre zero

**Causa:** Calculando em milissegundos

**Solução:** Converter para segundos
```typescript
const duration = (Date.now() - startTime) / 1000; // ✅ Segundos
```

---

### Métricas desatualizadas

**Causa:** Prometheus não está fazendo scraping

**Verificar:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'api'
    scrape_interval: 15s  # Intervalo de coleta
    static_configs:
      - targets: ['api:3000']
```

---

## Boas Práticas

### ✅ DO

**1. Sempre normalize rotas**
```typescript
// ✅ Normaliza
const route = normalizeRoute(req.path);

// ❌ Não normaliza (cardinalidade alta)
const route = req.path;
```

**2. Use duração em segundos**
```typescript
// ✅ Segundos (padrão Prometheus)
const duration = (Date.now() - startTime) / 1000;

// ❌ Milissegundos
const duration = Date.now() - startTime;
```

**3. Ignore endpoint /metrics**
```typescript
// ✅ Previne loop
if (req.path === '/metrics') {
  return next();
}
```

**4. Use labels consistentes**
```typescript
// ✅ Sempre mesmos labels
{ method, route, status_code }

// ❌ Labels variáveis
{ method, path, status } // às vezes
{ method, route, code }   // outras vezes
```

**5. Monitore cardinalidade**
```promql
# Verificar número de séries
count({__name__=~"http.*"})
```

---

### ❌ DON'T

**1. Não use valores únicos como labels**
```typescript
// ❌ Cada ID = nova série
.inc({ user_id: req.user.id })

// ✅ Agrupe por tipo
.inc({ user_type: req.user.type })
```

**2. Não inclua timestamps nos labels**
```typescript
// ❌ Cada segundo = nova série
.inc({ timestamp: Date.now() })

// ✅ Prometheus já registra timestamp
.inc({ method, route })
```

**3. Não use labels de alta cardinalidade**
```typescript
// ❌ Email único = nova série
.inc({ email: req.user.email })

// ✅ Domínio = cardinalidade baixa
.inc({ domain: req.user.email.split('@')[1] })
```

**4. Não normalize demais**
```typescript
// ❌ Muito genérico (perde informação)
'/api/:resource/:action/:id' // Todas rotas viram isso

// ✅ Específico o suficiente
'/api/item/:id'
'/api/user/:id'
'/api/order/:id'
```

**5. Não esqueça de decrementar gauges**
```typescript
// ❌ Incrementa mas não decrementa
metricsManager.httpRequestsInProgress.inc();
// ... handler
// Esqueceu de decrementar!

// ✅ Sempre decrementa
metricsManager.httpRequestsInProgress.inc();
res.on('finish', () => {
  metricsManager.httpRequestsInProgress.dec();
});
```

---

## Referências

### Arquivos Relacionados

- `MetricsManager.ts` - Gerenciador de métricas
- `correlationId.middleware.ts` - Tracking de requisições
- `app.ts` - Setup da aplicação

### Links Externos

- [Prometheus Docs](https://prometheus.io/docs/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [Best Practices](https://prometheus.io/docs/practices/naming/)

### Conceitos

- **Time Series** - Série temporal de métricas
- **Scraping** - Prometheus coleta métricas
- **Cardinality** - Número de séries únicas
- **Labels** - Dimensões das métricas

---

## Resumo

### O que é

Middleware que coleta métricas HTTP automaticamente para monitoramento via Prometheus.

### Exports

- **metricsMiddleware** - Métricas HTTP principais
- **rateLimitMetricsMiddleware** - Métricas de rate limit

### Métricas Coletadas

- Total de requisições (counter)
- Duração (histogram)
- Requisições em progresso (gauge)
- Bloqueios de rate limit (counter)

### Crítico

- ✅ Normalizar rotas (cardinalidade)
- ✅ Duração em segundos
- ✅ Ignorar /metrics
- ✅ Decrementar gauges
- ✅ Labels consistentes