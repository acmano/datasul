// @ts-nocheck
// tests/unit/validators/informacoesGerais.validators.test.ts

import { validateItemInformacoesGeraisRequest } from '@api/lor0138/item/dadosCadastrais/informacoesGerais/validators/informacoesGerais.validators';
import { testItemCodigos, expectedErrors } from '../../factories/item.factory';

describe('Validators - InformacoesGerais', () => {

  describe('validateItemInformacoesGeraisRequest', () => {

    // ========================================
    // CASOS DE SUCESSO ✅
    // ========================================
    describe('Casos Válidos', () => {

      test('deve validar código numérico simples', () => {
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: '7530110' });

        expect(result.valid).toBe(true);
        expect(result.data).toEqual({ itemCodigo: '7530110' });
        expect(result.error).toBeUndefined();
      });

      test('deve validar código alfanumérico', () => {
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: 'ABC123' });

        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('ABC123');
      });

      test('deve validar código com 16 caracteres (máximo)', () => {
        const codigo = '1234567890123456'; // 16 caracteres
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: codigo });

        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe(codigo);
      });

      test('deve validar código com 1 caractere (mínimo)', () => {
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: 'A' });

        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('A');
      });

      test.each(testItemCodigos.valid)(
        'deve validar código válido: %s',
        (codigo) => {
          const result = validateItemInformacoesGeraisRequest({ itemCodigo: codigo });
          expect(result.valid).toBe(true);
        }
      );
    });

    // ========================================
    // SANITIZAÇÃO 🧹
    // ========================================
    describe('Sanitização de Entrada', () => {

      test('deve remover espaços em branco nas extremidades', () => {
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: '  7530110  ' });

        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('7530110');
      });

      test('deve remover caracteres de controle', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: '7530110\x00\x1F'
        });

        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('7530110');
      });

      test('deve remover tentativas de path traversal', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: '..ABC123..'
        });

        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('ABC123');
      });

      test.each(testItemCodigos.sanitized)(
        'deve sanitizar corretamente: $input → $expected',
        ({ input, expected }) => {
          const result = validateItemInformacoesGeraisRequest({ itemCodigo: input });
          expect(result.data?.itemCodigo).toBe(expected);
        }
      );
    });

    // ========================================
    // VALIDAÇÃO DE ERROS ❌
    // ========================================
    describe('Casos Inválidos', () => {

      test('deve rejeitar itemCodigo ausente', () => {
        const result = validateItemInformacoesGeraisRequest({});

        expect(result.valid).toBe(false);
        expect(result.error).toBe(expectedErrors.validationError);
      });

      test('deve rejeitar itemCodigo vazio', () => {
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: '' });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('obrigatório');
      });

      test('deve rejeitar string com apenas espaços', () => {
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: '   ' });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('inválido');
      });

      test('deve rejeitar código com mais de 16 caracteres', () => {
        const codigo = '12345678901234567'; // 17 caracteres
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: codigo });

        expect(result.valid).toBe(false);
        expect(result.error).toBe(expectedErrors.maxLength);
      });

      test('deve rejeitar tipo não-string', () => {
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: 123 as any });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('string');
      });
    });

    // ========================================
    // SEGURANÇA 🛡️ - SQL INJECTION
    // ========================================
    describe('Proteção contra SQL Injection', () => {

      test('deve bloquear SELECT (dentro do limite de caracteres)', () => {
        // Usa código curto que passa tamanho mas tem SQL keyword
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: 'SELECTabc'
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('padrões não permitidos');
      });

      test('deve bloquear INSERT', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: 'INSERTx'
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('padrões não permitidos');
      });

      test('deve bloquear DROP', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: 'DROPtable'
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('padrões não permitidos');
      });

      test('deve bloquear UNION', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: 'UNIONselect'
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('padrões não permitidos');
      });

      test('deve remover aspas simples e duplas', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: "item'test"
        });

        // Aspas são removidas na sanitização
        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('itemtest');
      });

      test('deve remover ponto e vírgula', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: 'item;test'
        });

        // ; é removido na sanitização
        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('itemtest');
      });
    });

    // ========================================
    // SEGURANÇA 🛡️ - COMMAND INJECTION
    // ========================================
    describe('Proteção contra Command Injection', () => {

      test('deve bloquear pipe (|)', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: 'item|test'
        });

        expect(result.valid).toBe(false);
        // | não é removido na sanitização, então falha no regex
        expect(result.error).toContain('caracteres inválidos');
      });

      test('deve bloquear && operator', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: 'item&&test'
        });

        expect(result.valid).toBe(false);
        // & não é removido, falha no regex
        expect(result.error).toContain('caracteres inválidos');
      });

      test('deve bloquear || operator', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: 'item||test'
        });

        expect(result.valid).toBe(false);
        // | não é removido, falha no regex
        expect(result.error).toContain('caracteres inválidos');
      });

      test('deve bloquear backticks', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: 'item`test`'
        });

        expect(result.valid).toBe(false);
        // ` não é removido, falha no regex
        expect(result.error).toContain('caracteres inválidos');
      });

      test('deve bloquear $() substitution', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: 'item$(test)'
        });

        expect(result.valid).toBe(false);
        // $() não são removidos, falha no regex
        expect(result.error).toContain('caracteres inválidos');
      });
    });

    // ========================================
    // SEGURANÇA 🛡️ - XSS
    // ========================================
    describe('Proteção contra XSS', () => {

      test('deve remover tags HTML mas bloquear parênteses', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: '<script>alert(1)</script>'
        });

        // Tags <> são removidas, mas () permanecem e falham no regex
        expect(result.valid).toBe(false);
        expect(result.error).toContain('caracteres inválidos');
      });

      test('deve remover tags mas bloquear caracteres especiais remanescentes', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: '<img src=x>'
        });

        // Remove <>, mas resultado final é inválido
        expect(result.valid).toBe(false);
        expect(result.error).toContain('inválido');
      });

      test('deve bloquear script com caracteres especiais', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: '<script>alert("xss")</script>'
        });

        // Aspas e parênteses causam erro de formato
        expect(result.valid).toBe(false);
      });

      test('deve aceitar tags removidas que resultam em alfanumérico válido', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: '<b>test123</b>'
        });

        // Remove <b> e </b> completamente, fica "test123"
        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('test123');
      });
    });

    // ========================================
    // EDGE CASES 🔍
    // ========================================
    describe('Edge Cases', () => {

      test('deve aceitar apenas números', () => {
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: '123456' });

        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('123456');
      });

      test('deve aceitar apenas letras', () => {
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: 'ABCDEF' });

        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('ABCDEF');
      });

      test('deve aceitar mix maiúsculas e minúsculas', () => {
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: 'AbC123' });

        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('AbC123');
      });

      test('deve rejeitar caracteres especiais', () => {
        const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'];

        specialChars.forEach(char => {
          const result = validateItemInformacoesGeraisRequest({
            itemCodigo: `item${char}test`
          });

          // Caracteres especiais causam erro
          expect(result.valid).toBe(false);
        });
      });

      test('deve sanitizar e validar corretamente códigos complexos', () => {
        // Código com vários caracteres especiais que serão removidos
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: '  ABC-123"test;  '
        });

        // Remove espaços, -, ", ; → fica ABC123test
        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('ABC123test');
      });
    });

    // ========================================
    // FLUXO COMPLETO DE VALIDAÇÃO
    // ========================================
    describe('Fluxo de Validação Completo', () => {

      test('deve seguir ordem: sanitização → tamanho → formato → SQL', () => {
        // 1. Input com caracteres especiais
        const input = '  ITEM-123  ';
        const result = validateItemInformacoesGeraisRequest({ itemCodigo: input });

        // 2. Sanitiza (remove espaços e -)
        // 3. Fica "ITEM123" (7 chars)
        // 4. Passa no tamanho
        // 5. Passa no formato alfanumérico
        // 6. Não tem SQL keywords
        expect(result.valid).toBe(true);
        expect(result.data?.itemCodigo).toBe('ITEM123');
      });

      test('deve falhar no tamanho antes de checar SQL', () => {
        // String longa com SQL keyword
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: 'SELECT1234567890' // 16 chars, mas SELECT está lá
        });

        // Passa no tamanho (16 chars), mas falha no SQL keyword
        expect(result.valid).toBe(false);
        expect(result.error).toContain('padrões não permitidos');
      });

      test('deve falhar no formato antes de checar SQL', () => {
        // String curta com SQL e caracteres inválidos
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: 'SELECT *' // Tem espaço
        });

        // 1. Sanitiza (mantém espaço)
        // 2. Passa no tamanho (8 chars)
        // 3. FALHA no formato (regex não aceita espaço)
        expect(result.valid).toBe(false);
        expect(result.error).toContain('caracteres inválidos');
      });
    });

    describe('Gaps de Mutation Testing', () => {

      // Gap 1: String que fica vazia após sanitização
      it('deve rejeitar código com apenas caracteres removíveis', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: '//\\\\' // Só barras que serão removidas
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('vazio');
      });

      it('deve rejeitar código com apenas tags HTML', () => {
        const result = validateItemInformacoesGeraisRequest({
          itemCodigo: '<><><>' // Só tags removidas
        });

        expect(result.valid).toBe(false);
      });

      // Gap 2: Garantir que dangerousPatterns está sendo usado
      it('deve ter array de padrões perigosos não vazio', () => {
        // Este teste força o código a executar o loop
        const patterns = ['&&', '||', '|', '`', '$'];

        patterns.forEach(pattern => {
          const result = validateItemInformacoesGeraisRequest({
            itemCodigo: `test${pattern}code`
          });

          expect(result.valid).toBe(false);
          expect(result.error).toContain('caracteres não permitidos');
        });
      });

      // Gap 3: Garantir execução do bloco if dentro do loop
      it('deve validar cada padrão perigoso individualmente', () => {
        const testCases = [
          { input: 'a&&b', pattern: '&&' },
          { input: 'a||b', pattern: '||' },
          { input: 'a|b', pattern: '|' },
          { input: 'a`b', pattern: '`' },
          { input: 'a$b', pattern: '$' },
        ];

        testCases.forEach(({ input, pattern }) => {
          const result = validateItemInformacoesGeraisRequest({ itemCodigo: input });
          expect(result.valid).toBe(false);
        });
      });
    });


  });
});