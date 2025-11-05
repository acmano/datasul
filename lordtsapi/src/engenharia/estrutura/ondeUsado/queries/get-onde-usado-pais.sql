SELECT  e."it-codigo"                 as itemCodigoPai
      , case substring(iep."char-1", 133, 1)
          when '0' then 'FINAL'
          when '4' then 'FINAL'
          else 'COMPONENTE'
        end as pTipo
      , e."es-codigo"                 as componenteCodigo
      , case substring(iec."char-1", 133, 1)
          when '0' then 'FINAL'
          when '4' then 'FINAL'
          else 'COMPONENTE'
        end as cTipo
      , e."qtd-compon"                as qtdCompon
      , e."data-inicio"               as dataInicio
      , e."data-termino"              as dataFim
      , ic."desc-item"                as descricao
      , ic.un                         as unidadeMedida
      , ic."cod-estabel"              as codEstabel
  FROM  pub.estrutura e
  INNER JOIN pub.item ic
    ON  ic."it-codigo" = e."it-codigo"
  INNER JOIN pub."item-uni-estab" iec
    ON  iec."it-codigo" = ic."it-codigo"
    AND iec."cod-estabel" = ic."cod-estabel"
  INNER JOIN pub.item ip
    ON  ip."it-codigo" = e."es-codigo"
  INNER JOIN pub."item-uni-estab" iep
    ON  iep."it-codigo" = ip."it-codigo"
    AND iep."cod-estabel" = ip."cod-estabel"
  WHERE e."es-codigo" = ?
  ORDER BY  e."it-codigo"
