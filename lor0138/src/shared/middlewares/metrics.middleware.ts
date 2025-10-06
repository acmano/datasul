// src/shared/middlewares/metrics.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { metricsManager } from '@infrastructure/metrics/MetricsManager';

/**
 * Middleware para coleta automática de métricas HTTP
 *
 * @description
 * Intercepta todas as requisições HTTP e coleta métricas automaticamente:
 * - Total de requisições (counter)
 * - Duração das requisições (histogram)
 * - Requisições em progresso (gauge)
 * - Status codes (labels)
 * - Rotas acessadas (labels normalizadas)
 *
 * Funcionalidades:
 * - Normalização de rotas (IDs viram :id, UUIDs viram :uuid)
 * - Medição precisa de duração (timestamp no início)
 * - Tracking de requisições em progresso
 * - Proteção contra loop infinito (ignora /metrics)
 * - Labels consistentes para agrupamento no Prometheus
 *
 * Integração:
 * - Deve ser registrado logo após correlationIdMiddleware
 * - Registrado ANTES de qualquer outra lógica de negócio
 * - Usa event 'finish' do Response para capturar fim da request
 *
 * @example
 * // No app.ts
 * app.use(correlationIdMiddleware); // 1º
 * app.use(metricsMiddleware);        // 2º
 * app.use(otherMiddlewares);         // Depois
 *
 * @critical
 * - NUNCA registrar após rotas (não coletará métricas)
 * - SEMPRE ignorar endpoint /metrics (previne loop)
 * - SEMPRE usar res.on('finish') (não 'close' ou 'end')
 * - Normalizar rotas para evitar cardinalidade alta
 * - Duração em SEGUNDOS (não milissegundos) para Prometheus
 *
 * @see {@link MetricsManager} - Gerenciador de métricas
 * @see {@link normalizeRoute} - Normalização de rotas
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Ignora endpoint de métricas para não criar loop infinito
  if (req.path === '/metrics') {
    return next();
  }

  // Captura timestamp inicial (precisão em milissegundos)
  const startTime = Date.now();

  // Captura método HTTP (GET, POST, PUT, DELETE, etc)
  const method = req.method;

  // Normaliza a rota para agrupar métricas
  // Ex: /api/lor0138/item/dadosCadastrais/informacoesGerais/7530110
  //  -> /api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo
  const route = normalizeRoute(req.path);

  // Incrementa contador de requisições em progresso
  metricsManager.httpRequestsInProgress.inc({ method, route });

  // Captura quando a resposta é finalizada
  res.on('finish', () => {
    // Calcula duração em segundos (Prometheus usa segundos por padrão)
    const duration = (Date.now() - startTime) / 1000;

    // Converte status code para string (labels devem ser strings)
    const statusCode = res.statusCode.toString();

    // Decrementa requisições em progresso
    metricsManager.httpRequestsInProgress.dec({ method, route });

    // Incrementa total de requisições
    metricsManager.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    // Registra duração da requisição
    metricsManager.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode,
      },
      duration
    );
  });

  next();
}

/**
 * Normaliza rotas para agrupar métricas e evitar cardinalidade alta
 *
 * @description
 * Substitui valores dinâmicos (IDs, UUIDs, códigos) por placeholders
 * para agrupar métricas de forma eficiente no Prometheus.
 *
 * Problema:
 * Sem normalização, cada ID único cria uma nova série temporal:
 * - /api/item/7530110 → métrica separada
 * - /api/item/7530111 → métrica separada
 * - /api/item/7530112 → métrica separada
 * Resultado: milhões de séries, explode memória do Prometheus
 *
 * Solução:
 * Com normalização, todos IDs são agrupados:
 * - /api/item/7530110 → /api/item/:itemCodigo
 * - /api/item/7530111 → /api/item/:itemCodigo
 * - /api/item/7530112 → /api/item/:itemCodigo
 * Resultado: 1 série temporal, eficiente
 *
 * Padrões detectados:
 * - Item codes: /informacoesGerais/ABC123 → /informacoesGerais/:itemCodigo
 * - UUIDs: /user/550e8400-e29b-41d4-a716-446655440000 → /user/:uuid
 * - IDs numéricos: /order/12345 → /order/:id
 * - Query strings: removidas completamente
 *
 * @param path - Caminho da requisição (req.path)
 * @returns {string} Rota normalizada com placeholders
 * @private
 *
 * @example
 * normalizeRoute('/api/item/7530110?filter=active')
 * // → '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo'
 *
 * @example
 * normalizeRoute('/api/user/550e8400-e29b-41d4-a716-446655440000')
 * // → '/api/user/:uuid'
 *
 * @example
 * normalizeRoute('/api/order/12345')
 * // → '/api/order/:id'
 *
 * @example
 * normalizeRoute('/api/health')
 * // → '/api/health' (sem mudança)
 *
 * @critical
 * - Adicione novos padrões conforme necessário
 * - Teste regex cuidadosamente (performance)
 * - Ordem dos padrões importa (mais específico primeiro)
 * - NUNCA incluir dados sensíveis nos placeholders
 * - Evite placeholders muito genéricos (ex: substituir tudo por :id)
 *
 * @see https://prometheus.io/docs/practices/naming/#labels
 */
function normalizeRoute(path: string): string {
  // Remove query strings (tudo após '?')
  path = path.split('?')[0];

  // Padrões comuns para substituir por placeholders
  const patterns = [
    // Item codes específicos da aplicação lor0138
    // Detecta: /informacoesGerais/QUALQUER_COISA_NO_FINAL
    // Exemplo: /informacoesGerais/7530110 → /informacoesGerais/:itemCodigo
    {
      regex: /\/api\/lor0138\/item\/dadosCadastrais\/informacoesGerais\/[^\/]+$/,
      replacement: '/api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo',
    },

    // UUIDs (formato: 8-4-4-4-12 caracteres hexadecimais)
    // Exemplo: /user/550e8400-e29b-41d4-a716-446655440000 → /user/:uuid
    {
      regex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      replacement: ':uuid',
    },

    // Números genéricos no final da URL
    // Exemplo: /order/12345 → /order/:id
    {
      regex: /\/\d+$/,
      replacement: '/:id',
    },

    // IDs alfanuméricos genéricos (se necessário)
    // Descomente para substituir códigos como ABC123, XYZ789, etc
    // {
    //   regex: /\/[A-Z0-9]{4,}$/i,
    //   replacement: '/:code',
    // },
  ];

  // Testa cada padrão e substitui o primeiro match
  for (const pattern of patterns) {
    if (pattern.regex.test(path)) {
      return path.replace(pattern.regex, pattern.replacement);
    }
  }

  // Se nenhum padrão matchou, retorna path original
  return path;
}

/**
 * Middleware para coletar métricas de rate limiting
 *
 * @description
 * Deve ser usado APÓS o rate limiter para registrar se a requisição
 * foi bloqueada ou permitida. Útil para monitorar eficácia do rate limit.
 *
 * Métricas coletadas:
 * - rateLimitRequestsBlocked: requisições bloqueadas
 * - rateLimitRequestsAllowed: requisições permitidas
 *
 * Labels:
 * - route: rota normalizada
 * - user_id: ID do usuário (ou 'anonymous')
 * - reason: motivo do bloqueio (se aplicável)
 *
 * @param req - Request do Express
 * @param res - Response do Express
 * @param next - Função next do Express
 *
 * @example
 * // Uso combinado com rate limiter
 * router.get('/api/item',
 *   rateLimiter,              // 1º - aplica rate limit
 *   rateLimitMetricsMiddleware, // 2º - coleta métricas
 *   controller.getItem          // 3º - handler
 * );
 *
 * @example
 * // Dashboard Grafana
 * // Taxa de bloqueio: rateLimitRequestsBlocked / rateLimitRequestsTotal
 * // Usuários mais bloqueados: topk(10, rateLimitRequestsBlocked)
 *
 * @critical
 * - DEVE vir APÓS o rate limiter (não antes)
 * - Status 429 indica bloqueio por rate limit
 * - user_id deve ser consistente (use mesmo valor em toda app)
 * - Não registrar métricas em /metrics (loop)
 */
export function rateLimitMetricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Normaliza rota para agrupar métricas
  const route = normalizeRoute(req.path);

  // Obtém userId (de auth middleware) ou usa 'anonymous'
  const userId = (req as any).userId || 'anonymous';

  // Verifica se a requisição foi bloqueada pelo rate limiter
  // Status 429 = Too Many Requests
  if (res.statusCode === 429) {
    // Registra bloqueio
    metricsManager.rateLimitRequestsBlocked.inc({
      route,
      user_id: userId,
      reason: 'rate_limit_exceeded',
    });
  } else {
    // Registra permissão
    metricsManager.rateLimitRequestsAllowed.inc({
      route,
      user_id: userId,
    });
  }

  next();
}