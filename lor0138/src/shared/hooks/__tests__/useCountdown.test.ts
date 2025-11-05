import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve inicializar com os segundos fornecidos', () => {
    const { result } = renderHook(() => useCountdown(10));

    expect(result.current.seconds).toBe(10);
    expect(result.current.isFinished).toBe(false);
  });

  it('deve decrementar segundos a cada 1 segundo', () => {
    const { result } = renderHook(() => useCountdown(10));

    expect(result.current.seconds).toBe(10);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(9);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(8);
  });

  it('deve marcar isFinished como true quando chegar a zero', () => {
    const { result } = renderHook(() => useCountdown(2));

    expect(result.current.isFinished).toBe(false);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.isFinished).toBe(true);
  });

  it('deve parar de decrementar após chegar a zero', () => {
    const { result } = renderHook(() => useCountdown(2));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.seconds).toBe(0);

    // Avança mais tempo
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Deve continuar em zero
    expect(result.current.seconds).toBe(0);
    expect(result.current.isFinished).toBe(true);
  });

  it('deve permitir restart com novos segundos', () => {
    const { result } = renderHook(() => useCountdown(5));

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.seconds).toBe(2);

    act(() => {
      result.current.restart(10);
    });

    expect(result.current.seconds).toBe(10);
    expect(result.current.isFinished).toBe(false);
  });

  it('deve continuar countdown após restart', () => {
    const { result } = renderHook(() => useCountdown(5));

    act(() => {
      result.current.restart(3);
    });

    expect(result.current.seconds).toBe(3);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(2);
  });

  it('deve inicializar como finished se segundos iniciais forem zero', () => {
    const { result } = renderHook(() => useCountdown(0));

    expect(result.current.seconds).toBe(0);
    expect(result.current.isFinished).toBe(true);
  });

  it('deve inicializar como finished se segundos iniciais forem negativos', () => {
    const { result } = renderHook(() => useCountdown(-5));

    expect(result.current.seconds).toBe(-5);
    expect(result.current.isFinished).toBe(true);
  });

  it('deve marcar como finished ao fazer restart com zero segundos', () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      result.current.restart(0);
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.isFinished).toBe(true);
  });

  it('deve limpar intervalo ao desmontar', () => {
    const { unmount } = renderHook(() => useCountdown(10));

    // Spy em clearInterval
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });
});
