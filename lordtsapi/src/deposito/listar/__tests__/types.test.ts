// src/deposito/listar/__tests__/types.test.ts

import type { DepositoListItem, DepositoListarResponse } from '../types';

describe('Types - Deposito Listar', () => {
  describe('DepositoListItem', () => {
    it('deve aceitar objeto válido com todos os campos', () => {
      const deposito: DepositoListItem = {
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
      };

      expect(deposito).toBeDefined();
      expect(deposito.codigo).toBe('01');
    });

    it('deve aceitar datas válidas', () => {
      const deposito: DepositoListItem = {
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
        data1: new Date('2025-01-01'),
        data2: new Date('2025-12-31'),
        checkSum: '',
        depositoReciclado: 'Não',
        consideraOrdens: 'Sim',
        depositoWMS: 'Não',
        alocaSaldoERP: 'Sim',
        origemExterna: 'Não',
        depositoWmsExterno: 'Não',
        alocaSaldoWmsExterno: 'Não',
      };

      expect(deposito.data1).toBeInstanceOf(Date);
      expect(deposito.data2).toBeInstanceOf(Date);
    });
  });

  describe('DepositoListarResponse', () => {
    it('deve aceitar resposta válida', () => {
      const response: DepositoListarResponse = {
        depositos: [
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
        ],
        total: 1,
      };

      expect(response).toBeDefined();
      expect(response.depositos).toHaveLength(1);
      expect(response.total).toBe(1);
    });
  });
});
