// src/server.ts

// src/server.ts
if (!__filename.endsWith('.ts')) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('module-alias/register');
}
import dotenv from 'dotenv';
dotenv.config(); // ← Mover para LINHA 4
import { envConfig } from '@config/env.config'; // ← Mover para LINHA 5
import { log } from '@shared/utils/logger';
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';
import { DatabaseManager } from './infrastructure/database/DatabaseManager';
import { App } from './app';
import { CacheManager } from '@shared/utils/cacheManager';
import { configValidator } from '@config/configValidator';
import { ApiKeyService } from '@shared/services/apiKey.service';
import { appConfig } from '@config/app.config';

/**
 * Type guard para validar estratégia de cache
 */
function isValidCacheStrategy(value: string): value is 'memory' | 'redis' | 'layered' {
  return ['memory', 'redis', 'layered'].includes(value);
}

/**
 * Inicializa a aplicação
 *
 * Ordem de execução:
 * 1. Validação de configurações (Fail Fast)
 * 2. Cache (L1/L2)
 * 3. Banco de dados
 * 4. API Keys
 * 5. Express
 * 6. Graceful Shutdown
 */
async function startServer(): Promise<void> {
  try {
    log.info('🚀 Iniciando servidor lor0138...');

    // 1. Validar configurações
    log.info('📋 Validando configurações...');
    configValidator.validate();
    log.info('✅ Configurações válidas');

    // 2. Inicializar cache
    log.info('💾 Inicializando sistema de cache...');
    const cacheStrategyEnv = envConfig.cache.strategy;
    const cacheEnabled = envConfig.cache.enabled;
    const cacheStrategy = isValidCacheStrategy(cacheStrategyEnv) ? cacheStrategyEnv : 'memory';

    if (cacheStrategyEnv !== cacheStrategy) {
      log.warn('⚠️  Estratégia de cache inválida, usando fallback', {
        provided: cacheStrategyEnv,
        fallback: cacheStrategy,
        validOptions: ['memory', 'redis', 'layered'],
      });
    }

    if (cacheEnabled) {
      CacheManager.initialize(cacheStrategy);

      if (['layered', 'redis'].includes(cacheStrategy)) {
        const isReady = await CacheManager.isReady();
        if (isReady) {
          log.info('✅ Cache inicializado', { strategy: cacheStrategy, redis: 'conectado' });
        } else {
          log.warn('⚠️  Redis não está pronto, usando fallback L1', {
            strategy: cacheStrategy,
            fallback: 'memory',
          });
        }
      } else {
        log.info('✅ Cache inicializado', { strategy: cacheStrategy });
      }
    } else {
      log.warn('⚠️  Cache desabilitado (CACHE_ENABLED=false)');
    }

    // 3. Inicializar banco de dados
    log.info('🗄️  Inicializando banco de dados...');
    await DatabaseManager.initialize();

    const dbStatus = DatabaseManager.getConnectionStatus();
    if (dbStatus.mode === 'MOCK_DATA') {
      log.warn('⚠️  Sistema em modo MOCK_DATA', { type: dbStatus.type, error: dbStatus.error });
    } else {
      log.info('✅ Banco de dados conectado', { type: dbStatus.type, mode: dbStatus.mode });
    }

    // 4. Inicializar API Keys
    log.info('🔑 Inicializando sistema de API Keys...');
    ApiKeyService.initialize();
    const apiKeyStats = ApiKeyService.getStats();
    log.info('✅ API Keys inicializadas', { total: apiKeyStats.total, active: apiKeyStats.active });

    // 5. Inicializar Express
    log.info('🌐 Inicializando servidor HTTP...');
    const app = new App();
    //  const PORT = parseInt(process.env.PORT || '3000', 10);
    const HOST = appConfig.host;

    const server = app.getExpressApp().listen(appConfig.port, appConfig.host, () => {
      log.info('✅ Servidor HTTP iniciado', {
        port: appConfig.port,
        host: HOST,
        url: appConfig.baseUrl,
        env: envConfig.server.nodeEnv,
        pid: process.pid,
      });

      log.info('📚 Documentação disponível', {
        swagger: `http://${appConfig.host}:${appConfig.port}/api-docs`,
        health: `http://${appConfig.host}:${appConfig.port}/health`,
        cache: cacheEnabled ? `http://${appConfig.host}:${appConfig.port}/cache/stats` : 'disabled',
        admin: `http://${appConfig.host}:${appConfig.port}/admin/api-keys`,
      });

      log.info('🔑 API Keys de exemplo:');
      log.info('   Free:       free-demo-key-123456');
      log.info('   Premium:    premium-key-abc123');
      log.info('   Enterprise: enterprise-key-xyz789');
      log.info('   Admin:      admin-key-superuser');

      if (cacheEnabled) {
        const stats = CacheManager.getStats();
        log.info('📊 Cache stats:', stats);
      }
    });

    // 6. Graceful Shutdown
    const shutdownTimeout = parseInt(process.env.SHUTDOWN_TIMEOUT || '10000', 10); // ✅ CORRETO

    setupGracefulShutdown(server, {
      timeout: shutdownTimeout,

      onShutdownStart: async () => {
        log.info('🛑 Shutdown iniciado', { pid: process.pid, uptime: process.uptime() });

        if (cacheEnabled) {
          log.info('💾 Fechando conexões de cache...');
          try {
            await CacheManager.close();
            log.info('✅ Cache fechado com sucesso');
          } catch (error) {
            log.error('❌ Erro ao fechar cache', {
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        log.info('🗄️  Fechando conexões do banco de dados...');
        try {
          await DatabaseManager.close();
          log.info('✅ Banco de dados fechado com sucesso');
        } catch (error) {
          log.error('❌ Erro ao fechar banco de dados', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },

      onShutdownComplete: () => {
        log.info('👋 Adeus!', { pid: process.pid, finalUptime: process.uptime() });
      },
    });

    log.info('🎉 Sistema pronto para receber requisições!', {
      cache: cacheEnabled ? cacheStrategy : 'disabled',
      database: dbStatus.mode,
      apiKeys: apiKeyStats.total,
      port: appConfig.port,
    });
  } catch (error) {
    log.error('❌ Erro fatal ao iniciar servidor', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    try {
      await CacheManager.close();
      await DatabaseManager.close();
    } catch (closeError) {
      log.error('❌ Erro ao fechar conexões durante erro fatal', {
        error: closeError instanceof Error ? closeError.message : 'Unknown',
      });
    }

    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
}

startServer();
