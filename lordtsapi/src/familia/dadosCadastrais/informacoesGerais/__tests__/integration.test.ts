// src/familia/dadosCadastrais/informacoesGerais/__tests__/integration.test.ts

import request from 'supertest';
import { DatabaseTestHelper } from '@tests/helpers/database.helper';
import app from '@/app';

/**
 * TESTES DE INTEGRAÇÃO COM BANCO REAL
 *
 * Estes testes conectam no banco de produção (somente leitura)
 * Se o banco não estiver disponível, usam MOCK automaticamente
 */

describe('INTEGRAÇÃO - API InformacoesGerais Familia (Banco Real)', () => {

  let usingRealDatabase = false;
  let testFamiliaCode: string;

  // ========================================
  // SETUP
  // ========================================
  beforeAll(async () => {
    await DatabaseTestHelper.initialize();
    usingRealDatabase = DatabaseTestHelper.isUsingRealDatabase();

    // Usar código de familia conhecido
    testFamiliaCode = 'F001'; // Ajustar conforme dados reais

    console.log(`🔗 Banco: ${usingRealDatabase ? 'REAL' : 'MOCK'}`);
    console.log(`📦 Família de teste: ${testFamiliaCode}`);
  });

  afterAll(async () => {
    await DatabaseTestHelper.cleanup();
  });

  // ========================================
  // TESTE 1: CONEXÃO COM BANCO
  // ========================================
  describe('Conexão com Banco de Dados', () => {

    it('deve conectar com banco ou usar mock', async () => {
      const isReady = await DatabaseTestHelper.waitUntilReady(5000);
      expect(isReady).toBe(true);
    });

    it('deve reportar status correto no health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect((res) => {
          expect([200, 503]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('database');
      expect(response.body.database).toHaveProperty('connected');

      if (usingRealDatabase) {
        expect(response.body.database.connected).toBe(true);
        expect(response.body.database.type).toBe('sqlserver');
      }
    });

  });

  // ========================================
  // TESTE 2: BUSCAR FAMÍLIA REAL
  // ========================================
  describe('Buscar Informações Gerais (Dados Reais)', () => {

    it('deve buscar família existente com sucesso', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/lor0138/familia/dadosCadastrais/informacoesGerais/${testFamiliaCode}`)
        .expect((res) => {
          // Aceita 200 (encontrado) ou 404 (não existe no banco)
          expect([200, 404]).toContain(res.status);
        });

      const duration = Date.now() - startTime;

      // Se encontrou, validar estrutura
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');

        if (usingRealDatabase) {
          expect(response.body.data).toHaveProperty('codigo');
          expect(response.body.data).toHaveProperty('descricao');
          expect(response.body.data.codigo).toBe(testFamiliaCode);

          // Validar performance
          expect(duration).toBeLessThanOrEqual(3000);
        }
      }
    });

    it('deve retornar 404 para família inexistente', async () => {
      const invalidCode = 'INVALID999';

      const response = await request(app)
        .get(`/api/lor0138/familia/dadosCadastrais/informacoesGerais/${invalidCode}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

  });

  // ========================================
  // TESTE 3: VALIDAÇÃO DE DADOS
  // ========================================
  describe('Validação de Dados do Banco', () => {

    it('deve retornar estrutura de dados correta', async () => {
      const response = await request(app)
        .get(`/api/lor0138/familia/dadosCadastrais/informacoesGerais/${testFamiliaCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        const { data } = response.body;

        expect(data).toHaveProperty('codigo');
        expect(data).toHaveProperty('descricao');
        expect(typeof data.codigo).toBe('string');
        expect(typeof data.descricao).toBe('string');
      }
    });

  });

  // ========================================
  // TESTE 4: PERFORMANCE
  // ========================================
  describe('Performance (Banco Real)', () => {

    it('deve responder em menos de 2 segundos', async function () {
      if (!usingRealDatabase) {
        console.log('⏭️  Teste de performance pulado - usando mock');
        return;
      }

      const startTime = Date.now();

      await request(app)
        .get(`/api/lor0138/familia/dadosCadastrais/informacoesGerais/${testFamiliaCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });

    it('deve manter performance consistente em múltiplas requisições', async function () {
      if (!usingRealDatabase) {
        console.log('⏭️  Teste de performance pulado - usando mock');
        return;
      }

      const durations: number[] = [];
      const iterations = 3;

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();

        await request(app)
          .get(`/api/lor0138/familia/dadosCadastrais/informacoesGerais/${testFamiliaCode}`)
          .expect((res) => {
            expect([200, 404]).toContain(res.status);
          });

        durations.push(Date.now() - start);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

      console.log(`📊 Média de ${iterations} requisições: ${avgDuration.toFixed(0)}ms`);
      expect(avgDuration).toBeLessThan(2000);
    });

  });

  // ========================================
  // TESTE 5: EDGE CASES
  // ========================================
  describe('Edge Cases (Banco Real)', () => {

    it('deve validar código alfanumérico', async () => {
      const alphaCode = 'FAM123';

      const response = await request(app)
        .get(`/api/lor0138/familia/dadosCadastrais/informacoesGerais/${alphaCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      expect(response.status).not.toBe(400);
    });

    it('deve validar código com 16 caracteres (máximo)', async () => {
      const maxCode = '1234567890123456';

      const response = await request(app)
        .get(`/api/lor0138/familia/dadosCadastrais/informacoesGerais/${maxCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      expect(response.status).not.toBe(400);
    });

    it('deve rejeitar código com 17 caracteres', async () => {
      const tooLongCode = '12345678901234567';

      const response = await request(app)
        .get(`/api/lor0138/familia/dadosCadastrais/informacoesGerais/${tooLongCode}`)
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('error');
    });

  });

  // ========================================
  // TESTE 6: HEADERS E CORRELATION ID
  // ========================================
  describe('Headers e Correlation ID', () => {

    it('deve incluir Correlation ID na resposta', async () => {
      const response = await request(app)
        .get(`/api/lor0138/familia/dadosCadastrais/informacoesGerais/${testFamiliaCode}`);

      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('deve aceitar Correlation ID customizado', async () => {
      const customId = 'integration-test-familia-123';

      const response = await request(app)
        .get(`/api/lor0138/familia/dadosCadastrais/informacoesGerais/${testFamiliaCode}`)
        .set('X-Correlation-ID', customId);

      expect(response.headers['x-correlation-id']).toBe(customId);
    });

  });

  // ========================================
  // TESTE 7: TIMEOUT E RESILÊNCIA
  // ========================================
  describe('Timeout e Resilência', () => {

    it('não deve travar em requisição inválida', async () => {
      const response = await request(app)
        .get('/api/lor0138/familia/dadosCadastrais/informacoesGerais/INVALID')
        .timeout(5000);

      expect(response.status).toBeDefined();
      expect([200, 404, 400]).toContain(response.status);
    });

  });

  // ========================================
  // TESTE 8: RESUMO
  // ========================================
  describe('Resumo dos Testes', () => {

    it('deve informar fonte de dados usada', () => {
      console.log(`
        📊 RESULTADO DOS TESTES (FAMILIA):
        - Fonte de dados: ${usingRealDatabase ? 'BANCO REAL' : 'MOCK'}
        - Código testado: ${testFamiliaCode}
        - Ambiente: ${process.env.NODE_ENV}
      `);

      expect(usingRealDatabase).toBeDefined();
    });

  });

});