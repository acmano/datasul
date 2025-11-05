/**
 * Depósito Routes - API
 */

import { Router } from 'express';
import listarRoutes from '@deposito/listar/routes';

const router = Router();

router.use('/listar', listarRoutes);

export default router;
