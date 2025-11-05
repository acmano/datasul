// src/application/mappers/__tests__/ItemMapper.test.ts

import { ItemMapper } from '../ItemMapper';
import { Item } from '@domain/entities/Item';
import type { CreateItemDTO, ItemDTO } from '../../dtos/ItemDTO';

describe('ItemMapper - Edge Cases', () => {
  describe('toDTO', () => {
    describe('Happy Path', () => {
      it('deve converter Item para DTO completo', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'TORNEIRA MONOCOMANDO',
          unidade: 'UN',
          ativo: true,
          observacao: 'Observação teste',
        });

        // Act
        const dto = ItemMapper.toDTO(item);

        // Assert
        expect(dto).toEqual({
          codigo: 'ABC123',
          descricao: 'TORNEIRA MONOCOMANDO',
          unidade: 'UN',
          ativo: true,
          observacao: 'Observação teste',
        });
      });

      it('deve converter Item sem observação', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
        });

        // Act
        const dto = ItemMapper.toDTO(item);

        // Assert
        expect(dto.observacao).toBeUndefined();
      });
    });

    describe('Edge Cases', () => {
      it('deve converter item inativo', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'ITEM INATIVO',
          unidade: 'UN',
          ativo: false,
        });

        // Act
        const dto = ItemMapper.toDTO(item);

        // Assert
        expect(dto.ativo).toBe(false);
      });

      it('deve manter código em maiúsculas', () => {
        // Arrange
        const item = Item.create({
          codigo: 'abc123',
          descricao: 'ITEM',
          unidade: 'UN',
        });

        // Act
        const dto = ItemMapper.toDTO(item);

        // Assert
        expect(dto.codigo).toBe('ABC123');
      });

      it('deve converter item com código de 1 caractere', () => {
        // Arrange
        const item = Item.create({
          codigo: 'A',
          descricao: 'ITEM',
          unidade: 'UN',
        });

        // Act
        const dto = ItemMapper.toDTO(item);

        // Assert
        expect(dto.codigo).toBe('A');
      });

      it('deve converter item com código de 16 caracteres', () => {
        // Arrange
        const item = Item.create({
          codigo: '1234567890123456',
          descricao: 'ITEM',
          unidade: 'UN',
        });

        // Act
        const dto = ItemMapper.toDTO(item);

        // Assert
        expect(dto.codigo).toBe('1234567890123456');
      });

      it('deve converter item com descrição longa', () => {
        // Arrange
        const descricaoLonga = 'A'.repeat(255);
        const item = Item.create({
          codigo: 'ABC',
          descricao: descricaoLonga,
          unidade: 'UN',
        });

        // Act
        const dto = ItemMapper.toDTO(item);

        // Assert
        expect(dto.descricao.length).toBe(255);
      });

      it('deve converter observação vazia após trim', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC',
          descricao: 'ITEM',
          unidade: 'UN',
          observacao: '   ',
        });

        // Act
        const dto = ItemMapper.toDTO(item);

        // Assert
        expect(dto.observacao).toBe('');
      });
    });

    describe('Imutabilidade', () => {
      it('não deve afetar entidade original após conversão', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'ITEM ORIGINAL',
          unidade: 'UN',
        });

        // Act
        const dto = ItemMapper.toDTO(item);
        // @ts-expect-error - Tentando modificar DTO
        dto.codigo = 'XYZ789';

        // Assert
        expect(item.codigoValue).toBe('ABC123');
      });
    });
  });

  describe('toDomain', () => {
    describe('Happy Path', () => {
      it('deve converter DTO para Item completo', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: 'ABC123',
          descricao: 'TORNEIRA MONOCOMANDO',
          unidade: 'UN',
          ativo: true,
          observacao: 'Observação teste',
        };

        // Act
        const item = ItemMapper.toDomain(dto);

        // Assert
        expect(item.codigoValue).toBe('ABC123');
        expect(item.descricaoValue).toBe('TORNEIRA MONOCOMANDO');
        expect(item.unidadeValue).toBe('UN');
        expect(item.ativo).toBe(true);
        expect(item.observacao).toBe('Observação teste');
      });

      it('deve usar ativo=true como padrão quando não informado', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
        };

        // Act
        const item = ItemMapper.toDomain(dto);

        // Assert
        expect(item.ativo).toBe(true);
      });

      it('deve aceitar ativo=false explicitamente', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
          ativo: false,
        };

        // Act
        const item = ItemMapper.toDomain(dto);

        // Assert
        expect(item.ativo).toBe(false);
      });
    });

    describe('Edge Cases - Validação', () => {
      it('deve lançar erro para código vazio', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: '',
          descricao: 'ITEM',
          unidade: 'UN',
        };

        // Act & Assert
        expect(() => ItemMapper.toDomain(dto)).toThrow(
          'Código do item não pode ser vazio'
        );
      });

      it('deve lançar erro para descrição vazia', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: 'ABC123',
          descricao: '',
          unidade: 'UN',
        };

        // Act & Assert
        expect(() => ItemMapper.toDomain(dto)).toThrow(
          'Descrição não pode ser vazia'
        );
      });

      it('deve lançar erro para unidade vazia', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: 'ABC123',
          descricao: 'ITEM',
          unidade: '',
        };

        // Act & Assert
        expect(() => ItemMapper.toDomain(dto)).toThrow(
          'Unidade de medida não pode ser vazia'
        );
      });

      it('deve lançar erro para código muito longo', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: '12345678901234567', // 17 caracteres
          descricao: 'ITEM',
          unidade: 'UN',
        };

        // Act & Assert
        expect(() => ItemMapper.toDomain(dto)).toThrow(
          'Código do item não pode exceder 16 caracteres'
        );
      });

      it('deve lançar erro para descrição muito longa', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: 'ABC123',
          descricao: 'A'.repeat(256), // 256 caracteres
          unidade: 'UN',
        };

        // Act & Assert
        expect(() => ItemMapper.toDomain(dto)).toThrow(
          'Descrição não pode exceder 255 caracteres'
        );
      });

      it('deve lançar erro para código com caracteres inválidos', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: 'ABC@123',
          descricao: 'ITEM',
          unidade: 'UN',
        };

        // Act & Assert
        expect(() => ItemMapper.toDomain(dto)).toThrow(
          'Código do item contém caracteres inválidos'
        );
      });
    });

    describe('Edge Cases - Normalização', () => {
      it('deve normalizar código para maiúsculas', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: 'abc123',
          descricao: 'ITEM',
          unidade: 'UN',
        };

        // Act
        const item = ItemMapper.toDomain(dto);

        // Assert
        expect(item.codigoValue).toBe('ABC123');
      });

      it('deve fazer trim em código com espaços', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: '  ABC123  ',
          descricao: 'ITEM',
          unidade: 'UN',
        };

        // Act
        const item = ItemMapper.toDomain(dto);

        // Assert
        expect(item.codigoValue).toBe('ABC123');
      });

      it('deve fazer trim em descrição com espaços', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: 'ABC123',
          descricao: '  TORNEIRA  ',
          unidade: 'UN',
        };

        // Act
        const item = ItemMapper.toDomain(dto);

        // Assert
        expect(item.descricaoValue).toBe('TORNEIRA');
      });

      it('deve normalizar unidade para maiúsculas', () => {
        // Arrange
        const dto: CreateItemDTO = {
          codigo: 'ABC123',
          descricao: 'ITEM',
          unidade: 'un',
        };

        // Act
        const item = ItemMapper.toDomain(dto);

        // Assert
        expect(item.unidadeValue).toBe('UN');
      });
    });
  });

  describe('toDetailDTO', () => {
    describe('Happy Path', () => {
      it('deve converter para DTO detalhado com dados relacionados', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
        });

        const related = {
          familia: { codigo: 'FM001', descricao: 'METAIS' },
          familiaComercial: { codigo: 'FC001', descricao: 'HIDRAULICA' },
          grupoEstoque: { codigo: '01', descricao: 'MATERIAIS' },
          estabelecimentos: [
            { codigo: '001', nome: 'MATRIZ' },
            { codigo: '002', nome: 'FILIAL' },
          ],
        };

        // Act
        const dto = ItemMapper.toDetailDTO(item, related);

        // Assert
        expect(dto.codigo).toBe('ABC123');
        expect(dto.familia).toEqual({ codigo: 'FM001', descricao: 'METAIS' });
        expect(dto.familiaComercial).toEqual({ codigo: 'FC001', descricao: 'HIDRAULICA' });
        expect(dto.grupoEstoque).toEqual({ codigo: '01', descricao: 'MATERIAIS' });
        expect(dto.estabelecimentos).toHaveLength(2);
      });

      it('deve converter sem dados relacionados', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
        });

        // Act
        const dto = ItemMapper.toDetailDTO(item);

        // Assert
        expect(dto.codigo).toBe('ABC123');
        expect(dto.familia).toBeUndefined();
        expect(dto.familiaComercial).toBeUndefined();
        expect(dto.grupoEstoque).toBeUndefined();
        expect(dto.estabelecimentos).toBeUndefined();
      });
    });

    describe('Edge Cases', () => {
      it('deve aceitar dados relacionados parciais', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
        });

        const related = {
          familia: { codigo: 'FM001', descricao: 'METAIS' },
        };

        // Act
        const dto = ItemMapper.toDetailDTO(item, related);

        // Assert
        expect(dto.familia).toBeDefined();
        expect(dto.familiaComercial).toBeUndefined();
        expect(dto.grupoEstoque).toBeUndefined();
      });

      it('deve aceitar estabelecimentos vazio', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
        });

        const related = {
          estabelecimentos: [],
        };

        // Act
        const dto = ItemMapper.toDetailDTO(item, related);

        // Assert
        expect(dto.estabelecimentos).toEqual([]);
      });

      it('deve incluir propriedades básicas do Item', () => {
        // Arrange
        const item = Item.create({
          codigo: 'ABC123',
          descricao: 'TORNEIRA',
          unidade: 'UN',
          ativo: false,
          observacao: 'Observação',
        });

        // Act
        const dto = ItemMapper.toDetailDTO(item);

        // Assert
        expect(dto.codigo).toBe('ABC123');
        expect(dto.descricao).toBe('TORNEIRA');
        expect(dto.unidade).toBe('UN');
        expect(dto.ativo).toBe(false);
        expect(dto.observacao).toBe('Observação');
      });
    });
  });

  describe('toDTOList', () => {
    describe('Happy Path', () => {
      it('deve converter array de Items para array de DTOs', () => {
        // Arrange
        const items = [
          Item.create({ codigo: '001', descricao: 'ITEM 1', unidade: 'UN' }),
          Item.create({ codigo: '002', descricao: 'ITEM 2', unidade: 'KG' }),
          Item.create({ codigo: '003', descricao: 'ITEM 3', unidade: 'PC' }),
        ];

        // Act
        const dtos = ItemMapper.toDTOList(items);

        // Assert
        expect(dtos).toHaveLength(3);
        expect(dtos[0].codigo).toBe('001');
        expect(dtos[1].codigo).toBe('002');
        expect(dtos[2].codigo).toBe('003');
      });
    });

    describe('Edge Cases', () => {
      it('deve retornar array vazio para input vazio', () => {
        // Arrange
        const items: Item[] = [];

        // Act
        const dtos = ItemMapper.toDTOList(items);

        // Assert
        expect(dtos).toEqual([]);
        expect(dtos).toHaveLength(0);
      });

      it('deve converter array com um único item', () => {
        // Arrange
        const items = [
          Item.create({ codigo: '001', descricao: 'ITEM ÚNICO', unidade: 'UN' }),
        ];

        // Act
        const dtos = ItemMapper.toDTOList(items);

        // Assert
        expect(dtos).toHaveLength(1);
        expect(dtos[0].codigo).toBe('001');
      });

      it('deve converter array grande (100 items)', () => {
        // Arrange
        const items = Array.from({ length: 100 }, (_, i) =>
          Item.create({
            codigo: `ITEM${i.toString().padStart(3, '0')}`,
            descricao: `DESCRIÇÃO ${i}`,
            unidade: 'UN',
          })
        );

        // Act
        const dtos = ItemMapper.toDTOList(items);

        // Assert
        expect(dtos).toHaveLength(100);
        expect(dtos[0].codigo).toBe('ITEM000');
        expect(dtos[99].codigo).toBe('ITEM099');
      });

      it('deve preservar ordem dos items', () => {
        // Arrange
        const items = [
          Item.create({ codigo: 'C', descricao: 'ITEM C', unidade: 'UN' }),
          Item.create({ codigo: 'A', descricao: 'ITEM A', unidade: 'UN' }),
          Item.create({ codigo: 'B', descricao: 'ITEM B', unidade: 'UN' }),
        ];

        // Act
        const dtos = ItemMapper.toDTOList(items);

        // Assert
        expect(dtos[0].codigo).toBe('C');
        expect(dtos[1].codigo).toBe('A');
        expect(dtos[2].codigo).toBe('B');
      });

      it('deve converter items com diferentes estados', () => {
        // Arrange
        const items = [
          Item.create({ codigo: '001', descricao: 'ATIVO', unidade: 'UN', ativo: true }),
          Item.create({ codigo: '002', descricao: 'INATIVO', unidade: 'UN', ativo: false }),
        ];

        // Act
        const dtos = ItemMapper.toDTOList(items);

        // Assert
        expect(dtos[0].ativo).toBe(true);
        expect(dtos[1].ativo).toBe(false);
      });
    });
  });

  describe('Ciclo Completo - Domain ↔ DTO', () => {
    it('deve manter dados ao converter DTO → Domain → DTO', () => {
      // Arrange
      const originalDTO: CreateItemDTO = {
        codigo: 'ABC123',
        descricao: 'TORNEIRA MONOCOMANDO',
        unidade: 'UN',
        ativo: true,
        observacao: 'Teste',
      };

      // Act
      const item = ItemMapper.toDomain(originalDTO);
      const resultDTO = ItemMapper.toDTO(item);

      // Assert
      expect(resultDTO.codigo).toBe('ABC123');
      expect(resultDTO.descricao).toBe('TORNEIRA MONOCOMANDO');
      expect(resultDTO.unidade).toBe('UN');
      expect(resultDTO.ativo).toBe(true);
      expect(resultDTO.observacao).toBe('Teste');
    });

    it('deve normalizar dados durante ciclo', () => {
      // Arrange
      const originalDTO: CreateItemDTO = {
        codigo: '  abc123  ',
        descricao: '  TORNEIRA  ',
        unidade: '  un  ',
      };

      // Act
      const item = ItemMapper.toDomain(originalDTO);
      const resultDTO = ItemMapper.toDTO(item);

      // Assert
      expect(resultDTO.codigo).toBe('ABC123');
      expect(resultDTO.descricao).toBe('TORNEIRA');
      expect(resultDTO.unidade).toBe('UN');
    });
  });
});
