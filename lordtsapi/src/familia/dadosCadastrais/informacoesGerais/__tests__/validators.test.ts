// src/familia/dadosCadastrais/informacoesGerais/__tests__/validators.test.ts

import { validateFamiliaInformacoesGeraisRequest } from '../validators';

describe('Validators - InformacoesGerais (Familia)', () => {

  describe('validateFamiliaInformacoesGeraisRequest', () => {

    // ========================================
    // CASOS DE SUCESSO
    // ========================================
    describe('Casos Válidos', () => {

      test('deve validar código numérico simples', () => {
        const result = validateFamiliaInformacoesGeraisRequest({ familiaCodigo: 'F001' });

        expect(result.valid).toBe(true);
        expect(result.data).toEqual({ familiaCodigo: 'F001' });
        expect(result.error).toBeUndefined();
      });

      test('deve validar código alfanumérico', () => {
        const result = validateFamiliaInformacoesGeraisRequest({ familiaCodigo: 'FAM123' });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaCodigo).toBe('FAM123');
      });

      test('deve validar código com 8 caracteres (máximo)', () => {
        const codigo = '12345678';
        const result = validateFamiliaInformacoesGeraisRequest({ familiaCodigo: codigo });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaCodigo).toBe(codigo);
      });

      test('deve validar código com 1 caractere (mínimo)', () => {
        const result = validateFamiliaInformacoesGeraisRequest({ familiaCodigo: 'F' });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaCodigo).toBe('F');
      });

    });

    // ========================================
    // SANITIZAÇÃO
    // ========================================
    describe('Sanitização de Entrada', () => {

      test('deve remover espaços em branco nas extremidades', () => {
        const result = validateFamiliaInformacoesGeraisRequest({ familiaCodigo: '  F001  ' });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaCodigo).toBe('F001');
      });

      test('deve remover caracteres de controle', () => {
        const result = validateFamiliaInformacoesGeraisRequest({
          familiaCodigo: 'F001\x00\x1F'
        });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaCodigo).toBe('F001');
      });

      test('deve remover tentativas de path traversal', () => {
        const result = validateFamiliaInformacoesGeraisRequest({
          familiaCodigo: '..F001..'
        });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaCodigo).toBe('F001');
      });

      test('deve sanitizar código complexo', () => {
        const result = validateFamiliaInformacoesGeraisRequest({
          familiaCodigo: '  FAM-123"te;  '
        });

        expect(result.valid).toBe(true);
        expect(result.data?.familiaCodigo).toBe('FAM123te');
      });

    });

    // ========================================
    // CASOS INVÁLIDOS
    // ========================================
    describe('Casos Inválidos', () => {

      test('deve rejeitar código ausente', () => {
        const result = validateFamiliaInformacoesGeraisRequest({});

        expect(result.valid).toBe(false);
        expect(result.error).toContain('obrigatório');
      });

      test('deve rejeitar código vazio', () => {
        const result = validateFamiliaInformacoesGeraisRequest({ familiaCodigo: '' });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('obrigatório');
      });

      test('deve rejeitar código só com espaços', () => {
        const result = validateFamiliaInformacoesGeraisRequest({ familiaCodigo: '   ' });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('inválido');
      });

      test('deve rejeitar código maior que 8 caracteres', () => {
        const codigo = '123456789';
        const result = validateFamiliaInformacoesGeraisRequest({ familiaCodigo: codigo });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('8 caracteres');
      });

      test('deve rejeitar código com tipo errado', () => {
        const result = validateFamiliaInformacoesGeraisRequest({ familiaCodigo: 123 as any });

        expect(result.valid).toBe(false);
      });

    });

    // ========================================
    // SEGURANÇA - SQL INJECTION
    // ========================================
    describe('Proteção contra SQL Injection', () => {

      test('deve bloquear SELECT', () => {
        const result = validateFamiliaInformacoesGeraisRequest({
          familiaCodigo: 'SELECTa'
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('padrões não permitidos');
      });

      test('deve bloquear INSERT', () => {
        const result = validateFamiliaInformacoesGeraisRequest({
          familiaCodigo: 'INSERTx'
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear DROP', () => {
        const result = validateFamiliaInformacoesGeraisRequest({
          familiaCodigo: 'DROPtabl'
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear UNION', () => {
        const result = validateFamiliaInformacoesGeraisRequest({
          familiaCodigo: 'UNIONsel'
        });

        expect(result.valid).toBe(false);
      });

    });

    // ========================================
    // SEGURANÇA - COMMAND INJECTION
    // ========================================
    describe('Proteção contra Command Injection', () => {

      test('deve bloquear pipe (|)', () => {
        const result = validateFamiliaInformacoesGeraisRequest({
          familiaCodigo: 'fam|test'
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('caracteres inválidos');
      });

      test('deve bloquear && operator', () => {
        const result = validateFamiliaInformacoesGeraisRequest({
          familiaCodigo: 'fam&&test'
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear backticks', () => {
        const result = validateFamiliaInformacoesGeraisRequest({
          familiaCodigo: 'fam`test`'
        });

        expect(result.valid).toBe(false);
      });

    });

  });

});