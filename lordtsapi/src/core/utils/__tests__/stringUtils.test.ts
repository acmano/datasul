// src/core/utils/__tests__/stringUtils.test.ts

import {
  trim,
  toUpperCase,
  toLowerCase,
  isEmpty,
  truncate,
  removeSpecialChars,
  normalizeSpaces,
  capitalize,
  toCamelCase,
  toSnakeCase,
} from '../stringUtils';

describe('stringUtils - Edge Cases', () => {
  describe('trim', () => {
    it('deve remover espaços no início', () => {
      expect(trim('  hello')).toBe('hello');
    });

    it('deve remover espaços no fim', () => {
      expect(trim('hello  ')).toBe('hello');
    });

    it('deve remover espaços em ambos os lados', () => {
      expect(trim('  hello  ')).toBe('hello');
    });

    it('deve preservar espaços internos', () => {
      expect(trim('  hello world  ')).toBe('hello world');
    });

    it('deve retornar string vazia para string vazia', () => {
      expect(trim('')).toBe('');
    });

    it('deve retornar string vazia para apenas espaços', () => {
      expect(trim('   ')).toBe('');
    });

    it('deve lidar com tabs', () => {
      expect(trim('\t\thello\t\t')).toBe('hello');
    });
  });

  describe('toUpperCase', () => {
    it('deve converter para maiúsculas', () => {
      expect(toUpperCase('hello')).toBe('HELLO');
    });

    it('deve preservar maiúsculas', () => {
      expect(toUpperCase('HELLO')).toBe('HELLO');
    });

    it('deve converter letras mistas', () => {
      expect(toUpperCase('HeLLo')).toBe('HELLO');
    });

    it('deve preservar números', () => {
      expect(toUpperCase('abc123')).toBe('ABC123');
    });

    it('deve preservar caracteres especiais', () => {
      expect(toUpperCase('hello-world!')).toBe('HELLO-WORLD!');
    });

    it('deve lidar com string vazia', () => {
      expect(toUpperCase('')).toBe('');
    });
  });

  describe('toLowerCase', () => {
    it('deve converter para minúsculas', () => {
      expect(toLowerCase('HELLO')).toBe('hello');
    });

    it('deve preservar minúsculas', () => {
      expect(toLowerCase('hello')).toBe('hello');
    });

    it('deve converter letras mistas', () => {
      expect(toLowerCase('HeLLo')).toBe('hello');
    });

    it('deve preservar números', () => {
      expect(toLowerCase('ABC123')).toBe('abc123');
    });

    it('deve preservar caracteres especiais', () => {
      expect(toLowerCase('HELLO-WORLD!')).toBe('hello-world!');
    });

    it('deve lidar com string vazia', () => {
      expect(toLowerCase('')).toBe('');
    });
  });

  describe('isEmpty', () => {
    it('deve retornar true para string vazia', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('deve retornar true para apenas espaços', () => {
      expect(isEmpty('   ')).toBe(true);
    });

    it('deve retornar true para tabs', () => {
      expect(isEmpty('\t\t')).toBe(true);
    });

    it('deve retornar true para newlines', () => {
      expect(isEmpty('\n\n')).toBe(true);
    });

    it('deve retornar false para string válida', () => {
      expect(isEmpty('hello')).toBe(false);
    });

    it('deve retornar false para string com espaços no meio', () => {
      expect(isEmpty('hello world')).toBe(false);
    });

    it('deve retornar false para string com espaços nas pontas', () => {
      expect(isEmpty('  hello  ')).toBe(false);
    });

    it('deve retornar false para um caractere', () => {
      expect(isEmpty('a')).toBe(false);
    });
  });

  describe('truncate', () => {
    describe('Sem ellipsis', () => {
      it('deve truncar string longa', () => {
        expect(truncate('Hello World', 5)).toBe('Hello');
      });

      it('deve retornar string completa se menor que max', () => {
        expect(truncate('Hello', 10)).toBe('Hello');
      });

      it('deve retornar string completa se igual a max', () => {
        expect(truncate('Hello', 5)).toBe('Hello');
      });

      it('deve truncar no tamanho exato', () => {
        expect(truncate('1234567890', 5)).toBe('12345');
      });

      it('deve lidar com string vazia', () => {
        expect(truncate('', 5)).toBe('');
      });

      it('deve lidar com maxLength 0', () => {
        expect(truncate('hello', 0)).toBe('');
      });

      it('deve lidar com maxLength 1', () => {
        expect(truncate('hello', 1)).toBe('h');
      });
    });

    describe('Com ellipsis', () => {
      it('deve adicionar ... ao truncar', () => {
        expect(truncate('Hello World', 5, true)).toBe('He...');
      });

      it('deve retornar completo se menor que max (com ellipsis)', () => {
        expect(truncate('Hello', 10, true)).toBe('Hello');
      });

      it('deve truncar corretamente com ellipsis', () => {
        expect(truncate('1234567890', 8, true)).toBe('12345...');
      });

      it('deve lidar com string vazia (com ellipsis)', () => {
        expect(truncate('', 5, true)).toBe('');
      });

      it('deve lidar com maxLength muito pequeno', () => {
        expect(truncate('hello', 3, true)).toBe('...');
      });

      it('deve adicionar ellipsis em string longa', () => {
        const longString = 'A'.repeat(100);
        const result = truncate(longString, 20, true);
        expect(result).toBe('A'.repeat(17) + '...');
        expect(result.length).toBe(20);
      });
    });
  });

  describe('removeSpecialChars', () => {
    describe('Sem preservar espaços', () => {
      it('deve remover hífen', () => {
        expect(removeSpecialChars('ABC-123')).toBe('ABC123');
      });

      it('deve remover caracteres especiais', () => {
        expect(removeSpecialChars('Hello!@#$%World')).toBe('HelloWorld');
      });

      it('deve remover espaços', () => {
        expect(removeSpecialChars('Hello World')).toBe('HelloWorld');
      });

      it('deve preservar alfanuméricos', () => {
        expect(removeSpecialChars('ABC123xyz')).toBe('ABC123xyz');
      });

      it('deve lidar com string sem especiais', () => {
        expect(removeSpecialChars('HelloWorld123')).toBe('HelloWorld123');
      });

      it('deve lidar com string vazia', () => {
        expect(removeSpecialChars('')).toBe('');
      });

      it('deve lidar com apenas caracteres especiais', () => {
        expect(removeSpecialChars('!@#$%')).toBe('');
      });
    });

    describe('Preservando espaços', () => {
      it('deve preservar espaços', () => {
        expect(removeSpecialChars('Hello World!', true)).toBe('Hello World');
      });

      it('deve remover hífen mas preservar espaços', () => {
        expect(removeSpecialChars('ABC-123 DEF', true)).toBe('ABC123 DEF');
      });

      it('deve preservar múltiplos espaços', () => {
        expect(removeSpecialChars('Hello    World!', true)).toBe('Hello    World');
      });
    });
  });

  describe('normalizeSpaces', () => {
    it('deve normalizar espaços múltiplos', () => {
      expect(normalizeSpaces('Hello    World')).toBe('Hello World');
    });

    it('deve remover espaços extras nas pontas', () => {
      expect(normalizeSpaces('  Hello  World  ')).toBe('Hello World');
    });

    it('deve normalizar tabs para espaço único', () => {
      expect(normalizeSpaces('Hello\t\tWorld')).toBe('Hello World');
    });

    it('deve normalizar newlines para espaço único', () => {
      expect(normalizeSpaces('Hello\n\nWorld')).toBe('Hello World');
    });

    it('deve normalizar mix de whitespace', () => {
      expect(normalizeSpaces('Hello \t\n  World')).toBe('Hello World');
    });

    it('deve retornar string sem alteração se já normalizada', () => {
      expect(normalizeSpaces('Hello World')).toBe('Hello World');
    });

    it('deve lidar com string vazia', () => {
      expect(normalizeSpaces('')).toBe('');
    });

    it('deve lidar com apenas espaços', () => {
      expect(normalizeSpaces('     ')).toBe('');
    });
  });

  describe('capitalize', () => {
    it('deve capitalizar primeira letra', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('deve lowercase o resto', () => {
      expect(capitalize('HELLO')).toBe('Hello');
    });

    it('deve lidar com letras mistas', () => {
      expect(capitalize('hELLO')).toBe('Hello');
    });

    it('deve lidar com um caractere', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('deve preservar espaços internos lowercase', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });

    it('deve lidar com string vazia', () => {
      expect(capitalize('')).toBe('');
    });

    it('deve lidar com número no início', () => {
      expect(capitalize('123abc')).toBe('123abc');
    });
  });

  describe('toCamelCase', () => {
    it('deve converter snake_case', () => {
      expect(toCamelCase('hello_world')).toBe('helloWorld');
    });

    it('deve converter kebab-case', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld');
    });

    it('deve converter espaços', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld');
    });

    it('deve converter múltiplos separadores', () => {
      expect(toCamelCase('hello_world-test case')).toBe('helloWorldTestCase');
    });

    it('deve lidar com string já em camelCase', () => {
      expect(toCamelCase('helloWorld')).toBe('helloworld');
    });

    it('deve lidar com separadores consecutivos', () => {
      expect(toCamelCase('hello__world')).toBe('helloWorld');
    });

    it('deve lidar com string vazia', () => {
      expect(toCamelCase('')).toBe('');
    });

    it('deve lidar com uma palavra', () => {
      expect(toCamelCase('hello')).toBe('hello');
    });

    it('deve lidar com números', () => {
      expect(toCamelCase('hello_world_123')).toBe('helloWorld123');
    });

    it('deve lidar com separador no final', () => {
      expect(toCamelCase('hello_world_')).toBe('helloWorld');
    });
  });

  describe('toSnakeCase', () => {
    it('deve converter camelCase', () => {
      expect(toSnakeCase('helloWorld')).toBe('hello_world');
    });

    it('deve converter PascalCase', () => {
      expect(toSnakeCase('HelloWorld')).toBe('hello_world');
    });

    it('deve converter string com maiúsculas consecutivas', () => {
      expect(toSnakeCase('HTTPSConnection')).toBe('h_t_t_p_s_connection');
    });

    it('deve lidar com string já em snake_case', () => {
      expect(toSnakeCase('hello_world')).toBe('hello_world');
    });

    it('deve lidar com uma palavra lowercase', () => {
      expect(toSnakeCase('hello')).toBe('hello');
    });

    it('deve lidar com uma palavra uppercase', () => {
      expect(toSnakeCase('HELLO')).toBe('h_e_l_l_o');
    });

    it('deve lidar com string vazia', () => {
      expect(toSnakeCase('')).toBe('');
    });

    it('deve lidar com números', () => {
      expect(toSnakeCase('hello123World')).toBe('hello123_world');
    });

    it('deve remover underscore inicial', () => {
      const result = toSnakeCase('HelloWorld');
      expect(result.startsWith('_')).toBe(false);
    });

    it('deve converter string complexa', () => {
      expect(toSnakeCase('getUserProfileData')).toBe('get_user_profile_data');
    });
  });

  describe('Integração - Combinando funções', () => {
    it('deve normalizar e capitalizar', () => {
      const input = '  hello    world  ';
      const result = capitalize(normalizeSpaces(input));
      expect(result).toBe('Hello world');
    });

    it('deve truncar e uppercase', () => {
      const input = 'hello world';
      const result = toUpperCase(truncate(input, 5));
      expect(result).toBe('HELLO');
    });

    it('deve remover especiais e converter para camelCase', () => {
      const input = 'hello-world!@#';
      const normalized = removeSpecialChars(input);
      const result = toCamelCase(normalized);
      expect(result).toBe('helloworld');
    });

    it('deve converter para snake_case e uppercase', () => {
      const input = 'getUserData';
      const snake = toSnakeCase(input);
      const result = toUpperCase(snake);
      expect(result).toBe('GET_USER_DATA');
    });
  });
});
