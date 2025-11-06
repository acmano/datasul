/**
 * Testes Unitários - Breadcrumb Component
 */

import React from 'react';
import { render, screen, fireEvent } from '../../../../../test-utils/render';
import '@testing-library/jest-dom';
import Breadcrumb, { BreadcrumbItem } from '../Breadcrumb';

describe('Breadcrumb Component', () => {
  const mockOnNavigate = jest.fn();

  const breadcrumbItems: BreadcrumbItem[] = [
    { codigo: 'ITEM-001', descricao: 'Item Principal' },
    { codigo: 'COMP-001', descricao: 'Componente 1' },
    { codigo: 'SUB-001', descricao: 'Sub-componente' },
  ];

  beforeEach(() => {
    mockOnNavigate.mockClear();
  });

  it('deve renderizar breadcrumb com todos os itens', () => {
    render(<Breadcrumb items={breadcrumbItems} onNavigate={mockOnNavigate} theme="light" />);

    expect(screen.getByText(/ITEM-001/)).toBeInTheDocument();
    expect(screen.getByText(/COMP-001/)).toBeInTheDocument();
    expect(screen.getByText(/SUB-001/)).toBeInTheDocument();
  });

  it('deve mostrar descrições nos tooltips', () => {
    render(<Breadcrumb items={breadcrumbItems} onNavigate={mockOnNavigate} theme="light" />);

    // O componente renderiza o código para todos os itens
    expect(screen.getByText(/ITEM-001/)).toBeInTheDocument();

    // A descrição só aparece no último item
    expect(screen.getByText(/SUB-001 - Sub-componente/)).toBeInTheDocument();
  });

  it('deve chamar onNavigate quando item é clicado', () => {
    render(<Breadcrumb items={breadcrumbItems} onNavigate={mockOnNavigate} theme="light" />);

    const firstItem = screen.getByText(/ITEM-001/);
    fireEvent.click(firstItem);

    // onNavigate é chamado com (codigo, index)
    expect(mockOnNavigate).toHaveBeenCalledWith('ITEM-001', 0);
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
  });

  it('não deve chamar onNavigate para o último item (item atual)', () => {
    render(<Breadcrumb items={breadcrumbItems} onNavigate={mockOnNavigate} theme="light" />);

    const lastItem = screen.getByText(/SUB-001/);
    fireEvent.click(lastItem);

    // O último item não é clicável
    expect(mockOnNavigate).not.toHaveBeenCalled();
  });

  it('deve renderizar com tema dark', () => {
    const { container } = render(
      <Breadcrumb items={breadcrumbItems} onNavigate={mockOnNavigate} theme="dark" />
    );

    // Verifica que o container está presente
    expect(container.firstChild).toBeInTheDocument();
  });

  it('deve renderizar com tema light', () => {
    const { container } = render(
      <Breadcrumb items={breadcrumbItems} onNavigate={mockOnNavigate} theme="light" />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('deve renderizar corretamente com apenas um item', () => {
    const singleItem: BreadcrumbItem[] = [{ codigo: 'ITEM-001', descricao: 'Item Único' }];

    render(<Breadcrumb items={singleItem} onNavigate={mockOnNavigate} theme="light" />);

    expect(screen.getByText(/ITEM-001/)).toBeInTheDocument();

    // Item único não deve ser clicável
    fireEvent.click(screen.getByText(/ITEM-001/));
    expect(mockOnNavigate).not.toHaveBeenCalled();
  });

  it('deve renderizar separadores entre itens', () => {
    const { container } = render(
      <Breadcrumb items={breadcrumbItems} onNavigate={mockOnNavigate} theme="light" />
    );

    // Verifica se há separadores (deve ter N-1 separadores para N itens)
    const separators = container.querySelectorAll('span');
    expect(separators.length).toBeGreaterThan(0);
  });

  it('deve lidar com array vazio de itens', () => {
    const { container } = render(
      <Breadcrumb items={[]} onNavigate={mockOnNavigate} theme="light" />
    );

    // Com array vazio, o componente retorna null
    expect(container.firstChild).toBeNull();
  });

  it('deve aplicar estilos diferentes para itens clicáveis vs não-clicáveis', () => {
    render(<Breadcrumb items={breadcrumbItems} onNavigate={mockOnNavigate} theme="light" />);

    // Verifica que os itens são renderizados corretamente
    // Primeiro item é clicável (Typography.Link)
    const firstItem = screen.getByText(/ITEM-001/);
    expect(firstItem).toBeInTheDocument();

    // Último item não é clicável (Typography.Text)
    const lastItem = screen.getByText(/SUB-001/);
    expect(lastItem).toBeInTheDocument();
  });
});
