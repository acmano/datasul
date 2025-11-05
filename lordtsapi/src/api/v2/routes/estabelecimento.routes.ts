import { Router } from 'express';
import informacoesGeraisRoutes from '@estabelecimento/dadosCadastrais/informacoesGerais/routes';

const router = Router();
router.use('/dados-cadastrais/informacoes-gerais', informacoesGeraisRoutes);

export default router;
