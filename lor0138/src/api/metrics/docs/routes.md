# Metrics Routes - Exposição de Métricas Prometheus

## 📋 Visão Geral

**Arquivo:** `src/api/metrics/routes.ts`
**Tipo:** Rotas de métricas (Express Router)
**Formato:** Prometheus Text-based Exposition Format
**Autenticação:** Public (configurar para produção)

Este módulo expõe métricas da aplicação no formato esperado pelo Prometheus para scraping automático.

### Métricas Coletadas

| Categoria | Descrição |
|-----------|-----------|
| **HTTP** | Requests total, duração, em progresso |
| **Database** | Queries, duração, erros, conexões ativas |
| **Rate Limit** | Requests bloqueadas/permitidas |
| **Health** | Status de health checks |
| **Sistema** | CPU, memória, uptime (Node.js default) |

---

## 📍 Endpoints Disponíveis

### Resumo

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/metrics` | Scraping de métricas (formato Prometheus) |
| GET | `/metrics/health` | Health check do sistema de métricas |

---

## 📊 GET /metrics

**Endpoint de Scraping Prometheus**

### Descrição

Retorna todas as métricas coletadas no formato texto esperado pelo Prometheus (Text-based Exposition Format).

### Request

```bash
curl http://localhost:3000/metrics
```

### Response (200 OK)

**Content-Type:** `text/plain; version=0.0.4; charset=utf-8`

```prometheus
# HELP lor0138_http_requests_total Total de requisições HTTP
# TYPE lor0138_http_requests_total counter
lor0138_http_requests_total{method="GET",route="/api/v1/familias",status_code="200"} 42
lor0138_http_requests_total{method="GET",route="/api/v1/familias",status_code="404"} 3
lor0138_http_requests_total{method="POST",route="/api/v1/items",status_code="201"} 15
lor0138_http_requests_total{method="POST",route="/api/v1/items",status_code="400"} 2

# HELP lor0138_http_request_duration_seconds Duração das requisições HTTP
# TYPE lor0138_http_request_duration_seconds histogram
lor0138_http_request_duration_seconds_bucket{le="0.005",method="GET",route="/api/v1/familias"} 35
lor0138_http_request_duration_seconds_bucket{le="0.01",method="GET",route="/api/v1/familias"} 40
lor0138_http_request_duration_seconds_bucket{le="0.025",method="GET",route="/api/v1/familias"} 41
lor0138_http_request_duration_seconds_bucket{le="0.05",method="GET",route="/api/v1/familias"} 42
lor0138_http_request_duration_seconds_bucket{le="0.1",method="GET",route="/api/v1/familias"} 42
lor0138_http_request_duration_seconds_bucket{le="0.25",method="GET",route="/api/v1/familias"} 42
lor0138_http_request_duration_seconds_bucket{le="0.5",method="GET",route="/api/v1/familias"} 42
lor0138_http_request_duration_seconds_bucket{le="1",method="GET",route="/api/v1/familias"} 42
lor0138_http_request_duration_seconds_bucket{le="2.5",method="GET",route="/api/v1/familias"} 42
lor0138_http_request_duration_seconds_bucket{le="5",method="GET",route="/api/v1/familias"} 42
lor0138_http_request_duration_seconds_bucket{le="10",method="GET",route="/api/v1/familias"} 42
lor0138_http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/api/v1/familias"} 42
lor0138_http_request_duration_seconds_sum{method="GET",route="/api/v1/familias"} 0.523
lor0138_http_request_duration_seconds_count{method="GET",route="/api/v1/familias"} 42

# HELP lor0138_http_requests_in_progress Requisições HTTP em progresso
# TYPE lor0138_http_requests_in_progress gauge
lor0138_http_requests_in_progress{method="GET",route="/api/v1/familias"} 2

# HELP lor0138_db_queries_total Total de queries no banco de dados
# TYPE lor0138_db_queries_total counter
lor0138_db_queries_total{database="EMP",operation="select"} 128
lor0138_db_queries_total{database="MULT",operation="select"} 45
lor0138_db_queries_total{database="EMP",operation="insert"} 12

# HELP lor0138_db_query_duration_seconds Duração das queries no banco
# TYPE lor0138_db_query_duration_seconds histogram
lor0138_db_query_duration_seconds_bucket{le="0.01",database="EMP",operation="select"} 100
lor0138_db_query_duration_seconds_bucket{le="0.05",database="EMP",operation="select"} 120
lor0138_db_query_duration_seconds_bucket{le="0.1",database="EMP",operation="select"} 125
lor0138_db_query_duration_seconds_bucket{le="0.5",database="EMP",operation="select"} 128
lor0138_db_query_duration_seconds_bucket{le="1",database="EMP",operation="select"} 128
lor0138_db_query_duration_seconds_bucket{le="+Inf",database="EMP",operation="select"} 128
lor0138_db_query_duration_seconds_sum{database="EMP",operation="select"} 2.456
lor0138_db_query_duration_seconds_count{database="EMP",operation="select"} 128

# HELP lor0138_db_query_errors_total Total de erros em queries
# TYPE lor0138_db_query_errors_total counter
lor0138_db_query_errors_total{database="EMP",error_type="timeout"} 2
lor0138_db_query_errors_total{database="MULT",error_type="connection_lost"} 1

# HELP lor0138_db_connections_active Conexões ativas no pool
# TYPE lor0138_db_connections_active gauge
lor0138_db_connections_active{database="EMP"} 5
lor0138_db_connections_active{database="MULT"} 3

# HELP lor0138_rate_limit_requests_blocked_total Requests bloqueadas por rate limit
# TYPE lor0138_rate_limit_requests_blocked_total counter
lor0138_rate_limit_requests_blocked_total{tier="free",limit_type="minute"} 15
lor0138_rate_limit_requests_blocked_total{tier="free",limit_type="hour"} 3

# HELP lor0138_rate_limit_requests_allowed_total Requests permitidas após rate limit check
# TYPE lor0138_rate_limit_requests_allowed_total counter
lor0138_rate_limit_requests_allowed_total{tier="free"} 985
lor0138_rate_limit_requests_allowed_total{tier="premium"} 8742

# HELP lor0138_health_check_status Status do último health check (1=healthy, 0=unhealthy)
# TYPE lor0138_health_check_status gauge
lor0138_health_check_status{component="database"} 1
lor0138_health_check_status{component="cache"} 1
lor0138_health_check_status{component="overall"} 1

# HELP process_cpu_user_seconds_total CPU do processo em user mode
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 45.234

# HELP process_cpu_system_seconds_total CPU do processo em system mode
# TYPE process_cpu_system_seconds_total counter
process_cpu_system_seconds_total 12.567

# HELP nodejs_heap_size_total_bytes Tamanho total do heap do Node.js
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes 67108864

# HELP nodejs_heap_size_used_bytes Heap usado do Node.js
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes 45678912

# HELP nodejs_external_memory_bytes Memória externa do Node.js
# TYPE nodejs_external_memory_bytes gauge
nodejs_external_memory_bytes 1234567

# HELP process_start_time_seconds Timestamp do início do processo
# TYPE process_start_time_seconds gauge
process_start_time_seconds 1696680000
```

### Response (500 Internal Server Error)

```json
{
  "error": "Erro ao obter métricas",
  "message": "Registry not initialized"
}
```

---

## 🏥 GET /metrics/health

**Health Check do Sistema de Métricas**

### Descrição

Verifica se o sistema de métricas está funcionando corretamente. Foca especificamente no subsistema de métricas, diferente do `/health` global.

### Request

```bash
curl http://localhost:3000/metrics/health
```

### Response (200 OK) - Healthy

```json
{
  "status": "healthy",
  "metrics": {
    "enabled": true,
    "ready": true
  }
}
```

### Response (503 Service Unavailable) - Unhealthy

```json
{
  "status": "unhealthy",
  "metrics": {
    "enabled": true,
    "ready": false
  }
}
```

### Status Codes

| Status | Condição |
|--------|----------|
| 200 | Sistema de métricas operacional |
| 503 | Sistema não inicializado ou com erro |

### Uso

| Contexto | Aplicação |
|----------|-----------|
| **Kubernetes** | Liveness/Readiness probe |
| **Docker** | HEALTHCHECK directive |
| **Load Balancer** | Health check backend |
| **Monitoring** | Scripts de monitoramento |

---

## 📊 Formato Prometheus

### Estrutura Básica

```prometheus
# HELP <metric_name> <description>
# TYPE <metric_name> <metric_type>
<metric_name>{label1="value1",label2="value2"} <value> [timestamp]
```

### Tipos de Métricas

#### 1️⃣ Counter (Contador)

**Definição:** Métrica que só aumenta (nunca diminui).

**Exemplo:**
```prometheus
# HELP lor0138_http_requests_total Total de requisições HTTP
# TYPE lor0138_http_requests_total counter
lor0138_http_requests_total{method="GET",route="/api/v1/familias",status_code="200"} 42
```

**Uso:** Contar eventos (requests, erros, queries).

**Reset:** Apenas em restart da aplicação.

---

#### 2️⃣ Gauge (Medidor)

**Definição:** Métrica que pode aumentar e diminuir.

**Exemplo:**
```prometheus
# HELP lor0138_http_requests_in_progress Requisições em progresso
# TYPE lor0138_http_requests_in_progress gauge
lor0138_http_requests_in_progress{method="GET",route="/api/v1/familias"} 2
```

**Uso:** Medir valores atuais (conexões ativas, CPU, memória).

**Reset:** Valor atual sempre reflete estado real.

---

#### 3️⃣ Histogram (Histograma)

**Definição:** Amostra observações e as agrupa em buckets configuráveis.

**Exemplo:**
```prometheus
# HELP lor0138_http_request_duration_seconds Duração das requisições HTTP
# TYPE lor0138_http_request_duration_seconds histogram
lor0138_http_request_duration_seconds_bucket{le="0.005",method="GET",route="/api/v1/familias"} 35
lor0138_http_request_duration_seconds_bucket{le="0.01",method="GET",route="/api/v1/familias"} 40
lor0138_http_request_duration_seconds_bucket{le="0.025",method="GET",route="/api/v1/familias"} 41
lor0138_http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/api/v1/familias"} 42
lor0138_http_request_duration_seconds_sum{method="GET",route="/api/v1/familias"} 0.523
lor0138_http_request_duration_seconds_count{method="GET",route="/api/v1/familias"} 42
```

**Uso:** Medir distribuições (latência, tamanho de resposta).

**Cálculos:**
- **Média:** `_sum / _count` = `0.523 / 42` = `0.012s`
- **Percentil 95:** Interpolação dos buckets
- **Taxa:** `rate(_count[5m])` = requests/segundo

---

#### 4️⃣ Summary (Resumo)

**Definição:** Similar ao histogram, mas calcula quantis no cliente.

**Exemplo:**
```prometheus
# HELP lor0138_request_size_bytes Tamanho das requisições
# TYPE lor0138_request_size_bytes summary
lor0138_request_size_bytes{quantile="0.5"} 1024
lor0138_request_size_bytes{quantile="0.9"} 4096
lor0138_request_size_bytes{quantile="0.99"} 8192
lor0138_request_size_bytes_sum 123456
lor0138_request_size_bytes_count 100
```

**Uso:** Quando quantis precisos são necessários.

---

## 🔧 Configuração do Prometheus

### prometheus.yml

```yaml
global:
  scrape_interval: 15s      # Coleta a cada 15 segundos
  evaluation_interval: 15s  # Avalia regras a cada 15 segundos
  external_labels:
    cluster: 'lor0138-production'
    environment: 'production'

scrape_configs:
  # Job para lor0138 API
  - job_name: 'lor0138-api'
    scrape_interval: 15s
    scrape_timeout: 10s
    metrics_path: '/metrics'

    static_configs:
      - targets:
          - 'lor0138.lorenzetti.ibe:3000'
        labels:
          service: 'lor0138-api'
          instance: 'api-01'

      - targets:
          - 'lor0138-backup.lorenzetti.ibe:3000'
        labels:
          service: 'lor0138-api'
          instance: 'api-02'

    # Autenticação (se configurada)
    # basic_auth:
    #   username: 'prometheus'
    #   password: 'secret'

    # Relabeling
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance

      - source_labels: [__address__]
        regex: '([^:]+).*'
        target_label: host
        replacement: '$1'

  # Job para Node Exporter (opcional)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['lor0138.lorenzetti.ibe:9100']

# Regras de alerta
rule_files:
  - 'alerts/lor0138.rules.yml'
```

---

### Regras de Alerta (lor0138.rules.yml)

```yaml
groups:
  - name: lor0138_api
    interval: 30s
    rules:
      # Alta taxa de erros HTTP
      - alert: HighHTTPErrorRate
        expr: |
          (
            sum(rate(lor0138_http_requests_total{status_code=~"5.."}[5m]))
            /
            sum(rate(lor0138_http_requests_total[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: warning
          service: lor0138-api
        annotations:
          summary: "Alta taxa de erros HTTP"
          description: "Taxa de erros HTTP 5xx acima de 5% nos últimos 5 minutos"

      # Latência alta
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(lor0138_http_request_duration_seconds_bucket[5m]))
            by (le, route)
          ) > 1
        for: 5m
        labels:
          severity: warning
          service: lor0138-api
        annotations:
          summary: "Latência P95 alta"
          description: "P95 de latência acima de 1s na rota {{ $labels.route }}"

      # Rate limit excessivo
      - alert: HighRateLimitBlocking
        expr: |
          (
            sum(rate(lor0138_rate_limit_requests_blocked_total[5m]))
            /
            sum(rate(lor0138_rate_limit_requests_allowed_total[5m]) + rate(lor0138_rate_limit_requests_blocked_total[5m]))
          ) > 0.1
        for: 10m
        labels:
          severity: info
          service: lor0138-api
        annotations:
          summary: "Alta taxa de bloqueio por rate limit"
          description: "Mais de 10% das requisições bloqueadas por rate limit"

      # Banco de dados lento
      - alert: SlowDatabaseQueries
        expr: |
          histogram_quantile(0.95,
            sum(rate(lor0138_db_query_duration_seconds_bucket[5m]))
            by (le, database, operation)
          ) > 0.5
        for: 10m
        labels:
          severity: warning
          service: lor0138-api
        annotations:
          summary: "Queries lentas no banco"
          description: "P95 de queries acima de 500ms em {{ $labels.database }}"

      # Health check failing
      - alert: HealthCheckFailing
        expr: lor0138_health_check_status{component="overall"} == 0
        for: 2m
        labels:
          severity: critical
          service: lor0138-api
        annotations:
          summary: "Health check falhou"
          description: "Aplicação não está saudável há mais de 2 minutos"

      # Sistema de métricas down
      - alert: MetricsDown
        expr: up{job="lor0138-api"} == 0
        for: 1m
        labels:
          severity: critical
          service: lor0138-api
        annotations:
          summary: "Sistema de métricas não está respondendo"
          description: "Prometheus não consegue fazer scraping das métricas"
```

---

## 📈 Integração com Grafana

### Dashboard - lor0138 API Overview

```json
{
  "dashboard": {
    "title": "lor0138 API Overview",
    "panels": [
      {
        "title": "Request Rate (req/s)",
        "targets": [
          {
            "expr": "sum(rate(lor0138_http_requests_total[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate (%)",
        "targets": [
          {
            "expr": "(sum(rate(lor0138_http_requests_total{status_code=~\"4..|5..\"}[5m])) / sum(rate(lor0138_http_requests_total[5m]))) * 100"
          }
        ]
      },
      {
        "title": "Latency (P50, P95, P99)",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(lor0138_http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(lor0138_http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(lor0138_http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P99"
          }
        ]
      },
      {
        "title": "Requests by Route",
        "targets": [
          {
            "expr": "sum(rate(lor0138_http_requests_total[5m])) by (route)"
          }
        ]
      },
      {
        "title": "Database Query Duration (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(lor0138_db_query_duration_seconds_bucket[5m])) by (le, database))"
          }
        ]
      },
      {
        "title": "Database Connections",
        "targets": [
          {
            "expr": "lor0138_db_connections_active"
          }
        ]
      },
      {
        "title": "Rate Limit (Blocked vs Allowed)",
        "targets": [
          {
            "expr": "sum(rate(lor0138_rate_limit_requests_blocked_total[5m]))",
            "legendFormat": "Blocked"
          },
          {
            "expr": "sum(rate(lor0138_rate_limit_requests_allowed_total[5m]))",
            "legendFormat": "Allowed"
          }
        ]
      },
      {
        "title": "Node.js Memory Usage",
        "targets": [
          {
            "expr": "nodejs_heap_size_used_bytes / 1024 / 1024",
            "legendFormat": "Heap Used (MB)"
          },
          {
            "expr": "nodejs_heap_size_total_bytes / 1024 / 1024",
            "legendFormat": "Heap Total (MB)"
          }
        ]
      }
    ]
  }
}
```

---

### Queries PromQL Úteis

#### Request Rate

```promql
# Requests por segundo (total)
sum(rate(lor0138_http_requests_total[5m]))

# Requests por segundo por método
sum(rate(lor0138_http_requests_total[5m])) by (method)

# Requests por segundo por rota
sum(rate(lor0138_http_requests_total[5m])) by (route)
```

#### Error Rate

```promql
# Taxa de erros 4xx
(
  sum(rate(lor0138_http_requests_total{status_code=~"4.."}[5m]))
  /
  sum(rate(lor0138_http_requests_total[5m]))
) * 100

# Taxa de erros 5xx
(
  sum(rate(lor0138_http_requests_total{status_code=~"5.."}[5m]))
  /
  sum(rate(lor0138_http_requests_total[5m]))
) * 100
```

#### Latência

```promql
# P50 (mediana)
histogram_quantile(0.50,
  sum(rate(lor0138_http_request_duration_seconds_bucket[5m])) by (le)
)

# P95
histogram_quantile(0.95,
  sum(rate(lor0138_http_request_duration_seconds_bucket[5m])) by (le)
)

# P99
histogram_quantile(0.99,
  sum(rate(lor0138_http_request_duration_seconds_bucket[5m])) by (le)
)

# Média
(
  sum(rate(lor0138_http_request_duration_seconds_sum[5m]))
  /
  sum(rate(lor0138_http_request_duration_seconds_count[5m]))
)
```

#### Database

```promql
# Queries por segundo
sum(rate(lor0138_db_queries_total[5m])) by (database)

# Duração média de queries
(
  sum(rate(lor0138_db_query_duration_seconds_sum[5m])) by (database)
  /
  sum(rate(lor0138_db_query_duration_seconds_count[5m])) by (database)
)

# Taxa de erros em queries
sum(rate(lor0138_db_query_errors_total[5m])) by (database, error_type)
```

#### Rate Limit

```promql
# Taxa de bloqueio
(
  sum(rate(lor0138_rate_limit_requests_blocked_total[5m]))
  /
  (
    sum(rate(lor0138_rate_limit_requests_allowed_total[5m]))
    +
    sum(rate(lor0138_rate_limit_requests_blocked_total[5m]))
  )
) * 100

# Bloqueios por tier
sum(rate(lor0138_rate_limit_requests_blocked_total[5m])) by (tier)
```

#### Sistema

```promql
# Uso de CPU (%)
rate(process_cpu_user_seconds_total[5m]) * 100

# Heap usado (MB)
nodejs_heap_size_used_bytes / 1024 / 1024

# Heap total (MB)
nodejs_heap_size_total_bytes / 1024 / 1024

# Uptime (horas)
(time() - process_start_time_seconds) / 3600
```

---

## 🔒 Segurança

### ⚠️ Exposição Pública

**Problema:** Endpoint `/metrics` expõe informações sensíveis.

**Informações expostas:**
- Taxa de requests (pode indicar volume de negócio)
- Rotas da API (superfície de ataque)
- Erros e failures (indicam vulnerabilidades)
- Recursos de infraestrutura (CPU, memória)

---

### ✅ Configuração em Produção

#### 1️⃣ Autenticação Básica

```typescript
// src/api/metrics/routes.ts
import basicAuth from 'express-basic-auth';

const metricsAuth = basicAuth({
  users: {
    'prometheus': process.env.METRICS_PASSWORD || 'change-me'
  },
  challenge: true,
  realm: 'Metrics'
});

// Aplicar em produção
if (process.env.NODE_ENV === 'production') {
  router.use(metricsAuth);
}
```

#### 2️⃣ IP Whitelist

```typescript
const allowedIPs = [
  '10.0.0.0/8',        // Rede interna
  '192.168.1.100',     // Prometheus server
];

router.use((req, res, next) => {
  const clientIP = req.ip;

  if (!isIPAllowed(clientIP, allowedIPs)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
});
```

#### 3️⃣ API Key

```typescript
router.use((req, res, next) => {
  const apiKey = req.headers['x-metrics-key'];

  if (apiKey !== process.env.METRICS_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
});
```

---

### 🛡️ Best Practices

- ✅ **Usar autenticação** em produção
- ✅ **Restringir IPs** do Prometheus
- ✅ **Não expor** endpoint externamente
- ✅ **Usar HTTPS** para scraping
- ✅ **Auditar acessos** ao endpoint
- ✅ **Reduzir labels** sensíveis (IDs de usuários)
- ✅ **Sanitizar dados** antes de exportar

---

## 🔍 Troubleshooting

### Problema: Prometheus não consegue fazer scraping

**Sintomas:**
- Alerta "MetricsDown" ativado
- Target aparece como "DOWN" no Prometheus UI

**Verificações:**

```bash
# 1. Verificar se endpoint está respondendo
curl http://localhost:3000/metrics

# 2. Verificar conectividade do Prometheus
curl http://lor0138.lorenzetti.ibe:3000/metrics

# 3. Verificar logs do Prometheus
tail -f /var/log/prometheus/prometheus.log

# 4. Verificar firewall
telnet lor0138.lorenzetti.ibe 3000
```

**Causas comuns:**
- Firewall bloqueando porta 3000
- Aplicação não está rodando
- Autenticação configurada incorretamente
- Timeout muito baixo no Prometheus

---

### Problema: Métricas não aparecem no Grafana

**Verificações:**

```bash
# 1. Testar query no Prometheus UI (http://prometheus:9090)
lor0138_http_requests_total

# 2. Verificar se datasource está configurado no Grafana
# Settings > Data Sources > Prometheus

# 3. Verificar se job está configurado no prometheus.yml
grep -A 5 "job_name: 'lor0138-api'" /etc/prometheus/prometheus.yml

# 4. Verificar se Prometheus está fazendo scraping
# Prometheus UI > Status > Targets
```

---

### Problema: Métricas com valores incorretos

**Causa:** Registry não foi resetado entre testes.

**Solução:**

```typescript
// Em testes
import { metricsManager } from '@infrastructure/metrics/MetricsManager';

beforeEach(() => {
  metricsManager.getRegistry().clear();
  metricsManager.initialize();
});
```

---

### Problema: Histogram com buckets inadequados

**Sintoma:** Todos valores no mesmo bucket, percentis imprecisos.

**Exemplo de problema:**
```typescript
// Buckets muito espaçados para latências de API
buckets: [0.1, 1, 10]  // 100ms, 1s, 10s

// Resultado: Maioria das requests (5-50ms) no primeiro bucket
```

**Solução:**
```typescript
// Buckets adequados para latências de API REST
buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
//         5ms   10ms  25ms   50ms 100ms 250ms 500ms 1s  2.5s 5s  10s
```

---

### Problema: Sistema de métricas não inicializado

**Response:** `503 Service Unavailable`

```json
{
  "status": "unhealthy",
  "metrics": {
    "enabled": true,
    "ready": false
  }
}
```

**Causa:** MetricsManager não foi inicializado no `server.ts`.

**Solução:**

```typescript
// src/server.ts
import { metricsManager } from '@infrastructure/metrics/MetricsManager';

async function startServer() {
  // ...

  // Inicializar métricas
  metricsManager.initialize();

  // ...
}
```

---

## 📚 Casos de Uso

### Caso 1: Monitoramento de SLA

**Objetivo:** Garantir 99.9% de uptime e P95 < 200ms.

**Queries:**

```promql
# Uptime (%)
(
  1 - (
    sum(rate(lor0138_http_requests_total{status_code=~"5.."}[30d]))
    /
    sum(rate(lor0138_http_requests_total[30d]))
  )
) * 100

# Latência P95
histogram_quantile(0.95,
  sum(rate(lor0138_http_request_duration_seconds_bucket[5m])) by (le)
)
```

**Alerta:**

```yaml
- alert: SLAViolation
  expr: |
    histogram_quantile(0.95,
      sum(rate(lor0138_http_request_duration_seconds_bucket[5m])) by (le)
    ) > 0.2
  for: 10m
  labels:
    severity: critical
```

---

### Caso 2: Capacity Planning

**Objetivo:** Prever quando adicionar mais instâncias.

**Queries:**

```promql
# Request rate atual
sum(rate(lor0138_http_requests_total[1h]))

# Requests em progresso (indicador de saturação)
sum(lor0138_http_requests_in_progress)

# Uso de CPU
rate(process_cpu_user_seconds_total[5m]) * 100

# Uso de memória
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100
```

**Análise:**
- Request rate crescendo 20%/semana → Planejamento
- CPU > 70% sustentado → Considerar scale-out
- Memória > 80% → Investigar memory leaks

---

### Caso 3: Debugging de Performance

**Objetivo:** Identificar rotas lentas.

**Queries:**

```promql
# Top 5 rotas mais lentas (P95)
topk(5,
  histogram_quantile(0.95,
    sum(rate(lor0138_http_request_duration_seconds_bucket[5m])) by (le, route)
  )
)

# Rotas com maior taxa de erros
topk(5,
  sum(rate(lor0138_http_requests_total{status_code=~"5.."}[5m])) by (route)
)

# Database queries lentas
topk(5,
  histogram_quantile(0.95,
    sum(rate(lor0138_db_query_duration_seconds_bucket[5m])) by (le, database, operation)
  )
)
```

---

### Caso 4: Análise de Rate Limiting

**Objetivo:** Avaliar efetividade dos limites.

**Queries:**

```promql
# Taxa de bloqueio por tier
(
  sum(rate(lor0138_rate_limit_requests_blocked_total[1h])) by (tier)
  /
  (
    sum(rate(lor0138_rate_limit_requests_allowed_total[1h])) by (tier)
    +
    sum(rate(lor0138_rate_limit_requests_blocked_total[1h])) by (tier)
  )
) * 100

# Usuários mais bloqueados (top 10)
topk(10,
  sum(rate(lor0138_rate_limit_requests_blocked_total[1h])) by (user_id)
)
```

**Ações:**
- Taxa alta em tier `free` → Normal, tier adequado
- Taxa alta em tier `enterprise` → Considerar aumentar limites
- Poucos bloqueios → Limites podem estar generosos

---

## 🎯 Boas Práticas

### ✅ DO

- ✅ **Usar naming conventions** do Prometheus (`_total`, `_seconds`, `_bytes`)
- ✅ **Adicionar labels** relevantes (method, route, status_code)
- ✅ **Limitar cardinalidade** de labels (evitar IDs únicos)
- ✅ **Documentar métricas** com `# HELP` e `# TYPE`
- ✅ **Usar histogramas** para latências
- ✅ **Manter buckets adequados** para distribuições
- ✅ **Expor métricas de sistema** (CPU, memória, GC)

### ❌ DON'T

- ❌ **Não usar labels** com alta cardinalidade (user_id, request_id)
- ❌ **Não expor PII** (dados pessoais) em labels
- ❌ **Não usar counters** para valores que diminuem
- ❌ **Não usar gauges** para valores que só aumentam
- ❌ **Não deixar endpoint público** em produção
- ❌ **Não logar senhas** ou secrets em métricas

---

## 🔗 Dependências

### Módulos Importados

```typescript
import { Router, Request, Response } from 'express';
import { metricsManager } from '@infrastructure/metrics/MetricsManager';
```

### Services Utilizados

- **MetricsManager** → Gerenciamento de métricas (Registry, Collectors)

---

## 🔗 Referências

- [MetricsManager](../../infrastructure/metrics/MetricsManager.ts) → Sistema de métricas
- [Prometheus Documentation](https://prometheus.io/docs/) → Documentação oficial
- [Grafana Documentation](https://grafana.com/docs/) → Documentação do Grafana
- [prom-client](https://github.com/siimon/prom-client) → Biblioteca Node.js

---

**Última atualização:** 2025-10-07