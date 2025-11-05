/**
 * API v2 - Current Version
 *
 * Melhorias sobre v1:
 * - Bulk operations
 * - Advanced search
 * - Webhooks support
 * - Paginação melhorada
 * - Responses padronizadas
 */

import { Router } from 'express';

// Importa rotas com features novas
import itemRoutes from './routes/item.routes';
import familiaRoutes from './routes/familia.routes';
import familiaComercialRoutes from './routes/familiaComercial.routes';
import grupoDeEstoqueRoutes from './routes/grupoDeEstoque.routes';
import estabelecimentoRoutes from './routes/estabelecimento.routes';

const router = Router();

// Headers de versão
router.use((req, res, next) => {
  res.setHeader('API-Version', '2.0');
  res.setHeader('Link', '</api/v1>; rel="predecessor-version"');
  next();
});

// Rotas V2
router.use('/item', itemRoutes);
router.use('/familia', familiaRoutes);
router.use('/familia-comercial', familiaComercialRoutes);
router.use('/grupo-estoque', grupoDeEstoqueRoutes);
router.use('/estabelecimento', estabelecimentoRoutes);

export default router;
