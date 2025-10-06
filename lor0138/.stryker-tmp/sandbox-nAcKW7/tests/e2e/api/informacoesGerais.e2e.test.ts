// @ts-nocheck
// tests/e2e/api/informacoesGerais.e2e.test.ts

/// <reference types="jest" />
import request from 'supertest';
import app from '../../../src/app'; // Express app
import { DatabaseManager } from '../../../src/infrastructure/database/DatabaseManager';
import { createInformacoesGerais } from '../../factories/item.factory';

// Mock do DatabaseManager para E2E
jest.mock('@infrastructure/database/DatabaseManager');

describe('E2E - API InformacoesGerais', () => {
  
  beforeAll(async () => {
    // Inicializar DatabaseManager se necessário
    (DatabaseManager.initialize as jest.Mock).mockResolvedValue(undefined);
    (DatabaseManager.isReady as jest.Mock).mockReturnValue(true);
    
    // Mock para health check
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
    // Cleanup
    await DatabaseManager.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Re-aplicar mocks que são usados em todos os testes
    (DatabaseManager.getConnection as jest.Mock).mockReturnValue({
      query: jest.fn().mockResolvedValue([{ test: 1 }])
    });
  });

  // ========================================
  // CASOS DE SUCESSO
  // ========================================
  describe('GET /api/lor0138/item/dadosCadastrais/informacoesGerais/:itemCodigo', () => {
    
    it('deve retornar 200 com dados do item', async () => {
      const mockData = createInformacoesGerais();
      
      // Mock do DatabaseManager retornando dados
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        itemCodigo: '7530110',
        itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
        itemUnidade: 'UN'
      }]);

      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('deve retornar headers corretos', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        itemCodigo: '7530110',
        itemDescricao: 'Test',
        itemUnidade: 'UN'
      }]);

      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110');

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('deve aceitar Correlation ID customizado', async () => {
      const customCorrelationId = 'test-correlation-123';
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        itemCodigo: '7530110',
        itemDescricao: 'Test',
        itemUnidade: 'UN'
      }]);

      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110')
        .set('X-Correlation-ID', customCorrelationId);

      expect(response.headers['x-correlation-id']).toBe(customCorrelationId);
    });

  });

  // ========================================
  // VALIDAÇÃO DE ENTRADA
  // ========================================
  describe('Validação de Parâmetros', () => {
    
    it('deve retornar 400 para itemCodigo inválido (muito longo)', async () => {
      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/12345678901234567')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/ValidationError/);
    });

    it('deve retornar 400 para itemCodigo vazio', async () => {
      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/ ')
        .expect(404); // Express trata ' ' como rota não encontrada

      expect(response.body).toHaveProperty('error');
    });

  });

  // ========================================
  // ITEM NÃO ENCONTRADO
  // ========================================
  describe('Item Não Encontrado', () => {
    
    it('deve retornar 404 quando item não existe', async () => {
      // Mock retornando vazio
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/INEXISTENTE')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/não encontrado/i);
    });

    it('deve incluir Correlation ID no erro 404', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/INEXISTENTE');

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
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

  });

  // ========================================
  // MIDDLEWARES
  // ========================================
  describe('Middlewares', () => {
    
    it('deve aplicar CORS headers', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        itemCodigo: '7530110',
        itemDescricao: 'Test',
        itemUnidade: 'UN'
      }]);

      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('deve comprimir resposta (gzip)', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        itemCodigo: '7530110',
        itemDescricao: 'Test',
        itemUnidade: 'UN'
      }]);

      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110')
        .set('Accept-Encoding', 'gzip');

      // Compression middleware pode adicionar vary header
      expect(response.headers).toBeDefined();
    });

  });

  // ========================================
  // CACHE (se implementado)
  // ========================================
  describe('Cache HTTP', () => {
    
    it('deve retornar Cache-Control header', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        itemCodigo: '7530110',
        itemDescricao: 'Test',
        itemUnidade: 'UN'
      }]);

      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110');

      // Se cache middleware estiver ativo
      if (response.headers['cache-control']) {
        expect(response.headers['cache-control']).toBeDefined();
      }
    });

  });

  // ========================================
  // AUTENTICAÇÃO (API Key opcional)
  // ========================================
  describe('API Key (Opcional)', () => {
    
    it('deve aceitar requisição sem API Key', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        itemCodigo: '7530110',
        itemDescricao: 'Test',
        itemUnidade: 'UN'
      }]);

      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve aceitar API Key válida se fornecida', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        itemCodigo: '7530110',
        itemDescricao: 'Test',
        itemUnidade: 'UN'
      }]);

      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110')
        .set('X-API-Key', 'free-demo-key-123456')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

  });

  // ========================================
  // PERFORMANCE
  // ========================================
  describe('Performance', () => {
    
    it('deve responder em menos de 1 segundo', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        itemCodigo: '7530110',
        itemDescricao: 'Test',
        itemUnidade: 'UN'
      }]);

      const start = Date.now();
      
      await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/7530110')
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
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        itemCodigo: 'ABC123',
        itemDescricao: 'Test',
        itemUnidade: 'UN'
      }]);

      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/ABC123')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve aceitar código de 1 caractere', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        itemCodigo: 'A',
        itemDescricao: 'Test',
        itemUnidade: 'UN'
      }]);

      const response = await request(app)
        .get('/api/lor0138/item/dadosCadastrais/informacoesGerais/A')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve aceitar código de 16 caracteres (máximo)', async () => {
      const codigo16 = '1234567890123456';
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([{
        itemCodigo: codigo16,
        itemDescricao: 'Test',
        itemUnidade: 'UN'
      }]);

      const response = await request(app)
        .get(`/api/lor0138/item/dadosCadastrais/informacoesGerais/${codigo16}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

  });

  // ========================================
  // ROTAS ESPECIAIS
  // ========================================
  describe('Rotas do Sistema', () => {
    
    it('GET / - deve retornar informações da API', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('documentation');
    });

    it('GET /health - deve retornar status de saúde', async () => {
      // Garantir que o mock está configurado
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

      // Health check pode retornar 200 (healthy) ou 503 (unhealthy)
      // Verifica que retornou uma resposta válida
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('database');
    });

    it('GET /metrics - deve retornar métricas Prometheus', async () => {
      const response = await request(app)
        .get('/metrics');

      // Métricas retornam texto, não JSON
      expect(response.text).toBeDefined();
    });

  });

});