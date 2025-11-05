// src/familia/dadosCadastrais/informacoesGerais/__tests__/repository.test.ts

import { FamiliaInformacoesGeraisRepository } from '../repository';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/cache/QueryCacheService');

describe('Repository - FamiliaInformacoesGeraisRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // getFamiliaMaster
  // ========================================
  describe('getFamiliaMaster', () => {
    it('deve retornar dados da família quando encontrada', async () => {
      const mockResult = [
        {
          familiaCodigo: 'F001',
          familiaDescricao: 'Válvulas e Conexões',
        },
      ];

      (QueryCacheService.withFamiliaCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await FamiliaInformacoesGeraisRepository.getFamiliaMaster('F001');

      expect(result).toEqual(mockResult[0]);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledTimes(1);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledWith(
        expect.stringContaining('OPENQUERY'),
        expect.arrayContaining([
          expect.objectContaining({
            name: 'paramfamiliaCodigo',
            value: 'F001',
          }),
        ])
      );
    });

    it('deve retornar null quando família não encontrada', async () => {
      (QueryCacheService.withFamiliaCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const result = await FamiliaInformacoesGeraisRepository.getFamiliaMaster('INEXISTENTE');

      expect(result).toBeNull();
    });

    it('deve usar queries parametrizadas (proteção SQL Injection)', async () => {
      const maliciousCode = "'; DROP TABLE familia;--";

      (QueryCacheService.withFamiliaCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await FamiliaInformacoesGeraisRepository.getFamiliaMaster(maliciousCode);

      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            name: 'paramfamiliaCodigo',
            value: maliciousCode,
          }),
        ])
      );
    });

    it('deve usar cache L1/L2', async () => {
      const mockResult = [
        {
          familiaCodigo: 'F001',
          familiaDescricao: 'Test',
        },
      ];

      (QueryCacheService.withFamiliaCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      await FamiliaInformacoesGeraisRepository.getFamiliaMaster('F001');

      expect(QueryCacheService.withFamiliaCache).toHaveBeenCalledTimes(1);
      expect(QueryCacheService.withFamiliaCache).toHaveBeenCalledWith(
        expect.stringContaining('OPENQUERY'),
        expect.any(Array),
        expect.any(Function)
      );
    });

    it('deve propagar erros do banco de dados', async () => {
      const dbError = new Error('Conexão perdida');

      (QueryCacheService.withFamiliaCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(dbError);

      await expect(FamiliaInformacoesGeraisRepository.getFamiliaMaster('F001')).rejects.toThrow(
        'Conexão perdida'
      );
    });

    it('deve construir query OPENQUERY correta para Progress', async () => {
      (QueryCacheService.withFamiliaCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await FamiliaInformacoesGeraisRepository.getFamiliaMaster('F001');

      const [query] = (DatabaseManager.queryEmpWithParams as jest.Mock).mock.calls[0];

      expect(query).toContain('DECLARE @familiaCodigo varchar(16)');
      expect(query).toContain('PRD_EMS2EMP');
      expect(query).toContain('pub.familia');
      expect(query).toContain('fm-codigo');
      expect(query).toContain('descricao');
      expect(query).toContain('EXEC sp_executesql');
    });
  });

  // ========================================
  // invalidateCache
  // ========================================
  describe('invalidateCache', () => {
    it('deve invalidar cache de família', async () => {
      (QueryCacheService.invalidateMultiple as jest.Mock).mockResolvedValue(undefined);

      await FamiliaInformacoesGeraisRepository.invalidateCache('F001');

      expect(QueryCacheService.invalidateMultiple).toHaveBeenCalledTimes(1);
      expect(QueryCacheService.invalidateMultiple).toHaveBeenCalledWith(['familia:*']);
    });
  });

  // ========================================
  // CENÁRIOS DE ERRO
  // ========================================
  describe('Tratamento de Erros', () => {
    it('deve tratar timeout do banco de dados', async () => {
      const timeoutError = new Error('Timeout: Request failed to complete');

      (QueryCacheService.withFamiliaCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(timeoutError);

      await expect(FamiliaInformacoesGeraisRepository.getFamiliaMaster('F001')).rejects.toThrow(
        'Timeout'
      );
    });

    it('deve tratar erro de conexão perdida', async () => {
      const connectionError = new Error('ECONNREFUSED');

      (QueryCacheService.withFamiliaCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(connectionError);

      await expect(FamiliaInformacoesGeraisRepository.getFamiliaMaster('F001')).rejects.toThrow(
        'ECONNREFUSED'
      );
    });

    it('deve tratar erro de sintaxe SQL', async () => {
      const sqlError = new Error('Incorrect syntax near');

      (QueryCacheService.withFamiliaCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(sqlError);

      await expect(FamiliaInformacoesGeraisRepository.getFamiliaMaster('F001')).rejects.toThrow(
        'Incorrect syntax'
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
          familiaCodigo: 'F001',
          familiaDescricao: 'Test',
        },
      ];

      (QueryCacheService.withFamiliaCache as jest.Mock).mockResolvedValue(cachedData);

      const result = await FamiliaInformacoesGeraisRepository.getFamiliaMaster('F001');

      expect(result).toEqual(cachedData[0]);
      expect(DatabaseManager.queryEmpWithParams).not.toHaveBeenCalled();
    });

    it('deve buscar do banco em cache miss', async () => {
      const dbData = [
        {
          familiaCodigo: 'F001',
          familiaDescricao: 'Test',
        },
      ];

      (QueryCacheService.withFamiliaCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(dbData);

      const result = await FamiliaInformacoesGeraisRepository.getFamiliaMaster('F001');

      expect(result).toEqual(dbData[0]);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledTimes(1);
    });
  });
});
