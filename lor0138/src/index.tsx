import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'antd/dist/reset.css';
import AppRoutes from './routes';
import ErrorBoundary from './shared/components/ErrorBoundary';
import { ThemeProvider } from './shared/contexts/ThemeContext';
import { AuthProvider } from './shared/contexts/AuthContext';
import { ItemDataProvider } from './shared/contexts/ItemDataContext';
import { RateLimitProvider } from './shared/contexts/RateLimitContext';
import { CorrelationProvider } from './shared/contexts/CorrelationContext';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <CorrelationProvider>
        <ThemeProvider>
          <AuthProvider>
            <RateLimitProvider>
              <ItemDataProvider>
                <AppRoutes />
              </ItemDataProvider>
            </RateLimitProvider>
          </AuthProvider>
        </ThemeProvider>
      </CorrelationProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
