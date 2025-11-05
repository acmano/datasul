// src/domain/value-objects/__tests__/Descricao.test.ts

import { Descricao } from '../Descricao';

describe('Descricao (Value Object) - Edge Cases', () => {
  describe('create', () => {
    describe('Happy Path', () => {
      it('deve criar descrição válida', () => {
        // Arrange & Act
        const desc = Descricao.create('TORNEIRA MONOCOMANDO');

        // Assert
        expect(desc.value).toBe('TORNEIRA MONOCOMANDO');
        expect(desc.isEmpty).toBe(false);
      });

      it('deve criar descrição curta', () => {
        // Arrange & Act
        const desc = Descricao.create('A');

        // Assert
        expect(desc.value).toBe('A');
        expect(desc.length).toBe(1);
      });

      it('deve criar descrição com caracteres especiais', () => {
        // Arrange & Act
        const desc = Descricao.create('ITEM (NOVO) - 50%');

        // Assert
        expect(desc.value).toBe('ITEM (NOVO) - 50%');
      });
    });

    describe('Edge Cases - Tamanho', () => {
      it('deve aceitar descrição com 1 caractere (mínimo)', () => {
        // Arrange & Act
        const desc = Descricao.create('X');

        // Assert
        expect(desc.value).toBe('X');
        expect(desc.length).toBe(1);
      });

      it('deve aceitar descrição com 255 caracteres (máximo)', () => {
        // Arrange
        const descricaoMaxima = 'A'.repeat(255);

        // Act
        const desc = Descricao.create(descricaoMaxima);

        // Assert
        expect(desc.value.length).toBe(255);
        expect(desc.length).toBe(255);
      });

      it('deve lançar erro quando descrição está vazia', () => {
        // Arrange & Act & Assert
        expect(() => Descricao.create('')).toThrow(
          'Descrição não pode ser vazia'
        );
      });

      it('deve lançar erro quando descrição é apenas espaços', () => {
        // Arrange & Act & Assert
        expect(() => Descricao.create('   ')).toThrow(
          'Descrição não pode ser vazia'
        );
      });

      it('deve lançar erro quando descrição tem mais de 255 caracteres', () => {
        // Arrange
        const descricaoMuitoLonga = 'A'.repeat(256);

        // Act & Assert
        expect(() => Descricao.create(descricaoMuitoLonga)).toThrow(
          'Descrição não pode exceder 255 caracteres'
        );
      });

      it('deve lançar erro para descrição com 1000 caracteres', () => {
        // Arrange
        const descricaoMuitoLonga = 'A'.repeat(1000);

        // Act & Assert
        expect(() => Descricao.create(descricaoMuitoLonga)).toThrow(
          'Descrição não pode exceder 255 caracteres'
        );
      });
    });

    describe('Edge Cases - Formatação', () => {
      it('deve fazer trim em espaços à esquerda', () => {
        // Arrange & Act
        const desc = Descricao.create('   TORNEIRA');

        // Assert
        expect(desc.value).toBe('TORNEIRA');
      });

      it('deve fazer trim em espaços à direita', () => {
        // Arrange & Act
        const desc = Descricao.create('TORNEIRA   ');

        // Assert
        expect(desc.value).toBe('TORNEIRA');
      });

      it('deve fazer trim em espaços em ambos os lados', () => {
        // Arrange & Act
        const desc = Descricao.create('  TORNEIRA  ');

        // Assert
        expect(desc.value).toBe('TORNEIRA');
      });

      it('deve preservar espaços internos', () => {
        // Arrange & Act
        const desc = Descricao.create('TORNEIRA  MONOCOMANDO  CROMADA');

        // Assert
        expect(desc.value).toBe('TORNEIRA  MONOCOMANDO  CROMADA');
      });

      it('deve preservar tabs internos', () => {
        // Arrange & Act
        const desc = Descricao.create('TORNEIRA\tMONOCOMANDO');

        // Assert
        expect(desc.value).toBe('TORNEIRA\tMONOCOMANDO');
      });

      it('não deve converter para maiúsculas', () => {
        // Arrange & Act
        const desc = Descricao.create('Torneira Monocomando');

        // Assert
        expect(desc.value).toBe('Torneira Monocomando');
      });
    });

    describe('Edge Cases - Caracteres Especiais', () => {
      it('deve aceitar números', () => {
        // Arrange & Act
        const desc = Descricao.create('TORNEIRA 1/2 POLEGADA');

        // Assert
        expect(desc.value).toBe('TORNEIRA 1/2 POLEGADA');
      });

      it('deve aceitar parênteses', () => {
        // Arrange & Act
        const desc = Descricao.create('TORNEIRA (CROMADA)');

        // Assert
        expect(desc.value).toBe('TORNEIRA (CROMADA)');
      });

      it('deve aceitar hífen', () => {
        // Arrange & Act
        const desc = Descricao.create('TORNEIRA-MONOCOMANDO');

        // Assert
        expect(desc.value).toBe('TORNEIRA-MONOCOMANDO');
      });

      it('deve aceitar barra', () => {
        // Arrange & Act
        const desc = Descricao.create('TORNEIRA 1/2"');

        // Assert
        expect(desc.value).toBe('TORNEIRA 1/2"');
      });

      it('deve aceitar porcentagem', () => {
        // Arrange & Act
        const desc = Descricao.create('DESCONTO 50%');

        // Assert
        expect(desc.value).toBe('DESCONTO 50%');
      });

      it('deve aceitar Unicode', () => {
        // Arrange & Act
        const desc = Descricao.create('VÁLVULA Ø 3/4"');

        // Assert
        expect(desc.value).toBe('VÁLVULA Ø 3/4"');
      });

      it('deve aceitar acentos', () => {
        // Arrange & Act
        const desc = Descricao.create('SOLUÇÃO AQUOSA');

        // Assert
        expect(desc.value).toBe('SOLUÇÃO AQUOSA');
      });
    });
  });

  describe('empty', () => {
    it('deve criar descrição vazia com hífen', () => {
      // Arrange & Act
      const desc = Descricao.empty();

      // Assert
      expect(desc.value).toBe('-');
      expect(desc.isEmpty).toBe(true);
    });

    it('descrição vazia deve ter length 1', () => {
      // Arrange & Act
      const desc = Descricao.empty();

      // Assert
      expect(desc.length).toBe(1);
    });
  });

  describe('Propriedades', () => {
    describe('isEmpty', () => {
      it('deve retornar false para descrição válida', () => {
        // Arrange
        const desc = Descricao.create('TORNEIRA');

        // Act & Assert
        expect(desc.isEmpty).toBe(false);
      });

      it('deve retornar true para descrição vazia (hífen)', () => {
        // Arrange
        const desc = Descricao.empty();

        // Act & Assert
        expect(desc.isEmpty).toBe(true);
      });

      it('deve retornar false para descrição com um caractere', () => {
        // Arrange
        const desc = Descricao.create('A');

        // Act & Assert
        expect(desc.isEmpty).toBe(false);
      });
    });

    describe('length', () => {
      it('deve retornar tamanho correto', () => {
        // Arrange
        const desc = Descricao.create('TORNEIRA');

        // Act & Assert
        expect(desc.length).toBe(8);
      });

      it('deve retornar 1 para descrição vazia', () => {
        // Arrange
        const desc = Descricao.empty();

        // Act & Assert
        expect(desc.length).toBe(1);
      });

      it('deve retornar 255 para descrição máxima', () => {
        // Arrange
        const desc = Descricao.create('A'.repeat(255));

        // Act & Assert
        expect(desc.length).toBe(255);
      });
    });
  });

  describe('Métodos', () => {
    describe('equals', () => {
      it('deve retornar true para descrições iguais', () => {
        // Arrange
        const desc1 = Descricao.create('TORNEIRA');
        const desc2 = Descricao.create('TORNEIRA');

        // Act & Assert
        expect(desc1.equals(desc2)).toBe(true);
      });

      it('deve retornar false para descrições diferentes', () => {
        // Arrange
        const desc1 = Descricao.create('TORNEIRA');
        const desc2 = Descricao.create('VALVULA');

        // Act & Assert
        expect(desc1.equals(desc2)).toBe(false);
      });

      it('deve retornar false para não-Descricao', () => {
        // Arrange
        const desc = Descricao.create('TORNEIRA');

        // Act & Assert
        expect(desc.equals({} as Descricao)).toBe(false);
      });

      it('deve ser case-sensitive', () => {
        // Arrange
        const desc1 = Descricao.create('TORNEIRA');
        const desc2 = Descricao.create('torneira');

        // Act & Assert
        expect(desc1.equals(desc2)).toBe(false);
      });

      it('deve ser reflexivo (x.equals(x) = true)', () => {
        // Arrange
        const desc = Descricao.create('TORNEIRA');

        // Act & Assert
        expect(desc.equals(desc)).toBe(true);
      });

      it('deve ser simétrico (x.equals(y) = y.equals(x))', () => {
        // Arrange
        const desc1 = Descricao.create('TORNEIRA');
        const desc2 = Descricao.create('TORNEIRA');

        // Act & Assert
        expect(desc1.equals(desc2)).toBe(desc2.equals(desc1));
      });
    });

    describe('toString', () => {
      it('deve retornar o valor da descrição', () => {
        // Arrange
        const desc = Descricao.create('TORNEIRA MONOCOMANDO');

        // Act
        const result = desc.toString();

        // Assert
        expect(result).toBe('TORNEIRA MONOCOMANDO');
      });
    });

    describe('toJSON', () => {
      it('deve retornar o valor da descrição', () => {
        // Arrange
        const desc = Descricao.create('TORNEIRA');

        // Act
        const result = desc.toJSON();

        // Assert
        expect(result).toBe('TORNEIRA');
      });

      it('deve ser serializável em JSON.stringify', () => {
        // Arrange
        const desc = Descricao.create('TORNEIRA');

        // Act
        const json = JSON.stringify({ descricao: desc });

        // Assert
        expect(json).toBe('{"descricao":"TORNEIRA"}');
      });
    });

    describe('abbreviate', () => {
      it('deve retornar descrição completa quando menor que max', () => {
        // Arrange
        const desc = Descricao.create('TORNEIRA');

        // Act
        const result = desc.abbreviate(20);

        // Assert
        expect(result).toBe('TORNEIRA');
      });

      it('deve retornar descrição completa quando igual a max', () => {
        // Arrange
        const desc = Descricao.create('TORNEIRA');

        // Act
        const result = desc.abbreviate(8);

        // Assert
        expect(result).toBe('TORNEIRA');
      });

      it('deve abreviar quando maior que max', () => {
        // Arrange
        const desc = Descricao.create('TORNEIRA MONOCOMANDO CROMADA');

        // Act
        const result = desc.abbreviate(15);

        // Assert
        expect(result).toBe('TORNEIRA MON...');
        expect(result.length).toBe(15);
      });

      it('deve abreviar para 10 caracteres', () => {
        // Arrange
        const desc = Descricao.create('TORNEIRA MONOCOMANDO');

        // Act
        const result = desc.abbreviate(10);

        // Assert
        expect(result).toBe('TORNEIRA...');
        expect(result.length).toBe(10);
      });

      it('deve abreviar para 3 caracteres', () => {
        // Arrange
        const desc = Descricao.create('TORNEIRA');

        // Act
        const result = desc.abbreviate(3);

        // Assert
        expect(result).toBe('...');
        expect(result.length).toBe(3);
      });

      it('deve abreviar descrição longa', () => {
        // Arrange
        const descLonga = 'A'.repeat(100);
        const desc = Descricao.create(descLonga);

        // Act
        const result = desc.abbreviate(20);

        // Assert
        expect(result.length).toBe(20);
        expect(result.endsWith('...')).toBe(true);
      });
    });
  });

  describe('Imutabilidade', () => {
    it('value não deve ser alterável', () => {
      // Arrange
      const desc = Descricao.create('TORNEIRA');
      const valorOriginal = desc.value;

      // Act - Tentar alterar (TypeScript previne, mas verificamos runtime)
      // @ts-expect-error - Tentando alterar propriedade readonly
      desc._value = 'VALVULA';

      // Assert
      expect(desc.value).toBe(valorOriginal);
    });

    it('abbreviate não deve alterar o objeto original', () => {
      // Arrange
      const desc = Descricao.create('TORNEIRA MONOCOMANDO');

      // Act
      const abreviado = desc.abbreviate(10);

      // Assert
      expect(desc.value).toBe('TORNEIRA MONOCOMANDO');
      expect(abreviado).toBe('TORNEIRA...');
    });
  });
});
