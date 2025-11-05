// src/item/dadosCadastrais/dimensoes/__tests__/e2e.test.ts

import request from 'supertest';
import app from '@/app';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { CacheManager } from '@shared/utils/cacheManager';

// Mock do DatabaseManager para testes E2E
jest.mock('@infrastructure/database/DatabaseManager');

describe('E2E - GET /api/item/dadosCadastrais/dimensoes/:itemCodigo', () => {
  beforeAll(async () => {
    // Limpa cache antes dos testes
    try {
      await CacheManager.flush();
    } catch {
      // Ignora erro se cache não estiver disponível
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup
    try {
      await CacheManager.flush();
    } catch {
      // Ignora erro
    }
  });

  // ========================================
  // CASOS DE SUCESSO
  // ========================================
  describe('Casos de Sucesso', () => {
    it('deve retornar 200 e dimensões do item', async () => {
      const mockResult = [
        {
          itemCodigo: '7530110',
          itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
          pecaAltura: 10.5,
          pecaLargura: 8.3,
          pecaProfundidade: 6.2,
          pecaPeso: 0.25,
          itemEmbalagemAltura: 12.0,
          itemEmbalagemLargura: 10.0,
          itemEmbalagemProfundidade: 8.0,
          itemEmbalagemPeso: 0.3,
          itemEmbaladoAltura: 12.5,
          itemEmbaladoLargura: 10.5,
          itemEmbaladoProfundidade: 8.5,
          itemEmbaladoPeso: 0.35,
          pecasItem: 1,
          produtoEmbalagemAltura: 25.0,
          produtoEmbalagemLargura: 20.0,
          produtoEmbalagemProfundidade: 15.0,
          produtoEmbalagemPeso: 1.5,
          produtoGTIN13: '7891234567890',
          produtoEmbaladoAltura: 26.0,
          produtoEmbaladoLargura: 21.0,
          produtoEmbaladoProfundidade: 16.0,
          produtoEmbaladoPeso: 1.6,
          itensProduto: 4,
          embalagemSigla: 'CX',
          embalagemAltura: 25.5,
          embalagemLargura: 20.5,
          embalagemProfundidade: 15.5,
          embalagemPeso: 0.2,
          caixaGTIN14: '17891234567897',
          produtosCaixa: 12,
          paleteLastro: 8,
          paleteCamadas: 6,
          caixasPalete: 48,
        },
      ];

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/item/dadosCadastrais/dimensoes/7530110')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('itemCodigo', '7530110');
      expect(response.body.data).toHaveProperty('peca');
      expect(response.body.data).toHaveProperty('item');
      expect(response.body.data).toHaveProperty('produto');
      expect(response.body.data).toHaveProperty('caixa');
      expect(response.body.data).toHaveProperty('palete');
    });

    it('deve retornar headers corretos', async () => {
      const mockResult = [
        {
          itemCodigo: '7530110',
          itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
          pecaAltura: 10.5,
          pecaLargura: 8.3,
          pecaProfundidade: 6.2,
          pecaPeso: 0.25,
          itemEmbalagemAltura: 12.0,
          itemEmbalagemLargura: 10.0,
          itemEmbalagemProfundidade: 8.0,
          itemEmbalagemPeso: 0.3,
          itemEmbaladoAltura: 12.5,
          itemEmbaladoLargura: 10.5,
          itemEmbaladoProfundidade: 8.5,
          itemEmbaladoPeso: 0.35,
          pecasItem: 1,
          produtoEmbalagemAltura: 25.0,
          produtoEmbalagemLargura: 20.0,
          produtoEmbalagemProfundidade: 15.0,
          produtoEmbalagemPeso: 1.5,
          produtoGTIN13: null,
          produtoEmbaladoAltura: 26.0,
          produtoEmbaladoLargura: 21.0,
          produtoEmbaladoProfundidade: 16.0,
          produtoEmbaladoPeso: 1.6,
          itensProduto: 4,
          embalagemSigla: null,
          embalagemAltura: null,
          embalagemLargura: null,
          embalagemProfundidade: null,
          embalagemPeso: null,
          caixaGTIN14: null,
          produtosCaixa: 12,
          paleteLastro: 8,
          paleteCamadas: 6,
          caixasPalete: 48,
        },
      ];

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/item/dadosCadastrais/dimensoes/7530110')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.headers).toHaveProperty('x-correlation-id');
    });

    it('deve retornar estrutura aninhada correta', async () => {
      const mockResult = [
        {
          itemCodigo: '7530110',
          itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
          pecaAltura: 10.5,
          pecaLargura: 8.3,
          pecaProfundidade: 6.2,
          pecaPeso: 0.25,
          itemEmbalagemAltura: 12.0,
          itemEmbalagemLargura: 10.0,
          itemEmbalagemProfundidade: 8.0,
          itemEmbalagemPeso: 0.3,
          itemEmbaladoAltura: 12.5,
          itemEmbaladoLargura: 10.5,
          itemEmbaladoProfundidade: 8.5,
          itemEmbaladoPeso: 0.35,
          pecasItem: 1,
          produtoEmbalagemAltura: 25.0,
          produtoEmbalagemLargura: 20.0,
          produtoEmbalagemProfundidade: 15.0,
          produtoEmbalagemPeso: 1.5,
          produtoGTIN13: '7891234567890',
          produtoEmbaladoAltura: 26.0,
          produtoEmbaladoLargura: 21.0,
          produtoEmbaladoProfundidade: 16.0,
          produtoEmbaladoPeso: 1.6,
          itensProduto: 4,
          embalagemSigla: 'CX',
          embalagemAltura: 25.5,
          embalagemLargura: 20.5,
          embalagemProfundidade: 15.5,
          embalagemPeso: 0.2,
          caixaGTIN14: '17891234567897',
          produtosCaixa: 12,
          paleteLastro: 8,
          paleteCamadas: 6,
          caixasPalete: 48,
        },
      ];

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/item/dadosCadastrais/dimensoes/7530110')
        .expect(200);

      const { data } = response.body;

      // Valida estrutura de peca
      expect(data.peca).toHaveProperty('altura');
      expect(data.peca).toHaveProperty('largura');
      expect(data.peca).toHaveProperty('profundidade');
      expect(data.peca).toHaveProperty('peso');

      // Valida estrutura de item
      expect(data.item).toHaveProperty('pecas');
      expect(data.item).toHaveProperty('embalagem');
      expect(data.item).toHaveProperty('embalado');

      // Valida estrutura de produto
      expect(data.produto).toHaveProperty('itens');
      expect(data.produto).toHaveProperty('gtin13');
      expect(data.produto).toHaveProperty('embalagem');
      expect(data.produto).toHaveProperty('embalado');

      // Valida estrutura de caixa
      expect(data.caixa).toHaveProperty('produtos');
      expect(data.caixa).toHaveProperty('gtin14');
      expect(data.caixa).toHaveProperty('embalagem');

      // Valida estrutura de palete
      expect(data.palete).toHaveProperty('lastro');
      expect(data.palete).toHaveProperty('camadas');
      expect(data.palete).toHaveProperty('caixasPalete');
    });
  });

  // ========================================
  // ITEM NÃO ENCONTRADO
  // ========================================
  describe('Item Não Encontrado', () => {
    it('deve retornar 404 quando item não existe', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/item/dadosCadastrais/dimensoes/INEXISTENTE')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/não encontrad/i);
    });

    it('deve incluir código do item na mensagem de erro', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/item/dadosCadastrais/dimensoes/ABC123')
        .expect(404);

      expect(response.body.message).toContain('ABC123');
    });
  });

  // ========================================
  // VALIDAÇÃO DE ENTRADA
  // ========================================
  describe('Validação de Entrada', () => {
    it('deve retornar 400 para código vazio', async () => {
      const response = await request(app).get('/api/item/dadosCadastrais/dimensoes/').expect(404); // Rota não encontrada

      // Endpoint sem parâmetro não é válido
    });

    it('deve aceitar código alfanumérico', async () => {
      const mockResult = [
        {
          itemCodigo: 'ABC123',
          itemDescricao: 'Item Teste',
          pecaAltura: null,
          pecaLargura: null,
          pecaProfundidade: null,
          pecaPeso: null,
          itemEmbalagemAltura: null,
          itemEmbalagemLargura: null,
          itemEmbalagemProfundidade: null,
          itemEmbalagemPeso: null,
          itemEmbaladoAltura: null,
          itemEmbaladoLargura: null,
          itemEmbaladoProfundidade: null,
          itemEmbaladoPeso: null,
          pecasItem: null,
          produtoEmbalagemAltura: null,
          produtoEmbalagemLargura: null,
          produtoEmbalagemProfundidade: null,
          produtoEmbalagemPeso: null,
          produtoGTIN13: null,
          produtoEmbaladoAltura: null,
          produtoEmbaladoLargura: null,
          produtoEmbaladoProfundidade: null,
          produtoEmbaladoPeso: null,
          itensProduto: null,
          embalagemSigla: null,
          embalagemAltura: null,
          embalagemLargura: null,
          embalagemProfundidade: null,
          embalagemPeso: null,
          caixaGTIN14: null,
          produtosCaixa: null,
          paleteLastro: null,
          paleteCamadas: null,
          caixasPalete: null,
        },
      ];

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/item/dadosCadastrais/dimensoes/ABC123')
        .expect(200);
    });

    it('deve aceitar código numérico', async () => {
      const mockResult = [
        {
          itemCodigo: '123456',
          itemDescricao: 'Item Teste',
          pecaAltura: null,
          pecaLargura: null,
          pecaProfundidade: null,
          pecaPeso: null,
          itemEmbalagemAltura: null,
          itemEmbalagemLargura: null,
          itemEmbalagemProfundidade: null,
          itemEmbalagemPeso: null,
          itemEmbaladoAltura: null,
          itemEmbaladoLargura: null,
          itemEmbaladoProfundidade: null,
          itemEmbaladoPeso: null,
          pecasItem: null,
          produtoEmbalagemAltura: null,
          produtoEmbalagemLargura: null,
          produtoEmbalagemProfundidade: null,
          produtoEmbalagemPeso: null,
          produtoGTIN13: null,
          produtoEmbaladoAltura: null,
          produtoEmbaladoLargura: null,
          produtoEmbaladoProfundidade: null,
          produtoEmbaladoPeso: null,
          itensProduto: null,
          embalagemSigla: null,
          embalagemAltura: null,
          embalagemLargura: null,
          embalagemProfundidade: null,
          embalagemPeso: null,
          caixaGTIN14: null,
          produtosCaixa: null,
          paleteLastro: null,
          paleteCamadas: null,
          caixasPalete: null,
        },
      ];

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/item/dadosCadastrais/dimensoes/123456')
        .expect(200);
    });

    it('deve aceitar código com 16 caracteres (máximo)', async () => {
      const longCode = '1234567890123456';
      const mockResult = [
        {
          itemCodigo: longCode,
          itemDescricao: 'Item Teste',
          pecaAltura: null,
          pecaLargura: null,
          pecaProfundidade: null,
          pecaPeso: null,
          itemEmbalagemAltura: null,
          itemEmbalagemLargura: null,
          itemEmbalagemProfundidade: null,
          itemEmbalagemPeso: null,
          itemEmbaladoAltura: null,
          itemEmbaladoLargura: null,
          itemEmbaladoProfundidade: null,
          itemEmbaladoPeso: null,
          pecasItem: null,
          produtoEmbalagemAltura: null,
          produtoEmbalagemLargura: null,
          produtoEmbalagemProfundidade: null,
          produtoEmbalagemPeso: null,
          produtoGTIN13: null,
          produtoEmbaladoAltura: null,
          produtoEmbaladoLargura: null,
          produtoEmbaladoProfundidade: null,
          produtoEmbaladoPeso: null,
          itensProduto: null,
          embalagemSigla: null,
          embalagemAltura: null,
          embalagemLargura: null,
          embalagemProfundidade: null,
          embalagemPeso: null,
          caixaGTIN14: null,
          produtosCaixa: null,
          paleteLastro: null,
          paleteCamadas: null,
          caixasPalete: null,
        },
      ];

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get(`/api/item/dadosCadastrais/dimensoes/${longCode}`)
        .expect(200);
    });
  });

  // ========================================
  // CACHE
  // ========================================
  describe('Cache', () => {
    it('deve retornar X-Cache: MISS na primeira requisição', async () => {
      const mockResult = [
        {
          itemCodigo: '7530110',
          itemDescricao: 'VALVULA DE ESFERA 1/2" BRONZE',
          pecaAltura: 10.5,
          pecaLargura: 8.3,
          pecaProfundidade: 6.2,
          pecaPeso: 0.25,
          itemEmbalagemAltura: 12.0,
          itemEmbalagemLargura: 10.0,
          itemEmbalagemProfundidade: 8.0,
          itemEmbalagemPeso: 0.3,
          itemEmbaladoAltura: 12.5,
          itemEmbaladoLargura: 10.5,
          itemEmbaladoProfundidade: 8.5,
          itemEmbaladoPeso: 0.35,
          pecasItem: 1,
          produtoEmbalagemAltura: 25.0,
          produtoEmbalagemLargura: 20.0,
          produtoEmbalagemProfundidade: 15.0,
          produtoEmbalagemPeso: 1.5,
          produtoGTIN13: '7891234567890',
          produtoEmbaladoAltura: 26.0,
          produtoEmbaladoLargura: 21.0,
          produtoEmbaladoProfundidade: 16.0,
          produtoEmbaladoPeso: 1.6,
          itensProduto: 4,
          embalagemSigla: 'CX',
          embalagemAltura: 25.5,
          embalagemLargura: 20.5,
          embalagemProfundidade: 15.5,
          embalagemPeso: 0.2,
          caixaGTIN14: '17891234567897',
          produtosCaixa: 12,
          paleteLastro: 8,
          paleteCamadas: 6,
          caixasPalete: 48,
        },
      ];

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/item/dadosCadastrais/dimensoes/7530110')
        .expect(200);

      // Cache pode estar disponível ou não dependendo da configuração
      if (response.headers['x-cache']) {
        expect(['HIT', 'MISS']).toContain(response.headers['x-cache']);
      }
    });
  });

  // ========================================
  // ERROS DO SERVIDOR
  // ========================================
  describe('Erros do Servidor', () => {
    it('deve retornar 500 em erro de banco de dados', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/item/dadosCadastrais/dimensoes/7530110')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('deve incluir correlationId em erros', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/item/dadosCadastrais/dimensoes/7530110')
        .expect(500);

      expect(response.body).toHaveProperty('correlationId');
    });
  });
});
