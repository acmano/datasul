# Logger

> **Sistema centralizado de logging com Winston**

Sistema de logging estruturado e hierárquico com suporte a múltiplos destinos, rotação automática de arquivos e formatação customizada por ambiente.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Níveis de Log](#níveis-de-log)
- [Transportes](#transportes)
- [Formatos](#formatos)
- [Rotação de Arquivos](#rotação-de-arquivos)
- [API](#api)
- [Configuração](#configuração)
- [Exemplos de Uso](#exemplos-de-uso)
- [Integração com Ferramentas](#integração-com-ferramentas)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

### O que é?

**Logger** é um sistema centralizado de logging baseado no [Winston](https://github.com/winstonjs/winston), fornecendo logs estruturados, hierárquicos e persistentes para toda a aplicação.

### Características Principais

- ✅ **Múltiplos Transportes** - Console + arquivos simultâneos
- ✅ **Rotação Automática** - Novos arquivos diariamente
- ✅ **Logs Estruturados** - JSON para fácil parsing
- ✅ **Níveis Hierárquicos** - error > warn > info > http > debug
- ✅ **Contexto Rico** - Dados estruturados em cada log
- ✅ **Colorização** - Console colorido para desenvolvimento
- ✅ **Retenção Configurável** - 14-30 dias de histórico
- ✅ **Type Safe** - Interface TypeScript completa
- ✅ **Performance** - Assíncrono e não-bloqueante
- ✅ **Ambiente-aware** - Comportamento por ambiente

### Quando Usar?

| Cenário | Nível | Exemplo |
|---------|-------|---------|
| **Erro crítico** | `error` | Falha no banco, exceção não tratada |
| **Aviso** | `warn` | Item não encontrado, cache miss |
| **Informação** | `info` | Servidor iniciado, operação concluída |
| **Requisição HTTP** | `http` | GET /api/items, POST /api/users |
| **Debug** | `debug` | Valores de variáveis, fluxo interno |

---

## Níveis de Log

### Hierarquia

```
error (0)  ← Mais crítico
  ↓
warn (1)
  ↓
info (2)   ← Padrão
  ↓
http (3)
  ↓
debug (4)  ← Menos crítico
```

**Funcionamento:**
- Configurar `LOG_LEVEL=warn` → logs warn + error
- Configurar `LOG_LEVEL=info` → logs info + warn + error
- Configurar `LOG_LEVEL=debug` → todos os logs

---

### 1. error (Crítico)

**Quando usar:**
- Falhas que impedem operação normal
- Exceções não tratadas
- Erros de conexão (banco, APIs)
- Timeout crítico
- Falha de configuração

**Exemplo:**
```typescript
log.error('Falha na conexão com banco', {
  error: error.message,
  host: 'sql.server.com',
  port: 1433,
  correlationId: req.id
});
```

**Output (console):**
```
14:30:45 [error] Falha na conexão com banco {"error":"Connection timeout","host":"sql.server.com","port":1433}
```

**Output (arquivo JSON):**
```json
{
  "timestamp": "2025-10-07 14:30:45",
  "level": "error",
  "message": "Falha na conexão com banco",
  "error": "Connection timeout",
  "host": "sql.server.com",
  "port": 1433,
  "correlationId": "abc-123-def"
}
```

---

### 2. warn (Aviso)

**Quando usar:**
- Situações anormais mas não críticas
- Item não encontrado (404)
- Parâmetro deprecated
- Cache miss frequente
- Limite próximo de ser atingido

**Exemplo:**
```typescript
log.warn('Item não encontrado', {
  itemCodigo: '7530110',
  correlationId: req.id
});
```

**Output:**
```
14:30:45 [warn] Item não encontrado {"itemCodigo":"7530110","correlationId":"abc-123"}
```

---

### 3. info (Informação)

**Quando usar:**
- Operação normal do sistema
- Servidor iniciado/parado
- Conexão estabelecida
- Operação concluída com sucesso
- Configuração carregada

**Exemplo:**
```typescript
log.info('Servidor iniciado', {
  port: 3000,
  environment: 'production',
  version: '1.2.3'
});
```

**Output:**
```
14:30:45 [info] Servidor iniciado {"port":3000,"environment":"production","version":"1.2.3"}
```

---

### 4. http (Requisição HTTP)

**Quando usar:**
- Requisições recebidas
- Requisições finalizadas
- Chamadas a APIs externas
- Webhooks

**Exemplo:**
```typescript
log.http('Requisição finalizada', {
  correlationId: req.id,
  method: 'GET',
  url: '/api/items/7530110',
  statusCode: 200,
  duration: 123
});
```

**Output:**
```
14:30:45 [http] Requisição finalizada {"correlationId":"abc-123","method":"GET","url":"/api/items/7530110","statusCode":200,"duration":123}
```

---

### 5. debug (Debug)

**Quando usar:**
- Troubleshooting
- Valores de variáveis
- Fluxo de execução
- Queries SQL
- Estado de objetos

⚠️ **Atenção:** Muito verboso, apenas em desenvolvimento!

**Exemplo:**
```typescript
log.debug('Query executada', {
  sql: 'SELECT * FROM item WHERE codigo = ?',
  params: ['7530110'],
  duration: 45
});
```

**Output:**
```
14:30:45 [debug] Query executada {"sql":"SELECT * FROM item WHERE codigo = ?","params":["7530110"],"duration":45}
```

---

## Transportes

### Visão Geral

**Transportes** são destinos onde os logs são enviados. Winston suporta múltiplos transportes simultâneos.

| Transporte | Ambiente | Formato | Retenção |
|------------|----------|---------|----------|
| **Console** | Todos | Colorido | - |
| **error-*.log** | Dev/Prod | JSON | 30 dias |
| **app-*.log** | Dev/Prod | JSON | 14 dias |

---

### 1. Console

**Propósito:**
- Visualização em tempo real
- Desenvolvimento local
- Logs do Docker/K8s (stdout/stderr)

**Configuração:**
```typescript
new winston.transports.Console({
  format: consoleFormat,  // Colorido e legível
  level: process.env.LOG_LEVEL || 'info'
})
```

**Formato:**
```
HH:mm:ss [level] message {context}
```

**Cores:**
- 🔴 `error` - Vermelho
- 🟡 `warn` - Amarelo
- 🟢 `info` - Verde
- 🔵 `http` - Cyan
- 🟣 `debug` - Azul

**Exemplo:**
```
14:30:45 [info] Servidor iniciado {"port":3000}
14:30:46 [http] GET /api/items {"statusCode":200}
14:30:47 [error] Falha no banco {"error":"Timeout"}
```

---

### 2. error-*.log (Arquivo de Erros)

**Propósito:**
- Logs apenas de erros críticos
- Monitoramento e alertas
- Análise de falhas

**Configuração:**
```typescript
new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat  // JSON
})
```

**Arquivos gerados:**
```
logs/
├── error-2025-10-07.log  ← Hoje
├── error-2025-10-06.log
├── error-2025-10-05.log
└── ...
```

**Formato JSON:**
```json
{
  "timestamp": "2025-10-07 14:30:45",
  "level": "error",
  "message": "Falha na conexão",
  "error": "Connection timeout",
  "host": "sql.server.com",
  "stack": "Error: Connection timeout\n    at ..."
}
```

**Rotação:**
- Novo arquivo à meia-noite (00:00)
- Rotação também ao atingir 20MB
- Deleta arquivos > 30 dias

---

### 3. app-*.log (Arquivo Completo)

**Propósito:**
- Todos os níveis de log
- Histórico completo
- Análise e auditoria

**Configuração:**
```typescript
new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat  // JSON
})
```

**Arquivos gerados:**
```
logs/
├── app-2025-10-07.log  ← Hoje
├── app-2025-10-06.log
├── app-2025-10-05.log
└── ...
```

**Formato JSON:**
```json
{
  "timestamp": "2025-10-07 14:30:45",
  "level": "info",
  "message": "Item processado",
  "itemCodigo": "7530110",
  "duration": 123
}
{
  "timestamp": "2025-10-07 14:30:46",
  "level": "http",
  "message": "GET /api/items",
  "statusCode": 200
}
```

**Rotação:**
- Novo arquivo à meia-noite (00:00)
- Rotação também ao atingir 20MB
- Deleta arquivos > 14 dias

---

### Comparação de Transportes

| Característica | Console | error-*.log | app-*.log |
|----------------|---------|-------------|-----------|
| **Formato** | Colorido | JSON | JSON |
| **Níveis** | Todos | Apenas error | Todos |
| **Persistência** | ❌ | ✅ | ✅ |
| **Retenção** | - | 30 dias | 14 dias |
| **Tamanho max** | - | 20MB | 20MB |
| **Ambiente** | Todos | Dev/Prod | Dev/Prod |
| **Uso** | Dev, Docker | Alertas | Análise |

---

## Formatos

### JSON (Arquivos)

**Propósito:**
- Parsing por ferramentas (ELK, Splunk)
- Busca e filtragem eficiente
- Integração com sistemas de monitoramento

**Estrutura:**
```json
{
  "timestamp": "2025-10-07 14:30:45",
  "level": "error",
  "message": "Mensagem principal",
  "campo1": "valor1",
  "campo2": "valor2",
  "stack": "Error: ...\n    at ..."
}
```

**Campos padrão:**
- `timestamp` - Data/hora (YYYY-MM-DD HH:mm:ss)
- `level` - Nível do log
- `message` - Mensagem principal
- `stack` - Stack trace (apenas em erros)
- `...context` - Campos adicionais do contexto

**Exemplo:**
```typescript
log.error('Falha no processamento', {
  itemCodigo: '7530110',
  error: 'Timeout',
  duration: 5000
});
```

**JSON gerado:**
```json
{
  "timestamp": "2025-10-07 14:30:45",
  "level": "error",
  "message": "Falha no processamento",
  "itemCodigo": "7530110",
  "error": "Timeout",
  "duration": 5000
}
```

---

### Console (Colorido)

**Propósito:**
- Leitura humana
- Desenvolvimento local
- Debug em tempo real

**Formato:**
```
HH:mm:ss [level] message {context}
```

**Cores ANSI:**
- Aplicadas automaticamente por `winston.format.colorize()`
- Suporte a 256 cores em terminais modernos
- Fallback para cores básicas em terminais antigos

**Exemplo:**
```typescript
log.info('Operação concluída', {
  itemCodigo: '7530110',
  duration: 123
});
```

**Output:**
```
14:30:45 [info] Operação concluída {"itemCodigo":"7530110","duration":123}
         ^^^^  ← Verde
```

---

## Rotação de Arquivos

### Estratégia

**DailyRotateFile** do Winston gerencia rotação automática baseada em:
1. **Data** - Novo arquivo à meia-noite
2. **Tamanho** - Novo arquivo ao atingir maxSize

### Configuração

```typescript
new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',      // Padrão de data
  maxSize: '20m',                 // 20 megabytes
  maxFiles: '14d',                // 14 dias
  format: logFormat
})
```

### Padrões de Nome

**%DATE% é substituído pela data:**
```
logs/app-%DATE%.log
        ↓
logs/app-2025-10-07.log
logs/app-2025-10-06.log
logs/app-2025-10-05.log
```

### Rotação por Data

```
00:00:00  Meia-noite
   ↓
   Cria novo arquivo: app-2025-10-07.log
   Continua escrevendo no novo arquivo
   Arquivo anterior: app-2025-10-06.log (fechado)
```

### Rotação por Tamanho

```
app-2025-10-07.log atinge 20MB
   ↓
   Renomeia: app-2025-10-07.1.log
   Cria novo: app-2025-10-07.log
```

### Retenção e Limpeza

**maxFiles controla retenção:**
- `'30d'` - Deleta arquivos > 30 dias
- `'100m'` - Deleta quando total > 100MB
- `'10'` - Mantém últimos 10 arquivos

**Limpeza automática:**
- Executada a cada nova rotação
- Verifica timestamp dos arquivos
- Deleta arquivos que excedem retenção

**Exemplo (maxFiles='14d'):**
```
Hoje: 2025-10-07

logs/
├── app-2025-10-07.log  ✅ Hoje
├── app-2025-10-06.log  ✅ 1 dia
├── app-2025-10-05.log  ✅ 2 dias
├── ...
├── app-2025-09-24.log  ✅ 13 dias
├── app-2025-09-23.log  ✅ 14 dias
└── app-2025-09-22.log  ❌ 15 dias → DELETADO
```

---

## API

### LogContext Interface

Interface para contexto estruturado dos logs.

```typescript
interface LogContext {
  correlationId?: string;
  userId?: string;
  itemCodigo?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;  // Campos adicionais
}
```

**Campos comuns:**
- `correlationId` - UUID para rastrear requisição
- `userId` - ID do usuário autenticado
- `itemCodigo` - Código do item processado
- `ip` - IP do cliente
- `method` - Método HTTP (GET, POST, etc)
- `url` - URL da requisição
- `statusCode` - Status HTTP (200, 404, etc)
- `duration` - Duração em ms

**Extensível:**
- `[key: string]: any` permite campos adicionais
- Adicione qualquer dado relevante dinamicamente

---

### log.error()

Registra erro crítico.

**Assinatura:**
```typescript
log.error(message: string, context?: LogContext): void
```

**Quando usar:**
- Falhas críticas
- Exceções não tratadas
- Erros de conexão
- Timeout crítico

**Exemplo:**
```typescript
try {
  await database.query(sql);
} catch (error) {
  log.error('Falha no banco de dados', {
    error: error.message,
    sql: sql.substring(0, 100),
    correlationId: req.id
  });
  throw error;
}
```

---

### log.warn()

Registra aviso.

**Assinatura:**
```typescript
log.warn(message: string, context?: LogContext): void
```

**Quando usar:**
- Situações anormais
- Item não encontrado
- Parâmetro deprecated
- Cache miss

**Exemplo:**
```typescript
const item = await cache.get(codigo);

if (!item) {
  log.warn('Cache miss', {
    itemCodigo: codigo,
    cacheKey: `item:${codigo}`
  });

  // Busca do banco
  item = await database.getItem(codigo);
}
```

---

### log.info()

Registra informação geral.

**Assinatura:**
```typescript
log.info(message: string, context?: LogContext): void
```

**Quando usar:**
- Operação normal
- Marcos importantes
- Sucesso de operações
- Configuração carregada

**Exemplo:**
```typescript
// Startup
log.info('Servidor iniciado', {
  port: process.env.PORT,
  environment: process.env.NODE_ENV,
  version: packageJson.version
});

// Operação
log.info('Item processado com sucesso', {
  itemCodigo: '7530110',
  duration: 123
});
```

---

### log.http()

Registra requisição HTTP.

**Assinatura:**
```typescript
log.http(message: string, context?: LogContext): void
```

**Quando usar:**
- Todas as requisições HTTP
- Chamadas a APIs externas
- Webhooks

**Exemplo:**
```typescript
// Middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    log.http('Requisição finalizada', {
      correlationId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: Date.now() - startTime
    });
  });

  next();
});
```

---

### log.debug()

Registra informação de debug.

**Assinatura:**
```typescript
log.debug(message: string, context?: LogContext): void
```

**Quando usar:**
- Troubleshooting
- Valores de variáveis
- Fluxo interno
- Queries SQL

⚠️ **Apenas em desenvolvimento!** Muito verboso.

**Exemplo:**
```typescript
log.debug('Executando query', {
  sql: 'SELECT * FROM item WHERE codigo = ?',
  params: [itemCodigo],
  cacheHit: false
});

const result = await database.query(sql, params);

log.debug('Query executada', {
  rowCount: result.length,
  duration: 45
});
```

---

## Configuração

### Variáveis de Ambiente

```bash
# Nível de log (padrão: info)
LOG_LEVEL=info

# Ambiente (afeta transportes)
NODE_ENV=production
```

### Níveis Disponíveis

| LOG_LEVEL | Logs Exibidos |
|-----------|---------------|
| `error` | Apenas errors |
| `warn` | error + warn |
| `info` | error + warn + info (padrão) |
| `http` | error + warn + info + http |
| `debug` | Todos (muito verboso) |

### Por Ambiente

**Desenvolvimento:**
```bash
LOG_LEVEL=debug
NODE_ENV=development
```
- Console + arquivos
- Todos os níveis
- Formato colorido

**Produção:**
```bash
LOG_LEVEL=info
NODE_ENV=production
```
- Console + arquivos
- info, warn, error
- Formato JSON

**Testes:**
```bash
LOG_LEVEL=error
NODE_ENV=test
```
- Apenas console
- Apenas errors
- Mínimo de ruído

---

## Exemplos de Uso

### 1. Logs Básicos

```typescript
import { log } from '@shared/utils/logger';

// Informação simples
log.info('Servidor iniciado');

// Com contexto
log.info('Servidor iniciado', {
  port: 3000,
  environment: 'production'
});

// Erro
log.error('Falha ao conectar', {
  error: error.message
});
```

---

### 2. Middleware de Requisições

```typescript
import { log } from '@shared/utils/logger';

app.use((req, res, next) => {
  const startTime = Date.now();

  // Log de entrada
  log.http('Requisição recebida', {
    correlationId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  // Log de saída
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    log.http('Requisição finalizada', {
      correlationId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration
    });
  });

  next();
});
```

---

### 3. Error Handler

```typescript
import { log } from '@shared/utils/logger';

app.use((error, req, res, next) => {
  log.error('Erro não tratado', {
    correlationId: req.id,
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url
  });

  res.status(500).json({
    error: 'Internal Server Error',
    correlationId: req.id
  });
});
```

---

### 4. Service Layer

```typescript
import { log } from '@shared/utils/logger';

class ItemService {
  static async findByCodigo(codigo: string): Promise<Item> {
    log.debug('Buscando item', { itemCodigo: codigo });

    try {
      const item = await database.getItem(codigo);

      if (!item) {
        log.warn('Item não encontrado', { itemCodigo: codigo });
        throw new ItemNotFoundError(codigo);
      }

      log.info('Item encontrado', {
        itemCodigo: codigo,
        descricao: item.descricao
      });

      return item;
    } catch (error) {
      log.error('Erro ao buscar item', {
        itemCodigo: codigo,
        error: error.message
      });
      throw error;
    }
  }
}
```

---

### 5. Startup e Shutdown

```typescript
import { log } from '@shared/utils/logger';

// Startup
const server = app.listen(PORT, () => {
  log.info('🚀 Servidor iniciado', {
    port: PORT,
    environment: NODE_ENV,
    version: packageJson.version,
    pid: process.pid
  });
});

// Shutdown
setupGracefulShutdown(server, {
  onShutdownStart: () => {
    log.info('🛑 Iniciando shutdown gracioso');
  },

  onShutdownComplete: () => {
    log.info('✅ Shutdown completo');
  }
});
```

---

### 6. Cache Operations

```typescript
import { log } from '@shared/utils/logger';

class CacheService {
  static async get(key: string): Promise<any> {
    const value = await cache.get(key);

    if (value) {
      log.debug('Cache hit', { key });
      return value;
    } else {
      log.debug('Cache miss', { key });
      return null;
    }
  }

  static async invalidate(pattern: string): Promise<void> {
    const keys = await cache.keys(pattern);

    log.info('Invalidando cache', {
      pattern,
      keysCount: keys.length
    });

    await cache.deleteMany(keys);
  }
}
```

---

## Integração com Ferramentas

### ELK Stack (Elasticsearch, Logstash, Kibana)

**1. Filebeat (coleta logs):**
```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /app/logs/app-*.log
  json.keys_under_root: true
  json.add_error_key: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "app-logs-%{+yyyy.MM.dd}"
```

**2. Elasticsearch (armazena):**
```json
PUT /app-logs-2025.10.07/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "level": "error" } },
        { "range": { "timestamp": { "gte": "now-1h" } } }
      ]
    }
  }
}
```

**3. Kibana (visualiza):**
- Dashboard com gráficos de erros por hora
- Filtros por nível, correlationId, statusCode
- Alertas quando error rate > threshold

---

### Splunk

**1. Universal Forwarder:**
```ini
# inputs.conf
[monitor:///app/logs/app-*.log]
sourcetype = json
index = app_logs
```

**2. Search Query:**
```spl
index=app_logs level=error
| stats count by error
| sort -count
```

**3. Alert:**
```spl
index=app_logs level=error
| stats count as error_count
| where error_count > 100
```

---

### CloudWatch Logs (AWS)

**1. CloudWatch Agent:**
```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/app/logs/app-*.log",
            "log_group_name": "/aws/app/logs",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
```

**2. Log Insights Query:**
```
fields @timestamp, level, message, correlationId
| filter level = "error"
| stats count() by message
| sort count desc
```

---

### Datadog

**1. Agent Configuration:**
```yaml
# datadog.yaml
logs_enabled: true
logs_config:
  - type: file
    path: /app/logs/app-*.log
    service: api-server
    source: nodejs
    sourcecategory: sourcecode
```

**2. Dashboard:**
- Logs by level (pie chart)
- Error rate over time (line chart)
- Top 10 errors (table)
- Latency distribution (histogram)

---

## Boas Práticas

### ✅ DO

**1. Use níveis apropriados**
```typescript
// ✅ Correto
log.error('Falha crítica', { error });
log.warn('Item não encontrado', { itemCodigo });
log.info('Operação concluída', { duration });
log.debug('Valor da variável', { value });
```

**2. Inclua contexto relevante**
```typescript
// ✅ Contexto rico
log.error('Falha no processamento', {
  correlationId: req.id,
  itemCodigo: item.codigo,
  error: error.message,
  stack: error.stack,
  duration: Date.now() - startTime
});
```

**3. Use correlationId**
```typescript
// ✅ Rastreamento entre serviços
log.info('Requisição recebida', {
  correlationId: req.id  // Mesmo ID em todos os logs
});
```

**4. Log entrada e saída de operações**
```typescript
// ✅ Rastreamento completo
log.info('Processando item', { itemCodigo });
// ... processamento ...
log.info('Item processado', { itemCodigo, duration });
```

**5. Capture exceções**
```typescript
// ✅ Log + re-throw
try {
  await operation();
} catch (error) {
  log.error('Operação falhou', { error: error.message });
  throw error;  // Re-lança para error handler
}
```

---

### ❌ DON'T

**1. Não logue dados sensíveis**
```typescript
// ❌ Senha em texto plano
log.info('Login', { username, password });

// ✅ Sem dados sensíveis
log.info('Login', { username });
```

**2. Não logue em excesso**
```typescript
// ❌ Log em loop
items.forEach(item => {
  log.info('Processando', { item });  // 10k logs!
});

// ✅ Log resumido
log.info('Processando itens', { count: items.length });
```

**3. Não use console.log**
```typescript
// ❌ Console.log direto
console.log('Item processado', item);

// ✅ Use logger
log.info('Item processado', { itemCodigo: item.codigo });
```

**4. Não ignore erros**
```typescript
// ❌ Erro silencioso
try {
  await operation();
} catch (error) {
  // Nada... ❌
}

// ✅ Sempre logue
try {
  await operation();
} catch (error) {
  log.error('Operação falhou', { error: error.message });
  throw error;
}
```

**5. Não misture formatos**
```typescript
// ❌ String concatenada
log.info('Item: ' + item.codigo);

// ✅ Contexto estruturado
log.info('Item processado', { itemCodigo: item.codigo });
```

---

## Troubleshooting

### Logs não aparecem

**Sintomas:**
- Nenhum log é exibido
- Arquivos não são criados

**Verificar:**
```bash
# 1. LOG_LEVEL está correto?
echo $LOG_LEVEL

# 2. Diretório logs/ existe?
ls -la logs/

# 3. Permissões corretas?
ls -la logs/
# Deve ter permissão de escrita

# 4. Espaço em disco?
df -h
```

**Solução:**
```typescript
// Forçar nível debug
process.env.LOG_LEVEL = 'debug';

// Verificar se logger foi importado
import { log } from '@shared/utils/logger';
log.info('Teste');
```

---

### Logs duplicados

**Sintomas:**
- Cada log aparece 2x ou mais
- Arquivos crescem muito rápido

**Causa:**
- Logger inicializado múltiplas vezes
- Múltiplos transportes iguais

**Solução:**
```typescript
// ❌ Evite criar novo logger
const newLogger = winston.createLogger(...);

// ✅ Use singleton exportado
import { log } from '@shared/utils/logger';
```

---

### Arquivos muito grandes

**Sintomas:**
- Arquivos de log com 100MB+
- Disco cheio

**Causa:**
- maxSize muito alto
- maxFiles muito alto
- Debug em produção

**Solução:**
```bash
# 1. Verificar configuração
# maxSize: 20m (OK)
# maxFiles: 14d (OK)

# 2. Verificar nível de log
echo $LOG_LEVEL
# Se debug → mudar para info

# 3. Limpar logs antigos manualmente
find logs/ -name "*.log" -mtime +30 -delete
```

---

### Performance degradada

**Sintomas:**
- Aplicação lenta
- CPU alta
- Muita I/O de disco

**Causa:**
- Log em excesso (debug em produção)
- Logs síncronos (bloqueantes)

**Solução:**
```bash
# 1. Reduzir nível de log
LOG_LEVEL=info  # ou warn

# 2. Verificar logs por segundo
tail -f logs/app-*.log | wc -l
# Se > 1000/s → problema

# 3. Reduzir logs desnecessários
# Remover logs em loops
# Usar log.debug() para detalhes
```

---

### Stack traces incompletas

**Sintomas:**
- Erro logado sem stack trace
- Difícil identificar origem

**Causa:**
- Erro não é Error object
- Stack não é capturado

**Solução:**
```typescript
// ❌ String como erro
throw 'Erro';

// ✅ Error object
throw new Error('Erro descritivo');

// ✅ Capturar stack
try {
  await operation();
} catch (error) {
  log.error('Falha', {
    error: error.message,
    stack: error.stack  // Sempre incluir
  });
}
```

---

## Referências

### Arquivos Relacionados

- `app.ts` - Setup do servidor
- `errorHandler.middleware.ts` - Error handling
- `requestLogger.middleware.ts` - HTTP logging
- `server.ts` - Inicialização

### Bibliotecas

- [Winston](https://github.com/winstonjs/winston) - Logger principal
- [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file) - Rotação de arquivos
- [winston-transport](https://github.com/winstonjs/winston-transport) - Interface de transporte

### Ferramentas de Análise

- [Elasticsearch](https://www.elastic.co/elasticsearch/) - Search e analytics
- [Kibana](https://www.elastic.co/kibana/) - Visualização
- [Splunk](https://www.splunk.com/) - Analytics platform
- [Datadog](https://www.datadoghq.com/) - Monitoring
- [CloudWatch](https://aws.amazon.com/cloudwatch/) - AWS logging

### Conceitos

- **Log Level** - Hierarquia de severidade
- **Transport** - Destino dos logs
- **Structured Logging** - Logs em formato estruturado (JSON)
- **Log Rotation** - Rotação automática de arquivos
- **Log Aggregation** - Centralização de logs
- **Correlation ID** - Rastreamento de requisições

---

**Última atualização:** 2025-10-07