// src/deposito/dadosCadastrais/informacoesGerais/__tests__/repository.test.ts

import { DepositoInformacoesGeraisRepository } from '../repository';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/cache/QueryCacheService');

describe('Repository - DepositoInformacoesGeraisRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // getDepositoMaster
  // ========================================
  describe('getDepositoMaster', () => {
    it('deve retornar dados do depósito quando encontrado', async () => {
      const mockResult = [
        {
          codigo: 'D001',
          nome: 'Depósito Principal',
          consSaldo: 1,
          alocado: 1,
          permissao1: 'SIM',
          permissao2: 'SIM',
          permissao3: 'NAO',
          indAcabado: 1,
          indTipoDep: 1,
          indProcesso: 0,
          nomeAbrev: 'DEP PRINC',
          indDispSaldo: 1,
          indDepCq: 0,
          indDepRej: 0,
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
          checkSum: 'ABC123',
          logReciclagem: 0,
          logOrdensMrp: 1,
          logGeraWms: 0,
          logAlocaQtdWms: 1,
          logOrigExt: 0,
          logEmsExterno: 0,
          logAlocalSaldoWmsExt: 0,
        },
      ];

      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await DepositoInformacoesGeraisRepository.getDepositoMaster('D001');

      expect(result).toEqual(mockResult[0]);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledTimes(1);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledWith(
        expect.stringContaining('OPENQUERY'),
        expect.arrayContaining([
          expect.objectContaining({
            name: 'paramdepositoCodigo',
            value: 'D001',
          }),
        ])
      );
    });

    it('deve retornar null quando depósito não encontrado', async () => {
      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const result = await DepositoInformacoesGeraisRepository.getDepositoMaster('INEXISTENTE');

      expect(result).toBeNull();
    });

    it('deve usar queries parametrizadas (proteção SQL Injection)', async () => {
      const maliciousCode = "'; DROP TABLE deposito;--";

      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await DepositoInformacoesGeraisRepository.getDepositoMaster(maliciousCode);

      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            name: 'paramdepositoCodigo',
            value: maliciousCode,
          }),
        ])
      );
    });

    it('deve usar cache L1/L2', async () => {
      const mockResult = [
        {
          codigo: 'D001',
          nome: 'Test',
          consSaldo: 1,
          alocado: 1,
          permissao1: '',
          permissao2: '',
          permissao3: '',
          indAcabado: 1,
          indTipoDep: 1,
          indProcesso: 0,
          nomeAbrev: '',
          indDispSaldo: 1,
          indDepCq: 0,
          indDepRej: 0,
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
          logReciclagem: 0,
          logOrdensMrp: 0,
          logGeraWms: 0,
          logAlocaQtdWms: 0,
          logOrigExt: 0,
          logEmsExterno: 0,
          logAlocalSaldoWmsExt: 0,
        },
      ];

      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      await DepositoInformacoesGeraisRepository.getDepositoMaster('D001');

      expect(QueryCacheService.withDepositoCache).toHaveBeenCalledTimes(1);
      expect(QueryCacheService.withDepositoCache).toHaveBeenCalledWith(
        expect.stringContaining('OPENQUERY'),
        expect.any(Array),
        expect.any(Function)
      );
    });

    it('deve propagar erros do banco de dados', async () => {
      const dbError = new Error('Conexão perdida');

      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(dbError);

      await expect(DepositoInformacoesGeraisRepository.getDepositoMaster('D001')).rejects.toThrow(
        'Conexão perdida'
      );
    });

    it('deve construir query OPENQUERY correta para Progress', async () => {
      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await DepositoInformacoesGeraisRepository.getDepositoMaster('D001');

      const [query] = (DatabaseManager.queryEmpWithParams as jest.Mock).mock.calls[0];

      expect(query).toContain('DECLARE @depositoCodigo varchar(16)');
      expect(query).toContain('PRD_EMS2EMP');
      expect(query).toContain('PUB.deposito');
      expect(query).toContain('cod-depos');
      expect(query).toContain('nome');
      expect(query).toContain('EXEC sp_executesql');
    });

    it('deve incluir todos os campos necessários na query', async () => {
      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await DepositoInformacoesGeraisRepository.getDepositoMaster('D001');

      const [query] = (DatabaseManager.queryEmpWithParams as jest.Mock).mock.calls[0];

      expect(query).toContain('cons-saldo');
      expect(query).toContain('alocado');
      expect(query).toContain('ind-acabado');
      expect(query).toContain('ind-tipo-dep');
      expect(query).toContain('ind-processo');
      expect(query).toContain('log-reciclagem');
      expect(query).toContain('log-gera-wms');
    });
  });

  // ========================================
  // invalidateCache
  // ========================================
  describe('invalidateCache', () => {
    it('deve invalidar cache de depósito', async () => {
      (QueryCacheService.invalidateMultiple as jest.Mock).mockResolvedValue(undefined);

      await DepositoInformacoesGeraisRepository.invalidateCache('D001');

      expect(QueryCacheService.invalidateMultiple).toHaveBeenCalledTimes(1);
      expect(QueryCacheService.invalidateMultiple).toHaveBeenCalledWith(['deposito:*']);
    });

    it('deve usar padrão wildcard correto', async () => {
      (QueryCacheService.invalidateMultiple as jest.Mock).mockResolvedValue(undefined);

      await DepositoInformacoesGeraisRepository.invalidateCache('ANY_CODE');

      const [patterns] = (QueryCacheService.invalidateMultiple as jest.Mock).mock.calls[0];
      expect(patterns).toContain('deposito:*');
    });
  });

  // ========================================
  // CENÁRIOS DE ERRO
  // ========================================
  describe('Tratamento de Erros', () => {
    it('deve tratar timeout do banco de dados', async () => {
      const timeoutError = new Error('Timeout: Request failed to complete');

      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(timeoutError);

      await expect(DepositoInformacoesGeraisRepository.getDepositoMaster('D001')).rejects.toThrow(
        'Timeout'
      );
    });

    it('deve tratar erro de conexão perdida', async () => {
      const connectionError = new Error('ECONNREFUSED');

      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(connectionError);

      await expect(DepositoInformacoesGeraisRepository.getDepositoMaster('D001')).rejects.toThrow(
        'ECONNREFUSED'
      );
    });

    it('deve tratar erro de sintaxe SQL', async () => {
      const sqlError = new Error('Incorrect syntax near');

      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(sqlError);

      await expect(DepositoInformacoesGeraisRepository.getDepositoMaster('D001')).rejects.toThrow(
        'Incorrect syntax'
      );
    });

    it('deve tratar erro de permissão', async () => {
      const permError = new Error('Permission denied');

      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(permError);

      await expect(DepositoInformacoesGeraisRepository.getDepositoMaster('D001')).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  // ========================================
  // INTEGRAÇÃO COM CACHE
  // ========================================
  describe('Integração com Cache', () => {
    it('deve retornar dados do cache em cache hit', async () => {
      const cachedData = [
        {
          codigo: 'D001',
          nome: 'Test',
          consSaldo: 1,
          alocado: 1,
          permissao1: '',
          permissao2: '',
          permissao3: '',
          indAcabado: 1,
          indTipoDep: 1,
          indProcesso: 0,
          nomeAbrev: '',
          indDispSaldo: 1,
          indDepCq: 0,
          indDepRej: 0,
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
          logReciclagem: 0,
          logOrdensMrp: 0,
          logGeraWms: 0,
          logAlocaQtdWms: 0,
          logOrigExt: 0,
          logEmsExterno: 0,
          logAlocalSaldoWmsExt: 0,
        },
      ];

      (QueryCacheService.withDepositoCache as jest.Mock).mockResolvedValue(cachedData);

      const result = await DepositoInformacoesGeraisRepository.getDepositoMaster('D001');

      expect(result).toEqual(cachedData[0]);
      expect(DatabaseManager.queryEmpWithParams).not.toHaveBeenCalled();
    });

    it('deve buscar do banco em cache miss', async () => {
      const dbData = [
        {
          codigo: 'D001',
          nome: 'Test',
          consSaldo: 1,
          alocado: 1,
          permissao1: '',
          permissao2: '',
          permissao3: '',
          indAcabado: 1,
          indTipoDep: 1,
          indProcesso: 0,
          nomeAbrev: '',
          indDispSaldo: 1,
          indDepCq: 0,
          indDepRej: 0,
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
          logReciclagem: 0,
          logOrdensMrp: 0,
          logGeraWms: 0,
          logAlocaQtdWms: 0,
          logOrigExt: 0,
          logEmsExterno: 0,
          logAlocalSaldoWmsExt: 0,
        },
      ];

      (QueryCacheService.withDepositoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(dbData);

      const result = await DepositoInformacoesGeraisRepository.getDepositoMaster('D001');

      expect(result).toEqual(dbData[0]);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledTimes(1);
    });
  });
});
