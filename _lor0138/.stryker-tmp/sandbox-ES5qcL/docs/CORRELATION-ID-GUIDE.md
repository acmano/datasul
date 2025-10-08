# 🔍 Guia de Uso - Correlation ID (Request Tracing)

## 📋 O Que É Correlation ID?

**Correlation ID** (ou Request ID) é um identificador único (UUID) que rastreia uma requisição em todo o sistema:

- 🆔 **Identificador único** para cada requisição
- 📊 **Rastreamento end-to-end** em logs
- 🐛 **Debug facilitado** de problemas
- 🔗 **Correlação** entre microserviços (futuro)
- 📈 **Métricas** de performance por requisição

---

## ✅ Implementação Completa

### 1. **Tipos TypeScript** (`express.d.ts`)
```typescript
interface Request {
  id: string;          // Correlation ID
  startTime?: number;  // Para métricas de performance
}
```

### 2. **Middleware Dedicado** (`correlationId.middleware.ts`)
- ✅ Aceita correlation ID do cliente (headers)
- ✅ Gera novo UUID se não fornecido
- ✅ Adiciona ao request (`req.id`)
- ✅ Retorna no header (`X-Correlation-ID`)
- ✅ Adiciona timestamp para métricas

### 3. **Propagação em Logs**
Todos os logs incluem `correlationId`:
```typescript
log.info('HTTP Request', {
  correlationId: req.id,
  method: req.method,
  url: req.url,
  statusCode: res.statusCode,
  duration: duration
});
```

### 4. **Headers de Request/Response**
- **Request** (cliente envia - opcional):
  - `X-Correlation-ID`
  - `X-Request-ID`
  - `correlation-id`

- **Response** (servidor sempre retorna):
  - `X-Correlation-ID`

### 5. **Documentação Swagger**
Todos os endpoints documentam o header `X-Correlation-ID`

---

## 🚀 Como Usar

### 1. **Cliente Envia Correlation ID**

```bash
# Cliente gera e envia correlation ID
curl -H "X-Correlation-ID: my-trace-123" \
  http://lor0138.lorenzetti.ibe:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110

# Resposta inclui o mesmo ID:
# X-Correlation-ID: my-trace-123
```

**Vantagem**: Rastrear a mesma requisição em múltiplos sistemas

### 2. **Servidor Gera Correlation ID**

```bash
# Cliente NÃO envia correlation ID
curl http://lor0138.lorenzetti.ibe:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110

# Servidor gera automaticamente:
# X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
```

### 3. **Rastrear em Logs**

Com o correlation ID da resposta, busque nos logs:

```bash
# Buscar por correlation ID específico
grep "550e8400-e29b-41d4-a716-446655440000" logs/app-2025-01-04.log

# Output:
# {"level":"info","message":"HTTP Request","correlationId":"550e8400-...","method":"GET",...}
# {"level":"info","message":"Query executada","correlationId":"550e8400-...",...}
# {"level":"info","message":"Dados retornados","correlationId":"550e8400-...",...}
```

---

## 🔍 Casos de Uso

### 1. **Debug de Erro Específico**

Cliente reporta erro:
```
"Recebi erro 500 às 14:30, não sei o que aconteceu"
```

**Solução com Correlation ID:**

1. Cliente envia correlation ID:
```bash
curl -H "X-Correlation-ID: debug-client-001" \
  http://lor0138.lorenzetti.ibe:3000/api/...
```

2. Você busca nos logs:
```bash
grep "debug-client-001" logs/*.log
```

3. Vê exatamente o que aconteceu naquela requisição

---

### 2. **Performance de Requisição**

Identificar requisições lentas:

```bash
# Logs mostram duração com correlation ID
{
  "correlationId": "abc-123",
  "method": "GET",
  "url": "/api/...",
  "duration": 5432,  // 5.4 segundos!
  "statusCode": 200
}
```

Depois você pode:
1. Buscar `"abc-123"` nos logs
2. Ver onde o tempo foi gasto (DB, processamento, etc)

---

### 3. **Rastreamento Multi-Sistema** (Futuro)

Quando tiver múltiplos serviços:

```
Frontend → API lor0138 → Banco de Dados
   |            |              |
   └─ ID: abc ─→└─ ID: abc ───→└─ ID: abc
```

Mesmo correlation ID em todos os logs!

---

## 📊 Exemplos Práticos

### Exemplo 1: Health Check com Correlation ID

```bash
# Request
curl -H "X-Correlation-ID: health-check-001" \
  http://lor0138.lorenzetti.ibe:3000/health

# Response
HTTP/1.1 200 OK
X-Correlation-ID: health-check-001
Content-Type: application/json

{
  "status": "healthy",
  "database": { ... },
  "correlationId": "health-check-001"
}

# Logs
{
  "level": "info",
  "message": "Health check executado",
  "correlationId": "health-check-001",
  "status": "healthy",
  "dbResponseTime": 45
}
```

---

### Exemplo 2: Erro com Rastreamento

```bash
# Request
curl -H "X-Correlation-ID: error-trace-001" \
  http://lor0138.lorenzetti.ibe:3000/api/lor0138/item/dadosCadastrais/informacoesGerais/INVALID

# Response
HTTP/1.1 400 Bad Request
X-Correlation-ID: error-trace-001

{
  "error": "Código inválido",
  "correlationId": "error-trace-001"
}

# Logs
{
  "level": "warn",
  "message": "Validação falhou",
  "correlationId": "error-trace-001",
  "error": "Código deve ser alfanumérico"
}
```

---

### Exemplo 3: Múltiplas Requisições do Mesmo Cliente

```bash
# Cliente faz 3 requisições com IDs sequenciais
curl -H "X-Correlation-ID: batch-001" http://lor0138.lorenzetti.ibe:3000/api/.../item1
curl -H "X-Correlation-ID: batch-002" http://lor0138.lorenzetti.ibe:3000/api/.../item2
curl -H "X-Correlation-ID: batch-003" http://lor0138.lorenzetti.ibe:3000/api/.../item3

# Buscar todas no log:
grep "batch-00" logs/app-2025-01-04.log
```

---

## 🛠️ Helpers Disponíveis

### 1. `getCorrelationId(req)`
```typescript
import { getCorrelationId } from '@shared/middlewares/correlationId.middleware';

// Em qualquer lugar que tenha acesso ao request
const correlationId = getCorrelationId(req);
console.log('Correlation ID:', correlationId);
```

### 2. `withCorrelationId(req, logData)`
```typescript
import { withCorrelationId } from '@shared/middlewares/correlationId.middleware';

// Adicionar correlation ID em objetos de log
const logData = withCorrelationId(req, {
  message: 'Processando item',
  itemCodigo: '7530110'
});

log.info(logData);
// Output: { correlationId: '...', message: '...', itemCodigo: '...' }
```

---

## 🧪 Testes

### Script de Teste

```bash
#!/bin/bash
# test-correlation-id.sh

echo "🧪 TESTANDO CORRELATION ID"
echo "=========================="

# Teste 1: Servidor gera ID
echo -e "\n1️⃣ Servidor gera Correlation ID:"
curl -i http://lor0138.lorenzetti.ibe:3000/health 2>/dev/null | grep -i "x-correlation-id"

# Teste 2: Cliente envia ID
echo -e "\n2️⃣ Cliente envia Correlation ID:"
curl -i -H "X-Correlation-ID: test-123" http://lor0138.lorenzetti.ibe:3000/health 2>/dev/null | grep -i "x-correlation-id"

# Teste 3: ID no response body
echo -e "\n3️⃣ Correlation ID no body da resposta:"
curl -s http://lor0138.lorenzetti.ibe:3000/health | jq -r '.correlationId'

# Teste 4: ID diferente por requisição
echo -e "\n4️⃣ IDs diferentes em múltiplas requisições:"
for i in {1..3}; do
  curl -s http://lor0138.lorenzetti.ibe:3000/ | jq -r '.correlationId'
done
```

**Executar:**
```bash
chmod +x test-correlation-id.sh
./test-correlation-id.sh
```

**Output Esperado:**
```
🧪 TESTANDO CORRELATION ID
==========================

1️⃣ Servidor gera Correlation ID:
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000

2️⃣ Cliente envia Correlation ID:
X-Correlation-ID: test-123

3️⃣ Correlation ID no body da resposta:
550e8400-e29b-41d4-a716-446655440000

4️⃣ IDs diferentes em múltiplas requisições:
a1b2c3d4-e5f6-7890-abcd-ef1234567890
b2c3d4e5-f678-90ab-cdef-123456789abc
c3d4e5f6-7890-abcd-ef12-3456789abcde
```

---

## 📝 Boas Práticas

### ✅ DO's

1. **Sempre incluir** `correlationId` nos logs
2. **Propagar** o ID em chamadas externas (DB, APIs)
3. **Documentar** no Swagger
4. **Retornar** no header de resposta
5. **Usar padrão** UUID v4

### ❌ DON'Ts

1. ❌ NÃO usar IDs sequenciais (1, 2, 3...)
2. ❌ NÃO expor dados sensíveis no ID
3. ❌ NÃO reutilizar IDs entre requisições
4. ❌ NÃO omitir em logs de erro
5. ❌ NÃO usar formatos diferentes de UUID

---

## 🔗 Integração com Outros Sistemas

### Frontend (JavaScript/TypeScript)

```typescript
// Gerar correlation ID no frontend
import { v4 as uuidv4 } from 'uuid';

const correlationId = uuidv4();

fetch('http://lor0138.lorenzetti.ibe:3000/api/...', {
  headers: {
    'X-Correlation-ID': correlationId
  }
})
.then(response => {
  // Confirmar que o mesmo ID foi retornado
  const returnedId = response.headers.get('X-Correlation-ID');
  console.log('Correlation ID:', returnedId);
});
```

### Postman

```
# Headers
X-Correlation-ID: {{$guid}}
```

---

## 📊 Métricas e Monitoramento (Futuro)

Com correlation ID, você pode:

1. **Agrupar logs** por requisição
2. **Medir performance** end-to-end
3. **Identificar gargalos** por trace
4. **Criar dashboards** com distributed tracing
5. **Integrar com ferramentas** (Jaeger, Zipkin, etc)

---

## ✅ Checklist de Implementação

- [x] Middleware de correlation ID criado
- [x] Tipos TypeScript definidos
- [x] Aceita ID do cliente (headers)
- [x] Gera UUID se não fornecido
- [x] Retorna no header `X-Correlation-ID`
- [x] Propagado em todos os logs
- [x] Incluído nas respostas (body)
- [x] Documentado no Swagger
- [x] Helpers criados (getCorrelationId, withCorrelationId)
- [x] Exemplos de uso
- [x] Script de teste

---

## 🚀 Próximos Passos

1. ✅ **Item 9 Completo** - Correlation ID implementado
2. ⏭️ **Item 8** - Graceful Shutdown
3. ⏭️ **Item 10** - Cache de Queries
4. 🔮 **Futuro** - Distributed Tracing (Jaeger/Zipkin)

---

**Status**: ✅ **ITEM 9 COMPLETO**  
**Data**: 2025-01-04  
**Próximo**: Item 8 - Graceful Shutdown ou Item 10 - Cache