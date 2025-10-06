// @ts-nocheck
// src/server.ts
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
import dotenv from 'dotenv';
import { log } from '@shared/utils/logger';
import { setupGracefulShutdown } from '@shared/utils/gracefulShutdown';
import { DatabaseManager } from './infrastructure/database/DatabaseManager';
import { App } from './app';
import { CacheManager } from '@shared/utils/cacheManager';
import { configValidator } from '@config/configValidator';
import { ApiKeyService } from '@shared/services/ApiKeyService';
import { appConfig } from '@config/app.config';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Inicializa a aplicação
 *
 * Ordem de execução:
 * 1. Validação de configurações (Fail Fast)
 * 2. Inicialização do cache (L1/L2)
 * 3. Inicialização do banco de dados
 * 4. Inicialização do sistema de API Keys
 * 5. Inicialização do Express
 * 6. Setup de Graceful Shutdown
 */
async function startServer(): Promise<void> {
  if (stryMutAct_9fa48("2160")) {
    {}
  } else {
    stryCov_9fa48("2160");
    try {
      if (stryMutAct_9fa48("2161")) {
        {}
      } else {
        stryCov_9fa48("2161");
        log.info(stryMutAct_9fa48("2162") ? "" : (stryCov_9fa48("2162"), '🚀 Iniciando servidor lor0138...'));

        // ============================================
        // 1. Validar configurações do .env
        // ============================================
        log.info(stryMutAct_9fa48("2163") ? "" : (stryCov_9fa48("2163"), '📋 Validando configurações...'));
        configValidator.validate();
        log.info(stryMutAct_9fa48("2164") ? "" : (stryCov_9fa48("2164"), '✅ Configurações válidas'));

        // ============================================
        // 2. Inicializar sistema de cache (L1/L2)
        // ============================================
        log.info(stryMutAct_9fa48("2165") ? "" : (stryCov_9fa48("2165"), '💾 Inicializando sistema de cache...'));
        const cacheStrategy = stryMutAct_9fa48("2168") ? process.env.CACHE_STRATEGY && 'memory' : stryMutAct_9fa48("2167") ? false : stryMutAct_9fa48("2166") ? true : (stryCov_9fa48("2166", "2167", "2168"), process.env.CACHE_STRATEGY || (stryMutAct_9fa48("2169") ? "" : (stryCov_9fa48("2169"), 'memory')));
        const cacheEnabled = stryMutAct_9fa48("2172") ? process.env.CACHE_ENABLED === 'false' : stryMutAct_9fa48("2171") ? false : stryMutAct_9fa48("2170") ? true : (stryCov_9fa48("2170", "2171", "2172"), process.env.CACHE_ENABLED !== (stryMutAct_9fa48("2173") ? "" : (stryCov_9fa48("2173"), 'false')));
        if (stryMutAct_9fa48("2175") ? false : stryMutAct_9fa48("2174") ? true : (stryCov_9fa48("2174", "2175"), cacheEnabled)) {
          if (stryMutAct_9fa48("2176")) {
            {}
          } else {
            stryCov_9fa48("2176");
            CacheManager.initialize(cacheStrategy);

            // Verificar se Redis está pronto (para estratégias redis/layered)
            if (stryMutAct_9fa48("2178") ? false : stryMutAct_9fa48("2177") ? true : (stryCov_9fa48("2177", "2178"), (stryMutAct_9fa48("2179") ? [] : (stryCov_9fa48("2179"), [stryMutAct_9fa48("2180") ? "" : (stryCov_9fa48("2180"), 'layered'), stryMutAct_9fa48("2181") ? "" : (stryCov_9fa48("2181"), 'redis')])).includes(cacheStrategy))) {
              if (stryMutAct_9fa48("2182")) {
                {}
              } else {
                stryCov_9fa48("2182");
                const isReady = await CacheManager.isReady();
                if (stryMutAct_9fa48("2184") ? false : stryMutAct_9fa48("2183") ? true : (stryCov_9fa48("2183", "2184"), isReady)) {
                  if (stryMutAct_9fa48("2185")) {
                    {}
                  } else {
                    stryCov_9fa48("2185");
                    log.info(stryMutAct_9fa48("2186") ? "" : (stryCov_9fa48("2186"), '✅ Cache inicializado'), stryMutAct_9fa48("2187") ? {} : (stryCov_9fa48("2187"), {
                      strategy: cacheStrategy,
                      redis: stryMutAct_9fa48("2188") ? "" : (stryCov_9fa48("2188"), 'conectado')
                    }));
                  }
                } else {
                  if (stryMutAct_9fa48("2189")) {
                    {}
                  } else {
                    stryCov_9fa48("2189");
                    log.warn(stryMutAct_9fa48("2190") ? "" : (stryCov_9fa48("2190"), '⚠️  Redis não está pronto, usando fallback L1'), stryMutAct_9fa48("2191") ? {} : (stryCov_9fa48("2191"), {
                      strategy: cacheStrategy,
                      fallback: stryMutAct_9fa48("2192") ? "" : (stryCov_9fa48("2192"), 'memory')
                    }));
                  }
                }
              }
            } else {
              if (stryMutAct_9fa48("2193")) {
                {}
              } else {
                stryCov_9fa48("2193");
                log.info(stryMutAct_9fa48("2194") ? "" : (stryCov_9fa48("2194"), '✅ Cache inicializado'), stryMutAct_9fa48("2195") ? {} : (stryCov_9fa48("2195"), {
                  strategy: cacheStrategy
                }));
              }
            }
          }
        } else {
          if (stryMutAct_9fa48("2196")) {
            {}
          } else {
            stryCov_9fa48("2196");
            log.warn(stryMutAct_9fa48("2197") ? "" : (stryCov_9fa48("2197"), '⚠️  Cache desabilitado (CACHE_ENABLED=false)'));
          }
        }

        // ============================================
        // 3. Inicializar conexões do banco de dados
        // ============================================
        log.info(stryMutAct_9fa48("2198") ? "" : (stryCov_9fa48("2198"), '🗄️  Inicializando banco de dados...'));
        await DatabaseManager.initialize();
        const dbStatus = DatabaseManager.getConnectionStatus();
        if (stryMutAct_9fa48("2201") ? dbStatus.mode !== 'MOCK_DATA' : stryMutAct_9fa48("2200") ? false : stryMutAct_9fa48("2199") ? true : (stryCov_9fa48("2199", "2200", "2201"), dbStatus.mode === (stryMutAct_9fa48("2202") ? "" : (stryCov_9fa48("2202"), 'MOCK_DATA')))) {
          if (stryMutAct_9fa48("2203")) {
            {}
          } else {
            stryCov_9fa48("2203");
            log.warn(stryMutAct_9fa48("2204") ? "" : (stryCov_9fa48("2204"), '⚠️  Sistema em modo MOCK_DATA'), stryMutAct_9fa48("2205") ? {} : (stryCov_9fa48("2205"), {
              type: dbStatus.type,
              error: dbStatus.error
            }));
          }
        } else {
          if (stryMutAct_9fa48("2206")) {
            {}
          } else {
            stryCov_9fa48("2206");
            log.info(stryMutAct_9fa48("2207") ? "" : (stryCov_9fa48("2207"), '✅ Banco de dados conectado'), stryMutAct_9fa48("2208") ? {} : (stryCov_9fa48("2208"), {
              type: dbStatus.type,
              mode: dbStatus.mode
            }));
          }
        }

        // ============================================
        // 4. Inicializar sistema de API Keys
        // ============================================
        log.info(stryMutAct_9fa48("2209") ? "" : (stryCov_9fa48("2209"), '🔑 Inicializando sistema de API Keys...'));
        ApiKeyService.initialize();
        const apiKeyStats = ApiKeyService.getStats();
        log.info(stryMutAct_9fa48("2210") ? "" : (stryCov_9fa48("2210"), '✅ API Keys inicializadas'), apiKeyStats);

        // ============================================
        // 5. Inicializar aplicação Express
        // ============================================
        log.info(stryMutAct_9fa48("2211") ? "" : (stryCov_9fa48("2211"), '🌐 Inicializando servidor HTTP...'));
        const app = new App();
        const PORT = parseInt(stryMutAct_9fa48("2214") ? process.env.PORT && '3000' : stryMutAct_9fa48("2213") ? false : stryMutAct_9fa48("2212") ? true : (stryCov_9fa48("2212", "2213", "2214"), process.env.PORT || (stryMutAct_9fa48("2215") ? "" : (stryCov_9fa48("2215"), '3000'))), 10);
        const HOST = stryMutAct_9fa48("2218") ? process.env.HOST && '0.0.0.0' : stryMutAct_9fa48("2217") ? false : stryMutAct_9fa48("2216") ? true : (stryCov_9fa48("2216", "2217", "2218"), process.env.HOST || (stryMutAct_9fa48("2219") ? "" : (stryCov_9fa48("2219"), '0.0.0.0')));
        const server = app.getExpressApp().listen(appConfig.port, appConfig.host, () => {
          if (stryMutAct_9fa48("2220")) {
            {}
          } else {
            stryCov_9fa48("2220");
            log.info(stryMutAct_9fa48("2221") ? "" : (stryCov_9fa48("2221"), '✅ Servidor HTTP iniciado'), stryMutAct_9fa48("2222") ? {} : (stryCov_9fa48("2222"), {
              port: PORT,
              host: HOST,
              url: appConfig.baseUrl,
              env: stryMutAct_9fa48("2225") ? process.env.NODE_ENV && 'development' : stryMutAct_9fa48("2224") ? false : stryMutAct_9fa48("2223") ? true : (stryCov_9fa48("2223", "2224", "2225"), process.env.NODE_ENV || (stryMutAct_9fa48("2226") ? "" : (stryCov_9fa48("2226"), 'development'))),
              pid: process.pid
            }));
            log.info(stryMutAct_9fa48("2227") ? "" : (stryCov_9fa48("2227"), '📚 Documentação disponível'), stryMutAct_9fa48("2228") ? {} : (stryCov_9fa48("2228"), {
              swagger: stryMutAct_9fa48("2229") ? `` : (stryCov_9fa48("2229"), `http://lor0138.lorenzetti.ibe:${PORT}/api-docs`),
              health: stryMutAct_9fa48("2230") ? `` : (stryCov_9fa48("2230"), `http://lor0138.lorenzetti.ibe:${PORT}/health`),
              cache: cacheEnabled ? stryMutAct_9fa48("2231") ? `` : (stryCov_9fa48("2231"), `http://lor0138.lorenzetti.ibe:${PORT}/cache/stats`) : stryMutAct_9fa48("2232") ? "" : (stryCov_9fa48("2232"), 'disabled'),
              admin: stryMutAct_9fa48("2233") ? `` : (stryCov_9fa48("2233"), `http://lor0138.lorenzetti.ibe:${PORT}/admin/api-keys`)
            }));

            // Exibir API Keys de exemplo
            log.info(stryMutAct_9fa48("2234") ? "" : (stryCov_9fa48("2234"), '🔑 API Keys de exemplo:'));
            log.info(stryMutAct_9fa48("2235") ? "" : (stryCov_9fa48("2235"), '   Free:       free-demo-key-123456'));
            log.info(stryMutAct_9fa48("2236") ? "" : (stryCov_9fa48("2236"), '   Premium:    premium-key-abc123'));
            log.info(stryMutAct_9fa48("2237") ? "" : (stryCov_9fa48("2237"), '   Enterprise: enterprise-key-xyz789'));
            log.info(stryMutAct_9fa48("2238") ? "" : (stryCov_9fa48("2238"), '   Admin:      admin-key-superuser'));

            // Exibir estatísticas de cache (se habilitado)
            if (stryMutAct_9fa48("2240") ? false : stryMutAct_9fa48("2239") ? true : (stryCov_9fa48("2239", "2240"), cacheEnabled)) {
              if (stryMutAct_9fa48("2241")) {
                {}
              } else {
                stryCov_9fa48("2241");
                const stats = CacheManager.getStats();
                log.info(stryMutAct_9fa48("2242") ? "" : (stryCov_9fa48("2242"), '📊 Cache stats:'), stats);
              }
            }
          }
        });

        // ============================================
        // 6. Setup de Graceful Shutdown
        // ============================================
        const shutdownTimeout = parseInt(stryMutAct_9fa48("2245") ? process.env.SHUTDOWN_TIMEOUT && '10000' : stryMutAct_9fa48("2244") ? false : stryMutAct_9fa48("2243") ? true : (stryCov_9fa48("2243", "2244", "2245"), process.env.SHUTDOWN_TIMEOUT || (stryMutAct_9fa48("2246") ? "" : (stryCov_9fa48("2246"), '10000'))), 10);
        setupGracefulShutdown(server, stryMutAct_9fa48("2247") ? {} : (stryCov_9fa48("2247"), {
          timeout: shutdownTimeout,
          onShutdownStart: async () => {
            if (stryMutAct_9fa48("2248")) {
              {}
            } else {
              stryCov_9fa48("2248");
              log.info(stryMutAct_9fa48("2249") ? "" : (stryCov_9fa48("2249"), '🛑 Shutdown iniciado'), stryMutAct_9fa48("2250") ? {} : (stryCov_9fa48("2250"), {
                pid: process.pid,
                uptime: process.uptime()
              }));

              // Fechar cache (Redis, se estiver usando)
              if (stryMutAct_9fa48("2252") ? false : stryMutAct_9fa48("2251") ? true : (stryCov_9fa48("2251", "2252"), cacheEnabled)) {
                if (stryMutAct_9fa48("2253")) {
                  {}
                } else {
                  stryCov_9fa48("2253");
                  log.info(stryMutAct_9fa48("2254") ? "" : (stryCov_9fa48("2254"), '💾 Fechando conexões de cache...'));
                  try {
                    if (stryMutAct_9fa48("2255")) {
                      {}
                    } else {
                      stryCov_9fa48("2255");
                      await CacheManager.close();
                      log.info(stryMutAct_9fa48("2256") ? "" : (stryCov_9fa48("2256"), '✅ Cache fechado com sucesso'));
                    }
                  } catch (error) {
                    if (stryMutAct_9fa48("2257")) {
                      {}
                    } else {
                      stryCov_9fa48("2257");
                      log.error(stryMutAct_9fa48("2258") ? "" : (stryCov_9fa48("2258"), '❌ Erro ao fechar cache'), stryMutAct_9fa48("2259") ? {} : (stryCov_9fa48("2259"), {
                        error: error instanceof Error ? error.message : stryMutAct_9fa48("2260") ? "" : (stryCov_9fa48("2260"), 'Unknown error')
                      }));
                    }
                  }
                }
              }

              // Fechar banco de dados
              log.info(stryMutAct_9fa48("2261") ? "" : (stryCov_9fa48("2261"), '🗄️  Fechando conexões do banco de dados...'));
              try {
                if (stryMutAct_9fa48("2262")) {
                  {}
                } else {
                  stryCov_9fa48("2262");
                  await DatabaseManager.close();
                  log.info(stryMutAct_9fa48("2263") ? "" : (stryCov_9fa48("2263"), '✅ Banco de dados fechado com sucesso'));
                }
              } catch (error) {
                if (stryMutAct_9fa48("2264")) {
                  {}
                } else {
                  stryCov_9fa48("2264");
                  log.error(stryMutAct_9fa48("2265") ? "" : (stryCov_9fa48("2265"), '❌ Erro ao fechar banco de dados'), stryMutAct_9fa48("2266") ? {} : (stryCov_9fa48("2266"), {
                    error: error instanceof Error ? error.message : stryMutAct_9fa48("2267") ? "" : (stryCov_9fa48("2267"), 'Unknown error')
                  }));
                }
              }
            }
          },
          onShutdownComplete: () => {
            if (stryMutAct_9fa48("2268")) {
              {}
            } else {
              stryCov_9fa48("2268");
              log.info(stryMutAct_9fa48("2269") ? "" : (stryCov_9fa48("2269"), '👋 Adeus!'), stryMutAct_9fa48("2270") ? {} : (stryCov_9fa48("2270"), {
                pid: process.pid,
                finalUptime: process.uptime()
              }));
            }
          }
        }));

        // ============================================
        // ✅ Sistema pronto!
        // ============================================
        log.info(stryMutAct_9fa48("2271") ? "" : (stryCov_9fa48("2271"), '🎉 Sistema pronto para receber requisições!'), stryMutAct_9fa48("2272") ? {} : (stryCov_9fa48("2272"), {
          cache: cacheEnabled ? cacheStrategy : stryMutAct_9fa48("2273") ? "" : (stryCov_9fa48("2273"), 'disabled'),
          database: dbStatus.mode,
          apiKeys: apiKeyStats.total,
          port: PORT
        }));
      }
    } catch (error) {
      if (stryMutAct_9fa48("2274")) {
        {}
      } else {
        stryCov_9fa48("2274");
        log.error(stryMutAct_9fa48("2275") ? "" : (stryCov_9fa48("2275"), '❌ Erro fatal ao iniciar servidor'), stryMutAct_9fa48("2276") ? {} : (stryCov_9fa48("2276"), {
          error: error instanceof Error ? error.message : stryMutAct_9fa48("2277") ? "" : (stryCov_9fa48("2277"), 'Unknown error'),
          stack: error instanceof Error ? error.stack : undefined
        }));

        // Tenta fechar conexões antes de encerrar
        try {
          if (stryMutAct_9fa48("2278")) {
            {}
          } else {
            stryCov_9fa48("2278");
            await CacheManager.close();
            await DatabaseManager.close();
          }
        } catch (closeError) {
          if (stryMutAct_9fa48("2279")) {
            {}
          } else {
            stryCov_9fa48("2279");
            log.error(stryMutAct_9fa48("2280") ? "" : (stryCov_9fa48("2280"), '❌ Erro ao fechar conexões durante erro fatal'), stryMutAct_9fa48("2281") ? {} : (stryCov_9fa48("2281"), {
              error: closeError instanceof Error ? closeError.message : stryMutAct_9fa48("2282") ? "" : (stryCov_9fa48("2282"), 'Unknown')
            }));
          }
        }

        // Aguarda logs serem gravados antes de encerrar
        setTimeout(() => {
          if (stryMutAct_9fa48("2283")) {
            {}
          } else {
            stryCov_9fa48("2283");
            process.exit(1);
          }
        }, 100);
      }
    }
  }
}

// Iniciar servidor
startServer();