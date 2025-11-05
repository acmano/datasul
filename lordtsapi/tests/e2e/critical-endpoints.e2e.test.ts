// tests/e2e/critical-endpoints.e2e.test.ts

import request from 'supertest';
import { Application } from '@/app';

/**
 * Testes E2E - Endpoints Críticos
 *
 * Testa endpoints críticos que devem SEMPRE funcionar
 * Estes são os endpoints mais usados e essenciais do sistema
 *
 * @group e2e
 * @group critical
 */
describe('E2E - Critical Endpoints', () => {
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

  describe('[CRITICAL] Health Check', () => {
    it('GET /health - deve retornar status healthy', async () => {
      const response = await request(server)
        .get('/health')
        .expect(200);

      // Estrutura obrigatória
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('cache');

      // Status deve ser healthy
      expect(response.body.status).toBe('healthy');

      // Database deve estar conectado
      expect(response.body.database.connected).toBe(true);
      expect(response.body.database.responseTime).toBeGreaterThanOrEqual(0);

      // Timestamp deve ser válido
      expect(new Date(response.body.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('GET /health - deve responder em menos de 2 segundos', async () => {
      const start = Date.now();
      await request(server)
        .get('/health')
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    }, 3000);

    it('GET /health - deve funcionar mesmo sob carga', async () => {
      // 5 health checks simultâneos
      const promises = Array.from({ length: 5 }, () =>
        request(server).get('/health')
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    }, 5000);
  });

  describe('[CRITICAL] Item Search', () => {
    it('GET /api/item/search - deve listar items com paginação', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Estrutura obrigatória
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('correlationId');

      // Data deve ter items e pagination
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('pagination');

      // Items deve ser array
      expect(Array.isArray(response.body.data.items)).toBe(true);

      // Pagination deve ter campos obrigatórios
      const { pagination } = response.body.data;
      expect(pagination).toHaveProperty('page', 1);
      expect(pagination).toHaveProperty('limit', 10);
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');

      // Total deve ser >= 0
      expect(pagination.total).toBeGreaterThanOrEqual(0);
    });

    it('GET /api/item/search - deve funcionar com filtros', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ ativo: true, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
    });

    it('GET /api/item/search - deve validar parâmetros inválidos', async () => {
      // Page inválida
      await request(server)
        .get('/api/item/search')
        .query({ page: -1 })
        .expect(400);

      // Limit inválido
      await request(server)
        .get('/api/item/search')
        .query({ limit: 0 })
        .expect(400);

      // Limit muito grande
      await request(server)
        .get('/api/item/search')
        .query({ limit: 1001 })
        .expect(400);
    });

    it('GET /api/item/search - deve responder em menos de 3 segundos', async () => {
      const start = Date.now();
      await request(server)
        .get('/api/item/search')
        .query({ limit: 10 })
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(3000);
    }, 5000);
  });

  describe('[CRITICAL] Item Details', () => {
    let validItemCodigo: string;

    beforeAll(async () => {
      // Buscar um item válido para usar nos testes
      const searchResponse = await request(server)
        .get('/api/item/search')
        .query({ limit: 1 });

      if (searchResponse.body.data.items.length > 0) {
        validItemCodigo = searchResponse.body.data.items[0].codigo;
      }
    });

    it('GET /api/item/dadosCadastrais/informacoesGerais/:codigo - deve retornar detalhes do item', async () => {
      if (!validItemCodigo) {
        console.warn('⚠️  Nenhum item disponível para teste');
        return;
      }

      const response = await request(server)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${validItemCodigo}`)
        .expect(200);

      // Estrutura obrigatória
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('correlationId');

      // Data deve ter informações do item
      expect(response.body.data).toHaveProperty('codigo');
      expect(response.body.data.codigo).toBe(validItemCodigo);
    });

    it('GET /api/item/dadosCadastrais/informacoesGerais/:codigo - deve retornar 404 para item inexistente', async () => {
      const response = await request(server)
        .get('/api/item/dadosCadastrais/informacoesGerais/XXXXX_NOT_EXISTS')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('correlationId');
    });

    it('GET /api/item/dadosCadastrais/informacoesGerais/:codigo - deve responder rápido', async () => {
      if (!validItemCodigo) return;

      const start = Date.now();
      await request(server)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${validItemCodigo}`)
        .expect(200);
      const duration = Date.now() - start;

      // Primeira request pode ser lenta (sem cache)
      expect(duration).toBeLessThan(5000);

      // Segunda request deve ser rápida (com cache)
      const start2 = Date.now();
      await request(server)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${validItemCodigo}`)
        .expect(200);
      const duration2 = Date.now() - start2;

      expect(duration2).toBeLessThan(2000);
    }, 10000);
  });

  describe('[CRITICAL] Família Listing', () => {
    it('GET /api/familia - deve listar famílias', async () => {
      const response = await request(server)
        .get('/api/familia')
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Estrutura obrigatória
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('pagination');

      // Items deve ser array
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('GET /api/familia - deve validar paginação', async () => {
      // Page inválida
      await request(server)
        .get('/api/familia')
        .query({ page: 0 })
        .expect(400);

      // Limit inválido
      await request(server)
        .get('/api/familia')
        .query({ limit: -1 })
        .expect(400);
    });
  });

  describe('[CRITICAL] Grupo de Estoque Listing', () => {
    it('GET /api/grupoDeEstoque - deve listar grupos de estoque', async () => {
      const response = await request(server)
        .get('/api/grupoDeEstoque')
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Estrutura obrigatória
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('pagination');
    });
  });

  describe('[CRITICAL] Família Comercial Listing', () => {
    it('GET /api/familiaComercial - deve listar famílias comerciais', async () => {
      const response = await request(server)
        .get('/api/familiaComercial')
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Estrutura obrigatória
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('pagination');
    });
  });

  describe('[CRITICAL] Cache Statistics', () => {
    it('GET /cache/stats - deve retornar estatísticas de cache', async () => {
      const response = await request(server)
        .get('/cache/stats')
        .expect(200);

      // Deve ter estatísticas básicas
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('hits');
      expect(response.body).toHaveProperty('misses');
      expect(response.body).toHaveProperty('keys');

      // Valores devem ser números
      expect(typeof response.body.hits).toBe('number');
      expect(typeof response.body.misses).toBe('number');
      expect(typeof response.body.keys).toBe('number');

      // Valores devem ser >= 0
      expect(response.body.hits).toBeGreaterThanOrEqual(0);
      expect(response.body.misses).toBeGreaterThanOrEqual(0);
      expect(response.body.keys).toBeGreaterThanOrEqual(0);
    });
  });

  describe('[CRITICAL] Metrics', () => {
    it('GET /metrics - deve retornar métricas Prometheus', async () => {
      const response = await request(server)
        .get('/metrics')
        .expect(200);

      // Content-Type deve ser Prometheus format
      expect(response.headers['content-type']).toContain('text/plain');

      // Body deve conter métricas
      expect(response.text).toBeDefined();
      expect(response.text.length).toBeGreaterThan(0);

      // Deve conter algumas métricas básicas
      expect(response.text).toContain('http_request');
    });
  });

  describe('[CRITICAL] Error Responses', () => {
    it('GET /nonexistent - deve retornar 404 para rota inexistente', async () => {
      const response = await request(server)
        .get('/nonexistent/route/that/does/not/exist')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('deve incluir correlationId em todas as respostas de erro', async () => {
      // 404
      const response404 = await request(server)
        .get('/api/item/dadosCadastrais/informacoesGerais/NOT_EXISTS')
        .expect(404);
      expect(response404.body).toHaveProperty('correlationId');

      // 400
      const response400 = await request(server)
        .get('/api/item/search')
        .query({ page: -1 })
        .expect(400);
      expect(response400.body).toHaveProperty('correlationId');
    });

    it('deve sanitizar mensagens de erro (não expor detalhes internos)', async () => {
      const response = await request(server)
        .get('/api/item/dadosCadastrais/informacoesGerais/TEST_ERROR')
        .expect(404);

      const errorMessage = JSON.stringify(response.body).toLowerCase();

      // Não deve expor detalhes sensíveis
      expect(errorMessage).not.toContain('select');
      expect(errorMessage).not.toContain('database');
      expect(errorMessage).not.toContain('sql');
      expect(errorMessage).not.toContain('stack trace');
      expect(errorMessage).not.toContain('password');
    });
  });

  describe('[CRITICAL] Response Format Consistency', () => {
    it('todas as respostas bem-sucedidas devem ter formato consistente', async () => {
      const endpoints = [
        '/api/item/search?limit=1',
        '/api/familia?limit=1',
        '/api/grupoDeEstoque?limit=1',
        '/api/familiaComercial?limit=1',
      ];

      for (const endpoint of endpoints) {
        const response = await request(server).get(endpoint).expect(200);

        // Estrutura obrigatória
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('correlationId');

        // CorrelationId deve ser string não-vazia
        expect(typeof response.body.correlationId).toBe('string');
        expect(response.body.correlationId.length).toBeGreaterThan(0);
      }
    });

    it('todas as respostas de erro devem ter formato consistente', async () => {
      const endpoints = [
        '/api/item/dadosCadastrais/informacoesGerais/NOT_EXISTS',
        '/api/familia/dadosCadastrais/informacoesGerais/NOT_EXISTS',
        '/api/grupoDeEstoque/dadosCadastrais/informacoesGerais/NOT_EXISTS',
      ];

      for (const endpoint of endpoints) {
        const response = await request(server).get(endpoint).expect(404);

        // Estrutura obrigatória de erro
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('correlationId');

        // CorrelationId deve ser string não-vazia
        expect(typeof response.body.correlationId).toBe('string');
        expect(response.body.correlationId.length).toBeGreaterThan(0);
      }
    });
  });

  describe('[CRITICAL] Performance SLA', () => {
    it('endpoints críticos devem respeitar SLA de performance', async () => {
      const performanceTests = [
        { endpoint: '/health', maxTime: 2000, description: 'Health check' },
        { endpoint: '/api/item/search?limit=10', maxTime: 3000, description: 'Item search' },
        { endpoint: '/cache/stats', maxTime: 1000, description: 'Cache stats' },
        { endpoint: '/metrics', maxTime: 2000, description: 'Metrics' },
      ];

      for (const test of performanceTests) {
        const start = Date.now();
        const response = await request(server).get(test.endpoint);
        const duration = Date.now() - start;

        expect(response.status).toBe(200);
        expect(duration).toBeLessThan(test.maxTime);

        console.log(`${test.description}: ${duration}ms (max: ${test.maxTime}ms)`);
      }
    }, 15000);
  });

  describe('[CRITICAL] Data Integrity', () => {
    it('dados retornados devem ser consistentes entre requests', async () => {
      // Buscar item duas vezes
      const response1 = await request(server)
        .get('/api/item/search')
        .query({ limit: 1 })
        .expect(200);

      const response2 = await request(server)
        .get('/api/item/search')
        .query({ limit: 1 })
        .expect(200);

      // Mesma query deve retornar mesmos dados
      expect(response1.body.data.pagination.total).toBe(
        response2.body.data.pagination.total
      );

      if (response1.body.data.items.length > 0) {
        expect(response1.body.data.items[0].codigo).toBe(
          response2.body.data.items[0].codigo
        );
      }
    });

    it('paginação deve ser matematicamente correta', async () => {
      const limit = 10;
      const response = await request(server)
        .get('/api/item/search')
        .query({ page: 1, limit })
        .expect(200);

      const { pagination } = response.body.data;

      // Total pages deve ser correto
      const expectedTotalPages = Math.ceil(pagination.total / limit);
      expect(pagination.totalPages).toBe(expectedTotalPages);

      // Page e limit devem corresponder ao solicitado
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(limit);

      // Total deve ser >= número de items retornados
      expect(pagination.total).toBeGreaterThanOrEqual(response.body.data.items.length);
    });
  });

  describe('[CRITICAL] Availability', () => {
    it('sistema deve estar sempre disponível (uptime check)', async () => {
      // Fazer 10 requests em sequência
      for (let i = 0; i < 10; i++) {
        const response = await request(server).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      }
    }, 15000);

    it('sistema deve se recuperar de requests inválidos', async () => {
      // Request inválido
      await request(server)
        .get('/api/item/search')
        .query({ page: -999 })
        .expect(400);

      // Sistema deve continuar funcionando
      const response = await request(server)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });
  });
});
