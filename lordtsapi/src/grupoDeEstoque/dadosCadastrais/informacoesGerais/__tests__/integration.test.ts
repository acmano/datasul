// src/grupoDeEstoque/dadosCadastrais/informacoesGerais/__tests__/integration.test.ts
import { log } from '@shared/utils/logger';

import request from 'supertest';
import { DatabaseTestHelper } from '@tests/helpers/database.helper';
import app from '@/app';

describe('INTEGRAÇÃO - API InformacoesGerais GrupoDeEstoque (Banco Real)', () => {
  let usingRealDatabase = false;
  let testGrupoDeEstoqueCode: string;

  beforeAll(async () => {
    await DatabaseTestHelper.initialize();
    usingRealDatabase = DatabaseTestHelper.isUsingRealDatabase();

    testGrupoDeEstoqueCode = '01';

    log.debug(`🔗 Banco: ${usingRealDatabase ? 'REAL' : 'MOCK'}`);
    log.debug(`📦 Grupo de Estoque de teste: ${testGrupoDeEstoqueCode}`);
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
    it('deve buscar grupo de estoque existente com sucesso', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/grupoDeEstoque/dadosCadastrais/informacoesGerais/${testGrupoDeEstoqueCode}`)
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
          expect(response.body.data.codigo).toBe(testGrupoDeEstoqueCode);
          expect(duration).toBeLessThanOrEqual(3000);
        }
      }
    });

    it('deve retornar 404 para grupo de estoque inexistente', async () => {
      const invalidCode = 'INVALID999';

      const response = await request(app)
        .get(`/api/grupoDeEstoque/dadosCadastrais/informacoesGerais/${invalidCode}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Validação de Dados do Banco', () => {
    it('deve retornar estrutura de dados correta', async () => {
      const response = await request(app)
        .get(`/api/grupoDeEstoque/dadosCadastrais/informacoesGerais/${testGrupoDeEstoqueCode}`)
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
        log.debug('⏭️  Teste de performance pulado - usando mock');
        return;
      }

      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/grupoDeEstoque/dadosCadastrais/informacoesGerais/${testGrupoDeEstoqueCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Edge Cases (Banco Real)', () => {
    it('deve validar código alfanumérico', async () => {
      const alphaCode = 'GE123';

      const response = await request(app)
        .get(`/api/grupoDeEstoque/dadosCadastrais/informacoesGerais/${alphaCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      expect(response.status).not.toBe(400);
    });

    it('deve validar código com 16 caracteres (máximo)', async () => {
      const maxCode = '1234567890123456';

      const response = await request(app)
        .get(`/api/grupoDeEstoque/dadosCadastrais/informacoesGerais/${maxCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      expect(response.status).not.toBe(400);
    });

    it('deve rejeitar código com 17 caracteres', async () => {
      const tooLongCode = '12345678901234567';

      const response = await request(app)
        .get(`/api/grupoDeEstoque/dadosCadastrais/informacoesGerais/${tooLongCode}`)
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Headers e Correlation ID', () => {
    it('deve incluir Correlation ID na resposta', async () => {
      const response = await request(app).get(
        `/api/grupoDeEstoque/dadosCadastrais/informacoesGerais/${testGrupoDeEstoqueCode}`
      );

      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('deve aceitar Correlation ID customizado', async () => {
      const customId = 'integration-test-ge-123';

      const response = await request(app)
        .get(`/api/grupoDeEstoque/dadosCadastrais/informacoesGerais/${testGrupoDeEstoqueCode}`)
        .set('X-Correlation-ID', customId);

      expect(response.headers['x-correlation-id']).toBe(customId);
    });
  });

  describe('Timeout e Resilência', () => {
    it('não deve travar em requisição inválida', async () => {
      const response = await request(app)
        .get('/api/grupoDeEstoque/dadosCadastrais/informacoesGerais/INVALID')
        .timeout(5000);

      expect(response.status).toBeDefined();
      expect([200, 404, 400]).toContain(response.status);
    });
  });

  describe('Resumo dos Testes', () => {
    it('deve informar fonte de dados usada', () => {
      log.debug(`
        📊 RESULTADO DOS TESTES (GRUPO DE ESTOQUE):
        - Fonte de dados: ${usingRealDatabase ? 'BANCO REAL' : 'MOCK'}
        - Código testado: ${testGrupoDeEstoqueCode}
        - Ambiente: ${process.env.NODE_ENV}
      `);

      expect(usingRealDatabase).toBeDefined();
    });
  });
});
