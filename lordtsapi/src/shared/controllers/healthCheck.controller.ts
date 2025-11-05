// src/shared/controllers/healthCheck.controller.ts

import { Request, Response } from 'express';
import { HealthCheckService } from '../services/healthCheck.service';

/**
 * @fileoverview Controller de Health Check
 *
 * Fornece endpoints para monitoramento de saúde do sistema.
 * Essenciais para integração com Kubernetes, Docker, Load Balancers
 * e ferramentas de monitoramento.
 *
 * **Endpoints Disponíveis:**
 *
 * 1. **GET /health** - Health check completo
 *    - Verifica banco, memória, disco
 *    - Retorna status detalhado
 *    - Para dashboards e monitoramento
 *
 * 2. **GET /health/live** - Liveness probe
 *    - Verifica se processo está vivo
 *    - Para Kubernetes restarts
 *    - Sempre retorna 200
 *
 * 3. **GET /health/ready** - Readiness probe
 *    - Verifica se aceita tráfego
 *    - Para Load Balancers
 *    - 200 = pronto, 503 = não pronto
 *
 * **Status Codes:**
 * - 200: Sistema saudável (healthy/degraded)
 * - 503: Sistema não saudável (unhealthy)
 *
 * @module HealthCheckController
 * @category Controllers
 */

// ============================================================================
// CONTROLLER PRINCIPAL
// ============================================================================

/**
 * Controller para endpoints de health check
 *
 * Classe estática que agrupa os handlers dos endpoints de health check.
 * Todos os métodos são assíncronos e retornam Response diretamente.
 *
 * **Padrão de Resposta:**
 * - Sucesso: Status code apropriado + JSON
 * - Erro: Status 503 + JSON com erro
 * - Não lança exceções (sempre responde)
 *
 * **Integração:**
 * - Kubernetes: liveness e readiness probes
 * - Docker: healthcheck directive
 * - Load Balancers: upstream health checks
 * - Monitoramento: Prometheus, DataDog, etc
 *
 * @class HealthCheckController
 * @static
 *
 * @example
 * ```typescript
 * // Configuração de rotas
 * router.get('/health', HealthCheckController.healthCheck);
 * router.get('/health/live', HealthCheckController.liveness);
 * router.get('/health/ready', HealthCheckController.readiness);
 * ```
 */
export class HealthCheckController {
  // ==========================================================================
  // HEALTH CHECK COMPLETO
  // ==========================================================================

  /**
   * Health check completo do sistema
   *
   * Endpoint principal que executa verificação completa de todos os
   * componentes do sistema: banco de dados, memória, disco.
   *
   * **Comportamento:**
   * - Chama HealthCheckService.check()
   * - Retorna 200 se healthy ou degraded
   * - Retorna 503 se unhealthy
   * - Em caso de erro, retorna 503 com detalhes
   *
   * **Status Possíveis:**
   * - **healthy** (200): Tudo funcionando perfeitamente
   * - **degraded** (200): Funcionando com problemas não críticos
   * - **unhealthy** (503): Problemas críticos, não deve receber tráfego
   *
   * **Quando Usar:**
   * - Dashboards de monitoramento
   * - Alertas e notificações
   * - Diagnóstico manual de problemas
   * - Métricas detalhadas
   *
   * **NÃO Usar Para:**
   * - Liveness probes (muito pesado)
   * - Checks muito frequentes (pode sobrecarregar)
   *
   * @route GET /health
   * @param {Request} req - Request do Express (não utilizado)
   * @param {Response} res - Response do Express
   * @returns {Promise<void>}
   *
   * @example
   * ```bash
   * # Request
   * curl http://localhost:3000/health
   *
   * # Response 200 (healthy)
   * {
   *   "status": "healthy",
   *   "timestamp": "2025-10-04T17:00:00.000Z",
   *   "uptime": 3600,
   *   "checks": {
   *     "database": {
   *       "status": "ok",
   *       "responseTime": 45,
   *       "connectionType": "sqlserver",
   *       "mode": "REAL_DATABASE"
   *     },
   *     "memory": {
   *       "status": "ok",
   *       "used": 512,
   *       "total": 2048,
   *       "percentage": 25,
   *       "free": 1536
   *     },
   *     "disk": {
   *       "status": "ok"
   *     }
   *   }
   * }
   * ```
   *
   * @example
   * ```bash
   * # Response 503 (unhealthy)
   * {
   *   "status": "unhealthy",
   *   "timestamp": "2025-10-04T17:00:00.000Z",
   *   "uptime": 3600,
   *   "checks": {
   *     "database": {
   *       "status": "error",
   *       "error": "Connection timeout"
   *     },
   *     "memory": {
   *       "status": "critical",
   *       "percentage": 95
   *     }
   *   }
   * }
   * ```
   *
   * @critical
   * - Sempre retorna resposta (nunca lança exceção)
   * - Status 200 não significa 100% saudável (pode ser degraded)
   * - Status 503 indica problemas críticos
   *
   * @performance
   * - Depende do tempo de resposta do banco
   * - Típico: 10-100ms
   * - Timeout configurado: 5s (healthCheckTimeout middleware)
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Executa verificação completa
      const health = await HealthCheckService.check();

      // Determina status code baseado no status geral
      // 200 = healthy ou degraded (sistema operacional)
      // 503 = unhealthy (sistema com problemas críticos)
      const statusCode = health.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json(health);
    } catch (error) {
      // Erro inesperado durante health check
      // Loga e retorna unhealthy
      console.error('Erro no health check:', error);

      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ==========================================================================
  // LIVENESS PROBE
  // ==========================================================================

  /**
   * Liveness probe - Verifica se o processo está vivo
   *
   * Endpoint ultra-leve que apenas verifica se o processo Node.js está rodando.
   * Se este endpoint responder, significa que o processo está vivo e funcionando.
   *
   * **Comportamento:**
   * - Sempre retorna 200 OK
   * - Não faz verificações pesadas
   * - Retorna apenas status + timestamp + uptime
   *
   * **Kubernetes Liveness Probe:**
   * - Se falhar: Kubernetes mata e reinicia o pod
   * - Se passar: Kubernetes mantém o pod rodando
   * - Frequência típica: 10-30s
   *
   * **Quando Usar:**
   * - Liveness probe do Kubernetes
   * - Verificações simples de "está vivo?"
   * - Monitoramento básico
   *
   * **NÃO Usar Para:**
   * - Verificar saúde completa (use /health)
   * - Decidir se aceita tráfego (use /health/ready)
   * - Diagnóstico de problemas (use /health)
   *
   * @route GET /health/live
   * @param {Request} req - Request do Express (não utilizado)
   * @param {Response} res - Response do Express
   * @returns {Promise<void>}
   *
   * @example
   * ```bash
   * # Request
   * curl http://localhost:3000/health/live
   *
   * # Response 200 (sempre)
   * {
   *   "status": "alive",
   *   "timestamp": "2025-10-04T17:00:00.000Z",
   *   "uptime": 3600
   * }
   * ```
   *
   * @example
   * ```yaml
   * # Kubernetes deployment.yaml
   * livenessProbe:
   *   httpGet:
   *     path: /health/live
   *     port: 3000
   *   initialDelaySeconds: 30
   *   periodSeconds: 10
   *   timeoutSeconds: 5
   *   failureThreshold: 3
   * ```
   *
   * @note
   * - Este endpoint é extremamente leve e rápido (< 1ms)
   * - Se não responder, processo provavelmente travou
   * - Kubernetes automaticamente reinicia se falhar N vezes
   *
   * @critical
   * Sempre retorna 200 - se chegar aqui, processo está vivo
   */
  static async liveness(req: Request, res: Response): Promise<void> {
    // Se chegou aqui, o processo está vivo e respondendo
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  // ==========================================================================
  // READINESS PROBE
  // ==========================================================================

  /**
   * Readiness probe - Verifica se está pronto para receber tráfego
   *
   * Endpoint que determina se a aplicação está pronta para processar requisições.
   * Diferente do liveness, este verifica se o sistema está realmente operacional.
   *
   * **Comportamento:**
   * - Executa health check completo
   * - Retorna 200 se ready (healthy ou degraded)
   * - Retorna 503 se not ready (unhealthy)
   *
   * **Critério de Ready:**
   * - **ready**: status = healthy OU degraded
   * - **not_ready**: status = unhealthy
   *
   * **Load Balancer Readiness:**
   * - Se 200: Load balancer envia tráfego para esta instância
   * - Se 503: Load balancer remove instância do pool temporariamente
   * - Frequência típica: 5-15s
   *
   * **Diferença entre Liveness e Readiness:**
   *
   * | Aspecto | Liveness | Readiness |
   * |---------|----------|-----------|
   * | Verifica | Processo vivo? | Aceita tráfego? |
   * | Falha → | Reinicia pod | Remove do pool |
   * | Frequência | 10-30s | 5-15s |
   * | Peso | Muito leve | Médio |
   *
   * **Quando Usar:**
   * - Readiness probe do Kubernetes
   * - Health check de Load Balancers
   * - Verificar se pode receber tráfego
   *
   * @route GET /health/ready
   * @param {Request} req - Request do Express (não utilizado)
   * @param {Response} res - Response do Express
   * @returns {Promise<void>}
   *
   * @example
   * ```bash
   * # Request
   * curl http://localhost:3000/health/ready
   *
   * # Response 200 (ready)
   * {
   *   "status": "ready",
   *   "timestamp": "2025-10-04T17:00:00.000Z",
   *   "uptime": 3600
   * }
   *
   * # Response 503 (not ready)
   * {
   *   "status": "not_ready",
   *   "timestamp": "2025-10-04T17:00:00.000Z",
   *   "uptime": 3600
   * }
   * ```
   *
   * @example
   * ```yaml
   * # Kubernetes deployment.yaml
   * readinessProbe:
   *   httpGet:
   *     path: /health/ready
   *     port: 3000
   *   initialDelaySeconds: 10
   *   periodSeconds: 5
   *   timeoutSeconds: 3
   *   failureThreshold: 2
   * ```
   *
   * @example
   * ```nginx
   * # Nginx upstream health check
   * upstream backend {
   *   server app1:3000 max_fails=3 fail_timeout=30s;
   *   server app2:3000 max_fails=3 fail_timeout=30s;
   *
   *   # Health check
   *   check interval=5000 rise=2 fall=3
   *         timeout=3000 type=http;
   *   check_http_send "GET /health/ready HTTP/1.0\r\n\r\n";
   *   check_http_expect_alive http_2xx;
   * }
   * ```
   *
   * @note
   * - Sistema degraded ainda aceita tráfego (200)
   * - Sistema unhealthy NÃO aceita tráfego (503)
   * - Load balancer monitora e toma ações automaticamente
   *
   * @critical
   * - Falhas aqui removem instância do load balancer temporariamente
   * - Recuperação automática quando voltar a retornar 200
   * - Não confunda com liveness (propósitos diferentes)
   */
  static async readiness(req: Request, res: Response): Promise<void> {
    try {
      // Executa health check completo
      const health = await HealthCheckService.check();

      // Determina se está pronto para receber tráfego
      // Ready = healthy OU degraded (sistema operacional, mesmo com problemas)
      // Not Ready = unhealthy (sistema com falhas críticas)
      const isReady = health.status !== 'unhealthy';

      // Status code baseado em readiness
      const statusCode = isReady ? 200 : 503;

      res.status(statusCode).json({
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      // Erro inesperado = not ready
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
