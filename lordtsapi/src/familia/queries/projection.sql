-- ============================================================================
-- Projeção SQL Comum - Família
-- ============================================================================
-- Descrição:
--   Define a projeção (SELECT fields) comum usada em todas as queries de
--   família. Este fragmento é reutilizado por múltiplas queries para
--   evitar duplicação.
--
-- Utilizado por:
--   - get-by-codigo.sql (via compositor)
--   - listar-todas.sql (via compositor)
--
-- Campos retornados:
--   - codigo: Código da família
--   - descricao: Descrição da família
--
-- Fonte de dados:
--   - Banco: EMP (pub.familia)
--   - Tabela: familia
--
-- Observações:
--   - Query otimizada para Progress/OpenEdge via ODBC
--   - Campos com aliases camelCase para TypeScript
--   - Sem transformações complexas (dados retornados como estão)
--
-- Última atualização: 2025-10-26
-- Criado para suportar composição modular
-- ============================================================================

SELECT  familia."fm-codigo" as codigo
      , familia."descricao" as descricao
  FROM  pub.familia familia
