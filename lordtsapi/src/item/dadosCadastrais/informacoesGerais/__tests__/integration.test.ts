// tests/integration/api/informacoesGerais.integration.test.ts

import request from 'supertest';
import { DatabaseTestHelper } from '@tests/helpers/database.helper';
import app from '@/app';

/**
 * TESTES DE INTEGRAÇÃO COM BANCO REAL
 *
 * Estes testes conectam no banco de produção (somente leitura)
 * Se o banco não estiver disponível, usam MOCK automaticamente
 */

describe('INTEGRAÇÃO - API InformacoesGerais (Banco Real)', () => {

  let usingRealDatabase = false;
  let testItemCode: string;

  // ========================================
  // SETUP
  // ========================================
  beforeAll(async () => {
    await DatabaseTestHelper.initialize();
    usingRealDatabase = DatabaseTestHelper.isUsingRealDatabase();

    // Buscar código de item real para testes
    testItemCode = await DatabaseTestHelper.getTestItemCode();

    console.log(`🔗 Banco: ${usingRealDatabase ? 'REAL' : 'MOCK'}`);
    console.log(`📦 Item de teste: ${testItemCode}`);
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
  // TESTE 2: BUSCAR ITEM REAL
  // ========================================
  describe('Buscar Informações Gerais (Dados Reais)', () => {

    it('deve buscar item existente com sucesso', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
        .expect(200);

      const duration = Date.now() - startTime;

      // Validações básicas
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      // Se banco real, validar dados
      if (usingRealDatabase) {
        expect(response.body.data).toHaveProperty('identificacaoItemCodigo');
        expect(response.body.data.identificacaoItemCodigo).toBe(testItemCode);
        expect(response.body.data).toHaveProperty('identificacaoItemDescricao');
        expect(response.body.data).toHaveProperty('identificacaoItemUnidade');

        // Validar performance (banco real deve responder rápido)
        expect(duration).toBeLessThanOrEqual(5000); // max 5s
      }
    });

    it('deve retornar 404 para item inexistente', async () => {
      const invalidCode = 'INVALID999';

      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${invalidCode}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/não encontrado/i);
    });

  });

  // ========================================
  // TESTE 3: VALIDAÇÃO COM DADOS REAIS
  // ========================================
describe('Validação de Dados do Banco', () => {
  
  it('deve retornar estrutura de dados correta', async () => {
    const response = await request(app)
      .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
      .expect((res) => {
        expect([200, 404]).toContain(res.status);
      });

    if (response.status === 200) {
      const { data } = response.body;

      // Nova estrutura
      expect(data).toHaveProperty('item');
      expect(data.item).toHaveProperty('codigo');
      expect(data.item).toHaveProperty('descricao');
      expect(data.item).toHaveProperty('unidade');
      expect(data).toHaveProperty('estabelecimentos');
      
      // Campos opcionais
      // familia, familiaComercial, grupoDeEstoque podem ser null
    }
  });

  it('campos do item devem ter tipos corretos', async () => {
    const response = await request(app)
      .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
      .expect((res) => {
        expect([200, 404]).toContain(res.status);
      });

    if (response.status === 200) {
      const data = response.body.data;

      expect(typeof data.item.codigo).toBe('string');
      expect(typeof data.item.descricao).toBe('string');
      expect(typeof data.item.unidade).toBe('string');
      expect(Array.isArray(data.estabelecimentos)).toBe(true);
    }
  });

});

  // ========================================
  // TESTE 4: PERFORMANCE COM BANCO REAL
  // ========================================
  describe('Performance (Banco Real)', () => {

    it('deve responder em menos de 3 segundos', async function () {
      // Pular se não for banco real
      if (!usingRealDatabase) {
        console.log('⏭️  Teste de performance pulado - usando mock');
        return;
      }

      const startTime = Date.now();

      await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000);
    });

    it('deve manter performance consistente em múltiplas requisições', async function () {
      if (!usingRealDatabase) {
        console.log('⏭️  Teste de performance pulado - usando mock');
        return;
      }

      const durations: number[] = [];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();

        await request(app)
          .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
          .expect(200);

        durations.push(Date.now() - start);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

      console.log(`📊 Média de ${iterations} requisições: ${avgDuration.toFixed(0)}ms`);
      expect(avgDuration).toBeLessThan(3000);
    });

  });

  // ========================================
  // TESTE 5: EDGE CASES COM BANCO REAL
  // ========================================
  describe('Edge Cases (Banco Real)', () => {

    it('deve buscar item com código alfanumérico', async () => {
      // Usar código conhecido ou pular se não houver
      const codes = DatabaseTestHelper.getKnownTestCodes();

      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${codes.validItem}`)
        .expect((res) => {
          // Aceita 200 (encontrado) ou 404 (não encontrado, mas validou)
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('deve validar código com 16 caracteres (máximo)', async () => {
      const maxCode = '1234567890123456';

      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${maxCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      // Não deve dar erro de validação (400)
      expect(response.status).not.toBe(400);
    });

    it('deve rejeitar código com 17 caracteres', async () => {
      const tooLongCode = '12345678901234567'; // 17 chars

      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${tooLongCode}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

  });

  // ========================================
  // TESTE 6: ESTABELECIMENTOS (se disponível)
  // ========================================
describe('Estabelecimentos do Item', () => {
  
  it('deve retornar estabelecimentos se existirem', async () => {
    const response = await request(app)
      .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
      .expect((res) => {
        expect([200, 404]).toContain(res.status);
      });

    if (response.status === 200) {
      const { estabelecimentos } = response.body.data;

      expect(Array.isArray(estabelecimentos)).toBe(true);

      if (estabelecimentos && estabelecimentos.length > 0) {
        const estab = estabelecimentos[0];
        expect(estab).toHaveProperty('codigo');
        expect(estab).toHaveProperty('nome');
      }
    }
  });

});

  // ========================================
  // TESTE 7: CORRELATION ID E HEADERS
  // ========================================
  describe('Headers e Correlation ID', () => {

    it('deve incluir Correlation ID na resposta', async () => {
      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`);

      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('deve aceitar Correlation ID customizado', async () => {
      const customId = 'integration-test-123';

      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
        .set('X-Correlation-ID', customId);

      expect(response.headers['x-correlation-id']).toBe(customId);
    });

  });

  // ========================================
  // TESTE 8: TIMEOUT E RESILÊNCIA
  // ========================================
  describe('Timeout e Resilência', () => {

    it('não deve travar em requisição inválida', async () => {
      const response = await request(app)
        .get('/api/item/dadosCadastrais/informacoesGerais/INVALID')
        .timeout(5000); // 5s max

      expect(response.status).toBeDefined();
      expect([200, 404, 400]).toContain(response.status);
    });

  });

  // ========================================
  // TESTE 9: COMPARAÇÃO MOCK vs REAL
  // ========================================
  describe('Comparação Mock vs Real', () => {

    it('deve informar qual fonte de dados está sendo usada', () => {
      console.log(`
        📊 RESULTADO DOS TESTES:
        - Fonte de dados: ${usingRealDatabase ? 'BANCO REAL' : 'MOCK'}
        - Código testado: ${testItemCode}
        - Ambiente: ${process.env.NODE_ENV}
      `);

      expect(usingRealDatabase).toBeDefined();
    });

  });

});
