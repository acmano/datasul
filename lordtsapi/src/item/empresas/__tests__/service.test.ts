// src/item/itemEmpresas/__tests__/service.test.ts

import { ItemEmpresasService } from '../service';
import { ItemEmpresasRepository } from '../repository';
import { DatabaseError } from '@shared/errors/CustomErrors';

jest.mock('../repository');
jest.mock('@shared/utils/logger');

describe('Service - ItemEmpresasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getItemEmpresas - Sucesso', () => {
    it('deve retornar resposta com código e empresas', async () => {
      const mockEmpresas = [
        {
          codigo: '01',
          nome: 'Empresa ABC',
        },
        {
          codigo: '02',
          nome: 'Empresa XYZ',
        },
      ];

      (ItemEmpresasRepository.getItemEmpresas as jest.Mock).mockResolvedValue(mockEmpresas);

      const result = await ItemEmpresasService.getItemEmpresas({ codigo: '7530110' });

      expect(result.success).toBe(true);
      expect(result.data.codigo).toBe('7530110');
      expect(result.data.empresas).toEqual(mockEmpresas);
      expect(result.total).toBe(2);
    });

    it('deve retornar array vazio quando item não tem empresas', async () => {
      (ItemEmpresasRepository.getItemEmpresas as jest.Mock).mockResolvedValue([]);

      const result = await ItemEmpresasService.getItemEmpresas({ codigo: '7530110' });

      expect(result.success).toBe(true);
      expect(result.data.codigo).toBe('7530110');
      expect(result.data.empresas).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('deve retornar total correto', async () => {
      const mockEmpresas = [
        { codigo: '01', nome: 'Empresa A' },
        { codigo: '02', nome: 'Empresa B' },
        { codigo: '03', nome: 'Empresa C' },
      ];

      (ItemEmpresasRepository.getItemEmpresas as jest.Mock).mockResolvedValue(mockEmpresas);

      const result = await ItemEmpresasService.getItemEmpresas({ codigo: '7530110' });

      expect(result.total).toBe(3);
    });

    it('deve manter código do item no response', async () => {
      (ItemEmpresasRepository.getItemEmpresas as jest.Mock).mockResolvedValue([]);

      const result = await ItemEmpresasService.getItemEmpresas({ codigo: 'TESTE123' });

      expect(result.data.codigo).toBe('TESTE123');
    });
  });

  describe('getItemEmpresas - Erros', () => {
    it('deve lançar DatabaseError quando repositório falha', async () => {
      const dbError = new Error('Erro de conexão');
      (ItemEmpresasRepository.getItemEmpresas as jest.Mock).mockRejectedValue(dbError);

      await expect(ItemEmpresasService.getItemEmpresas({ codigo: '7530110' })).rejects.toThrow(
        DatabaseError
      );
    });

    it('deve incluir mensagem de erro original', async () => {
      const dbError = new Error('Conexão perdida');
      (ItemEmpresasRepository.getItemEmpresas as jest.Mock).mockRejectedValue(dbError);

      try {
        await ItemEmpresasService.getItemEmpresas({ codigo: '7530110' });
      } catch (_error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).message).toContain('Falha ao buscar empresas do item');
      }
    });
  });
});
