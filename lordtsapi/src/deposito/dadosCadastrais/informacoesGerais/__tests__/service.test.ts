// src/deposito/dadosCadastrais/informacoesGerais/__tests__/service.test.ts

import { InformacoesGeraisService } from '../service';
import { DepositoInformacoesGeraisRepository } from '../repository';
import { DepositoNotFoundError, DatabaseError } from '@shared/errors/CustomErrors';

jest.mock('../repository');
jest.mock('@shared/utils/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Service - InformacoesGeraisService (Deposito)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper para criar mock data com valores já transformados (como virão do SQL)
  const createMockData = (overrides = {}) => ({
    codigo: 'D001',
    nome: 'Depósito Principal',
    consideraSaldoDisponivel: 'Sim',
    consideraSaldoAlocado: 'Sim',
    permissaoMovDeposito1: 'SIM',
    permissaoMovDeposito2: 'SIM',
    permissaoMovDeposito3: 'NAO',
    produtoAcabado: 'Sim',
    tipoDeposito: 'Interno',
    depositoProcesso: 'Não',
    nomeAbrev: 'DEP PRINC',
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
    checkSum: 'ABC123',
    depositoReciclado: 'Não',
    consideraOrdens: 'Sim',
    depositoWMS: 'Não',
    alocaSaldoERP: 'Sim',
    origemExterna: 'Não',
    depositoWmsExterno: 'Não',
    alocaSaldoWmsExterno: 'Não',
    ...overrides,
  });

  // ========================================
  // CASOS DE SUCESSO
  // ========================================
  describe('getInformacoesGerais - Sucesso', () => {
    it('deve retornar informações completas do depósito', async () => {
      const mockData = createMockData();

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(
        mockData
      );

      const result = await InformacoesGeraisService.getInformacoesGerais('D001');

      expect(result).toBeDefined();
      expect(result!.codigo).toBe('D001');
      expect(result!.nome).toBe('Depósito Principal');
    });

    it('deve retornar dados já transformados do repository', async () => {
      const mockData = createMockData({ nome: 'Test' });

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(
        mockData
      );

      const result = await InformacoesGeraisService.getInformacoesGerais('D001');

      expect(result).toHaveProperty('codigo');
      expect(result).toHaveProperty('nome');
      expect(result).toHaveProperty('consideraSaldoDisponivel');
      expect(result).toHaveProperty('consideraSaldoAlocado');
      // Os dados já vêm transformados do SQL
      expect(result!.consideraSaldoDisponivel).toBe('Sim');
      expect(result!.consideraSaldoAlocado).toBe('Sim');
    });

    it('deve preservar strings transformadas do SQL', async () => {
      const mockData = createMockData({
        consideraSaldoDisponivel: 'Sim',
        consideraSaldoAlocado: 'Não',
        produtoAcabado: 'Sim',
        tipoDeposito: 'Interno',
        depositoRejeito: 'Sim',
        depositoReciclado: 'Sim',
        depositoWMS: 'Sim',
      });

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(
        mockData
      );

      const result = await InformacoesGeraisService.getInformacoesGerais('D001');

      expect(result!.consideraSaldoDisponivel).toBe('Sim');
      expect(result!.consideraSaldoAlocado).toBe('Não');
      expect(result!.produtoAcabado).toBe('Sim');
      expect(result!.tipoDeposito).toBe('Interno');
      expect(result!.depositoRejeito).toBe('Sim');
      expect(result!.depositoReciclado).toBe('Sim');
      expect(result!.depositoWMS).toBe('Sim');
    });

    it('deve tratar nome vazio', async () => {
      const mockData = createMockData({ nome: '' });

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(
        mockData
      );

      const result = await InformacoesGeraisService.getInformacoesGerais('D001');

      expect(result!.nome).toBe('');
    });

    it('deve retornar tipo depósito conforme recebido do SQL', async () => {
      const mockDataInterno = createMockData({ tipoDeposito: 'Interno' });

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(
        mockDataInterno
      );

      const resultInterno = await InformacoesGeraisService.getInformacoesGerais('D001');
      expect(resultInterno!.tipoDeposito).toBe('Interno');

      const mockDataExterno = createMockData({ tipoDeposito: 'Externo' });
      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(
        mockDataExterno
      );

      const resultExterno = await InformacoesGeraisService.getInformacoesGerais('D002');
      expect(resultExterno!.tipoDeposito).toBe('Externo');
    });
  });

  // ========================================
  // DEPOSITO NÃO ENCONTRADO
  // ========================================
  describe('getInformacoesGerais - Não Encontrado', () => {
    it('deve lançar DepositoNotFoundError quando não existe', async () => {
      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(null);

      await expect(InformacoesGeraisService.getInformacoesGerais('INEXISTENTE')).rejects.toThrow(
        DepositoNotFoundError
      );
    });

    it('deve incluir código na mensagem de erro', async () => {
      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(null);

      try {
        await InformacoesGeraisService.getInformacoesGerais('D999');
        fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(DepositoNotFoundError);
        expect((error as DepositoNotFoundError).message).toContain('D999');
      }
    });

    it('deve logar quando não encontrado', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { log } = require('@shared/utils/logger');

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(null);

      try {
        await InformacoesGeraisService.getInformacoesGerais('D001');
      } catch {
        // Esperado
      }

      expect(log.info).toHaveBeenCalledWith('Depósito não encontrado', { depositoCodigo: 'D001' });
    });
  });

  // ========================================
  // TRATAMENTO DE ERROS
  // ========================================
  describe('getInformacoesGerais - Erros', () => {
    it('deve re-lançar DepositoNotFoundError sem conversão', async () => {
      const notFoundError = new DepositoNotFoundError('D001');

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockRejectedValue(
        notFoundError
      );

      await expect(InformacoesGeraisService.getInformacoesGerais('D001')).rejects.toThrow(
        DepositoNotFoundError
      );
    });

    it('deve converter erros de banco em DatabaseError', async () => {
      const dbError = new Error('Conexão perdida');

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockRejectedValue(
        dbError
      );

      await expect(InformacoesGeraisService.getInformacoesGerais('D001')).rejects.toThrow(
        DatabaseError
      );
    });

    it('deve incluir erro original em DatabaseError', async () => {
      const originalError = new Error('Timeout SQL');

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockRejectedValue(
        originalError
      );

      try {
        await InformacoesGeraisService.getInformacoesGerais('D001');
        fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).message).toContain('Falha ao buscar');
      }
    });

    it('deve logar erros de banco', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { log } = require('@shared/utils/logger');
      const dbError = new Error('Erro SQL');

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockRejectedValue(
        dbError
      );

      try {
        await InformacoesGeraisService.getInformacoesGerais('D001');
      } catch {
        // Esperado
      }

      expect(log.error).toHaveBeenCalledWith(
        'Erro ao buscar informações gerais',
        expect.objectContaining({
          depositoCodigo: 'D001',
          error: 'Erro SQL',
        })
      );
    });
  });

  // ========================================
  // INTEGRAÇÃO COM REPOSITORY
  // ========================================
  describe('Integração com Repository', () => {
    it('deve chamar getDepositoMaster com código correto', async () => {
      const mockData = createMockData({ codigo: 'D123', nome: 'Test' });

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(
        mockData
      );

      await InformacoesGeraisService.getInformacoesGerais('D123');

      expect(DepositoInformacoesGeraisRepository.getDepositoMaster).toHaveBeenCalledWith('D123');
      expect(DepositoInformacoesGeraisRepository.getDepositoMaster).toHaveBeenCalledTimes(1);
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    it('deve tratar nome com caracteres especiais', async () => {
      const mockData = createMockData({ nome: 'Depósito & Armazém - 1/2"' });

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(
        mockData
      );

      const result = await InformacoesGeraisService.getInformacoesGerais('D001');

      expect(result!.nome).toBe('Depósito & Armazém - 1/2"');
    });

    it('deve tratar código com espaços', async () => {
      const mockData = createMockData({ codigo: 'D 001', nome: 'Test' });

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(
        mockData
      );

      const result = await InformacoesGeraisService.getInformacoesGerais('D 001');

      expect(result!.codigo).toBe('D 001');
    });

    it('deve preservar valores dos campos customizados', async () => {
      const mockData = createMockData({
        char1: 'CUSTOM1',
        char2: 'CUSTOM2',
        dec1: 123.45,
        dec2: 678.9,
        int1: 100,
        int2: 200,
        log1: true,
        log2: false,
        data1: new Date('2024-01-01'),
        data2: null,
        checkSum: 'XYZ789',
      });

      (DepositoInformacoesGeraisRepository.getDepositoMaster as jest.Mock).mockResolvedValue(
        mockData
      );

      const result = await InformacoesGeraisService.getInformacoesGerais('D001');

      expect(result!.char1).toBe('CUSTOM1');
      expect(result!.char2).toBe('CUSTOM2');
      expect(result!.dec1).toBe(123.45);
      expect(result!.dec2).toBe(678.9);
      expect(result!.int1).toBe(100);
      expect(result!.int2).toBe(200);
      expect(result!.log1).toBe(true);
      expect(result!.log2).toBe(false);
      expect(result!.checkSum).toBe('XYZ789');
    });
  });
});
