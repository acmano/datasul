// src/deposito/listar/__tests__/service.test.ts

import { ListarService } from '../service';
import { DepositoListarRepository } from '../repository';

jest.mock('../repository');

describe('Service - ListarService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarTodos', () => {
    it('deve retornar lista de depósitos normalizada', async () => {
      const mockDepositos = [
        {
          codigo: '01  ',
          nome: '  DEPOSITO CENTRAL  ',
          consideraSaldoDisponivel: 'Sim',
          consideraSaldoAlocado: '  Sim  ',
          permissaoMovDeposito1: 'E',
          permissaoMovDeposito2: 'S',
          permissaoMovDeposito3: 'T',
          produtoAcabado: 'Sim',
          tipoDeposito: 'Interno',
          depositoProcesso: 'Não',
          nomeAbrev: 'DEP CENTRAL',
          saldoDisponivel: 'Sim',
          depositoCQ: 'Não',
          depositoRejeito: 'Não',
          char1: '  ',
          char2: '',
          dec1: 0,
          dec2: 0,
          int1: 0,
          int2: 0,
          log1: false,
          log2: false,
          data1: null,
          data2: null,
          checkSum: '',
          depositoReciclado: 'Não',
          consideraOrdens: 'Sim',
          depositoWMS: 'Não',
          alocaSaldoERP: 'Sim',
          origemExterna: 'Não',
          depositoWmsExterno: 'Não',
          alocaSaldoWmsExterno: 'Não',
        },
      ];

      (DepositoListarRepository.listarTodos as jest.Mock).mockResolvedValue(mockDepositos);

      const result = await ListarService.listarTodos();

      expect(result).toHaveLength(1);
      expect(result[0]!.codigo).toBe('01');
      expect(result[0]!.nome).toBe('DEPOSITO CENTRAL');
      expect(result[0]!.consideraSaldoAlocado).toBe('Sim');
      expect(result[0]!.char1).toBe('');
    });

    it('deve normalizar valores vazios para padrões', async () => {
      const mockDepositos = [
        {
          codigo: '',
          nome: null,
          consideraSaldoDisponivel: null,
          consideraSaldoAlocado: null,
          permissaoMovDeposito1: null,
          permissaoMovDeposito2: null,
          permissaoMovDeposito3: null,
          produtoAcabado: null,
          tipoDeposito: null,
          depositoProcesso: null,
          nomeAbrev: null,
          saldoDisponivel: null,
          depositoCQ: null,
          depositoRejeito: null,
          char1: null,
          char2: null,
          dec1: null,
          dec2: null,
          int1: null,
          int2: null,
          log1: null,
          log2: null,
          data1: null,
          data2: null,
          checkSum: null,
          depositoReciclado: null,
          consideraOrdens: null,
          depositoWMS: null,
          alocaSaldoERP: null,
          origemExterna: null,
          depositoWmsExterno: null,
          alocaSaldoWmsExterno: null,
        },
      ];

      (DepositoListarRepository.listarTodos as jest.Mock).mockResolvedValue(mockDepositos);

      const result = await ListarService.listarTodos();

      expect(result[0]!.codigo).toBe('');
      expect(result[0]!.nome).toBe('');
      expect(result[0]!.consideraSaldoDisponivel).toBe('Não');
      expect(result[0]!.dec1).toBe(0);
      expect(result[0]!.log1).toBe(false);
    });

    it('deve propagar erro do repository', async () => {
      const mockError = new Error('Erro no repository');

      (DepositoListarRepository.listarTodos as jest.Mock).mockRejectedValue(mockError);

      await expect(ListarService.listarTodos()).rejects.toThrow('Erro no repository');
    });

    it('deve retornar array vazio quando repository retorna vazio', async () => {
      (DepositoListarRepository.listarTodos as jest.Mock).mockResolvedValue([]);

      const result = await ListarService.listarTodos();

      expect(result).toEqual([]);
    });
  });
});
