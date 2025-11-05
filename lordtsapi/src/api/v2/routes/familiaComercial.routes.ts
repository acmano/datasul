import { Router } from 'express';
import informacoesGeraisRoutes from '@familiaComercial/dadosCadastrais/informacoesGerais/routes';
import listarRoutes from '@familiaComercial/listar/routes';

const router = Router();
router.use('/dados-cadastrais/informacoes-gerais', informacoesGeraisRoutes);
router.use('/listar', listarRoutes);

export default router;
