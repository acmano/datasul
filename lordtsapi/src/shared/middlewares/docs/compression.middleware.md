# Middleware de Compressão HTTP

**Arquivo:** `src/shared/middlewares/compression.middleware.ts`
**Tipo:** Middleware Express
**Propósito:** Compressão automática de respostas HTTP

---

## Visão Geral

Implementa compressão automática de respostas usando gzip/deflate/brotli para reduzir bandwidth e melhorar performance.

### Benefícios

| Benefício | Impacto |
|-----------|---------|
| Redução de bandwidth | ↓ 70-80% |
| Velocidade de resposta | ↑ 2-5x (redes lentas) |
| Custo de transferência | ↓ 70-80% |
| Experiência do usuário | ↑ Significativo (mobile) |
| Latência total | ↓ 30-60% (rede > CPU) |

### Algoritmos Suportados

| Algoritmo | Suporte | Compressão | Velocidade |
|-----------|---------|------------|------------|
| **gzip** | 99% browsers | Boa (75%) | Rápida |
| **deflate** | 98% browsers | Boa (73%) | Rápida |
| **brotli** | Modernos | Melhor (85%) | Média |

---

## Middlewares Disponíveis

### 1. compressionMiddleware (Recomendado)

Configuração **balanceada** para uso geral.

**Configuração:**
```typescript
{
  level: 6,        // Escala 0-9
  threshold: 1024, // 1KB
  memLevel: 8,     // ~256KB buffer
  strategy: 0      // Padrão
}
```

**Performance:**
- CPU extra: +5%
- Latência: +5-10ms
- Compressão: ~75%
- Memória: +2-8MB

**Trade-offs:**
- ✅ Bom equilíbrio CPU/compressão
- ✅ Adequado para maioria dos casos
- ✅ Overhead baixo
- ✅ Economia de banda significativa

---

### 2. aggressiveCompression

Configuração **agressiva** para máxima compressão.

**Configuração:**
```typescript
{
  level: 9,       // Máximo
  threshold: 512, // 512 bytes
  memLevel: 9,    // Mais memória
  strategy: 0
}
```

**Performance:**
- CPU extra: +15%
- Latência: +15-25ms
- Compressão: ~85%
- Memória: +4-16MB

**Trade-offs:**
- ✅ Máxima economia de banda
- ✅ Ideal para redes lentas
- ❌ Mais uso de CPU
- ❌ Maior latência

---

### 3. lightCompression

Configuração **leve** para mínimo uso de CPU.

**Configuração:**
```typescript
{
  level: 1,        // Mínimo
  threshold: 2048, // 2KB
  memLevel: 6,     // Menos memória
  strategy: 0
}
```

**Performance:**
- CPU extra: +2%
- Latência: +2-5ms
- Compressão: ~60%
- Memória: +1-4MB

**Trade-offs:**
- ✅ Mínimo impacto em CPU
- ✅ Latência muito baixa
- ❌ Menos compressão
- ❌ Menos economia de banda

---

## Tabela Comparativa

| Aspecto | Light | Balanced | Aggressive |
|---------|-------|----------|------------|
| **Level** | 1 | 6 | 9 |
| **Threshold** | 2KB | 1KB | 512 bytes |
| **CPU extra** | +2% | +5% | +15% |
| **Latência** | +2-5ms | +5-10ms | +15-25ms |
| **Compressão** | ~60% | ~75% | ~85% |
| **Memória** | +1-4MB | +2-8MB | +4-16MB |
| **Uso recomendado** | CPU limitada | Geral | Banda cara |

---

## Uso Básico

### Setup Global

```typescript
// src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { compressionMiddleware } from '@shared/middlewares/compression.middleware';

const app = express();

// ORDEM IMPORTANTE:
app.use(helmet());                // 1. Segurança
app.use(cors());                  // 2. CORS
app.use(compressionMiddleware);   // 3. Compressão ← AQUI
app.use(express.json());          // 4. Body parsers
app.use(express.urlencoded({ extended: true }));

// Rotas...
app.use('/api', routes);

export default app;
```

**Ordem correta:**
1. ✅ Helmet/CORS primeiro
2. ✅ Compressão em seguida
3. ✅ Body parsers depois
4. ✅ Rotas por último

---

## Exemplos de Uso

### Exemplo 1: Compressão Padrão (Recomendado)

```typescript
import { compressionMiddleware } from '@shared/middlewares/compression.middleware';

// Aplicar globalmente
app.use(compressionMiddleware);

// Todas as rotas terão compressão automática
app.get('/api/items', controller.getItems);
app.get('/api/items/:id', controller.getItem);
```

**Resultado:**
```http
GET /api/items
Accept-Encoding: gzip, deflate

HTTP/1.1 200 OK
Content-Type: application/json
Content-Encoding: gzip
Content-Length: 1250  # Original: ~5000 bytes (75% redução)

{compressed data}
```

---

### Exemplo 2: Compressão Agressiva para APIs Específicas

```typescript
import { aggressiveCompression } from '@shared/middlewares/compression.middleware';

// Apenas para rotas de relatórios (respostas grandes)
app.use('/api/reports', aggressiveCompression);

app.get('/api/reports/sales', controller.getSalesReport);
// Response: 500KB → 75KB (85% redução)
```

---

### Exemplo 3: Compressão Leve para Alta Performance

```typescript
import { lightCompression } from '@shared/middlewares/compression.middleware';

// Para APIs de alta frequência
app.use('/api/metrics', lightCompression);

app.get('/api/metrics/realtime', controller.getRealtime);
// Latência mínima, compressão moderada
```

---

### Exemplo 4: Compressão Customizada

```typescript
import { createCustomCompression } from '@shared/middlewares/compression.middleware';

// Compressão customizada para caso específico
const reportCompression = createCustomCompression({
  level: 7,           // Um pouco acima do padrão
  threshold: 2048,    // Apenas > 2KB
  filter: (req, res) => {
    // Apenas para formato JSON
    const contentType = res.getHeader('content-type');
    return contentType?.includes('application/json') || false;
  }
});

app.use('/api/reports', reportCompression);
```

---

### Exemplo 5: Desabilitar Compressão

```typescript
import { noCompression } from '@shared/middlewares/compression.middleware';

// Para arquivos já comprimidos
app.get('/download/file.zip', noCompression, (req, res) => {
  res.sendFile('file.zip');
});

// Para imagens (já comprimidas)
app.get('/images/:id', noCompression, (req, res) => {
  res.sendFile('image.jpg');
});

// Para vídeos
app.get('/videos/:id', noCompression, (req, res) => {
  res.sendFile('video.mp4');
});
```

---

## Quando Usar Cada Middleware

### compressionMiddleware (Balanceado)

✅ **Use quando:**
- Caso geral (padrão para maioria)
- Não tem requisitos específicos
- Equilíbrio CPU/banda é importante
- Latência não é crítica (<50ms aceitável)

**Casos de uso:**
```typescript
// APIs REST gerais
app.use('/api', compressionMiddleware);

// Endpoints públicos
app.use(compressionMiddleware);

// Aplicações web
app.use(compressionMiddleware);
```

---

### aggressiveCompression

✅ **Use quando:**
- Bandwidth é muito cara ou limitada
- Respostas muito grandes (>100KB)
- Rede é lenta (2G, 3G)
- CPU sobra, banda não
- Economia de dados é crítica

❌ **NÃO use quando:**
- CPU é limitada
- Latência é crítica (<10ms)
- Respostas pequenas (<10KB)
- Muitas requisições simultâneas

**Casos de uso:**
```typescript
// Relatórios grandes
app.use('/api/reports', aggressiveCompression);

// Exports de dados
app.use('/api/export', aggressiveCompression);

// APIs para mobile (dados caros)
app.use('/api/mobile', aggressiveCompression);

// Dashboards com gráficos
app.use('/api/dashboards', aggressiveCompression);
```

---

### lightCompression

✅ **Use quando:**
- CPU é limitada ou compartilhada
- Latência muito crítica (<5ms)
- Muitas requisições simultâneas
- Banda não é problema
- Respostas pequenas (<10KB)

❌ **NÃO use quando:**
- Banda é cara ou limitada
- Respostas muito grandes
- CPU sobra

**Casos de uso:**
```typescript
// APIs de alta frequência
app.use('/api/metrics', lightCompression);

// Real-time endpoints
app.use('/api/realtime', lightCompression);

// Microservices internos
app.use(lightCompression);

// Health checks
app.use('/health', lightCompression);
```

---

## Tipos de Conteúdo

### Comprimidos Automaticamente

✅ **Tipos textuais:**
- `application/json` ← Principal
- `application/javascript`
- `text/html`
- `text/css`
- `text/plain`
- `text/xml`
- `application/xml`
- `application/x-www-form-urlencoded`

### NÃO Comprimidos

❌ **Já comprimidos nativamente:**
- `image/*` (JPEG, PNG, GIF, WebP)
- `video/*` (MP4, WebM, AVI)
- `audio/*` (MP3, AAC, OGG)
- `application/zip`
- `application/gzip`
- `application/x-7z-compressed`
- Arquivos com `Content-Encoding` existente

---

## Critérios de Decisão

### shouldCompress()

A função de filtro verifica:

**1. Content-Encoding existente**
```typescript
if (res.getHeader('Content-Encoding')) {
  return false; // Já comprimido
}
```

**2. Suporte do cliente**
```typescript
if (!req.headers['accept-encoding']) {
  return false; // Cliente não suporta
}
```

**3. Tipo de conteúdo e tamanho**
```typescript
return compression.filter(req, res);
// - Verifica content-type
// - Verifica tamanho >= threshold
// - Verifica Cache-Control: no-transform
```

---

## Performance

### Comparação de Tamanhos

**JSON típico (5KB não comprimido):**

| Config | Comprimido | Redução | Latência |
|--------|-----------|---------|----------|
| Sem compressão | 5000 bytes | 0% | 0ms |
| Light (level 1) | 2000 bytes | 60% | +2ms |
| Balanced (level 6) | 1250 bytes | 75% | +5ms |
| Aggressive (level 9) | 750 bytes | 85% | +15ms |

**JSON grande (100KB não comprimido):**

| Config | Comprimido | Redução | Latência |
|--------|-----------|---------|----------|
| Sem compressão | 100000 bytes | 0% | 0ms |
| Light | 40000 bytes | 60% | +10ms |
| Balanced | 25000 bytes | 75% | +20ms |
| Aggressive | 15000 bytes | 85% | +50ms |

---

### Quando Vale a Pena

**Cálculo do ganho total:**

```
Tempo total = Latência_CPU + Latência_Rede

Sem compressão:
- CPU: 0ms
- Rede: 100ms (para 100KB @ 10Mbps)
- Total: 100ms

Com compressão balanceada:
- CPU: +20ms
- Rede: 25ms (para 25KB @ 10Mbps)
- Total: 45ms ✅ 55% mais rápido!

Com compressão agressiva:
- CPU: +50ms
- Rede: 15ms (para 15KB @ 10Mbps)
- Total: 65ms ✅ 35% mais rápido
```

**Conclusão:**
- ✅ Compensa em redes lentas (<50Mbps)
- ✅ Compensa para respostas grandes (>10KB)
- ❌ Pode não compensar em LANs rápidas
- ❌ Pode não compensar para respostas pequenas

---

## Headers HTTP

### Request Headers

Cliente envia:
```http
GET /api/items
Accept-Encoding: gzip, deflate, br
```

**Significado:**
- `gzip` - Aceita compressão gzip
- `deflate` - Aceita compressão deflate
- `br` - Aceita compressão brotli (moderno)

---

### Response Headers

Servidor responde:
```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Encoding: gzip
Content-Length: 1250
Vary: Accept-Encoding
```

**Headers importantes:**

**Content-Encoding: gzip**
- Indica que resposta está comprimida
- Cliente descomprime automaticamente

**Content-Length: 1250**
- Tamanho da resposta **comprimida**
- Original pode ser 5000+ bytes

**Vary: Accept-Encoding**
- Cache deve considerar Accept-Encoding
- Respostas diferentes para clientes diferentes

---

## Configuração Avançada

### Parâmetros do Compression

#### level (0-9)

**Nível de compressão:**
- `0` - Sem compressão (apenas armazena)
- `1` - Compressão rápida (~60%)
- `6` - Padrão balanceado (~75%)
- `9` - Máxima compressão (~85%)

```typescript
compression({ level: 6 })
```

---

#### threshold (bytes)

**Tamanho mínimo para comprimir:**
- Respostas menores não são comprimidas
- Overhead não compensa para muito pequenas

```typescript
compression({ threshold: 1024 }) // 1KB mínimo
```

**Recomendações:**
- Light: 2048 (2KB)
- Balanced: 1024 (1KB)
- Aggressive: 512 bytes

---

#### memLevel (1-9)

**Nível de memória para buffer:**
- `1` - 2KB buffer
- `8` - 256KB buffer (padrão)
- `9` - 512KB buffer

```typescript
compression({ memLevel: 8 })
```

**Trade-off:**
- Mais memória = melhor compressão
- Mais memória = mais uso de RAM

---

#### strategy (0-4)

**Estratégia de compressão:**
- `0` - `Z_DEFAULT_STRATEGY` (padrão, geral)
- `1` - `Z_FILTERED` (dados de filtros)
- `2` - `Z_HUFFMAN_ONLY` (apenas Huffman)
- `3` - `Z_RLE` (run-length encoding)
- `4` - `Z_FIXED` (códigos fixos)

```typescript
compression({ strategy: 0 })
```

**Recomendação:**
- Use `0` (padrão) para maioria dos casos

---

## Integração com Cache

### Compressão + Cache Middleware

```typescript
import { compressionMiddleware } from '@shared/middlewares/compression.middleware';
import { cacheMiddleware } from '@shared/middlewares/cache.middleware';

// ORDEM CORRETA:
app.use(compressionMiddleware);  // 1. Comprime
app.use(cacheMiddleware());      // 2. Cacheia (comprimido)

// ✅ Cache armazena resposta já comprimida
// ✅ Hit de cache retorna comprimido (rápido)
```

---

### Header Vary

Compressão adiciona `Vary: Accept-Encoding` automaticamente:

```http
HTTP/1.1 200 OK
Content-Encoding: gzip
Vary: Accept-Encoding
```

**Por quê?**
- Clientes diferentes suportam encodings diferentes
- Cache deve manter versões separadas
- Um cliente com gzip, outro sem gzip

---

## Testando Compressão

### Usando curl

```bash
# Requisição com suporte a gzip
curl -H "Accept-Encoding: gzip, deflate" \
  -v http://localhost:3000/api/items

# Verificar headers de resposta
# < Content-Encoding: gzip
# < Content-Length: 1250
```

---

### Usando HTTPie

```bash
# Requisição padrão (gzip automático)
http GET localhost:3000/api/items

# Ver headers
http --print=h GET localhost:3000/api/items
```

---

### No Browser DevTools

**1. Abrir Network tab**
2. Fazer requisição
3. Verificar coluna "Size"
   - Ex: `1.2 KB / 5.0 KB`
   - Primeiro número: transferido (comprimido)
   - Segundo número: original (descomprimido)

**4. Ver headers:**
```
Response Headers:
  Content-Encoding: gzip
  Content-Length: 1250

Request Headers:
  Accept-Encoding: gzip, deflate, br
```

---

### Script de Teste

```typescript
// test/compression.test.ts
import request from 'supertest';
import app from '../src/app';

describe('Compression Middleware', () => {
  it('should compress JSON responses', async () => {
    const response = await request(app)
      .get('/api/items')
      .set('Accept-Encoding', 'gzip')
      .expect(200);

    expect(response.headers['content-encoding']).toBe('gzip');
  });

  it('should not compress small responses', async () => {
    const response = await request(app)
      .get('/api/small')
      .set('Accept-Encoding', 'gzip')
      .expect(200);

    // Resposta < 1KB não é comprimida
    expect(response.headers['content-encoding']).toBeUndefined();
  });

  it('should not compress if client does not support', async () => {
    const response = await request(app)
      .get('/api/items')
      // Sem Accept-Encoding header
      .expect(200);

    expect(response.headers['content-encoding']).toBeUndefined();
  });
});
```

---

## Troubleshooting

### Compressão não está funcionando

**Verificar:**

1. **Cliente suporta?**
   ```bash
   curl -H "Accept-Encoding: gzip" http://localhost:3000/api/items
   ```

2. **Resposta grande o suficiente?**
   - Padrão: >= 1KB
   - Ajuste threshold se necessário

3. **Content-Type é comprimível?**
   - JSON, HTML, CSS, JS → Sim
   - Imagens, vídeos → Não

4. **Middleware registrado corretamente?**
   ```typescript
   app.use(compressionMiddleware); // ANTES das rotas
   ```

---

### Performance degradou

**Possíveis causas:**

1. **Level muito alto**
   ```typescript
   // ❌ Level 9 em produção com muitas requisições
   // ✅ Voltar para level 6
   ```

2. **CPU limitada**
   ```typescript
   // ✅ Use lightCompression
   app.use(lightCompression);
   ```

3. **Threshold muito baixo**
   ```typescript
   // ❌ Comprime respostas pequenas desnecessariamente
   threshold: 100

   // ✅ Use threshold maior
   threshold: 1024
   ```

---

### Double Compression

**Erro:** Resposta comprimida duas vezes

**Causa:**
- Proxy/Load balancer também comprimindo
- Middleware aplicado duas vezes

**Solução:**
```typescript
// Verificar Content-Encoding antes
function shouldCompress(req, res) {
  if (res.getHeader('Content-Encoding')) {
    return false; // Já comprimido
  }
  return compression.filter(req, res);
}
```

---

## Boas Práticas

### ✅ DO

**1. Use configuração balanceada por padrão**
```typescript
app.use(compressionMiddleware);
```

**2. Registre ANTES das rotas**
```typescript
app.use(compressionMiddleware);
app.use('/api', routes); // Depois
```

**3. Ajuste threshold para seu caso**
```typescript
// Se respostas são grandes, reduza
threshold: 512 // Para respostas > 10KB

// Se respostas são pequenas, aumente
threshold: 2048 // Para respostas < 5KB
```

**4. Desabilite para arquivos binários**
```typescript
app.get('/download/:file', noCompression, controller);
```

**5. Monitore CPU e latência**
```typescript
// Se CPU > 80%, use lightCompression
app.use(lightCompression);
```

---

### ❌ DON'T

**1. Não use aggressiveCompression em produção sem testar**
```typescript
// ❌ Pode sobrecarregar CPU
app.use(aggressiveCompression);

// ✅ Teste primeiro
```

**2. Não comprima arquivos já comprimidos**
```typescript
// ❌ Comprime .zip (desperdício)
app.get('/file.zip', (req, res) => res.sendFile('file.zip'));

// ✅ Desabilite compressão
app.get('/file.zip', noCompression, (req, res) => res.sendFile('file.zip'));
```

**3. Não ignore o threshold**
```typescript
// ❌ Comprime tudo (ineficiente)
threshold: 0

// ✅ Use threshold adequado
threshold: 1024
```

**4. Não registre depois das rotas**
```typescript
// ❌ Não funcionará
app.use('/api', routes);
app.use(compressionMiddleware);

// ✅ Ordem correta
app.use(compressionMiddleware);
app.use('/api', routes);
```

---

## Referências

### Arquivos Relacionados

- `cache.middleware.ts` - Cache de respostas
- `app.ts` - Setup da aplicação

### Links Externos

- [compression npm](https://github.com/expressjs/compression)
- [MDN: Content-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding)
- [zlib documentation](https://nodejs.org/api/zlib.html)

### Conceitos

- **gzip** - Algoritmo de compressão GNU zip
- **deflate** - Algoritmo de compressão DEFLATE
- **brotli** - Algoritmo moderno do Google
- **Content-Encoding** - Header HTTP de encoding

---

## Resumo

### O que é

Middleware Express para compressão automática de respostas HTTP.

### Middlewares

- **compressionMiddleware** - Balanceado (padrão)
- **aggressiveCompression** - Máxima compressão
- **lightCompression** - Mínima CPU
- **createCustomCompression** - Factory customizado
- **noCompression** - Desabilita compressão

### Benefícios

- ↓ 70-80% de bandwidth
- ↑ 2-5x velocidade (redes lentas)
- ↓ 30-60% latência total
- ✅ Suporte automático multi-algoritmo

### Quando usar

- ✅ APIs REST
- ✅ Respostas grandes (>10KB)
- ✅ Redes lentas
- ✅ Economia de dados importante