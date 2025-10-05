// src/server.ts

import dotenv from 'dotenv';
import { log } from '@shared/utils/logger';
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';
import { DatabaseManager } from './infrastructure/database/DatabaseManager';
import { App } from './app';
import { CacheManager } from '@shared/utils/cacheManager';
import { configValidator } from '@config/configValidator';
import { ApiKeyService } from '@shared/services/ApiKeyService';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Inicializa a aplicação
 * 
 * Ordem de execução:
 * 1. Validação de configurações (Fail Fast)
 * 2. Inicialização do cache (L1/L2)
 * 3. Inicialização do banco de dados
 * 4. Inicialização do sistema de API Keys
 * 5. Inicialização do Express
 * 6. Setup de Graceful Shutdown
 */
async function startServer(): Promise<void> {
  try {
    log.info('🚀 Iniciando servidor lor0138...');

    // ============================================
    // 1. Validar configurações do .env
    // ============================================
    log.info('📋 Validando configurações...');
    configValidator.validate();
    log.info('✅ Configurações válidas');

    // ============================================
    // 2. Inicializar sistema de cache (L1/L2)
    // ============================================
    log.info('💾 Inicializando sistema de cache...');
    
    const cacheStrategy = process.env.CACHE_STRATEGY || 'memory';
    const cacheEnabled = process.env.CACHE_ENABLED !== 'false';

    if (cacheEnabled) {
      CacheManager.initialize(cacheStrategy);

      // Verificar se Redis está pronto (para estratégias redis/layered)
      if (['layered', 'redis'].includes(cacheStrategy)) {
        const isReady = await CacheManager.isReady();
        
        if (isReady) {
          log.info('✅ Cache inicializado', {
            strategy: cacheStrategy,
            redis: 'conectado'
          });
        } else {
          log.warn('⚠️  Redis não está pronto, usando fallback L1', {
            strategy: cacheStrategy,
            fallback: 'memory'
          });
        }
      } else {
        log.info('✅ Cache inicializado', {
          strategy: cacheStrategy
        });
      }
    } else {
      log.warn('⚠️  Cache desabilitado (CACHE_ENABLED=false)');
    }

    // ============================================
    // 3. Inicializar conexões do banco de dados
    // ============================================
    log.info('🗄️  Inicializando banco de dados...');
    await DatabaseManager.initialize();
    
    const dbStatus = DatabaseManager.getConnectionStatus();
    if (dbStatus.mode === 'MOCK_DATA') {
      log.warn('⚠️  Sistema em modo MOCK_DATA', {
        type: dbStatus.type,
        error: dbStatus.error,
      });
    } else {
      log.info('✅ Banco de dados conectado', {
        type: dbStatus.type,
        mode: dbStatus.mode,
      });
    }

    // ============================================
    // 4. Inicializar sistema de API Keys
    // ============================================
    log.info('🔑 Inicializando sistema de API Keys...');
    ApiKeyService.initialize();
    const apiKeyStats = ApiKeyService.getStats();
    log.info('✅ API Keys inicializadas', apiKeyStats);

    // ============================================
    // 5. Inicializar aplicação Express
    // ============================================
    log.info('🌐 Inicializando servidor HTTP...');
    
    const app = new App();
    const PORT = parseInt(process.env.PORT || '3000', 10);
    const HOST = process.env.HOST || '0.0.0.0';

    const server = app.getExpressApp().listen(PORT, HOST, () => {
      log.info('✅ Servidor HTTP iniciado', {
        port: PORT,
        host: HOST,
        url: `http://${HOST}:${PORT}`,
        env: process.env.NODE_ENV || 'development',
        pid: process.pid,
      });

      log.info('📚 Documentação disponível', {
        swagger: `http://lor0138.lorenzetti.ibe:${PORT}/api-docs`,
        health: `http://lor0138.lorenzetti.ibe:${PORT}/health`,
        cache: cacheEnabled ? `http://lor0138.lorenzetti.ibe:${PORT}/cache/stats` : 'disabled',
        admin: `http://lor0138.lorenzetti.ibe:${PORT}/admin/api-keys`,
      });

      // Exibir API Keys de exemplo
      log.info('🔑 API Keys de exemplo:');
      log.info('   Free:       free-demo-key-123456');
      log.info('   Premium:    premium-key-abc123');
      log.info('   Enterprise: enterprise-key-xyz789');
      log.info('   Admin:      admin-key-superuser');

      // Exibir estatísticas de cache (se habilitado)
      if (cacheEnabled) {
        const stats = CacheManager.getStats();
        log.info('📊 Cache stats:', stats);
      }
    });

    // ============================================
    // 6. Setup de Graceful Shutdown
    // ============================================
    const shutdownTimeout = parseInt(
      process.env.SHUTDOWN_TIMEOUT || '10000',
      10
    );

    setupGracefulShutdown(server, {
      timeout: shutdownTimeout,
      
      onShutdownStart: async () => {
        log.info('🛑 Shutdown iniciado', {
          pid: process.pid,
          uptime: process.uptime(),
        });

        // Fechar cache (Redis, se estiver usando)
        if (cacheEnabled) {
          log.info('💾 Fechando conexões de cache...');
          try {
            await CacheManager.close();
            log.info('✅ Cache fechado com sucesso');
          } catch (error) {
            log.error('❌ Erro ao fechar cache', {
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        // Fechar banco de dados
        log.info('🗄️  Fechando conexões do banco de dados...');
        try {
          await DatabaseManager.close();
          log.info('✅ Banco de dados fechado com sucesso');
        } catch (error) {
          log.error('❌ Erro ao fechar banco de dados', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },

      onShutdownComplete: () => {
        log.info('👋 Adeus!', {
          pid: process.pid,
          finalUptime: process.uptime(),
        });
      },
    });

    // ============================================
    // ✅ Sistema pronto!
    // ============================================
    log.info('🎉 Sistema pronto para receber requisições!', {
      cache: cacheEnabled ? cacheStrategy : 'disabled',
      database: dbStatus.mode,
      apiKeys: apiKeyStats.total,
      port: PORT
    });

  } catch (error) {
    log.error('❌ Erro fatal ao iniciar servidor', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Tenta fechar conexões antes de encerrar
    try {
      await CacheManager.close();
      await DatabaseManager.close();
    } catch (closeError) {
      log.error('❌ Erro ao fechar conexões durante erro fatal', {
        error: closeError instanceof Error ? closeError.message : 'Unknown'
      });
    }

    // Aguarda logs serem gravados antes de encerrar
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
}

// Iniciar servidor
startServer();