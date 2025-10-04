// src/api/lor0138/item/dadosCadastrais/informacoesGerais/routes/informacoesGerais.routes.ts

import { Router, Request, Response } from 'express';
import { itemLimiter } from '@shared/middlewares/rateLimiter.middleware';

const router = Router();

/**
 * GET /:itemCodigo
 * Busca informações gerais de um item específico
 *
 * Rate Limit: 10 requisições por minuto para o mesmo item
 */
router.get('/:itemCodigo', itemLimiter, async (req: Request, res: Response) => {
  try {
    // Importação dinâmica para evitar problemas de circular dependency
    const { ItemInformacoesGeraisController } = await import('../controller/informacoesGerais.controller');
    
    // Chama o método do controller
    await ItemInformacoesGeraisController.getItemInformacoesGerais(req, res);
  } catch (error) {
    console.error('Erro ao carregar controller:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao processar requisição',
    });
  }
});

export default router;