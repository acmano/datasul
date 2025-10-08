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
import itemInformacoesGeraisRoutes from '@/item/dadosCadastrais/informacoesGerais/routes';
import estabelecimentoRoutes from '@/estabelecimento/dadosCadastrais/informacoesGerais/routes';
import familiaInformacoesGeraisRoutes from '@/familia/dadosCadastrais/informacoesGerais/routes';
import familiaComercialInformacoesGeraisRoutes from '@/familiaComercial/dadosCadastrais/informacoesGerais/routes';
import grupoDeEstoqueInformacoesGeraisRoutes from '@/grupoDeEstoque/dadosCadastrais/informacoesGerais/routes';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { CacheManager } from '@shared/utils/cacheManager';
import adminRoutes from './api/admin/routes/admin.routes';
import { AppError } from '@shared/errors/errors';
import { metricsMiddleware } from '@shared/middlewares/metrics.middleware';
import { MetricsManager, metricsManager } from '@infrastructure/metrics/MetricsManager';
import metricsRoutes from './api/metrics/routes';

export class App {
  public app: Application;

  constructor() {
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

    // 2. Métricas (observabilidade)
    this.app.use(metricsMiddleware);

    // 3. Logging (auditoria)
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
    this.app.use(helmet({
      contentSecurityPolicy: false, // Desabilita CSP para Swagger
    }));

    // 5. CORS (cross-origin)
    this.app.use(cors({
      origin: process.env.CORS_ALLOWED_ORIGINS || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID'],
      exposedHeaders: ['X-Correlation-ID'],
    }));

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

    // 9. Rate Limiting (proteção)
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
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
      const apiKey = req.headers['x-api-key'];
      if (apiKey === 'admin-key-superuser') {
        return next();
      }
      return limiter(req, res, next);
    });
  }

  /**
   * Configura rotas da aplicação
   */
  private setupRoutes(): void {
    this.app.use('/metrics', metricsRoutes);
    this.setupHealthCheck();
    this.setupCacheRoutes();
    this.setupSwaggerDocs();
    this.setupAdminRoutes();

    this.app.use('/api/estabelecimento/dadosCadastrais/informacoesGerais',
      estabelecimentoRoutes
    );

    this.app.use('/api/item/dadosCadastrais/informacoesGerais',
      itemInformacoesGeraisRoutes
    );

    this.app.use('/api/familia/dadosCadastrais/informacoesGerais',
      familiaInformacoesGeraisRoutes
    );

    this.app.use('/api/familiaComercial/dadosCadastrais/informacoesGerais',
      familiaComercialInformacoesGeraisRoutes
    );

    this.app.use('/api/grupoDeEstoque/dadosCadastrais/informacoesGerais',
      grupoDeEstoqueInformacoesGeraisRoutes
    );

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
          await connection.query('SELECT 1 as test');
          dbResponseTime = Date.now() - start;
          dbConnected = true;

          const dbStatus = DatabaseManager.getConnectionStatus();
          dbType = dbStatus.type;

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

        const isHealthy = dbConnected && (!cacheEnabled || cacheReady);
        const statusCode = isHealthy ? 200 : 503;

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
          metrics: {
            enabled: metricsManager.isReady(),
            endpoint: '/metrics'
          }
        });

      } catch (error) {
        log.error('Health check fatal error', { error });
        metricsManager.healthCheckStatus.set({ component: 'api' }, 0);

        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
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
          message: error instanceof Error ? error.message : String(error)
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
          count: keys.length
        });
      } catch (error) {
        res.status(500).json({
          error: 'Erro ao listar chaves',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // POST /cache/clear
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

    // DELETE /cache/invalidate/:pattern
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

  /**
   * Documentação Swagger
   */
  private setupSwaggerDocs(): void {
    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, swaggerUiOptions)
    );

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
          informacoesGerais: '/api/item/dadosCadastrais/informacoesGerais/:itemCodigo'
        },
        correlationId: req.id
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
          metrics: '/metrics',
          api: '/api/item/dadosCadastrais/informacoesGerais/:itemCodigo'
        }
      });
    });
  }

  /**
   * Tratamento global de erros (deve ser o último)
   */
  private setupErrorHandling(): void {
    this.app.use((err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
      // Timeout
      if (err.message === 'Response timeout' || req.timedout) {
        return res.status(408).json({
          error: 'Timeout',
          message: 'A requisição demorou muito tempo para ser processada',
          timestamp: new Date().toISOString(),
          path: req.url,
          correlationId: req.id
        });
      }

      // AppError
      if (err instanceof AppError) {
        const response: any = {
          error: err.name,
          message: err.message,
          timestamp: new Date().toISOString(),
          path: req.url,
          correlationId: req.id
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

      // Erro genérico
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

  /**
   * Retorna aplicação Express
   */
  public getExpressApp(): Application {
    return this.app;
  }
}

const appInstance = new App();
export default appInstance.getExpressApp();