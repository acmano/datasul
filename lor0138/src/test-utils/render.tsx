import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../shared/contexts/ThemeContext';
import { CorrelationProvider } from '../shared/contexts/CorrelationContext';
import { RateLimitProvider } from '../shared/contexts/RateLimitContext';

/**
 * Provider wrapper para testes de integração
 *
 * Envolve componentes em todos os providers necessários
 * para testes que precisam de contexto completo.
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <CorrelationProvider>
        <RateLimitProvider>{children}</RateLimitProvider>
      </CorrelationProvider>
    </ThemeProvider>
  );
};

/**
 * Custom render com providers
 *
 * Use este render em vez do padrão para testes de integração
 * que precisam de acesso aos contextos da aplicação.
 *
 * @example
 * ```tsx
 * import { render, screen } from '../../test-utils/render';
 *
 * render(<MyComponent />);
 * ```
 */
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-exporta tudo do @testing-library/react
export * from '@testing-library/react';

// Sobrescreve render com versão customizada
export { customRender as render };
