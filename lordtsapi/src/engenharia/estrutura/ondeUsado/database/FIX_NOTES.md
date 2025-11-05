# Correção da Stored Procedure usp_OndeUsado_JSON

## 🐛 Problema Encontrado

```
STRING_AGG aggregation result exceeded the limit of 8000 bytes.
Use LOB types to avoid result truncation.
```

**Causa:** O SQL Server limita o resultado do `STRING_AGG` a 8000 bytes quando não especificado explicitamente o tipo.

## ✅ Correção Aplicada

### Mudança 1: STRING_AGG com CAST (Linha ~176-180)

**ANTES:**
```sql
DECLARE @itemList NVARCHAR(MAX);
SELECT @itemList = STRING_AGG('''' + REPLACE(it_codigo, '''', '''''') + '''', ',')
FROM #nivelAtual;
```

**DEPOIS:**
```sql
DECLARE @itemList NVARCHAR(MAX);
SELECT @itemList = STRING_AGG(
    CAST('''' + REPLACE(it_codigo, '''', '''''') + '''' AS NVARCHAR(MAX)),
    ','
)
FROM #nivelAtual;
```

### Mudança 2: CAST no JSON recursivo (Linha ~473)

**ANTES:**
```sql
SELECT ',' + j.json
FROM #json_node j
```

**DEPOIS:**
```sql
SELECT ',' + CAST(j.json AS NVARCHAR(MAX))
FROM #json_node j
```

## 📦 Arquivos

- **Original:** `create_stored_procedure.sql` (com bug)
- **Corrigido:** `create_stored_procedure_fixed.sql` (usar este!)

## 🚀 Como Aplicar

### Opção 1: Via SQL Server Management Studio (SSMS)

1. Abra o SSMS
2. Conecte ao banco de dados
3. Abra o arquivo `create_stored_procedure_fixed.sql`
4. Execute o script (F5)

### Opção 2: Via sqlcmd (linha de comando)

```bash
sqlcmd -S <servidor> -d <database> -i create_stored_procedure_fixed.sql
```

### Opção 3: Azure Data Studio

1. Abra o Azure Data Studio
2. Conecte ao banco
3. Abra `create_stored_procedure_fixed.sql`
4. Execute o script

## ✅ Validação

Após executar, teste o endpoint:

```bash
curl "http://localhost:3000/api/engenharia/estrutura/ondeUsado/310064" | jq
```

## 📊 Detalhes Técnicos

A correção garante que:
- O `STRING_AGG` pode gerar listas de itens maiores que 8000 bytes
- O JSON recursivo não será truncado
- Estruturas com muitos níveis funcionarão corretamente

## 🔍 Teste com Item Grande

Para testar com um item que tem muitos pais:

```bash
curl "http://localhost:3000/api/engenharia/estrutura/ondeUsado/310064" | jq '.data.metadata'
```

Deve retornar metadata sem erro de truncamento.
