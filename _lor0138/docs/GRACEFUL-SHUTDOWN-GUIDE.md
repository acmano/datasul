# 🛑 Guia de Uso - Graceful Shutdown

## 📋 O Que É Graceful Shutdown?

**Graceful Shutdown** é o processo de encerrar uma aplicação de forma limpa e ordenada, garantindo que:

- ✅ Nenhuma requisição ativa seja perdida
- ✅ Todas as conexões sejam fechadas corretamente
- ✅ Recursos sejam liberados (memória, file handles, etc)
- ✅ Dados sejam salvos/persistidos antes de encerrar
- ✅ Logs de shutdown sejam gerados

---

## ✅ Implementação Completa

### 1. **Módulo Dedicado** (`gracefulShutdown.ts`)

Criamos uma classe `GracefulShutdown` que gerencia todo o processo:

```typescript
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';

const server = app.listen(3000);
setupGracefulShutdown(server, {
  timeout: 10000, // 10 segundos
  onShutdownStart: () => log.info('Iniciando shutdown...'),
  onShutdownComplete: () => log.info('Shutdown completo!')
});
```

### 2. **Sinais Capturados**

| Sinal | Origem | Comportamento |
|-------|--------|---------------|
| `SIGTERM` | Sistemas de orquestração (Docker, Kubernetes) | Shutdown gracioso |
| `SIGINT` | Ctrl+C (terminal) | Shutdown gracioso |
| `SIGQUIT` | Quit signal | Shutdown gracioso |
| `uncaughtException` | Erros não tratados | Shutdown forçado |
| `unhandledRejection` | Promise rejections não tratadas | Shutdown forçado |

### 3. **Processo de Shutdown**

Ordem de execução:

```
1. Sinal recebido (SIGTERM/SIGINT)
   ↓
2. Para de aceitar novas conexões HTTP
   ↓
3. Aguarda requisições ativas finalizarem (máx 5s)
   ↓
4. Fecha conexões do banco de dados
   ↓
5. Cleanup adicional (logs, cache, etc)
   ↓
6. Encerra processo (exit 0)

Se travar em qualquer etapa:
   ↓
7. Timeout atingido (10s padrão)
   ↓
8. Força encerramento (exit 1)
```

---

## 🚀 Como Usar

### 1. **Configurar Variável de Ambiente**

```env
# .env
SHUTDOWN_TIMEOUT=10000  # 10 segundos (padrão)
```

**Valores recomendados:**
- **5000** (5s) - Aplicações rápidas, sem operações longas
- **10000** (10s) - Padrão, equilibrado
- **15000** (15s) - Aplicações com requisições mais longas
- **30000** (30s) - Processos batch, operações pesadas

### 2. **Iniciar Servidor**

```bash
npm run dev
```

**Logs esperados:**
```
✅ Graceful shutdown configurado
   timeout: 10000ms
   signals: SIGTERM, SIGINT, SIGQUIT
```

### 3. **Testar Shutdown**

#### Método 1: Ctrl+C
```bash
# No terminal do servidor, pressione:
Ctrl+C
```

**Logs esperados:**
```
📥 SIGINT recebido (Ctrl+C) - Iniciando graceful shutdown
🛑 Iniciando processo de shutdown
   signal: SIGINT
   activeConnections: 0
📡 Fechando servidor HTTP...
✅ Servidor HTTP fechado
🗄️  Fechando conexões do banco de dados...
✅ Conexões do banco fechadas
🧹 Executando cleanup final...
✅ Cleanup completo
✅ Graceful shutdown completo
   signal: SIGINT
   duration: 234ms
👋 Adeus!
```

#### Método 2: Kill signal
```bash
# Buscar PID do servidor
ps aux | grep "ts-node-dev.*server.ts"

# Enviar SIGTERM
kill -SIGTERM <PID>

# Ou SIGINT
kill -SIGINT <PID>
```

#### Método 3: Script de teste
```bash
chmod +x test-graceful-shutdown.sh
./test-graceful-shutdown.sh
```

---

## 🧪 Cenários de Teste

### 1. **Shutdown sem Requisições Ativas**

```bash
# 1. Iniciar servidor
npm run dev

# 2. Ctrl+C
# Resultado: Encerra em ~100-300ms
```

### 2. **Shutdown com Requisições Ativas**

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Enviar requisição longa
curl http://lor0138.lorenzetti.ibe:3000/api/... &

# Terminal 1: Ctrl+C
# Resultado: Aguarda requisição finalizar (máx 5s)
```

### 3. **Timeout Forçado**

```bash
# Simular: Reduzir SHUTDOWN_TIMEOUT para 1000 (1s)
SHUTDOWN_TIMEOUT=1000 npm run dev

# Ctrl+C durante requisição
# Resultado: Força encerramento após 1s
```

---

## 📊 Logs de Shutdown

### Shutdown Bem-Sucedido

```json
{
  "level": "info",
  "message": "📥 SIGINT recebido (Ctrl+C) - Iniciando graceful shutdown",
  "timestamp": "2025-01-04T15:30:00.000Z"
}
{
  "level": "info",
  "message": "🛑 Iniciando processo de shutdown",
  "signal": "SIGINT",
  "activeConnections": 2,
  "timestamp": "2025-01-04T15:30:00.010Z"
}
{
  "level": "info",
  "message": "📡 Fechando servidor HTTP...",
  "timestamp": "2025-01-04T15:30:00.020Z"
}
{
  "level": "info",
  "message": "✅ Servidor HTTP fechado",
  "activeConnections": 0,
  "timestamp": "2025-01-04T15:30:00.150Z"
}
{
  "level": "info",
  "message": "🗄️  Fechando conexões do banco de dados...",
  "timestamp": "2025-01-04T15:30:00.160Z"
}
{
  "level": "info",
  "message": "✅ Conexões do banco fechadas",
  "timestamp": "2025-01-04T15:30:00.200Z"
}
{
  "level": "info",
  "message": "✅ Graceful shutdown completo",
  "signal": "SIGINT",
  "duration": "234ms",
  "timestamp": "2025-01-04T15:30:00.244Z"
}
{
  "level": "info",
  "message": "👋 Adeus!",
  "pid": 12345,
  "finalUptime": 120.5,
  "timestamp": "2025-01-04T15:30:00.250Z"
}
```

### Shutdown com Timeout

```json
{
  "level": "warn",
  "message": "⏱️  Timeout de 10000ms atingido - Forçando encerramento",
  "timestamp": "2025-01-04T15:30:10.000Z"
}
{
  "level": "error",
  "message": "🔴 FORÇANDO ENCERRAMENTO IMEDIATO",
  "exitCode": 0,
  "timestamp": "2025-01-04T15:30:10.010Z"
}
```

### Shutdown por Erro

```json
{
  "level": "error",
  "message": "❌ Uncaught Exception - Forçando shutdown",
  "error": "Cannot read property 'x' of undefined",
  "stack": "Error: ...",
  "timestamp": "2025-01-04T15:30:00.000Z"
}
{
  "level": "error",
  "message": "🔴 FORÇANDO ENCERRAMENTO IMEDIATO",
  "exitCode": 1,
  "timestamp": "2025-01-04T15:30:00.100Z"
}
```

---

## 🔧 Configuração Avançada

### Callbacks Customizados

```typescript
setupGracefulShutdown(server, {
  timeout: 15000,
  
  onShutdownStart: async () => {
    // Executado no início do shutdown
    log.info('Iniciando shutdown...');
    
    // Exemplo: Notificar serviço externo
    await fetch('https://monitoring.com/api/shutdown', {
      method: 'POST',
      body: JSON.stringify({ service: 'lor0138', status: 'shutting_down' })
    });
  },
  
  onShutdownComplete: async () => {
    // Executado após shutdown bem-sucedido
    log.info('Shutdown completo!');
    
    // Exemplo: Limpar cache externo
    await redis.flushall();
  }
});
```

### Rastrear Conexões Ativas

```typescript
const shutdown = setupGracefulShutdown(server, { timeout: 10000 });

// Verificar status
setInterval(() => {
  const status = shutdown.getStatus();
  console.log('Connections:', status.activeConnections);
}, 5000);
```

---

## 🐛 Troubleshooting

### Problema: Servidor não encerra

**Sintomas:**
- Ctrl+C não funciona
- Processo fica "travado"
- Timeout é atingido sempre

**Causas possíveis:**
1. Conexões keep-alive não fecham
2. Timers/intervals não foram limpos
3. Event listeners não foram removidos
4. Conexões do banco travadas

**Solução:**
```bash
# 1. Verificar conexões ativas
netstat -an | grep :3000

# 2. Reduzir timeout para forçar mais rápido
SHUTDOWN_TIMEOUT=5000 npm run dev

# 3. Se persistir, kill -9 (último recurso)
kill -9 <PID>
```

### Problema: Requisições perdidas

**Sintomas:**
- Clientes recebem erro durante shutdown
- Dados não salvos

**Solução:**
1. Aumentar timeout:
```env
SHUTDOWN_TIMEOUT=15000  # 15 segundos
```

2. Implementar health check no load balancer:
```nginx
# nginx
location /health {
  # Parar de rotear quando unhealthy
  if ($status = "unhealthy") {
    return 503;
  }
}
```

### Problema: Logs não aparecem

**Sintomas:**
- Logs de shutdown não gravados
- Arquivo .log não atualizado

**Solução:**
```typescript
// Aguardar logs serem gravados antes de encerrar
await new Promise(resolve => setTimeout(resolve, 200));
```

---

## 📈 Métricas de Shutdown

### Tempo Médio de Shutdown

```bash
# Testar 10 vezes e calcular média
for i in {1..10}; do
  npm run dev &
  sleep 2
  time kill -SIGTERM $(pgrep -f "ts-node.*server.ts")
  sleep 1
done
```

**Esperado:**
- **Sem requisições**: 100-300ms
- **Com requisições**: 200-500ms
- **Timeout forçado**: 10000ms (configurável)

### Dashboard de Shutdown (Futuro)

```typescript
// Enviar métricas para Prometheus/Grafana
const shutdownDuration = Date.now() - startTime;
metrics.histogram('shutdown_duration_ms', shutdownDuration);
metrics.counter('shutdown_count', 1, { signal: 'SIGTERM' });
```

---

## 🚀 Integração com Orquestradores

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

# Graceful shutdown via SIGTERM
STOPSIGNAL SIGTERM

# Tempo para shutdown (30s)
# Se não encerrar, Docker envia SIGKILL
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
services:
  lor0138:
    image: lor0138:latest
    stop_grace_period: 30s  # Aguarda 30s antes de SIGKILL
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 30  # Aguarda 30s
      containers:
      - name: lor0138
        env:
        - name: SHUTDOWN_TIMEOUT
          value: "25000"  # 25s (menor que K8s)
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 5"]  # Delay para load balancer
```

### PM2

```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'lor0138',
    script: './dist/server.js',
    kill_timeout: 15000,  // Aguarda 15s antes de SIGKILL
    wait_ready: true,
    listen_timeout: 10000
  }]
}
```

---

## ✅ Checklist de Implementação

- [x] Módulo `gracefulShutdown.ts` criado
- [x] `server.ts` atualizado com setup
- [x] Variável `SHUTDOWN_TIMEOUT` no `.env`
- [x] Captura de SIGTERM, SIGINT, SIGQUIT
- [x] Fecha servidor HTTP graciosamente
- [x] Fecha conexões do banco
- [x] Timeout configurável
- [x] Logs detalhados
- [x] Callbacks customizados
- [x] Script de teste criado
- [x] Documentação completa

---

## 🎯 Benefícios Obtidos

1. ✅ **Zero downtime** em deploys (com load balancer)
2. ✅ **Nenhuma requisição perdida** durante shutdown
3. ✅ **Dados salvos** antes de encerrar
4. ✅ **Logs completos** para auditoria
5. ✅ **Compatível** com Docker/Kubernetes/PM2
6. ✅ **Encerramento rápido** (<500ms típico)
7. ✅ **Segurança** contra travamentos (timeout)

---

## 📚 Recursos Adicionais

- [Node.js Process Signals](https://nodejs.org/api/process.html#process_signal_events)
- [Docker Stop Grace Period](https://docs.docker.com/engine/reference/commandline/stop/)
- [Kubernetes Termination](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination)

---

**Status**: ✅ **ITEM 8 COMPLETO**  
**Data**: 2025-01-04  
**Próximo**: Item 10 - Cache de Queries