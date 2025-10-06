// tests/unit/services/informacoesGerais.service.test.ts

import { InformacoesGeraisService } from '@api/lor0138/item/dadosCadastrais/informacoesGerais/service/informacoesGerais.service';
import { ItemInformacoesGeraisRepository } from '@api/lor0138/item/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository';
import { ItemNotFoundError, DatabaseError } from '@shared/errors/CustomErrors';
import { 
  createItemMasterQueryResult, 
  createItemEstabQueryResult,
  createInformacoesGerais
} from '../../factories/item.factory';

// Mock do Repository
jest.mock('@api/lor0138/item/dadosCadastrais/informacoesGerais/repository/informacoesGerais.repository');

// Mock do logger
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Service - InformacoesGeraisService', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // CASOS DE SUCESSO
  // ========================================
  describe('getInformacoesGerais - Sucesso', () => {
    
    it('deve retornar informações completas do item', async () => {
      const mockItem = createItemMasterQueryResult();
      const mockEstabs = [
        createItemEstabQueryResult(),
        createItemEstabQueryResult({ estabCodigo: '02.01', codObsoleto: 1 })
      ];

      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockResolvedValue(mockEstabs);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result).toBeDefined();
      expect(result.identificacaoItemCodigo).toBe('7530110');
      expect(result.identificacaoItemDescricao).toBe('VALVULA DE ESFERA 1/2" BRONZE');
      expect(result.identificacaoItemUnidade).toBe('UN');
      expect(result.identificacaoItensEstabelecimentos).toHaveLength(2);
    });

    it('deve transformar dados do repository para DTO de resposta', async () => {
      const mockItem = createItemMasterQueryResult();
      const mockEstabs = [createItemEstabQueryResult()];

      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockResolvedValue(mockEstabs);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      // Valida mapeamento de campos
      expect(result).toHaveProperty('identificacaoItemCodigo');
      expect(result).toHaveProperty('identificacaoItemDescricao');
      expect(result).toHaveProperty('identificacaoItemUnidade');
      expect(result).toHaveProperty('identificacaoItensEstabelecimentos');
    });

    it('deve calcular statusIndex corretamente (0 = ativo)', async () => {
      const mockItem = createItemMasterQueryResult();
      const mockEstabs = [
        createItemEstabQueryResult({ codObsoleto: 0 }) // Ativo
      ];

      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockResolvedValue(mockEstabs);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.identificacaoItensEstabelecimentos[0].statusIndex).toBe(1);
    });

    it('deve calcular statusIndex corretamente (1+ = inativo)', async () => {
      const mockItem = createItemMasterQueryResult();
      const mockEstabs = [
        createItemEstabQueryResult({ codObsoleto: 1 }), // Inativo
        createItemEstabQueryResult({ codObsoleto: 2 }), // Inativo
        createItemEstabQueryResult({ codObsoleto: 99 }) // Inativo
      ];

      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockResolvedValue(mockEstabs);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.identificacaoItensEstabelecimentos[0].statusIndex).toBe(2);
      expect(result.identificacaoItensEstabelecimentos[1].statusIndex).toBe(2);
      expect(result.identificacaoItensEstabelecimentos[2].statusIndex).toBe(2);
    });

    it('deve retornar item com array vazio de estabelecimentos', async () => {
      const mockItem = createItemMasterQueryResult();

      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockResolvedValue([]);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.identificacaoItensEstabelecimentos).toEqual([]);
    });

    it('deve mapear todos os campos do estabelecimento', async () => {
      const mockItem = createItemMasterQueryResult();
      const mockEstabs = [createItemEstabQueryResult({
        itemCodigo: '7530110',
        estabCodigo: '01.01',
        estabNome: 'CD São Paulo',
        codObsoleto: 0
      })];

      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockResolvedValue(mockEstabs);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      const estab = result.identificacaoItensEstabelecimentos[0];
      expect(estab.itemCodigo).toBe('7530110');
      expect(estab.estabCodigo).toBe('01.01');
      expect(estab.estabNome).toBe('CD São Paulo');
      expect(estab.statusIndex).toBe(1);
    });

  });

  // ========================================
  // ITEM NÃO ENCONTRADO
  // ========================================
  describe('getInformacoesGerais - Item Não Encontrado', () => {
    
    it('deve lançar ItemNotFoundError quando item não existe', async () => {
      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(null);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('INEXISTENTE')
      ).rejects.toThrow(ItemNotFoundError);
    });

    it('deve incluir código do item na mensagem de erro', async () => {
      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(null);

      try {
        await InformacoesGeraisService.getInformacoesGerais('ABC123');
        fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(ItemNotFoundError);
        expect((error as ItemNotFoundError).message).toContain('ABC123');
      }
    });

    it('deve logar quando item não é encontrado', async () => {
      const { log } = require('@shared/utils/logger');
      
      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(null);

      try {
        await InformacoesGeraisService.getInformacoesGerais('7530110');
      } catch (error) {
        // Esperado
      }

      expect(log.info).toHaveBeenCalledWith(
        'Item não encontrado',
        { itemCodigo: '7530110' }
      );
    });

  });

  // ========================================
  // TRATAMENTO DE ERROS
  // ========================================
  describe('getInformacoesGerais - Tratamento de Erros', () => {
    
    it('deve re-lançar ItemNotFoundError sem conversão', async () => {
      const notFoundError = new ItemNotFoundError('7530110');
      
      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockRejectedValue(notFoundError);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('7530110')
      ).rejects.toThrow(ItemNotFoundError);
    });

    it('deve converter erros de banco em DatabaseError', async () => {
      const dbError = new Error('Conexão perdida');
      
      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockRejectedValue(dbError);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('7530110')
      ).rejects.toThrow(DatabaseError);
    });

    it('deve incluir erro original em DatabaseError', async () => {
      const originalError = new Error('Timeout SQL');
      
      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockRejectedValue(originalError);

      try {
        await InformacoesGeraisService.getInformacoesGerais('7530110');
        fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).message).toContain('Falha ao buscar');
      }
    });

    it('deve logar erros de banco', async () => {
      const { log } = require('@shared/utils/logger');
      const dbError = new Error('Erro SQL');
      
      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockRejectedValue(dbError);

      try {
        await InformacoesGeraisService.getInformacoesGerais('7530110');
      } catch (error) {
        // Esperado
      }

      expect(log.error).toHaveBeenCalledWith(
        'Erro ao buscar informações gerais',
        expect.objectContaining({
          itemCodigo: '7530110',
          error: 'Erro SQL'
        })
      );
    });

    it('deve tratar erro na busca de estabelecimentos', async () => {
      const mockItem = createItemMasterQueryResult();
      const estabError = new Error('Erro ao buscar estabelecimentos');

      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockRejectedValue(estabError);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('7530110')
      ).rejects.toThrow(DatabaseError);
    });

  });

  // ========================================
  // INTEGRAÇÃO COM REPOSITORY
  // ========================================
  describe('Integração com Repository', () => {
    
    it('deve chamar getItemMaster com código correto', async () => {
      const mockItem = createItemMasterQueryResult();
      
      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockResolvedValue([]);

      await InformacoesGeraisService.getInformacoesGerais('ABC123');

      expect(ItemInformacoesGeraisRepository.getItemMaster).toHaveBeenCalledWith('ABC123');
    });

    it('deve chamar getItemEstabelecimentos com código correto', async () => {
      const mockItem = createItemMasterQueryResult();
      
      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockResolvedValue([]);

      await InformacoesGeraisService.getInformacoesGerais('ABC123');

      expect(ItemInformacoesGeraisRepository.getItemEstabelecimentos).toHaveBeenCalledWith('ABC123');
    });

    it('deve chamar Repository na ordem correta (master → estabelecimentos)', async () => {
      const mockItem = createItemMasterQueryResult();
      const callOrder: string[] = [];

      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockImplementation(async () => {
        callOrder.push('master');
        return mockItem;
      });

      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockImplementation(async () => {
        callOrder.push('estabelecimentos');
        return [];
      });

      await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(callOrder).toEqual(['master', 'estabelecimentos']);
    });

    it('não deve buscar estabelecimentos se item não existe', async () => {
      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(null);

      try {
        await InformacoesGeraisService.getInformacoesGerais('7530110');
      } catch (error) {
        // Esperado
      }

      expect(ItemInformacoesGeraisRepository.getItemEstabelecimentos).not.toHaveBeenCalled();
    });

  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    
    it('deve tratar item com descrição vazia', async () => {
      const mockItem = createItemMasterQueryResult({ itemDescricao: '' });
      
      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockResolvedValue([]);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.identificacaoItemDescricao).toBe('');
    });

    it('deve tratar múltiplos estabelecimentos (10+)', async () => {
      const mockItem = createItemMasterQueryResult();
      const mockEstabs = Array.from({ length: 15 }, (_, i) => 
        createItemEstabQueryResult({ 
          estabCodigo: `0${i + 1}.01`,
          codObsoleto: i % 2 
        })
      );

      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockResolvedValue(mockEstabs);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.identificacaoItensEstabelecimentos).toHaveLength(15);
    });

    it('deve tratar nome de estabelecimento null', async () => {
      const mockItem = createItemMasterQueryResult();
      const mockEstabs = [
        createItemEstabQueryResult({ estabNome: null as any })
      ];

      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockResolvedValue(mockEstabs);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      expect(result.identificacaoItensEstabelecimentos[0].estabNome).toBeNull();
    });

    it('deve tratar valores negativos de codObsoleto', async () => {
      const mockItem = createItemMasterQueryResult();
      const mockEstabs = [
        createItemEstabQueryResult({ codObsoleto: -1 })
      ];

      (ItemInformacoesGeraisRepository.getItemMaster as jest.Mock).mockResolvedValue(mockItem);
      (ItemInformacoesGeraisRepository.getItemEstabelecimentos as jest.Mock).mockResolvedValue(mockEstabs);

      const result = await InformacoesGeraisService.getInformacoesGerais('7530110');

      // -1 não é 0, então statusIndex = 2
      expect(result.identificacaoItensEstabelecimentos[0].statusIndex).toBe(2);
    });

  });

});