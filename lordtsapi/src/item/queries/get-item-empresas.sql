-- ============================================================================
-- Query: Buscar Empresas (Estabelecimentos) do Item (ODBC - Banco EMP)
-- ============================================================================
-- Descrição:
--   Busca relação item x estabelecimento do banco EMP
--   JOIN com estabelec (MULT) deve ser feito em TypeScript
--
-- Parâmetros:
--   ? (varchar) - Código do item a ser buscado (parâmetro ODBC)
--
-- Utilizado por:
--   - item/empresas/repository.ts :: getItemEmpresas()
--
-- Performance:
--   - WHERE executado no Progress (otimizado)
--   - Retorna N registros (um por estabelecimento)
--   - Ordenado por código do estabelecimento
--   - JOIN com MULT movido para TypeScript (multi-database)
--
-- Cache:
--   - TTL: Configurado no QueryCacheService
--
-- Última atualização: 2025-10-26
-- Migrado para ODBC - JOIN com MULT em TypeScript
-- ============================================================================

SELECT  ie."it-codigo"    as itemcod
      , ie."cod-estabel"  as estabcod
      , ie."cod-obsoleto" as status
  FROM  pub."item-uni-estab" ie
  WHERE ie."it-codigo" = ?
  ORDER BY  ie."cod-estabel"
