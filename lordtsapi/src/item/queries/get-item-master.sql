-- ============================================================================
-- Query: Buscar Dados Mestres do Item (ODBC - EMP Database)
-- ============================================================================
-- Descrição:
--   Busca informações principais do item do banco EMP incluindo:
--   - Dados básicos (código, descrição, unidade)
--   - Classificações (família, família comercial, grupo estoque)
--   - Localização (depósito, localização, estabelecimento)
--   - Status e datas
--   - Embalagem de venda
--
-- Parâmetros:
--   ? (varchar) - Código do item a ser buscado (parâmetro ODBC)
--
-- Utilizado por:
--   - item/dadosCadastrais/informacoesGerais/repository.ts :: getItemMaster()
--
-- Performance:
--   - WHERE executado no Progress (otimizado)
--   - Retorna no máximo 1 registro
--   - Query EMP apenas - dados ESP buscados separadamente
--
-- Cache:
--   - TTL: Configurado no QueryCacheService
--   - Invalidação: Automática quando houver mudanças no item
--
-- Migração:
--   - ODBC direto (sem OPENQUERY)
--   - CHOOSE() convertido para CASE WHEN
--   - CONVERT() removido - datas retornadas brutas (formatação em TypeScript)
--   - Dados ESP buscados em query separada
--   - COALESCE/NULLIF movidos para TypeScript
--
-- Última atualização: 2025-10-27
-- Migrado para ODBC - Progress SQL puro
-- ============================================================================

SELECT  i."it-codigo"      as itemCodigo
      , i."desc-item"      as itemDescricao
      , um.un              as itemUnidade
      , um.descricao       as itemUnidadeDescricao
      , i."fm-codigo"      as familiaCodigo
      , i."fm-cod-com"     as familiaComercialCodigo
      , i."ge-codigo"      as grupoDeEstoqueCodigo
      , i."deposito-pad"   as deposito
      , i."cod-localiz"    as codLocalizacao
      , i."cod-obsoleto"   as status
      , CASE SUBSTRING(iue."char-1", 133, 2)
          WHEN  0 THEN  "0 - Mercadoria para Revenda"
          WHEN  1 THEN  "1 - Matéria-prima"
          WHEN  2 THEN  "2 - Embalagem"
          WHEN  3 THEN  "3 - Produto em Processo"
          WHEN  4 THEN  "4 - Produto Acabado"
          WHEN  5 THEN  "5 - Subproduto"
          WHEN  6 THEN  "6 - Produto Intermediário"
          WHEN  7 THEN  "7 - Material de Uso e Consumo"
          WHEN  8 THEN  "8 - Ativo Imobilizado"
          WHEN  9 THEN  "9 - Serviços"
          WHEN 10 THEN "10 - Outros Insumos"
          WHEN 99 THEN "99 - Outras"
        END AS tipoItem
      , i."cod-estabel"    as estabelecimentoPadraoCodigo
      , i."data-implant"   as dataImplantacao
      , i."data-liberac"   as dataLiberacao
      , i."data-obsol"     as dataObsolescencia
      , i.narrativa        as narrativa
      , e."sigla-emb"      as vendaEmbCodigo
      , e.descricao        as vendaEmbDescricao
      , ic."qt-item"       as vendaEmbItens
  FROM  pub.item i
  INNER JOIN pub."tab-unidade" um
    ON  um.un = i.un
  LEFT  OUTER JOIN pub."item-caixa" ic
    ON  ic."it-codigo" = i."it-codigo"
  LEFT  OUTER JOIN pub.embalag e
    ON  e."sigla-emb" = ic."sigla-emb"
  LEFT  OUTER JOIN pub."item-uni-estab" iue
    ON  iue."it-codigo" = i."it-codigo"
    AND iue."cod-estabel" = i."cod-estabel"
  WHERE i."it-codigo" = ?
