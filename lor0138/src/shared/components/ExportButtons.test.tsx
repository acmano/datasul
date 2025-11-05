import React from 'react';
import { render, screen, fireEvent } from '../../test-utils/render';
import ExportButtons from './ExportButtons';

describe('ExportButtons', () => {
  const mockHandlers = {
    onExportCSV: jest.fn(),
    onExportXLSX: jest.fn(),
    onExportPDF: jest.fn(),
    onPrint: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar todos os botões', () => {
    render(<ExportButtons {...mockHandlers} />);

    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Imprimir')).toBeInTheDocument();
  });

  it('deve chamar handler de CSV ao clicar', () => {
    render(<ExportButtons {...mockHandlers} />);

    fireEvent.click(screen.getByText('CSV'));
    expect(mockHandlers.onExportCSV).toHaveBeenCalledTimes(1);
  });

  it('deve chamar handler de Excel ao clicar', () => {
    render(<ExportButtons {...mockHandlers} />);

    fireEvent.click(screen.getByText('Excel'));
    expect(mockHandlers.onExportXLSX).toHaveBeenCalledTimes(1);
  });

  it('deve desabilitar botões quando disabled=true', () => {
    render(<ExportButtons {...mockHandlers} disabled={true} />);

    expect(screen.getByRole('button', { name: /CSV/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Excel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /PDF/i })).toBeDisabled();
  });

  it('deve desabilitar botões quando hasData=false', () => {
    render(<ExportButtons {...mockHandlers} hasData={false} />);

    expect(screen.getByRole('button', { name: /CSV/i })).toBeDisabled();
  });

  it('deve habilitar botões quando hasData=true e disabled=false', () => {
    render(<ExportButtons {...mockHandlers} hasData={true} disabled={false} />);

    expect(screen.getByRole('button', { name: /CSV/i })).not.toBeDisabled();
  });
});
