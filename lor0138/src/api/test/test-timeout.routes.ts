// src/api/test/test-timeout.routes.ts
// ⚠️ APENAS PARA DESENVOLVIMENTO - REMOVA EM PRODUÇÃO

import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../../infrastructure/database/DatabaseManager'; // ✅ CORRIGIDO: path relativo

const router = Router();

/**
 * Rota de teste que simula lentidão
 * 
 * Uso:
 * GET /api/test/timeout?delay=35000
 * 
 * Query params:
 * - delay: tempo em ms (padrão: 35000 = 35 segundos)
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
 * Rota que testa timeout do banco de dados
 * Usa WAITFOR DELAY do SQL Server
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
  } catch (error: any) {
    // Esperamos que dê timeout
    console.log('[TEST] Timeout de query funcionou:', error.message);
    res.status(408).json({
      success: false,
      error: 'Query timeout (esperado)',
      message: error.message,
    });
  }
});

/**
 * Rota que retorna rápido (para comparação)
 */
router.get('/fast', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Resposta rápida - sem timeout',
    timestamp: new Date().toISOString(),
  });
});

export default router;