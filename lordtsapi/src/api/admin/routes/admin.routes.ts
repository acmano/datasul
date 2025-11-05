// src/api/admin/routes/admin.routes.ts

import { Router, Request, Response } from 'express';
import { ApiKeyService } from '@shared/services/apiKey.service';
import { UserRateLimiter } from '@shared/utils/UserRateLimiter';
import { UserTier } from '@shared/types/apiKey.types';
import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { AuthorizationError, ValidationError } from '@shared/errors/errors';

const router = Router();

/**
 * @openapi
 * /admin/api-keys:
 *   get:
 *     summary: Listar todas as API Keys
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Lista de API Keys
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não autorizado (requer tier ADMIN)
 */
router.get('/api-keys', apiKeyAuth, async (req: Request, res: Response) => {
  if (req.user?.tier !== UserTier.ADMIN) {
    throw new AuthorizationError('Apenas administradores podem listar todas as API Keys');
  }

  const stats = ApiKeyService.getStats();

  res.json({
    success: true,
    data: stats,
    correlationId: req.id
  });
});

/**
 * @openapi
 * /admin/api-keys/generate:
 *   post:
 *     summary: Gerar nova API Key
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userName
 *               - tier
 *             properties:
 *               userId:
 *                 type: string
 *               userName:
 *                 type: string
 *               tier:
 *                 type: string
 *                 enum: [free, premium, enterprise, admin]
 *               expiresInDays:
 *                 type: number
 *     responses:
 *       200:
 *         description: API Key gerada
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Não autorizado
 */
router.post('/api-keys/generate', apiKeyAuth, async (req: Request, res: Response) => {
  if (req.user?.tier !== UserTier.ADMIN) {
    throw new AuthorizationError('Apenas administradores podem gerar API Keys');
  }

  const { userId, userName, tier, expiresInDays } = req.body;

  if (!userId || !userName || !tier) {
    const missingFields: Record<string, string> = {};
    if (!userId) missingFields.userId = 'Obrigatório';
    if (!userName) missingFields.userName = 'Obrigatório';
    if (!tier) missingFields.tier = 'Obrigatório';

    throw new ValidationError('userId, userName e tier são obrigatórios', missingFields);
  }

  const apiKey = await ApiKeyService.generateKey(userId, userName, tier, expiresInDays);

  res.json({
    success: true,
    data: { apiKey, userId, userName, tier, expiresInDays },
    correlationId: req.id
  });
});

/**
 * @openapi
 * /admin/api-keys/{apiKey}/revoke:
 *   post:
 *     summary: Revogar API Key
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: apiKey
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API Key revogada
 *       404:
 *         description: API Key não encontrada
 *       403:
 *         description: Não autorizado
 */
router.post('/api-keys/:apiKey/revoke', apiKeyAuth, async (req: Request, res: Response) => {
  if (req.user?.tier !== UserTier.ADMIN) {
    throw new AuthorizationError('Apenas administradores podem revogar API Keys');
  }

  const { apiKey } = req.params;
  if (!apiKey) {
    throw new ValidationError('API Key é obrigatória');
  }
  const revoked = await ApiKeyService.revokeKey(apiKey);

  res.json({
    success: revoked,
    message: revoked ? 'API Key revogada' : 'API Key não encontrada',
    correlationId: req.id
  });
});

/**
 * @openapi
 * /admin/rate-limit/stats:
 *   get:
 *     summary: Estatísticas de rate limit
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estatísticas de rate limiting
 *       403:
 *         description: Não autorizado
 */
router.get('/rate-limit/stats', apiKeyAuth, async (req: Request, res: Response) => {
  if (req.user?.tier !== UserTier.ADMIN) {
    throw new AuthorizationError('Apenas administradores podem ver estatísticas');
  }

  const userId = req.query.userId as string | undefined;
  const stats = UserRateLimiter.getStats(userId);

  res.json({
    success: true,
    data: stats,
    correlationId: req.id
  });
});

/**
 * @openapi
 * /admin/rate-limit/reset/{userId}:
 *   post:
 *     summary: Resetar rate limit de um usuário
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rate limit resetado
 *       403:
 *         description: Não autorizado
 */
router.post('/rate-limit/reset/:userId', apiKeyAuth, async (req: Request, res: Response) => {
  if (req.user?.tier !== UserTier.ADMIN) {
    throw new AuthorizationError('Apenas administradores podem resetar rate limits');
  }

  const { userId } = req.params;
  if (!userId) {
    throw new ValidationError('User ID é obrigatório');
  }
  UserRateLimiter.resetUser(userId);

  res.json({
    success: true,
    message: `Rate limit resetado para usuário ${userId}`,
    correlationId: req.id
  });
});

/**
 * @openapi
 * /admin/users/{userId}/tier:
 *   put:
 *     summary: Atualizar tier de um usuário
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tier
 *             properties:
 *               tier:
 *                 type: string
 *                 enum: [free, premium, enterprise, admin]
 *     responses:
 *       200:
 *         description: Tier atualizado
 *       400:
 *         description: Tier inválido
 *       403:
 *         description: Não autorizado
 */
router.put('/users/:userId/tier', apiKeyAuth, async (req: Request, res: Response) => {
  if (req.user?.tier !== UserTier.ADMIN) {
    throw new AuthorizationError('Apenas administradores podem atualizar tiers');
  }

  const { userId } = req.params;
  const { tier } = req.body;

  if (!userId) {
    throw new ValidationError('User ID é obrigatório');
  }

  if (!tier || !Object.values(UserTier).includes(tier)) {
    throw new ValidationError('Tier inválido', {
      tier: `Deve ser: ${Object.values(UserTier).join(', ')}`
    });
  }

  await ApiKeyService.updateUserTier(userId, tier);

  res.json({
    success: true,
    message: `Tier atualizado para ${tier}`,
    data: { userId, tier },
    correlationId: req.id
  });
});

export default router;