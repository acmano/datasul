-- ============================================================================
-- Projeção SQL - Busca de Itens (Banco EMP)
-- ============================================================================
-- Descrição:
--   Define a projeção (SELECT fields) base para busca de itens no banco EMP.
--   Este fragmento é reutilizado com diferentes WHERE clauses dinâmicas.
--
-- Utilizado por:
--   - item/search/repository.ts :: searchItems()
--
-- Campos retornados:
--   - Identificação: codigo, descricao, itemUnidade
--   - Família: familiaCodigo, familiaDescricao
--   - Família Comercial: familiaComercialCodigo, familiaComercialDescricao
--   - Grupo de Estoque: grupoDeEstoqueCodigo, grupoDeEstoqueDescricao
--   - Tipo: tipo (extraído de item-uni-estab.char-1)
--
-- JOINs:
--   - INNER JOIN pub.familia (garantir integridade)
--   - INNER JOIN pub."fam-comerc" (garantir integridade)
--   - INNER JOIN pub."grup-estoque" (garantir integridade)
--   - INNER JOIN pub."item-uni-estab" (para tipo do item)
--
-- WHERE clause:
--   - NÃO incluída neste arquivo (construída dinamicamente)
--   - Adicionada pelo repository conforme parâmetros de busca
--
-- ORDER BY:
--   - Adicionado dinamicamente pelo repository
--
-- Última atualização: 2025-10-31
-- Padrão: projection.sql (igual depósito)
-- ============================================================================

SELECT  item."it-codigo"                as codigo
      , item."desc-item"                as descricao
      , item."un"                       as itemUnidade
      , familia."fm-codigo"             as familiaCodigo
      , familia.descricao               as familiaDescricao
      , familiaComercial."fm-cod-com"   as familiaComercialCodigo
      , familiaComercial.descricao      as familiaComercialDescricao
      , grupoEstoque."ge-codigo"        as grupoDeEstoqueCodigo
      , grupoEstoque.descricao          as grupoDeEstoqueDescricao
      , SUBSTRING(iue."char-1", 133, 2) as tipo
  FROM  pub.item item
  LEFT  OUTER JOIN pub.familia familia
    ON  familia."fm-codigo" = item."fm-codigo"
  LEFT  OUTER JOIN pub."fam-comerc" familiaComercial
    ON  familiaComercial."fm-cod-com" = item."fm-cod-com"
  LEFT  OUTER JOIN pub."grup-estoque" grupoEstoque
    ON  grupoEstoque."ge-codigo" = item."ge-codigo"
  LEFT  OUTER JOIN pub."item-uni-estab" iue
    ON  iue."it-codigo" = item."it-codigo"
    AND iue."cod-estabel" = item."cod-estabel"
