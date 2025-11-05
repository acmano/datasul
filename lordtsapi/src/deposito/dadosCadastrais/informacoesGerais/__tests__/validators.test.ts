// src/deposito/dadosCadastrais/informacoesGerais/__tests__/validators.test.ts

import { validateDepositoInformacoesGeraisRequest } from '../validators';

describe('Validators - InformacoesGerais (Deposito)', () => {
  describe('validateDepositoInformacoesGeraisRequest', () => {
    // ========================================
    // CASOS DE SUCESSO
    // ========================================
    describe('Casos Válidos', () => {
      test('deve validar código numérico simples', () => {
        const result = validateDepositoInformacoesGeraisRequest({ depositoCodigo: 'D001' });

        expect(result.valid).toBe(true);
        expect(result.data).toEqual({ depositoCodigo: 'D001' });
        expect(result.error).toBeUndefined();
      });

      test('deve validar código alfanumérico', () => {
        const result = validateDepositoInformacoesGeraisRequest({ depositoCodigo: 'DEP123' });

        expect(result.valid).toBe(true);
        expect(result.data?.depositoCodigo).toBe('DEP123');
      });

      test('deve validar código com 8 caracteres (máximo)', () => {
        const codigo = '12345678';
        const result = validateDepositoInformacoesGeraisRequest({ depositoCodigo: codigo });

        expect(result.valid).toBe(true);
        expect(result.data?.depositoCodigo).toBe(codigo);
      });

      test('deve validar código com 1 caractere (mínimo)', () => {
        const result = validateDepositoInformacoesGeraisRequest({ depositoCodigo: 'D' });

        expect(result.valid).toBe(true);
        expect(result.data?.depositoCodigo).toBe('D');
      });
    });

    // ========================================
    // SANITIZAÇÃO
    // ========================================
    describe('Sanitização de Entrada', () => {
      test('deve remover espaços em branco nas extremidades', () => {
        const result = validateDepositoInformacoesGeraisRequest({ depositoCodigo: '  D001  ' });

        expect(result.valid).toBe(true);
        expect(result.data?.depositoCodigo).toBe('D001');
      });

      test('deve remover caracteres de controle', () => {
        const result = validateDepositoInformacoesGeraisRequest({
          depositoCodigo: 'D001\x00\x1F',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.depositoCodigo).toBe('D001');
      });

      test('deve remover tentativas de path traversal', () => {
        const result = validateDepositoInformacoesGeraisRequest({
          depositoCodigo: '..D001..',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.depositoCodigo).toBe('D001');
      });

      test('deve sanitizar código complexo', () => {
        const result = validateDepositoInformacoesGeraisRequest({
          depositoCodigo: '  DEP-123"te;  ',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.depositoCodigo).toBe('DEP123te');
      });
    });

    // ========================================
    // CASOS INVÁLIDOS
    // ========================================
    describe('Casos Inválidos', () => {
      test('deve rejeitar código ausente', () => {
        const result = validateDepositoInformacoesGeraisRequest({});

        expect(result.valid).toBe(false);
        expect(result.error).toContain('obrigatório');
      });

      test('deve rejeitar código vazio', () => {
        const result = validateDepositoInformacoesGeraisRequest({ depositoCodigo: '' });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('obrigatório');
      });

      test('deve rejeitar código só com espaços', () => {
        const result = validateDepositoInformacoesGeraisRequest({ depositoCodigo: '   ' });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('inválido');
      });

      test('deve rejeitar código maior que 8 caracteres', () => {
        const codigo = '123456789';
        const result = validateDepositoInformacoesGeraisRequest({ depositoCodigo: codigo });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('8 caracteres');
      });

      test('deve rejeitar código com tipo errado', () => {
        const result = validateDepositoInformacoesGeraisRequest({ depositoCodigo: 123 as any });

        expect(result.valid).toBe(false);
      });
    });

    // ========================================
    // SEGURANÇA - SQL INJECTION
    // ========================================
    describe('Proteção contra SQL Injection', () => {
      test('deve bloquear SELECT', () => {
        const result = validateDepositoInformacoesGeraisRequest({
          depositoCodigo: 'SELECTa',
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('padrões não permitidos');
      });

      test('deve bloquear INSERT', () => {
        const result = validateDepositoInformacoesGeraisRequest({
          depositoCodigo: 'INSERTx',
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear DROP', () => {
        const result = validateDepositoInformacoesGeraisRequest({
          depositoCodigo: 'DROPtabl',
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear UNION', () => {
        const result = validateDepositoInformacoesGeraisRequest({
          depositoCodigo: 'UNIONsel',
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear DELETE', () => {
        const result = validateDepositoInformacoesGeraisRequest({
          depositoCodigo: 'DELETEfr',
        });

        expect(result.valid).toBe(false);
      });
    });

    // ========================================
    // SEGURANÇA - COMMAND INJECTION
    // ========================================
    describe('Proteção contra Command Injection', () => {
      test('deve bloquear pipe (|)', () => {
        const result = validateDepositoInformacoesGeraisRequest({
          depositoCodigo: 'dep|test',
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear && operator', () => {
        const result = validateDepositoInformacoesGeraisRequest({
          depositoCodigo: 'dep&&test',
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear backticks', () => {
        const result = validateDepositoInformacoesGeraisRequest({
          depositoCodigo: 'dep`test`',
        });

        expect(result.valid).toBe(false);
      });
    });
  });
});
