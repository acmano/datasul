// src/shared/services/ApiKeyService.ts

/**
 * @fileoverview Serviço de Gerenciamento de API Keys
 *
 * ===================================================================
 * VISÃO GERAL
 * ===================================================================
 *
 * Serviço centralizado para gerenciar autenticação via API Keys.
 * Implementa CRUD completo de keys, validação, expiração e estatísticas.
 *
 * **Funcionalidades:**
 * - Gerar novas API Keys com prefixo por tier
 * - Validar keys (ativas, não expiradas)
 * - Revogar keys comprometidas
 * - Atualizar tier de usuários
 * - Estatísticas de uso por tier
 *
 * **Estrutura de API Key:**
 * ```
 * [tier]-[random-hex]
 * Exemplo: premium-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 * ```
 *
 * ===================================================================
 * ARQUITETURA E PADRÕES
 * ===================================================================
 *
 * PADRÃO: Singleton Service
 * -------------------------
 * Classe estática que mantém estado em memória.
 * Em produção, deve ser substituído por banco de dados.
 *
 * ATUAL (Desenvolvimento):
 * ```
 * ApiKeyService
 *   ↓
 * Map<string, ApiKeyConfig> (memória)
 *   ↓
 * Perdido ao reiniciar servidor
 * ```
 *
 * PRODUÇÃO (Recomendado):
 * ```
 * ApiKeyService
 *   ↓
 * Database (PostgreSQL/MongoDB)
 *   ↓
 * Persistente, distribuído, auditado
 * ```
 *
 * ===================================================================
 * ESTRUTURA DE DADOS
 * ===================================================================
 *
 * STORAGE INTERNO:
 * ----------------
 * ```typescript
 * private static apiKeys: Map<string, ApiKeyConfig>
 *
 * // Estrutura:
 * Map {
 *   "free-abc123..." => {
 *     key: "free-abc123...",
 *     userId: "user-001",
 *     userName: "John Doe",
 *     tier: "free",
 *     active: true,
 *     createdAt: Date,
 *     expiresAt: Date | undefined
 *   },
 *   "premium-xyz789..." => { ... }
 * }
 * ```
 *
 * POR QUE MAP E NÃO ARRAY?
 * -------------------------
 * - Lookup O(1) vs O(n)
 * - Key como índice natural
 * - Fácil verificar existência
 * - Performance em validação
 *
 * CAMPOS DO ApiKeyConfig:
 * -----------------------
 * - **key**: API Key completa (unique)
 * - **userId**: ID do usuário dono da key
 * - **userName**: Nome para logs/admin
 * - **tier**: free | premium | enterprise | admin
 * - **active**: true = válida, false = revogada
 * - **createdAt**: Timestamp de criação
 * - **expiresAt**: Optional - quando expira
 *
 * ===================================================================
 * SEGURANÇA E MELHORES PRÁTICAS
 * ===================================================================
 *
 * GERAÇÃO SEGURA DE KEYS:
 * -----------------------
 * Usa `crypto.randomBytes(16)` que gera:
 * - 16 bytes = 128 bits de entropia
 * - Hex encoding = 32 caracteres
 * - Total: [tier]-[32 chars] ≈ 40 chars
 *
 * FORÇA CRIPTOGRÁFICA:
 * ```
 * Possibilidades: 16^32 = 340,282,366,920,938,463,463,374,607,431,768,211,456
 * Impossível brute force
 * ```
 *
 * MASCARAMENTO PARA LOGS:
 * -----------------------
 * ```typescript
 * // Original
 * "premium-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 *
 * // Mascarado
 * "prem...o5p6"
 * ```
 *
 * NUNCA LOGUE API KEY COMPLETA:
 * - Logs podem vazar
 * - Logs são persistidos
 * - Logs podem ser acessados por muitos
 *
 * ROTAÇÃO DE KEYS:
 * ----------------
 * Boas práticas de rotação:
 * - **Free**: 30 dias
 * - **Premium**: 90 dias
 * - **Enterprise**: 180 dias
 * - **Admin**: 365 dias
 *
 * Implementar:
 * ```typescript
 * const expiresInDays = tier === 'free' ? 30 : 90;
 * ApiKeyService.generateKey(userId, userName, tier, expiresInDays);
 * ```
 *
 * ===================================================================
 * VALIDAÇÃO E LIFECYCLE
 * ===================================================================
 *
 * FLUXO DE VALIDAÇÃO:
 * -------------------
 * ```
 * Request com API Key
 *   ↓
 * 1. Key existe no Map?
 *   ├─ NÃO → return null (inválida)
 *   └─ SIM → continua
 *   ↓
 * 2. Key está ativa?
 *   ├─ NÃO → return null (revogada)
 *   └─ SIM → continua
 *   ↓
 * 3. Key expirou?
 *   ├─ SIM → return null (expirada)
 *   └─ NÃO → return ApiKeyConfig
 *   ↓
 * Autenticação bem-sucedida
 * ```
 *
 * ESTADOS DE UMA API KEY:
 * -----------------------
 *
 * 1. **CRIADA** (initialize/generateKey)
 *    - active: true
 *    - expiresAt: undefined ou futuro
 *    - Estado: Válida ✅
 *
 * 2. **REVOGADA** (revokeKey)
 *    - active: false
 *    - expiresAt: qualquer
 *    - Estado: Inválida ❌
 *
 * 3. **EXPIRADA** (expiresAt < now)
 *    - active: true
 *    - expiresAt: passado
 *    - Estado: Inválida ❌
 *
 * 4. **REVOGADA + EXPIRADA**
 *    - active: false
 *    - expiresAt: passado
 *    - Estado: Inválida ❌
 *
 * TRANSIÇÕES DE ESTADO:
 * ---------------------
 * ```
 * CRIADA ──revokeKey()──> REVOGADA
 *   │
 *   └──tempo passa──> EXPIRADA
 *
 * REVOGADA ──tempo passa──> REVOGADA + EXPIRADA
 *
 * [Não há volta: uma vez revogada/expirada, permanece assim]
 * ```
 *
 * ===================================================================
 * MIGRAÇÃO PARA PRODUÇÃO
 * ===================================================================
 *
 * LIMITAÇÕES ATUAIS (Memória):
 * ----------------------------
 * ❌ Dados perdidos ao reiniciar
 * ❌ Não funciona em cluster (múltiplos servidores)
 * ❌ Sem auditoria de mudanças
 * ❌ Sem backup automático
 * ❌ Limite de memória
 *
 * MIGRAÇÃO PARA DATABASE:
 * -----------------------
 *
 * **Opção 1: PostgreSQL**
 * ```sql
 * CREATE TABLE api_keys (
 *   key VARCHAR(64) PRIMARY KEY,
 *   user_id VARCHAR(64) NOT NULL,
 *   user_name VARCHAR(255) NOT NULL,
 *   tier VARCHAR(20) NOT NULL,
 *   active BOOLEAN DEFAULT true,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   expires_at TIMESTAMP,
 *   revoked_at TIMESTAMP,
 *   revoked_by VARCHAR(64),
 *   last_used_at TIMESTAMP,
 *
 *   INDEX idx_user_id (user_id),
 *   INDEX idx_tier (tier),
 *   INDEX idx_active (active)
 * );
 * ```
 *
 * **Opção 2: MongoDB**
 * ```javascript
 * {
 *   _id: ObjectId,
 *   key: String (unique, indexed),
 *   userId: String (indexed),
 *   userName: String,
 *   tier: String (indexed),
 *   active: Boolean (indexed),
 *   createdAt: Date,
 *   expiresAt: Date,
 *   revokedAt: Date,
 *   revokedBy: String,
 *   lastUsedAt: Date,
 *   metadata: Object
 * }
 * ```
 *
 * **Opção 3: Redis (Cache + DB)**
 * ```
 * // Cache para validação rápida
 * SET apikey:premium-xyz789 '{"userId":"user-001","tier":"premium"}'
 * EXPIRE apikey:premium-xyz789 3600
 *
 * // Database para persistência
 * PostgreSQL/MongoDB como source of truth
 * ```
 *
 * CÓDIGO DE MIGRAÇÃO:
 * -------------------
 * ```typescript
 * // Antes (memória)
 * static async validateKey(apiKey: string) {
 *   return this.apiKeys.get(apiKey);
 * }
 *
 * // Depois (database)
 * static async validateKey(apiKey: string) {
 *   // 1. Tenta cache
 *   const cached = await redis.get(`apikey:${apiKey}`);
 *   if (cached) return JSON.parse(cached);
 *
 *   // 2. Busca no banco
 *   const keyConfig = await db.query(
 *     'SELECT * FROM api_keys WHERE key = $1 AND active = true',
 *     [apiKey]
 *   );
 *
 *   // 3. Cacheia resultado
 *   if (keyConfig) {
 *     await redis.setex(`apikey:${apiKey}`, 3600, JSON.stringify(keyConfig));
 *   }
 *
 *   return keyConfig;
 * }
 * ```
 *
 * @module shared/services/ApiKeyService
 * @requires crypto
 * @requires @shared/types/apiKey.types
 * @requires @shared/utils/logger
 * @since 1.0.0
 * @see {@link ApiKeyConfig} Para estrutura de dados
 * @see {@link UserTier} Para tiers disponíveis
 */

import crypto from 'crypto';
import { ApiKeyConfig, UserTier } from '@shared/types/apiKey.types';
import { log } from '@shared/utils/logger';

/**
 * ===================================================================
 * CLASSE: ApiKeyService
 * ===================================================================
 *
 * Serviço singleton para gerenciamento de API Keys.
 *
 * **Responsabilidades:**
 * - Gerar keys seguras com crypto.randomBytes
 * - Validar keys (existência, ativo, expiração)
 * - Revogar keys comprometidas
 * - Atualizar tiers de usuários
 * - Fornecer estatísticas de uso
 *
 * **Padrão Singleton:**
 * Todos os métodos são estáticos.
 * Estado mantido em Map estática.
 * Uma única instância de dados.
 *
 * **Thread Safety:**
 * ⚠️ Node.js é single-threaded, mas:
 * - Métodos async podem interleave
 * - Map operations são atômicas
 * - Sem race conditions em operações simples
 * - Para produção: usar transações de DB
 *
 * @class ApiKeyService
 * @static
 * @since 1.0.0
 */
export class ApiKeyService {
  /**
   * Storage em memória de API Keys
   *
   * ⚠️ ATENÇÃO: Dados perdidos ao reiniciar servidor
   * Para produção: substituir por banco de dados
   *
   * @private
   * @static
   * @type {Map<string, ApiKeyConfig>}
   */
  private static apiKeys: Map<string, ApiKeyConfig> = new Map();

  /**
   * ===================================================================
   * MÉTODO: initialize
   * ===================================================================
   *
   * Inicializa API keys de exemplo para desenvolvimento/testes.
   *
   * Cria 4 keys de exemplo, uma para cada tier:
   * - Free: user-001
   * - Premium: user-002
   * - Enterprise: user-003
   * - Admin: admin-001
   *
   * **IMPORTANTE:**
   * Este método é apenas para DESENVOLVIMENTO.
   * Em PRODUÇÃO, API Keys devem vir de banco de dados.
   *
   * **Quando Chamar:**
   * - No startup da aplicação (server.ts)
   * - Antes de qualquer uso de API Keys
   * - Uma única vez por ciclo de vida do servidor
   *
   * **O Que Faz:**
   * 1. Define array de keys de exemplo
   * 2. Adiciona cada key ao Map interno
   * 3. Loga quantas keys foram inicializadas
   * 4. Loga quais tiers estão disponíveis
   *
   * **Keys de Exemplo Criadas:**
   *
   * 1. Free Tier:
   * ```
   * Key: free-demo-key-123456
   * User: user-001 (Demo User Free)
   * Limites: 10/min, 100/hora, 1000/dia
   * ```
   *
   * 2. Premium Tier:
   * ```
   * Key: premium-key-abc123
   * User: user-002 (Premium User)
   * Limites: 60/min, 1000/hora, 10000/dia
   * ```
   *
   * 3. Enterprise Tier:
   * ```
   * Key: enterprise-key-xyz789
   * User: user-003 (Enterprise Corp)
   * Limites: 300/min, 10000/hora, 100000/dia
   * ```
   *
   * 4. Admin Tier:
   * ```
   * Key: admin-key-superuser
   * User: admin-001 (System Admin)
   * Limites: 1000/min, 50000/hora, 1000000/dia
   * Sem rate limit na prática (limites muito altos)
   * ```
   *
   * **Características das Keys de Exemplo:**
   * - Todas ativas (active: true)
   * - Sem expiração (expiresAt: undefined)
   * - CreatedAt: now
   * - Fáceis de lembrar para testes
   *
   * **Logs Gerados:**
   * ```json
   * {
   *   "level": "info",
   *   "message": "API Keys inicializadas",
   *   "count": 4,
   *   "tiers": ["free", "premium", "enterprise", "admin"]
   * }
   * ```
   *
   * **Uso em Testes:**
   * ```bash
   * # Testar como Free
   * curl -H "X-API-Key: free-demo-key-123456" /api/endpoint
   *
   * # Testar como Premium
   * curl -H "X-API-Key: premium-key-abc123" /api/endpoint
   *
   * # Testar como Admin
   * curl -H "X-API-Key: admin-key-superuser" /admin/api-keys
   * ```
   *
   * **Migração para Produção:**
   * Substituir por:
   * ```typescript
   * static async initialize() {
   *   // Carregar do banco de dados
   *   const keys = await db.query('SELECT * FROM api_keys WHERE active = true');
   *
   *   keys.forEach(key => {
   *     this.apiKeys.set(key.key, key);
   *   });
   *
   *   log.info('API Keys carregadas do banco', { count: keys.length });
   * }
   * ```
   *
   * **Segurança:**
   * ⚠️ Keys de exemplo são conhecidas publicamente
   * ⚠️ NUNCA usar em produção
   * ⚠️ Trocar imediatamente ao fazer deploy
   *
   * @static
   * @returns {void}
   * @since 1.0.0
   *
   * @example
   * // No server.ts durante startup
   * ApiKeyService.initialize();
   * log.info('API Key system ready');
   *
   * @example
   * // Verificar se já foi inicializado
   * if (ApiKeyService.getStats().total === 0) {
   *   ApiKeyService.initialize();
   * }
   */
  static initialize(): void {
    // API Keys de exemplo
    const exampleKeys: ApiKeyConfig[] = [
      {
        key: 'free-demo-key-123456',
        userId: 'user-001',
        userName: 'Demo User Free',
        tier: UserTier.FREE,
        active: true,
        createdAt: new Date(),
      },
      {
        key: 'premium-key-abc123',
        userId: 'user-002',
        userName: 'Premium User',
        tier: UserTier.PREMIUM,
        active: true,
        createdAt: new Date(),
      },
      {
        key: 'enterprise-key-xyz789',
        userId: 'user-003',
        userName: 'Enterprise Corp',
        tier: UserTier.ENTERPRISE,
        active: true,
        createdAt: new Date(),
      },
      {
        key: 'admin-key-superuser',
        userId: 'admin-001',
        userName: 'System Admin',
        tier: UserTier.ADMIN,
        active: true,
        createdAt: new Date(),
      },
    ];

    exampleKeys.forEach(key => {
      this.apiKeys.set(key.key, key);
    });

    log.info('API Keys inicializadas', {
      count: this.apiKeys.size,
      tiers: Array.from(new Set(exampleKeys.map(k => k.tier)))
    });
  }

  /**
   * ===================================================================
   * MÉTODO: validateKey
   * ===================================================================
   *
   * Valida uma API Key e retorna sua configuração se válida.
   *
   * **Critérios de Validação:**
   * 1. Key existe no sistema?
   * 2. Key está ativa (não revogada)?
   * 3. Key não expirou?
   *
   * Se TODOS os critérios passarem: retorna ApiKeyConfig
   * Se QUALQUER critério falhar: retorna null
   *
   * **Fluxo Detalhado:**
   *
   * PASSO 1: Verificar Existência
   * ------------------------------
   * ```typescript
   * const keyConfig = this.apiKeys.get(apiKey);
   * if (!keyConfig) {
   *   // Key não existe no sistema
   *   log.warn('API Key inválida');
   *   return null;
   * }
   * ```
   *
   * PASSO 2: Verificar Se Está Ativa
   * ---------------------------------
   * ```typescript
   * if (!keyConfig.active) {
   *   // Key foi revogada
   *   log.warn('API Key inativa');
   *   return null;
   * }
   * ```
   *
   * PASSO 3: Verificar Expiração
   * -----------------------------
   * ```typescript
   * if (keyConfig.expiresAt && keyConfig.expiresAt < new Date()) {
   *   // Key expirou
   *   log.warn('API Key expirada');
   *   return null;
   * }
   * ```
   *
   * PASSO 4: Retornar Configuração
   * -------------------------------
   * ```typescript
   * return keyConfig; // Todos os checks passaram
   * ```
   *
   * **Logs Gerados:**
   *
   * 1. Key Inválida (não existe):
   * ```json
   * {
   *   "level": "warn",
   *   "message": "API Key inválida",
   *   "apiKey": "free...6789"
   * }
   * ```
   *
   * 2. Key Inativa (revogada):
   * ```json
   * {
   *   "level": "warn",
   *   "message": "API Key inativa",
   *   "apiKey": "prem...c123",
   *   "userId": "user-002"
   * }
   * ```
   *
   * 3. Key Expirada:
   * ```json
   * {
   *   "level": "warn",
   *   "message": "API Key expirada",
   *   "apiKey": "ente...z789",
   *   "userId": "user-003",
   *   "expiresAt": "2025-10-01T00:00:00.000Z"
   * }
   * ```
   *
   * **Performance:**
   * - Map.get(): O(1) - muito rápido
   * - Date comparison: O(1)
   * - Total: < 1ms tipicamente
   *
   * **Uso no Middleware:**
   * ```typescript
   * export async function apiKeyAuth(req, res, next) {
   *   const apiKey = extractApiKey(req);
   *   const keyConfig = await ApiKeyService.validateKey(apiKey);
   *
   *   if (!keyConfig) {
   *     throw new AuthenticationError('API Key inválida');
   *   }
   *
   *   req.user = {
   *     id: keyConfig.userId,
   *     tier: keyConfig.tier,
   *     name: keyConfig.userName
   *   };
   *
   *   next();
   * }
   * ```
   *
   * **Casos de Teste:**
   * ```typescript
   * // Caso 1: Key válida
   * const valid = await ApiKeyService.validateKey('premium-key-abc123');
   * // valid !== null, valid.tier === 'premium'
   *
   * // Caso 2: Key inexistente
   * const invalid = await ApiKeyService.validateKey('fake-key-000');
   * // invalid === null
   *
   * // Caso 3: Key revogada
   * await ApiKeyService.revokeKey('premium-key-abc123');
   * const revoked = await ApiKeyService.validateKey('premium-key-abc123');
   * // revoked === null
   *
   * // Caso 4: Key expirada
   * const expired = await ApiKeyService.validateKey('old-key-expired');
   * // expired === null (se expiresAt < now)
   * ```
   *
   * **Segurança:**
   * - API Key completa NUNCA aparece nos logs (maskKey)
   * - Validação fail-safe (qualquer dúvida = inválida)
   * - Logs para auditoria de tentativas inválidas
   *
   * **Produção com Database:**
   * ```typescript
   * static async validateKey(apiKey: string) {
   *   // 1. Cache check (Redis)
   *   const cached = await redis.get(`apikey:${apiKey}`);
   *   if (cached) return JSON.parse(cached);
   *
   *   // 2. Database query
   *   const keyConfig = await db.queryOne(
   *     `SELECT * FROM api_keys
   *      WHERE key = $1
   *      AND active = true
   *      AND (expires_at IS NULL OR expires_at > NOW())`,
   *     [apiKey]
   *   );
   *
   *   // 3. Cache valid keys
   *   if (keyConfig) {
   *     await redis.setex(`apikey:${apiKey}`, 3600, JSON.stringify(keyConfig));
   *   }
   *
   *   // 4. Update last_used_at
   *   if (keyConfig) {
   *     db.query('UPDATE api_keys SET last_used_at = NOW() WHERE key = $1', [apiKey]);
   *   }
   *
   *   return keyConfig;
   * }
   * ```
   *
   * @static
   * @async
   * @param {string} apiKey - API Key a ser validada
   * @returns {Promise<ApiKeyConfig | null>} Configuração da key se válida, null se inválida
   * @since 1.0.0
   *
   * @example
   * // Validação simples
   * const keyConfig = await ApiKeyService.validateKey('premium-key-abc123');
   * if (keyConfig) {
   *   console.log(`Usuário: ${keyConfig.userName}, Tier: ${keyConfig.tier}`);
   * }
   *
   * @example
   * // Uso com autenticação
   * const apiKey = req.headers['x-api-key'];
   * const keyConfig = await ApiKeyService.validateKey(apiKey);
   * if (!keyConfig) {
   *   return res.status(401).json({ error: 'Unauthorized' });
   * }
   */
  static async validateKey(apiKey: string): Promise<ApiKeyConfig | null> {
    const keyConfig = this.apiKeys.get(apiKey);

    if (!keyConfig) {
      log.warn('API Key inválida', { apiKey: this.maskKey(apiKey) });
      return null;
    }

    if (!keyConfig.active) {
      log.warn('API Key inativa', {
        apiKey: this.maskKey(apiKey),
        userId: keyConfig.userId
      });
      return null;
    }

    // Verificar expiração
    if (keyConfig.expiresAt && keyConfig.expiresAt < new Date()) {
      log.warn('API Key expirada', {
        apiKey: this.maskKey(apiKey),
        userId: keyConfig.userId,
        expiresAt: keyConfig.expiresAt
      });
      return null;
    }

    return keyConfig;
  }

  /**
   * ===================================================================
   * MÉTODO: generateKey
   * ===================================================================
   *
   * Gera uma nova API Key segura para um usuário.
   *
   * **Formato da Key:**
   * ```
   * [tier]-[32-char-hex]
   *
   * Exemplos:
   * free-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   * premium-x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2
   * ```
   *
   * **Algoritmo de Geração:**
   *
   * 1. **Prefix baseado em tier**
   *    ```typescript
   *    const prefix = tier.toLowerCase();
   *    // 'FREE' → 'free'
   *    // 'PREMIUM' → 'premium'
   *    ```
   *
   * 2. **Random bytes criptograficamente seguro**
   *    ```typescript
   *    const randomPart = crypto.randomBytes(16).toString('hex');
   *    // 16 bytes = 128 bits
   *    // hex = 32 caracteres
   *    ```
   *
   * 3. **Combinar prefix + random**
   *    ```typescript
   *    const apiKey = `${prefix}-${randomPart}`;
   *    // 'premium-a1b2c3d4...'
   *    ```
   *
   * 4. **Calcular expiração (opcional)**
   *    ```typescript
   *    const expiresAt = expiresInDays
   *      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
   *      : undefined;
   *    ```
   *
   * 5. **Criar config e salvar**
   *    ```typescript
   *    const keyConfig: ApiKeyConfig = {
   *      key: apiKey,
   *      userId,
   *      userName,
   *      tier,
   *      active: true,
   *      createdAt: new Date(),
   *      expiresAt
   *    };
   *    this.apiKeys.set(apiKey, keyConfig);
   *    ```
   *
   * **Entropia e Segurança:**
   *
   * crypto.randomBytes(16):
   * - 16 bytes = 128 bits de entropia
   * - 2^128 = 340,282,366,920,938,463,463,374,607,431,768,211,456 possibilidades
   * - Impossível brute force (universo tem ~10^80 átomos)
   * - CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)
   *
   * Colisão:
   * - Probabilidade de colisão: ~0% (até bilhões de keys)
   * - Birthday paradox: precisa ~2^64 keys para 50% de colisão
   * - Na prática: impossível colidir
   *
   * **Expiração:**
   *
   * Sem expiração (expiresInDays = undefined):
   * ```typescript
   * const key = await generateKey('user-001', 'John', UserTier.PREMIUM);
   * // expiresAt: undefined
   * // Key válida para sempre (até ser revogada)
   * ```
   *
   * Com expiração (30 dias):
   * ```typescript
   * const key = await generateKey('user-001', 'John', UserTier.PREMIUM, 30);
   * // expiresAt: now + 30 days
   * // Key expira automaticamente em 30 dias
   * ```
   *
   * Cálculo de expiração:
   * ```
   * agora = Date.now()  // 1696599600000 (ms desde 1970)
   * dias = 30
   * ms_por_dia = 24 * 60 * 60 * 1000 = 86400000
   * expira = agora + (dias * ms_por_dia)
   * ```
   *
   * **Logs Gerados:**
   * ```json
   * {
   *   "level": "info",
   *   "message": "API Key gerada",
   *   "userId": "user-001",
   *   "tier": "premium",
   *   "expiresAt": "2025-11-05T10:30:00.000Z",
   *   "apiKey": "prem...o5p6"
   * }
   * ```
   *
   * **Uso em Admin Routes:**
   * ```typescript
   * router.post('/admin/api-keys/generate', async (req, res) => {
   *   const { userId, userName, tier, expiresInDays } = req.body;
   *
   *   const apiKey = await ApiKeyService.generateKey(
   *     userId,
   *     userName,
   *     tier,
   *     expiresInDays
   *   );
   *
   *   res.json({
   *     success: true,
   *     apiKey,
   *     message: 'Key gerada com sucesso'
   *   });
   * });
   * ```
   *
   * **Casos de Uso:**
   *
   * 1. Novo usuário Free:
   * ```typescript
   * const key = await ApiKeyService.generateKey(
   *   'user-123',
   *   'John Doe',
   *   UserTier.FREE,
   *   30  // Expira em 30 dias
   * );
   * ```
   *
   * 2. Upgrade para Premium (key permanente):
   * ```typescript
   * const key = await ApiKeyService.generateKey(
   *   'user-123',
   *   'John Doe',
   *   UserTier.PREMIUM
   *   // Sem expiresInDays = permanente
   * );
   * ```
   *
 * 3. Key temporária para teste:
   * ```typescript
   * const key = await ApiKeyService.generateKey(
   *   'test-user',
   *   'Test Account',
   *   UserTier.PREMIUM,
   *   7  // 7 dias de trial
   * );
   * ```
   *
   * **Migração para Produção:**
   * ```typescript
   * static async generateKey(...) {
   *   // Gerar key (mesmo algoritmo)
   *   const apiKey = `${tier.toLowerCase()}-${crypto.randomBytes(16).toString('hex')}`;
   *
   *   // Salvar no banco
   *   await db.query(
   *     `INSERT INTO api_keys (key, user_id, user_name, tier, expires_at)
   *      VALUES ($1, $2, $3, $4, $5)`,
   *     [apiKey, userId, userName, tier, expiresAt]
   *   );
   *
   *   // Invalidar cache
   *   await redis.del(`user:${userId}:keys`);
   *
   *   // Enviar email ao usuário
   *   await emailService.sendApiKeyGenerated(userId, apiKey);
   *
   *   return apiKey;
   * }
   * ```
   *
   * **Segurança:**
   * - SEMPRE retornar key completa ao usuário (só neste momento)
   * - NUNCA enviar key por email não criptografado
   * - SEMPRE logar masked key
   * - Considerar hashear keys no banco (bcrypt/argon2)
   *
   * @static
   * @async
   * @param {string} userId - ID único do usuário
   * @param {string} userName - Nome do usuário (para logs/admin)
   * @param {UserTier} [tier=UserTier.FREE] - Tier da API Key
   * @param {number} [expiresInDays] - Dias até expirar (opcional)
   * @returns {Promise<string>} API Key gerada
   * @since 1.0.0
   *
   * @example
   * // Gerar key free permanente
   * const key = await ApiKeyService.generateKey(
   *   'user-001',
   *   'John Doe',
   *   UserTier.FREE
   * );
   * console.log(key); // 'free-a1b2c3d4e5f6g7h8...'
   *
   * @example
   * // Gerar key premium com expiração
   * const key = await ApiKeyService.generateKey(
   *   'user-002',
   *   'Jane Smith',
   *   UserTier.PREMIUM,
   *   90  // Expira em 90 dias
   * );
   */
  static async generateKey(
    userId: string,
    userName: string,
    tier: UserTier = UserTier.FREE,
    expiresInDays?: number
  ): Promise<string> {
    const prefix = tier.toLowerCase();
    const randomPart = crypto.randomBytes(16).toString('hex');
    const apiKey = `${prefix}-${randomPart}`;

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const keyConfig: ApiKeyConfig = {
      key: apiKey,
      userId,
      userName,
      tier,
      active: true,
      createdAt: new Date(),
      expiresAt,
    };

    this.apiKeys.set(apiKey, keyConfig);

    log.info('API Key gerada', {
      userId,
      tier,
      expiresAt,
      apiKey: this.maskKey(apiKey)
    });

    return apiKey;
  }

  /**
   * Revoga uma API Key
   */
  static async revokeKey(apiKey: string): Promise<boolean> {
    const keyConfig = this.apiKeys.get(apiKey);

    if (!keyConfig) {
      return false;
    }

    keyConfig.active = false;

    log.info('API Key revogada', {
      userId: keyConfig.userId,
      apiKey: this.maskKey(apiKey)
    });

    return true;
  }

  /**
   * Lista API Keys de um usuário
   */
  static async getUserKeys(userId: string): Promise<ApiKeyConfig[]> {
    return Array.from(this.apiKeys.values())
      .filter(key => key.userId === userId);
  }

  /**
   * Atualiza tier de um usuário
   */
  static async updateUserTier(userId: string, newTier: UserTier): Promise<void> {
    const userKeys = await this.getUserKeys(userId);

    userKeys.forEach(keyConfig => {
      keyConfig.tier = newTier;
    });

    log.info('Tier do usuário atualizado', {
      userId,
      newTier,
      keysUpdated: userKeys.length
    });
  }

  /**
   * Mascara API Key para logs
   */
  private static maskKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '***';
    }
    return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  }

  /**
   * Retorna estatísticas de API Keys
   */
  static getStats(): any {
    const keys = Array.from(this.apiKeys.values());

    return {
      total: keys.length,
      active: keys.filter(k => k.active).length,
      inactive: keys.filter(k => !k.active).length,
      byTier: {
        free: keys.filter(k => k.tier === UserTier.FREE).length,
        premium: keys.filter(k => k.tier === UserTier.PREMIUM).length,
        enterprise: keys.filter(k => k.tier === UserTier.ENTERPRISE).length,
        admin: keys.filter(k => k.tier === UserTier.ADMIN).length,
      }
    };
  }
}