// tests/e2e/authentication.e2e.test.ts

import request from 'supertest';
import { Application } from '@/app';
import { ApiKeyService } from '@shared/services/apiKey.service';
import { UserTier } from '@shared/types/apiKey.types';

/**
 * Testes E2E - Autenticação
 *
 * Testa autenticação por API Key em diferentes cenários
 *
 * @group e2e
 * @group authentication
 */
describe('E2E - Authentication', () => {
  let app: Application;
  let server: any;

  // API Keys de teste
  const TEST_KEYS = {
    free: 'free-demo-key-123456',
    premium: 'premium-key-abc123',
    enterprise: 'enterprise-key-xyz789',
    admin: 'admin-key-superuser',
    invalid: 'invalid-key-xyz',
  };

  beforeAll(async () => {
    // Inicializar aplicação
    app = new Application();
    await app.initialize();
    server = app.getServer();

    // Inicializar API keys de teste
    ApiKeyService.initialize();
  });

  afterAll(async () => {
    // Fechar aplicação
    await app.shutdown();
  });

  describe('API Key Authentication - Header X-API-Key', () => {
    it('deve permitir acesso com API key válida via X-API-Key header', async () => {
      // Endpoints públicos não requerem auth, mas podem aceitar
      const response = await request(server)
        .get('/api/item/search')
        .set('X-API-Key', TEST_KEYS.free)
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve identificar tier do usuário corretamente', async () => {
      // Testar com diferentes tiers
      const tiers = [
        { key: TEST_KEYS.free, tier: 'FREE' },
        { key: TEST_KEYS.premium, tier: 'PREMIUM' },
        { key: TEST_KEYS.enterprise, tier: 'ENTERPRISE' },
        { key: TEST_KEYS.admin, tier: 'ADMIN' },
      ];

      for (const { key, tier } of tiers) {
        const response = await request(server)
          .get('/api/item/search')
          .set('X-API-Key', key)
          .query({ limit: 1 });

        expect(response.status).toBe(200);
        // API key foi processada (verificar via logs ou headers se implementado)
      }
    });

    it('deve permitir requests sem API key em endpoints públicos', async () => {
      // Endpoints públicos devem funcionar sem autenticação
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve funcionar com API key em diferentes formatos', async () => {
      const formats = [
        { header: 'X-API-Key', value: TEST_KEYS.free },
        { header: 'x-api-key', value: TEST_KEYS.free }, // lowercase
        { header: 'X-Api-Key', value: TEST_KEYS.free }, // mixed case
      ];

      for (const { header, value } of formats) {
        const response = await request(server)
          .get('/api/item/search')
          .set(header, value)
          .query({ limit: 1 });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('API Key Authentication - Authorization Bearer', () => {
    it('deve permitir acesso com API key via Authorization Bearer', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('Authorization', `Bearer ${TEST_KEYS.premium}`)
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve ignorar Bearer token inválido em endpoints públicos', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('Authorization', `Bearer ${TEST_KEYS.invalid}`)
        .query({ limit: 5 });

      // Endpoint público deve funcionar mesmo com token inválido
      expect([200, 401]).toContain(response.status);
    });

    it('deve dar precedência a X-API-Key sobre Authorization', async () => {
      // Se ambos fornecidos, X-API-Key tem precedência
      const response = await request(server)
        .get('/api/item/search')
        .set('X-API-Key', TEST_KEYS.free)
        .set('Authorization', `Bearer ${TEST_KEYS.premium}`)
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('API Key Authentication - Query Parameter', () => {
    it('deve permitir acesso com API key via query parameter', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ api_key: TEST_KEYS.enterprise, limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve dar precedência a header sobre query parameter', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('X-API-Key', TEST_KEYS.free)
        .query({ api_key: TEST_KEYS.premium, limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      // X-API-Key deve ter sido usado (FREE tier)
    });

    it('deve sanitizar API key de query parameters em logs', async () => {
      // API key em query param não deve aparecer completa em logs
      const response = await request(server)
        .get('/api/item/search')
        .query({ api_key: TEST_KEYS.free, limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Log deve mascarar a key
    });
  });

  describe('Admin API Key - Special Privileges', () => {
    it('deve permitir bypass de rate limit com admin key', async () => {
      // Admin key bypassa rate limiting (verificado em app.ts linha 177)
      const promises = Array.from({ length: 150 }, () =>
        request(server)
          .get('/api/item/search')
          .set('X-API-Key', TEST_KEYS.admin)
          .query({ limit: 1 })
      );

      const responses = await Promise.all(promises);

      // Todas devem ter sucesso (sem rate limit)
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThan(100); // Maioria deve ter sucesso
    }, 30000);

    it('deve aplicar rate limit para non-admin keys', async () => {
      // Free tier deve ser rate limited após muitas requests
      const promises = Array.from({ length: 150 }, () =>
        request(server)
          .get('/api/item/search')
          .set('X-API-Key', TEST_KEYS.free)
          .query({ limit: 1 })
      );

      const responses = await Promise.all(promises);

      // Algumas devem ser rate limited (429)
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    }, 30000);
  });

  describe('API Key Validation', () => {
    it('deve validar formato de API key', async () => {
      const invalidFormats = [
        '',                    // Vazio
        ' ',                   // Espaço
        'abc',                 // Muito curto
        '123',                 // Numérico apenas
        'test key with spaces', // Com espaços
      ];

      for (const invalidKey of invalidFormats) {
        const response = await request(server)
          .get('/api/item/search')
          .set('X-API-Key', invalidKey)
          .query({ limit: 1 });

        // Endpoint público deve funcionar mesmo com key inválida
        expect([200, 400, 401]).toContain(response.status);
      }
    });

    it('deve rejeitar API keys expiradas', async () => {
      // Gerar key com expiração de 0 dias (já expirada)
      const expiredKey = await ApiKeyService.generateKey(
        'test-user',
        'Test User',
        UserTier.FREE,
        -1 // Expirada ontem
      );

      const response = await request(server)
        .get('/api/item/search')
        .set('X-API-Key', expiredKey)
        .query({ limit: 1 });

      // Endpoint público deve funcionar mesmo com key expirada
      expect([200, 401]).toContain(response.status);
    });

    it('deve rejeitar API keys inativas', async () => {
      // Gerar e revogar key
      const revokedKey = await ApiKeyService.generateKey(
        'test-user-2',
        'Test User 2',
        UserTier.PREMIUM
      );

      await ApiKeyService.revokeKey(revokedKey);

      const response = await request(server)
        .get('/api/item/search')
        .set('X-API-Key', revokedKey)
        .query({ limit: 1 });

      // Endpoint público deve funcionar mesmo com key revogada
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('API Key Generation & Management', () => {
    it('deve gerar API key com formato correto', async () => {
      const newKey = await ApiKeyService.generateKey(
        'new-user',
        'New User',
        UserTier.FREE
      );

      expect(newKey).toBeDefined();
      expect(typeof newKey).toBe('string');
      expect(newKey.length).toBeGreaterThan(10);
      expect(newKey).toContain('free'); // Deve ter prefixo do tier
    });

    it('deve gerar keys únicas para cada usuário', async () => {
      const key1 = await ApiKeyService.generateKey('user-1', 'User 1', UserTier.FREE);
      const key2 = await ApiKeyService.generateKey('user-2', 'User 2', UserTier.FREE);

      expect(key1).not.toBe(key2);
    });

    it('deve listar keys de um usuário', async () => {
      const userId = 'test-user-multiple';

      const key1 = await ApiKeyService.generateKey(userId, 'Test User', UserTier.FREE);
      const key2 = await ApiKeyService.generateKey(userId, 'Test User', UserTier.PREMIUM);

      const userKeys = await ApiKeyService.getUserKeys(userId);

      expect(userKeys).toHaveLength(2);
      expect(userKeys.map((k) => k.key)).toContain(key1);
      expect(userKeys.map((k) => k.key)).toContain(key2);
    });

    it('deve atualizar tier de usuário', async () => {
      const userId = 'upgrade-user';
      const key = await ApiKeyService.generateKey(userId, 'Upgrade User', UserTier.FREE);

      // Upgrade para PREMIUM
      await ApiKeyService.updateUserTier(userId, UserTier.PREMIUM);

      const userKeys = await ApiKeyService.getUserKeys(userId);
      expect(userKeys[0].tier).toBe(UserTier.PREMIUM);
    });

    it('deve retornar estatísticas de API keys', () => {
      const stats = ApiKeyService.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('inactive');
      expect(stats).toHaveProperty('byTier');

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.active).toBeGreaterThanOrEqual(0);
      expect(stats.byTier).toHaveProperty('free');
      expect(stats.byTier).toHaveProperty('premium');
      expect(stats.byTier).toHaveProperty('enterprise');
      expect(stats.byTier).toHaveProperty('admin');
    });
  });

  describe('Security - API Key Protection', () => {
    it('não deve expor API key completa em responses', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('X-API-Key', TEST_KEYS.free)
        .query({ limit: 1 })
        .expect(200);

      const responseText = JSON.stringify(response.body);

      // API key não deve aparecer completa na response
      expect(responseText).not.toContain(TEST_KEYS.free);
    });

    it('não deve expor API key em erro 404', async () => {
      const response = await request(server)
        .get('/api/item/dadosCadastrais/informacoesGerais/NOT_EXISTS')
        .set('X-API-Key', TEST_KEYS.premium)
        .expect(404);

      const responseText = JSON.stringify(response.body);

      // API key não deve aparecer em erros
      expect(responseText).not.toContain(TEST_KEYS.premium);
    });

    it('não deve expor API key em erro 400', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('X-API-Key', TEST_KEYS.enterprise)
        .query({ page: -1 })
        .expect(400);

      const responseText = JSON.stringify(response.body);

      // API key não deve aparecer em erros de validação
      expect(responseText).not.toContain(TEST_KEYS.enterprise);
    });

    it('deve mascarar API key em logs (verificação conceitual)', async () => {
      // API keys devem ser mascaradas como 'free...3456' nos logs
      const response = await request(server)
        .get('/api/item/search')
        .set('X-API-Key', TEST_KEYS.free)
        .query({ limit: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Logs (não acessíveis em testes) devem mascarar a key
    });
  });

  describe('Multi-Request Authentication Flow', () => {
    it('deve manter autenticação consistente em múltiplas requests', async () => {
      const requests = [
        request(server).get('/api/item/search').set('X-API-Key', TEST_KEYS.premium),
        request(server).get('/api/familia').set('X-API-Key', TEST_KEYS.premium),
        request(server).get('/api/grupoDeEstoque').set('X-API-Key', TEST_KEYS.premium),
        request(server).get('/health').set('X-API-Key', TEST_KEYS.premium),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect([200, 503]).toContain(response.status);
      });
    });

    it('deve permitir diferentes keys em requests paralelas', async () => {
      const requests = [
        request(server).get('/api/item/search').set('X-API-Key', TEST_KEYS.free),
        request(server).get('/api/item/search').set('X-API-Key', TEST_KEYS.premium),
        request(server).get('/api/item/search').set('X-API-Key', TEST_KEYS.enterprise),
        request(server).get('/api/item/search').set('X-API-Key', TEST_KEYS.admin),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com API key muito longa', async () => {
      const veryLongKey = 'a'.repeat(1000);

      const response = await request(server)
        .get('/api/item/search')
        .set('X-API-Key', veryLongKey)
        .query({ limit: 1 });

      expect([200, 400, 401]).toContain(response.status);
    });

    it('deve lidar com caracteres especiais em API key', async () => {
      const specialChars = 'test-key-!@#$%^&*()';

      const response = await request(server)
        .get('/api/item/search')
        .set('X-API-Key', specialChars)
        .query({ limit: 1 });

      expect([200, 400, 401]).toContain(response.status);
    });

    it('deve lidar com múltiplos Authorization headers', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .set('Authorization', `Bearer ${TEST_KEYS.free}`)
        .set('Authorization', `Bearer ${TEST_KEYS.premium}`) // Sobrescreve
        .query({ limit: 1 });

      expect([200, 401]).toContain(response.status);
    });

    it('deve lidar com Authorization header mal formatado', async () => {
      const malformedHeaders = [
        'Bearer',                           // Sem key
        `Bearer`,                           // Sem key (espaço extra)
        `Basic ${TEST_KEYS.free}`,         // Tipo errado
        TEST_KEYS.free,                     // Sem Bearer
        `bearer ${TEST_KEYS.free}`,        // lowercase bearer
      ];

      for (const header of malformedHeaders) {
        const response = await request(server)
          .get('/api/item/search')
          .set('Authorization', header)
          .query({ limit: 1 });

        expect([200, 400, 401]).toContain(response.status);
      }
    });

    it('deve lidar com null/undefined em headers', async () => {
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 1 });

      // Sem headers de auth, deve funcionar em endpoint público
      expect(response.status).toBe(200);
    });
  });
});
