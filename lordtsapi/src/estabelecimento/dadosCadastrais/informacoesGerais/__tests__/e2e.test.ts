// src/estabelecimento/dadosCadastrais/informacoesGerais/__tests__/e2e.test.ts
import { log } from '@shared/utils/logger';

/// <reference types="jest" />
import request from 'supertest';
import app from '@/app';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/cache/QueryCacheService');

describe('E2E - API InformacoesGerais Estabelecimento', () => {
  beforeAll(async () => {
    (DatabaseManager.initialize as jest.Mock).mockResolvedValue(undefined);
    (DatabaseManager.isReady as jest.Mock).mockReturnValue(true);

    (DatabaseManager.getConnection as jest.Mock).mockReturnValue({
      query: jest.fn().mockResolvedValue([{ test: 1 }]),
    });

    (DatabaseManager.getConnectionStatus as jest.Mock).mockReturnValue({
      type: 'sqlserver',
      mode: 'REAL_DATABASE',
      error: undefined,
    });

    (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
      async (query, params, fn) => fn()
    );
  });

  afterAll(async () => {
    await DatabaseManager.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (DatabaseManager.getConnection as jest.Mock).mockReturnValue({
      query: jest.fn().mockResolvedValue([{ test: 1 }]),
    });
  });

  describe('GET /api/estabelecimento/dadosCadastrais/informacoesGerais/:codigo', () => {
    it('deve retornar 200 com dados do estabelecimento', async () => {
      (DatabaseManager.queryMultWithParams as jest.Mock).mockResolvedValue([
        {
          codigo: '101',
          nome: 'Estabelecimento Teste',
        },
      ]);

      const response = await request(app).get(
        '/api/estabelecimento/dadosCadastrais/informacoesGerais/101'
      );

      log.debug('STATUS:', { status: response.status });
      log.debug('BODY:', { body: JSON.stringify(response.body, null, 2) });

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('codigo', '101');
      expect(response.body.data).toHaveProperty('descricao');
    });

    it('deve retornar headers corretos', async () => {
      (DatabaseManager.queryMultWithParams as jest.Mock).mockResolvedValue([
        {
          codigo: '101',
          descricao: 'Test',
        },
      ]);

      const response = await request(app).get(
        '/api/estabelecimento/dadosCadastrais/informacoesGerais/101'
      );

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('deve aceitar Correlation ID customizado', async () => {
      const customCorrelationId = 'test-estab-123';

      (DatabaseManager.queryMultWithParams as jest.Mock).mockResolvedValue([
        {
          codigo: '101',
          descricao: 'Test',
        },
      ]);

      const response = await request(app)
        .get('/api/estabelecimento/dadosCadastrais/informacoesGerais/101')
        .set('X-Correlation-ID', customCorrelationId);

      expect(response.headers['x-correlation-id']).toBe(customCorrelationId);
    });
  });

  describe('Validação de Parâmetros', () => {
    it('deve retornar 400 para codigo muito longo', async () => {
      const response = await request(app)
        .get('/api/estabelecimento/dadosCadastrais/informacoesGerais/123456')
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Estabelecimento Não Encontrado', () => {
    it('deve retornar 404 quando estabelecimento não existe', async () => {
      (DatabaseManager.queryMultWithParams as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/estabelecimento/dadosCadastrais/informacoesGerais/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('deve incluir Correlation ID no erro 404', async () => {
      (DatabaseManager.queryMultWithParams as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get(
        '/api/estabelecimento/dadosCadastrais/informacoesGerais/99999'
      );

      expect(response.headers['x-correlation-id']).toBeDefined();
    });
  });

  describe('Erros do Servidor', () => {
    it('deve retornar 500 em caso de erro no banco', async () => {
      (DatabaseManager.queryMultWithParams as jest.Mock).mockRejectedValue(
        new Error('Conexão perdida')
      );

      const response = await request(app)
        .get('/api/estabelecimento/dadosCadastrais/informacoesGerais/101')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Middlewares', () => {
    it('deve aplicar CORS headers', async () => {
      (DatabaseManager.queryMultWithParams as jest.Mock).mockResolvedValue([
        {
          codigo: '101',
          descricao: 'Test',
        },
      ]);

      const response = await request(app)
        .get('/api/estabelecimento/dadosCadastrais/informacoesGerais/101')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('deve responder em menos de 1 segundo', async () => {
      (DatabaseManager.queryMultWithParams as jest.Mock).mockResolvedValue([
        {
          codigo: '101',
          descricao: 'Test',
        },
      ]);

      const start = Date.now();

      const response = await request(app)
        .get('/api/estabelecimento/dadosCadastrais/informacoesGerais/101')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Edge Cases', () => {
    it('deve aceitar código numérico de 3 dígitos (típico)', async () => {
      (DatabaseManager.queryMultWithParams as jest.Mock).mockResolvedValue([
        {
          codigo: '101',
          descricao: 'Test',
        },
      ]);

      const response = await request(app)
        .get('/api/estabelecimento/dadosCadastrais/informacoesGerais/101')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve aceitar código de 1 dígito', async () => {
      (DatabaseManager.queryMultWithParams as jest.Mock).mockResolvedValue([
        {
          codigo: '1',
          descricao: 'Test',
        },
      ]);

      const response = await request(app)
        .get('/api/estabelecimento/dadosCadastrais/informacoesGerais/1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve aceitar código de 5 dígitos (máximo)', async () => {
      const codigo5 = '12345';

      (DatabaseManager.queryMultWithParams as jest.Mock).mockResolvedValue([
        {
          codigo: codigo5,
          descricao: 'Test',
        },
      ]);

      const response = await request(app)
        .get(`/api/estabelecimento/dadosCadastrais/informacoesGerais/${codigo5}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Rotas do Sistema', () => {
    it('GET / - deve retornar informações da API', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
    });

    it('GET /health - deve retornar status de saúde', async () => {
      (DatabaseManager.getConnection as jest.Mock).mockReturnValue({
        query: jest.fn().mockResolvedValue([{ test: 1 }]),
      });

      (DatabaseManager.getConnectionStatus as jest.Mock).mockReturnValue({
        type: 'sqlserver',
        mode: 'REAL_DATABASE',
        error: undefined,
      });

      const response = await request(app).get('/health');

      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('database');
    });

    it('GET /metrics - deve retornar métricas Prometheus', async () => {
      const response = await request(app).get('/metrics');

      expect(response.text).toBeDefined();
    });
  });
});
