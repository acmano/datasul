-- ============================================================================
-- Query: Buscar Dados Estendidos do Item (Banco ESP)
-- ============================================================================
-- Descrição:
--   Busca dados estendidos do item do banco ESP incluindo:
--   - Dados adicionais (tabela ext-item)
--   - Tipo de contenedor (es-tipo-contenedor)
--
-- Parâmetros:
--   ? (varchar) - Código do item a ser buscado (parâmetro ODBC)
--
-- Utilizado por:
--   - item/dadosCadastrais/informacoesGerais/repository.ts :: getItemEspExtended()
--
-- Performance:
--   - WHERE executado no Progress (otimizado)
--   - LEFT JOIN para tipo-contenedor (opcional)
--
-- Cache:
--   - Gerenciado pelo repository via QueryCacheService
--
-- Última atualização: 2025-10-26
-- Migrado para ODBC direto (parte 2 de 3 - JOIN em TypeScript)
-- ============================================================================

SELECT  ei."it-codigo"           as itemCodigo
      , ei."endereco"            as endereco
      , ei."des-resumida"        as descricaoResumida
      , ei."des-alternativa"     as descricaoAlternativa
      , tc."cod-tipo-contenedor" as contenedorCodigo
      , tc."des-tipo-contenedor" as contenedorDescricao
      , ei.embalagem             as teCodigo
  FROM  pub."ext-item" ei
  LEFT  OUTER JOIN pub."es-tipo-contenedor" tc
    ON  tc."cod-tipo-contenedor" = ei."cod-tipo-contenedor"
  WHERE ei."it-codigo" = ?
