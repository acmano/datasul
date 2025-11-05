# Grafana Dashboards for LordtsAPI Database Monitoring

Complete guide to Grafana dashboards for monitoring 28 database connections in LordtsAPI.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Dashboard Details](#dashboard-details)
4. [Metrics Reference](#metrics-reference)
5. [Alerting](#alerting)
6. [Troubleshooting](#troubleshooting)
7. [Customization](#customization)

---

## Overview

The LordtsAPI monitoring stack provides comprehensive observability for **28 database connections** across 4 systems:

- **18 Datasul connections** (Production, Test, Homologation environments)
- **4 Informix connections** (Development, Atualização, New, Production)
- **2 PCFactory connections** (Production, Test)
- **4 Corporativo connections** (Production, Test, Development, Staging)

### Technology Stack

- **Grafana**: Dashboard and visualization
- **Prometheus**: Metrics collection and storage
- **Alertmanager**: Alert routing and notification
- **Node Exporter**: System metrics

### Architecture

```
┌─────────────────┐
│   LordtsAPI     │ ──> Exposes metrics at /metrics
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Prometheus    │ ──> Scrapes and stores metrics
└─────────────────┘
         │
         ▼
┌─────────────────┐
│    Grafana      │ ──> Visualizes data
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Alertmanager   │ ──> Routes alerts to receivers
└─────────────────┘
```

---

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- LordtsAPI running and exposing metrics at `:3000/metrics`
- Ports available: 3001 (Grafana), 9090 (Prometheus), 9093 (Alertmanager)

### 2. Start Monitoring Stack

```bash
# Run the setup script
./scripts/setup-monitoring.sh

# Or manually
docker-compose -f docker-compose.monitoring.yml up -d
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `admin`
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

### 4. Navigate to Dashboards

In Grafana, go to **Dashboards** → **Database Monitoring** folder:

1. **Database Connections - Overview**: All 28 connections at a glance
2. **Database Connection - Details**: Deep dive into specific connection
3. **Database Alerts & SLA**: Critical issues and SLA compliance

---

## Dashboard Details

### Dashboard 1: Database Connections - Overview

**Purpose**: High-level health and performance across all 28 connections

**Panels:**

#### 1. Connection Health Matrix
- **Type**: Stat panel with color coding
- **What it shows**: Health status of each connection
- **Colors**:
  - Green = Healthy (UP)
  - Red = Down (connection failed)
- **Click behavior**: Drill down to connection details

#### 2. Total Queries per Second by System
- **Type**: Time series graph
- **What it shows**: Query throughput grouped by system
- **Lines**:
  - Datasul (18 connections)
  - Informix (4 connections)
  - PCFactory (2 connections)
  - Corporativo (4 connections)
- **Use case**: Identify traffic patterns and load distribution

#### 3. Error Rate by System (%)
- **Type**: Gauge panel
- **What it shows**: Error rate percentage for each system
- **Thresholds**:
  - Green: < 1% (healthy)
  - Yellow: 1-5% (warning)
  - Red: > 5% (critical)
- **Use case**: Quickly identify problematic systems

#### 4. Average Latency Trend
- **Type**: Time series graph
- **What it shows**: P50, P95, P99 latency percentiles
- **Colors**:
  - Green: P50 (median)
  - Yellow: P95
  - Red: P99
- **Threshold line**: 500ms (SLA target)
- **Use case**: Monitor performance trends and SLA compliance

#### 5. Circuit Breaker Status
- **Type**: Stat panel
- **What it shows**: Count of circuit breakers in each state
- **States**:
  - CLOSED (green) = Normal operation
  - HALF_OPEN (yellow) = Testing recovery
  - OPEN (red) = Connection failing
- **Alert**: Any OPEN circuit breakers

#### 6. Top 10 Slowest Connections (P95)
- **Type**: Bar gauge
- **What it shows**: 10 connections with highest P95 latency
- **Colors**: Green → Yellow → Red gradient
- **Use case**: Identify performance bottlenecks

#### 7. Connection Pool Utilization
- **Type**: Heatmap
- **What it shows**: Pool usage % for each connection over time
- **Colors**:
  - Green: < 70% (healthy)
  - Yellow: 70-85% (caution)
  - Red: > 85% (critical)
- **Use case**: Identify capacity issues

#### 8. Active vs Idle Connections
- **Type**: Pie chart
- **What it shows**: Distribution of active/idle connections
- **Colors**:
  - Orange: Active connections
  - Green: Idle connections
- **Use case**: Pool efficiency analysis

---

### Dashboard 2: Database Connection - Details

**Purpose**: Deep dive analysis for a specific connection

**Variable**: `$connection` - Select from dropdown to switch connections

**Panels:**

#### 1. Connection Information
- **Type**: Stat panel
- **What it shows**: Metadata (DSN, type, environment, host, port)
- **Use case**: Verify connection configuration

#### 2. Latency Distribution (Histogram)
- **Type**: Heatmap
- **What it shows**: Distribution of query latencies
- **Buckets**: 0-50ms, 50-100ms, 100-200ms, 200-500ms, 500ms+
- **Colors**: Spectral gradient (blue → red)
- **Use case**: Identify latency patterns and outliers

#### 3. Response Time Percentiles
- **Type**: Time series graph
- **What it shows**: P50, P75, P90, P95, P99 over time
- **Threshold**: 500ms (yellow), 1000ms (red)
- **Use case**: Track performance trends

#### 4. Query Rate (Success vs Failed)
- **Type**: Stacked area graph
- **What it shows**: Queries/sec broken down by success/failure
- **Colors**:
  - Green: Successful queries
  - Red: Failed queries
- **Use case**: Monitor error trends

#### 5. Recent Errors (Last 100)
- **Type**: Table
- **What it shows**: Latest 100 errors with details
- **Columns**: Timestamp, Error Message, Duration
- **Sorting**: Most recent first
- **Use case**: Error analysis and debugging

#### 6. Retry Attempts (5m)
- **Type**: Stat panel
- **What it shows**: Total retry attempts in last 5 minutes
- **Thresholds**: Yellow > 100, Red > 500
- **Use case**: Identify connection instability

#### 7. Retry Success Rate
- **Type**: Gauge
- **What it shows**: % of retries that succeeded
- **Thresholds**:
  - Red: < 50%
  - Yellow: 50-80%
  - Green: > 80%
- **Use case**: Evaluate retry effectiveness

#### 8. Retry Attempts Distribution
- **Type**: Bar chart (stacked)
- **What it shows**: Distribution by attempt number (1st, 2nd, 3rd retry)
- **Use case**: Understand retry patterns

#### 9. Circuit Breaker Timeline
- **Type**: State timeline
- **What it shows**: Circuit breaker state changes over time
- **States**: CLOSED, HALF_OPEN, OPEN
- **Use case**: Identify failure patterns and recovery cycles

#### 10. Connection Pool Metrics
- **Type**: Stacked area graph
- **What it shows**: Active, idle, and waiting connections
- **Colors**:
  - Orange: Active
  - Green: Idle
  - Red: Waiting (queued)
- **Use case**: Pool sizing and capacity planning

---

### Dashboard 3: Database Alerts & SLA

**Purpose**: Monitor critical issues and SLA compliance

**Panels:**

#### 1. Critical Connections
- **Type**: Stat panel (red background)
- **What it shows**: Count of connections with critical issues
- **Criteria**:
  - Circuit breaker OPEN
  - Error rate > 5%
  - P95 > 1000ms
- **Alert**: Any count > 0

#### 2. Degraded Connections
- **Type**: Stat panel (yellow background)
- **What it shows**: Count of connections with warnings
- **Criteria**:
  - Error rate 1-5%
  - P95 500-1000ms
  - Pool utilization > 85%
- **Alert**: Monitor for growth

#### 3. SLA Compliance (< 500ms)
- **Type**: Gauge
- **What it shows**: % of queries completing under 500ms
- **Target**: 99.9%
- **Thresholds**:
  - Red: < 99.5%
  - Yellow: 99.5-99.9%
  - Green: > 99.9%
- **Use case**: Track SLA adherence

#### 4. Alert History (Last 50)
- **Type**: Table
- **What it shows**: Recent alerts from Prometheus
- **Columns**: Timestamp, Alert, Connection, Severity, State
- **Color coding**: Critical (red), Warning (yellow)
- **Sorting**: Most recent first

#### 5. Connection Health Distribution
- **Type**: Pie chart
- **What it shows**: Breakdown by health status
- **Categories**:
  - Healthy (green)
  - Degraded (yellow)
  - Critical (red)
  - Down (dark red)
- **Target**: > 95% healthy

#### 6. Alert Firing Trend
- **Type**: Stacked area graph
- **What it shows**: Active alerts over time
- **Series**:
  - Critical alerts (red)
  - Warning alerts (yellow)
- **Use case**: Track alert volume and trends

---

## Metrics Reference

### Core Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `db_connection_up` | Gauge | Connection health (1=up, 0=down) |
| `db_queries_total` | Counter | Total queries executed |
| `db_queries_failed` | Counter | Failed queries |
| `db_query_duration_seconds` | Histogram | Query latency distribution |
| `db_circuit_breaker_state` | Gauge | Circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN) |
| `db_retry_attempts_total` | Counter | Retry attempts |
| `db_retry_success_total` | Counter | Successful retries |
| `db_pool_active_connections` | Gauge | Active connections in pool |
| `db_pool_idle_connections` | Gauge | Idle connections in pool |
| `db_pool_max_connections` | Gauge | Maximum pool size |

### Labels

All metrics include:
- `connection`: Connection name (e.g., "DtsPrdEmp")
- `system_type`: "datasul", "informix", "pcfactory", "corporativo"
- `environment`: "production", "test", "homologation", etc.
- `hostname`: Database server hostname
- `port`: Database server port

### Common Queries

See [prometheus-queries.md](../grafana/queries/prometheus-queries.md) for comprehensive query examples.

---

## Alerting

### Alert Rules

Alert rules are defined in `grafana/alerts/database-alerts.yaml` and cover:

#### Critical Alerts
- **DatabaseConnectionDown**: Connection unreachable for 2 minutes
- **HighErrorRateCritical**: Error rate > 5% for 5 minutes
- **HighLatencyCritical**: P95 > 1000ms for 5 minutes
- **CircuitBreakerOpen**: Circuit breaker opened
- **ConnectionPoolExhausted**: Pool utilization > 95%
- **SLAViolation**: < 99.9% queries under 500ms

#### Warning Alerts
- **HighErrorRateWarning**: Error rate 1-5%
- **HighLatencyWarning**: P95 500-1000ms
- **ConnectionPoolHighUtilization**: Pool > 85%
- **FrequentCircuitBreakerTransitions**: Unstable connection

#### Info Alerts
- **SustainedHighThroughput**: Planning indicator
- **TrafficGrowth**: 50% increase vs yesterday

### Alert Receivers

Configure in `prometheus/alertmanager.yml`:

- **Email**: SMTP configuration for email notifications
- **Slack**: Webhook integration for Slack channels
- **PagerDuty**: Integration for on-call rotation
- **Webhook**: Custom HTTP endpoints

### Inhibition Rules

Smart alert suppression to prevent spam:
- Connection down → suppresses other alerts for that connection
- Circuit breaker open → suppresses error rate alerts
- Pool exhausted → suppresses pool utilization warnings
- Environment down → suppresses individual connection alerts

---

## Troubleshooting

### Common Issues

#### 1. Dashboards Not Loading

**Symptom**: Empty dashboards or "No data" errors

**Solutions**:
- Verify LordtsAPI is running: `curl http://localhost:3000/metrics`
- Check Prometheus targets: http://localhost:9090/targets
- Verify time range in Grafana (top right)
- Check browser console for errors

#### 2. Metrics Not Showing Up

**Symptom**: Specific metrics missing from panels

**Solutions**:
- Verify metric exists: http://localhost:9090/graph → Query metric name
- Check Prometheus scrape interval (15s default)
- Verify labels match (connection, system_type, environment)
- Check Prometheus logs: `docker logs lordtsapi-prometheus`

#### 3. Alerts Not Firing

**Symptom**: No alerts despite issues

**Solutions**:
- Check Prometheus rules: http://localhost:9090/rules
- Verify alert expression in Prometheus: http://localhost:9090/graph
- Check Alertmanager status: http://localhost:9093
- Review Alertmanager logs: `docker logs lordtsapi-alertmanager`

#### 4. High Resource Usage

**Symptom**: Docker containers using too much CPU/memory

**Solutions**:
- Reduce scrape frequency in `prometheus.yml`
- Decrease data retention: `--storage.tsdb.retention.time=15d`
- Limit dashboard refresh rate
- Use recording rules for expensive queries

### Debug Commands

```bash
# Check container status
docker-compose -f docker-compose.monitoring.yml ps

# View logs
docker logs lordtsapi-grafana
docker logs lordtsapi-prometheus
docker logs lordtsapi-alertmanager

# Restart services
docker-compose -f docker-compose.monitoring.yml restart

# Full reset
docker-compose -f docker-compose.monitoring.yml down -v
./scripts/setup-monitoring.sh
```

---

## Customization

### Adding New Panels

1. Open dashboard in Grafana
2. Click "Add" → "Visualization"
3. Write Prometheus query
4. Configure visualization type
5. Save dashboard

### Creating Custom Alerts

1. Edit `grafana/alerts/database-alerts.yaml`
2. Add new rule under appropriate group:

```yaml
- alert: MyCustomAlert
  expr: my_metric > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Custom alert fired"
    description: "Details here"
```

3. Reload Prometheus:
```bash
curl -X POST http://localhost:9090/-/reload
```

### Dashboard Variables

Add variables for dynamic filtering:

1. Dashboard settings → Variables → Add variable
2. Type: Query
3. Data source: Prometheus
4. Query: `label_values(db_connection_up, connection)`
5. Use in panels: `$connection`

### Exporting Dashboards

```bash
# Export dashboard JSON
curl -u admin:admin http://localhost:3001/api/dashboards/uid/database-connections-overview | jq '.dashboard' > backup.json

# Import dashboard
curl -X POST -u admin:admin \
  -H "Content-Type: application/json" \
  -d @backup.json \
  http://localhost:3001/api/dashboards/db
```

---

## Best Practices

### Dashboard Design

1. **Use consistent time ranges**: Default to "Last 1 hour" for real-time, "Last 24 hours" for trends
2. **Color coding**:
   - Green: Healthy/normal
   - Yellow: Warning/degraded
   - Red: Critical/down
3. **Tooltips**: Add descriptions to help users understand panels
4. **Drill-down**: Link overview → details → specific connection
5. **Refresh rate**: 30s for real-time, 1m for historical

### Query Optimization

1. **Use recording rules** for expensive queries
2. **Limit time ranges**: Use `[5m]` for real-time, `[1h]` for trends
3. **Aggregate early**: Use `sum()` before `rate()`
4. **Label filtering**: Use `{connection="$connection"}` to reduce cardinality

### Alert Tuning

1. **Set appropriate thresholds**: Based on baseline performance
2. **Use `for` clause**: Avoid flapping with `for: 5m`
3. **Group alerts**: Reduce notification spam
4. **Document remediation**: Include fix steps in annotations

---

## Screenshots

### Overview Dashboard
![Overview Dashboard](../assets/screenshots/grafana-overview.png)
*All 28 connections health and performance at a glance*

### Connection Details
![Connection Details](../assets/screenshots/grafana-details.png)
*Deep dive into specific connection metrics*

### Alerts Dashboard
![Alerts Dashboard](../assets/screenshots/grafana-alerts.png)
*Critical issues and SLA compliance monitoring*

---

## Related Documentation

- [Prometheus Queries Reference](../grafana/queries/prometheus-queries.md)
- [Alert Rules Definition](../grafana/alerts/database-alerts.yaml)
- [Metrics Implementation](../src/infrastructure/metrics/MetricsManager.ts)
- [Health Check Endpoints](./API.md#health-endpoints)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Prometheus/Grafana logs
3. Open GitHub issue with details
4. Contact database team

---

**Last Updated**: 2025-10-25
**Version**: 1.0.0
**Maintainer**: LordtsAPI Team
