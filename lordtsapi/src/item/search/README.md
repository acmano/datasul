# Item Search API

Endpoint de busca de itens com suporte a múltiplos critérios combinados e wildcards.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Endpoint](#endpoint)
- [Critérios de Busca](#critérios-de-busca)
- [Caracteres Curinga (Wildcards)](#caracteres-curinga-wildcards)
- [Exemplos de Uso](#exemplos-de-uso)
- [Comportamento Especial do GTIN](#comportamento-especial-do-gtin)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

Busca dinâmica de itens usando critérios combinados com operador **AND**.

### ✨ Características

- ✅ **Critérios dinâmicos**: Só usa os campos que você informar
- ✅ **Combinação AND**: Todos os critérios devem ser satisfeitos
- ✅ **Wildcards**: `*` e `%` em código e descrição
- ✅ **GTIN duplo**: Busca em gtin13 E gtin14 simultaneamente
- ✅ **Performance**: Filtros no Progress (não SQL Server)
- ✅ **Cache**: 10 minutos por combinação de filtros

---

## Endpoint

```
GET /api/item/search
```

### Query Parameters (pelo menos UM obrigatório)

| Parâmetro | Tipo | Tamanho | Wildcards | Descrição |
|-----------|------|---------|-----------|-----------|
| `codigo` | string | 1-16 | ✅ Sim | Código do item |
| `descricao` | string | 1-200 | ✅ Sim | Descrição do item |
| `familia` | string | 1-8 | ❌ Não | Código da família (exato) |
| `familiaComercial` | string | 1-8 | ❌ Não | Código da família comercial (exato) |
| `grupoEstoque` | string | 1-8 | ❌ Não | Código do grupo de estoque (exato) |
| `gtin` | string | 13-14 | ❌ Não | GTIN/EAN (apenas números) |

---

## Critérios de Busca

### Como Funcionam

1. **Dinâmicos**: Apenas campos informados entram na busca
2. **AND**: Múltiplos critérios são combinados (todos devem ser satisfeitos)
3. **Sem wildcard** = **busca exata**
4. **Com wildcard** = **busca parcial** (LIKE)

### Exemplos de Combinação

#### 🔍 Um critério
```http
GET /api/item/search?familia=001
```
→ Todos os itens da família 001

#### 🔍 Dois critérios (AND)
```http
GET /api/item/search?familia=001&descricao=%PARAFUSO%
```
→ Itens que são da família 001 **E** contém "PARAFUSO"

#### 🔍 Três critérios (AND)
```http
GET /api/item/search?familia=001&grupoEstoque=10&codigo=A%
```
→ Itens da família 001 **E** grupo 10 **E** código começa com "A"

---

## Caracteres Curinga (Wildcards)

### Quais campos aceitam?

| Campo | Aceita Wildcard? |
|-------|------------------|
| `codigo` | ✅ **Sim** (`*` ou `%`) |
| `descricao` | ✅ **Sim** (`*` ou `%`) |
| `familia` | ❌ Não |
| `familiaComercial` | ❌ Não |
| `grupoEstoque` | ❌ Não |
| `gtin` | ❌ Não (apenas números) |

### Caracteres Disponíveis

| Caractere | Significado | Exemplo | Encontra |
|-----------|-------------|---------|----------|
| `%` | Zero ou mais caracteres | `%PAR%` | PARAFUSO, PARAFU, REPARAÇÃO |
| `*` | Igual a `%` (convertido automaticamente) | `*PAR*` | Mesmo que `%PAR%` |

### Padrões Comuns

#### "Contém"
```
?descricao=%PARAFUSO%
```
→ "**PARAFUSO** SEXTAVADO", "CONJUNTO **PARAFUSO**"

#### "Começa com"
```
?codigo=A%
```
→ "**A**001", "**A**BC123"

#### "Termina com"
```
?codigo=%001
```
→ "ABC**001**", "XYZ**001**"

#### "Contém palavra no meio"
```
?descricao=%PRETO%
```
→ "BOTÃO **PRETO**", "PARAFUSO **PRETO** FOSCO"

### ⚠️ ATENÇÃO: Sem Wildcard = Busca EXATA

**Mudança importante em relação à versão anterior!**

```
❌ ANTES (comportamento antigo):
?descricao=PARAFUSO  → Buscava "%PARAFUSO%" (contém)

✅ AGORA (comportamento corrigido):
?descricao=PARAFUSO  → Busca exata "PARAFUSO"
?descricao=%PARAFUSO% → Busca contendo "PARAFUSO"
```

**Você precisa digitar os wildcards explicitamente!**

---

## Comportamento Especial do GTIN

### 1️⃣ Busca em DOIS Campos Simultaneamente

```http
GET /api/item/search?gtin=7896451824813
```

**SQL gerado:**
```sql
WHERE (extItem."cod-ean" = '7896451824813' OR extItem."cod-dun" = '7896451824813')
```

→ Retorna itens onde **gtin13 = valor** OU **gtin14 = valor**

### 2️⃣ JOIN Condicional

| GTIN informado? | JOIN usado | Comportamento |
|-----------------|------------|---------------|
| ❌ **Não** | `LEFT OUTER JOIN` | Retorna todos os itens (tenham ou não GTIN) |
| ✅ **Sim** | `INNER JOIN` | Retorna **apenas** itens que possuem GTIN cadastrado |

**Por que isso importa?**
- Se você buscar por GTIN, só aparecem itens que TÊM GTIN
- Se buscar por família (sem GTIN), aparecem todos os itens da família, com ou sem GTIN

### 3️⃣ Apenas Números

GTIN aceita **somente dígitos numéricos** (13 ou 14 dígitos).

```
✅ Válido:   7896451824813
✅ Válido:   12345678901234
❌ Inválido: 7896-451-824-813  (hífens)
❌ Inválido: %7896%  (wildcards)
❌ Inválido: ABC123  (letras)
```

---

## Exemplos de Uso

### 1. Busca por GTIN (código de barras)
```bash
curl "http://localhost:3002/api/item/search?gtin=7896451824813"
```

**Resposta:**
```json
{
  "success": true,
  "criteriosDeBusca": { "gtin": "7896451824813" },
  "data": [{
    "item": {
      "codigo": "7530110",
      "descricao": "VALVULA DE ESFERA 1/2\" BRONZE",
      "gtin13": "7896451824813",
      ...
    }
  }],
  "total": 1
}
```

### 2. Busca exata por código
```bash
curl "http://localhost:3002/api/item/search?codigo=7530110"
```
→ Apenas o item "7530110" (exato)

### 3. Busca por código com wildcard
```bash
curl "http://localhost:3002/api/item/search?codigo=753%"
```
→ Todos os códigos que começam com "753"

### 4. Busca contendo palavra na descrição
```bash
curl "http://localhost:3002/api/item/search?descricao=%VALVULA%"
```
→ Itens que contêm "VALVULA" na descrição

### 5. Família + Descrição (AND)
```bash
curl "http://localhost:3002/api/item/search?familia=450000&descricao=%BRONZE%"
```
→ Itens da família 450000 **E** contém "BRONZE"

### 6. Múltiplos critérios
```bash
curl "http://localhost:3002/api/item/search?familia=450000&grupoEstoque=40&codigo=7%"
```
→ Família 450000 **E** grupo 40 **E** código começa com "7"

---

## Resposta da API

### Sucesso (200 OK)

```json
{
  "success": true,
  "criteriosDeBusca": {
    "codigo": "",
    "descricao": "",
    "familia": "450000",
    "familiaComercial": "",
    "grupoEstoque": "",
    "gtin": ""
  },
  "data": [
    {
      "item": {
        "codigo": "7530110",
        "descricao": "VALVULA DE ESFERA 1/2\" BRONZE",
        "unidade": "UN",
        "gtin13": "7896451824813",
        "gtin14": null,
        "familia": {
          "codigo": "450000",
          "descricao": "VALVULAS"
        },
        "familiaComercial": {
          "codigo": "A02001",
          "descricao": "PRODUTOS INDUSTRIAIS"
        },
        "grupoDeEstoque": {
          "codigo": "40",
          "descricao": "MATERIAIS HIDRAULICOS"
        }
      }
    }
  ],
  "total": 1
}
```

### Erro de Validação (400)

```json
{
  "success": false,
  "error": "Pelo menos um parâmetro de busca deve ser informado"
}
```

---

## Performance

| Situação | Tempo Estimado |
|----------|----------------|
| **Cache HIT** | < 1ms |
| Código exato | ~100-200ms |
| Wildcards | ~300-500ms |
| Busca por família | ~500-800ms |

**Dicas de otimização:**
- ✅ Use filtros mais específicos (família + código)
- ✅ Evite wildcard no início: `%ABC` é mais lento que `ABC%`
- ✅ Combine múltiplos critérios para reduzir resultados

---

## Limitações

- ⚠️ **Máximo**: 100 resultados por consulta (TOP 100)
- ⚠️ **Cache**: 10 minutos por combinação de filtros
- ⚠️ **Timeout**: Queries complexas podem demorar até 30s
- ⚠️ **Rate limiting**: Varia por API key (veja `.env`)

---

## Segurança

### SQL Injection Prevention

✅ **Proteções aplicadas:**
1. Validação com Joi antes de executar
2. Escape de aspas simples (`'` → `''`)
3. Pattern matching (regex) em todos os campos
4. Filtros dentro do OPENQUERY

### Validações por Campo

| Campo | Regras |
|-------|--------|
| `codigo` | Alfanuméricos + wildcards (`*`, `%`) |
| `descricao` | Letras, números, espaços, acentos + wildcards |
| `gtin` | **Apenas** 13-14 dígitos numéricos |
| Tamanhos | Limites rígidos por campo |

---

## Troubleshooting

### 🔴 "Nenhum resultado encontrado"

**Possíveis causas:**
1. ✅ Item não existe no banco
2. ✅ Busca exata sem wildcard (tente: `codigo=%valor%`)
3. ✅ Cache desatualizado (aguarde 10min ou limpe)
4. ✅ GTIN informado mas item não tem GTIN cadastrado

### 🔴 "Pelo menos um parâmetro deve ser informado"

**Solução:** Informe pelo menos um parâmetro na query string.

### 🔴 "GTIN deve conter apenas números"

**Solução:** Remova hífens, espaços e letras do GTIN.

### 🔴 Timeout na consulta

**Soluções:**
1. Adicione mais filtros (família, grupo)
2. Use wildcards mais específicos
3. Evite buscas muito abrangentes

---

## Arquitetura

```
┌─────────────┐
│  Controller │  Valida requisição
└──────┬──────┘
       │
┌──────▼──────┐
│   Service   │  Lógica de negócio
└──────┬──────┘
       │
┌──────▼──────┐
│ Repository  │  Monta SQL + OPENQUERY
└──────┬──────┘
       │
┌──────▼──────┐
│  Progress   │  Executa filtros
│ (via OPEN-  │  Retorna dados
│  QUERY)     │
└─────────────┘
```

**Query final:**
```sql
SELECT TOP 100 ...
FROM OPENQUERY(
  PRD_EMS2EMP,
  'SELECT ... WHERE item."it-codigo" = ''7530110'''  ← Filtro no Progress!
) as item
INNER JOIN OPENQUERY(
  PRD_EMS2ESP,
  'SELECT ... WHERE gtin13 = ''7896...'' OR gtin14 = ''7896...'''  ← Filtro GTIN!
) as extItem
```

---

## Changelog

### [2025-01-24] - Correções Críticas 🔧

✅ **FIXED: Filtro GTIN movido para dentro do OPENQUERY**
- Antes: WHERE após LEFT JOIN (eliminava NULLs incorretamente)
- Depois: WHERE dentro do OPENQUERY ESP (funciona corretamente)

✅ **FIXED: Descrição sem wildcard agora é busca EXATA**
- Antes: `descricao=ABC` → buscava `%ABC%` (automático)
- Depois: `descricao=ABC` → busca exata "ABC"
- Para busca parcial: use explicitamente `descricao=%ABC%`

✅ **FIXED: JOIN condicional baseado em GTIN**
- Com GTIN: INNER JOIN (só itens que têm GTIN)
- Sem GTIN: LEFT JOIN (todos os itens)

✅ **IMPROVED: Documentação completa**
- README atualizado com todos os comportamentos
- JSDoc atualizado no código
- Exemplos práticos de uso

---

## Testes

```bash
# Executar todos os testes do módulo
npm test -- src/item/search

# Testes específicos
npm test -- src/item/search/repository.test.ts
npm test -- src/item/search/e2e.test.ts
```

---

## Autores

Desenvolvido pelo time de Backend - Lorenzetti S.A.

## Licença

Propriedade de Lorenzetti S.A. - Uso interno apenas.
