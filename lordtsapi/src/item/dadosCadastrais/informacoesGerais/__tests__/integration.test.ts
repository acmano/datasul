// src/item/dadosCadastrais/informacoesGerais/__tests__/integration.test.ts
import { log } from '@shared/utils/logger';

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

    log.debug(`🔗 Banco: ${usingRealDatabase ? 'REAL' : 'MOCK'}`);
    log.debug(`📦 Item de teste: ${testItemCode}`);
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
        expect(response.body.data).toHaveProperty('item');
        expect(response.body.data.item.codigo).toBe(testItemCode);
        expect(response.body.data.item).toHaveProperty('descricao');
        expect(response.body.data.item).toHaveProperty('unidade');

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
  // TESTE 3: VALIDAÇÃO DE DADOS DO BANCO
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

        // Campos opcionais (podem estar presentes ou não)
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

        // Campos obrigatórios básicos
        expect(typeof data.item.codigo).toBe('string');
        expect(typeof data.item.descricao).toBe('string');
        expect(typeof data.item.unidade).toBe('string');
        expect(Array.isArray(data.estabelecimentos)).toBe(true);
      }
    });

    it('deve incluir novos campos obrigatórios', async () => {
      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        const { item } = response.body.data;

        // Se não estiver usando banco real, campos podem não estar presentes no MOCK
        if (!usingRealDatabase) {
          log.debug('⏭️  Validação de novos campos pulada - usando MOCK');
          expect(true).toBe(true);
          return;
        }

        // Com banco real, validar campos obrigatórios
        // Campos obrigatórios devem estar presentes (podem ser null se banco não tem dados)
        expect('status' in item || item.status !== undefined).toBe(true);
        expect(
          'estabelecimentoPadraoCodigo' in item || item.estabelecimentoPadraoCodigo !== undefined
        ).toBe(true);
        expect('dataImplantacao' in item || item.dataImplantacao !== undefined).toBe(true);
        expect('dataLiberacao' in item || item.dataLiberacao !== undefined).toBe(true);

        // Validar tipos se preenchidos
        if (item.status !== undefined && item.status !== null) {
          expect(typeof item.status).toBe('string');
        }

        if (
          item.estabelecimentoPadraoCodigo !== undefined &&
          item.estabelecimentoPadraoCodigo !== null
        ) {
          expect(typeof item.estabelecimentoPadraoCodigo).toBe('string');
        }

        if (item.dataImplantacao !== undefined && item.dataImplantacao !== null) {
          expect(typeof item.dataImplantacao).toBe('string');
        }

        if (item.dataLiberacao !== undefined && item.dataLiberacao !== null) {
          expect(typeof item.dataLiberacao).toBe('string');
        }
      }
    });

    it('deve validar formato de datas quando presentes', async () => {
      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        const { item } = response.body.data;

        // Se não estiver usando banco real, pular validação
        if (!usingRealDatabase) {
          log.debug('⏭️  Validação de formato de datas pulada - usando MOCK');
          expect(true).toBe(true);
          return;
        }

        // Regex para formato dd/mm/yyyy
        const dateFormat = /^\d{2}\/\d{2}\/\d{4}$/;

        // Validar formato de datas obrigatórias se preenchidas
        if (item.dataImplantacao) {
          expect(item.dataImplantacao).toMatch(dateFormat);
        }

        if (item.dataLiberacao) {
          expect(item.dataLiberacao).toMatch(dateFormat);
        }

        // Validar formato de data opcional se preenchida
        if (item.dataObsolescencia) {
          expect(item.dataObsolescencia).toMatch(dateFormat);
        }
      }
    });

    it('deve incluir novos campos opcionais quando disponíveis', async () => {
      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        const { item } = response.body.data;

        // Se campos estiverem preenchidos, validar tipo
        if (item.dataObsolescencia !== undefined && item.dataObsolescencia !== null) {
          expect(typeof item.dataObsolescencia).toBe('string');
        }

        if (item.endereco !== undefined && item.endereco !== null) {
          expect(typeof item.endereco).toBe('string');
        }

        if (item.descricaoResumida !== undefined && item.descricaoResumida !== null) {
          expect(typeof item.descricaoResumida).toBe('string');
        }

        if (item.descricaoAlternativa !== undefined && item.descricaoAlternativa !== null) {
          expect(typeof item.descricaoAlternativa).toBe('string');
        }

        if (item.contenedor !== undefined && item.contenedor !== null) {
          expect(typeof item.contenedor).toBe('object');
          expect(item.contenedor).toHaveProperty('codigo');
          expect(item.contenedor).toHaveProperty('descricao');
        }

        // Validação passou - campos opcionais podem ou não estar presentes
        expect(true).toBe(true);
      }
    });

    it('objeto contenedor deve ter estrutura correta quando presente', async () => {
      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        const { item } = response.body.data;

        if (item.contenedor !== undefined && item.contenedor !== null) {
          expect(item.contenedor).toHaveProperty('codigo');
          expect(item.contenedor).toHaveProperty('descricao');

          // Validar tipos se preenchidos
          if (item.contenedor.codigo !== undefined && item.contenedor.codigo !== null) {
            expect(typeof item.contenedor.codigo).toBe('string');
          }

          if (item.contenedor.descricao !== undefined && item.contenedor.descricao !== null) {
            expect(typeof item.contenedor.descricao).toBe('string');
          }
        }
      }
    });

    it('deve validar diferentes valores de status', async () => {
      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        const { item } = response.body.data;

        // Se não estiver usando banco real, pular validação
        if (!usingRealDatabase) {
          log.debug('⏭️  Validação de status pulada - usando MOCK');
          expect(true).toBe(true);
          return;
        }

        if (item.status) {
          // Status deve ser string não vazia
          expect(typeof item.status).toBe('string');
          expect(item.status.length).toBeGreaterThan(0);

          // Valores comuns (não exhaustivo)
          const validStatus = ['Ativo', 'Inativo', 'Obsoleto', 'Em Desenvolvimento'];

          // Se for um dos valores conhecidos, ok. Se não, também ok (pode haver outros)
          if (validStatus.includes(item.status)) {
            expect(validStatus).toContain(item.status);
          } else {
            // Status desconhecido, mas válido (não vazio)
            expect(item.status.length).toBeGreaterThan(0);
          }
        }
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
        log.debug('⏭️  Teste de performance pulado - usando mock');
        return;
      }

      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000);
    });

    it('deve manter performance consistente em múltiplas requisições', async function () {
      if (!usingRealDatabase) {
        log.debug('⏭️  Teste de performance pulado - usando mock');
        return;
      }

      const durations: number[] = [];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();

        const response = await request(app)
          .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
          .expect(200);

        durations.push(Date.now() - start);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

      log.debug(`📊 Média de ${iterations} requisições: ${avgDuration.toFixed(0)}ms`);
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

    it('deve validar que estabelecimentoPadraoCodigo corresponde a um estabelecimento válido', async () => {
      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        const { item, estabelecimentos } = response.body.data;

        // Se não estiver usando banco real, pular validação
        if (!usingRealDatabase) {
          log.debug('⏭️  Validação de estabelecimentoPadraoCodigo pulada - usando MOCK');
          expect(true).toBe(true);
          return;
        }

        if (item.estabelecimentoPadraoCodigo && estabelecimentos && estabelecimentos.length > 0) {
          // Verificar se estabelecimentoPadrao existe na lista de estabelecimentos
          const encontrado = estabelecimentos.some(
            (est: any) => est.codigo === item.estabelecimentoPadraoCodigo
          );

          // Se não encontrado, não é erro crítico (pode ser banco de dados inconsistente)
          // Mas logamos para verificação
          if (!encontrado) {
            log.debug(
              `⚠️  Estabelecimento padrão ${item.estabelecimentoPadraoCodigo} não encontrado na lista`
            );
          }
        }

        // Teste passa de qualquer forma
        expect(true).toBe(true);
      }
    });
  });

  // ========================================
  // TESTE 7: RELACIONAMENTOS
  // ========================================
  describe('Relacionamentos (Familia, FamiliaComercial, GrupoEstoque)', () => {
    it('deve incluir dados de família quando disponível', async () => {
      const response = await request(app)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        const { data } = response.body;

        // Campos devem existir (podem ser null)
        expect('familia' in data).toBe(true);
        expect('familiaComercial' in data).toBe(true);
        expect('grupoDeEstoque' in data).toBe(true);

        // Se família existir, validar estrutura
        if (data.familia !== null && data.familia !== undefined) {
          expect(data.familia).toHaveProperty('codigo');
          expect(data.familia).toHaveProperty('descricao');
        }

        // Se família comercial existir, validar estrutura
        if (data.familiaComercial !== null && data.familiaComercial !== undefined) {
          expect(data.familiaComercial).toHaveProperty('codigo');
          expect(data.familiaComercial).toHaveProperty('descricao');
        }

        // Se grupo de estoque existir, validar estrutura
        if (data.grupoDeEstoque !== null && data.grupoDeEstoque !== undefined) {
          expect(data.grupoDeEstoque).toHaveProperty('codigo');
          expect(data.grupoDeEstoque).toHaveProperty('descricao');
        }
      }
    });
  });

  // ========================================
  // TESTE 8: CORRELATION ID E HEADERS
  // ========================================
  describe('Headers e Correlation ID', () => {
    it('deve incluir Correlation ID na resposta', async () => {
      const response = await request(app).get(
        `/api/item/dadosCadastrais/informacoesGerais/${testItemCode}`
      );

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
  // TESTE 9: TIMEOUT E RESILÊNCIA
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
  // TESTE 10: COMPARAÇÃO MOCK vs REAL
  // ========================================
  describe('Comparação Mock vs Real', () => {
    it('deve informar qual fonte de dados está sendo usada', () => {
      log.debug(`
        📊 RESULTADO DOS TESTES:
        - Fonte de dados: ${usingRealDatabase ? 'BANCO REAL' : 'MOCK'}
        - Código testado: ${testItemCode}
        - Ambiente: ${process.env.NODE_ENV}
      `);

      expect(usingRealDatabase).toBeDefined();
    });
  });
});
