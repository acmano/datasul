import { EstruturaInformacoesGeraisService } from '../service';
import { EstruturaInformacoesGeraisRepository } from '../repository';
import { ItemNotFoundError, ValidationError, BusinessRuleError } from '@shared/errors/errors';

// Mock do repository
jest.mock('../repository');

describe('EstruturaInformacoesGeraisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEstrutura', () => {
    it('deve retornar estrutura quando encontrada', async () => {
      const mockEstrutura = {
        itemPrincipal: {
          codigo: '7530110',
          estabelecimento: '01.01',
          descricao: 'RESISTÊNCIA',
          unidadeMedida: 'UN',
          nivel: 0,
          quantidadeEstrutura: null,
          quantidadeAcumulada: 1,
          processoFabricacao: { operacao: [] },
          componentes: [],
        },
        resumoHoras: {
          porCentroCusto: [],
          totais: {
            totalGeralHoras: 0,
            totalHorasHomem: 0,
            totalHorasMaquina: 0,
          },
        },
        metadata: {
          dataGeracao: '2025-01-01T00:00:00Z',
          itemPesquisado: '7530110',
          estabelecimentoPrincipal: '01.01',
          totalNiveis: 0,
          totalItens: 1,
          totalOperacoes: 0,
        },
      };

      (EstruturaInformacoesGeraisRepository.getEstruturaCompleta as jest.Mock).mockResolvedValue(
        mockEstrutura
      );

      const resultado = await EstruturaInformacoesGeraisService.getEstrutura('7530110');

      expect(resultado).toEqual(mockEstrutura);
      expect(EstruturaInformacoesGeraisRepository.getEstruturaCompleta).toHaveBeenCalledWith(
        '7530110',
        undefined
      );
    });

    it('deve passar dataReferencia quando fornecida', async () => {
      const mockEstrutura = {
        itemPrincipal: {
          codigo: '7530110',
          estabelecimento: '01.01',
          descricao: 'RESISTÊNCIA',
          unidadeMedida: 'UN',
          nivel: 0,
          quantidadeEstrutura: null,
          quantidadeAcumulada: 1,
          processoFabricacao: { operacao: [] },
          componentes: [],
        },
        resumoHoras: {
          porCentroCusto: [],
          totais: {
            totalGeralHoras: 0,
            totalHorasHomem: 0,
            totalHorasMaquina: 0,
          },
        },
        metadata: {
          dataGeracao: '2025-01-15T00:00:00Z',
          itemPesquisado: '7530110',
          estabelecimentoPrincipal: '01.01',
          totalNiveis: 0,
          totalItens: 1,
          totalOperacoes: 0,
        },
      };

      (EstruturaInformacoesGeraisRepository.getEstruturaCompleta as jest.Mock).mockResolvedValue(
        mockEstrutura
      );

      const resultado = await EstruturaInformacoesGeraisService.getEstrutura(
        '7530110',
        '2025-01-15'
      );

      expect(resultado).toEqual(mockEstrutura);
      expect(EstruturaInformacoesGeraisRepository.getEstruturaCompleta).toHaveBeenCalledWith(
        '7530110',
        '2025-01-15'
      );
    });

    it('deve lançar ItemNotFoundError quando estrutura não encontrada', async () => {
      (EstruturaInformacoesGeraisRepository.getEstruturaCompleta as jest.Mock).mockResolvedValue(
        null
      );

      await expect(EstruturaInformacoesGeraisService.getEstrutura('INEXISTENTE')).rejects.toThrow(
        ItemNotFoundError
      );
    });

    it('deve lançar ItemNotFoundError quando falta itemPrincipal', async () => {
      (EstruturaInformacoesGeraisRepository.getEstruturaCompleta as jest.Mock).mockResolvedValue({
        itemPrincipal: null,
        resumoHoras: {},
        metadata: {},
      });

      await expect(EstruturaInformacoesGeraisService.getEstrutura('7530110')).rejects.toThrow(
        ItemNotFoundError
      );
    });

    it('deve validar itemCodigo vazio', async () => {
      await expect(EstruturaInformacoesGeraisService.getEstrutura('')).rejects.toThrow(
        ValidationError
      );
    });

    it('deve validar formato de data inválido', async () => {
      await expect(
        EstruturaInformacoesGeraisService.getEstrutura('7530110', 'invalid-date')
      ).rejects.toThrow(ValidationError);
    });

    it('deve aceitar estrutura com 20 níveis (limite máximo)', async () => {
      const mockEstrutura = {
        itemPrincipal: {
          codigo: '7530110',
          estabelecimento: '01.01',
          descricao: 'RESISTÊNCIA',
          unidadeMedida: 'UN',
          nivel: 0,
          quantidadeEstrutura: null,
          quantidadeAcumulada: 1,
          processoFabricacao: { operacao: [] },
          componentes: [],
        },
        resumoHoras: {
          porCentroCusto: [],
          totais: {
            totalGeralHoras: 0,
            totalHorasHomem: 0,
            totalHorasMaquina: 0,
          },
        },
        metadata: {
          dataGeracao: '2025-01-01T00:00:00Z',
          itemPesquisado: '7530110',
          estabelecimentoPrincipal: '01.01',
          totalNiveis: 20,
          totalItens: 100,
          totalOperacoes: 50,
        },
      };

      (EstruturaInformacoesGeraisRepository.getEstruturaCompleta as jest.Mock).mockResolvedValue(
        mockEstrutura
      );

      const resultado = await EstruturaInformacoesGeraisService.getEstrutura('7530110');

      expect(resultado).toEqual(mockEstrutura);
      expect(resultado.metadata.totalNiveis).toBe(20);
    });

    it('deve incluir campos de data de validade quando presentes', async () => {
      const mockEstrutura = {
        itemPrincipal: {
          codigo: '7530110',
          estabelecimento: '01.01',
          descricao: 'RESISTÊNCIA',
          unidadeMedida: 'UN',
          nivel: 0,
          quantidadeEstrutura: null,
          quantidadeAcumulada: 1,
          dataInicio: '2024-01-01',
          dataFim: '2025-12-31',
          processoFabricacao: { operacao: [] },
          componentes: [
            {
              codigo: 'COMP001',
              estabelecimento: '01.01',
              descricao: 'Componente 1',
              unidadeMedida: 'UN',
              nivel: 1,
              quantidadeEstrutura: 2,
              quantidadeAcumulada: 2,
              dataInicio: '2024-06-01',
              dataFim: null,
              processoFabricacao: { operacao: [] },
              componentes: [],
            },
          ],
        },
        resumoHoras: {
          porCentroCusto: [],
          totais: {
            totalGeralHoras: 0,
            totalHorasHomem: 0,
            totalHorasMaquina: 0,
          },
        },
        metadata: {
          dataGeracao: '2025-01-01T00:00:00Z',
          itemPesquisado: '7530110',
          estabelecimentoPrincipal: '01.01',
          totalNiveis: 1,
          totalItens: 2,
          totalOperacoes: 0,
        },
      };

      (EstruturaInformacoesGeraisRepository.getEstruturaCompleta as jest.Mock).mockResolvedValue(
        mockEstrutura
      );

      const resultado = await EstruturaInformacoesGeraisService.getEstrutura('7530110');

      expect(resultado.itemPrincipal.dataInicio).toBe('2024-01-01');
      expect(resultado.itemPrincipal.dataFim).toBe('2025-12-31');
      expect(resultado.itemPrincipal.componentes[0].dataInicio).toBe('2024-06-01');
      expect(resultado.itemPrincipal.componentes[0].dataFim).toBeNull();
    });

    it('deve lançar BusinessRuleError quando estrutura excede 20 níveis', async () => {
      const mockEstrutura = {
        itemPrincipal: {
          codigo: '7530110',
          estabelecimento: '01.01',
          descricao: 'RESISTÊNCIA',
          unidadeMedida: 'UN',
          nivel: 0,
          quantidadeEstrutura: null,
          quantidadeAcumulada: 1,
          processoFabricacao: { operacao: [] },
          componentes: [],
        },
        resumoHoras: {
          porCentroCusto: [],
          totais: {
            totalGeralHoras: 0,
            totalHorasHomem: 0,
            totalHorasMaquina: 0,
          },
        },
        metadata: {
          dataGeracao: '2025-01-01T00:00:00Z',
          itemPesquisado: '7530110',
          estabelecimentoPrincipal: '01.01',
          totalNiveis: 25,
          totalItens: 1000,
          totalOperacoes: 500,
        },
      };

      (EstruturaInformacoesGeraisRepository.getEstruturaCompleta as jest.Mock).mockResolvedValue(
        mockEstrutura
      );

      await expect(EstruturaInformacoesGeraisService.getEstrutura('7530110')).rejects.toThrow(
        BusinessRuleError
      );

      await expect(EstruturaInformacoesGeraisService.getEstrutura('7530110')).rejects.toThrow(
        /excedendo o limite máximo de 20 níveis/
      );
    });
  });

  describe('getResumo', () => {
    it('deve retornar apenas metadata e resumoHoras', async () => {
      const mockEstrutura = {
        itemPrincipal: {
          codigo: '7530110',
          estabelecimento: '01.01',
          descricao: 'RESISTÊNCIA',
          unidadeMedida: 'UN',
          nivel: 0,
          quantidadeEstrutura: null,
          quantidadeAcumulada: 1,
          processoFabricacao: { operacao: [] },
          componentes: [],
        },
        resumoHoras: {
          porCentroCusto: [],
          totais: {
            totalGeralHoras: 10.5,
            totalHorasHomem: 5.5,
            totalHorasMaquina: 5.0,
          },
        },
        metadata: {
          dataGeracao: '2025-01-01T00:00:00Z',
          itemPesquisado: '7530110',
          estabelecimentoPrincipal: '01.01',
          totalNiveis: 3,
          totalItens: 15,
          totalOperacoes: 8,
        },
      };

      (EstruturaInformacoesGeraisRepository.getEstruturaCompleta as jest.Mock).mockResolvedValue(
        mockEstrutura
      );

      const resultado = await EstruturaInformacoesGeraisService.getResumo('7530110');

      expect(resultado).toEqual({
        metadata: mockEstrutura.metadata,
        resumoHoras: mockEstrutura.resumoHoras,
      });
      expect(resultado).not.toHaveProperty('itemPrincipal');
    });
  });

  describe('isAvailable', () => {
    it('deve retornar true quando stored procedure existe', async () => {
      (
        EstruturaInformacoesGeraisRepository.checkStoredProcedureExists as jest.Mock
      ).mockResolvedValue(true);

      const resultado = await EstruturaInformacoesGeraisService.isAvailable();

      expect(resultado).toBe(true);
    });

    it('deve retornar false quando stored procedure não existe', async () => {
      (
        EstruturaInformacoesGeraisRepository.checkStoredProcedureExists as jest.Mock
      ).mockResolvedValue(false);

      const resultado = await EstruturaInformacoesGeraisService.isAvailable();

      expect(resultado).toBe(false);
    });

    it('deve retornar false em caso de erro', async () => {
      (
        EstruturaInformacoesGeraisRepository.checkStoredProcedureExists as jest.Mock
      ).mockRejectedValue(new Error('Database error'));

      const resultado = await EstruturaInformacoesGeraisService.isAvailable();

      expect(resultado).toBe(false);
    });
  });
});
