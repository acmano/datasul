// src/familiaComercial/dadosCadastrais/informacoesGerais/__tests__/validators.test.ts

import { validateFamiliaComercialInformacoesGeraisRequest } from '../validators';

describe('Validators - InformacoesGerais (FamiliaComercial)', () => {
  describe('validateFamiliaComercialInformacoesGeraisRequest', () => {
    describe('Casos Válidos', () => {
      test('deve validar código alfanumérico', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: 'FC01',
        });

        expect(result.valid).toBe(true);
        expect(result.data).toEqual({ familiaComercialCodigo: 'FC01' });
        expect(result.error).toBeUndefined();
      });

      test('deve validar código com 16 caracteres (máximo)', () => {
        const codigo = '1234567890123456';
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: codigo,
        });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaComercialCodigo).toBe(codigo);
      });

      test('deve validar código com 1 caractere (mínimo)', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: 'F',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaComercialCodigo).toBe('F');
      });
    });

    describe('Sanitização de Entrada', () => {
      test('deve remover espaços em branco nas extremidades', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: '  FC01  ',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaComercialCodigo).toBe('FC01');
      });

      test('deve remover caracteres de controle', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: 'FC01\x00\x1F',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaComercialCodigo).toBe('FC01');
      });

      test('deve remover tentativas de path traversal', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: '..FC01..',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaComercialCodigo).toBe('FC01');
      });

      test('deve sanitizar código complexo', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: '  FC-01"test;  ',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaComercialCodigo).toBe('FC01test');
      });
    });

    describe('Casos Inválidos', () => {
      test('deve rejeitar código ausente', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({});

        expect(result.valid).toBe(false);
        expect(result.error).toContain('obrigatório');
      });

      test('deve rejeitar código vazio', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: '',
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('obrigatório');
      });

      test('deve rejeitar código só com espaços', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: '   ',
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('inválido');
      });

      test('deve rejeitar código maior que 16 caracteres', () => {
        const codigo = '12345678901234567';
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: codigo,
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('16 caracteres');
      });

      test('deve rejeitar código com tipo errado', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: 123 as any,
        });

        expect(result.valid).toBe(false);
      });
    });

    describe('Proteção contra SQL Injection', () => {
      test('deve bloquear SELECT', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: 'SELECTabc',
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('padrões não permitidos');
      });

      test('deve bloquear INSERT', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: 'INSERTx',
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear DROP', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: 'DROPtable',
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear UNION', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: 'UNIONselect',
        });

        expect(result.valid).toBe(false);
      });
    });

    describe('Proteção contra Command Injection', () => {
      test('deve bloquear pipe (|)', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: 'fc|test',
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('caracteres inválidos');
      });

      test('deve bloquear && operator', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: 'fc&&test',
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear backticks', () => {
        const result = validateFamiliaComercialInformacoesGeraisRequest({
          familiaComercialCodigo: 'fc`test`',
        });

        expect(result.valid).toBe(false);
      });
    });
  });
});
