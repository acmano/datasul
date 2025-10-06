// src/shared/middlewares/apiKeyAuth.middleware.ts

/**
 * @fileoverview Middleware de autenticação por API Key
 *
 * Fornece autenticação baseada em API Keys com suporte a múltiplas fontes
 * de entrada (headers e query parameters).
 *
 * Funcionalidades:
 * - Validação de API Keys
 * - Verificação de expiração
 * - Suporte a múltiplas fontes de entrada
 * - Modo opcional (não bloqueia se sem API Key)
 * - Logging de autenticações
 * - Mascaramento de keys nos logs
 *
 * Fontes de API Key suportadas (ordem de prioridade):
 * 1. Header X-API-Key: <api-key>
 * 2. Header Authorization: Bearer <api-key>
 * 3. Query parameter ?api_key=<api-key>
 *
 * @module shared/middlewares/apiKeyAuth
 * @requires express
 * @requires @shared/services/ApiKeyService
 * @requires @shared/errors
 * @requires @shared/utils/logger
 *
 * @example Proteger endpoint
 * ```typescript
 * import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
 *
 * router.get('/protected', apiKeyAuth, controller);
 * ```
 *
 * @example Autenticação opcional
 * ```typescript
 * import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
 *
 * router.get('/public', optionalApiKeyAuth, controller);
 * ```
 *
 * @see {@link ApiKeyService} para gerenciamento de API Keys
 * @see {@link API_Key_Rate_Limit.md} para guia completo
 */

import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '@shared/services/ApiKeyService';
import { AuthenticationError } from '@shared/errors';
import { log } from '@shared/utils/logger';

/**
 * Middleware de autenticação por API Key (obrigatória)
 *
 * @function apiKeyAuth
 *
 * @param {Request} req - Request do Express (modificado com apiKey e user)
 * @param {Response} res - Response do Express
 * @param {NextFunction} next - Callback para próximo middleware
 *
 * @returns {Promise<void>}
 *
 * @throws {AuthenticationError} Se API Key não fornecida
 * @throws {AuthenticationError} Se API Key inválida ou expirada
 *
 * @description
 * Middleware que requer API Key válida para acesso.
 * Extrai a key de múltiplas fontes, valida e adiciona informações
 * do usuário ao objeto Request.
 *
 * Fluxo de execução:
 * 1. Extrai API Key do request (header ou query)
 * 2. Verifica se foi fornecida (erro 401 se não)
 * 3. Valida a key com ApiKeyService
 * 4. Verifica se é válida e não expirou
 * 5. Adiciona req.apiKey e req.user ao request
 * 6. Loga a autenticação (sem expor a key completa)
 * 7. Passa para próximo middleware
 *
 * Fontes de API Key (ordem de busca):
 * 1. **Header X-API-Key**: Formato recomendado
 *    ```
 *    X-API-Key: premium-a1b2c3d4e5f6...
 *    ```
 *
 * 2. **Header Authorization**: Formato Bearer token
 *    ```
 *    Authorization: Bearer premium-a1b2c3d4e5f6...
 *    ```
 *
 * 3. **Query parameter**: Menos seguro, evite em produção
 *    ```
 *    ?api_key=premium-a1b2c3d4e5f6...
 *    ```
 *
 * Propriedades adicionadas ao Request:
 * - **req.apiKey**: Configuração completa da API Key
 *   ```typescript
 *   {
 *     key: string;
 *     userId: string;
 *     userName: string;
 *     tier: UserTier;
 *     active: boolean;
 *     createdAt: Date;
 *     expiresAt?: Date;
 *   }
 *   ```
 *
 * - **req.user**: Informações do usuário (atalho)
 *   ```typescript
 *   {
 *     id: string;
 *     name: string;
 *     tier: UserTier;
 *   }
 *   ```
 *
 * @example Uso básico
 * ```typescript
 * import { Router } from 'express';
 * import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
 *
 * const router = Router();
 *
 * router.get('/protected', apiKeyAuth, (req, res) => {
 *   // API Key já foi validada
 *   const { id, name, tier } = req.user!;
 *
 *   res.json({
 *     message: `Olá ${name}!`,
 *     tier,
 *     userId: id
 *   });
 * });
 * ```
 *
 * @example Com rate limiting
 * ```typescript
 * import { apiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
 * import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
 *
 * router.get('/data',
 *   apiKeyAuth,      // 1. Valida API Key
 *   userRateLimit,   // 2. Verifica rate limit por tier
 *   controller
 * );
 * ```
 *
 * @example Acessando dados do usuário
 * ```typescript
 * router.get('/profile', apiKeyAuth, (req, res) => {
 *   // Forma 1: via req.user (atalho)
 *   console.log(req.user.id);      // 'user-001'
 *   console.log(req.user.name);    // 'Premium User'
 *   console.log(req.user.tier);    // UserTier.PREMIUM
 *
 *   // Forma 2: via req.apiKey (completo)
 *   console.log(req.apiKey.key);        // API Key mascarada nos logs
 *   console.log(req.apiKey.createdAt);  // Data de criação
 *   console.log(req.apiKey.expiresAt);  // Data de expiração
 * });
 * ```
 *
 * @example Testando no terminal
 * ```bash
 * # Formato 1: Header X-API-Key
 * curl -H "X-API-Key: premium-key-abc123" \
 *   http://localhost:3000/api/protected
 *
 * # Formato 2: Bearer token
 * curl -H "Authorization: Bearer premium-key-abc123" \
 *   http://localhost:3000/api/protected
 *
 * # Formato 3: Query parameter (menos seguro)
 * curl http://localhost:3000/api/protected?api_key=premium-key-abc123
 * ```
 *
 * @example Resposta de erro (401)
 * ```json
 * // Sem API Key
 * {
 *   "error": "AuthenticationError",
 *   "message": "API Key não fornecida. Forneça via header X-API-Key ou Authorization: Bearer <key>",
 *   "timestamp": "2025-10-06T12:00:00.000Z",
 *   "path": "/api/protected",
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000"
 * }
 *
 * // API Key inválida
 * {
 *   "error": "AuthenticationError",
 *   "message": "API Key inválida ou expirada: prem...c123",
 *   "timestamp": "2025-10-06T12:00:00.000Z",
 *   "path": "/api/protected",
 *   "correlationId": "550e8400-e29b-41d4-a716-446655440000"
 * }
 * ```
 *
 * @remarks
 * ⚠️ Ponto crítico: Query parameters são menos seguros pois:
 * - Aparecem nos logs do servidor
 * - Podem ser salvos no histórico do browser
 * - Ficam visíveis na barra de endereço
 *
 * Use headers sempre que possível em produção.
 *
 * @remarks
 * 💡 Logs: API Keys são mascaradas nos logs para segurança.
 * Exemplo: "premium-key-abc123" → "prem...c123"
 *
 * @remarks
 * 🔄 Fluxo de erro: Erros são passados para errorHandler middleware
 * via `next(error)`, garantindo resposta padronizada.
 */
export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extrai API Key de múltiplas fontes
    const apiKey = extractApiKey(req);

    if (!apiKey) {
      throw new AuthenticationError('API Key não fornecida. Forneça via header X-API-Key ou Authorization: Bearer <key>');
    }

    // Valida API Key
    const keyConfig = await ApiKeyService.validateKey(apiKey);

    if (!keyConfig) {
      throw new AuthenticationError(`API Key inválida ou expirada: ${maskApiKey(apiKey)}`);
    }

    // Adiciona informações do usuário ao request
    req.apiKey = keyConfig;
    req.user = {
      id: keyConfig.userId,
      name: keyConfig.userName,
      tier: keyConfig.tier
    };

    log.debug('Autenticação via API Key', {
      correlationId: req.id,
      userId: keyConfig.userId,
      tier: keyConfig.tier,
      apiKey: maskApiKey(apiKey)
    });

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware de autenticação opcional por API Key
 *
 * @function optionalApiKeyAuth
 *
 * @param {Request} req - Request do Express (modificado com apiKey e user se fornecido)
 * @param {Response} res - Response do Express
 * @param {NextFunction} next - Callback para próximo middleware
 *
 * @returns {Promise<void>}
 *
 * @description
 * Middleware que permite acesso com ou sem API Key.
 * Se API Key fornecida, valida e adiciona informações ao request.
 * Se não fornecida, continua sem autenticação.
 *
 * Casos de uso:
 * - Endpoints públicos com features extras para usuários autenticados
 * - Rate limiting diferenciado (mais permissivo para autenticados)
 * - Analytics de uso anônimo vs autenticado
 * - Endpoints de migração gradual para autenticação
 *
 * Comportamento:
 * 1. Se **API Key fornecida**:
 *    - Valida a key
 *    - Se válida: adiciona req.user e req.apiKey
 *    - Se inválida: ignora e continua sem autenticação
 *
 * 2. Se **API Key NÃO fornecida**:
 *    - Continua sem autenticação
 *    - req.user e req.apiKey ficam undefined
 *
 * 3. **Nunca bloqueia** a requisição (não lança erro 401)
 *
 * @example Endpoint público com features extras
 * ```typescript
 * import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
 *
 * router.get('/data',
 *   optionalApiKeyAuth,
 *   (req, res) => {
 *     const data = getPublicData();
 *
 *     // Se autenticado, retorna dados extras
 *     if (req.user) {
 *       data.premium = getPremiumData();
 *       data.userTier = req.user.tier;
 *     }
 *
 *     res.json(data);
 *   }
 * );
 * ```
 *
 * @example Rate limiting diferenciado
 * ```typescript
 * import { optionalApiKeyAuth } from '@shared/middlewares/apiKeyAuth.middleware';
 * import { userRateLimit } from '@shared/middlewares/userRateLimit.middleware';
 *
 * router.get('/public',
 *   optionalApiKeyAuth,  // Autentica se possível
 *   userRateLimit,       // Rate limit por tier ou IP
 *   controller
 * );
 *
 * // Se autenticado: limites do tier (ex: 60/min para premium)
 * // Se não autenticado: limites por IP (ex: 10/min)
 * ```
 *
 * @example Verificando autenticação no controller
 * ```typescript
 * router.get('/profile', optionalApiKeyAuth, (req, res) => {
 *   if (req.user) {
 *     // Usuário autenticado
 *     return res.json({
 *       authenticated: true,
 *       userId: req.user.id,
 *       name: req.user.name,
 *       tier: req.user.tier
 *     });
 *   }
 *
 *   // Usuário não autenticado
 *   return res.json({
 *     authenticated: false,
 *     message: 'Forneça API Key para mais features'
 *   });
 * });
 * ```
 *
 * @example Analytics de uso
 * ```typescript
 * router.get('/article/:id', optionalApiKeyAuth, (req, res) => {
 *   const article = getArticle(req.params.id);
 *
 *   // Registra visualização
 *   analytics.track({
 *     event: 'article_view',
 *     articleId: req.params.id,
 *     authenticated: !!req.user,
 *     userId: req.user?.id || 'anonymous',
 *     tier: req.user?.tier || 'free'
 *   });
 *
 *   res.json(article);
 * });
 * ```
 *
 * @example Testando
 * ```bash
 * # Com API Key (será autenticado)
 * curl -H "X-API-Key: premium-key-abc123" \
 *   http://localhost:3000/api/public
 *
 * # Sem API Key (continua funcionando)
 * curl http://localhost:3000/api/public
 * ```
 *
 * @remarks
 * 💡 Diferença entre apiKeyAuth e optionalApiKeyAuth:
 * - **apiKeyAuth**: Bloqueia se não tiver API Key (401)
 * - **optionalApiKeyAuth**: Continua sem autenticação
 *
 * @remarks
 * ⚠️ Cuidado: Se a lógica do controller depende de req.user,
 * sempre verifique se está definido antes de usar:
 * ```typescript
 * if (!req.user) {
 *   return res.status(401).json({ error: 'Autenticação necessária' });
 * }
 * ```
 *
 * @remarks
 * 🔒 Segurança: Mesmo sendo opcional, API Keys inválidas são ignoradas
 * silenciosamente (não lançam erro). Isso previne enumeração de keys.
 */
export async function optionalApiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    // Sem API Key, continua sem autenticação
    return next();
  }

  try {
    const keyConfig = await ApiKeyService.validateKey(apiKey);

    if (keyConfig) {
      req.apiKey = keyConfig;
      req.user = {
        id: keyConfig.userId,
        name: keyConfig.userName,
        tier: keyConfig.tier
      };

      log.debug('Autenticação opcional via API Key', {
        correlationId: req.id,
        userId: keyConfig.userId,
        tier: keyConfig.tier
      });
    }

    next();
  } catch (error) {
    // Ignora erros de autenticação no modo opcional
    next();
  }
}

/**
 * Extrai API Key do request
 *
 * @function extractApiKey
 * @private
 *
 * @param {Request} req - Request do Express
 *
 * @returns {string | null} API Key extraída ou null se não encontrada
 *
 * @description
 * Função auxiliar que busca API Key em múltiplas fontes.
 * Ordem de prioridade (primeiro encontrado é retornado):
 * 1. Header X-API-Key
 * 2. Header Authorization (Bearer)
 * 3. Query parameter api_key
 *
 * @example
 * ```typescript
 * // Header X-API-Key
 * const key1 = extractApiKey(req);  // 'premium-key-abc123'
 *
 * // Header Authorization
 * const key2 = extractApiKey(req);  // 'premium-key-abc123'
 *
 * // Query parameter
 * const key3 = extractApiKey(req);  // 'premium-key-abc123'
 *
 * // Não encontrado
 * const key4 = extractApiKey(req);  // null
 * ```
 */
function extractApiKey(req: Request): string | null {
  // 1. Header X-API-Key
  const headerKey = req.headers['x-api-key'] as string;
  if (headerKey) {
    return headerKey;
  }

  // 2. Header Authorization: Bearer
  const authHeader = req.headers['authorization'] as string;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 3. Query parameter
  const queryKey = req.query.api_key as string;
  if (queryKey) {
    return queryKey;
  }

  return null;
}

/**
 * Mascara API Key para logs de segurança
 *
 * @function maskApiKey
 * @private
 *
 * @param {string} apiKey - API Key completa
 *
 * @returns {string} API Key mascarada
 *
 * @description
 * Função auxiliar que mascara API Keys para exibição segura em logs.
 * Mostra apenas primeiros e últimos 4 caracteres.
 *
 * Formato de saída:
 * - Keys > 8 chars: "xxxx...yyyy"
 * - Keys <= 8 chars: "***"
 *
 * @example
 * ```typescript
 * maskApiKey('premium-key-abc123');
 * // → "prem...c123"
 *
 * maskApiKey('free-demo-key-123456');
 * // → "free...3456"
 *
 * maskApiKey('short');
 * // → "***"
 * ```
 *
 * @remarks
 * 🔒 Segurança: Nunca logue API Keys completas.
 * Use sempre esta função antes de logar qualquer key.
 */
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '***';
  }
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}