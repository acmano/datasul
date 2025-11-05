-- ============================================================================
-- Projeção SQL Comum - Depósito
-- ============================================================================
-- Descrição:
--   Define a projeção (SELECT fields) comum usada em todas as queries de depósito.
--   Este fragmento é reutilizado por múltiplas queries para evitar duplicação.
--
-- Utilizado por:
--   - get-by-codigo.sql
--   - listar-todos.sql
--   - Futuras queries de depósito
--
-- Campos retornados:
--   - Identificação: codigo, nome, nomeAbrev
--   - Configurações: consideraSaldoDisponivel, consideraSaldoAlocado, etc.
--   - Permissões: permissaoMovDeposito1/2/3
--   - Tipos: tipoDeposito, produtoAcabado, depositoProcesso
--   - Integrações: depositoWMS, depositoWmsExterno, alocaSaldoERP
--   - Campos customizáveis: char1/2, dec1/2, int1/2, log1/2, data1/2
--
-- Transformações SQL-side:
--   - Booleans → "Sim"/"Não" (CASE WHEN)
--   - Enums → Texto legível ("Interno"/"Externo")
--   - Array indexing → permissao[1], permissao[2], permissao[3]
--   - Aliases camelCase para TypeScript
--
-- Última atualização: 2025-10-26
-- ============================================================================

SELECT  deposito."cod-depos"                                           as codigo
      , deposito."nome"                                                as nome
      , CASE
          WHEN deposito."cons-saldo" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as consideraSaldoDisponivel
      , CASE
          WHEN deposito."alocado" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as consideraSaldoAlocado
      , deposito."permissao"[1]                                        as permissaoMovDeposito1
      , deposito."permissao"[2]                                        as permissaoMovDeposito2
      , deposito."permissao"[3]                                        as permissaoMovDeposito3
      , CASE
          WHEN deposito."ind-acabado" = 0 THEN 'Não'
          ELSE 'Sim'
        END as produtoAcabado
      , CASE
            WHEN deposito."ind-tipo-dep" = 1 THEN 'Interno'
            WHEN deposito."ind-tipo-dep" = 2 THEN 'Externo'
            ELSE ''
        END                                                            as tipoDeposito
      , CASE
          WHEN deposito."ind-processo" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as depositoProcesso
      , deposito."nome-abrev"                                          as nomeAbrev
      , CASE
          WHEN deposito."ind-disp-saldo" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as saldoDisponivel
      , CASE
          WHEN deposito."ind-dep-cq" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as depositoCQ
      , CASE
          WHEN deposito."ind-dep-rej" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as depositoRejeito
      , deposito."char-1"                                              as char1
      , deposito."char-2"                                              as char2
      , deposito."dec-1"                                               as dec1
      , deposito."dec-2"                                               as dec2
      , deposito."int-1"                                               as int1
      , deposito."int-2"                                               as int2
      , deposito."log-1"                                               as log1
      , deposito."log-2"                                               as log2
      , deposito."data-1"                                              as data1
      , deposito."data-2"                                              as data2
      , deposito."check-sum"                                           as checkSum
      , CASE
          WHEN deposito."log-reciclagem" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as depositoReciclado
      , CASE
          WHEN deposito."log-ordens-mrp" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as consideraOrdens
      , CASE
          WHEN deposito."log-gera-wms" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as depositoWMS
      , CASE
          WHEN deposito."log-aloca-qtd-wms" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as alocaSaldoERP
      , CASE
          WHEN deposito."log-orig-ext" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as origemExterna
      , CASE
          WHEN deposito."log-wms-externo" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as depositoWmsExterno
      , CASE
          WHEN deposito."log-aloca-saldo-wms-ext" = 0 THEN 'Não'
          ELSE 'Sim'
        END                                                            as alocaSaldoWmsExterno
    FROM  pub.deposito deposito
