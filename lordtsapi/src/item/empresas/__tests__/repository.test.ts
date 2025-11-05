// src/item/itemEmpresas/__tests__/repository.test.ts

import { ItemEmpresasRepository } from '../repository';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/logger');

describe('Repository - ItemEmpresasRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getItemEmpresas - Sucesso', () => {
    it('deve retornar empresas encontradas', async () => {
      const mockData = [
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

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockData);

      const result = await ItemEmpresasRepository.getItemEmpresas({ codigo: '7530110' });

      expect(result).toHaveLength(2);
      expect(result[0].codigo).toBe('01');
      expect(result[0].nome).toBe('Empresa ABC');
      expect(result[1].codigo).toBe('02');
      expect(result[1].nome).toBe('Empresa XYZ');
    });

    it('deve retornar array vazio quando não encontrar', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      const result = await ItemEmpresasRepository.getItemEmpresas({ codigo: 'INEXISTENTE' });

      expect(result).toEqual([]);
    });

    it('deve construir query com código correto', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      await ItemEmpresasRepository.getItemEmpresas({ codigo: '7530110' });

      const query = (DatabaseManager.queryEmp as jest.Mock).mock.calls[0][0];
      expect(query).toContain("DECLARE @itemCodigo varchar(16) = '7530110'");
    });

    it('deve fazer trim em todos os campos string', async () => {
      const mockData = [
        {
          itemCodigo: '7530110',
          estabelecimentoCodigo: '  01  ',
          estabelecimentoNome: '  Empresa ABC  ',
        },
      ];

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockData);

      const result = await ItemEmpresasRepository.getItemEmpresas({ codigo: '7530110' });

      expect(result[0].codigo).toBe('01');
      expect(result[0].nome).toBe('Empresa ABC');
    });

    it('deve lidar com valores null/undefined', async () => {
      const mockData = [
        {
          itemCodigo: '7530110',
          estabelecimentoCodigo: null,
          estabelecimentoNome: undefined,
        },
      ];

      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue(mockData);

      const result = await ItemEmpresasRepository.getItemEmpresas({ codigo: '7530110' });

      expect(result[0].codigo).toBe('');
      expect(result[0].nome).toBe('');
    });

    it('deve usar OPENQUERY com PRD_EMS2EMP e PRD_EMS2MULT', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      await ItemEmpresasRepository.getItemEmpresas({ codigo: '7530110' });

      const query = (DatabaseManager.queryEmp as jest.Mock).mock.calls[0][0];
      expect(query).toContain('PRD_EMS2EMP');
      expect(query).toContain('PRD_EMS2MULT');
    });

    it('deve usar sp_executesql', async () => {
      (DatabaseManager.queryEmp as jest.Mock).mockResolvedValue([]);

      await ItemEmpresasRepository.getItemEmpresas({ codigo: '7530110' });

      const query = (DatabaseManager.queryEmp as jest.Mock).mock.calls[0][0];
      expect(query).toContain('EXEC sp_executesql @sql');
    });
  });

  describe('getItemEmpresas - Erros', () => {
    it('deve propagar erro do banco', async () => {
      const dbError = new Error('Erro de conexão');
      (DatabaseManager.queryEmp as jest.Mock).mockRejectedValue(dbError);

      await expect(ItemEmpresasRepository.getItemEmpresas({ codigo: '7530110' })).rejects.toThrow(
        'Erro de conexão'
      );
    });
  });
});
