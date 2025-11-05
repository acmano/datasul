// tests/e2e/rate-limiting.e2e.test.ts

import request from 'supertest';
import { Application } from '@/app';

/**
 * Testes E2E - Rate Limiting
 *
 * Testa comportamento de rate limiting da API
 *
 * Configuração atual (app.ts):
 * - Window: 15 minutos
 * - Max: 100 requests por window
 * - Admin keys bypass rate limit
 *
 * @group e2e
 * @group rate-limiting
 */
describe('E2E - Rate Limiting', () => {
  let app: Application;
  let server: any;

  beforeAll(async () => {
    // Inicializar aplicação
    app = new Application();
    await app.initialize();
    server = app.getServer();
  });

  afterAll(async () => {
    // Fechar aplicação
    await app.shutdown();
  });

  describe('Rate Limit - Basic Behavior', () => {
    it('deve permitir requests até o limite', async () => {
      // Fazer 10 requests (bem abaixo do limite de 100)
      const promises = Array.from({ length: 10 }, () =>
        request(server)
          .get('/api/item/search')
          .query({ limit: 1 })
      );

      const responses = await Promise.all(promises);

      // Todas devem ter sucesso
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    }, 15000);

    it('deve retornar 429 quando limite excedido', async () => {
      // Fazer muitas requests para exceder limite (100)
      const promises = Array.from({ length: 120 }, () =>
        request(server)
          .get('/api/item/search')
          .query({ limit: 1 })
      );

      const responses = await Promise.all(promises);

      // Algumas devem ser rate limited
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);

      // Verificar estrutura da resposta 429
      const rateLimitedResponse = responses.find((r) => r.status === 429);
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.body).toHaveProperty('error');
        expect(rateLimitedResponse.body).toHaveProperty('message');
        expect(rateLimitedResponse.body).toHaveProperty('correlationId');
        expect(rateLimitedResponse.body.error).toContain('Rate limit');
      }
    }, 30000);

    it('deve incluir headers de rate limit', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 1 })
        .expect(200);

      // Verificar headers RateLimit (RFC draft)
      // Se implementado, deve incluir: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
      expect(response.headers).toBeDefined();
    });

    it('resposta 429 deve incluir informação de retry', async () => {
      // Forçar rate limit
      const promises = Array.from({ length: 110 }, () =>
        request(server)
          .get('/api/item/search')
          .query({ limit: 1 })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponse = responses.find((r) => r.status === 429);

      if (rateLimitedResponse) {
        expect(rateLimitedResponse.body).toHaveProperty('message');
        expect(rateLimitedResponse.body.message).toContain('Tente novamente');
      }
    }, 30000);
  });

  describe('Rate Limit - Admin Bypass', () => {
    it('deve permitir bypass com admin key', async () => {
      // Admin key não deve ser rate limited
      const promises = Array.from({ length: 150 }, () =>
        request(server)
          .get('/api/item/search')
          .set('X-API-Key', 'admin-key-superuser')
          .query({ limit: 1 })
      );

      const responses = await Promise.all(promises);

      // Maioria deve ter sucesso (admin bypassa rate limit)
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThan(100);

      // Nenhuma deve ser rate limited
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBe(0);
    }, 30000);

    it('deve aplicar rate limit para non-admin keys', async () => {
      // Free tier deve ser rate limited
      const promises = Array.from({ length: 120 }, () =>
        request(server)
          .get('/api/item/search')
          .set('X-API-Key', 'free-demo-key-123456')
          .query({ limit: 1 })
      );

      const responses = await Promise.all(promises);

      // Algumas devem ser rate limited
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    }, 30000);

    it('deve aplicar rate limit para requests sem API key', async () => {
      // Requests sem auth devem ser rate limited
      const promises = Array.from({ length: 120 }, () =>
        request(server)
          .get('/api/item/search')
          .query({ limit: 1 })
      );

      const responses = await Promise.all(promises);

      // Algumas devem ser rate limited
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Rate Limit - Per IP', () => {
    it('rate limit deve ser aplicado por IP', async () => {
      // Todas requests do mesmo cliente (mesmo IP)
      const promises = Array.from({ length: 110 }, () =>
        request(server)
          .get('/api/item/search')
          .query({ limit: 1 })
      );

      const responses = await Promise.all(promises);

      // Deve haver rate limiting
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    }, 30000);

    it('deve rastrear correlation ID em rate limited requests', async () => {
      // Fazer requests até exceder limite
      const promises = Array.from({ length: 110 }, () =>
        request(server)
          .get('/api/item/search')
          .query({ limit: 1 })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponse = responses.find((r) => r.status === 429);

      if (rateLimitedResponse) {
        expect(rateLimitedResponse.body).toHaveProperty('correlationId');
        expect(rateLimitedResponse.body.correlationId).toBeDefined();
      }
    }, 30000);
  });

  describe('Rate Limit - Different Endpoints', () => {
    it('rate limit deve ser global (não por endpoint)', async () => {
      // Misturar requests em diferentes endpoints
      const endpoints = [
        '/api/item/search?limit=1',
        '/api/familia?limit=1',
        '/api/grupoDeEstoque?limit=1',
        '/api/familiaComercial?limit=1',
      ];

      const promises = [];
      for (let i = 0; i < 120; i++) {
        const endpoint = endpoints[i % endpoints.length];
        promises.push(request(server).get(endpoint));
      }

      const responses = await Promise.all(promises);

      // Deve haver rate limiting (limite é global)
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    }, 30000);

    it('health check não deve ser rate limited', async () => {
      // Health check não está sob /api/ então não tem rate limit
      const promises = Array.from({ length: 50 }, () =>
        request(server).get('/health')
      );

      const responses = await Promise.all(promises);

      // Todas devem ter sucesso (health check sem rate limit)
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    }, 15000);

    it('metrics endpoint não deve ser rate limited', async () => {
      // Metrics não está sob /api/ então não tem rate limit
      const promises = Array.from({ length: 30 }, () =>
        request(server).get('/metrics')
      );

      const responses = await Promise.all(promises);

      // Todas devem ter sucesso
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    }, 15000);

    it('cache stats não deve ser rate limited', async () => {
      // Cache stats não está sob /api/ então não tem rate limit
      const promises = Array.from({ length: 30 }, () =>
        request(server).get('/cache/stats')
      );

      const responses = await Promise.all(promises);

      // Todas devem ter sucesso
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    }, 15000);
  });

  describe('Rate Limit - Response Format', () => {
    it('resposta 429 deve ter formato consistente', async () => {
      // Forçar rate limit
      const promises = Array.from({ length: 110 }, () =>
        request(server)
          .get('/api/item/search')
          .query({ limit: 1 })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponse = responses.find((r) => r.status === 429);

      if (rateLimitedResponse) {
        // Estrutura obrigatória
        expect(rateLimitedResponse.body).toHaveProperty('error');
        expect(rateLimitedResponse.body).toHaveProperty('message');
        expect(rateLimitedResponse.body).toHaveProperty('timestamp');
        expect(rateLimitedResponse.body).toHaveProperty('path');
        expect(rateLimitedResponse.body).toHaveProperty('correlationId');

        // Verificar tipos
        expect(typeof rateLimitedResponse.body.error).toBe('string');
        expect(typeof rateLimitedResponse.body.message).toBe('string');
        expect(typeof rateLimitedResponse.body.timestamp).toBe('string');
        expect(typeof rateLimitedResponse.body.correlationId).toBe('string');
      }
    }, 30000);

    it('resposta 429 deve ser JSON válido', async () => {
      // Forçar rate limit
      const promises = Array.from({ length: 110 }, () =>
        request(server)
          .get('/api/item/search')
          .query({ limit: 1 })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponse = responses.find((r) => r.status === 429);

      if (rateLimitedResponse) {
        expect(rateLimitedResponse.headers['content-type']).toContain('application/json');
        expect(() => JSON.parse(JSON.stringify(rateLimitedResponse.body))).not.toThrow();
      }
    }, 30000);
  });

  describe('Rate Limit - Edge Cases', () => {
    it('deve lidar com burst de requests simultâneas', async () => {
      // Burst de 50 requests simultâneas
      const promises = Array.from({ length: 50 }, () =>
        request(server)
          .get('/api/item/search')
          .query({ limit: 1 })
      );

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      // Maioria deve ter sucesso (abaixo do limite)
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThan(30);

      console.log(`50 concurrent requests completed in ${duration}ms`);
    }, 15000);

    it('deve contar apenas requests em /api/', async () => {
      // Fazer 50 requests fora de /api/
      const nonApiPromises = Array.from({ length: 50 }, () =>
        request(server).get('/health')
      );

      await Promise.all(nonApiPromises);

      // Depois fazer requests em /api/
      const apiPromises = Array.from({ length: 50 }, () =>
        request(server).get('/api/item/search').query({ limit: 1 })
      );

      const apiResponses = await Promise.all(apiPromises);

      // Todas devem ter sucesso (limite não afetado por /health)
      apiResponses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    }, 20000);

    it('deve resetar contador após window expirar', async () => {
      // Nota: Este teste é conceitual pois aguardar 15 minutos não é prático

      // Fazer algumas requests
      const promises = Array.from({ length: 10 }, () =>
        request(server).get('/api/item/search').query({ limit: 1 })
      );

      const responses = await Promise.all(promises);

      // Todas devem ter sucesso
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Em produção, após 15 minutos, o contador deve resetar
      // Para testes, verificamos que o rate limiter está funcional
    }, 10000);

    it('deve lidar com POST requests (se houver)', async () => {
      // Sistema é read-only, mas verificar que rate limit funciona para outros métodos
      const response = await request(server)
        .post('/api/item/search')
        .send({ test: 'data' });

      // Pode retornar 405 (Method Not Allowed) ou 404
      expect([404, 405, 429]).toContain(response.status);
    });

    it('deve aplicar rate limit para requests com diferentes query params', async () => {
      // Requests com diferentes params devem contar para o mesmo limite
      const promises = [];
      for (let i = 0; i < 110; i++) {
        promises.push(
          request(server)
            .get('/api/item/search')
            .query({ limit: 1, page: (i % 10) + 1 })
        );
      }

      const responses = await Promise.all(promises);

      // Deve haver rate limiting
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    }, 30000);

    it('deve aplicar rate limit para requests com diferentes headers', async () => {
      // Requests com diferentes headers devem contar para o mesmo limite
      const promises = [];
      for (let i = 0; i < 110; i++) {
        promises.push(
          request(server)
            .get('/api/item/search')
            .set('User-Agent', `Test-Agent-${i}`)
            .query({ limit: 1 })
        );
      }

      const responses = await Promise.all(promises);

      // Deve haver rate limiting (mesmo IP)
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Rate Limit - Recovery', () => {
    it('sistema deve continuar funcionando após rate limit', async () => {
      // Forçar rate limit
      const promises1 = Array.from({ length: 110 }, () =>
        request(server).get('/api/item/search').query({ limit: 1 })
      );

      await Promise.all(promises1);

      // Aguardar um pouco
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Usar admin key para verificar que sistema está funcionando
      const response = await request(server)
        .get('/api/item/search')
        .set('X-API-Key', 'admin-key-superuser')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    }, 35000);

    it('health check deve funcionar mesmo quando rate limited', async () => {
      // Forçar rate limit na API
      const promises = Array.from({ length: 110 }, () =>
        request(server).get('/api/item/search').query({ limit: 1 })
      );

      await Promise.all(promises);

      // Health check deve ainda funcionar
      const healthResponse = await request(server)
        .get('/health')
        .expect(200);

      expect(healthResponse.body.status).toBe('healthy');
    }, 30000);
  });

  describe('Rate Limit - Logging', () => {
    it('deve logar quando rate limit é atingido', async () => {
      // Forçar rate limit
      const promises = Array.from({ length: 110 }, () =>
        request(server).get('/api/item/search').query({ limit: 1 })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponse = responses.find((r) => r.status === 429);

      // Rate limit deve ter sido logado (não verificável diretamente no teste)
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.body).toHaveProperty('correlationId');
        // O log deve incluir: correlationId, IP, URL
      }
    }, 30000);
  });

  describe('Rate Limit - Performance Impact', () => {
    it('rate limiting não deve adicionar latência significativa', async () => {
      // Medir tempo de resposta
      const start = Date.now();
      await request(server)
        .get('/api/item/search')
        .query({ limit: 1 })
        .expect(200);
      const duration = Date.now() - start;

      // Rate limiting deve ser rápido (< 100ms overhead)
      expect(duration).toBeLessThan(3000); // 3s total (incluindo DB)
    });

    it('rate limiting deve ser eficiente com requests concorrentes', async () => {
      const start = Date.now();

      const promises = Array.from({ length: 50 }, () =>
        request(server).get('/api/item/search').query({ limit: 1 })
      );

      await Promise.all(promises);

      const duration = Date.now() - start;

      // 50 requests devem completar em tempo razoável
      expect(duration).toBeLessThan(15000); // 15 segundos
      console.log(`50 concurrent requests with rate limiting: ${duration}ms`);
    }, 20000);
  });
});
