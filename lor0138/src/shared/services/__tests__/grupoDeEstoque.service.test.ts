import api from '../../config/api.config';
import { grupoDeEstoqueService, GrupoDeEstoque } from '../grupoDeEstoque.service';

// Mock do módulo api
jest.mock('../../config/api.config', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe('grupoDeEstoqueService', () => {
  const mockApiGet = api.get as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('deve retornar lista de grupos de estoque quando API responde com sucesso', async () => {
      const mockGrupos: GrupoDeEstoque[] = [
        { codigo: 'GE001', descricao: 'Grupo Estoque 1' },
        { codigo: 'GE002', descricao: 'Grupo Estoque 2' },
      ];

      mockApiGet.mockResolvedValue({
        data: {
          data: mockGrupos,
        },
      });

      const result = await grupoDeEstoqueService.getAll();

      expect(mockApiGet).toHaveBeenCalledWith('/api/grupoDeEstoque');
      expect(result).toEqual(mockGrupos);
      expect(result).toHaveLength(2);
    });

    it('deve retornar array vazio quando data.data é null', async () => {
      mockApiGet.mockResolvedValue({
        data: {
          data: null,
        },
      });

      const result = await grupoDeEstoqueService.getAll();

      expect(mockApiGet).toHaveBeenCalledWith('/api/grupoDeEstoque');
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando data.data é undefined', async () => {
      mockApiGet.mockResolvedValue({
        data: {},
      });

      const result = await grupoDeEstoqueService.getAll();

      expect(result).toEqual([]);
    });

    it('deve lançar erro quando API falha', async () => {
      const mockError = new Error('Network error');
      mockApiGet.mockRejectedValue(mockError);

      await expect(grupoDeEstoqueService.getAll()).rejects.toThrow('Network error');
      expect(mockApiGet).toHaveBeenCalledWith('/api/grupoDeEstoque');
    });

    it('deve retornar array vazio quando response.data.data é array vazio', async () => {
      mockApiGet.mockResolvedValue({
        data: {
          data: [],
        },
      });

      const result = await grupoDeEstoqueService.getAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('deve preservar estrutura dos dados retornados pela API', async () => {
      const mockGrupo: GrupoDeEstoque = {
        codigo: 'TEST123',
        descricao: 'Grupo de Teste - Aço Inox',
      };

      mockApiGet.mockResolvedValue({
        data: {
          data: [mockGrupo],
        },
      });

      const result = await grupoDeEstoqueService.getAll();

      expect(result[0]).toEqual(mockGrupo);
      expect(result[0].codigo).toBe('TEST123');
      expect(result[0].descricao).toBe('Grupo de Teste - Aço Inox');
    });
  });
});
