import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para countdown timer
 *
 * Cria um contador regressivo que decrementa a cada segundo.
 * Útil para exibir tempo de espera até retry de rate limit.
 *
 * @param initialSeconds - Segundos iniciais do countdown
 * @returns Objeto com estado e controles do countdown
 *
 * @example
 * ```tsx
 * const { seconds, isFinished, restart } = useCountdown(60);
 *
 * return (
 *   <div>
 *     {!isFinished && <p>Aguarde {seconds} segundos</p>}
 *     {isFinished && <button onClick={() => restart(60)}>Reiniciar</button>}
 *   </div>
 * );
 * ```
 */
export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [isFinished, setIsFinished] = useState<boolean>(initialSeconds <= 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Limpa o intervalo ativo
   */
  const clearCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Reinicia o countdown com novos segundos
   */
  const restart = useCallback(
    (newSeconds: number) => {
      clearCountdown();
      setSeconds(newSeconds);
      setIsFinished(newSeconds <= 0);
    },
    [clearCountdown]
  );

  /**
   * Efeito que gerencia o intervalo de decremento
   */
  useEffect(() => {
    // Se já terminou ou não há segundos, não faz nada
    if (seconds <= 0) {
      setIsFinished(true);
      clearCountdown();
      return;
    }

    // Cria intervalo que decrementa a cada segundo
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsFinished(true);
          clearCountdown();
          return 0;
        }
        return next;
      });
    }, 1000);

    // Cleanup ao desmontar ou quando segundos mudam
    return () => {
      clearCountdown();
    };
  }, [seconds, clearCountdown]);

  return {
    /**
     * Segundos restantes no countdown
     */
    seconds,

    /**
     * Indica se o countdown terminou (chegou a zero)
     */
    isFinished,

    /**
     * Reinicia o countdown com novos segundos
     */
    restart,
  };
}
