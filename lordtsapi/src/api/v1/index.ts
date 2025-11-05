/**
 * API v1 - Legacy/Backward Compatibility
 *
 * Esta versão será descontinuada em 2026-06-01
 * Clientes devem migrar para v2
 *
 * NOTA: API v1 desabilitada - todas as rotas estão disponíveis diretamente
 * em app.ts sem necessidade de versioning. Use as rotas em /api/* diretamente.
 */

import { Router } from 'express';

const router = Router();

// API v1 desabilitada - retorna informações de migração
router.use((req, res) => {
  res.status(410).json({
    success: false,
    error: 'API v1 não está mais disponível',
    message: 'Use as rotas diretas em /api/* ao invés de /api/v1/*',
    migration: {
      deprecated: '/api/v1/item/:codigo',
      current: '/api/item/dadosCadastrais/informacoesGerais/:codigo',
      documentation: '/api-docs',
    },
    sunset: 'Sun, 01 Jun 2026 00:00:00 GMT',
  });
});

export default router;
