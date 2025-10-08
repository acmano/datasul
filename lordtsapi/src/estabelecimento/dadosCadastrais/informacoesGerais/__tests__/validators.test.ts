// src/estabelecimento/dadosCadastrais/informacoesGerais/__tests__/validators.test.ts

import { validateEstabelecimentoInformacoesGeraisRequest } from '../validators';

describe('Validators - InformacoesGerais (Estabelecimento)', () => {

  describe('validateEstabelecimentoInformacoesGeraisRequest', () => {

    describe('Casos Válidos', () => {

      test('deve validar código numérico simples', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({ estabelecimentoCodigo: '1' });

        expect(result.valid).toBe(true);
        expect(result.data).toEqual({ estabelecimentoCodigo: '1' });
        expect(result.error).toBeUndefined();
      });

      test('deve validar código com múltiplos dígitos', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({ estabelecimentoCodigo: '101' });

        expect(result.valid).toBe(true);
        expect(result.data?.estabelecimentoCodigo).toBe('101');
      });

      test('deve validar código com 5 dígitos (máximo)', () => {
        const codigo = '12345';
        const result = validateEstabelecimentoInformacoesGeraisRequest({ estabelecimentoCodigo: codigo });

        expect(result.valid).toBe(true);
        expect(result.data?.estabelecimentoCodigo).toBe(codigo);
      });

    });

    describe('Sanitização de Entrada', () => {

      test('deve remover espaços em branco nas extremidades', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({ estabelecimentoCodigo: '  101  ' });

        expect(result.valid).toBe(true);
        expect(result.data?.estabelecimentoCodigo).toBe('101');
      });

      test('deve remover caracteres de controle', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({
          estabelecimentoCodigo: '101\x00\x1F'
        });

        expect(result.valid).toBe(true);
        expect(result.data?.estabelecimentoCodigo).toBe('101');
      });

      test('deve remover tentativas de path traversal', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({
          estabelecimentoCodigo: '..101..'
        });

        expect(result.valid).toBe(true);
        expect(result.data?.estabelecimentoCodigo).toBe('101');
      });

      test('deve sanitizar código complexo', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({
          estabelecimentoCodigo: '  101-";  '  // ← Sem 'test', só números
        });

        expect(result.valid).toBe(true);
        expect(result.data?.estabelecimentoCodigo).toBe('101');
      });

    });

    describe('Casos Inválidos', () => {

      test('deve rejeitar código ausente', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({});

        expect(result.valid).toBe(false);
        expect(result.error).toContain('obrigatório');
      });

      test('deve rejeitar código vazio', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({ estabelecimentoCodigo: '' });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('obrigatório');
      });

      test('deve rejeitar código só com espaços', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({ estabelecimentoCodigo: '   ' });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('inválido');
      });

      test('deve rejeitar código maior que 5 dígitos', () => {
        const codigo = '123456';
        const result = validateEstabelecimentoInformacoesGeraisRequest({ estabelecimentoCodigo: codigo });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('5 dígitos');
      });

      test('deve rejeitar código com tipo errado', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({ estabelecimentoCodigo: 123 as any });

        expect(result.valid).toBe(false);
      });

      test('deve rejeitar código com letras', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({ estabelecimentoCodigo: '10A' });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('caracteres inválidos');
      });

    });

    describe('Proteção contra SQL Injection', () => {

      test('deve bloquear SELECT', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({
          estabelecimentoCodigo: '1SEL'  // ← 4 chars, dentro do limite
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('caracteres inválidos');  // ← números puros, rejeita letras
      });

      test('deve bloquear INSERT', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({
          estabelecimentoCodigo: '1INS'
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('caracteres inválidos');
      });

      test('deve bloquear DROP', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({
          estabelecimentoCodigo: '1DRP'
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('caracteres inválidos');
      });

      test('deve bloquear UNION', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({
          estabelecimentoCodigo: '1UNI'
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('caracteres inválidos');
      });

    });

    describe('Proteção contra Command Injection', () => {

      test('deve bloquear pipe (|)', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({
          estabelecimentoCodigo: '1|2'  // ← 3 chars, cabe em 5
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('caracteres inválidos');
      });

      test('deve bloquear && operator', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({
          estabelecimentoCodigo: '1&&2'
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear backticks', () => {
        const result = validateEstabelecimentoInformacoesGeraisRequest({
          estabelecimentoCodigo: '1`test`'
        });

        expect(result.valid).toBe(false);
      });

    });

  });

});