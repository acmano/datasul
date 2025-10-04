// src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import timeout from 'connect-timeout';
import swaggerUi from 'swagger-ui-express';
import { rateLimit } from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

// ✅ CORRIGIDO: Import correto do logger
import { log } from '@shared/utils/logger';
import { swaggerSpec, swaggerUiOptions } from '@config/swagger.config';
import informacoesGeraisRoutes from './api/lor0138/item/dadosCadastrais/informacoesGerais/routes/informacoesGerais.routes';

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    
    // Configura middlewares
    this.setupMiddlewares();
    
    // Configura rotas
    this.setupRoutes();
    
    // Configura tratamento de erros
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    // Request ID (Correlation ID) - DEVE vir primeiro
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.id = uuidv4();
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // Logging de requisições
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        log.info('HTTP Request', {
          requestId: req.id,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: duration,
          userAgent: req.get('user-agent')
        });
      });

      next();
    });

    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: false, // Desabilita CSP para Swagger funcionar
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }));

    // Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compressão de resposta
    this.app.use(compression());

    // Request timeout
    this.app.use(timeout('30s'));
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (!req.timedout) next();
    });

    // Rate limiting
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
          requestId: req.id,
          ip: req.ip,
          url: req.url
        });
        res.status(429).json({
          error: 'Rate limit excedido',
          message: 'Muitas requisições. Tente novamente em alguns minutos.',
          timestamp: new Date().toISOString(),
          path: req.url,
          requestId: req.id
        });
      }
    });

    this.app.use('/api/', limiter);
  }

  private setupRoutes(): void {
    // Health check
    this.setupHealthCheck();

    // Documentação Swagger
    this.setupSwaggerDocs();

    // Rotas da API
    this.app.use('/api/lor0138/item/dadosCadastrais/informacoesGerais', 
      informacoesGeraisRoutes
    );

    // Rota raiz
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Datasul API',
        version: '1.0.0',
        documentation: '/api-docs',
        health: '/health',
        endpoints: {
          informacoesGerais: '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo'
        },
        requestId: req.id
      });
    });

    // 404 - Rota não encontrada
    this.app.use((req: Request, res: Response) => {
      log.warn('Rota não encontrada', {
        requestId: req.id,
        method: req.method,
        url: req.url
      });
      
      res.status(404).json({
        error: 'Rota não encontrada',
        message: `A rota ${req.method} ${req.url} não existe`,
        timestamp: new Date().toISOString(),
        path: req.url,
        requestId: req.id,
        availableRoutes: {
          documentation: '/api-docs',
          health: '/health',
          api: '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo'
        }
      });
    });
  }

  private setupHealthCheck(): void {
    /**
     * @openapi
     * /health:
     *   get:
     *     tags:
     *       - Health
     *     summary: Verifica saúde da aplicação
     *     description: |
     *       Retorna informações sobre o status da aplicação, incluindo:
     *       - Status geral (healthy/degraded/unhealthy)
     *       - Conectividade com banco de dados
     *       - Tempo de resposta do banco
     *       - Uso de memória
     *       - Tempo de atividade
     *     responses:
     *       200:
     *         description: Aplicação saudável
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HealthCheck'
     *       503:
     *         description: Aplicação com problemas
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HealthCheck'
     */
    this.app.get('/health', async (req: Request, res: Response) => {
      // ✅ CORRIGIDO: Usa métodos estáticos do DatabaseManager
      const { DatabaseManager } = await import('./infrastructure/database/DatabaseManager');
      
      const startTime = Date.now();
      let dbStatus = 'unknown';
      let dbResponseTime = 0;
      let dbConnected = false;

      try {
        // ✅ CORRIGIDO: Usa queryEmp ao invés de getConnection
        await DatabaseManager.queryEmp('SELECT 1 as test');
        dbResponseTime = Date.now() - startTime;
        dbConnected = true;
        dbStatus = dbResponseTime < 100 ? 'healthy' : 'degraded';
      } catch (error) {
        dbStatus = 'unhealthy';
        dbConnected = false;
        log.error('Health check - Erro ao verificar banco', {
          requestId: req.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      const memUsage = process.memoryUsage();
      const memUsedMB = memUsage.heapUsed / 1024 / 1024;
      const memTotalMB = memUsage.heapTotal / 1024 / 1024;

      const health = {
        status: dbConnected ? (dbResponseTime < 100 ? 'healthy' : 'degraded') : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: dbConnected,
          responseTime: dbResponseTime,
          status: dbStatus,
          type: process.env.DB_CONNECTION_TYPE || 'unknown'
        },
        memory: {
          used: Math.round(memUsedMB * 100) / 100,
          total: Math.round(memTotalMB * 100) / 100,
          percentage: Math.round((memUsedMB / memTotalMB) * 100 * 100) / 100
        },
        requestId: req.id
      };

      const statusCode = health.status === 'healthy' ? 200 : 503;
      
      log.info('Health check executado', {
        requestId: req.id,
        status: health.status,
        dbResponseTime: dbResponseTime
      });

      res.status(statusCode).json(health);
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

  private setupErrorHandling(): void {
    // Error handler global - deve ser o ÚLTIMO middleware
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      log.error('Erro não tratado', {
        requestId: req.id,
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
      });

      // Timeout error
      if (err.message === 'Response timeout' || req.timedout) {
        return res.status(408).json({
          error: 'Timeout',
          message: 'A requisição demorou muito tempo para ser processada',
          timestamp: new Date().toISOString(),
          path: req.url,
          requestId: req.id
        });
      }

      // Erro genérico
      res.status(500).json({
        error: 'Erro interno',
        message: process.env.NODE_ENV === 'production' 
          ? 'Ocorreu um erro ao processar sua requisição' 
          : err.message,
        timestamp: new Date().toISOString(),
        path: req.url,
        requestId: req.id
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