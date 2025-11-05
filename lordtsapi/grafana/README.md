# Grafana Dashboards for LordtsAPI

Complete monitoring solution for 28 database connections across Datasul, Informix, PCFactory, and Corporativo systems.

## Quick Start

### 1. Start Monitoring Stack

```bash
# Run the automated setup script
./scripts/setup-monitoring.sh

# Or manually with Docker Compose
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Access Grafana

Open your browser and navigate to:

```
http://localhost:3001
```

**Login Credentials:**
- Username: `admin`
- Password: `admin`

(Change password on first login)

### 3. Explore Dashboards

Navigate to **Dashboards** → **Database Monitoring** folder:

1. **Database Connections - Overview**
   - All 28 connections at a glance
   - System-level aggregations (Datasul, Informix, PCFactory, Corporativo)
   - Circuit breaker status
   - Pool utilization heatmap

2. **Database Connection - Details**
   - Deep dive into specific connection
   - Latency distribution and percentiles
   - Error analysis
   - Retry statistics
   - Pool metrics

3. **Database Alerts & SLA**
   - Critical and degraded connections
   - SLA compliance tracking
   - Alert history
   - Health distribution

## What's Included

### Dashboards (3)

Located in `dashboards/`:

- `database-connections-overview.json` - Overview dashboard
- `database-connection-details.json` - Detailed per-connection dashboard
- `database-alerts.json` - Alerts and SLA dashboard

### Alert Rules (15+)

Located in `alerts/database-alerts.yaml`:

- Connection health alerts (down, degraded)
- Error rate alerts (critical > 5%, warning 1-5%)
- Latency alerts (critical > 1s, warning > 500ms)
- Circuit breaker alerts (open, flapping)
- Pool alerts (exhausted > 95%, high utilization > 85%)
- SLA compliance alerts (< 99.9%)
- System-wide alerts (multiple connections down, environment down)

### Prometheus Queries

Located in `queries/prometheus-queries.md`:

- All queries used in dashboards
- Examples for custom queries
- Best practices and optimization tips

### Provisioning

Located in `provisioning/`:

- `datasources/prometheus.yaml` - Prometheus datasource
- `dashboards/dashboard.yaml` - Auto-import configuration

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                        LordtsAPI                              │
│                                                               │
│  28 Database Connections:                                     │
│  ├─ 18 Datasul (Prod/Test/Homol × EMP/MULT/ADT/ESP/EMS5/FND) │
│  ├─  4 Informix (Dev/Atu/New/Prod)                           │
│  ├─  2 PCFactory (Prod/Test)                                 │
│  └─  4 Corporativo (Prod/Test/Dev/Staging)                   │
│                                                               │
│  Exposes: /metrics (Prometheus format)                       │
└───────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP scrape every 15s
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                       Prometheus                              │
│                                                               │
│  ├─ Scrapes metrics from LordtsAPI                           │
│  ├─ Stores time-series data (30 days retention)              │
│  ├─ Evaluates alert rules (every 30s)                        │
│  └─ Sends alerts to Alertmanager                             │
│                                                               │
│  Port: 9090                                                   │
└───────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│       Grafana           │  │     Alertmanager        │
│                         │  │                         │
│ ├─ Queries Prometheus   │  │ ├─ Routes alerts        │
│ ├─ Visualizes metrics   │  │ ├─ Groups notifications │
│ ├─ 3 Dashboards         │  │ ├─ Inhibits duplicates  │
│ └─ Auto-refresh (30s)   │  │ └─ Sends to receivers   │
│                         │  │                         │
│ Port: 3001              │  │ Port: 9093              │
└─────────────────────────┘  └─────────────────────────┘
```

## Metrics Overview

### Connection Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `db_connection_up` | Gauge | Connection health (1=up, 0=down) |
| `db_connection_info` | Info | Connection metadata (DSN, host, port, etc.) |

### Query Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `db_queries_total` | Counter | Total queries executed |
| `db_queries_failed` | Counter | Failed queries |
| `db_query_duration_seconds` | Histogram | Query latency (P50, P95, P99) |

### Circuit Breaker Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `db_circuit_breaker_state` | Gauge | State (0=CLOSED, 1=HALF_OPEN, 2=OPEN) |
| `db_circuit_breaker_transitions_total` | Counter | State transitions |

### Retry Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `db_retry_attempts_total` | Counter | Retry attempts |
| `db_retry_success_total` | Counter | Successful retries |
| `db_retry_failed_total` | Counter | Failed after all retries |

### Pool Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `db_pool_active_connections` | Gauge | Active connections |
| `db_pool_idle_connections` | Gauge | Idle connections |
| `db_pool_waiting_requests` | Gauge | Queued requests |
| `db_pool_max_connections` | Gauge | Maximum pool size |

All metrics include labels:
- `connection`: Connection name (e.g., "DtsPrdEmp")
- `system_type`: "datasul", "informix", "pcfactory", "corporativo"
- `environment`: "production", "test", "homologation", etc.
- `hostname`: Database server hostname
- `port`: Database server port

## Dashboards Deep Dive

### Overview Dashboard

**Purpose**: Monitor all 28 connections simultaneously

**Key Panels:**

1. **Connection Health Matrix** (8×4 grid)
   - Each box = 1 connection
   - Green = healthy, Red = down
   - Click to drill down

2. **Query Throughput by System**
   - 4 lines: Datasul, Informix, PCFactory, Corporativo
   - Identifies load distribution

3. **Error Rate Gauges**
   - 4 gauges (one per system)
   - Thresholds: 1% (warning), 5% (critical)

4. **Latency Trend**
   - P50/P95/P99 across all connections
   - SLA line at 500ms

5. **Circuit Breakers**
   - Count: CLOSED, OPEN, HALF_OPEN
   - Alert if any OPEN

6. **Top 10 Slowest**
   - Bar gauge by P95 latency
   - Identify bottlenecks

7. **Pool Utilization Heatmap**
   - 28 rows (connections) × time
   - Color: Green < 70%, Yellow 70-85%, Red > 85%

8. **Active vs Idle**
   - Pie chart: pool efficiency

**Refresh**: 30s

### Details Dashboard

**Purpose**: Analyze specific connection in depth

**Variable**: Select connection from dropdown (28 options)

**Key Panels:**

1. **Connection Info** - DSN, host, port, environment
2. **Latency Histogram** - Distribution across buckets
3. **Percentiles Graph** - P50/P75/P90/P95/P99 over time
4. **Query Rate** - Success vs failed (stacked)
5. **Error Table** - Last 100 errors with details
6. **Retry Stats** - Total attempts and success rate
7. **Circuit Breaker Timeline** - State changes
8. **Pool Metrics** - Active/idle/waiting over time

**Refresh**: 30s

### Alerts Dashboard

**Purpose**: Monitor SLA and critical issues

**Key Panels:**

1. **Critical Connections**
   - Circuit breaker OPEN
   - Error rate > 5%
   - P95 > 1000ms

2. **Degraded Connections**
   - Error rate 1-5%
   - P95 500-1000ms
   - Pool > 85%

3. **SLA Compliance Gauge**
   - Target: 99.9% < 500ms
   - Current percentage

4. **Alert History Table**
   - Last 50 alerts
   - Color-coded by severity

5. **Health Distribution Pie**
   - Healthy/Degraded/Critical/Down

6. **Alert Firing Trend**
   - Critical vs warning over time

**Refresh**: 30s

## Alerting Configuration

### Alert Severity Levels

- **Critical**: Immediate action required (page on-call)
  - Connection down
  - Error rate > 5%
  - P95 > 1s
  - Circuit breaker open
  - Pool exhausted (> 95%)
  - SLA violation

- **Warning**: Monitor closely
  - Error rate 1-5%
  - P95 500-1000ms
  - Pool high utilization (> 85%)
  - Frequent circuit breaker transitions

- **Info**: Planning/capacity
  - Sustained high throughput
  - Traffic growth

### Alert Routing

Configure in `../prometheus/alertmanager.yml`:

```yaml
routes:
  - match:
      severity: critical
    receiver: critical-receiver
    repeat_interval: 1h

  - match:
      severity: warning
    receiver: warning-receiver
    repeat_interval: 6h
```

### Notification Channels

Supported receivers:
- **Email**: SMTP
- **Slack**: Webhooks
- **PagerDuty**: Integration
- **Webhook**: Custom HTTP endpoints

Example Slack configuration:

```yaml
receivers:
  - name: 'critical-receiver'
    slack_configs:
      - api_url: 'YOUR_WEBHOOK_URL'
        channel: '#alerts-critical'
        title: '🚨 {{ .GroupLabels.alertname }}'
```

## Troubleshooting

### No Data in Dashboards

**Check:**
1. LordtsAPI is running: `curl http://localhost:3000/metrics`
2. Prometheus targets: http://localhost:9090/targets (should show LordtsAPI as UP)
3. Time range in Grafana (top right)
4. Prometheus logs: `docker logs lordtsapi-prometheus`

### Alerts Not Firing

**Check:**
1. Prometheus rules: http://localhost:9090/rules
2. Alert expression in Prometheus graph
3. Alertmanager config: http://localhost:9093
4. Alertmanager logs: `docker logs lordtsapi-alertmanager`

### Dashboard Import Failed

**Solution:**
```bash
# Manual import
curl -X POST \
  -H "Content-Type: application/json" \
  -u admin:admin \
  -d @dashboards/database-connections-overview.json \
  http://localhost:3001/api/dashboards/db
```

### High Resource Usage

**Solutions:**
- Reduce scrape interval in `../prometheus/prometheus.yml`
- Decrease retention: `--storage.tsdb.retention.time=15d`
- Limit dashboard auto-refresh rate

## Customization

### Add Custom Panel

1. Edit dashboard in Grafana
2. Add → Visualization
3. Write Prometheus query
4. Configure panel type
5. Save dashboard

### Create Custom Alert

1. Edit `alerts/database-alerts.yaml`
2. Add new rule:

```yaml
- alert: MyAlert
  expr: my_metric > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Alert summary"
```

3. Reload Prometheus: `curl -X POST http://localhost:9090/-/reload`

### Export Dashboard

```bash
curl -u admin:admin \
  http://localhost:3001/api/dashboards/uid/database-connections-overview \
  | jq '.dashboard' > backup.json
```

## Maintenance

### Update Dashboards

1. Edit JSON files in `dashboards/`
2. Restart Grafana: `docker-compose -f ../docker-compose.monitoring.yml restart grafana`

### Backup Configuration

```bash
# Backup all configs
tar -czf grafana-backup-$(date +%Y%m%d).tar.gz \
  dashboards/ \
  provisioning/ \
  alerts/ \
  queries/
```

### Update Alert Rules

1. Edit `alerts/database-alerts.yaml`
2. Validate syntax: `promtool check rules alerts/database-alerts.yaml`
3. Reload Prometheus: `curl -X POST http://localhost:9090/-/reload`

## Performance Tips

1. **Use recording rules** for expensive queries
2. **Limit time ranges**: Use 5m for real-time, 1h for trends
3. **Reduce refresh rate**: 1m instead of 30s for less critical dashboards
4. **Filter by label**: Use `{connection="specific"}` to reduce cardinality
5. **Aggregate early**: `sum(rate(metric[5m])) by (label)` faster than `rate(sum(metric)[5m])`

## Best Practices

### Dashboard Design
- Consistent color scheme (Green/Yellow/Red)
- Descriptive panel titles
- Tooltips with context
- Drill-down links
- Appropriate time ranges

### Query Optimization
- Use rate() for counters
- Choose correct aggregation (sum/avg/max)
- Filter unnecessary labels
- Use recording rules for complex queries

### Alert Tuning
- Set realistic thresholds based on baseline
- Use `for:` clause to avoid flapping
- Group related alerts
- Document remediation steps

## Resources

- **Comprehensive Guide**: [docs/GRAFANA_DASHBOARDS.md](../docs/GRAFANA_DASHBOARDS.md)
- **Prometheus Queries**: [queries/prometheus-queries.md](queries/prometheus-queries.md)
- **Alert Rules**: [alerts/database-alerts.yaml](alerts/database-alerts.yaml)
- **Grafana Docs**: https://grafana.com/docs/
- **Prometheus Docs**: https://prometheus.io/docs/

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting)
2. Review logs: `docker-compose -f ../docker-compose.monitoring.yml logs`
3. Open GitHub issue
4. Contact: database-team@lordtsapi.com

---

**Version**: 1.0.0
**Last Updated**: 2025-10-25
**Maintainer**: LordtsAPI Team
