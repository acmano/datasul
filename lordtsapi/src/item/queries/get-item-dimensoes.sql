-- ============================================================================
-- Query: Buscar Dimensões do Item (ODBC)
-- ============================================================================
-- Descrição:
--   Busca todas as dimensões e medidas do item incluindo:
--   - Dimensões da peça (altura, largura, profundidade, peso)
--   - Dimensões da embalagem do item
--   - Dimensões do item embalado
--   - Dimensões do produto e sua embalagem
--   - Informações de paletização (lastro, camadas)
--   - Códigos GTIN13 e GTIN14
--
-- Parâmetros:
--   ? (varchar) - Código do item a ser buscado (parâmetro ODBC)
--
-- Utilizado por:
--   - item/dadosCadastrais/dimensoes/repository.ts :: getDimensoes()
--
-- Performance:
--   - WHERE executado no Progress (otimizado)
--   - Retorna no máximo 1 registro
--   - Joins com 2 bancos diferentes (EMP + ESP via ODBC separado)
--   - Divisões por 100 e cálculos movidos para TypeScript
--
-- Cache:
--   - TTL: Configurado no QueryCacheService
--   - Invalidação: Automática quando houver mudanças no item
--
-- Migração:
--   - ODBC direto (sem OPENQUERY)
--   - Transformações movidas para TypeScript (divisões, COALESCE, cálculos)
--   - Aliases encurtados (<20 chars) devido limitação Progress ODBC
--
-- Última atualização: 2025-10-26
-- Migrado para ODBC - Transformações em TypeScript
-- ============================================================================

SELECT  ei."it-codigo"                    as itemcod
      , ei."val-altura-item"              as pecaaltura
      , ei."val-largura-item"             as pecalargura
      , ei."val-profundidade-item"        as pecaprof
      , ei."val-peso-item"                as pecapeso
      , ei."val-altura-embal-item"        as itembalt
      , ei."val-largura-embal-item"       as itemblarg
      , ei."val-profundidade-embal-item"  as itembprof
      , ei."val-peso-embal-item"          as itembpeso
      , ei."val-altura-ivv"               as itemvalt
      , ei."val-largura-ivv"              as itemvlarg
      , ei."val-profundidade-ivv"         as itemvprof
      , ei."val-peso-ivv"                 as itemvpeso
      , ei."qtd-pecas"                    as pecasitem
      , ei."val-altura-embal-ivv"         as prodebalt
      , ei."val-largura-embal-ivv"        as prodeblarg
      , ei."val-profundidade-embal-ivv"   as prodebprof
      , ei."val-peso-embal-ivv"           as prodebpeso
      , ei."cod-ean"                      as prodgtin13
      , ei."val-altura-sku"               as prodvalt
      , ei."val-largura-sku"              as prodvlarg
      , ei."val-profunidade-sku"          as prodvprof
      , ei."val-peso-item-sku"            as prodvpeso
      , ei."qtd-itens"                    as itensprod
      , ei."cod-dun"                      as caixagtin14
      , ei."qtd-produto"                  as prodscaixa
      , ei.lastro                         as lastro
      , ei.camada                         as camada
      , ei.embalagem                      as embcod
  FROM  pub."ext-item" ei
  WHERE ei."it-codigo" = ?