// src/server.ts

import dotenv from 'dotenv';
import { log } from '@shared/utils/logger';
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';
import { ConfigValidator } from './config/configValidator';
import { DatabaseManager } from './infrastructure/database/DatabaseManager';
import { App } from './app';
import { CacheManager } from '@shared/utils/cacheManager';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Inicializa a aplicação
 * 
 * Ordem de execução:
 * 1. Validação de configurações (Fail Fast)
 * 2. Inicialização do banco de dados
 * 3. Inicialização do Express
 * 4. Setup de Graceful Shutdown
 */
async function startServer(): Promise<void> {
  try {
    log.info('🚀 Iniciando servidor lor0138...');

    // 1. Validar configurações do .env
    log.info('📋 Validando configurações...');
    ConfigValidator.validate();
    log.info('✅ Configurações válidas');

    // 2. Inicializar conexões do banco de dados
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

    // 3. Inicializar aplicação Express
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
      });
    });

    // 4. Setup de Graceful Shutdown
    const shutdownTimeout = parseInt(
      process.env.SHUTDOWN_TIMEOUT || '10000',
      10
    );

    setupGracefulShutdown(server, {
      timeout: shutdownTimeout,
      
      onShutdownStart: () => {
        log.info('🛑 Shutdown iniciado', {
          pid: process.pid,
          uptime: process.uptime(),
        });
      },

      onShutdownComplete: () => {
        log.info('👋 Adeus!', {
          pid: process.pid,
          finalUptime: process.uptime(),
        });
      },
    });

    // Inicializa cache global
    CacheManager.getInstance();

    log.info('🎉 Sistema pronto para receber requisições!');

  } catch (error) {
    log.error('❌ Erro fatal ao iniciar servidor', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Aguarda logs serem gravados antes de encerrar
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
}

// Iniciar servidor
startServer();