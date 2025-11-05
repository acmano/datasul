# Correlation ID - Guia de Uso

## O que é Correlation ID?

Correlation ID (também conhecido como Request ID ou Trace ID) é um identificador único (UUID v4) que rastreia uma requisição através de todo o sistema, do frontend ao backend e seus logs.

**Benefícios:**
- Rastreamento end-to-end de requisições
- Facilita troubleshooting de erros em produção
- Permite correlacionar logs frontend/backend
- Melhora diagnóstico de problemas intermitentes

## Como Funciona

### 1. Fluxo End-to-End

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Frontend   │ ──────> │   Backend   │ ──────> │    Logs     │
│  (lor0138)  │         │ (lordtsapi) │         │  (Kibana)   │
└─────────────┘         └─────────────┘         └─────────────┘
      │                       │                        │
      │  1. Faz requisição    │                        │
      │ ───────────────────>  │                        │
      │                       │  2. Gera/usa UUID      │
      │                       │  3. Adiciona aos logs  │
      │                       │ ─────────────────────> │
      │  4. Retorna header    │                        │
      │ <────────────────────│                        │
      │  X-Correlation-ID     │                        │
      │                       │                        │
      │  5. Armazena no       │                        │
      │     contexto React    │                        │
```

### 2. Backend (lordtsapi)

O middleware `correlationIdMiddleware` já está implementado e ativo:

**Localização:** `lordtsapi/src/shared/middlewares/correlationId.middleware.ts`

**Funcionalidades:**
- Aceita Correlation ID do cliente via headers:
  - `X-Correlation-ID` (prioridade 1)
  - `X-Request-ID` (prioridade 2)
  - `correlation-id` (prioridade 3)
- Gera UUID v4 automaticamente se não fornecido
- Adiciona ao `req.id` e `req.startTime`
- Retorna no header `X-Correlation-ID` da resposta
- Registrado como PRIMEIRO middleware da cadeia

### 3. Frontend (lor0138)

#### Componentes Principais

**1. CorrelationContext**
- Localização: `src/shared/contexts/CorrelationContext.tsx`
- Mantém o último Correlation ID conhecido
- Atualizado automaticamente pelo interceptor Axios

**2. Hook useCorrelation()**
- Localização: `src/shared/hooks/useCorrelation.ts`
- Fornece acesso ao Correlation ID em qualquer componente
- Throw error se usado fora do provider

**3. Interceptor Axios**
- Localização: `src/shared/config/api.config.ts`
- Captura header `X-Correlation-ID` nas respostas
- Funciona tanto em sucesso quanto em erro

**4. ErrorDisplay Component**
- Localização: `src/shared/components/ErrorDisplay.tsx`
- Exibe erros com Correlation ID
- Botão para copiar ID
- Integrado ao ErrorBoundary

## Como Usar

### 1. Setup Inicial (App.tsx)

Envolva sua aplicação com o `CorrelationProvider`:

```tsx
import { CorrelationProvider } from '@shared/contexts/CorrelationContext';

function App() {
  return (
    <CorrelationProvider>
      <YourApp />
    </CorrelationProvider>
  );
}
```

### 2. Acessar Correlation ID

Em qualquer componente funcional:

```tsx
import { useCorrelation } from '@shared/hooks/useCorrelation';

function MyComponent() {
  const { correlationId } = useCorrelation();

  return (
    <div>
      {correlationId && (
        <span>ID de rastreamento: {correlationId}</span>
      )}
    </div>
  );
}
```

### 3. Exibir Erros com Correlation ID

Usando o componente `ErrorDisplay`:

```tsx
import ErrorDisplay from '@shared/components/ErrorDisplay';
import { useCorrelation } from '@shared/hooks/useCorrelation';

function MyComponent() {
  const { correlationId } = useCorrelation();
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        correlationId={correlationId}
        onReload={() => window.location.reload()}
      />
    );
  }

  // ... resto do componente
}
```

### 4. Error Handling com Correlation ID

Ao usar `handleError` do errorHandler:

```tsx
import { handleError } from '@shared/utils/errorHandler';
import { useCorrelation } from '@shared/hooks/useCorrelation';

function MyComponent() {
  const { correlationId } = useCorrelation();

  const handleSubmit = async () => {
    try {
      await someApiCall();
    } catch (error) {
      handleError(error, {
        context: 'MyComponent.handleSubmit',
        customMessage: 'Erro ao salvar dados',
        correlationId, // Passa o ID para aparecer no toast
      });
    }
  };
}
```

### 5. ErrorBoundary

O `ErrorBoundary` já está integrado com Correlation ID automaticamente:

```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Troubleshooting

### Como Usar o Correlation ID para Diagnóstico

#### 1. Usuário Reporta Erro

Usuário vê a tela de erro com algo como:

```
Erro: Falha ao carregar dados

ID de Rastreamento: 7f3d4a5b-8c9e-4f2a-a1b2-3c4d5e6f7a8b
[Botão: Copiar]

Copie este ID ao reportar o problema.
```

#### 2. Buscar no Backend

Com o Correlation ID, você pode buscar nos logs do backend:

**Console/Terminal:**
```bash
# Exemplo: buscar em logs JSON
grep "7f3d4a5b-8c9e-4f2a-a1b2-3c4d5e6f7a8b" /var/log/lordtsapi/*.log
```

**Kibana:**
```
correlationId: "7f3d4a5b-8c9e-4f2a-a1b2-3c4d5e6f7a8b"
```

Isso retornará TODOS os logs relacionados àquela requisição:
- Request inicial
- Queries SQL executadas
- Cache hits/misses
- Erros ocorridos
- Response final
- Tempo de execução

#### 3. Análise Completa

Com os logs, você pode ver:
- Qual endpoint foi chamado
- Quais parâmetros foram enviados
- Qual query SQL foi executada
- Onde o erro ocorreu exatamente
- Tempo gasto em cada etapa
- Stack trace completo

### Exemplo de Log Backend

```json
{
  "timestamp": "2025-10-25T14:32:15.123Z",
  "level": "error",
  "correlationId": "7f3d4a5b-8c9e-4f2a-a1b2-3c4d5e6f7a8b",
  "message": "Database query failed",
  "context": {
    "method": "GET",
    "url": "/api/item/dadosCadastrais/informacoesGerais/ABC123",
    "query": "SELECT * FROM item WHERE codigo = ?",
    "error": "Connection timeout",
    "duration": 30000
  }
}
```

## Boas Práticas

### DO ✅

1. **Sempre mostrar Correlation ID em erros para o usuário**
   - Permite que usuários reportem problemas com contexto
   - Facilita suporte e troubleshooting

2. **Incluir Correlation ID em logs críticos**
   ```tsx
   console.error('[MyComponent]', {
     correlationId,
     error: error.message,
     context: 'additional info'
   });
   ```

3. **Usar ErrorDisplay para exibir erros**
   - Componente consistente em toda a aplicação
   - Correlation ID sempre visível e copiável

4. **Buscar por Correlation ID no Kibana ao investigar bugs**
   - Visão completa do que aconteceu
   - Correlaciona frontend e backend

### DON'T ❌

1. **Não enviar Correlation ID em requisições GET via query params**
   - Backend gera automaticamente
   - Apenas use header se precisar rastrear do cliente

2. **Não exibir Correlation ID completo em UIs normais**
   - Apenas em telas de erro
   - Usuários normais não precisam ver

3. **Não usar como identificador de sessão ou autenticação**
   - É apenas para troubleshooting
   - Não tem significado de segurança

4. **Não persistir no localStorage**
   - Contexto já gerencia em memória
   - Não há necessidade de persistência

## FAQ

### Por que o Correlation ID muda a cada requisição?

Cada requisição HTTP tem seu próprio Correlation ID único. Isso permite rastrear requisições individuais, não sessões inteiras.

### E se o backend não retornar o header?

O contexto mantém o último ID conhecido. Se não houver ID, exibiremos o erro sem ele (mas isso não deve acontecer, pois o middleware está sempre ativo).

### Posso usar para tracking de usuário?

Não. Correlation ID é para troubleshooting técnico, não analytics ou tracking de usuário. Use ferramentas específicas para isso (Google Analytics, Mixpanel, etc.).

### Como testar se está funcionando?

1. Abra DevTools → Network
2. Faça uma requisição à API
3. Verifique response headers → procure por `x-correlation-id`
4. O valor deve ser um UUID v4

Ou force um erro e veja se o ErrorDisplay mostra o ID.

## Próximos Passos (Fase 2)

- [ ] Integração com Sentry/LogRocket
- [ ] Propagação através de microserviços
- [ ] Dashboard de rastreamento em tempo real
- [ ] Métricas de latência por Correlation ID

## Suporte

Para dúvidas ou problemas, consulte:
- Backend: `lordtsapi/src/shared/middlewares/correlationId.middleware.md`
- Slack: #dev-support
- Wiki: [Link para Wiki Interna]

---

**Última atualização:** 2025-10-25
**Versão:** 1.0.0
**Status:** Fase 1 Completa ✅
