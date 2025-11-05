/**
 * Família Routes - API v2
 */

import { Router } from 'express';
import informacoesGeraisRoutes from '@familia/dadosCadastrais/informacoesGerais/routes';
import listarRoutes from '@familia/listar/routes';

const router = Router();

router.use('/dados-cadastrais/informacoes-gerais', informacoesGeraisRoutes);
router.use('/listar', listarRoutes);

export default router;
