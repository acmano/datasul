// src/domain/value-objects/__tests__/ItemCodigo.test.ts

import { ItemCodigo } from '../ItemCodigo';

describe('ItemCodigo (Value Object) - Edge Cases', () => {
  describe('create', () => {
    describe('Happy Path', () => {
      it('deve criar código válido', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('7530110');

        // Assert
        expect(codigo.value).toBe('7530110');
        expect(codigo.isValid).toBe(true);
      });

      it('deve criar código com letras e números', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('ABC123');

        // Assert
        expect(codigo.value).toBe('ABC123');
      });

      it('deve criar código com hífen', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('ABC-123');

        // Assert
        expect(codigo.value).toBe('ABC-123');
      });
    });

    describe('Edge Cases - Tamanho', () => {
      it('deve aceitar código com 1 caractere (mínimo)', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('A');

        // Assert
        expect(codigo.value).toBe('A');
        expect(codigo.value.length).toBe(1);
      });

      it('deve aceitar código com 16 caracteres (máximo)', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('1234567890123456');

        // Assert
        expect(codigo.value).toBe('1234567890123456');
        expect(codigo.value.length).toBe(16);
      });

      it('deve lançar erro quando código está vazio', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('')).toThrow(
          'Código do item não pode ser vazio'
        );
      });

      it('deve lançar erro quando código é apenas espaços', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('   ')).toThrow(
          'Código do item não pode ser vazio'
        );
      });

      it('deve lançar erro quando código tem mais de 16 caracteres', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('12345678901234567')).toThrow(
          'Código do item não pode exceder 16 caracteres'
        );
      });
    });

    describe('Edge Cases - Formatação', () => {
      it('deve converter para maiúsculas', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('abc123');

        // Assert
        expect(codigo.value).toBe('ABC123');
      });

      it('deve converter letras minúsculas mistas', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('AbC123XyZ');

        // Assert
        expect(codigo.value).toBe('ABC123XYZ');
      });

      it('deve fazer trim em espaços à esquerda', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('   ABC123');

        // Assert
        expect(codigo.value).toBe('ABC123');
      });

      it('deve fazer trim em espaços à direita', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('ABC123   ');

        // Assert
        expect(codigo.value).toBe('ABC123');
      });

      it('deve fazer trim em espaços em ambos os lados', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('  ABC123  ');

        // Assert
        expect(codigo.value).toBe('ABC123');
      });
    });

    describe('Edge Cases - Caracteres Válidos', () => {
      it('deve aceitar apenas números', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('1234567890');

        // Assert
        expect(codigo.value).toBe('1234567890');
      });

      it('deve aceitar apenas letras', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('ABCDEFGH');

        // Assert
        expect(codigo.value).toBe('ABCDEFGH');
      });

      it('deve aceitar múltiplos hífens', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('A-B-C-1-2-3');

        // Assert
        expect(codigo.value).toBe('A-B-C-1-2-3');
      });

      it('deve aceitar hífen no início', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('-ABC123');

        // Assert
        expect(codigo.value).toBe('-ABC123');
      });

      it('deve aceitar hífen no final', () => {
        // Arrange & Act
        const codigo = ItemCodigo.create('ABC123-');

        // Assert
        expect(codigo.value).toBe('ABC123-');
      });
    });

    describe('Edge Cases - Caracteres Inválidos', () => {
      it('deve lançar erro para caractere @', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('ABC@123')).toThrow(
          'Código do item contém caracteres inválidos'
        );
      });

      it('deve lançar erro para caractere #', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('ABC#123')).toThrow(
          'Código do item contém caracteres inválidos'
        );
      });

      it('deve lançar erro para caractere $', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('ABC$123')).toThrow(
          'Código do item contém caracteres inválidos'
        );
      });

      it('deve lançar erro para caractere %', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('ABC%123')).toThrow(
          'Código do item contém caracteres inválidos'
        );
      });

      it('deve lançar erro para espaço interno', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('ABC 123')).toThrow(
          'Código do item contém caracteres inválidos'
        );
      });

      it('deve lançar erro para underscore', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('ABC_123')).toThrow(
          'Código do item contém caracteres inválidos'
        );
      });

      it('deve lançar erro para ponto', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('ABC.123')).toThrow(
          'Código do item contém caracteres inválidos'
        );
      });

      it('deve lançar erro para vírgula', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('ABC,123')).toThrow(
          'Código do item contém caracteres inválidos'
        );
      });

      it('deve lançar erro para barra', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('ABC/123')).toThrow(
          'Código do item contém caracteres inválidos'
        );
      });

      it('deve lançar erro para caracteres Unicode', () => {
        // Arrange & Act & Assert
        expect(() => ItemCodigo.create('ABÇ123')).toThrow(
          'Código do item contém caracteres inválidos'
        );
      });
    });
  });

  describe('Métodos', () => {
    describe('equals', () => {
      it('deve retornar true para códigos iguais', () => {
        // Arrange
        const codigo1 = ItemCodigo.create('ABC123');
        const codigo2 = ItemCodigo.create('ABC123');

        // Act & Assert
        expect(codigo1.equals(codigo2)).toBe(true);
      });

      it('deve retornar true para códigos iguais (diferentes casos)', () => {
        // Arrange
        const codigo1 = ItemCodigo.create('abc123');
        const codigo2 = ItemCodigo.create('ABC123');

        // Act & Assert
        expect(codigo1.equals(codigo2)).toBe(true);
      });

      it('deve retornar false para códigos diferentes', () => {
        // Arrange
        const codigo1 = ItemCodigo.create('ABC123');
        const codigo2 = ItemCodigo.create('XYZ789');

        // Act & Assert
        expect(codigo1.equals(codigo2)).toBe(false);
      });

      it('deve retornar false para não-ItemCodigo', () => {
        // Arrange
        const codigo = ItemCodigo.create('ABC123');

        // Act & Assert
        expect(codigo.equals({} as ItemCodigo)).toBe(false);
      });

      it('deve ser reflexivo (x.equals(x) = true)', () => {
        // Arrange
        const codigo = ItemCodigo.create('ABC123');

        // Act & Assert
        expect(codigo.equals(codigo)).toBe(true);
      });

      it('deve ser simétrico (x.equals(y) = y.equals(x))', () => {
        // Arrange
        const codigo1 = ItemCodigo.create('ABC123');
        const codigo2 = ItemCodigo.create('ABC123');

        // Act & Assert
        expect(codigo1.equals(codigo2)).toBe(codigo2.equals(codigo1));
      });
    });

    describe('toString', () => {
      it('deve retornar o valor do código', () => {
        // Arrange
        const codigo = ItemCodigo.create('ABC123');

        // Act
        const result = codigo.toString();

        // Assert
        expect(result).toBe('ABC123');
      });

      it('deve retornar valor em maiúsculas', () => {
        // Arrange
        const codigo = ItemCodigo.create('abc123');

        // Act
        const result = codigo.toString();

        // Assert
        expect(result).toBe('ABC123');
      });
    });

    describe('toJSON', () => {
      it('deve retornar o valor do código', () => {
        // Arrange
        const codigo = ItemCodigo.create('ABC123');

        // Act
        const result = codigo.toJSON();

        // Assert
        expect(result).toBe('ABC123');
      });

      it('deve ser serializável em JSON.stringify', () => {
        // Arrange
        const codigo = ItemCodigo.create('ABC123');

        // Act
        const json = JSON.stringify({ codigo });

        // Assert
        expect(json).toBe('{"codigo":"ABC123"}');
      });
    });

    describe('isValid', () => {
      it('deve sempre retornar true para códigos criados', () => {
        // Arrange
        const codigo1 = ItemCodigo.create('A');
        const codigo2 = ItemCodigo.create('ABC123');
        const codigo3 = ItemCodigo.create('1234567890123456');

        // Act & Assert
        expect(codigo1.isValid).toBe(true);
        expect(codigo2.isValid).toBe(true);
        expect(codigo3.isValid).toBe(true);
      });
    });
  });

  describe('Imutabilidade', () => {
    it('value não deve ser alterável', () => {
      // Arrange
      const codigo = ItemCodigo.create('ABC123');
      const valorOriginal = codigo.value;

      // Act - Tentar alterar (TypeScript previne, mas verificamos runtime)
      // @ts-expect-error - Tentando alterar propriedade readonly
      codigo._value = 'XYZ789';

      // Assert
      expect(codigo.value).toBe(valorOriginal);
    });

    it('deve criar novas instâncias para diferentes valores', () => {
      // Arrange
      const codigo1 = ItemCodigo.create('ABC123');
      const codigo2 = ItemCodigo.create('XYZ789');

      // Act & Assert
      expect(codigo1).not.toBe(codigo2);
      expect(codigo1.value).not.toBe(codigo2.value);
    });

    it('mesma entrada deve criar instâncias diferentes mas equivalentes', () => {
      // Arrange
      const codigo1 = ItemCodigo.create('ABC123');
      const codigo2 = ItemCodigo.create('ABC123');

      // Act & Assert
      expect(codigo1).not.toBe(codigo2); // Instâncias diferentes
      expect(codigo1.equals(codigo2)).toBe(true); // Mas valores iguais
    });
  });
});
