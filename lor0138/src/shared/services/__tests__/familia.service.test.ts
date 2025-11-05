import api from '../../config/api.config';
import { familiaService, Familia } from '../familia.service';

// Mock do módulo api
jest.mock('../../config/api.config', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe('familiaService', () => {
  const mockApiGet = api.get as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('deve retornar lista de famílias quando API responde com sucesso', async () => {
      const mockFamilias: Familia[] = [
        { codigo: 'FAM001', descricao: 'Família 1' },
        { codigo: 'FAM002', descricao: 'Família 2' },
      ];

      mockApiGet.mockResolvedValue({
        data: {
          data: mockFamilias,
        },
      });

      const result = await familiaService.getAll();

      expect(mockApiGet).toHaveBeenCalledWith('/api/familia');
      expect(result).toEqual(mockFamilias);
      expect(result).toHaveLength(2);
    });

    it('deve retornar array vazio quando data.data é null', async () => {
      mockApiGet.mockResolvedValue({
        data: {
          data: null,
        },
      });

      const result = await familiaService.getAll();

      expect(mockApiGet).toHaveBeenCalledWith('/api/familia');
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando data.data é undefined', async () => {
      mockApiGet.mockResolvedValue({
        data: {},
      });

      const result = await familiaService.getAll();

      expect(result).toEqual([]);
    });

    it('deve lançar erro quando API falha', async () => {
      const mockError = new Error('Network error');
      mockApiGet.mockRejectedValue(mockError);

      await expect(familiaService.getAll()).rejects.toThrow('Network error');
      expect(mockApiGet).toHaveBeenCalledWith('/api/familia');
    });

    it('deve retornar array vazio quando response.data.data é array vazio', async () => {
      mockApiGet.mockResolvedValue({
        data: {
          data: [],
        },
      });

      const result = await familiaService.getAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('deve preservar estrutura dos dados retornados pela API', async () => {
      const mockFamilia: Familia = {
        codigo: 'TEST',
        descricao: 'Descrição de Teste com Acentuação',
      };

      mockApiGet.mockResolvedValue({
        data: {
          data: [mockFamilia],
        },
      });

      const result = await familiaService.getAll();

      expect(result[0]).toEqual(mockFamilia);
      expect(result[0].codigo).toBe('TEST');
      expect(result[0].descricao).toBe('Descrição de Teste com Acentuação');
    });
  });
});
