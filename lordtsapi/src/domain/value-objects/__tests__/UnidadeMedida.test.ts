// src/domain/value-objects/__tests__/UnidadeMedida.test.ts

import { UnidadeMedida } from '../UnidadeMedida';

describe('UnidadeMedida (Value Object) - Edge Cases', () => {
  describe('create', () => {
    describe('Happy Path', () => {
      it('deve criar unidade válida', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('UN');

        // Assert
        expect(un.value).toBe('UN');
        expect(un.descricao).toBe('Unidade');
      });

      it('deve criar unidade conhecida KG', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('KG');

        // Assert
        expect(un.value).toBe('KG');
        expect(un.descricao).toBe('Quilograma');
        expect(un.isConhecida).toBe(true);
      });

      it('deve criar unidade não conhecida', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('XYZ');

        // Assert
        expect(un.value).toBe('XYZ');
        expect(un.descricao).toBe('XYZ'); // Retorna o próprio código
        expect(un.isConhecida).toBe(false);
      });
    });

    describe('Edge Cases - Tamanho', () => {
      it('deve aceitar unidade com 1 caractere (mínimo)', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('L');

        // Assert
        expect(un.value).toBe('L');
        expect(un.descricao).toBe('Litro');
      });

      it('deve aceitar unidade com 4 caracteres (máximo)', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('ABCD');

        // Assert
        expect(un.value).toBe('ABCD');
        expect(un.value.length).toBe(4);
      });

      it('deve lançar erro quando unidade está vazia', () => {
        // Arrange & Act & Assert
        expect(() => UnidadeMedida.create('')).toThrow(
          'Unidade de medida não pode ser vazia'
        );
      });

      it('deve lançar erro quando unidade é apenas espaços', () => {
        // Arrange & Act & Assert
        expect(() => UnidadeMedida.create('   ')).toThrow(
          'Unidade de medida não pode ser vazia'
        );
      });

      it('deve lançar erro quando unidade tem mais de 4 caracteres', () => {
        // Arrange & Act & Assert
        expect(() => UnidadeMedida.create('ABCDE')).toThrow(
          'Unidade de medida não pode exceder 4 caracteres'
        );
      });
    });

    describe('Edge Cases - Formatação', () => {
      it('deve converter para maiúsculas', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('un');

        // Assert
        expect(un.value).toBe('UN');
      });

      it('deve converter letras minúsculas mistas', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('Kg');

        // Assert
        expect(un.value).toBe('KG');
      });

      it('deve fazer trim em espaços à esquerda', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('   UN');

        // Assert
        expect(un.value).toBe('UN');
      });

      it('deve fazer trim em espaços à direita', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('UN   ');

        // Assert
        expect(un.value).toBe('UN');
      });

      it('deve fazer trim e converter para maiúsculas', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('  kg  ');

        // Assert
        expect(un.value).toBe('KG');
      });
    });

    describe('Unidades Conhecidas', () => {
      it('deve reconhecer UN como Unidade', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('UN');

        // Assert
        expect(un.descricao).toBe('Unidade');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer KG como Quilograma', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('KG');

        // Assert
        expect(un.descricao).toBe('Quilograma');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer G como Grama', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('G');

        // Assert
        expect(un.descricao).toBe('Grama');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer M como Metro', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('M');

        // Assert
        expect(un.descricao).toBe('Metro');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer CM como Centímetro', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('CM');

        // Assert
        expect(un.descricao).toBe('Centímetro');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer L como Litro', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('L');

        // Assert
        expect(un.descricao).toBe('Litro');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer ML como Mililitro', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('ML');

        // Assert
        expect(un.descricao).toBe('Mililitro');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer PC como Peça', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('PC');

        // Assert
        expect(un.descricao).toBe('Peça');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer CX como Caixa', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('CX');

        // Assert
        expect(un.descricao).toBe('Caixa');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer PAR como Par', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('PAR');

        // Assert
        expect(un.descricao).toBe('Par');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer JG como Jogo', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('JG');

        // Assert
        expect(un.descricao).toBe('Jogo');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer KIT como Kit', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('KIT');

        // Assert
        expect(un.descricao).toBe('Kit');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer M2 como Metro Quadrado', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('M2');

        // Assert
        expect(un.descricao).toBe('Metro Quadrado');
        expect(un.isConhecida).toBe(true);
      });

      it('deve reconhecer M3 como Metro Cúbico', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('M3');

        // Assert
        expect(un.descricao).toBe('Metro Cúbico');
        expect(un.isConhecida).toBe(true);
      });

      it('deve retornar código para unidade desconhecida', () => {
        // Arrange & Act
        const un = UnidadeMedida.create('XYZ');

        // Assert
        expect(un.descricao).toBe('XYZ');
        expect(un.isConhecida).toBe(false);
      });
    });
  });

  describe('Propriedades', () => {
    describe('isConhecida', () => {
      it('deve retornar true para unidades no mapeamento', () => {
        // Arrange
        const unidades = ['UN', 'KG', 'L', 'M', 'PC', 'CX', 'M2'];

        // Act & Assert
        unidades.forEach(codigo => {
          const un = UnidadeMedida.create(codigo);
          expect(un.isConhecida).toBe(true);
        });
      });

      it('deve retornar false para unidades não mapeadas', () => {
        // Arrange
        const un = UnidadeMedida.create('ABC');

        // Act & Assert
        expect(un.isConhecida).toBe(false);
      });

      it('deve ser case-insensitive para verificação', () => {
        // Arrange
        const un1 = UnidadeMedida.create('un');
        const un2 = UnidadeMedida.create('UN');
        const un3 = UnidadeMedida.create('Un');

        // Act & Assert
        expect(un1.isConhecida).toBe(true);
        expect(un2.isConhecida).toBe(true);
        expect(un3.isConhecida).toBe(true);
      });
    });
  });

  describe('Métodos', () => {
    describe('equals', () => {
      it('deve retornar true para unidades iguais', () => {
        // Arrange
        const un1 = UnidadeMedida.create('UN');
        const un2 = UnidadeMedida.create('UN');

        // Act & Assert
        expect(un1.equals(un2)).toBe(true);
      });

      it('deve retornar true para unidades iguais (diferentes casos)', () => {
        // Arrange
        const un1 = UnidadeMedida.create('un');
        const un2 = UnidadeMedida.create('UN');

        // Act & Assert
        expect(un1.equals(un2)).toBe(true);
      });

      it('deve retornar false para unidades diferentes', () => {
        // Arrange
        const un1 = UnidadeMedida.create('UN');
        const un2 = UnidadeMedida.create('KG');

        // Act & Assert
        expect(un1.equals(un2)).toBe(false);
      });

      it('deve retornar false para não-UnidadeMedida', () => {
        // Arrange
        const un = UnidadeMedida.create('UN');

        // Act & Assert
        expect(un.equals({} as UnidadeMedida)).toBe(false);
      });

      it('deve ser reflexivo (x.equals(x) = true)', () => {
        // Arrange
        const un = UnidadeMedida.create('UN');

        // Act & Assert
        expect(un.equals(un)).toBe(true);
      });

      it('deve ser simétrico (x.equals(y) = y.equals(x))', () => {
        // Arrange
        const un1 = UnidadeMedida.create('UN');
        const un2 = UnidadeMedida.create('UN');

        // Act & Assert
        expect(un1.equals(un2)).toBe(un2.equals(un1));
      });
    });

    describe('toString', () => {
      it('deve retornar o código da unidade', () => {
        // Arrange
        const un = UnidadeMedida.create('UN');

        // Act
        const result = un.toString();

        // Assert
        expect(result).toBe('UN');
      });

      it('deve retornar em maiúsculas', () => {
        // Arrange
        const un = UnidadeMedida.create('kg');

        // Act
        const result = un.toString();

        // Assert
        expect(result).toBe('KG');
      });
    });

    describe('toJSON', () => {
      it('deve retornar o código da unidade', () => {
        // Arrange
        const un = UnidadeMedida.create('UN');

        // Act
        const result = un.toJSON();

        // Assert
        expect(result).toBe('UN');
      });

      it('deve ser serializável em JSON.stringify', () => {
        // Arrange
        const un = UnidadeMedida.create('KG');

        // Act
        const json = JSON.stringify({ unidade: un });

        // Assert
        expect(json).toBe('{"unidade":"KG"}');
      });
    });

    describe('toFullString', () => {
      it('deve retornar código e descrição para unidade conhecida', () => {
        // Arrange
        const un = UnidadeMedida.create('UN');

        // Act
        const result = un.toFullString();

        // Assert
        expect(result).toBe('UN - Unidade');
      });

      it('deve retornar código duplicado para unidade desconhecida', () => {
        // Arrange
        const un = UnidadeMedida.create('XYZ');

        // Act
        const result = un.toFullString();

        // Assert
        expect(result).toBe('XYZ - XYZ');
      });

      it('deve funcionar para KG', () => {
        // Arrange
        const un = UnidadeMedida.create('KG');

        // Act
        const result = un.toFullString();

        // Assert
        expect(result).toBe('KG - Quilograma');
      });

      it('deve funcionar para M2', () => {
        // Arrange
        const un = UnidadeMedida.create('M2');

        // Act
        const result = un.toFullString();

        // Assert
        expect(result).toBe('M2 - Metro Quadrado');
      });
    });
  });

  describe('Imutabilidade', () => {
    it('value não deve ser alterável', () => {
      // Arrange
      const un = UnidadeMedida.create('UN');
      const valorOriginal = un.value;

      // Act - Tentar alterar (TypeScript previne, mas verificamos runtime)
      // @ts-expect-error - Tentando alterar propriedade readonly
      un._value = 'KG';

      // Assert
      expect(un.value).toBe(valorOriginal);
    });

    it('deve criar novas instâncias para diferentes valores', () => {
      // Arrange
      const un1 = UnidadeMedida.create('UN');
      const un2 = UnidadeMedida.create('KG');

      // Act & Assert
      expect(un1).not.toBe(un2);
      expect(un1.value).not.toBe(un2.value);
    });

    it('mesma entrada deve criar instâncias diferentes mas equivalentes', () => {
      // Arrange
      const un1 = UnidadeMedida.create('UN');
      const un2 = UnidadeMedida.create('UN');

      // Act & Assert
      expect(un1).not.toBe(un2); // Instâncias diferentes
      expect(un1.equals(un2)).toBe(true); // Mas valores iguais
    });
  });

  describe('Casos de Uso Reais', () => {
    it('deve processar entrada do usuário corretamente', () => {
      // Arrange
      const inputs = ['  un  ', 'Un', 'UN', 'uN'];

      // Act
      const unidades = inputs.map(input => UnidadeMedida.create(input));

      // Assert
      unidades.forEach(un => {
        expect(un.value).toBe('UN');
        expect(un.descricao).toBe('Unidade');
      });
    });

    it('deve aceitar unidades customizadas do sistema Datasul', () => {
      // Arrange & Act
      const un1 = UnidadeMedida.create('UND');
      const un2 = UnidadeMedida.create('PCT');
      const un3 = UnidadeMedida.create('FRD');

      // Assert
      expect(un1.value).toBe('UND');
      expect(un2.value).toBe('PCT');
      expect(un3.value).toBe('FRD');
    });
  });
});
