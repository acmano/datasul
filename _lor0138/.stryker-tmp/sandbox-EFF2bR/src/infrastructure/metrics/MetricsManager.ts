// @ts-nocheck
// src/infrastructure/metrics/MetricsManager.ts
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
import client from 'prom-client';
import { MetricsConfig } from '@shared/types/metrics.types';

/**
 * Gerenciador central de métricas Prometheus
 * Singleton que gerencia todas as métricas da aplicação
 */
export class MetricsManager {
  private static instance: MetricsManager | null = null;
  private registry: client.Registry;
  private isInitialized: boolean = stryMutAct_9fa48("1955") ? true : (stryCov_9fa48("1955"), false);

  // 📊 HTTP Metrics
  public httpRequestsTotal: client.Counter<string>;
  public httpRequestDuration: client.Histogram<string>;
  public httpRequestsInProgress: client.Gauge<string>;

  // 🗄️ Database Metrics
  public dbQueriesTotal: client.Counter<string>;
  public dbQueryDuration: client.Histogram<string>;
  public dbQueriesInProgress: client.Gauge<string>;
  public dbQueryErrors: client.Counter<string>;
  public dbConnectionsActive: client.Gauge<string>;
  public dbConnectionErrors: client.Counter<string>;

  // 🔒 Rate Limit Metrics
  public rateLimitRequestsBlocked: client.Counter<string>;
  public rateLimitRequestsAllowed: client.Counter<string>;

  // ⚕️ Health Metrics
  public healthCheckStatus: client.Gauge<string>;
  public healthCheckDuration: client.Histogram<string>;
  private constructor(config: MetricsConfig) {
    if (stryMutAct_9fa48("1956")) {
      {}
    } else {
      stryCov_9fa48("1956");
      this.registry = new client.Registry();

      // Labels padrão para todas as métricas
      if (stryMutAct_9fa48("1958") ? false : stryMutAct_9fa48("1957") ? true : (stryCov_9fa48("1957", "1958"), config.defaultLabels)) {
        if (stryMutAct_9fa48("1959")) {
          {}
        } else {
          stryCov_9fa48("1959");
          this.registry.setDefaultLabels(config.defaultLabels);
        }
      }

      // Prefixo para todas as métricas
      const prefix = stryMutAct_9fa48("1962") ? config.prefix && 'lor0138_' : stryMutAct_9fa48("1961") ? false : stryMutAct_9fa48("1960") ? true : (stryCov_9fa48("1960", "1961", "1962"), config.prefix || (stryMutAct_9fa48("1963") ? "" : (stryCov_9fa48("1963"), 'lor0138_')));

      // ========================================
      // 📊 HTTP METRICS
      // ========================================
      this.httpRequestsTotal = new client.Counter(stryMutAct_9fa48("1964") ? {} : (stryCov_9fa48("1964"), {
        name: stryMutAct_9fa48("1965") ? `` : (stryCov_9fa48("1965"), `${prefix}http_requests_total`),
        help: stryMutAct_9fa48("1966") ? "" : (stryCov_9fa48("1966"), 'Total de requisições HTTP'),
        labelNames: stryMutAct_9fa48("1967") ? [] : (stryCov_9fa48("1967"), [stryMutAct_9fa48("1968") ? "" : (stryCov_9fa48("1968"), 'method'), stryMutAct_9fa48("1969") ? "" : (stryCov_9fa48("1969"), 'route'), stryMutAct_9fa48("1970") ? "" : (stryCov_9fa48("1970"), 'status_code')]),
        registers: stryMutAct_9fa48("1971") ? [] : (stryCov_9fa48("1971"), [this.registry])
      }));
      this.httpRequestDuration = new client.Histogram(stryMutAct_9fa48("1972") ? {} : (stryCov_9fa48("1972"), {
        name: stryMutAct_9fa48("1973") ? `` : (stryCov_9fa48("1973"), `${prefix}http_request_duration_seconds`),
        help: stryMutAct_9fa48("1974") ? "" : (stryCov_9fa48("1974"), 'Duração das requisições HTTP em segundos'),
        labelNames: stryMutAct_9fa48("1975") ? [] : (stryCov_9fa48("1975"), [stryMutAct_9fa48("1976") ? "" : (stryCov_9fa48("1976"), 'method'), stryMutAct_9fa48("1977") ? "" : (stryCov_9fa48("1977"), 'route'), stryMutAct_9fa48("1978") ? "" : (stryCov_9fa48("1978"), 'status_code')]),
        buckets: stryMutAct_9fa48("1979") ? [] : (stryCov_9fa48("1979"), [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]),
        registers: stryMutAct_9fa48("1980") ? [] : (stryCov_9fa48("1980"), [this.registry])
      }));
      this.httpRequestsInProgress = new client.Gauge(stryMutAct_9fa48("1981") ? {} : (stryCov_9fa48("1981"), {
        name: stryMutAct_9fa48("1982") ? `` : (stryCov_9fa48("1982"), `${prefix}http_requests_in_progress`),
        help: stryMutAct_9fa48("1983") ? "" : (stryCov_9fa48("1983"), 'Número de requisições HTTP em andamento'),
        labelNames: stryMutAct_9fa48("1984") ? [] : (stryCov_9fa48("1984"), [stryMutAct_9fa48("1985") ? "" : (stryCov_9fa48("1985"), 'method'), stryMutAct_9fa48("1986") ? "" : (stryCov_9fa48("1986"), 'route')]),
        registers: stryMutAct_9fa48("1987") ? [] : (stryCov_9fa48("1987"), [this.registry])
      }));

      // ========================================
      // 🗄️ DATABASE METRICS
      // ========================================
      this.dbQueriesTotal = new client.Counter(stryMutAct_9fa48("1988") ? {} : (stryCov_9fa48("1988"), {
        name: stryMutAct_9fa48("1989") ? `` : (stryCov_9fa48("1989"), `${prefix}db_queries_total`),
        help: stryMutAct_9fa48("1990") ? "" : (stryCov_9fa48("1990"), 'Total de queries executadas'),
        labelNames: stryMutAct_9fa48("1991") ? [] : (stryCov_9fa48("1991"), [stryMutAct_9fa48("1992") ? "" : (stryCov_9fa48("1992"), 'database'), stryMutAct_9fa48("1993") ? "" : (stryCov_9fa48("1993"), 'operation')]),
        registers: stryMutAct_9fa48("1994") ? [] : (stryCov_9fa48("1994"), [this.registry])
      }));
      this.dbQueryDuration = new client.Histogram(stryMutAct_9fa48("1995") ? {} : (stryCov_9fa48("1995"), {
        name: stryMutAct_9fa48("1996") ? `` : (stryCov_9fa48("1996"), `${prefix}db_query_duration_seconds`),
        help: stryMutAct_9fa48("1997") ? "" : (stryCov_9fa48("1997"), 'Duração das queries em segundos'),
        labelNames: stryMutAct_9fa48("1998") ? [] : (stryCov_9fa48("1998"), [stryMutAct_9fa48("1999") ? "" : (stryCov_9fa48("1999"), 'database'), stryMutAct_9fa48("2000") ? "" : (stryCov_9fa48("2000"), 'operation')]),
        buckets: stryMutAct_9fa48("2001") ? [] : (stryCov_9fa48("2001"), [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]),
        registers: stryMutAct_9fa48("2002") ? [] : (stryCov_9fa48("2002"), [this.registry])
      }));
      this.dbQueriesInProgress = new client.Gauge(stryMutAct_9fa48("2003") ? {} : (stryCov_9fa48("2003"), {
        name: stryMutAct_9fa48("2004") ? `` : (stryCov_9fa48("2004"), `${prefix}db_queries_in_progress`),
        help: stryMutAct_9fa48("2005") ? "" : (stryCov_9fa48("2005"), 'Número de queries em andamento'),
        labelNames: stryMutAct_9fa48("2006") ? [] : (stryCov_9fa48("2006"), [stryMutAct_9fa48("2007") ? "" : (stryCov_9fa48("2007"), 'database')]),
        registers: stryMutAct_9fa48("2008") ? [] : (stryCov_9fa48("2008"), [this.registry])
      }));
      this.dbQueryErrors = new client.Counter(stryMutAct_9fa48("2009") ? {} : (stryCov_9fa48("2009"), {
        name: stryMutAct_9fa48("2010") ? `` : (stryCov_9fa48("2010"), `${prefix}db_query_errors_total`),
        help: stryMutAct_9fa48("2011") ? "" : (stryCov_9fa48("2011"), 'Total de erros em queries'),
        labelNames: stryMutAct_9fa48("2012") ? [] : (stryCov_9fa48("2012"), [stryMutAct_9fa48("2013") ? "" : (stryCov_9fa48("2013"), 'database'), stryMutAct_9fa48("2014") ? "" : (stryCov_9fa48("2014"), 'error_type')]),
        registers: stryMutAct_9fa48("2015") ? [] : (stryCov_9fa48("2015"), [this.registry])
      }));
      this.dbConnectionsActive = new client.Gauge(stryMutAct_9fa48("2016") ? {} : (stryCov_9fa48("2016"), {
        name: stryMutAct_9fa48("2017") ? `` : (stryCov_9fa48("2017"), `${prefix}db_connections_active`),
        help: stryMutAct_9fa48("2018") ? "" : (stryCov_9fa48("2018"), 'Número de conexões ativas com o banco'),
        labelNames: stryMutAct_9fa48("2019") ? [] : (stryCov_9fa48("2019"), [stryMutAct_9fa48("2020") ? "" : (stryCov_9fa48("2020"), 'database')]),
        registers: stryMutAct_9fa48("2021") ? [] : (stryCov_9fa48("2021"), [this.registry])
      }));
      this.dbConnectionErrors = new client.Counter(stryMutAct_9fa48("2022") ? {} : (stryCov_9fa48("2022"), {
        name: stryMutAct_9fa48("2023") ? `` : (stryCov_9fa48("2023"), `${prefix}db_connection_errors_total`),
        help: stryMutAct_9fa48("2024") ? "" : (stryCov_9fa48("2024"), 'Total de erros de conexão'),
        labelNames: stryMutAct_9fa48("2025") ? [] : (stryCov_9fa48("2025"), [stryMutAct_9fa48("2026") ? "" : (stryCov_9fa48("2026"), 'database'), stryMutAct_9fa48("2027") ? "" : (stryCov_9fa48("2027"), 'error_type')]),
        registers: stryMutAct_9fa48("2028") ? [] : (stryCov_9fa48("2028"), [this.registry])
      }));

      // ========================================
      // 🔒 RATE LIMIT METRICS
      // ========================================
      this.rateLimitRequestsBlocked = new client.Counter(stryMutAct_9fa48("2029") ? {} : (stryCov_9fa48("2029"), {
        name: stryMutAct_9fa48("2030") ? `` : (stryCov_9fa48("2030"), `${prefix}rate_limit_requests_blocked_total`),
        help: stryMutAct_9fa48("2031") ? "" : (stryCov_9fa48("2031"), 'Total de requisições bloqueadas por rate limit'),
        labelNames: stryMutAct_9fa48("2032") ? [] : (stryCov_9fa48("2032"), [stryMutAct_9fa48("2033") ? "" : (stryCov_9fa48("2033"), 'route'), stryMutAct_9fa48("2034") ? "" : (stryCov_9fa48("2034"), 'user_id'), stryMutAct_9fa48("2035") ? "" : (stryCov_9fa48("2035"), 'reason')]),
        registers: stryMutAct_9fa48("2036") ? [] : (stryCov_9fa48("2036"), [this.registry])
      }));
      this.rateLimitRequestsAllowed = new client.Counter(stryMutAct_9fa48("2037") ? {} : (stryCov_9fa48("2037"), {
        name: stryMutAct_9fa48("2038") ? `` : (stryCov_9fa48("2038"), `${prefix}rate_limit_requests_allowed_total`),
        help: stryMutAct_9fa48("2039") ? "" : (stryCov_9fa48("2039"), 'Total de requisições permitidas'),
        labelNames: stryMutAct_9fa48("2040") ? [] : (stryCov_9fa48("2040"), [stryMutAct_9fa48("2041") ? "" : (stryCov_9fa48("2041"), 'route'), stryMutAct_9fa48("2042") ? "" : (stryCov_9fa48("2042"), 'user_id')]),
        registers: stryMutAct_9fa48("2043") ? [] : (stryCov_9fa48("2043"), [this.registry])
      }));

      // ========================================
      // ⚕️ HEALTH METRICS
      // ========================================
      this.healthCheckStatus = new client.Gauge(stryMutAct_9fa48("2044") ? {} : (stryCov_9fa48("2044"), {
        name: stryMutAct_9fa48("2045") ? `` : (stryCov_9fa48("2045"), `${prefix}health_check_status`),
        help: stryMutAct_9fa48("2046") ? "" : (stryCov_9fa48("2046"), 'Status do health check (1 = healthy, 0 = unhealthy)'),
        labelNames: stryMutAct_9fa48("2047") ? [] : (stryCov_9fa48("2047"), [stryMutAct_9fa48("2048") ? "" : (stryCov_9fa48("2048"), 'component')]),
        registers: stryMutAct_9fa48("2049") ? [] : (stryCov_9fa48("2049"), [this.registry])
      }));
      this.healthCheckDuration = new client.Histogram(stryMutAct_9fa48("2050") ? {} : (stryCov_9fa48("2050"), {
        name: stryMutAct_9fa48("2051") ? `` : (stryCov_9fa48("2051"), `${prefix}health_check_duration_seconds`),
        help: stryMutAct_9fa48("2052") ? "" : (stryCov_9fa48("2052"), 'Duração do health check em segundos'),
        labelNames: stryMutAct_9fa48("2053") ? [] : (stryCov_9fa48("2053"), [stryMutAct_9fa48("2054") ? "" : (stryCov_9fa48("2054"), 'component')]),
        buckets: stryMutAct_9fa48("2055") ? [] : (stryCov_9fa48("2055"), [0.001, 0.005, 0.01, 0.025, 0.05, 0.1]),
        registers: stryMutAct_9fa48("2056") ? [] : (stryCov_9fa48("2056"), [this.registry])
      }));

      // ========================================
      // 💻 SYSTEM METRICS (Node.js default)
      // ========================================
      if (stryMutAct_9fa48("2059") ? config.collectDefaultMetrics === false : stryMutAct_9fa48("2058") ? false : stryMutAct_9fa48("2057") ? true : (stryCov_9fa48("2057", "2058", "2059"), config.collectDefaultMetrics !== (stryMutAct_9fa48("2060") ? true : (stryCov_9fa48("2060"), false)))) {
        if (stryMutAct_9fa48("2061")) {
          {}
        } else {
          stryCov_9fa48("2061");
          client.collectDefaultMetrics(stryMutAct_9fa48("2062") ? {} : (stryCov_9fa48("2062"), {
            register: this.registry,
            prefix
          }));
        }
      }
      this.isInitialized = stryMutAct_9fa48("2063") ? false : (stryCov_9fa48("2063"), true);
      console.log(stryMutAct_9fa48("2064") ? "" : (stryCov_9fa48("2064"), '✅ MetricsManager inicializado'));
    }
  }

  /**
   * Retorna instância singleton
   */
  static getInstance(config?: MetricsConfig): MetricsManager {
    if (stryMutAct_9fa48("2065")) {
      {}
    } else {
      stryCov_9fa48("2065");
      if (stryMutAct_9fa48("2068") ? false : stryMutAct_9fa48("2067") ? true : stryMutAct_9fa48("2066") ? this.instance : (stryCov_9fa48("2066", "2067", "2068"), !this.instance)) {
        if (stryMutAct_9fa48("2069")) {
          {}
        } else {
          stryCov_9fa48("2069");
          const defaultConfig: MetricsConfig = stryMutAct_9fa48("2070") ? {} : (stryCov_9fa48("2070"), {
            enabled: stryMutAct_9fa48("2071") ? false : (stryCov_9fa48("2071"), true),
            collectDefaultMetrics: stryMutAct_9fa48("2072") ? false : (stryCov_9fa48("2072"), true),
            prefix: stryMutAct_9fa48("2073") ? "" : (stryCov_9fa48("2073"), 'lor0138_'),
            defaultLabels: stryMutAct_9fa48("2074") ? {} : (stryCov_9fa48("2074"), {
              app: stryMutAct_9fa48("2075") ? "" : (stryCov_9fa48("2075"), 'lor0138'),
              environment: stryMutAct_9fa48("2078") ? process.env.NODE_ENV && 'development' : stryMutAct_9fa48("2077") ? false : stryMutAct_9fa48("2076") ? true : (stryCov_9fa48("2076", "2077", "2078"), process.env.NODE_ENV || (stryMutAct_9fa48("2079") ? "" : (stryCov_9fa48("2079"), 'development'))),
              version: stryMutAct_9fa48("2082") ? process.env.npm_package_version && '1.0.0' : stryMutAct_9fa48("2081") ? false : stryMutAct_9fa48("2080") ? true : (stryCov_9fa48("2080", "2081", "2082"), process.env.npm_package_version || (stryMutAct_9fa48("2083") ? "" : (stryCov_9fa48("2083"), '1.0.0')))
            })
          });
          this.instance = new MetricsManager(stryMutAct_9fa48("2084") ? {} : (stryCov_9fa48("2084"), {
            ...defaultConfig,
            ...config
          }));
        }
      }
      return this.instance;
    }
  }

  /**
   * Retorna as métricas no formato Prometheus
   */
  async getMetrics(): Promise<string> {
    if (stryMutAct_9fa48("2085")) {
      {}
    } else {
      stryCov_9fa48("2085");
      return this.registry.metrics();
    }
  }

  /**
   * Retorna o registro para uso externo
   */
  getRegistry(): client.Registry {
    if (stryMutAct_9fa48("2086")) {
      {}
    } else {
      stryCov_9fa48("2086");
      return this.registry;
    }
  }

  /**
   * Reseta todas as métricas (útil para testes)
   */
  reset(): void {
    if (stryMutAct_9fa48("2087")) {
      {}
    } else {
      stryCov_9fa48("2087");
      this.registry.resetMetrics();
    }
  }

  /**
   * Verifica se está inicializado
   */
  isReady(): boolean {
    if (stryMutAct_9fa48("2088")) {
      {}
    } else {
      stryCov_9fa48("2088");
      return this.isInitialized;
    }
  }

  /**
   * Registra métrica customizada
   */
  registerCustomMetric(metric: client.Metric): void {
    if (stryMutAct_9fa48("2089")) {
      {}
    } else {
      stryCov_9fa48("2089");
      this.registry.registerMetric(metric);
    }
  }
}

// Export singleton instance
export const metricsManager = MetricsManager.getInstance();