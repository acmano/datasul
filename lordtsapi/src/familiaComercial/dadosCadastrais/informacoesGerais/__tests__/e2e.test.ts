// src/familiaComercial/dadosCadastrais/informacoesGerais/__tests__/e2e.test.ts

/// <reference types="jest" />
import request from 'supertest';
import app from '@/app';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

jest.mock('@infrastructure/database/DatabaseManager');

describe('E2E - API InformacoesGerais FamiliaComercial', () => {

  beforeAll(async () => {
    (DatabaseManager.initialize as jest.Mock).mockResolvedValue(undefined);
    (DatabaseManager.isReady as jest.Mock).mockReturnValue(true);

    (DatabaseManager.getConnection as jest.Mock).mockReturnValue({
      query: jest.fn().mockResolvedValue([{ test: 1 }])
    });

    (DatabaseManager.getConnectionStatus as jest.Mock).mockReturnValue({
      type: 'sqlserver',
      mode: 'REAL_DATABASE',
      error: undefined
    });
  });

  afterAll(async () => {
    await DatabaseManager.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (DatabaseManager.getConnection as jest.Mock).mockReturnValue({
      query: jest.fn().mockResolvedValue([{ test: 1 }])
    });
  });

  describe('GET /api/familiaComercial/dadosCadastrais/informacoesGerais/:familiaComercialCodigo', () => {

    it('deve retornar 200 com dados da família comercial', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        familiaComercialCodigo: 'FC01',
        familiaComercialDescricao: 'Família Comercial Teste'
      }]);

      const response = await request(app)
        .get('/api/familiaComercial/dadosCadastrais/informacoesGerais/FC01')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('codigo', 'FC01');
      expect(response.body.data).toHaveProperty('descricao');
    });

    it('deve retornar headers corretos', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        familiaComercialCodigo: 'FC01',
        familiaComercialDescricao: 'Test'
      }]);

      const response = await request(app)
        .get('/api/familiaComercial/dadosCadastrais/informacoesGerais/FC01');

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('deve aceitar Correlation ID customizado', async () => {
      const customCorrelationId = 'test-fc-123';

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        familiaComercialCodigo: 'FC01',
        familiaComercialDescricao: 'Test'
      }]);

      const response = await request(app)
        .get('/api/familiaComercial/dadosCadastrais/informacoesGerais/FC01')
        .set('X-Correlation-ID', customCorrelationId);

      expect(response.headers['x-correlation-id']).toBe(customCorrelationId);
    });

  });

  describe('Validação de Parâmetros', () => {

    it('deve retornar 400 para familiaComercialCodigo muito longo', async () => {
      const response = await request(app)
        .get('/api/familiaComercial/dadosCadastrais/informacoesGerais/12345678901234567')
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('error');
    });

  });

  describe('Família Comercial Não Encontrada', () => {

    it('deve retornar 404 quando família comercial não existe', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/familiaComercial/dadosCadastrais/informacoesGerais/INEXISTENTE')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('deve incluir Correlation ID no erro 404', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/familiaComercial/dadosCadastrais/informacoesGerais/INEXISTENTE');

      expect(response.headers['x-correlation-id']).toBeDefined();
    });

  });

  describe('Erros do Servidor', () => {

    it('deve retornar 500 em caso de erro no banco', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(
        new Error('Conexão perdida')
      );

      const response = await request(app)
        .get('/api/familiaComercial/dadosCadastrais/informacoesGerais/FC01')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

  });

  describe('Middlewares', () => {

    it('deve aplicar CORS headers', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        familiaComercialCodigo: 'FC01',
        familiaComercialDescricao: 'Test'
      }]);

      const response = await request(app)
        .get('/api/familiaComercial/dadosCadastrais/informacoesGerais/FC01')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

  });

  describe('Performance', () => {

    it('deve responder em menos de 1 segundo', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        familiaComercialCodigo: 'FC01',
        familiaComercialDescricao: 'Test'
      }]);

      const start = Date.now();

      await request(app)
        .get('/api/familiaComercial/dadosCadastrais/informacoesGerais/FC01')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

  });

  describe('Edge Cases', () => {

    it('deve aceitar código alfanumérico', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        familiaComercialCodigo: 'FC123',
        familiaComercialDescricao: 'Test'
      }]);

      const response = await request(app)
        .get('/api/familiaComercial/dadosCadastrais/informacoesGerais/FC123')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve aceitar código de 1 caractere', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        familiaComercialCodigo: 'F',
        familiaComercialDescricao: 'Test'
      }]);

      const response = await request(app)
        .get('/api/familiaComercial/dadosCadastrais/informacoesGerais/F')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve aceitar código de 16 caracteres (máximo)', async () => {
      const codigo16 = '1234567890123456';

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        familiaComercialCodigo: codigo16,
        familiaComercialDescricao: 'Test'
      }]);

      const response = await request(app)
        .get(`/api/familiaComercial/dadosCadastrais/informacoesGerais/${codigo16}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

  });

  describe('Rotas do Sistema', () => {

    it('GET / - deve retornar informações da API', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
    });

    it('GET /health - deve retornar status de saúde', async () => {
      (DatabaseManager.getConnection as jest.Mock).mockReturnValue({
        query: jest.fn().mockResolvedValue([{ test: 1 }])
      });

      (DatabaseManager.getConnectionStatus as jest.Mock).mockReturnValue({
        type: 'sqlserver',
        mode: 'REAL_DATABASE',
        error: undefined
      });

      const response = await request(app)
        .get('/health');

      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('database');
    });

    it('GET /metrics - deve retornar métricas Prometheus', async () => {
      const response = await request(app)
        .get('/metrics');

      expect(response.text).toBeDefined();
    });

  });

});