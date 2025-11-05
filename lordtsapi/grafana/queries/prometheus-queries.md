# Prometheus Queries for Database Connection Monitoring

This document contains all Prometheus queries used in Grafana dashboards for monitoring the 28 database connections in LordtsAPI.

## Table of Contents
1. [Connection Health](#connection-health)
2. [Query Metrics](#query-metrics)
3. [Latency Metrics](#latency-metrics)
4. [Error Metrics](#error-metrics)
5. [Circuit Breaker](#circuit-breaker)
6. [Retry Metrics](#retry-metrics)
7. [Connection Pool](#connection-pool)
8. [SLA Metrics](#sla-metrics)

---

## Connection Health

### Connection Up Status
```promql
# Check if connection is up (1 = up, 0 = down)
db_connection_up

# Filter by specific connection
db_connection_up{connection="DtsPrdEmp"}

# Count total healthy connections
count(db_connection_up == 1)

# Count down connections
count(db_connection_up == 0)
```

### Connection Info
```promql
# Get connection metadata
db_connection_info{connection="$connection"}

# Filter by system type
db_connection_info{system_type="datasul"}

# Filter by environment
db_connection_info{environment="production"}
```

---

## Query Metrics

### Query Rate (Queries per Second)
```promql
# Total query rate per connection (5m average)
sum(rate(db_queries_total{connection="$connection"}[5m]))

# Query rate by system type
sum(rate(db_queries_total{system_type="datasul"}[5m]))

# Query rate for all Datasul connections (18 total)
sum(rate(db_queries_total{system_type="datasul"}[5m]))

# Query rate for all Informix connections (4 total)
sum(rate(db_queries_total{system_type="informix"}[5m]))

# Query rate for all PCFactory connections (2 total)
sum(rate(db_queries_total{system_type="pcfactory"}[5m]))

# Query rate for all Corporativo connections (4 total)
sum(rate(db_queries_total{system_type="corporativo"}[5m]))
```

### Successful Query Rate
```promql
# Success rate (excluding failed queries)
rate(db_queries_total{connection="$connection"}[5m]) -
rate(db_queries_failed{connection="$connection"}[5m])

# Success rate percentage
(rate(db_queries_total{connection="$connection"}[5m]) -
 rate(db_queries_failed{connection="$connection"}[5m])) /
rate(db_queries_total{connection="$connection"}[5m]) * 100
```

### Query Throughput
```promql
# Total queries in last 5 minutes
sum(increase(db_queries_total{connection="$connection"}[5m]))

# Total queries across all connections
sum(increase(db_queries_total[5m]))
```

---

## Latency Metrics

### Latency Percentiles
```promql
# P50 latency (median) in milliseconds
histogram_quantile(0.50,
  sum(rate(db_query_duration_seconds_bucket{connection="$connection"}[5m])) by (le)
) * 1000

# P75 latency
histogram_quantile(0.75,
  sum(rate(db_query_duration_seconds_bucket{connection="$connection"}[5m])) by (le)
) * 1000

# P90 latency
histogram_quantile(0.90,
  sum(rate(db_query_duration_seconds_bucket{connection="$connection"}[5m])) by (le)
) * 1000

# P95 latency
histogram_quantile(0.95,
  sum(rate(db_query_duration_seconds_bucket{connection="$connection"}[5m])) by (le)
) * 1000

# P99 latency
histogram_quantile(0.99,
  sum(rate(db_query_duration_seconds_bucket{connection="$connection"}[5m])) by (le)
) * 1000
```

### Average Latency
```promql
# Average latency across all connections
histogram_quantile(0.50,
  sum(rate(db_query_duration_seconds_bucket[5m])) by (le)
) * 1000
```

### Top Slowest Connections
```promql
# Top 10 slowest connections by P95 latency
topk(10,
  histogram_quantile(0.95,
    sum(rate(db_query_duration_seconds_bucket[5m])) by (le, connection)
  ) * 1000
)
```

---

## Error Metrics

### Error Rate
```promql
# Error rate per connection (queries/sec)
sum(rate(db_queries_failed{connection="$connection"}[5m]))

# Error rate percentage
sum(rate(db_queries_failed{connection="$connection"}[5m])) /
sum(rate(db_queries_total{connection="$connection"}[5m])) * 100

# Error rate by system type
sum(rate(db_queries_failed{system_type="datasul"}[5m])) /
sum(rate(db_queries_total{system_type="datasul"}[5m])) * 100
```

### Total Errors
```promql
# Total errors in last 5 minutes
sum(increase(db_queries_failed{connection="$connection"}[5m]))

# Total errors across all connections
sum(increase(db_queries_failed[5m]))
```

### Error Details
```promql
# Recent errors with details
topk(100, db_query_errors{connection="$connection"})
```

### Connections with High Error Rate
```promql
# Connections with error rate > 1%
count(
  (sum(rate(db_queries_failed[5m])) by (connection) /
   sum(rate(db_queries_total[5m])) by (connection)) > 0.01
)

# Connections with error rate > 5% (critical)
count(
  (sum(rate(db_queries_failed[5m])) by (connection) /
   sum(rate(db_queries_total[5m])) by (connection)) > 0.05
)
```

---

## Circuit Breaker

### Circuit Breaker State
```promql
# Current state of circuit breaker
db_circuit_breaker_state{connection="$connection"}

# Numeric representation: 0=CLOSED, 1=HALF_OPEN, 2=OPEN
db_circuit_breaker_state_value{connection="$connection"}
```

### Circuit Breaker Status Count
```promql
# Count of CLOSED circuit breakers (healthy)
count(db_circuit_breaker_state{state="CLOSED"})

# Count of OPEN circuit breakers (failing)
count(db_circuit_breaker_state{state="OPEN"})

# Count of HALF_OPEN circuit breakers (testing recovery)
count(db_circuit_breaker_state{state="HALF_OPEN"})
```

### Circuit Breaker Transitions
```promql
# Total state transitions
sum(increase(db_circuit_breaker_transitions_total{connection="$connection"}[5m]))

# Transitions to OPEN state (failures)
sum(increase(db_circuit_breaker_transitions_total{connection="$connection", to_state="OPEN"}[5m]))
```

---

## Retry Metrics

### Retry Attempts
```promql
# Total retry attempts
sum(rate(db_retry_attempts_total{connection="$connection"}[5m]))

# Total retry attempts in last 5 minutes
sum(increase(db_retry_attempts_total{connection="$connection"}[5m]))

# Retry attempts across all connections
sum(increase(db_retry_attempts_total[5m]))
```

### Retry Success Rate
```promql
# Retry success rate (percentage)
sum(rate(db_retry_success_total{connection="$connection"}[5m])) /
sum(rate(db_retry_attempts_total{connection="$connection"}[5m])) * 100

# Average retry success rate across all connections
sum(rate(db_retry_success_total[5m])) /
sum(rate(db_retry_attempts_total[5m])) * 100
```

### Retry Distribution
```promql
# Retry attempts by attempt number (1st, 2nd, 3rd retry, etc.)
sum(rate(db_retry_attempts_total{connection="$connection"}[5m])) by (attempt)
```

### Failed Retries
```promql
# Queries that failed after all retries
sum(rate(db_retry_failed_total{connection="$connection"}[5m]))

# Percentage of queries that exhausted all retries
sum(rate(db_retry_failed_total{connection="$connection"}[5m])) /
sum(rate(db_queries_total{connection="$connection"}[5m])) * 100
```

---

## Connection Pool

### Pool Utilization
```promql
# Current pool utilization percentage
(db_pool_active_connections{connection="$connection"} /
 db_pool_max_connections{connection="$connection"}) * 100

# Average pool utilization
avg(db_pool_active_connections / db_pool_max_connections) * 100
```

### Pool Metrics
```promql
# Active connections in pool
db_pool_active_connections{connection="$connection"}

# Idle connections in pool
db_pool_idle_connections{connection="$connection"}

# Waiting requests (queue depth)
db_pool_waiting_requests{connection="$connection"}

# Maximum pool size
db_pool_max_connections{connection="$connection"}
```

### Pool Health
```promql
# Connections with high pool utilization (> 85%)
count((db_pool_active_connections / db_pool_max_connections) > 0.85)

# Average waiting time
avg(db_pool_wait_duration_seconds{connection="$connection"})
```

### Active vs Idle Distribution
```promql
# Total active connections across all pools
sum(db_pool_active_connections)

# Total idle connections across all pools
sum(db_pool_idle_connections)
```

---

## SLA Metrics

### SLA Compliance
```promql
# Percentage of queries < 500ms (SLA target: 99.9%)
(sum(rate(db_query_duration_seconds_bucket{le="0.5"}[5m])) /
 sum(rate(db_query_duration_seconds_count[5m]))) * 100

# SLA compliance per connection
(sum(rate(db_query_duration_seconds_bucket{connection="$connection", le="0.5"}[5m])) /
 sum(rate(db_query_duration_seconds_count{connection="$connection"}[5m]))) * 100
```

### Availability
```promql
# Connection availability percentage
avg_over_time(db_connection_up{connection="$connection"}[5m]) * 100

# Overall system availability (all 28 connections)
(count(db_connection_up == 1) / 28) * 100
```

### Health Score
```promql
# Composite health score (0-100)
# Factors: uptime, error rate, latency, pool utilization
(
  (db_connection_up{connection="$connection"} * 25) +
  ((1 - (sum(rate(db_queries_failed{connection="$connection"}[5m])) /
         sum(rate(db_queries_total{connection="$connection"}[5m])))) * 25) +
  ((1 - clamp_max(histogram_quantile(0.95, sum(rate(db_query_duration_seconds_bucket{connection="$connection"}[5m])) by (le)) / 2, 1)) * 25) +
  ((1 - (db_pool_active_connections{connection="$connection"} /
         db_pool_max_connections{connection="$connection"})) * 25)
)
```

---

## Alerting Queries

### Critical Conditions
```promql
# Circuit breaker OPEN
db_circuit_breaker_state{state="OPEN"} == 1

# Error rate > 5%
(sum(rate(db_queries_failed[5m])) by (connection) /
 sum(rate(db_queries_total[5m])) by (connection)) > 0.05

# P95 latency > 1000ms
histogram_quantile(0.95,
  sum(rate(db_query_duration_seconds_bucket[5m])) by (le, connection)
) > 1

# Connection down
db_connection_up == 0

# Pool utilization > 95% (critical)
(db_pool_active_connections / db_pool_max_connections) > 0.95
```

### Warning Conditions
```promql
# Error rate 1-5%
(sum(rate(db_queries_failed[5m])) by (connection) /
 sum(rate(db_queries_total[5m])) by (connection)) > 0.01

# P95 latency 500-1000ms
histogram_quantile(0.95,
  sum(rate(db_query_duration_seconds_bucket[5m])) by (le, connection)
) > 0.5

# Pool utilization 85-95%
(db_pool_active_connections / db_pool_max_connections) > 0.85
```

---

## Advanced Queries

### Multi-Dimensional Analysis
```promql
# Error rate by system type and environment
sum(rate(db_queries_failed[5m])) by (system_type, environment) /
sum(rate(db_queries_total[5m])) by (system_type, environment) * 100

# Latency distribution by environment
histogram_quantile(0.95,
  sum(rate(db_query_duration_seconds_bucket[5m])) by (le, environment)
) * 1000
```

### Time-based Comparisons
```promql
# Compare current vs 1 hour ago
db_queries_total - db_queries_total offset 1h

# Growth rate
rate(db_queries_total[5m]) / rate(db_queries_total[5m] offset 1h)
```

### Correlation Analysis
```promql
# Correlation between error rate and latency
label_replace(
  sum(rate(db_queries_failed[5m])) by (connection),
  "metric", "error_rate", "", ""
) /
label_replace(
  histogram_quantile(0.95, sum(rate(db_query_duration_seconds_bucket[5m])) by (le, connection)),
  "metric", "p95_latency", "", ""
)
```

---

## Query Best Practices

1. **Use rate() for counters**: Always use `rate()` or `increase()` for counter metrics
2. **Choose appropriate time ranges**: Use `[5m]` for real-time, `[1h]` for trends
3. **Use label filtering**: Filter by `connection`, `system_type`, or `environment` to reduce cardinality
4. **Aggregate wisely**: Use `sum()`, `avg()`, `max()` based on metric semantics
5. **Watch for division by zero**: Use `clamp_min()` or conditional checks
6. **Optimize dashboard queries**: Reuse common subqueries with variables

---

## Metric Labels

All metrics include these labels:
- `connection`: Connection name (e.g., "DtsPrdEmp", "LgxDev")
- `system_type`: System type ("datasul", "informix", "pcfactory", "corporativo")
- `environment`: Environment ("production", "test", "homologation")
- `hostname`: Database server hostname
- `port`: Database server port
- `database`: Database name

---

## Related Documentation

- [Grafana Dashboard Documentation](../docs/GRAFANA_DASHBOARDS.md)
- [Alert Rules](../grafana/alerts/database-alerts.yaml)
- [Metrics Implementation](../src/infrastructure/metrics/MetricsManager.ts)
