// src/app.ts

/**
 * Aplicação Express Principal
 * @module App
 * @since 1.0.0
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
import { tracingMiddleware } from '@shared/middlewares/tracing.middleware';
import { startTracing } from '@infrastructure/tracing/tracer';
import itemSearchRoutes from '@/item/search/routes';
import itemInformacoesGeraisRoutes from '@/item/dadosCadastrais/informacoesGerais/routes';
import itemDimensoesRoutes from '@/item/dadosCadastrais/dimensoes/routes';
import itemPlanejamentoRoutes from '@/item/dadosCadastrais/planejamento/routes';
import itemFiscalRoutes from '@/item/dadosCadastrais/fiscal/routes';
import itemManufaturaRoutes from '@/item/dadosCadastrais/manufatura/routes';
import itemExtensaoRoutes from '@/item/extensao/routes';
import estabelecimentoRoutes from '@/estabelecimento/dadosCadastrais/informacoesGerais/routes';
import estabelecimentoListarRoutes from '@/estabelecimento/listar/routes';
import familiaInformacoesGeraisRoutes from '@/familia/dadosCadastrais/informacoesGerais/routes';
import familiaComercialInformacoesGeraisRoutes from '@/familiaComercial/dadosCadastrais/informacoesGerais/routes';
import grupoDeEstoqueInformacoesGeraisRoutes from '@/grupoDeEstoque/dadosCadastrais/informacoesGerais/routes';
import familiaListarRoutes from '@/familia/listar/routes';
import familiaComercialListarRoutes from '@/familiaComercial/listar/routes';
import grupoDeEstoqueListarRoutes from '@/grupoDeEstoque/listar/routes';
import depositoListarRoutes from '@/deposito/listar/routes';
import depositoInformacoesGeraisRoutes from '@/deposito/dadosCadastrais/informacoesGerais/routes';
import itemEmpresasRoutes from '@/item/empresas/routes';
import estruturaInformacoesGeraisRoutes from '@engenharia/estrutura/informacoesGerais/routes';
import estruturaExportRoutes from '@engenharia/estrutura/export/routes';
import estruturaOndeUsadoRoutes from '@engenharia/estrutura/ondeUsado/routes';
import pcpBaseRoutes from '@pcp/base/routes';
import manufaturaBaseRoutes from '@manufatura/base/routes';
import fiscalBaseRoutes from '@fiscal/base/routes';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { CacheManager } from '@shared/utils/cacheManager';
import adminRoutes from './presentation/admin/routes/admin.routes';
import { AppError } from '@shared/errors/errors';
import { metricsMiddleware } from '@shared/middlewares/metrics.middleware';
import { MetricsManager, metricsManager } from '@infrastructure/metrics/MetricsManager';
import metricsRoutes from './presentation/metrics/routes';
import testRoutes from './test/routes';
import connectionHealthRoutes from '@shared/health/routes';
import loggingRoutes from '@shared/logging/routes';
import chaosRoutes from '@shared/chaos/routes';
import poolScalerRoutes from '@shared/poolScaler/poolScaler.routes';
import tracingRoutes from '@shared/tracing/tracing.routes';
import multiRegionRoutes from '@shared/multiRegion/multiRegion.routes';
import anomalyRoutes from '@shared/ml/anomaly.routes';

export class App {
  public app: Application;

  constructor() {
    // Initialize OpenTelemetry BEFORE creating Express app
    startTracing();

    this.app = express();

    this.initializeMetrics();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Inicializa sistema de métricas Prometheus
   */
  private initializeMetrics(): void {
    try {
      MetricsManager.getInstance();
      log.info('✅ Sistema de métricas inicializado');
    } catch (error) {
      log.error('Erro ao inicializar métricas', { error });
    }
  }

  /**
   * Configura middlewares (ORDEM CRÍTICA)
   */
  private setupMiddlewares(): void {
    // 1. Correlation ID (tracking)
    this.app.use(correlationIdMiddleware);

    // 2. Distributed Tracing (observabilidade)
    this.app.use(tracingMiddleware);

    // 3. Métricas (observabilidade)
    this.app.use(metricsMiddleware);

    // 4. Logging (auditoria)
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - (req.startTime || 0);

        log.info('HTTP Request', {
          correlationId: req.id,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('user-agent'),
        });
      });

      next();
    });

    // 4. Security Headers (proteção)
    this.app.use(
      helmet({
        contentSecurityPolicy: false, // Desabilita CSP para Swagger
      })
    );

    // 5. CORS (cross-origin)

    //    this.app.use(cors({
    //      origin: process.env.CORS_ALLOWED_ORIGINS || '*',
    //      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    //      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID', 'Cache-Control', 'Pragma'],
    //      exposedHeaders: ['X-Correlation-ID'],
    //    }));

    const corsOrigins = process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
      : ['http://localhost:3000'];

    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Permite requisições sem origin (Postman, Swagger, curl)
          if (!origin) {
            return callback(null, true);
          }

          // Verifica se origin está na lista permitida
          if (corsOrigins.includes(origin)) {
            return callback(null, true);
          }

          // Origem não permitida
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Correlation-ID',
          'X-Request-ID',
          'Cache-Control',
          'Pragma',
        ],
        exposedHeaders: ['X-Correlation-ID'],
        credentials: true,
      })
    );

    // 6. Body Parsing (processamento)
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 7. Compression (performance)
    this.app.use(compression());

    // 8. Timeout (controle)
    this.app.use(timeout('30s'));
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (!req.timedout) next();
    });

    // 9. Rate Limiting (proteção) - DESABILITADO EM DESENVOLVIMENTO
    if (process.env.NODE_ENV !== 'development' && process.env.SKIP_RATE_LIMIT !== 'true') {
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: {
          error: 'Rate limit excedido',
          message: 'Muitas requisições deste IP. Tente novamente em alguns minutos.',
          retryAfter: '15 minutos',
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req: Request, res: Response) => {
          log.warn('Rate limit excedido', {
            correlationId: req.id,
            ip: req.ip,
            url: req.url,
          });

          res.status(429).json({
            error: 'Rate limit excedido',
            message: 'Muitas requisições. Tente novamente em alguns minutos.',
            timestamp: new Date().toISOString(),
            path: req.url,
            correlationId: req.id,
          });
        },
      });
      this.app.use('/api/', limiter);
    } else {
      log.info('⚠️  Rate limit DESABILITADO (NODE_ENV=development ou SKIP_RATE_LIMIT=true)');
    }

    // Admin key bypass (se rate limit estiver ativo)
    // this.app.use('/api/', (req, res, next) => {
    //   const apiKey = req.headers['x-api-key'];
    //   if (apiKey === 'admin-key-superuser') {
    //     return next();
    //   }
    //   return limiter(req, res, next);
    // });
  }

  /**
   * Configura rotas da aplicação
   */
  private setupRoutes(): void {
    this.app.use('/metrics', metricsRoutes);
    this.setupHealthCheck();
    this.app.use('/health/connections', connectionHealthRoutes);
    this.setupCacheRoutes();
    this.setupSwaggerDocs();
    this.setupAdminRoutes();

    // Rotas de logging (frontend)
    this.app.use('/api/logs', loggingRoutes);
    log.info('📝 Rotas de logging disponíveis em /api/logs');

    // Rotas de Chaos Engineering (apenas em desenvolvimento/teste)
    if (process.env.NODE_ENV !== 'production' || process.env.CHAOS_PRODUCTION_OVERRIDE === 'true') {
      this.app.use('/api/chaos', chaosRoutes);
      log.warn('⚠️ Rotas de Chaos Engineering habilitadas em /api/chaos');
    }

    // Rotas de Pool Auto-scaling
    this.app.use('/api/pool-scaler', poolScalerRoutes);
    log.info('🔧 Rotas de Pool Auto-scaling disponíveis em /api/pool-scaler');

    // Rotas de Distributed Tracing
    this.app.use('/api/tracing', tracingRoutes);
    log.info('🔍 Rotas de Distributed Tracing disponíveis em /api/tracing');

    // Rotas de Multi-region Failover
    this.app.use('/api/multi-region', multiRegionRoutes);
    log.info('🌍 Rotas de Multi-region Failover disponíveis em /api/multi-region');

    // Rotas de ML Anomaly Detection
    this.app.use('/api/ml/anomalies', anomalyRoutes);
    log.info('🤖 Rotas de ML Anomaly Detection disponíveis em /api/ml/anomalies');

    // Rotas de teste (apenas em ambiente de teste)
    if (process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_ROUTES === 'true') {
      this.app.use('/api/test', testRoutes);
      log.info('🧪 Rotas de teste habilitadas em /api/test');
    }

    this.app.use('/api/estabelecimento', estabelecimentoListarRoutes);

    this.app.use('/api/estabelecimento/dadosCadastrais/informacoesGerais', estabelecimentoRoutes);

    this.app.use('/api/item', itemSearchRoutes);

    this.app.use('/api/item', itemEmpresasRoutes);

    this.app.use('/api/item/dadosCadastrais/informacoesGerais', itemInformacoesGeraisRoutes);

    this.app.use('/api/item/dadosCadastrais/dimensoes', itemDimensoesRoutes);

    this.app.use('/api/item/dadosCadastrais/planejamento', itemPlanejamentoRoutes);

    this.app.use('/api/item/dadosCadastrais/fiscal', itemFiscalRoutes);

    this.app.use('/api/item/dadosCadastrais/manufatura', itemManufaturaRoutes);

    this.app.use('/api/item/extensao', itemExtensaoRoutes);

    this.app.use('/api/familia', familiaListarRoutes);

    this.app.use('/api/familia/dadosCadastrais/informacoesGerais', familiaInformacoesGeraisRoutes);

    this.app.use('/api/familiaComercial', familiaComercialListarRoutes);

    this.app.use(
      '/api/familiaComercial/dadosCadastrais/informacoesGerais',
      familiaComercialInformacoesGeraisRoutes
    );

    this.app.use('/api/grupoDeEstoque', grupoDeEstoqueListarRoutes);

    this.app.use(
      '/api/grupoDeEstoque/dadosCadastrais/informacoesGerais',
      grupoDeEstoqueInformacoesGeraisRoutes
    );

    this.app.use('/api/deposito', depositoListarRoutes);

    this.app.use(
      '/api/deposito/dadosCadastrais/informacoesGerais',
      depositoInformacoesGeraisRoutes
    );

    this.app.use('/api/engenharia/estrutura/informacoesGerais', estruturaInformacoesGeraisRoutes);

    this.app.use('/api/engenharia/estrutura/export', estruturaExportRoutes);

    this.app.use('/api/engenharia/estrutura/ondeUsado', estruturaOndeUsadoRoutes);

    this.app.use('/api/pcp/base', pcpBaseRoutes);
    this.app.use('/api/manufatura/base', manufaturaBaseRoutes);
    this.app.use('/api/fiscal/base', fiscalBaseRoutes);

    this.setupRootRoute();
    this.setup404Handler();
  }

  /**
   * Health check endpoint
   */
  private setupHealthCheck(): void {
    this.app.get('/health', async (req, res) => {
      try {
        let dbConnected = false;
        let dbResponseTime = 0;
        let dbType = 'unknown';

        try {
          const start = Date.now();
          const connection = DatabaseManager.getConnection();
          // Progress ODBC não suporta SELECT sem FROM
          await connection.query('SELECT COUNT(*) FROM pub.item');
          dbResponseTime = Date.now() - start;
          dbConnected = true;

          const dbStatus = DatabaseManager.getConnectionStatus();
          dbType = dbStatus.type;

          metricsManager.healthCheckDuration.observe(
            { component: 'database' },
            dbResponseTime / 1000
          );

          metricsManager.healthCheckStatus.set({ component: 'database' }, dbConnected ? 1 : 0);
        } catch (error) {
          log.error('Health check database error', { error });
          dbConnected = false;
          metricsManager.healthCheckStatus.set({ component: 'database' }, 0);
        }

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

        // Get active connections from pool
        const activeConnections = DatabaseManager.getActiveConnections();

        const isHealthy = dbConnected && (!cacheEnabled || cacheReady);
        const statusCode = isHealthy ? 200 : 503;

        metricsManager.healthCheckStatus.set({ component: 'api' }, isHealthy ? 1 : 0);

        res.status(statusCode).json({
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          database: {
            connected: dbConnected,
            responseTime: dbResponseTime,
            status: dbConnected ? 'healthy' : 'unhealthy',
            type: dbType,
            activeConnections: {
              total: activeConnections.length,
              connections: activeConnections.map((conn) => ({
                dsn: conn.dsn,
                description: conn.description,
                activeQueries: conn.activeQueries,
                lastUsed: conn.lastUsed,
              })),
            },
          },
          cache: {
            enabled: cacheEnabled,
            strategy: cacheStrategy,
            ready: cacheReady,
          },
          metrics: {
            enabled: metricsManager.isReady(),
            endpoint: '/metrics',
          },
        });
      } catch (error) {
        log.error('Health check fatal error', { error });
        metricsManager.healthCheckStatus.set({ component: 'api' }, 0);

        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Rotas de gerenciamento de cache
   */
  private setupCacheRoutes(): void {
    // GET /cache/stats
    this.app.get('/cache/stats', (req, res) => {
      try {
        const stats = CacheManager.getStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({
          error: 'Erro ao obter estatísticas de cache',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // GET /cache/keys
    this.app.get('/cache/keys', async (req, res) => {
      try {
        const pattern = req.query.pattern as string | undefined;
        const keys = await CacheManager.keys(pattern);

        res.json({
          keys,
          count: keys.length,
        });
      } catch (error) {
        res.status(500).json({
          error: 'Erro ao listar chaves',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // POST /cache/clear
    this.app.post('/cache/clear', async (req, res) => {
      try {
        await CacheManager.flush();

        res.json({
          success: true,
          message: 'Cache limpo com sucesso',
        });
      } catch (error) {
        res.status(500).json({
          error: 'Erro ao limpar cache',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // DELETE /cache/invalidate/:pattern
    this.app.delete('/cache/invalidate/:pattern', async (req, res) => {
      try {
        const pattern = req.params.pattern;
        const deletedCount = await CacheManager.invalidate(pattern);

        res.json({
          success: true,
          deletedCount,
          pattern,
        });
      } catch (error) {
        res.status(500).json({
          error: 'Erro ao invalidar cache',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Documentação Swagger
   */
  private setupSwaggerDocs(): void {
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

    this.app.get('/api-docs.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    log.info('📚 Documentação Swagger disponível em /api-docs');
  }

  /**
   * Rotas administrativas
   */
  private setupAdminRoutes(): void {
    this.app.use('/admin', adminRoutes);
    log.info('🔑 Rotas de administração disponíveis em /admin');
  }

  /**
   * Rota raiz
   */
  private setupRootRoute(): void {
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Datasul API',
        version: '1.0.0',
        documentation: '/api-docs',
        health: '/health',
        metrics: '/metrics',
        endpoints: {
          informacoesGerais: '/api/item/dadosCadastrais/informacoesGerais/:itemCodigo',
        },
        correlationId: req.id,
      });
    });
  }

  /**
   * Handler 404 (deve ser o último)
   */
  private setup404Handler(): void {
    this.app.use((req: Request, res: Response) => {
      log.warn('Rota não encontrada', {
        correlationId: req.id,
        method: req.method,
        url: req.url,
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
          metrics: '/metrics',
          api: '/api/item/dadosCadastrais/informacoesGerais/:itemCodigo',
        },
      });
    });
  }

  /**
   * Tratamento global de erros (deve ser o último)
   */
  private setupErrorHandling(): void {
    this.app.use((err: Error | AppError, req: Request, res: Response, _next: NextFunction) => {
      // Timeout
      if (err.message === 'Response timeout' || req.timedout) {
        return res.status(408).json({
          error: 'Timeout',
          message: 'A requisição demorou muito tempo para ser processada',
          timestamp: new Date().toISOString(),
          path: req.url,
          correlationId: req.id,
        });
      }

      // AppError
      if (err instanceof AppError) {
        const response: {
          error: string;
          message: string;
          timestamp: string;
          path: string;
          correlationId?: string;
          details?: unknown;
        } = {
          error: err.name,
          message: err.message,
          timestamp: new Date().toISOString(),
          path: req.url,
          correlationId: req.id,
        };

        if (err.context) {
          response.details = err.context;
        }

        if (err.isOperational) {
          log.warn('Erro operacional', {
            correlationId: req.id,
            error: err.name,
            message: err.message,
            statusCode: err.statusCode,
            context: err.context,
          });
        } else {
          log.error('Erro crítico', {
            correlationId: req.id,
            error: err.name,
            message: err.message,
            statusCode: err.statusCode,
            stack: err.stack,
            context: err.context,
          });
        }

        return res.status(err.statusCode).json(response);
      }

      // Erro genérico
      log.error('Erro não tratado', {
        correlationId: req.id,
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
      });

      res.status(500).json({
        error: 'Erro interno',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Ocorreu um erro ao processar sua requisição'
            : err.message,
        timestamp: new Date().toISOString(),
        path: req.url,
        correlationId: req.id,
      });
    });
  }

  /**
   * Retorna aplicação Express
   */
  public getExpressApp(): Application {
    return this.app;
  }
}

const appInstance = new App();
export default appInstance.getExpressApp();

// Export Application class for testing
export { Application } from './Application';
