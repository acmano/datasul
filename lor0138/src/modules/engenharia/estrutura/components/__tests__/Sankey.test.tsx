/**
 * Testes Unitários - Sankey Component
 */

import React from 'react';
import { render, screen } from '../../../../../test-utils/render';
import '@testing-library/jest-dom';
import Sankey from '../Sankey';
import { TreeNode } from '../../types/estrutura.types';

// Mock do ECharts
jest.mock('echarts-for-react', () => {
  return function MockEChartsReact({ option }: any) {
    return (
      <div data-testid="echarts-mock" data-option={JSON.stringify(option)}>
        ECharts Mock
      </div>
    );
  };
});

describe('Sankey Component', () => {
  const mockOnSelect = jest.fn();
  const mockOnItemDrillDown = jest.fn();
  const mockGetLevelCss = jest.fn((_level: number) => `hsl(${_level * 30}, 70%, 50%)`);
  const mockGetLevelText = jest.fn((_level: number) => '#ffffff');
  const mockOnShowQtyChange = jest.fn();
  const mockOnBaseHexChange = jest.fn();
  const mockOnBgColorChange = jest.fn();

  const mockTree: TreeNode = {
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
        children: [
          {
            code: 'SUB-001',
            name: 'Sub-componente 1',
            qty: 4,
            nivel: 2,
            children: [],
            hasProcess: false,
            process: [],
          },
        ],
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
    mockGetLevelCss.mockClear();
    mockOnShowQtyChange.mockClear();
    mockOnBaseHexChange.mockClear();
    mockOnBgColorChange.mockClear();
  });

  it('deve renderizar mensagem quando não há árvore', () => {
    render(
      <Sankey
        tree={null}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        getLevelText={mockGetLevelText}
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

  it('deve renderizar gráfico ECharts quando há árvore', () => {
    render(
      <Sankey
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        getLevelText={mockGetLevelText}
        showQty={true}
        onShowQtyChange={mockOnShowQtyChange}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    expect(screen.getByTestId('echarts-mock')).toBeInTheDocument();
  });

  it('deve chamar getLevelCss para calcular cores', () => {
    render(
      <Sankey
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        getLevelText={mockGetLevelText}
        showQty={true}
        onShowQtyChange={mockOnShowQtyChange}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    // A função deve ser chamada para calcular cores dos níveis
    expect(mockGetLevelCss).toHaveBeenCalled();
  });

  it('deve processar estrutura hierárquica corretamente', () => {
    const { container } = render(
      <Sankey
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        getLevelText={mockGetLevelText}
        showQty={true}
        onShowQtyChange={mockOnShowQtyChange}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    const chart = container.querySelector('[data-testid="echarts-mock"]');
    expect(chart).toBeInTheDocument();

    // Verificar que a opção do gráfico foi criada
    const option = chart?.getAttribute('data-option');
    expect(option).toBeTruthy();

    if (option) {
      const parsed = JSON.parse(option);
      expect(parsed).toHaveProperty('series');
      expect(parsed.series[0].type).toBe('sankey');
    }
  });

  it('deve lidar com showQty false', () => {
    render(
      <Sankey
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        getLevelText={mockGetLevelText}
        showQty={false}
        onShowQtyChange={mockOnShowQtyChange}
        baseHex="#3b82f6"
        onBaseHexChange={mockOnBaseHexChange}
        bgColor="#ffffff"
        onBgColorChange={mockOnBgColorChange}
      />
    );

    expect(screen.getByTestId('echarts-mock')).toBeInTheDocument();
  });

  it('deve renderizar com altura total disponível', () => {
    const { container } = render(
      <Sankey
        tree={mockTree}
        selectedId={null}
        onSelect={mockOnSelect}
        onItemDrillDown={mockOnItemDrillDown}
        getLevelCss={mockGetLevelCss}
        getLevelText={mockGetLevelText}
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
