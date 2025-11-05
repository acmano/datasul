# LordtsAPI Backend

Backend Node.js + TypeScript - API REST para consulta de dados Datasul (Sistema LOR0138)

## 🚀 Tecnologias

- Node.js v24+
- TypeScript
- Express
- SQL Server (mssql) / ODBC (Progress OpenEdge)
- Redis (cache distribuído)
- Elasticsearch (logging centralizado)
- PM2 (process manager)

## ✨ Recursos

- ✅ **Multi-connection support** - 28 conexões totais:
  - 22 conexões ODBC (18 Datasul + 4 Informix)
  - 6 conexões SQL Server (4 PCFactory + 2 Corporativo)
- ✅ **Unified query API** - API única para ODBC e SQL Server com syntax sugar helpers
- ✅ **Environment-based configuration** - Produção, Teste, Homologação, Desenvolvimento
- ✅ **Connection pooling** - Gerenciamento automático de conexões
- ✅ **Health checks** - Monitoramento individual de todas as 28 conexões
- ✅ **Cache distribuído** - Redis com estratégia em camadas
- ✅ **Logging centralizado** - Elasticsearch com ILM
- ✅ **Métricas** - Prometheus para observabilidade
- ✅ **API Documentation** - Swagger/OpenAPI
- ✅ **Type-safe** - TypeScript com validação em runtime

## 📦 Instalação

### Configuração do GitHub Packages

Este projeto usa o pacote privado `@acmano/lordtsapi-shared-types` hospedado no GitHub Packages. Para instalar as dependências, você precisa configurar a autenticação:

#### 1. Crie um Personal Access Token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" > "Generate new token (classic)"
3. Configure o token:
   - **Note**: "NPM Package Read Access" (ou nome descritivo)
   - **Expiration**: Escolha a validade (recomendado: 90 dias)
   - **Scopes**: Marque apenas `read:packages`
4. Clique em "Generate token" e copie o token gerado

#### 2. Configure o arquivo .npmrc local

```bash
# Copie o arquivo de exemplo
cp .npmrc.example .npmrc

# Edite o .npmrc e substitua ${GITHUB_TOKEN} pelo seu token
# Exemplo de conteúdo final:
# @acmano:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=ghp_SEU_TOKEN_AQUI
```

**IMPORTANTE:**
- NUNCA commit o arquivo `.npmrc` (ele já está no .gitignore)
- Mantenha seu token seguro e privado
- Renove o token antes do vencimento

#### 3. Instale as dependências

```bash
npm install
```

## ⚙️ Configuração

Copie `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

### Variáveis Principais

- **Database**: `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_CONNECTION_TYPE`
- **Environment**: `DATASUL_ENVIRONMENT`, `INFORMIX_ENVIRONMENT`
- **Cache**: `CACHE_ENABLED`, `CACHE_REDIS_URL`, `CACHE_STRATEGY`
- **Elasticsearch**: `ELASTICSEARCH_ENABLED`, `ELASTICSEARCH_NODE`

### Multi-Connection Setup

Configure qual ambiente usar para cada sistema:

```bash
# .env

# Datasul environment (ODBC - production, test, homologation)
DATASUL_ENVIRONMENT=production

# Informix environment (ODBC - development, atualização, new, production)
INFORMIX_ENVIRONMENT=production

# PCFactory environment (SQL Server - production, development)
PCFACTORY_ENVIRONMENT=production

# Corporativo environment (SQL Server - production, development)
CORPORATIVO_ENVIRONMENT=production

# Connection type (odbc recommended for Datasul/Informix)
DB_CONNECTION_TYPE=odbc
```

**Ambientes disponíveis:**

**Datasul (ODBC):**
- `production` - Ambiente de produção (padrão)
- `test` - Ambiente de testes
- `homologation` - Ambiente de homologação

**Informix (ODBC):**
- `production` - Ambiente de produção (padrão)
- `development` - Ambiente de desenvolvimento
- `atualização` - Ambiente de atualização
- `new` - Ambiente novo

**PCFactory MES (SQL Server):**
- `production` - Ambiente de produção (padrão)
- `development` - Ambiente de desenvolvimento

**Corporativo Lorenzetti (SQL Server):**
- `production` - Ambiente de produção (padrão)
- `development` - Ambiente de desenvolvimento

## 🔧 Desenvolvimento

```bash
npm run dev
```

## 🏗️ Build

```bash
npm run build
```

## 🚀 Produção

```bash
npm start
```

## 📝 Testes

```bash
npm test
npm run test:coverage
npm run test:mutation
```

## 📊 Logging e Monitoramento

### Elasticsearch Integration

Todos os logs da aplicação são automaticamente enviados para o Elasticsearch para análise centralizada e monitoramento.

**Configuração:**

```bash
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_NODE=https://10.105.0.56:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=sua_senha
```

**Recursos:**
- ✅ Logs estruturados com correlationId para rastreamento de requisições
- ✅ Índices diários com rotação automática (`lordtsapi-logs-YYYY.MM.DD`)
- ✅ Gestão automática de ciclo de vida (ILM):
  - **0-7 dias**: HOT (alta performance)
  - **7-14 dias**: WARM (otimizado)
  - **14-30 dias**: COLD (readonly)
  - **30+ dias**: Deletado automaticamente

**Consultar logs:**

```bash
# Via curl
curl -k -u "elastic:senha" "https://10.105.0.56:9200/lordtsapi-logs-*/_search?pretty&size=10"

# Via script de teste
./scripts/test-elasticsearch.sh
```

**Documentação completa:** [`docs/ELASTICSEARCH_LOGGING.md`](docs/ELASTICSEARCH_LOGGING.md)

### Métricas Prometheus

Endpoint de métricas disponível em `/metrics` para integração com Prometheus/Grafana.

## 📚 API Documentation

Acesse `/api-docs` quando o servidor estiver rodando para ver a documentação Swagger.

### Principais Endpoints

#### Engenharia
- **`GET /api/engenharia/estrutura/informacoesGerais/:itemCodigo`** - Estrutura de produtos (BOM) com processos de fabricação
  - Retorna árvore recursiva de componentes com operações, tempos e custos
  - Suporta parâmetro `dataReferencia` para consultas históricas
  - Documentação: [`src/engenharia/estrutura/informacoesGerais/README.md`](src/engenharia/estrutura/informacoesGerais/README.md)
  - Requer: Stored procedure `usp_ExplodeEstruturaEProcessos_JSON`

#### Itens
- **`GET /api/item/dadosCadastrais/informacoesGerais/:itemCodigo`** - Informações gerais do item
- **`GET /api/item/dadosCadastrais/dimensoes/:itemCodigo`** - Dimensões do item
- **`GET /api/item/dadosCadastrais/fiscal/:itemCodigo`** - Informações fiscais
- **`GET /api/item/dadosCadastrais/manufatura/:itemCodigo`** - Dados de manufatura
- **`GET /api/item/dadosCadastrais/planejamento/:itemCodigo`** - Planejamento
- **`GET /api/item/search`** - Busca de itens

#### Famílias
- **`GET /api/familia/dadosCadastrais/informacoesGerais/:familiaCodigo`** - Informações da família
- **`GET /api/familia`** - Lista famílias

#### Famílias Comerciais
- **`GET /api/familiaComercial/dadosCadastrais/informacoesGerais/:codigo`** - Informações da família comercial
- **`GET /api/familiaComercial`** - Lista famílias comerciais

#### Grupos de Estoque
- **`GET /api/grupoDeEstoque/dadosCadastrais/informacoesGerais/:codigo`** - Informações do grupo
- **`GET /api/grupoDeEstoque`** - Lista grupos de estoque

#### Estabelecimentos
- **`GET /api/estabelecimento/dadosCadastrais/informacoesGerais/:codigo`** - Informações do estabelecimento

#### Administração
- **`GET /health`** - Health check geral
- **`GET /metrics`** - Métricas Prometheus
- **`GET /admin/cache/stats`** - Estatísticas de cache
- **`POST /admin/cache/clear`** - Limpar cache

#### Connection Health Checks (NOVO)
- **`GET /health/connections`** - Status de todas as 28 conexões (22 ODBC + 6 SQL Server)
- **`GET /health/connections/:dsn`** - Status de conexão específica
  - Exemplos: DtsPrdEmp (ODBC), PCF4_PRD (SQL Server), DATACORP_PRD (SQL Server)
- **`GET /health/connections/environment/:env`** - Status por ambiente
  - Suporta: production, test, homologation, development
- **`GET /health/connections/system/:system`** - Status por sistema
  - Suporta: datasul, informix, pcfactory, corporativo
- **`GET /health/connections/active`** - Conexões ativas no pool
- **`POST /health/connections/cache/clear`** - Limpar cache de health checks
- **`GET /health/connections/cache/stats`** - Estatísticas do cache de health checks

## 🔌 Connection Management

### Visão Geral

O sistema gerencia **28 conexões de banco de dados** organizadas por sistema e ambiente:

**18 Conexões Datasul (ODBC):**
- **Produção** (6 databases): EMP, MULT, ADT, ESP, EMS5, FND
- **Teste** (6 databases): EMP, MULT, ADT, ESP, EMS5, FND
- **Homologação** (6 databases): EMP, MULT, ADT, ESP, EMS5, FND

**4 Conexões Informix (ODBC):**
- Development, Atualização, New, Production

**4 Conexões PCFactory MES (SQL Server):**
- **Produção**: Sistema (PCF4_PRD), Integração (PCF_Integ_PRD)
- **Desenvolvimento**: Sistema (PCF4_DEV), Integração (PCF_Integ_DEV)

**2 Conexões Corporativo Lorenzetti (SQL Server):**
- **Produção**: DATACORP_PRD
- **Desenvolvimento**: DATACORP_DEV

### Conexões Disponíveis

#### Datasul Production (189.126.146.38)
```
DtsPrdEmp   - Empresa           (porta 40002)
DtsPrdMult  - Múltiplas Empresas (porta 40004)
DtsPrdAdt   - Auditoria         (porta 40001)
DtsPrdEsp   - Especial          (porta 40003)
DtsPrdEms5  - EMS5              (porta 40006)
DtsPrdFnd   - Foundation        (porta 40007)
```

#### Datasul Test (189.126.146.71)
```
DtsTstEmp   - Empresa           (porta 41002)
DtsTstMult  - Múltiplas Empresas (porta 41004)
DtsTstAdt   - Auditoria         (porta 41001)
DtsTstEsp   - Especial          (porta 41003)
DtsTstEms5  - EMS5              (porta 41006)
DtsTstFnd   - Foundation        (porta 41007)
```

#### Datasul Homologation (189.126.146.135)
```
DtsHmlEmp   - Empresa           (porta 42002)
DtsHmlMult  - Múltiplas Empresas (porta 42004)
DtsHmlAdt   - Auditoria         (porta 42001)
DtsHmlEsp   - Especial          (porta 42003)
DtsHmlEms5  - EMS5              (porta 42006)
DtsHmlFnd   - Foundation        (porta 42007)
```

#### Informix
```
LgxDev - Development  (10.1.0.84:3515)
LgxAtu - Atualização  (10.1.0.84:3516)
LgxNew - New          (10.1.0.84:3517)
LgxPrd - Production   (10.105.0.39:5511)
```

#### PCFactory MES (SQL Server)
```
PCF4_PRD       - Production Sistema     (T-SRVSQL2022-01\mes, DB: PCF4_PRD)
PCF_Integ_PRD  - Production Integração  (T-SRVSQL2022-01\mes, DB: PCF_Integ_PRD)
PCF4_DEV       - Development Sistema    (T-SRVSQL2022-01\mes, DB: PCF4_DEV)
PCF_Integ_DEV  - Development Integração (T-SRVSQL2022-01\mes, DB: PCF_Integ_DEV)
```

#### Corporativo Lorenzetti (SQL Server)
```
DATACORP_PRD - Production   (T-SRVSQL2022-01\LOREN, DB: DATACORP)
DATACORP_DEV - Development  (T-SRVSQLDEV2022-01\LOREN, DB: DATACORP)
```

### Como Usar

#### Trocar entre ambientes

Edite o arquivo `.env`:

```bash
# Para usar ambiente de TESTE
DATASUL_ENVIRONMENT=test

# Para usar ambiente de HOMOLOGAÇÃO
DATASUL_ENVIRONMENT=homologation

# Para usar ambiente de PRODUÇÃO (padrão)
DATASUL_ENVIRONMENT=production
```

#### Verificar status das conexões

```bash
# Todas as conexões
curl http://localhost:3000/health/connections

# Conexão específica
curl http://localhost:3000/health/connections/DtsPrdEmp

# Ambiente específico
curl http://localhost:3000/health/connections/environment/production

# Sistema específico
curl http://localhost:3000/health/connections/system/datasul
```

#### Exemplo de resposta

```json
{
  "success": true,
  "timestamp": "2025-10-24T10:30:00.000Z",
  "connections": [
    {
      "dsn": "DtsPrdEmp",
      "description": "Datasul Production - Empresa",
      "systemType": "datasul",
      "environment": "production",
      "purpose": "emp",
      "connected": true,
      "responseTime": 45,
      "hostname": "189.126.146.38",
      "port": 40002
    }
  ],
  "summary": {
    "total": 28,
    "odbc": 22,
    "sqlserver": 6,
    "healthy": 27,
    "unhealthy": 1,
    "healthPercentage": 96.43
  }
}
```

### Para Desenvolvedores

#### Usar conexão específica no código

**Datasul/Informix (ODBC):**
```typescript
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

// Método 1: Por DSN direto
const result = await DatabaseManager.queryWithConnection(
  'DtsPrdEmp',
  'SELECT * FROM item WHERE "it-codigo" = ?',
  [{ name: 'codigo', type: 'varchar', value: '7530110' }]
);

// Método 2: Por ambiente (usa DATASUL_ENVIRONMENT do .env)
const connection = await DatabaseManager.getConnectionByEnvironment(
  'datasul',
  'production',
  'emp'
);
const result = await connection.queryWithParams(sql, params);

// Método 3: Syntax sugar helper (MAIS LIMPO!)
const result = await DatabaseManager.datasul.emp.query(
  'SELECT * FROM item WHERE "it-codigo" = ?',
  [{ name: 'codigo', type: 'varchar', value: '7530110' }]
);
```

**PCFactory (SQL Server):**
```typescript
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

// Método 1: Por connection name
const result = await DatabaseManager.queryWithConnection(
  'PCF4_PRD',
  'SELECT * FROM Orders WHERE OrderID = @id',
  [{ name: 'id', type: 'int', value: 12345 }]
);

// Método 2: Por contexto (RECOMENDADO)
const result = await DatabaseManager.queryByContext(
  { system: 'pcfactory', purpose: 'sistema' },
  'SELECT * FROM Orders WHERE OrderID = @id',
  [{ name: 'id', type: 'int', value: 12345 }]
);

// Método 3: Syntax sugar helper (MAIS LIMPO!)
const result = await DatabaseManager.pcfactory.sistema.query(
  'SELECT * FROM Orders WHERE OrderID = @id',
  [{ name: 'id', type: 'int', value: 12345 }]
);
```

**Corporativo (SQL Server):**
```typescript
// Syntax sugar helper (MAIS LIMPO!)
const result = await DatabaseManager.corporativo.query(
  'SELECT * FROM Employees WHERE EmployeeID = @id',
  [{ name: 'id', type: 'int', value: 100 }]
);
```

#### Gerenciar pool de conexões

```typescript
// Listar conexões ativas
const active = DatabaseManager.getActiveConnections();
console.log('Conexões ativas:', active.length);

// Fechar conexão específica
await DatabaseManager.closeConnection('DtsTstEmp');

// Fechar todas as conexões
await DatabaseManager.closeAllConnections();

// Health check de conexão
const health = await DatabaseManager.healthCheckConnection('DtsPrdEmp');
console.log('Conectado:', health.connected, 'Tempo:', health.responseTime, 'ms');
```

### Recursos

- **Lazy initialization**: Conexões criadas apenas quando usadas
- **Connection pooling**: Reutilização automática de conexões
- **Health monitoring**: Verificação de saúde individual por conexão
- **Environment switching**: Troca fácil entre ambientes via .env
- **Automatic cleanup**: Fechamento automático de conexões idle
- **Metrics**: Instrumentação completa com Prometheus

## 🔗 Dependências

- `@acmano/lordtsapi-shared-types` - Tipos compartilhados

## 📖 Documentação Adicional

- [Elasticsearch Logging](docs/ELASTICSEARCH_LOGGING.md) - Integração com Elasticsearch
- [GitHub Packages Security](docs/GITHUB_PACKAGES_SECURITY.md) - Guia completo de segurança para pacotes privados
- [CLAUDE.md](CLAUDE.md) - Guia para desenvolvimento com Claude Code

## 🤝 Contribuindo

1. Siga as convenções de código do projeto
2. Execute testes antes de commitar: `npm run test`
3. Mantenha cobertura de testes acima de 75%
4. Use commits convencionais (feat:, fix:, docs:, etc.)

## 📄 Licença

ISC
