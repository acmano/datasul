-- ============================================================================
-- Query: Buscar Dados Principais do Item (Banco EMP)
-- ============================================================================
-- Descrição:
--   Busca dados principais do item do banco EMP incluindo:
--   - Dados do item (tabela item)
--   - Unidade de medida (tab-unidade)
--   - Embalagem de venda (item-caixa + embalag)
--
-- Parâmetros:
--   ? (varchar) - Código do item a ser buscado (parâmetro ODBC)
--
-- Utilizado por:
--   - item/dadosCadastrais/informacoesGerais/repository.ts :: getItemEmpMain()
--
-- Performance:
--   - WHERE executado no Progress (otimizado)
--   - INNER JOINs para garantir integridade
--   - LEFT JOIN para item-caixa (nem todo item tem embalagem)
--
-- Cache:
--   - Gerenciado pelo repository via QueryCacheService
--
-- Última atualização: 2025-10-26
-- Migrado para ODBC direto (parte 1 de 3 - JOIN em TypeScript)
-- ============================================================================

SELECT  i."it-codigo"            as itemCodigo
      , i."desc-item"            as itemDescricao
      , um."un"                  as itemUnidade
      , um.descricao             as itemUnidadeDescricao
      , i."fm-codigo"            as familiaCodigo
      , i."fm-cod-com"           as familiaComercialCodigo
      , i."ge-codigo"            as grupoDeEstoqueCodigo
      , i."deposito-pad"         as deposito
      , i."cod-localiz"          as codLocalizacao
      , i."cod-obsoleto"         as status
      , i."cod-estabel"          as estabelecimentoPadraoCodigo
      , i."data-implant"         as dataImplantacao
      , i."data-liberac"         as dataLiberacao
      , i."data-obsol"           as dataObsolescencia
      , i.narrativa              as narrativa
      , e."sigla-emb"            as vendaEmbCodigo
      , e.descricao              as vendaEmbDescricao
      , ic."qt-item"             as vendaEmbItens
  FROM  pub.item i
  INNER JOIN pub."tab-unidade" um
    ON  um.un = i.un
  LEFT  OUTER JOIN pub."item-caixa" ic
    ON  ic."it-codigo" = i."it-codigo"
  LEFT  OUTER JOIN pub.embalag e
    ON  e."sigla-emb" = ic."sigla-emb"
  WHERE i."it-codigo" = ?