import { http, HttpResponse } from 'msw';

/**
 * Handlers do MSW (Mock Service Worker)
 *
 * Define mocks para endpoints da API usados nos testes de integração.
 */
export const handlers = [
  // Mock de busca de itens
  http.get('/api/lor0138/item/search', () => {
    return HttpResponse.json(
      {
        data: [
          {
            itemCodigo: '7530110',
            itemDescricao: 'PARAFUSO TEST',
            unidade: 'UN',
          },
        ],
        total: 1,
      },
      {
        headers: {
          'X-Correlation-ID': 'test-correlation-id',
        },
      }
    );
  }),

  // Mock de família
  http.get('/api/lor0138/familia/listar', () => {
    return HttpResponse.json({
      data: [
        { codigo: 'FAM01', descricao: 'Família 1' },
        { codigo: 'FAM02', descricao: 'Família 2' },
      ],
    });
  }),

  // Mock de erro 429 (rate limit)
  http.get('/api/lor0138/test-rate-limit', () => {
    return HttpResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60',
        },
      }
    );
  }),

  // Mock de logs (batch)
  http.post('/api/logs/frontend/batch', () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Mock de logs (individual)
  http.post('/api/logs/frontend', () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),
];
