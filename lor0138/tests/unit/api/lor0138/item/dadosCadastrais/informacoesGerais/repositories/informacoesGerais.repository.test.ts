// tests/unit/repositories/informacoesGerais.repository.test.ts

import { ItemInformacoesGeraisRepository } from '../../../../../../../../src/api/lor0138/item/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository';
import { DatabaseManager } from '../../../../../../../../src/infrastructure/database/DatabaseManager';
import { QueryCacheService } from '../../../../../../../../src/shared/utils/cache/QueryCacheService';
import { 
  createItemMasterQueryResult, 
  createItemEstabQueryResult 
} from '../../../../../../../factories/item.factory';

// Mock do DatabaseManager
jest.mock('@infrastructure/database/DatabaseManager');

// Mock do QueryCacheService
jest.mock('@shared/utils/cache/QueryCacheService');

describe('Repository - ItemInformacoesGeraisRepository', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // getItemMaster
  // ========================================
  describe('getItemMaster', () => {
    
    it('deve retornar dados do item quando encontrado', async () => {
      const mockResult = [createItemMasterQueryResult()];
      
      // Mock do cache retornando o resultado da query
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      expect(result).toEqual(mockResult[0]);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledTimes(1);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledWith(
        expect.stringContaining('OPENQUERY'),
        expect.arrayContaining([
          expect.objectContaining({ 
            name: 'paramItemCodigo', 
            value: '7530110' 
          })
        ])
      );
    });

    it('deve retornar null quando item não encontrado', async () => {
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const result = await ItemInformacoesGeraisRepository.getItemMaster('INEXISTENTE');

      expect(result).toBeNull();
    });

    it('deve usar queries parametrizadas (proteção SQL Injection)', async () => {
      const maliciousCode = "'; DROP TABLE item;--";
      
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemInformacoesGeraisRepository.getItemMaster(maliciousCode);

      // Verifica que usa parâmetros, não concatenação de string
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ 
            name: 'paramItemCodigo', 
            value: maliciousCode 
          })
        ])
      );
    });

    it('deve usar cache L1/L2', async () => {
      const mockResult = [createItemMasterQueryResult()];
      
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      expect(QueryCacheService.withItemCache).toHaveBeenCalledTimes(1);
      expect(QueryCacheService.withItemCache).toHaveBeenCalledWith(
        expect.stringContaining('OPENQUERY'),
        expect.any(Array),
        expect.any(Function)
      );
    });

    it('deve propagar erros do banco de dados', async () => {
      const dbError = new Error('Conexão perdida');
      
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(dbError);

      await expect(
        ItemInformacoesGeraisRepository.getItemMaster('7530110')
      ).rejects.toThrow('Conexão perdida');
    });

    it('deve construir query OPENQUERY correta para Progress', async () => {
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      const [query] = (DatabaseManager.queryEmpWithParams as jest.Mock).mock.calls[0];
      
      // Valida estrutura da query
      expect(query).toContain('DECLARE @itemCodigo varchar(16)');
      expect(query).toContain('OPENQUERY(PRD_EMS2EMP');
      expect(query).toContain('pub.item');
      expect(query).toContain('it-codigo');
      expect(query).toContain('desc-item');
      expect(query).toContain('EXEC sp_executesql');
    });

  });

  // ========================================
  // getItemEstabelecimentos
  // ========================================
  describe('getItemEstabelecimentos', () => {
    
    it('deve retornar estabelecimentos do item', async () => {
      const mockResult = [
        createItemEstabQueryResult(),
        createItemEstabQueryResult({ estabCodigo: '02.01', estabNome: 'Fábrica' })
      ];
      
      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await ItemInformacoesGeraisRepository.getItemEstabelecimentos('7530110');

      expect(result).toEqual(mockResult);
      expect(result).toHaveLength(2);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledTimes(1);
    });

    it('deve retornar array vazio quando não há estabelecimentos', async () => {
      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const result = await ItemInformacoesGeraisRepository.getItemEstabelecimentos('7530110');

      expect(result).toEqual([]);
    });

    it('deve usar cache específico de estabelecimentos', async () => {
      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemInformacoesGeraisRepository.getItemEstabelecimentos('7530110');

      expect(QueryCacheService.withEstabelecimentoCache).toHaveBeenCalledTimes(1);
    });

    it('deve fazer JOIN com dois Linked Servers (EMP + MULT)', async () => {
      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemInformacoesGeraisRepository.getItemEstabelecimentos('7530110');

      const [query] = (DatabaseManager.queryEmpWithParams as jest.Mock).mock.calls[0];
      
      // Valida JOIN entre PRD_EMS2EMP e PRD_EMS2MULT
      expect(query).toContain('OPENQUERY(PRD_EMS2EMP');
      expect(query).toContain('OPENQUERY(PRD_EMS2MULT');
      expect(query).toContain('item-uni-estab');
      expect(query).toContain('estabelec');
      expect(query).toContain('LEFT JOIN');
    });

    it('deve usar parâmetros em ambas as queries OPENQUERY', async () => {
      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemInformacoesGeraisRepository.getItemEstabelecimentos('7530110');

      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ name: 'paramItemCodigo' })
        ])
      );
    });

    it('deve retornar campos corretos do resultado', async () => {
      const mockResult = [createItemEstabQueryResult()];
      
      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await ItemInformacoesGeraisRepository.getItemEstabelecimentos('7530110');

      expect(result[0]).toHaveProperty('itemCodigo');
      expect(result[0]).toHaveProperty('estabCodigo');
      expect(result[0]).toHaveProperty('estabNome');
      expect(result[0]).toHaveProperty('codObsoleto');
    });

  });

  // ========================================
  // invalidateCache
  // ========================================
  describe('invalidateCache', () => {
    
    it('deve invalidar cache de item e estabelecimento', async () => {
      (QueryCacheService.invalidateMultiple as jest.Mock).mockResolvedValue(undefined);

      await ItemInformacoesGeraisRepository.invalidateCache('7530110');

      expect(QueryCacheService.invalidateMultiple).toHaveBeenCalledTimes(1);
      expect(QueryCacheService.invalidateMultiple).toHaveBeenCalledWith([
        'item:*',
        'estabelecimento:*'
      ]);
    });

    it('deve logar invalidação de cache', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      (QueryCacheService.invalidateMultiple as jest.Mock).mockResolvedValue(undefined);

      await ItemInformacoesGeraisRepository.invalidateCache('7530110');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Cache invalidado para item:',
        '7530110'
      );

      consoleLogSpy.mockRestore();
    });

  });

  // ========================================
  // CENÁRIOS DE ERRO
  // ========================================
  describe('Tratamento de Erros', () => {
    
    it('deve tratar timeout do banco de dados', async () => {
      const timeoutError = new Error('Timeout: Request failed to complete');
      
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(timeoutError);

      await expect(
        ItemInformacoesGeraisRepository.getItemMaster('7530110')
      ).rejects.toThrow('Timeout');
    });

    it('deve tratar erro de conexão perdida', async () => {
      const connectionError = new Error('ECONNREFUSED');
      
      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(connectionError);

      await expect(
        ItemInformacoesGeraisRepository.getItemEstabelecimentos('7530110')
      ).rejects.toThrow('ECONNREFUSED');
    });

    it('deve tratar erro de sintaxe SQL', async () => {
      const sqlError = new Error('Incorrect syntax near');
      
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(sqlError);

      await expect(
        ItemInformacoesGeraisRepository.getItemMaster('7530110')
      ).rejects.toThrow('Incorrect syntax');
    });

  });

  // ========================================
  // INTEGRAÇÃO COM CACHE
  // ========================================
  describe('Integração com Cache', () => {
    
    it('deve retornar dados do cache em cache hit', async () => {
      const cachedData = [createItemMasterQueryResult()];
      
      // Mock cache retornando dados diretamente (cache hit)
      (QueryCacheService.withItemCache as jest.Mock).mockResolvedValue(cachedData);

      const result = await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      expect(result).toEqual(cachedData[0]);
      // Não deve chamar o banco em cache hit
      expect(DatabaseManager.queryEmpWithParams).not.toHaveBeenCalled();
    });

    it('deve buscar do banco em cache miss', async () => {
      const dbData = [createItemMasterQueryResult()];
      
      // Mock cache executando a função (cache miss)
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(dbData);

      const result = await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      expect(result).toEqual(dbData[0]);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledTimes(1);
    });

    it('deve usar TTL diferente para item e estabelecimento', async () => {
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
      
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemInformacoesGeraisRepository.getItemMaster('7530110');
      await ItemInformacoesGeraisRepository.getItemEstabelecimentos('7530110');

      // Verifica que usa caches diferentes
      expect(QueryCacheService.withItemCache).toHaveBeenCalledTimes(1);
      expect(QueryCacheService.withEstabelecimentoCache).toHaveBeenCalledTimes(1);
    });

  });

});