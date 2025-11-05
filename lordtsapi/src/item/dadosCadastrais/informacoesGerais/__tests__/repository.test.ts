// src/item/dadosCadastrais/informacoesGerais/__tests__/repository.test.ts

import { ItemInformacoesGeraisRepository } from '../repository';
import { DatabaseManager } from '@infrastructure/database/DatabaseManager';
import { QueryCacheService } from '@shared/utils/cache/QueryCacheService';
import {
  createItemMasterQueryResult,
  createItemEstabQueryResult,
  createFamiliaData,
  createFamiliaComercialData,
  createGrupoDeEstoqueData,
  createEstabelecimentoData,
  createItemComTodosOsCampos,
  createItemSemCamposOpcionais,
  createItemComStatus,
} from '@tests/factories/item.factory';

// Mock dos repositories relacionados
import { FamiliaInformacoesGeraisRepository } from '@/familia/dadosCadastrais/informacoesGerais/repository';
import { FamiliaComercialInformacoesGeraisRepository } from '@/familiaComercial/dadosCadastrais/informacoesGerais/repository';
import { GrupoDeEstoqueInformacoesGeraisRepository } from '@/grupoDeEstoque/dadosCadastrais/informacoesGerais/repository';
import { EstabelecimentoInformacoesGeraisRepository } from '@/estabelecimento/dadosCadastrais/informacoesGerais/repository';

jest.mock('@infrastructure/database/DatabaseManager');
jest.mock('@shared/utils/cache/QueryCacheService');
jest.mock('@/familia/dadosCadastrais/informacoesGerais/repository');
jest.mock('@/familiaComercial/dadosCadastrais/informacoesGerais/repository');
jest.mock('@/grupoDeEstoque/dadosCadastrais/informacoesGerais/repository');
jest.mock('@/estabelecimento/dadosCadastrais/informacoesGerais/repository');

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

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      expect(result).toEqual(mockResult[0]);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledTimes(1);
    });

    it('deve retornar null quando item não encontrado', async () => {
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const result = await ItemInformacoesGeraisRepository.getItemMaster('INEXISTENTE');

      expect(result).toBeNull();
    });

    it('deve retornar todos os novos campos', async () => {
      const mockResult = [createItemComTodosOsCampos()];

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      // Campos básicos
      expect(result).toHaveProperty('itemCodigo');
      expect(result).toHaveProperty('itemDescricao');
      expect(result).toHaveProperty('itemUnidade');

      // Novos campos
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('estabelecimentoPadraoCodigo');
      expect(result).toHaveProperty('dataImplantacao');
      expect(result).toHaveProperty('dataLiberacao');
      expect(result).toHaveProperty('dataObsolescencia');
      expect(result).toHaveProperty('endereco');
      expect(result).toHaveProperty('descricaoResumida');
      expect(result).toHaveProperty('descricaoAlternativa');
      expect(result).toHaveProperty('contenedorCodigo');
      expect(result).toHaveProperty('contenedorDescricao');
    });

    it('deve retornar item com campos opcionais null', async () => {
      const mockResult = [createItemSemCamposOpcionais()];

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      expect(result!.endereco).toBeNull();
      expect(result!.descricaoResumida).toBeNull();
      expect(result!.descricaoAlternativa).toBeNull();
      expect(result!.contenedorCodigo).toBeNull();
      expect(result!.contenedorDescricao).toBeNull();
    });

    it('deve retornar status formatado corretamente', async () => {
      const mockResultAtivo = [createItemComStatus('Ativo')];

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResultAtivo);

      const result = await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      expect(result!.status).toBe('Ativo');
    });

    it('deve retornar datas formatadas em PT-BR', async () => {
      const mockResult = [createItemComTodosOsCampos()];

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      // Valida formato DD/MM/YYYY
      expect(result!.dataImplantacao).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(result!.dataLiberacao).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('deve usar queries parametrizadas (proteção SQL Injection)', async () => {
      const maliciousCode = "'; DROP TABLE item;--";

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemInformacoesGeraisRepository.getItemMaster(maliciousCode);

      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            name: 'paramItemCodigo',
            value: maliciousCode,
          }),
        ])
      );
    });

    it('deve usar cache L1/L2', async () => {
      const mockResult = [createItemMasterQueryResult()];

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      expect(QueryCacheService.withItemCache).toHaveBeenCalledTimes(1);
    });

    it('deve construir query OPENQUERY correta para Progress', async () => {
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      const [query] = (DatabaseManager.queryEmpWithParams as jest.Mock).mock.calls[0];

      // Valida estrutura da query
      expect(query).toContain('DECLARE @itemCodigo varchar(16)');
      expect(query).toContain('PRD_EMS2EMP');
      expect(query).toContain('PRD_EMS2ESP');
      expect(query).toContain('pub.item');
      expect(query).toContain('PUB."ext-item"');
      expect(query).toContain('CHOOSE');
      expect(query).toContain('CONVERT(VARCHAR(10)');
      expect(query).toContain('EXEC sp_executesql');
    });

    it('deve fazer JOIN com tabela de contenedor', async () => {
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      const [query] = (DatabaseManager.queryEmpWithParams as jest.Mock).mock.calls[0];

      expect(query).toContain('PUB."es-tipo-contenedor"');
      // Aceita LEFT OUTER JOIN com qualquer quantidade de espaços
      expect(query.replace(/\s+/g, ' ')).toContain('LEFT OUTER JOIN');
    });
  });

  // ========================================
  // getItemEstabelecimentos
  // ========================================
  describe('getItemEstabelecimentos', () => {
    it('deve retornar estabelecimentos do item', async () => {
      const mockResult = [
        createItemEstabQueryResult(),
        createItemEstabQueryResult({
          estabelecimentoCodigo: '02.01',
          estabelecimentoNome: 'Fábrica',
        }),
      ];

      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(mockResult);

      const result = await ItemInformacoesGeraisRepository.getItemEstabelecimentos('7530110');

      expect(result).toEqual(mockResult);
      expect(result).toHaveLength(2);
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

    it('deve fazer JOIN entre duas queries OPENQUERY', async () => {
      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemInformacoesGeraisRepository.getItemEstabelecimentos('7530110');

      const [query] = (DatabaseManager.queryEmpWithParams as jest.Mock).mock.calls[0];

      expect(query).toContain('PRD_EMS2EMP');
      expect(query).toContain('PRD_EMS2MULT');
      expect(query).toContain('item-uni-estab');
      expect(query).toContain('estabelec');
      expect(query).toContain('INNER JOIN');
    });
  });

  // ========================================
  // getItemCompleto (NOVO MÉTODO)
  // ========================================
  describe('getItemCompleto', () => {
    beforeEach(() => {
      // Setup padrão para os mocks
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );
      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );
    });

    it('deve buscar todos os dados em paralelo', async () => {
      const mockItem = createItemMasterQueryResult();
      const mockEstabs = [createItemEstabQueryResult()];
      const mockFamilia = createFamiliaData();
      const mockFamiliaComercial = createFamiliaComercialData();
      const mockGrupoEstoque = createGrupoDeEstoqueData();
      const mockEstabelecimento = createEstabelecimentoData();

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([mockItem]);

      // Mock dos estabelecimentos
      (DatabaseManager.queryEmpWithParams as jest.Mock)
        .mockResolvedValueOnce([mockItem])
        .mockResolvedValueOnce(mockEstabs);

      // Mock dos repositories relacionados
      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock).mockResolvedValue(
        mockFamilia
      );
      (
        FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster as jest.Mock
      ).mockResolvedValue(mockFamiliaComercial);
      (
        GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster as jest.Mock
      ).mockResolvedValue(mockGrupoEstoque);
      (
        EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster as jest.Mock
      ).mockResolvedValue(mockEstabelecimento);

      const result = await ItemInformacoesGeraisRepository.getItemCompleto('7530110');

      expect(result).toHaveProperty('item');
      expect(result).toHaveProperty('familia');
      expect(result).toHaveProperty('familiaComercial');
      expect(result).toHaveProperty('grupoDeEstoque');
      expect(result).toHaveProperty('estabelecimentos');
    });

    it('deve retornar null para relacionamentos quando item não existe', async () => {
      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      const result = await ItemInformacoesGeraisRepository.getItemCompleto('INEXISTENTE');

      expect(result!.item).toBeNull();
      expect(result!.familia).toBeNull();
      expect(result!.familiaComercial).toBeNull();
      expect(result!.grupoDeEstoque).toBeNull();
      expect(result!.estabelecimentos).toEqual([]);
    });

    it('deve tratar código de família null/undefined', async () => {
      const mockItem = createItemMasterQueryResult({ familiaCodigo: null });
      (DatabaseManager.queryEmpWithParams as jest.Mock)
        .mockResolvedValueOnce([mockItem])
        .mockResolvedValueOnce([]);

      const result = await ItemInformacoesGeraisRepository.getItemCompleto('7530110');

      expect(result!.familia).toBeNull();
      expect(FamiliaInformacoesGeraisRepository.getFamiliaMaster).not.toHaveBeenCalled();
    });

    it('deve tratar código de família comercial vazio', async () => {
      const mockItem = createItemMasterQueryResult({ familiaComercialCodigo: '' });
      (DatabaseManager.queryEmpWithParams as jest.Mock)
        .mockResolvedValueOnce([mockItem])
        .mockResolvedValueOnce([]);

      const result = await ItemInformacoesGeraisRepository.getItemCompleto('7530110');

      expect(result!.familiaComercial).toBeNull();
      expect(
        FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster
      ).not.toHaveBeenCalled();
    });

    it('deve enriquecer estabelecimentos com dados completos', async () => {
      const mockItem = createItemMasterQueryResult();
      const mockEstabs = [
        createItemEstabQueryResult({ estabelecimentoCodigo: '01.01' }),
        createItemEstabQueryResult({ estabelecimentoCodigo: '02.01' }),
      ];
      const mockEstabCompleto = createEstabelecimentoData();

      (DatabaseManager.queryEmpWithParams as jest.Mock)
        .mockResolvedValueOnce([mockItem])
        .mockResolvedValueOnce(mockEstabs);

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock).mockResolvedValue(null);
      (
        FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster as jest.Mock
      ).mockResolvedValue(null);
      (
        GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster as jest.Mock
      ).mockResolvedValue(null);
      (
        EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster as jest.Mock
      ).mockResolvedValue(mockEstabCompleto);

      const result = await ItemInformacoesGeraisRepository.getItemCompleto('7530110');

      expect(result!.estabelecimentos).toHaveLength(2);
      expect(result!.estabelecimentos[0]).toHaveProperty('codigo');
      expect(result!.estabelecimentos[0]).toHaveProperty('nome');
    });

    it('deve limitar estabelecimentos a 50 itens', async () => {
      const mockItem = createItemMasterQueryResult();
      const mockEstabs = Array.from({ length: 100 }, (_, i) =>
        createItemEstabQueryResult({ estabelecimentoCodigo: `${i + 1}.01` })
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock)
        .mockResolvedValueOnce([mockItem])
        .mockResolvedValueOnce(mockEstabs);

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock).mockResolvedValue(null);
      (
        FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster as jest.Mock
      ).mockResolvedValue(null);
      (
        GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster as jest.Mock
      ).mockResolvedValue(null);
      (
        EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster as jest.Mock
      ).mockResolvedValue(createEstabelecimentoData());

      const result = await ItemInformacoesGeraisRepository.getItemCompleto('7530110');

      expect(result!.estabelecimentos).toHaveLength(50);
    });

    it('deve tratar erro ao buscar estabelecimento individual', async () => {
      const mockItem = createItemMasterQueryResult();
      const mockEstabs = [createItemEstabQueryResult()];

      (DatabaseManager.queryEmpWithParams as jest.Mock)
        .mockResolvedValueOnce([mockItem])
        .mockResolvedValueOnce(mockEstabs);

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock).mockResolvedValue(null);
      (
        FamiliaComercialInformacoesGeraisRepository.getFamiliaComercialMaster as jest.Mock
      ).mockResolvedValue(null);
      (
        GrupoDeEstoqueInformacoesGeraisRepository.getGrupoDeEstoqueMaster as jest.Mock
      ).mockResolvedValue(null);
      (
        EstabelecimentoInformacoesGeraisRepository.getEstabelecimentoMaster as jest.Mock
      ).mockRejectedValue(new Error('Erro ao buscar'));

      const result = await ItemInformacoesGeraisRepository.getItemCompleto('7530110');

      expect(result!.estabelecimentos[0].nome).toBe('Erro ao carregar');
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
        'estabelecimento:*',
      ]);
    });
  });

  // ========================================
  // CENÁRIOS DE ERRO
  // ========================================
  describe('Tratamento de Erros', () => {
    it('deve propagar erros do banco de dados', async () => {
      const dbError = new Error('Conexão perdida');

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(dbError);

      await expect(ItemInformacoesGeraisRepository.getItemMaster('7530110')).rejects.toThrow(
        'Conexão perdida'
      );
    });

    it('deve tratar timeout do banco de dados', async () => {
      const timeoutError = new Error('Timeout: Request failed to complete');

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(timeoutError);

      await expect(ItemInformacoesGeraisRepository.getItemMaster('7530110')).rejects.toThrow(
        'Timeout'
      );
    });

    it('deve tratar erro de sintaxe SQL', async () => {
      const sqlError = new Error('Incorrect syntax near');

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockRejectedValue(sqlError);

      await expect(ItemInformacoesGeraisRepository.getItemMaster('7530110')).rejects.toThrow(
        'Incorrect syntax'
      );
    });
  });

  // ========================================
  // INTEGRAÇÃO COM CACHE
  // ========================================
  describe('Integração com Cache', () => {
    it('deve retornar dados do cache em cache hit', async () => {
      const cachedData = [createItemMasterQueryResult()];

      (QueryCacheService.withItemCache as jest.Mock).mockResolvedValue(cachedData);

      const result = await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      expect(result).toEqual(cachedData[0]);
      expect(DatabaseManager.queryEmpWithParams).not.toHaveBeenCalled();
    });

    it('deve buscar do banco em cache miss', async () => {
      const dbData = [createItemMasterQueryResult()];

      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue(dbData);

      const result = await ItemInformacoesGeraisRepository.getItemMaster('7530110');

      expect(result).toEqual(dbData[0]);
      expect(DatabaseManager.queryEmpWithParams).toHaveBeenCalledTimes(1);
    });

    it('deve usar TTL diferente para item e estabelecimento', async () => {
      (QueryCacheService.withItemCache as jest.Mock).mockImplementation(async (query, params, fn) =>
        fn()
      );

      (QueryCacheService.withEstabelecimentoCache as jest.Mock).mockImplementation(
        async (query, params, fn) => fn()
      );

      (DatabaseManager.queryEmpWithParams as jest.Mock).mockResolvedValue([]);

      await ItemInformacoesGeraisRepository.getItemMaster('7530110');
      await ItemInformacoesGeraisRepository.getItemEstabelecimentos('7530110');

      expect(QueryCacheService.withItemCache).toHaveBeenCalledTimes(1);
      expect(QueryCacheService.withEstabelecimentoCache).toHaveBeenCalledTimes(1);
    });
  });
});
