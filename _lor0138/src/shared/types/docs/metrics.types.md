# Metrics Types - Documentação Completa

> **Módulo:** `shared/types/metrics.types`
> **Versão:** 1.0.0
> **Arquivo:** `src/shared/types/metrics.types.ts`

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [MetricsConfig](#metricsconfig)
4. [HttpMetrics](#httpmetrics)
5. [DatabaseMetrics](#databasemetrics)
6. [RateLimitMetrics](#ratelimitmetrics)
7. [SystemMetrics](#systemmetrics)
8. [MetricsSummary](#metricssummary)
9. [MetricType](#metrictype)
10. [MetricDefinition](#metricdefinition)
11. [Integração com Prometheus](#integração-com-prometheus)
12. [Alertas Sugeridos](#alertas-sugeridos)
13. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

Define todas as estruturas de dados relacionadas ao sistema de métricas da aplicação, incluindo métricas HTTP, Database, Rate Limiting e Sistema.

### Propósito

- ✅ Padronizar formato de métricas em toda aplicação
- ✅ Facilitar integração com **Prometheus/Grafana**
- ✅ Garantir **type-safety** em coleta de métricas
- ✅ Documentar métricas disponíveis

### Stack de Monitoramento

```
Aplicação (Node.js)
      ↓
  MetricsManager (coleta)
      ↓
  /metrics endpoint (expõe)
      ↓
  Prometheus (scrape)
      ↓
  Grafana (visualização)
      ↓
  Alertas (notificação)
```

---

## 🏗️ Arquitetura

### Componentes Principais

| Componente | Tipo | Descrição |
|------------|------|-----------|
| **MetricsConfig** | Interface | Configuração do sistema de métricas |
| **HttpMetrics** | Interface | Métricas de requisições HTTP/API |
| **DatabaseMetrics** | Interface | Métricas de banco de dados |
| **RateLimitMetrics** | Interface | Métricas de rate limiting |
| **SystemMetrics** | Interface | Métricas do sistema Node.js |
| **MetricsSummary** | Interface | Agregação de todas métricas |
| **MetricType** | Type | Tipos Prometheus (counter/gauge/histogram/summary) |
| **MetricDefinition** | Interface | Definição de métricas customizadas |

### Relacionamento

```
MetricsSummary
├── http: HttpMetrics
├── database: DatabaseMetrics
├── rateLimit: RateLimitMetrics
└── system: SystemMetrics
```

---

## ⚙️ MetricsConfig

Configuração do sistema de métricas Prometheus.

### Propósito

Permite habilitar/desabilitar coleta de métricas e customizar comportamento do sistema de monitoramento.

### Interface

```typescript
interface MetricsConfig {
  enabled: boolean;
  defaultLabels?: Record<string, string>;
  collectDefaultMetrics?: boolean;
  prefix?: string;
}
```

### Campos

#### enabled

**Tipo:** `boolean`
**Default:** `true`

Habilita/desabilita coleta de métricas.

**Comportamento:**
- `true`: Métricas são coletadas e expostas em `/metrics`
- `false`: Sistema de métricas fica inativo

```typescript
const config: MetricsConfig = {
  enabled: process.env.NODE_ENV === 'production'
};
```

#### defaultLabels

**Tipo:** `Record<string, string> | undefined`
**Opcional:** Sim

Labels padrão adicionados a todas métricas.

**Propósito:** Facilitar identificação de origem em ambientes multi-instância.

**Exemplos:**
```typescript
// Produção multi-região
defaultLabels: {
  app: 'lor0138',
  env: 'production',
  region: 'us-east-1',
  version: '1.0.0'
}

// Desenvolvimento
defaultLabels: {
  app: 'lor0138',
  env: 'development',
  developer: 'john.doe'
}
```

#### collectDefaultMetrics

**Tipo:** `boolean | undefined`
**Default:** `true`

Coleta métricas padrão do Node.js (CPU, memória, event loop, etc).

**Métricas incluídas:**
- `process_cpu_user_seconds_total` - CPU em modo usuário
- `process_cpu_system_seconds_total` - CPU em modo kernel
- `process_heap_bytes` - Uso de heap
- `nodejs_eventloop_lag_seconds` - Latência do event loop
- `nodejs_active_handles` - Handles ativos
- `nodejs_active_requests` - Requests ativos

#### prefix

**Tipo:** `string | undefined`
**Default:** `'lor0138_'`

Prefixo adicionado a todas métricas customizadas.

**Propósito:** Evitar conflitos de nomes em sistemas com múltiplas aplicações.

**Exemplo:**
```typescript
prefix: 'lor0138_'
// Gera: 'lor0138_http_requests_total'
```

### Exemplo Completo

```typescript
const config: MetricsConfig = {
  enabled: true,
  defaultLabels: {
    app: 'lor0138',
    env: 'production',
    region: 'us-east-1'
  },
  collectDefaultMetrics: true,
  prefix: 'lor0138_'
};
```

---

## 🌐 HttpMetrics

Métricas de requisições HTTP e API.

### Propósito

Monitorar performance, volume e saúde dos endpoints da API.

### Casos de Uso

- ✅ Identificar endpoints mais lentos
- ✅ Detectar aumento de erros
- ✅ Monitorar carga da API
- ✅ Planejar escalabilidade

### Interface

```typescript
interface HttpMetrics {
  totalRequests: number;
  requestsInProgress: number;
  requestDuration: number;
  requestsByStatus: Record<number, number>;
  requestsByEndpoint: Record<string, number>;
}
```

### Campos

#### totalRequests

**Tipo:** `number` (Counter)
**Labels:** `method`, `route`, `status_code`

Total de requisições processadas.

**Exemplos:**
```
lor0138_http_requests_total{method="GET", route="/health", status_code="200"} 1500
lor0138_http_requests_total{method="POST", route="/api/items", status_code="201"} 350
lor0138_http_requests_total{method="GET", route="/api/items/:id", status_code="404"} 80
```

**Query Prometheus:**
```promql
# Total de requests
sum(rate(lor0138_http_requests_total[5m]))

# Requests por rota
sum by(route) (rate(lor0138_http_requests_total[5m]))

# Taxa de erro (4xx + 5xx)
sum(rate(lor0138_http_requests_total{status_code=~"4..|5.."}[5m]))
```

#### requestsInProgress

**Tipo:** `number` (Gauge)
**Labels:** `method`, `route`

Número de requisições sendo processadas no momento.

**Alertas sugeridos:**
- `> 100`: Alta carga, considerar escalar
- `> 500`: Sobrecarga crítica

**Query Prometheus:**
```promql
# Requests ativas
lor0138_http_requests_in_progress

# Média de requests ativas (5min)
avg_over_time(lor0138_http_requests_in_progress[5m])
```

#### requestDuration

**Tipo:** `number` (Histogram)
**Labels:** `method`, `route`, `status_code`
**Buckets:** `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]` (segundos)

Duração das requisições em segundos.

**Alertas sugeridos:**
- `p95 > 1s`: Requisições lentas
- `p99 > 2s`: Performance degradada

**Query Prometheus:**
```promql
# P50 (mediana)
histogram_quantile(0.5, rate(lor0138_http_request_duration_seconds_bucket[5m]))

# P95
histogram_quantile(0.95, rate(lor0138_http_request_duration_seconds_bucket[5m]))

# P99
histogram_quantile(0.99, rate(lor0138_http_request_duration_seconds_bucket[5m]))

# Média
rate(lor0138_http_request_duration_seconds_sum[5m]) /
rate(lor0138_http_request_duration_seconds_count[5m])
```

#### requestsByStatus

**Tipo:** `Record<number, number>`

Contadores de requisições por status HTTP.

**Estrutura:**
```typescript
{
  200: 5000,  // Success
  201: 1200,  // Created
  204: 300,   // No Content
  400: 150,   // Bad Request
  401: 50,    // Unauthorized
  404: 80,    // Not Found
  500: 5,     // Internal Server Error
  503: 2      // Service Unavailable
}
```

**Propósito:** Identificar padrões de erro e sucesso.

#### requestsByEndpoint

**Tipo:** `Record<string, number>`

Contadores de requisições por endpoint.

**Estrutura:**
```typescript
{
  '/health': 10000,
  '/api/items/:id': 5000,
  '/api/items': 3000,
  '/metrics': 200
}
```

**Propósito:** Identificar endpoints mais utilizados.

---

## 🗄️ DatabaseMetrics

Métricas de operações de banco de dados.

### Propósito

Monitorar performance e saúde das conexões com banco de dados.

### Casos de Uso

- ✅ Identificar queries lentas
- ✅ Detectar problemas de conexão
- ✅ Otimizar pool de conexões
- ✅ Alertar sobre erros de banco

### Interface

```typescript
interface DatabaseMetrics {
  queriesTotal: number;
  queriesInProgress: number;
  queryDuration: number;
  queryErrors: number;
  connectionsActive: number;
  connectionErrors: number;
}
```

### Campos

#### queriesTotal

**Tipo:** `number` (Counter)
**Labels:** `database` (EMP/MULT), `operation` (select/insert/update/delete)

Total de queries executadas.

**Exemplos:**
```
lor0138_db_queries_total{database="EMP", operation="select"} 10000
lor0138_db_queries_total{database="MULT", operation="update"} 500
```

**Query Prometheus:**
```promql
# Queries por segundo
rate(lor0138_db_queries_total[5m])

# Queries por database
sum by(database) (rate(lor0138_db_queries_total[5m]))

# Queries por operação
sum by(operation) (rate(lor0138_db_queries_total[5m]))
```

#### queriesInProgress

**Tipo:** `number` (Gauge)
**Labels:** `database`

Número de queries em execução no momento.

**Alertas sugeridos:**
- `> 50`: Muitas queries simultâneas
- `> 100`: Possível problema de performance

**Query Prometheus:**
```promql
# Queries ativas por database
lor0138_db_queries_in_progress{database="EMP"}

# Máximo de queries ativas
max_over_time(lor0138_db_queries_in_progress[5m])
```

#### queryDuration

**Tipo:** `number` (Histogram)
**Labels:** `database`, `operation`
**Buckets:** `[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]` (segundos)

Duração das queries em segundos.

**Alertas sugeridos:**
- `p95 > 500ms`: Queries lentas
- `p99 > 1s`: Performance crítica

**Query Prometheus:**
```promql
# P95 de queries
histogram_quantile(0.95, rate(lor0138_db_query_duration_seconds_bucket[5m]))

# Queries mais lentas por database
histogram_quantile(0.99,
  rate(lor0138_db_query_duration_seconds_bucket[5m])) by (database)
```

#### queryErrors

**Tipo:** `number` (Counter)
**Labels:** `database`, `error_type` (timeout/connection/syntax/permission/deadlock)

Total de erros em queries.

**Alertas críticos:**
- Qualquer erro: Investigar imediatamente
- Taxa > 1%: Problema crítico

**Query Prometheus:**
```promql
# Taxa de erro
rate(lor0138_db_query_errors_total[5m]) /
rate(lor0138_db_queries_total[5m])

# Erros por tipo
sum by(error_type) (rate(lor0138_db_query_errors_total[5m]))
```

#### connectionsActive

**Tipo:** `number` (Gauge)
**Labels:** `database`

Número de conexões ativas com banco.

**Valores esperados:**
- Normal: 1-10 conexões
- Alta carga: 10-50 conexões
- Problema: 0 conexões ou > pool max

**Query Prometheus:**
```promql
# Conexões ativas
lor0138_db_connections_active

# Média de conexões
avg_over_time(lor0138_db_connections_active[5m])
```

#### connectionErrors

**Tipo:** `number` (Counter)
**Labels:** `database`, `error_type`

Total de erros de conexão.

**Alertas críticos:**
- `> 0`: Banco pode estar indisponível

**Query Prometheus:**
```promql
# Erros de conexão
rate(lor0138_db_connection_errors_total[5m])
```

---

## 🚦 RateLimitMetrics

Métricas de rate limiting e controle de acesso.

### Propósito

Monitorar uso de API e efetividade do rate limiting.

### Casos de Uso

- ✅ Identificar usuários abusivos
- ✅ Ajustar limites por tier
- ✅ Detectar tentativas de DoS
- ✅ Analisar padrões de uso

### Interface

```typescript
interface RateLimitMetrics {
  requestsBlocked: number;
  requestsAllowed: number;
  limitsByUser: Record<string, number>;
  limitsByEndpoint: Record<string, number>;
}
```

### Campos

#### requestsBlocked

**Tipo:** `number` (Counter)
**Labels:** `route`, `user_id`, `reason` (minute/hour/day limit exceeded)

Total de requisições bloqueadas por rate limit.

**Alertas:**
- Alta taxa para um user_id: Usuário pode estar abusando da API
- Muitos users bloqueados: Limites podem estar muito restritivos

**Query Prometheus:**
```promql
# Taxa de bloqueio geral
rate(lor0138_rate_limit_blocked_total[5m])

# Bloqueios por usuário
topk(10, sum by(user_id) (rate(lor0138_rate_limit_blocked_total[5m])))

# Bloqueios por motivo
sum by(reason) (rate(lor0138_rate_limit_blocked_total[5m]))
```

#### requestsAllowed

**Tipo:** `number` (Counter)
**Labels:** `route`, `user_id`

Total de requisições permitidas.

**Propósito:** Calcular taxa de bloqueio: `blocked / (blocked + allowed)`

**Query Prometheus:**
```promql
# Taxa de bloqueio (percentual)
rate(lor0138_rate_limit_blocked_total[5m]) /
(rate(lor0138_rate_limit_blocked_total[5m]) +
 rate(lor0138_rate_limit_allowed_total[5m])) * 100
```

#### limitsByUser

**Tipo:** `Record<string, number>`

Contadores de bloqueios por usuário.

**Estrutura:**
```typescript
{
  'user-001': 150,  // Bloqueado 150 vezes
  'user-002': 5,
  'user-003': 80
}
```

#### limitsByEndpoint

**Tipo:** `Record<string, number>`

Contadores de bloqueios por endpoint.

**Estrutura:**
```typescript
{
  '/api/items': 200,
  '/api/search': 50,
  '/api/reports': 30
}
```

---

## 💻 SystemMetrics

Métricas do sistema Node.js.

### Propósito

Monitorar saúde e recursos do processo Node.js.

### Casos de Uso

- ✅ Detectar memory leaks
- ✅ Monitorar uso de CPU
- ✅ Identificar necessidade de escalar
- ✅ Alertar sobre problemas de recurso

### Interface

```typescript
interface SystemMetrics {
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
}
```

### Campos

#### uptime

**Tipo:** `number` (Gauge)
**Unidade:** segundos

Tempo de atividade do processo.

**Propósito:** Verificar estabilidade e tempo desde último restart.

**Query Prometheus:**
```promql
# Uptime atual
lor0138_system_uptime_seconds

# Uptime em horas
lor0138_system_uptime_seconds / 3600
```

#### memoryUsage

**Tipo:** `object`

Uso de memória do processo.

##### heapUsed

**Tipo:** `number` (Gauge)
**Unidade:** bytes

Memória heap em uso (JavaScript objects).

**Alertas:**
- `> 1GB`: Considerar otimizar
- `> 80% heapTotal`: Próximo ao limite

##### heapTotal

**Tipo:** `number` (Gauge)
**Unidade:** bytes

Total de heap alocado pelo V8.

##### rss

**Tipo:** `number` (Gauge)
**Unidade:** bytes

Resident Set Size - memória total do processo.

**Alertas:**
- `> 2GB`: Memory leak possível

##### external

**Tipo:** `number` (Gauge)
**Unidade:** bytes

Memória de buffers C++ (fora do heap V8).

**Query Prometheus:**
```promql
# Uso de heap em MB
lor0138_system_memory_heap_used_bytes / 1024 / 1024

# Percentual de heap usado
lor0138_system_memory_heap_used_bytes /
lor0138_system_memory_heap_total_bytes * 100

# RSS em GB
lor0138_system_memory_rss_bytes / 1024 / 1024 / 1024
```

#### cpuUsage

**Tipo:** `object`

Uso de CPU do processo.

##### user

**Tipo:** `number` (Gauge)
**Unidade:** microsegundos

Tempo de CPU em modo usuário.

##### system

**Tipo:** `number` (Gauge)
**Unidade:** microsegundos

Tempo de CPU em modo kernel.

**Alertas:**
- Alta utilização sustentada: Gargalo de CPU

**Query Prometheus:**
```promql
# CPU total (user + system) em segundos
(lor0138_system_cpu_user_seconds +
 lor0138_system_cpu_system_seconds)

# Taxa de CPU
rate(lor0138_system_cpu_user_seconds[5m])
```

---

## 📊 MetricsSummary

Agregação de todas as métricas da aplicação.

### Propósito

Fornecer snapshot completo do estado da aplicação.

### Interface

```typescript
interface MetricsSummary {
  timestamp: string;
  http: HttpMetrics;
  database: DatabaseMetrics;
  rateLimit: RateLimitMetrics;
  system: SystemMetrics;
}
```

### Uso

```typescript
// Endpoint /metrics/summary
app.get('/metrics/summary', (req, res) => {
  const summary: MetricsSummary = {
    timestamp: new Date().toISOString(),
    http: metricsManager.getHttpMetrics(),
    database: metricsManager.getDatabaseMetrics(),
    rateLimit: metricsManager.getRateLimitMetrics(),
    system: metricsManager.getSystemMetrics()
  };

  res.json(summary);
});
```

### Exemplo de Resposta

```json
{
  "timestamp": "2025-01-04T15:30:00.000Z",
  "http": {
    "totalRequests": 15000,
    "requestsInProgress": 25,
    "requestDuration": 0.145,
    "requestsByStatus": {
      "200": 12000,
      "201": 1500,
      "400": 200,
      "404": 100,
      "500": 5
    },
    "requestsByEndpoint": {
      "/health": 5000,
      "/api/items/:id": 8000,
      "/metrics": 50
    }
  },
  "database": {
    "queriesTotal": 25000,
    "queriesInProgress": 10,
    "queryDuration": 0.025,
    "queryErrors": 2,
    "connectionsActive": 5,
    "connectionErrors": 0
  },
  "rateLimit": {
    "requestsBlocked": 150,
    "requestsAllowed": 14850,
    "limitsByUser": {
      "user-001": 100,
      "user-002": 50
    },
    "limitsByEndpoint": {
      "/api/items": 100,
      "/api/search": 50
    }
  },
  "system": {
    "uptime": 86400,
    "memoryUsage": {
      "heapUsed": 524288000,
      "heapTotal": 1073741824,
      "rss": 734003200,
      "external": 12582912
    },
    "cpuUsage": {
      "user": 1500000,
      "system": 500000
    }
  }
}
```

---

## 📝 MetricType

Tipos de métricas suportados pelo Prometheus.

### Type Definition

```typescript
type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';
```

### Descrição dos Tipos

#### counter

**Descrição:** Valor que **só aumenta** (nunca diminui ou reseta).

**Uso típico:**
- Total de requests
- Total de erros
- Total de items processados

**Exemplo:**
```typescript
// ❌ ERRADO: Counter não pode diminuir
counter.dec();

// ✅ CORRETO: Counter só incrementa
counter.inc();
counter.inc(5); // Incrementa 5
```

**Query Prometheus:**
```promql
# Taxa de incremento (por segundo)
rate(metric_total[5m])

# Total acumulado
metric_total
```

#### gauge

**Descrição:** Valor que pode **subir e descer** livremente.

**Uso típico:**
- Requests ativas no momento
- Conexões abertas
- Uso de memória
- Queue size

**Exemplo:**
```typescript
// ✅ Gauge pode aumentar e diminuir
gauge.inc();   // Incrementa 1
gauge.dec();   // Decrementa 1
gauge.set(42); // Define valor específico
```

**Query Prometheus:**
```promql
# Valor atual
metric

# Média (5min)
avg_over_time(metric[5m])

# Máximo (5min)
max_over_time(metric[5m])
```

#### histogram

**Descrição:** Distribui valores em **buckets** predefinidos e calcula quantiles.

**Uso típico:**
- Latência de requests
- Duração de queries
- Tamanho de payloads

**Buckets típicos (segundos):**
```typescript
[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
```

**Métricas geradas:**
- `metric_bucket{le="0.1"}` - Requests <= 100ms
- `metric_sum` - Soma de todas durações
- `metric_count` - Total de observações

**Query Prometheus:**
```promql
# P95 (95% das requests são mais rápidas que isso)
histogram_quantile(0.95, rate(metric_bucket[5m]))

# Média
rate(metric_sum[5m]) / rate(metric_count[5m])

# Taxa de requests lentas (> 1s)
rate(metric_bucket{le="1"}[5m])
```

#### summary

**Descrição:** Similar ao histogram, mas calcula quantiles **no client**.

**Uso típico:**
- Quando buckets fixos não são adequados
- Quando precisa de quantiles exatos

**Diferença vs Histogram:**

| Característica | Histogram | Summary |
|----------------|-----------|---------|
| **Cálculo** | Server (Prometheus) | Client (App) |
| **Flexibilidade** | Alta (queries) | Baixa (quantiles fixos) |
| **Performance** | Melhor | Pior |
| **Agregação** | Sim | Não |

**Recomendação:** Use **histogram** na maioria dos casos.

### Referência

https://prometheus.io/docs/concepts/metric_types/

---

## 🔧 MetricDefinition

Definição de uma métrica Prometheus.

### Interface

```typescript
interface MetricDefinition {
  name: string;
  help: string;
  type: MetricType;
  labelNames?: string[];
}
```

### Propósito

Estrutura para criar novas métricas dinamicamente.

### Convenções de Nomenclatura

#### Nome (name)

**Formato:** `<prefix>_<nome>_<unidade>`

**Regras:**
- ✅ Usar `snake_case`
- ✅ Incluir unidade no nome quando aplicável
- ✅ Usar sufixo apropriado para o tipo:
  - Counter: `_total`, `_count`
  - Gauge: sem sufixo ou `_current`
  - Histogram/Summary: `_seconds`, `_bytes`

**Exemplos:**
```
lor0138_http_requests_total        # Counter
lor0138_http_requests_in_progress  # Gauge
lor0138_http_request_duration_seconds  # Histogram
lor0138_db_connection_pool_size    # Gauge
```

#### Descrição (help)

**Boas práticas:**
- ✅ Descrever o que é medido
- ✅ Mencionar unidade se aplicável
- ✅ Ser conciso mas informativo

**Exemplos:**
```typescript
help: 'Total number of HTTP requests processed'
help: 'Current number of active database connections'
help: 'HTTP request duration in seconds'
help: 'Size of message queue in bytes'
```

#### Labels (labelNames)

**Propósito:** Permitir agregação e filtragem em queries.

**Boas práticas:**
- ✅ Usar dimensões com **baixa cardinalidade**
- ✅ Máximo recomendado: **10 labels** por métrica
- ❌ EVITAR alta cardinalidade:
  - `correlation_id` (milhares de valores únicos)
  - `user_email` (pode ter milhões de valores)
  - `timestamp` (infinitos valores)

**Exemplos:**

```typescript
// ✅ BOM: Baixa cardinalidade
labelNames: ['method', 'route', 'status_code']
// method: ~5 valores (GET, POST, PUT, DELETE, PATCH)
// route: ~50 valores (endpoints da API)
// status_code: ~15 valores (200, 201, 400, 404, 500, etc)

// ✅ BOM: Dimensões úteis
labelNames: ['database', 'operation']
// database: 2 valores (EMP, MULT)
// operation: 4 valores (select, insert, update, delete)

// ❌ RUIM: Alta cardinalidade
labelNames: ['user_id', 'correlation_id']
// user_id: milhares de valores
// correlation_id: milhões de valores
// Resultado: Prometheus fica lento e consome muita memória
```

### Exemplo Completo

```typescript
const definition: MetricDefinition = {
  name: 'lor0138_custom_operation_duration_seconds',
  help: 'Duration of custom operations in seconds',
  type: 'histogram',
  labelNames: ['operation', 'status']
};

// Uso:
const metric = new Histogram(definition);
metric.labels('process_payment', 'success').observe(0.145);
```

---

## 🔗 Integração com Prometheus

### Endpoint de Métricas

```typescript
import { register } from 'prom-client';

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Scrape Configuration (prometheus.yml)

```yaml
scrape_configs:
  - job_name: 'lor0138'
    scrape_interval: 15s
    scrape_timeout: 10s
    static_configs:
      - targets: ['localhost:3000']
        labels:
          app: 'lor0138'
          env: 'production'
```

### Formato das Métricas

```
# HELP lor0138_http_requests_total Total number of HTTP requests
# TYPE lor0138_http_requests_total counter
lor0138_http_requests_total{method="GET",route="/health",status_code="200"} 1500
lor0138_http_requests_total{method="POST",route="/api/items",status_code="201"} 350

# HELP lor0138_http_request_duration_seconds HTTP request duration in seconds
# TYPE lor0138_http_request_duration_seconds histogram
lor0138_http_request_duration_seconds_bucket{method="GET",route="/api/items",le="0.005"} 100
lor0138_http_request_duration_seconds_bucket{method="GET",route="/api/items",le="0.01"} 250
lor0138_http_request_duration_seconds_bucket{method="GET",route="/api/items",le="+Inf"} 1000
lor0138_http_request_duration_seconds_sum{method="GET",route="/api/items"} 145.5
lor0138_http_request_duration_seconds_count{method="GET",route="/api/items"} 1000
```

---

## 🚨 Alertas Sugeridos

### HTTP Metrics

```yaml
groups:
  - name: http_alerts
    rules:
      # Alta taxa de erro
      - alert: HighErrorRate
        expr: |
          sum(rate(lor0138_http_requests_total{status_code=~"5.."}[5m])) /
          sum(rate(lor0138_http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Alta taxa de erro (>5%)"

      # Requests lentas
      - alert: SlowRequests
        expr: |
          histogram_quantile(0.95,
            rate(lor0138_http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "P95 de latência > 1s"

      # Muitas requests ativas
      - alert: TooManyActiveRequests
        expr: lor0138_http_requests_in_progress > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Muitas requests ativas (>100)"
```

### Database Metrics

```yaml
  - name: database_alerts
    rules:
      # Queries lentas
      - alert: SlowQueries
        expr: |
          histogram_quantile(0.95,
            rate(lor0138_db_query_duration_seconds_bucket[5m])) > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Queries lentas (P95 > 500ms)"

      # Sem conexões
      - alert: NoActiveConnections
        expr: lor0138_db_connections_active == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Nenhuma conexão ativa com o banco"

      # Erros de query
      - alert: DatabaseErrors
        expr: rate(lor0138_db_query_errors_total[5m]) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Erros no banco de dados detectados"
```

### System Metrics

```yaml
  - name: system_alerts
    rules:
      # Alto uso de memória
      - alert: HighMemoryUsage
        expr: |
          lor0138_system_memory_heap_used_bytes /
          lor0138_system_memory_heap_total_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Alto uso de memória (>80% heap)"

      # Possível memory leak
      - alert: MemoryLeak
        expr: |
          rate(lor0138_system_memory_rss_bytes[1h]) > 0
        for: 2h
        labels:
          severity: warning
        annotations:
          summary: "Possível memory leak detectado"
```

---

## 💡 Exemplos de Uso

### Criar Configuração

```typescript
const config: MetricsConfig = {
  enabled: true,
  defaultLabels: {
    app: 'lor0138',
    env: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  },
  collectDefaultMetrics: true,
  prefix: 'lor0138_'
};
```

### Obter Summary Completo

```typescript
import { MetricsSummary } from '@shared/types/metrics.types';

const summary: MetricsSummary = {
  timestamp: new Date().toISOString(),
  http: {
    totalRequests: 15000,
    requestsInProgress: 25,
    requestDuration: 0.145,
    requestsByStatus: { 200: 12000, 400: 200, 500: 5 },
    requestsByEndpoint: { '/health': 5000, '/api/items': 8000 }
  },
  database: {
    queriesTotal: 25000,
    queriesInProgress: 10,
    queryDuration: 0.025,
    queryErrors: 2,
    connectionsActive: 5,
    connectionErrors: 0
  },
  rateLimit: {
    requestsBlocked: 150,
    requestsAllowed: 14850,
    limitsByUser: { 'user-001': 100 },
    limitsByEndpoint: { '/api/items': 100 }
  },
  system: {
    uptime: 86400,
    memoryUsage: {
      heapUsed: 524288000,
      heapTotal: 1073741824,
      rss: 734003200,
      external: 12582912
    },
    cpuUsage: { user: 1500000, system: 500000 }
  }
};
```

### Definir Métrica Customizada

```typescript
import { MetricDefinition } from '@shared/types/metrics.types';

const customMetric: MetricDefinition = {
  name: 'lor0138_payment_processing_duration_seconds',
  help: 'Duration of payment processing operations in seconds',
  type: 'histogram',
  labelNames: ['payment_method', 'status', 'currency']
};
```

### Registrar Métrica HTTP

```typescript
// Incrementar contador de requests
httpMetrics.totalRequests++;
httpMetrics.requestsByStatus[200]++;
httpMetrics.requestsByEndpoint['/api/items']++;

// Registrar duração
httpMetrics.requestDuration = 0.145; // 145ms
```

### Registrar Métrica Database

```typescript
// Query executada
dbMetrics.queriesTotal++;
dbMetrics.queriesInProgress++;

const startTime = Date.now();
try {
  await executeQuery();
  dbMetrics.queryDuration = (Date.now() - startTime) / 1000;
} catch (error) {
  dbMetrics.queryErrors++;
} finally {
  dbMetrics.queriesInProgress--;
}
```

---

**Última atualização:** 2025-10-07