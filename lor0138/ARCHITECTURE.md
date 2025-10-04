# ARCHITECTURE.md - Projeto LOR0138

## 📋 Visão Geral

API REST para consulta de dados do ERP Totvs Datasul (Progress OpenEdge) através de SQL Server com Linked Server.

---

## 🏗️ Arquitetura de Configuração

### ⚠️ CRÍTICO: Dois Arquivos de Configuração

O projeto possui **dois arquivos** de configuração de banco de dados:

| Arquivo | Usado Por | Função `parseTimeout` |
|---------|-----------|----------------------|
| `sqlServerConfig.ts` | **DatabaseManager** ✅ | ❌ NÃO (usa `parseInt` direto) |
| `env.config.ts` | ConfigValidator, app.ts | ✅ SIM (converte '30s' → 30000) |

**IMPORTANTE:** O `DatabaseManager` usa `sqlServerConfig.ts`, que **NÃO tem** a função `parseTimeout()`. Ele usa `parseInt()` diretamente.

---

## 🔧 Configuração do .env

### Formato Correto das Variáveis

```env
# ✅ CORRETO: Timeouts em MILISSEGUNDOS puros
DB_CONNECTION_TIMEOUT=500000
DB_REQUEST_TIMEOUT=30000

# ❌ ERRADO: sqlServerConfig.ts não entende 's'
DB_CONNECTION_TIMEOUT=500s
DB_REQUEST_TIMEOUT=30s
```

**Por quê?** `parseInt('30s')` retorna `30` (30ms de timeout - impossível!)

### Senha com Caracteres Especiais

```env
# ✅ CORRETO: Aspas simples para senha com #
DB_PASSWORD='#dcloren#'

# ❌ ERRADO: # é interpretado como comentário
DB_PASSWORD=#dcloren#

# ❌ ERRADO: Aspas duplas são incluídas na senha
DB_PASSWORD="#dcloren#"
```

### Database Vazio = Database Padrão do Usuário

```env
# ✅ CORRETO: Vazio usa database padrão do SQL Server user
DB_DATABASE_EMP=
DB_DATABASE_MULT=

# ❌ ERRADO: Força database específico (pode não ter permissão)
DB_DATABASE_EMP=emp
DB_DATABASE_MULT=mult
```

**Por quê?** Quando vazio, o SQL Server conecta no database padrão configurado para o usuário `dcloren`.

### Variáveis de Ambiente Corretas

```env
# ✅ CORRETO
DB_DATABASE_EMP=        # Usado por sqlServerConfig.ts
DB_DATABASE_MULT=       # Usado por sqlServerConfig.ts

# ❌ ERRADO (não é usado pelo DatabaseManager)
DB_NAME_EMP=emp         # Usado por env.config.ts (não usado!)
DB_NAME_MULT=mult       # Usado por env.config.ts (não usado!)
```

### CORS

```env
# ✅ CORRETO
CORS_ALLOWED_ORIGINS=http://lor0138.lorenzetti.ibe:3000

# ❌ ERRADO (nome antigo)
CORS_ORIGIN=http://lor0138.lorenzetti.ibe:3000
```

---

## 🗄️ Estrutura do Banco de Dados

### Linked Server

```
SQL Server (10.105.0.4\LOREN)
  └── Linked Server: PRD_EMS2EMP (Progress OpenEdge)
       └── Database: emp
            └── Schema: pub
                 └── Tables:
                      ├── item
                      ├── item-uni-estab
                      └── estabelec
  
  └── Linked Server: PRD_EMS2MULT (Progress OpenEdge)
       └── Database: mult
            └── Schema: pub
                 └── Tables:
                      └── estabelec
```

### Queries com OPENQUERY

```sql
-- Sempre use OPENQUERY para acessar Progress
SELECT * FROM OPENQUERY(
  PRD_EMS2EMP,
  'SELECT item."it-codigo" FROM pub.item WHERE ...'
)
```

**NÃO use** queries diretas como:
```sql
-- ❌ ERRADO - Não funciona bem com Progress
SELECT * FROM PRD_EMS2EMP.emp.pub.item
```

---

## 🔒 Segurança - SQL Injection

### ✅ Sempre Use Queries Parametrizadas

```typescript
// ✅ CORRETO
const query = `
  DECLARE @itemCodigo varchar(16) = @paramItemCodigo;
  DECLARE @sql nvarchar(max);
  SET @sql = N'SELECT * FROM OPENQUERY(...) WHERE codigo = ''' + @itemCodigo + '''';
  EXEC sp_executesql @sql;
`;

const params = [
  { name: 'paramItemCodigo', type: 'varchar', value: itemCodigo }
];

await DatabaseManager.queryEmpWithParams(query, params);
```

```typescript
// ❌ ERRADO - SQL Injection
const query = `SELECT * FROM OPENQUERY(...) WHERE codigo = '${itemCodigo}'`;
await DatabaseManager.queryEmp(query);
```

---

## 🚀 Inicialização da Aplicação

### Ordem de Execução (server.ts)

1. **Validação de Configurações** (ConfigValidator) - Fail Fast
2. **Inicialização do Banco** (DatabaseManager)
3. **Inicialização do Express** (App)
4. **Setup de Graceful Shutdown**

### Fallback para Mock Data

Se a conexão com banco falhar:
- Sistema **não falha**
- Usa `MockConnection` automaticamente
- Loga aviso: `⚠️ USANDO DADOS MOCK`
- API continua funcionando com dados falsos

---

## 📂 Estrutura de Pastas

```
src/
├── api/lor0138/item/dadosCadastrais/informacoesGerais/
│   ├── controller/         # Camada de controle
│   ├── service/           # Lógica de negócio
│   ├── repository/        # Acesso a dados
│   ├── validators/        # Validação de entrada
│   ├── types/            # TypeScript types
│   └── routes/           # Definição de rotas
│
├── infrastructure/database/
│   ├── connections/      # SqlServerConnection, OdbcConnection, MockConnection
│   ├── config/          # sqlServerConfig.ts, odbcConfig.ts
│   ├── types/           # Interfaces
│   └── DatabaseManager.ts  # Singleton para gerenciar conexões
│
├── config/
│   ├── env.config.ts        # ⚠️ NÃO usado pelo DatabaseManager
│   ├── configValidator.ts   # Validação de .env
│   └── swagger.config.ts    # Documentação API
│
└── shared/
    ├── utils/logger.ts      # Winston logger
    └── middlewares/         # Express middlewares
```

---

## 🛣️ Rotas da API

### Padrão de URL

```
/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo
```

**NÃO** use kebab-case:
```
❌ /api/lor0138/item/:itemCodigo/dados-cadastrais/informacoes-gerais
```

### Implementação no app.ts

```typescript
// ✅ CORRETO: Base path sem :itemCodigo
this.app.use(
  '/api/lor0138/item/dadosCadastrais/informacoesGerais', 
  informacoesGeraisRoutes
);

// O :itemCodigo está no router interno (informacoesGerais.routes.ts)
router.get('/:itemCodigo', controller);
```

---

## ⏱️ Timeouts

### Configuração por Tipo

| Tipo | Valor Recomendado | Uso |
|------|------------------|-----|
| `DB_CONNECTION_TIMEOUT` | 15000-30000 ms | Conectar ao SQL Server |
| `DB_REQUEST_TIMEOUT` | 30000-60000 ms | Executar queries |
| `HTTP_REQUEST_TIMEOUT` | 30000 ms | Timeout de requisições HTTP |
| `HTTP_HEALTH_TIMEOUT` | 5000 ms | Health check (deve ser rápido) |

### ⚠️ Formato Específico por Arquivo

```env
# sqlServerConfig.ts (usa parseInt)
DB_CONNECTION_TIMEOUT=30000  # milissegundos puros
DB_REQUEST_TIMEOUT=30000     # milissegundos puros

# env.config.ts (usa parseTimeout)
HTTP_REQUEST_TIMEOUT=30s     # aceita 's', 'ms', ou número
HTTP_HEALTH_TIMEOUT=5s
```

---

## 📊 Logging

### Winston Configuração

- **Development:** Console + arquivos em `logs/`
- **Production:** Apenas arquivos em `logs/` (rotação diária)
- **Test:** Apenas console

### Níveis de Log

```typescript
log.error('mensagem', { context });  // Erros críticos
log.warn('mensagem', { context });   // Avisos
log.info('mensagem', { context });   // Info geral
log.http('mensagem', { context });   // Requisições HTTP
log.debug('mensagem', { context });  // Debug detalhado
```

### Contexto de Request

```typescript
{
  requestId: string,    // UUID único da requisição
  method: string,       // GET, POST, etc
  url: string,
  statusCode: number,
  duration: number,     // ms
  userAgent: string
}
```

---

## 🧪 Testing

### Health Check

```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "responseTime": 12,
    "status": "healthy",
    "type": "sqlserver"
  }
}
```

### API de Teste

```bash
curl http://localhost:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110
```

---

## 🐛 Troubleshooting

### ❌ "Login failed for user 'dcloren'"

**Causas possíveis:**
1. Senha com `#` não está entre aspas simples no `.env`
2. Database forçado (`emp`/`mult`) sem permissão
3. Timeout muito baixo (parseInt de '30s' = 30ms)

**Solução:**
```env
DB_PASSWORD='#dcloren#'
DB_DATABASE_EMP=
DB_DATABASE_MULT=
DB_REQUEST_TIMEOUT=30000
```

### ❌ "Timeout: Request failed to complete in 30ms"

**Causa:** `sqlServerConfig.ts` recebeu string com 's' ao invés de número

**Solução:**
```env
DB_REQUEST_TIMEOUT=30000  # não '30s'
```

### ❌ Usando MOCK_DATA

**Causa:** Falha na conexão com banco

**Debug:**
1. Verifique logs: `Erro conexão: ...`
2. Teste conexão manual: `sqlcmd -S "10.105.0.4\LOREN" -U dcloren -P '#dcloren#'`
3. Verifique credenciais no `.env`

### ❌ Logs não são criados

**Solução:**
```bash
mkdir -p logs
```

Winston cria a pasta automaticamente na versão atualizada do logger.

---

## 📦 Cache e Build

### Limpeza de Cache

```bash
# Limpa cache do ts-node-dev
rm -rf .ts-node

# Limpa cache do node_modules
rm -rf node_modules/.cache

# Mata processos Node antigos
pkill -9 node
```

### Variáveis de Ambiente em Cache

```bash
# Verifica se há variáveis no sistema
env | grep DB_

# Remove se houver
unset DB_DATABASE_EMP
unset DB_DATABASE_MULT
```

---

## 🔄 Graceful Shutdown

### Sinais Capturados

- `SIGTERM` - Shutdown por sistema
- `SIGINT` - Ctrl+C

### Processo

1. Para de aceitar novas conexões HTTP
2. Aguarda requisições ativas finalizarem
3. Fecha conexões do banco de dados
4. Timeout de 10s (força encerramento se travar)

---

## 📝 Commits Recomendados

### Mensagens Úteis

```bash
git commit -m "fix: corrigido timeout usando ms ao invés de 's'"
git commit -m "fix: senha com # agora usa aspas simples"
git commit -m "docs: adicionado ARCHITECTURE.md"
git commit -m "feat: implementado endpoint de informações gerais"
```

### Sempre Faça Backup Antes de Mudanças

```bash
git add .
git commit -m "backup antes de mudanças em X"
```

---

## 🚨 Erros Comuns e Como Evitar

### 1. Confundir Arquivos de Config

❌ **Erro:** Modificar `env.config.ts` achando que afeta o DatabaseManager  
✅ **Correto:** Modificar `sqlServerConfig.ts` para mudanças de banco

### 2. Formato Errado de Timeout

❌ **Erro:** Usar `'30s'` em variáveis lidas por `parseInt`  
✅ **Correto:** Usar `30000` (milissegundos) em `DB_*_TIMEOUT`

### 3. Senha com # sem Aspas

❌ **Erro:** `DB_PASSWORD=#senha#` (dotenv ignora - é comentário)  
✅ **Correto:** `DB_PASSWORD='#senha#'` (aspas simples)

### 4. Database Hardcoded

❌ **Erro:** Forçar `DB_DATABASE_EMP=emp`  
✅ **Correto:** Deixar vazio `DB_DATABASE_EMP=` (usa default do user)

---

## 📚 Referências

- [Progress OpenEdge](https://docs.progress.com/bundle/openedge-117)
- [SQL Server Linked Servers](https://learn.microsoft.com/en-us/sql/relational-databases/linked-servers/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

## 🔄 Histórico de Mudanças Críticas

### 2025-01-04 - Correção de Timeouts e Autenticação
- **PROBLEMA:** Timeouts em formato '30s' interpretados como 30ms por `parseInt()`
- **SOLUÇÃO:** Usar milissegundos puros (30000) em `DB_*_TIMEOUT`
- **PROBLEMA:** Senha com # interpretada como comentário no .env
- **SOLUÇÃO:** Usar aspas simples: `DB_PASSWORD='#senha#'`
- **ARQUIVOS:** `.env`, `sqlServerConfig.ts`, `logger.ts`

---

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Timeouts em milissegundos (não 's')
- [ ] Senha com caracteres especiais entre aspas simples
- [ ] Database vazio para usar default do usuário
- [ ] Pasta `logs/` criada
- [ ] Health check retorna `healthy`
- [ ] API retorna dados reais (não MOCK)
- [ ] Logs sendo gravados em arquivo
- [ ] Graceful shutdown funcionando (Ctrl+C)

---

**Última atualização:** 2025-01-04  
**Mantenedor:** Projeto LOR0138