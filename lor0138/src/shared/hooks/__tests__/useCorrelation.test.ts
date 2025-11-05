import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { useCorrelation } from '../useCorrelation';
import { CorrelationProvider } from '../../contexts/CorrelationContext';

describe('useCorrelation', () => {
  it('deve retornar correlationId e métodos do contexto', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(CorrelationProvider, null, children);

    const { result } = renderHook(() => useCorrelation(), { wrapper });

    expect(result.current).toHaveProperty('correlationId');
    expect(result.current).toHaveProperty('setCorrelationId');
    expect(result.current).toHaveProperty('clearCorrelationId');
  });

  it('deve inicializar correlationId como null', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(CorrelationProvider, null, children);

    const { result } = renderHook(() => useCorrelation(), { wrapper });

    expect(result.current.correlationId).toBeNull();
  });

  it('deve lançar erro se usado fora do provider', () => {
    // Suprime console.error para não poluir output do teste
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useCorrelation());
    }).toThrow('useCorrelation deve ser usado dentro de um CorrelationProvider');

    console.error = originalError;
  });

  it('deve ter setCorrelationId como função', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(CorrelationProvider, null, children);

    const { result } = renderHook(() => useCorrelation(), { wrapper });

    expect(typeof result.current.setCorrelationId).toBe('function');
  });

  it('deve ter clearCorrelationId como função', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(CorrelationProvider, null, children);

    const { result } = renderHook(() => useCorrelation(), { wrapper });

    expect(typeof result.current.clearCorrelationId).toBe('function');
  });
});
