// src/test/routes.ts

/**
 * Rotas de Teste
 *
 * Endpoints usados apenas para testes de integração e E2E.
 * NÃO devem estar disponíveis em produção.
 *
 * @module TestRoutes
 * @since 1.0.0
 */

import { Router, Request, Response } from 'express';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import odbc from 'odbc';
import { log } from '@shared/utils/logger';

const router = Router();

/**
 * GET /api/test/fast
 * Endpoint rápido para teste de timeout
 */
router.get('/fast', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Resposta rápida',
    timestamp: new Date().toISOString(),
    correlationId: req.id,
  });
});

/**
 * GET /api/test/timeout
 * Endpoint com delay configurável para teste de timeout
 */
router.get('/timeout', async (req: Request, res: Response) => {
  const delay = parseInt(req.query.delay as string) || 0;

  // Simula delay
  await new Promise((resolve) => setTimeout(resolve, delay));

  res.json({
    success: true,
    message: `Requisição completou após ${delay}ms`,
    delay,
    timestamp: new Date().toISOString(),
    correlationId: req.id,
  });
});

/**
 * GET /api/test/db-timeout
 * Endpoint que testa timeout de queries no database
 */
router.get('/db-timeout', async (req: Request, res: Response) => {
  try {
    const delay = parseInt(req.query.delay as string) || 0;

    // Query com WAITFOR DELAY para simular query lenta
    const query = `WAITFOR DELAY '00:00:${delay.toString().padStart(2, '0')}'; SELECT 1 as result`;

    const connection = DatabaseManager.getConnection();
    await connection.query(query);

    res.json({
      success: true,
      message: `Query completou após ${delay}s`,
      delay,
      timestamp: new Date().toISOString(),
      correlationId: req.id,
    });
  } catch (error) {
    res.status(408).json({
      success: false,
      error: error instanceof Error ? error.message : 'Query timeout',
      timestamp: new Date().toISOString(),
      correlationId: req.id,
    });
  }
});

/**
 * GET /api/test/odbc-direto
 * Testa conexão ODBC direta ao Progress (sem SQL Server Linked Server)
 *
 * @description
 * Endpoint experimental para testar acesso direto ao banco Progress via ODBC.
 * Elimina a camada do SQL Server Linked Server para potencial melhoria de performance.
 *
 * Query params:
 * - dsn: DSN a ser usado (default: prd_emsfnd)
 * - table: Tabela para consultar (default: agenda_rpw)
 * - limit: Limite de registros (default: 10)
 *
 * @example
 * GET /api/test/odbc-direto
 * GET /api/test/odbc-direto?dsn=prd_emsfnd&table=item&limit=5
 */
router.get('/odbc-direto', async (req: Request, res: Response) => {
  const startTime = Date.now();
  let connection: odbc.Connection | null = null;

  try {
    // Parâmetros configuráveis via query string
    const dsn = (req.query.dsn as string) || process.env.ODBC_DSN_DIRECT || 'prd_emsfnd';
    const user = (req.query.user as string) || process.env.ODBC_USER_DIRECT || 'sysprogress';
    const password = process.env.ODBC_PASSWORD_DIRECT || 'sysprogress';
    const table = (req.query.table as string) || 'agenda_rpw';
    const limit = parseInt(req.query.limit as string) || 10;

    log.info('Testando conexão ODBC direta', {
      correlationId: req.id,
      dsn,
      user,
      table,
      limit,
    });

    // Connection string no formato do exemplo fornecido
    const connectionString = `DSN=${dsn};UID=${user};PWD=${password};`;

    log.debug('Conectando via ODBC direto...', {
      correlationId: req.id,
      connectionString: connectionString.replace(/PWD=[^;]+/, 'PWD=***'),
    });

    // Conectar (similar ao código de exemplo)
    const connectStart = Date.now();
    connection = await odbc.connect(connectionString);
    const connectTime = Date.now() - connectStart;

    log.info('Conexão ODBC direta estabelecida', {
      correlationId: req.id,
      connectTime: `${connectTime}ms`,
    });

    // Executar query de teste (similar ao exemplo: SELECT cdn_operac FROM "agenda_rpw")
    const queryStart = Date.now();

    // Se mode=discover, lista tabelas disponíveis
    const mode = (req.query.mode as string) || 'query';

    let query: string;
    if (mode === 'count') {
      // Conta total de registros na tabela
      const tableName = (req.query.table as string) || 'item';
      query = `SELECT COUNT("it-codigo") as total FROM ${tableName}`;
    } else if (mode === 'discover') {
      const searchTerm = (req.query.search as string) || '';
      if (searchTerm) {
        // Busca tabelas por termo
        query = `SELECT TOP 500 "_File-name" as TableName FROM "_File" WHERE "_File-name" LIKE '%${searchTerm}%' ORDER BY "_File-name"`;
      } else {
        // Lista TODAS as tabelas
        query = `SELECT TOP 2000 "_File-name" as TableName FROM "_File" ORDER BY "_File-name"`;
      }
    } else {
      // Query normal de teste
      const itemCodigo = req.query.itemCodigo as string;
      if (itemCodigo) {
        // Buscar item específico
        query = `SELECT TOP 1 "it-codigo", "desc-item", "un" FROM item WHERE "it-codigo" = '${itemCodigo}'`;
      } else {
        // Listar primeiros 10 itens com código não vazio
        query = `SELECT TOP 10 "it-codigo", "desc-item", "un" FROM item WHERE "it-codigo" > '' ORDER BY "it-codigo"`;
      }
    }

    log.debug('Executando query', {
      correlationId: req.id,
      query,
    });

    let result;
    try {
      result = await connection.query(query);
    } catch (queryError) {
      log.error('Erro detalhado na execução da query', {
        correlationId: req.id,
        error: queryError instanceof Error ? queryError.message : 'Erro desconhecido',
        stack: queryError instanceof Error ? queryError.stack : undefined,
        errorDetails: JSON.stringify(queryError, null, 2),
      });
      throw queryError;
    }

    const queryTime = Date.now() - queryStart;
    const totalTime = Date.now() - startTime;

    log.info('Query ODBC direta executada com sucesso', {
      correlationId: req.id,
      rowCount: result.length,
      queryTime: `${queryTime}ms`,
      totalTime: `${totalTime}ms`,
    });

    // Fechar conexão
    await connection.close();
    connection = null;

    // Resposta de sucesso com métricas
    res.json({
      success: true,
      message: 'Teste de ODBC direto bem-sucedido',
      config: {
        dsn,
        user,
        table,
        limit,
      },
      performance: {
        connectTime: `${connectTime}ms`,
        queryTime: `${queryTime}ms`,
        totalTime: `${totalTime}ms`,
      },
      data: {
        rowCount: result.length,
        rows: result,
      },
      timestamp: new Date().toISOString(),
      correlationId: req.id,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;

    log.error('Erro no teste de ODBC direto', {
      correlationId: req.id,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      totalTime: `${totalTime}ms`,
    });

    // Tentar fechar conexão se ainda estiver aberta
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        log.warn('Erro ao fechar conexão ODBC', {
          correlationId: req.id,
          error: closeError instanceof Error ? closeError.message : 'Erro desconhecido',
        });
      }
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao testar ODBC direto',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      performance: {
        totalTime: `${totalTime}ms`,
      },
      timestamp: new Date().toISOString(),
      correlationId: req.id,
    });
  }
});

export default router;
