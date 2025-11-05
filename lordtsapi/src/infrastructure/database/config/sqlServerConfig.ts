// src/infrastructure/database/config/sqlServerConfig.ts

/**
 * @fileoverview Configuração de conexão SQL Server usando env.config centralizado
 *
 * ✅ VANTAGEM: Este arquivo usa parseTimeout() do env.config.ts
 * Isso significa que aceita múltiplos formatos de timeout no .env:
 * - '30s' → 30000ms
 * - '30000ms' → 30000ms
 * - '30000' → 30000ms
 * - '5m' → 300000ms
 *
 * Diferenças entre arquivos de configuração:
 * - **sqlServerConfig.ts** (este arquivo): ✅ parseTimeout(), aceita '30s'
 * - **serverConfig.ts**: parseInt() direto, APENAS ms puros
 * - **env.config.ts**: configuração centralizada com parseTimeout()
 *
 * ⚠️ IMPORTANTE: Este é o arquivo RECOMENDADO para usar.
 * O serverConfig.ts existe para compatibilidade legacy.
 *
 * @module infrastructure/database/config/sqlServerConfig
 * @requires ../types
 * @requires @config/env.config
 *
 * @example Uso recomendado
 * ```typescript
 * import { getSqlServerConfigEmp, getSqlServerConfigMult } from './sqlServerConfig';
 *
 * const empConfig = getSqlServerConfigEmp();
 * const connection = new SqlServerConnection(empConfig, 'EMP');
 * await connection.connect();
 * ```
 *
 * @example Formato de .env suportado
 * ```env
 * # ✅ TODAS as formas abaixo funcionam
 * DB_CONNECTION_TIMEOUT=30s      # Segundos
 * DB_CONNECTION_TIMEOUT=30000ms  # Milissegundos
 * DB_CONNECTION_TIMEOUT=30000    # Número puro
 * DB_CONNECTION_TIMEOUT=0.5m     # Minutos (0.5m = 30s)
 * ```
 *
 * @see {@link serverConfig.ts} para versão sem parseTimeout()
 * @see {@link env.config.ts} para configuração centralizada
 * @see {@link ARCHITECTURE.md} para arquitetura completa
 */

import { DatabaseConfig } from '../types';
import { config } from '@config/env.config';

/**
 * Retorna configuração de conexão SQL Server para o banco EMP
 *
 * @function getSqlServerConfigEmp
 *
 * @returns {DatabaseConfig} Configuração completa para conexão EMP
 *
 * @description
 * Constrói objeto de configuração para conexão com o banco EMP
 * lendo da configuração centralizada (env.config.ts).
 *
 * Vantagens desta abordagem:
 * - ✅ Usa parseTimeout() → aceita '30s', '30000ms', '5m'
 * - ✅ Configuração centralizada em um único lugar
 * - ✅ Validação de configs via ConfigValidator
 * - ✅ Valores padrão consistentes
 * - ✅ Fácil manutenção e testes
 *
 * Configurações lidas de env.config.ts:
 * - server: Endereço do SQL Server
 * - port: Porta de conexão
 * - user: Usuário do banco
 * - password: Senha do banco
 * - databaseEmp: Nome do banco EMP (pode ser vazio)
 * - connectionTimeout: Timeout de conexão (em ms)
 * - requestTimeout: Timeout de queries (em ms)
 * - encrypt: Se deve encriptar conexão
 * - trustServerCertificate: Se deve confiar no certificado
 *
 * @example Configuração típica no .env
 * ```env
 * DB_SERVER=10.105.0.4\LOREN
 * DB_PORT=1433
 * DB_USER=sysprogress
 * DB_PASSWORD='sysprogress'
 * DB_DATABASE_EMP=
 *
 * # ✅ Pode usar formatos legíveis
 * DB_CONNECTION_TIMEOUT=30s
 * DB_REQUEST_TIMEOUT=60s
 *
 * DB_ENCRYPT=false
 * DB_TRUST_SERVER_CERTIFICATE=true
 * ```
 *
 * @example Uso básico
 * ```typescript
 * import { getSqlServerConfigEmp } from './sqlServerConfig';
 *
 * const config = getSqlServerConfigEmp();
 * log.info(config);
 * // {
 * //   server: '10.105.0.4\\LOREN',
 * //   port: 1433,
 * //   user: 'sysprogress',
 * //   password: 'sysprogress',
 * //   database: '',  // vazio = usa default do SQL user
 * //   connectionTimeout: 30000,  // convertido de '30s'
 * //   requestTimeout: 60000,     // convertido de '60s'
 * //   encrypt: false,
 * //   trustServerCertificate: true
 * // }
 * ```
 *
 * @example Comparação com serverConfig.ts
 * ```typescript
 * // sqlServerConfig.ts (este arquivo)
 * // .env: DB_CONNECTION_TIMEOUT=30s
 * const config1 = getSqlServerConfigEmp();
 * log.info(config1.connectionTimeout);  // 30000ms ✅ CORRETO
 *
 * // serverConfig.ts (legacy)
 * // .env: DB_CONNECTION_TIMEOUT=30s
 * const config2 = getSqlServerConfigEmp();
 * log.info(config2.connectionTimeout);  // 30ms ❌ ERRADO (parseInt ignora 's')
 * ```
 *
 * @example Usando em DatabaseManager
 * ```typescript
 * import { DatabaseManager } from '../DatabaseManager';
 * import { SqlServerConnection } from '../connections/SqlServerConnection';
 * import { getSqlServerConfigEmp } from './sqlServerConfig';
 *
 * // DatabaseManager usa este método internamente
 * const config = getSqlServerConfigEmp();
 * const connection = new SqlServerConnection(config, 'EMP');
 * await connection.connect();
 * ```
 *
 * @example Testando conexão
 * ```typescript
 * import { getSqlServerConfigEmp } from './sqlServerConfig';
 * import { SqlServerConnection } from '../connections/SqlServerConnection';
 *
 * const config = getSqlServerConfigEmp();
 * const connection = new SqlServerConnection(config, 'EMP');
 *
 * try {
 *   await connection.connect();
 *   log.info('✅ Conectado ao banco EMP');
 *
 *   const result = await connection.query('SELECT GETDATE() as data');
 *   log.info('Data do servidor:', result.recordset[0].data);
 * } catch (error) {
 *   log.error('❌ Erro ao conectar:', error);
 * } finally {
 *   await connection.close();
 * }
 * ```
 *
 * @remarks
 * ⚠️ Ponto crítico: DB_DATABASE_EMP pode ser vazio (string vazia).
 * Quando vazio, o SQL Server usa o banco padrão do usuário.
 *
 * Isso é útil quando:
 * - O usuário SQL já tem um default database configurado
 * - Você quer conectar sem especificar database
 * - O usuário tem permissão apenas no seu database padrão
 *
 * @remarks
 * ✅ Vantagem do parseTimeout():
 * Formatos aceitos no .env:
 * ```env
 * DB_CONNECTION_TIMEOUT=30s      # ✅ Legível
 * DB_CONNECTION_TIMEOUT=30000ms  # ✅ Explícito
 * DB_CONNECTION_TIMEOUT=30000    # ✅ Compatível
 * DB_CONNECTION_TIMEOUT=0.5m     # ✅ Minutos
 * ```
 *
 * Todos são convertidos para milissegundos automaticamente.
 *
 * @remarks
 * 💡 Senha com caracteres especiais:
 * Se a senha contém # ou outros caracteres especiais, use aspas simples no .env:
 * ```env
 * DB_PASSWORD='#senha#'  # ✅ CORRETO
 * DB_PASSWORD=#senha#    # ❌ ERRADO (# é comentário em bash)
 * ```
 *
 * @remarks
 * 🔧 Troubleshooting de timeouts:
 *
 * Se você vê erros de timeout:
 * 1. Verifique se os valores no .env estão corretos
 * 2. Confirme que está usando ESTE arquivo (sqlServerConfig.ts)
 * 3. Teste a conectividade: `telnet 10.105.0.4 1433`
 * 4. Aumente os timeouts se necessário:
 *    ```env
 *    DB_CONNECTION_TIMEOUT=60s  # 60 segundos
 *    DB_REQUEST_TIMEOUT=2m      # 2 minutos
 *    ```
 *
 * @remarks
 * 📊 Valores recomendados por ambiente:
 *
 * **Desenvolvimento:**
 * ```env
 * DB_CONNECTION_TIMEOUT=30s
 * DB_REQUEST_TIMEOUT=60s
 * ```
 *
 * **Produção (rede estável):**
 * ```env
 * DB_CONNECTION_TIMEOUT=15s
 * DB_REQUEST_TIMEOUT=30s
 * ```
 *
 * **Produção (rede instável):**
 * ```env
 * DB_CONNECTION_TIMEOUT=60s
 * DB_REQUEST_TIMEOUT=2m
 * ```
 *
 * @see {@link env.config.ts} para ver a função parseTimeout()
 * @see {@link DatabaseConfig} para estrutura completa de configuração
 */
export function getSqlServerConfigEmp(): DatabaseConfig {
  const dbConfig = config.database.sqlServer;

  return {
    server: dbConfig.server,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.databaseEmp,
    connectionTimeout: dbConfig.connectionTimeout,
    requestTimeout: dbConfig.requestTimeout,
    encrypt: dbConfig.encrypt,
    trustServerCertificate: dbConfig.trustServerCertificate,
  };
}

/**
 * Retorna configuração de conexão SQL Server para o banco MULT
 *
 * @function getSqlServerConfigMult
 *
 * @returns {DatabaseConfig} Configuração completa para conexão MULT
 *
 * @description
 * Constrói objeto de configuração para conexão com o banco MULT.
 * Reutiliza todas as configurações de conexão (server, port, user, password, timeouts)
 * e altera apenas o database para usar DB_DATABASE_MULT.
 *
 * Esta abordagem garante:
 * - Consistência entre as duas configurações
 * - Redução de duplicação de código
 * - Facilita manutenção (muda em um lugar, afeta ambos)
 * - Apenas o banco de dados alvo muda
 *
 * Variáveis de ambiente lidas:
 * - Todas as de EMP (via config.database.sqlServer)
 * - DB_DATABASE_MULT: Nome do banco MULT (pode ser vazio)
 *
 * @example Configuração típica no .env
 * ```env
 * # Configurações compartilhadas (EMP e MULT usam as mesmas)
 * DB_SERVER=10.105.0.4\LOREN
 * DB_PORT=1433
 * DB_USER=sysprogress
 * DB_PASSWORD='sysprogress'
 * DB_CONNECTION_TIMEOUT=30s
 * DB_REQUEST_TIMEOUT=60s
 *
 * # Configurações específicas (apenas o database muda)
 * DB_DATABASE_EMP=
 * DB_DATABASE_MULT=
 * ```
 *
 * @example Uso básico
 * ```typescript
 * import { getSqlServerConfigMult } from './sqlServerConfig';
 *
 * const config = getSqlServerConfigMult();
 * log.info(config);
 * // {
 * //   server: '10.105.0.4\\LOREN',  // mesmo de EMP
 * //   port: 1433,                    // mesmo de EMP
 * //   user: 'sysprogress',           // mesmo de EMP
 * //   password: 'sysprogress',       // mesmo de EMP
 * //   database: '',                  // DB_DATABASE_MULT
 * //   connectionTimeout: 30000,      // mesmo de EMP
 * //   requestTimeout: 60000,         // mesmo de EMP
 * //   encrypt: false,                // mesmo de EMP
 * //   trustServerCertificate: true   // mesmo de EMP
 * // }
 * ```
 *
 * @example Comparando EMP e MULT
 * ```typescript
 * import { getSqlServerConfigEmp, getSqlServerConfigMult } from './sqlServerConfig';
 *
 * const empConfig = getSqlServerConfigEmp();
 * const multConfig = getSqlServerConfigMult();
 *
 * // Todas as propriedades são iguais...
 * log.info(empConfig.server === multConfig.server);  // true
 * log.info(empConfig.port === multConfig.port);      // true
 * log.info(empConfig.user === multConfig.user);      // true
 * log.info(empConfig.connectionTimeout === multConfig.connectionTimeout);  // true
 *
 * // ...exceto o database
 * log.info(empConfig.database === multConfig.database);  // false (única diferença)
 * ```
 *
 * @example Usando ambas as conexões
 * ```typescript
 * import { DatabaseManager } from '../DatabaseManager';
 *
 * // DatabaseManager cria ambas as conexões internamente
 * await DatabaseManager.initialize();
 *
 * // Query no banco EMP
 * const empResult = await DatabaseManager.queryEmp('SELECT * FROM item WHERE it-codigo = "7530110"');
 * log.info('Item do EMP:', empResult);
 *
 * // Query no banco MULT
 * const multResult = await DatabaseManager.queryMult('SELECT * FROM estabelec WHERE cod-estabel = "101"');
 * log.info('Estabelecimento do MULT:', multResult);
 * ```
 *
 * @example Testando ambas as conexões
 * ```typescript
 * import { getSqlServerConfigEmp, getSqlServerConfigMult } from './sqlServerConfig';
 * import { SqlServerConnection } from '../connections/SqlServerConnection';
 *
 * async function testConnections() {
 *   // Testar EMP
 *   const empConfig = getSqlServerConfigEmp();
 *   const empConnection = new SqlServerConnection(empConfig, 'EMP');
 *
 *   try {
 *     await empConnection.connect();
 *     log.info('✅ EMP conectado');
 *   } catch (error) {
 *     log.error('❌ EMP falhou:', error);
 *   } finally {
 *     await empConnection.close();
 *   }
 *
 *   // Testar MULT
 *   const multConfig = getSqlServerConfigMult();
 *   const multConnection = new SqlServerConnection(multConfig, 'MULT');
 *
 *   try {
 *     await multConnection.connect();
 *     log.info('✅ MULT conectado');
 *   } catch (error) {
 *     log.error('❌ MULT falhou:', error);
 *   } finally {
 *     await multConnection.close();
 *   }
 * }
 *
 * testConnections();
 * ```
 *
 * @remarks
 * 💡 Implementação interna:
 * Esta função não duplica código. Ela lê o mesmo objeto de configuração
 * que EMP e apenas sobrescreve o campo database:
 * ```typescript
 * {
 *   ...config.database.sqlServer,  // Todas as props de EMP
 *   database: dbConfig.databaseMult  // Sobrescreve apenas database
 * }
 * ```
 *
 * @remarks
 * ⚠️ Ponto crítico: Assim como EMP, DB_DATABASE_MULT pode ser vazio.
 * Quando vazio, usa o banco padrão do usuário SQL.
 *
 * @remarks
 * 🏗️ Diferença entre bancos EMP e MULT:
 *
 * **EMP (Empresa):**
 * - Dados transacionais da empresa
 * - Itens, pedidos, notas fiscais, estoque
 * - Movimentações financeiras
 * - Dados de produção
 *
 * **MULT (Multi-empresa):**
 * - Dados compartilhados entre empresas
 * - Cadastro de estabelecimentos
 * - Configurações globais
 * - Parâmetros do sistema
 * - Tabelas auxiliares
 *
 * @remarks
 * 🔍 Debug de configuração:
 * ```typescript
 * import { getSqlServerConfigEmp, getSqlServerConfigMult } from './sqlServerConfig';
 *
 * log.info('EMP Config:', getSqlServerConfigEmp());
 * log.info('MULT Config:', getSqlServerConfigMult());
 *
 * // Verificar diferenças
 * const emp = getSqlServerConfigEmp();
 * const mult = getSqlServerConfigMult();
 *
 * Object.keys(emp).forEach(key => {
 *   if (emp[key] !== mult[key]) {
 *     log.info(`Diferença em ${key}:`, emp[key], 'vs', mult[key]);
 *   }
 * });
 * // Output: Diferença em database: '' vs ''
 * ```
 *
 * @see {@link getSqlServerConfigEmp} para documentação completa da config base
 * @see {@link DatabaseConfig} para estrutura de dados
 * @see {@link DatabaseManager} para uso das duas conexões
 */
export function getSqlServerConfigMult(): DatabaseConfig {
  const dbConfig = config.database.sqlServer;

  return {
    server: dbConfig.server,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.databaseMult,
    connectionTimeout: dbConfig.connectionTimeout,
    requestTimeout: dbConfig.requestTimeout,
    encrypt: dbConfig.encrypt,
    trustServerCertificate: dbConfig.trustServerCertificate,
  };
}
