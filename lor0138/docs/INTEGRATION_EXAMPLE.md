# Exemplo de Integração - Correlation ID

## Integração no App.tsx

Para ativar o sistema de Correlation ID, você precisa adicionar o `CorrelationProvider` no seu `App.tsx`:

```tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ptBR from 'antd/locale/pt_BR';

// Import do CorrelationProvider
import { CorrelationProvider } from '@shared/contexts/CorrelationContext';

// Seus outros providers
import { AuthProvider } from '@shared/contexts/AuthContext';
import { ThemeProvider } from '@shared/contexts/ThemeContext';
import ErrorBoundary from '@shared/components/ErrorBoundary';

// Rotas
import AppRoutes from './routes';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ConfigProvider locale={ptBR}>
          <ThemeProvider>
            <AuthProvider>
              {/* Adicione o CorrelationProvider aqui */}
              <CorrelationProvider>
                <AppRoutes />
              </CorrelationProvider>
            </AuthProvider>
          </ThemeProvider>
        </ConfigProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
```

## Ordem dos Providers

A ordem importa! Recomendamos:

```
ErrorBoundary (mais externo)
  └─ BrowserRouter
      └─ ConfigProvider (Ant Design)
          └─ ThemeProvider
              └─ AuthProvider
                  └─ CorrelationProvider
                      └─ AppRoutes
```

**Por quê?**
- `ErrorBoundary` no topo captura TODOS os erros
- `CorrelationProvider` dentro de `AuthProvider` permite acessar usuário se necessário
- `CorrelationProvider` próximo às rotas para capturar requisições imediatamente

## Verificar se Está Funcionando

### 1. DevTools - Network

1. Abra DevTools (F12)
2. Vá na aba Network
3. Faça uma requisição para a API
4. Clique na requisição
5. Vá em "Response Headers"
6. Procure por `x-correlation-id`

Deve aparecer algo como:
```
x-correlation-id: 7f3d4a5b-8c9e-4f2a-a1b2-3c4d5e6f7a8b
```

### 2. Console do Navegador

Em desenvolvimento, você verá logs:
```
[CorrelationContext] ID atualizado: 7f3d4a5b-8c9e-4f2a-a1b2-3c4d5e6f7a8b
```

### 3. Forçar um Erro

Crie um componente de teste:

```tsx
import React from 'react';
import { useCorrelation } from '@shared/hooks/useCorrelation';

function TestCorrelationId() {
  const { correlationId } = useCorrelation();

  return (
    <div style={{ padding: 20 }}>
      <h3>Teste de Correlation ID</h3>
      <p>
        <strong>Correlation ID:</strong> {correlationId || 'Nenhuma requisição feita ainda'}
      </p>
      <button onClick={() => { throw new Error('Erro de teste!'); }}>
        Forçar Erro
      </button>
    </div>
  );
}

export default TestCorrelationId;
```

Ao clicar no botão:
- ErrorBoundary captura o erro
- ErrorDisplay mostra o erro com Correlation ID
- Você pode copiar o ID

## Uso em Componentes Existentes

### Exemplo 1: Exibir em Componente de Erro

```tsx
import React from 'react';
import { useCorrelation } from '@shared/hooks/useCorrelation';
import ErrorDisplay from '@shared/components/ErrorDisplay';

function MyComponent() {
  const { correlationId } = useCorrelation();
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        correlationId={correlationId}
        title="Erro ao carregar dados"
      />
    );
  }

  return <div>Conteúdo normal</div>;
}
```

### Exemplo 2: Incluir em Logs

```tsx
import React from 'react';
import { useCorrelation } from '@shared/hooks/useCorrelation';

function MyComponent() {
  const { correlationId } = useCorrelation();

  const handleAction = () => {
    console.log('Ação executada', {
      correlationId,
      timestamp: new Date().toISOString(),
      user: 'current-user',
    });
  };

  return <button onClick={handleAction}>Executar</button>;
}
```

### Exemplo 3: Error Handling em Requisições

```tsx
import React from 'react';
import { useCorrelation } from '@shared/hooks/useCorrelation';
import { handleError } from '@shared/utils/errorHandler';
import api from '@shared/config/api.config';

function MyForm() {
  const { correlationId } = useCorrelation();

  const handleSubmit = async (data: any) => {
    try {
      await api.post('/api/item', data);
      message.success('Item criado com sucesso!');
    } catch (error) {
      // Error handler automaticamente usa correlationId nos toasts
      handleError(error, {
        context: 'MyForm.handleSubmit',
        customMessage: 'Erro ao criar item',
        correlationId, // Passa o ID para aparecer no toast
      });
    }
  };

  return <form onSubmit={handleSubmit}>{/* campos */}</form>;
}
```

## Troubleshooting

### Erro: "useCorrelation must be used within CorrelationProvider"

**Causa:** Componente está usando `useCorrelation()` mas não está dentro do provider.

**Solução:** Certifique-se de que `<CorrelationProvider>` está envolvendo seu componente no `App.tsx`.

### Correlation ID sempre null

**Causa:** Nenhuma requisição foi feita ainda, ou backend não está retornando o header.

**Solução:**
1. Verifique no DevTools se o header `x-correlation-id` está presente
2. Confirme que o backend está rodando
3. Verifique CORS do backend (deve incluir `exposedHeaders: ['X-Correlation-ID']`)

### Correlation ID não aparece em erros

**Causa:** ErrorBoundary não está integrado ou está fora do CorrelationProvider.

**Solução:**
1. Certifique-se de usar o ErrorBoundary atualizado
2. CorrelationProvider deve estar dentro do ErrorBoundary (mas o ErrorBoundary pode acessar contexto)

## Próximos Passos

Após integrar:

1. ✅ Teste em desenvolvimento
2. ✅ Faça algumas requisições e copie IDs
3. ✅ Busque os IDs nos logs do backend
4. ✅ Confirme que consegue rastrear requisições end-to-end
5. ✅ Deploy em staging/produção

## Checklist de Integração

- [ ] `CorrelationProvider` adicionado no App.tsx
- [ ] Provider na ordem correta (dentro de Auth, fora de Routes)
- [ ] Testado em DevTools (header presente)
- [ ] Testado erro forçado (ErrorDisplay mostra ID)
- [ ] Testado cópia do ID (funciona)
- [ ] Documentação lida (CORRELATION_ID_GUIDE.md)
- [ ] Time treinado no uso do ID para troubleshooting

---

**Última atualização:** 2025-10-25
**Versão:** 1.0.0
