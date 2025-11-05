/**
 * Testes Unitários - Treemap Component
 */

import React from 'react';
import { render, screen } from '../../../../../test-utils/render';
import '@testing-library/jest-dom';
import Treemap from '../Treemap';
import { TreeNode } from '../../types/estrutura.types';

// Mock do ECharts
jest.mock('echarts-for-react', () => {
  return function MockEChartsReact({ option }: any) {
    return (
      <div data-testid="echarts-treemap-mock" data-option={JSON.stringify(option)}>
        ECharts Treemap Mock
      </div>
    );
  };
});

describe('Treemap Component', () => {
  const mockOnSelect = jest.fn();
  const mockOnItemDrillDown = jest.fn();
  const mockGetLevelCss = jest.fn((level: number) => `hsl(${level * 30}, 70%, 50%)`);

  const mockTree: TreeNode = {
    code: 'ROOT',
    name: 'Raiz',
    qty: 100,
    nivel: 0,
    children: [
      {
        code: 'A',
        name: 'Item A',
        qty: 60,
        nivel: 1,
        children: [],
        hasProcess: false,
        process: [],
      },
      {
        code: 'B',
        name: 'Item B',
        qty: 40,
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
  });

  it('deve renderizar mensagem quando não há árvore', () => {
    render(
      <Treemap
        tree={null}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        showQty={true}
      />
    );

    expect(
      screen.getByText('Selecione um item na aba Resultado para visualizar sua estrutura')
    ).toBeInTheDocument();
  });

  it('deve renderizar gráfico treemap quando há dados', () => {
    render(
      <Treemap
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        showQty={true}
      />
    );

    expect(screen.getByTestId('echarts-treemap-mock')).toBeInTheDocument();
  });

  it('deve usar quantidades para tamanho dos blocos', () => {
    const { container } = render(
      <Treemap
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        showQty={true}
      />
    );

    const chart = container.querySelector('[data-testid="echarts-treemap-mock"]');
    const option = chart?.getAttribute('data-option');

    if (option) {
      const parsed = JSON.parse(option);
      expect(parsed).toHaveProperty('series');
      expect(parsed.series[0].type).toBe('treemap');
      // Treemap usa 'value' para tamanho
      expect(parsed.series[0].data).toBeDefined();
    }
  });

  it('deve chamar getLevelCss', () => {
    render(
      <Treemap
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        showQty={true}
      />
    );

    expect(mockGetLevelCss).toHaveBeenCalled();
  });

  it('deve renderizar com altura total', () => {
    const { container } = render(
      <Treemap
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        showQty={true}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ height: '100%' });
  });

  it('deve lidar com estruturas sem quantidades', () => {
    const treeWithoutQty: TreeNode = {
      ...mockTree,
      qty: 0,
      children: mockTree.children.map((c) => ({ ...c, qty: 0 })),
    };

    render(
      <Treemap
        tree={treeWithoutQty}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        showQty={false}
      />
    );

    expect(screen.getByTestId('echarts-treemap-mock')).toBeInTheDocument();
  });
});
