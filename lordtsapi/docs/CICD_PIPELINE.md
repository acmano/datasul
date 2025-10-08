# CI/CD_PIPELINE.md - Pipeline de Integração e Deploy Contínuo

## 📋 Índice

1. [Estratégias de CI/CD](#estrategias-de-cicd)
2. [Opção 1: GitHub Actions (Recomendado)](#opcao-1-github-actions)
3. [Opção 2: GitLab CI](#opcao-2-gitlab-ci)
4. [Opção 3: Git Hooks Locais](#opcao-3-git-hooks-locais)
5. [Opção 4: Jenkins](#opcao-4-jenkins)
6. [Webhooks para Deploy Automático](#webhooks-para-deploy-automatico)
7. [Notificações](#notificacoes)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Estratégias de CI/CD

### Comparação

| Estratégia | Complexidade | Custo | Recursos | Recomendado |
|------------|--------------|-------|----------|-------------|
| **GitHub Actions** | Média | Grátis* | Cloud/Self-hosted | ✅ Sim |
| **GitLab CI** | Média | Grátis* | Cloud/Self-hosted | ✅ Sim |
| **Git Hooks** | Baixa | Grátis | Local | ⚠️  Inicial |
| **Jenkins** | Alta | Grátis | Self-hosted | ❌ Não |

*Grátis com limitações. Self-hosted = ilimitado.

### Nossa Escolha

Para este projeto, recomendo **GitHub Actions com Self-Hosted Runner** porque:

1. ✅ **Grátis e ilimitado** (runner na sua máquina)
2. ✅ **Profissional** (usado por grandes empresas)
3. ✅ **Fácil de configurar**
4. ✅ **Integrado com GitHub**
5. ✅ **YAML simples**
6. ✅ **Marketplace de actions**

---

## 🚀 Opção 1: GitHub Actions (Recomendado)

### Arquitetura

```
GitHub Repository
    ↓
GitHub Actions (Workflow)
    ↓
Self-Hosted Runner (Ubuntu)
    ↓
Deploy Script
    ↓
PM2 Reload (zero downtime)
```

### Passo 1: Criar Self-Hosted Runner

#### 1.1. No GitHub

1. Ir para o repositório no GitHub
2. **Settings** → **Actions** → **Runners**
3. Clicar em **New self-hosted runner**
4. Selecionar **Linux** e **x64**
5. Copiar os comandos que aparecem

#### 1.2. No Servidor (como lor0138app)

```bash
# Mudar para usuário lor0138app
sudo -u lor0138app -i

# Criar diretório para o runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Baixar runner (versão pode mudar, use a do GitHub)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extrair
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configurar runner (usar comando do GitHub)
./config.sh --url https://github.com/empresa/lor0138 --token SEU_TOKEN_AQUI

# Quando perguntar:
# - Runner name: lor0138-production
# - Runner group: Default
# - Labels: self-hosted,Linux,X64,production
# - Work folder: _work (padrão)
```

#### 1.3. Instalar como Serviço

```bash
# Instalar serviço systemd
sudo ./svc.sh install lor0138app

# Iniciar serviço
sudo ./svc.sh start

# Verificar status
sudo ./svc.sh status

# Habilitar no boot
sudo systemctl enable actions.runner.empresa-lor0138.lor0138-production.service
```

#### 1.4. Verificar no GitHub

- Voltar para **Settings** → **Actions** → **Runners**
- Deve aparecer **lor0138-production** com status **Idle** (verde)

### Passo 2: Criar Workflow

Criar arquivo no repositório:

```bash
mkdir -p .github/workflows
nano .github/workflows/deploy-production.yml
```

```yaml
# .github/workflows/deploy-production.yml

name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:  # Permite trigger manual

env:
  NODE_VERSION: '18'

jobs:
  # Job 1: Tests e Build
  test:
    name: Tests & Build
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🔍 Run linter
        run: npm run lint

      - name: 🔨 Build TypeScript
        run: npm run build

      - name: 🧪 Run unit tests
        run: npm run test:unit

      - name: 📊 Check coverage
        run: npm run test:coverage

      - name: 📤 Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: false

  # Job 2: Deploy (só roda se tests passarem)
  deploy:
    name: Deploy to Production
    runs-on: self-hosted  # ← Runner na sua máquina
    needs: test
    if: github.ref == 'refs/heads/main'

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: 📋 Create release directory
        run: |
          RELEASE_DIR="/opt/lor0138/releases/$(date +%Y-%m-%d_%H-%M-%S)"
          echo "RELEASE_DIR=$RELEASE_DIR" >> $GITHUB_ENV
          mkdir -p "$RELEASE_DIR"
          cp -r . "$RELEASE_DIR/"

      - name: ⚙️  Copy production env
        run: |
          cp /opt/lor0138/shared/.env "$RELEASE_DIR/.env"

      - name: 📦 Install production dependencies
        run: |
          cd "$RELEASE_DIR"
          npm ci --production

      - name: 🔨 Build application
        run: |
          cd "$RELEASE_DIR"
          npm run build

      - name: 💾 Backup current version
        run: |
          if [ -L /opt/lor0138/current ]; then
            /opt/lor0138/scripts/backup.sh
          fi

      - name: 🔗 Update symlink
        run: |
          ln -snf "$RELEASE_DIR" /opt/lor0138/current

      - name: ♻️  Reload PM2
        run: |
          cd /opt/lor0138/shared
          pm2 reload ecosystem.config.js --update-env

      - name: ⏱️  Wait for startup
        run: sleep 5

      - name: 🏥 Health check
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

          if [ $response -eq 200 ]; then
            echo "✅ Deploy successful! Health check passed."
          else
            echo "❌ Health check failed with status $response"
            echo "Rolling back..."
            /opt/lor0138/scripts/rollback.sh
            exit 1
          fi

      - name: 🧹 Cleanup old releases
        run: |
          cd /opt/lor0138/releases
          ls -t | tail -n +6 | xargs -r rm -rf

      - name: 📝 Log deployment
        run: |
          echo "$(date '+%Y-%m-%d %H:%M:%S') - Deploy successful - Commit: ${{ github.sha }}" \
            >> /var/log/lor0138/deployments.log

  # Job 3: Notify (sempre roda)
  notify:
    name: Notify
    runs-on: ubuntu-latest
    needs: [test, deploy]
    if: always()

    steps:
      - name: 📧 Send notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Deploy to production: ${{ job.status }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
        if: env.SLACK_WEBHOOK_URL != ''
```

### Passo 3: Secrets (Opcional)

Se precisar de secrets (ex: Slack webhook):

1. GitHub → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Nome: `SLACK_WEBHOOK`
4. Valor: URL do webhook do Slack

### Passo 4: Testar Deploy

```bash
# 1. Fazer uma mudança
echo "# Test CI/CD" >> README.md

# 2. Commit e push
git add .
git commit -m "test: CI/CD pipeline"
git push origin main

# 3. Ver no GitHub
# Repository → Actions → Ver workflow rodando

# 4. Ver logs no servidor
tail -f /var/log/lor0138/deployments.log
pm2 logs lor0138
```

### Passo 5: Deploy Manual (Workflow Dispatch)

1. GitHub → **Actions**
2. Selecionar **Deploy to Production**
3. Clicar em **Run workflow**
4. Selecionar branch **main**
5. Clicar em **Run workflow**

### Estrutura de Branch (Recomendado)

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (development)
```

**Workflow adicional para develop:**

```yaml
# .github/workflows/test.yml

name: Test

on:
  push:
    branches:
      - develop
      - 'feature/**'
  pull_request:
    branches:
      - main
      - develop

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # ... mesmos steps de test do deploy-production.yml
      # Mas SEM o job de deploy
```

---

## 🦊 Opção 2: GitLab CI

Se usar GitLab em vez de GitHub:

### Passo 1: Instalar GitLab Runner

```bash
# Adicionar repositório
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash

# Instalar
sudo apt install gitlab-runner

# Registrar runner
sudo gitlab-runner register

# Quando perguntar:
# - GitLab instance URL: https://gitlab.com ou sua instância
# - Token: pegar em Settings → CI/CD → Runners
# - Description: lor0138-production
# - Tags: production,ubuntu,self-hosted
# - Executor: shell
```

### Passo 2: Criar .gitlab-ci.yml

```yaml
# .gitlab-ci.yml

stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

# Cache para acelerar
cache:
  paths:
    - node_modules/

# Tests
test:unit:
  stage: test
  tags:
    - production
  script:
    - npm ci
    - npm run lint
    - npm run test:unit
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

# Build
build:
  stage: build
  tags:
    - production
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

# Deploy
deploy:production:
  stage: deploy
  tags:
    - production
  only:
    - main
  script:
    - RELEASE_DIR="/opt/lor0138/releases/$(date +%Y-%m-%d_%H-%M-%S)"
    - mkdir -p "$RELEASE_DIR"
    - cp -r . "$RELEASE_DIR/"
    - cp /opt/lor0138/shared/.env "$RELEASE_DIR/.env"
    - cd "$RELEASE_DIR"
    - npm ci --production
    - npm run build
    - |
      if [ -L /opt/lor0138/current ]; then
        /opt/lor0138/scripts/backup.sh
      fi
    - ln -snf "$RELEASE_DIR" /opt/lor0138/current
    - cd /opt/lor0138/shared
    - pm2 reload ecosystem.config.js --update-env
    - sleep 5
    - |
      response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
      if [ $response -ne 200 ]; then
        echo "Health check failed"
        /opt/lor0138/scripts/rollback.sh
        exit 1
      fi
    - cd /opt/lor0138/releases && ls -t | tail -n +6 | xargs -r rm -rf
  environment:
    name: production
    url: https://lor0138.lorenzetti.ibe
```

---

## 🪝 Opção 3: Git Hooks Locais (Simples)

Para começar rápido sem CI/CD externo:

### Passo 1: Criar Hook de Post-Receive

No servidor de produção, criar um repositório bare:

```bash
# Como lor0138app
cd /opt/lor0138
git init --bare repo.git

# Criar hook
nano repo.git/hooks/post-receive
```

```bash
#!/bin/bash
# /opt/lor0138/repo.git/hooks/post-receive

RELEASE_DIR="/opt/lor0138/releases/$(date +%Y-%m-%d_%H-%M-%S)"

echo "🚀 Starting deployment..."

# Checkout code
git --work-tree="$RELEASE_DIR" --git-dir=/opt/lor0138/repo.git checkout -f

# Copy .env
cp /opt/lor0138/shared/.env "$RELEASE_DIR/.env"

# Install dependencies
cd "$RELEASE_DIR"
npm ci --production

# Build
npm run build

# Update symlink
ln -snf "$RELEASE_DIR" /opt/lor0138/current

# Reload PM2
cd /opt/lor0138/shared
pm2 reload ecosystem.config.js --update-env

# Health check
sleep 5
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ $response -eq 200 ]; then
    echo "✅ Deploy successful!"
else
    echo "❌ Deploy failed!"
    /opt/lor0138/scripts/rollback.sh
    exit 1
fi
```

```bash
# Dar permissão
chmod +x repo.git/hooks/post-receive
```

### Passo 2: Adicionar Remote na Máquina Local

```bash
# No seu repositório local
git remote add production lor0138app@lor0138.lorenzetti.ibe:/opt/lor0138/repo.git

# Deploy
git push production main
```

---

## 🔔 Webhooks para Deploy Automático

Se quiser deploy automático via webhook HTTP:

### Criar Endpoint de Webhook

```bash
sudo nano /opt/lor0138/scripts/webhook-server.js
```

```javascript
// /opt/lor0138/scripts/webhook-server.js

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

const PORT = 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'seu-secret-aqui';

function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

const server = http.createServer((req, res) => {
  if (req.url === '/deploy' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const signature = req.headers['x-hub-signature-256'];

      if (!signature || !verifySignature(body, signature)) {
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }

      console.log('✅ Webhook received, starting deploy...');

      exec('/opt/lor0138/scripts/deploy.sh', (error, stdout, stderr) => {
        if (error) {
          console.error('Deploy failed:', error);
          res.writeHead(500);
          res.end('Deploy failed');
          return;
        }

        console.log(stdout);
        res.writeHead(200);
        res.end('Deploy started');
      });
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
```

### Executar com PM2

```bash
# Adicionar ao ecosystem.config.js
{
  name: 'lor0138-webhook',
  script: '/opt/lor0138/scripts/webhook-server.js',
  env: {
    WEBHOOK_SECRET: 'seu-secret-seguro-aqui'
  }
}

# Iniciar
pm2 start ecosystem.config.js
pm2 save
```

### Configurar no GitHub

1. Repository → **Settings** → **Webhooks**
2. **Add webhook**
3. **Payload URL:** `http://lor0138.lorenzetti.ibe:9000/deploy`
4. **Content type:** `application/json`
5. **Secret:** mesmo do WEBHOOK_SECRET
6. **Events:** Just the push event
7. **Active:** ✅

---

## 📬 Notificações

### Slack

```bash
# Instalar webhook
npm install -g slack-notify

# Criar webhook no Slack
# https://api.slack.com/messaging/webhooks

# Adicionar ao .bashrc ou script
export SLACK_WEBHOOK="https://hooks.slack.com/services/..."

# Enviar notificação
slack-notify -w "$SLACK_WEBHOOK" "Deploy successful! 🎉"
```

### Email

```bash
# Instalar mailutils
sudo apt install -y mailutils

# Configurar SMTP (se necessário)
sudo dpkg-reconfigure postfix

# Enviar email
echo "Deploy successful" | mail -s "LOR0138 Deploy" admin@empresa.com
```

### Telegram

```bash
# Criar bot no Telegram (@BotFather)
# Pegar token e chat_id

# Script
curl -s -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" \
  -d chat_id="$CHAT_ID" \
  -d text="Deploy successful! 🎉"
```

---

## 🐛 Troubleshooting

### Runner não conecta

```bash
# Ver logs
sudo journalctl -u actions.runner.* -f

# Reiniciar
sudo systemctl restart actions.runner.*

# Verificar conectividade
ping github.com
curl -I https://github.com
```

### Deploy falha no health check

```bash
# Ver logs da aplicação
pm2 logs lor0138

# Ver logs do PM2
cat /var/log/lor0138/pm2/lor0138-error.log

# Testar health check manualmente
curl -v http://localhost:3000/health

# Verificar processo
pm2 status
```

### Webhook não dispara

```bash
# Ver logs do webhook server
pm2 logs lor0138-webhook

# Testar manualmente
curl -X POST http://localhost:9000/deploy \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Verificar firewall
sudo ufw status
sudo ufw allow 9000/tcp
```

### Permissões

```bash
# Verificar owner dos arquivos
ls -la /opt/lor0138/

# Corrigir permissões
sudo chown -R lor0138app:lor0138app /opt/lor0138
sudo chmod -R 755 /opt/lor0138
```

---

## 📋 Checklist CI/CD

### Setup Inicial

- [ ] Runner instalado e rodando
- [ ] Workflow criado (`.github/workflows/`)
- [ ] Scripts de deploy criados
- [ ] PM2 configurado
- [ ] Permissões corretas
- [ ] Secrets configurados (se aplicável)

### Teste de Deploy

- [ ] Workflow roda sem erros
- [ ] Testes passam
- [ ] Build funciona
- [ ] Deploy executa
- [ ] Health check passa
- [ ] Rollback funciona (testar)
- [ ] Logs sendo gravados

### Produção

- [ ] Branch protection configurado (main)
- [ ] Code review obrigatório
- [ ] Status checks obrigatórios
- [ ] Notificações configuradas
- [ ] Backup funcionando
- [ ] Monitoramento ativo

---

## 🎯 Resumo das Opções

### Para Começar Rápido
→ **Git Hooks Locais** (30 minutos)

### Para Produção Profissional
→ **GitHub Actions com Self-Hosted Runner** (2 horas)

### Se Usar GitLab
→ **GitLab CI** (2 horas)

---

## 📚 Próximos Passos

Depois de configurar CI/CD:

1. ✅ Implementar branch protection
2. ✅ Configurar code review
3. ✅ Adicionar integration tests ao pipeline
4. ✅ Implementar staging environment
5. ✅ Configurar monitoramento (Prometheus/Grafana)
6. ✅ Implementar blue-green deployment (se escalar)

---

**Última atualização:** 2025-10-06
**Relacionado:** PRODUCTION.md, DEVELOPER_GUIDE.md