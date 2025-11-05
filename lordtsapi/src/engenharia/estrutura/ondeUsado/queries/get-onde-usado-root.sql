SELECT  i."it-codigo" as itemCodigo
      , i."cod-estabel" as codEstabel
      , i."desc-item" as descricao
      , i.un as unidadeMedida
      , case substring(ie."char-1", 133, 1)
          when '0' then 'FINAL'
          when '4' then 'FINAL'
          else 'COMPONENTE'
        end as tipo
  FROM  pub.item i
  INNER JOIN pub."item-uni-estab" ie
    ON  ie."it-codigo" = i."it-codigo"
    and ie."cod-estabel" = i."cod-estabel"
  WHERE i."it-codigo" = ?
