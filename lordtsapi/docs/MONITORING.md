# Advanced Connection Monitoring Guide

Comprehensive guide for monitoring database connections using advanced metrics in LordtsAPI.

## Table of Contents

- [Overview](#overview)
- [Available Metrics](#available-metrics)
- [HTTP Endpoints](#http-endpoints)
- [Grafana Dashboard](#grafana-dashboard)
- [Prometheus Queries](#prometheus-queries)
- [Troubleshooting](#troubleshooting)
- [Alerting](#alerting)

## Overview

The LordtsAPI includes an advanced connection metrics system that tracks **28 database connections** across multiple systems:

- **18 Datasul ODBC connections** (Production, Test, Homologation × 6 databases)
- **4 Informix ODBC connections** (Development, Atualização, New, Production)
- **4 PCFactory SQL Server connections** (Production, Development × 2 databases)
- **2 Corporativo SQL Server connections** (Production, Development)

### Key Features

- **Latency tracking**: P50, P95, P99 percentiles
- **Throughput monitoring**: Queries per second
- **Reliability metrics**: Success rate, error rate
- **Pool utilization**: Active vs idle connections
- **Rolling window**: Last 5 minutes of data
- **Prometheus integration**: Full metrics export
- **Real-time updates**: Sub-second granularity

## Available Metrics

### Latency Metrics

Track query response times with percentile distribution:

- **P50 (Median)**: 50% of queries complete faster than this
- **P95**: 95% of queries complete faster than this
- **P99**: 99% of queries complete faster than this (tail latency)
- **Average**: Mean response time across all queries

**Recommended Thresholds:**
- P50 < 100ms: Excellent
- P95 < 500ms: Good
- P99 < 1000ms: Acceptable
- P99 > 2000ms: Investigate

### Throughput Metrics

Measure query volume:

- **Queries per second**: Current query rate
- **Total queries**: Cumulative count (lifetime)

**Typical Values:**
- Production: 10-50 qps
- Test: 1-10 qps
- Development: < 1 qps

### Reliability Metrics

Track success and failure rates:

- **Success rate**: Percentage of successful queries
- **Error rate**: Percentage of failed queries (0-1)
- **Failed queries**: Total count of failures

**Recommended Thresholds:**
- Success rate > 99.9%: Healthy
- Success rate 99-99.9%: Warning
- Success rate < 99%: Critical

### Pool Utilization

Monitor connection pool health:

- **Pool utilization**: Percentage of active connections (0-100%)
- **Active connections**: Currently executing queries
- **Idle connections**: Available in pool

**Recommended Thresholds:**
- Utilization < 70%: Healthy
- Utilization 70-90%: Warning (consider scaling)
- Utilization > 90%: Critical (pool exhaustion)

## HTTP Endpoints

### Get All Connection Metrics

```http
GET /health/connections/metrics
```

Returns comprehensive metrics for all 28 connections.

**Example Response:**

```json
{
  "success": true,
  "timestamp": "2025-10-25T15:30:00.000Z",
  "connections": [
    {
      "id": "DtsPrdEmp",
      "description": "Datasul Production - Empresa",
      "latency": {
        "p50": 145,
        "p95": 380,
        "p99": 520,
        "avg": 180
      },
      "throughput": {
        "queriesPerSecond": 15.3,
        "total": 1523
      },
      "reliability": {
        "successRate": "99.87",
        "errorRate": 0.0013,
        "failedQueries": 2
      },
      "pool": {
        "utilization": 45.2
      }
    }
  ],
  "summary": {
    "totalConnections": 28,
    "activeConnections": 12,
    "avgLatencyP95": 425,
    "totalThroughput": 145.7,
    "avgErrorRate": 0.002
  }
}
```

### Get Specific Connection Metrics

```http
GET /health/connections/metrics/:dsn
```

**Example:**

```bash
curl http://localhost:3000/health/connections/metrics/DtsPrdEmp
```

### Get Metrics by System

```http
GET /health/connections/metrics/by-system
```

Returns aggregated metrics grouped by system (datasul, informix, sqlserver).

**Example Response:**

```json
{
  "success": true,
  "systems": {
    "datasul": {
      "connections": 18,
      "avgLatencyP95": 350,
      "totalThroughput": 85.4,
      "avgErrorRate": 0.001
    },
    "informix": {
      "connections": 4,
      "avgLatencyP95": 280,
      "totalThroughput": 45.2,
      "avgErrorRate": 0.003
    },
    "sqlserver": {
      "connections": 6,
      "avgLatencyP95": 420,
      "totalThroughput": 15.1,
      "avgErrorRate": 0.002
    }
  }
}
```

### Get Slowest Connections

```http
GET /health/connections/metrics/slowest?limit=10
```

Returns top N connections ranked by P95 latency.

**Example Response:**

```json
{
  "success": true,
  "slowest": [
    {
      "id": "PCF4_PRD",
      "description": "PCFactory Production",
      "latencyP95": 850,
      "avgResponseTime": 520,
      "totalQueries": 1250
    }
  ]
}
```

## Grafana Dashboard

### Installation

1. Import the dashboard JSON:

```bash
# From Grafana UI
Dashboards > Import > Upload JSON file
Select: grafana/dashboards/connections-advanced.json
```

2. Configure Prometheus data source:

```bash
# Data source settings
URL: http://prometheus:9090
Access: Server (default)
```

### Dashboard Panels

The dashboard includes 8 panels:

#### Panel 1: Latency Heatmap

Visualizes latency distribution across all connections.

- X-axis: Time
- Y-axis: Connection ID
- Color: P95 latency (green < 500ms, yellow < 1000ms, red > 1000ms)

#### Panel 2: Throughput Timeline

Line chart showing queries/second per connection over time.

- Identifies traffic patterns
- Spots sudden spikes or drops
- Useful for capacity planning

#### Panel 3: Error Rate Gauges

Individual gauges for each connection's error rate.

- Green: < 0.1% error rate
- Yellow: 0.1-1% error rate
- Red: > 1% error rate

#### Panel 4: Pool Utilization Bar Chart

Horizontal bar chart of pool utilization per connection.

- Shows current pool pressure
- Identifies connections near capacity
- Helps optimize pool sizing

#### Panel 5: P95 Latency Top 10

Bar chart of slowest connections by P95 latency.

- Quick identification of performance issues
- Shows which connections need optimization
- Updated in real-time

#### Panel 6: Query Duration Distribution

Histogram showing distribution of query times.

- Identifies latency patterns
- Shows whether issues are systemic or isolated
- Helps set realistic SLOs

#### Panel 7: Connection Health Matrix

Colored grid showing health status of all connections.

- Green: Healthy (P95 < 500ms, error rate < 0.1%)
- Yellow: Warning (P95 < 1000ms, error rate < 1%)
- Red: Critical (P95 > 1000ms or error rate > 1%)

#### Panel 8: Total Queries Per Second

Single stat showing aggregate throughput across all connections.

- Includes breakdown by system type
- Shows trend over time
- Useful for overall system health

## Prometheus Queries

### Latency Percentiles

```promql
# P95 latency per connection
histogram_quantile(0.95,
  sum(rate(lor0138_connection_query_duration_seconds_bucket[5m])) by (connection_id, le)
)

# P99 latency per connection
histogram_quantile(0.99,
  sum(rate(lor0138_connection_query_duration_seconds_bucket[5m])) by (connection_id, le)
)

# Average latency per connection
rate(lor0138_connection_query_duration_seconds_sum[5m]) /
rate(lor0138_connection_query_duration_seconds_count[5m])
```

### Throughput

```promql
# Queries per second by connection
rate(lor0138_connection_queries_total[5m])

# Total throughput across all connections
sum(rate(lor0138_connection_queries_total[5m]))

# Top 10 busiest connections
topk(10, rate(lor0138_connection_queries_total[5m]))
```

### Error Rate

```promql
# Error rate by connection
rate(lor0138_connection_queries_failed[5m]) /
rate(lor0138_connection_queries_total[5m])

# Connections with errors > 1%
(rate(lor0138_connection_queries_failed[5m]) /
 rate(lor0138_connection_queries_total[5m])) > 0.01

# Total error count
sum(increase(lor0138_connection_queries_failed[1h]))
```

### Pool Utilization

```promql
# Pool utilization percentage
(lor0138_connection_pool_active /
 (lor0138_connection_pool_active + lor0138_connection_pool_idle)) * 100

# Connections with high utilization (> 80%)
((lor0138_connection_pool_active /
  (lor0138_connection_pool_active + lor0138_connection_pool_idle)) * 100) > 80
```

## Troubleshooting

### High Latency (P95 > 1000ms)

**Symptoms:**
- Slow API responses
- User complaints about performance
- P95 latency > 1000ms

**Diagnosis:**

1. Check which connection is slow:

```bash
curl http://localhost:3000/health/connections/metrics/slowest
```

2. Review query logs for that connection
3. Check database server load
4. Verify network connectivity

**Solutions:**

- Add database indexes
- Optimize slow queries
- Scale database resources
- Implement query caching
- Add read replicas

### High Error Rate (> 1%)

**Symptoms:**
- Failed requests
- Error logs
- Error rate > 1%

**Diagnosis:**

1. Identify failing connection:

```bash
curl http://localhost:3000/health/connections/metrics/by-system
```

2. Check connection health:

```bash
curl http://localhost:3000/health/connections/DtsPrdEmp
```

3. Review error logs:

```bash
grep "connection error" /var/log/lordtsapi/error.log
```

**Solutions:**

- Restart database connection
- Check database permissions
- Verify network stability
- Increase connection timeout
- Add retry logic

### Pool Exhaustion (> 90% utilization)

**Symptoms:**
- Connection timeout errors
- Pool wait times
- Utilization > 90%

**Diagnosis:**

1. Check pool metrics:

```bash
curl http://localhost:3000/health/connections/metrics/DtsPrdEmp
```

2. Review active query count
3. Check for connection leaks

**Solutions:**

- Increase pool size
- Add connection pooling timeout
- Fix connection leaks
- Implement query queuing
- Scale horizontally

### Low Throughput (< 1 qps)

**Symptoms:**
- Low traffic
- Unused connections
- Throughput < 1 qps

**Diagnosis:**

1. Verify application is receiving traffic
2. Check rate limiting settings
3. Review cache hit rate

**Solutions:**

- May be normal for low-traffic environments
- Adjust cache TTL
- Review rate limiter settings

## Alerting

### Recommended Alerts

#### Critical Alerts

**High Latency:**

```yaml
alert: ConnectionHighLatency
expr: |
  histogram_quantile(0.95,
    sum(rate(lor0138_connection_query_duration_seconds_bucket[5m])) by (connection_id, le)
  ) > 2
for: 5m
labels:
  severity: critical
annotations:
  summary: "Connection {{ $labels.connection_id }} has high P95 latency"
  description: "P95 latency is {{ $value }}s (threshold: 2s)"
```

**High Error Rate:**

```yaml
alert: ConnectionHighErrorRate
expr: |
  (rate(lor0138_connection_queries_failed[5m]) /
   rate(lor0138_connection_queries_total[5m])) > 0.05
for: 5m
labels:
  severity: critical
annotations:
  summary: "Connection {{ $labels.connection_id }} has high error rate"
  description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"
```

**Pool Exhaustion:**

```yaml
alert: ConnectionPoolExhausted
expr: |
  ((lor0138_connection_pool_active /
    (lor0138_connection_pool_active + lor0138_connection_pool_idle)) * 100) > 90
for: 10m
labels:
  severity: critical
annotations:
  summary: "Connection {{ $labels.connection_id }} pool is exhausted"
  description: "Pool utilization is {{ $value }}% (threshold: 90%)"
```

#### Warning Alerts

**Moderate Latency:**

```yaml
alert: ConnectionModerateLatency
expr: |
  histogram_quantile(0.95,
    sum(rate(lor0138_connection_query_duration_seconds_bucket[5m])) by (connection_id, le)
  ) > 1
for: 10m
labels:
  severity: warning
annotations:
  summary: "Connection {{ $labels.connection_id }} has moderate latency"
  description: "P95 latency is {{ $value }}s (threshold: 1s)"
```

**Elevated Error Rate:**

```yaml
alert: ConnectionElevatedErrorRate
expr: |
  (rate(lor0138_connection_queries_failed[5m]) /
   rate(lor0138_connection_queries_total[5m])) > 0.01
for: 10m
labels:
  severity: warning
annotations:
  summary: "Connection {{ $labels.connection_id }} has elevated error rate"
  description: "Error rate is {{ $value | humanizePercentage }} (threshold: 1%)"
```

### Slack Integration

Configure Alertmanager to send alerts to Slack:

```yaml
# alertmanager.yml
receivers:
  - name: 'slack-lordtsapi'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#lordtsapi-alerts'
        title: 'LordtsAPI Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}\n{{ end }}'

route:
  receiver: 'slack-lordtsapi'
  group_by: ['alertname', 'connection_id']
  group_wait: 10s
  group_interval: 5m
  repeat_interval: 4h
```

## Best Practices

### Monitoring

1. **Regular Review**: Check metrics dashboard daily
2. **Baseline Establishment**: Know normal values for your workload
3. **Trend Analysis**: Look for gradual degradation over time
4. **Alert Tuning**: Adjust thresholds to minimize false positives

### Performance Optimization

1. **Index Optimization**: Use slow query logs to identify missing indexes
2. **Query Optimization**: Review P99 queries for optimization opportunities
3. **Connection Pooling**: Size pools based on peak load + 20% buffer
4. **Caching**: Implement Redis caching for frequently accessed data

### Capacity Planning

1. **Peak Load**: Monitor peak throughput and plan for 2x capacity
2. **Growth Rate**: Track query growth month-over-month
3. **Scaling Triggers**: Set thresholds for horizontal scaling
4. **Resource Allocation**: Allocate more resources to high-traffic connections

### Maintenance

1. **Health Checks**: Run health checks before deployments
2. **Gradual Rollouts**: Deploy to test environment first
3. **Rollback Plan**: Have quick rollback procedure ready
4. **Post-Deployment**: Monitor metrics closely for 1 hour after deployment

## FAQ

### Q: How long are metrics retained?

A: Metrics are retained in a 5-minute rolling window in-memory. For long-term storage, Prometheus retains data based on its configuration (typically 15 days).

### Q: What's the overhead of metrics collection?

A: Minimal. Metrics collection adds < 1ms per query and < 10MB memory overhead for 28 connections.

### Q: Can I disable metrics for specific connections?

A: No, metrics are collected for all connections automatically. However, you can filter them out in Grafana.

### Q: How do I reset metrics?

A: Metrics reset automatically after the 5-minute rolling window. For immediate reset, restart the application.

### Q: What if a connection shows no metrics?

A: It means the connection hasn't received any queries yet. This is normal for infrequently used connections.

## Support

For issues or questions:

- GitHub Issues: https://github.com/acmano/lordtsapiBackend/issues
- Email: support@example.com
- Slack: #lordtsapi-support
