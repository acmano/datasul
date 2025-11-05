-- ============================================================================
-- Projeção SQL - GTINs de Itens (Banco ESP)
-- ============================================================================
-- Descrição:
--   Define a projeção (SELECT fields) para busca de GTINs no banco ESP.
--   Retorna códigos de barras EAN-13 e DUN-14 dos itens.
--
-- Utilizado por:
--   - item/search/repository.ts :: searchItems()
--
-- Campos retornados:
--   - codigo: Código do item (para JOIN com EMP)
--   - gtin13: Código de barras EAN-13 (cod-ean)
--   - gtin14: Código de barras DUN-14 (cod-dun)
--
-- WHERE clause:
--   - NÃO incluída (retorna todos os GTINs)
--   - Filtro GTIN aplicado em TypeScript após JOIN com EMP
--
-- JOIN:
--   - Feito em TypeScript usando Map (performance)
--
-- Última atualização: 2025-10-27
-- Padrão: projection.sql (igual depósito)
-- ============================================================================

SELECT  extItem."it-codigo" as codigo
      , extItem."cod-ean"   as gtin13
      , extItem."cod-dun"   as gtin14
  FROM  pub."ext-item" extItem
