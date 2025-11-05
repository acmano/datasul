import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import App from '../App';

// Lazy load health check page
const HealthCheckPage = lazy(() => import('../pages/HealthCheck'));

/**
 * Configuração de rotas da aplicação
 *
 * Estrutura:
 * - / - Página inicial (redireciona para dados-mestres)
 * - /dados-mestres - Dados Mestres (sem item selecionado)
 * - /dados-mestres/:codigo - Dados Mestres com item selecionado (aba padrão)
 * - /dados-mestres/:codigo/:aba - Dados Mestres com item e aba específica
 * - /engenharias - Engenharias (sem item selecionado)
 * - /engenharias/:codigo - Engenharias com item selecionado (aba padrão)
 * - /engenharias/:codigo/:aba - Engenharias com item e aba específica
 * - /suprimentos - Suprimentos (sem item selecionado)
 * - /suprimentos/:codigo - Suprimentos com item selecionado (aba padrão)
 * - /suprimentos/:codigo/:aba - Suprimentos com item e aba específica
 *
 * Abas disponíveis:
 * - Dados Mestres: base, dimensoes, planejamento, manufatura, fiscal, suprimentos
 * - Engenharias: estrutura, ondeUsado
 * - Suprimentos: base, estoque, movimento, fornecedores, programacao-entrega
 *
 * @example
 * ```
 * /dados-mestres              → Busca de itens no módulo Dados Mestres
 * /dados-mestres/ABC123       → Item ABC123, aba 'base' (padrão)
 * /dados-mestres/ABC123/fiscal → Item ABC123, aba 'fiscal'
 * /engenharias/XYZ789         → Item XYZ789, aba 'estrutura' (padrão)
 * /engenharias/XYZ789/ondeUsado → Item XYZ789, aba 'onde usado'
 * /suprimentos/ABC123         → Item ABC123, aba 'base' (padrão)
 * /suprimentos/ABC123/estoque → Item ABC123, aba 'estoque'
 * ```
 */
const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz - redireciona para dados-mestres */}
        <Route path="/" element={<Navigate to="/dados-mestres" replace />} />

        {/* Health Check - Página de status da aplicação */}
        <Route
          path="/health"
          element={
            <Suspense
              fallback={
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                  }}
                >
                  <Spin size="large" />
                </div>
              }
            >
              <HealthCheckPage />
            </Suspense>
          }
        />

        {/* Rotas de Dados Mestres */}
        <Route path="/dados-mestres" element={<App />} />
        <Route path="/dados-mestres/:codigo" element={<App />} />
        <Route path="/dados-mestres/:codigo/:aba" element={<App />} />

        {/* Rotas de Engenharias */}
        <Route path="/engenharias" element={<App />} />
        <Route path="/engenharias/:codigo" element={<App />} />
        <Route path="/engenharias/:codigo/:aba" element={<App />} />

        {/* Rotas de PCP */}
        <Route path="/pcp" element={<App />} />
        <Route path="/pcp/:codigo" element={<App />} />
        <Route path="/pcp/:codigo/:aba" element={<App />} />

        {/* Rotas de Manufatura */}
        <Route path="/manufatura" element={<App />} />
        <Route path="/manufatura/:codigo" element={<App />} />
        <Route path="/manufatura/:codigo/:aba" element={<App />} />

        {/* Rotas de Suprimentos */}
        <Route path="/suprimentos" element={<App />} />
        <Route path="/suprimentos/:codigo" element={<App />} />
        <Route path="/suprimentos/:codigo/:aba" element={<App />} />

        {/* Rotas de Fiscal */}
        <Route path="/fiscal" element={<App />} />
        <Route path="/fiscal/:codigo" element={<App />} />
        <Route path="/fiscal/:codigo/:aba" element={<App />} />

        {/* Fallback para rotas não encontradas */}
        <Route path="*" element={<Navigate to="/dados-mestres" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
