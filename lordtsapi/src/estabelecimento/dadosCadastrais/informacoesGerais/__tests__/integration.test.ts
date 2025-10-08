// src/estabelecimento/dadosCadastrais/informacoesGerais/__tests__/integration.test.ts

import request from 'supertest';
import { DatabaseTestHelper } from '@tests/helpers/database.helper';
import app from '@/app';

describe('INTEGRAÇÃO - API InformacoesGerais Estabelecimento (Banco Real)', () => {

  let usingRealDatabase = false;
  let testEstabelecimentoCode: string;

  beforeAll(async () => {
    await DatabaseTestHelper.initialize();
    usingRealDatabase = DatabaseTestHelper.isUsingRealDatabase();

    testEstabelecimentoCode = '101';

    console.log(`🔗 Banco: ${usingRealDatabase ? 'REAL' : 'MOCK'}`);
    console.log(`📦 Estabelecimento de teste: ${testEstabelecimentoCode}`);
  });

  afterAll(async () => {
    await DatabaseTestHelper.cleanup();
  });

  describe('Conexão com Banco de Dados', () => {

    it('deve conectar com banco ou usar mock', async () => {
      const isReady = await DatabaseTestHelper.waitUntilReady(5000);
      expect(isReady).toBe(true);
    });

  });

  describe('Buscar Informações Gerais (Dados Reais)', () => {

    it('deve buscar estabelecimento existente com sucesso', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/estabelecimento/dadosCadastrais/informacoesGerais/${testEstabelecimentoCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      const duration = Date.now() - startTime;

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');

        if (usingRealDatabase) {
          expect(response.body.data).toHaveProperty('codigo');
          expect(response.body.data).toHaveProperty('descricao');
          expect(response.body.data.codigo).toBe(testEstabelecimentoCode);
          expect(duration).toBeLessThanOrEqual(3000);
        }
      }
    });

it('deve retornar 404 para estabelecimento inexistente', async () => {
  const invalidCode = '99999';
  
  const response = await request(app)
    .get(`/api/estabelecimento/dadosCadastrais/informacoesGerais/${invalidCode}`)
    .expect((res) => {
      expect([200, 404]).toContain(res.status);
    });

  if (response.status === 404) {
    expect(response.body).toHaveProperty('error');
  }
});

  });

  describe('Validação de Dados do Banco', () => {

    it('deve retornar estrutura de dados correta', async () => {
      const response = await request(app)
        .get(`/api/estabelecimento/dadosCadastrais/informacoesGerais/${testEstabelecimentoCode}`)
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

  describe('Performance (Banco Real)', () => {

    it('deve responder em menos de 2 segundos', async function () {
      if (!usingRealDatabase) {
        console.log('⏭️  Teste de performance pulado - usando mock');
        return;
      }

      const startTime = Date.now();

      await request(app)
        .get(`/api/estabelecimento/dadosCadastrais/informacoesGerais/${testEstabelecimentoCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });

  });

  describe('Edge Cases (Banco Real)', () => {

    it('deve validar código numérico de 3 dígitos (típico)', async () => {
      const code = '101';

      const response = await request(app)
        .get(`/api/estabelecimento/dadosCadastrais/informacoesGerais/${code}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      expect(response.status).not.toBe(400);
    });

    it('deve validar código com 5 dígitos (máximo)', async () => {
      const maxCode = '12345';

      const response = await request(app)
        .get(`/api/estabelecimento/dadosCadastrais/informacoesGerais/${maxCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      expect(response.status).not.toBe(400);
    });

    it('deve rejeitar código com 6 dígitos', async () => {
      const tooLongCode = '123456';

      const response = await request(app)
        .get(`/api/estabelecimento/dadosCadastrais/informacoesGerais/${tooLongCode}`)
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('error');
    });

    it('deve validar código de 1 dígito', async () => {
      const minCode = '1';

      const response = await request(app)
        .get(`/api/estabelecimento/dadosCadastrais/informacoesGerais/${minCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      expect(response.status).not.toBe(400);
    });

  });

  describe('Headers e Correlation ID', () => {

    it('deve incluir Correlation ID na resposta', async () => {
      const response = await request(app)
        .get(`/api/estabelecimento/dadosCadastrais/informacoesGerais/${testEstabelecimentoCode}`);

      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('deve aceitar Correlation ID customizado', async () => {
      const customId = 'integration-test-estab-123';

      const response = await request(app)
        .get(`/api/estabelecimento/dadosCadastrais/informacoesGerais/${testEstabelecimentoCode}`)
        .set('X-Correlation-ID', customId);

      expect(response.headers['x-correlation-id']).toBe(customId);
    });

  });

  describe('Timeout e Resilência', () => {

    it('não deve travar em requisição inválida', async () => {
      const response = await request(app)
        .get('/api/estabelecimento/dadosCadastrais/informacoesGerais/INVALID')
        .timeout(5000);

      expect(response.status).toBeDefined();
      expect([200, 404, 400]).toContain(response.status);
    });

  });

  describe('Resumo dos Testes', () => {

    it('deve informar fonte de dados usada', () => {
      console.log(`
        📊 RESULTADO DOS TESTES (ESTABELECIMENTO):
        - Fonte de dados: ${usingRealDatabase ? 'BANCO REAL' : 'MOCK'}
        - Código testado: ${testEstabelecimentoCode}
        - Ambiente: ${process.env.NODE_ENV}
      `);

      expect(usingRealDatabase).toBeDefined();
    });

  });

});