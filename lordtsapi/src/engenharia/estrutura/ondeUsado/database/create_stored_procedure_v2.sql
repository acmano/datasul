-- =============================================
-- Script: Stored Procedure de Onde Usado (Where Used) - VERSÃO 2
-- Database: SQL Server
-- Descrição: Explode a estrutura de produtos na direção INVERSA
--            Partindo de um componente, sobe até encontrar todos os pais
--            Processamento em LOTES PEQUENOS para evitar limite de 8000 chars
-- Correções:
--   v1: STRING_AGG com CAST para NVARCHAR(MAX)
--   v2: Processamento em lotes de 50 itens para evitar query muito longa
-- =============================================

-- Verifica se a SP já existe e a remove
IF OBJECT_ID('dbo.usp_OndeUsado_JSON', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_OndeUsado_JSON;
GO

-- Cria a Stored Procedure de Onde Usado
CREATE PROCEDURE dbo.usp_OndeUsado_JSON
(
    @ItemInicial     NVARCHAR(200),
    @DataReferencia  DATE        = NULL,
    @LinkedServer    SYSNAME     = N'TST_EMS2EMP'
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        IF @DataReferencia IS NULL
            SET @DataReferencia = GETDATE();

        DECLARE @data_atual VARCHAR(10) = CONVERT(VARCHAR(10), @DataReferencia, 101);
        DECLARE @ls NVARCHAR(256) = QUOTENAME(@LinkedServer);

        -- Limpeza de temporárias
        IF OBJECT_ID('tempdb..#ttOndeUsado')   IS NOT NULL DROP TABLE #ttOndeUsado;
        IF OBJECT_ID('tempdb..#ttProcesso')    IS NOT NULL DROP TABLE #ttProcesso;
        IF OBJECT_ID('tempdb..#ttUph')         IS NOT NULL DROP TABLE #ttUph;
        IF OBJECT_ID('tempdb..#nivelAtual')    IS NOT NULL DROP TABLE #nivelAtual;
        IF OBJECT_ID('tempdb..#proximoNivel')  IS NOT NULL DROP TABLE #proximoNivel;
        IF OBJECT_ID('tempdb..#root')          IS NOT NULL DROP TABLE #root;

        -- Tabelas principais
        CREATE TABLE #ttOndeUsado (
            linha              INT IDENTITY(1,1) PRIMARY KEY,
            nivel              INT,
            cod_estabel        NVARCHAR(200),
            it_codigo          NVARCHAR(200),
            es_codigo          NVARCHAR(4000),
            descricao          NVARCHAR(4000),
            unidade_medida     NVARCHAR(200),
            quantidade_estrut  DECIMAL(38,12),
            quantidade_acum    DECIMAL(38,12),
            parent_linha       INT NULL,
            data_inicio        DATE NULL,
            data_fim           DATE NULL
        );

        CREATE TABLE #ttProcesso (
            linha                   INT,
            op_codigo               INT,
            cod_estabel             NVARCHAR(200),
            descricao               NVARCHAR(4000),
            cc_codigo               NVARCHAR(200),
            cc_descricao            NVARCHAR(4000),
            nr_unidades             DECIMAL(38,12),
            numero_homem            DECIMAL(38,12),
            horas_homem             DECIMAL(38,12),
            horas_maquina           DECIMAL(38,12),
            un_med_tempo            INT,
            gm_codigo               NVARCHAR(200),
            gm_descricao            NVARCHAR(4000),
            un                      NVARCHAR(200),
            tempo_homem_original    DECIMAL(38,12),
            tempo_maquina_original  DECIMAL(38,12),
            proporcao               DECIMAL(38,12)
        );

        CREATE TABLE #ttUph (
            cod_estabel       NVARCHAR(200),
            cc_codigo         NVARCHAR(200),
            descricao         NVARCHAR(4000),
            qtd_horas         DECIMAL(38,12),
            qtd_horas_homem   DECIMAL(38,12),
            qtd_horas_maquina DECIMAL(38,12)
        );

        -- Tabelas para processamento por nível
        CREATE TABLE #nivelAtual (
            it_codigo          NVARCHAR(200),
            cod_estabel        NVARCHAR(200),
            descricao          NVARCHAR(4000),
            unidade_medida     NVARCHAR(200),
            nivel              INT,
            quantidade_estrut  DECIMAL(38,12) NULL,
            quantidade_acum    DECIMAL(38,12),
            parent_linha       INT NULL,
            data_inicio        DATE NULL,
            data_fim           DATE NULL,
            processado         BIT DEFAULT 0  -- Flag para controlar lotes
        );

        CREATE TABLE #proximoNivel (
            it_codigo          NVARCHAR(200),
            cod_estabel        NVARCHAR(200),
            descricao          NVARCHAR(4000),
            unidade_medida     NVARCHAR(200),
            nivel              INT,
            quantidade_estrut  DECIMAL(38,12),
            quantidade_acum    DECIMAL(38,12),
            parent_linha       INT,
            data_inicio        DATE NULL,
            data_fim           DATE NULL
        );

        CREATE TABLE #root (
            it_codigo   NVARCHAR(200),
            cod_estabel NVARCHAR(200),
            desc_item   NVARCHAR(4000),
            un          NVARCHAR(200)
        );

        -- 1) Buscar item raiz (componente inicial)
        DECLARE @ItemEsc NVARCHAR(400) = REPLACE(@ItemInicial, '''', '''''');
        DECLARE @inner_root NVARCHAR(MAX) =
N'SELECT "it-codigo" AS it_codigo, "cod-estabel" AS cod_estabel, "desc-item" AS desc_item, un
  FROM PUB.item
  WHERE "it-codigo" = ''' + @ItemEsc + N'''';

        DECLARE @sql NVARCHAR(MAX) =
N'INSERT INTO #root (it_codigo, cod_estabel, desc_item, un)
  SELECT it_codigo, cod_estabel, desc_item, un
  FROM OPENQUERY(' + @ls + N', ''' + REPLACE(@inner_root, '''', '''''') + N''');';
        EXEC(@sql);

        IF NOT EXISTS (SELECT 1 FROM #root)
        BEGIN
            RAISERROR('Item %s não encontrado no linked server %s.', 16, 1, @ItemInicial, @LinkedServer);
            RETURN;
        END

        -- 2) Inserir raiz no nível atual
        INSERT INTO #nivelAtual (it_codigo, cod_estabel, descricao, unidade_medida, nivel, quantidade_estrut, quantidade_acum, parent_linha, data_inicio, data_fim, processado)
        SELECT r.it_codigo, r.cod_estabel, r.desc_item, r.un, 0, NULL, 1, NULL, NULL, NULL, 0
        FROM #root r;

        -- 3) Processar nível por nível (BFS - Breadth-First Search) - SUBINDO na hierarquia
        DECLARE @nivelCorrente INT = 0;
        DECLARE @maxIteracoes INT = 50;
        DECLARE @batchSize INT = 50; -- ⚠️ Processar no máximo 50 itens por lote

        WHILE EXISTS (SELECT 1 FROM #nivelAtual WHERE processado = 0) AND @nivelCorrente < @maxIteracoes
        BEGIN
            -- Inserir itens do nível atual em #ttOndeUsado
            INSERT INTO #ttOndeUsado (nivel, cod_estabel, it_codigo, es_codigo, descricao, unidade_medida, quantidade_estrut, quantidade_acum, parent_linha, data_inicio, data_fim)
            SELECT
                n.nivel,
                n.cod_estabel,
                n.it_codigo,
                REPLICATE(' ', n.nivel) + n.it_codigo,
                n.descricao,
                n.unidade_medida,
                n.quantidade_estrut,
                n.quantidade_acum,
                n.parent_linha,
                n.data_inicio,
                n.data_fim
            FROM #nivelAtual n
            WHERE n.processado = 0
            ORDER BY n.it_codigo;

            -- ⚠️ PROCESSAR EM LOTES para evitar query muito longa
            WHILE EXISTS (SELECT 1 FROM #nivelAtual WHERE processado = 0)
            BEGIN
                -- Selecionar próximo lote de itens
                DECLARE @itemList NVARCHAR(MAX);

                SELECT @itemList = STRING_AGG(
                    CAST('''' + REPLACE(it_codigo, '''', '''''') + '''' AS NVARCHAR(MAX)),
                    ','
                )
                FROM (
                    SELECT TOP (@batchSize) it_codigo
                    FROM #nivelAtual
                    WHERE processado = 0
                    ORDER BY it_codigo
                ) AS batch;

                -- Se não há itens, sair do loop
                IF @itemList IS NULL OR @itemList = ''
                    BREAK;

                -- Buscar todos os PAIS (onde usado) do lote atual
                IF OBJECT_ID('tempdb..#temp_pais_lote') IS NOT NULL DROP TABLE #temp_pais_lote;
                CREATE TABLE #temp_pais_lote (
                    it_codigo_filho NVARCHAR(200),
                    it_codigo_pai   NVARCHAR(200),
                    qtd_compon      DECIMAL(38,12),
                    desc_item       NVARCHAR(4000),
                    un              NVARCHAR(200),
                    cod_estabel     NVARCHAR(200),
                    data_inicio     DATE NULL,
                    data_fim        DATE NULL
                );

                DECLARE @inner_pais_lote NVARCHAR(MAX) =
N'SELECT e."es-codigo" AS it_codigo_filho,
        e."it-codigo" AS it_codigo_pai,
        e."qtd-compon" AS qtd_compon,
        i."desc-item" AS desc_item,
        i.un AS un,
        i."cod-estabel" AS cod_estabel,
        e."data-inicio" AS data_inicio,
        e."data-termino" AS data_fim
  FROM PUB.estrutura e
  INNER JOIN PUB.item i ON i."it-codigo" = e."it-codigo"
  WHERE e."es-codigo" IN (' + @itemList + N')
    AND (e."data-inicio" IS NULL OR e."data-inicio" <= ''' + @data_atual + N''')
    AND (e."data-termino" IS NULL OR e."data-termino" >= ''' + @data_atual + N''')';

                SET @sql =
N'INSERT INTO #temp_pais_lote (it_codigo_filho, it_codigo_pai, qtd_compon, desc_item, un, cod_estabel, data_inicio, data_fim)
  SELECT it_codigo_filho, it_codigo_pai, qtd_compon, desc_item, un, cod_estabel, data_inicio, data_fim
  FROM OPENQUERY(' + @ls + N', ''' + REPLACE(@inner_pais_lote, '''', '''''') + N''');';

                BEGIN TRY
                    EXEC(@sql);
                END TRY
                BEGIN CATCH
                    -- Log do erro mas continua processamento
                    PRINT 'Erro ao buscar pais do lote: ' + ERROR_MESSAGE();
                END CATCH

                -- Preparar próximo nível com base nos PAIS encontrados
                INSERT INTO #proximoNivel (it_codigo, cod_estabel, descricao, unidade_medida, nivel, quantidade_estrut, quantidade_acum, parent_linha, data_inicio, data_fim)
                SELECT
                    LTRIM(p.it_codigo_pai),
                    p.cod_estabel,
                    p.desc_item,
                    p.un,
                    @nivelCorrente + 1,
                    p.qtd_compon,
                    CASE
                        WHEN p.qtd_compon > 0 THEN n.quantidade_acum / p.qtd_compon
                        ELSE n.quantidade_acum
                    END,
                    (SELECT TOP 1 e.linha
                     FROM #ttOndeUsado e
                     WHERE e.it_codigo = p.it_codigo_filho
                       AND e.nivel = @nivelCorrente
                     ORDER BY e.linha DESC),
                    p.data_inicio,
                    p.data_fim
                FROM #temp_pais_lote p
                INNER JOIN #nivelAtual n ON n.it_codigo = p.it_codigo_filho
                WHERE n.processado = 0;

                DROP TABLE #temp_pais_lote;

                -- Marcar lote como processado
                UPDATE #nivelAtual
                SET processado = 1
                WHERE it_codigo IN (
                    SELECT TOP (@batchSize) it_codigo
                    FROM #nivelAtual
                    WHERE processado = 0
                    ORDER BY it_codigo
                );

            END -- fim do while de lotes

            -- Buscar roteiros e processos (também em lotes)
            UPDATE #nivelAtual SET processado = 0; -- Reset flag para processar roteiros/processos

            WHILE EXISTS (SELECT 1 FROM #nivelAtual WHERE processado = 0)
            BEGIN
                SELECT @itemList = STRING_AGG(
                    CAST('''' + REPLACE(it_codigo, '''', '''''') + '''' AS NVARCHAR(MAX)),
                    ','
                )
                FROM (
                    SELECT TOP (@batchSize) it_codigo
                    FROM #nivelAtual
                    WHERE processado = 0
                    ORDER BY it_codigo
                ) AS batch;

                IF @itemList IS NULL OR @itemList = ''
                    BREAK;

                -- Buscar operações para o lote
                IF OBJECT_ID('tempdb..#temp_ops_lote') IS NOT NULL DROP TABLE #temp_ops_lote;
                CREATE TABLE #temp_ops_lote (
                    it_codigo     NVARCHAR(200),
                    op_codigo     INT,
                    descricao     NVARCHAR(4000),
                    nr_unidades   DECIMAL(38,12),
                    numero_homem  DECIMAL(38,12),
                    tempo_homem   DECIMAL(38,12),
                    tempo_maquin  DECIMAL(38,12),
                    proporcao     DECIMAL(38,12),
                    un_med_tempo  INT,
                    cod_estabel   NVARCHAR(200),
                    cc_codigo     NVARCHAR(200),
                    gm_codigo     NVARCHAR(200),
                    gm_desc       NVARCHAR(4000),
                    cc_desc       NVARCHAR(4000),
                    un            NVARCHAR(200),
                    cod_roteiro   NVARCHAR(200)
                );

                DECLARE @inner_ops_lote NVARCHAR(MAX) =
N'SELECT o."it-codigo" AS it_codigo,
        o."op-codigo" AS op_codigo,
        o.descricao,
        o."nr-unidades" AS nr_unidades,
        o."numero-homem" AS numero_homem,
        o."tempo-homem" AS tempo_homem,
        o."tempo-maquin" AS tempo_maquin,
        o.proporcao,
        o."un-med-tempo" AS un_med_tempo,
        gme."cod-estabel" AS cod_estabel,
        gme."cc-codigo" AS cc_codigo,
        gm."gm-codigo" AS gm_codigo,
        gm.descricao AS gm_desc,
        cc.descricao AS cc_desc,
        i.un,
        o."cod-roteiro" AS cod_roteiro
  FROM PUB.operacao o
  INNER JOIN PUB."gm-estab" gme ON gme."gm-codigo" = o."gm-codigo"
  INNER JOIN PUB."grup-maquina" gm ON gm."gm-codigo" = gme."gm-codigo"
  INNER JOIN PUB."centro-custo" cc ON cc."cc-codigo" = gme."cc-codigo"
  INNER JOIN PUB.item i ON i."it-codigo" = o."it-codigo"
  WHERE o."it-codigo" IN (' + @itemList + N')
    AND o."tipo-oper" <> 2
    AND (o."data-inicio" IS NULL OR o."data-inicio" <= ''' + @data_atual + N''')
    AND (o."data-termino" IS NULL OR o."data-termino" >= ''' + @data_atual + N''')';

                SET @sql =
N'INSERT INTO #temp_ops_lote (it_codigo, op_codigo, descricao, nr_unidades, numero_homem, tempo_homem, tempo_maquin, proporcao, un_med_tempo, cod_estabel, cc_codigo, gm_codigo, gm_desc, cc_desc, un, cod_roteiro)
  SELECT it_codigo, op_codigo, descricao, nr_unidades, numero_homem, tempo_homem, tempo_maquin, proporcao, un_med_tempo, cod_estabel, cc_codigo, gm_codigo, gm_desc, cc_desc, un, cod_roteiro
  FROM OPENQUERY(' + @ls + N', ''' + REPLACE(@inner_ops_lote, '''', '''''') + N''');';

                BEGIN TRY
                    EXEC(@sql);
                END TRY
                BEGIN CATCH
                    -- Se não há operações, não é erro
                END CATCH

                -- Inserir processos encontrados em #ttProcesso
                INSERT INTO #ttProcesso (
                    linha, op_codigo, cod_estabel, descricao, cc_codigo, cc_descricao,
                    nr_unidades, numero_homem, horas_homem, horas_maquina,
                    un_med_tempo, gm_codigo, gm_descricao, un,
                    tempo_homem_original, tempo_maquina_original, proporcao
                )
                SELECT
                    e.linha,
                    p.op_codigo,
                    p.cod_estabel,
                    p.descricao,
                    p.cc_codigo,
                    p.cc_desc,
                    p.nr_unidades,
                    p.numero_homem,
                    e.quantidade_acum * ((p.tempo_homem * p.proporcao) / NULLIF(100.0 * p.nr_unidades, 0)) *
                        CASE
                            WHEN p.un_med_tempo = 1 THEN 1.0
                            WHEN p.un_med_tempo = 2 THEN 1.0/60
                            WHEN p.un_med_tempo = 3 THEN 1.0/3600
                            WHEN p.un_med_tempo = 4 THEN 24.0
                            ELSE 1.0
                        END,
                    e.quantidade_acum * ((p.tempo_maquin * p.proporcao) / NULLIF(100.0 * p.nr_unidades, 0)) *
                        CASE
                            WHEN p.un_med_tempo = 1 THEN 1.0
                            WHEN p.un_med_tempo = 2 THEN 1.0/60
                            WHEN p.un_med_tempo = 3 THEN 1.0/3600
                            WHEN p.un_med_tempo = 4 THEN 24.0
                            ELSE 1.0
                        END,
                    p.un_med_tempo,
                    p.gm_codigo,
                    p.gm_desc,
                    p.un,
                    p.tempo_homem,
                    p.tempo_maquin,
                    p.proporcao
                FROM #temp_ops_lote p
                INNER JOIN #ttOndeUsado e ON e.it_codigo = p.it_codigo AND e.nivel = @nivelCorrente;

                DROP TABLE #temp_ops_lote;

                -- Marcar lote como processado
                UPDATE #nivelAtual
                SET processado = 1
                WHERE it_codigo IN (
                    SELECT TOP (@batchSize) it_codigo
                    FROM #nivelAtual
                    WHERE processado = 0
                    ORDER BY it_codigo
                );

            END -- fim do while de roteiros/processos

            -- Avançar para próximo nível
            TRUNCATE TABLE #nivelAtual;
            INSERT INTO #nivelAtual (it_codigo, cod_estabel, descricao, unidade_medida, nivel, quantidade_estrut, quantidade_acum, parent_linha, data_inicio, data_fim, processado)
            SELECT it_codigo, cod_estabel, descricao, unidade_medida, nivel, quantidade_estrut, quantidade_acum, parent_linha, data_inicio, data_fim, 0
            FROM #proximoNivel;

            TRUNCATE TABLE #proximoNivel;

            SET @nivelCorrente = @nivelCorrente + 1;
        END

        IF @nivelCorrente >= @maxIteracoes
        BEGIN
            RAISERROR('Aviso: Onde Usado atingiu o limite máximo de %d níveis. Possível loop infinito detectado.', 10, 1, @maxIteracoes);
        END

        -- 4) Sumarização por CC
        IF EXISTS (SELECT 1 FROM #ttProcesso)
        BEGIN
            INSERT INTO #ttUph (cod_estabel, cc_codigo, descricao, qtd_horas, qtd_horas_homem, qtd_horas_maquina)
            SELECT
                p.cod_estabel,
                p.cc_codigo,
                MAX(p.cc_descricao) AS descricao,
                SUM(p.horas_homem + p.horas_maquina) AS qtd_horas,
                SUM(p.horas_homem) AS qtd_horas_homem,
                SUM(p.horas_maquina) AS qtd_horas_maquina
            FROM #ttProcesso p
            GROUP BY p.cod_estabel, p.cc_codigo;
        END

        -- 5) Montar JSON bottom-up
        IF OBJECT_ID('tempdb..#json_node') IS NOT NULL DROP TABLE #json_node;
        CREATE TABLE #json_node (
            linha INT PRIMARY KEY,
            json  NVARCHAR(MAX) NOT NULL
        );

        DECLARE @maxNivel INT = (SELECT ISNULL(MAX(nivel), 0) FROM #ttOndeUsado);
        DECLARE @lvl INT = @maxNivel;

        WHILE @lvl >= 0
        BEGIN
            INSERT INTO #json_node (linha, json)
            SELECT
                e.linha,
                (
                    SELECT
                        'codigo'               = e.it_codigo,
                        'estabelecimento'      = e.cod_estabel,
                        'descricao'            = e.descricao,
                        'unidadeMedida'        = e.unidade_medida,
                        'nivel'                = e.nivel,
                        'quantidadeEstrutura'  = e.quantidade_estrut,
                        'quantidadeAcumulada'  = e.quantidade_acum,
                        'dataInicio'           = CONVERT(VARCHAR(10), e.data_inicio, 23),
                        'dataFim'              = CONVERT(VARCHAR(10), e.data_fim, 23),
                        'processoFabricacao'   = JSON_QUERY(
                            COALESCE((
                                SELECT
                                    'operacao' = JSON_QUERY(
                                        (SELECT
                                            'codigo'    = p.op_codigo,
                                            'descricao' = p.descricao,
                                            'estabelecimento' = p.cod_estabel,
                                            'tempos' = JSON_QUERY(
                                                (SELECT
                                                    'tempoHomemOriginal'     = p.tempo_homem_original,
                                                    'tempoMaquinaOriginal'   = p.tempo_maquina_original,
                                                    'unidadeTempoCodigo'     = p.un_med_tempo,
                                                    'proporcao'              = p.proporcao,
                                                    'horasHomemCalculadas'   = p.horas_homem,
                                                    'horasMaquinaCalculadas' = p.horas_maquina
                                                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
                                            ),
                                            'centroCusto' = JSON_QUERY(
                                                (SELECT 'codigo' = p.cc_codigo, 'descricao' = p.cc_descricao FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
                                            ),
                                            'grupoMaquina' = JSON_QUERY(
                                                (SELECT 'codigo' = p.gm_codigo, 'descricao' = p.gm_descricao FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
                                            ),
                                            'recursos' = JSON_QUERY(
                                                (SELECT
                                                    'nrUnidades'   = p.nr_unidades,
                                                    'numeroHomem'  = p.numero_homem,
                                                    'unidadeMedida'= p.un,
                                                    'unidadeTempo' = CASE p.un_med_tempo WHEN 1 THEN 'h' WHEN 2 THEN 'm' WHEN 3 THEN 's' WHEN 4 THEN 'd' ELSE 'h' END
                                                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
                                            )
                                         FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
                                    )
                                FROM #ttProcesso p
                                WHERE p.linha = e.linha
                                ORDER BY p.op_codigo
                                FOR JSON PATH
                            ), '[]')
                        ),
                        'usadoEm' = JSON_QUERY(
                            (
                                SELECT
                                    '[' +
                                    ISNULL(
                                        STUFF((
                                            SELECT ',' + CAST(j.json AS NVARCHAR(MAX))
                                            FROM #json_node j
                                            JOIN #ttOndeUsado child ON child.linha = j.linha
                                            WHERE child.parent_linha = e.linha
                                            ORDER BY j.linha
                                            FOR XML PATH(''), TYPE
                                        ).value('.','nvarchar(max)'), 1, 1, ''),
                                        ''
                                    )
                                    + ']'
                            )
                        )
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            FROM #ttOndeUsado e
            WHERE e.nivel = @lvl;

            SET @lvl = @lvl - 1;
        END

        -- 6) resumoHoras em JSON
        DECLARE @jsonResumo NVARCHAR(MAX) =
        (
            SELECT
                'porCentroCusto' = JSON_QUERY(
                    (SELECT
                        'estabelecimento' = u.cod_estabel,
                        'centroCusto'     = u.cc_codigo,
                        'descricao'       = u.descricao,
                        'totalHoras'      = u.qtd_horas,
                        'horasHomem'      = u.qtd_horas_homem,
                        'horasMaquina'    = u.qtd_horas_maquina
                     FROM #ttUph u
                     ORDER BY u.cod_estabel, u.cc_codigo
                     FOR JSON PATH)
                ),
                'totais' = JSON_QUERY(
                    (SELECT
                        ISNULL(SUM(u.qtd_horas), 0)         AS totalGeralHoras,
                        ISNULL(SUM(u.qtd_horas_homem), 0)   AS totalHorasHomem,
                        ISNULL(SUM(u.qtd_horas_maquina), 0) AS totalHorasMaquina
                     FROM #ttUph u
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
                )
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        -- 7) Metadata em JSON
        DECLARE @meta NVARCHAR(MAX) =
        (
            SELECT
                'dataGeracao'              = SYSDATETIME(),
                'itemPesquisado'           = @ItemInicial,
                'estabelecimentoPrincipal' = (SELECT TOP 1 cod_estabel FROM #root),
                'totalNiveis'              = (SELECT ISNULL(MAX(nivel),0) FROM #ttOndeUsado),
                'totalItens'               = (SELECT COUNT(*) FROM #ttOndeUsado),
                'totalOperacoes'           = (SELECT COUNT(*) FROM #ttProcesso)
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        -- 8) Item principal (raiz - componente inicial)
        DECLARE @rootLinha INT = (SELECT MIN(linha) FROM #ttOndeUsado WHERE nivel = 0);
        DECLARE @rootJson NVARCHAR(MAX) = (SELECT j.json FROM #json_node j WHERE j.linha = @rootLinha);

        -- 9) Envelope final
        SELECT
            JSON_QUERY(@rootJson)   AS itemPrincipal,
            JSON_QUERY(@jsonResumo) AS resumoHoras,
            JSON_QUERY(@meta)       AS metadata
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;

    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrSev INT = ERROR_SEVERITY();
        DECLARE @ErrState INT = ERROR_STATE();
        RAISERROR(@ErrMsg, @ErrSev, @ErrState);
    END CATCH
END
GO

-- Concede permissões de execução (ajuste conforme necessário)
-- GRANT EXECUTE ON dbo.usp_OndeUsado_JSON TO [seu_usuario];
GO

PRINT 'Stored procedure V2 criada com sucesso: dbo.usp_OndeUsado_JSON';
PRINT 'Correções aplicadas:';
PRINT '  - STRING_AGG com CAST para NVARCHAR(MAX)';
PRINT '  - Processamento em LOTES de 50 itens para evitar query muito longa';
PRINT 'Função: Where Used (Onde Usado) - percorre estrutura de baixo para cima';
PRINT 'Algoritmo: BFS (Breadth-First Search) invertido com processamento em lote';
GO
