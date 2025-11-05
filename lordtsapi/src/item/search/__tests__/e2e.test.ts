// src/item/search/__tests__/e2e.test.ts

import request from 'supertest';
import express from 'express';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { errorHandler } from '@shared/middlewares/errorHandler.middleware';
import itemSearchRoutes from '../routes';

jest.mock('@infrastructure/database/DatabaseManager');

describe('E2E - Item Search API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/item', itemSearchRoutes);
    app.use(errorHandler); // ← Adicionar
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/item/search', () => {
    it('deve retornar 200 e itens quando encontrados', async () => {
      const mockDbData = [
        {
          codigo: 'TEST123',
          descricao: 'Item Teste',
          itemUnidade: 'PC',
          familiaCodigo: '450000',
          familiaDescricao: 'Familia Teste',
          familiaComercialCodigo: 'FC001',
          familiaComercialDescricao: 'FC Teste',
          grupoDeEstoqueCodigo: 40,
          grupoDeEstoqueDescricao: 'Grupo Teste',
          gtin13: '7896451824813',
          gtin14: null,
        },
      ];

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockDbData);

      const _response = await request(app)
        .post('/api/item/search')
        .send({ familia: '450000' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(1);
      expect(response.body.criteriosDeBusca.familia).toBe('450000');
      expect(response.body.data[0].item.codigo).toBe('TEST123');
    });

    it('deve retornar 200 com array vazio quando não encontrar', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      const _response = await request(app)
        .post('/api/item/search')
        .send({ codigo: 'INEXISTENTE' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(0);
      expect(response.body.data).toEqual([]);
    });

    it('deve retornar 400 quando não enviar parâmetros', async () => {
      const _response = await request(app).post('/api/item/search').send({}).expect(400);

      expect(response.body.message).toMatch(/pelo menos um parâmetro/i);
    });

    it('deve retornar 400 para GTIN inválido', async () => {
      const _response = await request(app)
        .post('/api/item/search')
        .send({ gtin: '123' })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('deve buscar por múltiplos critérios', async () => {
      const mockDbData = [
        {
          codigo: 'TEST123',
          descricao: 'Item Teste',
          itemUnidade: 'PC',
          familiaCodigo: '450000',
          familiaDescricao: 'Familia Teste',
          familiaComercialCodigo: 'FC001',
          familiaComercialDescricao: 'FC Teste',
          grupoDeEstoqueCodigo: 40,
          grupoDeEstoqueDescricao: 'Grupo Teste',
          gtin13: null,
          gtin14: null,
        },
      ];

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockDbData);

      const _response = await request(app)
        .post('/api/item/search')
        .send({
          familia: '450000',
          grupoEstoque: '40',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.criteriosDeBusca.familia).toBe('450000');
      expect(response.body.criteriosDeBusca.grupoEstoque).toBe('40');
    });

    it('deve incluir gtin13 e gtin14 quando existirem', async () => {
      const mockDbData = [
        {
          codigo: 'TEST123',
          descricao: 'Item Teste',
          itemUnidade: 'PC',
          familiaCodigo: '450000',
          familiaDescricao: 'Familia Teste',
          familiaComercialCodigo: 'FC001',
          familiaComercialDescricao: 'FC Teste',
          grupoDeEstoqueCodigo: 40,
          grupoDeEstoqueDescricao: 'Grupo Teste',
          gtin13: '7896451824813',
          gtin14: '17896451824813',
        },
      ];

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockDbData);

      const _response = await request(app)
        .post('/api/item/search')
        .send({ gtin: '7896451824813' })
        .expect(200);

      expect(response.body.data[0].item.gtin13).toBe('7896451824813');
      expect(response.body.data[0].item.gtin14).toBe('17896451824813');
    });

    it('deve sanitizar tentativas de SQL injection', async () => {
      const _response = await request(app)
        .post('/api/item/search')
        .send({ codigo: "TEST'; DROP TABLE--" })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });
});
