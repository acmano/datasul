-- =============================================
-- Script: Criação da Stored Procedure de Estrutura (BOM)
-- Database: SQL Server
-- Descrição: Cria a stored procedure que explode a estrutura de produtos
--            e retorna um JSON completo com BOM, processos e resumo de horas
-- =============================================

-- Verifica se a SP já existe e a remove
IF OBJECT_ID('dbo.usp_ExplodeEstruturaEProcessos_JSON', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_ExplodeEstruturaEProcessos_JSON;
GO

-- Cria a Stored Procedure
CREATE PROCEDURE dbo.usp_ExplodeEstruturaEProcessos_JSON
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
        IF OBJECT_ID('tempdb..#ttEstrut')    IS NOT NULL DROP TABLE #ttEstrut;
        IF OBJECT_ID('tempdb..#ttProcesso')  IS NOT NULL DROP TABLE #ttProcesso;
        IF OBJECT_ID('tempdb..#ttUph')       IS NOT NULL DROP TABLE #ttUph;
        IF OBJECT_ID('tempdb..#ttPendentes') IS NOT NULL DROP TABLE #ttPendentes;
        IF OBJECT_ID('tempdb..#root')        IS NOT NULL DROP TABLE #root;

        -- Tabelas com larguras generosas
        CREATE TABLE #ttEstrut (
            linha              INT,
            nivel              INT,
            cod_estabel        NVARCHAR(200),
            it_codigo          NVARCHAR(200),      -- código cru
            es_codigo          NVARCHAR(4000),     -- display com indentação (não usado no JSON)
            descricao          NVARCHAR(4000),
            unidade_medida     NVARCHAR(200),
            quantidade_estrut  DECIMAL(38,12),
            quantidade_acum    DECIMAL(38,12)
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
            horas_homem             DECIMAL(38,12),  -- já em horas
            horas_maquina           DECIMAL(38,12),  -- já em horas
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

        -- Pilha LIFO para DFS
        CREATE TABLE #ttPendentes (
            stack_order       BIGINT NOT NULL PRIMARY KEY,
            cod_estabel       NVARCHAR(200),
            it_codigo         NVARCHAR(200),
            nivel             INT,
            quantidade_estrut DECIMAL(38,12) NULL,
            quantidade_acum   DECIMAL(38,12) NOT NULL,
            descricao         NVARCHAR(4000),
            un                NVARCHAR(200)
        );

        CREATE TABLE #root (
            it_codigo   NVARCHAR(200),
            cod_estabel NVARCHAR(200),
            desc_item   NVARCHAR(4000),
            un          NVARCHAR(200)
        );

        -- 1) Buscar item raiz no linked server
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

        -- 2) Empilhar raiz
        DECLARE @stack_seq BIGINT = 1;
        INSERT INTO #ttPendentes (stack_order, cod_estabel, it_codigo, nivel, quantidade_estrut, quantidade_acum, descricao, un)
        SELECT 1, r.cod_estabel, r.it_codigo, 0, NULL, 1, r.desc_item, r.un
        FROM #root AS r;

        -- 3) DFS
        DECLARE @linha INT = 0;

        WHILE EXISTS (SELECT 1 FROM #ttPendentes)
        BEGIN
            -- pop LIFO
            DECLARE @cod_estabel   NVARCHAR(200);
            DECLARE @it_codigo     NVARCHAR(200);
            DECLARE @nivel_atual   INT;
            DECLARE @qtd_estrut    DECIMAL(38,12);
            DECLARE @qtd_acum      DECIMAL(38,12);
            DECLARE @desc_item     NVARCHAR(4000);
            DECLARE @un_item       NVARCHAR(200);
            DECLARE @stack_pick    BIGINT;

            SELECT TOP (1)
                   @stack_pick  = stack_order,
                   @cod_estabel = cod_estabel,
                   @it_codigo   = it_codigo,
                   @nivel_atual = nivel,
                   @qtd_estrut  = quantidade_estrut,
                   @qtd_acum    = quantidade_acum,
                   @desc_item   = descricao,
                   @un_item     = un
            FROM #ttPendentes
            ORDER BY stack_order DESC;

            DELETE FROM #ttPendentes WHERE stack_order = @stack_pick;

            -- visita (pré-ordem)
            INSERT INTO #ttEstrut (linha, nivel, cod_estabel, it_codigo, es_codigo, descricao, unidade_medida, quantidade_estrut, quantidade_acum)
            VALUES (@linha, @nivel_atual, @cod_estabel, @it_codigo, REPLICATE(' ', @nivel_atual) + @it_codigo, @desc_item, @un_item, @qtd_estrut, @qtd_acum);

            -- componentes do item atual
            IF OBJECT_ID('tempdb..#temp_componentes') IS NOT NULL DROP TABLE #temp_componentes;
            CREATE TABLE #temp_componentes (
                es_codigo   NVARCHAR(200),
                qtd_compon  DECIMAL(38,12),
                desc_item   NVARCHAR(4000),
                un          NVARCHAR(200),
                cod_estabel NVARCHAR(200)
            );

            DECLARE @inner_comp NVARCHAR(MAX) =
N'SELECT e."es-codigo" AS es_codigo,
        e."qtd-compon" AS qtd_compon,
        i."desc-item"  AS desc_item,
        i.un           AS un,
        i."cod-estabel" AS cod_estabel
  FROM PUB.estrutura e
  INNER JOIN PUB.item i ON i."it-codigo" = e."es-codigo"
  WHERE e."it-codigo" = ''' + REPLACE(@it_codigo, '''', '''''') + N'''
    AND (e."data-inicio"  IS NULL OR e."data-inicio"  <= ''' + @data_atual + N''')
    AND (e."data-termino" IS NULL OR e."data-termino" >= ''' + @data_atual + N''')';

            SET @sql =
N'INSERT INTO #temp_componentes (es_codigo, qtd_compon, desc_item, un, cod_estabel)
  SELECT es_codigo, qtd_compon, desc_item, un, cod_estabel
  FROM OPENQUERY(' + @ls + N', ''' + REPLACE(@inner_comp, '''', '''''') + N''');';
            EXEC(@sql);

            DECLARE @n_children INT = (SELECT COUNT(*) FROM #temp_componentes);

            IF @n_children > 0
            BEGIN
                ;WITH filhos AS (
                    SELECT
                        c.cod_estabel,
                        LTRIM(c.es_codigo)                                  AS it_codigo,
                        @nivel_atual + 1                                    AS nivel,
                        c.qtd_compon                                        AS quantidade_estrut,
                        @qtd_acum * c.qtd_compon                            AS quantidade_acum,
                        c.desc_item                                         AS descricao,
                        c.un                                                AS un,
                        ROW_NUMBER() OVER (ORDER BY LTRIM(c.es_codigo) ASC) AS rn
                    FROM #temp_componentes AS c
                )
                INSERT INTO #ttPendentes (stack_order, cod_estabel, it_codigo, nivel, quantidade_estrut, quantidade_acum, descricao, un)
                SELECT
                    @stack_seq + (@n_children - f.rn + 1),  -- empilha invertido para LIFO
                    f.cod_estabel, f.it_codigo, f.nivel, f.quantidade_estrut, f.quantidade_acum, f.descricao, f.un
                FROM filhos AS f;

                SET @stack_seq = @stack_seq + @n_children;
            END

            DROP TABLE #temp_componentes;

            -- roteiro (se existir)
            DECLARE @cod_roteiro NVARCHAR(200) = NULL;

            DECLARE @inner_rot NVARCHAR(MAX) =
N'SELECT "cod-roteiro" AS cod_roteiro
  FROM PUB."proces-item"
  WHERE "it-codigo"  = ''' + REPLACE(@it_codigo, '''', '''''') + N'''
    AND "cod-estabel" = ''' + REPLACE(@cod_estabel, '''', '''''') + N'''';

            DECLARE @rot_sql NVARCHAR(MAX) =
N'DECLARE @t TABLE(cod_roteiro NVARCHAR(200));
  INSERT INTO @t
  SELECT cod_roteiro
  FROM OPENQUERY(' + @ls + N', ''' + REPLACE(@inner_rot, '''', '''''') + N''');
  SELECT TOP (1) @out = cod_roteiro FROM @t;';
            EXEC sp_executesql @rot_sql, N'@out NVARCHAR(200) OUTPUT', @cod_roteiro OUTPUT;

            -- operações
            IF OBJECT_ID('tempdb..#temp_processos') IS NOT NULL DROP TABLE #temp_processos;
            CREATE TABLE #temp_processos (
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
                un            NVARCHAR(200)
            );

            DECLARE @inner_ops NVARCHAR(MAX);

            IF (ISNULL(@cod_roteiro, '') <> '')
            BEGIN
                -- com roteiro
                SET @inner_ops =
N'SELECT o."op-codigo" AS op_codigo, o.descricao, o."nr-unidades" AS nr_unidades,
        o."numero-homem" AS numero_homem, o."tempo-homem" AS tempo_homem,
        o."tempo-maquin" AS tempo_maquin, o.proporcao, o."un-med-tempo" AS un_med_tempo,
        gme."cod-estabel" AS cod_estabel, gme."cc-codigo" AS cc_codigo,
        gm."gm-codigo" AS gm_codigo, gm.descricao AS gm_desc,
        cc.descricao AS cc_desc, i.un
  FROM PUB.operacao o
  INNER JOIN PUB."gm-estab" gme
    ON gme."gm-codigo" = o."gm-codigo"
   AND (gme."cod-estabel" = ''' + REPLACE(@cod_estabel, '''', '''''') + N''' OR gme."cod-estabel" = ''*'')
  INNER JOIN PUB."grup-maquina" gm ON gm."gm-codigo" = gme."gm-codigo"
  INNER JOIN PUB."centro-custo" cc ON cc."cc-codigo" = gme."cc-codigo"
  CROSS JOIN PUB.item i
  WHERE i."it-codigo" = ''' + REPLACE(@it_codigo, '''', '''''') + N'''
    AND o."it-codigo"  = ''''
    AND o."cod-roteiro" = ''' + REPLACE(@cod_roteiro, '''', '''''') + N'''
    AND o."tipo-oper" <> 2
    AND (o."data-inicio"  IS NULL OR o."data-inicio"  <= ''' + @data_atual + N''')
    AND (o."data-termino" IS NULL OR o."data-termino" >= ''' + @data_atual + N''')';
            END
            ELSE
            BEGIN
                -- sem roteiro
                SET @inner_ops =
N'SELECT o."op-codigo" AS op_codigo, o.descricao, o."nr-unidades" AS nr_unidades,
        o."numero-homem" AS numero_homem, o."tempo-homem" AS tempo_homem,
        o."tempo-maquin" AS tempo_maquin, o.proporcao, o."un-med-tempo" AS un_med_tempo,
        gme."cod-estabel" AS cod_estabel, gme."cc-codigo" AS cc_codigo,
        gm."gm-codigo" AS gm_codigo, gm.descricao AS gm_desc,
        cc.descricao AS cc_desc, i.un
  FROM PUB.operacao o
  INNER JOIN PUB."gm-estab" gme
    ON gme."gm-codigo" = o."gm-codigo"
   AND (gme."cod-estabel" = ''' + REPLACE(@cod_estabel, '''', '''''') + N''' OR gme."cod-estabel" = ''*'')
  INNER JOIN PUB."grup-maquina" gm ON gm."gm-codigo" = gme."gm-codigo"
  INNER JOIN PUB."centro-custo" cc ON cc."cc-codigo" = gme."cc-codigo"
  CROSS JOIN PUB.item i
  WHERE i."it-codigo" = ''' + REPLACE(@it_codigo, '''', '''''') + N'''
    AND o."it-codigo"  = ''' + REPLACE(@it_codigo, '''', '''''') + N'''
    AND o."cod-roteiro" = ''''
    AND o."tipo-oper" <> 2
    AND (o."data-inicio"  IS NULL OR o."data-inicio"  <= ''' + @data_atual + N''')
    AND (o."data-termino" IS NULL OR o."data-termino" >= ''' + @data_atual + N''')';
            END

            SET @sql =
N'INSERT INTO #temp_processos
  SELECT op_codigo, descricao, nr_unidades, numero_homem, tempo_homem, tempo_maquin, proporcao, un_med_tempo,
         cod_estabel, cc_codigo, gm_codigo, gm_desc, cc_desc, un
  FROM OPENQUERY(' + @ls + N', ''' + REPLACE(@inner_ops, '''', '''''') + N''');';
            EXEC(@sql);

            IF EXISTS (SELECT 1 FROM #temp_processos)
            BEGIN
                INSERT INTO #ttProcesso (
                    linha, op_codigo, cod_estabel, descricao, cc_codigo, cc_descricao,
                    nr_unidades, numero_homem, horas_homem, horas_maquina,
                    un_med_tempo, gm_codigo, gm_descricao, un,
                    tempo_homem_original, tempo_maquina_original, proporcao
                )
                SELECT
                    @linha,
                    p.op_codigo,
                    p.cod_estabel,
                    p.descricao,  -- sem indentação no JSON
                    p.cc_codigo,
                    p.cc_desc,
                    p.nr_unidades,
                    p.numero_homem,
                    -- horas_homem (convertido para horas)
                    @qtd_acum * ((p.tempo_homem * p.proporcao) / NULLIF(100.0 * p.nr_unidades, 0)) *
                        CASE
                            WHEN p.un_med_tempo = 1 THEN 1.0       -- horas
                            WHEN p.un_med_tempo = 2 THEN 1.0/60    -- minutos
                            WHEN p.un_med_tempo = 3 THEN 1.0/3600  -- segundos
                            WHEN p.un_med_tempo = 4 THEN 24.0      -- dias
                            ELSE 1.0
                        END,
                    -- horas_maquina (convertido para horas)
                    @qtd_acum * ((p.tempo_maquin * p.proporcao) / NULLIF(100.0 * p.nr_unidades, 0)) *
                        CASE
                            WHEN p.un_med_tempo = 1 THEN 1.0
                            WHEN p.un_med_tempo = 2 THEN 1.0/60
                            WHEN p.un_med_tempo = 3 THEN 1.0/3600
                            WHEN p.un_med_tempo = 4 THEN 24.0
                            ELSE 1.0
                        END,
                    p.un_med_tempo,
                    p.gm_codigo,  -- sem indentação
                    p.gm_desc,
                    p.un,
                    p.tempo_homem,
                    p.tempo_maquin,
                    p.proporcao
                FROM #temp_processos AS p;
            END

            DROP TABLE #temp_processos;

            -- próxima linha da travessia
            SET @linha = @linha + 1;
        END

        -- 4) Sumarização por CC (totalHoras = homem + máquina)
        IF EXISTS (SELECT 1 FROM #ttProcesso)
        BEGIN
            INSERT INTO #ttUph (cod_estabel, cc_codigo, descricao, qtd_horas, qtd_horas_homem, qtd_horas_maquina)
            SELECT
                p.cod_estabel,
                p.cc_codigo,
                MAX(p.cc_descricao) AS descricao,
                SUM(p.horas_homem + p.horas_maquina) AS qtd_horas,
                SUM(p.horas_homem)  AS qtd_horas_homem,
                SUM(p.horas_maquina) AS qtd_horas_maquina
            FROM #ttProcesso AS p
            GROUP BY p.cod_estabel, p.cc_codigo;
        END

        -- 5) Mapa pai->filho por linha (para montar JSON recursivo)
        IF OBJECT_ID('tempdb..#parent_map') IS NOT NULL DROP TABLE #parent_map;
        CREATE TABLE #parent_map (
            linha        INT PRIMARY KEY,
            parent_linha INT NULL
        );

        INSERT INTO #parent_map (linha, parent_linha)
        SELECT e.linha,
               (
                 SELECT TOP 1 p.linha
                 FROM #ttEstrut p
                 WHERE p.linha < e.linha
                   AND p.nivel = e.nivel - 1
                 ORDER BY p.linha DESC
               ) AS parent_linha
        FROM #ttEstrut e;

        -- 6) Montar JSON bottom-up
        IF OBJECT_ID('tempdb..#json_node') IS NOT NULL DROP TABLE #json_node;
        CREATE TABLE #json_node (
            linha INT PRIMARY KEY,
            json  NVARCHAR(MAX) NOT NULL
        );

        DECLARE @maxNivel INT = (SELECT ISNULL(MAX(nivel), 0) FROM #ttEstrut);
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
                        -- componentes: corrigido para separar por vírgulas
                        'componentes' = JSON_QUERY(
                            (
                                SELECT
                                    '[' +
                                    ISNULL(
                                        STUFF((
                                            SELECT ',' + j.json
                                            FROM #json_node j
                                            JOIN #parent_map pmc ON pmc.linha = j.linha
                                            WHERE pmc.parent_linha = e.linha
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
            FROM #ttEstrut e
            WHERE e.nivel = @lvl;

            SET @lvl = @lvl - 1;
        END

        -- 7) resumoHoras em JSON
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

        -- 8) Metadata em JSON
        DECLARE @meta NVARCHAR(MAX) =
        (
            SELECT
                'dataGeracao'              = SYSDATETIME(),
                'itemPesquisado'           = @ItemInicial,
                'estabelecimentoPrincipal' = (SELECT TOP 1 cod_estabel FROM #root),
                'totalNiveis'              = (SELECT ISNULL(MAX(nivel),0) FROM #ttEstrut),
                'totalItens'               = (SELECT COUNT(*) FROM #ttEstrut),
                'totalOperacoes'           = (SELECT COUNT(*) FROM #ttProcesso)
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        -- 9) Item principal (raiz)
        DECLARE @rootLinha INT = (SELECT MIN(linha) FROM #ttEstrut WHERE nivel = 0);
        DECLARE @rootJson NVARCHAR(MAX) = (SELECT j.json FROM #json_node j WHERE j.linha = @rootLinha);

        -- 10) Envelope final
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
-- GRANT EXECUTE ON dbo.usp_ExplodeEstruturaEProcessos_JSON TO [seu_usuario];
GO

-- Mensagem de sucesso
PRINT 'Stored procedure criada com sucesso: dbo.usp_ExplodeEstruturaEProcessos_JSON';
GO
