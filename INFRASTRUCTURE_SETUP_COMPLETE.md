# GUIA COMPLETO DE INFRAESTRUTURA - DATASUL LOR0138
## Setup de Nova Máquina de Produção do Zero

**Versão:** 1.1.0
**Data:** 2025-10-31
**Autor:** Sistema Claude Code
**Objetivo:** Criar uma nova máquina de produção 100% funcional sem dependências da máquina atual

---

## 📋 ÍNDICE

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
   - 1.1 [Stack Tecnológico Completo](#11-stack-tecnológico-completo)
   - 1.2 [Componentes da Aplicação](#12-componentes-da-aplicação)
   - 1.3 [Bancos de Dados Conectados](#13-bancos-de-dados-conectados)
   - 1.4 [Lista Completa de Softwares Necessários](#14-lista-completa-de-softwares-necessários)
2. [Pré-requisitos do Sistema](#2-pré-requisitos-do-sistema)
3. [Software Base](#3-software-base)
4. [Configuração ODBC/Progress](#4-configuração-odbcprogress)
5. [Backend (lordtsapi)](#5-backend-lordtsapi)
6. [Frontend (lor0138)](#6-frontend-lor0138)
7. [Configuração de Rede](#7-configuração-de-rede)
8. [CI/CD Setup](#8-cicd-setup)
9. [Monitoramento](#9-monitoramento)
   - 9.1 [Logs](#91-logs)
   - 9.2 [Health Checks](#92-health-checks)
   - 9.3 [Elasticsearch](#93-elasticsearch)
   - 9.4 [Kibana](#94-kibana)
   - 9.5 [Prometheus](#95-prometheus)
   - 9.6 [Grafana](#96-grafana)
   - 9.7 [Integração Completa](#97-integração-completa)
10. [Apache Airflow - Automação e Orquestração](#10-apache-airflow---automação-e-orquestração)
   - 10.1 [Visão Geral](#101-visão-geral)
   - 10.2 [Instalação](#102-instalação)
   - 10.3 [Configuração](#103-configuração)
   - 10.4 [Integração com SQL Server](#104-integração-com-sql-server)
   - 10.5 [DAGs para Web Scraping](#105-dags-para-web-scraping)
   - 10.6 [Monitoramento e Logs](#106-monitoramento-e-logs)
11. [Checklist Final](#11-checklist-final)
12. [Comandos Úteis](#12-comandos-úteis)

---

## 1. VISÃO GERAL DA ARQUITETURA

### 1.1 Stack Tecnológico Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Firewall (UFW) │
                    │  Portas: 80,443 │
                    └────────┬────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
┌───────▼──────────┐                    ┌────────▼─────────┐
│  NGINX (Port 80) │                    │ Backend (3001)   │
│  lor0138 Frontend│◄──────proxy────────┤ lordtsapi        │
│  /opt/aplicacoes │                    │ /opt/aplicacoes  │
│  /frontend       │                    │ /backend         │
└──────────────────┘                    └────────┬─────────┘
                                                 │
                                    ┌────────────┴──────────────┐
                                    │                           │
                         ┌──────────▼──────────┐    ┌──────────▼──────────┐
                         │  Redis (Port 6379)  │    │ SQL Server Linked   │
                         │  localhost          │    │ Server + ODBC       │
                         │  (Cache L2)         │    │ 10.105.0.4\LOREN    │
                         └─────────────────────┘    └──────────┬──────────┘
                                                               │
                              ┌────────────────────────────────┴──────────────────────┐
                              │                                                       │
                   ┌──────────▼────────────┐                           ┌─────────────▼──────────┐
                   │  Datasul (Progress)   │                           │  PCFactory + Corp      │
                   │  28 Conexões ODBC:    │                           │  6 Conexões SQL:       │
                   │  - 18 Datasul (ODBC)  │                           │  - 4 PCFactory         │
                   │  - 4 Informix (ODBC)  │                           │  - 2 Corporativo       │
                   │  - 6 SQL Server       │                           │                        │
                   └───────────────────────┘                           └────────────────────────┘
```

### 1.2 Componentes da Aplicação

| Componente | Tecnologia | Porta | Diretório | Processo |
|------------|------------|-------|-----------|----------|
| **Frontend (lor0138)** | React 19.2.0 + Vite | 80 (nginx) | /opt/aplicacoes/frontend/current/build | nginx |
| **Backend (lordtsapi)** | Node.js 20.x + TypeScript | 3001 | /opt/aplicacoes/backend/current | node (direct) |
| **Cache** | Redis 8.0.3+ | 6379 | - | redis-server |
| **Proxy** | Nginx 1.18.0+ | 80 | /etc/nginx | nginx |
| **Logs** | Winston + Daily Rotate | - | /opt/aplicacoes/*/logs | - |

### 1.3 Bancos de Dados Conectados

#### Datasul (18 conexões ODBC via Progress OpenEdge)

**Production** (Host: 189.126.146.38)
- DtsPrdEmp (40002) - Empresa
- DtsPrdMult (40004) - Múltiplas Empresas
- DtsPrdAdt (40001) - Auditoria
- DtsPrdEsp (40003) - Especial
- DtsPrdEms5 (40006) - EMS5
- DtsPrdFnd (40007) - Foundation

**Test** (Host: 189.126.146.71)
- DtsTstEmp (41002) - Empresa
- DtsTstMult (41004) - Múltiplas Empresas
- DtsTstAdt (41001) - Auditoria
- DtsTstEsp (41003) - Especial
- DtsTstEms5 (41006) - EMS5
- DtsTstFnd (41007) - Foundation

**Homologacao** (Host: 189.126.146.135)
- DtsHmlEmp (42002) - Empresa
- DtsHmlMult (42004) - Múltiplas Empresas
- DtsHmlAdt (42001) - Auditoria
- DtsHmlEsp (42003) - Especial
- DtsHmlEms5 (42006) - EMS5
- DtsHmlFnd (42007) - Foundation

#### Informix (4 conexões ODBC)

- LgxDev (10.1.0.84:3515) - Development
- LgxAtu (10.1.0.84:3516) - Atualização
- LgxNew (10.1.0.84:3517) - New
- LgxPrd (10.105.0.39:5511) - Production

#### SQL Server (6 conexões nativas)

**PCFactory** (T-SRVSQL2022-01\mes)
- PCF4_PRD (sistema production)
- PCF_Integ_PRD (integração production)
- PCF4_DEV (sistema development)
- PCF_Integ_DEV (integração development)

**Corporativo** (T-SRVSQL2022-01\LOREN / T-SRVSQLDEV2022-01\LOREN)
- DATACORP_PRD (production)
- DATACORP_DEV (development)

### 1.4 Lista Completa de Softwares Necessários

**Sistema Operacional:**
- Ubuntu 20.04.6 LTS ou superior
- Linux Kernel 5.4.0+

**Runtime e Linguagens:**
- Node.js 20.x LTS (via NVM ou NodeSource)
- Python 3.8+ (para Apache Airflow e scripts)
- npm 10.x+ (gerenciador de pacotes Node.js)

**Servidor Web e Proxy:**
- Nginx 1.18.0+ (proxy reverso e servidor de arquivos estáticos)

**Banco de Dados e Cache:**
- Redis 8.0.3+ (cache L2 e sessões)
- UnixODBC 2.3.7+ (conectividade ODBC)
- Progress OpenEdge Client 11.7+ (drivers ODBC para Datasul)

**Monitoramento e Observabilidade:**
- Elasticsearch 8.19.5+ (armazenamento e indexação de logs)
- Kibana 8.19.5+ (visualização de logs)
- Prometheus 2.48.0+ (coleta e armazenamento de métricas)
- Grafana 12.2.0+ (dashboards e visualizações)
- Node Exporter 1.6.0+ (métricas do sistema)

**Automação e Orquestração:**
- Apache Airflow 2.8.0+ (orquestração de workflows, web scraping, ETL)
- PostgreSQL 14+ (backend metadata database do Airflow)

**Utilitários e Ferramentas:**
- Git 2.25.1+ (controle de versão)
- curl 7.68.0+ (transferência de dados)
- systemd (gerenciamento de serviços)
- UFW (firewall)
- logrotate (rotação de logs)

**Conectividade SQL Server:**
- Microsoft ODBC Driver 18 for SQL Server
- FreeTDS 1.2+ (driver alternativo para SQL Server)
- mssql-tools18 (utilitários sqlcmd/bcp)

**Bibliotecas de Sistema:**
- libssl-dev, libffi-dev (dependências Python)
- build-essential (compiladores C/C++)
- libpq-dev (bibliotecas PostgreSQL para Airflow)
- libsasl2-dev, libldap2-dev (autenticação LDAP para Airflow)

---

## 2. PRÉ-REQUISITOS DO SISTEMA

### 2.1 Sistema Operacional

**Recomendado:**
- **OS:** Ubuntu 20.04.6 LTS (Focal Fossa) ou superior
- **Kernel:** Linux 5.4.0+ (verificado: 5.4.0-216-generic)
- **Arquitetura:** x86_64

**Hardware Mínimo para 80 Usuários Simultâneos:**
- **RAM:** 16GB mínimo (recomendado: 32GB)
  - Node.js Backend: ~1.5GB
  - Redis Cache: ~1GB
  - Nginx: ~200MB
  - Elasticsearch: 4GB (heap 2GB)
  - Prometheus: 2GB
  - Grafana: 512MB
  - Apache Airflow: 4GB (webserver + scheduler + workers)
  - Sistema Operacional: 2GB
  - Buffer para picos: 4GB
- **CPU:** 8 cores mínimo (recomendado: 12-16 cores)
  - Backend API: 2-3 cores
  - Elasticsearch: 2-3 cores
  - Airflow Workers: 2-4 cores
  - Prometheus/Grafana: 1-2 cores
  - Sistema: 1-2 cores
- **Disco:** 100GB mínimo (recomendado: 200GB+ SSD)
  - Sistema e aplicações: 30GB
  - Logs (Elasticsearch): 50-100GB
  - Métricas (Prometheus): 10-20GB
  - Airflow (DAGs, logs, XComs): 10-20GB
  - Buffer: 20GB
- **Rede:** 1000Mbps+ com acesso aos servidores de banco
  - Latência < 10ms para bancos de dados críticos
  - Largura de banda suficiente para web scraping (Airflow)

### 2.2 Acesso de Rede Necessário

**Portas de Saída (Outbound):**

| Destino | Porta | Protocolo | Finalidade |
|---------|-------|-----------|------------|
| 189.126.146.38 | 40001-40007 | TCP | Datasul Producao (6 databases) |
| 189.126.146.71 | 41001-41007 | TCP | Datasul Teste (6 databases) |
| 189.126.146.135 | 42001-42007 | TCP | Datasul Homologacao (6 databases) |
| 10.1.0.84 | 3515-3517 | TCP | Informix Dev/Atu/New |
| 10.105.0.39 | 5511 | TCP | Informix Production |
| 10.105.0.4 | 1433 | TCP | SQL Server (Linked Server + direto) |
| T-SRVSQL2022-01 | 1433 | TCP | PCFactory + Corporativo PRD |
| T-SRVSQLDEV2022-01 | 1433 | TCP | Corporativo DEV |
| github.com | 443 | HTTPS | GitHub Packages + CI/CD |

**Portas de Entrada (Inbound):**

| Porta | Protocolo | Finalidade |
|-------|-----------|------------|
| 22 | TCP | SSH (administração) |
| 80 | TCP | HTTP (frontend + backend via nginx) |
| 443 | TCP | HTTPS (se SSL configurado) |

### 2.3 Credenciais Necessárias

**Datasul / Informix (ODBC):**
- Usuário: `sysprogress`
- Senha: `sysprogress` (usar aspas simples no .env!)

**PCFactory (SQL Server):**
- Usuário: `sql_ppi`
- Senha: `pcf`

**Corporativo Production (SQL Server):**
- Server: T-SRVSQL2022-01\LOREN
- Usuário: `dcloren`
- Senha: `#dcloren#` (aspas simples obrigatórias!)

**Corporativo Development (SQL Server):**
- Server: T-SRVSQLDEV2022-01\LOREN
- Usuário: `dcloren`
- Senha: `#dclorendev#`

**GitHub:**
- Token de acesso pessoal (PAT) com permissões:
  - `read:packages` (para npm packages privados)
  - `workflow` (para GitHub Actions)

---

## 3. SOFTWARE BASE

### 3.1 Atualizar Sistema

```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
sudo reboot  # Se necessário
```

### 3.2 Instalar Node.js 20.x LTS

**Opção 1: Via NVM (Recomendado)**

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Carregar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Instalar Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verificar
node --version  # Deve ser v20.x.x
npm --version   # Deve ser 10.x.x
```

**Opção 2: Via apt (Alternativa)**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version
npm --version
```

### 3.3 Instalar Dependências do Sistema

```bash
# Git
sudo apt install -y git

# Build tools (para compilar dependências nativas)
sudo apt install -y build-essential python3 make g++

# Ferramentas de rede
sudo apt install -y curl wget net-tools

# Editor de texto (opcional)
sudo apt install -y nano vim
```

### 3.4 Instalar Nginx

```bash
sudo apt install -y nginx

# Habilitar no boot
sudo systemctl enable nginx

# Verificar instalação
nginx -v  # Deve ser 1.18.0+
sudo systemctl status nginx
```

### 3.5 Instalar Redis

```bash
sudo apt install -y redis-server

# Configurar para iniciar no boot
sudo systemctl enable redis-server

# Iniciar serviço
sudo systemctl start redis-server

# Verificar
redis-cli --version  # Deve ser 5.0+
redis-cli ping       # Deve retornar PONG
```

### 3.6 Instalar PM2 (Opcional - se não usar systemd direto)

```bash
# Instalar globalmente
npm install -g pm2

# Verificar
pm2 --version
```

**NOTA:** A configuração atual NÃO usa PM2, roda o node diretamente ou via systemd.

### 3.7 Firewall (UFW)

```bash
# Habilitar firewall
sudo ufw enable

# Permitir SSH (CRÍTICO - fazer antes de enable!)
sudo ufw allow 22/tcp
sudo ufw allow ssh

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir saída para bancos de dados (já permitido por padrão, mas explícito)
sudo ufw allow out 1433/tcp
sudo ufw allow out 40001:42007/tcp
sudo ufw allow out 3515:3517/tcp
sudo ufw allow out 5511/tcp

# Verificar status
sudo ufw status verbose
```

---

## 4. CONFIGURAÇÃO ODBC/PROGRESS

### 4.1 Instalar Driver ODBC Progress

**CRÍTICO:** O driver ODBC Progress deve estar instalado no caminho correto.

```bash
# Verificar se o driver existe
ls -la /usr/dlc/odbc/lib/pgoe27.so

# Se não existir, baixar e instalar Progress ODBC Driver 11.7+
# Contate o administrador do Progress para obter o instalador
# URL de download (exemplo): https://www.progress.com/odbc
```

**Instalação típica do Progress ODBC Driver:**

```bash
# Descompactar o instalador
tar -xzf progress-odbc-driver-11.7.tar.gz
cd progress-odbc-driver-11.7

# Executar instalação
sudo ./install.sh

# Caminho padrão: /usr/dlc
# Driver: /usr/dlc/odbc/lib/pgoe27.so
```

### 4.2 Instalar Driver ODBC Informix

```bash
# Verificar se o driver existe
ls -la /opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so

# Se não existir, baixar Informix Client SDK
# URL: https://www.ibm.com/products/informix/client-sdk

# Instalação típica:
# 1. Baixar instalador
wget https://www.ibm.com/... # URL fornecida pelo IBM

# 2. Executar instalador
sudo dpkg -i informix-client-sdk_*.deb
# ou
sudo ./csdk.linux64.tar

# 3. Verificar instalação
ls -la /opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so
```

### 4.3 Configurar /etc/odbc.ini (28 conexões)

**ATENÇÃO:** Este arquivo configura TODOS os DSNs usados pela aplicação.

```bash
sudo nano /etc/odbc.ini
```

```ini
# ============================================
# /etc/odbc.ini
# Configuração de Todos os DSNs ODBC
# Total: 22 conexões (18 Datasul + 4 Informix)
# ============================================

# ==================== DATASUL PRODUCAO ======================
# Host: 189.126.146.38

[DtsPrdEmp]
Description=Datasul Producao - Empresa (Main Business Data)
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.38
PortNumber=40002
DatabaseName=ems2emp
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsPrdMult]
Description=Datasul Producao - Múltiplas Empresas
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.38
PortNumber=40004
DatabaseName=ems2mult
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsPrdAdt]
Description=Datasul Producao - Auditoria
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.38
PortNumber=40001
DatabaseName=ems2adt
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsPrdEsp]
Description=Datasul Producao - Especial
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.38
PortNumber=40003
DatabaseName=ems2esp
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsPrdEms5]
Description=Datasul Producao - EMS5
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.38
PortNumber=40006
DatabaseName=ems5
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsPrdFnd]
Description=Datasul Producao - Foundation
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.38
PortNumber=40007
DatabaseName=emsfnd
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

# ==================== DATASUL TESTE ===================
# Host: 189.126.146.71

[DtsTstEmp]
Description=Datasul Teste - Empresa
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.71
PortNumber=41002
DatabaseName=ems2emp
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsTstMult]
Description=Datasul Teste - Múltiplas Empresas
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.71
PortNumber=41004
DatabaseName=ems2mult
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsTstAdt]
Description=Datasul Teste - Auditoria
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.71
PortNumber=41001
DatabaseName=ems2adt
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsTstEsp]
Description=Datasul Teste - Especial
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.71
PortNumber=41003
DatabaseName=ems2esp
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsTstEms5]
Description=Datasul Teste - EMS5
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.71
PortNumber=41006
DatabaseName=ems5
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsTstFnd]
Description=Datasul Teste - Foundation
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.71
PortNumber=41007
DatabaseName=emsfnd
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

# ==================== DATASUL HOMOLOGACAO =====================
# Host: 189.126.146.135

[DtsHmlEmp]
Description=Datasul Homologacao - Empresa
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.135
PortNumber=42002
DatabaseName=ems2emp
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsHmlMult]
Description=Datasul Homologacao - Múltiplas Empresas
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.135
PortNumber=42004
DatabaseName=ems2mult
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsHmlAdt]
Description=Datasul Homologacao - Auditoria
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.135
PortNumber=42001
DatabaseName=ems2adt
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsHmlEsp]
Description=Datasul Homologacao - Especial
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.135
PortNumber=42003
DatabaseName=ems2esp
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsHmlEms5]
Description=Datasul Homologacao - EMS5
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.135
PortNumber=42006
DatabaseName=ems5
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

[DtsHmlFnd]
Description=Datasul Homologacao - Foundation
Driver=/usr/dlc/odbc/lib/pgoe27.so
HostName=189.126.146.135
PortNumber=42007
DatabaseName=emsfnd
DefaultSchema=pub
ReadOnly=Yes
UseWideCharacterTypes=Yes

# ==================== INFORMIX ====================

[LgxDev]
Description=Logix Development Environment
Driver=/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so
HostName=10.1.0.84
PortNumber=3515
DatabaseName=logix
ServerName=lgxdev_tcp
Protocol=onsoctcp

[LgxAtu]
Description=Logix Atualização Environment
Driver=/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so
HostName=10.1.0.84
PortNumber=3516
DatabaseName=logix
ServerName=lgxatu_tcp
Protocol=onsoctcp

[LgxNew]
Description=Logix New Environment
Driver=/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so
HostName=10.1.0.84
PortNumber=3517
DatabaseName=logix
ServerName=lgxnew_tcp
Protocol=onsoctcp

[LgxPrd]
Description=Logix Production Environment
Driver=/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so
HostName=10.105.0.39
PortNumber=5511
DatabaseName=logix
ServerName=t_ifxprd_tcp
Protocol=onsoctcp
```

### 4.4 Configurar /etc/odbcinst.ini

```bash
sudo nano /etc/odbcinst.ini
```

```ini
# /etc/odbcinst.ini
# Driver definitions

[Progress ODBC 11.7]
Description=Progress ODBC Driver 11.7
Driver=/usr/dlc/odbc/lib/pgoe27.so
Setup=/usr/dlc/odbc/lib/pgoe27.so
FileUsage=1
UsageCount=1

[Informix ODBC]
Description=Informix ODBC Driver
Driver=/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so
Setup=/opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so
FileUsage=1
UsageCount=1
```

### 4.5 Testar Conexões ODBC

```bash
# Testar conexão Datasul Producao EMP
echo "SELECT COUNT(*) FROM item;" | isql -v DtsPrdEmp sysprogress sysprogress

# Testar conexão Informix Production
echo "SELECT COUNT(*) FROM item;" | isql -v LgxPrd

# Se funcionar, você verá resultados da query
# Se falhar, verificar logs em /var/log/syslog
```

---

## 5. BACKEND (lordtsapi)

### 5.1 Estrutura de Diretórios

```bash
# Criar estrutura
sudo mkdir -p /opt/aplicacoes/backend/current
sudo mkdir -p /opt/aplicacoes/backend/logs

# Dar permissões ao usuário que vai rodar a app
sudo chown -R $USER:$USER /opt/aplicacoes/backend
```

### 5.2 Clonar Repositório Backend

```bash
cd /opt/aplicacoes/backend

# Clonar repositório
git clone https://github.com/acmano/lordtsapiBackend.git temp

# Mover conteúdo para current
mv temp/* temp/.* current/ 2>/dev/null || true
rm -rf temp

cd current
```

### 5.3 Configurar NPM para GitHub Packages

```bash
cd /opt/aplicacoes/backend/current

# Criar .npmrc
cat > .npmrc << 'EOF'
@acmano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
EOF

# Definir GITHUB_TOKEN (substitua YOUR_GITHUB_PAT pelo token real)
export GITHUB_TOKEN=YOUR_GITHUB_PAT

# Ou adicione ao ~/.bashrc
echo "export GITHUB_TOKEN=YOUR_GITHUB_PAT" >> ~/.bashrc
source ~/.bashrc
```

### 5.4 Criar .env de Produção

```bash
cd /opt/aplicacoes/backend/current

cat > .env << 'EOF'
# ============================================
# CONFIGURAÇÃO DE PRODUÇÃO - LordtsAPI Backend
# ============================================

# ==================== SERVIDOR ====================
HOST=0.0.0.0
PORT=3001
NODE_ENV=production
API_PREFIX=/api

# ==================== BANCO DE DADOS ====================

# Tipo de conexão: ODBC (para Datasul/Progress)
DB_CONNECTION_TYPE=odbc

# SQL Server - Credenciais (usado pelo ODBC Linked Server)
DB_SERVER=10.105.0.4\LOREN
DB_PORT=1433
DB_USER=sysprogress
DB_PASSWORD='sysprogress'

# Database vazio = usa default do usuário
DB_DATABASE_EMP=
DB_DATABASE_MULT=

# Timeouts
DB_CONNECTION_TIMEOUT=15000
DB_REQUEST_TIMEOUT=30000

# SQL Server - Segurança
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# ODBC - DSN para Datasul (nomes corretos do /etc/odbc.ini)
ODBC_DSN_EMP=DtsPrdEmp
ODBC_DSN_MULT=DtsPrdMult
ODBC_CONNECTION_TIMEOUT=15000

# Datasul Environment (production, test, Homologacao)
DATASUL_ENVIRONMENT=production

# Informix Environment (production, development, atualização, new)
INFORMIX_ENVIRONMENT=production

# PCFactory Environment (production, development)
PCFACTORY_ENVIRONMENT=production

# Corporativo Environment (production, development)
CORPORATIVO_ENVIRONMENT=production

# Mock Data (sempre false em produção)
USE_MOCK_DATA=false

# ==================== CORS ====================
CORS_ALLOWED_ORIGINS=http://lor0138.lorenzetti.ibe,http://lordtsapi.lorenzetti.ibe

# ==================== TIMEOUTS HTTP ====================
HTTP_REQUEST_TIMEOUT=30s
HTTP_HEAVY_TIMEOUT=60s
HTTP_HEALTH_TIMEOUT=5s

# ==================== CACHE (Redis) ====================
CACHE_ENABLED=true
CACHE_STRATEGY=layered
CACHE_REDIS_URL=redis://localhost:6379
CACHE_DEFAULT_TTL=5m

# ==================== LOGGING ====================
LOG_LEVEL=info

# ==================== CIRCUIT BREAKER ====================
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60000

# ==================== RETRY ====================
DB_RETRY_ENABLED=true
DB_RETRY_MAX_ATTEMPTS=3
DB_RETRY_INITIAL_DELAY=100
DB_RETRY_MAX_DELAY=5000
DB_RETRY_BACKOFF_MULTIPLIER=2
DB_RETRY_JITTER=50

# ==================== ELASTICSEARCH (Opcional) ====================
ELASTICSEARCH_ENABLED=false
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX_PREFIX=lordtsapi-logs
EOF
```

### 5.5 Instalar Dependências

```bash
cd /opt/aplicacoes/backend/current

# Limpar node_modules se existir
rm -rf node_modules package-lock.json

# Instalar dependências com GitHub token
GITHUB_TOKEN=YOUR_GITHUB_PAT npm ci

# Verificar instalação
ls -la node_modules/@acmano/lordtsapi-shared-types
```

### 5.6 Build do Backend

```bash
cd /opt/aplicacoes/backend/current

# Build TypeScript
npm run build

# Verificar se dist/ foi criado
ls -la dist/
ls -la dist/server.js  # Deve existir
```

### 5.7 Criar Serviço Systemd (Recomendado)

**NOTA:** A configuração atual NÃO usa systemd, mas é altamente recomendado para produção.

```bash
sudo nano /etc/systemd/system/lordtsapi.service
```

```ini
[Unit]
Description=LordtsAPI Backend - Node.js REST API
Documentation=https://github.com/acmano/lordtsapiBackend
After=network.target redis-server.service

[Service]
Type=simple
User=mano
WorkingDirectory=/opt/aplicacoes/backend/current
Environment="NODE_ENV=production"
Environment="PATH=/home/mano/.nvm/versions/node/v20.18.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/home/mano/.nvm/versions/node/v20.18.0/bin/node dist/server.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/opt/aplicacoes/backend/logs/app.log
StandardError=append:/opt/aplicacoes/backend/logs/error.log

# Graceful shutdown
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30

# Resource limits
LimitNOFILE=65536
MemoryLimit=1G

[Install]
WantedBy=multi-user.target
```

**Habilitar e iniciar serviço:**

```bash
# Recarregar systemd
sudo systemctl daemon-reload

# Habilitar no boot
sudo systemctl enable lordtsapi

# Iniciar serviço
sudo systemctl start lordtsapi

# Verificar status
sudo systemctl status lordtsapi

# Ver logs
journalctl -u lordtsapi -f
```

### 5.8 Ou Iniciar Diretamente (Método Atual)

Se não quiser usar systemd:

```bash
cd /opt/aplicacoes/backend/current

# Iniciar em background
nohup node dist/server.js > logs/app.log 2>&1 &

# Ou usar screen/tmux
screen -S lordtsapi
node dist/server.js
# Ctrl+A, D para detach
```

### 5.9 Health Check Backend

```bash
# Verificar se está rodando
curl http://localhost:3001/health

# Esperado:
# {
#   "status": "healthy",
#   "timestamp": "...",
#   "database": "connected",
#   "cache": "connected"
# }

# Testar endpoint de API
curl http://localhost:3001/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110
```

---

## 6. FRONTEND (lor0138)

### 6.1 Estrutura de Diretórios

```bash
# Criar estrutura
sudo mkdir -p /opt/aplicacoes/frontend/current

# Dar permissões
sudo chown -R $USER:$USER /opt/aplicacoes/frontend
```

### 6.2 Clonar Repositório Frontend

```bash
cd /opt/aplicacoes/frontend

# Clonar repositório
git clone https://github.com/acmano/lor0138Frontend.git temp

# Mover conteúdo
mv temp/* temp/.* current/ 2>/dev/null || true
rm -rf temp

cd current
```

### 6.3 Criar .env.production

```bash
cd /opt/aplicacoes/frontend/current

cat > .env.production << 'EOF'
# Vite variables - PRODUÇÃO
VITE_API_URL=http://lordtsapi.lorenzetti.ibe:3001
VITE_APP_NAME=LOR0138
VITE_VERSION=3.0.0
VITE_LOG_LEVEL=warn
VITE_LOG_ENABLED=true
EOF
```

### 6.4 Instalar Dependências

```bash
cd /opt/aplicacoes/frontend/current

# Configurar NPM para GitHub Packages
cat > .npmrc << 'EOF'
@acmano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
legacy-peer-deps=true
EOF

# Instalar com GitHub token
GITHUB_TOKEN=YOUR_GITHUB_PAT npm ci --legacy-peer-deps
```

### 6.5 Build do Frontend

```bash
cd /opt/aplicacoes/frontend/current

# Build de produção com Vite
npm run build

# Verificar se build/ foi criado
ls -la build/
ls -la build/index.html  # Deve existir
```

### 6.6 Configurar Nginx para Frontend

```bash
sudo nano /etc/nginx/sites-available/lor0138-frontend.conf
```

```nginx
# /etc/nginx/sites-available/lor0138-frontend.conf
# Frontend lor0138

server {
    listen 80;
    listen [::]:80;

    server_name lor0138.lorenzetti.ibe;

    # Document root
    root /opt/aplicacoes/frontend/current/build;
    index index.html;

    # Logs
    access_log /var/log/nginx/lor0138-frontend-access.log;
    error_log /var/log/nginx/lor0138-frontend-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # React SPA - fallback para index.html
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Assets com cache longo
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check do backend (proxy reverso)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check direto
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
}
```

### 6.7 Configurar Nginx para Backend API

```bash
sudo nano /etc/nginx/sites-available/lordtsapi.conf
```

```nginx
# /etc/nginx/sites-available/lordtsapi.conf
# Backend lordtsapi

server {
    listen 80;
    listen [::]:80;

    server_name lordtsapi.lorenzetti.ibe;

    # Logs
    access_log /var/log/nginx/lordtsapi-access.log;
    error_log /var/log/nginx/lordtsapi-error.log;

    # Timeout configurations (importante para queries longas)
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    send_timeout 60s;

    # Buffer sizes
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;

    # Proxy para backend Node.js
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;

        # Headers importantes
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Não fazer cache no nginx (a API já tem cache próprio)
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache 1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # Health check direto (sem cache)
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass 1;
        add_header Cache-Control "no-store, no-cache";
    }

    # Metrics endpoint
    location /metrics {
        proxy_pass http://localhost:3001/metrics;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # API docs
    location /api-docs {
        proxy_pass http://localhost:3001/api-docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 6.8 Habilitar Sites Nginx

```bash
# Remover default
sudo rm -f /etc/nginx/sites-enabled/default

# Criar symlinks
sudo ln -sf /etc/nginx/sites-available/lor0138-frontend.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/lordtsapi.conf /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar nginx
sudo systemctl reload nginx
```

### 6.9 Dar Permissões ao Nginx

```bash
# O usuário www-data do nginx precisa ler os arquivos
sudo chown -R www-data:www-data /opt/aplicacoes/frontend/current/build

# Verificar
ls -la /opt/aplicacoes/frontend/current/build/
```

---

## 7. CONFIGURAÇÃO DE REDE

### 7.1 DNS ou /etc/hosts

**Opção 1: DNS Interno (Recomendado)**

Configure no seu servidor DNS interno:

```
lor0138.lorenzetti.ibe      A    <IP_DA_MAQUINA>
lordtsapi.lorenzetti.ibe    A    <IP_DA_MAQUINA>
```

**Opção 2: /etc/hosts (Temporário)**

```bash
sudo nano /etc/hosts
```

Adicione:

```
127.0.0.1   lor0138.lorenzetti.ibe
127.0.0.1   lordtsapi.lorenzetti.ibe
```

### 7.2 Testar Resolução DNS

```bash
# Testar resolução
ping -c 2 lor0138.lorenzetti.ibe
ping -c 2 lordtsapi.lorenzetti.ibe

# Testar HTTP
curl -I http://lor0138.lorenzetti.ibe
curl -I http://lordtsapi.lorenzetti.ibe/health
```

---

## 8. CI/CD SETUP

### 8.1 GitHub Actions Self-Hosted Runner

A aplicação usa GitHub Actions com self-hosted runner.

**Configurar Runner:**

```bash
# Criar diretório para o runner
mkdir -p ~/actions-runner
cd ~/actions-runner

# Baixar runner (versão mais recente)
curl -o actions-runner-linux-x64-2.320.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.320.0/actions-runner-linux-x64-2.320.0.tar.gz

# Extrair
tar xzf actions-runner-linux-x64-2.320.0.tar.gz

# Configurar runner
# Você precisará de um token do GitHub
# Vá em: Settings > Actions > Runners > New self-hosted runner
./config.sh --url https://github.com/acmano/lordtsapiBackend --token YOUR_RUNNER_TOKEN

# Instalar como serviço
sudo ./svc.sh install
sudo ./svc.sh start
```

**Repetir para o repositório frontend:**

```bash
mkdir -p ~/actions-runner-frontend
cd ~/actions-runner-frontend
# ... mesmo processo, mas com token do repositório frontend
```

### 8.2 GitHub Secrets Necessários

Configure no GitHub (Settings > Secrets and variables > Actions):

**Backend (lordtsapiBackend):**
- `GITHUB_TOKEN` - Token de acesso aos pacotes GitHub (automático)

**Frontend (lor0138Frontend):**
- `GITHUB_TOKEN` - Token de acesso aos pacotes GitHub (automático)
- `REACT_APP_API_URL` - http://lordtsapi.lorenzetti.ibe:3001

### 8.3 Processo de Deploy Automático

Quando você fizer push para `main`:

1. GitHub Actions detecta o push
2. Runner self-hosted executa o workflow
3. **Backend:**
   - Faz checkout do código
   - Instala Node.js 20
   - Instala dependências (npm ci)
   - Build TypeScript
   - Cria .env de produção
   - Faz backup da versão anterior
   - Copia arquivos para /opt/aplicacoes/backend/current
   - Reinicia serviço (systemd ou node direto)
   - Health check
4. **Frontend:**
   - Faz checkout do código
   - Instala Node.js 20
   - Cria .env.production
   - Instala dependências (npm ci)
   - Roda testes (npm run test:coverage)
   - Build com Vite
   - Faz backup da versão anterior
   - Copia build/ para /opt/aplicacoes/frontend/current
   - Ajusta permissões (www-data)
   - Recarrega nginx
   - Health check

---

## 9. MONITORAMENTO

### 9.1 Logs

**Localização dos Logs:**

```
Backend:
/opt/aplicacoes/backend/logs/
├── app.log          # Logs da aplicação
├── error.log        # Erros
└── combined.log     # Todos os logs

Frontend:
/var/log/nginx/
├── lor0138-frontend-access.log
├── lor0138-frontend-error.log
├── lordtsapi-access.log
└── lordtsapi-error.log

Systemd (se usado):
journalctl -u lordtsapi -f
```

**Ver Logs:**

```bash
# Backend (últimas 100 linhas)
tail -f -n 100 /opt/aplicacoes/backend/logs/app.log

# Nginx frontend
tail -f /var/log/nginx/lor0138-frontend-access.log

# Nginx backend
tail -f /var/log/nginx/lordtsapi-access.log

# Systemd
sudo journalctl -u lordtsapi -f --lines=50
```

### 9.2 Health Checks

**Endpoints Disponíveis:**

```bash
# Backend health (todas as 28 conexões)
curl http://localhost:3001/health

# Health específico de conexões ODBC + SQL Server
curl http://localhost:3001/health/connections

# Health de conexão específica
curl http://localhost:3001/health/connections/DtsPrdEmp
curl http://localhost:3001/health/connections/PCF4_PRD
curl http://localhost:3001/health/connections/DATACORP_PRD

# Health por ambiente
curl http://localhost:3001/health/connections/environment/production

# Health por sistema
curl http://localhost:3001/health/connections/system/datasul
curl http://localhost:3001/health/connections/system/informix
curl http://localhost:3001/health/connections/system/pcfactory
curl http://localhost:3001/health/connections/system/corporativo

# Métricas Prometheus
curl http://localhost:3001/metrics

# Cache stats
curl http://localhost:3001/cache/stats
```

### 9.3 Elasticsearch

Elasticsearch é usado para armazenar e indexar logs da aplicação, permitindo buscas rápidas e análises avançadas.

**Configuração atual na máquina:**
- **Versão:** Elasticsearch 8.19.5
- **Porta HTTP:** 9200
- **Porta Cluster:** 9300
- **Heap Memory:** 3.9GB (Xms3972m / Xmx3972m)
- **Service:** `elasticsearch.service` (systemd)
- **Configuração:** `/etc/elasticsearch/`
- **Dados:** `/var/lib/elasticsearch/`
- **Logs:** `/var/log/elasticsearch/`

**Índice desta seção:**
- 9.3.1 - Instalação do Elasticsearch 8.x
- 9.3.2 - Configuração (elasticsearch.yml)
- 9.3.3 - Configuração de Heap (JVM)
- 9.3.4 - Iniciar como Serviço Systemd
- 9.3.5 - Verificar Instalação
- 9.3.6 - Criar Índice para Logs
- 9.3.7 - Integração com Winston (Backend)
- 9.3.8 - Comandos Úteis
- 9.3.9 - Gerenciamento de Índices (ILM)
- 9.3.10 - Troubleshooting
- 9.3.11 - Resumo Rápido - Comandos Essenciais

---

#### 9.3.1 Instalação do Elasticsearch 8.x

```bash
# Importar chave GPG do Elasticsearch
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg

# Adicionar repositório
echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-8.x.list

# Atualizar e instalar
sudo apt update
sudo apt install -y elasticsearch

# IMPORTANTE: Salvar a senha do usuário elastic que aparece na instalação!
# Caso não tenha anotado, resetar com:
# sudo /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic
```

#### 9.3.2 Configurar Elasticsearch

```bash
sudo nano /etc/elasticsearch/elasticsearch.yml
```

```yaml
# /etc/elasticsearch/elasticsearch.yml
# Configuração básica do Elasticsearch

# ==================== CLUSTER ====================
cluster.name: lor0138-cluster
node.name: lor0138-node-1

# ==================== PATHS ====================
path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch

# ==================== NETWORK ====================
network.host: localhost
http.port: 9200

# ==================== DISCOVERY ====================
# Nó único (não é cluster)
discovery.type: single-node

# ==================== SECURITY ====================
# OPÇÃO 1: Desabilitar segurança (ambiente interno)
# Usar esta configuração se o Elasticsearch está acessível apenas via localhost
xpack.security.enabled: false
xpack.security.enrollment.enabled: false

xpack.security.http.ssl:
  enabled: false

xpack.security.transport.ssl:
  enabled: false

# OPÇÃO 2: Manter segurança habilitada (recomendado para produção)
# Se você escolher esta opção, comente as linhas acima e descomente abaixo:
# xpack.security.enabled: true
# xpack.security.enrollment.enabled: true
# xpack.security.http.ssl:
#   enabled: true
#   keystore.path: certs/http.p12
# xpack.security.transport.ssl:
#   enabled: true
#   verification_mode: certificate
#   keystore.path: certs/transport.p12
#   truststore.path: certs/transport.p12

# ==================== PERFORMANCE ====================
# Índices para logs
action.auto_create_index: true
```

**NOTA IMPORTANTE sobre Segurança:**

Elasticsearch 8.x tem security habilitado por padrão. Você tem duas opções:

1. **Desabilitar security** (ambiente interno/desenvolvimento):
   - Use a configuração acima com `xpack.security.enabled: false`
   - Adequado quando o Elasticsearch só é acessível via localhost
   - Não requer autenticação

2. **Manter security habilitada** (produção):
   - Mantenha `xpack.security.enabled: true`
   - Durante a instalação, o Elasticsearch gera uma senha para o usuário `elastic`
   - Salve esta senha! Se perdeu, resete com:
     ```bash
     sudo /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic
     ```
   - Configure a aplicação com credenciais:
     ```ini
     ELASTICSEARCH_NODE=http://elastic:SUA_SENHA@localhost:9200
     ```

#### 9.3.3 Configurar Heap do Elasticsearch

```bash
sudo nano /etc/elasticsearch/jvm.options.d/heap.options
```

```ini
# /etc/elasticsearch/jvm.options.d/heap.options
# Heap size para Elasticsearch
# Regra: 50% da RAM disponível, máximo 32GB

# Para máquina com 8GB RAM (configuração atual):
-Xms3972m
-Xmx3972m

# Alternativamente, valores arredondados:
# -Xms4g
# -Xmx4g

# Para máquina com 16GB RAM:
# -Xms8g
# -Xmx8g
```

**IMPORTANTE:**
- Ajuste o heap conforme a RAM disponível. A regra é usar ~50% da RAM, mas nunca mais que 32GB.
- Os valores Xms e Xmx devem ser SEMPRE iguais para evitar pausas no GC
- Elasticsearch 8.x usa G1GC por padrão (otimizado para heaps grandes)
- Deixe pelo menos 50% da RAM livre para cache do sistema operacional (page cache)

#### 9.3.4 Iniciar Elasticsearch (Systemd Service)

O Elasticsearch roda como um serviço systemd (`elasticsearch.service`).

```bash
# Habilitar no boot
sudo systemctl enable elasticsearch

# Iniciar serviço
sudo systemctl start elasticsearch

# Verificar status
sudo systemctl status elasticsearch

# Ver logs durante inicialização
sudo journalctl -u elasticsearch -f

# Outros comandos úteis
sudo systemctl stop elasticsearch     # Parar serviço
sudo systemctl restart elasticsearch  # Reiniciar serviço
sudo systemctl is-enabled elasticsearch # Verificar se inicia no boot
```

**Service unit location:** `/lib/systemd/system/elasticsearch.service`

O serviço está configurado para:
- Iniciar automaticamente no boot
- Reiniciar automaticamente em caso de falha
- Limites de recursos (LimitNOFILE, LimitNPROC, LimitMEMLOCK)

#### 9.3.5 Verificar Instalação

```bash
# Aguardar Elasticsearch iniciar (pode levar 30-60 segundos)
sleep 30

# Verificar se está rodando
curl http://localhost:9200

# Esperado:
# {
#   "name" : "lor0138-node-1",
#   "cluster_name" : "lor0138-cluster",
#   "version" : {
#     "number" : "8.19.5",
#     ...
#   }
# }

# Verificar health do cluster
curl http://localhost:9200/_cluster/health?pretty

# Esperado: "status" : "green" (ou "yellow" para single-node)

# Ver informações dos nodes
curl http://localhost:9200/_cat/nodes?v

# Verificar portas abertas
sudo netstat -tulpn | grep -E '(9200|9300)'
# Esperado:
# tcp6  0  0 :::9200  :::*  LISTEN  <pid>/java  (HTTP API)
# tcp6  0  0 :::9300  :::*  LISTEN  <pid>/java  (cluster communication)

# Ver uso de memória do Elasticsearch
ps aux | grep elasticsearch
# Verificar se -Xms3972m e -Xmx3972m estão configurados

# Testar indexação
curl -X POST "localhost:9200/test-index/_doc" -H 'Content-Type: application/json' -d'
{
  "message": "Test document",
  "timestamp": "2025-10-30T12:00:00Z"
}
'

# Buscar documento criado
curl http://localhost:9200/test-index/_search?pretty

# Remover índice de teste
curl -X DELETE "localhost:9200/test-index"
```

#### 9.3.6 Criar Índice para Logs da Aplicação

```bash
# Criar template para índices de logs
curl -X PUT "localhost:9200/_index_template/lordtsapi-logs-template" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["lordtsapi-logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "index.lifecycle.name": "lordtsapi-logs-policy",
      "index.lifecycle.rollover_alias": "lordtsapi-logs"
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "level": { "type": "keyword" },
        "message": { "type": "text" },
        "correlationId": { "type": "keyword" },
        "userId": { "type": "keyword" },
        "method": { "type": "keyword" },
        "url": { "type": "text" },
        "statusCode": { "type": "integer" },
        "responseTime": { "type": "float" },
        "error": {
          "properties": {
            "message": { "type": "text" },
            "stack": { "type": "text" }
          }
        }
      }
    }
  }
}
'

# Criar índice inicial
curl -X PUT "localhost:9200/lordtsapi-logs-000001" -H 'Content-Type: application/json' -d'
{
  "aliases": {
    "lordtsapi-logs": {
      "is_write_index": true
    }
  }
}
'
```

#### 9.3.7 Integração com Winston (Backend)

A aplicação já está configurada para enviar logs ao Elasticsearch se `ELASTICSEARCH_ENABLED=true` no `.env`:

```bash
# Editar .env do backend
cd /opt/aplicacoes/backend/current
nano .env
```

Adicionar/modificar:

```ini
# Elasticsearch (para logs centralizados)
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX_PREFIX=lordtsapi-logs
ELASTICSEARCH_LOG_LEVEL=info
```

Reiniciar backend:

```bash
sudo systemctl restart lordtsapi
# ou
pkill -f "node.*server.js" && nohup node dist/server.js > logs/app.log 2>&1 &
```

#### 9.3.8 Comandos Úteis do Elasticsearch

```bash
# Ver todos os índices
curl http://localhost:9200/_cat/indices?v

# Ver documentos em um índice
curl http://localhost:9200/lordtsapi-logs-000001/_search?pretty

# Buscar logs de erro
curl -X GET "localhost:9200/lordtsapi-logs/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "level": "error"
    }
  },
  "size": 10,
  "sort": [
    { "@timestamp": { "order": "desc" } }
  ]
}
'

# Ver stats do cluster
curl http://localhost:9200/_cluster/stats?pretty

# Deletar índices antigos (cuidado!)
curl -X DELETE "localhost:9200/lordtsapi-logs-2024.01.01"
```

#### 9.3.9 Gerenciamento de Índices (ILM - Index Lifecycle Management)

O ILM permite gerenciar automaticamente o ciclo de vida dos índices: rotação, retenção e exclusão de dados antigos.

**9.3.9.1 Criar ILM Policy para Logs**

```bash
# Criar policy para manter logs por 30 dias
curl -X PUT "localhost:9200/_ilm/policy/lordtsapi-logs-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_size": "50gb",
            "max_docs": 10000000
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "set_priority": {
            "priority": 50
          },
          "forcemerge": {
            "max_num_segments": 1
          },
          "shrink": {
            "number_of_shards": 1
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
'
```

**Explicação das fases:**

- **hot**: Índice ativo recebendo writes
  - Rollover diário ou quando atingir 50GB/10M docs
  - Prioridade alta para cache

- **warm**: Após 7 dias
  - Otimiza índice (forcemerge)
  - Reduz shards (shrink)
  - Diminui prioridade

- **delete**: Após 30 dias
  - Deleta índice automaticamente

**9.3.9.2 Verificar ILM Policy**

```bash
# Ver todas as policies
curl http://localhost:9200/_ilm/policy?pretty

# Ver policy específica
curl http://localhost:9200/_ilm/policy/lordtsapi-logs-policy?pretty

# Ver status do ILM
curl http://localhost:9200/_ilm/status?pretty
```

**9.3.9.3 Aplicar Policy aos Índices Existentes**

O template criado na seção 9.3.6 já aplica a policy automaticamente aos novos índices. Para índices existentes:

```bash
# Listar índices e suas policies
curl http://localhost:9200/_cat/indices?v

# Aplicar policy a um índice específico
curl -X PUT "localhost:9200/lordtsapi-logs-000001/_settings" -H 'Content-Type: application/json' -d'
{
  "index.lifecycle.name": "lordtsapi-logs-policy"
}
'
```

**9.3.9.4 Monitorar ILM**

```bash
# Ver explicação do ILM para um índice
curl http://localhost:9200/lordtsapi-logs-000001/_ilm/explain?pretty

# Ver todos os índices e suas fases ILM
curl http://localhost:9200/*/_ilm/explain?pretty | jq '.indices[] | {index: .index, phase: .phase, action: .action}'
```

**9.3.9.5 Ajustar Retenção**

Para manter logs por mais ou menos tempo, edite a policy:

```bash
# Manter por 90 dias (em vez de 30)
curl -X PUT "localhost:9200/_ilm/policy/lordtsapi-logs-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_size": "50gb"
          }
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
'
```

**IMPORTANTE:**
- Mudanças na policy afetam apenas novos índices
- Índices existentes continuam com a policy que tinham quando foram criados
- Para forçar uma fase: `curl -X POST "localhost:9200/index-name/_ilm/move/warm"`

#### 9.3.10 Troubleshooting Elasticsearch

```bash
# Elasticsearch não inicia
sudo journalctl -u elasticsearch -n 100 --no-pager

# Verificar memória disponível
free -h

# Verificar espaço em disco
df -h /var/lib/elasticsearch

# Logs de erro
sudo tail -f /var/log/elasticsearch/lor0138-cluster.log

# Reiniciar serviço
sudo systemctl restart elasticsearch

# Verificar portas
sudo netstat -tulpn | grep 9200

# Status do cluster (problemas)
curl http://localhost:9200/_cluster/health?pretty
curl http://localhost:9200/_cat/nodes?v
```

**Problemas Comuns:**

1. **Out of Memory (OOM)**
   - Sintoma: Elasticsearch mata o processo
   - Solução: Reduzir heap ou aumentar RAM do servidor
   - Verificar: `dmesg | grep -i "out of memory"`

2. **Disk Full**
   - Sintoma: Índices em read-only mode
   - Solução: Liberar espaço ou deletar índices antigos
   - Verificar: `df -h /var/lib/elasticsearch`
   - Remover read-only: `curl -X PUT "localhost:9200/_all/_settings" -H 'Content-Type: application/json' -d '{"index.blocks.read_only_allow_delete": null}'`

3. **Too Many Open Files**
   - Sintoma: Erro "too many open files"
   - Solução: Aumentar limite no systemd service ou `/etc/security/limits.conf`

4. **Cluster Yellow Status**
   - Normal para single-node (sem réplicas)
   - Para corrigir: `curl -X PUT "localhost:9200/_settings" -d '{"number_of_replicas": 0}'`

#### 9.3.11 Resumo Rápido - Comandos Essenciais

```bash
# Status geral
curl http://localhost:9200                              # Info básica
curl http://localhost:9200/_cluster/health?pretty      # Health do cluster
curl http://localhost:9200/_cat/nodes?v                # Nodes
curl http://localhost:9200/_cat/indices?v              # Todos os índices

# Gerenciar serviço
sudo systemctl status elasticsearch                     # Status
sudo systemctl restart elasticsearch                    # Restart
sudo journalctl -u elasticsearch -f                     # Logs em tempo real

# Buscar logs da aplicação
curl "http://localhost:9200/lordtsapi-logs/_search?pretty&size=10&sort=@timestamp:desc"

# Ver erros recentes
curl -X GET "localhost:9200/lordtsapi-logs/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {"match": {"level": "error"}},
  "size": 5,
  "sort": [{"@timestamp": {"order": "desc"}}]
}
'

# Monitorar ILM
curl http://localhost:9200/_ilm/policy/lordtsapi-logs-policy?pretty
curl "http://localhost:9200/*/_ilm/explain?pretty"

# Limpeza
curl -X DELETE "localhost:9200/lordtsapi-logs-2024.01.01"  # Deletar índice específico
```

---

### 9.4 Kibana

Kibana fornece uma interface visual para explorar, visualizar e analisar os logs armazenados no Elasticsearch.

**NOTA:** Kibana não está instalado na máquina atual, mas é altamente recomendado para visualização de logs.

#### 9.4.1 Instalação do Kibana 8.x

```bash
# O repositório já foi configurado na instalação do Elasticsearch
# Instalar Kibana (mesma versão do Elasticsearch)
sudo apt install -y kibana
```

#### 9.4.2 Configurar Kibana

```bash
sudo nano /etc/kibana/kibana.yml
```

```yaml
# /etc/kibana/kibana.yml
# Configuração do Kibana

# ==================== SERVIDOR ====================
server.port: 5601
server.host: "localhost"
server.name: "lor0138-kibana"

# ==================== ELASTICSEARCH ====================
elasticsearch.hosts: ["http://localhost:9200"]

# Se Elasticsearch tiver autenticação habilitada:
# elasticsearch.username: "kibana_system"
# elasticsearch.password: "senha_aqui"

# ==================== LOGGING ====================
logging.appenders.default:
  type: file
  fileName: /var/log/kibana/kibana.log
  layout:
    type: json

logging.root:
  appenders: [default]
  level: info

# ==================== OUTROS ====================
i18n.locale: "pt-BR"
```

#### 9.4.3 Iniciar Kibana

```bash
# Habilitar no boot
sudo systemctl enable kibana

# Iniciar serviço
sudo systemctl start kibana

# Verificar status
sudo systemctl status kibana

# Ver logs (inicialização pode levar 1-2 minutos)
sudo journalctl -u kibana -f
```

#### 9.4.4 Acessar Interface do Kibana

```bash
# Aguardar Kibana iniciar completamente
sleep 60

# Testar acesso
curl http://localhost:5601/api/status

# Abrir no navegador
# http://localhost:5601
```

**Login:** Se a segurança do Elasticsearch estiver habilitada, use as credenciais configuradas. Caso contrário, acesso direto.

#### 9.4.5 Configurar Index Pattern

1. Acesse http://localhost:5601
2. Vá em **Management** > **Stack Management** > **Index Patterns**
3. Clique em **Create index pattern**
4. Digite: `lordtsapi-logs-*`
5. Selecione **@timestamp** como Time field
6. Clique em **Create index pattern**

#### 9.4.6 Explorar Logs no Kibana

**Discover:**
1. Vá em **Discover** no menu lateral
2. Selecione o index pattern `lordtsapi-logs-*`
3. Ajuste o time range (últimas 24h, 7d, etc.)
4. Use a barra de busca para filtrar:
   - `level:error` - Apenas erros
   - `statusCode:500` - HTTP 500
   - `method:GET AND url:*/health*` - Health checks
   - `correlationId:"abc-123"` - Rastrear requisição específica

**Filtros úteis:**
```
level:error
level:error AND NOT url:*/health*
statusCode >= 400
responseTime > 1000
correlationId:*
```

#### 9.4.7 Criar Visualizações Básicas

**Visualização 1: Logs por Nível (Pie Chart)**
1. Vá em **Visualize** > **Create visualization**
2. Escolha **Pie**
3. Selecione index pattern `lordtsapi-logs-*`
4. Metrics: Count
5. Buckets > Split slices: Terms > Field: `level.keyword`
6. Salvar como "Logs por Nível"

**Visualização 2: Timeline de Erros (Line Chart)**
1. Vá em **Visualize** > **Create visualization**
2. Escolha **Line**
3. Selecione index pattern `lordtsapi-logs-*`
4. Metrics: Count
5. Buckets > X-axis: Date Histogram > Field: `@timestamp`
6. Adicionar filtro: `level:error`
7. Salvar como "Timeline de Erros"

**Visualização 3: Top URLs com Erro (Data Table)**
1. Vá em **Visualize** > **Create visualization**
2. Escolha **Data table**
3. Metrics: Count
4. Buckets > Split rows: Terms > Field: `url.keyword` > Size: 10
5. Adicionar filtro: `statusCode >= 400`
6. Salvar como "Top URLs com Erro"

#### 9.4.8 Criar Dashboard

1. Vá em **Dashboard** > **Create dashboard**
2. Clique em **Add** e adicione as visualizações criadas
3. Organize as visualizações no layout
4. Adicione controles de tempo
5. Salvar como "LOR0138 - Monitoring Dashboard"

**Dashboard recomendado deve incluir:**
- Total de requisições (metric)
- Logs por nível (pie chart)
- Timeline de requisições (line chart)
- Timeline de erros (line chart)
- Top URLs com erro (table)
- Response time P95 (metric)
- Últimos erros (data table com detalhes)

#### 9.4.9 Configurar Alertas no Kibana (Opcional)

1. Vá em **Stack Management** > **Rules and Connectors**
2. Clique em **Create rule**
3. Escolha tipo: **Elasticsearch query**
4. Configure:
   - Name: "High Error Rate"
   - Index: `lordtsapi-logs-*`
   - Query: `level:error`
   - Threshold: count > 10 in last 5 minutes
5. Configure action (email, webhook, etc.)
6. Salvar

#### 9.4.10 Troubleshooting Kibana

```bash
# Kibana não inicia
sudo journalctl -u kibana -n 100 --no-pager

# Erro "Kibana server is not ready yet"
# Aguardar 1-2 minutos, inicialização é lenta

# Erro de conexão com Elasticsearch
curl http://localhost:9200
# Elasticsearch deve estar rodando

# Logs de erro do Kibana
sudo tail -f /var/log/kibana/kibana.log

# Reiniciar Kibana
sudo systemctl restart kibana

# Verificar porta
sudo netstat -tulpn | grep 5601

# Limpar cache do Kibana (se interface não carrega)
sudo rm -rf /var/lib/kibana/optimize
sudo systemctl restart kibana
```

---

### 9.5 Prometheus

Prometheus é usado para coletar, armazenar e consultar métricas de time-series da aplicação, como latência, throughput, erros, uso de recursos, etc.

**STATUS:** Prometheus 2.48.0 já está instalado e rodando na porta 9090.

#### 9.5.1 Instalação do Prometheus (se não estiver instalado)

```bash
# Baixar Prometheus (versão 2.48 ou superior)
cd /tmp
wget https://github.com/prometheus/prometheus/releases/download/v2.48.0/prometheus-2.48.0.linux-amd64.tar.gz

# Extrair
tar -xzf prometheus-2.48.0.linux-amd64.tar.gz

# Criar usuário prometheus
sudo useradd --no-create-home --shell /bin/false prometheus

# Criar diretórios
sudo mkdir -p /etc/prometheus
sudo mkdir -p /var/lib/prometheus
sudo mkdir -p /etc/prometheus/alerts

# Mover binários
sudo cp prometheus-2.48.0.linux-amd64/prometheus /usr/local/bin/
sudo cp prometheus-2.48.0.linux-amd64/promtool /usr/local/bin/

# Mover arquivos de configuração
sudo cp -r prometheus-2.48.0.linux-amd64/consoles /etc/prometheus/
sudo cp -r prometheus-2.48.0.linux-amd64/console_libraries /etc/prometheus/

# Dar permissões
sudo chown -R prometheus:prometheus /etc/prometheus
sudo chown -R prometheus:prometheus /var/lib/prometheus
sudo chown prometheus:prometheus /usr/local/bin/prometheus
sudo chown prometheus:prometheus /usr/local/bin/promtool

# Limpar
rm -rf prometheus-2.48.0.linux-amd64*
```

#### 9.5.2 Configurar Prometheus

```bash
sudo nano /etc/prometheus/prometheus.yml
```

```yaml
# /etc/prometheus/prometheus.yml
# Configuração do Prometheus para LOR0138

global:
  scrape_interval: 15s       # Coleta métricas a cada 15 segundos
  evaluation_interval: 15s   # Avalia regras a cada 15 segundos

  # Labels externos adicionados a todas as métricas
  external_labels:
    monitor: 'lor0138-monitor'
    environment: 'production'

# Arquivos de regras de alertas
rule_files:
  - "alerts/*.yml"

# Configuração de scraping
scrape_configs:
  # Job para o Prometheus (auto-monitoramento)
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Job para a aplicação lor0138
  - job_name: 'lor0138-api'
    scrape_interval: 10s     # Coleta mais frequente para API
    scrape_timeout: 5s
    metrics_path: '/metrics' # Endpoint de métricas
    static_configs:
      - targets: ['localhost:3001']  # CORRIGIDO: Porta 3001!
        labels:
          service: 'lor0138-api'
          component: 'backend'
          application: 'lordtsapi'

  # Job para Redis (se tiver redis_exporter instalado)
  # - job_name: 'redis'
  #   static_configs:
  #     - targets: ['localhost:9121']

  # Job para Node Exporter (métricas do sistema, se instalado)
  # - job_name: 'node'
  #   static_configs:
  #     - targets: ['localhost:9100']
```

**IMPORTANTE:** Note que a porta foi corrigida para **3001** (não 3000 como estava no arquivo original).

#### 9.5.3 Criar Regras de Alerta

```bash
sudo nano /etc/prometheus/alerts/lordtsapi-alerts.yml
```

```yaml
# /etc/prometheus/alerts/lordtsapi-alerts.yml
# Regras de alertas para o sistema lor0138

groups:
  # ==================== HTTP/API ALERTS ====================
  - name: lor0138_http_alerts
    interval: 30s
    rules:
      # Alta taxa de erros 5xx
      - alert: HighHTTPErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status_code=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: critical
          component: api
          team: backend
        annotations:
          summary: "Taxa de erro HTTP acima de 5%"
          description: "{{ $value | humanizePercentage }} das requisições estão retornando erro 5xx no serviço {{ $labels.service }}"
          runbook: "https://wiki.company.com/runbooks/high-error-rate"

      # Tempo de resposta alto (P95)
      - alert: HighResponseTimeP95
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
          ) > 2
        for: 5m
        labels:
          severity: warning
          component: api
        annotations:
          summary: "Tempo de resposta P95 acima de 2 segundos"
          description: "P95 do tempo de resposta em {{ $labels.service }}: {{ $value | humanizeDuration }}"

      # Tempo de resposta alto (P99) - Crítico
      - alert: HighResponseTimeP99
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
          ) > 5
        for: 3m
        labels:
          severity: critical
          component: api
        annotations:
          summary: "Tempo de resposta P99 acima de 5 segundos"
          description: "P99 do tempo de resposta em {{ $labels.service }}: {{ $value | humanizeDuration }}"

      # Taxa de requisições muito baixa (possível problema)
      - alert: LowRequestRate
        expr: |
          sum(rate(http_requests_total[5m])) < 0.1
        for: 10m
        labels:
          severity: warning
          component: api
        annotations:
          summary: "Taxa de requisições muito baixa"
          description: "Apenas {{ $value | humanize }} req/s - possível problema na API ou no cliente"

  # ==================== DATABASE ALERTS ====================
  - name: lor0138_database_alerts
    interval: 30s
    rules:
      # Queries lentas
      - alert: SlowDatabaseQueries
        expr: |
          histogram_quantile(0.95,
            sum(rate(db_query_duration_seconds_bucket[5m])) by (le, database, connection_type)
          ) > 1
        for: 5m
        labels:
          severity: warning
          component: database
        annotations:
          summary: "Queries lentas no database {{ $labels.database }}"
          description: "P95 da duração no {{ $labels.connection_type }}: {{ $value | humanizeDuration }}"

      # Alta taxa de erros em queries
      - alert: HighDatabaseErrorRate
        expr: |
          sum(rate(db_query_errors_total[5m])) by (database, connection_type) > 1
        for: 3m
        labels:
          severity: critical
          component: database
        annotations:
          summary: "Alta taxa de erros no {{ $labels.database }}"
          description: "{{ $value | humanize }} erros/segundo em queries {{ $labels.connection_type }}"

      # Queries ODBC muito lentas (ODBC é geralmente mais lento)
      - alert: VerySlowODBCQueries
        expr: |
          histogram_quantile(0.95,
            sum(rate(db_query_duration_seconds_bucket{connection_type="odbc"}[5m])) by (le, database)
          ) > 3
        for: 5m
        labels:
          severity: warning
          component: database
        annotations:
          summary: "Queries ODBC muito lentas no {{ $labels.database }}"
          description: "P95 da duração: {{ $value | humanizeDuration }}"

      # Connection pool esgotado
      - alert: DatabaseConnectionPoolExhausted
        expr: |
          db_connections_active / db_connections_max > 0.9
        for: 5m
        labels:
          severity: critical
          component: database
        annotations:
          summary: "Connection pool quase esgotado em {{ $labels.database }}"
          description: "{{ $value | humanizePercentage }} do pool em uso"

      # Database sem conexões ativas (possível problema)
      - alert: DatabaseNoActiveConnections
        expr: |
          db_connections_active == 0
        for: 2m
        labels:
          severity: warning
          component: database
        annotations:
          summary: "Database {{ $labels.database }} sem conexões ativas"
          description: "Sistema pode estar usando MOCK data ou há problema de conectividade"

  # ==================== CACHE ALERTS ====================
  - name: lor0138_cache_alerts
    interval: 30s
    rules:
      # Hit rate baixo
      - alert: LowCacheHitRate
        expr: |
          (
            sum(rate(cache_hits_total[5m]))
            /
            (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))
          ) < 0.5
        for: 10m
        labels:
          severity: warning
          component: cache
        annotations:
          summary: "Taxa de hit do cache abaixo de 50%"
          description: "Hit rate: {{ $value | humanizePercentage }} - considerar ajustar TTL ou estratégia"

      # Cache memory alto
      - alert: HighCacheMemoryUsage
        expr: |
          cache_memory_used_bytes / cache_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning
          component: cache
        annotations:
          summary: "Uso de memória do cache acima de 90%"
          description: "{{ $value | humanizePercentage }} da memória do cache em uso"

      # Redis down
      - alert: RedisDown
        expr: |
          redis_up == 0
        for: 1m
        labels:
          severity: critical
          component: cache
        annotations:
          summary: "Redis está down"
          description: "Sistema funcionará com cache em memória apenas"

  # ==================== SYSTEM ALERTS ====================
  - name: lor0138_system_alerts
    interval: 30s
    rules:
      # Alto uso de memória Node.js
      - alert: HighNodeJSMemoryUsage
        expr: |
          (
            nodejs_heap_size_used_bytes
            /
            nodejs_heap_size_total_bytes
          ) > 0.90
        for: 5m
        labels:
          severity: warning
          component: system
        annotations:
          summary: "Uso de memória Node.js acima de 90%"
          description: "Heap usado: {{ $value | humanizePercentage }}"

      # Event loop bloqueado
      - alert: EventLoopLag
        expr: |
          nodejs_eventloop_lag_seconds > 0.1
        for: 2m
        labels:
          severity: warning
          component: system
        annotations:
          summary: "Event loop com lag alto"
          description: "Lag: {{ $value | humanizeDuration }} - possível processamento síncrono bloqueante"

      # Muitas requisições simultâneas
      - alert: HighConcurrentRequests
        expr: |
          http_requests_in_flight > 50
        for: 5m
        labels:
          severity: warning
          component: system
        annotations:
          summary: "Muitas requisições simultâneas"
          description: "{{ $value }} requisições em andamento - possível sobrecarga"

  # ==================== HEALTH ALERTS ====================
  - name: lor0138_health_alerts
    interval: 15s
    rules:
      # API não saudável
      - alert: APIUnhealthy
        expr: |
          up{job="lor0138-api"} == 0
        for: 1m
        labels:
          severity: critical
          component: health
          team: backend
        annotations:
          summary: "API lor0138 está DOWN"
          description: "Prometheus não consegue fazer scrape - API pode estar offline"
          action: "Verificar logs do backend e reiniciar se necessário"

      # Health check falhando
      - alert: HealthCheckFailing
        expr: |
          health_check_status{component="overall"} == 0
        for: 1m
        labels:
          severity: critical
          component: health
        annotations:
          summary: "Health check geral falhando"
          description: "Sistema reporta unhealthy - verificar health endpoint"

      # Database health check falhando
      - alert: DatabaseHealthCheckFailing
        expr: |
          health_check_status{component="database"} == 0
        for: 1m
        labels:
          severity: critical
          component: health
        annotations:
          summary: "Database health check falhando"
          description: "Uma ou mais conexões de banco estão falhando"
```

**Validar sintaxe:**

```bash
sudo promtool check config /etc/prometheus/prometheus.yml
sudo promtool check rules /etc/prometheus/alerts/lordtsapi-alerts.yml
```

#### 9.5.4 Criar Serviço Systemd para Prometheus

```bash
sudo nano /etc/systemd/system/prometheus.service
```

```ini
# /etc/systemd/system/prometheus.service
# Serviço systemd para Prometheus

[Unit]
Description=Prometheus Monitoring System
Documentation=https://prometheus.io/docs/introduction/overview/
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=prometheus
Group=prometheus
ExecReload=/bin/kill -HUP $MAINPID
ExecStart=/usr/local/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/var/lib/prometheus/ \
  --storage.tsdb.retention.time=30d \
  --storage.tsdb.retention.size=10GB \
  --web.console.templates=/etc/prometheus/consoles \
  --web.console.libraries=/etc/prometheus/console_libraries \
  --web.listen-address=0.0.0.0:9090 \
  --web.enable-lifecycle \
  --log.level=info

# Security
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true

# Restart policy
Restart=on-failure
RestartSec=5s

# Resource limits
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

**Configuração de retenção:**
- `--storage.tsdb.retention.time=30d` - Mantém dados por 30 dias
- `--storage.tsdb.retention.size=10GB` - Limita armazenamento a 10GB

Ajuste conforme necessário.

#### 9.5.5 Iniciar Prometheus

```bash
# Recarregar systemd
sudo systemctl daemon-reload

# Habilitar no boot
sudo systemctl enable prometheus

# Iniciar serviço
sudo systemctl start prometheus

# Verificar status
sudo systemctl status prometheus

# Ver logs
sudo journalctl -u prometheus -f
```

#### 9.5.6 Acessar Interface do Prometheus

```bash
# Aguardar Prometheus iniciar
sleep 5

# Testar acesso
curl http://localhost:9090/-/healthy

# Abrir no navegador
# http://localhost:9090
```

**Páginas importantes:**
- http://localhost:9090/graph - Consultas e gráficos
- http://localhost:9090/targets - Status dos targets (deve mostrar lor0138-api UP)
- http://localhost:9090/alerts - Alertas configurados
- http://localhost:9090/config - Configuração carregada
- http://localhost:9090/flags - Flags do Prometheus

#### 9.5.7 Queries PromQL Úteis

```promql
# Taxa de requisições por segundo
rate(http_requests_total[5m])

# Taxa de requisições por status code
sum by (status_code) (rate(http_requests_total[5m]))

# P95 de latência
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# P99 de latência
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Taxa de erros 5xx
sum(rate(http_requests_total{status_code=~"5.."}[5m]))

# Taxa de erros por endpoint
sum by (endpoint) (rate(http_requests_total{status_code=~"5.."}[5m]))

# Conexões de banco ativas
db_connections_active

# Taxa de hit do cache
(
  sum(rate(cache_hits_total[5m]))
  /
  (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))
) * 100

# Uso de memória Node.js (%)
(nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) * 100

# Event loop lag
nodejs_eventloop_lag_seconds

# Top 5 endpoints mais lentos
topk(5,
  histogram_quantile(0.95,
    sum(rate(http_request_duration_seconds_bucket[5m])) by (le, endpoint)
  )
)

# Taxa de erro por database
sum by (database) (rate(db_query_errors_total[5m]))

# Duração de queries por database (P95)
histogram_quantile(0.95,
  sum(rate(db_query_duration_seconds_bucket[5m])) by (le, database)
)
```

#### 9.5.8 Troubleshooting Prometheus

```bash
# Prometheus não inicia
sudo journalctl -u prometheus -n 100 --no-pager

# Validar configuração
sudo promtool check config /etc/prometheus/prometheus.yml

# Validar regras de alerta
sudo promtool check rules /etc/prometheus/alerts/*.yml

# Ver targets que não estão UP
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up")'

# Recarregar configuração sem reiniciar (hot reload)
curl -X POST http://localhost:9090/-/reload

# Verificar uso de disco
du -sh /var/lib/prometheus/

# Limpar dados antigos manualmente (cuidado!)
sudo systemctl stop prometheus
sudo rm -rf /var/lib/prometheus/data/
sudo systemctl start prometheus

# Ver métricas do próprio Prometheus
curl http://localhost:9090/metrics

# Verificar portas
sudo netstat -tulpn | grep 9090
```

---

### 9.6 Grafana

Grafana fornece dashboards interativos e visualizações avançadas das métricas coletadas pelo Prometheus.

**STATUS:** Grafana 12.2.0 já está instalado e rodando na porta 3000.

#### 9.6.1 Instalação do Grafana (se não estiver instalado)

```bash
# Adicionar repositório do Grafana
sudo apt install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"

# Adicionar chave GPG
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -

# Atualizar e instalar
sudo apt update
sudo apt install -y grafana

# Ou instalar via .deb (versão específica)
wget https://dl.grafana.com/oss/release/grafana_12.2.0_amd64.deb
sudo dpkg -i grafana_12.2.0_amd64.deb
```

#### 9.6.2 Configurar Grafana

```bash
sudo nano /etc/grafana/grafana.ini
```

```ini
# /etc/grafana/grafana.ini
# Configuração principal do Grafana

# ==================== SERVER ====================
[server]
protocol = http
http_addr = 0.0.0.0
http_port = 3000
domain = localhost
root_url = %(protocol)s://%(domain)s:%(http_port)s/
serve_from_sub_path = false

# ==================== DATABASE ====================
[database]
# SQLite (padrão, suficiente para uso local)
type = sqlite3
path = /var/lib/grafana/grafana.db

# PostgreSQL (para produção com múltiplos usuários):
# type = postgres
# host = localhost:5432
# name = grafana
# user = grafana
# password = senha

# ==================== SECURITY ====================
[security]
admin_user = admin
admin_password = admin
secret_key = SW2YcwTIb9zpOOhoPsMm

# Mudar senha no primeiro login
disable_initial_admin_creation = false

# ==================== AUTH ====================
[auth]
disable_login_form = false
disable_signout_menu = false

[auth.anonymous]
enabled = false

# ==================== LOGGING ====================
[log]
mode = console file
level = info

[log.console]
level = info
format = console

[log.file]
level = info
format = json
log_rotate = true
max_lines = 1000000
max_size_shift = 28
daily_rotate = true
max_days = 7

# ==================== PATHS ====================
[paths]
data = /var/lib/grafana
logs = /var/log/grafana
plugins = /var/lib/grafana/plugins
provisioning = /etc/grafana/provisioning

# ==================== ALERTING ====================
[alerting]
enabled = true
execute_alerts = true

[unified_alerting]
enabled = true

# ==================== OTHER ====================
[dashboards]
default_home_dashboard_path =
```

#### 9.6.3 Criar Serviço Systemd (já deve existir)

```bash
# Verificar se serviço existe
systemctl list-unit-files | grep grafana

# Se não existir, criar:
sudo nano /etc/systemd/system/grafana-server.service
```

```ini
# /etc/systemd/system/grafana-server.service
[Unit]
Description=Grafana instance
Documentation=http://docs.grafana.org
Wants=network-online.target
After=network-online.target

[Service]
Type=notify
User=grafana
Group=grafana
ExecStart=/usr/sbin/grafana-server \
  --config=/etc/grafana/grafana.ini \
  --pidfile=/run/grafana/grafana-server.pid \
  --packaging=deb \
  cfg:default.paths.logs=/var/log/grafana \
  cfg:default.paths.data=/var/lib/grafana \
  cfg:default.paths.plugins=/var/lib/grafana/plugins \
  cfg:default.paths.provisioning=/etc/grafana/provisioning

Restart=on-failure
RestartSec=10s
TimeoutStopSec=20s

[Install]
WantedBy=multi-user.target
```

#### 9.6.4 Iniciar Grafana

```bash
# Recarregar systemd
sudo systemctl daemon-reload

# Habilitar no boot
sudo systemctl enable grafana-server

# Iniciar serviço
sudo systemctl start grafana-server

# Verificar status
sudo systemctl status grafana-server

# Ver logs
sudo journalctl -u grafana-server -f
```

#### 9.6.5 Acessar Interface do Grafana

```bash
# Aguardar Grafana iniciar
sleep 10

# Testar acesso
curl http://localhost:3000/api/health

# Abrir no navegador
# http://localhost:3000
```

**Login padrão:**
- Username: `admin`
- Password: `admin`

O Grafana pedirá para trocar a senha no primeiro login.

#### 9.6.6 Provisioning de Data Sources

Criar datasource do Prometheus via provisioning (automático ao iniciar):

```bash
sudo nano /etc/grafana/provisioning/datasources/prometheus.yml
```

```yaml
# /etc/grafana/provisioning/datasources/prometheus.yml
# Data source Prometheus

apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://localhost:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: "15s"
      queryTimeout: "60s"
      httpMethod: POST
    version: 1
```

**Se tiver Elasticsearch instalado:**

```bash
sudo nano /etc/grafana/provisioning/datasources/elasticsearch.yml
```

```yaml
# /etc/grafana/provisioning/datasources/elasticsearch.yml
# Data source Elasticsearch (para logs)

apiVersion: 1

datasources:
  - name: Elasticsearch-Logs
    type: elasticsearch
    access: proxy
    url: http://localhost:9200
    database: "lordtsapi-logs-*"
    isDefault: false
    editable: true
    jsonData:
      esVersion: "8.0.0"
      timeField: "@timestamp"
      interval: Daily
      logMessageField: message
      logLevelField: level
    version: 1
```

Reiniciar Grafana:

```bash
sudo systemctl restart grafana-server
```

Verificar data sources:

```bash
# Via API
curl -u admin:admin http://localhost:3000/api/datasources

# Ou via interface web:
# http://localhost:3000/connections/datasources
```

#### 9.6.7 Provisioning de Dashboards

Criar configuração de provisioning para dashboards:

```bash
sudo nano /etc/grafana/provisioning/dashboards/dashboards.yml
```

```yaml
# /etc/grafana/provisioning/dashboards/dashboards.yml
# Configuração de provisioning de dashboards

apiVersion: 1

providers:
  - name: 'LOR0138 Dashboards'
    orgId: 1
    folder: 'LOR0138'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /etc/grafana/dashboards
```

Criar diretório para dashboards:

```bash
sudo mkdir -p /etc/grafana/dashboards
sudo chown -R grafana:grafana /etc/grafana/dashboards
```

#### 9.6.8 Dashboard 1: Métricas da API

```bash
sudo nano /etc/grafana/dashboards/api-metrics.json
```

```json
{
  "dashboard": {
    "title": "LOR0138 - API Metrics",
    "tags": ["lor0138", "api", "backend"],
    "timezone": "browser",
    "schemaVersion": 30,
    "version": 1,
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate (req/s)",
        "type": "graph",
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m]))",
            "legendFormat": "Total Requests",
            "refId": "A"
          },
          {
            "expr": "sum by (status_code) (rate(http_requests_total[5m]))",
            "legendFormat": "{{status_code}}",
            "refId": "B"
          }
        ],
        "yaxes": [
          {"format": "reqps", "label": "Requests/sec"},
          {"format": "short"}
        ]
      },
      {
        "id": 2,
        "title": "Response Time (P50, P95, P99)",
        "type": "graph",
        "gridPos": {"x": 12, "y": 0, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P50",
            "refId": "A"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P95",
            "refId": "B"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P99",
            "refId": "C"
          }
        ],
        "yaxes": [
          {"format": "s", "label": "Response Time"},
          {"format": "short"}
        ]
      },
      {
        "id": 3,
        "title": "Error Rate (%)",
        "type": "graph",
        "gridPos": {"x": 0, "y": 8, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "(sum(rate(http_requests_total{status_code=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))) * 100",
            "legendFormat": "5xx Error Rate",
            "refId": "A"
          },
          {
            "expr": "(sum(rate(http_requests_total{status_code=~\"4..\"}[5m])) / sum(rate(http_requests_total[5m]))) * 100",
            "legendFormat": "4xx Error Rate",
            "refId": "B"
          }
        ],
        "yaxes": [
          {"format": "percent", "label": "Error %", "max": 100},
          {"format": "short"}
        ]
      },
      {
        "id": 4,
        "title": "Top 10 Slowest Endpoints (P95)",
        "type": "table",
        "gridPos": {"x": 12, "y": 8, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "topk(10, histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, endpoint)))",
            "format": "table",
            "instant": true,
            "refId": "A"
          }
        ]
      }
    ]
  }
}
```

#### 9.6.9 Dashboard 2: Métricas de Banco de Dados

```bash
sudo nano /etc/grafana/dashboards/database-metrics.json
```

```json
{
  "dashboard": {
    "title": "LOR0138 - Database Metrics",
    "tags": ["lor0138", "database", "odbc", "sqlserver"],
    "timezone": "browser",
    "schemaVersion": 30,
    "version": 1,
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "title": "Active Connections by Database",
        "type": "graph",
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "sum by (database) (db_connections_active)",
            "legendFormat": "{{database}}",
            "refId": "A"
          }
        ],
        "yaxes": [
          {"format": "short", "label": "Connections"},
          {"format": "short"}
        ]
      },
      {
        "id": 2,
        "title": "Query Duration P95 by Database",
        "type": "graph",
        "gridPos": {"x": 12, "y": 0, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(db_query_duration_seconds_bucket[5m])) by (le, database))",
            "legendFormat": "{{database}}",
            "refId": "A"
          }
        ],
        "yaxes": [
          {"format": "s", "label": "Query Time"},
          {"format": "short"}
        ]
      },
      {
        "id": 3,
        "title": "Query Error Rate by Database",
        "type": "graph",
        "gridPos": {"x": 0, "y": 8, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "sum by (database) (rate(db_query_errors_total[5m]))",
            "legendFormat": "{{database}}",
            "refId": "A"
          }
        ],
        "yaxes": [
          {"format": "short", "label": "Errors/sec"},
          {"format": "short"}
        ]
      },
      {
        "id": 4,
        "title": "Connection Pool Usage",
        "type": "gauge",
        "gridPos": {"x": 12, "y": 8, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "(db_connections_active / db_connections_max) * 100",
            "legendFormat": "{{database}}",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"value": 0, "color": "green"},
                {"value": 70, "color": "yellow"},
                {"value": 90, "color": "red"}
              ]
            }
          }
        }
      }
    ]
  }
}
```

#### 9.6.10 Dashboard 3: Métricas de Cache

```bash
sudo nano /etc/grafana/dashboards/cache-metrics.json
```

```json
{
  "dashboard": {
    "title": "LOR0138 - Cache Metrics",
    "tags": ["lor0138", "cache", "redis"],
    "timezone": "browser",
    "schemaVersion": 30,
    "version": 1,
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "title": "Cache Hit Rate",
        "type": "graph",
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "(sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))) * 100",
            "legendFormat": "Hit Rate %",
            "refId": "A"
          }
        ],
        "yaxes": [
          {"format": "percent", "label": "Hit Rate %", "min": 0, "max": 100},
          {"format": "short"}
        ]
      },
      {
        "id": 2,
        "title": "Cache Operations Rate",
        "type": "graph",
        "gridPos": {"x": 12, "y": 0, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "sum(rate(cache_hits_total[5m]))",
            "legendFormat": "Hits/sec",
            "refId": "A"
          },
          {
            "expr": "sum(rate(cache_misses_total[5m]))",
            "legendFormat": "Misses/sec",
            "refId": "B"
          },
          {
            "expr": "sum(rate(cache_sets_total[5m]))",
            "legendFormat": "Sets/sec",
            "refId": "C"
          }
        ]
      },
      {
        "id": 3,
        "title": "Cache Memory Usage",
        "type": "graph",
        "gridPos": {"x": 0, "y": 8, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "cache_memory_used_bytes",
            "legendFormat": "Used",
            "refId": "A"
          },
          {
            "expr": "cache_memory_max_bytes",
            "legendFormat": "Max",
            "refId": "B"
          }
        ],
        "yaxes": [
          {"format": "bytes", "label": "Memory"},
          {"format": "short"}
        ]
      },
      {
        "id": 4,
        "title": "Cache Entries Count",
        "type": "stat",
        "gridPos": {"x": 12, "y": 8, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "cache_entries_count",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "short"
          }
        }
      }
    ]
  }
}
```

#### 9.6.11 Dashboard 4: Métricas de Sistema

```bash
sudo nano /etc/grafana/dashboards/system-metrics.json
```

```json
{
  "dashboard": {
    "title": "LOR0138 - System Metrics",
    "tags": ["lor0138", "system", "nodejs"],
    "timezone": "browser",
    "schemaVersion": 30,
    "version": 1,
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "title": "Node.js Heap Memory Usage",
        "type": "graph",
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "nodejs_heap_size_used_bytes",
            "legendFormat": "Heap Used",
            "refId": "A"
          },
          {
            "expr": "nodejs_heap_size_total_bytes",
            "legendFormat": "Heap Total",
            "refId": "B"
          }
        ],
        "yaxes": [
          {"format": "bytes", "label": "Memory"},
          {"format": "short"}
        ]
      },
      {
        "id": 2,
        "title": "Event Loop Lag",
        "type": "graph",
        "gridPos": {"x": 12, "y": 0, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "nodejs_eventloop_lag_seconds",
            "legendFormat": "Event Loop Lag",
            "refId": "A"
          }
        ],
        "yaxes": [
          {"format": "s", "label": "Lag"},
          {"format": "short"}
        ]
      },
      {
        "id": 3,
        "title": "Concurrent Requests",
        "type": "graph",
        "gridPos": {"x": 0, "y": 8, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "http_requests_in_flight",
            "legendFormat": "In Flight",
            "refId": "A"
          }
        ],
        "yaxes": [
          {"format": "short", "label": "Requests"},
          {"format": "short"}
        ]
      },
      {
        "id": 4,
        "title": "Garbage Collection Stats",
        "type": "graph",
        "gridPos": {"x": 12, "y": 8, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "rate(nodejs_gc_duration_seconds_sum[5m])",
            "legendFormat": "GC Duration",
            "refId": "A"
          }
        ],
        "yaxes": [
          {"format": "s", "label": "GC Time"},
          {"format": "short"}
        ]
      }
    ]
  }
}
```

Ajustar permissões:

```bash
sudo chown -R grafana:grafana /etc/grafana/dashboards/
sudo chmod 644 /etc/grafana/dashboards/*.json
```

Reiniciar Grafana:

```bash
sudo systemctl restart grafana-server
```

#### 9.6.12 Configurar Alertas no Grafana

**Via Provisioning:**

```bash
sudo nano /etc/grafana/provisioning/alerting/alerts.yml
```

```yaml
# /etc/grafana/provisioning/alerting/alerts.yml
# Alertas do Grafana

apiVersion: 1

groups:
  - name: LOR0138 Alerts
    interval: 1m
    rules:
      - uid: api-down
        title: API is Down
        condition: A
        data:
          - refId: A
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: prometheus
            model:
              expr: 'up{job="lor0138-api"} == 0'
              intervalMs: 1000
              maxDataPoints: 43200
        noDataState: NoData
        execErrState: Error
        for: 1m
        annotations:
          description: "lor0138 API is down for more than 1 minute"
          summary: "API Down"
        labels:
          severity: critical
```

**Via Interface Web:**

1. Acesse http://localhost:3000
2. Vá em **Alerting** > **Alert rules**
3. Clique em **New alert rule**
4. Configure:
   - Nome: "High Error Rate"
   - Query: `(sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100 > 5`
   - Condition: WHEN last() IS ABOVE 5
   - For: 5 minutes
5. Configure notification channels
6. Salvar

#### 9.6.13 Instalar Plugins Úteis

```bash
# Plugin de Clock (útil para dashboards)
sudo grafana-cli plugins install grafana-clock-panel

# Plugin de Worldmap
sudo grafana-cli plugins install grafana-worldmap-panel

# Plugin de Pie Chart (se não tiver)
sudo grafana-cli plugins install grafana-piechart-panel

# Reiniciar Grafana
sudo systemctl restart grafana-server

# Verificar plugins instalados
grafana-cli plugins ls
```

#### 9.6.14 Comandos Úteis do Grafana

```bash
# Status do serviço
sudo systemctl status grafana-server

# Ver logs
sudo journalctl -u grafana-server -f
sudo tail -f /var/log/grafana/grafana.log

# Reiniciar Grafana
sudo systemctl restart grafana-server

# Resetar senha do admin
sudo grafana-cli admin reset-admin-password nova_senha

# Verificar versão
grafana-cli --version

# Backup do banco de dados do Grafana
sudo cp /var/lib/grafana/grafana.db /backup/grafana-$(date +%Y%m%d).db

# Verificar porta
sudo netstat -tulpn | grep 3000

# Ver configuração carregada
curl -u admin:admin http://localhost:3000/api/admin/settings | jq .
```

#### 9.6.15 Troubleshooting Grafana

```bash
# Grafana não inicia
sudo journalctl -u grafana-server -n 100 --no-pager

# Erro "Failed to start grafana-server.service"
# Verificar permissões
sudo chown -R grafana:grafana /var/lib/grafana
sudo chown -R grafana:grafana /var/log/grafana

# Data source não conecta
# Verificar se Prometheus está rodando
curl http://localhost:9090/-/healthy

# Dashboard não aparece
# Verificar provisioning
ls -la /etc/grafana/dashboards/
sudo chown -R grafana:grafana /etc/grafana/dashboards/

# Limpar cache do navegador
# Abrir console de desenvolvedor (F12) e fazer hard refresh (Ctrl+Shift+R)

# Interface não carrega
# Verificar logs
sudo tail -f /var/log/grafana/grafana.log

# Porta 3000 já em uso (conflito com backend)
# Mudar porta do Grafana em /etc/grafana/grafana.ini
# [server]
# http_port = 3001

# Reiniciar e verificar
sudo systemctl restart grafana-server
sudo netstat -tulpn | grep grafana
```

---

### 9.7 Integração Completa

Esta seção explica como todos os componentes de monitoramento trabalham juntos.

#### 9.7.1 Arquitetura de Monitoramento

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MONITORAMENTO LOR0138                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   Aplicação Backend  │
│   (Node.js/Express)  │
│   Port: 3001         │
└──────────┬───────────┘
           │
           │ expõe /metrics (Prometheus format)
           │ expõe /health  (HTTP health checks)
           │ grava logs via Winston
           │
           ├─────────────────────────────────┐
           │                                 │
           ▼                                 ▼
┌────────────────────┐           ┌─────────────────────┐
│    PROMETHEUS      │           │   ELASTICSEARCH     │
│    Port: 9090      │           │   Port: 9200/9300   │
│                    │           │                     │
│ • Coleta métricas  │           │ • Armazena logs     │
│   (scrape /metrics)│           │ • Indexa JSON       │
│ • Time-series DB   │           │ • Full-text search  │
│ • Avalia alertas   │           │                     │
│ • Retenção: 30d    │           │ • Índices:          │
│                    │           │   lordtsapi-logs-*  │
└────────┬───────────┘           └──────────┬──────────┘
         │                                  │
         │ query PromQL                     │ query logs
         │                                  │
         ▼                                  ▼
┌─────────────────────────────────────────────────────────┐
│                      GRAFANA                            │
│                      Port: 3000                         │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Dashboard 1 │  │  Dashboard 2 │  │  Dashboard 3 │ │
│  │  API Metrics │  │  DB Metrics  │  │Cache Metrics │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  • Visualiza métricas (Prometheus)                     │
│  • Visualiza logs (Elasticsearch)                      │
│  • Cria alertas                                        │
│  • Envia notificações                                  │
└─────────────────────────────────────────────────────────┘
                             │
                             │ (opcional)
                             ▼
                    ┌────────────────┐
                    │     KIBANA     │
                    │   Port: 5601   │
                    │                │
                    │ • Interface    │
                    │   para logs    │
                    │ • Visualizações│
                    │ • Discover     │
                    └────────────────┘
```

#### 9.7.2 Fluxo de Dados

**1. Métricas (Prometheus):**

```
Backend lordtsapi
  └─► Expõe endpoint /metrics (formato Prometheus)
      ├─► http_requests_total{method="GET",status_code="200"}
      ├─► http_request_duration_seconds{endpoint="/api/item"}
      ├─► db_connections_active{database="DtsPrdEmp"}
      ├─► cache_hits_total
      └─► nodejs_heap_size_used_bytes

           ▼

Prometheus (scrape a cada 10s)
  └─► Armazena time-series
  └─► Avalia regras de alerta
  └─► Disponibiliza para Grafana

           ▼

Grafana
  └─► Query PromQL
  └─► Renderiza gráficos
  └─► Exibe dashboards
  └─► Envia alertas (se configurado)
```

**2. Logs (Elasticsearch):**

```
Backend lordtsapi (Winston)
  └─► Grava logs estruturados em JSON
      ├─► Console: /opt/aplicacoes/backend/logs/app.log
      └─► Elasticsearch transport (se ELASTICSEARCH_ENABLED=true)

           ▼

Elasticsearch
  └─► Recebe logs via HTTP
  └─► Indexa em lordtsapi-logs-*
  └─► Armazena com timestamp, level, message, correlationId, etc.
  └─► Disponibiliza para busca

           ▼

Kibana (ou Grafana)
  └─► Query DSL do Elasticsearch
  └─► Discover logs
  └─► Cria visualizações
  └─► Exibe dashboards de logs
```

**3. Health Checks:**

```
Backend lordtsapi
  └─► Expõe endpoints de saúde
      ├─► GET /health - saúde geral
      ├─► GET /health/connections - todas as 28 conexões
      └─► GET /health/connections/{nome} - conexão específica

           ▼

Prometheus (via blackbox_exporter ou http probe)
  └─► Monitora disponibilidade
  └─► Alerta se down

           ▼

Grafana
  └─► Exibe status em dashboard
  └─► Envia notificações se unhealthy
```

#### 9.7.3 Correlação de Logs e Métricas

**Cenário: Investigar erro HTTP 500**

1. **Grafana Dashboard** mostra spike em taxa de erro 5xx
2. Identificar o timestamp do problema
3. **Prometheus** fornece:
   - Qual endpoint teve erro: `/api/item/dadosCadastrais/informacoesGerais/{codigo}`
   - Quantas vezes ocorreu
   - Latência naquele momento
4. **Elasticsearch/Kibana** fornece:
   - Logs detalhados do erro
   - Stack trace completo
   - CorrelationId da requisição
5. **Buscar por correlationId** para ver toda a jornada da requisição:
   - Query SQL executada
   - Tempo de resposta do banco
   - Cache hit/miss
   - Resposta enviada

**Query Kibana:**
```
correlationId:"abc-123-def-456" AND level:error
```

**Query Prometheus:**
```promql
http_requests_total{
  endpoint="/api/item/dadosCadastrais/informacoesGerais",
  status_code="500"
}
```

#### 9.7.4 Exemplo de Dashboard Completo

**Dashboard Unificado "LOR0138 - Overview":**

```
┌─────────────────────────────────────────────────────────────┐
│ LOR0138 - Production Monitoring Dashboard                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│ │  Requests │ │   Errors  │ │  Latency  │ │ DB Conns  │  │
│ │  1.2k/s   │ │   0.03%   │ │  123ms    │ │  18/28    │  │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │      Request Rate (last 6 hours)                    │   │
│ │  [Gráfico de linha]                                 │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────┐ ┌────────────────────────────┐  │
│ │   Response Time P95   │ │  Database Query Duration   │  │
│ │  [Gráfico de linha]   │ │  [Gráfico por database]    │  │
│ └───────────────────────┘ └────────────────────────────┘  │
│                                                             │
│ ┌────────────────────────────────────────────────────────┐ │
│ │   Recent Errors (from Elasticsearch)                  │ │
│ │  [Tabela com últimos erros, level, timestamp, msg]    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌──────────────────┐ ┌──────────────────┐                 │
│ │   Cache Hit Rate │ │  Memory Usage    │                 │
│ │   [Gauge: 87%]   │ │  [Graph]         │                 │
│ └──────────────────┘ └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

#### 9.7.5 Alertas e Notificações

**Pipeline de Alertas:**

```
1. Prometheus detecta problema
   └─► Regra: HighHTTPErrorRate > 5% por 5min

2. Prometheus marca alerta como FIRING
   └─► Envia para Alertmanager (se configurado)
       ou Grafana (se using Grafana alerts)

3. Grafana recebe alerta
   └─► Consulta logs no Elasticsearch para contexto
   └─► Envia notificação via:
       ├─► Email
       ├─► Slack
       ├─► PagerDuty
       └─► Webhook

4. Operador recebe notificação
   └─► Acessa dashboard para investigar
   └─► Verifica logs no Kibana
   └─► Identifica causa raiz
   └─► Resolve problema

5. Prometheus detecta recuperação
   └─► Marca alerta como RESOLVED
   └─► Grafana envia notificação de resolução
```

**Exemplo de Alerta no Slack:**

```
🔴 [CRITICAL] High HTTP Error Rate
────────────────────────────────
Service: lor0138-api
Error Rate: 8.5% (threshold: 5%)
Duration: 7 minutes
Timestamp: 2025-10-30 14:23:00

📊 Dashboard: http://grafana:3000/d/api-metrics
🔍 Logs: http://kibana:5601/app/discover

Recent errors (from Elasticsearch):
• 14:22:58 - Database connection timeout (DtsPrdEmp)
• 14:23:12 - ODBC query failed (DtsPrdMult)
• 14:23:45 - Circuit breaker opened (datasul)

Actions:
• Check database connectivity
• Review connection pool usage
• Check recent deployments
```

#### 9.7.6 Retenção de Dados

**Prometheus:**
- Métricas: 30 dias (configurável em `--storage.tsdb.retention.time`)
- Tamanho máximo: 10GB (configurável em `--storage.tsdb.retention.size`)
- Armazenamento: `/var/lib/prometheus/`

**Elasticsearch:**
- Logs: Sem limite padrão (configurar ILM policy)
- Recomendado: 90 dias de retenção
- Rollover: Diário (índices lordtsapi-logs-YYYY.MM.DD)
- Armazenamento: `/var/lib/elasticsearch/`

**Grafana:**
- Dashboards: Permanente (SQLite em `/var/lib/grafana/grafana.db`)
- Alertas history: Configurável

**Configurar ILM Policy no Elasticsearch:**

```bash
curl -X PUT "localhost:9200/_ilm/policy/lordtsapi-logs-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_size": "50gb"
          }
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
'
```

#### 9.7.7 Backup e Recuperação

**Prometheus:**

```bash
# Backup (stop Prometheus first)
sudo systemctl stop prometheus
sudo tar -czf prometheus-backup-$(date +%Y%m%d).tar.gz /var/lib/prometheus/
sudo systemctl start prometheus

# Restore
sudo systemctl stop prometheus
sudo tar -xzf prometheus-backup-YYYYMMDD.tar.gz -C /
sudo chown -R prometheus:prometheus /var/lib/prometheus/
sudo systemctl start prometheus
```

**Elasticsearch:**

```bash
# Criar snapshot repository
curl -X PUT "localhost:9200/_snapshot/lor0138_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/backup/elasticsearch"
  }
}
'

# Criar snapshot
curl -X PUT "localhost:9200/_snapshot/lor0138_backup/snapshot_$(date +%Y%m%d)"

# Restore
curl -X POST "localhost:9200/_snapshot/lor0138_backup/snapshot_YYYYMMDD/_restore"
```

**Grafana:**

```bash
# Backup database
sudo cp /var/lib/grafana/grafana.db /backup/grafana-$(date +%Y%m%d).db

# Backup dashboards (via API)
curl -u admin:admin http://localhost:3000/api/search | jq -r '.[] | .uid' | \
while read uid; do
  curl -u admin:admin "http://localhost:3000/api/dashboards/uid/$uid" > "/backup/dashboard-$uid.json"
done

# Restore database
sudo systemctl stop grafana-server
sudo cp /backup/grafana-YYYYMMDD.db /var/lib/grafana/grafana.db
sudo chown grafana:grafana /var/lib/grafana/grafana.db
sudo systemctl start grafana-server
```

#### 9.7.8 Monitoramento do Monitoramento

**Verificar saúde do sistema de monitoramento:**

```bash
# Prometheus health
curl http://localhost:9090/-/healthy

# Elasticsearch health
curl http://localhost:9200/_cluster/health

# Grafana health
curl http://localhost:3000/api/health

# Kibana health (se instalado)
curl http://localhost:5601/api/status

# Script de verificação completo
cat > /usr/local/bin/check-monitoring.sh << 'EOF'
#!/bin/bash
echo "=== Monitoring Stack Health Check ==="
echo ""
echo "Prometheus:"
curl -s http://localhost:9090/-/healthy && echo "  ✓ Healthy" || echo "  ✗ Down"
echo ""
echo "Elasticsearch:"
curl -s http://localhost:9200/_cluster/health | jq -r '.status' | sed 's/^/  Status: /'
echo ""
echo "Grafana:"
curl -s http://localhost:3000/api/health | jq -r '.database' | sed 's/^/  Database: /'
echo ""
echo "Prometheus Targets:"
curl -s http://localhost:9090/api/v1/targets | jq -r '.data.activeTargets[] | "\(.labels.job): \(.health)"' | sed 's/^/  /'
EOF

chmod +x /usr/local/bin/check-monitoring.sh
/usr/local/bin/check-monitoring.sh
```

#### 9.7.9 Recursos de Aprendizado

**Prometheus:**
- Documentação: https://prometheus.io/docs/
- PromQL Tutorial: https://prometheus.io/docs/prometheus/latest/querying/basics/

**Elasticsearch:**
- Documentação: https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html
- Query DSL: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html

**Grafana:**
- Documentação: https://grafana.com/docs/grafana/latest/
- Dashboard Examples: https://grafana.com/grafana/dashboards/

**Kibana:**
- Documentação: https://www.elastic.co/guide/en/kibana/current/index.html
- Discover: https://www.elastic.co/guide/en/kibana/current/discover.html

---

## 10. APACHE AIRFLOW - AUTOMAÇÃO E ORQUESTRAÇÃO

### 10.1 Visão Geral

Apache Airflow é uma plataforma de orquestração de workflows open-source que permite programar, agendar e monitorar pipelines de dados complexos. Na aplicação LOR0138, o Airflow será utilizado para:

- **Web Scraping**: Coleta automatizada de dados de fontes externas
- **Atualização de Bancos de Dados**: ETL jobs que atualizam tabelas no SQL Server DATACORP
- **Integrações**: Sincronização de dados entre sistemas
- **Manutenção**: Limpeza de dados, arquivamento, backups programados

**Arquitetura Airflow:**

```
┌──────────────────────────────────────────────────────────┐
│                   Airflow Webserver                      │
│                    (Port 8080)                           │
│         UI para monitoramento e gerenciamento            │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────┴─────────────────────────────────────┐
│                   Airflow Scheduler                      │
│         Agenda e dispara DAGs conforme calendário        │
└────────────────────┬─────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌────────▼────────┐
│ Airflow Worker  │    │ Airflow Worker  │
│   (Executor)    │    │   (Executor)    │
│  Executa Tasks  │    │  Executa Tasks  │
└────────┬────────┘    └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    │
         ┌──────────▼───────────┐
         │   PostgreSQL DB      │
         │ (Metadata Backend)   │
         │  Stores DAG state,   │
         │  task history, logs  │
         └──────────────────────┘
                    │
         ┌──────────▼───────────┐
         │   SQL Server         │
         │   DATACORP           │
         │  (Target Database)   │
         └──────────────────────┘
```

**Requisitos de Hardware para Airflow (80 usuários simultâneos):**
- **RAM**: 4GB dedicados (2GB webserver + 1GB scheduler + 1GB workers)
- **CPU**: 2-4 cores (scheduler e workers precisam de cores dedicados)
- **Disco**: 20GB (DAGs, logs, XComs, plugins)

### 10.2 Instalação

#### 10.2.1 Instalar PostgreSQL (Backend Metadata)

Airflow requer um banco de dados para armazenar metadados. PostgreSQL é recomendado para produção.

```bash
# Instalar PostgreSQL 14
sudo apt update
sudo apt install -y postgresql postgresql-contrib libpq-dev

# Verificar instalação
sudo systemctl status postgresql

# Iniciar e habilitar
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### 10.2.2 Configurar Banco de Dados Airflow

```bash
# Acessar PostgreSQL como usuário postgres
sudo -u postgres psql

# Criar usuário e database para Airflow
CREATE USER airflow WITH PASSWORD 'airflow_secure_password_2025';
CREATE DATABASE airflow_db OWNER airflow;
GRANT ALL PRIVILEGES ON DATABASE airflow_db TO airflow;

# Sair do psql
\q
```

**IMPORTANTE:** Troque `airflow_secure_password_2025` por uma senha forte em produção.

#### 10.2.3 Instalar Python e Dependências

```bash
# Instalar Python 3.10+ (Airflow 2.8+ requer Python 3.8-3.11)
sudo apt install -y python3.10 python3.10-venv python3-pip
sudo apt install -y build-essential libssl-dev libffi-dev python3-dev
sudo apt install -y libsasl2-dev libldap2-dev

# Verificar versão
python3.10 --version
```

#### 10.2.4 Instalar Apache Airflow

```bash
# Criar usuário dedicado para Airflow
sudo useradd -m -s /bin/bash airflow
sudo usermod -aG sudo airflow  # Opcional, se precisar de sudo

# Criar diretório para Airflow
sudo mkdir -p /opt/airflow
sudo chown -R airflow:airflow /opt/airflow

# Mudar para usuário airflow
sudo su - airflow

# Criar ambiente virtual Python
cd /opt/airflow
python3.10 -m venv airflow-venv
source airflow-venv/bin/activate

# Definir variável de ambiente Airflow Home
export AIRFLOW_HOME=/opt/airflow

# Instalar Airflow 2.8.0+ com extras necessários
AIRFLOW_VERSION=2.8.0
PYTHON_VERSION="$(python --version | cut -d " " -f 2 | cut -d "." -f 1-2)"
CONSTRAINT_URL="https://raw.githubusercontent.com/apache/airflow/constraints-${AIRFLOW_VERSION}/constraints-${PYTHON_VERSION}.txt"

pip install "apache-airflow[postgres,celery,redis,http,crypto]==${AIRFLOW_VERSION}" \
  --constraint "${CONSTRAINT_URL}"

# Instalar providers adicionais
pip install apache-airflow-providers-microsoft-mssql
pip install apache-airflow-providers-odbc
pip install apache-airflow-providers-http
pip install apache-airflow-providers-ftp

# Instalar bibliotecas para web scraping
pip install requests beautifulsoup4 selenium lxml pandas

# Verificar instalação
airflow version
```

**Extras instalados:**
- `postgres`: Suporte a PostgreSQL (metadata backend)
- `celery`: Executor distribuído (para múltiplos workers)
- `redis`: Broker para Celery executor
- `http`: HTTP operators para APIs
- `crypto`: Criptografia de conexões sensíveis
- `microsoft-mssql`: Provider para SQL Server
- `odbc`: Provider para conexões ODBC

#### 10.2.5 Adicionar ao PATH Permanentemente

```bash
# Adicionar ao .bashrc do usuário airflow
echo 'export AIRFLOW_HOME=/opt/airflow' >> ~/.bashrc
echo 'source /opt/airflow/airflow-venv/bin/activate' >> ~/.bashrc
source ~/.bashrc
```

### 10.3 Configuração

#### 10.3.1 Inicializar Banco de Dados Airflow

```bash
# Como usuário airflow
cd /opt/airflow
source airflow-venv/bin/activate

# Inicializar database (cria estrutura de tabelas)
airflow db init
```

#### 10.3.2 Configurar airflow.cfg

```bash
# Editar configuração principal
nano /opt/airflow/airflow.cfg
```

**Configurações importantes:**

```ini
[core]
# Executor: LocalExecutor (single machine) ou CeleryExecutor (distributed)
executor = LocalExecutor
# Para 80 usuários, LocalExecutor é suficiente se a máquina tiver 8+ cores

# DAGs folder (onde ficam os workflows)
dags_folder = /opt/airflow/dags

# Parallelism: máximo de tasks rodando simultaneamente
parallelism = 32

# DAG concurrency: máximo de tasks por DAG
max_active_tasks_per_dag = 16

# DAG runs: máximo de DAG runs ativos por DAG
max_active_runs_per_dag = 16

# Timezone
default_timezone = America/Sao_Paulo

[database]
# Connection string para PostgreSQL
sql_alchemy_conn = postgresql+psycopg2://airflow:airflow_secure_password_2025@localhost/airflow_db

[webserver]
# Webserver host e porta
web_server_host = 0.0.0.0
web_server_port = 8080

# URL base (se acessado via proxy)
base_url = http://localhost:8080

# Workers (processos webserver)
workers = 4

# Autenticação
authenticate = True
auth_backend = airflow.api.auth.backend.basic_auth

[scheduler]
# Intervalo de parsing dos DAGs (segundos)
dag_dir_list_interval = 300

# Quantos scheduler podem rodar
max_threads = 2

[logging]
# Log level
logging_level = INFO

# Logs folder
base_log_folder = /opt/airflow/logs

# Retenção de logs (dias)
log_retention_days = 30

[metrics]
# Expor métricas para Prometheus
statsd_on = True
statsd_host = localhost
statsd_port = 8125
statsd_prefix = airflow
```

**IMPORTANTE:** Substitua `airflow_secure_password_2025` pela senha configurada no PostgreSQL.

#### 10.3.3 Criar Usuário Admin

```bash
# Criar usuário admin para acessar WebUI
airflow users create \
  --username admin \
  --firstname Admin \
  --lastname User \
  --role Admin \
  --email admin@lorenzetti.com.br \
  --password admin_secure_password_2025
```

**Trocar senha em produção!**

#### 10.3.4 Criar Estrutura de Diretórios

```bash
# Criar diretórios necessários
mkdir -p /opt/airflow/dags
mkdir -p /opt/airflow/plugins
mkdir -p /opt/airflow/logs
mkdir -p /opt/airflow/scripts

# Ajustar permissões
chown -R airflow:airflow /opt/airflow
chmod -R 755 /opt/airflow
```

### 10.4 Integração com SQL Server

#### 10.4.1 Configurar Connection no Airflow

Airflow usa "Connections" para armazenar credenciais de bancos de dados e APIs.

**Opção 1: Via WebUI (após iniciar Airflow)**

1. Acesse http://localhost:8080
2. Login: admin / admin_secure_password_2025
3. Menu: Admin → Connections
4. Clique em "+"
5. Preencha:

```
Connection Id: datacorp_prd
Connection Type: Microsoft SQL Server
Host: T-SRVSQL2022-01\LOREN
Schema: DATACORP
Login: dcloren
Password: #dcloren#
Port: 1433
Extra: {"driver": "ODBC Driver 18 for SQL Server", "TrustServerCertificate": "yes"}
```

6. Test → Save

**Opção 2: Via CLI (Mais Seguro)**

```bash
# Adicionar connection via CLI
airflow connections add 'datacorp_prd' \
  --conn-type 'mssql' \
  --conn-host 'T-SRVSQL2022-01\LOREN' \
  --conn-schema 'DATACORP' \
  --conn-login 'dcloren' \
  --conn-password '#dcloren#' \
  --conn-port 1433 \
  --conn-extra '{"driver": "ODBC Driver 18 for SQL Server", "TrustServerCertificate": "yes"}'

# Adicionar connection para development
airflow connections add 'datacorp_dev' \
  --conn-type 'mssql' \
  --conn-host 'T-SRVSQLDEV2022-01\LOREN' \
  --conn-schema 'DATACORP' \
  --conn-login 'dcloren' \
  --conn-password '#dclorendev#' \
  --conn-port 1433 \
  --conn-extra '{"driver": "ODBC Driver 18 for SQL Server", "TrustServerCertificate": "yes"}'

# Listar connections
airflow connections list
```

#### 10.4.2 Testar Conexão SQL Server

Criar DAG de teste:

```bash
nano /opt/airflow/dags/test_sqlserver_connection.py
```

```python
from airflow import DAG
from airflow.providers.microsoft.mssql.operators.mssql import MsSqlOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2025, 10, 31),
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'test_sqlserver_connection',
    default_args=default_args,
    description='Test SQL Server connection',
    schedule_interval=None,  # Manual trigger only
    catchup=False,
    tags=['test', 'sqlserver'],
)

test_query = MsSqlOperator(
    task_id='test_query',
    mssql_conn_id='datacorp_prd',
    sql='SELECT @@VERSION AS version, GETDATE() AS current_time;',
    dag=dag,
)

test_query
```

```bash
# Testar DAG
airflow dags test test_sqlserver_connection 2025-10-31
```

### 10.5 DAGs para Web Scraping

#### 10.5.1 Exemplo: DAG para Web Scraping

Criar DAG para scraping de dados e inserção no SQL Server:

```bash
nano /opt/airflow/dags/scrape_and_update_database.py
```

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.microsoft.mssql.operators.mssql import MsSqlOperator
from airflow.providers.microsoft.mssql.hooks.mssql import MsSqlHook
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup
import pandas as pd
import logging

default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'start_date': datetime(2025, 10, 31),
    'email': ['alerts@lorenzetti.com.br'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'scrape_and_update_database',
    default_args=default_args,
    description='Web scraping and database update pipeline',
    schedule_interval='0 2 * * *',  # Diariamente às 2h AM
    catchup=False,
    max_active_runs=1,
    tags=['scraping', 'etl', 'datacorp'],
)

def scrape_data(**context):
    """
    Função de web scraping - EXEMPLO
    Adapte conforme a fonte de dados real
    """
    logging.info("Starting web scraping...")

    # Exemplo: scraping de dados de uma API ou site
    try:
        # Exemplo com API REST
        response = requests.get('https://api.example.com/data', timeout=30)
        response.raise_for_status()
        data = response.json()

        # Transformar em DataFrame
        df = pd.DataFrame(data)

        # Salvar em XCom para próxima task
        context['ti'].xcom_push(key='scraped_data', value=df.to_dict('records'))

        logging.info(f"Scraped {len(df)} records successfully")
        return len(df)

    except Exception as e:
        logging.error(f"Scraping failed: {str(e)}")
        raise

def insert_to_database(**context):
    """
    Inserir dados no SQL Server DATACORP
    """
    logging.info("Inserting data to SQL Server...")

    # Recuperar dados do XCom
    data = context['ti'].xcom_pull(key='scraped_data', task_ids='scrape_data_task')

    if not data:
        logging.warning("No data to insert")
        return 0

    # Conectar ao SQL Server
    hook = MsSqlHook(mssql_conn_id='datacorp_prd')

    # Preparar insert statement
    insert_sql = """
    INSERT INTO staging.web_scraped_data
    (field1, field2, field3, scraped_at)
    VALUES (?, ?, ?, GETDATE())
    """

    # Inserir registros em batch
    inserted = 0
    for record in data:
        try:
            hook.run(insert_sql, parameters=(
                record.get('field1'),
                record.get('field2'),
                record.get('field3')
            ))
            inserted += 1
        except Exception as e:
            logging.error(f"Failed to insert record: {str(e)}")

    logging.info(f"Inserted {inserted}/{len(data)} records")
    return inserted

# Tasks
scrape_task = PythonOperator(
    task_id='scrape_data_task',
    python_callable=scrape_data,
    provide_context=True,
    dag=dag,
)

insert_task = PythonOperator(
    task_id='insert_to_database_task',
    python_callable=insert_to_database,
    provide_context=True,
    dag=dag,
)

# Cleanup staging table (executar antes do scraping)
cleanup_staging = MsSqlOperator(
    task_id='cleanup_staging_table',
    mssql_conn_id='datacorp_prd',
    sql="""
    DELETE FROM staging.web_scraped_data
    WHERE scraped_at < DATEADD(day, -7, GETDATE());
    """,
    dag=dag,
)

# Merge staging para tabela final
merge_to_final = MsSqlOperator(
    task_id='merge_to_final_table',
    mssql_conn_id='datacorp_prd',
    sql="""
    MERGE INTO dbo.final_data AS target
    USING staging.web_scraped_data AS source
    ON target.field1 = source.field1
    WHEN MATCHED THEN
        UPDATE SET
            target.field2 = source.field2,
            target.field3 = source.field3,
            target.updated_at = GETDATE()
    WHEN NOT MATCHED THEN
        INSERT (field1, field2, field3, created_at)
        VALUES (source.field1, source.field2, source.field3, GETDATE());
    """,
    dag=dag,
)

# Definir ordem de execução
cleanup_staging >> scrape_task >> insert_task >> merge_to_final
```

#### 10.5.2 Exemplo: DAG para Atualização de GPC

```bash
nano /opt/airflow/dags/update_gpc_classification.py
```

```python
from airflow import DAG
from airflow.providers.microsoft.mssql.operators.mssql import MsSqlOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-team',
    'start_date': datetime(2025, 10, 31),
    'retries': 2,
    'retry_delay': timedelta(minutes=10),
}

dag = DAG(
    'update_gpc_classification',
    default_args=default_args,
    description='Update GPC classification from GS1',
    schedule_interval='0 0 1 * *',  # Mensal, dia 1 às 00:00
    catchup=False,
    tags=['gpc', 'etl', 'datacorp'],
)

# Download arquivo GPC atualizado
download_gpc = BashOperator(
    task_id='download_gpc_file',
    bash_command="""
    cd /opt/aplicacoes/backend/current
    curl -o /tmp/gpc_latest.zip https://www.gs1.org/standards/gpc/download/latest
    """,
    dag=dag,
)

# Importar GPC via script existente
import_gpc = BashOperator(
    task_id='import_gpc_to_database',
    bash_command="""
    cd /opt/aplicacoes/backend/current
    source ~/.nvm/nvm.sh
    nvm use 20
    npm run gpc:import -- --file /tmp/gpc_latest.zip --env production --clear --verbose
    """,
    dag=dag,
)

# Atualizar mapeamentos GTIN/NCM/CEST
update_mappings = MsSqlOperator(
    task_id='update_item_mappings',
    mssql_conn_id='datacorp_prd',
    sql="""
    -- Atualizar mapeamentos automáticos baseado em padrões
    -- (SQL específico conforme lógica de negócio)
    EXEC dbo.sp_update_gpc_mappings;
    """,
    dag=dag,
)

# Cleanup
cleanup = BashOperator(
    task_id='cleanup_temp_files',
    bash_command='rm -f /tmp/gpc_latest.zip',
    dag=dag,
)

# Pipeline
download_gpc >> import_gpc >> update_mappings >> cleanup
```

### 10.6 Monitoramento e Logs

#### 10.6.1 Criar Serviços Systemd

**Airflow Webserver:**

```bash
sudo nano /etc/systemd/system/airflow-webserver.service
```

```ini
[Unit]
Description=Airflow Webserver
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=airflow
Group=airflow
Environment="AIRFLOW_HOME=/opt/airflow"
Environment="PATH=/opt/airflow/airflow-venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/opt/airflow/airflow-venv/bin/airflow webserver --port 8080
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Airflow Scheduler:**

```bash
sudo nano /etc/systemd/system/airflow-scheduler.service
```

```ini
[Unit]
Description=Airflow Scheduler
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=airflow
Group=airflow
Environment="AIRFLOW_HOME=/opt/airflow"
Environment="PATH=/opt/airflow/airflow-venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/opt/airflow/airflow-venv/bin/airflow scheduler
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Habilitar e Iniciar Serviços:**

```bash
# Reload systemd
sudo systemctl daemon-reload

# Habilitar serviços (iniciar no boot)
sudo systemctl enable airflow-webserver
sudo systemctl enable airflow-scheduler

# Iniciar serviços
sudo systemctl start airflow-webserver
sudo systemctl start airflow-scheduler

# Verificar status
sudo systemctl status airflow-webserver
sudo systemctl status airflow-scheduler
```

#### 10.6.2 Acessar Airflow WebUI

```bash
# Aguardar serviços iniciarem (30-60 segundos)
sleep 30

# Verificar se WebUI está acessível
curl http://localhost:8080/health

# Acessar via navegador
# URL: http://<servidor-ip>:8080
# Login: admin
# Senha: admin_secure_password_2025
```

**Se acessar via proxy Nginx:**

```bash
sudo nano /etc/nginx/sites-available/default
```

Adicionar location para Airflow:

```nginx
location /airflow/ {
    proxy_pass http://localhost:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket support para Airflow UI
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

```bash
# Testar e recarregar Nginx
sudo nginx -t
sudo systemctl reload nginx
```

Atualizar `airflow.cfg`:

```ini
[webserver]
base_url = http://localhost/airflow
```

```bash
# Reiniciar Airflow
sudo systemctl restart airflow-webserver
```

#### 10.6.3 Integrar Logs com Elasticsearch

Airflow pode enviar logs para Elasticsearch para centralização:

```bash
# Instalar provider Elasticsearch
sudo su - airflow
source /opt/airflow/airflow-venv/bin/activate
pip install apache-airflow-providers-elasticsearch
```

Configurar em `airflow.cfg`:

```ini
[elasticsearch]
host = localhost:9200
log_id_template = {dag_id}-{task_id}-{execution_date}-{try_number}
end_of_log_mark = END_OF_LOG
write_stdout = True
json_format = True
```

#### 10.6.4 Expor Métricas para Prometheus

Airflow expõe métricas via StatsD. Configurar StatsD exporter:

```bash
# Instalar StatsD Exporter
cd /opt
sudo wget https://github.com/prometheus/statsd_exporter/releases/download/v0.24.0/statsd_exporter-0.24.0.linux-amd64.tar.gz
sudo tar xvf statsd_exporter-0.24.0.linux-amd64.tar.gz
sudo mv statsd_exporter-0.24.0.linux-amd64/statsd_exporter /usr/local/bin/
```

Criar serviço:

```bash
sudo nano /etc/systemd/system/statsd-exporter.service
```

```ini
[Unit]
Description=StatsD Exporter
After=network.target

[Service]
Type=simple
User=prometheus
ExecStart=/usr/local/bin/statsd_exporter --statsd.listen-udp=:8125 --web.listen-address=:9102
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable statsd-exporter
sudo systemctl start statsd-exporter
```

Adicionar ao Prometheus (`/etc/prometheus/prometheus.yml`):

```yaml
scrape_configs:
  - job_name: 'airflow'
    static_configs:
      - targets: ['localhost:9102']
```

```bash
sudo systemctl reload prometheus
```

#### 10.6.5 Comandos Úteis Airflow

```bash
# Listar DAGs
airflow dags list

# Testar DAG (dry-run)
airflow dags test <dag_id> <execution_date>

# Trigger DAG manualmente
airflow dags trigger <dag_id>

# Pausar/Despausar DAG
airflow dags pause <dag_id>
airflow dags unpause <dag_id>

# Ver tasks de um DAG
airflow tasks list <dag_id>

# Ver logs de uma task
airflow tasks logs <dag_id> <task_id> <execution_date>

# Limpar histórico de execuções
airflow dags delete <dag_id>

# Ver connections
airflow connections list

# Resetar banco de dados (CUIDADO!)
airflow db reset

# Upgrade do schema após atualização
airflow db upgrade
```

#### 10.6.6 Troubleshooting Airflow

**Webserver não inicia:**

```bash
# Ver logs do systemd
sudo journalctl -u airflow-webserver -f

# Verificar se porta 8080 está em uso
sudo lsof -i :8080

# Verificar permissões
ls -la /opt/airflow
```

**Scheduler não processa DAGs:**

```bash
# Ver logs
sudo journalctl -u airflow-scheduler -f

# Verificar se DAGs têm erros
airflow dags list-import-errors

# Forçar re-parsing
airflow dags reserialize
```

**Connection com SQL Server falha:**

```bash
# Testar connection via CLI
airflow connections test datacorp_prd

# Verificar ODBC Driver
odbcinst -q -d

# Testar conexão direta
sqlcmd -S "T-SRVSQL2022-01\LOREN" -U dcloren -P '#dcloren#' -Q "SELECT @@VERSION"
```

**DAG não aparece na UI:**

```bash
# Verificar permissões do arquivo DAG
ls -la /opt/airflow/dags/*.py

# Verificar erros de import
python3 /opt/airflow/dags/<dag_file>.py

# Forçar re-scan
airflow dags list
```

---

## 11. CHECKLIST FINAL

### 11.1 Pré-Deploy

- [ ] Sistema operacional atualizado (Ubuntu 20.04.6 LTS)
- [ ] Node.js 20.x instalado
- [ ] Nginx instalado e rodando
- [ ] Redis instalado e rodando
- [ ] Firewall (UFW) configurado
- [ ] Drivers ODBC instalados (Progress + Informix)
- [ ] /etc/odbc.ini configurado (28 DSNs)
- [ ] /etc/odbcinst.ini configurado

### 11.2 Backend

- [ ] Repositório clonado em /opt/aplicacoes/backend/current
- [ ] .npmrc configurado com GitHub token
- [ ] Dependências instaladas (npm ci)
- [ ] .env configurado
- [ ] Build realizado (npm run build)
- [ ] dist/server.js existe
- [ ] Serviço rodando (systemd ou nohup)
- [ ] Health check OK: `curl http://localhost:3001/health`
- [ ] Teste de API: `curl http://localhost:3001/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110`

### 11.3 Frontend

- [ ] Repositório clonado em /opt/aplicacoes/frontend/current
- [ ] .npmrc configurado com GitHub token
- [ ] Dependências instaladas (npm ci --legacy-peer-deps)
- [ ] .env.production configurado
- [ ] Build realizado (npm run build)
- [ ] build/index.html existe
- [ ] Permissões corretas (www-data)
- [ ] Nginx configurado (lor0138-frontend.conf + lordtsapi.conf)
- [ ] Sites habilitados no nginx
- [ ] Nginx testado: `sudo nginx -t`
- [ ] Nginx recarregado: `sudo systemctl reload nginx`

### 11.4 Rede

- [ ] DNS configurado (ou /etc/hosts)
- [ ] lor0138.lorenzetti.ibe resolve
- [ ] lordtsapi.lorenzetti.ibe resolve
- [ ] Firewall permite portas 80, 443, 22
- [ ] Firewall permite saída para bancos (1433, 40001-42007, 3515-3517, 5511)

### 11.5 Testes Finais

**Backend:**

```bash
# 1. Health check geral
curl http://localhost:3001/health
# Esperado: { "status": "healthy", ... }

# 2. Health de TODAS as 28 conexões (22 ODBC + 6 SQL Server)
curl http://localhost:3001/health/connections
# Esperado: lista de 28 conexões com status

# 3. Teste de endpoint de API
curl http://localhost:3001/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110
# Esperado: JSON com dados do item

# 4. Testar via hostname
curl http://lordtsapi.lorenzetti.ibe/health

# 5. Métricas Prometheus
curl http://localhost:3001/metrics
# Esperado: métricas em formato Prometheus
```

**Frontend:**

```bash
# 1. Testar página inicial
curl -I http://lor0138.lorenzetti.ibe
# Esperado: HTTP 200 OK

# 2. Testar se index.html é servido
curl http://lor0138.lorenzetti.ibe | grep -i "lor0138"

# 3. Testar proxy reverso para API
curl http://lor0138.lorenzetti.ibe/api/health
# Esperado: redirecionamento para backend

# 4. Abrir no navegador
# http://lor0138.lorenzetti.ibe
# Esperado: interface React carregada
```

**Conexões de Banco:**

```bash
# Testar conexão Datasul Producao EMP
echo "SELECT COUNT(*) FROM item;" | isql -v DtsPrdEmp sysprogress sysprogress

# Testar conexão Informix Production
echo "SELECT COUNT(*) FROM item;" | isql -v LgxPrd

# Testar conexão SQL Server PCFactory
# (via backend, não tem ferramenta CLI direta)
curl 'http://localhost:3001/api/pcfactory/test'

# Testar conexão SQL Server Corporativo
curl 'http://localhost:3001/api/corporativo/test'
```

### 11.6 CI/CD

- [ ] GitHub Actions runner instalado e rodando
- [ ] Runner registrado no repositório backend
- [ ] Runner registrado no repositório frontend
- [ ] GitHub secrets configurados
- [ ] Teste de push para main (dispara deploy automático)

### 11.7 Monitoramento

**Logs:**
- [ ] Logs sendo gravados em /opt/aplicacoes/backend/logs/
- [ ] Nginx logs em /var/log/nginx/
- [ ] Winston configurado no backend (.env)

**Elasticsearch:**
- [ ] Elasticsearch instalado e rodando: `curl http://localhost:9200`
- [ ] Cluster health OK: `curl http://localhost:9200/_cluster/health`
- [ ] Índices configurados: `curl http://localhost:9200/_cat/indices?v`
- [ ] Template criado: `curl http://localhost:9200/_index_template/lordtsapi-logs-template`
- [ ] Backend integrando com Elasticsearch (ELASTICSEARCH_ENABLED=true no .env)

**Kibana (Opcional):**
- [ ] Kibana instalado e rodando: `curl http://localhost:5601/api/status`
- [ ] Kibana acessível: http://localhost:5601
- [ ] Index pattern configurado (lordtsapi-logs-*)
- [ ] Dashboards criados e funcionais

**Prometheus:**
- [ ] Prometheus instalado e rodando: `curl http://localhost:9090/-/healthy`
- [ ] Prometheus acessível: http://localhost:9090
- [ ] Target lor0138-api UP na porta 3001: `curl http://localhost:9090/api/v1/targets`
- [ ] Regras de alerta configuradas em /etc/prometheus/alerts/
- [ ] Systemd service configurado e habilitado
- [ ] Retenção de dados configurada (30d, 10GB)

**Grafana:**
- [ ] Grafana instalado e rodando: `curl http://localhost:3000/api/health`
- [ ] Grafana acessível: http://localhost:3000 (admin/admin)
- [ ] Data source Prometheus configurado
- [ ] Data source Elasticsearch configurado (se Elasticsearch instalado)
- [ ] Dashboards provisionados em /etc/grafana/dashboards/
- [ ] Dashboard API Metrics funcional
- [ ] Dashboard Database Metrics funcional
- [ ] Dashboard Cache Metrics funcional
- [ ] Dashboard System Metrics funcional
- [ ] Alertas configurados (opcional)

**Apache Airflow:**
- [ ] PostgreSQL instalado e rodando: `sudo systemctl status postgresql`
- [ ] Database airflow_db criado e acessível
- [ ] Airflow instalado: `airflow version`
- [ ] Airflow webserver rodando: `sudo systemctl status airflow-webserver`
- [ ] Airflow scheduler rodando: `sudo systemctl status airflow-scheduler`
- [ ] Airflow WebUI acessível: http://localhost:8080 (admin/senha)
- [ ] Connection datacorp_prd configurada e testada
- [ ] Connection datacorp_dev configurada e testada
- [ ] DAGs aparecendo na UI: `airflow dags list`
- [ ] StatsD exporter rodando (métricas): `curl http://localhost:9102/metrics`
- [ ] Prometheus scraping métricas do Airflow
- [ ] Logs do Airflow em /opt/airflow/logs/

**Integração:**
- [ ] Backend expõe /metrics: `curl http://localhost:3001/metrics`
- [ ] Backend expõe /health: `curl http://localhost:3001/health`
- [ ] Prometheus scraping métricas do backend
- [ ] Grafana exibindo dados do Prometheus
- [ ] Logs aparecendo no Elasticsearch/Kibana (se configurado)
- [ ] Script de verificação funcional: `/usr/local/bin/check-monitoring.sh`

---

## 12. COMANDOS ÚTEIS

### 12.1 Gerenciar Serviços

```bash
# Backend (systemd)
sudo systemctl status lordtsapi
sudo systemctl start lordtsapi
sudo systemctl stop lordtsapi
sudo systemctl restart lordtsapi
sudo journalctl -u lordtsapi -f

# Backend (se usando node direto)
ps aux | grep "node.*server.js"
pkill -f "node.*server.js"
nohup node /opt/aplicacoes/backend/current/dist/server.js > /opt/aplicacoes/backend/logs/app.log 2>&1 &

# Nginx
sudo systemctl status nginx
sudo systemctl reload nginx
sudo systemctl restart nginx
sudo nginx -t  # Testar configuração

# Redis
sudo systemctl status redis-server
sudo systemctl restart redis-server
redis-cli ping
```

### 12.2 Ver Logs

```bash
# Backend
tail -f /opt/aplicacoes/backend/logs/app.log
tail -f /opt/aplicacoes/backend/logs/error.log

# Systemd
sudo journalctl -u lordtsapi -f --lines=50

# Nginx
tail -f /var/log/nginx/lor0138-frontend-access.log
tail -f /var/log/nginx/lordtsapi-access.log
tail -f /var/log/nginx/error.log

# Sistema
tail -f /var/log/syslog
dmesg -T
```

### 12.3 Verificar Processos

```bash
# Ver processos Node
ps aux | grep node

# Ver portas em uso
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :6379

# Ver conexões ativas
ss -tunap | grep :3001
```

### 12.4 Deploy Manual

```bash
# Backend
cd /opt/aplicacoes/backend/current
git pull origin main
npm ci
npm run build
pkill -f "node.*server.js" && nohup node dist/server.js > logs/app.log 2>&1 &
sleep 3 && curl http://localhost:3001/health

# Frontend
cd /opt/aplicacoes/frontend/current
git pull origin main
npm ci --legacy-peer-deps
npm run build
sudo chown -R www-data:www-data build/
sudo systemctl reload nginx
sleep 2 && curl -I http://lor0138.lorenzetti.ibe
```

### 12.5 Troubleshooting

```bash
# Backend não inicia
sudo journalctl -u lordtsapi -n 50 --no-pager
tail -n 100 /opt/aplicacoes/backend/logs/error.log

# Nginx 502 Bad Gateway
curl http://localhost:3001/health  # Backend deve responder
sudo nginx -t  # Configuração deve estar OK
sudo systemctl status nginx

# ODBC não conecta
isql -v DtsPrdEmp sysprogress sysprogress
tail -f /var/log/syslog | grep -i odbc

# Redis não conecta
redis-cli ping
sudo systemctl status redis-server

# Alta latência
curl http://localhost:3001/metrics | grep http_request_duration
curl http://localhost:3001/cache/stats

# Ver conexões ativas no pool
curl http://localhost:3001/health/connections/active
```

### 12.6 Apache Airflow

```bash
# Gerenciar serviços
sudo systemctl status airflow-webserver
sudo systemctl status airflow-scheduler
sudo systemctl restart airflow-webserver
sudo systemctl restart airflow-scheduler
sudo journalctl -u airflow-webserver -f
sudo journalctl -u airflow-scheduler -f

# PostgreSQL (backend Airflow)
sudo systemctl status postgresql
sudo -u postgres psql -d airflow_db -c "SELECT COUNT(*) FROM dag;"

# DAGs
airflow dags list
airflow dags trigger <dag_id>
airflow dags pause <dag_id>
airflow dags unpause <dag_id>

# Tasks
airflow tasks list <dag_id>
airflow tasks logs <dag_id> <task_id> <execution_date>

# Connections
airflow connections list
airflow connections test datacorp_prd

# Health
curl http://localhost:8080/health
airflow db check

# Métricas (via StatsD exporter)
curl http://localhost:9102/metrics | grep airflow
```

---

## 13. INFORMAÇÕES ADICIONAIS

### 13.1 Versões de Software

| Software | Versão | Comando para Verificar |
|----------|--------|------------------------|
| Ubuntu | 20.04.6 LTS | `lsb_release -a` |
| Linux Kernel | 5.4.0-216 | `uname -r` |
| Node.js | 20.x (LTS) | `node --version` |
| npm | 10.x | `npm --version` |
| Nginx | 1.18.0+ | `nginx -v` |
| Redis | 8.0.3+ | `redis-cli --version` |
| Progress ODBC | 11.7+ | `ls -la /usr/dlc/odbc/lib/pgoe27.so` |
| Informix ODBC | - | `ls -la /opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so` |

### 13.2 Portas Utilizadas

| Porta | Serviço | Finalidade |
|-------|---------|------------|
| 22 | SSH | Administração |
| 80 | Nginx | HTTP (frontend + proxy backend) |
| 443 | Nginx | HTTPS (se SSL configurado) |
| 3001 | Node.js | Backend lordtsapi |
| 6379 | Redis | Cache L2 |
| 1433 | SQL Server | Linked Server + PCFactory + Corporativo |
| 40001-40007 | Progress | Datasul Producao (6 databases) |
| 41001-41007 | Progress | Datasul Teste (6 databases) |
| 42001-42007 | Progress | Datasul Homologacao (6 databases) |
| 3515-3517 | Informix | Dev/Atu/New environments |
| 5511 | Informix | Production |
| 5432 | PostgreSQL | Airflow metadata database |
| 8080 | Airflow | Airflow WebUI |
| 8125 | StatsD | Airflow metrics (via StatsD exporter) |
| 9102 | Prometheus | StatsD exporter (Airflow metrics) |
| 9090 | Prometheus | Prometheus server |
| 3000 | Grafana | Grafana dashboards |
| 9200 | Elasticsearch | Logs centralizados |
| 5601 | Kibana | Visualização de logs |

### 13.3 Arquivos de Configuração

| Arquivo | Localização | Finalidade |
|---------|-------------|------------|
| Backend .env | /opt/aplicacoes/backend/current/.env | Config produção backend |
| Frontend .env | /opt/aplicacoes/frontend/current/.env.production | Config produção frontend |
| ODBC DSNs | /etc/odbc.ini | 28 conexões ODBC (22 ODBC + 6 SQL Server refs) |
| ODBC Drivers | /etc/odbcinst.ini | Drivers ODBC |
| Nginx Frontend | /etc/nginx/sites-available/lor0138-frontend.conf | Config nginx frontend |
| Nginx Backend | /etc/nginx/sites-available/lordtsapi.conf | Config nginx backend |
| Systemd Backend | /etc/systemd/system/lordtsapi.service | Serviço backend |

### 13.4 Repositórios GitHub

- **Backend:** https://github.com/acmano/lordtsapiBackend
- **Frontend:** https://github.com/acmano/lor0138Frontend
- **Shared Types:** https://github.com/acmano/lordtsapi-shared-types (npm package)

### 13.5 Pacotes NPM Privados

A aplicação usa um pacote privado do GitHub Packages:

- `@acmano/lordtsapi-shared-types@^1.0.0`

**IMPORTANTE:** Você precisa de um GitHub Personal Access Token (PAT) com permissão `read:packages`.

### 13.6 Hostnames

- **Frontend:** http://lor0138.lorenzetti.ibe
- **Backend:** http://lordtsapi.lorenzetti.ibe:3001
- **Banco SQL Server:** 10.105.0.4\LOREN
- **Datasul Producao:** 189.126.146.38
- **Datasul Teste:** 189.126.146.71
- **Datasul Homologacao:** 189.126.146.135
- **Informix Dev:** 10.1.0.84
- **Informix Production:** 10.105.0.39

---

## 14. ANEXOS

### 14.1 Exemplo de /etc/hosts Completo

```
127.0.0.1       localhost
127.0.1.1       T-LXNODE-01

# LOR0138 Application
127.0.0.1       lor0138.lorenzetti.ibe
127.0.0.1       lordtsapi.lorenzetti.ibe

# IPv6
::1             ip6-localhost ip6-loopback
fe00::0         ip6-localnet
ff00::0         ip6-mcastprefix
ff02::1         ip6-allnodes
ff02::2         ip6-allrouters
```

### 14.2 Exemplo de Script de Deploy Completo

```bash
#!/bin/bash
# /opt/aplicacoes/scripts/deploy-all.sh
# Deploy completo de backend + frontend

set -e  # Exit on error

echo "🚀 Iniciando deploy completo..."

# 1. Backend
echo "📦 Deploying backend..."
cd /opt/aplicacoes/backend/current
git pull origin main
npm ci
npm run build

# Parar backend
pkill -f "node.*server.js" || true
sleep 2

# Iniciar backend
nohup node dist/server.js > logs/app.log 2>&1 &
sleep 3

# Health check backend
if curl -f http://localhost:3001/health; then
    echo "✅ Backend deployed successfully"
else
    echo "❌ Backend deploy failed!"
    exit 1
fi

# 2. Frontend
echo "📦 Deploying frontend..."
cd /opt/aplicacoes/frontend/current
git pull origin main
npm ci --legacy-peer-deps
npm run build

# Copiar build
sudo chown -R www-data:www-data build/

# Recarregar nginx
sudo systemctl reload nginx
sleep 2

# Health check frontend
if curl -f -I http://lor0138.lorenzetti.ibe; then
    echo "✅ Frontend deployed successfully"
else
    echo "❌ Frontend deploy failed!"
    exit 1
fi

echo "🎉 Deploy completo finalizado com sucesso!"
```

---

## 15. CONTATO E SUPORTE

**Em caso de problemas:**

1. Verifique os logs primeiro
2. Teste as conexões ODBC com `isql`
3. Verifique se os serviços estão rodando
4. Consulte a documentação em:
   - `/opt/aplicacoes/backend/current/docs/`
   - `/opt/aplicacoes/frontend/current/README.md`

**Documentação adicional:**
- Backend CLAUDE.md: Guia completo de desenvolvimento
- Backend DEPLOYMENT.md: Guia de deploy
- Backend PRODUCTION.md: Guia de produção

---

## 16. CHANGELOG

| Versão | Data | Alterações |
|--------|------|------------|
| 1.1.0 | 2025-10-31 | Adicionado Apache Airflow (seção 10), revisão de requisitos de hardware para 80 usuários, lista completa de softwares (seção 1.4) |
| 1.0.0 | 2025-10-30 | Versão inicial do guia de infraestrutura completo |

---

**FIM DO DOCUMENTO**

Este guia foi criado para permitir a configuração completa de uma nova máquina de produção sem dependências da máquina atual. Todas as informações necessárias estão documentadas, incluindo:

- Configurações de sistema operacional
- Instalação de todos os softwares necessários
- Configuração de ODBC para 28 conexões (22 ODBC + 6 SQL Server)
- Setup completo de backend e frontend
- Configuração de rede e DNS
- CI/CD com GitHub Actions
- Monitoramento e logs
- Checklist de verificação final

Siga este guia passo a passo e você terá uma máquina de produção 100% funcional.
