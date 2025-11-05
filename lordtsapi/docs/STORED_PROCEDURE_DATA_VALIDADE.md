# Modificação da Stored Procedure - Campos de Data de Validade

## Contexto

Este documento descreve as modificações necessárias na stored procedure `dbo.usp_ExplodeEstruturaEProcessos_JSON_v2` para incluir os campos de data de validade (`data-inicio` e `data-fim`) no resultado JSON retornado pela API de estrutura de engenharia.

## Status Atual

### Análise da Stored Procedure

A stored procedure **JÁ UTILIZA** os campos de data de validade no filtro WHERE (linhas 184-185):

```sql
AND (e."data-inicio" IS NULL OR e."data-inicio" <= ''' + @data_atual + N''')
AND (e."data-termino" IS NULL OR e."data-termino" >= ''' + @data_atual + N''')
```

**PROBLEMA**: Esses campos estão sendo usados apenas para filtrar componentes válidos na data de referência, mas **NÃO estão sendo retornados no JSON de saída**.

## Modificações Necessárias

### 1. Adicionar Campos na Tabela Temporária

**Localização**: Linha 41 (CREATE TABLE #ttEstrut)

**Modificação Necessária**:
```sql
CREATE TABLE #ttEstrut (
    linha              INT IDENTITY(1,1) PRIMARY KEY,
    nivel              INT,
    cod_estabel        NVARCHAR(200),
    it_codigo          NVARCHAR(200),
    es_codigo          NVARCHAR(4000),
    descricao          NVARCHAR(4000),
    unidade_medida     NVARCHAR(200),
    quantidade_estrut  DECIMAL(38,12),
    quantidade_acum    DECIMAL(38,12),
    parent_linha       INT NULL,
    -- ⬇️ ADICIONAR ESTES CAMPOS ⬇️
    data_inicio        DATE NULL,
    data_fim           DATE NULL
);
```

### 2. Buscar os Campos da Tabela estrutura

**Localização**: Linha 174 (DECLARE @inner_comp_lote)

**Modificação Necessária**:
```sql
DECLARE @inner_comp_lote NVARCHAR(MAX) =
N'SELECT e."it-codigo" AS it_codigo_pai,
        e."es-codigo" AS es_codigo,
        e."qtd-compon" AS qtd_compon,
        i."desc-item" AS desc_item,
        i.un AS un,
        i."cod-estabel" AS cod_estabel,
        -- ⬇️ ADICIONAR ESTES CAMPOS ⬇️
        e."data-inicio" AS data_inicio,
        e."data-termino" AS data_fim
  FROM PUB.estrutura e
  INNER JOIN PUB.item i ON i."it-codigo" = e."es-codigo"
  WHERE e."it-codigo" IN (' + @itemList + N')
    AND (e."data-inicio" IS NULL OR e."data-inicio" <= ''' + @data_atual + N''')
    AND (e."data-termino" IS NULL OR e."data-termino" >= ''' + @data_atual + N''')';
```

### 3. Atualizar Tabela Temporária de Componentes

**Localização**: Linha 165 (CREATE TABLE #temp_componentes_lote)

**Modificação Necessária**:
```sql
CREATE TABLE #temp_componentes_lote (
    it_codigo_pai   NVARCHAR(200),
    es_codigo       NVARCHAR(200),
    qtd_compon      DECIMAL(38,12),
    desc_item       NVARCHAR(4000),
    un              NVARCHAR(200),
    cod_estabel     NVARCHAR(200),
    -- ⬇️ ADICIONAR ESTES CAMPOS ⬇️
    data_inicio     DATE NULL,
    data_fim        DATE NULL
);
```

### 4. Atualizar Tabelas de Processamento de Níveis

**Localização**: Linhas 84 e 95

**Modificação Necessária em #nivelAtual**:
```sql
CREATE TABLE #nivelAtual (
    it_codigo          NVARCHAR(200),
    cod_estabel        NVARCHAR(200),
    descricao          NVARCHAR(4000),
    unidade_medida     NVARCHAR(200),
    nivel              INT,
    quantidade_estrut  DECIMAL(38,12) NULL,
    quantidade_acum    DECIMAL(38,12),
    parent_linha       INT NULL,
    -- ⬇️ ADICIONAR ESTES CAMPOS ⬇️
    data_inicio        DATE NULL,
    data_fim           DATE NULL
);
```

**Modificação Necessária em #proximoNivel**:
```sql
CREATE TABLE #proximoNivel (
    it_codigo          NVARCHAR(200),
    cod_estabel        NVARCHAR(200),
    descricao          NVARCHAR(4000),
    unidade_medida     NVARCHAR(200),
    nivel              INT,
    quantidade_estrut  DECIMAL(38,12),
    quantidade_acum    DECIMAL(38,12),
    parent_linha       INT,
    -- ⬇️ ADICIONAR ESTES CAMPOS ⬇️
    data_inicio        DATE NULL,
    data_fim           DATE NULL
);
```

### 5. Incluir Campos no INSERT para #ttEstrut

**Localização**: Linha 144 (INSERT INTO #ttEstrut)

**Modificação Necessária**:
```sql
INSERT INTO #ttEstrut (nivel, cod_estabel, it_codigo, es_codigo, descricao, unidade_medida,
                       quantidade_estrut, quantidade_acum, parent_linha, data_inicio, data_fim)
SELECT
    n.nivel,
    n.cod_estabel,
    n.it_codigo,
    REPLICATE(' ', n.nivel) + n.it_codigo,
    n.descricao,
    n.unidade_medida,
    n.quantidade_estrut,
    n.quantidade_acum,
    n.parent_linha,
    -- ⬇️ ADICIONAR ESTES CAMPOS ⬇️
    n.data_inicio,
    n.data_fim
FROM #nivelAtual n
ORDER BY n.it_codigo;
```

### 6. Incluir Campos no INSERT para #proximoNivel

**Localização**: Linha 196 (INSERT INTO #proximoNivel)

**Modificação Necessária**:
```sql
INSERT INTO #proximoNivel (it_codigo, cod_estabel, descricao, unidade_medida, nivel,
                           quantidade_estrut, quantidade_acum, parent_linha, data_inicio, data_fim)
SELECT
    LTRIM(c.es_codigo),
    c.cod_estabel,
    c.desc_item,
    c.un,
    @nivelCorrente + 1,
    c.qtd_compon,
    n.quantidade_acum * c.qtd_compon,
    (SELECT TOP 1 e.linha
     FROM #ttEstrut e
     WHERE e.it_codigo = c.it_codigo_pai
       AND e.nivel = @nivelCorrente
     ORDER BY e.linha DESC),
    -- ⬇️ ADICIONAR ESTES CAMPOS ⬇️
    c.data_inicio,
    c.data_fim
FROM #temp_componentes_lote c
INNER JOIN #nivelAtual n ON n.it_codigo = c.it_codigo_pai;
```

### 7. Incluir Campos no JSON de Saída

**Localização**: Linha 390 (Montagem do JSON)

**Modificação Necessária**:
```sql
SELECT
    'codigo'               = e.it_codigo,
    'estabelecimento'      = e.cod_estabel,
    'descricao'            = e.descricao,
    'unidadeMedida'        = e.unidade_medida,
    'nivel'                = e.nivel,
    'quantidadeEstrutura'  = e.quantidade_estrut,
    'quantidadeAcumulada'  = e.quantidade_acum,
    -- ⬇️ ADICIONAR ESTES CAMPOS ⬇️
    'dataInicio'           = CONVERT(VARCHAR(10), e.data_inicio, 23),  -- Formato YYYY-MM-DD
    'dataFim'              = CONVERT(VARCHAR(10), e.data_fim, 23),     -- Formato YYYY-MM-DD
    'processoFabricacao'   = JSON_QUERY(
        -- ... resto do JSON
    )
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
```

### 8. Incluir Campos na Inserção do Nível Raiz

**Localização**: Linha 133 (INSERT INTO #nivelAtual para item raiz)

**Modificação Necessária**:
```sql
INSERT INTO #nivelAtual (it_codigo, cod_estabel, descricao, unidade_medida, nivel,
                        quantidade_estrut, quantidade_acum, parent_linha, data_inicio, data_fim)
SELECT r.it_codigo, r.cod_estabel, r.desc_item, r.un, 0, NULL, 1, NULL, NULL, NULL
FROM #root r;
```

**Observação**: Para o item raiz, `data_inicio` e `data_fim` são NULL, pois ele não é um componente de uma estrutura pai.

## Formato das Datas

**Formato Progress**: As datas no Progress podem estar em formato MM/DD/YYYY ou como número de dias desde uma data base.

**Formato de Saída**: YYYY-MM-DD (ISO 8601)

**Conversão no SQL Server**:
- Use `CONVERT(VARCHAR(10), campo_data, 23)` para garantir formato YYYY-MM-DD
- Campos podem ser NULL se não houver data de validade

## Teste da Modificação

Após aplicar as modificações, execute a stored procedure e verifique se o JSON de saída inclui os campos:

```sql
EXEC dbo.usp_ExplodeEstruturaEProcessos_JSON_v2
    @ItemInicial = '7530110',
    @DataReferencia = '2025-01-23',
    @LinkedServer = 'TST_EMS2EMP';
```

**Resultado esperado** (exemplo):
```json
{
  "itemPrincipal": {
    "codigo": "7530110",
    "estabelecimento": "01.01",
    "descricao": "RESISTÊNCIA 220V 5500W",
    "unidadeMedida": "UN",
    "nivel": 0,
    "quantidadeEstrutura": null,
    "quantidadeAcumulada": 1.0,
    "dataInicio": null,
    "dataFim": null,
    "componentes": [
      {
        "codigo": "COMP001",
        "estabelecimento": "01.01",
        "descricao": "Componente 1",
        "unidadeMedida": "UN",
        "nivel": 1,
        "quantidadeEstrutura": 2.0,
        "quantidadeAcumulada": 2.0,
        "dataInicio": "2024-01-01",
        "dataFim": "2025-12-31",
        "componentes": []
      }
    ]
  }
}
```

## Impacto e Compatibilidade

### Backend (TypeScript)

✅ **JÁ PREPARADO**: Os tipos TypeScript já foram atualizados para suportar os campos `dataInicio` e `dataFim`:

```typescript
export interface ItemEstrutura {
  codigo: string;
  estabelecimento: string;
  descricao: string;
  unidadeMedida: string;
  nivel: number;
  quantidadeEstrutura: number | null;
  quantidadeAcumulada: number;
  dataInicio?: string | null; // ✅ Já adicionado
  dataFim?: string | null;     // ✅ Já adicionado
  processoFabricacao: ProcessoFabricacao;
  componentes: ItemEstrutura[];
}
```

### Documentação OpenAPI

✅ **JÁ ATUALIZADA**: A documentação Swagger foi atualizada com os novos campos.

### Testes

✅ **JÁ CRIADOS**: Testes unitários foram adicionados para validar a presença dos campos de data.

## Checklist de Implementação

- [ ] 1. Backup da stored procedure atual
- [ ] 2. Adicionar campos em #ttEstrut (linha 41)
- [ ] 3. Adicionar campos em #temp_componentes_lote (linha 165)
- [ ] 4. Adicionar campos em #nivelAtual (linha 84)
- [ ] 5. Adicionar campos em #proximoNivel (linha 95)
- [ ] 6. Modificar @inner_comp_lote para buscar data-inicio e data-termino (linha 174)
- [ ] 7. Atualizar INSERT INTO #ttEstrut (linha 144)
- [ ] 8. Atualizar INSERT INTO #proximoNivel (linha 196)
- [ ] 9. Atualizar INSERT INTO #nivelAtual raiz (linha 133)
- [ ] 10. Adicionar campos 'dataInicio' e 'dataFim' no JSON de saída (linha 390)
- [ ] 11. Testar a stored procedure modificada
- [ ] 12. Validar formato das datas (YYYY-MM-DD)
- [ ] 13. Testar com itens que possuem datas NULL
- [ ] 14. Testar com itens que possuem datas preenchidas
- [ ] 15. Validar estruturas com múltiplos níveis

## Observações Importantes

1. **Campos Opcionais**: Os campos `data-inicio` e `data-fim` podem ser NULL na tabela estrutura do Progress.

2. **Item Raiz**: O item principal (nível 0) não possui datas de validade, pois não é um componente de outra estrutura.

3. **Filtro Mantido**: O filtro WHERE que usa essas datas deve ser mantido, pois ele garante que apenas componentes válidos na data de referência sejam incluídos.

4. **Performance**: A adição desses campos não deve impactar significativamente a performance, pois são apenas 2 campos DATE adicionais.

5. **Retrocompatibilidade**: Como os campos são opcionais (nullable) no TypeScript, o código existente continua funcionando mesmo se a SP não retornar esses campos inicialmente.

## Contato

Para dúvidas sobre a implementação, consultar a equipe de backend ou o desenvolvedor responsável pela API de estrutura de engenharia.

---

**Versão**: 1.0
**Data**: 2025-10-23
**Autor**: Sistema LordtsAPI Backend
