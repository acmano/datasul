// src/shared/utils/UserRateLimiter.ts

import { UserTier, RATE_LIMIT_CONFIGS } from '@shared/types/apiKey.types';
import { log } from './logger';

/**
 * ========================================
 * TIPOS E INTERFACES
 * ========================================
 */

/**
 * Record de rate limit por usuário
 *
 * PROPÓSITO:
 * Armazena contadores e timestamps de reset para cada janela de tempo
 *
 * ESTRUTURA:
 * - userId: Identificador único do usuário
 * - tier: Tier do usuário (define limites)
 * - minute/hour/day: Contadores por janela de tempo
 */
interface RateLimitRecord {
  /**
   * ID único do usuário
   */
  userId: string;

  /**
   * Tier do usuário (FREE, PREMIUM, ENTERPRISE, ADMIN)
   */
  tier: UserTier;

  /**
   * Janela de 1 minuto
   */
  minute: {
    /**
     * Número de requisições nesta janela
     */
    count: number;

    /**
     * Timestamp quando esta janela reseta (ms)
     */
    resetAt: number;
  };

  /**
   * Janela de 1 hora
   */
  hour: {
    count: number;
    resetAt: number;
  };

  /**
   * Janela de 1 dia
   */
  day: {
    count: number;
    resetAt: number;
  };
}

/**
 * Resultado da verificação de rate limit
 *
 * PROPÓSITO:
 * Informa se requisição é permitida e quando o limite reseta
 */
export interface RateLimitResult {
  /**
   * Se requisição é permitida
   *
   * - true: Dentro do limite, pode prosseguir
   * - false: Limite excedido, bloquear
   */
  allowed: boolean;

  /**
   * Limite total para esta janela
   *
   * EXEMPLO:
   * - FREE tier, minuto: 10
   * - PREMIUM tier, hora: 1000
   */
  limit: number;

  /**
   * Requisições restantes nesta janela
   *
   * CÁLCULO:
   * remaining = limit - current_count
   *
   * EXEMPLO:
   * - Limite: 100
   * - Usadas: 75
   * - Restantes: 25
   */
  remaining: number;

  /**
   * Timestamp quando limite reseta (ms)
   *
   * FORMATO:
   * Milissegundos desde epoch (Date.now())
   *
   * CONVERSÃO:
   * new Date(resetAt).toISOString()
   */
  resetAt: number;

  /**
   * Segundos até próxima tentativa (opcional)
   *
   * QUANDO PRESENTE:
   * - Apenas quando allowed = false
   * - Usado no header Retry-After
   *
   * CÁLCULO:
   * retryAfter = Math.ceil((resetAt - now) / 1000)
   *
   * @optional
   */
  retryAfter?: number;
}

/**
 * ========================================
 * CLASSE PRINCIPAL
 * ========================================
 */

/**
 * Rate Limiter por usuário com múltiplas janelas de tempo
 *
 * PROPÓSITO:
 * Controlar número de requisições por usuário usando sliding window
 * com três janelas simultâneas: minuto, hora e dia.
 *
 * ARQUITETURA:
 * - Singleton: Mesma instância compartilhada globalmente
 * - In-Memory: Records armazenados em Map (volátil)
 * - Multi-Window: Verifica 3 janelas simultaneamente
 * - Tier-Based: Limites diferentes por tier de usuário
 *
 * JANELAS DE TEMPO:
 * 1. MINUTO: Protege contra burst attacks
 * 2. HORA: Limita uso sustentado
 * 3. DIA: Controle de quota diária
 *
 * ALGORITMO SLIDING WINDOW:
 * - Cada janela tem contador e timestamp de reset
 * - Janelas resetam automaticamente após expiração
 * - Requisição bloqueada se QUALQUER janela exceder limite
 * - Retorna janela mais restritiva quando bloqueado
 *
 * TIERS E LIMITES:
 * - FREE: 10/min, 100/hora, 1k/dia
 * - PREMIUM: 60/min, 1k/hora, 10k/dia
 * - ENTERPRISE: 300/min, 10k/hora, 100k/dia
 * - ADMIN: 1k/min, 50k/hora, 1M/dia
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Verificar rate limit
 * const result = UserRateLimiter.check('user-123', UserTier.FREE);
 *
 * if (result.allowed) {
 *   // Processar requisição
 *   console.log(`Remaining: ${result.remaining}`);
 * } else {
 *   // Bloquear requisição
 *   console.log(`Retry after: ${result.retryAfter}s`);
 *   throw new RateLimitError(result.retryAfter);
 * }
 * ```
 *
 * FLUXO DE VERIFICAÇÃO:
 * ```
 * 1. Busca ou cria record do usuário
 * 2. Reseta janelas expiradas
 * 3. Verifica cada janela (minuto, hora, dia)
 * 4. Se alguma excedida: retorna false + retry info
 * 5. Se todas OK: incrementa contadores + retorna true
 * ```
 *
 * PONTOS CRÍTICOS:
 * - Records em memória (perdem dados em restart)
 * - Não sincronizado entre instâncias (usar Redis para distribuído)
 * - Cleanup automático a cada hora
 * - Estatísticas resetam com o processo
 *
 * @see apiKey.types.ts - Definição de tiers e limites
 * @see userRateLimit.middleware.ts - Middleware que usa esta classe
 */
export class UserRateLimiter {
  /**
   * Armazenamento in-memory dos records de rate limit
   *
   * ESTRUTURA:
   * Map<userId, RateLimitRecord>
   *
   * PONTOS CRÍTICOS:
   * - Volátil: Perde dados em restart
   * - Por instância: Cada servidor tem sua própria Map
   * - Crescimento: Pode crescer infinitamente (cleanup necessário)
   */
  private static records: Map<string, RateLimitRecord> = new Map();

  /**
   * ========================================
   * MÉTODO PRINCIPAL - CHECK
   * ========================================
   */

  /**
   * Verifica se a requisição está dentro do rate limit
   *
   * PROPÓSITO:
   * Determina se usuário pode fazer mais uma requisição
   *
   * ALGORITMO:
   * 1. Busca ou cria record do usuário
   * 2. Reseta janelas expiradas (se necessário)
   * 3. Verifica janela de minuto
   * 4. Verifica janela de hora
   * 5. Verifica janela de dia
   * 6. Se alguma excedida: retorna false com retry info
   * 7. Se todas OK: incrementa contadores e retorna true
   *
   * EXEMPLO DE USO:
   * ```typescript
   * // Usuário FREE fazendo requisição
   * const result = UserRateLimiter.check('user-123', UserTier.FREE);
   *
   * // Primeira requisição
   * // result = { allowed: true, limit: 10, remaining: 9, resetAt: ... }
   *
   * // Após 10 requisições em 1 minuto
   * // result = { allowed: false, limit: 10, remaining: 0, resetAt: ..., retryAfter: 45 }
   * ```
   *
   * RETORNO QUANDO ALLOWED = TRUE:
   * ```typescript
   * {
   *   allowed: true,
   *   limit: 10,        // Limite da janela mais próxima
   *   remaining: 5,     // Requisições restantes
   *   resetAt: 1704384000000
   * }
   * ```
   *
   * RETORNO QUANDO ALLOWED = FALSE:
   * ```typescript
   * {
   *   allowed: false,
   *   limit: 10,
   *   remaining: 0,
   *   resetAt: 1704384000000,
   *   retryAfter: 45    // Segundos até poder tentar novamente
   * }
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Método estático (acesso direto sem instância)
   * - Thread-safe em Node.js (single-threaded)
   * - Incrementa contadores apenas se allowed = true
   * - Log de warning quando limite excedido
   *
   * @param userId - ID único do usuário
   * @param tier - Tier do usuário (define limites)
   * @returns Objeto com resultado da verificação
   */
  static check(userId: string, tier: UserTier): RateLimitResult {
    const config = RATE_LIMIT_CONFIGS[tier];
    const now = Date.now();

    // ========================================
    // 1. BUSCAR OU CRIAR RECORD
    // ========================================
    let record = this.records.get(userId);
    if (!record) {
      record = this.createRecord(userId, tier);
      this.records.set(userId, record);
    }

    // ========================================
    // 2. RESETAR JANELAS EXPIRADAS
    // ========================================
    this.resetIfNeeded(record, now);

    // ========================================
    // 3. VERIFICAR JANELA DE MINUTO
    // ========================================
    const minuteCheck = this.checkWindow(
      record.minute,
      config.limits.perMinute,
      60 * 1000,
      now
    );

    // ========================================
    // 4. VERIFICAR JANELA DE HORA
    // ========================================
    const hourCheck = this.checkWindow(
      record.hour,
      config.limits.perHour,
      60 * 60 * 1000,
      now
    );

    // ========================================
    // 5. VERIFICAR JANELA DE DIA
    // ========================================
    const dayCheck = this.checkWindow(
      record.day,
      config.limits.perDay,
      24 * 60 * 60 * 1000,
      now
    );

    // ========================================
    // 6. SE ALGUM LIMITE EXCEDIDO
    // ========================================
    if (!minuteCheck.allowed || !hourCheck.allowed || !dayCheck.allowed) {
      // Retorna o limite mais restritivo (menor tempo até reset)
      const mostRestrictive = [minuteCheck, hourCheck, dayCheck]
        .filter((c) => !c.allowed)
        .sort((a, b) => a.resetAt - b.resetAt)[0];

      log.warn('Rate limit excedido', {
        userId,
        tier,
        limit: mostRestrictive.limit,
        resetAt: new Date(mostRestrictive.resetAt),
      });

      return mostRestrictive;
    }

    // ========================================
    // 7. INCREMENTAR CONTADORES
    // ========================================
    record.minute.count++;
    record.hour.count++;
    record.day.count++;

    // ========================================
    // 8. RETORNAR LIMITE MAIS PRÓXIMO
    // ========================================
    // Retorna a janela mais próxima de atingir o limite
    const closest = [minuteCheck, hourCheck, dayCheck].sort(
      (a, b) => a.remaining - b.remaining
    )[0];

    return closest;
  }

  /**
   * ========================================
   * MÉTODOS AUXILIARES - VERIFICAÇÃO
   * ========================================
   */

  /**
   * Verifica uma janela de tempo específica
   *
   * PROPÓSITO:
   * Determina se contador está dentro do limite para esta janela
   *
   * ALGORITMO:
   * 1. Compara count com limit
   * 2. Calcula remaining = limit - count
   * 3. Calcula retryAfter se excedido
   * 4. Retorna resultado estruturado
   *
   * EXEMPLO:
   * ```typescript
   * // Janela com 7 de 10 usadas
   * checkWindow(
   *   { count: 7, resetAt: 1704384060000 },
   *   10,
   *   60000,
   *   1704384000000
   * )
   * // Retorna:
   * {
   *   allowed: true,
   *   limit: 10,
   *   remaining: 3,
   *   resetAt: 1704384060000
   * }
   *
   * // Janela excedida (10 de 10)
   * checkWindow(
   *   { count: 10, resetAt: 1704384060000 },
   *   10,
   *   60000,
   *   1704384000000
   * )
   * // Retorna:
   * {
   *   allowed: false,
   *   limit: 10,
   *   remaining: 0,
   *   resetAt: 1704384060000,
   *   retryAfter: 60
   * }
   * ```
   *
   * @param window - Janela com contador e resetAt
   * @param limit - Limite máximo para esta janela
   * @param duration - Duração da janela em ms (não usado, mas mantido para compatibilidade)
   * @param now - Timestamp atual em ms
   * @returns Resultado da verificação desta janela
   */
  private static checkWindow(
    window: { count: number; resetAt: number },
    limit: number,
    duration: number,
    now: number
  ): RateLimitResult {
    const allowed = window.count < limit;
    const remaining = Math.max(0, limit - window.count);
    const retryAfter =
      allowed ? undefined : Math.ceil((window.resetAt - now) / 1000);

    return {
      allowed,
      limit,
      remaining,
      resetAt: window.resetAt,
      retryAfter,
    };
  }

  /**
   * ========================================
   * MÉTODOS AUXILIARES - GESTÃO DE RECORDS
   * ========================================
   */

  /**
   * Cria novo record para usuário
   *
   * PROPÓSITO:
   * Inicializa estrutura de dados para novo usuário
   *
   * COMPORTAMENTO:
   * - Cria janelas com count = 0
   * - Define resetAt para cada janela
   * - Minuto: now + 60s
   * - Hora: now + 3600s
   * - Dia: now + 86400s
   *
   * EXEMPLO:
   * ```typescript
   * // Criar record para usuário FREE
   * const record = createRecord('user-123', UserTier.FREE);
   *
   * // Estrutura criada:
   * {
   *   userId: 'user-123',
   *   tier: 'free',
   *   minute: { count: 0, resetAt: now + 60000 },
   *   hour: { count: 0, resetAt: now + 3600000 },
   *   day: { count: 0, resetAt: now + 86400000 }
   * }
   * ```
   *
   * @param userId - ID do usuário
   * @param tier - Tier do usuário
   * @returns Novo record inicializado
   */
  private static createRecord(
    userId: string,
    tier: UserTier
  ): RateLimitRecord {
    const now = Date.now();

    return {
      userId,
      tier,
      minute: { count: 0, resetAt: now + 60 * 1000 },
      hour: { count: 0, resetAt: now + 60 * 60 * 1000 },
      day: { count: 0, resetAt: now + 24 * 60 * 60 * 1000 },
    };
  }

  /**
   * Reseta contadores se janela expirou
   *
   * PROPÓSITO:
   * Verifica e reseta janelas que expiraram
   *
   * ALGORITMO:
   * Para cada janela (minuto, hora, dia):
   * 1. Se now >= resetAt: janela expirou
   * 2. Zera contador
   * 3. Calcula novo resetAt
   *
   * EXEMPLO:
   * ```typescript
   * // Antes (janela de minuto expirada)
   * record.minute = { count: 10, resetAt: 1704384000000 }
   * now = 1704384065000
   *
   * resetIfNeeded(record, now)
   *
   * // Depois
   * record.minute = { count: 0, resetAt: 1704384125000 }
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Reseta apenas janelas expiradas
   * - Preserva janelas ainda válidas
   * - Novo resetAt = now + duração da janela
   * - Operação in-place (modifica record)
   *
   * @param record - Record a verificar/resetar
   * @param now - Timestamp atual em ms
   */
  private static resetIfNeeded(record: RateLimitRecord, now: number): void {
    // Resetar janela de minuto se expirou
    if (now >= record.minute.resetAt) {
      record.minute.count = 0;
      record.minute.resetAt = now + 60 * 1000;
    }

    // Resetar janela de hora se expirou
    if (now >= record.hour.resetAt) {
      record.hour.count = 0;
      record.hour.resetAt = now + 60 * 60 * 1000;
    }

    // Resetar janela de dia se expirou
    if (now >= record.day.resetAt) {
      record.day.count = 0;
      record.day.resetAt = now + 24 * 60 * 60 * 1000;
    }
  }

  /**
   * ========================================
   * MÉTODOS DE MANUTENÇÃO
   * ========================================
   */

  /**
   * Limpa records antigos (garbage collection)
   *
   * PROPÓSITO:
   * Remove records inativos para evitar memory leak
   *
   * ALGORITMO:
   * 1. Itera todos records
   * 2. Se janela de dia expirou há mais de 24h: remove
   * 3. Loga quantidade de records restantes
   *
   * CRITÉRIO DE REMOÇÃO:
   * Record é removido se:
   * - day.resetAt + 24h < now
   * - Ou seja: sem atividade há mais de 48h
   *
   * EXEMPLO:
   * ```typescript
   * // Record com última atividade há 3 dias
   * record.day.resetAt = now - (3 * 24 * 60 * 60 * 1000)
   *
   * cleanup()
   * // Record removido
   *
   * // Record com atividade recente
   * record.day.resetAt = now + (12 * 60 * 60 * 1000)
   *
   * cleanup()
   * // Record preservado
   * ```
   *
   * QUANDO EXECUTADO:
   * - Automaticamente a cada 1 hora (setInterval no final do arquivo)
   * - Manualmente via admin endpoints
   *
   * PONTOS CRÍTICOS:
   * - Operação O(n) onde n = número de records
   * - Pode ser lento com milhões de usuários
   * - Não usar em hot path
   * - Para produção: considerar TTL no Redis
   */
  static cleanup(): void {
    const now = Date.now();
    const threshold = 24 * 60 * 60 * 1000; // 24 horas

    for (const [userId, record] of this.records.entries()) {
      if (now > record.day.resetAt + threshold) {
        this.records.delete(userId);
      }
    }

    log.debug('Rate limiter cleanup', {
      recordsRemaining: this.records.size,
    });
  }

  /**
   * ========================================
   * MÉTODOS DE ESTATÍSTICAS
   * ========================================
   */

  /**
   * Retorna estatísticas de uso
   *
   * PROPÓSITO:
   * Fornecer insights sobre uso do rate limiter
   *
   * COMPORTAMENTO:
   * - Se userId fornecido: estatísticas do usuário específico
   * - Se não: estatísticas gerais (total e por tier)
   *
   * EXEMPLO ESPECÍFICO (COM userId):
   * ```typescript
   * const stats = UserRateLimiter.getStats('user-123');
   *
   * // Retorna:
   * {
   *   userId: 'user-123',
   *   tier: 'premium',
   *   usage: {
   *     minute: {
   *       current: 45,
   *       limit: 60,
   *       remaining: 15,
   *       resetAt: Date(...)
   *     },
   *     hour: { ... },
   *     day: { ... }
   *   }
   * }
   * ```
   *
   * EXEMPLO GERAL (SEM userId):
   * ```typescript
   * const stats = UserRateLimiter.getStats();
   *
   * // Retorna:
   * {
   *   totalUsers: 150,
   *   byTier: {
   *     free: 100,
   *     premium: 40,
   *     enterprise: 8,
   *     admin: 2
   *   }
   * }
   * ```
   *
   * CASOS DE USO:
   * - Admin dashboard
   * - Monitoramento
   * - Debug de rate limit
   * - Analytics de uso
   *
   * @param userId - ID do usuário (opcional)
   * @returns Estatísticas do usuário ou gerais
   */
  static getStats(userId?: string): any {
    if (userId) {
      const record = this.records.get(userId);
      if (!record) return null;

      const config = RATE_LIMIT_CONFIGS[record.tier];

      return {
        userId: record.userId,
        tier: record.tier,
        usage: {
          minute: {
            current: record.minute.count,
            limit: config.limits.perMinute,
            remaining: config.limits.perMinute - record.minute.count,
            resetAt: new Date(record.minute.resetAt),
          },
          hour: {
            current: record.hour.count,
            limit: config.limits.perHour,
            remaining: config.limits.perHour - record.hour.count,
            resetAt: new Date(record.hour.resetAt),
          },
          day: {
            current: record.day.count,
            limit: config.limits.perDay,
            remaining: config.limits.perDay - record.day.count,
            resetAt: new Date(record.day.resetAt),
          },
        },
      };
    }

    // Estatísticas gerais
    return {
      totalUsers: this.records.size,
      byTier: {
        free: Array.from(this.records.values()).filter(
          (r) => r.tier === UserTier.FREE
        ).length,
        premium: Array.from(this.records.values()).filter(
          (r) => r.tier === UserTier.PREMIUM
        ).length,
        enterprise: Array.from(this.records.values()).filter(
          (r) => r.tier === UserTier.ENTERPRISE
        ).length,
        admin: Array.from(this.records.values()).filter(
          (r) => r.tier === UserTier.ADMIN
        ).length,
      },
    };
  }

  /**
   * ========================================
   * MÉTODOS ADMINISTRATIVOS
   * ========================================
   */

  /**
   * Reseta limites de um usuário (admin)
   *
   * PROPÓSITO:
   * Permite admin resetar manualmente rate limit de usuário
   *
   * COMPORTAMENTO:
   * - Remove record do usuário
   * - Próxima requisição criará novo record limpo
   *
   * CASOS DE USO:
   * - Resolver bloqueio acidental
   * - Suporte ao cliente
   * - Testes
   * - Emergências
   *
   * EXEMPLO:
   * ```typescript
   * // Usuário bloqueado por engano
   * UserRateLimiter.resetUser('user-123');
   *
   * // Próxima requisição do usuário terá contadores zerados
   * const result = UserRateLimiter.check('user-123', tier);
   * // result.remaining = limit (contadores resetados)
   * ```
   *
   * PONTOS CRÍTICOS:
   * - Operação administrativa (requer autenticação)
   * - Não deve ser exposta publicamente
   * - Apenas para tier ADMIN
   * - Loga operação para auditoria
   *
   * @param userId - ID do usuário a resetar
   */
  static resetUser(userId: string): void {
    this.records.delete(userId);
    log.info('Rate limit resetado', { userId });
  }
}

/**
 * ========================================
 * CLEANUP AUTOMÁTICO
 * ========================================
 */

/**
 * Cleanup automático a cada hora
 *
 * PROPÓSITO:
 * Evitar memory leak removendo records inativos
 *
 * COMPORTAMENTO:
 * - Executa a cada 60 minutos
 * - Remove records sem atividade há 48h
 * - Roda em background (não bloqueia)
 *
 * IMPORTANTE:
 * - setInterval não é limpo (runs forever)
 * - Para produção: considerar graceful shutdown
 * - Em cluster: cada instância tem seu próprio cleanup
 *
 * ALTERNATIVA PARA PRODUÇÃO:
 * - Usar Redis com TTL automático
 * - Usar cron job separado para cleanup
 */
setInterval(() => {
  UserRateLimiter.cleanup();
}, 60 * 60 * 1000);