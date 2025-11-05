# Integração com Elasticsearch para Logging

## Visão Geral

O sistema LordtsAPI foi integrado com Elasticsearch para persistência centralizada de logs. Todos os logs gerados pela aplicação são automaticamente enviados para o Elasticsearch, permitindo:

- **Centralização**: Logs de todas as instâncias em um único local
- **Busca avançada**: Consultas complexas sobre os logs
- **Visualização**: Integração com Kibana para dashboards
- **Retenção**: Políticas de retenção configuráveis por índice
- **Performance**: Busca e agregação rápida de logs

## Arquitetura

```
Aplicação (Winston Logger)
    ↓
    ├─→ Console Transport (desenvolvimento)
    ├─→ File Transport (backup local)
    └─→ Elasticsearch Transport (persistência centralizada)
            ↓
        Elasticsearch Cluster
            ↓
        Kibana (visualização)
```

## Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis no seu arquivo `.env`:

```bash
# Habilitar envio de logs para Elasticsearch
ELASTICSEARCH_ENABLED=true

# URL do nó Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# Autenticação (opcional)
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# Prefixo do índice (será criado com padrão: prefix-YYYY.MM.DD)
ELASTICSEARCH_INDEX_PREFIX=lordtsapi-logs

# Configurações avançadas (opcional)
ELASTICSEARCH_MAX_RETRIES=3
ELASTICSEARCH_REQUEST_TIMEOUT=30000
ELASTICSEARCH_SNIFF_ON_START=false
ELASTICSEARCH_SNIFF_INTERVAL=300000
```

### 2. Formato dos Logs

Os logs são enviados para o Elasticsearch no seguinte formato:

```json
{
  "@timestamp": "2025-10-21T11:30:00.000Z",
  "severity": "info",
  "message": "Request received",
  "fields": {
    "correlationId": "abc-123-def-456",
    "method": "GET",
    "url": "/api/item/ABC123",
    "statusCode": 200,
    "duration": 125,
    "application": "lordtsapi",
    "environment": "production",
    "hostname": "server-01"
  }
}
```

### 3. Índices

Os logs são armazenados em índices diários seguindo o padrão:

```
lordtsapi-logs-2025.10.21
lordtsapi-logs-2025.10.22
lordtsapi-logs-2025.10.23
...
```

## Instalação do Elasticsearch

### Usando Docker (Recomendado)

```bash
# Elasticsearch + Kibana
docker-compose up -d elasticsearch kibana
```

Arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: lordtsapi-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - lordtsapi-network

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: lordtsapi-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    networks:
      - lordtsapi-network

volumes:
  elasticsearch-data:
    driver: local

networks:
  lordtsapi-network:
    driver: bridge
```

### Instalação Local (Linux)

```bash
# Download
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.11.0-linux-x86_64.tar.gz
tar -xzf elasticsearch-8.11.0-linux-x86_64.tar.gz
cd elasticsearch-8.11.0

# Configuração
echo "xpack.security.enabled: false" >> config/elasticsearch.yml

# Iniciar
./bin/elasticsearch
```

## Uso

### Verificar Status

Endpoint de health check:

```bash
curl http://localhost:3000/health
```

Resposta:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T11:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": { "status": "ok" },
    "memory": { "status": "ok" },
    "disk": { "status": "ok" },
    "elasticsearch": {
      "status": "ok",
      "available": true,
      "version": "8.11.0",
      "clusterName": "elasticsearch"
    }
  }
}
```

### Consultar Logs no Elasticsearch

#### Via curl:

```bash
# Buscar todos os logs do dia atual
curl -X GET "http://localhost:9200/lordtsapi-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match_all": {}
  },
  "size": 10,
  "sort": [
    { "@timestamp": { "order": "desc" } }
  ]
}
'

# Buscar erros
curl -X GET "http://localhost:9200/lordtsapi-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "term": { "severity": "error" }
  }
}
'

# Buscar por correlationId
curl -X GET "http://localhost:9200/lordtsapi-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": { "fields.correlationId": "abc-123-def-456" }
  }
}
'
```

#### Via Kibana:

1. Acesse: `http://localhost:5601`
2. Menu → Stack Management → Index Patterns
3. Criar index pattern: `lordtsapi-logs-*`
4. Timestamp field: `@timestamp`
5. Menu → Discover → Explorar logs

## Kibana Dashboards

### Dashboard Sugerido: Overview de Logs

**Visualizações:**

1. **Requests por Minuto** (Line Chart)
   - Eixo X: @timestamp
   - Eixo Y: Count

2. **Status Codes** (Pie Chart)
   - Slice by: fields.statusCode

3. **Top Endpoints** (Data Table)
   - Rows: fields.url
   - Metrics: Count

4. **Tempo de Resposta Médio** (Gauge)
   - Metric: Average fields.duration

5. **Erros Recentes** (Data Table)
   - Filter: severity = "error"
   - Columns: @timestamp, message, fields.correlationId

### Queries KQL Úteis

```kql
# Todos os erros
severity: "error"

# Requests lentos (>1s)
fields.duration > 1000

# Endpoint específico
fields.url: "/api/item/*"

# Por método HTTP
fields.method: "POST"

# Range de tempo
@timestamp >= now-1h

# Combinações
severity: "error" AND fields.url: "/api/item/*"
```

## Políticas de Retenção

### Index Lifecycle Management (ILM)

Crie uma política para rotação e exclusão automática:

```bash
# Criar política (manter 30 dias)
curl -X PUT "http://localhost:9200/_ilm/policy/lordtsapi-logs-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_size": "5GB"
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

# Aplicar ao template de índice
curl -X PUT "http://localhost:9200/_index_template/lordtsapi-logs-template" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["lordtsapi-logs-*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "lordtsapi-logs-policy"
    }
  }
}
'
```

## Troubleshooting

### Elasticsearch não conecta

```bash
# Verificar se está rodando
curl http://localhost:9200

# Verificar logs do container
docker logs lordtsapi-elasticsearch

# Verificar configuração
cat .env | grep ELASTICSEARCH
```

### Logs não aparecem no Elasticsearch

1. Verificar variável `ELASTICSEARCH_ENABLED=true`
2. Verificar health check: `curl http://localhost:3000/health`
3. Verificar logs da aplicação: `tail -f logs/app-*.log`
4. Testar conexão manual:

```bash
curl -X POST "http://localhost:9200/test-index/_doc" -H 'Content-Type: application/json' -d'
{
  "message": "test"
}
'
```

### Índices crescendo muito

1. Ajustar LOG_LEVEL (menos logs = menos espaço)
2. Implementar ILM (ver seção acima)
3. Usar filtros no winston para não logar tudo:

```typescript
// Exemplo: não logar health checks
if (req.url === '/health') {
  return; // Skip logging
}
```

## Performance

### Otimizações

1. **Bulk Indexing**: winston-elasticsearch já faz batch automático
2. **Async**: Logs não bloqueiam requests
3. **Circuit Breaker**: Se ES cair, logs vão apenas para arquivo
4. **Buffers**: Configurar `bufferLimit` no transport:

```typescript
new ElasticsearchTransport({
  bufferLimit: 100, // Envia a cada 100 logs ou 5s
  // ...
})
```

## Alertas

### Exemplo com Kibana Alerts

1. Menu → Stack Management → Rules and Connectors
2. Create rule → Logs threshold
3. Condições:
   - Document count > 100
   - severity = "error"
   - Últimos 5 minutos
4. Ação: Email, Slack, Webhook, etc.

## Segurança

### Habilitar Autenticação

No Elasticsearch:

```yaml
# elasticsearch.yml
xpack.security.enabled: true
```

Criar usuário:

```bash
./bin/elasticsearch-users useradd lordtsapi -p senha123 -r superuser
```

No .env:

```bash
ELASTICSEARCH_USERNAME=lordtsapi
ELASTICSEARCH_PASSWORD=senha123
```

### HTTPS

```yaml
# elasticsearch.yml
xpack.security.http.ssl.enabled: true
xpack.security.http.ssl.keystore.path: certs/http.p12
```

No .env:

```bash
ELASTICSEARCH_NODE=https://localhost:9200
```

## Monitoramento

### Métricas Importantes

1. **Indexing Rate**: Logs/segundo sendo indexados
2. **Search Rate**: Consultas/segundo
3. **Disk Usage**: Espaço usado pelos índices
4. **Cluster Health**: Green/Yellow/Red

```bash
# Status do cluster
curl http://localhost:9200/_cluster/health?pretty

# Estatísticas dos índices
curl http://localhost:9200/_cat/indices/lordtsapi-logs-*?v

# Uso de disco
curl http://localhost:9200/_cat/allocation?v
```

## Referências

- [Elasticsearch Official Docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [winston-elasticsearch](https://github.com/vanthome/winston-elasticsearch)
- [Kibana User Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Index Lifecycle Management](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html)

## Contato

Para dúvidas ou problemas com a integração Elasticsearch, contate o time de DevOps.
