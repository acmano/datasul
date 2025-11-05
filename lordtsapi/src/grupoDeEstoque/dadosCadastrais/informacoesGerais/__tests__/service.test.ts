// src/grupoDeEstoque/dadosCadastrais/informacoesGerais/__tests__/service.test.ts
import { InformacoesGeraisService } from '../service';
import { GrupoDeEstoqueInformacoesGeraisRepository } from '../repository';
import { GrupoDeEstoqueNotFoundError, DatabaseError } from '@shared/errors/CustomErrors';

jest.mock('../repository');
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Service - InformacoesGeraisService (GrupoDeEstoque)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInformacoesGerais - Sucesso', () => {
    it('deve retornar informações quando encontrado', async () => {
      const mockData = {
        grupoDeEstoqueCodigo: 'TEST123',
        grupoDeEstoqueDescricao: 'Grupo Teste',
      };

      (
        GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster as jest.Mock
      ).mockResolvedValue(mockData);

      const result = await InformacoesGeraisService.getInformacoesGerais('TEST123');

      expect(result).toBeDefined();
      expect(result.codigo).toBe('TEST123');
      expect(result.descricao).toBe('Grupo Teste');
    });
  });

  describe('getInformacoesGerais - Não Encontrado', () => {
    it('deve lançar erro quando não existe', async () => {
      (
        GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster as jest.Mock
      ).mockResolvedValue(null);

      await expect(InformacoesGeraisService.getInformacoesGerais('INEXISTENTE')).rejects.toThrow(
        GrupoDeEstoqueNotFoundError
      );
    });
  });

  describe('getInformacoesGerais - Erros', () => {
    it('deve converter erros de banco em DatabaseError', async () => {
      const dbError = new Error('Conexão perdida');

      (
        GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster as jest.Mock
      ).mockRejectedValue(dbError);

      await expect(InformacoesGeraisService.getInformacoesGerais('TEST123')).rejects.toThrow(
        DatabaseError
      );
    });
  });
});
