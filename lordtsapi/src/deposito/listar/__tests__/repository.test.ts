// src/deposito/listar/__tests__/repository.test.ts

import { DepositoListarRepository } from '../repository';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/cache/QueryCacheService');

describe('Repository - DepositoListarRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarTodos', () => {
    it('deve retornar lista de depósitos quando encontrados', async () => {
      const mockResult = [
        {
          codigo: '01',
          nome: 'DEPOSITO CENTRAL',
          consideraSaldoDisponivel: 'Sim',
          consideraSaldoAlocado: 'Sim',
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
          char1: '',
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

      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await DepositoListarRepository.listarTodos();

      expect(result).toEqual(mockResult);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledTimes(1);
      expect(QueryCacheService.withDepositoCache).toHaveBeenCalledTimes(1);
    });

    it('deve retornar array vazio quando nenhum depósito encontrado', async () => {
      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const result = await DepositoListarRepository.listarTodos();

      expect(result).toEqual([]);
    });

    it('deve propagar erro quando DatabaseManager falha', async () => {
      const mockError = new Error('Erro de conexão');

      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(mockError);

      await expect(DepositoListarRepository.listarTodos()).rejects.toThrow('Erro de conexão');
    });
  });
});
