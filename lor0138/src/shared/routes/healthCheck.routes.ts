// src/shared/routes/healthCheck.routes.ts

/**
 * @fileoverview Rotas de Health Check do Sistema
 *
 * ===================================================================
 * VISÃO GERAL
 * ===================================================================
 *
 * Define os endpoints de health check para monitoramento de saúde da aplicação.
 * Implementa os padrões de Kubernetes para liveness e readiness probes.
 *
 * **Endpoints Disponíveis:**
 * - `GET /health` - Health check completo (banco, cache, memória)
 * - `GET /health/live` - Liveness probe (processo está vivo?)
 * - `GET /health/ready` - Readiness probe (pronto para tráfego?)
 *
 * ===================================================================
 * ARQUITETURA E PADRÕES
 * ===================================================================
 *
 * PADRÃO KUBERNETES HEALTH CHECKS:
 * --------------------------------
 * Este módulo implementa o padrão de health checks do Kubernetes/Docker,
 * que define dois tipos principais de verificações:
 *
 * 1. **Liveness Probe** (`/health/live`)
 *    - Pergunta: "O processo está vivo?"
 *    - Objetivo: Detectar deadlocks e processos travados
 *    - Ação se falhar: Kubernetes REINICIA o container
 *    - Deve ser RÁPIDO: < 100ms
 *    - Verificações mínimas: apenas se o processo responde
 *
 * 2. **Readiness Probe** (`/health/ready`)
 *    - Pergunta: "A aplicação está pronta para receber tráfego?"
 *    - Objetivo: Controlar quando incluir/remover do load balancer
 *    - Ação se falhar: Kubernetes REMOVE do service endpoint
 *    - Pode ser mais lento: < 5s
 *    - Verificações: conexões críticas (banco, cache, etc)
 *
 * 3. **Health Check Completo** (`/health`)
 *    - Verificação detalhada de todos os componentes
 *    - Usado por: monitoramento, dashboards, alertas
 *    - Retorna: status detalhado de cada componente
 *    - Pode ser lento: 5-10s aceitável
 *
 * ===================================================================
 * DIFERENÇAS ENTRE OS ENDPOINTS
 * ===================================================================
 *
 * | Aspecto | /health | /health/live | /health/ready |
 * |---------|---------|--------------|---------------|
 * | **Propósito** | Monitoramento completo | Processo vivo? | Aceitar tráfego? |
 * | **Velocidade** | 5-10s OK | < 100ms | < 5s |
 * | **Profundidade** | Detalhado | Superficial | Médio |
 * | **Timeout** | Sem timeout | Sem timeout | 5s |
 * | **Usado por** | Dashboards, alertas | Kubernetes restart | Load balancer |
 * | **Verifica** | Tudo | Apenas resposta | Dependências críticas |
 * | **Falha = ** | Alerta | Container reinicia | Removido do LB |
 *
 * ===================================================================
 * ORDEM DE REGISTRO DE MIDDLEWARES
 * ===================================================================
 *
 * MIDDLEWARE STACK PARA /health:
 * ------------------------------
 * ```
 * Request
 *   ↓
 * healthCheckTimeout (5s timeout específico)
 *   ↓
 * HealthCheckController.healthCheck
 *   ↓
 * Response (200/503)
 * ```
 *
 * POR QUE TIMEOUT ESPECÍFICO?
 * ---------------------------
 * Health check precisa de timeout MENOR que o padrão (30s) porque:
 * - Monitoramento precisa resposta rápida
 * - Kubernetes tem timeout próprio (default 1s)
 * - Timeout longo = falso positivo ("está respondendo" mas lento demais)
 *
 * Se health check demora > 5s = sistema está degradado.
 *
 * MIDDLEWARE STACK PARA /health/live e /health/ready:
 * ---------------------------------------------------
 * ```
 * Request
 *   ↓
 * HealthCheckController.liveness/readiness (direto, sem timeout)
 *   ↓
 * Response (200/503)
 * ```
 *
 * POR QUE SEM TIMEOUT?
 * --------------------
 * - Liveness/readiness são SÍNCRONOS e rápidos (< 100ms)
 * - Não fazem I/O pesado
 * - Timeout adicional é desnecessário e aumenta latência
 *
 * ===================================================================
 * FLUXO DE REQUISIÇÃO DETALHADO
 * ===================================================================
 *
 * FLUXO 1: GET /health (Health Check Completo)
 * --------------------------------------------
 *
 * 1. **Request chega**
 *    - Cliente: Prometheus, Datadog, New Relic, cURL
 *    - Headers opcionais: X-Correlation-ID
 *
 * 2. **Timeout Middleware**
 *    - Ativa timeout de 5 segundos
 *    - Se exceder: retorna 408 Request Timeout
 *
 * 3. **Controller: healthCheck()**
 *    - Chama HealthCheckService.check()
 *    - Service verifica:
 *      a) Banco de dados (query test)
 *      b) Cache (Redis/memória)
 *      c) Memória (uso atual)
 *      d) Disco (espaço disponível)
 *
 * 4. **Resposta**
 *    - Status 200: Sistema saudável
 *    - Status 503: Sistema degradado/indisponível
 *    - Body: JSON detalhado com status de cada componente
 *
 * EXEMPLO DE RESPOSTA 200 (Healthy):
 * ```json
 * {
 *   "status": "healthy",
 *   "timestamp": "2025-10-06T10:30:00.000Z",
 *   "uptime": 3600,
 *   "checks": {
 *     "database": {
 *       "status": "ok",
 *       "responseTime": 45,
 *       "connectionType": "sqlserver",
 *       "mode": "LIVE"
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
 * EXEMPLO DE RESPOSTA 503 (Unhealthy):
 * ```json
 * {
 *   "status": "unhealthy",
 *   "timestamp": "2025-10-06T10:30:00.000Z",
 *   "uptime": 3600,
 *   "checks": {
 *     "database": {
 *       "status": "error",
 *       "error": "Connection refused"
 *     },
 *     "memory": {
 *       "status": "critical",
 *       "used": 1900,
 *       "total": 2048,
 *       "percentage": 92,
 *       "free": 148
 *     }
 *   }
 * }
 * ```
 *
 * FLUXO 2: GET /health/live (Liveness Probe)
 * -------------------------------------------
 *
 * 1. **Request chega**
 *    - Cliente: Kubernetes kubelet, Docker healthcheck
 *    - Frequência: A cada 10s (configurável)
 *
 * 2. **Controller: liveness()**
 *    - Verificação trivial: processo está respondendo?
 *    - SEMPRE retorna 200 (se chegou aqui, está vivo)
 *    - Sem I/O, sem queries, apenas memória
 *
 * 3. **Resposta**
 *    - Status 200: Processo vivo
 *    - Body: Status "alive" + uptime
 *
 * EXEMPLO DE RESPOSTA:
 * ```json
 * {
 *   "status": "alive",
 *   "timestamp": "2025-10-06T10:30:00.000Z",
 *   "uptime": 3600
 * }
 * ```
 *
 * SE NÃO RESPONDER:
 * - Kubernetes aguarda failureThreshold (default: 3)
 * - Após 3 falhas consecutivas: REINICIA o container
 * - Pod entra em estado CrashLoopBackOff se continuar falhando
 *
 * FLUXO 3: GET /health/ready (Readiness Probe)
 * ---------------------------------------------
 *
 * 1. **Request chega**
 *    - Cliente: Kubernetes kubelet
 *    - Frequência: A cada 10s (configurável)
 *
 * 2. **Controller: readiness()**
 *    - Chama HealthCheckService.check()
 *    - Verifica dependências críticas:
 *      a) Banco de dados conectado?
 *      b) Cache disponível?
 *    - RÁPIDO: não testa profundamente
 *
 * 3. **Resposta**
 *    - Status 200: Pronto para tráfego
 *    - Status 503: NÃO pronto (removido do load balancer)
 *
 * EXEMPLO DE RESPOSTA 200 (Ready):
 * ```json
 * {
 *   "status": "ready",
 *   "timestamp": "2025-10-06T10:30:00.000Z",
 *   "uptime": 3600
 * }
 * ```
 *
 * EXEMPLO DE RESPOSTA 503 (Not Ready):
 * ```json
 * {
 *   "status": "not_ready",
 *   "timestamp": "2025-10-06T10:30:00.000Z",
 *   "error": "Database connection failed"
 * }
 * ```
 *
 * SE NÃO ESTIVER READY:
 * - Kubernetes REMOVE pod do Service endpoint
 * - Load balancer para de enviar tráfego
 * - Pod continua rodando, mas isolado
 * - Quando ready = true, volta a receber tráfego
 *
 * ===================================================================
 * CONFIGURAÇÃO NO KUBERNETES
 * ===================================================================
 *
 * EXEMPLO DE DEPLOYMENT.YAML:
 * ---------------------------
 * ```yaml
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: lor0138-api
 * spec:
 *   replicas: 3
 *   template:
 *     spec:
 *       containers:
 *       - name: api
 *         image: lor0138-api:latest
 *         ports:
 *         - containerPort: 3000
 *
 *         # Liveness Probe
 *         livenessProbe:
 *           httpGet:
 *             path: /health/live
 *             port: 3000
 *           initialDelaySeconds: 30    # Aguarda 30s antes de começar
 *           periodSeconds: 10          # Verifica a cada 10s
 *           timeoutSeconds: 1          # Timeout de 1s
 *           failureThreshold: 3        # 3 falhas = reinicia
 *           successThreshold: 1        # 1 sucesso = OK
 *
 *         # Readiness Probe
 *         readinessProbe:
 *           httpGet:
 *             path: /health/ready
 *             port: 3000
 *           initialDelaySeconds: 10    # Começa após 10s
 *           periodSeconds: 5           # Verifica a cada 5s
 *           timeoutSeconds: 3          # Timeout de 3s
 *           failureThreshold: 3        # 3 falhas = not ready
 *           successThreshold: 1        # 1 sucesso = ready
 * ```
 *
 * CONFIGURAÇÃO NO DOCKER COMPOSE:
 * -------------------------------
 * ```yaml
 * version: '3.8'
 * services:
 *   api:
 *     image: lor0138-api:latest
 *     ports:
 *       - "3000:3000"
 *     healthcheck:
 *       test: ["CMD", "curl", "-f", "http://localhost:3000/health/live"]
 *       interval: 10s
 *       timeout: 3s
 *       retries: 3
 *       start_period: 30s
 * ```
 *
 * ===================================================================
 * CASOS DE USO PRÁTICOS
 * ===================================================================
 *
 * CASO 1: Monitoramento com Prometheus
 * -------------------------------------
 * ```yaml
 * # prometheus.yml
 * scrape_configs:
 *   - job_name: 'lor0138-api-health'
 *     metrics_path: '/health'
 *     scrape_interval: 30s
 *     static_configs:
 *       - targets: ['lor0138.lorenzetti.ibe:3000']
 * ```
 *
 * Prometheus faz scraping de /health a cada 30s e:
 * - Cria alertas se status != "healthy"
 * - Registra métricas de uptime
 * - Monitora tempo de resposta de cada componente
 *
 * CASO 2: Load Balancer AWS ALB
 * ------------------------------
 * ```json
 * {
 *   "HealthCheckProtocol": "HTTP",
 *   "HealthCheckPath": "/health/ready",
 *   "HealthCheckIntervalSeconds": 30,
 *   "HealthCheckTimeoutSeconds": 5,
 *   "HealthyThresholdCount": 2,
 *   "UnhealthyThresholdCount": 3
 * }
 * ```
 *
 * ALB usa /health/ready para decidir:
 * - Enviar tráfego para instância (ready)
 * - Remover instância do pool (not ready)
 *
 * CASO 3: CI/CD Pipeline
 * ----------------------
 * ```bash
 * # deploy.sh
 *
 * # 1. Deploy nova versão
 * kubectl apply -f deployment.yaml
 *
 * # 2. Aguardar pods ficarem ready
 * kubectl wait --for=condition=ready pod -l app=lor0138-api --timeout=300s
 *
 * # 3. Verificar health check
 * curl -f http://lor0138.lorenzetti.ibe:3000/health || exit 1
 *
 * echo "Deploy concluído com sucesso!"
 * ```
 *
 * CASO 4: Monitoramento Manual
 * ----------------------------
 * ```bash
 * # Verificação rápida
 * curl http://lor0138.lorenzetti.ibe:3000/health/live
 *
 * # Verificação completa
 * curl -s http://lor0138.lorenzetti.ibe:3000/health | jq .
 *
 * # Verificar readiness
 * curl -I http://lor0138.lorenzetti.ibe:3000/health/ready
 *
 * # Loop de monitoramento
 * watch -n 5 'curl -s http://lor0138.lorenzetti.ibe:3000/health | jq .status'
 * ```
 *
 * ===================================================================
 * TROUBLESHOOTING E DEBUGGING
 * ===================================================================
 *
 * PROBLEMA 1: Health check sempre 503
 * ------------------------------------
 * SINTOMA: Endpoint sempre retorna unhealthy
 *
 * DIAGNÓSTICO:
 * ```bash
 * # Ver detalhes do erro
 * curl -s http://localhost:3000/health | jq .
 *
 * # Verificar logs
 * tail -f logs/app-*.log | grep "health check"
 * ```
 *
 * CAUSAS COMUNS:
 * - Banco de dados offline
 * - Cache Redis não conectado
 * - Memória crítica (> 90%)
 * - Timeout excedido (> 5s)
 *
 * SOLUÇÃO:
 * 1. Verificar conectividade do banco
 * 2. Verificar status do Redis
 * 3. Reiniciar aplicação se necessário
 *
 * PROBLEMA 2: Liveness probe falhando
 * ------------------------------------
 * SINTOMA: Kubernetes reiniciando pods constantemente (CrashLoopBackOff)
 *
 * DIAGNÓSTICO:
 * ```bash
 * # Ver eventos do pod
 * kubectl describe pod lor0138-api-xxx
 *
 * # Ver logs antes do crash
 * kubectl logs lor0138-api-xxx --previous
 * ```
 *
 * CAUSAS COMUNS:
 * - Deadlock no código
 * - Event loop bloqueado
 * - Timeout muito agressivo (< 1s)
 * - initialDelaySeconds muito curto
 *
 * SOLUÇÃO:
 * 1. Aumentar initialDelaySeconds para 30s
 * 2. Aumentar timeoutSeconds para 3s
 * 3. Verificar código por loops infinitos
 *
 * PROBLEMA 3: Readiness probe oscilando
 * --------------------------------------
 * SINTOMA: Pod alternando entre ready/not ready
 *
 * DIAGNÓSTICO:
 * ```bash
 * # Monitorar status
 * kubectl get pods -w
 *
 * # Ver histórico de eventos
 * kubectl get events --sort-by='.lastTimestamp'
 * ```
 *
 * CAUSAS COMUNS:
 * - Conexão intermitente com banco
 * - Timeout muito agressivo
 * - Banco sobrecarregado
 *
 * SOLUÇÃO:
 * 1. Verificar health do banco de dados
 * 2. Aumentar timeout do readiness probe
 * 3. Adicionar retry na verificação
 *
 * PROBLEMA 4: Health check muito lento
 * -------------------------------------
 * SINTOMA: Resposta demora > 5s
 *
 * DIAGNÓSTICO:
 * ```bash
 * # Medir tempo de resposta
 * time curl http://localhost:3000/health
 *
 * # Ver qual componente está lento
 * curl -s http://localhost:3000/health | jq '.checks.database.responseTime'
 * ```
 *
 * CAUSAS COMUNS:
 * - Query de teste do banco muito complexa
 * - Timeout do banco muito alto
 * - Rede lenta
 *
 * SOLUÇÃO:
 * 1. Simplificar query de teste
 * 2. Reduzir timeout do banco para 5s
 * 3. Cache do resultado do health check (30s)
 *
 * ===================================================================
 * BOAS PRÁTICAS
 * ===================================================================
 *
 * DO'S (Faça):
 * ------------
 * ✅ Use timeout curto para health checks (< 5s)
 * ✅ Retorne status específico de cada componente
 * ✅ Use liveness para detectar deadlocks
 * ✅ Use readiness para controlar tráfego
 * ✅ Logue falhas de health check
 * ✅ Monitore com Prometheus/Datadog
 * ✅ Configure alertas para status unhealthy
 *
 * DON'TS (Não faça):
 * ------------------
 * ❌ Não faça queries pesadas em liveness
 * ❌ Não retorne 200 se sistema está degradado
 * ❌ Não use mesmo endpoint para liveness e readiness
 * ❌ Não configure timeout muito curto (< 1s)
 * ❌ Não ignore erros de health check
 * ❌ Não exponha dados sensíveis na resposta
 *
 * ===================================================================
 * SEGURANÇA E COMPLIANCE
 * ===================================================================
 *
 * INFORMAÇÕES EXPOSTAS:
 * ---------------------
 * ✅ SEGURO expor:
 * - Status geral (healthy/unhealthy)
 * - Tempo de uptime
 * - Status de componentes (ok/error)
 * - Tempo de resposta do banco
 *
 * ⚠️ CUIDADO ao expor:
 * - Versão do banco de dados
 * - IPs internos
 * - Nomes de schemas/databases
 * - Detalhes de erro completos
 *
 * ❌ NUNCA expor:
 * - Credenciais de banco
 * - Tokens de API
 * - Chaves de criptografia
 * - Informações de clientes
 *
 * PROTEÇÃO ADICIONAL:
 * -------------------
 * Se health check expõe informações sensíveis:
 *
 * ```typescript
 * // Adicionar autenticação básica
 * router.get('/health',
 *   basicAuth({ users: { 'monitor': 'secret123' } }),
 *   healthCheckTimeout,
 *   HealthCheckController.healthCheck
 * );
 * ```
 *
 * Ou restringir por IP:
 *
 * ```typescript
 * // Apenas IPs internos
 * const allowedIPs = ['10.0.0.0/8', '172.16.0.0/12'];
 * router.get('/health',
 *   ipWhitelist(allowedIPs),
 *   healthCheckTimeout,
 *   HealthCheckController.healthCheck
 * );
 * ```
 *
 * @module shared/routes/healthCheck
 * @requires express
 * @requires ../controllers/healthCheck.controller
 * @requires ../middlewares/timeout.middleware
 * @since 1.0.0
 * @see {@link HealthCheckController} Para lógica dos controllers
 * @see {@link HealthCheckService} Para lógica de verificação
 * @see {@link https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/} Kubernetes Probes
 */

import { Router } from 'express';
import { HealthCheckController } from '../controllers/healthCheck.controller';
import { healthCheckTimeout } from '../middlewares/timeout.middleware';

const router = Router();

/**
 * ===================================================================
 * ROTA: GET /health
 * ===================================================================
 *
 * Health check completo do sistema.
 *
 * Verifica status detalhado de todos os componentes:
 * - Banco de dados (conectividade e tempo de resposta)
 * - Cache (Redis/memória)
 * - Memória (uso atual vs disponível)
 * - Disco (espaço disponível)
 *
 * **Middleware Stack:**
 * 1. healthCheckTimeout (5s) - Timeout específico
 * 2. HealthCheckController.healthCheck - Lógica de verificação
 *
 * **Usado por:**
 * - Sistemas de monitoramento (Prometheus, Datadog, New Relic)
 * - Dashboards de status
 * - Alertas automáticos
 * - Verificação manual de ops
 *
 * **Performance:**
 * - Tempo esperado: 100ms - 1s (normal)
 * - Tempo aceitável: 1s - 5s (degradado)
 * - Tempo crítico: > 5s (timeout)
 *
 * **Status Codes:**
 * - 200: Sistema saudável (todos os componentes OK)
 * - 503: Sistema degradado ou indisponível
 * - 408: Timeout (verificação demorou > 5s)
 *
 * **Resposta de Sucesso (200):**
 * ```json
 * {
 *   "status": "healthy",
 *   "timestamp": "2025-10-06T10:30:00.000Z",
 *   "uptime": 3600,
 *   "checks": {
 *     "database": {
 *       "status": "ok",
 *       "responseTime": 45,
 *       "connectionType": "sqlserver"
 *     },
 *     "memory": {
 *       "status": "ok",
 *       "used": 512,
 *       "total": 2048,
 *       "percentage": 25
 *     }
 *   }
 * }
 * ```
 *
 * **Resposta de Erro (503):**
 * ```json
 * {
 *   "status": "unhealthy",
 *   "timestamp": "2025-10-06T10:30:00.000Z",
 *   "checks": {
 *     "database": {
 *       "status": "error",
 *       "error": "Connection timeout"
 *     }
 *   }
 * }
 * ```
 *
 * @name GET /health
 * @function
 * @memberof module:shared/routes/healthCheck
 * @see {@link HealthCheckController.healthCheck}
 * @see {@link healthCheckTimeout}
 *
 * @example
 * // Verificação básica
 * curl http://localhost:3000/health
 *
 * @example
 * // Com formatação JSON
 * curl -s http://localhost:3000/health | jq .
 *
 * @example
 * // Verificar apenas status code
 * curl -o /dev/null -w "%{http_code}" -s http://localhost:3000/health
 *
 * @example
 * // Monitoramento contínuo
 * watch -n 10 'curl -s http://localhost:3000/health | jq .status'
 */
router.get(
  '/',
  healthCheckTimeout, // Timeout de 5s para health check
  HealthCheckController.healthCheck
);

/**
 * ===================================================================
 * ROTA: GET /health/live
 * ===================================================================
 *
 * Liveness probe para Kubernetes/Docker.
 *
 * Verificação MÍNIMA para detectar se o processo está vivo e responsivo.
 * NÃO faz verificações pesadas (sem I/O, sem queries).
 *
 * **Propósito:**
 * - Detectar deadlocks
 * - Detectar processos travados
 * - Detectar event loop bloqueado
 *
 * **Performance:**
 * - Tempo esperado: < 10ms
 * - Tempo máximo: 100ms
 * - SEM timeout middleware (muito rápido)
 *
 * **Comportamento:**
 * - SEMPRE retorna 200 se chegou até aqui
 * - Se não responder = processo morto/travado
 * - Kubernetes aguarda 3 falhas antes de reiniciar (configurável)
 *
 * **Status Codes:**
 * - 200: Processo está vivo ✅
 * - Sem resposta: Processo morto/travado ❌ (Kubernetes reinicia)
 *
 * **Resposta (200):**
 * ```json
 * {
 *   "status": "alive",
 *   "timestamp": "2025-10-06T10:30:00.000Z",
 *   "uptime": 3600
 * }
 * ```
 *
 * **Configuração Kubernetes:**
 * ```yaml
 * livenessProbe:
 *   httpGet:
 *     path: /health/live
 *     port: 3000
 *   initialDelaySeconds: 30
 *   periodSeconds: 10
 *   timeoutSeconds: 1
 *   failureThreshold: 3
 * ```
 *
 * **Quando Kubernetes Reinicia:**
 * - 3 falhas consecutivas (default)
 * - Cada falha = sem resposta em 1s
 * - Total: 3s de não resposta = reinicia
 *
 * @name GET /health/live
 * @function
 * @memberof module:shared/routes/healthCheck
 * @see {@link HealthCheckController.liveness}
 *
 * @example
 * // Verificação manual
 * curl http://localhost:3000/health/live
 *
 * @example
 * // Docker Compose healthcheck
 * healthcheck:
 *   test: ["CMD", "curl", "-f", "http://localhost:3000/health/live"]
 *   interval: 10s
 *   timeout: 1s
 *   retries: 3
 *
 * @example
 * // Monitoramento com loop
 * while true; do
 *   curl -f http://localhost:3000/health/live || echo "DEAD!"
 *   sleep 5
 * done
 */
router.get('/live', HealthCheckController.liveness);

/**
 * ===================================================================
 * ROTA: GET /health/ready
 * ===================================================================
 *
 * Readiness probe para Kubernetes/Docker.
 *
 * Verifica se a aplicação está PRONTA para receber tráfego.
 * Testa dependências críticas sem detalhamento excessivo.
 *
 * **Propósito:**
 * - Controlar quando incluir no load balancer
 * - Aguardar inicialização de dependências
 * - Remover temporariamente de produção
 *
 * **Verifica:**
 * - Banco de dados conectado? ✓
 * - Cache disponível? ✓
 * - Serviços externos críticos? ✓
 *
 * **NÃO Verifica:**
 * - Memória/CPU (não afeta readiness)
 * - Disco (não afeta readiness imediata)
 * - Métricas detalhadas
 *
 * **Performance:**
 * - Tempo esperado: 100ms - 1s
 * - Tempo máximo: 3s
 * - Timeout configurável no Kubernetes
 *
 * **Status Codes:**
 * - 200: Pronto para tráfego ✅ (incluído no LB)
 * - 503: NÃO pronto ❌ (removido do LB)
 *
 * **Resposta 200 (Ready):**
 * ```json
 * {
 *   "status": "ready",
 *   "timestamp": "2025-10-06T10:30:00.000Z",
 *   "uptime": 3600
 * }
 * ```
 *
 * **Resposta 503 (Not Ready):**
 * ```json
 * {
 *   "status": "not_ready",
 *   "timestamp": "2025-10-06T10:30:00.000Z",
 *   "error": "Database connection failed"
 * }
 * ```
 *
 * **Configuração Kubernetes:**
 * ```yaml
 * readinessProbe:
 *   httpGet:
 *     path: /health/ready
 *     port: 3000
 *   initialDelaySeconds: 10
 *   periodSeconds: 5
 *   timeoutSeconds: 3
 *   failureThreshold: 3
 *   successThreshold: 1
 * ```
 *
 * **Comportamento Kubernetes:**
 *
 * NOT READY (3 falhas):
 * - Pod removido do Service endpoint
 * - Load balancer para de enviar tráfego
 * - Pod continua rodando (NÃO reinicia)
 * - Continua testando readiness
 *
 * READY (1 sucesso após not ready):
 * - Pod adicionado de volta ao Service
 * - Load balancer volta a enviar tráfego
 * - Aplicação recebe requisições normalmente
 *
 * **Casos de Uso:**
 *
 * 1. **Deploy com Zero Downtime**
 *    - Deploy nova versão
 *    - Pod novo fica "not ready" até conectar no banco
 *    - Quando ready, recebe tráfego
 *    - Pod antigo é terminado
 *
 * 2. **Banco de Dados em Manutenção**
 *    - Banco fica offline temporariamente
 *    - Pods ficam "not ready"
 *    - Removidos do load balancer
 *    - Quando banco volta, pods voltam automaticamente
 *
 * 3. **Startup Lento**
 *    - Aplicação demora 30s para inicializar
 *    - initialDelaySeconds: 30
 *    - Kubernetes aguarda antes de testar
 *    - Evita falsos positivos durante startup
 *
 * @name GET /health/ready
 * @function
 * @memberof module:shared/routes/healthCheck
 * @see {@link HealthCheckController.readiness}
 *
 * @example
 * // Verificação manual
 * curl http://localhost:3000/health/ready
 *
 * @example
 * // Verificar status code
 * curl -o /dev/null -w "%{http_code}" -s http://localhost:3000/health/ready
 *
 * @example
 * // Aguardar ficar ready (deploy)
 * until curl -f http://localhost:3000/health/ready; do
 *   echo "Aguardando aplicação ficar ready..."
 *   sleep 5
 * done
 * echo "Aplicação ready!"
 *
 * @example
 * // AWS ALB Target Group Health Check
 * HealthCheckPath: /health/ready
 * HealthCheckIntervalSeconds: 30
 * HealthCheckTimeoutSeconds: 5
 * HealthyThresholdCount: 2
 * UnhealthyThresholdCount: 3
 */
router.get('/ready', HealthCheckController.readiness);

export default router;