// src/presentation/test/test-timeout.routes.ts

/**
 * @fileoverview Rotas de teste para validar comportamento de timeouts
 *
 * ⚠️ IMPORTANTE: Este arquivo é APENAS para desenvolvimento e testes.
 * REMOVA OU DESABILITE em produção para evitar ataques DoS.
 *
 * Fornece endpoints para testar:
 * - Timeout de requisições HTTP
 * - Timeout de queries no banco de dados
 * - Comportamento de requisições rápidas (baseline)
 *
 * Use estes endpoints para validar:
 * - Se o middleware de timeout está funcionando corretamente
 * - Se queries lentas são canceladas adequadamente
 * - Se timeouts de conexão estão configurados corretamente
 *
 * @module presentation/test/test-timeout
 * @requires express
 * @requires @infrastructure/database/DatabaseManager
 *
 * @example
 * ```typescript
 * // No app.ts (apenas em desenvolvimento)
 * if (process.env.NODE_ENV === 'development') {
 *   import testTimeoutRoutes from '@presentation/test/test-timeout.routes';
 *   app.use('/api/test', testTimeoutRoutes);
 * }
 * ```
 *
 * @remarks
 * ⚠️ AVISO DE SEGURANÇA:
 * - Estas rotas podem consumir recursos do servidor
 * - Podem causar timeouts em outros serviços
 * - NÃO devem estar disponíveis em produção
 * - Configure autenticação se precisar manter em staging
 */

// ⚠️ APENAS PARA DESENVOLVIMENTO - REMOVA EM PRODUÇÃO

import { Router, Request, Response } from 'express';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

const router = Router();

/**
 * GET /api/test/timeout
 * Simula uma requisição que demora mais que o timeout configurado
 *
 * @route GET /api/test/timeout
 * @access Public (desenvolvimento apenas)
 *
 * @query {string} [delay=35000] - Tempo de espera em milissegundos
 *
 * @returns {Object} 200 - Requisição completou (timeout NÃO funcionou)
 * @returns {Object} 503 - Request timeout (comportamento esperado)
 *
 * @description
 * Usa Promise.setTimeout para simular uma operação lenta.
 * Útil para testar se o middleware de timeout está interceptando
 * requisições que demoram demais.
 *
 * Comportamento esperado:
 * - Se delay < timeout: Retorna 200 com sucesso
 * - Se delay > timeout: Middleware retorna 503/408 antes da resposta
 *
 * @example Request (delay padrão 35s)
 * ```bash
 * curl http://localhost:3000/api/test/timeout
 * # Deve retornar 503 após 30s (se timeout configurado para 30s)
 * ```
 *
 * @example Request (delay customizado)
 * ```bash
 * # Testa com 10 segundos (deve completar se timeout > 10s)
 * curl http://localhost:3000/api/test/timeout?delay=10000
 *
 * # Testa com 60 segundos (deve dar timeout)
 * curl http://localhost:3000/api/test/timeout?delay=60000
 * ```
 *
 * @example Response (sucesso - timeout não funcionou)
 * ```json
 * {
 *   "success": true,
 *   "message": "Requisição completou após 35000ms",
 *   "warning": "Se você está vendo isso, o timeout NÃO funcionou!"
 * }
 * ```
 *
 * @example Response (timeout esperado - middleware interceptou)
 * ```json
 * {
 *   "success": false,
 *   "error": "Request Timeout",
 *   "message": "A requisição demorou muito para ser processada e foi cancelada pelo servidor."
 * }
 * ```
 *
 * @remarks
 * Pontos críticos:
 * - Verifica `req.timedout` antes de enviar resposta
 * - Se timeout já ocorreu, não tenta enviar resposta (evita erro "Cannot set headers")
 * - Console.log ajuda a debugar o comportamento
 */
router.get('/timeout', async (req: Request, res: Response) => {
  const delay = parseInt(req.query.delay as string) || 35000;

  console.log(`[TEST] Iniciando timeout test - aguardando ${delay}ms`);

  try {
    // Simula operação lenta
    await new Promise(resolve => setTimeout(resolve, delay));

    // Verifica se já houve timeout antes de enviar resposta
    if (req.timedout) {
      console.log('[TEST] Timeout detectado - não enviando resposta');
      return;
    }

    // Se chegou aqui, não houve timeout
    res.json({
      success: true,
      message: `Requisição completou após ${delay}ms`,
      warning: 'Se você está vendo isso, o timeout NÃO funcionou!',
    });
  } catch (error) {
    // Se já deu timeout, não tenta enviar resposta
    if (req.timedout) {
      console.log('[TEST] Timeout detectado no catch - não enviando resposta');
      return;
    }

    console.error('[TEST] Erro no timeout test:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no teste',
    });
  }
});

/**
 * GET /api/test/db-timeout
 * Testa timeout de queries no banco de dados
 *
 * @route GET /api/test/db-timeout
 * @access Public (desenvolvimento apenas)
 *
 * @query {string} [delay=40] - Tempo de espera em segundos (não milissegundos!)
 *
 * @returns {Object} 200 - Query completou (timeout NÃO funcionou)
 * @returns {Object} 408 - Query timeout (comportamento esperado)
 *
 * @description
 * Usa WAITFOR DELAY do SQL Server para forçar uma query lenta.
 * Testa se o timeout de query (DB_REQUEST_TIMEOUT) está funcionando.
 *
 * ⚠️ ATENÇÃO: Este teste realmente executa uma query no banco!
 * Use com cuidado em ambientes compartilhados.
 *
 * @example Request (delay padrão 40s)
 * ```bash
 * curl http://localhost:3000/api/test/db-timeout
 * # Deve retornar 408 após ~30s (se DB_REQUEST_TIMEOUT=30000)
 * ```
 *
 * @example Request (delay customizado)
 * ```bash
 * # Testa com 10 segundos (deve completar se timeout > 10s)
 * curl http://localhost:3000/api/test/db-timeout?delay=10
 *
 * # Testa com 5 segundos (deve completar rapidamente)
 * curl http://localhost:3000/api/test/db-timeout?delay=5
 * ```
 *
 * @example Response (sucesso - timeout não funcionou)
 * ```json
 * {
 *   "success": true,
 *   "message": "Query completou após 40s",
 *   "warning": "Se você está vendo isso, o timeout de query NÃO funcionou!"
 * }
 * ```
 *
 * @example Response (timeout esperado)
 * ```json
 * {
 *   "success": false,
 *   "error": "Query timeout (esperado)",
 *   "message": "RequestError: Timeout: Request failed to complete in 30000ms"
 * }
 * ```
 *
 * @remarks
 * SQL Server WAITFOR DELAY syntax:
 * - WAITFOR DELAY '00:00:40' = espera 40 segundos
 * - Formato: 'HH:MM:SS'
 * - Máximo: '23:59:59'
 *
 * @remarks
 * Pontos críticos:
 * - Query é realmente executada no banco
 * - Consome conexão durante todo o delay
 * - Em produção, este tipo de query deve ser evitado
 * - Use este teste para validar configuração de timeout
 */
router.get('/db-timeout', async (req: Request, res: Response) => {
  const delay = parseInt(req.query.delay as string) || 40; // 40 segundos

  console.log(`[TEST] Testando timeout de query - aguardando ${delay}s`);

  try {
    // Query que espera X segundos (SQL Server)
    const query = `
      BEGIN
        WAITFOR DELAY '00:00:${delay.toString().padStart(2, '0')}';
        SELECT 1 as result;
      END
    `;

    await DatabaseManager.queryEmp(query);

    // Se chegou aqui, não houve timeout
    res.json({
      success: true,
      message: `Query completou após ${delay}s`,
      warning: 'Se você está vendo isso, o timeout de query NÃO funcionou!',
    });
  } catch (error: unknown) {
    // Esperamos que dê timeout
    console.log('[TEST] Timeout de query funcionou:', (error as Error).message);
    res.status(408).json({
      success: false,
      error: 'Query timeout (esperado)',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/test/fast
 * Retorna imediatamente (baseline para comparação)
 *
 * @route GET /api/test/fast
 * @access Public (desenvolvimento apenas)
 *
 * @returns {Object} 200 - Resposta rápida
 *
 * @description
 * Endpoint de controle que retorna imediatamente.
 * Use para comparar com endpoints lentos e validar que
 * requisições normais não são afetadas pelo middleware de timeout.
 *
 * Útil para:
 * - Baseline de performance
 * - Verificar que servidor está respondendo
 * - Comparar tempo de resposta normal vs com timeout
 *
 * @example Request
 * ```bash
 * curl http://localhost:3000/api/test/fast
 * # Deve retornar em < 100ms
 * ```
 *
 * @example Response
 * ```json
 * {
 *   "success": true,
 *   "message": "Resposta rápida - sem timeout",
 *   "timestamp": "2025-10-06T12:00:00.000Z"
 * }
 * ```
 *
 * @example Teste de performance
 * ```bash
 * # Medir tempo de resposta
 * time curl http://localhost:3000/api/test/fast
 * # real    0m0.052s  <- deve ser muito rápido
 * ```
 *
 * @remarks
 * Use este endpoint para:
 * - Verificar que o servidor está online
 * - Benchmark de latência de rede
 * - Validar que requisições rápidas não são afetadas por timeouts
 */
router.get('/fast', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Resposta rápida - sem timeout',
    timestamp: new Date().toISOString(),
  });
});

export default router;
