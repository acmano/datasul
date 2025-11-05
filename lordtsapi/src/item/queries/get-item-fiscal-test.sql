SELECT  i."it-codigo"  as itemcodigo
      , i."desc-item"  as itemdescricao
  FROM  pub.item i
  WHERE i."it-codigo" = ?
