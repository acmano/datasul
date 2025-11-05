# 🔧 Troubleshooting: Versão Incorreta em Produção

## 🚨 Problema Comum

**Sintoma:** A versão apresentada na tela está incorreta e o comportamento é diferente do desenvolvimento, mesmo após forçar CI/CD.

**Causa Raiz:** Cache em múltiplas camadas (navegador, CDN, Redis, Node-Cache, Service Workers)

---

## 📋 Checklist de Diagnóstico Rápido

Execute esta checklist na ordem:

### 1️⃣ Verificar se o deploy foi bem-sucedido

```bash
# Ver último workflow no GitHub Actions
gh run list --workflow="Build and Deploy" --limit 5

# Ver detalhes do último run
gh run view --log
```

**Acesse:** https://github.com/acmano/lordtsapiBackend/actions

✅ **Esperado:** Build passou, deploy concluído, health check OK

---

### 2️⃣ Executar diagnóstico completo

**No servidor de produção:**

```bash
# Clonar/puxar repositório (se necessário)
cd /caminho/para/lordtsapi

# Executar diagnóstico
./scripts/diagnose-production.sh
```

**O que o script verifica:**
- ✅ Status do serviço
- ✅ Versão do package.json
- ✅ Último commit deployado
- ✅ Arquivos compilados (dist/)
- ✅ Health check da API
- ✅ Versão retornada pela API
- ✅ Variáveis de ambiente
- ✅ Logs recentes
- ✅ Status do cache

---

### 3️⃣ Limpar TODOS os caches

**No servidor de produção:**

```bash
./scripts/clear-all-caches.sh
```

**Este script:**
1. Limpa cache do Redis
2. Limpa cache em memória (Node-Cache)
3. Reinicia o serviço
4. Verifica health check
5. Testa endpoints

---

### 4️⃣ Limpar cache do navegador

**No navegador do usuário:**

#### Chrome/Edge/Brave
1. **Hard Refresh:** `Ctrl+Shift+R` (Linux/Windows) ou `Cmd+Shift+R` (Mac)
2. **Ou limpar manualmente:**
   - `Ctrl+Shift+Delete`
   - Selecionar "Imagens e arquivos em cache"
   - Clicar em "Limpar dados"

#### Firefox
1. **Hard Refresh:** `Ctrl+F5`
2. **Ou limpar manualmente:**
   - `Ctrl+Shift+Delete`
   - Selecionar "Cache"
   - Clicar em "Limpar agora"

#### Safari
1. **Hard Refresh:** `Cmd+Option+R`
2. **Ou limpar manualmente:**
   - Safari → Preferências → Avançado → Marcar "Mostrar menu Desenvolver"
   - Desenvolver → Limpar Caches

---

### 5️⃣ Limpar Service Workers (PWA)

**Se o frontend for Progressive Web App:**

1. Abrir DevTools (`F12`)
2. Ir para **Application** (Chrome) ou **Armazenamento** (Firefox)
3. **Service Workers:**
   - Clicar em "Unregister" em todos os service workers
4. **Clear Storage:**
   - Marcar todas as opções
   - Clicar em "Clear site data"

---

### 6️⃣ Verificar CDN (se aplicável)

**Se usar CDN (Cloudflare, CloudFront, etc):**

#### Cloudflare
```bash
# Via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

#### Ou via Dashboard:
1. Acessar Cloudflare Dashboard
2. Caching → Purge Everything

---

## 🔍 Diagnóstico Detalhado

### Problema: Versão no package.json ≠ Versão da API

**Investigar:**

```bash
# No servidor de produção
cd /opt/aplicacoes/backend/current

# 1. Ver versão do package.json
grep '"version"' package.json

# 2. Consultar API
curl http://lordtsapi.lorenzetti.ibe/ | jq '.version'

# 3. Verificar quando o arquivo foi modificado
stat dist/server.js
stat dist/app.js

# 4. Ver último commit no código fonte
git log -1 --format="%H - %s (%ai)"
```

**Causas possíveis:**
- ❌ Build antigo em `/opt/aplicacoes/backend/current/dist/`
- ❌ Deploy falhou mas serviço ainda está rodando
- ❌ Múltiplas instâncias rodando (PM2, Docker)
- ❌ Versão hardcoded em `src/app.ts` não foi atualizada

---

### Problema: Comportamento diferente de dev

**Investigar:**

```bash
# 1. Comparar variáveis de ambiente
diff <(cat .env.example | sort) <(cat /opt/aplicacoes/backend/current/.env | sort)

# 2. Verificar NODE_ENV
grep NODE_ENV /opt/aplicacoes/backend/current/.env

# 3. Verificar ambiente do Datasul
grep DATASUL_ENVIRONMENT /opt/aplicacoes/backend/current/.env

# 4. Verificar conexão de banco
curl http://lordtsapi.lorenzetti.ibe/health | jq '.checks.database'
```

**Causas possíveis:**
- ❌ `NODE_ENV=production` vs `NODE_ENV=development`
- ❌ `DATASUL_ENVIRONMENT=production` vs `DATASUL_ENVIRONMENT=test`
- ❌ Dados de banco diferentes (prod vs test)
- ❌ Cache habilitado em prod, desabilitado em dev
- ❌ Mock data habilitado acidentalmente em prod

---

### Problema: Deploy passou mas nada mudou

**Verificar no servidor:**

```bash
# 1. Ver logs do systemd
sudo journalctl -u lordtsapi -n 50 --no-pager

# 2. Verificar se o arquivo foi realmente copiado
ls -lh /opt/aplicacoes/backend/current/dist/server.js

# 3. Ver data de modificação
stat /opt/aplicacoes/backend/current/dist/server.js

# 4. Comparar com backup
diff /opt/aplicacoes/backend/current/dist/server.js \
     /opt/aplicacoes/backend/backup-*/dist/server.js

# 5. Verificar permissões
ls -la /opt/aplicacoes/backend/current/
```

**Causas possíveis:**
- ❌ Permissões incorretas (runner do GitHub Actions não consegue copiar)
- ❌ Serviço não foi reiniciado
- ❌ Processo antigo ainda rodando (PID diferente)
- ❌ Deploy foi para diretório errado

---

## 🛠️ Soluções por Cenário

### Cenário 1: Cache Persistente

**Sintoma:** Deploy OK, mas versão antiga aparece

**Solução:**
```bash
# 1. Limpar cache backend
./scripts/clear-all-caches.sh

# 2. Hard refresh no navegador
# Ctrl+Shift+R (ou Cmd+Shift+R)

# 3. Limpar service workers
# F12 → Application → Service Workers → Unregister

# 4. Abrir em aba anônima
# Ctrl+Shift+N (Chrome) ou Ctrl+Shift+P (Firefox)
```

---

### Cenário 2: Deploy Incompleto

**Sintoma:** Arquivos não foram atualizados

**Solução:**
```bash
# 1. Re-executar workflow manualmente
gh workflow run "Build and Deploy" --ref main

# 2. Ou fazer deploy manual
cd /opt/aplicacoes/backend/current
git pull origin main
npm ci --only=production
npm run build
sudo systemctl restart lordtsapi

# 3. Verificar
curl http://lordtsapi.lorenzetti.ibe/health
```

---

### Cenário 3: Múltiplas Instâncias Rodando

**Sintoma:** Comportamento inconsistente (às vezes nova versão, às vezes antiga)

**Solução:**
```bash
# 1. Ver todos os processos Node
ps aux | grep node

# 2. Matar todos
pkill -f "node dist/server.js"

# 3. Reiniciar serviço
sudo systemctl restart lordtsapi

# 4. Verificar que só há 1 processo
ps aux | grep "lordtsapi"
```

---

### Cenário 4: Variáveis de Ambiente Incorretas

**Sintoma:** Comportamento completamente diferente

**Solução:**
```bash
# 1. Revisar .env em produção
cd /opt/aplicacoes/backend/current
cat .env

# 2. Comparar com .env.example
diff .env.example .env

# 3. Corrigir variáveis críticas
nano .env

# 4. Reiniciar
sudo systemctl restart lordtsapi
```

**Variáveis críticas:**
- `NODE_ENV=production`
- `DATASUL_ENVIRONMENT=production`
- `CACHE_ENABLED=true`
- `USE_MOCK_DATA=false`

---

## 📊 Verificações Pós-Correção

Após aplicar qualquer solução:

```bash
# 1. Health check
curl http://lordtsapi.lorenzetti.ibe/health | jq '.'

# 2. Versão
curl http://lordtsapi.lorenzetti.ibe/ | jq '.version'

# 3. Endpoint de teste
curl http://lordtsapi.lorenzetti.ibe/api/item/dadosCadastrais/informacoesGerais/7530110 | jq '.success'

# 4. Cache stats
curl http://lordtsapi.lorenzetti.ibe/cache/stats | jq '.'

# 5. Logs em tempo real
sudo journalctl -u lordtsapi -f
```

---

## 🚑 Procedimento de Emergência

**Se nada funcionar:**

### 1. Rollback para versão anterior
```bash
cd /opt/aplicacoes/backend

# Ver backups disponíveis
ls -lh backup-*/

# Restaurar backup
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz -C current/

# Reiniciar
sudo systemctl restart lordtsapi
```

### 2. Deploy manual forçado
```bash
cd /home/mano/projetos/datasul/lordtsapi

# Pull do main
git pull origin main

# Build
npm ci
npm run build

# Copiar para produção
sudo cp -r dist/* /opt/aplicacoes/backend/current/dist/
sudo cp package*.json /opt/aplicacoes/backend/current/

# Reinstalar dependências
cd /opt/aplicacoes/backend/current
sudo npm ci --only=production

# Reiniciar
sudo systemctl restart lordtsapi

# Verificar
sleep 5
curl http://lordtsapi.lorenzetti.ibe/health
```

### 3. Rebuild completo
```bash
cd /opt/aplicacoes/backend/current

# Backup completo
sudo tar -czf ../emergency-backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# Limpar tudo
sudo rm -rf node_modules/ dist/

# Reinstalar
sudo npm ci
sudo npm run build

# Reiniciar
sudo systemctl restart lordtsapi
```

---

## 📞 Contatos de Suporte

Se o problema persistir:

1. **GitHub Issues:** https://github.com/acmano/lordtsapiBackend/issues
2. **Logs completos:**
   ```bash
   sudo journalctl -u lordtsapi --since "1 hour ago" > logs-$(date +%Y%m%d-%H%M%S).txt
   ```
3. **Output do diagnóstico:**
   ```bash
   ./scripts/diagnose-production.sh > diagnostico-$(date +%Y%m%d-%H%M%S).txt
   ```

---

## 📚 Links Úteis

- [GitHub Actions](https://github.com/acmano/lordtsapiBackend/actions)
- [Deployment Guide](DEPLOYMENT.md)
- [API Documentation](http://lordtsapi.lorenzetti.ibe/api-docs)
- [Health Check](http://lordtsapi.lorenzetti.ibe/health)
- [Cache Stats](http://lordtsapi.lorenzetti.ibe/cache/stats)

---

**Última atualização:** 2025-10-28
**Versão:** 1.0.0
