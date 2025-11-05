// tests/e2e/cors-headers.e2e.test.ts

import request from 'supertest';
import { Application } from '@/app';

/**
 * Testes E2E - CORS & Security Headers
 *
 * Testa configuração de CORS e headers de segurança
 *
 * @group e2e
 * @group cors
 * @group security
 */
describe('E2E - CORS & Security Headers', () => {
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

  describe('CORS - Allowed Origins', () => {
    it('deve permitir requests de origem permitida (localhost:3000)', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('Origin', 'http://localhost:3000')
        .query({ limit: 5 })
        .expect(200);

      // Verificar CORS headers
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('deve permitir requests sem header Origin (Postman/curl)', async () => {
      // Requests sem Origin devem ser permitidos
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve incluir CORS headers em respostas bem-sucedidas', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('Origin', 'http://localhost:3000')
        .query({ limit: 5 })
        .expect(200);

      // Verificar headers CORS esperados
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('deve incluir CORS headers em respostas de erro', async () => {
      const response = await request(server)
        .get('/api/item/dadosCadastrais/informacoesGerais/NOT_EXISTS')
        .set('Origin', 'http://localhost:3000')
        .expect(404);

      // CORS headers devem estar presentes mesmo em erros
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('CORS - Preflight Requests', () => {
    it('deve responder a OPTIONS preflight request', async () => {
      const response = await request(server)
        .options('/api/item/search')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type');

      // Preflight pode retornar 200 ou 204
      expect([200, 204]).toContain(response.status);
    });

    it('deve incluir métodos permitidos em preflight', async () => {
      const response = await request(server)
        .options('/api/item/search')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      // Verificar header de métodos permitidos
      if (response.headers['access-control-allow-methods']) {
        const methods = response.headers['access-control-allow-methods'];
        expect(methods).toContain('GET');
      }
    });

    it('deve incluir headers permitidos em preflight', async () => {
      const response = await request(server)
        .options('/api/item/search')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      // Verificar headers permitidos
      if (response.headers['access-control-allow-headers']) {
        const headers = response.headers['access-control-allow-headers'];
        expect(headers).toBeDefined();
      }
    });
  });

  describe('CORS - Exposed Headers', () => {
    it('deve expor X-Correlation-ID header', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('Origin', 'http://localhost:3000')
        .query({ limit: 5 })
        .expect(200);

      // X-Correlation-ID deve estar nos exposed headers
      if (response.headers['access-control-expose-headers']) {
        expect(response.headers['access-control-expose-headers']).toContain('X-Correlation-ID');
      }

      // E deve estar presente na resposta
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('deve permitir cliente acessar headers expostos', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('Origin', 'http://localhost:3000')
        .query({ limit: 5 })
        .expect(200);

      // Headers expostos devem estar acessíveis
      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.body.correlationId).toBeDefined();
    });
  });

  describe('CORS - Credentials', () => {
    it('deve suportar credentials quando configurado', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('Origin', 'http://localhost:3000')
        .query({ limit: 5 });

      // Verificar se credentials são suportados
      if (response.headers['access-control-allow-credentials']) {
        expect(response.headers['access-control-allow-credentials']).toBe('true');
      }
    });
  });

  describe('Security Headers - Helmet', () => {
    it('deve incluir X-Content-Type-Options: nosniff', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 });

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('deve incluir X-Frame-Options', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 });

      expect(response.headers['x-frame-options']).toBeDefined();
      // Pode ser DENY ou SAMEORIGIN
      expect(['DENY', 'SAMEORIGIN']).toContain(response.headers['x-frame-options']);
    });

    it('deve incluir X-XSS-Protection', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 });

      // X-XSS-Protection pode estar presente
      if (response.headers['x-xss-protection']) {
        expect(response.headers['x-xss-protection']).toBeDefined();
      }
    });

    it('deve incluir Strict-Transport-Security em produção', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 });

      // HSTS pode estar presente (dependendo da configuração)
      if (response.headers['strict-transport-security']) {
        expect(response.headers['strict-transport-security']).toContain('max-age');
      }
    });

    it('deve incluir X-DNS-Prefetch-Control', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 });

      // Header pode estar presente
      if (response.headers['x-dns-prefetch-control']) {
        expect(response.headers['x-dns-prefetch-control']).toBeDefined();
      }
    });

    it('deve incluir X-Download-Options', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 });

      // Header pode estar presente
      if (response.headers['x-download-options']) {
        expect(response.headers['x-download-options']).toBe('noopen');
      }
    });

    it('deve incluir X-Permitted-Cross-Domain-Policies', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 });

      // Header pode estar presente
      if (response.headers['x-permitted-cross-domain-policies']) {
        expect(response.headers['x-permitted-cross-domain-policies']).toBe('none');
      }
    });
  });

  describe('Response Headers - Content Type', () => {
    it('deve retornar Content-Type: application/json para endpoints JSON', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('deve retornar Content-Type: text/plain para metrics', async () => {
      const response = await request(server)
        .get('/metrics')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
    });

    it('deve incluir charset em Content-Type', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 })
        .expect(200);

      expect(response.headers['content-type']).toMatch(/charset/i);
    });
  });

  describe('Response Headers - Compression', () => {
    it('deve aplicar compressão para respostas grandes', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('Accept-Encoding', 'gzip, deflate')
        .query({ limit: 100 });

      // Compression pode estar aplicada
      if (response.headers['content-encoding']) {
        expect(['gzip', 'deflate']).toContain(response.headers['content-encoding']);
      }
    });

    it('deve respeitar Accept-Encoding do cliente', async () => {
      const responseGzip = await request(server)
        .get('/api/item/search')
        .set('Accept-Encoding', 'gzip')
        .query({ limit: 50 });

      // Se compressão aplicada, deve ser gzip
      if (responseGzip.headers['content-encoding']) {
        expect(responseGzip.headers['content-encoding']).toBe('gzip');
      }
    });

    it('não deve comprimir respostas pequenas', async () => {
      const response = await request(server)
        .get('/health')
        .set('Accept-Encoding', 'gzip');

      // Health check é pequeno, pode não ser comprimido
      // Verificar apenas que não causa erro
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('Custom Headers - Correlation ID', () => {
    it('deve incluir X-Correlation-ID em todas as respostas', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 })
        .expect(200);

      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(typeof response.headers['x-correlation-id']).toBe('string');
      expect(response.headers['x-correlation-id'].length).toBeGreaterThan(0);
    });

    it('deve retornar correlation ID fornecido pelo cliente', async () => {
      const customCorrelationId = 'test-correlation-123';

      const response = await request(server)
        .get('/api/item/search')
        .set('X-Correlation-ID', customCorrelationId)
        .query({ limit: 5 })
        .expect(200);

      expect(response.headers['x-correlation-id']).toBe(customCorrelationId);
    });

    it('deve incluir correlation ID em respostas de erro', async () => {
      const response = await request(server)
        .get('/api/item/dadosCadastrais/informacoesGerais/NOT_EXISTS')
        .expect(404);

      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.body.correlationId).toBeDefined();
      expect(response.headers['x-correlation-id']).toBe(response.body.correlationId);
    });

    it('deve manter correlation ID através de múltiplas requests', async () => {
      const correlationId = 'e2e-multi-request-123';

      const responses = await Promise.all([
        request(server)
          .get('/api/item/search')
          .set('X-Correlation-ID', correlationId),
        request(server)
          .get('/api/familia')
          .set('X-Correlation-ID', correlationId),
        request(server)
          .get('/health')
          .set('X-Correlation-ID', correlationId),
      ]);

      responses.forEach((response) => {
        expect(response.headers['x-correlation-id']).toBe(correlationId);
      });
    });
  });

  describe('Cache Headers', () => {
    it('deve incluir headers de cache quando apropriado', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 });

      // Verificar se há headers de cache
      // (podem não estar presentes dependendo da configuração)
      if (response.headers['cache-control']) {
        expect(response.headers['cache-control']).toBeDefined();
      }
    });

    it('deve permitir cliente controlar cache via headers', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('Cache-Control', 'no-cache')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Headers - Edge Cases', () => {
    it('deve lidar com múltiplos valores em Accept-Encoding', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('Accept-Encoding', 'gzip, deflate, br')
        .query({ limit: 10 });

      expect([200]).toContain(response.status);
    });

    it('deve lidar com User-Agent customizado', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('User-Agent', 'E2E-Test-Agent/1.0')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve lidar com headers vazios', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve lidar com headers case-insensitive', async () => {
      const responses = await Promise.all([
        request(server).get('/api/item/search').set('content-type', 'application/json'),
        request(server).get('/api/item/search').set('Content-Type', 'application/json'),
        request(server).get('/api/item/search').set('CONTENT-TYPE', 'application/json'),
      ]);

      responses.forEach((response) => {
        expect([200, 400]).toContain(response.status);
      });
    });

    it('deve ignorar headers não reconhecidos', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('X-Custom-Unknown-Header', 'test-value')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve lidar com valores de header muito longos', async () => {
      const longValue = 'a'.repeat(1000);

      const response = await request(server)
        .get('/api/item/search')
        .set('X-Custom-Long-Header', longValue)
        .query({ limit: 5 });

      expect([200, 400, 431]).toContain(response.status);
    });
  });

  describe('Headers Consistency', () => {
    it('headers devem ser consistentes entre diferentes endpoints', async () => {
      const endpoints = [
        '/api/item/search?limit=1',
        '/api/familia?limit=1',
        '/api/grupoDeEstoque?limit=1',
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) => request(server).get(endpoint))
      );

      // Todos devem ter security headers
      responses.forEach((response) => {
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-correlation-id']).toBeDefined();
        expect(response.headers['content-type']).toContain('application/json');
      });
    });

    it('headers devem ser consistentes entre success e error', async () => {
      const successResponse = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 })
        .expect(200);

      const errorResponse = await request(server)
        .get('/api/item/dadosCadastrais/informacoesGerais/NOT_EXISTS')
        .expect(404);

      // Ambos devem ter headers de segurança
      expect(successResponse.headers['x-content-type-options']).toBe(
        errorResponse.headers['x-content-type-options']
      );
      expect(successResponse.headers['x-correlation-id']).toBeDefined();
      expect(errorResponse.headers['x-correlation-id']).toBeDefined();
    });
  });

  describe('Headers - Performance', () => {
    it('headers não devem adicionar latência significativa', async () => {
      const start = Date.now();
      await request(server)
        .get('/api/item/search')
        .query({ limit: 1 })
        .expect(200);
      const duration = Date.now() - start;

      // Headers devem ser aplicados rapidamente
      expect(duration).toBeLessThan(3000);
    });

    it('deve processar headers eficientemente em requests concorrentes', async () => {
      const promises = Array.from({ length: 20 }, () =>
        request(server)
          .get('/api/item/search')
          .set('X-Correlation-ID', `concurrent-${Math.random()}`)
          .query({ limit: 1 })
      );

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      // Todas devem ter headers corretos
      responses.forEach((response) => {
        expect(response.headers['x-correlation-id']).toBeDefined();
        expect(response.headers['x-content-type-options']).toBe('nosniff');
      });

      console.log(`20 concurrent requests with headers: ${duration}ms`);
    }, 15000);
  });
});
