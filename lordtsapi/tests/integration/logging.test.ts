// tests/integration/logging.test.ts

import request from 'supertest';
import { Application } from '@/app';

describe('Logging Endpoints Integration Tests', () => {
  let app: Application;
  let server: any;

  beforeAll(async () => {
    app = new Application();
    await app.initialize();
    server = app.getServer();
  });

  afterAll(async () => {
    await app.shutdown();
  });
  describe('POST /api/logs/frontend', () => {
    it('deve retornar 201 ao logar erro com sucesso', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'error',
        message: 'Test error from integration test',
        timestamp: new Date().toISOString(),
        url: '/test-page',
        userAgent: 'Jest Test Agent',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Log registrado com sucesso');
      expect(response.body).toHaveProperty('correlationId');
    });

    it('deve retornar 201 ao logar info com sucesso', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'info',
        message: 'User logged in successfully',
        timestamp: new Date().toISOString(),
        url: '/login',
        userAgent: 'Chrome/120.0',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('deve retornar 201 ao logar warn com sucesso', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'warn',
        message: 'Slow API response detected',
        timestamp: new Date().toISOString(),
      });

      expect(response.status).toBe(201);
    });

    it('deve retornar 201 ao logar debug com sucesso', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'debug',
        message: 'Component mounted',
        timestamp: new Date().toISOString(),
      });

      expect(response.status).toBe(201);
    });

    it('deve retornar 400 para payload inválido (sem level)', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        message: 'Test without level',
        timestamp: new Date().toISOString(),
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('level');
    });

    it('deve retornar 400 para payload inválido (sem message)', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'info',
        timestamp: new Date().toISOString(),
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('message');
    });

    it('deve retornar 400 para payload inválido (sem timestamp)', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'info',
        message: 'Test without timestamp',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('timestamp');
    });

    it('deve retornar 400 para level inválido', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'invalid-level',
        message: 'Test',
        timestamp: new Date().toISOString(),
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('level');
    });

    it('deve aceitar context opcional', async () => {
      const response = await request(server)
        .post('/api/logs/frontend')
        .send({
          level: 'info',
          message: 'Test with context',
          context: {
            userId: '123',
            action: 'test',
            metadata: { foo: 'bar' },
          },
          timestamp: new Date().toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('deve aceitar correlationId opcional válido', async () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'warn',
        message: 'Test with correlation ID',
        correlationId,
        timestamp: new Date().toISOString(),
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('deve rejeitar correlationId inválido (não-UUID)', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'info',
        message: 'Test with invalid correlation ID',
        correlationId: 'invalid-uuid',
        timestamp: new Date().toISOString(),
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('correlationId');
    });

    it('deve aceitar url opcional válida', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'error',
        message: 'Page error',
        url: '/dashboard/items/7530110',
        timestamp: new Date().toISOString(),
      });

      expect(response.status).toBe(201);
    });

    it('deve aceitar userAgent opcional', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'info',
        message: 'User action',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date().toISOString(),
      });

      expect(response.status).toBe(201);
    });

    it('deve rejeitar mensagem muito longa (>1000 caracteres)', async () => {
      const longMessage = 'A'.repeat(1001);
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'info',
        message: longMessage,
        timestamp: new Date().toISOString(),
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('message');
    });

    it('deve aceitar mensagem de exatamente 1000 caracteres', async () => {
      const maxMessage = 'A'.repeat(1000);
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'info',
        message: maxMessage,
        timestamp: new Date().toISOString(),
      });

      expect(response.status).toBe(201);
    });

    it('deve remover campos desconhecidos (stripUnknown)', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'info',
        message: 'Test',
        timestamp: new Date().toISOString(),
        unknownField: 'should be stripped',
        anotherUnknown: 123,
      });

      expect(response.status).toBe(201);
    });

    it('deve validar formato ISO 8601 do timestamp', async () => {
      const response = await request(server).post('/api/logs/frontend').send({
        level: 'info',
        message: 'Test',
        timestamp: 'invalid-date-format',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('timestamp');
    });
  });

  describe('POST /api/logs/frontend/batch', () => {
    it('deve processar batch de logs com sucesso', async () => {
      const response = await request(server)
        .post('/api/logs/frontend/batch')
        .send({
          logs: [
            {
              level: 'info',
              message: 'Log 1',
              timestamp: new Date().toISOString(),
            },
            {
              level: 'error',
              message: 'Log 2',
              timestamp: new Date().toISOString(),
            },
            {
              level: 'warn',
              message: 'Log 3',
              timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count', 3);
      expect(response.body).toHaveProperty('correlationId');
      expect(response.body.message).toContain('3 logs');
    });

    it('deve processar batch com um único log', async () => {
      const response = await request(server)
        .post('/api/logs/frontend/batch')
        .send({
          logs: [
            {
              level: 'info',
              message: 'Single log',
              timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.count).toBe(1);
    });

    it('deve processar batch de 100 logs (máximo permitido)', async () => {
      const logs = Array.from({ length: 100 }, (_, i) => ({
        level: 'info' as const,
        message: `Log ${i}`,
        timestamp: new Date().toISOString(),
      }));

      const response = await request(server).post('/api/logs/frontend/batch').send({ logs });

      expect(response.status).toBe(201);
      expect(response.body.count).toBe(100);
    });

    it('deve retornar 400 para batch com mais de 100 logs', async () => {
      const logs = Array.from({ length: 101 }, (_, i) => ({
        level: 'info' as const,
        message: `Log ${i}`,
        timestamp: new Date().toISOString(),
      }));

      const response = await request(server).post('/api/logs/frontend/batch').send({ logs });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('100');
    });

    it('deve retornar 400 para payload sem array logs', async () => {
      const response = await request(server).post('/api/logs/frontend/batch').send({
        notLogs: [],
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('logs');
    });

    it('deve retornar 400 para logs não sendo array', async () => {
      const response = await request(server).post('/api/logs/frontend/batch').send({
        logs: 'not-an-array',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('logs');
    });

    it('deve validar cada item do batch', async () => {
      const response = await request(server)
        .post('/api/logs/frontend/batch')
        .send({
          logs: [
            {
              level: 'info',
              message: 'Valid log',
              timestamp: new Date().toISOString(),
            },
            {
              level: 'invalid-level',
              message: 'Invalid log',
              timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('level');
    });

    it('deve validar que todos os logs tenham timestamp', async () => {
      const response = await request(server)
        .post('/api/logs/frontend/batch')
        .send({
          logs: [
            {
              level: 'info',
              message: 'Valid log',
              timestamp: new Date().toISOString(),
            },
            {
              level: 'error',
              message: 'Missing timestamp',
              // timestamp ausente
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('timestamp');
    });

    it('deve processar batch com contextos variados', async () => {
      const response = await request(server)
        .post('/api/logs/frontend/batch')
        .send({
          logs: [
            {
              level: 'info',
              message: 'User action',
              context: { userId: 'user1', action: 'click' },
              timestamp: new Date().toISOString(),
            },
            {
              level: 'error',
              message: 'API error',
              context: { endpoint: '/api/data', status: 500 },
              timestamp: new Date().toISOString(),
            },
            {
              level: 'warn',
              message: 'No context log',
              timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.count).toBe(3);
    });

    it('deve processar batch com urls e userAgents', async () => {
      const response = await request(server)
        .post('/api/logs/frontend/batch')
        .send({
          logs: [
            {
              level: 'info',
              message: 'Page view',
              url: '/dashboard',
              userAgent: 'Chrome/120.0',
              timestamp: new Date().toISOString(),
            },
            {
              level: 'error',
              message: 'Error on page',
              url: '/items/7530110',
              userAgent: 'Firefox/119.0',
              timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.count).toBe(2);
    });

    it('deve processar batch com correlationIds', async () => {
      const response = await request(server)
        .post('/api/logs/frontend/batch')
        .send({
          logs: [
            {
              level: 'info',
              message: 'Log 1',
              correlationId: '123e4567-e89b-12d3-a456-426614174000',
              timestamp: new Date().toISOString(),
            },
            {
              level: 'error',
              message: 'Log 2',
              correlationId: '987fcdeb-51a2-43f7-8b9c-123456789012',
              timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.count).toBe(2);
    });

    it('deve retornar 400 se qualquer correlationId for inválido', async () => {
      const response = await request(server)
        .post('/api/logs/frontend/batch')
        .send({
          logs: [
            {
              level: 'info',
              message: 'Log 1',
              correlationId: '123e4567-e89b-12d3-a456-426614174000',
              timestamp: new Date().toISOString(),
            },
            {
              level: 'error',
              message: 'Log 2',
              correlationId: 'invalid-uuid',
              timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('correlationId');
    });
  });
});
