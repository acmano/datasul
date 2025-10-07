# Retry com Exponential Backoff

> **Utilitário para tentar operações com delays crescentes**

Sistema de retry inteligente com exponential backoff, jitter e detecção de erros temporários vs permanentes.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Conceitos](#conceitos)
- [RetryOptions](#retryoptions)
- [API](#api)
- [Tipos de Erros](#tipos-de-erros)
- [Exemplos de Uso](#exemplos-de-uso)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

### O que é Retry com Backoff?

**Retry com Backoff** é uma estratégia para lidar com falhas temporárias aumentando progressivamente o tempo de espera entre tentativas.

### Por que usar?

Operações de rede e I/O podem falhar temporariamente por diversos motivos:
- Servidor reiniciando
- Rede congestionada
- Timeout momentâneo
- Pool de conexões cheio
- Rate limiting

Ao invés de falhar imediatamente, é melhor tentar algumas vezes com delays crescentes.

### Características Principais

- ✅ **Exponential Backoff** - Delay cresce exponencialmente (1s → 2s → 4s → 8s)
- ✅ **Jitter** - Aleatoriedade para evitar thundering herd
- ✅ **Configurável** - Tentativas, delays e comportamento customizáveis
- ✅ **Inteligente** - Detecta erros temporários vs permanentes
- ✅ **Observable** - Logs detalhados de cada tentativa
- ✅ **Type Safe** - Interface TypeScript completa
- ✅ **Callback Support** - onRetry para lógica customizada

---

## Conceitos

### Exponential Backoff

Estratégia onde o delay entre tentativas cresce exponencialmente.

**Sem Backoff (Linear):**
```
Tentativa 1: 1s
Tentativa 2: 1s  ← Sempre 1s
Tentativa 3: 1s
Tentativa 4: 1s
```

**Com Exponential Backoff (Factor 2):**
```
Tentativa 1: 1s
Tentativa 2: 2s   ← 2x anterior
Tentativa 3: 4s   ← 2x anterior
Tentativa 4: 8s   ← 2x anterior
```

**Fórmula:**
```
delay = initialDelay * (backoffFactor ^ (attempt - 1))
```

**Vantagens:**
- Dá tempo para servidor se recuperar
- Não sobrecarrega servidor com muitas tentativas rápidas
- Equilibra entre rapidez e paciência

---

### Jitter (Aleatoriedade)

Adiciona variação aleatória ao delay para evitar sincronização.

**Sem Jitter:**
```
Cliente 1: retry em 2s
Cliente 2: retry em 2s  ← Todos ao mesmo tempo
Cliente 3: retry em 2s
```

**Com Jitter:**
```
Cliente 1: retry em 1.2s
Cliente 2: retry em 2.8s  ← Tempos diferentes
Cliente 3: retry em 1.9s
```

**Fórmula:**
```
jitterFactor = 0.5 + random(0, 1)  // Entre 0.5 e 1.5
delay = currentDelay * jitterFactor
```

**Exemplo (delay base 2000ms):**
- Mínimo: 2000 * 0.5 = 1000ms
- Máximo: 2000 * 1.5 = 3000ms
- Aleatório entre 1000ms e 3000ms

**Vantagens:**
- Evita "thundering herd" (todos retrying juntos)
- Distribui carga no servidor
- Reduz picos de tráfego

---

### Thundering Herd

Problema onde múltiplos clientes tentam novamente simultaneamente.

**Cenário sem Jitter:**
```
t=0s    100 clientes fazem requisição
t=0s    Servidor cai (todas falham)
t=2s    100 clientes retry simultaneamente ← Thundering Herd
t=2s    Servidor sobrecarregado novamente
```

**Solução com Jitter:**
```
t=0s    100 clientes fazem requisição
t=0s    Servidor cai (todas falham)
t=1-3s  100 clientes retry em tempos diferentes ← Distribuído
t=1-3s  Servidor se recupera gradualmente ✅
```

---

## RetryOptions

Interface de configuração para retry.

```typescript
interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  onRetry?: (error: Error, attempt: number, nextDelay: number) => void;
}
```

---

### maxAttempts

Número máximo de tentativas.

**Tipo:** `number`
**Padrão:** `3`

**Valores recomendados:**
- `1` - Sem retry (fail fast)
- `3` - Padrão equilibrado ⭐
- `5` - Operações importantes
- `10` - Operações críticas

**Exemplo:**
```typescript
// Fail fast (sem retry)
retryWithBackoff(fn, { maxAttempts: 1 });

// Padrão (3 tentativas)
retryWithBackoff(fn, { maxAttempts: 3 });

// Operação crítica (10 tentativas)
retryWithBackoff(fn, { maxAttempts: 10 });
```

**Cálculo de tempo total:**
```
maxAttempts: 3
initialDelay: 1000ms
backoffFactor: 2

Tentativa 1: 0ms (imediata)
Tentativa 2: 1000ms delay
Tentativa 3: 2000ms delay
Total: ~3s + execution time
```

---

### initialDelay

Delay inicial em milissegundos.

**Tipo:** `number`
**Padrão:** `1000` (1 segundo)

**Valores recomendados:**
- `500ms` - Operações rápidas
- `1000ms` - Padrão equilibrado ⭐
- `2000ms` - Operações pesadas
- `5000ms` - Operações muito lentas

**Exemplo:**
```typescript
// Operação rápida (API leve)
retryWithBackoff(fn, { initialDelay: 500 });

// Operação pesada (banco de dados)
retryWithBackoff(fn, { initialDelay: 2000 });
```

**Progressão (factor 2):**
```
initialDelay: 1000ms

Tentativa 1: 1000ms
Tentativa 2: 2000ms
Tentativa 3: 4000ms
Tentativa 4: 8000ms
```

---

### maxDelay

Delay máximo em milissegundos.

**Tipo:** `number`
**Padrão:** `10000` (10 segundos)

**Propósito:**
- Limita crescimento exponencial
- Evita delays muito longos
- Define teto de espera

**Valores recomendados:**
- `5000ms` (5s) - Operações rápidas
- `10000ms` (10s) - Padrão equilibrado ⭐
- `30000ms` (30s) - Operações lentas
- `60000ms` (60s) - Batch/background jobs

**Exemplo:**
```typescript
// Limita delay em 5s
retryWithBackoff(fn, {
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 5000
});

// Progressão:
// 1000ms → 2000ms → 4000ms → 5000ms ← Cap
```

**Sem maxDelay:**
```
Tentativa 1: 1s
Tentativa 2: 2s
Tentativa 3: 4s
Tentativa 4: 8s
Tentativa 5: 16s
Tentativa 6: 32s
Tentativa 7: 64s  ← Muito longo!
```

**Com maxDelay: 10s:**
```
Tentativa 1: 1s
Tentativa 2: 2s
Tentativa 3: 4s
Tentativa 4: 8s
Tentativa 5: 10s  ← Cap
Tentativa 6: 10s  ← Cap
Tentativa 7: 10s  ← Cap
```

---

### backoffFactor

Fator multiplicador do delay.

**Tipo:** `number`
**Padrão:** `2` (exponencial)

**Valores comuns:**
- `1.5` - Crescimento moderado
- `2` - Exponencial clássico ⭐
- `3` - Crescimento agressivo
- `1` - Linear (não recomendado)

**Comparação:**

| Tentativa | Factor 1.5 | Factor 2 | Factor 3 |
|-----------|------------|----------|----------|
| 1 | 1s | 1s | 1s |
| 2 | 1.5s | 2s | 3s |
| 3 | 2.25s | 4s | 9s |
| 4 | 3.4s | 8s | 27s |

**Exemplo:**
```typescript
// Crescimento moderado
retryWithBackoff(fn, {
  initialDelay: 1000,
  backoffFactor: 1.5
});

// Crescimento agressivo
retryWithBackoff(fn, {
  initialDelay: 1000,
  backoffFactor: 3
});
```

---

### jitter

Adiciona aleatoriedade ao delay.

**Tipo:** `boolean`
**Padrão:** `true`

**Comportamento:**
- `true` - Delay varia entre 50% e 150% do valor ⭐
- `false` - Delay fixo (não recomendado)

**Exemplo com jitter=true:**
```typescript
// Delay base: 2000ms
// Range: 1000ms - 3000ms

Execução 1: 1234ms
Execução 2: 2876ms
Execução 3: 1654ms
```

**Exemplo com jitter=false:**
```typescript
// Delay base: 2000ms
// Sempre: 2000ms

Execução 1: 2000ms
Execução 2: 2000ms
Execução 3: 2000ms
```

**Recomendação:**
✅ Sempre deixar `true` (padrão)

---

### onRetry

Callback executado antes de cada retry.

**Tipo:** `(error: Error, attempt: number, nextDelay: number) => void`
**Opcional:** Sim

**Parâmetros:**
- `error: Error` - Erro que causou o retry
- `attempt: number` - Número da tentativa que falhou (1, 2, 3...)
- `nextDelay: number` - Delay até próxima tentativa (ms)

**Uso:**
- Logging customizado
- Métricas e monitoramento
- Notificações
- Decisões condicionais

**Exemplo - Métricas:**
```typescript
retryWithBackoff(
  () => fetchAPI(),
  {
    maxAttempts: 3,
    onRetry: (error, attempt, delay) => {
      metrics.increment('api_retry_count', {
        endpoint: '/api/data',
        attempt
      });
    }
  }
);
```

**Exemplo - Notificação:**
```typescript
retryWithBackoff(
  () => connectDB(),
  {
    maxAttempts: 5,
    onRetry: (error, attempt, delay) => {
      if (attempt >= 3) {
        slack.notify(`Database retry attempt ${attempt}/5: ${error.message}`);
      }
    }
  }
);
```

**Exemplo - Abort condicional:**
```typescript
retryWithBackoff(
  () => operation(),
  {
    maxAttempts: 5,
    onRetry: (error, attempt, delay) => {
      // Aborta se erro não-retryable
      if (error.message.includes('Invalid credentials')) {
        throw error;  // Para retry imediatamente
      }
    }
  }
);
```

---

## API

### retryWithBackoff()

Executa função com retry e exponential backoff.

**Assinatura:**
```typescript
function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>,
  context?: string
): Promise<T>
```

**Parâmetros:**
- `fn` - Função async a executar
- `options` - Opções de retry (opcional)
- `context` - Nome para logs (opcional, default: 'Operation')

**Retorno:** `Promise<T>` - Resultado da função

**Throws:** Último erro se todas tentativas falharem

**Algoritmo:**
```
1. Para cada tentativa (1 até maxAttempts):
   a. Tenta executar função
   b. Se sucesso: retorna resultado
   c. Se falha:
      - Se última tentativa: lança erro
      - Calcula próximo delay
      - Chama onRetry (se definido)
      - Aguarda delay
      - Aumenta delay para próxima tentativa
```

**Exemplo básico:**
```typescript
const data = await retryWithBackoff(
  () => database.query(sql)
);
```

**Exemplo com opções:**
```typescript
const data = await retryWithBackoff(
  () => database.query(sql),
  {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitter: true
  },
  'Database Query'
);
```

**Logs gerados:**
```
Database Query: Tentativa 1/5
Database Query: Tentativa 1 falhou, retry em 1247ms
Database Query: Tentativa 2/5
Database Query: Tentativa 2 falhou, retry em 2891ms
Database Query: Tentativa 3/5
Database Query: Sucesso na tentativa 3
```

---

### isRetryableError()

Verifica se erro é temporário (vale retry).

**Assinatura:**
```typescript
function isRetryableError(error: Error): boolean
```

**Parâmetros:**
- `error: Error` - Erro a verificar

**Retorno:** `boolean`
- `true` - Erro temporário (vale retry)
- `false` - Erro permanente (não vale retry)

**Erros Retryable (Temporários):**

| Padrão | Descrição | Causa Comum |
|--------|-----------|-------------|
| `ECONNREFUSED` | Conexão recusada | Servidor parado/reiniciando |
| `ETIMEDOUT` | Timeout | Rede lenta, servidor ocupado |
| `ENOTFOUND` | Host não encontrado | Problema DNS temporário |
| `EHOSTUNREACH` | Host inacessível | Problema de rede |
| `ENETUNREACH` | Rede inacessível | Problema de roteamento |
| `timeout` | Timeout genérico | Operação demorou muito |
| `connection closed` | Conexão fechada | Servidor fechou conexão |
| `connection reset` | Conexão resetada | Peer resetou conexão |
| `socket hang up` | Socket pendurado | Conexão interrompida |

**Erros Não-Retryable (Permanentes):**

| Tipo | Exemplos | Por que não retry? |
|------|----------|-------------------|
| **Autenticação** | Invalid credentials | Senha errada não muda |
| **Validação** | Invalid input | Dados inválidos não mudam |
| **HTTP 4xx** | 400, 401, 403, 404 | Erro do cliente |
| **SQL Syntax** | Syntax error | Query errada não muda |
| **Lógica** | Business rule violation | Regra não muda |

**Exemplo:**
```typescript
try {
  await connectToDatabase();
} catch (error) {
  if (isRetryableError(error)) {
    console.log('✅ Vale retry:', error.message);
  } else {
    console.log('❌ Não vale retry:', error.message);
    throw error;
  }
}
```

---

### retryOnRetryableError()

Retry inteligente que só tenta em erros temporários.

**Assinatura:**
```typescript
function retryOnRetryableError<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>,
  context?: string
): Promise<T>
```

**Diferença do retryWithBackoff:**
- `retryWithBackoff` - Tenta sempre (até maxAttempts)
- `retryOnRetryableError` - Aborta em erros permanentes

**Comparação:**

| Erro | retryWithBackoff | retryOnRetryableError |
|------|------------------|----------------------|
| `ETIMEDOUT` | Tenta 3x ✅ | Tenta 3x ✅ |
| `ECONNREFUSED` | Tenta 3x ✅ | Tenta 3x ✅ |
| `Invalid credentials` | Tenta 3x ❌ | Aborta imediatamente ✅ |
| `Syntax error` | Tenta 3x ❌ | Aborta imediatamente ✅ |

**Vantagens:**
- Falha rápido em erros de configuração
- Não desperdiça tentativas
- Economiza tempo

**Exemplo:**
```typescript
// Timeout: tenta 5x
// Senha errada: aborta imediatamente
const conn = await retryOnRetryableError(
  () => database.connect(config),
  { maxAttempts: 5 },
  'Database Connection'
);
```

---

## Tipos de Erros

### Erros de Rede (Retryable)

**ECONNREFUSED:**
```typescript
// Servidor não aceitou conexão
Error: connect ECONNREFUSED 127.0.0.1:1433
```
**Causa:** Servidor parado, reiniciando, ou porta errada
**Retry:** ✅ Vale (servidor pode voltar)

---

**ETIMEDOUT:**
```typescript
// Timeout na conexão
Error: connect ETIMEDOUT 10.0.0.1:1433
```
**Causa:** Rede lenta, firewall, servidor sobrecarregado
**Retry:** ✅ Vale (pode ser temporário)

---

**ENOTFOUND:**
```typescript
// DNS não resolveu
Error: getaddrinfo ENOTFOUND database.server.com
```
**Causa:** DNS lento, servidor DNS fora
**Retry:** ✅ Vale (DNS pode voltar)

---

**EHOSTUNREACH:**
```typescript
// Host inacessível
Error: connect EHOSTUNREACH 10.0.0.1
```
**Causa:** Problema de roteamento de rede
**Retry:** ✅ Vale (rede pode se recuperar)

---

### Erros de Aplicação (Não-Retryable)

**Invalid Credentials:**
```typescript
Error: Login failed for user 'admin'
```
**Causa:** Usuário ou senha incorreta
**Retry:** ❌ Não vale (credenciais erradas não mudam)

---

**Validation Error:**
```typescript
Error: Invalid input: email must be valid
```
**Causa:** Dados de entrada inválidos
**Retry:** ❌ Não vale (dados não mudam)

---

**HTTP 404:**
```typescript
Error: Not Found
```
**Causa:** Recurso não existe
**Retry:** ❌ Não vale (recurso não vai aparecer)

---

**SQL Syntax Error:**
```typescript
Error: Incorrect syntax near 'SELCT'
```
**Causa:** Query SQL errada
**Retry:** ❌ Não vale (query não muda)

---

## Exemplos de Uso

### 1. Conexão de Banco de Dados

```typescript
import { retryWithBackoff } from '@shared/utils/retry';

async function connectDatabase() {
  return retryWithBackoff(
    async () => {
      const pool = await sql.connect(config);
      return pool;
    },
    {
      maxAttempts: 5,
      initialDelay: 2000,
      maxDelay: 10000,
      onRetry: (error, attempt) => {
        log.warn('Database connection retry', { attempt, error: error.message });
      }
    },
    'Database Connection'
  );
}
```

**Logs:**
```
Database Connection: Tentativa 1/5
Database Connection: Tentativa 1 falhou, retry em 2134ms
Database connection retry {"attempt":1,"error":"ECONNREFUSED"}

Database Connection: Tentativa 2/5
Database Connection: Tentativa 2 falhou, retry em 4289ms
Database connection retry {"attempt":2,"error":"ECONNREFUSED"}

Database Connection: Tentativa 3/5
Database Connection: Sucesso na tentativa 3
```

---

### 2. Requisição HTTP para API Externa

```typescript
import axios from 'axios';
import { retryWithBackoff } from '@shared/utils/retry';

async function fetchExternalAPI(endpoint: string) {
  return retryWithBackoff(
    async () => {
      const response = await axios.get(endpoint, { timeout: 5000 });
      return response.data;
    },
    {
      maxAttempts: 3,
      initialDelay: 500,
      onRetry: (error, attempt) => {
        metrics.increment('api_retry', {
          endpoint,
          attempt,
          error: error.message
        });
      }
    },
    `External API: ${endpoint}`
  );
}
```

---

### 3. Operação com Cache Redis

```typescript
import { retryWithBackoff } from '@shared/utils/retry';

async function setCacheWithRetry(key: string, value: any) {
  return retryWithBackoff(
    async () => {
      await redis.set(key, JSON.stringify(value));
    },
    {
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 1000
    },
    'Redis SET'
  );
}
```

---

### 4. Query SQL com Retry Inteligente

```typescript
import { retryOnRetryableError } from '@shared/utils/retry';

async function executeSQLQuery(sql: string) {
  return retryOnRetryableError(
    async () => {
      const result = await database.query(sql);
      return result;
    },
    {
      maxAttempts: 3,
      initialDelay: 1000
    },
    'SQL Query'
  );
}

// Timeout: tenta 3x
// Syntax error: aborta imediatamente
```

---

### 5. Health Check com Retry

```typescript
import { retryWithBackoff } from '@shared/utils/retry';

async function waitForServiceHealthy(serviceUrl: string) {
  return retryWithBackoff(
    async () => {
      const response = await axios.get(`${serviceUrl}/health`);

      if (response.status !== 200) {
        throw new Error('Service not healthy');
      }

      return true;
    },
    {
      maxAttempts: 10,
      initialDelay: 2000,
      maxDelay: 5000
    },
    `Health Check: ${serviceUrl}`
  );
}
```

---

### 6. File System Operation

```typescript
import fs from 'fs/promises';
import { retryWithBackoff } from '@shared/utils/retry';

async function readFileWithRetry(path: string) {
  return retryWithBackoff(
    async () => {
      const content = await fs.readFile(path, 'utf8');
      return content;
    },
    {
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 500
    },
    `Read File: ${path}`
  );
}
```

---

### 7. Custom Retry Logic

```typescript
import { retryWithBackoff, isRetryableError } from '@shared/utils/retry';

async function customOperation() {
  return retryWithBackoff(
    async () => {
      const result = await complexOperation();

      // Validação customizada
      if (result.status === 'pending') {
        throw new Error('Still pending');
      }

      return result;
    },
    {
      maxAttempts: 5,
      initialDelay: 1000,
      onRetry: (error, attempt, delay) => {
        // Lógica customizada
        if (attempt === 3) {
          slack.notify(`Operation still failing after 3 attempts`);
        }

        // Aborta em erros específicos
        if (error.message.includes('Invalid config')) {
          log.error('Configuration error, aborting retry');
          throw error;
        }
      }
    },
    'Custom Operation'
  );
}
```

---

## Boas Práticas

### ✅ DO

**1. Use retry para operações de I/O**
```typescript
// ✅ Operações de rede
await retryWithBackoff(() => database.connect());
await retryWithBackoff(() => axios.get(url));
await retryWithBackoff(() => redis.get(key));
```

**2. Configure maxAttempts apropriado**
```typescript
// ✅ Baseado em criticidade
// Crítico: mais tentativas
await retryWithBackoff(fn, { maxAttempts: 10 });

// Normal: tentativas moderadas
await retryWithBackoff(fn, { maxAttempts: 3 });

// Fail fast: sem retry
await retryWithBackoff(fn, { maxAttempts: 1 });
```

**3. Use jitter (padrão)**
```typescript
// ✅ Previne thundering herd
await retryWithBackoff(fn, { jitter: true });
```

**4. Use retryOnRetryableError quando possível**
```typescript
// ✅ Aborta em erros permanentes
await retryOnRetryableError(
  () => database.connect(config)
);
```

**5. Adicione contexto nos logs**
```typescript
// ✅ Contexto descritivo
await retryWithBackoff(
  fn,
  options,
  'SQL Server EMP - Connection Pool'
);
```

**6. Use onRetry para métricas**
```typescript
// ✅ Monitoramento
await retryWithBackoff(fn, {
  onRetry: (error, attempt) => {
    metrics.increment('retry_count', { operation: 'db_connect' });
  }
});
```

---

### ❌ DON'T

**1. Não use retry em operações não-idempotentes**
```typescript
// ❌ Pode criar duplicatas
await retryWithBackoff(() =>
  database.insert({ id: uuid() })
);

// ✅ Use idempotência
await retryWithBackoff(() =>
  database.upsert({ id: knownId })
);
```

**2. Não retry erros permanentes**
```typescript
// ❌ Desperdiça tentativas
await retryWithBackoff(() => {
  if (password === 'wrong') {
    throw new Error('Invalid password');
  }
});

// ✅ Use retryOnRetryableError
await retryOnRetryableError(() => connect());
```

**3. Não use maxAttempts muito alto**
```typescript
// ❌ Demora muito
await retryWithBackoff(fn, { maxAttempts: 50 });

// ✅ Máximo razoável
await retryWithBackoff(fn, { maxAttempts: 10 });
```

**4. Não esqueça de logar**
```typescript
// ❌ Sem contexto
await retryWithBackoff(fn);

// ✅ Com contexto
await retryWithBackoff(fn, {}, 'Database Connection');
```

**5. Não use delay muito baixo**
```typescript
// ❌ Sobrecarrega servidor
await retryWithBackoff(fn, { initialDelay: 10 });

// ✅ Delay razoável
await retryWithBackoff(fn, { initialDelay: 1000 });
```

---

## Troubleshooting

### Timeout total muito longo

**Sintomas:**
- Operação demora muito para falhar
- Usuário aguarda minutos

**Causa:**
- maxAttempts muito alto
- initialDelay muito alto
- maxDelay muito alto

**Solução:**
```typescript
// Calcular timeout total:
// attempt 1: 0ms
// attempt 2: 1000ms delay
// attempt 3: 2000ms delay
// attempt 4: 4000ms delay
// Total: ~7s + execution time

// ❌ Muito longo
await retryWithBackoff(fn, {
  maxAttempts: 10,
  initialDelay: 5000  // Total: ~1 minuto!
});

// ✅ Balanceado
await retryWithBackoff(fn, {
  maxAttempts: 3,
  initialDelay: 1000  // Total: ~3s
});
```

---

### Thundering herd ainda acontece

**Sintomas:**
- Todos clientes retry ao mesmo tempo
- Servidor sobrecarregado após falha

**Causa:**
- jitter desabilitado

**Solução:**
```typescript
// ❌ Sem jitter
await retryWithBackoff(fn, { jitter: false });

// ✅ Com jitter (padrão)
await retryWithBackoff(fn, { jitter: true });
```

---

### Retry não está acontecendo

**Sintomas:**
- Falha na primeira tentativa
- Sem logs de retry

**Verificar:**
```typescript
// 1. maxAttempts > 1?
console.log(options.maxAttempts);  // Deve ser > 1

// 2. Erro sendo lançado?
try {
  await fn();
} catch (error) {
  console.log('Erro:', error);  // Deve ter erro
}

// 3. Função retorna Promise?
// ❌ Síncrona
function fn() { return data; }

// ✅ Async
async function fn() { return await getData(); }
```

---

### Erro permanente sendo retried

**Sintomas:**
- Senha errada tentada 3x
- Syntax error tentado 3x

**Causa:**
- Usando `retryWithBackoff` ao invés de `retryOnRetryableError`

**Solução:**
```typescript
// ❌ Retry em tudo
await retryWithBackoff(() => connect());

// ✅ Retry apenas temporários
await retryOnRetryableError(() => connect());
```

---

### Operação duplicada

**Sintomas:**
- Registro criado 2x ou mais
- Transação executada múltiplas vezes

**Causa:**
- Operação não é idempotente
- Retry em operação de escrita

**Solução:**
```typescript
// ❌ INSERT pode duplicar
await retryWithBackoff(() =>
  db.insert({ id: uuid() })
);

// ✅ UPSERT é idempotente
await retryWithBackoff(() =>
  db.upsert({ id: knownId, data })
);

// ✅ Ou use idempotency key
await retryWithBackoff(() =>
  db.insert({ id: idempotencyKey, data })
);
```

---

## Referências

### Arquivos Relacionados

- `DatabaseManager.ts` - Usa retry para conexões
- `logger.ts` - Sistema de logs
- `CacheManager.ts` - Pode usar retry

### Padrões Relacionados

- [Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html) - Para falhas persistentes
- [Bulkhead Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/bulkhead) - Isolamento de recursos
- [Timeout Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/retry) - Limites de tempo

### Conceitos

- **Exponential Backoff** - Delay cresce exponencialmente
- **Jitter** - Aleatoriedade no delay
- **Thundering Herd** - Problema de retry simultâneo
- **Idempotency** - Operação pode ser repetida
- **Retryable Error** - Erro temporário
- **Circuit Breaker** - Para retry após N falhas

### Leitura Recomendada

- [AWS Architecture Blog - Exponential Backoff](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Google Cloud - Retry Pattern](https://cloud.google.com/architecture/scalable-and-resilient-apps)
- [Microsoft - Retry Guidance](https://docs.microsoft.com/en-us/azure/architecture/best-practices/retry-service-specific)

---

**Última atualização:** 2025-10-07