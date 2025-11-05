-- ============================================================================
-- Projeção SQL Comum - Grupo de Estoque
-- ============================================================================
-- Descrição:
--   Define a projeção (SELECT fields) comum usada em todas as queries de
--   grupo de estoque. Este fragmento é reutilizado por múltiplas queries para
--   evitar duplicação.
--
-- Utilizado por:
--   - get-by-codigo.sql (via compositor)
--   - listar-todos.sql (via compositor)
--
-- Campos retornados:
--   - codigo: Código do grupo de estoque
--   - descricao: Descrição do grupo de estoque
--
-- Fonte de dados:
--   - Banco: EMP (pub."grup-estoque")
--   - Tabela: grup-estoque
--
-- Observações:
--   - Query otimizada para Progress/OpenEdge via ODBC
--   - Campos com aliases camelCase para TypeScript
--   - Tabela usa nome com hífen entre aspas: "grup-estoque"
--   - Sem transformações complexas (dados retornados como estão)
--
-- Última atualização: 2025-10-26
-- Criado para suportar composição modular
-- ============================================================================

SELECT  grupoDeEstoque."ge-codigo" as codigo
      , grupoDeEstoque."descricao" as descricao
  FROM  pub."grup-estoque" grupoDeEstoque
