# Multi-Region Failover Documentation

**Sistema de failover automático entre múltiplas regiões de banco de dados.**

## Visão Geral

O sistema de Multi-Region Failover permite configurar réplicas de banco de dados em múltiplas regiões (ou sites) e automaticamente fazer failover quando a região primária falha.

**Características:**
- ✅ Failover automático baseado em contagem de falhas
- ✅ Failback automático quando a primária se recupera
- ✅ Health checks em background para regiões falhadas
- ✅ Suporte a múltiplas regiões (primary, secondary, tertiary, ...)
- ✅ Políticas de failover configuráveis por grupo
- ✅ Métricas Prometheus para monitoramento
- ✅ Eventos de failover/failback para alertas
- ✅ Suporte a read replicas (read-only)

## Conceitos

### Connection Group

Um **connection group** é um grupo lógico de conexões de banco de dados que representam o mesmo database em diferentes regiões.

**Exemplo:**
```typescript
{
  groupId: 'datasul-emp',
  description: 'Datasul Empresa database',
  regions: [
    { connectionId: 'DtsPrdEmp', region: 'sao-paulo', priority: PRIMARY },
    { connectionId: 'DtsPrdEmpRJ', region: 'rio-janeiro', priority: SECONDARY },
    { connectionId: 'DtsPrdEmpSC', region: 'santa-catarina', priority: TERTIARY }
  ],
  currentRegion: 'DtsPrdEmp',
  failoverPolicy: { ... }
}
```

### Failover Policy

Define como e quando o failover deve acontecer:

```typescript
{
  maxFailures: 5,              // Número de falhas antes de fazer failover
  failureWindow: 60000,        // Janela de tempo para contar falhas (60s)
  healthCheckInterval: 30000,  // Intervalo de health check (30s)
  failbackDelay: 300000,       // Delay antes de failback (5 minutos)
  autoFailback: true           // Failback automático para primária
}
```

**Lógica:**
- Se `maxFailures` falhas ocorrerem dentro de `failureWindow` ms, faz failover
- Após failover, inicia health check a cada `healthCheckInterval` ms
- Quando a primária se recuperar, aguarda `failbackDelay` ms antes de failback
- Se `autoFailback` for false, failback deve ser manual

## Configuração

### 1. Criar Réplicas de Banco de Dados

**IMPORTANTE:** O código implementa a lógica de failover, mas você precisa configurar as réplicas físicas primeiro.

**Opções de Replicação:**

#### Opção A: Progress OpenEdge Replication
```bash
# Configure replication set no Progress
# Primary: 189.126.146.38:40002 (DtsPrdEmp)
# Secondary: IP_DA_REPLICA:40002 (DtsPrdEmpRJ)

# 1. Configure replication broker
proserve -repl -rpname repl_broker

# 2. Start replication agent
dsrutil -C enablesiterepai primary-db

# 3. Configure failover database
dsrutil -C addsiterepl secondary-db
```

#### Opção B: SQL Server Linked Server com Replicas
```sql
-- Se você usar Linked Server do SQL Server para Progress:
-- 1. Configure database mirroring ou AlwaysOn
-- 2. Crie Linked Servers apontando para cada replica
-- 3. Adicione DSNs no /etc/odbc.ini
```

### 2. Adicionar DSNs das Réplicas

**Edite `/etc/odbc.ini`:**

```ini
# Réplica no Rio de Janeiro
[DtsPrdEmpRJ]
Description = Datasul Production EMP - Replica RJ
Driver = /usr/dlc/odbc/lib/pgoe27.so
Host = IP_DA_REPLICA_RJ
Port = 40002
Database = ems2emp
ServerType = Progress
```

### 3. Adicionar Configuração em connections.config.ts

**Edite `src/config/connections.config.ts`:**

```typescript
// Adicione a configuração da réplica
const datasulProductionEmpRJ: ConnectionConfig = {
  dsn: 'DtsPrdEmpRJ',
  description: 'Datasul Production - Empresa (Replica RJ)',
  systemType: SystemType.DATASUL,
  environment: EnvironmentType.PRODUCTION,
  purpose: DatasulDatabaseType.EMP,
  hostname: 'IP_DA_REPLICA_RJ',
  port: 40002,
  database: 'ems2emp',
  metadata: {
    readOnly: true,  // Se for read replica
    driver: DATASUL_DRIVER,
    defaultSchema: 'pub',
    useWideCharacterTypes: true,
  },
};
```

### 4. Configurar Connection Group

**Edite `src/config/multiRegion.config.ts`:**

```typescript
import { ConnectionGroup, RegionPriority } from '@infrastructure/database/multiRegion/types';

export const connectionGroups: ConnectionGroup[] = [
  {
    groupId: 'datasul-emp',
    description: 'Datasul Empresa database with multi-region failover',
    regions: [
      {
        connectionId: 'DtsPrdEmp',
        region: 'sao-paulo',
        priority: RegionPriority.PRIMARY,
        latencyMs: 10,
        readOnly: false,
      },
      {
        connectionId: 'DtsPrdEmpRJ',
        region: 'rio-janeiro',
        priority: RegionPriority.SECONDARY,
        latencyMs: 50,
        readOnly: true,
      },
    ],
    currentRegion: 'DtsPrdEmp',
    failoverPolicy: {
      maxFailures: 5,
      failureWindow: 60000,
      healthCheckInterval: 30000,
      failbackDelay: 300000,
      autoFailback: true,
    },
  },
];
```

### 5. Habilitar Multi-Region

**Edite `.env`:**

```bash
# Habilitar multi-region failover
MULTI_REGION_ENABLED=true

# Auto failback para primária quando recuperar
MULTI_REGION_AUTO_FAILBACK=true

# Intervalo de health check (30 segundos)
MULTI_REGION_HEALTH_CHECK_INTERVAL=30000
```

## Uso

### Query com Failover Automático

```typescript
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

// Query que automaticamente faz failover se a primária falhar
const items = await DatabaseManager.queryWithFailover(
  'datasul-emp',  // Connection group ID
  'SELECT * FROM item WHERE "it-codigo" = ?',
  [{ name: 'codigo', type: 'varchar', value: '7530110' }]
);
```

**Como funciona:**

1. Executa query na região `DtsPrdEmp` (primária)
2. Se falhar, incrementa contador de falhas
3. Se atingir `maxFailures` (5), faz failover para `DtsPrdEmpRJ` (secundária)
4. Retorna resultado da secundária automaticamente
5. Inicia health check na primária
6. Quando primária recuperar, faz failback automaticamente

### Eventos de Failover

```typescript
import { failoverEvents } from '@infrastructure/database/multiRegion/FailoverEvents';

// Subscribe to failover events
failoverEvents.onFailover((event) => {
  console.log(`FAILOVER: ${event.from} -> ${event.to}`);

  // Send alert
  alerting.sendCritical(`Database failover to ${event.to}`, {
    groupId: event.groupId,
    reason: event.reason,
    timestamp: event.timestamp
  });
});

// Subscribe to failback events
failoverEvents.onFailback((event) => {
  console.log(`FAILBACK: ${event.from} -> ${event.to}`);

  alerting.sendInfo(`Database failed back to primary: ${event.to}`);
});
```

### Forçar Failover Manual

```typescript
import { connectionGroupRegistry } from '@infrastructure/database/multiRegion/ConnectionGroups';

// Simulate failures to trigger failover
const group = connectionGroupRegistry.getGroup('datasul-emp');

for (let i = 0; i <= group.failoverPolicy.maxFailures; i++) {
  await connectionGroupRegistry.recordFailure(
    'datasul-emp',
    'DtsPrdEmp',
    new Error('Manual failover')
  );
}

// Now queries will use secondary
const current = connectionGroupRegistry.getCurrentConnection('datasul-emp');
console.log(current); // 'DtsPrdEmpRJ'
```

## Monitoramento

### Métricas Prometheus

```prometheus
# Total de failovers
lor0138_multi_region_failovers_total{group="datasul-emp", from="DtsPrdEmp", to="DtsPrdEmpRJ"}

# Total de failbacks
lor0138_multi_region_failbacks_total{group="datasul-emp", to="DtsPrdEmp"}

# Região atual (1=primary, 2=secondary, 3=tertiary)
lor0138_multi_region_current_region{group="datasul-emp", region="DtsPrdEmp"}

# Queries por região
lor0138_multi_region_queries_total{group="datasul-emp", region="DtsPrdEmp"}
lor0138_multi_region_queries_success{group="datasul-emp", region="DtsPrdEmp"}
lor0138_multi_region_queries_failed{group="datasul-emp", region="DtsPrdEmp"}

# Health status por região (1=healthy, 0=unhealthy)
lor0138_multi_region_region_health{group="datasul-emp", region="DtsPrdEmp"}
```

### Alertas Grafana

```yaml
# alert-rules.yml
groups:
  - name: database-failover
    interval: 30s
    rules:
      # Alert when failover happens
      - alert: DatabaseFailoverOccurred
        expr: increase(lor0138_multi_region_failovers_total[5m]) > 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Database failover occurred"
          description: "Failover from {{ $labels.from }} to {{ $labels.to }}"

      # Alert when primary is unhealthy
      - alert: DatabasePrimaryUnhealthy
        expr: lor0138_multi_region_region_health{region="DtsPrdEmp"} == 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Primary database unhealthy"
          description: "Primary region {{ $labels.region }} is unhealthy"
```

## Cenários de Uso

### Cenário 1: Failover Simples (Primary → Secondary)

**Situação:** Primária em São Paulo fica indisponível

```
1. Query falha na primária 5 vezes em 60 segundos
2. Sistema detecta: 5 failures >= maxFailures (5)
3. Failover automático para secundária (Rio de Janeiro)
4. Health check inicia na primária a cada 30 segundos
5. Quando primária recuperar, aguarda 5 minutos (failbackDelay)
6. Failback automático para primária
```

### Cenário 2: Multiple Failovers (Primary → Secondary → Tertiary)

**Situação:** Primária E secundária ficam indisponíveis

```
1. Primary fails → failover to secondary
2. Secondary fails → failover to tertiary
3. System now using tertiary (Santa Catarina)
4. Health checks running on primary and secondary
5. When primary recovers → failback to primary (highest priority)
```

### Cenário 3: Read Replica (Read-only)

**Situação:** Secundária é read-only replica

```typescript
{
  connectionId: 'DtsPrdEmpRJ',
  region: 'rio-janeiro',
  priority: RegionPriority.SECONDARY,
  readOnly: true,  // Read replica
}
```

**Comportamento:**
- SELECT queries funcionam normalmente
- INSERT/UPDATE/DELETE retornam erro se executados na replica
- Failback automático quando primária (read-write) recuperar

### Cenário 4: DR (Disaster Recovery)

**Situação:** Site DR em outra cidade

```typescript
{
  groupId: 'datasul-emp-dr',
  description: 'Datasul EMP with DR failover',
  regions: [
    { connectionId: 'DtsPrdEmp', region: 'primary-site', priority: PRIMARY },
    { connectionId: 'DtsPrdEmpDR', region: 'dr-site', priority: SECONDARY, readOnly: false }
  ],
  failoverPolicy: {
    maxFailures: 3,
    failureWindow: 30000,
    healthCheckInterval: 60000,
    failbackDelay: 600000,  // 10 minutes
    autoFailback: false  // Manual failback for DR
  }
}
```

## Limitações e Considerações

### 1. Consistency (Consistência)

**⚠️ IMPORTANTE:** Multi-region failover NÃO garante consistência transacional.

**Problemas potenciais:**
- **Replication lag**: Replica pode estar atrasada em relação à primária
- **Split-brain**: Se failover acontecer durante escrita, pode perder dados
- **Eventual consistency**: Réplicas são eventualmente consistentes

**Soluções:**
- Use **read replicas** para SELECTs (não escreva em replicas)
- Configure **synchronous replication** se precisar de consistência forte
- Implemente **idempotency** nas escritas
- Monitore **replication lag** com métricas

### 2. Configuração de Réplicas

**⚠️ O código NÃO cria as réplicas automaticamente!**

Você precisa:
1. Configurar replicação de banco (Progress, SQL Server, etc)
2. Criar DSNs no `/etc/odbc.ini`
3. Adicionar configs no `connections.config.ts`
4. Testar conectividade para todas as réplicas

### 3. Network Partitions

**⚠️ Network partition pode causar split-brain**

**Exemplo:**
```
Primary: São Paulo (operacional, mas rede caiu)
Secondary: Rio (recebe failover)

Problema: Ambas estão operacionais mas isoladas!
```

**Solução:**
- Use **fencing** para garantir que apenas uma região está ativa
- Monitore network connectivity separadamente
- Implemente **quorum** se tiver 3+ regiões

### 4. Performance

**⚠️ Failover adiciona overhead**

**Custos:**
- Latência adicional em health checks
- Overhead de contagem de falhas
- Delay em retry entre regiões

**Otimizações:**
- Ajuste `failureWindow` para evitar false positives
- Configure `healthCheckInterval` adequadamente
- Use `readOnly: true` para read replicas (menos overhead)

## Troubleshooting

### Problema: Failover não acontece

**Diagnóstico:**
```bash
# Verificar se multi-region está habilitado
grep MULTI_REGION_ENABLED .env

# Verificar logs
tail -f logs/app.log | grep -i failover

# Verificar métricas
curl http://localhost:3000/metrics | grep multi_region
```

**Soluções:**
1. Verificar `MULTI_REGION_ENABLED=true` no `.env`
2. Verificar se connection group está registrado
3. Verificar se `maxFailures` não está muito alto

### Problema: Failback não acontece

**Diagnóstico:**
```bash
# Verificar se auto failback está habilitado
grep MULTI_REGION_AUTO_FAILBACK .env

# Verificar se primária está healthy
curl http://localhost:3000/health/connections/DtsPrdEmp
```

**Soluções:**
1. Verificar `MULTI_REGION_AUTO_FAILBACK=true`
2. Verificar se `failbackDelay` não é muito longo
3. Verificar se primária realmente recuperou

### Problema: "All regions failed"

**Diagnóstico:**
```bash
# Verificar health de todas as regiões
curl http://localhost:3000/health/connections | jq '.connections[]'
```

**Soluções:**
1. Verificar conectividade de rede para todas as réplicas
2. Verificar se DSNs estão corretos
3. Verificar credenciais de banco
4. Aumentar `maxFailures` temporariamente

## Boas Práticas

### 1. Teste Regularmente

```bash
# Simular failover (ambiente de teste)
npm run multi-region -- failover datasul-emp rio-janeiro

# Verificar se sistema se recupera
npm run multi-region -- failback datasul-emp
```

### 2. Monitore Métricas

```promql
# Queries por região
sum(rate(lor0138_multi_region_queries_total[5m])) by (region)

# Taxa de sucesso por região
sum(lor0138_multi_region_queries_success) / sum(lor0138_multi_region_queries_total)

# Região atual
lor0138_multi_region_current_region
```

### 3. Configure Alertas

- Alert quando failover acontece (critical)
- Alert quando primária fica unhealthy > 5min (warning)
- Alert quando todas as regiões falham (critical)
- Alert quando replication lag > threshold (warning)

### 4. Documente Procedimentos

**DR Runbook Example:**

```markdown
# Procedimento de Failover Manual

1. Verificar se primária realmente está down
2. Executar failover manual:
   ```bash
   npm run multi-region -- failover datasul-emp rio-janeiro
   ```
3. Notificar equipe via Slack
4. Monitorar métricas de performance da secundária
5. Investigar causa raiz da falha na primária
6. Quando primária recuperar, executar failback:
   ```bash
   npm run multi-region -- failback datasul-emp
   ```
```

## Roadmap / Melhorias Futuras

**Possíveis melhorias:**

1. **Load Balancing**: Distribuir queries entre múltiplas réplicas
2. **Geo-routing**: Rotear queries para região mais próxima
3. **Active-Active**: Ambas regiões ativas simultaneamente
4. **Quorum**: Votação entre 3+ regiões antes de failover
5. **Circuit Breaker Integration**: Integrar com circuit breaker
6. **Automatic Replica Discovery**: Auto-descobrir réplicas via DNS/service discovery

## Referências

- [Progress OpenEdge Replication](https://docs.progress.com/bundle/openedge-replication-117/page/Replication-Overview.html)
- [SQL Server AlwaysOn](https://docs.microsoft.com/en-us/sql/database-engine/availability-groups/windows/overview-of-always-on-availability-groups-sql-server)
- [CAP Theorem](https://en.wikipedia.org/wiki/CAP_theorem)
- [Eventual Consistency](https://en.wikipedia.org/wiki/Eventual_consistency)
