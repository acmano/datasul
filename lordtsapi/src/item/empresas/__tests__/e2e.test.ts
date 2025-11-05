// src/item/itemEmpresas/__tests__/e2e.test.ts

import request from 'supertest';
import express from 'express';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { errorHandler } from '@shared/middlewares/errorHandler.middleware';
import itemEmpresasRoutes from '../routes';

jest.mock('@infrastructure/database/DatabaseManager');

describe('E2E - Item Empresas API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/item', itemEmpresasRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/item/empresas', () => {
    it('deve retornar 200 e empresas quando encontradas', async () => {
      const mockDbData = [
        {
          itemCodigo: '7530110',
          estabelecimentoCodigo: '01',
          estabelecimentoNome: 'Empresa ABC',
        },
        {
          itemCodigo: '7530110',
          estabelecimentoCodigo: '02',
          estabelecimentoNome: 'Empresa XYZ',
        },
      ];

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockDbData);

      const response = await request(app)
        .get('/api/item/empresas')
        .query({ codigo: '7530110' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(2);
      expect(response.body.data.codigo).toBe('7530110');
      expect(response.body.data.empresas).toHaveLength(2);
      expect(response.body.data.empresas[0].codigo).toBe('01');
      expect(response.body.data.empresas[0].nome).toBe('Empresa ABC');
    });

    it('deve retornar 200 com array vazio quando não encontrar', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/item/empresas')
        .query({ codigo: 'INEXISTENTE' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(0);
      expect(response.body.data.empresas).toEqual([]);
      expect(response.body.data.codigo).toBe('INEXISTENTE');
    });

    it('deve retornar 400 quando não enviar código', async () => {
      const response = await request(app).get('/api/item/empresas').query({}).expect(400);

      expect(response.body.message).toMatch(/obrigatório/i);
    });

    it('deve retornar 400 para código inválido (muito longo)', async () => {
      const response = await request(app)
        .get('/api/item/empresas')
        .query({ codigo: '12345678901234567' }) // 17 caracteres
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('deve retornar 400 para código vazio', async () => {
      const response = await request(app)
        .get('/api/item/empresas')
        .query({ codigo: '' })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('deve sanitizar tentativas de SQL injection', async () => {
      const response = await request(app)
        .get('/api/item/empresas')
        .query({ codigo: "TEST'; DROP TABLE--" })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('deve aceitar código alfanumérico válido', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/item/empresas')
        .query({ codigo: 'ABC123XYZ' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.codigo).toBe('ABC123XYZ');
    });

    it('deve retornar estrutura correta do JSON', async () => {
      const mockDbData = [
        {
          itemCodigo: '7530110',
          estabelecimentoCodigo: '01',
          estabelecimentoNome: 'Empresa ABC',
        },
      ];

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockDbData);

      const response = await request(app)
        .get('/api/item/empresas')
        .query({ codigo: '7530110' })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('codigo');
      expect(response.body.data).toHaveProperty('empresas');
      expect(Array.isArray(response.body.data.empresas)).toBe(true);
    });

    it('deve fazer trim nos dados retornados', async () => {
      const mockDbData = [
        {
          itemCodigo: '7530110',
          estabelecimentoCodigo: '  01  ',
          estabelecimentoNome: '  Empresa ABC  ',
        },
      ];

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockDbData);

      const response = await request(app)
        .get('/api/item/empresas')
        .query({ codigo: '7530110' })
        .expect(200);

      expect(response.body.data.empresas[0].codigo).toBe('01');
      expect(response.body.data.empresas[0].nome).toBe('Empresa ABC');
    });
  });
});
