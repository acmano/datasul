// @ts-nocheck
// src/app.ts
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

// ✅ ÚNICA MUDANÇA: Importar classes de erro do sistema unificado
import { AppError } from '@shared/errors';

// ✅ NOVO: Imports para métricas
import { metricsMiddleware } from '@shared/middlewares/metrics.middleware';
import { MetricsManager, metricsManager } from '@infrastructure/metrics/MetricsManager';
import metricsRoutes from './api/metrics/routes';

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    
    // ✅ NOVO: Inicializar métricas ANTES dos middlewares
    this.initializeMetrics();
    
    // Configura middlewares
    this.setupMiddlewares();
    
    // Configura rotas
    this.setupRoutes();
    
    // Configura tratamento de erros
    this.setupErrorHandling();
  }

  // ✅ NOVO: Método para inicializar métricas
  private initializeMetrics(): void {
    try {
      MetricsManager.getInstance();
      log.info('✅ Sistema de métricas inicializado');
    } catch (error) {
      log.error('Erro ao inicializar métricas', { error });
    }
  }

  private setupMiddlewares(): void {
    // ✅ 1. Correlation ID - DEVE ser o PRIMEIRO middleware
    this.app.use(correlationIdMiddleware);

    // ✅ NOVO: 2. Métricas - logo após Correlation ID
    this.app.use(metricsMiddleware);

    // 3. Logging de requisições
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      // ✅ CORREÇÃO 2: Definir startTime
      req.startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - ( req.startTime || 0 );
        
        log.info('HTTP Request', {
          correlationId: req.id,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: duration,
          userAgent: req.get('user-agent'),
        });
      });

      next();
    });

    // 4. Security headers
    this.app.use(helmet({
      contentSecurityPolicy: false, // Desabilita CSP para Swagger funcionar
    }));

    // 5. CORS
    this.app.use(cors({
      origin: process.env.CORS_ALLOWED_ORIGINS || '*', // ✅ CORREÇÃO 1: CORS_ALLOWED_ORIGINS
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID'],
      exposedHeaders: ['X-Correlation-ID'], // Permite cliente ler o header
    }));

    // 6. Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 7. Compressão de resposta
    this.app.use(compression());

    // 8. Request timeout
    this.app.use(timeout('30s'));
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (!req.timedout) next();
    });

    // 9. Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // limite de 100 requisições por IP
      message: {
        error: 'Rate limit excedido',
        message: 'Muitas requisições deste IP. Tente novamente em alguns minutos.',
        retryAfter: '15 minutos'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        log.warn('Rate limit excedido', {
          correlationId: req.id,
          ip: req.ip,
          url: req.url
        });
        res.status(429).json({
          error: 'Rate limit excedido',
          message: 'Muitas requisições. Tente novamente em alguns minutos.',
          timestamp: new Date().toISOString(),
          path: req.url,
          correlationId: req.id
        });
      }
    });

    this.app.use('/api/', (req, res, next) => {
      // Se tem API key admin, pula rate limit
      const apiKey = req.headers['x-api-key'];
      if (apiKey === 'admin-key-superuser') {
        return next();
      }
      // Senão, aplica rate limit
      return limiter(req, res, next);
    });
    
  }

  private setupRoutes(): void {
    // ✅ NOVO: Rota de métricas (PRIMEIRO - antes de tudo)
    this.app.use('/metrics', metricsRoutes);

    // Health check
    this.setupHealthCheck();

    // Configura rotas de cache
    this.setupCacheRoutes();

    // Documentação Swagger
    this.setupSwaggerDocs();

    this.setupAdminRoutes()

    // Rotas da API
    this.app.use('/api/lor0138/item/dadosCadastrais/informacoesGerais', 
      informacoesGeraisRoutes
    );

    // Rota raiz com documentação
    this.setupRootRoute();

    // 404 - Rota não encontrada
    this.setup404Handler();
  }

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
      // Verificar banco de dados
      let dbConnected = false;
      let dbResponseTime = 0;
      let dbType = 'unknown';

      try {
        const start = Date.now();
        const connection = DatabaseManager.getConnection();
        await connection.query('SELECT 1 as test');
        dbResponseTime = Date.now() - start;
        dbConnected = true;
        
        const dbStatus = DatabaseManager.getConnectionStatus();
        dbType = dbStatus.type;

        // ✅ NOVO: Registrar métrica de health check do database
        metricsManager.healthCheckDuration.observe(
          { component: 'database' },
          dbResponseTime / 1000
        );
        metricsManager.healthCheckStatus.set(
          { component: 'database' },
          dbConnected ? 1 : 0
        );
      } catch (error) {
        log.error('Health check database error', { error });
        dbConnected = false;
        // ✅ NOVO: Registrar falha
        metricsManager.healthCheckStatus.set({ component: 'database' }, 0);
      }

      // Verificar cache
      const cacheEnabled = process.env.CACHE_ENABLED !== 'false';
      const cacheStrategy = process.env.CACHE_STRATEGY || 'memory';
      let cacheReady = false;

      if (cacheEnabled) {
        try {
          cacheReady = await CacheManager.isReady();
        } catch (error) {
          log.error('Health check cache error', { error });
          cacheReady = false;
        }
      }

      // Determinar status
      const isHealthy = dbConnected && (!cacheEnabled || cacheReady);
      const statusCode = isHealthy ? 200 : 503;

      // ✅ NOVO: Registrar status geral da API
      metricsManager.healthCheckStatus.set(
        { component: 'api' },
        isHealthy ? 1 : 0
      );

      res.status(statusCode).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: dbConnected,
          responseTime: dbResponseTime,
          status: dbConnected ? 'healthy' : 'unhealthy',
          type: dbType
        },
        cache: {
          enabled: cacheEnabled,
          strategy: cacheStrategy,
          ready: cacheReady
        },
        // ✅ NOVO: Informação sobre métricas
        metrics: {
          enabled: metricsManager.isReady(),
          endpoint: '/metrics'
        }
      });

    } catch (error) {
      log.error('Health check fatal error', { error });
      
      // ✅ NOVO: Registrar falha total
      metricsManager.healthCheckStatus.set({ component: 'api' }, 0);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
 }

  private setupCacheRoutes(): void {
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
          const stats = CacheManager.getStats();
          res.json(stats);
        } catch (error) {
          res.status(500).json({
            error: 'Erro ao obter estatísticas de cache',
            message: error instanceof Error ? error.message : String(error)
          });
        }
      });
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
          const pattern = req.query.pattern as string | undefined;
          const keys = await CacheManager.keys(pattern);
          res.json({ keys, count: keys.length });
        } catch (error) {
          res.status(500).json({
            error: 'Erro ao listar chaves',
            message: error instanceof Error ? error.message : String(error)
          });
        }
      });

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
          const pattern = req.params.pattern;
          const deletedCount = await CacheManager.invalidate(pattern);
          res.json({ 
            success: true, 
            deletedCount,
            pattern 
          });
        } catch (error) {
          res.status(500).json({
            error: 'Erro ao invalidar cache',
            message: error instanceof Error ? error.message : String(error)
          });
        }
      });
}

  private setupSwaggerDocs(): void {
    // Serve Swagger UI
    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, swaggerUiOptions)
    );

    // Serve OpenAPI spec em JSON
    this.app.get('/api-docs.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    log.info('📚 Documentação Swagger disponível em /api-docs');
  }

  
  private setupAdminRoutes(): void {
    this.app.use('/admin', adminRoutes);
    log.info('🔑 Rotas de administração disponíveis em /admin');
  }

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
        metrics: '/metrics', // ✅ NOVO
        endpoints: {
          informacoesGerais: '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo'
        },
        correlationId: req.id
      });
    });
  }

  private setup404Handler(): void {
    this.app.use((req: Request, res: Response) => {
      log.warn('Rota não encontrada', {
        correlationId: req.id,
        method: req.method,
        url: req.url
      });
      
      res.status(404).json({
        error: 'Rota não encontrada',
        message: `A rota ${req.method} ${req.url} não existe`,
        timestamp: new Date().toISOString(),
        path: req.url,
        correlationId: req.id,
        availableRoutes: {
          documentation: '/api-docs',
          health: '/health',
          metrics: '/metrics', // ✅ NOVO
          api: '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo'
        }
      });
    });
  }

  private setupErrorHandling(): void {
    // ✅ MUDANÇA: Error handler melhorado usando AppError
    this.app.use((err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
      // Timeout error
      if (err.message === 'Response timeout' || req.timedout) {
        return res.status(408).json({
          error: 'Timeout',
          message: 'A requisição demorou muito tempo para ser processada',
          timestamp: new Date().toISOString(),
          path: req.url,
          correlationId: req.id
        });
      }

      // Se for AppError (do sistema unificado), usa statusCode e context
      if (err instanceof AppError) {
        const response: any = {
          error: err.name,
          message: err.message,
          timestamp: new Date().toISOString(),
          path: req.url,
          correlationId: req.id
        };

        // Adiciona context como details se existir
        if (err.context) {
          response.details = err.context;
        }

        // Log apropriado
        if (err.isOperational) {
          log.warn('Erro operacional', {
            correlationId: req.id,
            error: err.name,
            message: err.message,
            statusCode: err.statusCode,
            context: err.context
          });
        } else {
          log.error('Erro crítico', {
            correlationId: req.id,
            error: err.name,
            message: err.message,
            statusCode: err.statusCode,
            stack: err.stack,
            context: err.context
          });
        }

        return res.status(err.statusCode).json(response);
      }

      // Erro genérico não tratado
      log.error('Erro não tratado', {
        correlationId: req.id,
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
      });

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

  public getExpressApp(): Application {
    return this.app;
  }
}

// ✅ Export default da instância
const appInstance = new App();
export default appInstance.getExpressApp();