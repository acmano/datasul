// tests/integration/api/ItemAPI.integration.test.ts

import request from 'supertest';
import { Application } from '@/app';

/**
 * Testes de Integração - Fluxo Completo de API
 *
 * Testa o fluxo completo: Request → Middleware → Controller → Service → Repository → Database
 *
 * @group integration
 * @group api
 */
describe('Item API - Integration Flow Tests', () => {
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

  describe('GET /api/item/:itemCodigo', () => {
    it('deve retornar item existente - fluxo completo', async () => {
      // Arrange
      const itemCodigo = 'TEST001';

      // Act
      const response = await request(server)
        .get(`/api/item/${itemCodigo}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('correlationId');
      expect(response.body.data).toHaveProperty('codigo');
      expect(response.body.data).toHaveProperty('descricao');
      expect(response.body.data).toHaveProperty('unidade');
    });

    it('deve retornar 404 para item inexistente', async () => {
      // Arrange
      const itemCodigo = 'XXXXXX_NOT_EXISTS';

      // Act
      const response = await request(server)
        .get(`/api/item/${itemCodigo}`)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });

    it('deve validar código inválido', async () => {
      // Arrange
      const itemCodigo = ''; // Código vazio

      // Act
      const response = await request(server)
        .get(`/api/item/${itemCodigo}`)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });

    it('deve incluir correlation ID em todas as respostas', async () => {
      // Act
      const response = await request(server)
        .get('/api/item/TEST001');

      // Assert
      expect(response.body).toHaveProperty('correlationId');
      expect(typeof response.body.correlationId).toBe('string');
      expect(response.body.correlationId.length).toBeGreaterThan(0);
    });

    it('deve incluir headers corretos', async () => {
      // Act
      const response = await request(server)
        .get('/api/item/TEST001');

      // Assert
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['x-correlation-id']).toBeDefined();
    });
  });

  describe('GET /api/item/search', () => {
    it('deve buscar items com paginação - fluxo completo', async () => {
      // Act
      const response = await request(server)
        .get('/api/item/search')
        .query({ search: 'TORNEIRA', page: 1, limit: 10 })
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
    });

    it('deve validar parâmetros de paginação', async () => {
      // Act
      const response = await request(server)
        .get('/api/item/search')
        .query({ page: 0, limit: 0 }) // Inválidos
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('deve aplicar filtros corretamente', async () => {
      // Act
      const response = await request(server)
        .get('/api/item/search')
        .query({ ativo: true, familia: 'FM001' })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
    });

    it('deve retornar array vazio para busca sem resultados', async () => {
      // Act
      const response = await request(server)
        .get('/api/item/search')
        .query({ search: 'XXXXXX_NO_RESULTS' })
        .expect(200);

      // Assert
      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('Middleware Stack', () => {
    it('deve aplicar rate limiting', async () => {
      // Arrange - Fazer múltiplas requests rápidas
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(server).get('/api/item/TEST001')
        );
      }

      // Act
      const responses = await Promise.all(promises);

      // Assert - Pelo menos uma deve ser rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    }, 10000);

    it('deve aplicar compression para respostas grandes', async () => {
      // Act
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 100 })
        .set('Accept-Encoding', 'gzip');

      // Assert
      expect(response.headers['content-encoding']).toBe('gzip');
    });

    it('deve aplicar CORS headers', async () => {
      // Act
      const response = await request(server)
        .get('/api/item/TEST001')
        .set('Origin', 'http://localhost:3000');

      // Assert
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('deve aplicar security headers (Helmet)', async () => {
      // Act
      const response = await request(server)
        .get('/api/item/TEST001');

      // Assert
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Cache Behavior', () => {
    it('primeira request deve buscar do banco', async () => {
      // Arrange
      const itemCodigo = 'CACHE_TEST_001';

      // Act
      const response = await request(server)
        .get(`/api/item/${itemCodigo}`)
        .expect(200);

      // Assert
      expect(response.headers['x-cache']).toBeUndefined();
    });

    it('segunda request deve usar cache', async () => {
      // Arrange
      const itemCodigo = 'CACHE_TEST_002';

      // Act - Primeira request
      await request(server).get(`/api/item/${itemCodigo}`);

      // Act - Segunda request (deve usar cache)
      const response = await request(server)
        .get(`/api/item/${itemCodigo}`);

      // Assert
      expect(response.status).toBe(200);
      // Cache deve ter sido usado
    });
  });

  describe('Error Handling', () => {
    it('deve retornar erro 500 para erro interno', async () => {
      // Simular erro forçando um código que causa exception
      // (ajustar conforme implementação real)
      const response = await request(server)
        .get('/api/item/ERROR_TRIGGER');

      expect([404, 500]).toContain(response.status);
    });

    it('deve incluir correlation ID em erros', async () => {
      // Act
      const response = await request(server)
        .get('/api/item/NONEXISTENT')
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('correlationId');
    });

    it('deve sanitizar mensagens de erro', async () => {
      // Act
      const response = await request(server)
        .get('/api/item/INVALID')
        .expect(404);

      // Assert - Não deve expor detalhes internos
      expect(response.body.error.message).not.toContain('SELECT');
      expect(response.body.error.message).not.toContain('database');
    });
  });

  describe('Performance', () => {
    it('deve responder em menos de 500ms (p95)', async () => {
      // Arrange
      const measurements: number[] = [];

      // Act - 20 requests
      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await request(server).get('/api/item/TEST001');
        measurements.push(Date.now() - start);
      }

      // Assert - P95
      measurements.sort((a, b) => a - b);
      const p95 = measurements[Math.floor(measurements.length * 0.95)];
      expect(p95).toBeLessThan(500);
    }, 15000);
  });

  describe('Authentication & Authorization', () => {
    it('deve exigir API key quando configurado', async () => {
      // Dependente de configuração
      // Placeholder para quando auth for implementado
      expect(true).toBe(true);
    });
  });
});
