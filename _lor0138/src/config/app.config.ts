// src/config/app.config.ts

/**
 * @fileoverview Configurações básicas da aplicação
 *
 * Define configurações de servidor e URLs base da aplicação.
 * Este arquivo é mais simples que env.config.ts e foca apenas em
 * configurações de rede/servidor.
 *
 * Configurações incluem:
 * - Host do servidor
 * - Porta de execução
 * - URL base da aplicação
 * - Validação contra uso de localhost
 *
 * @module config/app.config
 *
 * @example
 * ```typescript
 * import { appConfig } from '@config/app.config';
 *
 * const server = app.listen(appConfig.port, appConfig.host, () => {
 *   console.log(`Servidor rodando em ${appConfig.baseUrl}`);
 * });
 * ```
 *
 * @remarks
 * ⚠️ Ponto crítico: Este arquivo proíbe o uso de localhost na URL base
 * para garantir que a aplicação seja acessível na rede interna.
 */

/**
 * Configuração da aplicação
 *
 * @constant appConfig
 *
 * @property {string} host - Hostname ou IP onde o servidor irá escutar
 * @property {number} port - Porta onde o servidor irá escutar
 * @property {string} url - URL completa da aplicação (com protocolo, host e porta)
 * @property {string} baseUrl - Getter que retorna a URL base com validação
 *
 * @description
 * Configurações básicas de rede/servidor da aplicação.
 * Todas as propriedades podem ser sobrescritas via variáveis de ambiente.
 *
 * Variáveis de ambiente suportadas:
 * - APP_HOST: Hostname (padrão: lor0138.lorenzetti.ibe)
 * - APP_PORT: Porta (padrão: 3000)
 * - APP_URL: URL completa (padrão: http://lor0138.lorenzetti.ibe:3000)
 *
 * @example Valores padrão
 * ```typescript
 * {
 *   host: 'lor0138.lorenzetti.ibe',
 *   port: 3000,
 *   url: 'http://lor0138.lorenzetti.ibe:3000',
 *   baseUrl: 'http://lor0138.lorenzetti.ibe:3000'  // computed
 * }
 * ```
 *
 * @example Usando variáveis de ambiente
 * ```bash
 * # .env
 * APP_HOST=192.168.1.100
 * APP_PORT=8080
 * APP_URL=http://192.168.1.100:8080
 * ```
 *
 * @example Acessando no código
 * ```typescript
 * import { appConfig } from '@config/app.config';
 *
 * // Host e porta
 * console.log(appConfig.host);  // 'lor0138.lorenzetti.ibe'
 * console.log(appConfig.port);  // 3000
 *
 * // URL base (com validação)
 * console.log(appConfig.baseUrl);  // 'http://lor0138.lorenzetti.ibe:3000'
 * ```
 *
 * @example Usando em servidor Express
 * ```typescript
 * const server = app.listen(appConfig.port, appConfig.host, () => {
 *   console.log(`Servidor iniciado em ${appConfig.baseUrl}`);
 * });
 * ```
 *
 * @example Usando em links de documentação
 * ```typescript
 * console.log(`Swagger: ${appConfig.baseUrl}/api-docs`);
 * console.log(`Health Check: ${appConfig.baseUrl}/health`);
 * ```
 */
export const appConfig = {
  /**
   * Hostname ou IP onde o servidor irá escutar
   *
   * @type {string}
   * @default 'lor0138.lorenzetti.ibe'
   *
   * @description
   * Define o endereço de rede onde o servidor Express irá escutar.
   *
   * Valores comuns:
   * - '0.0.0.0': Escuta em todas as interfaces de rede
   * - 'localhost': Apenas conexões locais (NÃO recomendado para servidor)
   * - '127.0.0.1': Apenas conexões locais via IP
   * - 'lor0138.lorenzetti.ibe': Hostname específico
   * - '192.168.x.x': IP específico da rede interna
   *
   * @remarks
   * Para produção, recomenda-se usar '0.0.0.0' para aceitar conexões
   * de qualquer interface, ou um hostname/IP específico para segurança.
   *
   * @example
   * ```bash
   * # .env
   * APP_HOST=0.0.0.0  # Aceita conexões de qualquer IP
   * ```
   */
  host: process.env.APP_HOST || 'lor0138.lorenzetti.ibe',

  /**
   * Porta onde o servidor irá escutar
   *
   * @type {number}
   * @default 3000
   *
   * @description
   * Porta TCP onde o servidor Express irá escutar por conexões HTTP.
   *
   * Portas comuns:
   * - 3000: Padrão para desenvolvimento Node.js
   * - 8080: Alternativa comum
   * - 80: HTTP padrão (requer privilégios root no Linux)
   * - 443: HTTPS padrão (requer privilégios root no Linux)
   * - 3001-3010: Múltiplas instâncias/testes
   *
   * @remarks
   * ⚠️ Ponto crítico: Em Linux, portas < 1024 requerem privilégios root.
   * Para usar porta 80/443, considere usar proxy reverso (nginx, Apache)
   * ou dar permissão via: `sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node`
   *
   * @example
   * ```bash
   * # .env
   * APP_PORT=8080
   * ```
   *
   * @example Múltiplas instâncias
   * ```bash
   * # Instância 1
   * APP_PORT=3000 npm start
   *
   * # Instância 2
   * APP_PORT=3001 npm start
   * ```
   */
  port: parseInt(process.env.APP_PORT || '3000', 10),

  /**
   * URL completa da aplicação
   *
   * @type {string}
   * @default 'http://lor0138.lorenzetti.ibe:3000'
   *
   * @description
   * URL completa incluindo protocolo, host e porta.
   * Usada para gerar links absolutos e configurações de CORS.
   *
   * Formato: `protocol://host:port`
   * - protocol: http ou https
   * - host: hostname ou IP
   * - port: porta (pode ser omitida se for padrão: 80 para http, 443 para https)
   *
   * @example URLs válidas
   * ```
   * http://lor0138.lorenzetti.ibe:3000
   * https://api.empresa.com
   * http://192.168.1.100:8080
   * https://production.server.com:8443
   * ```
   *
   * @example
   * ```bash
   * # .env
   * APP_URL=http://192.168.1.100:3000
   * ```
   *
   * @remarks
   * Esta URL é usada para:
   * - Configuração padrão de CORS
   * - Links em emails/notificações
   * - Documentação do Swagger
   * - Logs de inicialização
   */
  url: process.env.APP_URL || 'http://lor0138.lorenzetti.ibe:3000',

  /**
   * URL base da aplicação com validação anti-localhost
   *
   * @readonly
   * @type {string}
   *
   * @returns {string} URL base validada
   *
   * @throws {Error} Se a URL contiver 'localhost'
   *
   * @description
   * Getter que retorna a URL base após validar que não contém 'localhost'.
   * Esta validação garante que a aplicação seja acessível na rede interna,
   * não apenas localmente.
   *
   * Razões para proibir localhost:
   * - Aplicação precisa ser acessível por outros servidores
   * - CORS não funcionaria corretamente para clientes externos
   * - Documentação ficaria inacessível na rede
   * - Dificulta integração com outros sistemas
   *
   * @example Uso correto
   * ```typescript
   * // ✅ CORRETO
   * APP_URL=http://lor0138.lorenzetti.ibe:3000
   * console.log(appConfig.baseUrl);
   * // Output: 'http://lor0138.lorenzetti.ibe:3000'
   * ```
   *
   * @example Uso incorreto (lança erro)
   * ```typescript
   * // ❌ ERRADO
   * APP_URL=http://localhost:3000
   * console.log(appConfig.baseUrl);
   * // Throws: Error: 'ERRO: localhost não é permitido. Use lor0138.lorenzetti.ibe'
   * ```
   *
   * @remarks
   * ⚠️ Ponto crítico: Se você ver este erro, significa que:
   * 1. A variável APP_URL no .env contém 'localhost', OU
   * 2. A variável não está definida e o padrão deveria ser usado
   *
   * Solução:
   * ```bash
   * # .env
   * APP_URL=http://lor0138.lorenzetti.ibe:3000
   * # ou o IP/hostname correto do servidor
   * ```
   *
   * @remarks
   * Em desenvolvimento local, use:
   * - Hostname do servidor na rede (lor0138.lorenzetti.ibe)
   * - IP da máquina na rede local (192.168.x.x)
   * - NUNCA use localhost ou 127.0.0.1
   */
  get baseUrl(): string {
    if (this.url.includes('localhost')) {
      throw new Error('ERRO: localhost não é permitido. Use lor0138.lorenzetti.ibe');
    }
    return this.url;
  },
};