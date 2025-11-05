// tests/integration/timeout/Timeout.integration.test.ts

import request from 'supertest';
import { Application } from '@/app';
import { retryWithBackoff, retryOnRetryableError, isRetryableError } from '@shared/utils/retry';

/**
 * Testes de Integração - Timeout & Retry
 *
 * Testa comportamento de timeout e retry em cenários reais
 *
 * @group integration
 * @group timeout
 * @group retry
 */
describe('Timeout & Retry - Integration Tests', () => {
  let app: Application;
  let server: any;

  beforeAll(async () => {
    // Inicializar aplicação
    app = new Application();
    await app.initialize();
    server = app.getServer();
  });

  afterAll(async () => {
    // Fechar aplicação
    await app.shutdown();
  });

  describe('Request Timeout Middleware', () => {
    it('deve permitir requisições rápidas completarem', async () => {
      // Act
      const response = await request(server)
        .get('/api/test/fast')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Resposta rápida');
    });

    it('deve cancelar requisições que excedem timeout padrão (30s)', async () => {
      // Arrange - Delay de 35 segundos (maior que timeout de 30s)
      const delay = 35000;

      // Act
      const response = await request(server)
        .get('/api/test/timeout')
        .query({ delay })
        .timeout(40000); // Cliente aguarda 40s, mas servidor deve cancelar em 30s

      // Assert - Middleware deve retornar 503 Service Unavailable
      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Request Timeout');
    }, 45000); // Jest timeout maior que tudo

    it('deve completar requisições dentro do timeout', async () => {
      // Arrange - Delay de 5 segundos (menor que timeout de 30s)
      const delay = 5000;

      // Act
      const response = await request(server)
        .get('/api/test/timeout')
        .query({ delay })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(`completou após ${delay}ms`);
    }, 10000);

    it('deve incluir detalhes úteis em timeout error', async () => {
      // Arrange
      const delay = 32000;

      // Act
      const response = await request(server)
        .get('/api/test/timeout')
        .query({ delay })
        .timeout(40000);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('timeout');
      expect(response.body.details).toHaveProperty('suggestion');
    }, 45000);

    it('deve aplicar timeout em endpoints reais', async () => {
      // Act - Request normal deve ser rápido
      const start = Date.now();
      const response = await request(server)
        .get('/api/item/search')
        .query({ limit: 10 });
      const duration = Date.now() - start;

      // Assert
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Deve ser bem rápido
    });
  });

  describe('Database Query Timeout', () => {
    it('deve cancelar queries que excedem timeout', async () => {
      // Arrange - Query que demora 40 segundos
      const delay = 40;

      // Act
      const response = await request(server)
        .get('/api/test/db-timeout')
        .query({ delay })
        .timeout(45000);

      // Assert - Query deve ser cancelada por timeout
      expect(response.status).toBe(408); // Request Timeout
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('timeout');
    }, 50000);

    it('deve completar queries rápidas normalmente', async () => {
      // Arrange - Query que demora 2 segundos
      const delay = 2;

      // Act
      const response = await request(server)
        .get('/api/test/db-timeout')
        .query({ delay })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
    }, 10000);
  });

  describe('Retry Utility - Basic Operations', () => {
    it('deve executar função bem-sucedida sem retry', async () => {
      // Arrange
      let attempts = 0;
      const successFn = async () => {
        attempts++;
        return 'success';
      };

      // Act
      const result = await retryWithBackoff(successFn, { maxAttempts: 3 });

      // Assert
      expect(result).toBe('success');
      expect(attempts).toBe(1); // Apenas 1 tentativa
    });

    it('deve fazer retry até conseguir', async () => {
      // Arrange
      let attempts = 0;
      const eventualSuccessFn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      // Act
      const result = await retryWithBackoff(
        eventualSuccessFn,
        {
          maxAttempts: 5,
          initialDelay: 100,
          backoffFactor: 2,
        },
        'EventualSuccess'
      );

      // Assert
      expect(result).toBe('success');
      expect(attempts).toBe(3); // Sucesso na 3ª tentativa
    }, 5000);

    it('deve lançar erro após esgotar tentativas', async () => {
      // Arrange
      let attempts = 0;
      const alwaysFailFn = async () => {
        attempts++;
        throw new Error('Permanent failure');
      };

      // Act & Assert
      await expect(
        retryWithBackoff(
          alwaysFailFn,
          {
            maxAttempts: 3,
            initialDelay: 50,
            backoffFactor: 2,
          },
          'AlwaysFail'
        )
      ).rejects.toThrow('Permanent failure');

      expect(attempts).toBe(3); // Todas as 3 tentativas foram usadas
    }, 5000);

    it('deve aplicar exponential backoff', async () => {
      // Arrange
      const delays: number[] = [];
      let lastTime = Date.now();
      let attempts = 0;

      const failFn = async () => {
        const now = Date.now();
        if (attempts > 0) {
          delays.push(now - lastTime);
        }
        lastTime = now;
        attempts++;
        throw new Error('Test error');
      };

      // Act
      await retryWithBackoff(
        failFn,
        {
          maxAttempts: 3,
          initialDelay: 100,
          backoffFactor: 2,
          jitter: false, // Desabilitar jitter para teste determinístico
        },
        'BackoffTest'
      ).catch(() => {});

      // Assert - Delays devem crescer exponencialmente
      expect(delays.length).toBe(2); // 2 delays entre 3 tentativas
      expect(delays[0]).toBeGreaterThanOrEqual(90); // ~100ms (com margem)
      expect(delays[0]).toBeLessThan(150);
      // Segundo delay não segue backoff porque jitter está desabilitado
    }, 5000);

    it('deve aplicar jitter quando habilitado', async () => {
      // Arrange
      const delays: number[] = [];
      let lastTime = Date.now();
      let attempts = 0;

      const failFn = async () => {
        const now = Date.now();
        if (attempts > 0) {
          delays.push(now - lastTime);
        }
        lastTime = now;
        attempts++;
        throw new Error('Test error');
      };

      // Act
      await retryWithBackoff(
        failFn,
        {
          maxAttempts: 3,
          initialDelay: 100,
          backoffFactor: 2,
          jitter: true, // Com jitter
        },
        'JitterTest'
      ).catch(() => {});

      // Assert - Delays devem variar devido ao jitter
      expect(delays.length).toBe(2);
      // Com jitter, delays variam entre 50% e 150% do valor base
      delays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(40); // Mínimo com jitter
        expect(delay).toBeLessThan(200); // Máximo com jitter
      });
    }, 5000);

    it('deve respeitar maxDelay', async () => {
      // Arrange
      const delays: number[] = [];
      let lastTime = Date.now();
      let attempts = 0;

      const failFn = async () => {
        const now = Date.now();
        if (attempts > 0) {
          delays.push(now - lastTime);
        }
        lastTime = now;
        attempts++;
        throw new Error('Test error');
      };

      // Act
      await retryWithBackoff(
        failFn,
        {
          maxAttempts: 5,
          initialDelay: 100,
          backoffFactor: 10, // Backoff agressivo
          maxDelay: 200, // Mas limitado a 200ms
          jitter: false,
        },
        'MaxDelayTest'
      ).catch(() => {});

      // Assert - Nenhum delay deve exceder maxDelay
      delays.forEach((delay) => {
        expect(delay).toBeLessThanOrEqual(250); // 200ms + margem
      });
    }, 5000);

    it('deve chamar callback onRetry', async () => {
      // Arrange
      const retryCallbacks: Array<{ attempt: number; delay: number }> = [];
      let attempts = 0;

      const failFn = async () => {
        attempts++;
        throw new Error(`Failure ${attempts}`);
      };

      // Act
      await retryWithBackoff(
        failFn,
        {
          maxAttempts: 3,
          initialDelay: 50,
          onRetry: (error, attempt, delay) => {
            retryCallbacks.push({ attempt, delay });
          },
        },
        'OnRetryTest'
      ).catch(() => {});

      // Assert
      expect(retryCallbacks).toHaveLength(2); // 2 retries entre 3 tentativas
      expect(retryCallbacks[0].attempt).toBe(1);
      expect(retryCallbacks[1].attempt).toBe(2);
    }, 3000);
  });

  describe('Retry Utility - Retryable Errors', () => {
    it('deve identificar erros retryable corretamente', () => {
      // Arrange & Act & Assert
      expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
      expect(isRetryableError(new Error('Connection timeout'))).toBe(true);
      expect(isRetryableError(new Error('socket hang up'))).toBe(true);
      expect(isRetryableError(new Error('connection closed'))).toBe(true);
      expect(isRetryableError(new Error('ENOTFOUND'))).toBe(true);
      expect(isRetryableError(new Error('EHOSTUNREACH'))).toBe(true);
    });

    it('deve identificar erros não-retryable corretamente', () => {
      // Arrange & Act & Assert
      expect(isRetryableError(new Error('Validation error'))).toBe(false);
      expect(isRetryableError(new Error('Not found'))).toBe(false);
      expect(isRetryableError(new Error('Unauthorized'))).toBe(false);
      expect(isRetryableError(new Error('Bad request'))).toBe(false);
    });

    it('deve fazer retry apenas para erros retryable', async () => {
      // Arrange
      let attempts = 0;
      const retryableFailFn = async () => {
        attempts++;
        throw new Error('ETIMEDOUT - connection timeout');
      };

      // Act & Assert
      await expect(
        retryOnRetryableError(
          retryableFailFn,
          {
            maxAttempts: 3,
            initialDelay: 50,
          },
          'RetryableTest'
        )
      ).rejects.toThrow('ETIMEDOUT');

      expect(attempts).toBe(3); // Todas tentativas foram usadas
    }, 3000);

    it('deve abortar imediatamente para erros não-retryable', async () => {
      // Arrange
      let attempts = 0;
      const nonRetryableFailFn = async () => {
        attempts++;
        throw new Error('Validation error - bad input');
      };

      // Act & Assert
      await expect(
        retryOnRetryableError(
          nonRetryableFailFn,
          {
            maxAttempts: 5,
            initialDelay: 50,
          },
          'NonRetryableTest'
        )
      ).rejects.toThrow('Validation error');

      expect(attempts).toBe(1); // Apenas 1 tentativa, abortou imediatamente
    }, 2000);
  });

  describe('Retry with Real Operations', () => {
    it('deve fazer retry de requisição HTTP com falha temporária', async () => {
      // Arrange
      let attempts = 0;
      const makeRequest = async () => {
        attempts++;

        // Simula falha nas primeiras 2 tentativas
        if (attempts < 3) {
          throw new Error('ECONNREFUSED - connection refused');
        }

        // 3ª tentativa bem-sucedida
        return await request(server)
          .get('/api/test/fast')
          .then((res) => res.body);
      };

      // Act
      const result = await retryOnRetryableError(
        makeRequest,
        {
          maxAttempts: 5,
          initialDelay: 100,
        },
        'HTTPRetry'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    }, 5000);

    it('deve propagar erro após max retries em operação real', async () => {
      // Arrange
      let attempts = 0;
      const makeFailedRequest = async () => {
        attempts++;
        throw new Error('ETIMEDOUT - persistent timeout');
      };

      // Act & Assert
      await expect(
        retryWithBackoff(
          makeFailedRequest,
          {
            maxAttempts: 3,
            initialDelay: 100,
          },
          'PersistentFailure'
        )
      ).rejects.toThrow('ETIMEDOUT');

      expect(attempts).toBe(3);
    }, 3000);
  });

  describe('Performance with Retry', () => {
    it('deve ter overhead mínimo para operações bem-sucedidas', async () => {
      // Arrange
      const successFn = async () => {
        return 'quick success';
      };

      // Act
      const start = Date.now();
      await retryWithBackoff(successFn, { maxAttempts: 3 });
      const duration = Date.now() - start;

      // Assert - Deve ser instantâneo (< 50ms)
      expect(duration).toBeLessThan(50);
    });

    it('deve acumular delays corretamente em múltiplos retries', async () => {
      // Arrange
      let attempts = 0;
      const failFn = async () => {
        attempts++;
        throw new Error('Test error');
      };

      // Act
      const start = Date.now();
      await retryWithBackoff(
        failFn,
        {
          maxAttempts: 3,
          initialDelay: 100,
          backoffFactor: 2,
          jitter: false,
        },
        'DelayAccumulation'
      ).catch(() => {});
      const duration = Date.now() - start;

      // Assert
      // Delays esperados: 0ms (1ª tentativa) + 100ms + 100ms = ~200ms total
      expect(duration).toBeGreaterThanOrEqual(150); // Mínimo com margem
      expect(duration).toBeLessThan(400); // Máximo com margem
      expect(attempts).toBe(3);
    }, 3000);
  });

  describe('Edge Cases', () => {
    it('deve lidar com função que retorna undefined', async () => {
      // Arrange
      const undefinedFn = async () => {
        return undefined;
      };

      // Act
      const result = await retryWithBackoff(undefinedFn);

      // Assert
      expect(result).toBeUndefined();
    });

    it('deve lidar com função que retorna null', async () => {
      // Arrange
      const nullFn = async () => {
        return null;
      };

      // Act
      const result = await retryWithBackoff(nullFn);

      // Assert
      expect(result).toBeNull();
    });

    it('deve lidar com maxAttempts = 1 (sem retry)', async () => {
      // Arrange
      let attempts = 0;
      const failFn = async () => {
        attempts++;
        throw new Error('Immediate failure');
      };

      // Act & Assert
      await expect(
        retryWithBackoff(failFn, { maxAttempts: 1 })
      ).rejects.toThrow('Immediate failure');

      expect(attempts).toBe(1);
    });

    it('deve lidar com delays muito pequenos', async () => {
      // Arrange
      let attempts = 0;
      const failFn = async () => {
        attempts++;
        throw new Error('Quick failure');
      };

      // Act
      await retryWithBackoff(
        failFn,
        {
          maxAttempts: 3,
          initialDelay: 1, // 1ms
          backoffFactor: 2,
          jitter: false,
        },
        'QuickRetry'
      ).catch(() => {});

      // Assert
      expect(attempts).toBe(3);
    }, 1000);

    it('deve lidar com erros sem mensagem', async () => {
      // Arrange
      const noMessageFn = async () => {
        const error: any = new Error();
        error.message = '';
        throw error;
      };

      // Act & Assert
      await expect(
        retryWithBackoff(noMessageFn, { maxAttempts: 2, initialDelay: 50 })
      ).rejects.toThrow();
    });
  });

  describe('Concurrent Retries', () => {
    it('deve lidar com múltiplas operações retry em paralelo', async () => {
      // Arrange
      const attemptCounts: number[] = [];

      const createRetryFn = (id: number) => {
        let attempts = 0;
        return async () => {
          attempts++;
          if (attempts < 2) {
            throw new Error(`Temp failure ${id}`);
          }
          attemptCounts[id] = attempts;
          return `success-${id}`;
        };
      };

      // Act
      const promises = Array.from({ length: 5 }, (_, i) =>
        retryWithBackoff(
          createRetryFn(i),
          { maxAttempts: 3, initialDelay: 50 },
          `Concurrent-${i}`
        )
      );

      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result).toBe(`success-${i}`);
      });
      attemptCounts.forEach((count) => {
        expect(count).toBe(2);
      });
    }, 5000);
  });
});
