// src/domain/entities/__tests__/Item.test.ts

import { Item } from '../Item';

describe('Item (Domain Entity) - Edge Cases', () => {
  describe('create', () => {
    describe('Happy Path', () => {
      it('deve criar item com propriedades válidas', () => {
        // Arrange & Act
        const item = Item.create({
          codigo: '7530110',
          descricao: 'TORNEIRA MONOCOMANDO',
          unidade: 'UN',
        });

        // Assert
        expect(item.codigoValue).toBe('7530110');
        expect(item.descricaoValue).toBe('TORNEIRA MONOCOMANDO');
        expect(item.unidadeValue).toBe('UN');
        expect(item.ativo).toBe(true);
        expect(item.observacao).toBeUndefined();
      });

      it('deve criar item inativo quando especificado', () => {
        // Arrange & Act
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'ITEM INATIVO',
          unidade: 'PC',
          ativo: false,
        });

        // Assert
        expect(item.ativo).toBe(false);
      });

      it('deve criar item com observação', () => {
        // Arrange & Act
        const item = Item.create({
          codigo: 'TEST001',
          descricao: 'ITEM COM OBS',
          unidade: 'UN',
          observacao: 'Observação importante',
        });

        // Assert
        expect(item.observacao).toBe('Observação importante');
      });
    });

    describe('Edge Cases - Código', () => {
      it('deve aceitar código com 1 caractere', () => {
        // Arrange & Act
        const item = Item.create({
          codigo: 'A',
          descricao: 'ITEM CÓDIGO MÍNIMO',
          unidade: 'UN',
        });

        // Assert
        expect(item.codigoValue).toBe('A');
      });

      it('deve aceitar código com 16 caracteres', () => {
        // Arrange & Act
        const item = Item.create({
          codigo: '1234567890123456',
          descricao: 'ITEM CÓDIGO MÁXIMO',
          unidade: 'UN',
        });

        // Assert
        expect(item.codigoValue).toBe('1234567890123456');
      });

      it('deve converter código para maiúsculas', () => {
        // Arrange & Act
        const item = Item.create({
          codigo: 'abc123',
          descricao: 'ITEM LOWERCASE',
          unidade: 'UN',
        });

        // Assert
        expect(item.codigoValue).toBe('ABC123');
      });

      it('deve fazer trim em código com espaços', () => {
        // Arrange & Act
        const item = Item.create({
          codigo: '  ABC123  ',
          descricao: 'ITEM COM ESPAÇOS',
          unidade: 'UN',
        });

        // Assert
        expect(item.codigoValue).toBe('ABC123');
      });

      it('deve lançar erro quando código está vazio', () => {
        // Arrange & Act & Assert
        expect(() =>
          Item.create({
            codigo: '',
            descricao: 'DESCRIÇÃO',
            unidade: 'UN',
          })
        ).toThrow('Código do item não pode ser vazio');
      });

      it('deve lançar erro quando código tem mais de 16 caracteres', () => {
        // Arrange & Act & Assert
        expect(() =>
          Item.create({
            codigo: '12345678901234567', // 17 caracteres
            descricao: 'DESCRIÇÃO',
            unidade: 'UN',
          })
        ).toThrow('Código do item não pode exceder 16 caracteres');
      });

      it('deve lançar erro quando código contém caracteres inválidos', () => {
        // Arrange & Act & Assert
        expect(() =>
          Item.create({
            codigo: 'ABC@123',
            descricao: 'DESCRIÇÃO',
            unidade: 'UN',
          })
        ).toThrow('Código do item contém caracteres inválidos');
      });
    });

    describe('Edge Cases - Descrição', () => {
      it('deve aceitar descrição com 255 caracteres', () => {
        // Arrange
        const descricaoLonga = 'A'.repeat(255);

        // Act
        const item = Item.create({
          codigo: 'TEST',
          descricao: descricaoLonga,
          unidade: 'UN',
        });

        // Assert
        expect(item.descricaoValue.length).toBe(255);
      });

      it('deve lançar erro quando descrição está vazia', () => {
        // Arrange & Act & Assert
        expect(() =>
          Item.create({
            codigo: 'TEST',
            descricao: '',
            unidade: 'UN',
          })
        ).toThrow('Descrição não pode ser vazia');
      });

      it('deve lançar erro quando descrição tem mais de 255 caracteres', () => {
        // Arrange
        const descricaoMuitoLonga = 'A'.repeat(256);

        // Act & Assert
        expect(() =>
          Item.create({
            codigo: 'TEST',
            descricao: descricaoMuitoLonga,
            unidade: 'UN',
          })
        ).toThrow('Descrição não pode exceder 255 caracteres');
      });

      it('deve fazer trim em descrição com espaços', () => {
        // Arrange & Act
        const item = Item.create({
          codigo: 'TEST',
          descricao: '  DESCRIÇÃO COM ESPAÇOS  ',
          unidade: 'UN',
        });

        // Assert
        expect(item.descricaoValue).toBe('DESCRIÇÃO COM ESPAÇOS');
      });
    });

    describe('Edge Cases - Unidade', () => {
      it('deve aceitar unidade com 4 caracteres', () => {
        // Arrange & Act
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'ITEM',
          unidade: 'ABCD',
        });

        // Assert
        expect(item.unidadeValue).toBe('ABCD');
      });

      it('deve converter unidade para maiúsculas', () => {
        // Arrange & Act
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'ITEM',
          unidade: 'un',
        });

        // Assert
        expect(item.unidadeValue).toBe('UN');
      });

      it('deve lançar erro quando unidade está vazia', () => {
        // Arrange & Act & Assert
        expect(() =>
          Item.create({
            codigo: 'TEST',
            descricao: 'ITEM',
            unidade: '',
          })
        ).toThrow('Unidade de medida não pode ser vazia');
      });

      it('deve lançar erro quando unidade tem mais de 4 caracteres', () => {
        // Arrange & Act & Assert
        expect(() =>
          Item.create({
            codigo: 'TEST',
            descricao: 'ITEM',
            unidade: 'ABCDE',
          })
        ).toThrow('Unidade de medida não pode exceder 4 caracteres');
      });
    });
  });

  describe('Regras de Negócio', () => {
    describe('ativar/inativar', () => {
      it('deve ativar item inativo', () => {
        // Arrange
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'ITEM',
          unidade: 'UN',
          ativo: false,
        });

        // Act
        item.ativar();

        // Assert
        expect(item.ativo).toBe(true);
      });

      it('deve inativar item ativo', () => {
        // Arrange
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'ITEM',
          unidade: 'UN',
          ativo: true,
        });

        // Act
        item.inativar();

        // Assert
        expect(item.ativo).toBe(false);
      });

      it('deve permitir múltiplas ativações', () => {
        // Arrange
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'ITEM',
          unidade: 'UN',
        });

        // Act
        item.ativar();
        item.ativar();

        // Assert
        expect(item.ativo).toBe(true);
      });
    });

    describe('atualizarDescricao', () => {
      it('deve atualizar descrição com valor válido', () => {
        // Arrange
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'DESCRIÇÃO ANTIGA',
          unidade: 'UN',
        });

        // Act
        item.atualizarDescricao('DESCRIÇÃO NOVA');

        // Assert
        expect(item.descricaoValue).toBe('DESCRIÇÃO NOVA');
      });

      it('deve lançar erro ao atualizar para descrição vazia', () => {
        // Arrange
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'DESCRIÇÃO VÁLIDA',
          unidade: 'UN',
        });

        // Act & Assert
        expect(() => item.atualizarDescricao('')).toThrow(
          'Descrição não pode ser vazia'
        );
      });

      it('deve lançar erro ao atualizar para descrição muito longa', () => {
        // Arrange
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'DESCRIÇÃO VÁLIDA',
          unidade: 'UN',
        });

        // Act & Assert
        expect(() => item.atualizarDescricao('A'.repeat(256))).toThrow(
          'Descrição não pode exceder 255 caracteres'
        );
      });
    });

    describe('atualizarUnidade', () => {
      it('deve atualizar unidade com valor válido', () => {
        // Arrange
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'ITEM',
          unidade: 'UN',
        });

        // Act
        item.atualizarUnidade('KG');

        // Assert
        expect(item.unidadeValue).toBe('KG');
      });

      it('deve lançar erro ao atualizar para unidade vazia', () => {
        // Arrange
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'ITEM',
          unidade: 'UN',
        });

        // Act & Assert
        expect(() => item.atualizarUnidade('')).toThrow(
          'Unidade de medida não pode ser vazia'
        );
      });
    });

    describe('observacao', () => {
      it('deve adicionar observação', () => {
        // Arrange
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'ITEM',
          unidade: 'UN',
        });

        // Act
        item.adicionarObservacao('Nova observação');

        // Assert
        expect(item.observacao).toBe('Nova observação');
      });

      it('deve fazer trim ao adicionar observação', () => {
        // Arrange
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'ITEM',
          unidade: 'UN',
        });

        // Act
        item.adicionarObservacao('  Observação com espaços  ');

        // Assert
        expect(item.observacao).toBe('Observação com espaços');
      });

      it('deve remover observação', () => {
        // Arrange
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'ITEM',
          unidade: 'UN',
          observacao: 'Observação existente',
        });

        // Act
        item.removerObservacao();

        // Assert
        expect(item.observacao).toBeUndefined();
      });

      it('deve sobrescrever observação existente', () => {
        // Arrange
        const item = Item.create({
          codigo: 'TEST',
          descricao: 'ITEM',
          unidade: 'UN',
          observacao: 'Observação antiga',
        });

        // Act
        item.adicionarObservacao('Observação nova');

        // Assert
        expect(item.observacao).toBe('Observação nova');
      });
    });
  });

  describe('Métodos Auxiliares', () => {
    describe('equals', () => {
      it('deve retornar true para itens com mesmo código', () => {
        // Arrange
        const item1 = Item.create({
          codigo: 'ABC123',
          descricao: 'ITEM 1',
          unidade: 'UN',
        });

        const item2 = Item.create({
          codigo: 'ABC123',
          descricao: 'ITEM 2', // Descrição diferente
          unidade: 'KG', // Unidade diferente
        });

        // Act & Assert
        expect(item1.equals(item2)).toBe(true);
      });

      it('deve retornar false para itens com códigos diferentes', () => {
        // Arrange
        const item1 = Item.create({
          codigo: 'ABC123',
          descricao: 'ITEM',
          unidade: 'UN',
        });

        const item2 = Item.create({
          codigo: 'XYZ789',
          descricao: 'ITEM',
          unidade: 'UN',
        });

        // Act & Assert
        expect(item1.equals(item2)).toBe(false);
      });

      it('deve retornar false para não-Item', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'ITEM',
          unidade: 'UN',
        });

        // Act & Assert
        expect(item.equals({} as Item)).toBe(false);
      });
    });

    describe('toString', () => {
      it('deve retornar representação string correta', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
        });

        // Act
        const result = item.toString();

        // Assert
        expect(result).toBe('Item[ABC123]: TORNEIRA');
      });
    });

    describe('toDTO', () => {
      it('deve converter para DTO com todas propriedades', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
          ativo: true,
          observacao: 'Observação teste',
        });

        // Act
        const dto = item.toDTO();

        // Assert
        expect(dto).toEqual({
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
          ativo: true,
          observacao: 'Observação teste',
        });
      });

      it('deve converter para DTO sem observação', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
        });

        // Act
        const dto = item.toDTO();

        // Assert
        expect(dto.observacao).toBeUndefined();
      });

      it('deve refletir estado inativo no DTO', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
          ativo: false,
        });

        // Act
        const dto = item.toDTO();

        // Assert
        expect(dto.ativo).toBe(false);
      });
    });
  });

  describe('Imutabilidade', () => {
    it('código não deve ser alterável diretamente', () => {
      // Arrange
      const item = Item.create({
        codigo: 'ABC123',
        descricao: 'ITEM',
        unidade: 'UN',
      });

      // Act - Tentar alterar (TypeScript previne, mas verificamos runtime)
      const codigo = item.codigo;

      // Assert
      expect(item.codigoValue).toBe('ABC123');
      expect(codigo.value).toBe('ABC123');
    });

    it('value objects devem ser imutáveis', () => {
      // Arrange
      const item = Item.create({
        codigo: 'ABC123',
        descricao: 'ITEM ORIGINAL',
        unidade: 'UN',
      });

      const descricaoOriginal = item.descricao;

      // Act
      item.atualizarDescricao('ITEM ATUALIZADO');

      // Assert
      expect(descricaoOriginal.value).toBe('ITEM ORIGINAL');
      expect(item.descricaoValue).toBe('ITEM ATUALIZADO');
    });
  });
});
