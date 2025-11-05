import { InformacoesGeraisService } from '../service';
import { FamiliaComercialInformacoesGeraisRepository } from '../repository';
import { FamiliaComercialNotFoundError, DatabaseError } from '@shared/errors/CustomErrors';

jest.mock('../repository');
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Service - InformacoesGeraisService (FamiliaComercial)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInformacoesGerais - Sucesso', () => {
    it('deve retornar informações quando encontrado', async () => {
      const mockData = {
        familiaComercialCodigo: 'FC01',
        familiaComercialDescricao: 'Familia Comercial Teste',
      };

      (
        FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster as jest.Mock
      ).mockResolvedValue(mockData);

      const result = await InformacoesGeraisService.getInformacoesGerais('FC01');

      expect(result).toBeDefined();
      expect(result.codigo).toBe('FC01');
      expect(result.descricao).toBe('Familia Comercial Teste');
    });
  });

  describe('getInformacoesGerais - Não Encontrado', () => {
    it('deve lançar erro quando não existe', async () => {
      (
        FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster as jest.Mock
      ).mockResolvedValue(null);

      await expect(InformacoesGeraisService.getInformacoesGerais('INEXISTENTE')).rejects.toThrow(
        FamiliaComercialNotFoundError
      );
    });
  });

  describe('getInformacoesGerais - Erros', () => {
    it('deve converter erros de banco em DatabaseError', async () => {
      const dbError = new Error('Conexão perdida');

      (
        FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster as jest.Mock
      ).mockRejectedValue(dbError);

      await expect(InformacoesGeraisService.getInformacoesGerais('TEST123')).rejects.toThrow(
        DatabaseError
      );
    });
  });
});
