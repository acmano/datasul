import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CorrelationProvider, useCorrelation } from '../CorrelationContext';

describe('CorrelationContext Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve iniciar com correlationId null', () => {
    const wrapper = ({ children }: any) => <CorrelationProvider>{children}</CorrelationProvider>;

    const { result } = renderHook(() => useCorrelation(), { wrapper });

    expect(result.current.correlationId).toBeNull();
  });

  it('deve permitir limpar Correlation ID manualmente', () => {
    const wrapper = ({ children }: any) => <CorrelationProvider>{children}</CorrelationProvider>;

    const { result } = renderHook(() => useCorrelation(), { wrapper });

    // Define um ID manualmente primeiro
    act(() => {
      result.current.setCorrelationId('test-id');
    });
    expect(result.current.correlationId).toBe('test-id');

    // Limpar manualmente
    act(() => {
      result.current.clearCorrelationId();
    });

    expect(result.current.correlationId).toBeNull();
  });

  it('deve permitir definir Correlation ID manualmente', () => {
    const wrapper = ({ children }: any) => <CorrelationProvider>{children}</CorrelationProvider>;

    const { result } = renderHook(() => useCorrelation(), { wrapper });

    const manualId = 'manual-correlation-id';

    act(() => {
      result.current.setCorrelationId(manualId);
    });

    expect(result.current.correlationId).toBe(manualId);
  });

  it('deve ignorar valores inválidos ao definir Correlation ID', () => {
    const wrapper = ({ children }: any) => <CorrelationProvider>{children}</CorrelationProvider>;

    const { result } = renderHook(() => useCorrelation(), { wrapper });

    // Tenta definir valor vazio
    act(() => {
      result.current.setCorrelationId('');
    });

    // Deve permanecer null
    expect(result.current.correlationId).toBeNull();

    // Define valor válido
    act(() => {
      result.current.setCorrelationId('valid-id');
    });
    expect(result.current.correlationId).toBe('valid-id');

    // Tenta definir valor inválido (não-string) - TypeScript previne isso,
    // mas vamos testar mesmo assim
    act(() => {
      (result.current.setCorrelationId as any)(null);
    });

    // Deve manter o valor anterior
    expect(result.current.correlationId).toBe('valid-id');
  });
});
