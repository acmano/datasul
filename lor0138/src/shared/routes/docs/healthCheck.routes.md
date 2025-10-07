# Health Check Routes

> Endpoints de monitoramento de saúde da aplicação seguindo padrões Kubernetes

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Padrões Kubernetes](#padrões-kubernetes)
- [Endpoints](#endpoints)
- [Diferenças entre Endpoints](#diferenças-entre-endpoints)
- [Respostas](#respostas)
- [Configuração Kubernetes](#configuração-kubernetes)
- [Configuração Docker](#configuração-docker)
- [Casos de Uso](#casos-de-uso)
- [Troubleshooting](#troubleshooting)
- [Boas Práticas](#boas-práticas)
- [Segurança](#segurança)
- [Referências](#referências)

---

## Visão Geral

### O que é?

Endpoints de health check para monitoramento de saúde da aplicação, implementando padrões de Kubernetes para liveness e readiness probes.

### Características

- ✅ **3 endpoints** - /health, /health/live, /health/ready
- ✅ **Padrão K8s** - Liveness e readiness probes
- ✅ **Status detalhado** - Componentes individuais
- ✅ **Timeout específico** - 5s para /health
- ✅ **Rápido** - < 100ms para /live
- ✅ **Completo** - Todos os componentes em /health

### Tecnologias

- **Express** - Framework web
- **Kubernetes** - Orquestração (liveness/readiness)
- **Docker** - Containerização (healthcheck)
- **TypeScript** - Tipagem forte

---

## Padrões Kubernetes

### 1. Liveness Probe

**Pergunta:** "O processo está vivo?"

**Objetivo:**
- Detectar deadlocks
- Detectar processos travados
- Detectar event loop bloqueado

**Ação se falhar:**
- Kubernetes **REINICIA** o container

**Características:**
- Deve ser **RÁPIDO**: < 100ms
- Verificações **mínimas**: apenas se responde
- **Sem I/O** pesado

**Endpoint:** `GET /health/live`

---

### 2. Readiness Probe

**Pergunta:** "A aplicação está pronta para receber tráfego?"

**Objetivo:**
- Controlar quando incluir/remover do load balancer
- Aguardar dependências estarem disponíveis
- Gerenciar tráfego durante deploys

**Ação se falhar:**
- Kubernetes **REMOVE** do service endpoint
- Load balancer para de enviar tráfego
- Pod continua rodando (não reinicia)

**Características:**
- Pode ser mais lento: < 5s
- Verificações de **dependências críticas**
- Testa **conectividade** (banco, cache)

**Endpoint:** `GET /health/ready`

---

### 3. Health Check Completo

**Pergunta:** "Qual o status detalhado de todos os componentes?"

**Objetivo:**
- Monitoramento detalhado
- Dashboards de status
- Alertas e métricas

**Usado por:**
- Prometheus, Datadog, New Relic
- Dashboards internos
- Scripts de monitoramento

**Características:**
- Verificação **detalhada** de todos os componentes
- Pode ser lento: 5-10s aceitável
- Retorna **status individual** de cada componente

**Endpoint:** `GET /health`

---

## Endpoints

### GET /health

Health check completo do sistema.

**Verifica:**
- ✅ Banco de dados (conectividade e tempo de resposta)
- ✅ Cache (Redis/memória)
- ✅ Memória (uso atual vs disponível)
- ✅ Disco (espaço disponível)

**Middlewares:**
1. `healthCheckTimeout` (5s)
2. `HealthCheckController.healthCheck`

**Status Codes:**
- `200` - Sistema saudável (todos os componentes OK)
- `503` - Sistema degradado ou indisponível
- `408` - Timeout (verificação demorou > 5s)

**Performance:**
- **Esperado:** 100ms - 1s (normal)
- **Aceitável:** 1s - 5s (degradado)
- **Crítico:** > 5s (timeout)

**Exemplo:**
```bash
curl http://localhost:3000/health
```

---

### GET /health/live

Liveness probe para Kubernetes/Docker.

**Verifica:**
- ✅ Processo está respondendo?

**NÃO Verifica:**
- ❌ Banco de dados
- ❌ Cache
- ❌ Memória/CPU
- ❌ Dependências externas

**Status Codes:**
- `200` - Processo está vivo ✅
- Sem resposta - Processo morto/travado ❌ (Kubernetes reinicia)

**Performance:**
- **Esperado:** < 10ms
- **Máximo:** 100ms
- **Sem timeout middleware** (muito rápido)

**Exemplo:**
```bash
curl http://localhost:3000/health/live
```

---

### GET /health/ready

Readiness probe para Kubernetes/Docker.

**Verifica:**
- ✅ Banco de dados conectado?
- ✅ Cache disponível?
- ✅ Serviços externos críticos?

**NÃO Verifica:**
- ❌ Memória/CPU (não afeta readiness)
- ❌ Disco (não afeta readiness imediata)
- ❌ Métricas detalhadas

**Status Codes:**
- `200` - Pronto para tráfego ✅ (incluído no LB)
- `503` - NÃO pronto ❌ (removido do LB)

**Performance:**
- **Esperado:** 100ms - 1s
- **Máximo:** 3s
- Timeout configurável no Kubernetes

**Exemplo:**
```bash
curl http://localhost:3000/health/ready
```

---

## Diferenças entre Endpoints

### Tabela Comparativa

| Aspecto | /health | /health/live | /health/ready |
|---------|---------|--------------|---------------|
| **Propósito** | Monitoramento completo | Processo vivo? | Aceitar tráfego? |
| **Velocidade** | 5-10s OK | < 100ms | < 5s |
| **Profundidade** | Detalhado | Superficial | Médio |
| **Timeout** | 5s | Sem timeout | Configurável |
| **Usado por** | Dashboards, alertas | Kubernetes restart | Load balancer |
| **Verifica** | Tudo | Apenas resposta | Dependências críticas |
| **Falha = ** | Alerta | Container reinicia | Removido do LB |

### Quando Usar Cada Um

**Use /health quando:**
- Monitoramento com Prometheus/Datadog
- Dashboards de status
- Verificação manual detalhada
- Alertas baseados em componentes

**Use /health/live quando:**
- Kubernetes liveness probe
- Docker healthcheck
- Detectar processos travados
- Restart automático

**Use /health/ready quando:**
- Kubernetes readiness probe
- Load balancer health check
- Deploy com zero downtime
- Gerenciar tráfego

---

## Respostas

### GET /health - Sucesso (200)

```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T10:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 45,
      "connectionType": "sqlserver",
      "mode": "LIVE"
    },
    "memory": {
      "status": "ok",
      "used": 512,
      "total": 2048,
      "percentage": 25,
      "free": 1536
    },
    "disk": {
      "status": "ok"
    }
  }
}
```

### GET /health - Erro (503)

```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-07T10:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "error",
      "error": "Connection refused"
    },
    "memory": {
      "status": "critical",
      "used": 1900,
      "total": 2048,
      "percentage": 92,
      "free": 148
    }
  }
}
```

### GET /health/live - Sucesso (200)

```json
{
  "status": "alive",
  "timestamp": "2025-10-07T10:30:00.000Z",
  "uptime": 3600
}
```

**Se não responder:**
- Kubernetes aguarda `failureThreshold` (default: 3)
- Após 3 falhas consecutivas: **REINICIA** o container
- Pod entra em `CrashLoopBackOff` se continuar falhando

### GET /health/ready - Sucesso (200)

```json
{
  "status": "ready",
  "timestamp": "2025-10-07T10:30:00.000Z",
  "uptime": 3600
}
```

### GET /health/ready - Erro (503)

```json
{
  "status": "not_ready",
  "timestamp": "2025-10-07T10:30:00.000Z",
  "error": "Database connection failed"
}
```

**Se não estiver ready:**
- Kubernetes **REMOVE** pod do Service endpoint
- Load balancer para de enviar tráfego
- Pod continua rodando, mas isolado
- Quando `ready = true`, volta a receber tráfego

---

## Configuração Kubernetes

### Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lor0138-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: lor0138-api:latest
        ports:
        - containerPort: 3000

        # Liveness Probe
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30    # Aguarda 30s antes de começar
          periodSeconds: 10          # Verifica a cada 10s
          timeoutSeconds: 1          # Timeout de 1s
          failureThreshold: 3        # 3 falhas = reinicia
          successThreshold: 1        # 1 sucesso = OK

        # Readiness Probe
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10    # Começa após 10s
          periodSeconds: 5           # Verifica a cada 5s
          timeoutSeconds: 3          # Timeout de 3s
          failureThreshold: 3        # 3 falhas = not ready
          successThreshold: 1        # 1 sucesso = ready
```

### Parâmetros Explicados

**initialDelaySeconds:**
- Tempo de espera antes de iniciar probes
- Liveness: 30s (aplicação precisa inicializar)
- Readiness: 10s (menos conservador)

**periodSeconds:**
- Intervalo entre verificações
- Liveness: 10s (menos frequente)
- Readiness: 5s (mais frequente para reagir rápido)

**timeoutSeconds:**
- Tempo máximo de espera por resposta
- Liveness: 1s (rápido)
- Readiness: 3s (permite I/O)

**failureThreshold:**
- Número de falhas antes de tomar ação
- Ambos: 3 (evita falsos positivos)

**successThreshold:**
- Número de sucessos para considerar OK
- Ambos: 1 (recupera rápido)

---

## Configuração Docker

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    image: lor0138-api:latest
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health/live"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 30s
```

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health/live || exit 1

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

---

## Casos de Uso

### Caso 1: Monitoramento com Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'lor0138-api-health'
    metrics_path: '/health'
    scrape_interval: 30s
    static_configs:
      - targets: ['lor0138.lorenzetti.ibe:3000']
```

**Prometheus faz:**
- Scraping de `/health` a cada 30s
- Cria alertas se `status != "healthy"`
- Registra métricas de uptime
- Monitora tempo de resposta

**Alertas:**
```yaml
# alertmanager.yml
groups:
  - name: api_health
    rules:
      - alert: APIUnhealthy
        expr: health_status != 1
        for: 5m
        annotations:
          summary: "API unhealthy for 5 minutes"
```

---

### Caso 2: Load Balancer AWS ALB

```json
{
  "HealthCheckProtocol": "HTTP",
  "HealthCheckPath": "/health/ready",
  "HealthCheckIntervalSeconds": 30,
  "HealthCheckTimeoutSeconds": 5,
  "HealthyThresholdCount": 2,
  "UnhealthyThresholdCount": 3
}
```

**ALB usa /health/ready para:**
- Decidir enviar tráfego para instância (ready)
- Remover instância do pool (not ready)
- Esperar 2 checks OK antes de adicionar
- Esperar 3 checks falhos antes de remover

---

### Caso 3: CI/CD Pipeline

```bash
#!/bin/bash
# deploy.sh

echo "📦 Deploying new version..."
kubectl apply -f deployment.yaml

echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod \
  -l app=lor0138-api \
  --timeout=300s

echo "🔍 Checking health..."
curl -f http://lor0138.lorenzetti.ibe:3000/health || {
  echo "❌ Health check failed!"
  kubectl rollout undo deployment/lor0138-api
  exit 1
}

echo "✅ Deploy completed successfully!"
```

---

### Caso 4: Monitoramento Manual

```bash
# Verificação rápida (liveness)
curl http://localhost:3000/health/live

# Verificação completa
curl -s http://localhost:3000/health | jq .

# Verificar apenas status
curl -s http://localhost:3000/health | jq .status

# Ver componentes com problemas
curl -s http://localhost:3000/health | jq '.checks | to_entries[] | select(.value.status != "ok")'

# Verificar readiness
curl -I http://localhost:3000/health/ready

# Loop de monitoramento
watch -n 5 'curl -s http://localhost:3000/health | jq .status'

# Aguardar ficar ready (deploy)
until curl -f http://localhost:3000/health/ready; do
  echo "⏳ Aguardando aplicação ficar ready..."
  sleep 5
done
echo "✅ Aplicação ready!"
```

---

## Troubleshooting

### Problema 1: Health check sempre 503

**Sintoma:**
- Endpoint sempre retorna unhealthy

**Diagnóstico:**
```bash
# Ver detalhes do erro
curl -s http://localhost:3000/health | jq .

# Verificar logs
tail -f logs/app-*.log | grep "health check"

# Ver status de cada componente
curl -s http://localhost:3000/health | jq .checks
```

**Causas Comuns:**
- Banco de dados offline
- Cache Redis não conectado
- Memória crítica (> 90%)
- Timeout excedido (> 5s)

**Solução:**
1. Verificar conectividade do banco
2. Verificar status do Redis
3. Reiniciar aplicação se necessário
4. Verificar recursos (memória/CPU)

---

### Problema 2: Liveness probe falhando

**Sintoma:**
- Kubernetes reiniciando pods constantemente
- Estado: `CrashLoopBackOff`

**Diagnóstico:**
```bash
# Ver eventos do pod
kubectl describe pod lor0138-api-xxx

# Ver logs antes do crash
kubectl logs lor0138-api-xxx --previous

# Ver eventos recentes
kubectl get events --sort-by='.lastTimestamp' | grep lor0138-api
```

**Causas Comuns:**
- Deadlock no código
- Event loop bloqueado
- Timeout muito agressivo (< 1s)
- `initialDelaySeconds` muito curto

**Solução:**
1. Aumentar `initialDelaySeconds` para 30s
2. Aumentar `timeoutSeconds` para 3s
3. Verificar código por loops infinitos
4. Verificar logs para deadlocks

---

### Problema 3: Readiness probe oscilando

**Sintoma:**
- Pod alternando entre ready/not ready
- Tráfego intermitente

**Diagnóstico:**
```bash
# Monitorar status
kubectl get pods -w

# Ver histórico de eventos
kubectl get events --sort-by='.lastTimestamp'

# Verificar readiness continuamente
watch -n 1 'curl -o /dev/null -w "%{http_code}" -s http://localhost:3000/health/ready'
```

**Causas Comuns:**
- Conexão intermitente com banco
- Timeout muito agressivo
- Banco sobrecarregado
- Network jitter

**Solução:**
1. Verificar health do banco de dados
2. Aumentar timeout do readiness probe
3. Adicionar retry na verificação
4. Verificar rede/latência

---

### Problema 4: Health check muito lento

**Sintoma:**
- Resposta demora > 5s
- Timeout frequente

**Diagnóstico:**
```bash
# Medir tempo de resposta
time curl http://localhost:3000/health

# Ver qual componente está lento
curl -s http://localhost:3000/health | jq '.checks.database.responseTime'

# Testar banco diretamente
time psql -h db -U user -c "SELECT 1"
```

**Causas Comuns:**
- Query de teste do banco muito complexa
- Timeout do banco muito alto
- Rede lenta
- Cache miss custoso

**Solução:**
1. Simplificar query de teste (`SELECT 1`)
2. Reduzir timeout do banco para 5s
3. Cache do resultado do health check (30s)
4. Otimizar verificações

---

### Problema 5: Pod nunca fica ready

**Sintoma:**
- Pod em estado `Running` mas nunca `Ready`
- Não recebe tráfego

**Diagnóstico:**
```bash
# Ver status detalhado
kubectl describe pod lor0138-api-xxx

# Testar readiness manualmente
kubectl exec lor0138-api-xxx -- curl http://localhost:3000/health/ready

# Ver logs
kubectl logs lor0138-api-xxx -f
```

**Causas Comuns:**
- Banco não inicializou
- Dependências não disponíveis
- Timeout muito curto
- Porta incorreta

**Solução:**
1. Aumentar `initialDelaySeconds`
2. Verificar dependências (banco, cache)
3. Verificar porta configurada
4. Verificar logs da aplicação

---

## Boas Práticas

### ✅ DO

**1. Use timeout curto para health checks**
```typescript
// ✅ Timeout específico de 5s
router.get('/', healthCheckTimeout, HealthCheckController.healthCheck);
```

**2. Retorne status específico de cada componente**
```json
// ✅ Detalhado
{
  "checks": {
    "database": { "status": "ok", "responseTime": 45 },
    "cache": { "status": "ok" },
    "memory": { "status": "ok", "percentage": 25 }
  }
}
```

**3. Use liveness para detectar deadlocks**
```yaml
# ✅ Liveness rápido
livenessProbe:
  httpGet:
    path: /health/live
  timeoutSeconds: 1
```

**4. Use readiness para controlar tráfego**
```yaml
# ✅ Readiness para deploy
readinessProbe:
  httpGet:
    path: /health/ready
  periodSeconds: 5
```

**5. Logue falhas de health check**
```typescript
// ✅ Log para debugging
log.error('Health check failed', {
  component: 'database',
  error: error.message
});
```

**6. Configure alertas**
```yaml
# ✅ Alertas no Prometheus
- alert: APIUnhealthy
  expr: health_status != 1
  for: 5m
```

---

### ❌ DON'T

**1. Não faça queries pesadas em liveness**
```typescript
// ❌ Query complexa em liveness
SELECT COUNT(*) FROM items WHERE status = 'active';

// ✅ Apenas verifica se responde
return { status: 'alive' };
```

**2. Não retorne 200 se sistema está degradado**
```typescript
// ❌ Sempre 200
res.status(200).json({ status: 'unhealthy' });

// ✅ Status code correto
res.status(503).json({ status: 'unhealthy' });
```

**3. Não use mesmo endpoint para liveness e readiness**
```typescript
// ❌ Mesmo endpoint
router.get('/health', controller.check);  // Usado para ambos

// ✅ Endpoints separados
router.get('/health/live', controller.liveness);
router.get('/health/ready', controller.readiness);
```

**4. Não configure timeout muito curto**
```yaml
# ❌ Muito agressivo
timeoutSeconds: 0.5

# ✅ Realista
timeoutSeconds: 3
```

**5. Não ignore erros de health check**
```typescript
// ❌ Ignora erros
try {
  await db.query('SELECT 1');
} catch (error) {
  // Silencioso
}

// ✅ Loga e retorna erro
try {
  await db.query('SELECT 1');
} catch (error) {
  log.error('DB health check failed', { error });
  throw error;
}
```

---

## Segurança

### Informações Expostas

#### ✅ SEGURO expor:

- Status geral (healthy/unhealthy)
- Tempo de uptime
- Status de componentes (ok/error)
- Tempo de resposta do banco
- Percentual de memória

#### ⚠️ CUIDADO ao expor:

- Versão do banco de dados
- IPs internos
- Nomes de schemas/databases
- Detalhes de erro completos
- Stack traces

#### ❌ NUNCA expor:

- Credenciais de banco
- Tokens de API
- Chaves de criptografia
- Informações de clientes
- Senhas

---

### Proteção Adicional

**Autenticação Básica:**
```typescript
import basicAuth from 'express-basic-auth';

router.get('/health',
  basicAuth({
    users: { 'monitor': process.env.HEALTH_CHECK_PASSWORD },
    challenge: true
  }),
  healthCheckTimeout,
  HealthCheckController.healthCheck
);
```

**Whitelist de IPs:**
```typescript
const allowedIPs = ['10.0.0.0/8', '172.16.0.0/12'];

router.get('/health',
  ipWhitelist(allowedIPs),
  healthCheckTimeout,
  HealthCheckController.healthCheck
);
```

**Headers Customizados:**
```typescript
router.get('/health',
  (req, res, next) => {
    const token = req.headers['x-health-token'];
    if (token !== process.env.HEALTH_CHECK_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  },
  HealthCheckController.healthCheck
);
```

---

## Referências

### Arquivos Relacionados

- `HealthCheckController.ts` - Lógica dos controllers
- `HealthCheckService.ts` - Lógica de verificação
- `timeout.middleware.ts` - Timeout específico

### Links Externos

- [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) - Documentação oficial
- [Docker Healthcheck](https://docs.docker.com/engine/reference/builder/#healthcheck) - Dockerfile HEALTHCHECK
- [AWS ALB Health Checks](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html) - ALB Target Groups

### Conceitos

- **Liveness Probe** - Verifica se processo está vivo
- **Readiness Probe** - Verifica se pronto para tráfego
- **Health Check** - Verificação de saúde
- **Load Balancer** - Distribuidor de tráfego
- **Zero Downtime Deploy** - Deploy sem interrupção

---

## Resumo

### Endpoints

| Endpoint | Propósito | Performance | Usado Por |
|----------|-----------|-------------|-----------|
| **GET /health** | Status completo | 100ms-5s | Monitoramento |
| **GET /health/live** | Processo vivo? | < 100ms | K8s liveness |
| **GET /health/ready** | Pronto para tráfego? | 100ms-3s | K8s readiness |

### Status Codes

| Endpoint | 200 | 503 | Sem Resposta |
|----------|-----|-----|--------------|
| /health | Healthy | Unhealthy | Timeout |
| /health/live | Vivo | - | **Reinicia** |
| /health/ready | Ready | Not Ready | **Remove do LB** |

### Configuração Kubernetes

```yaml
livenessProbe:
  path: /health/live
  initialDelay: 30s
  period: 10s
  timeout: 1s
  failures: 3

readinessProbe:
  path: /health/ready
  initialDelay: 10s
  period: 5s
  timeout: 3s
  failures: 3
```

### Middleware Stack

```
/health        → healthCheckTimeout → controller
/health/live   → controller (direto)
/health/ready  → controller (direto)
```

---

**Última atualização:** 2025-10-07