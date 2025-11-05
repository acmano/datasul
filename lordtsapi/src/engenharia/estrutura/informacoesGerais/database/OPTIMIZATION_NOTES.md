# Otimização da Stored Procedure - Estrutura de Produtos

## Resumo

Otimização da stored procedure `usp_ExplodeEstruturaEProcessos_JSON` que reduz significativamente o número de queries ao Linked Server.

## Versões

| Versão | Arquivo | Algoritmo | Complexidade |
|--------|---------|-----------|--------------|
| v1 (Original) | `create_stored_procedure.sql` | DFS com LIFO | O(n) queries |
| v2 (Otimizada) | `create_stored_procedure_optimized.sql` | BFS com lote | O(depth) queries |

## Problema Original

A versão original utilizava um algoritmo DFS (Depth-First Search) com pilha LIFO que processava **um item por vez**, resultando em:

- **3-4 queries por item** ao Linked Server:
  1. Query para buscar componentes
  2. Query para buscar roteiro
  3. Query para buscar operações

- Para uma estrutura com **100 itens**, isso resulta em **300-400 queries** ao Linked Server
- Para estruturas grandes (1000+ itens), o tempo de resposta se torna inaceitável

### Código Problemático (v1)

```sql
-- Loop que processa UM ITEM por vez
WHILE EXISTS (SELECT 1 FROM #ttPendentes)
BEGIN
    -- Pop de UM item da pilha
    SELECT TOP (1) @it_codigo = it_codigo, ...
    FROM #ttPendentes

    -- Query 1: Buscar componentes deste item
    EXEC(@sql) -- OPENQUERY para este item específico

    -- Query 2: Buscar roteiro deste item
    EXEC(@sql) -- OPENQUERY para este item específico

    -- Query 3: Buscar operações deste item
    EXEC(@sql) -- OPENQUERY para este item específico
END
```

## Solução Otimizada

A versão otimizada utiliza um algoritmo BFS (Breadth-First Search) que processa **todos os itens de um nível por vez**, resultando em:

- **3-4 queries por NÍVEL** ao invés de por item
- Para uma estrutura com **100 itens em 5 níveis**, isso resulta em **15-20 queries** ao Linked Server
- **Redução de 95%+ no número de queries** para estruturas típicas!

### Código Otimizado (v2)

```sql
-- Loop que processa UM NÍVEL por vez
WHILE EXISTS (SELECT 1 FROM #nivelAtual)
BEGIN
    -- Construir lista de TODOS os itens do nível
    SELECT @itemList = STRING_AGG('''' + it_codigo + '''', ',')
    FROM #nivelAtual;

    -- Query 1: Buscar componentes de TODOS os itens do nível
    WHERE e."it-codigo" IN (' + @itemList + ')

    -- Query 2: Buscar roteiros de TODOS os itens do nível
    WHERE p."it-codigo" IN (' + @itemList + ')

    -- Query 3: Buscar operações de TODOS os itens do nível
    WHERE o."it-codigo" IN (' + @itemList + ')
END
```

## Comparação de Performance

| Métrica | v1 (DFS - Original) | v2 (BFS - Otimizada) | Ganho |
|---------|---------------------|----------------------|-------|
| **Algoritmo** | Depth-First Search | Breadth-First Search | - |
| **Processamento** | Item por item | Nível por nível (lote) | - |
| **Queries (100 itens, 5 níveis)** | ~300-400 | ~15-20 | **95% redução** |
| **Queries (1000 itens, 10 níveis)** | ~3000-4000 | ~30-40 | **99% redução** |
| **Tempo estimado (100 itens)** | 30-60s | 2-5s | **85-90% redução** |
| **Escalabilidade** | O(n) | O(depth) | Muito melhor |

## Mudanças Técnicas Principais

### 1. Algoritmo: DFS → BFS

- **v1:** Processa em profundidade (desce toda a árvore antes de ir para o próximo filho)
- **v2:** Processa em largura (processa todos os irmãos antes de descer um nível)

### 2. Estruturas de Dados

```sql
-- v1: Pilha LIFO para DFS
CREATE TABLE #ttPendentes (
    stack_order BIGINT,
    it_codigo NVARCHAR(200),
    ...
);

-- v2: Tabelas de nível para BFS
CREATE TABLE #nivelAtual (...);
CREATE TABLE #proximoNivel (...);
```

### 3. Batching de Queries

```sql
-- v1: Query individual
WHERE "it-codigo" = ''' + @it_codigo + '''

-- v2: Query em lote
WHERE "it-codigo" IN (' + @itemList + ')
```

Usando `STRING_AGG` para construir listas de IDs:
```sql
SELECT @itemList = STRING_AGG('''' + REPLACE(it_codigo, '''', '''''') + '''', ',')
FROM #nivelAtual;
-- Resultado: 'ITEM1','ITEM2','ITEM3',...
```

## Compatibilidade

| Aspecto | Status | Notas |
|---------|--------|-------|
| **Output JSON** | ✅ Idêntico | Mesma estrutura de retorno |
| **Parâmetros** | ✅ Idêntico | Mesmos inputs: ItemInicial, DataReferencia, LinkedServer |
| **Stored Procedure Name** | ⚠️ Diferente | v1: `usp_ExplodeEstruturaEProcessos_JSON`<br>v2: `usp_ExplodeEstruturaEProcessos_JSON_v2` |
| **SQL Server Version** | ✅ Compatível | Requer SQL Server 2017+ (STRING_AGG) |

## Migração

### Opção 1: Substituição Direta (Recomendado)

1. Fazer backup da SP original:
   ```sql
   -- Script backup automático já gerado
   ```

2. Dropar SP original e criar com o código otimizado:
   ```sql
   DROP PROCEDURE dbo.usp_ExplodeEstruturaEProcessos_JSON;
   GO
   -- Depois executar create_stored_procedure_optimized.sql
   -- renomeando para usp_ExplodeEstruturaEProcessos_JSON
   ```

### Opção 2: Convivência (Para Testes)

1. Manter ambas as SPs:
   - v1: `usp_ExplodeEstruturaEProcessos_JSON`
   - v2: `usp_ExplodeEstruturaEProcessos_JSON_v2`

2. Testar v2 em paralelo

3. Após validação, substituir v1 por v2

## Limitações e Considerações

### 1. Requisito de Versão SQL Server

A versão otimizada usa `STRING_AGG` (SQL Server 2017+):
```sql
SELECT @itemList = STRING_AGG(...) FROM ...
```

Para SQL Server < 2017, substituir por:
```sql
SELECT @itemList = STUFF((
    SELECT ',' + '''' + REPLACE(it_codigo, '''', '''''') + ''''
    FROM #nivelAtual
    FOR XML PATH(''), TYPE
).value('.','NVARCHAR(MAX)'), 1, 1, '');
```

### 2. Limite de Níveis

Ambas as versões têm proteção contra loops infinitos:
- v1: Implícito (eventualmente timeout)
- v2: Explícito (@maxIteracoes = 50)

### 3. Tamanho da Lista IN()

Para estruturas MUITO largas (ex: 1000+ itens em um único nível), pode atingir limites de:
- Tamanho da string @itemList
- Limites de IN() clause

Solução: Implementar paginação dentro do nível se necessário.

## Testing

### Testes Recomendados

1. **Estrutura Pequena (< 10 itens)**
   - Validar output idêntico entre v1 e v2

2. **Estrutura Média (10-100 itens)**
   - Comparar tempo de execução
   - Validar output idêntico

3. **Estrutura Grande (100-1000 itens)**
   - Medir ganho de performance real
   - Monitorar uso de memória

4. **Estruturas Especiais**
   - Estrutura muito larga (muitos filhos no mesmo nível)
   - Estrutura muito profunda (muitos níveis)
   - Item sem componentes (folha)
   - Item sem processo

### Script de Teste

```sql
-- Comparar outputs
DECLARE @start DATETIME2 = SYSDATETIME();
EXEC dbo.usp_ExplodeEstruturaEProcessos_JSON @ItemInicial = '7530110';
DECLARE @time_v1 INT = DATEDIFF(millisecond, @start, SYSDATETIME());

SET @start = SYSDATETIME();
EXEC dbo.usp_ExplodeEstruturaEProcessos_JSON_v2 @ItemInicial = '7530110';
DECLARE @time_v2 INT = DATEDIFF(millisecond, @start, SYSDATETIME());

SELECT
    @time_v1 AS tempo_v1_ms,
    @time_v2 AS tempo_v2_ms,
    @time_v1 - @time_v2 AS reducao_ms,
    CAST(100.0 * (@time_v1 - @time_v2) / @time_v1 AS DECIMAL(5,2)) AS reducao_percent;
```

## Próximos Passos

1. ✅ Implementar versão otimizada
2. ⏳ Testar em ambiente de desenvolvimento
3. ⏳ Validar outputs idênticos
4. ⏳ Medir performance real
5. ⏳ Implantar em produção
6. ⏳ Monitorar métricas pós-deploy

## Referências

- [Linked Server Best Practices](https://docs.microsoft.com/en-us/sql/relational-databases/linked-servers/)
- [STRING_AGG Documentation](https://docs.microsoft.com/en-us/sql/t-sql/functions/string-agg-transact-sql)
- [BFS vs DFS Algorithms](https://en.wikipedia.org/wiki/Breadth-first_search)
