// src/estabelecimento/dadosCadastrais/informacoesGerais/__tests__/service.test.ts
import { InformacoesGeraisService } from '../service';
import { EstabelecimentoInformacoesGeraisRepository } from '../repository';
import { EstabelecimentoNotFoundError, DatabaseError } from '@shared/errors/CustomErrors';

jest.mock('../repository');
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Service - InformacoesGeraisService (Estabelecimento)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInformacoesGerais - Sucesso', () => {

    it('deve retornar informações quando encontrado', async () => {
      const mockData = {
        codigo: 'TEST123',
        nome: 'Estabelecimento Teste'
      };

      (EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster as jest.Mock)
        .mockResolvedValue(mockData);

      const result = await InformacoesGeraisService.getInformacoesGerais('TEST123');

      expect(result).toBeDefined();
      expect(result.codigo).toBe('TEST123');
      expect(result.descricao).toBe('Estabelecimento Teste');  // ← agora é descricao
    });

  });

  describe('getInformacoesGerais - Não Encontrado', () => {
    it('deve lançar erro quando não existe', async () => {
      (EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster as jest.Mock)
        .mockResolvedValue(null);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('INEXISTENTE')
      ).rejects.toThrow(EstabelecimentoNotFoundError);
    });
  });

  describe('getInformacoesGerais - Erros', () => {
    it('deve converter erros de banco em DatabaseError', async () => {
      const dbError = new Error('Conexão perdida');

      (EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster as jest.Mock)
        .mockRejectedValue(dbError);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('TEST123')
      ).rejects.toThrow(DatabaseError);
    });
  });
});