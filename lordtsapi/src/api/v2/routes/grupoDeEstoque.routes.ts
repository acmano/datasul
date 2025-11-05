import { Router } from 'express';
import informacoesGeraisRoutes from '@grupoDeEstoque/dadosCadastrais/informacoesGerais/routes';
import listarRoutes from '@grupoDeEstoque/listar/routes';

const router = Router();
router.use('/dados-cadastrais/informacoes-gerais', informacoesGeraisRoutes);
router.use('/listar', listarRoutes);

export default router;
