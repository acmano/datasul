# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- **Endpoint de Estrutura de Produtos (BOM) com Processos de Fabricação**
  - Novo endpoint `GET /api/engenharia/estrutura/informacoesGerais/:itemCodigo`
  - Retorna árvore recursiva completa de componentes (Bill of Materials)
  - Inclui processos de fabricação de cada item (operações, tempos, recursos)
  - Cálculo automático de horas (homem + máquina) considerando quantidade acumulada
  - Resumo de horas por centro de custo
  - Suporte a data de referência para consultas históricas
  - Stored procedure SQL Server: `usp_ExplodeEstruturaEProcessos_JSON`
  - Documentação completa: `src/engenharia/estrutura/informacoesGerais/README.md`
  - Exemplos de uso: `src/engenharia/estrutura/informacoesGerais/EXAMPLE.md`
  - Testes unitários com cobertura completa

- **Integração completa com Elasticsearch para logging centralizado**
  - Winston transport configurado para enviar todos os logs para Elasticsearch
  - Logs estruturados com correlationId, método HTTP, URL, statusCode, duration
  - Suporte para HTTPS e autenticação
  - Template de índice customizado para otimizar mapeamento de campos
  - Índices diários no formato `lordtsapi-logs-YYYY.MM.DD`

- **Gestão automática de ciclo de vida dos logs (ILM)**
  - Fase HOT (0-7 dias): Alta performance, prioridade 100
  - Fase WARM (7-14 dias): Otimização com forcemerge e shrink
  - Fase COLD (14-30 dias): Readonly, baixa prioridade
  - Fase DELETE (30+ dias): Remoção automática dos logs antigos

- **Documentação completa da integração Elasticsearch**
  - Arquivo `docs/ELASTICSEARCH_LOGGING.md` com guias detalhados
  - Exemplos de queries KQL úteis para busca de logs
  - Instruções para configuração de dashboards no Kibana
  - Troubleshooting e otimizações

- **Scripts e ferramentas de suporte**
  - `scripts/test-elasticsearch.sh`: Script para validar integração
  - `elasticsearch-index-template.json`: Template de índice
  - `elasticsearch-ilm-policy.json`: Política de ciclo de vida

### Changed

- Atualizado `.env.example` com variáveis de configuração do Elasticsearch

### Fixed

- **Endpoint de Busca de Itens (`/api/item/search`)**
  - Corrigido problema crítico onde filtros não eram aplicados dentro do OPENQUERY
  - Query agora aplica filtros diretamente no banco Progress para melhor performance
  - Validador atualizado para aceitar wildcards (`*` e `%`) no campo `codigo`
  - Busca por código exato, wildcards, família comercial e todos os filtros agora funcionam corretamente
  - Adicionada sanitização de SQL injection com escape de aspas simples
  - Limite de TOP 100 aplicado no OPENQUERY para evitar timeout
  - Arquivo modificado: `src/item/search/repository.ts`, `src/item/search/validators.ts`
- Logger Winston agora envia logs de nível `info` ou superior para Elasticsearch
- Serialização melhorada de objetos complexos em logs para evitar erros de mapeamento

### Technical Details

- Pacotes instalados:
  - `@elastic/elasticsearch@8.11.0` - Cliente oficial do Elasticsearch
  - `winston-elasticsearch@0.19.0` - Transport do Winston para Elasticsearch

- Compatibilidade:
  - Elasticsearch 8.x
  - Certificados SSL auto-assinados suportados
  - Autenticação Basic Auth configurável

---

## [1.0.0] - 2024-01-01

### Added
- Versão inicial do projeto
- API REST para consulta de dados Datasul
- Integração com SQL Server
- Cache com Redis
- Métricas Prometheus
- Documentação Swagger

[Unreleased]: https://github.com/acmano/lordtsapiBackend/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/acmano/lordtsapiBackend/releases/tag/v1.0.0
