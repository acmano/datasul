/**
 * Cache Warmer - Pre-popula cache com dados frequentes
 */
import { CacheManager } from '@shared/utils/cacheManager';
import { log } from '@shared/utils/logger';

export class CacheWarmer {
  static async warmCache(): Promise<void> {
    log.info('🔥 Iniciando cache warming...');

    try {
      // Popular dados críticos
      await this.warmCriticalData();

      log.info('✅ Cache warming concluído');
    } catch (error) {
      log.error('❌ Erro no cache warming', { error });
    }
  }

  private static async warmCriticalData(): Promise<void> {
    // Implementar: popular items mais acessados, famílias, etc
    const criticalKeys = ['popular:items', 'families:active', 'config:app'];

    for (const key of criticalKeys) {
      await CacheManager.set(key, { warmStart: true }, 3600);
    }
  }
}
