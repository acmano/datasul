-- ============================================================================
-- Query: Buscar Descrição de Embalagem (Banco EMP)
-- ============================================================================
-- Descrição:
--   Busca descrição de uma embalagem específica do banco EMP
--   Usado para lookup da descrição do TE (embalagem do item estendido)
--
-- Parâmetros:
--   ? (varchar) - Código da embalagem (parâmetro ODBC)
--
-- Utilizado por:
--   - item/dadosCadastrais/informacoesGerais/repository.ts :: getEmbalagemDescricao()
--
-- Performance:
--   - WHERE executado no Progress (otimizado)
--   - Retorna no máximo 1 registro
--
-- Cache:
--   - Gerenciado pelo repository via QueryCacheService
--
-- Última atualização: 2025-10-26
-- Migrado para ODBC direto (parte 3 de 3 - JOIN em TypeScript)
-- ============================================================================

SELECT  e."sigla-emb"  as teCodigo
      , e.descricao    as teDescricao
  FROM  pub.embalag e
  WHERE e."sigla-emb" = ?
