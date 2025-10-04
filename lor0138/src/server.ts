// src/server.ts

import { App } from './app'; // ✅ CORRIGIDO: import named export
import { envConfig } from './config/env.config'; // ✅ CORRIGIDO: path relativo
import { DatabaseManager } from './infrastructure/database/DatabaseManager'; // ✅ CORRIGIDO: path relativo
import { ConfigValidator } from './config/configValidator'; // ✅ CORRIGIDO: path relativo

/**
 * Inicializa o servidor
 */
async function startServer() {
  try {
    // ========================================
    // 1. VALIDA CONFIGURAÇÕES (Fail Fast)
    // ========================================
    ConfigValidator.validateAndExit(); // Encerra se houver erros
    ConfigValidator.printSummary(); // Mostra resumo

    // ========================================
    // 2. INICIALIZA BANCO DE DADOS
    // ========================================
    console.log('🔌 Inicializando conexões com banco de dados...');
    await DatabaseManager.initialize();
    console.log('✅ Banco de dados conectado!\n');

    // ========================================
    // 3. CRIA INSTÂNCIA DA APLICAÇÃO
    // ========================================
    // ✅ CORRIGIDO: instanciar a classe App
    const appInstance = new App();

    // ========================================
    // 4. INICIA SERVIDOR HTTP
    // ========================================
    // ✅ CORRIGIDO: usar appInstance.app para acessar o Express
    const server = appInstance.app.listen(envConfig.port, () => {
      console.log('🚀 Servidor iniciado com sucesso!');
      console.log(`   URL: http://localhost:${envConfig.port}`);
      console.log(`   Ambiente: ${envConfig.nodeEnv}`);
      console.log(`   Health Check: http://localhost:${envConfig.port}/health`);
      console.log(`   API Docs: http://localhost:${envConfig.port}/api-docs`);
      console.log('');
    });

    // ========================================
    // 5. GRACEFUL SHUTDOWN
    // ========================================
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} recebido, fechando servidor...`);

      // Para de aceitar novas conexões
      server.close(async () => {
        console.log('🔌 Servidor HTTP fechado');

        try {
          // Fecha conexões do banco
          await DatabaseManager.close();
          console.log('🔌 Conexões com banco fechadas');

          // Encerra o processo
          process.exit(0);
        } catch (error) {
          console.error('Erro ao fechar conexões:', error);
          process.exit(1);
        }
      });

      // Timeout: força encerramento após 10 segundos
      setTimeout(() => {
        console.error('❌ Timeout ao fechar servidor, forçando encerramento...');
        process.exit(1);
      }, 10000);
    };

    // Escuta sinais de encerramento
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Trata erros não capturados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection:', reason);
      console.error('   Promise:', promise);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Inicia o servidor
startServer();