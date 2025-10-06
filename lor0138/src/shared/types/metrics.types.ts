// src/shared/types/metrics.types.ts

/**
 * ========================================
 * TIPOS E INTERFACES DE MÉTRICAS
 * ========================================
 *
 * Define todas as estruturas de dados relacionadas ao sistema de métricas
 * da aplicação, incluindo métricas HTTP, Database, Rate Limiting e Sistema.
 *
 * PROPÓSITO:
 * - Padronizar formato de métricas em toda aplicação
 * - Facilitar integração com Prometheus/Grafana
 * - Garantir type-safety em coleta de métricas
 * - Documentar métricas disponíveis
 *
 * ARQUITETURA:
 * - MetricsConfig: Configuração do sistema de métricas
 * - HttpMetrics: Métricas de requisições HTTP/API
 * - DatabaseMetrics: Métricas de banco de dados
 * - RateLimitMetrics: Métricas de rate limiting
 * - SystemMetrics: Métricas do sistema Node.js
 * - MetricsSummary: Agregação de todas métricas
 *
 * @see MetricsManager.ts - Implementação do gerenciador
 * @see metrics.middleware.ts - Coleta de métricas HTTP
 * @see databaseMetrics.ts - Helper de métricas DB
 */

/**
 * ========================================
 * CONFIGURAÇÃO DO SISTEMA DE MÉTRICAS
 * ========================================
 */

/**
 * Configuração do sistema de métricas Prometheus
 *
 * PROPÓSITO:
 * Permite habilitar/desabilitar coleta de métricas e customizar
 * comportamento do sistema de monitoramento.
 *
 * EXEMPLOS DE USO:
 * ```typescript
 * const config: MetricsConfig = {
 *   enabled: true,
 *   defaultLabels: { app: 'lor0138', env: 'production' },
 *   collectDefaultMetrics: true,
 *   prefix: 'lor0138_'
 * };
 * ```
 */
export interface MetricsConfig {
  /**
   * Habilita/desabilita coleta de métricas
   *
   * COMPORTAMENTO:
   * - true: Métricas são coletadas e expostas em /metrics
   * - false: Sistema de métricas fica inativo
   *
   * @default true
   */
  enabled: boolean;

  /**
   * Labels padrão adicionados a todas métricas
   *
   * PROPÓSITO:
   * Facilitar identificação de origem em ambientes multi-instância
   *
   * EXEMPLOS:
   * - { app: 'lor0138', env: 'production' }
   * - { region: 'us-east-1', version: '1.0.0' }
   *
   * @optional
   */
  defaultLabels?: Record<string, string>;

  /**
   * Coleta métricas padrão do Node.js (CPU, memória, etc)
   *
   * MÉTRICAS INCLUÍDAS:
   * - process_cpu_user_seconds_total
   * - process_cpu_system_seconds_total
   * - process_heap_bytes
   * - nodejs_eventloop_lag_seconds
   *
   * @default true
   */
  collectDefaultMetrics?: boolean;

  /**
   * Prefixo adicionado a todas métricas customizadas
   *
   * PROPÓSITO:
   * Evitar conflitos de nomes em sistemas com múltiplas aplicações
   *
   * EXEMPLO:
   * - prefix: 'lor0138_' → 'lor0138_http_requests_total'
   *
   * @default 'lor0138_'
   */
  prefix?: string;
}

/**
 * ========================================
 * MÉTRICAS HTTP/API
 * ========================================
 */

/**
 * Métricas de requisições HTTP e API
 *
 * PROPÓSITO:
 * Monitorar performance, volume e saúde dos endpoints da API
 *
 * CASOS DE USO:
 * - Identificar endpoints mais lentos
 * - Detectar aumento de erros
 * - Monitorar carga da API
 * - Planejar escalabilidade
 */
export interface HttpMetrics {
  /**
   * Total de requisições processadas
   *
   * TIPO: Counter (sempre incrementa)
   * LABELS: method, route, status_code
   *
   * EXEMPLOS:
   * - GET /health 200: 1500 requisições
   * - POST /api/items 201: 350 requisições
   */
  totalRequests: number;

  /**
   * Número de requisições sendo processadas no momento
   *
   * TIPO: Gauge (sobe e desce)
   * LABELS: method, route
   *
   * ALERTAS SUGERIDOS:
   * - > 100: Alta carga, considerar escalar
   * - > 500: Sobrecarga crítica
   */
  requestsInProgress: number;

  /**
   * Duração das requisições em segundos (média)
   *
   * TIPO: Histogram
   * LABELS: method, route, status_code
   * BUCKETS: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
   *
   * ALERTAS SUGERIDOS:
   * - p95 > 1s: Requisições lentas
   * - p99 > 2s: Performance degradada
   */
  requestDuration: number;

  /**
   * Contadores de requisições por status HTTP
   *
   * ESTRUTURA:
   * ```
   * {
   *   200: 5000,  // Success
   *   201: 1200,  // Created
   *   400: 150,   // Bad Request
   *   404: 80,    // Not Found
   *   500: 5      // Internal Error
   * }
   * ```
   *
   * PROPÓSITO:
   * Identificar padrões de erro e sucesso
   */
  requestsByStatus: Record<number, number>;

  /**
   * Contadores de requisições por endpoint
   *
   * ESTRUTURA:
   * ```
   * {
   *   '/health': 10000,
   *   '/api/items/:id': 5000,
   *   '/metrics': 200
   * }
   * ```
   *
   * PROPÓSITO:
   * Identificar endpoints mais utilizados
   */
  requestsByEndpoint: Record<string, number>;
}

/**
 * ========================================
 * MÉTRICAS DE BANCO DE DADOS
 * ========================================
 */

/**
 * Métricas de operações de banco de dados
 *
 * PROPÓSITO:
 * Monitorar performance e saúde das conexões com banco de dados
 *
 * CASOS DE USO:
 * - Identificar queries lentas
 * - Detectar problemas de conexão
 * - Otimizar pool de conexões
 * - Alertar sobre erros de banco
 */
export interface DatabaseMetrics {
  /**
   * Total de queries executadas
   *
   * TIPO: Counter
   * LABELS: database (EMP/MULT), operation (select/insert/update/delete)
   *
   * EXEMPLOS:
   * - EMP select: 10000 queries
   * - MULT update: 500 queries
   */
  queriesTotal: number;

  /**
   * Número de queries em execução no momento
   *
   * TIPO: Gauge
   * LABELS: database (EMP/MULT)
   *
   * ALERTAS SUGERIDOS:
   * - > 50: Muitas queries simultâneas
   * - > 100: Possível problema de performance
   */
  queriesInProgress: number;

  /**
   * Duração das queries em segundos (média)
   *
   * TIPO: Histogram
   * LABELS: database, operation
   * BUCKETS: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
   *
   * ALERTAS SUGERIDOS:
   * - p95 > 500ms: Queries lentas
   * - p99 > 1s: Performance crítica
   */
  queryDuration: number;

  /**
   * Total de erros em queries
   *
   * TIPO: Counter
   * LABELS: database, error_type (timeout/connection/syntax/permission/deadlock)
   *
   * ALERTAS SUGERIDOS:
   * - Qualquer erro: Investigar imediatamente
   * - Taxa > 1%: Problema crítico
   */
  queryErrors: number;

  /**
   * Número de conexões ativas com banco
   *
   * TIPO: Gauge
   * LABELS: database
   *
   * VALORES ESPERADOS:
   * - Normal: 1-10 conexões
   * - Alta carga: 10-50 conexões
   * - Problema: 0 conexões ou > pool max
   */
  connectionsActive: number;

  /**
   * Total de erros de conexão
   *
   * TIPO: Counter
   * LABELS: database, error_type
   *
   * ALERTAS CRÍTICOS:
   * - > 0: Banco pode estar indisponível
   */
  connectionErrors: number;
}

/**
 * ========================================
 * MÉTRICAS DE RATE LIMITING
 * ========================================
 */

/**
 * Métricas de rate limiting e controle de acesso
 *
 * PROPÓSITO:
 * Monitorar uso de API e efetividade do rate limiting
 *
 * CASOS DE USO:
 * - Identificar usuários abusivos
 * - Ajustar limites por tier
 * - Detectar tentativas de DoS
 * - Analisar padrões de uso
 */
export interface RateLimitMetrics {
  /**
   * Total de requisições bloqueadas por rate limit
   *
   * TIPO: Counter
   * LABELS: route, user_id, reason (minute/hour/day limit exceeded)
   *
   * ALERTAS:
   * - Alta taxa: Usuário pode estar abusando da API
   * - Muitos usuários: Limites podem estar muito restritivos
   */
  requestsBlocked: number;

  /**
   * Total de requisições permitidas
   *
   * TIPO: Counter
   * LABELS: route, user_id
   *
   * PROPÓSITO:
   * Calcular taxa de bloqueio: blocked / (blocked + allowed)
   */
  requestsAllowed: number;

  /**
   * Contadores de bloqueios por usuário
   *
   * ESTRUTURA:
   * ```
   * {
   *   'user-001': 150,  // Bloqueado 150 vezes
   *   'user-002': 5
   * }
   * ```
   */
  limitsByUser: Record<string, number>;

  /**
   * Contadores de bloqueios por endpoint
   *
   * ESTRUTURA:
   * ```
   * {
   *   '/api/items': 200,
   *   '/api/search': 50
   * }
   * ```
   */
  limitsByEndpoint: Record<string, number>;
}

/**
 * ========================================
 * MÉTRICAS DE SISTEMA (NODE.JS)
 * ========================================
 */

/**
 * Métricas do sistema Node.js
 *
 * PROPÓSITO:
 * Monitorar saúde e recursos do processo Node.js
 *
 * CASOS DE USO:
 * - Detectar memory leaks
 * - Monitorar uso de CPU
 * - Identificar necessidade de escalar
 * - Alertar sobre problemas de recurso
 */
export interface SystemMetrics {
  /**
   * Tempo de atividade do processo em segundos
   *
   * TIPO: Gauge
   *
   * PROPÓSITO:
   * Verificar estabilidade e tempo desde último restart
   */
  uptime: number;

  /**
   * Uso de memória do processo
   *
   * DETALHES:
   * - heapUsed: Memória heap em uso (JavaScript objects)
   * - heapTotal: Total de heap alocado
   * - rss: Resident Set Size - memória total do processo
   * - external: Memória de buffers C++ (fora do heap V8)
   *
   * ALERTAS SUGERIDOS:
   * - heapUsed > 1GB: Considerar otimizar
   * - heapUsed > 80% heapTotal: Próximo ao limite
   * - rss > 2GB: Memory leak possível
   */
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };

  /**
   * Uso de CPU do processo
   *
   * DETALHES:
   * - user: Tempo de CPU em modo usuário (microsegundos)
   * - system: Tempo de CPU em modo kernel (microsegundos)
   *
   * ALERTAS:
   * - Alta utilização sustentada: Gargalo de CPU
   */
  cpuUsage: {
    user: number;
    system: number;
  };
}

/**
 * ========================================
 * RESUMO AGREGADO DE MÉTRICAS
 * ========================================
 */

/**
 * Agregação de todas as métricas da aplicação
 *
 * PROPÓSITO:
 * Fornecer snapshot completo do estado da aplicação
 *
 * USO:
 * ```typescript
 * // Endpoint /metrics/summary
 * const summary: MetricsSummary = {
 *   timestamp: new Date().toISOString(),
 *   http: httpMetrics,
 *   database: dbMetrics,
 *   rateLimit: rateLimitMetrics,
 *   system: systemMetrics
 * };
 * ```
 */
export interface MetricsSummary {
  /**
   * Timestamp da coleta em formato ISO 8601
   *
   * EXEMPLO: "2025-01-04T15:30:00.000Z"
   */
  timestamp: string;

  /**
   * Métricas de requisições HTTP/API
   */
  http: HttpMetrics;

  /**
   * Métricas de banco de dados
   */
  database: DatabaseMetrics;

  /**
   * Métricas de rate limiting
   */
  rateLimit: RateLimitMetrics;

  /**
   * Métricas de sistema Node.js
   */
  system: SystemMetrics;
}

/**
 * ========================================
 * TIPOS PROMETHEUS
 * ========================================
 */

/**
 * Tipos de métricas suportados pelo Prometheus
 *
 * DESCRIÇÃO:
 * - counter: Valor que só aumenta (ex: total de requests)
 * - gauge: Valor que pode subir e descer (ex: requests ativas)
 * - histogram: Distribução de valores (ex: duração de requests)
 * - summary: Similar ao histogram, com quantiles calculados
 *
 * @see https://prometheus.io/docs/concepts/metric_types/
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

/**
 * Definição de uma métrica Prometheus
 *
 * PROPÓSITO:
 * Estrutura para criar novas métricas dinamicamente
 *
 * EXEMPLO:
 * ```typescript
 * const definition: MetricDefinition = {
 *   name: 'lor0138_custom_metric_total',
 *   help: 'Total de operações customizadas',
 *   type: 'counter',
 *   labelNames: ['operation', 'status']
 * };
 * ```
 */
export interface MetricDefinition {
  /**
   * Nome da métrica
   *
   * CONVENÇÕES:
   * - Usar snake_case
   * - Incluir unidade no nome (ex: _seconds, _bytes, _total)
   * - Usar prefixo da aplicação
   */
  name: string;

  /**
   * Descrição da métrica (aparece no Prometheus)
   *
   * BOAS PRÁTICAS:
   * - Descrever o que é medido
   * - Mencionar unidade se aplicável
   * - Ser conciso mas informativo
   */
  help: string;

  /**
   * Tipo da métrica Prometheus
   */
  type: MetricType;

  /**
   * Labels (dimensões) da métrica
   *
   * PROPÓSITO:
   * Permitir agregação e filtragem em queries
   *
   * EXEMPLOS:
   * - ['method', 'route', 'status_code']
   * - ['database', 'operation']
   * - ['user_id', 'tier']
   *
   * IMPORTANTE:
   * - Evitar alta cardinalidade (ex: correlation_id como label)
   * - Máximo recomendado: 10 labels por métrica
   *
   * @optional
   */
  labelNames?: string[];
}