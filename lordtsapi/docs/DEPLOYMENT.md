# DEPLOYMENT.md - Guia de Deployment

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Ambientes](#ambientes)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Deployment Local](#deployment-local)
- [Deployment com PM2](#deployment-com-pm2)
- [Deployment com Docker](#deployment-com-docker)
- [Deployment com Kubernetes](#deployment-com-kubernetes)
- [Deployment em Produção](#deployment-em-produção)
- [Monitoramento](#monitoramento)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)
- [Checklist](#checklist)

---

## 🔧 Pré-requisitos

### Sistema Operacional

- ✅ Linux Ubuntu 20.04+ (recomendado)
- ✅ Linux CentOS/RHEL 8+
- ✅ macOS 11+
- ✅ Windows 10+ com WSL2

### Software Necessário

| Software | Versão Mínima | Recomendada |
|----------|---------------|-------------|
| Node.js | 18.x | 20.x LTS |
| npm | 9.x | 10.x |
| TypeScript | 5.0 | 5.9.3 |
| Git | 2.x | latest |

### Acesso Necessário

- ✅ Acesso SSH ao servidor
- ✅ Credenciais do SQL Server
- ✅ Permissões de leitura no banco Datasul
- ✅ Porta 3000 disponível (ou configurável)

---

## 🌍 Ambientes

### Desenvolvimento

```
NODE_ENV=development
PORT=3000
USE_MOCK_DATA=true
LOG_LEVEL=debug
```

**Características:**
- Mock data habilitado
- Logs verbosos
- Hot reload
- Sem HTTPS

### Staging/QA

```
NODE_ENV=staging
PORT=3000
USE_MOCK_DATA=false
LOG_LEVEL=info
```

**Características:**
- Banco de homologação
- Logs moderados
- Testes E2E
- HTTPS opcional

### Produção

```
NODE_ENV=production
PORT=3000
USE_MOCK_DATA=false
LOG_LEVEL=warn
```

**Características:**
- Banco de produção
- Logs mínimos
- HTTPS obrigatório
- Graceful shutdown
- PM2 ou Docker

---

## 🔐 Variáveis de Ambiente

### Criar Arquivo `.env`

Copie o template:

```bash
cp .env.example .env
```

### Configurações Obrigatórias

```env
# Ambiente
NODE_ENV=production
PORT=3000
API_PREFIX=/api

# Banco de Dados
DB_CONNECTION_TYPE=sqlserver
DB_SERVER=10.105.0.4\LOREN
DB_USER=sysprogress
DB_PASSWORD='sysprogress'
DB_DATABASE_EMP=
DB_DATABASE_MULT=

# Timeouts (em milissegundos)
DB_CONNECTION_TIMEOUT=30000
DB_REQUEST_TIMEOUT=30000
HTTP_REQUEST_TIMEOUT=30000
HTTP_HEAVY_TIMEOUT=60000
HTTP_HEALTH_TIMEOUT=5000

# CORS
CORS_ALLOWED_ORIGINS=http://lor0138.lorenzetti.ibe:3000

# Cache
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300
CACHE_ITEM_TTL=600

# Logs
LOG_LEVEL=info
LOG_DIR=./logs

# Graceful Shutdown
SHUTDOWN_TIMEOUT=10000
```

### ⚠️ Pontos Críticos

#### 1. Senha com #

```env
# ✅ CORRETO
DB_PASSWORD='#senha#'

# ❌ ERRADO
DB_PASSWORD=#senha#
DB_PASSWORD="#senha#"
```

#### 2. Timeouts

```env
# ✅ CORRETO (milissegundos puros)
DB_CONNECTION_TIMEOUT=30000

# ❌ ERRADO (não funciona com sqlServerConfig.ts)
DB_CONNECTION_TIMEOUT=30s
```

#### 3. Database Vazio

```env
# ✅ CORRETO (usa default do SQL user)
DB_DATABASE_EMP=
DB_DATABASE_MULT=

# ❌ ERRADO (força database específico)
DB_DATABASE_EMP=emp
DB_DATABASE_MULT=mult
```

---

## 💻 Deployment Local

### 1. Clonar Repositório

```bash
git clone <repository-url>
cd lor0138
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Ambiente

```bash
cp .env.example .env
nano .env  # Editar configurações
```

### 4. Compilar TypeScript

```bash
npm run build
```

### 5. Executar

#### Modo Desenvolvimento (com hot reload)

```bash
npm run dev
```

#### Modo Produção

```bash
npm start
```

### 6. Verificar

```bash
curl http://localhost:3000/health
```

**Esperado:** `200 OK` com JSON

---

## 🔄 Deployment com PM2

PM2 é recomendado para ambientes de produção em servidores Linux.

### Instalação do PM2

```bash
npm install -g pm2
```

### Configuração PM2

Crie `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'lor0138-api',
    script: './dist/server.js',
    instances: 2,  // ou 'max' para usar todos os CPUs
    exec_mode: 'cluster',

    // Variáveis de ambiente
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // Timeouts
    kill_timeout: 15000,
    wait_ready: true,
    listen_timeout: 10000,

    // Restart automático
    max_memory_restart: '500M',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',

    // Logs
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Monitoramento
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git']
  }]
};
```

### Comandos PM2

#### Iniciar

```bash
pm2 start ecosystem.config.js
```

#### Status

```bash
pm2 status
pm2 list
pm2 info lor0138-api
```

#### Logs

```bash
pm2 logs lor0138-api
pm2 logs lor0138-api --lines 100
pm2 logs lor0138-api --err  # Apenas erros
```

#### Restart

```bash
pm2 restart lor0138-api
pm2 reload lor0138-api  # Zero downtime
```

#### Stop

```bash
pm2 stop lor0138-api
```

#### Delete

```bash
pm2 delete lor0138-api
```

#### Monitoramento

```bash
pm2 monit
```

#### Iniciar no Boot

```bash
pm2 startup
pm2 save
```

#### Deploy Automático

```bash
# Deploy script
#!/bin/bash
git pull origin main
npm install
npm run build
pm2 reload ecosystem.config.js --update-env
```

---

## 🐳 Deployment com Docker

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY src ./src

# Build
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código compilado do build stage
COPY --from=builder /app/dist ./dist

# Criar diretório de logs
RUN mkdir -p logs

# Usuário não-root
USER node

# Porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Graceful shutdown
STOPSIGNAL SIGTERM

# Comando de start
CMD ["node", "dist/server.js"]
```

### .dockerignore

```
node_modules
dist
logs
.env
.env.*
.git
.gitignore
*.md
*.log
coverage
.vscode
.idea
```

### Build da Imagem

```bash
docker build -t lor0138-api:latest .
```

### Executar Container

```bash
docker run -d \
  --name lor0138-api \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  lor0138-api:latest
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  lor0138-api:
    build: .
    image: lor0138-api:latest
    container_name: lor0138-api
    restart: unless-stopped

    ports:
      - "3000:3000"

    volumes:
      - ./logs:/app/logs

    env_file:
      - .env

    environment:
      NODE_ENV: production
      PORT: 3000

    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    stop_grace_period: 30s

    networks:
      - lor0138-network

networks:
  lor0138-network:
    driver: bridge
```

### Comandos Docker Compose

```bash
# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## ☸️ Deployment com Kubernetes

### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lor0138-api
  labels:
    app: lor0138-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: lor0138-api

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0

  template:
    metadata:
      labels:
        app: lor0138-api

    spec:
      terminationGracePeriodSeconds: 30

      containers:
      - name: lor0138-api
        image: lor0138-api:latest
        imagePullPolicy: Always

        ports:
        - containerPort: 3000
          name: http

        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"

        envFrom:
        - secretRef:
            name: lor0138-secrets

        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

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

        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 5"]

        volumeMounts:
        - name: logs
          mountPath: /app/logs

      volumes:
      - name: logs
        emptyDir: {}
```

### service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: lor0138-api
  labels:
    app: lor0138-api
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: lor0138-api
```

### secrets.yaml

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: lor0138-secrets
type: Opaque
stringData:
  DB_SERVER: "10.105.0.4\\LOREN"
  DB_USER: "sysprogress"
  DB_PASSWORD: "sysprogress"
  DB_DATABASE_EMP: ""
  DB_DATABASE_MULT: ""
```

### ingress.yaml

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: lor0138-api
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - lor0138.lorenzetti.ibe
    secretName: lor0138-tls
  rules:
  - host: lor0138.lorenzetti.ibe
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: lor0138-api
            port:
              number: 80
```

### Comandos Kubernetes

```bash
# Apply manifests
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f secrets.yaml
kubectl apply -f ingress.yaml

# Status
kubectl get pods
kubectl get services
kubectl get ingress

# Logs
kubectl logs -f deployment/lor0138-api

# Describe
kubectl describe pod <pod-name>

# Scale
kubectl scale deployment lor0138-api --replicas=5

# Rollout
kubectl rollout status deployment/lor0138-api
kubectl rollout history deployment/lor0138-api
kubectl rollout undo deployment/lor0138-api

# Delete
kubectl delete deployment lor0138-api
kubectl delete service lor0138-api
```

---

## 🚀 Deployment em Produção

### Checklist Pré-Deploy

- [ ] Código revisado e aprovado
- [ ] Testes passando (unit + integration + E2E)
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados acessível
- [ ] Backup da versão anterior
- [ ] Documentação atualizada
- [ ] Changelog criado
- [ ] Tag de versão criada no Git

### Processo de Deploy

#### 1. Backup

```bash
# Backup do código atual
cd /var/www/lor0138
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# Mover para diretório de backups
mv backup-*.tar.gz /backups/lor0138/
```

#### 2. Pull do Código

```bash
git fetch origin
git checkout main
git pull origin main
```

#### 3. Instalar Dependências

```bash
npm ci --only=production
```

#### 4. Build

```bash
npm run build
```

#### 5. Validar Configuração

```bash
node -e "
const ConfigValidator = require('./dist/config/configValidator').ConfigValidator;
const result = ConfigValidator.validate();
if (!result.isValid) {
  console.error('❌ Configuração inválida');
  process.exit(1);
}
console.log('✅ Configuração válida');
"
```

#### 6. Deploy

##### Com PM2

```bash
pm2 reload ecosystem.config.js --update-env
```

##### Com Docker

```bash
docker-compose up -d --build
```

##### Com Kubernetes

```bash
kubectl set image deployment/lor0138-api lor0138-api=lor0138-api:new-version
kubectl rollout status deployment/lor0138-api
```

#### 7. Verificar Health

```bash
# Aguardar 10 segundos
sleep 10

# Verificar health
curl -f http://localhost:3000/health || exit 1

# Verificar endpoint principal
curl -f http://localhost:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110 || exit 1
```

#### 8. Monitorar Logs

```bash
# PM2
pm2 logs lor0138-api --lines 50

# Docker
docker-compose logs -f --tail=50

# Kubernetes
kubectl logs -f deployment/lor0138-api --tail=50
```

### Script de Deploy Automatizado

```bash
#!/bin/bash
# deploy.sh

set -e  # Exit on error

echo "🚀 Iniciando deployment..."

# 1. Backup
echo "📦 Criando backup..."
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz .
mv backup-*.tar.gz /backups/lor0138/

# 2. Pull código
echo "📥 Atualizando código..."
git pull origin main

# 3. Instalar dependências
echo "📦 Instalando dependências..."
npm ci --only=production

# 4. Build
echo "🔨 Compilando..."
npm run build

# 5. Validar
echo "✅ Validando configuração..."
npm run validate:config || exit 1

# 6. Deploy
echo "🔄 Atualizando aplicação..."
pm2 reload ecosystem.config.js --update-env

# 7. Verificar
echo "🏥 Verificando health..."
sleep 10
curl -f http://localhost:3000/health || exit 1

# 8. Sucesso
echo "✅ Deploy concluído com sucesso!"
pm2 logs lor0138-api --lines 20
```

---

## 📊 Monitoramento

### Logs

#### Localização

```
./logs/app-YYYY-MM-DD.log
./logs/error-YYYY-MM-DD.log
./logs/pm2-out.log
./logs/pm2-error.log
```

#### Visualizar Logs

```bash
# Tail em tempo real
tail -f logs/app-$(date +%Y-%m-%d).log

# Últimas 100 linhas
tail -n 100 logs/app-$(date +%Y-%m-%d).log

# Buscar por correlation ID
grep "550e8400-e29b-41d4-a716-446655440000" logs/app-*.log

# Contar erros
grep '"level":"error"' logs/app-$(date +%Y-%m-%d).log | wc -l
```

### Métricas Prometheus

#### Configurar Scraping

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'lor0138-api'
    static_configs:
      - targets: ['lor0138.lorenzetti.ibe:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

#### Alertas

```yaml
# alerts.yml
groups:
- name: lor0138
  rules:

  # Alta taxa de erro
  - alert: HighErrorRate
    expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
    for: 5m
    annotations:
      summary: "Alta taxa de erro (> 5%)"

  # Rate limit frequente
  - alert: HighRateLimitBlocked
    expr: rate(rate_limit_requests_blocked[5m]) > 10
    for: 5m
    annotations:
      summary: "Muitas requisições bloqueadas por rate limit"

  # Baixo hit rate de cache
  - alert: LowCacheHitRate
    expr: rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.5
    for: 10m
    annotations:
      summary: "Taxa de cache hit muito baixa (< 50%)"

  # API lenta
  - alert: SlowAPI
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 5m
    annotations:
      summary: "API lenta (P95 > 2s)"
```

### Dashboards Grafana

#### Import Dashboard

1. Acesse Grafana
2. Import > Upload JSON
3. Use o template em `/monitoring/grafana-dashboard.json`

#### Painéis Principais

- **HTTP Requests** - Requisições por rota, status, método
- **Response Time** - Latência P50, P95, P99
- **Cache** - Hit rate, tamanho, operações
- **Database** - Query time, conexões ativas
- **Rate Limit** - Requisições permitidas/bloqueadas
- **Errors** - Taxa de erro, tipos de erro

---

## ⏪ Rollback

### PM2

```bash
# Restaurar backup
cd /var/www/lor0138
tar -xzf /backups/lor0138/backup-20251006-120000.tar.gz

# Restart
pm2 restart lor0138-api
```

### Docker

```bash
# Voltar para versão anterior
docker-compose down
docker-compose up -d lor0138-api:previous-version
```

### Kubernetes

```bash
# Rollback para versão anterior
kubectl rollout undo deployment/lor0138-api

# Rollback para versão específica
kubectl rollout undo deployment/lor0138-api --to-revision=2
```

### Git

```bash
# Ver histórico
git log --oneline

# Voltar para commit específico
git checkout <commit-hash>

# Criar nova branch de rollback
git checkout -b rollback-<version>
```

---

## 🔧 Troubleshooting

### Aplicação Não Inicia

#### Erro: "Configuração inválida"

```bash
# Verificar .env
cat .env

# Validar manualmente
npm run validate:config
```

**Solução:** Corrigir variáveis conforme mensagem de erro

#### Erro: "Cannot connect to database"

```bash
# Testar conexão SQL
telnet 10.105.0.4 1433

# Verificar credenciais
sqlcmd -S 10.105.0.4\LOREN -U sysprogress -P 'sysprogress'
```

**Solução:** Verificar firewall, credenciais, SQL Server online

#### Erro: "Port 3000 already in use"

```bash
# Ver processo usando porta
lsof -i :3000
netstat -tulpn | grep 3000

# Matar processo
kill -9 <PID>

# Ou usar outra porta
export PORT=3001
npm start
```

### Aplicação Lenta

#### Verificar Logs

```bash
grep '"duration":' logs/app-$(date +%Y-%m-%d).log | sort -n -k4 -t: | tail -20
```

#### Verificar Métricas

```bash
curl http://localhost:3000/metrics | grep http_request_duration
```

#### Verificar Cache

```bash
curl http://localhost:3000/cache/stats
```

**Solução:**
- Aumentar cache TTL
- Otimizar queries lentas
- Escalar horizontalmente

### Erros 503

#### Verificar Health

```bash
curl http://localhost:3000/health
```

**Se modo MOCK:** Banco está offline

**Solução:**
1. Verificar conexão com SQL Server
2. Verificar credenciais
3. Reiniciar SQL Server se necessário

### Memory Leak

#### Verificar Uso de Memória

```bash
# PM2
pm2 info lor0138-api

# Docker
docker stats lor0138-api

# Processo
ps aux | grep node
```

**Solução:**
1. Configurar `max_memory_restart` no PM2
2. Analisar heap dump
3. Verificar conexões não fechadas

### Logs Não Aparecem

#### Verificar Permissões

```bash
ls -la logs/
chmod 755 logs/
chown node:node logs/
```

#### Verificar Configuração

```bash
echo $LOG_LEVEL
echo $LOG_DIR
```

---

## ✅ Checklist de Deployment

### Pré-Deploy

- [ ] Código revisado
- [ ] Testes passando
- [ ] Changelog atualizado
- [ ] Tag criada no Git
- [ ] .env configurado
- [ ] Banco acessível
- [ ] Backup criado

### Durante Deploy

- [ ] Pull do código
- [ ] Build realizado
- [ ] Configuração validada
- [ ] Deploy executado
- [ ] Health check OK
- [ ] Logs monitorados

### Pós-Deploy

- [ ] Endpoints funcionando
- [ ] Métricas sendo coletadas
- [ ] Alertas configurados
- [ ] Documentação atualizada
- [ ] Equipe notificada
- [ ] Rollback testado

---

## 📚 Referências

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [The Twelve-Factor App](https://12factor.net/)

---

**Última atualização:** 2025-10-06
**Versão:** 1.0.0
**Mantenedor:** Projeto LOR0138