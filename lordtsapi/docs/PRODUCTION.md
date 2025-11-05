# PRODUCTION.md - Guia de Deploy em Produção

## Índice

1. [Arquitetura de Produção](#arquitetura-de-producao)
2. [Preparação do Servidor](#preparacao-do-servidor)
3. [Estrutura de Diretórios](#estrutura-de-diretorios)
4. [Process Manager (PM2)](#process-manager-pm2)
5. [Nginx Reverse Proxy](#nginx-reverse-proxy)
6. [SSL/HTTPS](#sslhttps)
7. [Logs e Monitoramento](#logs-e-monitoramento)
8. [Backup Automático](#backup-automatico)
9. [Deploy Manual](#deploy-manual)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Rollback](#rollback)
12. [Troubleshooting](#troubleshooting)

---

## 🏗 Arquitetura de Produção

### Stack Completo

```
Internet
    ↓
Firewall (UFW) - Portas 80, 443
    ↓
Nginx (Reverse Proxy) - :80, :443
    ↓
PM2 (Process Manager)
    ↓
Node.js App (lor0138) - :3000
    ↓
SQL Server (10.105.0.4\LOREN)
Redis (localhost:6379)
```

### Máquina

- **OS:** Ubuntu 20.04+ LTS
- **RAM:** 4GB+ (recomendado 8GB)
- **CPU:** 2+ cores
- **Disco:** 20GB+ livre
- **Mesma máquina** para dev e produção (por enquanto)

---

## 🔧 Preparação do Servidor

### 1. Atualizar Sistema

```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

### 2. Instalar Dependências

```bash
# Node.js 18+ (via nvm - recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18

# Ou via apt (alternativa)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar versão
node --version  # v18.x.x
npm --version   # 9.x.x

# Git
sudo apt install -y git

# Build tools
sudo apt install -y build-essential

# Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Nginx
sudo apt install -y nginx
sudo systemctl enable nginx

# PM2 (global)
sudo npm install -g pm2
```

### 3. Criar Usuário Dedicado (Segurança)

```bash
# Criar usuário 'lor0138app' sem privilégios de root
sudo adduser --disabled-password --gecos "" lor0138app

# Adicionar ao grupo www-data (Nginx)
sudo usermod -aG www-data lor0138app

# Permitir sudo apenas para PM2 (opcional)
echo "lor0138app ALL=(ALL) NOPASSWD: /usr/bin/pm2" | sudo tee /etc/sudoers.d/lor0138app
```

### 4. Configurar Firewall (UFW)

```bash
# Habilitar firewall
sudo ufw enable

# Permitir SSH (IMPORTANTE: fazer antes de enable!)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir conexão com SQL Server (se aplicável)
sudo ufw allow out 1433/tcp

# Verificar status
sudo ufw status
```

---

## 📁 Estrutura de Diretórios

### Diretórios Padrão

```bash
# Criar estrutura como root
sudo mkdir -p /opt/lor0138
sudo mkdir -p /var/log/lor0138
sudo mkdir -p /opt/lor0138/releases
sudo mkdir -p /opt/lor0138/shared
sudo mkdir -p /opt/lor0138/backups

# Dar permissão ao usuário lor0138app
sudo chown -R lor0138app:lor0138app /opt/lor0138
sudo chown -R lor0138app:lor0138app /var/log/lor0138
sudo chmod -R 755 /opt/lor0138
sudo chmod -R 755 /var/log/lor0138
```

### Estrutura Final

```
/opt/lor0138/
├── current/              # Symlink para release atual
├── releases/             # Releases antigas (rollback)
│   ├── 2025-10-06_12-30-00/
│   ├── 2025-10-06_15-45-00/
│   └── 2025-10-06_18-20-00/  ← current aponta aqui
├── shared/               # Arquivos compartilhados entre releases
│   ├── .env              # Config de produção
│   ├── logs -> /var/log/lor0138/
│   └── node_modules/     # Cache de node_modules
└── backups/              # Backups automáticos
    └── backup-2025-10-06.tar.gz

/var/log/lor0138/
├── app-2025-10-06.log
├── error-2025-10-06.log
├── combined.log
└── pm2/                  # Logs do PM2
    ├── lor0138-out.log
    └── lor0138-error.log
```

### Por Que Esta Estrutura?

- `/opt/lor0138` - Padrão Linux para apps de terceiros
- `releases/` - Permite rollback instantâneo
- `shared/` - Config e logs persistem entre deploys
- `current/` - Symlink facilita updates zero-downtime

---

## 🔄 Process Manager (PM2)

### 1. Criar ecosystem.config.js

```bash
# Como usuário lor0138app
cd /opt/lor0138/shared
nano ecosystem.config.js
```

```javascript
// /opt/lor0138/shared/ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'lor0138',
      script: './dist/server.js',
      cwd: '/opt/lor0138/current',
      instances: 2,                    // Cluster mode: 2 instâncias
      exec_mode: 'cluster',
      watch: false,                    // Não watch em produção
      max_memory_restart: '500M',      // Restart se usar > 500MB
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/lor0138/pm2/lor0138-error.log',
      out_file: '/var/log/lor0138/pm2/lor0138-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: true,
      shutdown_with_message: true
    }
  ]
};
```

### 2. Configurar PM2 Startup

```bash
# Como usuário lor0138app
pm2 startup

# Copiar e executar o comando que aparecer (exemplo):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u lor0138app --hp /home/lor0138app

# Salvar configuração atual
pm2 save
```

### 3. Comandos PM2 Úteis

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Parar
pm2 stop lor0138

# Reiniciar (sem downtime em cluster mode)
pm2 reload lor0138

# Ver logs
pm2 logs lor0138

# Monitorar
pm2 monit

# Status
pm2 status

# Informações detalhadas
pm2 show lor0138

# Limpar logs
pm2 flush

# Remover da lista
pm2 delete lor0138
```

### 4. PM2 Log Rotation

```bash
# Instalar módulo de log rotation
pm2 install pm2-logrotate

# Configurar (manter 7 dias de logs)
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
```

---

## 🌐 Nginx Reverse Proxy

### 1. Remover Configuração Padrão

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 2. Criar Configuração do LOR0138

```bash
sudo nano /etc/nginx/sites-available/lor0138
```

```nginx
# /etc/nginx/sites-available/lor0138

upstream lor0138_backend {
    # PM2 cluster com 2 instâncias
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_status 429;

# Redirect HTTP -> HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name lor0138.lorenzetti.ibe;

    # Permitir Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirecionar todo o resto para HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name lor0138.lorenzetti.ibe;

    # SSL Certificates (será configurado depois)
    ssl_certificate /etc/letsencrypt/live/lor0138.lorenzetti.ibe/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lor0138.lorenzetti.ibe/privkey.pem;

    # SSL Settings (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/lor0138-access.log;
    error_log /var/log/nginx/lor0138-error.log warn;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    send_timeout 60s;

    # Buffer sizes
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
    large_client_header_buffers 2 1k;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    # Rate limiting para API
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://lor0138_backend;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;

        # Timeout
        proxy_read_timeout 60s;

        # Cache control
        proxy_cache_bypass $http_upgrade;
        add_header X-Proxy-Cache $upstream_cache_status;
    }

    # Health check (sem rate limit)
    location /health {
        proxy_pass http://lor0138_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # Swagger docs
    location /api-docs {
        proxy_pass http://lor0138_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Root
    location / {
        proxy_pass http://lor0138_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Status do Nginx
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

### 3. Habilitar Site

```bash
# Criar symlink
sudo ln -s /etc/nginx/sites-available/lor0138 /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Se OK, recarregar
sudo systemctl reload nginx
```

### 4. Verificar Status

```bash
sudo systemctl status nginx
curl -I http://localhost
```

---

## 🔒 SSL/HTTPS

### 1. Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obter Certificado

```bash
# Parar nginx temporariamente
sudo systemctl stop nginx

# Obter certificado
sudo certbot certonly --standalone -d lor0138.lorenzetti.ibe

# Ou se nginx já estiver rodando:
sudo certbot --nginx -d lor0138.lorenzetti.ibe

# Reiniciar nginx
sudo systemctl start nginx
```

### 3. Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Certbot já configura cronjob automático em /etc/cron.d/certbot
# Verificar
cat /etc/cron.d/certbot

# Força renovação manual (se necessário)
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### 4. Verificar SSL

```bash
# Verificar certificado
sudo certbot certificates

# Testar HTTPS
curl -I https://lor0138.lorenzetti.ibe/health
```

---

## 📊 Logs e Monitoramento

### 1. Estrutura de Logs

```
/var/log/lor0138/
├── app-2025-10-06.log       # Logs da aplicação (Winston)
├── error-2025-10-06.log     # Erros (Winston)
├── combined.log             # Todos os logs (Winston)
└── pm2/
    ├── lor0138-out.log      # stdout do PM2
    └── lor0138-error.log    # stderr do PM2

/var/log/nginx/
├── lor0138-access.log       # Acessos Nginx
└── lor0138-error.log        # Erros Nginx
```

### 2. Log Rotation (Logrotate)

```bash
sudo nano /etc/logrotate.d/lor0138
```

```
# /etc/logrotate.d/lor0138

/var/log/lor0138/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    create 0644 lor0138app lor0138app
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/lor0138-*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    create 0644 www-data www-data
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

### 3. Monitoramento com PM2 Plus (Opcional)

```bash
# Criar conta em https://app.pm2.io

# Instalar
pm2 install pm2-server-monit

# Conectar
pm2 link [secret-key] [public-key] lor0138-production
```

### 4. Script de Monitoramento Simples

```bash
sudo nano /opt/lor0138/scripts/health-check.sh
```

```bash
#!/bin/bash
# /opt/lor0138/scripts/health-check.sh

HEALTH_URL="http://localhost:3000/health"
LOG_FILE="/var/log/lor0138/health-check.log"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -eq 200 ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - OK" >> $LOG_FILE
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - FAIL (HTTP $response)" >> $LOG_FILE

    # Notificar administrador (email, Slack, etc)
    # echo "LOR0138 health check failed!" | mail -s "ALERT" admin@empresa.com

    # Tentar restart
    pm2 restart lor0138
fi
```

```bash
# Dar permissão de execução
sudo chmod +x /opt/lor0138/scripts/health-check.sh

# Adicionar ao crontab (a cada 5 minutos)
crontab -e
```

```cron
*/5 * * * * /opt/lor0138/scripts/health-check.sh
```

---

## 💾 Backup Automático

### 1. Script de Backup

```bash
sudo nano /opt/lor0138/scripts/backup.sh
```

```bash
#!/bin/bash
# /opt/lor0138/scripts/backup.sh

BACKUP_DIR="/opt/lor0138/backups"
SOURCE_DIR="/opt/lor0138/current"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_NAME="lor0138-backup-$TIMESTAMP.tar.gz"
RETENTION_DAYS=7

# Criar backup
cd /opt/lor0138
tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    current/ shared/.env

# Log
echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup criado: $BACKUP_NAME" >> /var/log/lor0138/backup.log

# Remover backups antigos (> 7 dias)
find $BACKUP_DIR -name "lor0138-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "$(date '+%Y-%m-%d %H:%M:%S') - Backups antigos removidos" >> /var/log/lor0138/backup.log
```

```bash
# Dar permissão
sudo chmod +x /opt/lor0138/scripts/backup.sh
sudo chown lor0138app:lor0138app /opt/lor0138/scripts/backup.sh

# Testar
sudo -u lor0138app /opt/lor0138/scripts/backup.sh
```

### 2. Agendar Backup Diário

```bash
# Como usuário lor0138app
crontab -e
```

```cron
# Backup diário às 2h da manhã
0 2 * * * /opt/lor0138/scripts/backup.sh

# Health check a cada 5 minutos
*/5 * * * * /opt/lor0138/scripts/health-check.sh
```

---

## 🚀 Deploy Manual

### 1. Script de Deploy

```bash
sudo nano /opt/lor0138/scripts/deploy.sh
```

```bash
#!/bin/bash
# /opt/lor0138/scripts/deploy.sh

set -e  # Exit on error

REPO_URL="git@github.com:empresa/lor0138.git"
BRANCH="main"
APP_DIR="/opt/lor0138"
RELEASE_DIR="$APP_DIR/releases/$(date +%Y-%m-%d_%H-%M-%S)"
CURRENT_DIR="$APP_DIR/current"
SHARED_DIR="$APP_DIR/shared"

echo "🚀 Iniciando deploy..."

# 1. Criar diretório de release
mkdir -p "$RELEASE_DIR"
cd "$RELEASE_DIR"

# 2. Clonar código
echo "📦 Clonando código..."
git clone -b "$BRANCH" "$REPO_URL" .

# 3. Copiar .env do shared
echo "⚙️  Copiando configurações..."
cp "$SHARED_DIR/.env" .env

# 4. Instalar dependências
echo "📚 Instalando dependências..."
npm ci --production

# 5. Build
echo "🔨 Compilando TypeScript..."
npm run build

# 6. Rodar testes
echo "🧪 Rodando testes..."
npm run test:unit || {
    echo "❌ Testes falharam! Abortando deploy."
    exit 1
}

# 7. Backup do atual
if [ -L "$CURRENT_DIR" ]; then
    echo "💾 Fazendo backup da versão atual..."
    /opt/lor0138/scripts/backup.sh
fi

# 8. Atualizar symlink
echo "🔗 Atualizando symlink..."
ln -snf "$RELEASE_DIR" "$CURRENT_DIR"

# 9. Reiniciar PM2 (zero downtime com reload)
echo "♻️  Reiniciando aplicação..."
pm2 reload ecosystem.config.js --update-env

# 10. Health check
echo "🏥 Verificando saúde..."
sleep 5
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ $response -eq 200 ]; then
    echo "✅ Deploy concluído com sucesso!"

    # Limpar releases antigas (manter últimas 5)
    echo "🧹 Limpando releases antigas..."
    cd "$APP_DIR/releases"
    ls -t | tail -n +6 | xargs -r rm -rf

else
    echo "❌ Health check falhou! Fazendo rollback..."
    /opt/lor0138/scripts/rollback.sh
    exit 1
fi

echo "🎉 Deploy finalizado!"
```

```bash
# Dar permissão
sudo chmod +x /opt/lor0138/scripts/deploy.sh
sudo chown lor0138app:lor0138app /opt/lor0138/scripts/deploy.sh
```

### 2. Executar Deploy Manual

```bash
# Como usuário lor0138app
cd /opt/lor0138
./scripts/deploy.sh
```

---

## ⏮ Rollback

### Script de Rollback

```bash
sudo nano /opt/lor0138/scripts/rollback.sh
```

```bash
#!/bin/bash
# /opt/lor0138/scripts/rollback.sh

set -e

APP_DIR="/opt/lor0138"
RELEASES_DIR="$APP_DIR/releases"
CURRENT_DIR="$APP_DIR/current"

echo "🔙 Iniciando rollback..."

# Pegar penúltima release
PREVIOUS_RELEASE=$(ls -t "$RELEASES_DIR" | sed -n '2p')

if [ -z "$PREVIOUS_RELEASE" ]; then
    echo "❌ Nenhuma release anterior encontrada!"
    exit 1
fi

PREVIOUS_PATH="$RELEASES_DIR/$PREVIOUS_RELEASE"

echo "📂 Versão anterior: $PREVIOUS_RELEASE"

# Atualizar symlink
ln -snf "$PREVIOUS_PATH" "$CURRENT_DIR"

# Reiniciar PM2
pm2 reload ecosystem.config.js --update-env

# Health check
sleep 5
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ $response -eq 200 ]; then
    echo "✅ Rollback concluído com sucesso!"
else
    echo "❌ Rollback falhou! Verificar manualmente."
    exit 1
fi
```

```bash
# Dar permissão
sudo chmod +x /opt/lor0138/scripts/rollback.sh
sudo chown lor0138app:lor0138app /opt/lor0138/scripts/rollback.sh
```

---

## 🔧 Troubleshooting

### Aplicação não inicia

```bash
# Ver logs do PM2
pm2 logs lor0138

# Ver logs da aplicação
tail -f /var/log/lor0138/error-*.log

# Ver processos
pm2 list

# Verificar portas
sudo netstat -tulpn | grep :3000
```

### Nginx 502 Bad Gateway

```bash
# Verificar se app está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/lor0138-error.log

# Testar backend diretamente
curl http://localhost:3000/health

# Reiniciar Nginx
sudo systemctl restart nginx
```

### SSL não funciona

```bash
# Verificar certificados
sudo certbot certificates

# Renovar
sudo certbot renew

# Ver logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Alta utilização de memória

```bash
# Ver uso de memória
pm2 monit

# Reiniciar se > 500MB (já configurado no ecosystem.config.js)
pm2 restart lor0138
```

### Banco de dados não conecta

```bash
# Testar conexão
sqlcmd -S "10.105.0.4\LOREN" -U sysprogress -P 'sysprogress'

# Verificar firewall
sudo ufw status

# Ver logs da aplicação
tail -f /var/log/lor0138/error-*.log | grep -i database
```

---

## 📋 Checklist de Produção

### Antes do Deploy

- [ ] Testes passando (`npm run test:all`)
- [ ] Build funcionando (`npm run build`)
- [ ] Coverage > 75%
- [ ] Lint sem erros (`npm run lint`)
- [ ] .env de produção configurado
- [ ] Backup do banco (se aplicável)

### Configuração Inicial

- [ ] Servidor atualizado
- [ ] Node.js 18+ instalado
- [ ] Usuário lor0138app criado
- [ ] Diretórios criados
- [ ] Firewall configurado
- [ ] Redis instalado
- [ ] PM2 instalado e configurado
- [ ] Nginx instalado
- [ ] SSL configurado

### Pós-Deploy

- [ ] Health check OK (`curl /health`)
- [ ] Logs sendo gravados
- [ ] PM2 startup configurado
- [ ] Backup agendado
- [ ] Monitoramento ativo
- [ ] Rollback testado

---

**Última atualização:** 2025-10-06
**Próximo:** CI/CD Pipeline (próximo documento)