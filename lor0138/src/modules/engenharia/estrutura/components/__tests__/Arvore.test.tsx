/**
 * Testes Unitários - Arvore Component
 */

import React from 'react';
import { render, screen } from '../../../../../test-utils/render';
import '@testing-library/jest-dom';
import Arvore from '../Arvore';
import { TreeNode } from '../../types/estrutura.types';

// Mock do ECharts
jest.mock('echarts-for-react', () => {
  return function MockEChartsReact({ option }: any) {
    return (
      <div data-testid="echarts-arvore-mock" data-option={JSON.stringify(option)}>
        ECharts Arvore Mock
      </div>
    );
  };
});

describe('Arvore Component', () => {
  const mockOnSelect = jest.fn();
  const mockOnItemDrillDown = jest.fn();
  const mockGetLevelCss = jest.fn((level: number) => `hsl(${level * 30}, 70%, 50%)`);
  const mockOnShowQtyChange = jest.fn();
  const mockOnBaseHexChange = jest.fn();
  const mockOnBgColorChange = jest.fn();

  const mockTree: TreeNode = {
    code: 'ROOT-001',
    name: 'Raiz',
    qty: 1,
    nivel: 0,
    children: [
      {
        code: 'CHILD-001',
        name: 'Filho 1',
        qty: 2,
        nivel: 1,
        children: [],
        hasProcess: false,
        process: [],
      },
      {
        code: 'CHILD-002',
        name: 'Filho 2',
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
    mockGetLevelCss.mockClear();
    mockOnShowQtyChange.mockClear();
    mockOnBaseHexChange.mockClear();
    mockOnBgColorChange.mockClear();
  });

  it('deve renderizar mensagem quando não há árvore', () => {
    render(
      <Arvore
        tree={null}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        showQty={true}
        onShowQtyChange={mockOnShowQtyChange}
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

  it('deve renderizar gráfico de árvore quando há dados', () => {
    render(
      <Arvore
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        showQty={true}
        onShowQtyChange={mockOnShowQtyChange}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    expect(screen.getByTestId('echarts-arvore-mock')).toBeInTheDocument();
  });

  it('deve chamar getLevelCss para cores', () => {
    render(
      <Arvore
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        showQty={true}
        onShowQtyChange={mockOnShowQtyChange}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    expect(mockGetLevelCss).toHaveBeenCalled();
  });

  it('deve criar configuração tree do ECharts', () => {
    const { container } = render(
      <Arvore
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        showQty={true}
        onShowQtyChange={mockOnShowQtyChange}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    const chart = container.querySelector('[data-testid="echarts-arvore-mock"]');
    const option = chart?.getAttribute('data-option');

    if (option) {
      const parsed = JSON.parse(option);
      expect(parsed).toHaveProperty('series');
      expect(parsed.series[0].type).toBe('tree');
    }
  });

  it('deve renderizar com altura 100%', () => {
    const { container } = render(
      <Arvore
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        showQty={true}
        onShowQtyChange={mockOnShowQtyChange}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ height: '100%' });
  });
});
