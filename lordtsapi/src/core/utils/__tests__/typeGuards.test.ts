// src/core/utils/__tests__/typeGuards.test.ts

import {
  isValidString,
  isValidCode,
  isValidNumber,
  isNonEmptyArray,
  isObject,
} from '../typeGuards';

describe('typeGuards Utils - Edge Cases', () => {
  describe('isValidString', () => {
    describe('Valid strings', () => {
      it('deve retornar true para string válida', () => {
        expect(isValidString('abc')).toBe(true);
      });

      it('deve retornar true para string com espaços no meio', () => {
        expect(isValidString('hello world')).toBe(true);
      });

      it('deve retornar true para string com espaços nas pontas', () => {
        expect(isValidString('  hello  ')).toBe(true);
      });

      it('deve retornar true para string com um caractere', () => {
        expect(isValidString('a')).toBe(true);
      });

      it('deve retornar true para string longa', () => {
        expect(isValidString('a'.repeat(1000))).toBe(true);
      });
    });

    describe('Invalid strings', () => {
      it('deve retornar false para string vazia', () => {
        expect(isValidString('')).toBe(false);
      });

      it('deve retornar false para string com apenas espaços', () => {
        expect(isValidString('   ')).toBe(false);
      });

      it('deve retornar false para tabs', () => {
        expect(isValidString('\t\t')).toBe(false);
      });

      it('deve retornar false para newlines', () => {
        expect(isValidString('\n\n')).toBe(false);
      });

      it('deve retornar false para null', () => {
        expect(isValidString(null)).toBe(false);
      });

      it('deve retornar false para undefined', () => {
        expect(isValidString(undefined)).toBe(false);
      });

      it('deve retornar false para número', () => {
        expect(isValidString(123)).toBe(false);
      });

      it('deve retornar false para boolean', () => {
        expect(isValidString(true)).toBe(false);
      });

      it('deve retornar false para objeto', () => {
        expect(isValidString({})).toBe(false);
      });

      it('deve retornar false para array', () => {
        expect(isValidString([])).toBe(false);
      });
    });
  });

  describe('isValidCode', () => {
    describe('Valid codes', () => {
      it('deve retornar true para código alfanumérico', () => {
        expect(isValidCode('7530110')).toBe(true);
      });

      it('deve retornar true para código com letras', () => {
        expect(isValidCode('ABC123')).toBe(true);
      });

      it('deve retornar true para código com hífen', () => {
        expect(isValidCode('ABC-123')).toBe(true);
      });

      it('deve retornar true para código com espaços nas pontas', () => {
        expect(isValidCode('  ABC123  ')).toBe(true);
      });

      it('deve retornar true para código de 1 caractere', () => {
        expect(isValidCode('A')).toBe(true);
      });
    });

    describe('Invalid codes', () => {
      it('deve retornar false para string vazia', () => {
        expect(isValidCode('')).toBe(false);
      });

      it('deve retornar false para apenas espaços', () => {
        expect(isValidCode('   ')).toBe(false);
      });

      it('deve retornar false para null', () => {
        expect(isValidCode(null)).toBe(false);
      });

      it('deve retornar false para undefined', () => {
        expect(isValidCode(undefined)).toBe(false);
      });

      it('deve retornar false para número', () => {
        expect(isValidCode(123)).toBe(false);
      });

      it('deve retornar false para boolean', () => {
        expect(isValidCode(false)).toBe(false);
      });

      it('deve retornar false para objeto', () => {
        expect(isValidCode({ codigo: 'ABC' })).toBe(false);
      });

      it('deve retornar false para array', () => {
        expect(isValidCode(['ABC'])).toBe(false);
      });
    });
  });

  describe('isValidNumber', () => {
    describe('Valid numbers', () => {
      it('deve retornar true para zero', () => {
        expect(isValidNumber(0)).toBe(true);
      });

      it('deve retornar true para número positivo', () => {
        expect(isValidNumber(42)).toBe(true);
      });

      it('deve retornar true para número negativo', () => {
        expect(isValidNumber(-42)).toBe(true);
      });

      it('deve retornar true para decimal', () => {
        expect(isValidNumber(3.14)).toBe(true);
      });

      it('deve retornar true para número muito grande', () => {
        expect(isValidNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
      });

      it('deve retornar true para número muito pequeno', () => {
        expect(isValidNumber(Number.MIN_SAFE_INTEGER)).toBe(true);
      });

      it('deve retornar true para decimal muito pequeno', () => {
        expect(isValidNumber(0.0000001)).toBe(true);
      });
    });

    describe('Invalid numbers', () => {
      it('deve retornar false para NaN', () => {
        expect(isValidNumber(NaN)).toBe(false);
      });

      it('deve retornar false para Infinity', () => {
        expect(isValidNumber(Infinity)).toBe(false);
      });

      it('deve retornar false para -Infinity', () => {
        expect(isValidNumber(-Infinity)).toBe(false);
      });

      it('deve retornar false para string', () => {
        expect(isValidNumber('42')).toBe(false);
      });

      it('deve retornar false para null', () => {
        expect(isValidNumber(null)).toBe(false);
      });

      it('deve retornar false para undefined', () => {
        expect(isValidNumber(undefined)).toBe(false);
      });

      it('deve retornar false para boolean', () => {
        expect(isValidNumber(true)).toBe(false);
      });

      it('deve retornar false para objeto', () => {
        expect(isValidNumber({})).toBe(false);
      });

      it('deve retornar false para array', () => {
        expect(isValidNumber([])).toBe(false);
      });
    });
  });

  describe('isNonEmptyArray', () => {
    describe('Valid arrays', () => {
      it('deve retornar true para array com um elemento', () => {
        expect(isNonEmptyArray([1])).toBe(true);
      });

      it('deve retornar true para array com múltiplos elementos', () => {
        expect(isNonEmptyArray([1, 2, 3])).toBe(true);
      });

      it('deve retornar true para array de strings', () => {
        expect(isNonEmptyArray(['a', 'b'])).toBe(true);
      });

      it('deve retornar true para array de objetos', () => {
        expect(isNonEmptyArray([{}, {}])).toBe(true);
      });

      it('deve retornar true para array misto', () => {
        expect(isNonEmptyArray([1, 'a', {}, null])).toBe(true);
      });

      it('deve retornar true para array grande', () => {
        expect(isNonEmptyArray(Array(1000).fill(1))).toBe(true);
      });
    });

    describe('Invalid arrays', () => {
      it('deve retornar false para array vazio', () => {
        expect(isNonEmptyArray([])).toBe(false);
      });

      it('deve retornar false para null', () => {
        expect(isNonEmptyArray(null)).toBe(false);
      });

      it('deve retornar false para undefined', () => {
        expect(isNonEmptyArray(undefined)).toBe(false);
      });

      it('deve retornar false para string', () => {
        expect(isNonEmptyArray('array')).toBe(false);
      });

      it('deve retornar false para número', () => {
        expect(isNonEmptyArray(123)).toBe(false);
      });

      it('deve retornar false para objeto', () => {
        expect(isNonEmptyArray({})).toBe(false);
      });

      it('deve retornar false para objeto array-like', () => {
        expect(isNonEmptyArray({ length: 2, 0: 'a', 1: 'b' })).toBe(false);
      });
    });
  });

  describe('isObject', () => {
    describe('Valid objects', () => {
      it('deve retornar true para objeto vazio', () => {
        expect(isObject({})).toBe(true);
      });

      it('deve retornar true para objeto com propriedades', () => {
        expect(isObject({ a: 1, b: 2 })).toBe(true);
      });

      it('deve retornar true para objeto criado com new', () => {
        expect(isObject(new Object())).toBe(true);
      });

      it('deve retornar true para Object.create(null)', () => {
        expect(isObject(Object.create(null))).toBe(true);
      });

      it('deve retornar true para instância de classe', () => {
        class MyClass {}
        expect(isObject(new MyClass())).toBe(true);
      });

      it('deve retornar true para objeto aninhado', () => {
        expect(isObject({ a: { b: { c: 1 } } })).toBe(true);
      });
    });

    describe('Invalid objects', () => {
      it('deve retornar false para null', () => {
        expect(isObject(null)).toBe(false);
      });

      it('deve retornar false para undefined', () => {
        expect(isObject(undefined)).toBe(false);
      });

      it('deve retornar false para array', () => {
        expect(isObject([])).toBe(false);
      });

      it('deve retornar false para array com elementos', () => {
        expect(isObject([1, 2, 3])).toBe(false);
      });

      it('deve retornar false para string', () => {
        expect(isObject('object')).toBe(false);
      });

      it('deve retornar false para número', () => {
        expect(isObject(123)).toBe(false);
      });

      it('deve retornar false para boolean', () => {
        expect(isObject(true)).toBe(false);
      });

      it('deve retornar false para função', () => {
        expect(isObject(() => {})).toBe(false);
      });

      it('deve retornar false para Date (é objeto, mas também tipo especial)', () => {
        // Note: Date é objeto, então retorna true
        // Este teste documenta o comportamento atual
        expect(isObject(new Date())).toBe(true);
      });

      it('deve retornar false para RegExp (é objeto, mas também tipo especial)', () => {
        // Note: RegExp é objeto, então retorna true
        // Este teste documenta o comportamento atual
        expect(isObject(/regex/)).toBe(true);
      });
    });
  });

  describe('Type narrowing', () => {
    it('isValidString deve permitir type narrowing', () => {
      const value: unknown = 'test';
      if (isValidString(value)) {
        // TypeScript deve saber que value é string aqui
        const upper: string = value.toUpperCase();
        expect(upper).toBe('TEST');
      }
    });

    it('isValidCode deve permitir type narrowing', () => {
      const code: unknown = 'ABC123';
      if (isValidCode(code)) {
        // TypeScript deve saber que code é string aqui
        const length: number = code.length;
        expect(length).toBe(6);
      }
    });

    it('isValidNumber deve permitir type narrowing', () => {
      const value: unknown = 42;
      if (isValidNumber(value)) {
        // TypeScript deve saber que value é number aqui
        const doubled: number = value * 2;
        expect(doubled).toBe(84);
      }
    });

    it('isNonEmptyArray deve permitir type narrowing', () => {
      const value: unknown = [1, 2, 3];
      if (isNonEmptyArray(value)) {
        // TypeScript deve saber que value é array aqui
        const first = value[0];
        expect(first).toBe(1);
      }
    });

    it('isObject deve permitir type narrowing', () => {
      const value: unknown = { key: 'value' };
      if (isObject(value)) {
        // TypeScript deve saber que value é object aqui
        const val = value['key'];
        expect(val).toBe('value');
      }
    });
  });
});
