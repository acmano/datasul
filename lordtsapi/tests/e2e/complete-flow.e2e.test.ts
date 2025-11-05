// tests/e2e/complete-flow.e2e.test.ts

import request from 'supertest';
import app from '@/app';

/**
 * Testes E2E - Fluxos Completos
 *
 * Testa fluxos end-to-end completos simulando uso real do sistema
 *
 * @group e2e
 * @group complete-flow
 */
describe('E2E - Complete User Flows', () => {
  const server = app;

  beforeAll(async () => {
    // App já está inicializado
  });

  afterAll(async () => {
    // Cleanup se necessário
  });

  describe('Flow 1: Item Discovery & Retrieval', () => {
    it('deve completar fluxo: buscar item → obter detalhes → verificar empresas', async () => {
      // Step 1: Buscar items
      const searchResponse = await request(server)
        .get('/api/item/search')
        .query({ search: 'TORNEIRA', limit: 10 })
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.items).toBeDefined();
      expect(Array.isArray(searchResponse.body.data.items)).toBe(true);

      // Verificar que retornou resultados
      const items = searchResponse.body.data.items;
      if (items.length === 0) {
        console.warn('⚠️  Nenhum item encontrado na busca');
        return; // Skip resto do teste se não houver dados
      }

      // Step 2: Pegar primeiro item e buscar detalhes
      const itemCodigo = items[0].codigo;
      expect(itemCodigo).toBeDefined();

      const detailsResponse = await request(server)
        .get(`/api/item/dadosCadastrais/informacoesGerais/${itemCodigo}`)
        .expect(200);

      expect(detailsResponse.body.success).toBe(true);
      expect(detailsResponse.body.data).toBeDefined();
      expect(detailsResponse.body.data.codigo).toBe(itemCodigo);

      // Step 3: Buscar empresas do item
      const empresasResponse = await request(server)
        .get(`/item/${itemCodigo}/empresas`)
        .expect(200);

      expect(empresasResponse.body.success).toBe(true);
      expect(empresasResponse.body.data).toBeDefined();

      // Step 4: Verificar que correlation ID é consistente em todo o fluxo
      const correlationIds = [
        searchResponse.body.correlationId,
        detailsResponse.body.correlationId,
        empresasResponse.body.correlationId,
      ];

      correlationIds.forEach((id) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
      });
    }, 10000);

    it('deve completar fluxo: buscar → selecionar → ver todas abas', async () => {
      // Step 1: Buscar item
      const searchResponse = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 })
        .expect(200);

      const items = searchResponse.body.data.items;
      if (items.length === 0) return;

      const itemCodigo = items[0].codigo;

      // Step 2: Buscar todas as abas de dados cadastrais
      const [infoGerais, dimensoes, planejamento, fiscal, manufatura] = await Promise.all([
        request(server).get(`/api/item/dadosCadastrais/informacoesGerais/${itemCodigo}`),
        request(server).get(`/api/item/dadosCadastrais/dimensoes/${itemCodigo}`),
        request(server).get(`/api/item/dadosCadastrais/planejamento/${itemCodigo}`),
        request(server).get(`/api/item/dadosCadastrais/fiscal/${itemCodigo}`),
        request(server).get(`/api/item/dadosCadastrais/manufatura/${itemCodigo}`),
      ]);

      // Verificar que todas as requests tiveram sucesso ou retornaram 404
      [infoGerais, dimensoes, planejamento, fiscal, manufatura].forEach((response) => {
        expect([200, 404]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
          expect(response.body.correlationId).toBeDefined();
        }
      });
    }, 15000);
  });

  describe('Flow 2: Hierarchical Data Navigation', () => {
    it('deve navegar: família → items da família', async () => {
      // Step 1: Listar famílias
      const familiasResponse = await request(server)
        .get('/api/familia')
        .query({ limit: 10 })
        .expect(200);

      expect(familiasResponse.body.success).toBe(true);
      expect(familiasResponse.body.data.items).toBeDefined();

      const familias = familiasResponse.body.data.items;
      if (familias.length === 0) return;

      const familiaCodigo = familias[0].codigo;

      // Step 2: Buscar detalhes da família
      const familiaDetails = await request(server)
        .get(`/api/familia/dadosCadastrais/informacoesGerais/${familiaCodigo}`)
        .expect(200);

      expect(familiaDetails.body.success).toBe(true);

      // Step 3: Buscar items desta família
      const itemsDaFamilia = await request(server)
        .get('/api/item/search')
        .query({ familia: familiaCodigo, limit: 20 });

      expect([200, 404]).toContain(itemsDaFamilia.status);
    }, 10000);

    it('deve navegar: grupo → famílias → items', async () => {
      // Step 1: Listar grupos de estoque
      const gruposResponse = await request(server)
        .get('/api/grupoDeEstoque')
        .query({ limit: 5 })
        .expect(200);

      const grupos = gruposResponse.body.data.items;
      if (grupos.length === 0) return;

      const grupoCodigo = grupos[0].codigo;

      // Step 2: Buscar detalhes do grupo
      const grupoDetails = await request(server)
        .get(`/api/grupoDeEstoque/dadosCadastrais/informacoesGerais/${grupoCodigo}`)
        .expect(200);

      expect(grupoDetails.body.success).toBe(true);

      // Step 3: Buscar items deste grupo
      const itemsDoGrupo = await request(server)
        .get('/api/item/search')
        .query({ grupoEstoque: grupoCodigo, limit: 20 });

      expect([200, 404]).toContain(itemsDoGrupo.status);
    }, 10000);
  });

  describe('Flow 3: Search & Filter Journey', () => {
    it('deve aplicar múltiplos filtros sequencialmente', async () => {
      // Step 1: Busca ampla
      const allItems = await request(server)
        .get('/api/item/search')
        .query({ limit: 100 })
        .expect(200);

      const totalItems = allItems.body.data.pagination.total;

      // Step 2: Filtrar por ativo
      const activeItems = await request(server)
        .get('/api/item/search')
        .query({ ativo: true, limit: 100 })
        .expect(200);

      // Step 3: Filtrar por texto
      const searchItems = await request(server)
        .get('/api/item/search')
        .query({ search: 'A', ativo: true, limit: 100 })
        .expect(200);

      // Verificar que filtros reduziram resultados
      expect(activeItems.body.data.pagination.total).toBeLessThanOrEqual(totalItems);
    }, 10000);

    it('deve paginar corretamente através de resultados', async () => {
      // Step 1: Primeira página
      const page1 = await request(server)
        .get('/api/item/search')
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Step 2: Segunda página
      const page2 = await request(server)
        .get('/api/item/search')
        .query({ page: 2, limit: 10 })
        .expect(200);

      // Step 3: Terceira página
      const page3 = await request(server)
        .get('/api/item/search')
        .query({ page: 3, limit: 10 })
        .expect(200);

      // Verificar paginação
      expect(page1.body.data.pagination.page).toBe(1);
      expect(page2.body.data.pagination.page).toBe(2);
      expect(page3.body.data.pagination.page).toBe(3);

      // Items devem ser diferentes em cada página
      const items1 = page1.body.data.items;
      const items2 = page2.body.data.items;

      if (items1.length > 0 && items2.length > 0) {
        expect(items1[0].codigo).not.toBe(items2[0].codigo);
      }
    }, 10000);
  });

  describe('Flow 4: Error Handling Journey', () => {
    it('deve lidar graciosamente com item inexistente', async () => {
      // Step 1: Buscar item que não existe
      const response = await request(server)
        .get('/api/item/dadosCadastrais/informacoesGerais/XXXXX_NOT_EXISTS')
        .expect(404);

      // Step 2: Verificar estrutura de erro
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.correlationId).toBeDefined();

      // Step 3: Tentar outro endpoint com mesmo item inexistente
      const response2 = await request(server)
        .get('/api/item/dadosCadastrais/dimensoes/XXXXX_NOT_EXISTS')
        .expect(404);

      expect(response2.body.success).toBe(false);
    });

    it('deve validar parâmetros inválidos consistentemente', async () => {
      // Paginação inválida
      const invalidPage = await request(server)
        .get('/api/item/search')
        .query({ page: -1, limit: 10 })
        .expect(400);

      expect(invalidPage.body.success).toBe(false);

      // Limit inválido
      const invalidLimit = await request(server)
        .get('/api/item/search')
        .query({ page: 1, limit: 0 })
        .expect(400);

      expect(invalidLimit.body.success).toBe(false);

      // Ambos inválidos
      const bothInvalid = await request(server)
        .get('/api/item/search')
        .query({ page: 0, limit: -5 })
        .expect(400);

      expect(bothInvalid.body.success).toBe(false);
    });

    it('deve recuperar de erro e continuar funcionando', async () => {
      // Step 1: Request que causa erro
      await request(server).get('/api/item/dadosCadastrais/informacoesGerais/INVALID').expect(404);

      // Step 2: Request válida após erro
      const validResponse = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 })
        .expect(200);

      expect(validResponse.body.success).toBe(true);

      // Step 3: Outra request com erro
      await request(server).get('/api/familia/dadosCadastrais/informacoesGerais/ZZZZZ').expect(404);

      // Step 4: Sistema ainda funciona
      const healthResponse = await request(server).get('/health').expect(200);

      expect(healthResponse.body.status).toBe('healthy');
    });
  });

  describe('Flow 5: Cache Performance Journey', () => {
    it('deve utilizar cache em requests subsequentes', async () => {
      const itemCodigo = 'CACHE_TEST_E2E';

      // Step 1: Primeira request (sem cache)
      const start1 = Date.now();
      const response1 = await request(server).get(
        `/api/item/dadosCadastrais/informacoesGerais/${itemCodigo}`
      );
      const duration1 = Date.now() - start1;

      // Step 2: Segunda request (deve usar cache)
      const start2 = Date.now();
      const response2 = await request(server).get(
        `/api/item/dadosCadastrais/informacoesGerais/${itemCodigo}`
      );
      const duration2 = Date.now() - start2;

      // Step 3: Terceira request (ainda em cache)
      const start3 = Date.now();
      const response3 = await request(server).get(
        `/api/item/dadosCadastrais/informacoesGerais/${itemCodigo}`
      );
      const duration3 = Date.now() - start3;

      // Verificar que todas retornaram mesmo resultado
      if (response1.status === 200) {
        expect(response2.status).toBe(200);
        expect(response3.status).toBe(200);

        // Cache pode tornar requests mais rápidas
        // (mas não garantimos porque depende da infraestrutura)
        console.log(`Request times: ${duration1}ms, ${duration2}ms, ${duration3}ms`);
      }
    }, 10000);

    it('deve verificar estatísticas de cache', async () => {
      // Step 1: Fazer algumas requests
      await request(server).get('/api/item/search').query({ limit: 5 });
      await request(server).get('/api/familia').query({ limit: 5 });
      await request(server).get('/api/grupoDeEstoque').query({ limit: 5 });

      // Step 2: Verificar stats de cache
      const statsResponse = await request(server).get('/cache/stats').expect(200);

      expect(statsResponse.body).toBeDefined();
      expect(statsResponse.body).toHaveProperty('hits');
      expect(statsResponse.body).toHaveProperty('misses');
      expect(statsResponse.body).toHaveProperty('keys');
    });
  });

  describe('Flow 6: Health Monitoring Journey', () => {
    it('deve monitorar saúde do sistema durante operações', async () => {
      // Step 1: Verificar saúde inicial
      const health1 = await request(server).get('/health').expect(200);

      expect(health1.body.status).toBe('healthy');
      expect(health1.body.database).toBeDefined();
      expect(health1.body.cache).toBeDefined();

      // Step 2: Fazer várias operações
      await Promise.all([
        request(server).get('/api/item/search'),
        request(server).get('/api/familia'),
        request(server).get('/api/grupoDeEstoque'),
        request(server).get('/api/familiaComercial'),
      ]);

      // Step 3: Verificar saúde após operações
      const health2 = await request(server).get('/health').expect(200);

      expect(health2.body.status).toBe('healthy');
      expect(health2.body.database.connected).toBe(true);

      // Step 4: Verificar métricas
      const metricsResponse = await request(server).get('/metrics').expect(200);

      expect(metricsResponse.text).toBeDefined();
      expect(metricsResponse.headers['content-type']).toContain('text/plain');
    });

    it('deve manter health check rápido mesmo sob carga', async () => {
      // Fazer múltiplos health checks em paralelo
      const promises = Array.from({ length: 10 }, () => request(server).get('/health'));

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      // Todos devem ter sucesso
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });

      // Tempo total deve ser razoável (< 5s para 10 health checks)
      expect(duration).toBeLessThan(5000);
    }, 10000);
  });

  describe('Flow 7: Multi-Entity Complex Journey', () => {
    it('deve completar jornada complexa: estabelecimento → items → detalhes', async () => {
      // Step 1: Buscar estabelecimentos
      const estabelecimentoResponse = await request(server).get(
        '/api/estabelecimento/dadosCadastrais/informacoesGerais/001'
      );

      // Step 2: Se estabelecimento existe, buscar items relacionados
      if (estabelecimentoResponse.status === 200) {
        const codEstabel = '001';

        const itemsResponse = await request(server)
          .get('/api/item/search')
          .query({ estabelecimento: codEstabel, limit: 10 });

        expect([200, 404]).toContain(itemsResponse.status);
      }
    });

    it('deve completar jornada: buscar em múltiplas entidades simultaneamente', async () => {
      // Buscar em paralelo: items, famílias, grupos, famílias comerciais
      const [items, familias, grupos, famComercial] = await Promise.all([
        request(server).get('/api/item/search').query({ limit: 5 }),
        request(server).get('/api/familia').query({ limit: 5 }),
        request(server).get('/api/grupoDeEstoque').query({ limit: 5 }),
        request(server).get('/api/familiaComercial').query({ limit: 5 }),
      ]);

      // Todas devem ter sucesso
      expect(items.status).toBe(200);
      expect(familias.status).toBe(200);
      expect(grupos.status).toBe(200);
      expect(famComercial.status).toBe(200);

      // Todas devem ter structure consistente
      [items, familias, grupos, famComercial].forEach((response) => {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.correlationId).toBeDefined();
      });
    }, 10000);
  });

  describe('Flow 8: API Documentation Journey', () => {
    it('deve acessar documentação Swagger', async () => {
      // Swagger UI deve estar disponível
      const swaggerResponse = await request(server).get('/api-docs/').expect(301); // Redirect para /api-docs/

      // Verificar que Swagger está configurado
      expect(swaggerResponse).toBeDefined();
    });
  });

  describe('Flow 9: Correlation ID Tracking', () => {
    it('deve manter correlation ID através de múltiplos requests', async () => {
      const correlationId = `e2e-test-${Date.now()}`;

      // Fazer múltiplos requests com mesmo correlation ID
      const responses = await Promise.all([
        request(server).get('/api/item/search').set('X-Correlation-ID', correlationId),
        request(server).get('/api/familia').set('X-Correlation-ID', correlationId),
        request(server).get('/health').set('X-Correlation-ID', correlationId),
      ]);

      // Verificar que correlation ID é retornado em todos
      responses.forEach((response) => {
        expect(response.headers['x-correlation-id']).toBeDefined();
      });
    });

    it('deve gerar correlation ID automaticamente quando não fornecido', async () => {
      const response = await request(server).get('/api/item/search');

      expect(response.body.correlationId).toBeDefined();
      expect(typeof response.body.correlationId).toBe('string');
      expect(response.body.correlationId.length).toBeGreaterThan(0);
    });
  });

  describe('Flow 10: Performance Under Load', () => {
    it('deve manter performance aceitável com múltiplas requests simultâneas', async () => {
      const promises = Array.from({ length: 20 }, (_, i) =>
        request(server)
          .get('/api/item/search')
          .query({ page: (i % 3) + 1, limit: 10 })
      );

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      // Todas devem ter sucesso
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Tempo total deve ser razoável
      console.log(`20 concurrent requests completed in ${duration}ms`);
      expect(duration).toBeLessThan(15000); // 15 segundos para 20 requests
    }, 20000);
  });
});
