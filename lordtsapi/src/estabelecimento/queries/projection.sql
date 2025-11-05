-- ============================================================================
-- Projeção SQL Comum - Estabelecimento
-- ============================================================================
-- Descrição:
--   Define a projeção (SELECT fields) comum usada em todas as queries de
--   estabelecimento. Este fragmento é reutilizado por múltiplas queries para
--   evitar duplicação.
--
-- Utilizado por:
--   - get-by-codigo.sql (via compositor)
--   - Futuras queries de estabelecimento
--
-- Campos retornados:
--   - codigo: Código do estabelecimento
--   - nome: Nome do estabelecimento
--
-- Fonte de dados:
--   - Banco: MULT (pub.estabelec)
--   - Tabela: estabelec
--
-- Observações:
--   - Query otimizada para Progress/OpenEdge via ODBC
--   - Campos com aliases camelCase para TypeScript
--   - Sem transformações complexas (dados retornados como estão)
--
-- Última atualização: 2025-10-26
-- Criado para suportar composição modular
-- ============================================================================

SELECT  estabelec."cod-estabel" as codigo
      , estabelec."nome"        as nome
  FROM  pub.estabelec estabelec
