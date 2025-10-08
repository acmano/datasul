# ✅ Checklist: Implementar Correlation ID

## 📋 Passo a Passo

### 1. Criar Arquivo de Tipos TypeScript
```bash
# Criar diretório se não existir
mkdir -p src/shared/types

# Criar arquivo
# src/shared/types/express.d.ts
```

Copiar conteúdo do artifact: **"express.d.ts - Tipos TypeScript para Correlation ID"**

---

### 2. Criar Middleware de Correlation ID
```bash
# Criar arquivo
# src/shared/middlewares/correlationId.middleware.ts
```

Copiar conteúdo do artifact: **"correlationId.middleware.ts - Middleware de Correlation ID"**

---

### 3. Atualizar app.ts
```bash
# Substituir arquivo
# src/app.ts
```

Copiar conteúdo do artifact: **"app.ts - Atualizado com Correlation ID Middleware"**

**Principais mudanças:**
- ✅ Import do `correlationIdMiddleware`
- ✅ Middleware como PRIMEIRO na cadeia
- ✅ Logs usando `correlationId` ao invés de `requestId`
- ✅ CORS com headers de correlation ID
- ✅ Documentação Swagger atualizada
- ✅ Todas as respostas incluem `correlationId`

---

### 4. Atualizar swagger.config.ts
```bash
# Atualizar schema HealthCheck
# src/config/swagger.config.ts
```

**Adicionar no schema HealthCheck:**
```typescript
correlationId: {
  type: 'string',
  format: 'uuid',
  description: 'Correlation ID para rastreamento da requisição',
  example: '550e8400-e29b-41d4-a716-446655440000'
}
```

Copiar do artifact: **"swagger.config.ts - Configuração do Swagger"** (já está atualizado)

---

### 5. Atualizar informacoesGerais.routes.ts
```bash
# Atualizar documentação
# src/api/lor0138/item/dadosCadastrais/informacoesGerais/routes/informacoesGerais.routes.ts
```

Copiar conteúdo do artifact: **"informacoesGerais.routes.ts - Versão Mesclada"** (já está atualizado)

---

### 6. Verificar tsconfig.json
```bash
# Confirmar que typeRoots está configurado
cat tsconfig.json | grep -A 3 "typeRoots"
```

**Deve conter:**
```json
"typeRoots": [
  "./node_modules/@types",
  "./src/shared/types"
]
```

✅ **Já está configurado!** (visto no arquivo fornecido)

---

### 7. Reiniciar Servidor
```bash
# Parar servidor (Ctrl+C)
# Limpar cache (opcional)
rm -rf .ts-node dist

# Iniciar novamente
npm run dev
```

---

### 8. Testar Implementação

#### Teste 1: Health Check
```bash
curl -i http://lor0138.lorenzetti.ibe:3000/health
```

**Verificar:**
- ✅ Header `X-Correlation-ID` presente
- ✅ Body contém `correlationId`
- ✅ Ambos são UUID v4 válidos

#### Teste 2: Cliente Envia ID
```bash
curl -i -H "X-Correlation-ID: test-123" http://lor0138.lorenzetti.ibe:3000/health
```

**Verificar:**
- ✅ Header `X-Correlation-ID: test-123`
- ✅ Body contém `"correlationId": "test-123"`

#### Teste 3: Script Completo
```bash
chmod +x test-correlation-id.sh
./test-correlation-id.sh
```

**Esperado:**
```
🎉 ITEM 9 - CORRELATION ID: COMPLETO!
```

---

### 9. Verificar Logs
```bash
# Fazer uma requisição
curl -H "X-Correlation-ID: log-test-001" http://lor0138.lorenzetti.ibe:3000/health

# Buscar nos logs
grep "log-test-001" logs/app-$(date +%Y-%m-%d).log
```

**Deve aparecer:**
```json
{"level":"info","correlationId":"log-test-001","message":"HTTP Request",...}
{"level":"info","correlationId":"log-test-001","message":"Health check executado",...}
```

---

### 10. Verificar Swagger
```bash
# Acessar
http://lor0138.lorenzetti.ibe:3000/api-docs
```

**Verificar:**
- ✅ Endpoints mostram parâmetro `X-Correlation-ID` (header)
- ✅ Responses mostram header `X-Correlation-ID`
- ✅ Schema `HealthCheck` tem campo `correlationId`
- ✅ Exemplos incluem correlation ID

---

## ✅ Checklist Final

- [ ] Arquivo `express.d.ts` criado em `src/shared/types/`
- [ ] Arquivo `correlationId.middleware.ts` criado em `src/shared/middlewares/`
- [ ] `app.ts` atualizado com middleware de correlation ID
- [ ] `swagger.config.ts` atualizado com campo `correlationId`
- [ ] `informacoesGerais.routes.ts` atualizado com doc do correlation ID
- [ ] `tsconfig.json` tem typeRoots correto (já configurado)
- [ ] Servidor reiniciado sem erros
- [ ] Teste 1: Server gera ID automaticamente ✅
- [ ] Teste 2: Aceita ID do cliente ✅
- [ ] Teste 3: Script de teste passa todos os testes ✅
- [ ] Logs contém `correlationId` ✅
- [ ] Swagger documenta correlation ID ✅

---

## 🐛 Troubleshooting

### Erro: "Property 'id' does not exist on type 'Request'"

**Solução:**
1. Verificar se `express.d.ts` existe em `src/shared/types/`
2. Verificar se `tsconfig.json` tem typeRoots correto
3. Reiniciar servidor: `npm run dev`
4. Se persistir: `rm -rf .ts-node && npm run dev`

---

### Erro: Cannot find module '@shared/middlewares/correlationId.middleware'

**Solução:**
1. Verificar se arquivo foi criado: `ls src/shared/middlewares/correlationId.middleware.ts`
2. Verificar se paths estão configurados no `tsconfig.json`:
   ```json
   "baseUrl": "./src",
   "paths": {
     "@shared/*": ["shared/*"]
   }
   ```

---

### Correlation ID não aparece no Swagger

**Solução:**
1. Limpar cache: `rm -rf .ts-node`
2. Verificar se anotação `@openapi` está presente nas rotas
3. Reiniciar servidor
4. Acessar `/api-docs.json` e verificar se campo está lá

---

### Logs não mostram correlationId

**Solução:**
1. Verificar se middleware está sendo usado: checar `app.ts`
2. Verificar ordem dos middlewares (correlation ID deve ser o primeiro)
3. Verificar se logs usam `correlationId` ao invés de `requestId`
4. Fazer request de teste e verificar console

---

## 🎯 Resultado Final

Após seguir todos os passos:

✅ **Correlation ID funcionando end-to-end**
- Cliente pode enviar ou servidor gera automaticamente
- Propagado em todos os logs
- Documentado no Swagger
- Headers HTTP corretos
- Tipos TypeScript funcionando

✅ **Item 9 da lista: COMPLETO!**

---

## 🚀 Próximos Passos

Agora você pode:

1. ⏭️ **Item 8** - Graceful Shutdown Completo
2. ⏭️ **Item 10** - Cache de Queries
3. 📚 Ler o guia completo: `CORRELATION-ID-GUIDE.md`
4. 🧪 Explorar casos de uso avançados

**Qual implementar agora?** 🎯