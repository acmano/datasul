SELECT
    o."it-codigo" as itemCodigo,
    o."op-codigo" as opCodigo,
    o.descricao as descricao,
    o."nr-unidades" as nrUnidades,
    o."numero-homem" as numeroHomem,
    o."tempo-homem" as tempoHomem,
    o."tempo-maquin" as tempoMaquin,
    o.proporcao as proporcao,
    o."un-med-tempo" as unMedTempo,
    gme."cod-estabel" as codEstabel,
    gme."cc-codigo" as ccCodigo,
    gm."gm-codigo" as gmCodigo,
    gm.descricao as gmDescricao,
    cc.descricao as ccDescricao,
    i.un as un
FROM pub.operacao o
INNER JOIN pub."gm-estab" gme ON gme."gm-codigo" = o."gm-codigo"
INNER JOIN pub."grup-maquina" gm ON gm."gm-codigo" = gme."gm-codigo"
INNER JOIN pub."centro-custo" cc ON cc."cc-codigo" = gme."cc-codigo"
INNER JOIN pub.item i ON i."it-codigo" = o."it-codigo"
WHERE o."it-codigo" = ?
  AND o."tipo-oper" <> 2
ORDER BY o."op-codigo"
