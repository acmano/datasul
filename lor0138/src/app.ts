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
    // ✅ 1. Correlation ID - DEVE ser o PRIMEIRO middleware
    this.app.use(correlationIdMiddleware);

    // 2. Logging de requisições
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.on('finish', () => {
        const duration = req.startTime ? Date.now() - req.startTime : 0;
        
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

    // 3. Security headers
    this.app.use(helmet({
      contentSecurityPolicy: false, // Desabilita CSP para Swagger funcionar
    }));

    // 4. CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID'],
      exposedHeaders: ['X-Correlation-ID'], // Permite cliente ler o header
    }));

    // 5. Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 6. Compressão de resposta
    this.app.use(compression());

    // 7. Request timeout
    this.app.use(timeout('30s'));
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (!req.timedout) next();
    });

    // 8. Rate limiting
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
    this.app.get('/health', async (req: Request, res: Response) => {
      const { DatabaseManager } = await import('./infrastructure/database/DatabaseManager');
      
      const startTime = Date.now();
      let dbStatus = 'unknown';
      let dbResponseTime = 0;
      let dbConnected = false;

      try {
        await DatabaseManager.queryEmp('SELECT 1 as test');
        dbResponseTime = Date.now() - startTime;
        dbConnected = true;
        dbStatus = dbResponseTime < 100 ? 'healthy' : 'degraded';
      } catch (error) {
        dbStatus = 'unhealthy';
        dbConnected = false;
        log.error('Health check - Erro ao verificar banco', {
          correlationId: req.id,
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
        correlationId: req.id
      };

      const statusCode = health.status === 'healthy' ? 200 : 503;
      
      log.info('Health check executado', {
        correlationId: req.id,
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
          api: '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo'
        }
      });
    });
  }

  private setupErrorHandling(): void {
    // Error handler global - deve ser o ÚLTIMO middleware
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      log.error('Erro não tratado', {
        correlationId: req.id,
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
          correlationId: req.id
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