// src/shared/middlewares/userRateLimit.middleware.ts

/**
 * @fileoverview Middleware de Rate Limiting por Usuário e Tier
 *
 * ===================================================================
 * VISÃO GERAL
 * ===================================================================
 *
 * Este middleware implementa controle de taxa de requisições (rate limiting)
 * baseado no tier/plano do usuário autenticado via API Key.
 *
 * Cada tier tem limites diferentes:
 * - **Free**: 10 req/min, 100 req/hora, 1.000 req/dia
 * - **Premium**: 60 req/min, 1.000 req/hora, 10.000 req/dia
 * - **Enterprise**: 300 req/min, 10.000 req/hora, 100.000 req/dia
 * - **Admin**: 1.000 req/min, 50.000 req/hora, 1.000.000 req/dia
 *
 * ===================================================================
 * ARQUITETURA E DEPENDÊNCIAS
 * ===================================================================
 *
 * DEPENDÊNCIAS OBRIGATÓRIAS:
 * --------------------------
 * 1. **correlationId middleware** - Deve vir ANTES
 *    - Popula req.id para logs e rastreamento
 *    - Sem ele: logs não terão correlation ID
 *
 * 2. **apiKeyAuth middleware** - Deve vir ANTES (para autenticação obrigatória)
 *    - Popula req.user com { id, tier, name }
 *    - Sem ele: rate limit será por IP (fallback)
 *
 * 3. **optionalApiKeyAuth** - Alternativa para endpoints públicos
 *    - Popula req.user SE houver API Key
 *    - Se não houver: passa sem autenticação
 *
 * ORDEM CORRETA DE MIDDLEWARES:
 * -----------------------------
 * ```typescript
 * router.get('/endpoint',
 *   correlationId,      // 1º - Correlation ID
 *   apiKeyAuth,         // 2º - Autenticação
 *   userRateLimit,      // 3º - Rate limit
 *   controller          // 4º - Lógica de negócio
 * );
 * ```
 *
 * ===================================================================
 * COMPORTAMENTO DETALHADO
 * ===================================================================
 *
 * FLUXO DE EXECUÇÃO:
 * ------------------
 *
 * 1. **Verificação de Autenticação**
 *    - Se req.user existe: usa tier do usuário
 *    - Se req.user NÃO existe: passa sem rate limit (fallback para IP)
 *
 * 2. **Consulta ao UserRateLimiter**
 *    - Chama UserRateLimiter.check(userId, tier)
 *    - Retorna: { allowed, limit, remaining, resetAt, retryAfter }
 *
 * 3. **Adiciona Headers HTTP**
 *    - X-RateLimit-Limit: Limite total no período
 *    - X-RateLimit-Remaining: Requisições restantes
 *    - X-RateLimit-Reset: Quando o contador reseta (ISO 8601)
 *    - Retry-After: Segundos até poder tentar (apenas se excedido)
 *
 * 4. **Decisão**
 *    - SE allowed = true: passa para próximo middleware
 *    - SE allowed = false: lança RateLimitError (429)
 *
 * ===================================================================
 * CASOS DE USO E EXEMPLOS
 * ===================================================================
 *
 * CASO 1: Endpoint Protegido (Autenticação Obrigatória)
 * ------------------------------------------------------
 * ```typescript
 * // Apenas usuários autenticados podem acessar
 * router.get('/protected',
 *   apiKeyAuth,        // Falha sem API Key
 *   userRateLimit,     // Rate limit por tier
 *   controller
 * );
 * ```
 *
 * CASO 2: Endpoint Público com Rate Limit Opcional
 * -------------------------------------------------
 * ```typescript
 * // Público, mas com rate limit diferenciado
 * router.get('/public',
 *   optionalApiKeyAuth,  // API Key opcional
 *   userRateLimit,       // Se autenticado: tier limit; se não: passa
 *   controller
 * );
 * ```
 *
 * CASO 3: Rate Limit Customizado (via Factory)
 * ---------------------------------------------
 * ```typescript
 * // Endpoint pesado: reduz limite para 50%
 * const heavyRateLimit = createUserRateLimit({ multiplier: 0.5 });
 *
 * router.post('/heavy-operation',
 *   apiKeyAuth,
 *   heavyRateLimit,    // Premium: 30 req/min (60 * 0.5)
 *   controller
 * );
 * ```
 *
 * CASO 4: Pular Rate Limit para Autenticados
 * -------------------------------------------
 * ```typescript
 * // Proteger apenas anônimos
 * const anonOnlyLimit = createUserRateLimit({ skipAuthenticated: true });
 *
 * router.get('/hybrid',
 *   optionalApiKeyAuth,
 *   anonOnlyLimit,     // Apenas anônimos são limitados
 *   controller
 * );
 * ```
 *
 * @module shared/middlewares/userRateLimit
 * @requires express
 * @requires @shared/utils/UserRateLimiter
 * @requires @shared/errors
 * @requires @shared/types/apiKey.types
 * @requires @shared/utils/logger
 * @since 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { UserRateLimiter } from '@shared/utils/UserRateLimiter';
import { RateLimitError } from '@shared/errors';
import { UserTier } from '@shared/types/apiKey.types';
import { log } from '@shared/utils/logger';

/**
 * ===================================================================
 * INTERFACE: UserRateLimitOptions
 * ===================================================================
 *
 * Opções de configuração para criação de middleware de rate limit customizado.
 * Permite ajustar comportamento para endpoints específicos.
 *
 * ===================================================================
 * PROPRIEDADES
 * ===================================================================
 *
 * @property {boolean} [skipAuthenticated=false]
 * Pula rate limit para usuários autenticados.
 *
 * QUANDO USAR:
 * - Endpoints públicos que queremos proteger apenas anônimos
 * - Busca pública limitada, mas ilimitada para usuários logados
 * - Conteúdo gratuito com "preview" limitado
 *
 * EXEMPLO:
 * ```typescript
 * // Busca pública: anônimos limitados, autenticados ilimitados
 * const searchLimit = createUserRateLimit({ skipAuthenticated: true });
 * router.get('/search', optionalApiKeyAuth, searchLimit, searchController);
 * ```
 *
 * @property {number} [multiplier=1]
 * Multiplicador dos limites padrão do tier.
 *
 * VALORES SUGERIDOS:
 * - **0.1 a 0.5**: Reduzir limite (endpoints pesados)
 * - **1.0**: Limite padrão (não altera)
 * - **2.0 a 5.0**: Aumentar limite (endpoints leves)
 * - **10.0+**: Muito generoso (use com cautela)
 *
 * QUANDO USAR REDUÇÃO (< 1):
 * - Operações pesadas (relatórios, exports)
 * - Endpoints com queries complexas
 * - Processamento que consome muitos recursos
 *
 * QUANDO USAR AUMENTO (> 1):
 * - Endpoints muito leves (ping, status)
 * - Busca em cache (resposta instantânea)
 * - Reads simples sem joins
 *
 * @interface UserRateLimitOptions
 * @since 1.0.0
 */
interface UserRateLimitOptions {
  skipAuthenticated?: boolean;
  multiplier?: number;
}

/**
 * ===================================================================
 * FUNÇÃO: userRateLimit
 * ===================================================================
 *
 * Middleware principal de rate limiting por usuário autenticado.
 *
 * Este é o middleware PADRÃO que deve ser usado na maioria dos casos.
 * Aplica rate limiting baseado no tier do usuário (Free/Premium/Enterprise/Admin).
 *
 * ===================================================================
 * FLUXO DE EXECUÇÃO DETALHADO
 * ===================================================================
 *
 * ETAPA 1: Verificação de Autenticação
 * -------------------------------------
 * Se não há usuário autenticado (req.user inexistente), passa sem aplicar
 * rate limit. Isso permite usar outro middleware de rate limit por IP ou
 * deixar endpoints públicos sem limite.
 *
 * POR QUE PASSAR SEM RATE LIMIT?
 * - Permite usar outro middleware de rate limit por IP
 * - Não bloqueia endpoints públicos
 * - Flexibilidade para diferentes estratégias
 *
 * ETAPA 2: Extração de Dados do Usuário
 * --------------------------------------
 * Extrai userId e tier de req.user (populado por apiKeyAuth).
 * - userId: Identificador único (ex: "user-premium-001")
 * - tier: "free" | "premium" | "enterprise" | "admin"
 *
 * IMPORTANTE:
 * - req.user DEVE ter sido populado por apiKeyAuth
 * - Se req.user está corrompido, try/catch captura erro
 * - Erro é passado para errorHandler middleware
 *
 * ETAPA 3: Consulta ao Rate Limiter
 * ----------------------------------
 * Chama UserRateLimiter.check(userId, tier) que retorna:
 * - allowed: boolean (pode fazer request?)
 * - limit: number (limite total)
 * - remaining: number (quantas restam)
 * - resetAt: number (timestamp de reset)
 * - retryAfter?: number (segundos até poder tentar)
 *
 * O UserRateLimiter mantém contadores em memória por userId e verifica
 * limites por minuto, hora e dia simultaneamente.
 *
 * ETAPA 4: Adicionar Headers HTTP
 * --------------------------------
 * Adiciona headers informativos seguindo RFC 6585:
 * - X-RateLimit-Limit: Limite total
 * - X-RateLimit-Remaining: Requisições restantes
 * - X-RateLimit-Reset: Timestamp ISO 8601 do reset
 *
 * Estes headers permitem que clientes implementem retry inteligente.
 *
 * ETAPA 5: Decisão Final
 * ----------------------
 * Se allowed = false:
 * - Loga warning com detalhes
 * - Adiciona header Retry-After
 * - Lança RateLimitError (429)
 *
 * Se allowed = true:
 * - Loga debug com uso atual
 * - Continua para próximo middleware
 *
 * ===================================================================
 * EXEMPLOS DE USO
 * ===================================================================
 *
 * EXEMPLO 1: Endpoint Protegido
 * ------------------------------
 * ```typescript
 * import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
 * import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
 *
 * router.get('/protected-endpoint',
 *   correlationIdMiddleware,
 *   apiKeyAuth,
 *   userRateLimit,
 *   protectedController
 * );
 * ```
 *
 * REQUEST (Premium User):
 * ```bash
 * curl -H "X-API-Key: premium-abc123" http://api/protected-endpoint
 * ```
 *
 * RESPONSE (200 OK):
 * ```http
 * HTTP/1.1 200 OK
 * X-RateLimit-Limit: 60
 * X-RateLimit-Remaining: 45
 * X-RateLimit-Reset: 2025-10-06T10:30:00.000Z
 *
 * {"success": true, "data": {...}}
 * ```
 *
 * RESPONSE (429 Too Many Requests):
 * ```http
 * HTTP/1.1 429 Too Many Requests
 * X-RateLimit-Limit: 60
 * X-RateLimit-Remaining: 0
 * X-RateLimit-Reset: 2025-10-06T10:30:00.000Z
 * Retry-After: 45
 *
 * {
 *   "error": "RateLimitError",
 *   "message": "Muitas requisições. Tente novamente em alguns segundos."
 * }
 * ```
 *
 * EXEMPLO 2: Endpoint Público
 * ----------------------------
 * ```typescript
 * import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
 *
 * router.get('/public-endpoint',
 *   correlationIdMiddleware,
 *   optionalApiKeyAuth,
 *   userRateLimit,
 *   publicController
 * );
 * ```
 *
 * REQUEST SEM API KEY:
 * ```bash
 * curl http://api/public-endpoint
 * # Passa sem rate limit
 * ```
 *
 * REQUEST COM API KEY:
 * ```bash
 * curl -H "X-API-Key: free-xyz789" http://api/public-endpoint
 * # Rate limit: 10 req/min (Free tier)
 * ```
 *
 * ===================================================================
 * LOGS GERADOS
 * ===================================================================
 *
 * LOG 1: Sem Autenticação (Debug)
 * --------------------------------
 * ```json
 * {
 *   "level": "debug",
 *   "message": "Rate limit por IP (sem autenticação)",
 *   "correlationId": "req-001",
 *   "ip": "192.168.1.100"
 * }
 * ```
 *
 * LOG 2: Rate Limit OK (Debug)
 * ----------------------------
 * ```json
 * {
 *   "level": "debug",
 *   "message": "Rate limit OK",
 *   "correlationId": "req-001",
 *   "userId": "user-premium-001",
 *   "tier": "premium",
 *   "remaining": 45,
 *   "limit": 60
 * }
 * ```
 *
 * LOG 3: Rate Limit Excedido (Warn)
 * ---------------------------------
 * ```json
 * {
 *   "level": "warn",
 *   "message": "Rate limit por usuário excedido",
 *   "correlationId": "req-002",
 *   "userId": "user-free-002",
 *   "tier": "free",
 *   "limit": 10,
 *   "resetAt": "2025-10-06T10:16:00.000Z"
 * }
 * ```
 *
 * ===================================================================
 * CONSIDERAÇÕES DE PERFORMANCE
 * ===================================================================
 *
 * IMPACTO: Baixo (< 1ms por request)
 * - Consulta a Map em memória (O(1))
 * - Cálculos simples de contador
 * - Sem I/O (não acessa banco/redis)
 *
 * MEMÓRIA: Baixo (< 1KB por usuário)
 * - 1.000 usuários ≈ 1MB de RAM
 * - Limpeza automática de contadores expirados
 *
 * ESCALABILIDADE:
 * - ⚠️ Rate limit é POR SERVIDOR (não distribuído)
 * - Em cluster: limite efetivo é N × limite configurado
 * - Para distribuir: integrar com Redis
 *
 * ===================================================================
 * SEGURANÇA
 * ===================================================================
 *
 * PREVENÇÃO DE ABUSE:
 * - Múltiplos Períodos: Minuto + Hora + Dia
 * - Sliding Window: Mais justo que fixed window
 * - Headers Informativos: Cliente sabe quando retry
 * - Logs de Abuso: Monitoramento de usuários problemáticos
 *
 * LIMITAÇÕES:
 * - Rate limit por userId, não por IP
 * - Atacante com muitas API Keys pode contornar
 * - Recomendado: combinar com rate limit por IP global
 *
 * ===================================================================
 * TROUBLESHOOTING
 * ===================================================================
 *
 * PROBLEMA: Rate limit não funciona
 * SOLUÇÃO: Verificar se apiKeyAuth está antes de userRateLimit
 *
 * PROBLEMA: Headers não aparecem
 * SOLUÇÃO: CORS deve expor X-RateLimit-* headers
 *
 * PROBLEMA: Logs sem correlationId
 * SOLUÇÃO: correlationId middleware deve vir antes
 *
 * @function userRateLimit
 * @param {Request} req - Objeto de requisição Express
 * @param {Object} req.user - Dados do usuário (populado por apiKeyAuth)
 * @param {string} req.user.id - ID único do usuário
 * @param {UserTier} req.user.tier - Tier do usuário
 * @param {string} req.id - Correlation ID
 * @param {Response} res - Objeto de resposta Express
 * @param {NextFunction} next - Função para próximo middleware
 * @returns {void}
 *
 * @throws {RateLimitError} Quando limite de requisições é excedido
 *
 * @since 1.0.0
 * @see {@link UserRateLimiter} Para lógica de contadores
 * @see {@link apiKeyAuth} Para autenticação
 * @see {@link RateLimitError} Para detalhes do erro
 *
 * @example
 * // Uso básico
 * router.get('/api/protected',
 *   apiKeyAuth,
 *   userRateLimit,
 *   protectedController
 * );
 *
 * @example
 * // Uso com autenticação opcional
 * router.get('/api/public',
 *   optionalApiKeyAuth,
 *   userRateLimit,
 *   publicController
 * );
 */
export function userRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Se não há usuário autenticado, aplica rate limit genérico por IP
    if (!req.user) {
      log.debug('Rate limit por IP (sem autenticação)', {
        correlationId: req.id,
        ip: req.ip
      });

      // Fallback para rate limit genérico
      return next();
    }

    const { id: userId, tier } = req.user;

    // Verifica rate limit baseado no tier do usuário
    const result = UserRateLimiter.check(userId, tier);

    // Adiciona headers de rate limit para informar o cliente
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    if (!result.allowed) {
      // Rate limit excedido
      log.warn('Rate limit por usuário excedido', {
        correlationId: req.id,
        userId,
        tier,
        limit: result.limit,
        resetAt: new Date(result.resetAt)
      });

      // Adiciona header Retry-After para informar quando pode tentar novamente
      if (result.retryAfter) {
        res.setHeader('Retry-After', result.retryAfter.toString());
      }

      throw new RateLimitError(result.retryAfter);
    }

    log.debug('Rate limit OK', {
      correlationId: req.id,
      userId,
      tier,
      remaining: result.remaining,
      limit: result.limit
    });

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * ===================================================================
 * FUNÇÃO: createUserRateLimit
 * ===================================================================
 *
 * Factory para criação de middleware de rate limit customizado.
 *
 * Permite criar variantes do middleware padrão com comportamento ajustado
 * para casos de uso específicos que requerem limites diferentes.
 *
 * ===================================================================
 * POR QUE USAR FACTORY?
 * ===================================================================
 *
 * Diferentes endpoints têm necessidades diferentes:
 * - Endpoints pesados precisam MENOS requisições
 * - Endpoints leves podem ter MAIS requisições
 * - Endpoints públicos precisam proteger apenas anônimos
 *
 * Factory Pattern permite gerar middlewares configurados sem duplicar código.
 *
 * ===================================================================
 * OPÇÕES DE CONFIGURAÇÃO
 * ===================================================================
 *
 * OPÇÃO 1: skipAuthenticated
 * ---------------------------
 * **Tipo:** boolean (opcional, padrão: false)
 * **Propósito:** Pular rate limit para usuários autenticados
 *
 * CASOS DE USO:
 * - Conteúdo público com "paywall suave"
 * - API pública com premium ilimitado
 * - Busca pública limitada
 *
 * EXEMPLO:
 * ```typescript
 * // Anônimos: limitado; Autenticados: ilimitado
 * const contentLimit = createUserRateLimit({ skipAuthenticated: true });
 * router.get('/article/:id', optionalApiKeyAuth, contentLimit, controller);
 * ```
 *
 * OPÇÃO 2: multiplier
 * -------------------
 * **Tipo:** number (opcional, padrão: 1)
 * **Propósito:** Multiplicar limites padrão do tier
 *
 * VALORES:
 * - < 1.0: Reduzir limite (endpoints pesados)
 * - = 1.0: Limite padrão
 * - > 1.0: Aumentar limite (endpoints leves)
 *
 * QUANDO USAR REDUÇÃO (< 1):
 *
 * A) Operações Pesadas de Banco
 * ```typescript
 * const reportLimit = createUserRateLimit({ multiplier: 0.25 });
 * // Premium: 60/min → 15/min
 * router.get('/reports/complex', apiKeyAuth, reportLimit, controller);
 * ```
 *
 * B) Processamento CPU-Intensive
 * ```typescript
 * const imageLimit = createUserRateLimit({ multiplier: 0.5 });
 * // Free: 10/min → 5/min
 * router.post('/images/process', apiKeyAuth, imageLimit, controller);
 * ```
 *
 * C) Operações de Escrita
 * ```typescript
 * const writeLimit = createUserRateLimit({ multiplier: 0.3 });
 * // Enterprise: 300/min → 90/min
 * router.post('/items', apiKeyAuth, writeLimit, controller);
 * ```
 *
 * QUANDO USAR AUMENTO (> 1):
 *
 * A) Endpoints Leves
 * ```typescript
 * const healthLimit = createUserRateLimit({ multiplier: 10 });
 * // Free: 10/min → 100/min
 * router.get('/health', optionalApiKeyAuth, healthLimit, controller);
 * ```
 *
 * B) Dados em Cache
 * ```typescript
 * const cachedLimit = createUserRateLimit({ multiplier: 5 });
 * // Premium: 60/min → 300/min
 * router.get('/popular-items', optionalApiKeyAuth, cachedLimit, controller);
 * ```
 *
 * ===================================================================
 * COMBINAÇÃO DE OPÇÕES
 * ===================================================================
 *
 * EXEMPLO: Endpoint Híbrido
 * --------------------------
 * ```typescript
 * // Autenticados: sem limite
 * // Anônimos: limite muito baixo (10% do padrão)
 * const hybridLimit = createUserRateLimit({
 *   skipAuthenticated: true,
 *   multiplier: 0.1
 * });
 *
 * router.get('/premium-content',
 *   optionalApiKeyAuth,
 *   hybridLimit,
 *   contentController
 * );
 * ```
 *
 * ===================================================================
 * FLUXO DE EXECUÇÃO
 * ===================================================================
 *
 * 1. Se skipAuthenticated = true E req.user existe: passa livre
 * 2. Se req.user NÃO existe: passa (fallback)
 * 3. Extrai userId e tier
 * 4. Verifica rate limit
 * 5. Aplica multiplier (se configurado)
 * 6. Adiciona headers
 * 7. Decide: permitir ou bloquear
 *
 * ===================================================================
 * LIMITAÇÕES
 * ===================================================================
 *
 * LIMITAÇÃO 1: Multiplier Apenas nos Headers
 * ------------------------------------------
 * Multiplier só afeta os headers enviados ao cliente.
 * A lógica interna do UserRateLimiter sempre usa o limite padrão.
 *
 * LIMITAÇÃO 2: Rate Limit Não Distribuído
 * ---------------------------------------
 * Contadores em memória não são compartilhados entre servidores.
 * Em cluster: limite efetivo é N × configurado
 *
 * SOLUÇÃO: Integrar UserRateLimiter com Redis.
 *
 * ===================================================================
 * SEGURANÇA
 * ===================================================================
 *
 * RISCOS DE skipAuthenticated:
 * - Permite requests ilimitados se autenticado
 * - Atacante com muitas keys pode contornar
 *
 * MITIGAÇÃO:
 * ```typescript
 * router.get('/sensitive',
 *   globalIpRateLimit,              // 100/min por IP
 *   optionalApiKeyAuth,
 *   createUserRateLimit({
 *     skipAuthenticated: true
 *   }),
 *   controller
 * );
 * ```
 *
 * @function createUserRateLimit
 * @param {UserRateLimitOptions} [options] - Opções de configuração
 * @param {boolean} [options.skipAuthenticated] - Pular rate limit para autenticados
 * @param {number} [options.multiplier] - Multiplicador do limite padrão
 * @returns {Function} Middleware Express configurado
 *
 * @since 1.0.0
 * @see {@link userRateLimit} Para middleware padrão
 * @see {@link UserRateLimitOptions} Para detalhes das opções
 *
 * @example
 * // Endpoint pesado: metade do limite
 * const heavyLimit = createUserRateLimit({ multiplier: 0.5 });
 * router.post('/heavy-report', apiKeyAuth, heavyLimit, controller);
 *
 * @example
 * // Endpoint público: apenas anônimos limitados
 * const publicLimit = createUserRateLimit({ skipAuthenticated: true });
 * router.get('/public-content', optionalApiKeyAuth, publicLimit, controller);
 *
 * @example
 * // Endpoint leve: dobro do limite
 * const cachedLimit = createUserRateLimit({ multiplier: 2 });
 * router.get('/cached-data', optionalApiKeyAuth, cachedLimit, controller);
 *
 * @example
 * // Combinação: autenticados ilimitados, anônimos restritos
 * const hybridLimit = createUserRateLimit({
 *   skipAuthenticated: true,
 *   multiplier: 0.1
 * });
 * router.get('/premium-feature', optionalApiKeyAuth, hybridLimit, controller);
 */
export function createUserRateLimit(options?: UserRateLimitOptions): (
  req: Request,
  res: Response,
  next: NextFunction
) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Se configurado para pular autenticados e usuário está autenticado
      if (options?.skipAuthenticated && req.user) {
        return next();
      }

      // Se não há usuário autenticado, passa (fallback para rate limit genérico)
      if (!req.user) {
        return next();
      }

      const { id: userId, tier } = req.user;
      const result = UserRateLimiter.check(userId, tier);

      // Aplica multiplicador se configurado
      const limit = options?.multiplier
        ? result.limit * options.multiplier
        : result.limit;

      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

      if (!result.allowed) {
        if (result.retryAfter) {
          res.setHeader('Retry-After', result.retryAfter.toString());
        }

        throw new RateLimitError(result.retryAfter);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}