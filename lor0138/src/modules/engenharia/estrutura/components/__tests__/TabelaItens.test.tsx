/**
 * Testes Unitários - TabelaItens Component
 */

import React from 'react';
import { render, screen, fireEvent } from '../../../../../test-utils/render';
import '@testing-library/jest-dom';
import TabelaItens from '../TabelaItens';
import { TreeNode } from '../../types/estrutura.types';

describe('TabelaItens Component', () => {
  const mockOnSelect = jest.fn();
  const mockOnItemDrillDown = jest.fn();
  const mockGetLevelHsl = jest.fn().mockReturnValue({
    h: 200,
    s: 70,
    l: 50,
  });
  const mockOnBaseHexChange = jest.fn();
  const mockOnBgColorChange = jest.fn();

  const mockTreeSimple: TreeNode = {
    code: 'ITEM-001',
    name: 'Item Principal',
    qty: 1,
    nivel: 0,
    children: [
      {
        code: 'COMP-001',
        name: 'Componente 1',
        qty: 2,
        nivel: 1,
        children: [],
        hasProcess: false,
        process: [],
      },
      {
        code: 'COMP-002',
        name: 'Componente 2',
        qty: 3,
        nivel: 1,
        children: [],
        hasProcess: false,
        process: [],
      },
    ],
    hasProcess: false,
    process: [],
  };

  beforeEach(() => {
    mockOnSelect.mockClear();
    mockOnItemDrillDown.mockClear();
    mockGetLevelHsl.mockClear();
    mockGetLevelHsl.mockReturnValue({ h: 200, s: 70, l: 50 });
    mockOnBaseHexChange.mockClear();
    mockOnBgColorChange.mockClear();
  });

  it('deve renderizar mensagem quando não há árvore', () => {
    render(
      <TabelaItens
        tree={null}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelHsl={mockGetLevelHsl}
        showQty={true}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    expect(
      screen.getByText('Selecione um item na aba Resultado para visualizar sua estrutura')
    ).toBeInTheDocument();
  });

  it('deve renderizar headers da tabela', () => {
    render(
      <TabelaItens
        tree={mockTreeSimple}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelHsl={mockGetLevelHsl}
        showQty={true}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    expect(screen.getByText('Nível')).toBeInTheDocument();
    expect(screen.getByText('Código')).toBeInTheDocument();
    expect(screen.getByText('Descrição')).toBeInTheDocument();
    expect(screen.getByText('Quantidade')).toBeInTheDocument();
    expect(screen.getByText('UN')).toBeInTheDocument();
    expect(screen.getByText('Processo')).toBeInTheDocument();
  });

  it('deve renderizar slider de expansão de níveis', () => {
    render(
      <TabelaItens
        tree={mockTreeSimple}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelHsl={mockGetLevelHsl}
        showQty={true}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    expect(screen.getByText('Expandir até nível:')).toBeInTheDocument();
  });

  it('deve renderizar controles de cor', () => {
    const { container } = render(
      <TabelaItens
        tree={mockTreeSimple}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelHsl={mockGetLevelHsl}
        showQty={true}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    expect(screen.getByText('Cor base:')).toBeInTheDocument();
    expect(screen.getByText('Cor de fundo:')).toBeInTheDocument();

    // Verifica inputs de cor
    const colorInputs = container.querySelectorAll('input[type="color"]');
    expect(colorInputs.length).toBe(2);
  });

  it('deve chamar onBaseHexChange quando cor base é alterada', () => {
    const { container } = render(
      <TabelaItens
        tree={mockTreeSimple}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelHsl={mockGetLevelHsl}
        showQty={true}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    const colorInputs = container.querySelectorAll('input[type="color"]');
    const baseColorInput = colorInputs[0] as HTMLInputElement;

    fireEvent.change(baseColorInput, { target: { value: '#ff0000' } });

    expect(mockOnBaseHexChange).toHaveBeenCalledWith('#ff0000');
  });

  it('deve chamar onBgColorChange quando cor de fundo é alterada', () => {
    const { container } = render(
      <TabelaItens
        tree={mockTreeSimple}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelHsl={mockGetLevelHsl}
        showQty={true}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    const colorInputs = container.querySelectorAll('input[type="color"]');
    const bgColorInput = colorInputs[1] as HTMLInputElement;

    fireEvent.change(bgColorInput, { target: { value: '#000000' } });

    expect(mockOnBgColorChange).toHaveBeenCalledWith('#000000');
  });

  it('deve chamar getLevelHsl para calcular cores dos níveis', () => {
    render(
      <TabelaItens
        tree={mockTreeSimple}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelHsl={mockGetLevelHsl}
        showQty={true}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    // A função deve ser chamada para calcular cores
    expect(mockGetLevelHsl).toHaveBeenCalled();
  });

  it('deve lidar com showQty false (ocultar quantidades)', () => {
    render(
      <TabelaItens
        tree={mockTreeSimple}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelHsl={mockGetLevelHsl}
        showQty={false}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    // Componente deve renderizar sem erros mesmo com showQty=false
    expect(screen.getByText('Quantidade')).toBeInTheDocument();
  });
});
