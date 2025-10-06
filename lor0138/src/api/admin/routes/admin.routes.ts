// src/api/admin/routes/admin.routes.ts

/**
 * @fileoverview Rotas de administração para gerenciamento de API Keys e Rate Limiting
 *
 * Fornece endpoints para administradores gerenciarem:
 * - API Keys (listar, gerar, revogar)
 * - Rate limiting (estatísticas, reset)
 * - Usuários (atualizar tier)
 *
 * Todos os endpoints requerem autenticação com API Key de tier ADMIN.
 *
 * @module api/admin/routes
 * @requires express
 * @requires @shared/services/ApiKeyService
 * @requires @shared/utils/UserRateLimiter
 * @requires @shared/middlewares/apiKeyAuth.middleware
 * @requires @shared/errors
 */

import { Router, Request, Response } from 'express';
import { ApiKeyService } from '@shared/services/ApiKeyService';
import { UserRateLimiter } from '@shared/utils/UserRateLimiter';
import { UserTier } from '@shared/types/apiKey.types';
import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { AuthorizationError, ValidationError } from '@shared/errors';

const router = Router();

/**
 * GET /admin/api-keys
 * Lista todas as API Keys cadastradas no sistema
 *
 * @route GET /admin/api-keys
 * @access Admin
 * @authentication Requer API Key com tier ADMIN
 *
 * @returns {Object} 200 - Lista de estatísticas de API Keys
 * @returns {Object} 401 - Não autenticado (API Key ausente ou inválida)
 * @returns {Object} 403 - Não autorizado (tier diferente de ADMIN)
 *
 * @example
 * ```bash
 * curl -H "X-API-Key: admin-key-superuser" \
 *   http://localhost:3000/admin/api-keys
 * ```
 *
 * @example Response
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "total": 4,
 *     "active": 4,
 *     "inactive": 0,
 *     "byTier": {
 *       "free": 1,
 *       "premium": 1,
 *       "enterprise": 1,
 *       "admin": 1
 *     }
 *   },
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000"
 * }
 * ```
 *
 * @openapi
 * /admin/api-keys:
 *   get:
 *     summary: Listar todas as API Keys
 *     tags:
 *       - Admin
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Lista de API Keys
 */
router.get('/api-keys', apiKeyAuth, async (req: Request, res: Response) => {
  // Apenas admin pode listar todas as keys
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
 * POST /admin/api-keys/generate
 * Gera uma nova API Key para um usuário
 *
 * @route POST /admin/api-keys/generate
 * @access Admin
 * @authentication Requer API Key com tier ADMIN
 *
 * @param {string} userId - ID único do usuário (obrigatório)
 * @param {string} userName - Nome do usuário (obrigatório)
 * @param {string} tier - Tier da API Key: free, premium, enterprise, admin (obrigatório)
 * @param {number} [expiresInDays] - Dias até expiração (opcional, padrão: sem expiração)
 *
 * @returns {Object} 200 - API Key gerada com sucesso
 * @returns {Object} 400 - Dados inválidos (userId, userName ou tier ausentes)
 * @returns {Object} 401 - Não autenticado
 * @returns {Object} 403 - Não autorizado
 *
 * @example Request
 * ```bash
 * curl -X POST \
 *   -H "X-API-Key: admin-key-superuser" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "userId": "user-999",
 *     "userName": "New User",
 *     "tier": "premium",
 *     "expiresInDays": 30
 *   }' \
 *   http://localhost:3000/admin/api-keys/generate
 * ```
 *
 * @example Response
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "apiKey": "premium-a1b2c3d4e5f6...",
 *     "userId": "user-999",
 *     "userName": "New User",
 *     "tier": "premium",
 *     "expiresInDays": 30
 *   },
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000"
 * }
 * ```
 *
 * @openapi
 * /admin/api-keys/generate:
 *   post:
 *     summary: Gerar nova API Key
 *     tags:
 *       - Admin
 *     security:
 *       - ApiKeyAuth: []
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

  const apiKey = await ApiKeyService.generateKey(
    userId,
    userName,
    tier,
    expiresInDays
  );

  res.json({
    success: true,
    data: {
      apiKey,
      userId,
      userName,
      tier,
      expiresInDays
    },
    correlationId: req.id
  });
});

/**
 * POST /admin/api-keys/:apiKey/revoke
 * Revoga uma API Key existente
 *
 * @route POST /admin/api-keys/:apiKey/revoke
 * @access Admin
 * @authentication Requer API Key com tier ADMIN
 *
 * @param {string} apiKey - API Key a ser revogada (parâmetro de rota)
 *
 * @returns {Object} 200 - API Key revogada com sucesso
 * @returns {Object} 404 - API Key não encontrada
 * @returns {Object} 401 - Não autenticado
 * @returns {Object} 403 - Não autorizado
 *
 * @description
 * Marca a API Key como inativa, impedindo novos usos.
 * A key permanece no sistema para auditoria.
 *
 * @example
 * ```bash
 * curl -X POST \
 *   -H "X-API-Key: admin-key-superuser" \
 *   http://localhost:3000/admin/api-keys/free-demo-key-123456/revoke
 * ```
 *
 * @example Response (sucesso)
 * ```json
 * {
 *   "success": true,
 *   "message": "API Key revogada",
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000"
 * }
 * ```
 *
 * @example Response (não encontrada)
 * ```json
 * {
 *   "success": false,
 *   "message": "API Key não encontrada",
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000"
 * }
 * ```
 *
 * @openapi
 * /admin/api-keys/{apiKey}/revoke:
 *   post:
 *     summary: Revogar API Key
 *     tags:
 *       - Admin
 */
router.post('/api-keys/:apiKey/revoke', apiKeyAuth, async (req: Request, res: Response) => {
  if (req.user?.tier !== UserTier.ADMIN) {
    throw new AuthorizationError('Apenas administradores podem revogar API Keys');
  }

  const { apiKey } = req.params;
  const revoked = await ApiKeyService.revokeKey(apiKey);

  res.json({
    success: revoked,
    message: revoked ? 'API Key revogada' : 'API Key não encontrada',
    correlationId: req.id
  });
});

/**
 * GET /admin/rate-limit/stats
 * Retorna estatísticas de rate limiting
 *
 * @route GET /admin/rate-limit/stats
 * @access Admin
 * @authentication Requer API Key com tier ADMIN
 *
 * @query {string} [userId] - ID do usuário (opcional, retorna stats de um usuário específico)
 *
 * @returns {Object} 200 - Estatísticas de rate limiting
 * @returns {Object} 401 - Não autenticado
 * @returns {Object} 403 - Não autorizado
 *
 * @description
 * Se userId não for fornecido, retorna estatísticas globais.
 * Se userId for fornecido, retorna estatísticas detalhadas do usuário.
 *
 * @example Request (stats globais)
 * ```bash
 * curl -H "X-API-Key: admin-key-superuser" \
 *   http://localhost:3000/admin/rate-limit/stats
 * ```
 *
 * @example Request (stats de usuário)
 * ```bash
 * curl -H "X-API-Key: admin-key-superuser" \
 *   http://localhost:3000/admin/rate-limit/stats?userId=user-001
 * ```
 *
 * @example Response (usuário específico)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "userId": "user-001",
 *     "tier": "free",
 *     "usage": {
 *       "minute": { "current": 8, "limit": 10, "remaining": 2 },
 *       "hour": { "current": 45, "limit": 100, "remaining": 55 },
 *       "day": { "current": 234, "limit": 1000, "remaining": 766 }
 *     }
 *   },
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000"
 * }
 * ```
 *
 * @openapi
 * /admin/rate-limit/stats:
 *   get:
 *     summary: Estatísticas de rate limit
 *     tags:
 *       - Admin
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
 * POST /admin/rate-limit/reset/:userId
 * Reseta contadores de rate limit de um usuário
 *
 * @route POST /admin/rate-limit/reset/:userId
 * @access Admin
 * @authentication Requer API Key com tier ADMIN
 *
 * @param {string} userId - ID do usuário (parâmetro de rota)
 *
 * @returns {Object} 200 - Rate limit resetado com sucesso
 * @returns {Object} 401 - Não autenticado
 * @returns {Object} 403 - Não autorizado
 *
 * @description
 * Limpa todos os contadores (minute, hour, day) do usuário.
 * Útil em casos de:
 * - Testes
 * - Falso positivo
 * - Exceção administrativa
 *
 * @example
 * ```bash
 * curl -X POST \
 *   -H "X-API-Key: admin-key-superuser" \
 *   http://localhost:3000/admin/rate-limit/reset/user-001
 * ```
 *
 * @example Response
 * ```json
 * {
 *   "success": true,
 *   "message": "Rate limit resetado para usuário user-001",
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000"
 * }
 * ```
 *
 * @openapi
 * /admin/rate-limit/reset/{userId}:
 *   post:
 *     summary: Resetar rate limit de um usuário
 *     tags:
 *       - Admin
 */
router.post('/rate-limit/reset/:userId', apiKeyAuth, async (req: Request, res: Response) => {
  if (req.user?.tier !== UserTier.ADMIN) {
    throw new AuthorizationError('Apenas administradores podem resetar rate limits');
  }

  const { userId } = req.params;
  UserRateLimiter.resetUser(userId);

  res.json({
    success: true,
    message: `Rate limit resetado para usuário ${userId}`,
    correlationId: req.id
  });
});

/**
 * PUT /admin/users/:userId/tier
 * Atualiza o tier de um usuário
 *
 * @route PUT /admin/users/:userId/tier
 * @access Admin
 * @authentication Requer API Key com tier ADMIN
 *
 * @param {string} userId - ID do usuário (parâmetro de rota)
 * @param {string} tier - Novo tier: free, premium, enterprise, admin (body)
 *
 * @returns {Object} 200 - Tier atualizado com sucesso
 * @returns {Object} 400 - Tier inválido
 * @returns {Object} 401 - Não autenticado
 * @returns {Object} 403 - Não autorizado
 *
 * @description
 * Atualiza o tier em todas as API Keys do usuário.
 * Também atualiza limites de rate limiting automaticamente.
 *
 * Tiers disponíveis:
 * - free: 10 req/min, 100 req/h, 1000 req/dia
 * - premium: 60 req/min, 1000 req/h, 10000 req/dia
 * - enterprise: 300 req/min, 10000 req/h, 100000 req/dia
 * - admin: 1000 req/min, 50000 req/h, 1000000 req/dia
 *
 * @example Request
 * ```bash
 * curl -X PUT \
 *   -H "X-API-Key: admin-key-superuser" \
 *   -H "Content-Type: application/json" \
 *   -d '{"tier": "enterprise"}' \
 *   http://localhost:3000/admin/users/user-001/tier
 * ```
 *
 * @example Response (sucesso)
 * ```json
 * {
 *   "success": true,
 *   "message": "Tier atualizado para enterprise",
 *   "data": {
 *     "userId": "user-001",
 *     "tier": "enterprise"
 *   },
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000"
 * }
 * ```
 *
 * @example Response (erro)
 * ```json
 * {
 *   "error": "ValidationError",
 *   "message": "Tier inválido",
 *   "details": {
 *     "tier": "Deve ser: free, premium, enterprise, admin"
 *   }
 * }
 * ```
 *
 * @openapi
 * /admin/users/{userId}/tier:
 *   put:
 *     summary: Atualizar tier de um usuário
 *     tags:
 *       - Admin
 */
router.put('/users/:userId/tier', apiKeyAuth, async (req: Request, res: Response) => {
  if (req.user?.tier !== UserTier.ADMIN) {
    throw new AuthorizationError('Apenas administradores podem atualizar tiers');
  }

  const { userId } = req.params;
  const { tier } = req.body;

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