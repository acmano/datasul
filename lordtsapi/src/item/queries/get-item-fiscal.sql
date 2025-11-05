SELECT  i."it-codigo"               as cod
      , i."desc-item"               as descricao
      , i."ind-imp-desc"            as geraisformdesc
      , i."compr-fabric"            as geraisformobt
      , i.fraciona                  as geraisfrac
      , i."lote-mulven"             as geraislote
      , un."cod-unid-negoc"         as geraisuncod
      , un."des-unid-negoc"         as geraisunnome
      , i."tipo-contr"              as comptipoctrl
      , i."tipo-con-est"            as comptipocest
      , i."ind-item-fat"            as compfat
      , i."baixa-estoq"             as compbaixa
      , i."cod-servico"             as fiscserv
      , i."class-fiscal"            as fiscclasscod
      , i."dec-1"                   as fiscclassncm
      , cf.descricao                as fiscclassnome
      , i."cd-trib-ipi"             as fiscipicodtrib
      , i."aliquota-ipi"            as fiscipialiq
      , id."idi-tip-apurac-ipi"     as fiscipiapurac
      , i."char-2"                  as itemchar2
      , i."ind-ipi-dife"            as fiscipidife
      , i.incentivado               as fiscipiincent
      , id."log-combust"            as fiscipicombust
      , fi."cod-familia-impto"      as fiscipifamcod
      , fi."des-familia-impto"      as fiscipifamnome
      , i."cd-trib-icm"             as fiscicmscodtrib
      , i."fator-reaj-icms"         as fiscicmsfator
      , i."cd-trib-iss"             as fiscisscodtrib
      , i."aliquota-iss"            as fiscissaliq
      , i."nr-item-dcr"             as fiscdcr
      , id."cdn-sefazsp"            as fiscsefaz
      , id."idi-forma-calc-pis"     as piscalc
      , id."val-unit-pis"           as pisvalor
      , id."cdd-perc-retenc-pis"    as pisretenc
      , id."log-orig-retenc-pis"    as pisretorig
      , id."idi-forma-calc-cofins"  as cofinscalc
      , id."val-unit-cofins"        as cofinsvalor
      , id."cdd-perc-retenc-cofins" as cofinsretenc
      , id."log-orig-retenc-cofins" as cofinsretorig
  FROM  pub.item i
  INNER JOIN pub."unid-negoc" un
    ON  un."cod-unid-negoc" = i."cod-unid-negoc"
  LEFT  OUTER JOIN pub."item-dist" id
    ON  id."it-codigo" = i."it-codigo"
  LEFT  OUTER JOIN pub."classif-fisc" cf
    ON  cf."class-fiscal" = i."class-fiscal"
  LEFT  OUTER JOIN pub."item-mat" im
    ON  im."it-codigo" = i."it-codigo"
  LEFT  OUTER JOIN pub."familia-impto" fi
    ON  fi."cod-familia-impto" = im."cod-familia-impto"
  WHERE i."it-codigo" = ?