-- ============================================================================
-- Projeção SQL Comum - Item Extensão
-- ============================================================================
-- Descrição:
--   Define a projeção (SELECT fields) comum usada em todas as queries de
--   extensão do item. Este fragmento é reutilizado por múltiplas queries para
--   evitar duplicação.
--
-- Utilizado por:
--   - get-by-codigo.sql (via compositor)
--
-- Campos retornados (29 campos):
--   Dados da Peça:
--   - itemcod: Código do item
--   - pecaaltura: Altura da peça
--   - pecalargura: Largura da peça
--   - pecaprof: Profundidade da peça
--   - pecapeso: Peso da peça
--
--   Dados da Embalagem do Item:
--   - itembalt: Altura da embalagem do item
--   - itemblarg: Largura da embalagem do item
--   - itembprof: Profundidade da embalagem do item
--   - itembpeso: Peso da embalagem do item
--
--   Dados IVV (Item Volume/Variante):
--   - itemvalt: Altura IVV
--   - itemvlarg: Largura IVV
--   - itemvprof: Profundidade IVV
--   - itemvpeso: Peso IVV
--   - pecasitem: Quantidade de peças por item
--
--   Dados da Embalagem do Produto:
--   - prodebalt: Altura da embalagem do produto
--   - prodeblarg: Largura da embalagem do produto
--   - prodebprof: Profundidade da embalagem do produto
--   - prodebpeso: Peso da embalagem do produto
--
--   Códigos de Barras:
--   - prodgtin13: Código EAN (GTIN-13)
--   - caixagtin14: Código DUN (GTIN-14)
--
--   Dados SKU:
--   - prodvalt: Altura do SKU
--   - prodvlarg: Largura do SKU
--   - prodvprof: Profundidade do SKU
--   - prodvpeso: Peso do SKU
--
--   Quantidades e Organização:
--   - itensprod: Quantidade de itens por produto
--   - prodscaixa: Quantidade de produtos por caixa
--   - lastro: Lastro (produtos por camada)
--   - camada: Camadas (número de camadas)
--   - embcod: Código da embalagem
--
-- Fonte de dados:
--   - Banco: ESP (pub."ext-item")
--   - Tabela: ext-item
--
-- Observações:
--   - Query otimizada para Progress/OpenEdge via ODBC
--   - Campos com aliases simplificados para facilitar uso
--   - Tabela usa nome com hífen entre aspas: "ext-item"
--   - Dados relacionados a dimensões, pesos e embalagens
--
-- Última atualização: 2025-10-26
-- Criado para suportar composição modular
-- ============================================================================

SELECT
    ei."it-codigo"                   as itemcod,
    ei."val-altura-item"             as pecaaltura,
    ei."val-largura-item"            as pecalargura,
    ei."val-profundidade-item"       as pecaprof,
    ei."val-peso-item"               as pecapeso,
    ei."val-altura-embal-item"       as itembalt,
    ei."val-largura-embal-item"      as itemblarg,
    ei."val-profundidade-embal-item" as itembprof,
    ei."val-peso-embal-item"         as itembpeso,
    ei."val-altura-ivv"              as itemvalt,
    ei."val-largura-ivv"             as itemvlarg,
    ei."val-profundidade-ivv"        as itemvprof,
    ei."val-peso-ivv"                as itemvpeso,
    ei."qtd-pecas"                   as pecasitem,
    ei."val-altura-embal-ivv"        as prodebalt,
    ei."val-largura-embal-ivv"       as prodeblarg,
    ei."val-profundidade-embal-ivv"  as prodebprof,
    ei."val-peso-embal-ivv"          as prodebpeso,
    ei."cod-ean"                     as prodgtin13,
    ei."val-altura-sku"              as prodvalt,
    ei."val-largura-sku"             as prodvlarg,
    ei."val-profunidade-sku"         as prodvprof,
    ei."val-peso-item-sku"           as prodvpeso,
    ei."qtd-itens"                   as itensprod,
    ei."cod-dun"                     as caixagtin14,
    ei."qtd-produto"                 as prodscaixa,
    ei.lastro                        as lastro,
    ei.camada                        as camada,
    ei.embalagem                     as embcod
FROM pub."ext-item" ei
