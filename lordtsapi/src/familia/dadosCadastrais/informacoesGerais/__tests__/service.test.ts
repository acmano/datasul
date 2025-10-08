// src/familia/dadosCadastrais/informacoesGerais/__tests__/service.test.ts
import { InformacoesGeraisService } from '../service';
import { FamiliaInformacoesGeraisRepository } from '../repository';  // ← FIX
import { FamiliaNotFoundError, DatabaseError } from '@shared/errors/CustomErrors';  // ← FIX

jest.mock('../repository');
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Service - InformacoesGeraisService (Familia)', () => {  // ← FIX
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // CASOS DE SUCESSO
  // ========================================
  describe('getInformacoesGerais - Sucesso', () => {

    it('deve retornar informações completas da família', async () => {
      const mockData = {
        familiaCodigo: 'F001',
        familiaDescricao: 'Válvulas e Conexões'
      };

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockResolvedValue(mockData);

      const result = await InformacoesGeraisService.getInformacoesGerais('F001');

      expect(result).toBeDefined();
      expect(result.codigo).toBe('F001');
      expect(result.descricao).toBe('Válvulas e Conexões');
    });

    it('deve transformar dados do repository para DTO de resposta', async () => {
      const mockData = {
        familiaCodigo: 'F001',
        familiaDescricao: 'Test'
      };

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockResolvedValue(mockData);

      const result = await InformacoesGeraisService.getInformacoesGerais('F001');

      expect(result).toHaveProperty('codigo');
      expect(result).toHaveProperty('descricao');
    });

    it('deve tratar descrição vazia', async () => {
      const mockData = {
        familiaCodigo: 'F001',
        familiaDescricao: ''
      };

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockResolvedValue(mockData);

      const result = await InformacoesGeraisService.getInformacoesGerais('F001');

      expect(result.descricao).toBe('');
    });

  });

  // ========================================
  // FAMILIA NÃO ENCONTRADA
  // ========================================
  describe('getInformacoesGerais - Não Encontrado', () => {

    it('deve lançar FamiliaNotFoundError quando não existe', async () => {
      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockResolvedValue(null);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('INEXISTENTE')
      ).rejects.toThrow(FamiliaNotFoundError);
    });

    it('deve incluir código na mensagem de erro', async () => {
      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockResolvedValue(null);

      try {
        await InformacoesGeraisService.getInformacoesGerais('F999');
        fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(FamiliaNotFoundError);
        expect((error as FamiliaNotFoundError).message).toContain('F999');
      }
    });

    it('deve logar quando não encontrado', async () => {
      const { log } = require('@shared/utils/logger');

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockResolvedValue(null);

      try {
        await InformacoesGeraisService.getInformacoesGerais('F001');
      } catch (error) {
        // Esperado
      }

      expect(log.info).toHaveBeenCalledWith(
        'Família não encontrada',
        { familiaCodigo: 'F001' }
      );
    });

  });

  // ========================================
  // TRATAMENTO DE ERROS
  // ========================================
  describe('getInformacoesGerais - Erros', () => {

    it('deve re-lançar FamiliaNotFoundError sem conversão', async () => {
      const notFoundError = new FamiliaNotFoundError('F001');

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockRejectedValue(notFoundError);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('F001')
      ).rejects.toThrow(FamiliaNotFoundError);
    });

    it('deve converter erros de banco em DatabaseError', async () => {
      const dbError = new Error('Conexão perdida');

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockRejectedValue(dbError);

      await expect(
        InformacoesGeraisService.getInformacoesGerais('F001')
      ).rejects.toThrow(DatabaseError);
    });

    it('deve incluir erro original em DatabaseError', async () => {
      const originalError = new Error('Timeout SQL');

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockRejectedValue(originalError);

      try {
        await InformacoesGeraisService.getInformacoesGerais('F001');
        fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).message).toContain('Falha ao buscar');
      }
    });

    it('deve logar erros de banco', async () => {
      const { log } = require('@shared/utils/logger');
      const dbError = new Error('Erro SQL');

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockRejectedValue(dbError);

      try {
        await InformacoesGeraisService.getInformacoesGerais('F001');
      } catch (error) {
        // Esperado
      }

      expect(log.error).toHaveBeenCalledWith(
        'Erro ao buscar informações gerais',
        expect.objectContaining({
          familiaCodigo: 'F001',
          error: 'Erro SQL'
        })
      );
    });

  });

  // ========================================
  // INTEGRAÇÃO COM REPOSITORY
  // ========================================
  describe('Integração com Repository', () => {

    it('deve chamar getFamiliaMaster com código correto', async () => {
      const mockData = {
        familiaCodigo: 'F123',
        familiaDescricao: 'Test'
      };

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockResolvedValue(mockData);

      await InformacoesGeraisService.getInformacoesGerais('F123');

      expect(FamiliaInformacoesGeraisRepository.getFamiliaMaster)
        .toHaveBeenCalledWith('F123');
      expect(FamiliaInformacoesGeraisRepository.getFamiliaMaster)
        .toHaveBeenCalledTimes(1);
    });

  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {

    it('deve tratar descrição com caracteres especiais', async () => {
      const mockData = {
        familiaCodigo: 'F001',
        familiaDescricao: 'Válvulas & Conexões - 1/2"'
      };

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockResolvedValue(mockData);

      const result = await InformacoesGeraisService.getInformacoesGerais('F001');

      expect(result.descricao).toBe('Válvulas & Conexões - 1/2"');
    });

    it('deve tratar código com espaços', async () => {
      const mockData = {
        familiaCodigo: 'F 001',
        familiaDescricao: 'Test'
      };

      (FamiliaInformacoesGeraisRepository.getFamiliaMaster as jest.Mock)
        .mockResolvedValue(mockData);

      const result = await InformacoesGeraisService.getInformacoesGerais('F 001');

      expect(result.codigo).toBe('F 001');
    });

  });
});