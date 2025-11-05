-- ============================================================================
-- Query: Buscar Dimensões de Embalagem
-- ============================================================================
-- Descrição:
--   Busca dimensões de uma embalagem específica do banco EMP
--   Usado para enriquecer dados de dimensões do item
--
-- Parâmetros:
--   ? (varchar) - Código da embalagem (parâmetro ODBC)
--
-- Utilizado por:
--   - item/dadosCadastrais/dimensoes/repository.ts :: getEmbalagemDimensoes()
--
-- Performance:
--   - WHERE executado no Progress (otimizado)
--   - Retorna no máximo 1 registro
--   - Divisões por 100 movidas para TypeScript
--
-- Cache:
--   - Gerenciado pelo repository via QueryCacheService
--
-- Última atualização: 2025-10-26
-- Migrado para ODBC - Transformações em TypeScript
-- ============================================================================

SELECT  e."sigla-emb"  as embcod
      , e.altura       as embalt
      , e.largura      as emblarg
      , e.comprim      as embprof
      , e."peso-embal" as embpeso
  FROM  pub.embalag e
  WHERE e."sigla-emb" = ?