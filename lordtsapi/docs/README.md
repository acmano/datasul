# 📚 Documentação - Projeto LOR0138

> API REST para consulta de dados do ERP Totvs Datasul via SQL Server

---

## 🎯 Início Rápido

| Você é... | Comece aqui |
|-----------|-------------|
| **Novo desenvolvedor** | [ARCHITECTURE.md](./ARCHITECTURE.md) → [SETUP.md](./SETUP.md) |
| **DevOps/Deploy** | [DEPLOYMENT.md](./DEPLOYMENT.md) → [DOCKER.md](./DOCKER.md) |
| **Testador/QA** | [TESTING.md](./TESTING.md) → [LOAD-TESTING.md](./LOAD-TESTING.md) |
| **Usuário da API** | [API.md](./API.md) → Swagger: `/api-docs` |
| **Troubleshooting** | [ARCHITECTURE.md](./ARCHITECTURE.md#-erros-comuns) |

---

## 📖 Documentação Completa

### 🏗️ Arquitetura e Fundamentos

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura do sistema, pontos críticos e fluxos
- **[SETUP.md](./SETUP.md)** - Setup do ambiente de desenvolvimento
- **[PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)** - Estrutura de diretórios e responsabilidades

### 🔧 Configuração

- **[ENV-CONFIG.md](./ENV-CONFIG.md)** - Guia completo de variáveis de ambiente
- **[DATABASE-CONFIG.md](./DATABASE-CONFIG.md)** - Configuração de bancos de dados

### 🚀 Features e Funcionalidades

- **[CACHE-GUIDE.md](./CACHE-GUIDE.md)** - Sistema de cache em camadas (L1 + L2)
- **[API_Key_Rate_Limit.md](./API_Key_Rate_Limit.md)** - Autenticação e rate limiting
- **[GRACEFUL-SHUTDOWN-GUIDE.md](./GRACEFUL-SHUTDOWN-GUIDE.md)** - Shutdown gracioso
- **[CORRELATION-ID-GUIDE.md](./CORRELATION-ID-GUIDE.md)** - Request tracing
- **[RETRY-GUIDE.md](./RETRY-GUIDE.md)** - Retry com backoff exponencial
- **[METRICS-GUIDE.md](./METRICS-GUIDE.md)** - Sistema de métricas Prometheus

### 📡 API

- **[API.md](./API.md)** - Documentação completa da API REST
- **[SWAGGER.md](./SWAGGER.md)** - Uso da documentação interativa

### 🧪 Testes

- **[TESTING.md](./TESTING.md)** - Estratégia geral de testes
- **[UNIT-TESTING.md](./UNIT-TESTING.md)** - Testes unitários com Jest
- **[INTEGRATION-TESTING.md](./INTEGRATION-TESTING.md)** - Testes de integração
- **[LOAD-TESTING.md](./LOAD-TESTING.md)** - Testes de carga com k6
- **[MUTATION_TESTING.md](./MUTATION_TESTING.md)** - Mutation testing

### 🚢 Deploy e Operações

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guia de deploy
- **[DOCKER.md](./DOCKER.md)** - Containerização com Docker
- **[KUBERNETES.md](./KUBERNETES.md)** - Deploy em Kubernetes
- **[MONITORING.md](./MONITORING.md)** - Monitoramento e observabilidade

### ✅ Checklists

- **[CHECKLIST_CORRELATION.md](./CHECKLIST_CORRELATION.md)** - Implementação de Correlation ID
- **[CHECKLIST_CACHE.md](./CHECKLIST_CACHE.md)** - Implementação de Cache
- **[CHECKLIST_DEPLOY.md](./CHECKLIST_DEPLOY.md)** - Deploy em produção

### 📝 Histórico

- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico de mudanças do projeto

---

## 🔍 Documentos por Categoria

### Para Desenvolvimento

```
ARCHITECTURE.md      → Entenda a arquitetura
PROJECT-STRUCTURE.md → Navegue pelo código
SETUP.md             → Configure seu ambiente
TESTING.md           → Escreva testes
```

### Para Deploy

```
ENV-CONFIG.md        → Configure variáveis
DEPLOYMENT.md        → Deploy passo a passo
DOCKER.md            → Use containers
MONITORING.md        → Monitore em produção
```

### Para Troubleshooting

```
ARCHITECTURE.md      → Erros comuns e soluções
DATABASE-CONFIG.md   → Problemas de conexão
LOGS.md              → Interprete logs
MONITORING.md        → Debug em produção
```

---

## 🆘 Troubleshooting Rápido

### Problema de Conexão DB

1. Verifique `.env` → [ENV-CONFIG.md](./ENV-CONFIG.md)
2. Teste conexão → [DATABASE-CONFIG.md](./DATABASE-CONFIG.md)
3. Veja logs → [ARCHITECTURE.md](./ARCHITECTURE.md#-logging)

### API Retornando Erros

1. Verifique health check: `GET /health`
2. Veja logs: `tail -f logs/app.log`
3. Consulte [API.md](./API.md#-erros-comuns)

### Performance Ruim

1. Verifique cache → [CACHE-GUIDE.md](./CACHE-GUIDE.md)
2. Execute load test → [LOAD-TESTING.md](./LOAD-TESTING.md)
3. Monitore métricas → [MONITORING.md](./MONITORING.md)

---

## 📚 Recursos Externos

### Documentação Oficial

- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Jest](https://jestjs.io/docs/getting-started)
- [Prometheus](https://prometheus.io/docs/introduction/overview/)

### Progress/Datasul

- [Progress OpenEdge](https://docs.progress.com/bundle/openedge-117)
- [SQL Server Linked Servers](https://learn.microsoft.com/en-us/sql/relational-databases/linked-servers/)

### Ferramentas

- [k6 Load Testing](https://k6.io/docs/)
- [Docker](https://docs.docker.com/)
- [Kubernetes](https://kubernetes.io/docs/)

---

## 🤝 Contribuindo

Para contribuir com a documentação:

1. Siga o template existente
2. Mantenha consistência de formato
3. Adicione exemplos práticos
4. Atualize o índice (este arquivo)
5. Teste as instruções

### Template de Documento

```markdown
# Título do Documento

> Breve descrição de uma linha

## 📋 Visão Geral

Descrição detalhada...

## 🎯 Como Usar

Instruções passo a passo...

## 💡 Exemplos

Exemplos práticos...

## ⚠️ Pontos Críticos

Avisos importantes...

## 🔗 Ver Também

- [Documento Relacionado](./relacionado.md)
```

---

## 📊 Status da Documentação

| Documento | Status | Última Atualização |
|-----------|--------|-------------------|
| ARCHITECTURE.md | ✅ Completo | 2025-01-06 |
| SETUP.md | ✅ Completo | 2025-01-06 |
| API.md | ✅ Completo | 2025-01-06 |
| CACHE-GUIDE.md | ✅ Completo | 2025-01-06 |
| TESTING.md | ✅ Completo | 2025-01-06 |
| DEPLOYMENT.md | ✅ Completo | 2025-01-06 |
| CHANGELOG.md | ✅ Completo | 2025-01-06 |

---

## 🔄 Manutenção

Esta documentação é mantida junto com o código e deve ser atualizada a cada:

- ✅ Nova feature implementada
- ✅ Mudança na arquitetura
- ✅ Novo processo de deploy
- ✅ Correção de bug crítico

**Mantenedor**: Equipe LOR0138
**Última Revisão**: 2025-01-06