# Timeouts - Documentação

## Visão Geral

O sistema implementa timeouts em **3 camadas** para prevenir requisições travadas:

1. **HTTP Request Timeout** - Cancela requisições HTTP lentas
2. **Database Query Timeout** - Cancela queries SQL lentas
3. **Connection Timeout** - Timeout ao estabelecer conexão com o banco

---

## 1. HTTP Request Timeout

### Configuração Padrão

```typescript
DEFAULT: 30 segundos      // Requisições normais
HEAVY: 60 segundos        // Operações pesadas
HEALTH_CHECK: 5 segundos  // Health checks
```

### Variáveis de Ambiente

```bash
# .env
HTTP_REQUEST_TIMEOUT=30s       # Padrão
HTTP_HEAVY_TIMEOUT=60s         # Operações pesadas
HTTP_HEALTH_TIMEOUT=5s         # Health check
```

### Como Funciona

Se uma requisição demorar mais que o timeout:
1. Conexão é fechada automaticamente
2. Cliente recebe erro `408 Request Timeout`
3. Log é gerado com detalhes da requisição
4. Recursos do servidor são liberados

### Resposta de Erro

```json
{
  "success": false,
  "error": "Request Timeout",
  "message": "A requisição demorou muito para ser processada e foi cancelada.",
  "details": {
    "timeout": "30s",
    "suggestion": "Tente novamente. Se o problema persistir, contate o suporte."
  }
}
```

---

## 2. Database Query Timeout

### Configuração Padrão

```typescript
CONNECTION_TIMEOUT: 15 segundos  // Timeout para conectar
REQUEST_TIMEOUT: 30 segundos     // Timeout para queries
```

### Variáveis de Ambiente

```bash
# .env - SQL Server
DB_CONNECTION_TIMEOUT=15s
DB_REQUEST_TIMEOUT=30s

# .env - ODBC
ODBC_CONNECTION_TIMEOUT=15s
```

### Como Funciona

- **Connection Timeout:** Se não conseguir conectar ao banco em 15s, falha
- **Request Timeout:** Se uma query demorar mais de 30s, é cancelada

Isso previne:
- Queries mal otimizadas travarem o sistema
- Deadlocks prenderem recursos indefinidamente
- Tabelas bloqueadas causarem travamentos

---

## 3. Uso em Rotas Específicas

### Timeout Padrão (já aplicado globalmente)

```typescript
// Todas as rotas já têm timeout de 30s automaticamente
```

### Timeout Personalizado para Operações Pesadas

```typescript
import { heavyOperationTimeout, haltOnTimedout } from '@shared/middlewares/timeout.middleware';

router.get(
  '/relatorio-complexo',
  heavyOperationTimeout,     // 60s timeout
  haltOnTimedout,            // Para execução se timeout
  controller.gerarRelatorio
);
```

### Health Check com Timeout Curto

```typescript
import { healthCheckTimeout } from '@shared/middlewares/timeout.middleware';

app.get('/health', healthCheckTimeout, async (req, res) => {
  // Deve responder em menos de 5s
  res.json({ status: 'ok' });
});
```

---

## Testando Timeouts

### 1. Teste Manual - Requisição Lenta

Crie uma rota de teste que simula lentidão:

```typescript
// src/app.ts (temporário, apenas para teste)
app.get('/test-timeout', async (req, res) => {
  // Espera 35 segundos (mais que o timeout de 30s)
  await new Promise(resolve => setTimeout(resolve, 35000));
  res.json({ message: 'Esta resposta nunca será enviada' });
});
```

Teste:

```bash
# Deve retornar 408 após 30 segundos
curl http://localhost:3000/test-timeout
```

### 2. Teste - Query Lenta no Banco

Crie uma query que demora:

```typescript
// Teste temporário no repository
const slowQuery = `
  SELECT *
  FROM openquery(PRD_EMS2EMP, 
    'SELECT *, pg_sleep(40) FROM pub.item'  -- Progress não tem sleep, use WAITFOR no SQL Server
  )
`;
```

SQL Server equivalente:

```sql
SELECT * FROM item
WAITFOR DELAY '00:00:40'  -- Espera 40 segundos
```

### 3. Teste com curl e timeout

```bash
# Define timeout do curl menor que o do servidor
curl --max-time 5 http://localhost:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110

# curl timeout: Connection timeout after 5 seconds
```

### 4. Monitorar Timeouts nos Logs

```bash
# Procure por timeouts nos logs
tail -f logs/app.log | grep -i timeout

# Ou no console
npm run dev
# Faça requisições lentas e observe os logs
```

---

## Troubleshooting

### "Request Timeout" em queries normais

**Problema:** Queries simples estão atingindo timeout

**Soluções:**
1. Verifique índices nas tabelas do Progress
2. Otimize as queries (use EXPLAIN PLAN)
3. Aumente o timeout se necessário:
   ```bash
   DB_REQUEST_TIMEOUT=60s
   HTTP_REQUEST_TIMEOUT=60s
   ```

### Timeout no health check

**Problema:** `/health` retorna 408

**Causa:** Banco está lento ou indisponível

**Solução:**
1. Verifique conexão com o banco
2. Teste query de health check manualmente
3. Considere health check que não consulta o banco:
   ```typescript
   app.get('/health', (req, res) => {
     res.json({ status: 'ok' }); // Sem consulta ao banco
   });
   ```

### "connect ETIMEDOUT" 

**Problema:** Não consegue conectar ao banco

**Causa:** `DB_CONNECTION_TIMEOUT` muito baixo ou banco inacessível

**Soluções:**
1. Verifique rede: `ping 10.105.0.55`
2. Verifique porta: `telnet 10.105.0.55 1433`
3. Aumente timeout: `DB_CONNECTION_TIMEOUT=30s`

### Cliente recebe timeout antes do servidor

**Problema:** Cliente (frontend) tem timeout menor que servidor

**Solução:** Sincronize os timeouts:
```javascript
// Frontend
fetch('/api/endpoint', {
  signal: AbortSignal.timeout(35000) // 35s (maior que servidor)
})
```

---

## Boas Práticas

### ✅ DO

- **Use timeouts curtos para health checks** (5s)
- **Use timeouts maiores para relatórios** (60s+)
- **Monitore timeouts nos logs** para identificar queries lentas
- **Otimize queries** que frequentemente atingem timeout
- **Informe o usuário** quando uma operação é lenta

### ❌ DON'T

- **Não aumente timeouts indefinidamente** - corrija a causa raiz
- **Não ignore timeouts nos logs** - são sinais de problemas
- **Não use timeouts muito altos** para operações simples
- **Não deixe o usuário esperando** sem feedback

---

## Configuração Recomendada por Ambiente

### Desenvolvimento

```bash
HTTP_REQUEST_TIMEOUT=60s       # Mais tolerante para debugging
DB_REQUEST_TIMEOUT=60s
DB_CONNECTION_TIMEOUT=30s
```

### Produção

```bash
HTTP_REQUEST_TIMEOUT=30s       # Mais restritivo
DB_REQUEST_TIMEOUT=30s
DB_CONNECTION_TIMEOUT=15s
```

### Testes Automatizados

```bash
HTTP_REQUEST_TIMEOUT=10s       # Rápido para testes
DB_REQUEST_TIMEOUT=10s
DB_CONNECTION_TIMEOUT=5s
```

---

## Monitoramento

### Métricas a Monitorar

1. **Taxa de timeouts** - % de requisições que atingem timeout
2. **Tempo médio de resposta** - deve ser < 50% do timeout
3. **Queries lentas** - identifique queries que levam > 10s
4. **Picos de timeout** - horários com mais timeouts

### Alertas Recomendados

- Taxa de timeout > 5% em 5 minutos
- Tempo médio de query > 20s
- Health check timeout > 3 vezes consecutivas

---

## Referências

- [connect-timeout Documentation](https://github.com/expressjs/timeout)
- [mssql Timeout Configuration](https://github.com/tediousjs/node-mssql#timeout)
- [Best Practices for Timeouts](https://blog.logrocket.com/handling-timeouts-node-js/)