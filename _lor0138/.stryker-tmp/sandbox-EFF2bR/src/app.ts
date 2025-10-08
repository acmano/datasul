// @ts-nocheck
// src/app.ts
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
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
    if (stryMutAct_9fa48("371")) {
      {}
    } else {
      stryCov_9fa48("371");
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
  }

  // ✅ NOVO: Método para inicializar métricas
  private initializeMetrics(): void {
    if (stryMutAct_9fa48("372")) {
      {}
    } else {
      stryCov_9fa48("372");
      try {
        if (stryMutAct_9fa48("373")) {
          {}
        } else {
          stryCov_9fa48("373");
          MetricsManager.getInstance();
          log.info(stryMutAct_9fa48("374") ? "" : (stryCov_9fa48("374"), '✅ Sistema de métricas inicializado'));
        }
      } catch (error) {
        if (stryMutAct_9fa48("375")) {
          {}
        } else {
          stryCov_9fa48("375");
          log.error(stryMutAct_9fa48("376") ? "" : (stryCov_9fa48("376"), 'Erro ao inicializar métricas'), stryMutAct_9fa48("377") ? {} : (stryCov_9fa48("377"), {
            error
          }));
        }
      }
    }
  }
  private setupMiddlewares(): void {
    if (stryMutAct_9fa48("378")) {
      {}
    } else {
      stryCov_9fa48("378");
      // ✅ 1. Correlation ID - DEVE ser o PRIMEIRO middleware
      this.app.use(correlationIdMiddleware);

      // ✅ NOVO: 2. Métricas - logo após Correlation ID
      this.app.use(metricsMiddleware);

      // 3. Logging de requisições
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        if (stryMutAct_9fa48("379")) {
          {}
        } else {
          stryCov_9fa48("379");
          // ✅ CORREÇÃO 2: Definir startTime
          req.startTime = Date.now();
          res.on(stryMutAct_9fa48("380") ? "" : (stryCov_9fa48("380"), 'finish'), () => {
            if (stryMutAct_9fa48("381")) {
              {}
            } else {
              stryCov_9fa48("381");
              const duration = stryMutAct_9fa48("382") ? Date.now() + (req.startTime || 0) : (stryCov_9fa48("382"), Date.now() - (stryMutAct_9fa48("385") ? req.startTime && 0 : stryMutAct_9fa48("384") ? false : stryMutAct_9fa48("383") ? true : (stryCov_9fa48("383", "384", "385"), req.startTime || 0)));
              log.info(stryMutAct_9fa48("386") ? "" : (stryCov_9fa48("386"), 'HTTP Request'), stryMutAct_9fa48("387") ? {} : (stryCov_9fa48("387"), {
                correlationId: req.id,
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: duration,
                userAgent: req.get(stryMutAct_9fa48("388") ? "" : (stryCov_9fa48("388"), 'user-agent'))
              }));
            }
          });
          next();
        }
      });

      // 4. Security headers
      this.app.use(helmet(stryMutAct_9fa48("389") ? {} : (stryCov_9fa48("389"), {
        contentSecurityPolicy: stryMutAct_9fa48("390") ? true : (stryCov_9fa48("390"), false) // Desabilita CSP para Swagger funcionar
      })));

      // 5. CORS
      this.app.use(cors(stryMutAct_9fa48("391") ? {} : (stryCov_9fa48("391"), {
        origin: stryMutAct_9fa48("394") ? process.env.CORS_ALLOWED_ORIGINS && '*' : stryMutAct_9fa48("393") ? false : stryMutAct_9fa48("392") ? true : (stryCov_9fa48("392", "393", "394"), process.env.CORS_ALLOWED_ORIGINS || (stryMutAct_9fa48("395") ? "" : (stryCov_9fa48("395"), '*'))),
        // ✅ CORREÇÃO 1: CORS_ALLOWED_ORIGINS
        methods: stryMutAct_9fa48("396") ? [] : (stryCov_9fa48("396"), [stryMutAct_9fa48("397") ? "" : (stryCov_9fa48("397"), 'GET'), stryMutAct_9fa48("398") ? "" : (stryCov_9fa48("398"), 'POST'), stryMutAct_9fa48("399") ? "" : (stryCov_9fa48("399"), 'PUT'), stryMutAct_9fa48("400") ? "" : (stryCov_9fa48("400"), 'DELETE')]),
        allowedHeaders: stryMutAct_9fa48("401") ? [] : (stryCov_9fa48("401"), [stryMutAct_9fa48("402") ? "" : (stryCov_9fa48("402"), 'Content-Type'), stryMutAct_9fa48("403") ? "" : (stryCov_9fa48("403"), 'Authorization'), stryMutAct_9fa48("404") ? "" : (stryCov_9fa48("404"), 'X-Correlation-ID'), stryMutAct_9fa48("405") ? "" : (stryCov_9fa48("405"), 'X-Request-ID')]),
        exposedHeaders: stryMutAct_9fa48("406") ? [] : (stryCov_9fa48("406"), [stryMutAct_9fa48("407") ? "" : (stryCov_9fa48("407"), 'X-Correlation-ID')]) // Permite cliente ler o header
      })));

      // 6. Body parser
      this.app.use(express.json(stryMutAct_9fa48("408") ? {} : (stryCov_9fa48("408"), {
        limit: stryMutAct_9fa48("409") ? "" : (stryCov_9fa48("409"), '10mb')
      })));
      this.app.use(express.urlencoded(stryMutAct_9fa48("410") ? {} : (stryCov_9fa48("410"), {
        extended: stryMutAct_9fa48("411") ? false : (stryCov_9fa48("411"), true),
        limit: stryMutAct_9fa48("412") ? "" : (stryCov_9fa48("412"), '10mb')
      })));

      // 7. Compressão de resposta
      this.app.use(compression());

      // 8. Request timeout
      this.app.use(timeout(stryMutAct_9fa48("413") ? "" : (stryCov_9fa48("413"), '30s')));
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        if (stryMutAct_9fa48("414")) {
          {}
        } else {
          stryCov_9fa48("414");
          if (stryMutAct_9fa48("417") ? false : stryMutAct_9fa48("416") ? true : stryMutAct_9fa48("415") ? req.timedout : (stryCov_9fa48("415", "416", "417"), !req.timedout)) next();
        }
      });

      // 9. Rate limiting
      const limiter = rateLimit(stryMutAct_9fa48("418") ? {} : (stryCov_9fa48("418"), {
        windowMs: stryMutAct_9fa48("419") ? 15 * 60 / 1000 : (stryCov_9fa48("419"), (stryMutAct_9fa48("420") ? 15 / 60 : (stryCov_9fa48("420"), 15 * 60)) * 1000),
        // 15 minutos
        max: 100,
        // limite de 100 requisições por IP
        message: stryMutAct_9fa48("421") ? {} : (stryCov_9fa48("421"), {
          error: stryMutAct_9fa48("422") ? "" : (stryCov_9fa48("422"), 'Rate limit excedido'),
          message: stryMutAct_9fa48("423") ? "" : (stryCov_9fa48("423"), 'Muitas requisições deste IP. Tente novamente em alguns minutos.'),
          retryAfter: stryMutAct_9fa48("424") ? "" : (stryCov_9fa48("424"), '15 minutos')
        }),
        standardHeaders: stryMutAct_9fa48("425") ? false : (stryCov_9fa48("425"), true),
        legacyHeaders: stryMutAct_9fa48("426") ? true : (stryCov_9fa48("426"), false),
        handler: (req: Request, res: Response) => {
          if (stryMutAct_9fa48("427")) {
            {}
          } else {
            stryCov_9fa48("427");
            log.warn(stryMutAct_9fa48("428") ? "" : (stryCov_9fa48("428"), 'Rate limit excedido'), stryMutAct_9fa48("429") ? {} : (stryCov_9fa48("429"), {
              correlationId: req.id,
              ip: req.ip,
              url: req.url
            }));
            res.status(429).json(stryMutAct_9fa48("430") ? {} : (stryCov_9fa48("430"), {
              error: stryMutAct_9fa48("431") ? "" : (stryCov_9fa48("431"), 'Rate limit excedido'),
              message: stryMutAct_9fa48("432") ? "" : (stryCov_9fa48("432"), 'Muitas requisições. Tente novamente em alguns minutos.'),
              timestamp: new Date().toISOString(),
              path: req.url,
              correlationId: req.id
            }));
          }
        }
      }));
      this.app.use(stryMutAct_9fa48("433") ? "" : (stryCov_9fa48("433"), '/api/'), (req, res, next) => {
        if (stryMutAct_9fa48("434")) {
          {}
        } else {
          stryCov_9fa48("434");
          // Se tem API key admin, pula rate limit
          const apiKey = req.headers[stryMutAct_9fa48("435") ? "" : (stryCov_9fa48("435"), 'x-api-key')];
          if (stryMutAct_9fa48("438") ? apiKey !== 'admin-key-superuser' : stryMutAct_9fa48("437") ? false : stryMutAct_9fa48("436") ? true : (stryCov_9fa48("436", "437", "438"), apiKey === (stryMutAct_9fa48("439") ? "" : (stryCov_9fa48("439"), 'admin-key-superuser')))) {
            if (stryMutAct_9fa48("440")) {
              {}
            } else {
              stryCov_9fa48("440");
              return next();
            }
          }
          // Senão, aplica rate limit
          return limiter(req, res, next);
        }
      });
    }
  }
  private setupRoutes(): void {
    if (stryMutAct_9fa48("441")) {
      {}
    } else {
      stryCov_9fa48("441");
      // ✅ NOVO: Rota de métricas (PRIMEIRO - antes de tudo)
      this.app.use(stryMutAct_9fa48("442") ? "" : (stryCov_9fa48("442"), '/metrics'), metricsRoutes);

      // Health check
      this.setupHealthCheck();

      // Configura rotas de cache
      this.setupCacheRoutes();

      // Documentação Swagger
      this.setupSwaggerDocs();
      this.setupAdminRoutes();

      // Rotas da API
      this.app.use(stryMutAct_9fa48("443") ? "" : (stryCov_9fa48("443"), '/api/lor0138/item/dadosCadastrais/informacoesGerais'), informacoesGeraisRoutes);

      // Rota raiz com documentação
      this.setupRootRoute();

      // 404 - Rota não encontrada
      this.setup404Handler();
    }
  }
  private setupHealthCheck(): void {
    if (stryMutAct_9fa48("444")) {
      {}
    } else {
      stryCov_9fa48("444");
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
      this.app.get(stryMutAct_9fa48("445") ? "" : (stryCov_9fa48("445"), '/health'), async (req, res) => {
        if (stryMutAct_9fa48("446")) {
          {}
        } else {
          stryCov_9fa48("446");
          try {
            if (stryMutAct_9fa48("447")) {
              {}
            } else {
              stryCov_9fa48("447");
              // Verificar banco de dados
              let dbConnected = stryMutAct_9fa48("448") ? true : (stryCov_9fa48("448"), false);
              let dbResponseTime = 0;
              let dbType = stryMutAct_9fa48("449") ? "" : (stryCov_9fa48("449"), 'unknown');
              try {
                if (stryMutAct_9fa48("450")) {
                  {}
                } else {
                  stryCov_9fa48("450");
                  const start = Date.now();
                  const connection = DatabaseManager.getConnection();
                  await connection.query(stryMutAct_9fa48("451") ? "" : (stryCov_9fa48("451"), 'SELECT 1 as test'));
                  dbResponseTime = stryMutAct_9fa48("452") ? Date.now() + start : (stryCov_9fa48("452"), Date.now() - start);
                  dbConnected = stryMutAct_9fa48("453") ? false : (stryCov_9fa48("453"), true);
                  const dbStatus = DatabaseManager.getConnectionStatus();
                  dbType = dbStatus.type;

                  // ✅ NOVO: Registrar métrica de health check do database
                  metricsManager.healthCheckDuration.observe(stryMutAct_9fa48("454") ? {} : (stryCov_9fa48("454"), {
                    component: stryMutAct_9fa48("455") ? "" : (stryCov_9fa48("455"), 'database')
                  }), stryMutAct_9fa48("456") ? dbResponseTime * 1000 : (stryCov_9fa48("456"), dbResponseTime / 1000));
                  metricsManager.healthCheckStatus.set(stryMutAct_9fa48("457") ? {} : (stryCov_9fa48("457"), {
                    component: stryMutAct_9fa48("458") ? "" : (stryCov_9fa48("458"), 'database')
                  }), dbConnected ? 1 : 0);
                }
              } catch (error) {
                if (stryMutAct_9fa48("459")) {
                  {}
                } else {
                  stryCov_9fa48("459");
                  log.error(stryMutAct_9fa48("460") ? "" : (stryCov_9fa48("460"), 'Health check database error'), stryMutAct_9fa48("461") ? {} : (stryCov_9fa48("461"), {
                    error
                  }));
                  dbConnected = stryMutAct_9fa48("462") ? true : (stryCov_9fa48("462"), false);
                  // ✅ NOVO: Registrar falha
                  metricsManager.healthCheckStatus.set(stryMutAct_9fa48("463") ? {} : (stryCov_9fa48("463"), {
                    component: stryMutAct_9fa48("464") ? "" : (stryCov_9fa48("464"), 'database')
                  }), 0);
                }
              }

              // Verificar cache
              const cacheEnabled = stryMutAct_9fa48("467") ? process.env.CACHE_ENABLED === 'false' : stryMutAct_9fa48("466") ? false : stryMutAct_9fa48("465") ? true : (stryCov_9fa48("465", "466", "467"), process.env.CACHE_ENABLED !== (stryMutAct_9fa48("468") ? "" : (stryCov_9fa48("468"), 'false')));
              const cacheStrategy = stryMutAct_9fa48("471") ? process.env.CACHE_STRATEGY && 'memory' : stryMutAct_9fa48("470") ? false : stryMutAct_9fa48("469") ? true : (stryCov_9fa48("469", "470", "471"), process.env.CACHE_STRATEGY || (stryMutAct_9fa48("472") ? "" : (stryCov_9fa48("472"), 'memory')));
              let cacheReady = stryMutAct_9fa48("473") ? true : (stryCov_9fa48("473"), false);
              if (stryMutAct_9fa48("475") ? false : stryMutAct_9fa48("474") ? true : (stryCov_9fa48("474", "475"), cacheEnabled)) {
                if (stryMutAct_9fa48("476")) {
                  {}
                } else {
                  stryCov_9fa48("476");
                  try {
                    if (stryMutAct_9fa48("477")) {
                      {}
                    } else {
                      stryCov_9fa48("477");
                      cacheReady = await CacheManager.isReady();
                    }
                  } catch (error) {
                    if (stryMutAct_9fa48("478")) {
                      {}
                    } else {
                      stryCov_9fa48("478");
                      log.error(stryMutAct_9fa48("479") ? "" : (stryCov_9fa48("479"), 'Health check cache error'), stryMutAct_9fa48("480") ? {} : (stryCov_9fa48("480"), {
                        error
                      }));
                      cacheReady = stryMutAct_9fa48("481") ? true : (stryCov_9fa48("481"), false);
                    }
                  }
                }
              }

              // Determinar status
              const isHealthy = stryMutAct_9fa48("484") ? dbConnected || !cacheEnabled || cacheReady : stryMutAct_9fa48("483") ? false : stryMutAct_9fa48("482") ? true : (stryCov_9fa48("482", "483", "484"), dbConnected && (stryMutAct_9fa48("486") ? !cacheEnabled && cacheReady : stryMutAct_9fa48("485") ? true : (stryCov_9fa48("485", "486"), (stryMutAct_9fa48("487") ? cacheEnabled : (stryCov_9fa48("487"), !cacheEnabled)) || cacheReady)));
              const statusCode = isHealthy ? 200 : 503;

              // ✅ NOVO: Registrar status geral da API
              metricsManager.healthCheckStatus.set(stryMutAct_9fa48("488") ? {} : (stryCov_9fa48("488"), {
                component: stryMutAct_9fa48("489") ? "" : (stryCov_9fa48("489"), 'api')
              }), isHealthy ? 1 : 0);
              res.status(statusCode).json(stryMutAct_9fa48("490") ? {} : (stryCov_9fa48("490"), {
                status: isHealthy ? stryMutAct_9fa48("491") ? "" : (stryCov_9fa48("491"), 'healthy') : stryMutAct_9fa48("492") ? "" : (stryCov_9fa48("492"), 'unhealthy'),
                timestamp: new Date().toISOString(),
                database: stryMutAct_9fa48("493") ? {} : (stryCov_9fa48("493"), {
                  connected: dbConnected,
                  responseTime: dbResponseTime,
                  status: dbConnected ? stryMutAct_9fa48("494") ? "" : (stryCov_9fa48("494"), 'healthy') : stryMutAct_9fa48("495") ? "" : (stryCov_9fa48("495"), 'unhealthy'),
                  type: dbType
                }),
                cache: stryMutAct_9fa48("496") ? {} : (stryCov_9fa48("496"), {
                  enabled: cacheEnabled,
                  strategy: cacheStrategy,
                  ready: cacheReady
                }),
                // ✅ NOVO: Informação sobre métricas
                metrics: stryMutAct_9fa48("497") ? {} : (stryCov_9fa48("497"), {
                  enabled: metricsManager.isReady(),
                  endpoint: stryMutAct_9fa48("498") ? "" : (stryCov_9fa48("498"), '/metrics')
                })
              }));
            }
          } catch (error) {
            if (stryMutAct_9fa48("499")) {
              {}
            } else {
              stryCov_9fa48("499");
              log.error(stryMutAct_9fa48("500") ? "" : (stryCov_9fa48("500"), 'Health check fatal error'), stryMutAct_9fa48("501") ? {} : (stryCov_9fa48("501"), {
                error
              }));

              // ✅ NOVO: Registrar falha total
              metricsManager.healthCheckStatus.set(stryMutAct_9fa48("502") ? {} : (stryCov_9fa48("502"), {
                component: stryMutAct_9fa48("503") ? "" : (stryCov_9fa48("503"), 'api')
              }), 0);
              res.status(503).json(stryMutAct_9fa48("504") ? {} : (stryCov_9fa48("504"), {
                status: stryMutAct_9fa48("505") ? "" : (stryCov_9fa48("505"), 'unhealthy'),
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : stryMutAct_9fa48("506") ? "" : (stryCov_9fa48("506"), 'Unknown error')
              }));
            }
          }
        }
      });
    }
  }
  private setupCacheRoutes(): void {
    if (stryMutAct_9fa48("507")) {
      {}
    } else {
      stryCov_9fa48("507");
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
      this.app.get(stryMutAct_9fa48("508") ? "" : (stryCov_9fa48("508"), '/cache/stats'), (req, res) => {
        if (stryMutAct_9fa48("509")) {
          {}
        } else {
          stryCov_9fa48("509");
          try {
            if (stryMutAct_9fa48("510")) {
              {}
            } else {
              stryCov_9fa48("510");
              const stats = CacheManager.getStats();
              res.json(stats);
            }
          } catch (error) {
            if (stryMutAct_9fa48("511")) {
              {}
            } else {
              stryCov_9fa48("511");
              res.status(500).json(stryMutAct_9fa48("512") ? {} : (stryCov_9fa48("512"), {
                error: stryMutAct_9fa48("513") ? "" : (stryCov_9fa48("513"), 'Erro ao obter estatísticas de cache'),
                message: error instanceof Error ? error.message : String(error)
              }));
            }
          }
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
      this.app.get(stryMutAct_9fa48("514") ? "" : (stryCov_9fa48("514"), '/cache/keys'), async (req, res) => {
        if (stryMutAct_9fa48("515")) {
          {}
        } else {
          stryCov_9fa48("515");
          try {
            if (stryMutAct_9fa48("516")) {
              {}
            } else {
              stryCov_9fa48("516");
              const pattern = req.query.pattern as string | undefined;
              const keys = await CacheManager.keys(pattern);
              res.json(stryMutAct_9fa48("517") ? {} : (stryCov_9fa48("517"), {
                keys,
                count: keys.length
              }));
            }
          } catch (error) {
            if (stryMutAct_9fa48("518")) {
              {}
            } else {
              stryCov_9fa48("518");
              res.status(500).json(stryMutAct_9fa48("519") ? {} : (stryCov_9fa48("519"), {
                error: stryMutAct_9fa48("520") ? "" : (stryCov_9fa48("520"), 'Erro ao listar chaves'),
                message: error instanceof Error ? error.message : String(error)
              }));
            }
          }
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
      this.app.post(stryMutAct_9fa48("521") ? "" : (stryCov_9fa48("521"), '/cache/clear'), async (req, res) => {
        if (stryMutAct_9fa48("522")) {
          {}
        } else {
          stryCov_9fa48("522");
          try {
            if (stryMutAct_9fa48("523")) {
              {}
            } else {
              stryCov_9fa48("523");
              await CacheManager.flush();
              res.json(stryMutAct_9fa48("524") ? {} : (stryCov_9fa48("524"), {
                success: stryMutAct_9fa48("525") ? false : (stryCov_9fa48("525"), true),
                message: stryMutAct_9fa48("526") ? "" : (stryCov_9fa48("526"), 'Cache limpo com sucesso')
              }));
            }
          } catch (error) {
            if (stryMutAct_9fa48("527")) {
              {}
            } else {
              stryCov_9fa48("527");
              res.status(500).json(stryMutAct_9fa48("528") ? {} : (stryCov_9fa48("528"), {
                error: stryMutAct_9fa48("529") ? "" : (stryCov_9fa48("529"), 'Erro ao limpar cache'),
                message: error instanceof Error ? error.message : String(error)
              }));
            }
          }
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
      this.app.delete(stryMutAct_9fa48("530") ? "" : (stryCov_9fa48("530"), '/cache/invalidate/:pattern'), async (req, res) => {
        if (stryMutAct_9fa48("531")) {
          {}
        } else {
          stryCov_9fa48("531");
          try {
            if (stryMutAct_9fa48("532")) {
              {}
            } else {
              stryCov_9fa48("532");
              const pattern = req.params.pattern;
              const deletedCount = await CacheManager.invalidate(pattern);
              res.json(stryMutAct_9fa48("533") ? {} : (stryCov_9fa48("533"), {
                success: stryMutAct_9fa48("534") ? false : (stryCov_9fa48("534"), true),
                deletedCount,
                pattern
              }));
            }
          } catch (error) {
            if (stryMutAct_9fa48("535")) {
              {}
            } else {
              stryCov_9fa48("535");
              res.status(500).json(stryMutAct_9fa48("536") ? {} : (stryCov_9fa48("536"), {
                error: stryMutAct_9fa48("537") ? "" : (stryCov_9fa48("537"), 'Erro ao invalidar cache'),
                message: error instanceof Error ? error.message : String(error)
              }));
            }
          }
        }
      });
    }
  }
  private setupSwaggerDocs(): void {
    if (stryMutAct_9fa48("538")) {
      {}
    } else {
      stryCov_9fa48("538");
      // Serve Swagger UI
      this.app.use(stryMutAct_9fa48("539") ? "" : (stryCov_9fa48("539"), '/api-docs'), swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

      // Serve OpenAPI spec em JSON
      this.app.get(stryMutAct_9fa48("540") ? "" : (stryCov_9fa48("540"), '/api-docs.json'), (req: Request, res: Response) => {
        if (stryMutAct_9fa48("541")) {
          {}
        } else {
          stryCov_9fa48("541");
          res.setHeader(stryMutAct_9fa48("542") ? "" : (stryCov_9fa48("542"), 'Content-Type'), stryMutAct_9fa48("543") ? "" : (stryCov_9fa48("543"), 'application/json'));
          res.send(swaggerSpec);
        }
      });
      log.info(stryMutAct_9fa48("544") ? "" : (stryCov_9fa48("544"), '📚 Documentação Swagger disponível em /api-docs'));
    }
  }
  private setupAdminRoutes(): void {
    if (stryMutAct_9fa48("545")) {
      {}
    } else {
      stryCov_9fa48("545");
      this.app.use(stryMutAct_9fa48("546") ? "" : (stryCov_9fa48("546"), '/admin'), adminRoutes);
      log.info(stryMutAct_9fa48("547") ? "" : (stryCov_9fa48("547"), '🔑 Rotas de administração disponíveis em /admin'));
    }
  }
  private setupRootRoute(): void {
    if (stryMutAct_9fa48("548")) {
      {}
    } else {
      stryCov_9fa48("548");
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
      this.app.get(stryMutAct_9fa48("549") ? "" : (stryCov_9fa48("549"), '/'), (req: Request, res: Response) => {
        if (stryMutAct_9fa48("550")) {
          {}
        } else {
          stryCov_9fa48("550");
          res.json(stryMutAct_9fa48("551") ? {} : (stryCov_9fa48("551"), {
            message: stryMutAct_9fa48("552") ? "" : (stryCov_9fa48("552"), 'Datasul API'),
            version: stryMutAct_9fa48("553") ? "" : (stryCov_9fa48("553"), '1.0.0'),
            documentation: stryMutAct_9fa48("554") ? "" : (stryCov_9fa48("554"), '/api-docs'),
            health: stryMutAct_9fa48("555") ? "" : (stryCov_9fa48("555"), '/health'),
            metrics: stryMutAct_9fa48("556") ? "" : (stryCov_9fa48("556"), '/metrics'),
            // ✅ NOVO
            endpoints: stryMutAct_9fa48("557") ? {} : (stryCov_9fa48("557"), {
              informacoesGerais: stryMutAct_9fa48("558") ? "" : (stryCov_9fa48("558"), '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo')
            }),
            correlationId: req.id
          }));
        }
      });
    }
  }
  private setup404Handler(): void {
    if (stryMutAct_9fa48("559")) {
      {}
    } else {
      stryCov_9fa48("559");
      this.app.use((req: Request, res: Response) => {
        if (stryMutAct_9fa48("560")) {
          {}
        } else {
          stryCov_9fa48("560");
          log.warn(stryMutAct_9fa48("561") ? "" : (stryCov_9fa48("561"), 'Rota não encontrada'), stryMutAct_9fa48("562") ? {} : (stryCov_9fa48("562"), {
            correlationId: req.id,
            method: req.method,
            url: req.url
          }));
          res.status(404).json(stryMutAct_9fa48("563") ? {} : (stryCov_9fa48("563"), {
            error: stryMutAct_9fa48("564") ? "" : (stryCov_9fa48("564"), 'Rota não encontrada'),
            message: stryMutAct_9fa48("565") ? `` : (stryCov_9fa48("565"), `A rota ${req.method} ${req.url} não existe`),
            timestamp: new Date().toISOString(),
            path: req.url,
            correlationId: req.id,
            availableRoutes: stryMutAct_9fa48("566") ? {} : (stryCov_9fa48("566"), {
              documentation: stryMutAct_9fa48("567") ? "" : (stryCov_9fa48("567"), '/api-docs'),
              health: stryMutAct_9fa48("568") ? "" : (stryCov_9fa48("568"), '/health'),
              metrics: stryMutAct_9fa48("569") ? "" : (stryCov_9fa48("569"), '/metrics'),
              // ✅ NOVO
              api: stryMutAct_9fa48("570") ? "" : (stryCov_9fa48("570"), '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo')
            })
          }));
        }
      });
    }
  }
  private setupErrorHandling(): void {
    if (stryMutAct_9fa48("571")) {
      {}
    } else {
      stryCov_9fa48("571");
      // ✅ MUDANÇA: Error handler melhorado usando AppError
      this.app.use((err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
        if (stryMutAct_9fa48("572")) {
          {}
        } else {
          stryCov_9fa48("572");
          // Timeout error
          if (stryMutAct_9fa48("575") ? err.message === 'Response timeout' && req.timedout : stryMutAct_9fa48("574") ? false : stryMutAct_9fa48("573") ? true : (stryCov_9fa48("573", "574", "575"), (stryMutAct_9fa48("577") ? err.message !== 'Response timeout' : stryMutAct_9fa48("576") ? false : (stryCov_9fa48("576", "577"), err.message === (stryMutAct_9fa48("578") ? "" : (stryCov_9fa48("578"), 'Response timeout')))) || req.timedout)) {
            if (stryMutAct_9fa48("579")) {
              {}
            } else {
              stryCov_9fa48("579");
              return res.status(408).json(stryMutAct_9fa48("580") ? {} : (stryCov_9fa48("580"), {
                error: stryMutAct_9fa48("581") ? "" : (stryCov_9fa48("581"), 'Timeout'),
                message: stryMutAct_9fa48("582") ? "" : (stryCov_9fa48("582"), 'A requisição demorou muito tempo para ser processada'),
                timestamp: new Date().toISOString(),
                path: req.url,
                correlationId: req.id
              }));
            }
          }

          // Se for AppError (do sistema unificado), usa statusCode e context
          if (stryMutAct_9fa48("584") ? false : stryMutAct_9fa48("583") ? true : (stryCov_9fa48("583", "584"), err instanceof AppError)) {
            if (stryMutAct_9fa48("585")) {
              {}
            } else {
              stryCov_9fa48("585");
              const response: any = stryMutAct_9fa48("586") ? {} : (stryCov_9fa48("586"), {
                error: err.name,
                message: err.message,
                timestamp: new Date().toISOString(),
                path: req.url,
                correlationId: req.id
              });

              // Adiciona context como details se existir
              if (stryMutAct_9fa48("588") ? false : stryMutAct_9fa48("587") ? true : (stryCov_9fa48("587", "588"), err.context)) {
                if (stryMutAct_9fa48("589")) {
                  {}
                } else {
                  stryCov_9fa48("589");
                  response.details = err.context;
                }
              }

              // Log apropriado
              if (stryMutAct_9fa48("591") ? false : stryMutAct_9fa48("590") ? true : (stryCov_9fa48("590", "591"), err.isOperational)) {
                if (stryMutAct_9fa48("592")) {
                  {}
                } else {
                  stryCov_9fa48("592");
                  log.warn(stryMutAct_9fa48("593") ? "" : (stryCov_9fa48("593"), 'Erro operacional'), stryMutAct_9fa48("594") ? {} : (stryCov_9fa48("594"), {
                    correlationId: req.id,
                    error: err.name,
                    message: err.message,
                    statusCode: err.statusCode,
                    context: err.context
                  }));
                }
              } else {
                if (stryMutAct_9fa48("595")) {
                  {}
                } else {
                  stryCov_9fa48("595");
                  log.error(stryMutAct_9fa48("596") ? "" : (stryCov_9fa48("596"), 'Erro crítico'), stryMutAct_9fa48("597") ? {} : (stryCov_9fa48("597"), {
                    correlationId: req.id,
                    error: err.name,
                    message: err.message,
                    statusCode: err.statusCode,
                    stack: err.stack,
                    context: err.context
                  }));
                }
              }
              return res.status(err.statusCode).json(response);
            }
          }

          // Erro genérico não tratado
          log.error(stryMutAct_9fa48("598") ? "" : (stryCov_9fa48("598"), 'Erro não tratado'), stryMutAct_9fa48("599") ? {} : (stryCov_9fa48("599"), {
            correlationId: req.id,
            error: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method
          }));
          res.status(500).json(stryMutAct_9fa48("600") ? {} : (stryCov_9fa48("600"), {
            error: stryMutAct_9fa48("601") ? "" : (stryCov_9fa48("601"), 'Erro interno'),
            message: (stryMutAct_9fa48("604") ? process.env.NODE_ENV !== 'production' : stryMutAct_9fa48("603") ? false : stryMutAct_9fa48("602") ? true : (stryCov_9fa48("602", "603", "604"), process.env.NODE_ENV === (stryMutAct_9fa48("605") ? "" : (stryCov_9fa48("605"), 'production')))) ? stryMutAct_9fa48("606") ? "" : (stryCov_9fa48("606"), 'Ocorreu um erro ao processar sua requisição') : err.message,
            timestamp: new Date().toISOString(),
            path: req.url,
            correlationId: req.id
          }));
        }
      });
    }
  }
  public getExpressApp(): Application {
    if (stryMutAct_9fa48("607")) {
      {}
    } else {
      stryCov_9fa48("607");
      return this.app;
    }
  }
}

// ✅ Export default da instância
const appInstance = new App();
export default appInstance.getExpressApp();