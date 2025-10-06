// src/infrastructure/metrics/MetricsManager.ts

import client from 'prom-client';
import { MetricsConfig } from '@shared/types/metrics.types';

/**
 * Gerenciador central de métricas Prometheus
 *
 * @description
 * Implementa o padrão Singleton para gerenciar todas as métricas da aplicação
 * no formato Prometheus. Centraliza a coleta de métricas de HTTP, Database,
 * Rate Limiting, Health Checks e Sistema.
 *
 * Funcionalidades principais:
 * - Criação e registro de métricas Prometheus
 * - Export de métricas para scraping
 * - Configuração de labels padrão
 * - Métricas default do Node.js
 * - Reset de métricas (útil para testes)
 *
 * Tipos de métricas suportadas:
 * - Counter: valores que só aumentam (requisições, erros)
 * - Gauge: valores que sobem/descem (conexões ativas, memória)
 * - Histogram: distribuição de valores (duração de requests)
 * - Summary: estatísticas (percentis, média)
 *
 * Integração:
 * - Prometheus faz scraping em GET /metrics
 * - Grafana consome métricas do Prometheus
 * - Alertmanager dispara alertas baseado em thresholds
 *
 * @example
 * // Inicializar no app.ts
 * const manager = MetricsManager.getInstance();
 *
 * @example
 * // Usar métricas
 * metricsManager.httpRequestsTotal.inc({ method: 'GET', route: '/api/item', status_code: '200' });
 *
 * @example
 * // Exportar métricas
 * const metrics = await metricsManager.getMetrics();
 * res.set('Content-Type', metricsManager.getRegistry().contentType);
 * res.end(metrics);
 *
 * @critical
 * - NUNCA criar múltiplas instâncias (usar getInstance())
 * - Métricas são compartilhadas por toda a aplicação
 * - Labels devem ser consistentes (mesmo nome/valores)
 * - Cuidado com cardinalidade alta em labels (evite IDs únicos)
 * - Em produção, proteger endpoint /metrics (auth)
 *
 * @see {@link MetricsConfig} - Configuração do sistema
 * @see https://prometheus.io/docs/concepts/metric_types/ - Tipos de métricas
 */
export class MetricsManager {
  /**
   * Instância singleton do MetricsManager
   * @private
   */
  private static instance: MetricsManager | null = null;

  /**
   * Registry do Prometheus para armazenar métricas
   * @private
   */
  private registry: client.Registry;

  /**
   * Flag indicando se foi inicializado
   * @private
   */
  private isInitialized: boolean = false;

  // ========================================
  // 📊 HTTP METRICS
  // ========================================

  /**
   * Total de requisições HTTP
   * Counter: incrementa a cada request
   * Labels: method, route, status_code
   */
  public httpRequestsTotal: client.Counter<string>;

  /**
   * Duração das requisições HTTP em segundos
   * Histogram: distribui tempos em buckets
   * Labels: method, route, status_code
   */
  public httpRequestDuration: client.Histogram<string>;

  /**
   * Requisições HTTP em andamento
   * Gauge: sobe ao iniciar, desce ao terminar
   * Labels: method, route
   */
  public httpRequestsInProgress: client.Gauge<string>;

  // ========================================
  // 🗄️ DATABASE METRICS
  // ========================================

  /**
   * Total de queries executadas
   * Counter: incrementa a cada query
   * Labels: database (EMP/MULT), operation (select/insert/update/delete)
   */
  public dbQueriesTotal: client.Counter<string>;

  /**
   * Duração das queries em segundos
   * Histogram: distribui tempos em buckets
   * Labels: database, operation
   */
  public dbQueryDuration: client.Histogram<string>;

  /**
   * Queries em andamento
   * Gauge: sobe ao iniciar, desce ao terminar
   * Labels: database
   */
  public dbQueriesInProgress: client.Gauge<string>;

  /**
   * Total de erros em queries
   * Counter: incrementa a cada erro
   * Labels: database, error_type (timeout/connection/syntax/permission/deadlock)
   */
  public dbQueryErrors: client.Counter<string>;

  /**
   * Conexões ativas com o banco
   * Gauge: atualizado ao conectar/desconectar
   * Labels: database
   */
  public dbConnectionsActive: client.Gauge<string>;

  /**
   * Total de erros de conexão
   * Counter: incrementa a cada falha de conexão
   * Labels: database, error_type
   */
  public dbConnectionErrors: client.Counter<string>;

  // ========================================
  // 🔒 RATE LIMIT METRICS
  // ========================================

  /**
   * Requisições bloqueadas por rate limit
   * Counter: incrementa quando request é bloqueado
   * Labels: route, user_id, reason
   */
  public rateLimitRequestsBlocked: client.Counter<string>;

  /**
   * Requisições permitidas pelo rate limiter
   * Counter: incrementa quando request passa
   * Labels: route, user_id
   */
  public rateLimitRequestsAllowed: client.Counter<string>;

  // ========================================
  // ⚕️ HEALTH METRICS
  // ========================================

  /**
   * Status do health check
   * Gauge: 1 = healthy, 0 = unhealthy
   * Labels: component (api/database/cache)
   */
  public healthCheckStatus: client.Gauge<string>;

  /**
   * Duração do health check em segundos
   * Histogram: distribui tempos em buckets
   * Labels: component
   */
  public healthCheckDuration: client.Histogram<string>;

  /**
   * Construtor privado para implementação do padrão Singleton
   *
   * @description
   * Inicializa o registry e cria todas as métricas da aplicação.
   * Configura labels padrão e métricas default do Node.js.
   *
   * @param config - Configuração do sistema de métricas
   * @private
   *
   * @critical
   * Este construtor NUNCA deve ser chamado diretamente.
   * Use getInstance() para obter a instância.
   */
  private constructor(config: MetricsConfig) {
    this.registry = new client.Registry();

    // Labels padrão para todas as métricas
    if (config.defaultLabels) {
      this.registry.setDefaultLabels(config.defaultLabels);
    }

    // Prefixo para todas as métricas
    const prefix = config.prefix || 'lor0138_';

    // ========================================
    // 📊 HTTP METRICS
    // ========================================
    this.httpRequestsTotal = new client.Counter({
      name: `${prefix}http_requests_total`,
      help: 'Total de requisições HTTP',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new client.Histogram({
      name: `${prefix}http_request_duration_seconds`,
      help: 'Duração das requisições HTTP em segundos',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestsInProgress = new client.Gauge({
      name: `${prefix}http_requests_in_progress`,
      help: 'Número de requisições HTTP em andamento',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });

    // ========================================
    // 🗄️ DATABASE METRICS
    // ========================================
    this.dbQueriesTotal = new client.Counter({
      name: `${prefix}db_queries_total`,
      help: 'Total de queries executadas',
      labelNames: ['database', 'operation'],
      registers: [this.registry],
    });

    this.dbQueryDuration = new client.Histogram({
      name: `${prefix}db_query_duration_seconds`,
      help: 'Duração das queries em segundos',
      labelNames: ['database', 'operation'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.dbQueriesInProgress = new client.Gauge({
      name: `${prefix}db_queries_in_progress`,
      help: 'Número de queries em andamento',
      labelNames: ['database'],
      registers: [this.registry],
    });

    this.dbQueryErrors = new client.Counter({
      name: `${prefix}db_query_errors_total`,
      help: 'Total de erros em queries',
      labelNames: ['database', 'error_type'],
      registers: [this.registry],
    });

    this.dbConnectionsActive = new client.Gauge({
      name: `${prefix}db_connections_active`,
      help: 'Número de conexões ativas com o banco',
      labelNames: ['database'],
      registers: [this.registry],
    });

    this.dbConnectionErrors = new client.Counter({
      name: `${prefix}db_connection_errors_total`,
      help: 'Total de erros de conexão',
      labelNames: ['database', 'error_type'],
      registers: [this.registry],
    });

    // ========================================
    // 🔒 RATE LIMIT METRICS
    // ========================================
    this.rateLimitRequestsBlocked = new client.Counter({
      name: `${prefix}rate_limit_requests_blocked_total`,
      help: 'Total de requisições bloqueadas por rate limit',
      labelNames: ['route', 'user_id', 'reason'],
      registers: [this.registry],
    });

    this.rateLimitRequestsAllowed = new client.Counter({
      name: `${prefix}rate_limit_requests_allowed_total`,
      help: 'Total de requisições permitidas',
      labelNames: ['route', 'user_id'],
      registers: [this.registry],
    });

    // ========================================
    // ⚕️ HEALTH METRICS
    // ========================================
    this.healthCheckStatus = new client.Gauge({
      name: `${prefix}health_check_status`,
      help: 'Status do health check (1 = healthy, 0 = unhealthy)',
      labelNames: ['component'],
      registers: [this.registry],
    });

    this.healthCheckDuration = new client.Histogram({
      name: `${prefix}health_check_duration_seconds`,
      help: 'Duração do health check em segundos',
      labelNames: ['component'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
      registers: [this.registry],
    });

    // ========================================
    // 💻 SYSTEM METRICS (Node.js default)
    // ========================================
    if (config.collectDefaultMetrics !== false) {
      client.collectDefaultMetrics({
        register: this.registry,
        prefix,
      });
    }

    this.isInitialized = true;
    console.log('✅ MetricsManager inicializado');
  }

  /**
   * Retorna instância singleton do MetricsManager
   *
   * @description
   * Implementação lazy do Singleton. Cria a instância apenas
   * na primeira chamada com configuração default ou fornecida.
   *
   * Configuração default:
   * - enabled: true
   * - collectDefaultMetrics: true (métricas do Node.js)
   * - prefix: 'lor0138_'
   * - defaultLabels: app, environment, version
   *
   * @param config - Configuração opcional do sistema de métricas
   * @returns {MetricsManager} Instância única do MetricsManager
   *
   * @example
   * // Uso básico (config default)
   * const manager = MetricsManager.getInstance();
   *
   * @example
   * // Com configuração customizada
   * const manager = MetricsManager.getInstance({
   *   enabled: true,
   *   prefix: 'myapp_',
   *   defaultLabels: { environment: 'production' }
   * });
   *
   * @critical
   * - Config só é aplicado na PRIMEIRA chamada
   * - Chamadas subsequentes ignoram config (retornam instância existente)
   * - NUNCA criar múltiplas instâncias
   */
  static getInstance(config?: MetricsConfig): MetricsManager {
    if (!this.instance) {
      const defaultConfig: MetricsConfig = {
        enabled: true,
        collectDefaultMetrics: true,
        prefix: 'lor0138_',
        defaultLabels: {
          app: 'lor0138',
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
        },
      };

      this.instance = new MetricsManager({ ...defaultConfig, ...config });
    }

    return this.instance;
  }

  /**
   * Retorna as métricas no formato Prometheus
   *
   * @description
   * Serializa todas as métricas registradas no formato text/plain
   * do Prometheus. Usado pelo endpoint /metrics para scraping.
   *
   * Formato de saída:
   * ```
   * # HELP metric_name Description
   * # TYPE metric_name counter
   * metric_name{label1="value1"} 42
   * ```
   *
   * @returns {Promise<string>} Métricas em formato Prometheus
   *
   * @example
   * // No endpoint de métricas
   * router.get('/metrics', async (req, res) => {
   *   res.set('Content-Type', metricsManager.getRegistry().contentType);
   *   const metrics = await metricsManager.getMetrics();
   *   res.end(metrics);
   * });
   *
   * @critical
   * - Content-Type deve ser registry.contentType
   * - Use res.end() ao invés de res.send() para evitar encoding
   * - Endpoint deve ser protegido em produção
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Retorna o registry do Prometheus
   *
   * @description
   * Expõe o registry interno para casos de uso avançados,
   * como adicionar métricas customizadas ou configurar
   * múltiplos endpoints.
   *
   * @returns {client.Registry} Registry do Prometheus
   *
   * @example
   * // Obter content-type
   * const contentType = manager.getRegistry().contentType;
   *
   * @example
   * // Registrar métrica customizada
   * const customMetric = new client.Counter({ name: 'my_metric', help: 'Custom' });
   * manager.getRegistry().registerMetric(customMetric);
   */
  getRegistry(): client.Registry {
    return this.registry;
  }

  /**
   * Reseta todas as métricas
   *
   * @description
   * Zera os valores de todas as métricas registradas.
   * ATENÇÃO: Deve ser usado APENAS em testes.
   * NUNCA chamar em produção.
   *
   * @example
   * // Em testes
   * beforeEach(() => {
   *   metricsManager.reset();
   * });
   *
   * @critical
   * - Use APENAS em testes
   * - NUNCA em produção (perda de dados)
   * - Afeta todas as métricas globalmente
   */
  reset(): void {
    this.registry.resetMetrics();
  }

  /**
   * Verifica se o MetricsManager está pronto
   *
   * @description
   * Retorna true se o manager foi inicializado com sucesso.
   * Útil para health checks e validações.
   *
   * @returns {boolean} True se inicializado
   *
   * @example
   * // No health check
   * if (metricsManager.isReady()) {
   *   console.log('Métricas disponíveis');
   * }
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Registra métrica customizada
   *
   * @description
   * Permite adicionar métricas customizadas ao registry.
   * Útil para métricas específicas do negócio.
   *
   * @param metric - Métrica Prometheus (Counter/Gauge/Histogram/Summary)
   *
   * @example
   * // Criar e registrar métrica customizada
   * const orderCounter = new client.Counter({
   *   name: 'lor0138_orders_processed_total',
   *   help: 'Total de pedidos processados',
   *   labelNames: ['status']
   * });
   * metricsManager.registerCustomMetric(orderCounter);
   *
   * @critical
   * - Nome deve seguir padrão Prometheus (snake_case)
   * - Usar prefixo consistente (lor0138_)
   * - Evitar cardinalidade alta em labels
   */
  registerCustomMetric(metric: client.Metric): void {
    this.registry.registerMetric(metric);
  }
}

/**
 * Instância singleton exportada para uso em toda a aplicação
 *
 * @description
 * Instância pré-inicializada do MetricsManager para conveniência.
 * Import e use diretamente sem chamar getInstance().
 *
 * @example
 * import { metricsManager } from '@infrastructure/metrics/MetricsManager';
 * metricsManager.httpRequestsTotal.inc({ method: 'GET', route: '/api/item', status_code: '200' });
 */
export const metricsManager = MetricsManager.getInstance();