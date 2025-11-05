-- ============================================================================
-- Projeção SQL Comum - Família Comercial
-- ============================================================================
-- Descrição:
--   Define a projeção (SELECT fields) comum usada em todas as queries de
--   família comercial. Este fragmento é reutilizado por múltiplas queries para
--   evitar duplicação.
--
-- Utilizado por:
--   - get-by-codigo.sql (via compositor)
--   - listar-todas.sql (via compositor)
--
-- Campos retornados:
--   - codigo: Código da família comercial
--   - descricao: Descrição da família comercial
--
-- Fonte de dados:
--   - Banco: EMP (pub."fam-comerc")
--   - Tabela: fam-comerc
--
-- Observações:
--   - Query otimizada para Progress/OpenEdge via ODBC
--   - Campos com aliases camelCase para TypeScript
--   - Tabela usa nome com hífen entre aspas: "fam-comerc"
--   - Sem transformações complexas (dados retornados como estão)
--
-- Última atualização: 2025-10-26
-- Criado para suportar composição modular
-- ============================================================================

SELECT  familiaComercial."fm-cod-com" as codigo
      , familiaComercial."descricao"  as descricao
  FROM  pub."fam-comerc" familiaComercial
