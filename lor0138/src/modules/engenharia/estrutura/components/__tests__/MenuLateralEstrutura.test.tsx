/**
 * Testes Unitários - MenuLateralEstrutura Component
 */

import React from 'react';
import { render, screen, fireEvent, act } from '../../../../../test-utils/render';
import '@testing-library/jest-dom';
import MenuLateralEstrutura from '../MenuLateralEstrutura';

describe('MenuLateralEstrutura Component', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('deve renderizar todos os itens do menu', () => {
    render(<MenuLateralEstrutura selectedKey="tabela" onSelect={mockOnSelect} theme="light" />);

    expect(screen.getByText('Estrutura')).toBeInTheDocument();
    expect(screen.getByText('Sankey')).toBeInTheDocument();
    expect(screen.getByText('Árvore')).toBeInTheDocument();
    expect(screen.getByText('Treemap')).toBeInTheDocument();
    expect(screen.getByText('Grafo')).toBeInTheDocument();
  });

  it('deve marcar o item selecionado', () => {
    const { container } = render(
      <MenuLateralEstrutura selectedKey="sankey" onSelect={mockOnSelect} theme="light" />
    );

    // O Ant Design Menu aplica classes específicas para itens selecionados
    expect(container.querySelector('.ant-menu-item-selected')).toBeInTheDocument();
  });

  it('deve chamar onSelect quando um item é clicado', () => {
    render(<MenuLateralEstrutura selectedKey="tabela" onSelect={mockOnSelect} theme="light" />);

    const sankeyItem = screen.getByText('Sankey');
    fireEvent.click(sankeyItem);

    expect(mockOnSelect).toHaveBeenCalledWith('sankey');
  });

  it('deve renderizar com tema dark', () => {
    const { container } = render(
      <MenuLateralEstrutura selectedKey="tabela" onSelect={mockOnSelect} theme="dark" />
    );

    // Menu do Ant Design com tema dark deve ter classe específica
    expect(container.querySelector('.ant-menu-dark')).toBeInTheDocument();
  });

  it('deve renderizar com tema light', () => {
    const { container } = render(
      <MenuLateralEstrutura selectedKey="tabela" onSelect={mockOnSelect} theme="light" />
    );

    // Menu do Ant Design com tema light
    expect(container.querySelector('.ant-menu-light')).toBeInTheDocument();
  });

  it('deve exibir atalhos de teclado', () => {
    render(<MenuLateralEstrutura selectedKey="tabela" onSelect={mockOnSelect} theme="light" />);

    expect(screen.getByText('Ctrl+Alt+1')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+Alt+2')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+Alt+3')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+Alt+4')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+Alt+5')).toBeInTheDocument();
  });

  it('deve exibir ícones para cada visualização', () => {
    const { container } = render(
      <MenuLateralEstrutura selectedKey="tabela" onSelect={mockOnSelect} theme="light" />
    );

    // Ant Design Icons são renderizados como elementos svg ou span com classes específicas
    const icons = container.querySelectorAll('.anticon');
    expect(icons.length).toBeGreaterThanOrEqual(5); // Pelo menos 5 ícones
  });

  it('deve ter a estrutura correta de Menu do Ant Design', () => {
    const { container } = render(
      <MenuLateralEstrutura selectedKey="tabela" onSelect={mockOnSelect} theme="light" />
    );

    expect(container.querySelector('.ant-menu')).toBeInTheDocument();
    expect(container.querySelectorAll('.ant-menu-item').length).toBe(5);
  });

  it('deve alternar seleção quando diferentes itens são clicados', () => {
    const { rerender } = render(
      <MenuLateralEstrutura selectedKey="tabela" onSelect={mockOnSelect} theme="light" />
    );

    // Clicar em Sankey
    fireEvent.click(screen.getByText('Sankey'));
    expect(mockOnSelect).toHaveBeenCalledWith('sankey');

    // Re-renderizar com nova seleção
    rerender(<MenuLateralEstrutura selectedKey="sankey" onSelect={mockOnSelect} theme="light" />);

    // Clicar em Árvore
    fireEvent.click(screen.getByText('Árvore'));
    expect(mockOnSelect).toHaveBeenCalledWith('arvore');
  });
});
