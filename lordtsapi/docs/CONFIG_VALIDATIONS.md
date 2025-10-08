# Validação de Configuração - Documentação

## Visão Geral

O sistema valida **todas as configurações na startup** antes de iniciar o servidor. Se houver erros críticos, a aplicação **falha rápido** (fail fast) e não inicia.

**Benefícios:**
- ✅ Detecta problemas de configuração imediatamente
- ✅ Previne comportamento inesperado em produção
- ✅ Mensagens claras sobre o que está errado
- ✅ Diferencia erros críticos de avisos

---

## Como Funciona

### 1. Na Startup

```typescript
// src/server.ts
ConfigValidator.validateAndExit(); // Valida TUDO
ConfigValidator.printSummary();    // Mostra resumo
```

### 2. Tipos de Mensagens

**Erros Críticos (❌)**: Impedem a aplicação de iniciar
- Configurações obrigatórias ausentes
- Valores inválidos que causariam falhas

**Avisos (⚠️)**: Permitem iniciar, mas indicam problemas potenciais
- Valores não recomendados
- Configurações subótimas
- Modo de desenvolvimento ativo

---

## Validações Implementadas

### 🖥️ Servidor

| Configuração | Validação | Tipo |
|-------------|-----------|------|
| `PORT` | Deve estar entre 1-65535 | Erro |
| `NODE_ENV` | Deve ser 'development', 'production' ou 'test' | Aviso |
| `API_PREFIX` | Deve começar com "/" | Erro |

**Exemplo de erro:**
```
❌ PORT inválida: 70000. Deve estar entre 1 e 65535.
```

---

### 🗄️ Banco de Dados

| Configuração | Validação | Tipo |
|-------------|-----------|------|
| `DB_CONNECTION_TYPE` | Deve ser 'sqlserver' ou 'odbc' | Erro |
| `DB_SERVER` | Não pode ser vazio ou 'localhost' (produção) | Erro |
| `DB_USER` | Obrigatório se não for mock | Erro |
| `DB_PASSWORD` | Obrigatório se não for mock | Erro |
| `DB_NAME_EMP` | Obrigatório | Erro |
| `DB_NAME_MULT` | Obrigatório | Erro |
| `DB_CONNECTION_TIMEOUT` | Recomendado >= 10s | Aviso |
| `DB_REQUEST_TIMEOUT` | Recomendado >= 15s | Aviso |
| `ODBC_DSN_EMP` | Obrigatório se usar ODBC | Erro |
| `ODBC_DSN_MULT` | Obrigatório se usar ODBC | Erro |
| `USE_MOCK_DATA` | Aviso se true em produção | Aviso |

**Exemplo de erro:**
```
❌ DB_SERVER não configurado ou está como "localhost".
❌ DB_PASSWORD não configurado.
```

---

### 🌐 CORS

| Configuração | Validação | Tipo |
|-------------|-----------|------|
| `CORS_ALLOWED_ORIGINS` | Não pode ser vazio | Erro |
| Formato das origens | Deve começar com http:// ou https:// | Erro |

**Exemplo de erro:**
```
❌ CORS_ALLOWED_ORIGINS não configurado. Defina ao menos uma origem permitida.
❌ Origem CORS inválida: "localhost:3000". Deve começar com http:// ou https://
```

---

### ⏱️ Timeouts

| Configuração | Validação | Tipo |
|-------------|-----------|------|
| `HTTP_REQUEST_TIMEOUT` | Recomendado entre 10-60s | Aviso |
| `HTTP_HEAVY_TIMEOUT` | Deve ser > REQUEST_TIMEOUT | Erro |
| `HTTP_HEALTH_TIMEOUT` | Recomendado <= 5s | Aviso |

**Exemplo de erro:**
```
❌ HTTP_HEAVY_TIMEOUT (20000ms) deve ser maior que HTTP_REQUEST_TIMEOUT (30000ms)
```

---

## Exemplos de Saída

### ✅ Configuração Válida

```
🔍 Validando configurações...

✅ Configurações válidas!

📋 Resumo das Configurações:
   Ambiente: production
   Porta: 3000
   API Prefix: /api
   Banco: SQLSERVER
   Mock Data: NÃO
   Timeout Request: 30000ms (30s)
   CORS Origins: 2 configurada(s)

🔌 Inicializando conexões com banco de dados...
✅ Banco de dados conectado!

🚀 Servidor iniciado com sucesso!
   URL: http://localhost:3000
   Ambiente: production
   Health Check: http://localhost:3000/health
```

### ⚠️ Configuração com Avisos

```
🔍 Validando configurações...

⚠️  Avisos de Configuração:
   - USE_MOCK_DATA=true - Usando dados falsos! Não use em produção.
   - DB_CONNECTION_TIMEOUT muito baixo (5000ms). Recomendado: >= 10000ms
   - HTTP_HEALTH_TIMEOUT muito alto (10000ms). Health checks devem ser rápidos. Recomendado: <= 5000ms

✅ Configurações válidas!

📋 Resumo das Configurações:
   ...
```

### ❌ Configuração Inválida (não inicia)

```
🔍 Validando configurações...

❌ Erros de Configuração:
   - DB_SERVER não configurado ou está como "localhost".
   - DB_USER não configurado.
   - DB_PASSWORD não configurado.
   - CORS_ALLOWED_ORIGINS não configurado. Defina ao menos uma origem permitida.

💡 Corrija as configurações no arquivo .env e tente novamente.

[Processo encerrado com código 1]
```

---

## Testando a Validação

### Teste 1: Remova uma variável obrigatória

```bash
# Edite .env e comente DB_SERVER
# DB_SERVER=10.105.0.55

# Tente iniciar
npm run dev

# Deve falhar com:
# ❌ DB_SERVER não configurado ou está como "localhost".
```

### Teste 2: Use valor inválido

```bash
# Edite .env
PORT=70000

# Tente iniciar
npm run dev

# Deve falhar com:
# ❌ PORT inválida: 70000. Deve estar entre 1 e 65535.
```

### Teste 3: Configuração válida

```bash
# Certifique-se que todas as variáveis estão corretas
# Inicie o servidor
npm run dev

# Deve iniciar normalmente:
# ✅ Configurações válidas!
# 🚀 Servidor iniciado com sucesso!
```

---

## Adicionando Novas Validações

Para adicionar validações customizadas:

### 1. Edite configValidator.ts

```typescript
// src/config/configValidator.ts

private static validateMinhaConfig(errors: string[], warnings: string[]): void {
  // Adicione suas validações aqui
  
  if (!minhaConfigObrigatoria) {
    errors.push('MINHA_CONFIG não configurada.');
  }
  
  if (minhaConfigSubotima) {
    warnings.push('MINHA_CONFIG com valor não recomendado.');
  }
}
```

### 2. Chame no método validate()

```typescript
static validate(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  this.validateServer(errors, warnings);
  this.validateDatabase(errors, warnings);
  this.validateCORS(errors, warnings);
  this.validateTimeouts(errors, warnings);
  this.validateMinhaConfig(errors, warnings); // ← Adicione aqui

  return { isValid: errors.length === 0, errors, warnings };
}
```

---

## Boas Práticas

### ✅ DO

- **Valide tudo na startup** - Fail fast é melhor que fail later
- **Mensagens claras** - Diga exatamente o que está errado
- **Diferencie erro de aviso** - Nem tudo precisa impedir a inicialização
- **Documente no .env.example** - Explique o que cada variável faz
- **Teste as validações** - Garanta que detectam problemas reais

### ❌ DON'T

- **Não deixe falhas silenciosas** - Se algo está errado, avise
- **Não assuma valores padrão para configs críticas** - Force o usuário a configurar
- **Não valide só na primeira requisição** - Valide na startup
- **Não use validações muito restritivas** - Permita flexibilidade quando apropriado

---

## Configurações por Ambiente

### Desenvolvimento

```bash
NODE_ENV=development
USE_MOCK_DATA=true  # ⚠️ Aviso, mas pode usar
DB_CONNECTION_TIMEOUT=30s  # Mais tolerante
```

### Produção

```bash
NODE_ENV=production
USE_MOCK_DATA=false  # Obrigatório
DB_SERVER=ip-real  # Não pode ser localhost
DB_CONNECTION_TIMEOUT=15s  # Mais restritivo
```

### Testes

```bash
NODE_ENV=test
USE_MOCK_DATA=true
DB_CONNECTION_TIMEOUT=5s  # Rápido para testes
```

---

## Troubleshooting

### "Configurações válidas" mas servidor não inicia

**Causa:** Erro após a validação (ex: banco inacessível)

**Solução:** Verifique os logs após "✅ Configurações válidas!"

### Validação passa mas comportamento está errado

**Causa:** Validação não cobre este caso

**Solução:** Adicione nova validação no `configValidator.ts`

### Muitos avisos, devo me preocupar?

**Resposta:** Avisos não impedem inicialização, mas indique problemas potenciais. Avalie caso a caso.

### Como testar todas as validações?

```bash
# Script para testar (crie em scripts/test-validations.sh)
#!/bin/bash

# Salva .env original
cp .env .env.backup

# Testa cada validação
echo "PORT=70000" > .env
npm run dev # Deve falhar

echo "DB_SERVER=" > .env  
npm run dev # Deve falhar

# Restaura .env
mv .env.backup .env
```

---

## Referências

- [The Twelve-Factor App - Config](https://12factor.net/config)
- [Fail Fast Principle](https://en.wikipedia.org/wiki/Fail-fast)
- [Environment Variables Best Practices](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)