# Compressão de Respostas - Documentação

## Visão Geral

A aplicação comprime **automaticamente** todas as respostas usando **gzip/deflate/brotli**, reduzindo o tamanho em até **80%**.

**Benefícios:**
- ✅ Reduz bandwidth em 70-80%
- ✅ Respostas mais rápidas
- ✅ Menor custo de transferência de dados
- ✅ Melhor experiência do usuário
- ✅ Suporta redes lentas

---

## Como Funciona

### 1. Negociação de Compressão

```
Cliente → Servidor: Accept-Encoding: gzip, deflate, br
Servidor → Cliente: Content-Encoding: gzip
                   Content-Length: 1024 (comprimido)
```

### 2. Algoritmos Suportados

| Algoritmo | Compressão | Velocidade | Suporte |
|-----------|-----------|------------|---------|
| **gzip** | Boa | Rápido | 99% navegadores |
| **deflate** | Boa | Rápido | 95% navegadores |
| **brotli** | Melhor | Médio | Navegadores modernos |

### 3. Quando Comprime

✅ **SIM - Comprime:**
- Respostas JSON > 1KB
- Texto/HTML/CSS/JavaScript
- Cliente suporta compressão (`Accept-Encoding`)

❌ **NÃO - Não comprime:**
- Respostas < 1KB (overhead não vale a pena)
- Imagens já comprimidas (JPEG, PNG, GIF)
- Vídeos já comprimidos (MP4, WEBM)
- Arquivos já comprimidos (ZIP, GZIP)
- Cliente não suporta compressão

---

## Configuração

### Padrão (Balanceado)

```typescript
compression({
  level: 6,        // Equilíbrio entre CPU e compressão
  threshold: 1024, // Comprime a partir de 1KB
  memLevel: 8,     // Memória moderada
})
```

### Agressiva (Máxima Compressão)

Use se banda é mais crítica que CPU:

```typescript
compression({
  level: 9,        // Máxima compressão (mais CPU)
  threshold: 512,  // Comprime a partir de 512 bytes
  memLevel: 9,     // Mais memória
})
```

### Leve (Mínima CPU)

Use se CPU é limitada:

```typescript
compression({
  level: 1,        // Compressão rápida
  threshold: 2048, // Comprime apenas > 2KB
  memLevel: 6,     // Menos memória
})
```

---

## Testes

### Teste 1: Verificar se está comprimindo

```bash
# Com Accept-Encoding (deve comprimir)
curl -H "Accept-Encoding: gzip" -I http://localhost:3000/health

# Procure por:
# Content-Encoding: gzip
```

**Espera-se:**
```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Encoding: gzip         ← Comprimido!
Content-Length: 234            ← Tamanho comprimido
```

### Teste 2: Comparar tamanhos

```bash
# Sem compressão
curl http://localhost:3000/health > response.json
ls -lh response.json
# Exemplo: 1200 bytes

# Com compressão
curl -H "Accept-Encoding: gzip" http://localhost:3000/health | gunzip > response-compressed.json
# Transferido: ~300 bytes
# Economia: 75%!
```

### Teste 3: Benchmark de performance

```bash
# Instale apache bench
sudo apt-get install apache2-utils

# Teste SEM compressão
ab -n 1000 -c 10 http://localhost:3000/health

# Teste COM compressão
ab -n 1000 -c 10 -H "Accept-Encoding: gzip" http://localhost:3000/health

# Compare Transfer rate (KB/s)
```

### Teste 4: Resposta grande

```bash
# Teste com resposta grande (ex: listagem de itens)
curl -H "Accept-Encoding: gzip" -I http://localhost:3000/api/lor0138/item/dados-cadastrais/informacoes-gerais/7530110

# Verifique Content-Encoding: gzip
```

---

## Economia Real

### Exemplos de Compressão

| Tipo de Resposta | Original | Comprimido | Economia |
|------------------|----------|------------|----------|
| JSON pequeno | 500 B | 500 B | 0% (< threshold) |
| JSON médio | 5 KB | 1.2 KB | 76% |
| JSON grande | 50 KB | 8 KB | 84% |
| Health check | 1.2 KB | 350 B | 71% |
| Lista de itens | 25 KB | 4 KB | 84% |

### Cálculo de Economia Mensal

```
Requisições/dia: 100,000
Tamanho médio: 5 KB
Taxa de compressão: 75%

Sem compressão: 100k × 5 KB = 500 MB/dia = 15 GB/mês
Com compressão: 100k × 1.25 KB = 125 MB/dia = 3.75 GB/mês

Economia: 11.25 GB/mês (75%)
```

---

## Performance

### Impacto de CPU

| Nível | CPU Extra | Compressão | Recomendação |
|-------|-----------|------------|--------------|
| 1 | +2% | 50% | Servidor limitado em CPU |
| 6 | +5% | 75% | **Padrão recomendado** |
| 9 | +15% | 80% | Banda muito cara |

### Trade-offs

**Prós:**
- ✅ Reduz bandwidth drasticamente
- ✅ Respostas chegam mais rápido ao cliente
- ✅ Menor custo de transferência
- ✅ Melhor para redes lentas/móveis

**Contras:**
- ❌ Usa ~5% mais CPU
- ❌ Usa ~2-8MB mais RAM
- ❌ Latência +5-10ms para comprimir

**Conclusão:** O trade-off **vale muito a pena** na maioria dos casos!

---

## Troubleshooting

### Compressão não está funcionando

**Verifique:**

1. **Cliente suporta?**
```bash
curl -H "Accept-Encoding: gzip" -I http://localhost:3000/health | grep Content-Encoding
```

2. **Resposta grande o suficiente?**
```bash
# Deve ser > 1KB para comprimir
curl http://localhost:3000/health | wc -c
```

3. **Middleware está carregado?**
```bash
# Verifique os logs de startup
npm run dev | grep -i compression
```

4. **Ordem dos middlewares está correta?**
```typescript
// Compression deve vir ANTES das rotas
app.use(compressionMiddleware);
app.use('/api', apiRoutes);
```

### Performance piorou

**Causa:** Nível de compressão muito alto em servidor com CPU limitada

**Solução:**
```typescript
// Use nível mais baixo
compression({ level: 3 })
```

### Erro "Cannot read header after they are sent"

**Causa:** Compression middleware na ordem errada

**Solução:**
```typescript
// Compression deve vir DEPOIS de helmet/cors
// Mas ANTES de body parsers e rotas
app.use(helmet());
app.use(cors());
app.use(compression());  // ← Aqui
app.use(express.json());
```

---

## Monitoramento

### Métricas a Monitorar

1. **Taxa de compressão:**
```
(tamanho_original - tamanho_comprimido) / tamanho_original × 100
```

2. **CPU extra usado:**
```
Antes: 20% CPU
Depois: 25% CPU (+5%)
```

3. **Bandwidth economizado:**
```
Antes: 100 GB/mês
Depois: 25 GB/mês (-75%)
```

4. **Tempo de resposta:**
```
Antes: 50ms
Depois: 55ms (+5ms de compressão)
Mas chegada ao cliente: -200ms (menos dados na rede)
```

---

## Integrações

### Nginx como Reverse Proxy

Se usar Nginx, **desabilite** compressão no Nginx:

```nginx
# nginx.conf
location / {
  proxy_pass http://app:3000;
  gzip off;  # ← App já comprime
}
```

### CDN (CloudFlare, etc)

CDNs já comprimem. Você pode:
- Deixar app comprimir (redundante mas não faz mal)
- Ou desabilitar no app e deixar CDN comprimir

### Docker/Kubernetes

```yaml
# Sem configuração especial necessária
# Compressão funciona normalmente
```

---

## Boas Práticas

### ✅ DO

- **Use compression** - benefícios são grandes
- **Mantenha nível 6** - bom equilíbrio
- **Monitore CPU** - verifique se não está sobrecarregando
- **Teste a economia** - meça o impacto real
- **Use com CDN** - funciona bem junto

### ❌ DON'T

- **Não use nível 9 sempre** - só se realmente necessário
- **Não comprima arquivos já comprimidos** - imagens, vídeos, etc
- **Não ignore o threshold** - respostas pequenas não valem a pena
- **Não coloque compression depois das rotas** - não vai funcionar

---

## Alternativas

### Brotli (Mais Moderno)

```bash
npm install compression shrink-ray-current
```

```typescript
import shrinkRay from 'shrink-ray-current';
app.use(shrinkRay());  // Usa Brotli quando disponível
```

**Benefícios:**
- 15-20% melhor que gzip
- Suportado por navegadores modernos

**Desvantagens:**
- Mais CPU
- Navegadores antigos não suportam

---

## Referências

- [compression NPM](https://www.npmjs.com/package/compression)
- [HTTP Compression (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Compression)
- [Best Practices for Compression](https://web.dev/uses-text-compression/)