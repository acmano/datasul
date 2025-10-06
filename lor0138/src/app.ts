// src/app.ts

/**
 * ============================================================================
 * CLASSE PRINCIPAL DA APLICAÇÃO EXPRESS
 * ============================================================================
 *
 * Arquivo central que configura e inicializa toda a aplicação.
 * É o coração do sistema - qualquer erro aqui afeta toda a aplicação.
 *
 * RESPONSABILIDADES:
 * ------------------
 * 1. Configuração de middlewares (segurança, logging, métricas, parsing)
 * 2. Registro de rotas (API, documentação, admin, health checks)
 * 3. Tratamento global de erros (catch-all para erros não tratados)
 * 4. Integração com sistemas externos (banco, cache, métricas)
 *
 * ORDEM DE INICIALIZAÇÃO (CRÍTICA - NÃO ALTERAR):
 * -----------------------------------------------
 * 1. Métricas       - Primeiro para capturar tudo
 * 2. Middlewares    - Na ordem específica (ver setupMiddlewares)
 * 3. Rotas          - Após middlewares estarem prontos
 * 4. Error Handler  - SEMPRE por último (catch-all)
 *
 * ARQUITETURA:
 * -----------
 * - Padrão Singleton (uma única instância da aplicação)
 * - Separação de responsabilidades (métodos privados específicos)
 * - Fail-safe (continua funcionando mesmo se métricas falharem)
 * - Logging estruturado (Winston com correlation ID)
 *
 * INTEGRAÇÕES:
 * -----------
 * - DatabaseManager: Conexão com SQL Server/ODBC
 * - CacheManager: Sistema de cache L1/L2
 * - MetricsManager: Métricas Prometheus
 * - Swagger: Documentação OpenAPI 3.0
 * - Winston: Sistema de logging
 *
 * PONTOS CRÍTICOS:
 * ---------------
 * - A ordem dos middlewares é CRÍTICA
 * - Correlation ID DEVE ser o primeiro middleware
 * - Error handler DEVE ser o último
 * - CSP desabilitado para Swagger funcionar
 * - Rate limiting tem exceção para admin
 *
 * @class App
 * @exports App
 * @since 1.0.0
 * @author Equipe de Desenvolvimento
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import timeout from 'connect-timeout';
import swaggerUi from 'swagger-ui-express';
import { rateLimit } from 'express-rate-limit';
import { log } from '@shared/utils/logger';
import { swaggerSpec, swaggerUiOptions } from '@config/swagger.config';
import { correlationIdMiddleware } from '@shared/middlewares/correlationId.middleware';
import informacoesGeraisRoutes from './api/lor0138/item/dadosCadastrais/informacoesGerais/routes/informacoesGerais.routes';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { CacheManager } from '@shared/utils/cacheManager';
import adminRoutes from './api/admin/routes/admin.routes';

// ✅ Importar classes de erro do sistema unificado
// Permite tratamento centralizado de erros com statusCode e context
import { AppError } from '@shared/errors';

// ✅ Imports para sistema de métricas Prometheus
// Coleta métricas de performance, disponibilidade e uso
import { metricsMiddleware } from '@shared/middlewares/metrics.middleware';
import { MetricsManager, metricsManager } from '@infrastructure/metrics/MetricsManager';
import metricsRoutes from './api/metrics/routes';

export class App {
  // Instância do Express
  // Pública para permitir acesso em testes e configurações externas
  public app: Application;

  /**
   * Construtor da aplicação
   *
   * Inicializa a aplicação Express e configura todos os componentes
   * na ordem CRÍTICA requerida pelo sistema.
   *
   * FLUXO DE INICIALIZAÇÃO:
   * -----------------------
   * 1. initializeMetrics()
   *    - Cria instância do MetricsManager
   *    - Registra contadores e gauges
   *    - Não quebra app se falhar (graceful degradation)
   *
   * 2. setupMiddlewares()
   *    - Correlation ID (tracking)
   *    - Métricas (coleta)
   *    - Logging (auditoria)
   *    - Security (proteção)
   *    - CORS (cross-origin)
   *    - Parsing (JSON/URL)
   *    - Compression (performance)
   *    - Timeout (controle)
   *    - Rate limiting (proteção)
   *
   * 3. setupRoutes()
   *    - Métricas (/metrics)
   *    - Health check (/health)
   *    - Cache (/cache/*)
   *    - Swagger (/api-docs)
   *    - Admin (/admin/*)
   *    - API (/api/*)
   *    - Root (/)
   *    - 404 (catch-all)
   *
   * 4. setupErrorHandling()
   *    - Timeout errors (408)
   *    - AppError (custom)
   *    - Generic errors (500)
   *
   * POR QUE ESTA ORDEM?
   * -------------------
   * - Métricas primeiro: precisa estar pronta antes de coletar dados
   * - Middlewares antes de rotas: rotas dependem dos middlewares
   * - Error handler por último: precisa capturar erros de tudo
   *
   * IMPORTANTE:
   * ----------
   * Alterar a ordem de inicialização pode quebrar funcionalidades!
   * Exemplo: se error handler vier antes das rotas, não captura erros delas.
   *
   * @constructor
   */
  constructor() {
    // Cria instância do Express
    // Express é o framework web usado para criar a API REST
    this.app = express();

    // 1. Inicializar métricas ANTES de tudo
    // Métricas precisam estar prontas antes de começar a receber requests
    this.initializeMetrics();

    // 2. Configura middlewares na ordem crítica
    // Middlewares são executados em ordem - a sequência importa!
    this.setupMiddlewares();

    // 3. Configura rotas e endpoints
    // Rotas só funcionam se middlewares estiverem configurados
    this.setupRoutes();

    // 4. Configura tratamento de erros (SEMPRE POR ÚLTIMO)
    // Error handler precisa vir depois de tudo para capturar todos os erros
    this.setupErrorHandling();
  }

  /**
   * Inicializa o sistema de métricas Prometheus
   *
   * PROPÓSITO:
   * ---------
   * Configura o sistema de coleta de métricas para monitoramento
   * da saúde e performance da aplicação em tempo real.
   *
   * MÉTRICAS COLETADAS:
   * ------------------
   * 1. HTTP Requests:
   *    - Total de requisições por método/rota/status
   *    - Duração de requisições (histograma)
   *    - Requisições em progresso (gauge)
   *
   * 2. Health Checks:
   *    - Status do banco (1=ok, 0=falha)
   *    - Tempo de resposta do banco
   *    - Status geral da API
   *
   * 3. Erros:
   *    - Total de erros por tipo
   *    - Taxa de erro
   *
   * 4. Sistema:
   *    - Uso de memória
   *    - CPU
   *    - Uptime
   *
   * POR QUE INICIALIZAR PRIMEIRO?
   * -----------------------------
   * O MetricsManager precisa registrar todos os contadores e gauges
   * ANTES que os middlewares comecem a usá-los. Se tentarmos coletar
   * métricas antes de inicializar, teremos erros.
   *
   * GRACEFUL DEGRADATION:
   * --------------------
   * Se a inicialização falhar, apenas loga o erro e continua.
   * A aplicação NÃO deve parar se métricas falharem - elas são
   * auxiliares, não críticas para o funcionamento.
   *
   * FORMATO DE MÉTRICAS:
   * -------------------
   * Prometheus format (text-based):
   * # TYPE http_requests_total counter
   * http_requests_total{method="GET",route="/health",status="200"} 42
   *
   * ENDPOINT:
   * --------
   * GET /metrics - Retorna todas as métricas no formato Prometheus
   *
   * INTEGRAÇÃO:
   * ----------
   * - Prometheus scraper coleta métricas periodicamente
   * - Grafana visualiza métricas em dashboards
   * - Alertas baseados em thresholds
   *
   * @private
   * @returns {void}
   * @throws Não lança erro - falhas são logadas mas não param a aplicação
   */
  private initializeMetrics(): void {
    try {
      // Obtém instância singleton do MetricsManager
      // Singleton garante que há apenas uma instância em todo o sistema
      MetricsManager.getInstance();

      // Log de sucesso para confirmar que métricas estão ativas
      log.info('✅ Sistema de métricas inicializado');
    } catch (error) {
      // Se falhar, apenas loga o erro
      // Aplicação continua funcionando sem métricas (graceful degradation)
      log.error('Erro ao inicializar métricas', { error });

      // NÃO faz throw - métricas são opcionais
      // A aplicação deve funcionar mesmo sem monitoramento
    }
  }

  /**
   * Configura todos os middlewares da aplicação
   *
   * CONCEITO DE MIDDLEWARE:
   * ----------------------
   * Middleware é uma função que intercepta requisições HTTP antes
   * de chegarem às rotas. Cada middleware pode:
   * - Modificar request/response
   * - Executar código (log, validação, etc)
   * - Encerrar o ciclo (retornar resposta)
   * - Passar para o próximo (next())
   *
   * ⚠️ ORDEM CRÍTICA - NÃO ALTERAR SEM ENTENDER O IMPACTO!
   * ------------------------------------------------------
   *
   * A ORDEM DOS MIDDLEWARES É FUNDAMENTAL. Eles são executados
   * sequencialmente na ordem em que são registrados. Mudar a ordem
   * pode quebrar funcionalidades ou criar vulnerabilidades.
   *
   * ORDEM E JUSTIFICATIVA:
   * ---------------------
   *
   * 1. CORRELATION ID - PRIMEIRO (tracking)
   *    Por que primeiro? Porque todos os outros middlewares precisam
   *    do correlation ID para logar corretamente.
   *
   * 2. MÉTRICAS - Logo após (observabilidade)
   *    Por que aqui? Para capturar TODAS as requisições desde o início,
   *    incluindo tempo total de processamento.
   *
   * 3. LOGGING - Após correlation ID (auditoria)
   *    Por que aqui? Precisa do correlation ID já definido para
   *    associar logs à requisição correta.
   *
   * 4. SECURITY HEADERS - Antes de qualquer processamento (proteção)
   *    Por que aqui? Headers de segurança devem ser adicionados
   *    antes de processar qualquer dado da requisição.
   *
   * 5. CORS - Antes de parsing (cross-origin)
   *    Por que aqui? Navegadores fazem preflight requests (OPTIONS)
   *    que precisam de CORS antes de qualquer parsing.
   *
   * 6. BODY PARSING - Após CORS (processamento)
   *    Por que aqui? Só faz sentido parsear body se a requisição
   *    passou pelas validações de CORS.
   *
   * 7. COMPRESSION - Após parsing (performance)
   *    Por que aqui? Comprime RESPOSTAS, não requisições.
   *    Precisa vir após parsing de entrada.
   *
   * 8. TIMEOUT - Após parsing (controle)
   *    Por que aqui? Começa a contar tempo após preparação inicial.
   *
   * 9. RATE LIMITING - Por último (proteção)
   *    Por que último? Queremos logar/medir tentativas ANTES de
   *    bloquear por rate limit.
   *
   * IMPACTO DE ORDEM ERRADA:
   * ------------------------
   * - Logging antes de correlation ID: logs sem ID de rastreamento
   * - Rate limit antes de métricas: requisições bloqueadas não são medidas
   * - CORS depois de parsing: preflight requests falham
   * - Security depois de processing: dados já foram processados sem proteção
   *
   * @private
   * @returns {void}
   */
  private setupMiddlewares(): void {
    // ============================================================================
    // 1. CORRELATION ID - Tracking e Rastreamento
    // ============================================================================
    //
    // PROPÓSITO:
    // Gera ou aceita um UUID único (v4) para cada requisição.
    // Permite rastrear uma requisição através de todo o sistema.
    //
    // COMO FUNCIONA:
    // - Se cliente envia header X-Correlation-ID: usa esse ID
    // - Se não envia: gera UUID v4 automaticamente
    // - Adiciona req.id com o correlation ID
    // - Retorna o ID no header X-Correlation-ID da resposta
    //
    // POR QUE É O PRIMEIRO?
    // Todos os outros middlewares e logs precisam do correlation ID
    // para rastrear corretamente. Se vier depois, alguns logs não
    // terão o ID associado.
    //
    // BENEFÍCIOS:
    // - Debug: "Mostre todos os logs da requisição X"
    // - Rastreamento distribuído: seguir requisição entre serviços
    // - Auditoria: saber exatamente o que aconteceu em cada request
    // - Suporte: cliente informa o ID para investigação
    //
    // EXEMPLO:
    // Cliente → [X-Correlation-ID: abc-123] → API
    // API → logs com correlationId: abc-123
    // API → resposta com [X-Correlation-ID: abc-123]
    this.app.use(correlationIdMiddleware);

    // ============================================================================
    // 2. MÉTRICAS - Coleta de Dados de Performance
    // ============================================================================
    //
    // PROPÓSITO:
    // Coleta métricas de todas as requisições para monitoramento
    // e análise de performance em tempo real.
    //
    // MÉTRICAS COLETADAS POR REQUISIÇÃO:
    // - Duração total (latência)
    // - Status code retornado
    // - Método HTTP usado
    // - Rota acessada
    // - Tamanho da resposta
    //
    // POR QUE LOGO APÓS CORRELATION ID?
    // Para capturar o tempo TOTAL de processamento desde o início,
    // incluindo tempo gasto em todos os outros middlewares.
    //
    // FORMATO PROMETHEUS:
    // http_request_duration_seconds{method="GET",route="/health",status="200"}
    // http_requests_total{method="GET",route="/health",status="200"}
    //
    // COMO USA AS MÉTRICAS?
    // 1. Prometheus scraper coleta /metrics a cada 15s
    // 2. Grafana visualiza em dashboards
    // 3. Alertmanager dispara alertas se thresholds excedidos
    //
    // EXEMPLO DE ALERTA:
    // Se latência média > 1s por 5min → alerta equipe
    // Se taxa de erro > 5% → alerta crítico
    this.app.use(metricsMiddleware);

    // ============================================================================
    // 3. LOGGING DE REQUISIÇÕES - Auditoria e Debug
    // ============================================================================
    //
    // PROPÓSITO:
    // Registra informações detalhadas de cada requisição HTTP
    // para auditoria, debug e análise de comportamento.
    //
    // INFORMAÇÕES LOGADAS:
    // - correlationId: ID único da requisição
    // - method: GET, POST, PUT, DELETE, etc
    // - url: Path completo da requisição
    // - statusCode: 200, 404, 500, etc
    // - duration: Tempo total em milissegundos
    // - userAgent: Navegador/cliente que fez a requisição
    //
    // COMO FUNCIONA:
    // 1. Armazena timestamp de início em req.startTime
    // 2. Registra listener para evento 'finish' da response
    // 3. Quando response termina, calcula duração e loga
    //
    // POR QUE req.startTime?
    // Precisamos medir tempo desde o INÍCIO do processamento.
    // Sem isso, não sabemos quanto tempo a requisição demorou.
    //
    // FORMATO DO LOG:
    // {
    //   "level": "info",
    //   "message": "HTTP Request",
    //   "correlationId": "abc-123",
    //   "method": "GET",
    //   "url": "/api/items/123",
    //   "statusCode": 200,
    //   "duration": 45,
    //   "userAgent": "Mozilla/5.0..."
    // }
    //
    // CASOS DE USO:
    // - Debugging: "Por que a requisição X falhou?"
    // - Performance: "Quais rotas são mais lentas?"
    // - Auditoria: "Quem acessou o que e quando?"
    // - Analytics: "Quais endpoints são mais usados?"
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      // Armazena timestamp de início da requisição
      // Date.now() retorna milissegundos desde epoch (1970-01-01)
      // Precisamos disso para calcular duration no final
      req.startTime = Date.now();

      // Registra listener para evento 'finish'
      // 'finish' é emitido quando response foi completamente enviada
      // Esse é o momento certo para calcular duração total
      res.on('finish', () => {
        // Calcula duração em milissegundos
        // || 0 protege contra req.startTime undefined (edge case)
        const duration = Date.now() - (req.startTime || 0);

        // Log estruturado com Winston
        // Winston formata para JSON e adiciona timestamp automaticamente
        log.info('HTTP Request', {
          correlationId: req.id,      // Do middleware anterior
          method: req.method,          // GET, POST, etc
          url: req.url,                // /api/items/123
          statusCode: res.statusCode,  // 200, 404, 500, etc
          duration: duration,          // Tempo total em ms
          userAgent: req.get('user-agent'), // Cliente/navegador
        });
      });

      // Passa para próximo middleware
      // Sem next(), a requisição trava aqui
      next();
    });

    // ============================================================================
    // 4. SECURITY HEADERS - Proteção Contra Ataques
    // ============================================================================
    //
    // PROPÓSITO:
    // Adiciona headers HTTP de segurança para proteger contra
    // ataques comuns como XSS, clickjacking, MIME sniffing, etc.
    //
    // HELMET É UMA COLEÇÃO DE 15+ MIDDLEWARES DE SEGURANÇA:
    //
    // 1. Content-Security-Policy (CSP)
    //    Previne XSS definindo quais recursos podem ser carregados
    //    ❌ DESABILITADO aqui porque quebra Swagger UI
    //
    // 2. X-DNS-Prefetch-Control
    //    Controla DNS prefetching do navegador
    //
    // 3. X-Frame-Options
    //    Previne clickjacking (impede site ser carregado em iframe)
    //    Valor: SAMEORIGIN (apenas nosso domínio pode iframe)
    //
    // 4. X-Content-Type-Options
    //    Previne MIME sniffing attacks
    //    Valor: nosniff (navegador deve respeitar Content-Type)
    //
    // 5. X-Download-Options
    //    Previne downloads maliciosos no IE
    //    Valor: noopen
    //
    // 6. X-Permitted-Cross-Domain-Policies
    //    Controla acesso de Flash/PDF
    //    Valor: none
    //
    // 7. Referrer-Policy
    //    Controla quanto de informação de referrer é enviado
    //    Valor: no-referrer
    //
    // 8. Strict-Transport-Security (HSTS)
    //    Força HTTPS por X tempo
    //    Valor: max-age=15552000; includeSubDomains
    //
    // POR QUE CSP É DESABILITADO?
    // Swagger UI precisa carregar:
    // - Inline scripts
    // - Inline styles
    // - Recursos de CDNs
    // CSP estrito bloquearia tudo isso.
    //
    // EM PRODUÇÃO, CONSIDERE:
    // - Habilitar CSP com whitelist de recursos Swagger
    // - Ou servir Swagger em subdomínio separado com CSP relaxado
    // - Ou usar nonces/hashes para inline scripts
    //
    // IMPACTO DE NÃO TER HELMET:
    // - Vulnerável a XSS (Cross-Site Scripting)
    // - Vulnerável a clickjacking
    // - MIME sniffing attacks
    // - Downgrade de HTTPS para HTTP
    this.app.use(helmet({
      contentSecurityPolicy: false, // Desabilita CSP para Swagger funcionar
    }));

    // ============================================================================
    // 5. CORS - Cross-Origin Resource Sharing
    // ============================================================================
    //
    // PROPÓSITO:
    // Permite que navegadores façam requisições de origens diferentes
    // (domínios diferentes) para esta API.
    //
    // CONCEITO DE CORS:
    // Por padrão, navegadores bloqueiam requisições cross-origin por
    // segurança (Same-Origin Policy). CORS é o mecanismo que permite
    // relaxar essa restrição de forma controlada.
    //
    // CONFIGURAÇÕES:
    //
    // 1. origin: Quais origens podem acessar
    //    - process.env.CORS_ALLOWED_ORIGINS: lista de origens permitidas
    //    - Exemplo: "http://localhost:3000,https://app.empresa.com"
    //    - '*' permite TODAS as origens (⚠️ não usar em produção!)
    //
    //    POR QUE CONTROLAR ORIGINS?
    //    Previne que sites maliciosos façam requests usando
    //    credenciais do usuário (CSRF attacks).
    //
    // 2. methods: Quais métodos HTTP são permitidos
    //    GET: buscar dados
    //    POST: criar recursos
    //    PUT: atualizar recursos
    //    DELETE: remover recursos
    //
    //    POR QUE LIMITAR METHODS?
    //    Princípio de menor privilégio - só permite o necessário.
    //
    // 3. allowedHeaders: Quais headers o cliente pode enviar
    //    - Content-Type: tipo do body (JSON, form, etc)
    //    - Authorization: token de autenticação
    //    - X-Correlation-ID: tracking de requisições
    //    - X-Request-ID: (legacy, mantido por compatibilidade)
    //
    //    POR QUE NÃO PERMITIR TODOS?
    //    Headers customizados podem ser usados para ataques.
    //    Só permitimos os que a aplicação realmente usa.
    //
    // 4. exposedHeaders: Quais headers o cliente pode LER
    //    - X-Correlation-ID: permite cliente rastrear requisições
    //
    //    POR QUE EXPOR?
    //    Sem expor, JavaScript no navegador não consegue ler o header,
    //    mesmo que o servidor o envie. É necessário para tracking.
    //
    // PREFLIGHT REQUESTS:
    // Navegadores fazem requisição OPTIONS antes de POST/PUT/DELETE
    // para verificar permissões CORS. Este middleware responde isso.
    //
    // EXEMPLO DE FLUXO:
    // 1. Navegador: OPTIONS /api/items (preflight)
    // 2. Servidor: 204 com headers CORS
    // 3. Navegador: POST /api/items (requisição real)
    // 4. Servidor: 201 com dados
    //
    // TROUBLESHOOTING CORS:
    // - "CORS error": origin não está em CORS_ALLOWED_ORIGINS
    // - "Header not allowed": adicionar em allowedHeaders
    // - "Can't read header": adicionar em exposedHeaders
    this.app.use(cors({
      // Origens permitidas (domínios que podem acessar a API)
      // Formato: "http://domain1.com,https://domain2.com"
      origin: process.env.CORS_ALLOWED_ORIGINS || '*',

      // Métodos HTTP permitidos
      methods: ['GET', 'POST', 'PUT', 'DELETE'],

      // Headers que o cliente pode ENVIAR
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID'],

      // Headers que o cliente pode LER na resposta
      // Por padrão, navegadores só permitem ler headers padrão
      // Headers customizados precisam ser explicitamente expostos
      exposedHeaders: ['X-Correlation-ID'],
    }));

    // ============================================================================
    // 6. BODY PARSING - Processamento de Requisições
    // ============================================================================
    //
    // PROPÓSITO:
    // Converte o body das requisições de texto para objetos JavaScript
    // que podemos manipular no código.
    //
    // DOIS TIPOS DE PARSING:
    //
    // 1. express.json() - Para requisições com Content-Type: application/json
    //
    //    FUNCIONAMENTO:
    //    - Lê o body da requisição (raw bytes)
    //    - Faz parse JSON → objeto JavaScript
    //    - Armazena em req.body
    //
    //    LIMITE DE 10MB:
    //    Previne ataques de DoS onde atacante envia body gigante
    //    para consumir memória do servidor.
    //
    //    EXEMPLO:
    //    Body: { "nome": "João", "idade": 30 }
    //    req.body: { nome: "João", idade: 30 }
    //
    //    POR QUE 10MB?
    //    - 1MB seria pouco para uploads de imagens base64
    //    - 100MB seria risco de DoS
    //    - 10MB é bom balanço para a maioria dos casos
    //
    // 2. express.urlencoded() - Para requisições com Content-Type: application/x-www-form-urlencoded
    //
    //    FUNCIONAMENTO:
    //    - Lê o body da requisição
    //    - Faz parse URL-encoded → objeto JavaScript
    //    - Armazena em req.body
    //
    //    extended: true SIGNIFICA:
    //    - Usa biblioteca 'qs' (mais poderosa)
    //    - Permite objetos aninhados e arrays
    //    - Exemplo: user[name]=João → { user: { name: "João" } }
    //
    //    extended: false SERIA:
    //    - Usa biblioteca 'querystring' (mais simples)
    //    - Apenas valores escalares
    //    - Exemplo: user[name]=João → { 'user[name]': "João" }
    //
    //    POR QUE extended: true?
    //    Mais flexível e suporta estruturas complexas de formulários.
    //
    //    EXEMPLO:
    //    Body: nome=João&idade=30
    //    req.body: { nome: "João", idade: "30" }
    //
    // SEM ESTES PARSERS:
    // req.body seria undefined e teríamos que parsear manualmente.
    //
    // ORDEM IMPORTA?
    // Sim! Deve vir APÓS CORS (preflight requests não têm body).
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // ============================================================================
    // 7. COMPRESSÃO - Redução de Tamanho das Respostas
    // ============================================================================
    //
    // PROPÓSITO:
    // Comprime respostas HTTP com gzip/deflate/brotli para reduzir
    // tamanho dos dados trafegados e melhorar performance.
    //
    // COMO FUNCIONA:
    // 1. Cliente envia: Accept-Encoding: gzip, deflate
    // 2. Servidor comprime resposta com gzip
    // 3. Servidor envia: Content-Encoding: gzip
    // 4. Cliente descomprime automaticamente
    //
    // BENEFÍCIOS:
    // - Reduz bandwidth em até 70-90% para JSON/HTML
    // - Respostas mais rápidas (menos dados para transferir)
    // - Menor custo de bandwidth
    // - Melhor experiência do usuário
    //
    // EXEMPLO:
    // JSON sem compressão: 100KB
    // JSON com gzip: 15KB (85% de redução!)
    //
    // QUANDO COMPRIME?
    // - Response > 1KB (comprimir arquivos pequenos não vale a pena)
    // - Content-Type é comprimível (JSON, HTML, CSS, JS)
    // - Cliente suporta compressão (Accept-Encoding header)
    //
    // QUANDO NÃO COMPRIME?
    // - Response < 1KB (overhead não compensa)
    // - Já está comprimido (imagens, vídeos, PDFs)
    // - Cliente não suporta
    //
    // NÍVEL DE COMPRESSÃO:
    // Padrão (6) é bom balanço entre velocidade e tamanho.
    // - Nível 1: mais rápido, menos compressão
    // - Nível 9: mais lento, mais compressão
    //
    // IMPACTO DE NÃO TER COMPRESSÃO:
    // - Respostas 5-10x maiores
    // - Mais tempo de transferência
    // - Maior custo de bandwidth
    // - Pior performance em redes lentas
    //
    // TRADE-OFF:
    // - CPU: gasta mais processamento para comprimir
    // - Network: economiza largura de banda
    // - Para a maioria dos casos, trade-off vale a pena
    this.app.use(compression());

    // ============================================================================
    // 8. REQUEST TIMEOUT - Controle de Tempo Limite
    // ============================================================================
    //
    // PROPÓSITO:
    // Garante que requisições não fiquem travadas indefinidamente.
    // Previne recursos sendo ocupados por requests que nunca terminam.
    //
    // CONFIGURAÇÃO:
    // timeout('30s') = 30 segundos
    //
    // COMO FUNCIONA:
    // 1. Inicia timer quando requisição chega
    // 2. Se passar 30s sem resposta, seta req.timedout = true
    // 3. Próximo middleware verifica req.timedout
    // 4. Se true, não executa (permite handler de timeout tratar)
    //
    // POR QUE 30 SEGUNDOS?
    // - 5s seria muito pouco para queries complexas
    // - 60s seria muito tempo (usuário já desistiu)
    // - 30s é bom balanço:
    //   * Permite queries razoavelmente complexas
    //   * Não deixa recursos ocupados por muito tempo
    //   * Experiência aceitável para usuário
    //
    // ONDE É TRATADO?
    // No setupErrorHandling(), verificamos:
    // if (err.message === 'Response timeout' || req.timedout)
    // E retornamos 408 Request Timeout
    //
    // MIDDLEWARE SEGUINTE:
    // if (!req.timedout) next();
    //
    // POR QUE ESTE MIDDLEWARE?
    // Previne que middlewares subsequentes executem se já deu timeout.
    // Sem isso, continuariam processando uma requisição "morta".
    //
    // CENÁRIOS DE TIMEOUT:
    // - Query lenta no banco (> 30s)
    // - Chamada externa travada
    // - Deadlock no banco
    // - Bug em código (loop infinito)
    //
    // IMPACTO NO USUÁRIO:
    // Cliente recebe 408 com mensagem clara ao invés de ficar
    // esperando indefinidamente.
    //
    // EM PRODUÇÃO, CONSIDERE:
    // - Timeouts diferentes por rota (queries pesadas = mais tempo)
    // - Monitorar timeouts (se muitos = problema no código/banco)
    // - Ajustar baseado em métricas reais
    this.app.use(timeout('30s'));

    // Middleware que verifica se já deu timeout
    // Se deu timeout, não executa próximos middlewares
    // Permite que error handler trate o timeout adequadamente
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (!req.timedout) next();
    });

    // ============================================================================
    // 9. RATE LIMITING - Proteção Contra Abuso
    // ============================================================================
    //
    // PROPÓSITO:
    // Limita número de requisições por IP para prevenir:
    // - Ataques DDoS (Distributed Denial of Service)
    // - Brute force attacks
    // - Scraping abusivo
    // - Uso excessivo da API
    //
    // CONFIGURAÇÃO:
    // - windowMs: 15 minutos (janela de tempo)
    // - max: 100 requisições por IP nesta janela
    //
    // COMO FUNCIONA:
    // 1. Primeira requisição de IP: contador = 1
    // 2. Segunda requisição: contador = 2
    // ...
    // 101. Requisição: contador = 101 → BLOQUEIA (429 Too Many Requests)
    // 15 minutos depois: contador reseta para 0
    //
    // ALGORITMO:
    // Fixed Window Counter (janela fixa)
    // - Simples e eficiente
    // - Pode haver burst no início da janela
    //
    // ALTERNATIVAS:
    // - Sliding Window: mais preciso, mas mais complexo
    // - Token Bucket: permite bursts controlados
    //
    // POR QUE 100 REQUISIÇÕES EM 15 MINUTOS?
    // - 100/15min ≈ 6.67 req/min ≈ 1 req a cada 9 segundos
    // - Suficiente para uso normal de navegação
    // - Bloqueia scraping agressivo e ataques
    //
    // EM PRODUÇÃO, AJUSTE BASEADO EM:
    // - Comportamento real dos usuários
    // - Tipo de endpoint (auth = mais restritivo)
    // - SLAs e custos de infraestrutura
    //
    // HEADERS RETORNADOS:
    // - X-RateLimit-Limit: 100 (limite total)
    // - X-RateLimit-Remaining: 85 (quantas sobraram)
    // - X-RateLimit-Reset: 1234567890 (quando reseta)
    // - Retry-After: 900 (segundos até poder tentar de novo)
    //
    // RESPONSE QUANDO EXCEDE (429):
    // {
    //   "error": "Rate limit excedido",
    //   "message": "Muitas requisições. Tente novamente em alguns minutos.",
    //   "timestamp": "2025-10-06T12:00:00.000Z",
    //   "path": "/api/items",
    //   "correlationId": "abc-123"
    // }
    //
    // EXCEÇÃO PARA ADMIN:
    // API keys admin não sofrem rate limiting.
    // Permite operações administrativas sem restrições.
    //
    // ARMAZENAMENTO:
    // Por padrão, usa memória (MemoryStore).
    // Em cluster/múltiplos servidores, usar Redis:
    // const RedisStore = require('rate-limit-redis');
    // store: new RedisStore({ client: redisClient })
    //
    // LOGS:
    // Quando rate limit é excedido, loga com warning para
    // monitorar possíveis ataques ou problemas.
    const limiter = rateLimit({
      // Janela de tempo em milissegundos
      // 15 * 60 * 1000 = 900,000ms = 15 minutos
      windowMs: 15 * 60 * 1000,

      // Máximo de requisições permitidas nesta janela
      max: 100,

      // Mensagem retornada quando limite é excedido
      message: {
        error: 'Rate limit excedido',
        message: 'Muitas requisições deste IP. Tente novamente em alguns minutos.',
        retryAfter: '15 minutos'
      },

      // Adiciona headers padrão (X-RateLimit-*)
      standardHeaders: true,

      // Remove headers legados (X-RateLimit-*)
      // Mantém apenas headers padrão RateLimit-*
      legacyHeaders: false,

      // Handler customizado quando limite é excedido
      // Permite logar e retornar resposta customizada
      handler: (req: Request, res: Response) => {
        // Log de warning para monitorar possíveis ataques
        // Inclui IP, URL e correlation ID para investigação
        log.warn('Rate limit excedido', {
          correlationId: req.id,
          ip: req.ip,
          url: req.url
        });

        // Retorna 429 Too Many Requests com detalhes
        res.status(429).json({
          error: 'Rate limit excedido',
          message: 'Muitas requisições. Tente novamente em alguns minutos.',
          timestamp: new Date().toISOString(),
          path: req.url,
          correlationId: req.id
        });
      }
    });

    // Aplica rate limiting apenas em rotas /api/
    // Não aplica em /health, /metrics, /api-docs
    //
    // EXCEÇÃO PARA API KEYS ADMIN:
    // Se header X-API-Key é 'admin-key-superuser', pula rate limit.
    // Permite operações administrativas sem restrições.
    //
    // SEGURANÇA DA EXCEÇÃO:
    // A API key admin deve ser:
    // - Forte e aleatória (não 'admin-key-superuser' em produção!)
    // - Armazenada em variável de ambiente
    // - Rotacionada periodicamente
    // - Monitorada (alertar se usada demais)
    this.app.use('/api/', (req, res, next) => {
      // Verifica se tem API key de admin
      const apiKey = req.headers['x-api-key'];

      // Se é admin, pula rate limit
      if (apiKey === 'admin-key-superuser') {
        return next();
      }

      // Senão, aplica rate limit normalmente
      return limiter(req, res, next);
    });

  }

  /**
   * Configura todas as rotas da aplicação
   *
   * ORGANIZAÇÃO DAS ROTAS:
   * ---------------------
   * Rotas são registradas em ordem específica.
   * Mais específicas primeiro, catch-all por último.
   *
   * ORDEM DE REGISTRO:
   * -----------------
   * 1. /metrics       - Métricas Prometheus (sem middlewares extras)
   * 2. /health        - Health check do sistema
   * 3. /cache/*       - Gerenciamento de cache
   * 4. /api-docs      - Documentação Swagger
   * 5. /admin/*       - Rotas administrativas
   * 6. /api/*         - API principal do negócio
   * 7. /              - Rota raiz (informações da API)
   * 8. *              - 404 (catch-all, SEMPRE POR ÚLTIMO)
   *
   * POR QUE ESTA ORDEM?
   * ------------------
   * Express processa rotas na ordem de registro.
   * Se catch-all viesse primeiro, capturaria todas as rotas!
   *
   * EXEMPLO PROBLEMÁTICO:
   * ```
   * app.use('*', handle404);        // ← ERRADO: captura tudo
   * app.use('/api', apiRoutes);     // ← nunca executado!
   * ```
   *
   * EXEMPLO CORRETO:
   * ```
   * app.use('/api', apiRoutes);     // ← específico primeiro
   * app.use('*', handle404);        // ← catch-all por último
   * ```
   *
   * SEPARAÇÃO EM MÉTODOS:
   * --------------------
   * Cada grupo de rotas tem método próprio para:
   * - Melhor organização do código
   * - Facilitar manutenção
   * - Documentação mais clara
   * - Testes mais fáceis
   *
   * @private
   * @returns {void}
   */
  private setupRoutes(): void {
    // Métricas Prometheus (primeiro, sem middlewares adicionais)
    this.app.use('/metrics', metricsRoutes);

    // Health check do sistema
    this.setupHealthCheck();

    // Rotas de gerenciamento de cache
    this.setupCacheRoutes();

    // Documentação Swagger
    this.setupSwaggerDocs();

    // Rotas administrativas
    this.setupAdminRoutes()

    // API principal do negócio
    this.app.use('/api/lor0138/item/dadosCadastrais/informacoesGerais',
      informacoesGeraisRoutes
    );

    // Rota raiz (informações da API)
    this.setupRootRoute();

    // 404 - Rota não encontrada (SEMPRE POR ÚLTIMO)
    this.setup404Handler();
  }

  /**
   * Configura o endpoint de health check
   *
   * ============================================================================
   * HEALTH CHECK - Verificação de Saúde do Sistema
   * ============================================================================
   *
   * PROPÓSITO:
   * ---------
   * Endpoint que verifica se a aplicação está funcionando corretamente
   * e todos os serviços dependentes estão disponíveis.
   *
   * É USADO POR:
   * -----------
   * - Load balancers: para rotear tráfego apenas para instâncias saudáveis
   * - Kubernetes: liveness e readiness probes
   * - Monitoramento: alertar equipe se sistema está degradado
   * - DevOps: verificar se deploy foi bem-sucedido
   * - Testes automatizados: validar ambiente
   *
   * O QUE É VERIFICADO:
   * ------------------
   * 1. Banco de Dados:
   *    - Conectividade: consegue conectar?
   *    - Performance: quanto tempo demora para responder?
   *    - Tipo: SQL Server ou ODBC?
   *
   * 2. Cache:
   *    - Habilitado: está configurado para usar cache?
   *    - Estratégia: memory, redis ou layered?
   *    - Ready: está pronto para uso (especialmente Redis)?
   *
   * 3. Métricas:
   *    - Sistema de métricas está funcionando?
   *    - Endpoint /metrics está disponível?
   *
   * NÍVEIS DE SAÚDE:
   * ---------------
   * - HEALTHY (200): Tudo funcionando perfeitamente
   *   * Banco conectado
   *   * Cache funcionando (se habilitado)
   *   * Métricas disponíveis
   *
   * - UNHEALTHY (503): Sistema com problemas críticos
   *   * Banco desconectado OU
   *   * Cache não pronto (quando habilitado)
   *
   * MÉTRICAS COLETADAS:
   * ------------------
   * Durante o health check, registramos métricas:
   *
   * 1. healthCheckDuration:
   *    - Tempo de resposta do banco em segundos
   *    - Permite monitorar degradação de performance
   *    - Alerta se tempo > threshold
   *
   * 2. healthCheckStatus:
   *    - Status binário: 1 = ok, 0 = falha
   *    - Por componente: database, api
   *    - Permite alertas específicos
   *
   * EXEMPLO DE ALERTA:
   * ----------------
   * Se healthCheckStatus{component="database"} == 0 por > 1min
   * → Alerta crítico: "Banco de dados não está respondendo!"
   *
   * RESPONSE STRUCTURE:
   * ------------------
   * {
   *   "status": "healthy" | "unhealthy",
   *   "timestamp": "2025-10-06T12:00:00.000Z",
   *   "database": {
   *     "connected": true,
   *     "responseTime": 12,
   *     "status": "healthy",
   *     "type": "sqlserver"
   *   },
   *   "cache": {
   *     "enabled": true,
   *     "strategy": "layered",
   *     "ready": true
   *   },
   *   "metrics": {
   *     "enabled": true,
   *     "endpoint": "/metrics"
   *   }
   * }
   *
   * DOCUMENTAÇÃO SWAGGER:
   * --------------------
   * Endpoint completamente documentado com OpenAPI 3.0
   * incluindo todos os campos de resposta e status codes.
   *
   * @private
   * @returns {void}
   */
  private setupHealthCheck(): void {
    /**
     * @openapi
     * /health:
     *   get:
     *     summary: Health Check do Sistema
     *     description: |
     *       Verifica o status de saúde do sistema, incluindo:
     *       - Status geral (healthy/degraded/unhealthy)
     *       - Conectividade com banco de dados
     *       - Tempo de resposta do banco
     *       - Uso de memória da aplicação
     *       - Tempo de atividade (uptime)
     *       - **Correlation ID** para rastreamento
     *
     *       **Status possíveis:**
     *       - `healthy`: Sistema operacional (DB < 100ms)
     *       - `degraded`: Sistema lento (DB >= 100ms)
     *       - `unhealthy`: Sistema com falhas (DB não conectado)
     *     tags:
     *       - Health
     *     parameters:
     *       - in: header
     *         name: X-Correlation-ID
     *         schema:
     *           type: string
     *           format: uuid
     *         required: false
     *         description: Correlation ID para rastreamento (gerado automaticamente se não fornecido)
     *         example: '550e8400-e29b-41d4-a716-446655440000'
     *     responses:
     *       200:
     *         description: Sistema saudável ou degradado
     *         headers:
     *           X-Correlation-ID:
     *             description: Correlation ID da requisição
     *             schema:
     *               type: string
     *               format: uuid
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HealthCheck'
     *       503:
     *         description: Sistema não saudável
     *         headers:
     *           X-Correlation-ID:
     *             description: Correlation ID da requisição
     *             schema:
     *               type: string
     *               format: uuid
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HealthCheck'
     */
    this.app.get('/health', async (req, res) => {
      try {
        // ========================================================================
        // VERIFICAÇÃO DO BANCO DE DADOS
        // ========================================================================

        // Variáveis para armazenar resultado da verificação
        let dbConnected = false;     // Conseguiu conectar?
        let dbResponseTime = 0;      // Quanto tempo demorou?
        let dbType = 'unknown';      // SQL Server ou ODBC?

        try {
          // Marca timestamp de início para medir tempo de resposta
          const start = Date.now();

          // Obtém conexão do DatabaseManager
          // DatabaseManager é singleton que gerencia pool de conexões
          const connection = DatabaseManager.getConnection();

          // Executa query simples para testar conectividade
          // SELECT 1 é a query mais rápida possível
          // Não acessa tabelas, apenas testa se banco responde
          await connection.query('SELECT 1 as test');

          // Calcula tempo de resposta em milissegundos
          dbResponseTime = Date.now() - start;

          // Se chegou aqui, banco está conectado
          dbConnected = true;

          // Obtém informações sobre o tipo de conexão
          // Pode ser 'sqlserver', 'odbc' ou 'mock'
          const dbStatus = DatabaseManager.getConnectionStatus();
          dbType = dbStatus.type;

          // Registra métrica de tempo de resposta do banco
          // Converte ms para segundos (padrão Prometheus)
          // Label 'component' permite filtrar por componente
          metricsManager.healthCheckDuration.observe(
            { component: 'database' },
            dbResponseTime / 1000
          );

          // Registra métrica de status do banco
          // 1 = conectado, 0 = desconectado
          // Gauge permite visualizar status atual no Grafana
          metricsManager.healthCheckStatus.set(
            { component: 'database' },
            dbConnected ? 1 : 0
          );
        } catch (error) {
          // Se chegou aqui, falha na conexão com banco

          // Log de erro com detalhes para investigação
          log.error('Health check database error', { error });

          // Marca como desconectado
          dbConnected = false;

          // Registra métrica de falha
          // Alerta será disparado se status = 0 por muito tempo
          metricsManager.healthCheckStatus.set({ component: 'database' }, 0);
        }

        // ========================================================================
        // VERIFICAÇÃO DO CACHE
        // ========================================================================

        // Verifica se cache está habilitado
        // Por padrão é true, só desabilita se explicitamente false
        const cacheEnabled = process.env.CACHE_ENABLED !== 'false';

        // Obtém estratégia de cache configurada
        // 'memory': apenas L1 (node-cache)
        // 'redis': apenas L2 (Redis)
        // 'layered': L1 + L2 (recomendado)
        const cacheStrategy = process.env.CACHE_STRATEGY || 'memory';

        // Variável para armazenar se cache está pronto
        let cacheReady = false;

        // Só verifica cache se estiver habilitado
        if (cacheEnabled) {
          try {
            // Verifica se cache está pronto para uso
            // Especialmente importante para Redis (conexão assíncrona)
            // Memory cache sempre está pronto
            cacheReady = await CacheManager.isReady();
          } catch (error) {
            // Se falhou, loga mas não quebra health check
            log.error('Health check cache error', { error });
            cacheReady = false;
          }
        }

        // ========================================================================
        // DETERMINAÇÃO DO STATUS GERAL
        // ========================================================================

        // Sistema é healthy se:
        // - Banco está conectado E
        // - (Cache está desabilitado OU Cache está pronto)
        //
        // Lógica booleana:
        // dbConnected && (!cacheEnabled || cacheReady)
        //
        // Casos:
        // 1. DB ok, cache disabled → healthy ✓
        // 2. DB ok, cache enabled e ready → healthy ✓
        // 3. DB ok, cache enabled mas not ready → unhealthy ✗
        // 4. DB fail, qualquer cache → unhealthy ✗
        const isHealthy = dbConnected && (!cacheEnabled || cacheReady);

        // Status HTTP baseado em saúde
        // 200 = OK (healthy)
        // 503 = Service Unavailable (unhealthy)
        const statusCode = isHealthy ? 200 : 503;

        // Registra métrica de status geral da API
        // Permite monitorar disponibilidade geral do sistema
        metricsManager.healthCheckStatus.set(
          { component: 'api' },
          isHealthy ? 1 : 0
        );

        // ========================================================================
        // RESPOSTA DO HEALTH CHECK
        // ========================================================================

        res.status(statusCode).json({
          // Status geral do sistema
          status: isHealthy ? 'healthy' : 'unhealthy',

          // Timestamp ISO 8601 para rastreamento temporal
          timestamp: new Date().toISOString(),

          // Detalhes do banco de dados
          database: {
            connected: dbConnected,           // true/false
            responseTime: dbResponseTime,     // milissegundos
            status: dbConnected ? 'healthy' : 'unhealthy',
            type: dbType                      // sqlserver/odbc/mock
          },

          // Detalhes do cache
          cache: {
            enabled: cacheEnabled,            // true/false
            strategy: cacheStrategy,          // memory/redis/layered
            ready: cacheReady                 // true/false
          },

          // Informações sobre métricas
          metrics: {
            enabled: metricsManager.isReady(),  // true/false
            endpoint: '/metrics'                 // onde acessar
          }
        });

      } catch (error) {
        // ========================================================================
        // TRATAMENTO DE ERRO FATAL NO HEALTH CHECK
        // ========================================================================

        // Se chegou aqui, erro inesperado no próprio health check
        // (não erro de banco/cache, mas erro no código do health check)

        log.error('Health check fatal error', { error });

        // Registra métrica de falha total
        metricsManager.healthCheckStatus.set({ component: 'api' }, 0);

        // Retorna 503 com informação mínima
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  /**
   * Configura rotas de gerenciamento de cache
   *
   * ============================================================================
   * CACHE MANAGEMENT - Gerenciamento de Cache em Tempo Real
   * ============================================================================
   *
   * PROPÓSITO:
   * ---------
   * Fornece endpoints administrativos para monitorar, inspecionar
   * e controlar o sistema de cache da aplicação.
   *
   * CASOS DE USO:
   * ------------
   * 1. Monitoramento:
   *    - Verificar taxa de acerto (hit rate)
   *    - Identificar problemas de cache
   *    - Métricas de performance
   *
   * 2. Debug:
   *    - Ver quais chaves estão em cache
   *    - Inspecionar TTLs
   *    - Entender por que algo está ou não cacheado
   *
   * 3. Operações:
   *    - Limpar cache após deploy
   *    - Invalidar cache de dados atualizados
   *    - Forçar refresh de dados
   *
   * ENDPOINTS DISPONÍVEIS:
   * ---------------------
   *
   * 1. GET /cache/stats
   *    Retorna estatísticas de uso do cache
   *
   * 2. GET /cache/keys
   *    Lista todas as chaves em cache
   *
   * 3. POST /cache/clear
   *    Limpa todo o cache
   *
   * 4. DELETE /cache/invalidate/:pattern
   *    Invalida chaves por padrão (suporta wildcard)
   *
   * SEGURANÇA:
   * ---------
   * ⚠️ ATENÇÃO: Estes endpoints são administrativos!
   *
   * EM PRODUÇÃO, DEVE:
   * - Adicionar autenticação (API key)
   * - Restringir por IP (apenas rede interna)
   * - Adicionar rate limiting específico
   * - Logar todas as operações
   * - Alertar em operações destrutivas (clear)
   *
   * ATUALMENTE:
   * Endpoints são públicos (sem autenticação).
   * OK para desenvolvimento, INSEGURO para produção!
   *
   * @private
   * @returns {void}
   */
  private setupCacheRoutes(): void {
    // ========================================================================
    // GET /cache/stats - Estatísticas do Cache
    // ========================================================================
    /**
     * @openapi
     * /cache/stats:
     *   get:
     *     summary: Estatísticas do Cache
     *     description: |
     *       Retorna estatísticas de uso do cache:
     *       - Total de hits (acertos)
     *       - Total de misses (erros)
     *       - Taxa de acerto (hit rate)
     *       - Número de chaves em cache
     *       - Informações de configuração
     *     tags:
     *       - Cache
     *     responses:
     *       200:
     *         description: Estatísticas do cache
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 stats:
     *                   type: object
     *                   properties:
     *                     hits:
     *                       type: number
     *                     misses:
     *                       type: number
     *                     keys:
     *                       type: number
     *                     hitRate:
     *                       type: number
     *                 config:
     *                   type: object
     *                   properties:
     *                     stdTTL:
     *                       type: number
     *                     checkperiod:
     *                       type: number
     *                     enabled:
     *                       type: boolean
     *             example:
     *               stats:
     *                 hits: 150
     *                 misses: 30
     *                 keys: 45
     *                 hitRate: 83.33
     *               config:
     *                 stdTTL: 300
     *                 checkperiod: 600
     *                 enabled: true
     */
    this.app.get('/cache/stats', (req, res) => {
      try {
        // Obtém estatísticas do CacheManager
        // CacheManager internamente consulta node-cache.getStats()
        //
        // RETORNA:
        // {
        //   stats: {
        //     hits: número total de acertos
        //     misses: número total de erros
        //     keys: número de chaves em cache
        //     hitRate: taxa de acerto em %
        //   },
        //   config: {
        //     stdTTL: TTL padrão em segundos
        //     checkperiod: período de cleanup
        //     enabled: se cache está habilitado
        //   }
        // }
        //
        // INTERPRETAÇÃO:
        // - hitRate > 80%: cache está funcionando bem
        // - hitRate < 50%: revisar estratégia de cache
        // - keys crescendo: pode precisar de mais memória
        const stats = CacheManager.getStats();

        res.json(stats);
      } catch (error) {
        // Se falhar, retorna 500 com detalhes do erro
        res.status(500).json({
          error: 'Erro ao obter estatísticas de cache',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // ========================================================================
    // GET /cache/keys - Listar Chaves do Cache
    // ========================================================================
    /**
     * @openapi
     * /cache/keys:
     *   get:
     *     summary: Listar Chaves do Cache
     *     description: |
     *       Lista todas as chaves armazenadas no cache com seus TTLs.
     *       Útil para debug e monitoramento.
     *     tags:
     *       - Cache
     *     responses:
     *       200:
     *         description: Lista de chaves
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 keys:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       key:
     *                         type: string
     *                       ttl:
     *                         type: number
     *                 total:
     *                   type: number
     *             example:
     *               keys:
     *                 - key: 'item:7530110:informacoesGerais'
     *                   ttl: 1735995600000
     *                 - key: 'GET:/health'
     *                   ttl: 1735995630000
     *               total: 2
     */
    this.app.get('/cache/keys', async (req, res) => {
      try {
        // Aceita query parameter 'pattern' para filtrar chaves
        // Exemplo: /cache/keys?pattern=item:*
        // Se não fornecido, retorna todas as chaves
        const pattern = req.query.pattern as string | undefined;

        // Busca chaves no CacheManager
        // Se pattern fornecido, filtra apenas chaves que correspondem
        // Padrão suporta wildcard * (exemplo: item:*)
        const keys = await CacheManager.keys(pattern);

        // Retorna lista de chaves com contagem
        res.json({
          keys,              // Array de chaves
          count: keys.length // Total de chaves encontradas
        });
      } catch (error) {
        res.status(500).json({
          error: 'Erro ao listar chaves',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // ========================================================================
    // POST /cache/clear - Limpar Todo o Cache
    // ========================================================================
    /**
     * @openapi
     * /cache/clear:
     *   post:
     *     summary: Limpar Cache
     *     description: |
     *       Limpa todo o cache e reseta estatísticas.
     *       **ATENÇÃO**: Use com cuidado em produção!
     *     tags:
     *       - Cache
     *     responses:
     *       200:
     *         description: Cache limpo com sucesso
     *         content:
     *           application/json:
     *             example:
     *               message: 'Cache limpo com sucesso'
     *               keysRemoved: 45
     */
    this.app.post('/cache/clear', async (req, res) => {
      try {
        // ⚠️ OPERAÇÃO DESTRUTIVA!
        // Remove TODAS as chaves do cache
        // Reseta estatísticas (hits, misses)
        //
        // IMPACTO:
        // - Próximas requisições terão cache miss
        // - Aumento temporário de carga no banco
        // - Latência maior até cache "esquentar"
        //
        // QUANDO USAR:
        // - Após deploy com mudanças em queries
        // - Após atualização em massa de dados
        // - Para forçar refresh de dados stale
        // - Em testes (limpar entre testes)
        //
        // EM PRODUÇÃO:
        // - Adicionar autenticação
        // - Logar quem executou
        // - Alertar equipe
        // - Considerar invalidação seletiva ao invés de flush total
        await CacheManager.flush();

        res.json({
          success: true,
          message: 'Cache limpo com sucesso'
        });
      } catch (error) {
        res.status(500).json({
          error: 'Erro ao limpar cache',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // ========================================================================
    // DELETE /cache/invalidate/:pattern - Invalidar por Padrão
    // ========================================================================
    /**
     * @openapi
     * /cache/invalidate/{pattern}:
     *   delete:
     *     summary: Invalidar Cache por Padrão
     *     description: |
     *       Invalida cache usando padrão de chaves.
     *       Suporta wildcard (*).
     *
     *       Exemplos:
     *       - `item:*` - Todas as chaves de itens
     *       - `item:7530110:*` - Todas as chaves do item 7530110
     *       - `GET:/api/*` - Todas as requisições GET da API
     *     tags:
     *       - Cache
     *     parameters:
     *       - in: path
     *         name: pattern
     *         required: true
     *         schema:
     *           type: string
     *         description: Padrão de chaves (suporta *)
     *         examples:
     *           allItems:
     *             value: 'item:*'
     *             summary: Todos os itens
     *           singleItem:
     *             value: 'item:7530110:*'
     *             summary: Item específico
     *           apiRequests:
     *             value: 'GET:/api/*'
     *             summary: Todas as requisições GET
     *     responses:
     *       200:
     *         description: Cache invalidado
     *         content:
     *           application/json:
     *             example:
     *               message: 'Cache invalidado'
     *               pattern: 'item:*'
     *               keysRemoved: 12
     */
    this.app.delete('/cache/invalidate/:pattern', async (req, res) => {
      try {
        // Obtém padrão da URL
        // Exemplo: /cache/invalidate/item:* → pattern = "item:*"
        const pattern = req.params.pattern;

        // Invalida todas as chaves que correspondem ao padrão
        //
        // COMO FUNCIONA:
        // 1. CacheManager.keys(pattern) - busca chaves que correspondem
        // 2. Para cada chave encontrada, remove do cache
        // 3. Retorna número de chaves removidas
        //
        // EXEMPLOS DE PADRÕES:
        // - "item:*" → remove item:123, item:456, item:789
        // - "item:123:*" → remove item:123:info, item:123:estoque
        // - "GET:/api/*" → remove todas requests GET da API cacheadas
        //
        // VANTAGEM SOBRE FLUSH:
        // Invalidação seletiva ao invés de limpar tudo.
        // Mantém cache válido de outros dados.
        const deletedCount = await CacheManager.invalidate(pattern);

        res.json({
          success: true,
          deletedCount,    // Quantas chaves foram removidas
          pattern          // Padrão usado
        });
      } catch (error) {
        res.status(500).json({
          error: 'Erro ao invalidar cache',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
  }

  /**
   * Configura a documentação Swagger/OpenAPI
   *
   * ============================================================================
   * SWAGGER UI - Documentação Interativa da API
   * ============================================================================
   *
   * PROPÓSITO:
   * ---------
   * Fornece documentação visual e interativa da API onde
   * desenvolvedores podem:
   * - Ver todos os endpoints disponíveis
   * - Entender parâmetros e responses
   * - Testar requests diretamente no navegador
   * - Ver exemplos de uso
   * - Entender schemas de dados
   *
   * DOIS ENDPOINTS:
   * --------------
   * 1. GET /api-docs
   *    Interface visual do Swagger UI
   *    HTML interativo para explorar a API
   *
   * 2. GET /api-docs.json
   *    Especificação OpenAPI 3.0 em JSON
   *    Máquina-legível para gerar clients/SDKs
   *
   * GERAÇÃO AUTOMÁTICA:
   * ------------------
   * A documentação é gerada AUTOMATICAMENTE a partir das
   * anotações @openapi nos arquivos de código:
   *
   * - controllers/*.ts: documentação de endpoints
   * - routes/*.ts: definição de rotas
   * - types/*.ts: schemas de dados
   *
   * NÃO é necessário manter documentação separada!
   *
   * BENEFÍCIOS:
   * ----------
   * - Documentação sempre atualizada (código = docs)
   * - Testes interativos (Swagger UI)
   * - Geração de clients (usando openapi-generator)
   * - Validação de schemas
   * - Onboarding mais rápido de devs
   *
   * CUSTOMIZAÇÕES:
   * -------------
   * - Topbar removida via CSS customizado
   * - Favicon e título customizados
   * - Tema e cores podem ser ajustados
   *
   * SEGURANÇA:
   * ---------
   * ⚠️ CSP desabilitado no Helmet para Swagger funcionar!
   *
   * Swagger UI precisa:
   * - Carregar scripts inline
   * - Carregar estilos inline
   * - Fazer requests para o próprio servidor
   *
   * CSP estrito bloquearia tudo isso.
   *
   * SOLUÇÃO PARA PRODUÇÃO:
   * - Servir Swagger em subdomínio separado
   * - Ou usar CSP com nonces/hashes
   * - Ou desabilitar Swagger em produção
   *
   * @private
   * @returns {void}
   */
  private setupSwaggerDocs(): void {
    // Registra rotas do Swagger UI
    //
    // swaggerUi.serve: array de middlewares para servir assets estáticos
    // (HTML, CSS, JS, imagens do Swagger UI)
    //
    // swaggerUi.setup: middleware que gera a página HTML com a documentação
    // Recebe a especificação OpenAPI e opções de customização
    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, swaggerUiOptions)
    );

    // Endpoint alternativo que retorna a especificação em JSON puro
    //
    // USADO POR:
    // - Ferramentas de geração de código (openapi-generator)
    // - CLIs que consomem APIs
    // - Validadores de schema
    // - Ferramentas de teste automatizado
    //
    // EXEMPLO DE USO:
    // $ curl http://localhost:3000/api-docs.json > api-spec.json
    // $ openapi-generator generate -i api-spec.json -g typescript-fetch
    this.app.get('/api-docs.json', (req: Request, res: Response) => {
      // Define Content-Type correto
      // Importante para ferramentas que consomem a spec
      res.setHeader('Content-Type', 'application/json');

      // Envia especificação OpenAPI 3.0
      // swaggerSpec foi gerado pelo swagger-jsdoc a partir das anotações
      res.send(swaggerSpec);
    });

    // Log informativo para indicar onde acessar a documentação
    log.info('📚 Documentação Swagger disponível em /api-docs');
  }

  /**
   * Configura rotas administrativas
   *
   * ============================================================================
   * ADMIN ROUTES - Gerenciamento e Administração
   * ============================================================================
   *
   * PROPÓSITO:
   * ---------
   * Rotas administrativas para gerenciar:
   * - API Keys (gerar, revogar, listar)
   * - Rate limiting (ver stats, resetar)
   * - Usuários (atualizar tier/permissões)
   *
   * TODAS AS ROTAS SOB /admin/*:
   * ---------------------------
   * - /admin/api-keys - Gerenciamento de API keys
   * - /admin/rate-limit - Estatísticas de rate limiting
   * - /admin/users - Gerenciamento de usuários
   *
   * SEGURANÇA:
   * ---------
   * ⚠️ CRÍTICO: Rotas administrativas são SENSÍVEIS!
   *
   * AUTENTICAÇÃO:
   * Todas as rotas requerem:
   * 1. API Key válida (header X-API-Key)
   * 2. Tier = 'admin' (verificado no controller)
   *
   * AUTORIZAÇÃO:
   * Apenas usuários com tier ADMIN podem:
   * - Gerar novas API keys
   * - Revogar keys de outros usuários
   * - Ver estatísticas globais
   * - Resetar rate limits
   * - Alterar tiers de usuários
   *
   * AUDITORIA:
   * Todas as ações administrativas devem ser:
   * - Logadas com correlation ID
   * - Incluir quem executou
   * - Timestamp
   * - Ação executada
   * - Resultado
   *
   * EXEMPLO DE LOG:
   * {
   *   "level": "info",
   *   "message": "API Key gerada",
   *   "correlationId": "abc-123",
   *   "admin": "user-001",
   *   "action": "generate_api_key",
   *   "targetUser": "user-999",
   *   "tier": "premium"
   * }
   *
   * EM PRODUÇÃO:
   * - Restringir por IP (apenas rede interna)
   * - Rate limiting específico para admin
   * - Autenticação multi-fator
   * - Alertas em Slack/Email para ações críticas
   *
   * @private
   * @returns {void}
   */
  private setupAdminRoutes(): void {
    // Registra todas as rotas administrativas sob /admin
    // adminRoutes é um Router do Express definido em admin.routes.ts
    //
    // ROTAS INCLUÍDAS:
    // POST   /admin/api-keys/generate - Gerar nova API key
    // GET    /admin/api-keys - Listar API keys
    // POST   /admin/api-keys/:key/revoke - Revogar API key
    // GET    /admin/rate-limit/stats - Stats de rate limiting
    // POST   /admin/rate-limit/reset/:userId - Resetar rate limit
    // PUT    /admin/users/:userId/tier - Atualizar tier do usuário
    this.app.use('/admin', adminRoutes);

    // Log informativo
    log.info('🔑 Rotas de administração disponíveis em /admin');
  }

  /**
   * Configura a rota raiz
   *
   * ============================================================================
   * ROOT ROUTE - Informações da API
   * ============================================================================
   *
   * PROPÓSITO:
   * ---------
   * Endpoint de descoberta da API que fornece:
   * - Informações básicas (nome, versão)
   * - Links para recursos úteis
   * - Lista de endpoints principais
   * - Correlation ID da requisição
   *
   * CASOS DE USO:
   * ------------
   * 1. API Discovery:
   *    Cliente não sabe nada sobre a API →
   *    Acessa / → recebe links para tudo
   *
   * 2. Health Check Básico:
   *    Verificar se API está respondendo sem
   *    fazer query no banco (mais leve que /health)
   *
   * 3. Onboarding:
   *    Novo dev acessa / → vê onde está a documentação
   *
   * 4. Debugging:
   *    API está UP? Acessa / e vê correlation ID
   *
   * PADRÃO HATEOAS:
   * --------------
   * Hypermedia As The Engine Of Application State
   *
   * Resposta inclui links para próximos passos:
   * - documentation: onde ver endpoints
   * - health: onde verificar saúde
   * - metrics: onde ver métricas
   * - endpoints: quais endpoints existem
   *
   * Cliente pode "navegar" pela API seguindo links!
   *
   * RESPONSE EXAMPLE:
   * ----------------
   * {
   *   "message": "Datasul API",
   *   "version": "1.0.0",
   *   "documentation": "/api-docs",
   *   "health": "/health",
   *   "metrics": "/metrics",
   *   "endpoints": {
   *     "informacoesGerais": "/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo"
   *   },
   *   "correlationId": "abc-123"
   * }
   *
   * @private
   * @returns {void}
   */
  private setupRootRoute(): void {
    /**
     * @openapi
     * /:
     *   get:
     *     summary: Informações da API
     *     description: |
     *       Retorna informações básicas sobre a API e links úteis para navegação.
     *       Inclui **Correlation ID** para rastreamento de requisições.
     *     tags:
     *       - Health
     *     parameters:
     *       - in: header
     *         name: X-Correlation-ID
     *         schema:
     *           type: string
     *           format: uuid
     *         required: false
     *         description: Correlation ID para rastreamento
     *     responses:
     *       200:
     *         description: Informações da API
     *         headers:
     *           X-Correlation-ID:
     *             description: Correlation ID da requisição
     *             schema:
     *               type: string
     *               format: uuid
     *         content:
     *           application/json:
     *             example:
     *               message: 'Datasul API'
     *               version: '1.0.0'
     *               documentation: '/api-docs'
     *               health: '/health'
     *               endpoints:
     *                 informacoesGerais: '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo'
     *               correlationId: '550e8400-e29b-41d4-a716-446655440000'
     */
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Datasul API',
        version: '1.0.0',
        documentation: '/api-docs',
        health: '/health',
        metrics: '/metrics',
        endpoints: {
          informacoesGerais: '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo'
        },
        correlationId: req.id
      });
    });
  }

  /**
   * Configura o handler de rotas não encontradas (404)
   *
   * ============================================================================
   * 404 HANDLER - Rotas Não Encontradas
   * ============================================================================
   *
   * PROPÓSITO:
   * ---------
   * Catch-all que captura requisições para rotas que não existem.
   * DEVE ser registrado APÓS todas as outras rotas.
   *
   * POR QUE É IMPORTANTE?
   * --------------------
   * Sem este handler, Express retornaria HTML padrão do 404,
   * o que não é apropriado para uma API REST (deve retornar JSON).
   *
   * COMO FUNCIONA:
   * -------------
   * Express tenta corresponder requisição às rotas registradas
   * na ordem de registro. Se nenhuma corresponder, chega aqui.
   *
   * ORDEM IMPORTA:
   * -------------
   * ✅ CORRETO:
   * app.use('/api/items', itemsRoutes);    // Rotas específicas
   * app.use('*', handle404);                // Catch-all por último
   *
   * ❌ ERRADO:
   * app.use('*', handle404);                // Catch-all primeiro
   * app.use('/api/items', itemsRoutes);    // Nunca executado!
   *
   * INFORMAÇÕES RETORNADAS:
   * ----------------------
   * - Mensagem clara do erro
   * - Método e path solicitados
   * - Lista de rotas disponíveis
   * - Correlation ID para rastreamento
   * - Timestamp
   *
   * BENEFÍCIOS:
   * ----------
   * - Cliente entende que rota não existe
   * - Recebe lista de rotas disponíveis (discovery)
   * - Pode corrigir erro facilmente
   * - Logs permitem identificar problemas
   *
   * MONITORAMENTO:
   * -------------
   * Log com warning para monitorar:
   * - Rotas frequentemente acessadas que não existem
   * - Possíveis problemas no cliente
   * - Tentativas de ataque (scanning)
   *
   * SE MUITOS 404s:
   * - Cliente está usando rotas antigas? → comunicar mudança
   * - Documentação desatualizada? → atualizar
   * - Ataque/scanning? → bloquear IP
   *
   * @private
   * @returns {void}
   */
  private setup404Handler(): void {
    this.app.use((req: Request, res: Response) => {
      // Log de warning com detalhes da requisição não encontrada
      // Útil para monitorar rotas que clientes tentam acessar
      log.warn('Rota não encontrada', {
        correlationId: req.id,
        method: req.method,
        url: req.url
      });

      // Retorna 404 Not Found com JSON descritivo
      res.status(404).json({
        error: 'Rota não encontrada',
        message: `A rota ${req.method} ${req.url} não existe`,
        timestamp: new Date().toISOString(),
        path: req.url,
        correlationId: req.id,

        // Lista de rotas disponíveis para ajudar cliente
        // API discovery: cliente descobre o que está disponível
        availableRoutes: {
          documentation: '/api-docs',
          health: '/health',
          metrics: '/metrics',
          api: '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo'
        }
      });
    });
  }

  /**
   * Configura o tratamento global de erros
   *
   * ============================================================================
   * ERROR HANDLING - Tratamento Global de Erros
   * ============================================================================
   *
   * PROPÓSITO:
   * ---------
   * Middleware especial que captura TODOS os erros não tratados
   * e retorna respostas apropriadas ao cliente.
   *
   * ⚠️ DEVE SER O ÚLTIMO MIDDLEWARE REGISTRADO!
   *
   * COMO FUNCIONA:
   * -------------
   * Quando qualquer middleware/rota chama next(error) ou lança
   * uma exceção, Express pula todos os middlewares normais e
   * vai direto para este error handler.
   *
   * ASSINATURA ESPECIAL:
   * -------------------
   * Error handlers no Express TÊM 4 PARÂMETROS:
   * (err, req, res, next)
   *
   * Middlewares normais têm 3: (req, res, next)
   *
   * Express identifica error handlers pelo número de parâmetros!
   *
   * TIPOS DE ERROS TRATADOS:
   * ------------------------
   *
   * 1. TIMEOUT (408):
   *    - Requisição excedeu tempo limite
   *    - Causas: query lenta, deadlock, código travado
   *    - Response: "A requisição demorou muito"
   *
   * 2. AppError (variável):
   *    - Erros customizados da aplicação
   *    - Têm statusCode, isOperational, context
   *    - Exemplos: ItemNotFoundError (404), ValidationError (400)
   *    - Response: usa statusCode e context do erro
   *
   * 3. Generic Error (500):
   *    - Erros não tratados (bugs)
   *    - Não são AppError
   *    - Provavelmente bugs no código
   *    - Response: "Erro interno" (esconde detalhes em prod)
   *
   * LOGGING:
   * -------
   * Diferentes níveis baseado no tipo:
   *
   * - AppError operacional: WARNING
   *   (esperados, parte do fluxo normal)
   *
   * - AppError não operacional: ERROR
   *   (bugs, problemas críticos)
   *
   * - Generic errors: ERROR
   *   (sempre bugs que precisam ser corrigidos)
   *
   * DESENVOLVIMENTO vs PRODUÇÃO:
   * ---------------------------
   *
   * DESENVOLVIMENTO:
   * - Retorna mensagem completa do erro
   * - Inclui stack trace
   * - Mostra detalhes técnicos
   *
   * PRODUÇÃO:
   * - Mensagem genérica para erros 500
   * - SEM stack trace (segurança)
   * - Detalhes apenas em logs
   *
   * POR QUE ESCONDER DETALHES EM PRODUÇÃO?
   * - Stack traces revelam estrutura de código
   * - Mensagens de erro podem ter info sensível
   * - Atacantes usam erros para mapear vulnerabilidades
   *
   * CORRELAÇÃO COM LOGS:
   * -------------------
   * Todo erro inclui correlation ID.
   * Cliente reporta erro com ID →
   * Equipe busca logs pelo ID →
   * Vê stack trace completo
   *
   * @private
   * @returns {void}
   */
  private setupErrorHandling(): void {
    // Error handler: middleware com 4 parâmetros
    // err: o erro que foi lançado/passado para next()
    // req: objeto da requisição
    // res: objeto da resposta
    // next: função para passar para próximo error handler (se houver)
    this.app.use((err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
      // ========================================================================
      // TIPO 1: TIMEOUT ERROR
      // ========================================================================

      // Verifica se é erro de timeout
      // Timeout pode ser identificado de duas formas:
      // 1. err.message === 'Response timeout'
      // 2. req.timedout === true (setado pelo timeout middleware)
      if (err.message === 'Response timeout' || req.timedout) {
        return res.status(408).json({
          error: 'Timeout',
          message: 'A requisição demorou muito tempo para ser processada',
          timestamp: new Date().toISOString(),
          path: req.url,
          correlationId: req.id
        });
      }

      // ========================================================================
      // TIPO 2: AppError (ERROS CUSTOMIZADOS)
      // ========================================================================

      // Verifica se é instância de AppError
      // AppError é nossa classe base para erros customizados
      // Tem: statusCode, isOperational, context, name, message
      if (err instanceof AppError) {
        // Monta objeto de resposta base
        const response: any = {
          error: err.name,             // Nome da classe do erro
          message: err.message,         // Mensagem descritiva
          timestamp: new Date().toISOString(),
          path: req.url,
          correlationId: req.id
        };

        // Adiciona context como details se existir
        // Context contém informações específicas do erro
        // Exemplo: { itemCodigo: "123", estabCodigo: "01.01" }
        if (err.context) {
          response.details = err.context;
        }

        // Log apropriado baseado em se é operacional ou não

        // ERRO OPERACIONAL:
        // Esperado, parte do fluxo normal da aplicação
        // Exemplos: item não encontrado, validação falhou
        // Log level: WARNING (não é crítico)
        if (err.isOperational) {
          log.warn('Erro operacional', {
            correlationId: req.id,
            error: err.name,
            message: err.message,
            statusCode: err.statusCode,
            context: err.context
          });
        }
        // ERRO NÃO OPERACIONAL:
        // Inesperado, provavelmente bug no código
        // Exemplos: null pointer, type error dentro de AppError
        // Log level: ERROR (crítico, precisa ser corrigido)
        else {
          log.error('Erro crítico', {
            correlationId: req.id,
            error: err.name,
            message: err.message,
            statusCode: err.statusCode,
            stack: err.stack,          // Stack trace completo
            context: err.context
          });
        }

        // Retorna resposta com statusCode do erro
        // AppError define o statusCode apropriado:
        // - ItemNotFoundError: 404
        // - ValidationError: 400
        // - DatabaseError: 500
        // - etc.
        return res.status(err.statusCode).json(response);
      }

      // ========================================================================
      // TIPO 3: ERRO GENÉRICO (BUGS NÃO TRATADOS)
      // ========================================================================

      // Se chegou aqui, é um erro que não esperávamos
      // Provavelmente um bug no código:
      // - TypeError: cannot read property of undefined
      // - ReferenceError: variable is not defined
      // - SyntaxError: unexpected token
      // - etc.

      // Log completo com ERROR level
      // Stack trace é ESSENCIAL para debugar
      log.error('Erro não tratado', {
        correlationId: req.id,
        error: err.message,
        stack: err.stack,            // Stack trace completo
        url: req.url,
        method: req.method
      });

      // Mensagem para o cliente
      // PRODUÇÃO: mensagem genérica (segurança)
      // DESENVOLVIMENTO: mensagem real do erro (debug)
      res.status(500).json({
        error: 'Erro interno',
        message: process.env.NODE_ENV === 'production'
          ? 'Ocorreu um erro ao processar sua requisição'
          : err.message,
        timestamp: new Date().toISOString(),
        path: req.url,
        correlationId: req.id
      });
    });
  }

  /**
   * Retorna a instância do Express Application
   *
   * ============================================================================
   * getExpressApp - Acesso à Aplicação Express
   * ============================================================================
   *
   * PROPÓSITO:
   * ---------
   * Fornece acesso público à instância configurada do Express.
   *
   * CASOS DE USO:
   * ------------
   *
   * 1. TESTES:
   *    ```typescript
   *    import request from 'supertest';
   *    import app from './app';
   *
   *    const expressApp = app.getExpressApp();
   *
   *    it('should return 200', async () => {
   *      await request(expressApp)
   *        .get('/health')
   *        .expect(200);
   *    });
   *    ```
   *
   * 2. SERVER.TS:
   *    ```typescript
   *    import { App } from './app';
   *
   *    const app = new App();
   *    const server = app.getExpressApp().listen(3000);
   *    ```
   *
   * 3. CONFIGURAÇÕES ADICIONAIS:
   *    ```typescript
   *    const app = new App();
   *    const expressApp = app.getExpressApp();
   *
   *    // Adicionar middleware extra
   *    expressApp.use(customMiddleware);
   *    ```
   *
   * POR QUE É PÚBLICO?
   * -----------------
   * Permite que server.ts e testes acessem a aplicação
   * configurada sem precisar reconfigurar tudo.
   *
   * ENCAPSULAMENTO:
   * --------------
   * Apesar de público, é o único ponto de acesso.
   * Toda a configuração interna permanece privada.
   *
   * @public
   * @returns {Application} Instância configurada do Express
   */
  public getExpressApp(): Application {
    return this.app;
  }
}

// ============================================================================
// EXPORT DA APLICAÇÃO
// ============================================================================

// Cria UMA ÚNICA instância da aplicação (Singleton pattern no uso)
// Todas as importações de './app' receberão a MESMA instância
const appInstance = new App();

// Exporta a aplicação Express configurada como default export
// Permite importar diretamente: import app from './app'
export default appInstance.getExpressApp();