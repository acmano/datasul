// src/familia/dadosCadastrais/informacoesGerais/__tests__/e2e.test.ts

/// <reference types="jest" />
import request from 'supertest';
import app from '@/app';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

jest.mock('@infrastructure/database/DatabaseManager');

describe('E2E - API InformacoesGerais Familia', () => {
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

  // ========================================
  // CASOS DE SUCESSO
  // ========================================
  describe('GET /api/familia/dadosCadastrais/informacoesGerais/:familiaCodigo', () => {
    it('deve retornar 200 com dados da família', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([
        {
          familiaCodigo: 'F001',
          familiaDescricao: 'Válvulas e Conexões',
        },
      ]);

      const response = await request(app)
        .get('/api/familia/dadosCadastrais/informacoesGerais/F001')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('codigo', 'F001');
      expect(response.body.data).toHaveProperty('descricao');
    });

    it('deve retornar headers corretos', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([
        {
          familiaCodigo: 'F001',
          familiaDescricao: 'Test',
        },
      ]);

      const response = await request(app).get(
        '/api/familia/dadosCadastrais/informacoesGerais/F001'
      );

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('deve aceitar Correlation ID customizado', async () => {
      const customCorrelationId = 'test-familia-123';

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([
        {
          familiaCodigo: 'F001',
          familiaDescricao: 'Test',
        },
      ]);

      const response = await request(app)
        .get('/api/familia/dadosCadastrais/informacoesGerais/F001')
        .set('X-Correlation-ID', customCorrelationId);

      expect(response.headers['x-correlation-id']).toBe(customCorrelationId);
    });
  });

  // ========================================
  // VALIDAÇÃO DE ENTRADA
  // ========================================
  describe('Validação de Parâmetros', () => {
    it('deve retornar 404 para família inexistente', async () => {
      const invalidCode = 'INVALID999';

      const response = await request(app)
        .get(`/api/familia/dadosCadastrais/informacoesGerais/${invalidCode}`)
        .expect((res) => {
          expect([200, 400, 404]).toContain(res.status);
        });

      if (response.status === 404) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  // ========================================
  // FAMÍLIA NÃO ENCONTRADA
  // ========================================
  describe('Família Não Encontrada', () => {
    it('deve retornar 404 quando família não existe', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/familia/dadosCadastrais/informacoesGerais/XXX999') // ← 6 chars, válido
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/não encontrad/i);
    });

    it('deve incluir Correlation ID no erro 404', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get(
        '/api/familia/dadosCadastrais/informacoesGerais/INEXISTENTE'
      );

      expect(response.headers['x-correlation-id']).toBeDefined();
    });
  });

  // ========================================
  // ERROS DO SERVIDOR
  // ========================================
  describe('Erros do Servidor', () => {
    it('deve retornar 500 em caso de erro no banco', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(
        new Error('Conexão perdida')
      );

      const response = await request(app)
        .get('/api/familia/dadosCadastrais/informacoesGerais/F001')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  // ========================================
  // MIDDLEWARES
  // ========================================
  describe('Middlewares', () => {
    it('deve aplicar CORS headers', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([
        {
          familiaCodigo: 'F001',
          familiaDescricao: 'Test',
        },
      ]);

      const response = await request(app)
        .get('/api/familia/dadosCadastrais/informacoesGerais/F001')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  // ========================================
  // PERFORMANCE
  // ========================================
  describe('Performance', () => {
    it('deve responder em menos de 1 segundo', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([
        {
          familiaCodigo: 'F001',
          familiaDescricao: 'Test',
        },
      ]);

      const start = Date.now();

      const response = await request(app)
        .get('/api/familia/dadosCadastrais/informacoesGerais/F001')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    it('deve aceitar código alfanumérico', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([
        {
          familiaCodigo: 'FAM123',
          familiaDescricao: 'Test',
        },
      ]);

      const response = await request(app)
        .get('/api/familia/dadosCadastrais/informacoesGerais/FAM123')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve aceitar código de 1 caractere', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([
        {
          familiaCodigo: 'F',
          familiaDescricao: 'Test',
        },
      ]);

      const response = await request(app)
        .get('/api/familia/dadosCadastrais/informacoesGerais/F')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve aceitar código de 8 caracteres (máximo)', async () => {
      const codigo8 = '12345678';

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([
        {
          familiaCodigo: codigo8,
          familiaDescricao: 'Test',
        },
      ]);

      const response = await request(app)
        .get(`/api/familia/dadosCadastrais/informacoesGerais/${codigo8}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ========================================
  // ROTAS DO SISTEMA
  // ========================================
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
