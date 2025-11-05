# 🛠️ Setup do Ambiente - Projeto LOR0138

> Guia completo para configurar o ambiente de desenvolvimento

---

## 📋 Pré-requisitos

### Obrigatórios

- **Node.js** 18.x ou superior
- **npm** 9.x ou superior
- **Git** 2.x ou superior
- **Editor**: Visual Studio Code (recomendado)

### Acesso ao Banco de Dados

- **SQL Server** com acesso ao linked server Datasul
- **Credenciais** de usuário com permissão de leitura
- **Rede** com acesso ao servidor: `10.105.0.4\LOREN`

### Opcional (para recursos avançados)

- **Redis** 6.x ou superior (para cache distribuído)
- **Docker** (para containerização)
- **k6** (para testes de carga)

---

## 🚀 Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/lor0138.git
cd lor0138
```

### 2. Instalar Dependências

```bash
npm install
```

**Dependências principais instaladas**:
- express, typescript, ts-node-dev
- mssql (SQL Server), odbc (Progress)
- winston (logging), joi (validação)
- prom-client (métricas), swagger-ui-express

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
# ============================================
# AMBIENTE
# ============================================
NODE_ENV=development
PORT=3000

# ============================================
# BANCO DE DADOS
# ============================================
DB_CONNECTION_TYPE=sqlserver    # ou 'odbc'
DB_SERVER=10.105.0.4\LOREN
DB_PORT=1433
DB_USER=sysprogress
DB_PASSWORD='sysprogress'        # Aspas simples se tiver #

# Database vazio = usa default do SQL user
DB_DATABASE_EMP=
DB_DATABASE_MULT=

# Timeouts em MILISSEGUNDOS
DB_CONNECTION_TIMEOUT=500000
DB_REQUEST_TIMEOUT=30000

DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# ============================================
# CACHE
# ============================================
CACHE_ENABLED=true
CACHE_STRATEGY=memory          # memory, redis, ou layered
CACHE_DEFAULT_TTL=300

# ============================================
# CORS
# ============================================
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# ============================================
# TIMEOUTS HTTP
# ============================================
HTTP_REQUEST_TIMEOUT=30s
HTTP_HEALTH_TIMEOUT=3s

# ============================================
# LOGS
# ============================================
LOG_LEVEL=debug                # debug, info, warn, error
LOG_FILE=logs/app.log

# ============================================
# GRACEFUL SHUTDOWN
# ============================================
SHUTDOWN_TIMEOUT=10000

# ============================================
# RETRY LOGIC
# ============================================
DB_RETRY_MAX_ATTEMPTS=3
DB_RETRY_INITIAL_DELAY=1000
DB_RETRY_MAX_DELAY=10000
DB_RETRY_BACKOFF_FACTOR=2
```

⚠️ **PONTOS CRÍTICOS**:

1. **Timeouts**: Usar milissegundos puros (30000, não '30s')
2. **Senha com #**: Usar aspas simples: `DB_PASSWORD='#senha#'`
3. **Database vazio**: Deixar `DB_DATABASE_EMP=` (usa default do user)

### 4. Criar Pasta de Logs

```bash
mkdir -p logs
chmod 755 logs
```

---

## ✅ Verificar Instalação

### 1. Compilar TypeScript

```bash
npm run build
```

**Esperado**: Pasta `dist/` criada sem erros

### 2. Executar Testes

```bash
npm test
```

**Esperado**: Todos os testes passando ✅

### 3. Iniciar Servidor

```bash
npm run dev
```

**Esperado**:
```
🚀 Servidor rodando em http://localhost:3000
✅ Graceful shutdown configurado
✅ CONECTADO AO DATASUL
📚 Documentação Swagger disponível em /api-docs
```

### 4. Testar Health Check

```bash
curl http://localhost:3000/health
```

**Esperado**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-06T10:30:00.000Z",
  "uptime": 12.5,
  "database": {
    "connected": true,
    "type": "sqlserver"
  },
  "cache": {
    "enabled": true,
    "ready": true
  },
  "correlationId": "..."
}
```

### 5. Acessar Documentação

Abra no navegador: http://localhost:3000/api-docs

---

## 🔧 Configuração do Editor (VS Code)

### Extensões Recomendadas

Instale as seguintes extensões:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "orta.vscode-jest",
    "humao.rest-client"
  ]
}
```

### Settings.json

Crie `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "dist": true,
    ".ts-node": true
  }
}
```

### Launch.json (Debug)

Crie `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

## 🗄️ Configuração de Bancos de Dados

### SQL Server (Recomendado)

**Pré-requisitos**:
- Linked Server `PRD_EMS2EMP` configurado
- Linked Server `PRD_EMS2MULT` configurado
- Usuário com permissão de SELECT via OPENQUERY

**Testar conexão**:

```sql
-- No SQL Server Management Studio
SELECT TOP 1 * FROM OPENQUERY(PRD_EMS2EMP, 'SELECT * FROM pub.item')
```

**Configuração no .env**:
```env
DB_CONNECTION_TYPE=sqlserver
DB_SERVER=10.105.0.4\LOREN
DB_USER=sysprogress
DB_PASSWORD='sysprogress'
```

### ODBC (Fallback)

**Pré-requisitos**:
- Progress ODBC Driver instalado
- DSN configurado: `PRD_EMS2EMP` e `PRD_EMS2MULT`

**No Linux (Ubuntu)**:

```bash
# Instalar unixODBC
sudo apt-get update
sudo apt-get install unixodbc unixodbc-dev

# Verificar instalação
odbcinst -j

# Testar DSN
isql -v PRD_EMS2EMP
```

**Configuração no .env**:
```env
DB_CONNECTION_TYPE=odbc
```

### Mock Data (Desenvolvimento sem DB)

Para desenvolvimento sem acesso ao banco:

```env
# Força uso de dados mock
DB_CONNECTION_TYPE=sqlserver
DB_SERVER=invalid_server
```

Ao falhar conexão, o sistema automaticamente usa mock data.

---

## 🧪 Executar Testes

### Testes Unitários

```bash
# Todos os testes
npm test

# Com cobertura
npm run test:coverage

# Modo watch
npm run test:watch

# Teste específico
npm test -- informacoesGerais.service.test.ts
```

### Testes de Integração

```bash
npm run test:integration
```

### Testes de Carga

```bash
# Instalar k6
brew install k6  # macOS
# ou
sudo apt-get install k6  # Ubuntu

# Executar testes
npm run test:load
```

---

## 🐳 Docker (Opcional)

### Build da Imagem

```bash
docker build -t lor0138:latest .
```

### Executar Container

```bash
docker run -p 3000:3000 \
  --env-file .env \
  --name lor0138 \
  lor0138:latest
```

### Docker Compose

```bash
docker-compose up -d
```

---

## 🔍 Troubleshooting

### Erro: Cannot connect to database

**Sintomas**:
```
❌ USANDO DADOS MOCK
Erro conexão: connection timeout
```

**Soluções**:

1. Verificar rede:
```bash
ping 10.105.0.4
telnet 10.105.0.4 1433
```

2. Verificar credenciais no `.env`

3. Verificar linked servers no SQL Server

4. Aumentar timeout:
```env
DB_CONNECTION_TIMEOUT=600000  # 10 minutos
```

### Erro: Property 'id' does not exist on type 'Request'

**Solução**:
```bash
# Limpar cache TypeScript
rm -rf .ts-node

# Reiniciar servidor
npm run dev
```

### Erro: Port 3000 already in use

**Solução**:
```bash
# Encontrar processo
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
PORT=3001 npm run dev
```

### Logs não aparecem

**Solução**:
```bash
# Verificar permissões
chmod 755 logs/
chmod 644 logs/app.log

# Criar pasta se não existir
mkdir -p logs
```

---

## 📚 Próximos Passos

Após setup completo:

1. ✅ Leia [ARCHITECTURE.md](./ARCHITECTURE.md) - Entenda a arquitetura
2. ✅ Explore [API.md](./API.md) - Veja os endpoints disponíveis
3. ✅ Configure [CACHE-GUIDE.md](./CACHE-GUIDE.md) - Otimize performance
4. ✅ Implemente features - Contribua com o projeto

---

## 🤝 Suporte

Problemas durante setup?

1. Verifique [ARCHITECTURE.md#troubleshooting](./ARCHITECTURE.md#-erros-comuns)
2. Consulte [Issues](https://github.com/seu-usuario/lor0138/issues)
3. Entre em contato com a equipe

---

**Última Atualização**: 2025-01-06
**Mantenedor**: Equipe LOR0138