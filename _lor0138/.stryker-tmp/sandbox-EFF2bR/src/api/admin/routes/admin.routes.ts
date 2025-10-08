// @ts-nocheck
// src/api/admin/routes/admin.routes.ts
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { Router, Request, Response } from 'express';
import { ApiKeyService } from '@shared/services/ApiKeyService';
import { UserRateLimiter } from '@shared/utils/UserRateLimiter';
import { UserTier } from '@shared/types/apiKey.types';
import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
import { AuthorizationError, ValidationError } from '@shared/errors';
const router = Router();

/**
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
router.get(stryMutAct_9fa48("0") ? "" : (stryCov_9fa48("0"), '/api-keys'), apiKeyAuth, async (req: Request, res: Response) => {
  if (stryMutAct_9fa48("1")) {
    {}
  } else {
    stryCov_9fa48("1");
    // Apenas admin pode listar todas as keys
    if (stryMutAct_9fa48("4") ? req.user?.tier === UserTier.ADMIN : stryMutAct_9fa48("3") ? false : stryMutAct_9fa48("2") ? true : (stryCov_9fa48("2", "3", "4"), (stryMutAct_9fa48("5") ? req.user.tier : (stryCov_9fa48("5"), req.user?.tier)) !== UserTier.ADMIN)) {
      if (stryMutAct_9fa48("6")) {
        {}
      } else {
        stryCov_9fa48("6");
        throw new AuthorizationError(stryMutAct_9fa48("7") ? "" : (stryCov_9fa48("7"), 'Apenas administradores podem listar todas as API Keys'));
      }
    }
    const stats = ApiKeyService.getStats();
    res.json(stryMutAct_9fa48("8") ? {} : (stryCov_9fa48("8"), {
      success: stryMutAct_9fa48("9") ? false : (stryCov_9fa48("9"), true),
      data: stats,
      correlationId: req.id
    }));
  }
});

/**
 * @openapi
 * /admin/api-keys/generate:
 *   post:
 *     summary: Gerar nova API Key
 *     tags:
 *       - Admin
 *     security:
 *       - ApiKeyAuth: []
 */
router.post(stryMutAct_9fa48("10") ? "" : (stryCov_9fa48("10"), '/api-keys/generate'), apiKeyAuth, async (req: Request, res: Response) => {
  if (stryMutAct_9fa48("11")) {
    {}
  } else {
    stryCov_9fa48("11");
    if (stryMutAct_9fa48("14") ? req.user?.tier === UserTier.ADMIN : stryMutAct_9fa48("13") ? false : stryMutAct_9fa48("12") ? true : (stryCov_9fa48("12", "13", "14"), (stryMutAct_9fa48("15") ? req.user.tier : (stryCov_9fa48("15"), req.user?.tier)) !== UserTier.ADMIN)) {
      if (stryMutAct_9fa48("16")) {
        {}
      } else {
        stryCov_9fa48("16");
        throw new AuthorizationError(stryMutAct_9fa48("17") ? "" : (stryCov_9fa48("17"), 'Apenas administradores podem gerar API Keys'));
      }
    }
    const {
      userId,
      userName,
      tier,
      expiresInDays
    } = req.body;
    if (stryMutAct_9fa48("20") ? (!userId || !userName) && !tier : stryMutAct_9fa48("19") ? false : stryMutAct_9fa48("18") ? true : (stryCov_9fa48("18", "19", "20"), (stryMutAct_9fa48("22") ? !userId && !userName : stryMutAct_9fa48("21") ? false : (stryCov_9fa48("21", "22"), (stryMutAct_9fa48("23") ? userId : (stryCov_9fa48("23"), !userId)) || (stryMutAct_9fa48("24") ? userName : (stryCov_9fa48("24"), !userName)))) || (stryMutAct_9fa48("25") ? tier : (stryCov_9fa48("25"), !tier)))) {
      if (stryMutAct_9fa48("26")) {
        {}
      } else {
        stryCov_9fa48("26");
        const missingFields: Record<string, string> = {};
        if (stryMutAct_9fa48("29") ? false : stryMutAct_9fa48("28") ? true : stryMutAct_9fa48("27") ? userId : (stryCov_9fa48("27", "28", "29"), !userId)) missingFields.userId = stryMutAct_9fa48("30") ? "" : (stryCov_9fa48("30"), 'Obrigatório');
        if (stryMutAct_9fa48("33") ? false : stryMutAct_9fa48("32") ? true : stryMutAct_9fa48("31") ? userName : (stryCov_9fa48("31", "32", "33"), !userName)) missingFields.userName = stryMutAct_9fa48("34") ? "" : (stryCov_9fa48("34"), 'Obrigatório');
        if (stryMutAct_9fa48("37") ? false : stryMutAct_9fa48("36") ? true : stryMutAct_9fa48("35") ? tier : (stryCov_9fa48("35", "36", "37"), !tier)) missingFields.tier = stryMutAct_9fa48("38") ? "" : (stryCov_9fa48("38"), 'Obrigatório');
        throw new ValidationError(stryMutAct_9fa48("39") ? "" : (stryCov_9fa48("39"), 'userId, userName e tier são obrigatórios'), missingFields);
      }
    }
    const apiKey = await ApiKeyService.generateKey(userId, userName, tier, expiresInDays);
    res.json(stryMutAct_9fa48("40") ? {} : (stryCov_9fa48("40"), {
      success: stryMutAct_9fa48("41") ? false : (stryCov_9fa48("41"), true),
      data: stryMutAct_9fa48("42") ? {} : (stryCov_9fa48("42"), {
        apiKey,
        userId,
        userName,
        tier,
        expiresInDays
      }),
      correlationId: req.id
    }));
  }
});

/**
 * @openapi
 * /admin/api-keys/{apiKey}/revoke:
 *   post:
 *     summary: Revogar API Key
 *     tags:
 *       - Admin
 */
router.post(stryMutAct_9fa48("43") ? "" : (stryCov_9fa48("43"), '/api-keys/:apiKey/revoke'), apiKeyAuth, async (req: Request, res: Response) => {
  if (stryMutAct_9fa48("44")) {
    {}
  } else {
    stryCov_9fa48("44");
    if (stryMutAct_9fa48("47") ? req.user?.tier === UserTier.ADMIN : stryMutAct_9fa48("46") ? false : stryMutAct_9fa48("45") ? true : (stryCov_9fa48("45", "46", "47"), (stryMutAct_9fa48("48") ? req.user.tier : (stryCov_9fa48("48"), req.user?.tier)) !== UserTier.ADMIN)) {
      if (stryMutAct_9fa48("49")) {
        {}
      } else {
        stryCov_9fa48("49");
        throw new AuthorizationError(stryMutAct_9fa48("50") ? "" : (stryCov_9fa48("50"), 'Apenas administradores podem revogar API Keys'));
      }
    }
    const {
      apiKey
    } = req.params;
    const revoked = await ApiKeyService.revokeKey(apiKey);
    res.json(stryMutAct_9fa48("51") ? {} : (stryCov_9fa48("51"), {
      success: revoked,
      message: revoked ? stryMutAct_9fa48("52") ? "" : (stryCov_9fa48("52"), 'API Key revogada') : stryMutAct_9fa48("53") ? "" : (stryCov_9fa48("53"), 'API Key não encontrada'),
      correlationId: req.id
    }));
  }
});

/**
 * @openapi
 * /admin/rate-limit/stats:
 *   get:
 *     summary: Estatísticas de rate limit
 *     tags:
 *       - Admin
 */
router.get(stryMutAct_9fa48("54") ? "" : (stryCov_9fa48("54"), '/rate-limit/stats'), apiKeyAuth, async (req: Request, res: Response) => {
  if (stryMutAct_9fa48("55")) {
    {}
  } else {
    stryCov_9fa48("55");
    if (stryMutAct_9fa48("58") ? req.user?.tier === UserTier.ADMIN : stryMutAct_9fa48("57") ? false : stryMutAct_9fa48("56") ? true : (stryCov_9fa48("56", "57", "58"), (stryMutAct_9fa48("59") ? req.user.tier : (stryCov_9fa48("59"), req.user?.tier)) !== UserTier.ADMIN)) {
      if (stryMutAct_9fa48("60")) {
        {}
      } else {
        stryCov_9fa48("60");
        throw new AuthorizationError(stryMutAct_9fa48("61") ? "" : (stryCov_9fa48("61"), 'Apenas administradores podem ver estatísticas'));
      }
    }
    const userId = req.query.userId as string | undefined;
    const stats = UserRateLimiter.getStats(userId);
    res.json(stryMutAct_9fa48("62") ? {} : (stryCov_9fa48("62"), {
      success: stryMutAct_9fa48("63") ? false : (stryCov_9fa48("63"), true),
      data: stats,
      correlationId: req.id
    }));
  }
});

/**
 * @openapi
 * /admin/rate-limit/reset/{userId}:
 *   post:
 *     summary: Resetar rate limit de um usuário
 *     tags:
 *       - Admin
 */
router.post(stryMutAct_9fa48("64") ? "" : (stryCov_9fa48("64"), '/rate-limit/reset/:userId'), apiKeyAuth, async (req: Request, res: Response) => {
  if (stryMutAct_9fa48("65")) {
    {}
  } else {
    stryCov_9fa48("65");
    if (stryMutAct_9fa48("68") ? req.user?.tier === UserTier.ADMIN : stryMutAct_9fa48("67") ? false : stryMutAct_9fa48("66") ? true : (stryCov_9fa48("66", "67", "68"), (stryMutAct_9fa48("69") ? req.user.tier : (stryCov_9fa48("69"), req.user?.tier)) !== UserTier.ADMIN)) {
      if (stryMutAct_9fa48("70")) {
        {}
      } else {
        stryCov_9fa48("70");
        throw new AuthorizationError(stryMutAct_9fa48("71") ? "" : (stryCov_9fa48("71"), 'Apenas administradores podem resetar rate limits'));
      }
    }
    const {
      userId
    } = req.params;
    UserRateLimiter.resetUser(userId);
    res.json(stryMutAct_9fa48("72") ? {} : (stryCov_9fa48("72"), {
      success: stryMutAct_9fa48("73") ? false : (stryCov_9fa48("73"), true),
      message: stryMutAct_9fa48("74") ? `` : (stryCov_9fa48("74"), `Rate limit resetado para usuário ${userId}`),
      correlationId: req.id
    }));
  }
});

/**
 * @openapi
 * /admin/users/{userId}/tier:
 *   put:
 *     summary: Atualizar tier de um usuário
 *     tags:
 *       - Admin
 */
router.put(stryMutAct_9fa48("75") ? "" : (stryCov_9fa48("75"), '/users/:userId/tier'), apiKeyAuth, async (req: Request, res: Response) => {
  if (stryMutAct_9fa48("76")) {
    {}
  } else {
    stryCov_9fa48("76");
    if (stryMutAct_9fa48("79") ? req.user?.tier === UserTier.ADMIN : stryMutAct_9fa48("78") ? false : stryMutAct_9fa48("77") ? true : (stryCov_9fa48("77", "78", "79"), (stryMutAct_9fa48("80") ? req.user.tier : (stryCov_9fa48("80"), req.user?.tier)) !== UserTier.ADMIN)) {
      if (stryMutAct_9fa48("81")) {
        {}
      } else {
        stryCov_9fa48("81");
        throw new AuthorizationError(stryMutAct_9fa48("82") ? "" : (stryCov_9fa48("82"), 'Apenas administradores podem atualizar tiers'));
      }
    }
    const {
      userId
    } = req.params;
    const {
      tier
    } = req.body;
    if (stryMutAct_9fa48("85") ? !tier && !Object.values(UserTier).includes(tier) : stryMutAct_9fa48("84") ? false : stryMutAct_9fa48("83") ? true : (stryCov_9fa48("83", "84", "85"), (stryMutAct_9fa48("86") ? tier : (stryCov_9fa48("86"), !tier)) || (stryMutAct_9fa48("87") ? Object.values(UserTier).includes(tier) : (stryCov_9fa48("87"), !Object.values(UserTier).includes(tier))))) {
      if (stryMutAct_9fa48("88")) {
        {}
      } else {
        stryCov_9fa48("88");
        throw new ValidationError(stryMutAct_9fa48("89") ? "" : (stryCov_9fa48("89"), 'Tier inválido'), stryMutAct_9fa48("90") ? {} : (stryCov_9fa48("90"), {
          tier: stryMutAct_9fa48("91") ? `` : (stryCov_9fa48("91"), `Deve ser: ${Object.values(UserTier).join(stryMutAct_9fa48("92") ? "" : (stryCov_9fa48("92"), ', '))}`)
        }));
      }
    }
    await ApiKeyService.updateUserTier(userId, tier);
    res.json(stryMutAct_9fa48("93") ? {} : (stryCov_9fa48("93"), {
      success: stryMutAct_9fa48("94") ? false : (stryCov_9fa48("94"), true),
      message: stryMutAct_9fa48("95") ? `` : (stryCov_9fa48("95"), `Tier atualizado para ${tier}`),
      data: stryMutAct_9fa48("96") ? {} : (stryCov_9fa48("96"), {
        userId,
        tier
      }),
      correlationId: req.id
    }));
  }
});
export default router;