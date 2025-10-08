# Health Check - Documentação

## Visão Geral

O sistema fornece **3 endpoints de health check** com diferentes níveis de detalhe:

1. **`/health`** - Health check completo com todos os testes
2. **`/health/live`** - Liveness probe (aplicação está viva?)
3. **`/health/ready`** - Readiness probe (pronto para receber tráfego?)

---

## 1. Health Check Completo

**Endpoint:** `GET /health`

Executa todos os testes de saúde do sistema.

### O que testa:

- ✅ **Banco de dados:** Conectividade e tempo de resposta
- ✅ **Memória:** Uso de memória do processo
- ✅ **Disco:** Espaço disponível (básico)

### Resposta de Sucesso (200 OK)

```json
{
  "status": "healthy",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 45,
      "connectionType": "sqlserver",
      "mode": "REAL_DATABASE"
    },
    "memory": {
      "status": "ok",
      "used": 85,
      "total": 16384,
      "free": 8192,
      "percentage": 0.52
    },
    "disk": {
      "status": "ok"
    }
  }
}
```

### Resposta Degradada (200 OK)

Sistema operacional, mas com problemas:

```json
{
  "status": "degraded",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "degraded",
      "responseTime": 1500,
      "connectionType": "sqlserver",
      "mode": "MOCK_DATA",
      "error": "Usando dados mock - banco inacessível"
    },
    "memory": {
      "status": "warning",
      "used": 12000,
      "total": 16384,
      "percentage": 73.24
    },
    "disk": {
      "status": "ok"
    }
  }
}
```

### Resposta Unhealthy (503 Service Unavailable)

Sistema com problemas críticos:

```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "error",
      "error": "Banco de dados não inicializado"
    },
    "memory": {
      "status": "critical",
      "used": 15000,
      "total": 16384,
      "percentage": 91.55
    },
    "disk": {
      "status": "ok"
    }
  }
}
```

---

## 2. Liveness Probe

**Endpoint:** `GET /health/live`

Verifica se a **aplicação está rodando**. 

**Uso:** Kubernetes/Docker para restart automático.

### Resposta (200 OK)

```json
{
  "status": "alive",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "uptime": 3600
}
```

Se este endpoint **não responder**, a aplicação deve ser **reiniciada**.

---

## 3. Readiness Probe

**Endpoint:** `GET /health/ready`

Verifica se está **pronto para receber tráfego**.

**Uso:** Load balancers para rotear requisições.

### Resposta Ready (200 OK)

```json
{
  "status": "ready",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "uptime": 3600
}
```

### Resposta Not Ready (503 Service Unavailable)

```json
{
  "status": "not_ready",
  "timestamp": "2025-10-04T17:00:00.000Z",
  "uptime": 3600
}
```

Se retornar **503**, o load balancer **não deve** enviar tráfego para esta instância.

---

## Status Codes

| Endpoint | Status OK | Status Degraded | Status Unhealthy |
|----------|-----------|-----------------|------------------|
| `/health` | 200 | 200 | 503 |
| `/health/live` | 200 | - | - |
| `/health/ready` | 200 | - | 503 |

---

## Testes

### Teste 1: Health check completo

```bash
curl http://localhost:3000/health
```

**Espera-se:**
- Status 200
- JSON com todos os checks

### Teste 2: Liveness probe

```bash
curl http://localhost:3000/health/live
```

**Espera-se:**
- Status 200
- `"status": "alive"`

### Teste 3: Readiness probe

```bash
curl http://localhost:3000/health/ready
```

**Espera-se:**
- Status 200 se pronto
- Status 503 se não pronto

### Teste 4: Health check com banco offline

Pare o SQL Server e teste:

```bash
curl http://localhost:3000/health
```

**Espera-se:**
- Status 200 (degraded)
- `"status": "degraded"`
- `database.status: "degraded"`
- `database.mode: "MOCK_DATA"`

---

## Integração com Monitoramento

### Kubernetes

```yaml
# deployment.yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

### Docker Compose

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health/live"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Nginx Load Balancer

```nginx
upstream backend {
  server app1:3000 max_fails=3 fail_timeout=30s;
  server app2:3000 max_fails=3 fail_timeout=30s;
}

# Health check
location /health/ready {
  proxy_pass http://backend;
  # Se retornar 503, remove do pool
}
```

### Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'app-health'
    metrics_path: '/health'
    static_configs:
      - targets: ['app:3000']
```

---

## Thresholds e Alertas

### Banco de Dados

| Status | Condição | Ação |
|--------|----------|------|
| `ok` | Query < 1s | Nenhuma |
| `degraded` | Query > 1s OU modo MOCK | Alerta (investigar) |
| `error` | Não consegue consultar | Alerta crítico |

### Memória

| Status | Uso de Memória | Ação |
|--------|----------------|------|
| `ok` | < 75% | Nenhuma |
| `warning` | 75-90% | Alerta |
| `critical` | > 90% | Alerta crítico + investigar |

### Status Geral

| Status | Significado | HTTP | Ação |
|--------|-------------|------|------|
| `healthy` | Tudo OK | 200 | Continuar operando |
| `degraded` | Problemas não críticos | 200 | Investigar, mas continua operando |
| `unhealthy` | Problemas críticos | 503 | Alerta + não receber tráfego |

---

## Troubleshooting

### Health check retorna 503

**Causa:** Sistema com problemas críticos

**Verificar:**
1. Banco de dados está acessível?
2. Memória está acima de 90%?
3. Logs mostram erros?

**Solução:**
```bash
# Verificar logs
tail -f logs/app.log

# Verificar memória
curl http://localhost:3000/health | jq '.checks.memory'

# Verificar banco
curl http://localhost:3000/health | jq '.checks.database'
```

### Health check demora muito

**Causa:** Timeout de 5 segundos muito baixo ou banco lento

**Solução:**
```bash
# Aumente o timeout no .env
HTTP_HEALTH_TIMEOUT=10s
```

### Kubernetes não reinicia aplicação

**Causa:** Liveness probe não configurado ou timeout incorreto

**Solução:**
```yaml
livenessProbe:
  httpGet:
    path: /health/live  # ← Certifique-se que está correto
    port: 3000
  initialDelaySeconds: 30  # ← Dê tempo para iniciar
```

### Load balancer não remove instância com problema

**Causa:** Readiness probe não configurado

**Solução:**
Configure readiness probe no load balancer para verificar `/health/ready`.

---

## Expansões Futuras

### 1. Verificação de Disco Completa

Instalar biblioteca:
```bash
npm install check-disk-space
```

Atualizar `checkDisk()` no service.

### 2. Métricas Customizadas

Adicionar checks específicos:
- Fila de mensagens
- Cache Redis
- APIs externas
- Certificados SSL

### 3. Histórico de Health Checks

Armazenar últimos N checks para análise de tendências.

### 4. Alertas Automáticos

Integrar com Slack/Email para alertas automáticos quando unhealthy.

---

## Boas Práticas

### ✅ DO

- **Use liveness probe** em Kubernetes/Docker
- **Use readiness probe** em load balancers
- **Monitore o tempo de resposta** do banco
- **Configure alertas** para status degraded/unhealthy
- **Teste regularmente** os health checks

### ❌ DON'T

- **Não use /health para liveness** - use /health/live (mais leve)
- **Não ignore status degraded** - investigue a causa
- **Não configure timeouts muito baixos** - health checks precisam de tempo
- **Não exponha detalhes sensíveis** no health check público

---

## Referências

- [Kubernetes Liveness and Readiness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Docker Healthcheck](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Health Check Pattern](https://microservices.io/patterns/observability/health-check-api.html)