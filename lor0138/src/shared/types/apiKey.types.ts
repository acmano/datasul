// src/shared/types/apiKey.types.ts

/**
 * @fileoverview Tipos e Configurações de API Keys e Rate Limiting
 *
 * ===================================================================
 * VISÃO GERAL
 * ===================================================================
 *
 * Define todos os tipos relacionados ao sistema de autenticação via API Key
 * e rate limiting por tier de usuário.
 *
 * **Componentes Principais:**
 * - UserTier: Enum de planos/tiers disponíveis
 * - ApiKeyConfig: Configuração de uma API Key
 * - RateLimitConfig: Configuração de limites por tier
 * - RATE_LIMIT_CONFIGS: Mapeamento de limites por tier
 * - Express Request Extensions: Tipos para req.user e req.apiKey
 *
 * ===================================================================
 * ARQUITETURA DE TIERS
 * ===================================================================
 *
 * MODELO DE NEGÓCIO:
 * ------------------
 * Sistema freemium com 4 tiers:
 *
 * 1. **FREE** - Gratuito
 *    - Para: Usuários experimentando a plataforma
 *    - Limites baixos para prevenir abuso
 *    - Upgrade path: Premium
 *
 * 2. **PREMIUM** - Pago ($)
 *    - Para: Usuários regulares
 *    - Limites médios para uso profissional
 *    - Upgrade path: Enterprise
 *
 * 3. **ENTERPRISE** - Pago ($$$)
 *    - Para: Empresas e alto volume
 *    - Limites altos para integração em sistemas
 *    - Upgrade path: Admin (caso especial)
 *
 * 4. **ADMIN** - Especial
 *    - Para: Administradores do sistema
 *    - Limites muito altos (quase ilimitado)
 *    - Não é um plano comercial
 *
 * PROGRESSÃO DE LIMITES:
 * ----------------------
 * ```
 * Free < Premium < Enterprise < Admin
 * 10   < 60      < 300        < 1000  (req/min)
 * ```
 *
 * Cada tier superior tem ~6x mais limite que o anterior.
 *
 * ===================================================================
 * SISTEMA DE RATE LIMITING
 * ===================================================================
 *
 * MÚLTIPLAS JANELAS DE TEMPO:
 * ---------------------------
 * Cada tier tem 3 limites simultâneos:
 *
 * 1. **Por Minuto** (curto prazo)
 *    - Objetivo: Prevenir bursts e spam
 *    - Janela: 60 segundos deslizante
 *    - Reset: A cada minuto
 *
 * 2. **Por Hora** (médio prazo)
 *    - Objetivo: Controlar uso sustentado
 *    - Janela: 3600 segundos deslizante
 *    - Reset: A cada hora
 *
 * 3. **Por Dia** (longo prazo)
 *    - Objetivo: Quota diária total
 *    - Janela: 86400 segundos deslizante
 *    - Reset: A cada dia
 *
 * TODOS os limites devem estar OK para permitir request.
 * Se QUALQUER limite excedido: request bloqueado.
 *
 * BURST ALLOWANCE:
 * ----------------
 * Permite bursts temporários acima do limite por minuto.
 *
 * Exemplo (Free tier):
 * - Limite: 10 req/min
 * - Burst: 5 req
 * - Permite: até 15 req em um segundo, mas conta para limite/min
 *
 * Sem burst allowance:
 * - Cliente teria que espaçar requests igualmente (1 req a cada 6s)
 * - Ineficiente e limitante
 *
 * Com burst allowance:
 * - Cliente pode fazer 15 requests imediatamente
 * - Depois aguarda até próximo minuto
 * - Mais flexível e realista
 *
 * ===================================================================
 * COMPARAÇÃO COM OUTRAS PLATAFORMAS
 * ===================================================================
 *
 * NOSSOS LIMITES vs MERCADO:
 * --------------------------
 *
 * | Tier | Nosso (req/min) | Stripe | GitHub | AWS |
 * |------|----------------|--------|--------|-----|
 * | Free | 10 | 100 | 60 | 5 |
 * | Premium | 60 | 1000 | 5000 | 50 |
 * | Enterprise | 300 | Custom | Custom | Custom |
 *
 * Nossos limites são:
 * - Conservadores no Free (previne abuso)
 * - Competitivos no Premium (bom para uso profissional)
 * - Generosos no Enterprise (permite integração)
 *
 * ===================================================================
 * CÁLCULO DE CUSTOS E ROI
 * ===================================================================
 *
 * EXEMPLO DE PRICING:
 * -------------------
 * ```
 * Free: $0/mês = $0 por 1.000 req/dia = $0/milhão
 * Premium: $50/mês = $0.005 por request = $5/milhão
 * Enterprise: $500/mês = $0.0005 por request = $0.50/milhão
 * ```
 *
 * BREAK-EVEN POINTS:
 * ------------------
 * - Free → Premium: Após 100 req/dia (~3 req/hora)
 * - Premium → Enterprise: Após 10.000 req/dia (~7 req/min)
 *
 * @module shared/types/apiKey.types
 * @since 1.0.0
 */

/**
 * ===================================================================
 * ENUM: UserTier
 * ===================================================================
 *
 * Tiers de usuário que definem limites de rate limiting.
 *
 * **Por Que Enum e Não Union Type?**
 *
 * Enum:
 * ```typescript
 * enum UserTier { FREE = 'free' }
 * // Namespace + valores + type checking
 * // UserTier.FREE é autocomplete
 * ```
 *
 * Union Type:
 * ```typescript
 * type UserTier = 'free' | 'premium';
 * // Apenas type checking, sem namespace
 * // Precisa lembrar strings exatas
 * ```
 *
 * **Benefícios do Enum:**
 * - ✅ Autocomplete no IDE
 * - ✅ Refactoring seguro (renomear valor)
 * - ✅ Namespace (UserTier.FREE vs 'free')
 * - ✅ Runtime value (pode iterar)
 * - ✅ Documentação clara
 *
 * **String Enum vs Numeric Enum:**
 *
 * String Enum (nossa escolha):
 * ```typescript
 * enum UserTier { FREE = 'free' }
 * // Valor: 'free' (legível em logs/DB)
 * ```
 *
 * Numeric Enum:
 * ```typescript
 * enum UserTier { FREE = 0 }
 * // Valor: 0 (não legível em logs)
 * ```
 *
 * Usamos String Enum porque:
 * - Valores são legíveis em logs
 * - Compatível com JSON direto
 * - Facilita debugging
 * - Melhor para persistência em DB
 *
 * **Uso em Código:**
 * ```typescript
 * // Comparação
 * if (user.tier === UserTier.FREE) { ... }
 *
 * // Switch
 * switch (user.tier) {
 *   case UserTier.FREE: ...
 *   case UserTier.PREMIUM: ...
 * }
 *
 * // Iterar (runtime)
 * Object.values(UserTier).forEach(tier => {
 *   console.log(tier); // 'free', 'premium', ...
 * });
 * ```
 *
 * **Persistência em Database:**
 * ```sql
 * -- PostgreSQL
 * CREATE TYPE user_tier AS ENUM ('free', 'premium', 'enterprise', 'admin');
 *
 * -- MySQL
 * tier ENUM('free', 'premium', 'enterprise', 'admin')
 * ```
 *
 * **Valores:**
 *
 * @property {string} FREE='free'
 * Tier gratuito com limites básicos.
 * - 10 requests/minuto
 * - 100 requests/hora
 * - 1.000 requests/dia
 * - Burst: 5 requests
 *
 * @property {string} PREMIUM='premium'
 * Tier pago para usuários profissionais.
 * - 60 requests/minuto
 * - 1.000 requests/hora
 * - 10.000 requests/dia
 * - Burst: 20 requests
 *
 * @property {string} ENTERPRISE='enterprise'
 * Tier para empresas e alto volume.
 * - 300 requests/minuto
 * - 10.000 requests/hora
 * - 100.000 requests/dia
 * - Burst: 100 requests
 *
 * @property {string} ADMIN='admin'
 * Tier administrativo com limites muito altos.
 * - 1.000 requests/minuto
 * - 50.000 requests/hora
 * - 1.000.000 requests/dia
 * - Burst: 500 requests
 *
 * @enum {string}
 * @readonly
 * @since 1.0.0
 *
 * @example
 * // Criar usuário Free
 * const user = {
 *   id: 'user-001',
 *   tier: UserTier.FREE
 * };
 *
 * @example
 * // Upgrade para Premium
 * user.tier = UserTier.PREMIUM;
 * await ApiKeyService.updateUserTier(user.id, UserTier.PREMIUM);
 *
 * @example
 * // Verificar tier
 * if (req.user?.tier === UserTier.ADMIN) {
 *   // Acesso admin
 * }
 */
export enum UserTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin'
}

/**
 * ===================================================================
 * INTERFACE: ApiKeyConfig
 * ===================================================================
 *
 * Configuração completa de uma API Key.
 * Contém todos os metadados necessários para validação e auditoria.
 *
 * **Lifecycle de uma API Key:**
 *
 * 1. **CRIAÇÃO**
 *    ```typescript
 *    const config: ApiKeyConfig = {
 *      key: 'premium-abc123...',
 *      userId: 'user-001',
 *      userName: 'John Doe',
 *      tier: UserTier.PREMIUM,
 *      active: true,
 *      createdAt: new Date()
 *    };
 *    ```
 *
 * 2. **USO** (validação)
 *    ```typescript
 *    const config = await ApiKeyService.validateKey(apiKey);
 *    if (config && config.active) {
 *      // Key válida
 *    }
 *    ```
 *
 * 3. **REVOGAÇÃO**
 *    ```typescript
 *    config.active = false;
 *    // Key não pode mais ser usada
 *    ```
 *
 * 4. **EXPIRAÇÃO** (automática)
 *    ```typescript
 *    if (config.expiresAt && config.expiresAt < new Date()) {
 *      // Key expirou automaticamente
 *    }
 *    ```
 *
 * **Campos Obrigatórios vs Opcionais:**
 *
 * OBRIGATÓRIOS (sempre presentes):
 * - key, userId, userName, tier, active, createdAt
 *
 * OPCIONAIS (podem ser undefined):
 * - expiresAt (keys permanentes não têm)
 * - metadata (dados extras específicos)
 *
 * **Metadata: Extensibilidade:**
 *
 * Campo metadata permite adicionar dados customizados sem mudar schema:
 *
 * ```typescript
 * const config: ApiKeyConfig = {
 *   // ... campos obrigatórios
 *   metadata: {
 *     // IP whitelisting
 *     allowedIPs: ['192.168.1.0/24', '10.0.0.1'],
 *
 *     // Scopes/permissions
 *     scopes: ['read:items', 'write:items'],
 *
 *     // Analytics
 *     totalRequests: 1234,
 *     lastUsedAt: new Date(),
 *
 *     // Business info
 *     companyId: 'company-123',
 *     department: 'Engineering',
 *     costCenter: 'CC-456'
 *   }
 * };
 * ```
 *
 * **Persistência:**
 *
 * PostgreSQL:
 * ```sql
 * CREATE TABLE api_keys (
 *   key VARCHAR(64) PRIMARY KEY,
 *   user_id VARCHAR(64) NOT NULL,
 *   user_name VARCHAR(255) NOT NULL,
 *   tier VARCHAR(20) NOT NULL,
 *   active BOOLEAN DEFAULT true,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   expires_at TIMESTAMP,
 *   metadata JSONB,  -- JSONB para metadata
 *
 *   INDEX idx_user_id (user_id),
 *   INDEX idx_active (active),
 *   INDEX idx_expires_at (expires_at)
 * );
 * ```
 *
 * MongoDB:
 * ```javascript
 * {
 *   _id: ObjectId,
 *   key: String,
 *   userId: String,
 *   userName: String,
 *   tier: String,
 *   active: Boolean,
 *   createdAt: Date,
 *   expiresAt: Date,
 *   metadata: Object  // Flexible schema
 * }
 * ```
 *
 * **Segurança:**
 *
 * ⚠️ NUNCA expor key completa em APIs públicas:
 * ```typescript
 * // ❌ ERRADO
 * res.json({ apiKey: config.key });
 *
 * // ✅ CORRETO
 * res.json({
 *   apiKey: maskKey(config.key),  // 'prem...c123'
 *   userId: config.userId,
 *   tier: config.tier
 * });
 * ```
 *
 * @interface ApiKeyConfig
 * @since 1.0.0
 *
 * @property {string} key
 * API Key completa no formato: [tier]-[32-char-hex]
 * - Única e imutável
 * - Gerada com crypto.randomBytes
 * - Exemplo: 'premium-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
 *
 * @property {string} userId
 * ID único do usuário dono da key.
 * - Permite buscar todas keys de um usuário
 * - Usado em logs e auditoria
 * - Referência para sistema de users
 *
 * @property {string} userName
 * Nome do usuário para exibição.
 * - Facilita identificação em admin
 * - Usado em logs legíveis
 * - Não precisa ser único
 *
 * @property {UserTier} tier
 * Tier/plano que define rate limits.
 * - Determina quantas requests pode fazer
 * - Pode ser alterado (upgrade/downgrade)
 * - Afeta billing
 *
 * @property {boolean} active
 * Se key está ativa e pode ser usada.
 * - true: válida
 * - false: revogada (irreversível)
 * - Keys revogadas nunca voltam a ser ativas
 *
 * @property {Date} createdAt
 * Timestamp de criação da key.
 * - Usado para auditoria
 * - Permite análise de idade das keys
 * - Ajuda em políticas de rotação
 *
 * @property {Date} [expiresAt]
 * Data/hora de expiração (opcional).
 * - undefined: key permanente
 * - Definido: key expira automaticamente
 * - Após expirar, validateKey retorna null
 * - Útil para trials e keys temporárias
 *
 * @property {Record<string, any>} [metadata]
 * Metadados customizados (opcional).
 * - Armazena dados extras sem alterar schema
 * - Pode conter qualquer estrutura JSON
 * - Exemplos: IPs permitidos, scopes, analytics
 * - Flexível para futuras features
 *
 * @example
 * // Key permanente
 * const permanentKey: ApiKeyConfig = {
 *   key: 'premium-abc123...',
 *   userId: 'user-001',
 *   userName: 'John Doe',
 *   tier: UserTier.PREMIUM,
 *   active: true,
 *   createdAt: new Date()
 *   // expiresAt: undefined (permanente)
 * };
 *
 * @example
 * // Key com expiração
 * const trialKey: ApiKeyConfig = {
 *   key: 'premium-xyz789...',
 *   userId: 'user-002',
 *   userName: 'Jane Smith',
 *   tier: UserTier.PREMIUM,
 *   active: true,
 *   createdAt: new Date(),
 *   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 dias
 * };
 *
 * @example
 * // Key com metadata
 * const restrictedKey: ApiKeyConfig = {
 *   key: 'enterprise-def456...',
 *   userId: 'user-003',
 *   userName: 'Corp Inc',
 *   tier: UserTier.ENTERPRISE,
 *   active: true,
 *   createdAt: new Date(),
 *   metadata: {
 *     allowedIPs: ['203.0.113.0/24'],
 *     scopes: ['read:items', 'write:items'],
 *     companyId: 'company-123'
 *   }
 * };
 */
export interface ApiKeyConfig {
  key: string;
  userId: string;
  userName: string;
  tier: UserTier;
  active: boolean;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * ===================================================================
 * INTERFACE: RateLimitConfig
 * ===================================================================
 *
 * Configuração de rate limiting para um tier específico.
 * Define todos os limites e comportamentos de throttling.
 *
 * **Estrutura de Limites:**
 *
 * Cada tier tem 3 limites independentes:
 * ```
 * limits: {
 *   perMinute: X,  // Janela de 60s
 *   perHour: Y,    // Janela de 3600s
 *   perDay: Z      // Janela de 86400s
 * }
 * ```
 *
 * **Relação Entre Limites:**
 *
 * Matematicamente:
 * ```
 * perDay ≥ perHour * 24
 * perHour ≥ perMinute * 60
 * ```
 *
 * Na prática (com burst):
 * ```
 * perDay < perHour * 24  (usuário não sustenta max toda hora)
 * perHour < perMinute * 60  (usuário não sustenta max todo minuto)
 * ```
 *
 * **Burst Allowance Explicado:**
 *
 * Sem burst (rígido):
 * ```
 * Limite: 10 req/min
 * Comportamento: 1 request a cada 6 segundos
 * Problema: Ineficiente, cliente precisa espaçar
 * ```
 *
 * Com burst (flexível):
 * ```
 * Limite: 10 req/min
 * Burst: 5
 * Comportamento: Pode fazer 15 requests imediatamente
 * Depois: Aguarda até próximo minuto
 * Benefício: Mais natural e eficiente
 * ```
 *
 * **Algoritmo de Burst:**
 * ```typescript
 * // Bucket token algorithm
 * const tokens = limit + burstAllowance;  // 15 tokens
 * const refillRate = limit / 60;  // 0.167 tokens/segundo
 *
 * if (currentTokens >= 1) {
 *   currentTokens -= 1;  // Consome 1 token
 *   allowRequest();
 * } else {
 *   denyRequest();
 *   retryAfter = Math.ceil((1 - currentTokens) / refillRate);
 * }
 * ```
 *
 * **Casos de Uso por Tier:**
 *
 * FREE (hobby/teste):
 * - Website pessoal fazendo 1 request/página
 * - App mobile com poucos usuários
 * - Testes e desenvolvimento
 *
 * PREMIUM (profissional):
 * - SaaS B2B com usuários simultâneos
 * - Dashboard com auto-refresh
 * - Integração moderada
 *
 * ENTERPRISE (escala):
 * - Sistema empresarial crítico
 * - Microserviços comunicando
 * - Integrações de alto volume
 *
 * ADMIN (sistema):
 * - Jobs internos e cron
 * - Monitoring e health checks
 * - Operações administrativas
 *
 * @interface RateLimitConfig
 * @since 1.0.0
 *
 * @property {UserTier} tier
 * Tier ao qual esta configuração se aplica.
 *
 * @property {Object} limits
 * Limites de rate por janela de tempo.
 *
 * @property {number} limits.perMinute
 * Máximo de requests por minuto (60s deslizante).
 * - Objetivo: Prevenir spam e bursts
 * - Janela: Últimos 60 segundos
 * - Reset: Contínuo (sliding window)
 *
 * @property {number} limits.perHour
 * Máximo de requests por hora (3600s deslizante).
 * - Objetivo: Controlar uso sustentado
 * - Janela: Últimas 3600 segundos
 * - Reset: Contínuo (sliding window)
 *
 * @property {number} limits.perDay
 * Máximo de requests por dia (86400s deslizante).
 * - Objetivo: Quota diária total
 * - Janela: Últimas 86400 segundos
 * - Reset: Contínuo (sliding window)
 *
 * @property {number} [burstAllowance]
 * Requests extras permitidas em burst (opcional).
 * - Permite exceder perMinute temporariamente
 * - Conta para limites de hora/dia
 * - Implementa token bucket algorithm
 *
 * @example
 * // Configuração Free
 * const freeConfig: RateLimitConfig = {
 *   tier: UserTier.FREE,
 *   limits: {
 *     perMinute: 10,
 *     perHour: 100,
 *     perDay: 1000
 *   },
 *   burstAllowance: 5
 * };
 *
 * @example
 * // Uso no rate limiter
 * const config = RATE_LIMIT_CONFIGS[user.tier];
 * if (userRequests.perMinute > config.limits.perMinute) {
 *   throw new RateLimitError();
 * }
 */
export interface RateLimitConfig {
  tier: UserTier;
  limits: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
  burstAllowance?: number;
}

/**
 * ===================================================================
 * CONSTANT: RATE_LIMIT_CONFIGS
 * ===================================================================
 *
 * Mapeamento de configurações de rate limit por tier.
 *
 * **Estrutura:**
 * ```typescript
 * Record<UserTier, RateLimitConfig>
 *
 * // Equivalente a:
 * {
 *   [UserTier.FREE]: RateLimitConfig,
 *   [UserTier.PREMIUM]: RateLimitConfig,
 *   [UserTier.ENTERPRISE]: RateLimitConfig,
 *   [UserTier.ADMIN]: RateLimitConfig
 * }
 * ```
 *
 * **Uso:**
 * ```typescript
 * const config = RATE_LIMIT_CONFIGS[UserTier.PREMIUM];
 * console.log(config.limits.perMinute);  // 60
 * ```
 *
 * **Progressão de Limites:**
 *
 * | Tier | Min | Hora | Dia | Burst | Multiplicador |
 * |------|-----|------|-----|-------|---------------|
 * | Free | 10 | 100 | 1K | 5 | 1x (base) |
 * | Premium | 60 | 1K | 10K | 20 | 6x |
 * | Enterprise | 300 | 10K | 100K | 100 | 30x |
 * | Admin | 1000 | 50K | 1M | 500 | 100x |
 *
 * **Justificativa dos Valores:**
 *
 * FREE (10/min):
 * - Suficiente para testes e desenvolvimento
 * - Baixo o bastante para prevenir abuso
 * - Incentiva upgrade para uso real
 *
 * PREMIUM (60/min):
 * - 1 request/segundo sustentado
 * - Adequado para apps profissionais
 * - Bom equilíbrio custo/benefício
 *
 * ENTERPRISE (300/min):
 * - 5 requests/segundo sustentado
 * - Permite integração enterprise
 * - Suporta alto throughput
 *
 * ADMIN (1000/min):
 * - 16 requests/segundo sustentado
 * - Praticamente ilimitado para ops
 * - Permite jobs pesados
 *
 * **Modificar Limites:**
 *
 * Para ajustar limites:
 * ```typescript
 * // Aumentar limite Premium
 * RATE_LIMIT_CONFIGS[UserTier.PREMIUM].limits.perMinute = 100;
 *
 * // Ou criar novo config
 * const customConfigs = {
 *   ...RATE_LIMIT_CONFIGS,
 *   [UserTier.PREMIUM]: {
 *     ...RATE_LIMIT_CONFIGS[UserTier.PREMIUM],
 *     limits: {
 *       perMinute: 100,
 *       perHour: 2000,
 *       perDay: 20000
 *     }
 *   }
 * };
 * ```
 *
 * **Validação dos Limites:**
 *
 * Garantir consistência matemática:
 * ```typescript
 * function validateLimits(config: RateLimitConfig): boolean {
 *   const { perMinute, perHour, perDay } = config.limits;
 *
 *   // Hora deve ser >= minuto * 60 (com folga)
 *   if (perHour < perMinute * 30) return false;
 *
 *   // Dia deve ser >= hora * 24 (com folga)
 *   if (perDay < perHour * 12) return false;
 *
 *   return true;
 * }
 * ```
 *
 * @constant
 * @type {Record<UserTier, RateLimitConfig>}
 * @readonly
 * @since 1.0.0
 *
 * @example
 * // Buscar config de um tier
 * const premiumConfig = RATE_LIMIT_CONFIGS[UserTier.PREMIUM];
 * console.log(premiumConfig.limits.perMinute);  // 60
 *
 * @example
 * // Iterar todos os tiers
 * Object.entries(RATE_LIMIT_CONFIGS).forEach(([tier, config]) => {
 *   console.log(`${tier}: ${config.limits.perMinute} req/min`);
 * });
 *
 * @example
 * // Validar rate limit
 * const userTier = req.user.tier;
 * const config = RATE_LIMIT_CONFIGS[userTier];
 *
 * if (userRequests > config.limits.perMinute) {
 *   throw new RateLimitError(`Limite excedido: ${config.limits.perMinute} req/min`);
 * }
 */
export const RATE_LIMIT_CONFIGS: Record<UserTier, RateLimitConfig> = {
  [UserTier.FREE]: {
    tier: UserTier.FREE,
    limits: {
      perMinute: 10,
      perHour: 100,
      perDay: 1000
    },
    burstAllowance: 5
  },
  [UserTier.PREMIUM]: {
    tier: UserTier.PREMIUM,
    limits: {
      perMinute: 60,
      perHour: 1000,
      perDay: 10000
    },
    burstAllowance: 20
  },
  [UserTier.ENTERPRISE]: {
    tier: UserTier.ENTERPRISE,
    limits: {
      perMinute: 300,
      perHour: 10000,
      perDay: 100000
    },
    burstAllowance: 100
  },
  [UserTier.ADMIN]: {
    tier: UserTier.ADMIN,
    limits: {
      perMinute: 1000,
      perHour: 50000,
      perDay: 1000000
    },
    burstAllowance: 500
  }
};

/**
 * ===================================================================
 * EXPRESS REQUEST EXTENSIONS
 * ===================================================================
 *
 * Estende o tipo Request do Express para incluir dados de autenticação.
 *
 * **Module Augmentation:**
 *
 * TypeScript permite "augmentar" tipos de bibliotecas externas:
 * ```typescript
 * declare global {
 *   namespace Express {
 *     interface Request {
 *       // Novos campos
 *     }
 *   }
 * }
 * ```
 *
 * **Por Que Global?**
 *
 * Express.Request é um tipo global usado em todo o projeto.
 * Precisamos que TODOS os arquivos vejam os novos campos automaticamente.
 *
 * Sem augmentation:
 * ```typescript
 * // ❌ Erro: Property 'user' does not exist on type 'Request'
 * const userId = req.user.id;
 * ```
 *
 * Com augmentation:
 * ```typescript
 * // ✅ TypeScript sabe sobre req.user
 * const userId = req.user.id;  // Type-safe!
 * ```
 *
 * **Campos Adicionados:**
 *
 * 1. **req.apiKey**: ApiKeyConfig completa
 *    - Populado por: apiKeyAuth middleware
 *    - Contém: Toda configuração da key
 *    - Uso: Quando precisa de metadados extras
 *
 * 2. **req.user**: Dados simplificados do usuário
 *    - Populado por: apiKeyAuth middleware
 *    - Contém: id, name, tier
 *    - Uso: Acesso rápido aos dados essenciais
 *
 * **Fluxo de População:**
 *
 * ```
 * Request
 *   ↓
 * apiKeyAuth middleware
 *   ↓
 * 1. Extrai API Key do header
 * 2. Valida key (ApiKeyService.validateKey)
 * 3. Popula req.apiKey com config completa
 * 4. Popula req.user com dados simplificados
 *   ↓
 * Controller (req.user disponível)
 * ```
 *
 * **Uso em Controllers:**
 *
 * ```typescript
 * router.get('/profile', apiKeyAuth, (req, res) => {
 *   // ✅ TypeScript sabe que req.user pode existir
 *   if (!req.user) {
 *     return res.status(401).json({ error: 'Not authenticated' });
 *   }
 *
 *   // ✅ TypeScript sabe os campos de req.user
 *   const { id, name, tier } = req.user;
 *
 *   res.json({
 *     userId: id,
 *     userName: name,
 *     tier: tier,
 *     limits: RATE_LIMIT_CONFIGS[tier].limits
 *   });
 * });
 * ```
 *
 * **Optional vs Required:**
 *
 * Campos são OPCIONAIS (?) porque:
 * - Nem toda rota usa autenticação
 * - Alguns endpoints são públicos
 * - optionalApiKeyAuth pode não popular
 *
 * ```typescript
 * // Rota sem auth: req.user = undefined
 * router.get('/public', controller);
 *
 * // Rota com auth opcional: req.user pode ou não existir
 * router.get('/hybrid', optionalApiKeyAuth, controller);
 *
 * // Rota com auth obrigatória: req.user sempre existe
 * router.get('/private', apiKeyAuth, controller);
 * // Mas TypeScript não garante isso, então sempre check:
 * if (!req.user) throw new AuthenticationError();
 * ```
 *
 * **Type Guards:**
 *
 * Helper para garantir user existe:
 * ```typescript
 * function requireAuth(req: Request): asserts req is Request & { user: NonNullable<typeof req.user> } {
 *   if (!req.user) {
 *     throw new AuthenticationError();
 *   }
 * }
 *
 * // Uso:
 * router.get('/profile', (req, res) => {
 *   requireAuth(req);
 *   // Aqui TypeScript SABE que req.user existe
 *   const userId = req.user.id;  // Sem ! ou ?
 * });
 * ```
 *
 * @namespace Express
 * @global
 * @since 1.0.0
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Configuração completa da API Key usada na requisição.
       *
       * Populado por: apiKeyAuth ou optionalApiKeyAuth middleware
       *
       * **Quando Usar:**
       * - Precisa de metadados da key (metadata, expiresAt)
       * - Quer auditar uso detalhado
       * - Precisa verificar campos extras
       *
       * **Quando Não Usar:**
       * - Só precisa de id/tier do usuário → use req.user
       *
       * @type {ApiKeyConfig | undefined}
       * @optional
       *
       * @example
       * // Verificar se key expira em breve
       * if (req.apiKey?.expiresAt) {
       *   const daysUntilExpiry = differenceInDays(req.apiKey.expiresAt, new Date());
       *   if (daysUntilExpiry < 7) {
       *     res.setHeader('X-Warning', 'API Key expires soon');
       *   }
       * }
       *
       * @example
       * // Acessar metadata customizada
       * const allowedIPs = req.apiKey?.metadata?.allowedIPs || [];
       * if (!allowedIPs.includes(req.ip)) {
       *   throw new AuthorizationError('IP not allowed');
       * }
       */
      apiKey?: ApiKeyConfig;

      /**
       * Dados simplificados do usuário autenticado.
       *
       * Populado por: apiKeyAuth ou optionalApiKeyAuth middleware
       *
       * **Quando Usar:**
       * - Na maioria dos casos (acesso rápido a id/tier)
       * - Rate limiting
       * - Logs
       * - Business logic
       *
       * **Estrutura:**
       * ```typescript
       * {
       *   id: string;      // User ID único
       *   name: string;    // Nome para exibição
       *   tier: UserTier;  // Tier para rate limiting
       * }
       * ```
       *
       * @type {Object | undefined}
       * @optional
       *
       * @example
       * // Uso típico em controller
       * router.get('/data', apiKeyAuth, (req, res) => {
       *   if (!req.user) {
       *     return res.status(401).json({ error: 'Unauthorized' });
       *   }
       *
       *   const data = await fetchUserData(req.user.id);
       *   res.json({ data, userName: req.user.name });
       * });
       *
       * @example
       * // Rate limiting
       * const config = RATE_LIMIT_CONFIGS[req.user!.tier];
       * if (userRequests > config.limits.perMinute) {
       *   throw new RateLimitError();
       * }
       *
       * @example
       * // Logs
       * log.info('User action', {
       *   userId: req.user.id,
       *   userName: req.user.name,
       *   tier: req.user.tier,
       *   action: 'data_fetch'
       * });
       */
      user?: {
        id: string;
        name: string;
        tier: UserTier;
      };
    }
  }
}