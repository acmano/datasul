// src/infrastructure/database/config/serverConfig.ts

/**
 * @fileoverview Configuração de conexão SQL Server diretamente do .env
 *
 * ⚠️ ATENÇÃO: Este arquivo usa parseInt() diretamente para timeouts.
 * Isso significa que as variáveis de ambiente devem conter valores
 * em MILISSEGUNDOS PUROS (sem sufixos como 's', 'ms', 'm').
 *
 * Diferenças entre arquivos de configuração:
 * - **serverConfig.ts** (este arquivo): parseInt() direto, valores em ms puros
 * - **sqlServerConfig.ts**: usa parseTimeout() do env.config, aceita '30s', '30000ms', etc
 * - **env.config.ts**: configuração centralizada com parseTimeout()
 *
 * Formato esperado no .env:
 * ```env
 * DB_CONNECTION_TIMEOUT=30000  # ✅ Milissegundos puros
 * DB_REQUEST_TIMEOUT=30000     # ✅ Milissegundos puros
 * ```
 *
 * Formato NÃO suportado (causará erro):
 * ```env
 * DB_CONNECTION_TIMEOUT=30s    # ❌ ERRADO para este arquivo
 * DB_REQUEST_TIMEOUT=30s       # ❌ ERRADO para este arquivo
 * ```
 *
 * @module infrastructure/database/config/serverConfig
 * @requires ../types
 *
 * @example
 * ```typescript
 * import { getSqlServerConfigEmp, getSqlServerConfigMult } from './serverConfig';
 *
 * const empConfig = getSqlServerConfigEmp();
 * const connection = new SqlServerConnection(empConfig, 'EMP');
 * await connection.connect();
 * ```
 *
 * @remarks
 * 💡 Recomendação: Use sqlServerConfig.ts ao invés deste arquivo,
 * pois ele suporta múltiplos formatos de timeout ('30s', '30000ms', etc).
 *
 * @see {@link sqlServerConfig.ts} para versão com parseTimeout()
 * @see {@link env.config.ts} para configuração centralizada
 */

import { DatabaseConfig } from '../types';

/**
 * Retorna configuração de conexão SQL Server para o banco EMP
 *
 * @function getSqlServerConfigEmp
 *
 * @returns {DatabaseConfig} Configuração completa para conexão EMP
 *
 * @description
 * Constrói objeto de configuração para conexão com o banco EMP
 * lendo diretamente das variáveis de ambiente.
 *
 * Variáveis de ambiente lidas:
 * - DB_SERVER: Endereço do servidor (ex: '10.105.0.4\LOREN')
 * - DB_PORT: Porta de conexão (padrão: 1433)
 * - DB_USER: Usuário do banco
 * - DB_PASSWORD: Senha do banco
 * - DB_DATABASE_EMP: Nome do banco EMP (pode ser vazio)
 * - DB_CONNECTION_TIMEOUT: Timeout de conexão em ms (padrão: 30000)
 * - DB_REQUEST_TIMEOUT: Timeout de queries em ms (padrão: 30000)
 * - DB_ENCRYPT: Se deve encriptar conexão (true/false)
 * - DB_TRUST_SERVER_CERTIFICATE: Se deve confiar no certificado (true/false)
 *
 * @example Configuração típica no .env
 * ```env
 * DB_SERVER=10.105.0.4\LOREN
 * DB_PORT=1433
 * DB_USER=sysprogress
 * DB_PASSWORD='sysprogress'
 * DB_DATABASE_EMP=
 * DB_CONNECTION_TIMEOUT=30000
 * DB_REQUEST_TIMEOUT=30000
 * DB_ENCRYPT=false
 * DB_TRUST_SERVER_CERTIFICATE=true
 * ```
 *
 * @example Uso básico
 * ```typescript
 * const config = getSqlServerConfigEmp();
 * log.info(config);
 * // {
 * //   server: '10.105.0.4\\LOREN',
 * //   port: 1433,
 * //   user: 'sysprogress',
 * //   password: 'sysprogress',
 * //   database: '',  // vazio = usa default do SQL user
 * //   connectionTimeout: 30000,
 * //   requestTimeout: 30000,
 * //   encrypt: false,
 * //   trustServerCertificate: true
 * // }
 * ```
 *
 * @example Usando em conexão
 * ```typescript
 * import { SqlServerConnection } from '../connections/SqlServerConnection';
 * import { getSqlServerConfigEmp } from './serverConfig';
 *
 * const config = getSqlServerConfigEmp();
 * const connection = new SqlServerConnection(config, 'EMP');
 *
 * try {
 *   await connection.connect();
 *   const result = await connection.query('SELECT * FROM item');
 *   log.info(result);
 * } finally {
 *   await connection.close();
 * }
 * ```
 *
 * @remarks
 * ⚠️ Ponto crítico: DB_DATABASE_EMP pode ser vazio (string vazia).
 * Quando vazio, o SQL Server usa o banco padrão do usuário.
 * Isso é útil quando o usuário já tem um default database configurado.
 *
 * @remarks
 * ⚠️ Ponto crítico: Timeouts devem ser em MILISSEGUNDOS PUROS.
 * Este arquivo usa parseInt() direto, não parseTimeout().
 * ```env
 * DB_CONNECTION_TIMEOUT=30000  # ✅ CORRETO
 * DB_CONNECTION_TIMEOUT=30s    # ❌ ERRADO (será interpretado como NaN)
 * ```
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
 * Valores padrão:
 * - server: '' (vazio)
 * - port: 1433 (porta padrão SQL Server)
 * - user: '' (vazio)
 * - password: '' (vazio)
 * - database: '' (vazio = usa default do user)
 * - connectionTimeout: 30000ms (30 segundos)
 * - requestTimeout: 30000ms (30 segundos)
 * - encrypt: false
 * - trustServerCertificate: true
 */
export function getSqlServerConfigEmp(): DatabaseConfig {
  const config = {
    server: process.env.DB_SERVER || '',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE_EMP || '',
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT || '30000', 10),
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  };
  return config;
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
 * Reutiliza todas as configurações de EMP (server, port, user, password, timeouts)
 * e sobrescreve apenas o database para usar DB_DATABASE_MULT.
 *
 * Esta abordagem garante consistência entre as duas configurações,
 * mudando apenas o banco de dados alvo.
 *
 * Variáveis de ambiente lidas:
 * - Todas as de EMP (via getSqlServerConfigEmp())
 * - DB_DATABASE_MULT: Nome do banco MULT (pode ser vazio)
 *
 * @example Configuração típica no .env
 * ```env
 * # Configurações compartilhadas (usadas por EMP e MULT)
 * DB_SERVER=10.105.0.4\LOREN
 * DB_PORT=1433
 * DB_USER=sysprogress
 * DB_PASSWORD='sysprogress'
 * DB_CONNECTION_TIMEOUT=30000
 * DB_REQUEST_TIMEOUT=30000
 *
 * # Configurações específicas
 * DB_DATABASE_EMP=
 * DB_DATABASE_MULT=
 * ```
 *
 * @example Uso básico
 * ```typescript
 * const config = getSqlServerConfigMult();
 * log.info(config);
 * // {
 * //   server: '10.105.0.4\\LOREN',
 * //   port: 1433,
 * //   user: 'sysprogress',
 * //   password: 'sysprogress',
 * //   database: '',  // DB_DATABASE_MULT
 * //   connectionTimeout: 30000,
 * //   requestTimeout: 30000,
 * //   encrypt: false,
 * //   trustServerCertificate: true
 * // }
 * ```
 *
 * @example Comparando EMP e MULT
 * ```typescript
 * const empConfig = getSqlServerConfigEmp();
 * const multConfig = getSqlServerConfigMult();
 *
 * log.info(empConfig.server === multConfig.server);  // true
 * log.info(empConfig.port === multConfig.port);      // true
 * log.info(empConfig.user === multConfig.user);      // true
 * log.info(empConfig.database === multConfig.database);  // false (única diferença)
 * ```
 *
 * @example Usando ambas as conexões
 * ```typescript
 * import { DatabaseManager } from '../DatabaseManager';
 *
 * // Inicializa DatabaseManager (cria ambas as conexões)
 * await DatabaseManager.initialize();
 *
 * // Query no EMP
 * const empResult = await DatabaseManager.queryEmp('SELECT * FROM item');
 *
 * // Query no MULT
 * const multResult = await DatabaseManager.queryMult('SELECT * FROM estabelec');
 * ```
 *
 * @remarks
 * 💡 Implementação: Este método usa spread operator para copiar
 * todas as propriedades de EMP e sobrescrever apenas o database:
 * ```typescript
 * return {
 *   ...getSqlServerConfigEmp(),  // Copia tudo de EMP
 *   database: process.env.DB_DATABASE_MULT || ''  // Sobrescreve database
 * };
 * ```
 *
 * @remarks
 * ⚠️ Ponto crítico: Assim como EMP, DB_DATABASE_MULT pode ser vazio.
 * Quando vazio, usa o banco padrão do usuário SQL.
 *
 * @remarks
 * Diferença entre EMP e MULT:
 * - EMP: Banco de dados da empresa (item, pedido, estoque, etc)
 * - MULT: Banco de dados multi-empresa (estabelecimentos, configurações, etc)
 *
 * @see {@link getSqlServerConfigEmp} para detalhes sobre configuração base
 */
export function getSqlServerConfigMult(): DatabaseConfig {
  return {
    ...getSqlServerConfigEmp(),
    database: process.env.DB_DATABASE_MULT || '',
  };
}
