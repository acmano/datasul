// src/grupoDeEstoque/dadosCadastrais/informacoesGerais/__tests__/validators.test.ts

import { validateGrupoDeEstoqueInformacoesGeraisRequest } from '../validators';

describe('Validators - InformacoesGerais (GrupoDeEstoque)', () => {
  describe('validateGrupoDeEstoqueInformacoesGeraisRequest', () => {
    describe('Casos Válidos', () => {
      test('deve validar código alfanumérico', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: 'GE01',
        });

        expect(result.valid).toBe(true);
        expect(result.data).toEqual({ grupoDeEstoqueCodigo: 'GE01' });
        expect(result.error).toBeUndefined();
      });

      test('deve validar código com 16 caracteres (máximo)', () => {
        const codigo = '1234567890123456';
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: codigo,
        });

        expect(result.valid).toBe(true);
        expect(result.data?.grupoDeEstoqueCodigo).toBe(codigo);
      });

      test('deve validar código com 1 caractere (mínimo)', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: 'G',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.grupoDeEstoqueCodigo).toBe('G');
      });
    });

    describe('Sanitização de Entrada', () => {
      test('deve remover espaços em branco nas extremidades', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: '  GE01  ',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.grupoDeEstoqueCodigo).toBe('GE01');
      });

      test('deve remover caracteres de controle', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: 'GE01\x00\x1F',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.grupoDeEstoqueCodigo).toBe('GE01');
      });

      test('deve remover tentativas de path traversal', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: '..GE01..',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.grupoDeEstoqueCodigo).toBe('GE01');
      });

      test('deve sanitizar código complexo', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: '  GE-01"test;  ',
        });

        expect(result.valid).toBe(true);
        expect(result.data?.grupoDeEstoqueCodigo).toBe('GE01test');
      });
    });

    describe('Casos Inválidos', () => {
      test('deve rejeitar código ausente', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({});

        expect(result.valid).toBe(false);
        expect(result.error).toContain('obrigatório');
      });

      test('deve rejeitar código vazio', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({ grupoDeEstoqueCodigo: '' });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('obrigatório');
      });

      test('deve rejeitar código só com espaços', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: '   ',
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('inválido');
      });

      test('deve rejeitar código maior que 16 caracteres', () => {
        const codigo = '12345678901234567';
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: codigo,
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('16 caracteres');
      });

      test('deve rejeitar código com tipo errado', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: 123 as any,
        });

        expect(result.valid).toBe(false);
      });
    });

    describe('Proteção contra SQL Injection', () => {
      test('deve bloquear SELECT', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: 'SELECTabc',
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('padrões não permitidos');
      });

      test('deve bloquear INSERT', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: 'INSERTx',
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear DROP', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: 'DROPtable',
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear UNION', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: 'UNIONselect',
        });

        expect(result.valid).toBe(false);
      });
    });

    describe('Proteção contra Command Injection', () => {
      test('deve bloquear pipe (|)', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: 'ge|test',
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('caracteres inválidos');
      });

      test('deve bloquear && operator', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: 'ge&&test',
        });

        expect(result.valid).toBe(false);
      });

      test('deve bloquear backticks', () => {
        const result = validateGrupoDeEstoqueInformacoesGeraisRequest({
          grupoDeEstoqueCodigo: 'ge`test`',
        });

        expect(result.valid).toBe(false);
      });
    });
  });
});
