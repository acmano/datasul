/**
 * Item Routes - API v2
 * Inclui bulk operations, advanced search, export
 */

import { Router } from 'express';

// Re-usa rotas existentes
import informacoesGeraisRoutes from '@item/dadosCadastrais/informacoesGerais/routes';
import dimensoesRoutes from '@item/dadosCadastrais/dimensoes/routes';
import fiscalRoutes from '@item/dadosCadastrais/fiscal/routes';
import manufaturaRoutes from '@item/dadosCadastrais/manufatura/routes';
import planejamentoRoutes from '@item/dadosCadastrais/planejamento/routes';
import empresasRoutes from '@item/empresas/routes';
import searchRoutes from '@item/search/routes';

// Novas rotas v2
import bulkRoutes from './item/bulk.routes';
import advancedSearchRoutes from './item/advancedSearch.routes';
import exportRoutes from './item/export.routes';

const router = Router();

// Rotas existentes (compatibilidade)
router.use('/dados-cadastrais/informacoes-gerais', informacoesGeraisRoutes);
router.use('/dados-cadastrais/dimensoes', dimensoesRoutes);
router.use('/dados-cadastrais/fiscal', fiscalRoutes);
router.use('/dados-cadastrais/manufatura', manufaturaRoutes);
router.use('/dados-cadastrais/planejamento', planejamentoRoutes);
router.use('/empresas', empresasRoutes);
router.use('/search', searchRoutes);

// Novas features v2
router.use('/bulk', bulkRoutes);
router.use('/advanced-search', advancedSearchRoutes);
router.use('/export', exportRoutes);

export default router;
