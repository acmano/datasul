# Rate Limit Testing Guide

Este documento descreve como testar a funcionalidade de Rate Limit UI Feedback implementada na aplicação.

## Visão Geral

A aplicação implementa feedback visual quando o backend retorna erro 429 (Too Many Requests). O sistema:

1. **Detecta erro 429** através do interceptor Axios
2. **Exibe alerta** sticky no topo da página
3. **Mostra countdown** em tempo real
4. **Permite retry** quando countdown chega a zero
5. **Atualiza badge** no header com requests restantes

## Componentes Implementados

### 1. RateLimitContext
- **Arquivo**: `src/shared/contexts/RateLimitContext.tsx`
- **Responsabilidade**: Gerenciar estado de rate limit
- **Estado**:
  - `isRateLimited`: boolean
  - `retryAfter`: segundos até retry
  - `limit`: limite total de requests
  - `remaining`: requests restantes
  - `reset`: timestamp de reset
  - `lastError`: último erro

### 2. useCountdown Hook
- **Arquivo**: `src/shared/hooks/useCountdown.ts`
- **Responsabilidade**: Countdown timer regressivo
- **Retorna**: `{ seconds, isFinished, restart }`

### 3. RateLimitWarning Component
- **Arquivo**: `src/shared/components/RateLimitWarning.tsx`
- **Responsabilidade**: UI do alerta de rate limit
- **Features**:
  - Alert sticky (fixed position)
  - Countdown formatado (mm:ss)
  - Botão retry (disabled até countdown = 0)
  - Mensagens claras

### 4. RateLimitWarningContainer
- **Arquivo**: `src/shared/components/RateLimitWarningContainer.tsx`
- **Responsabilidade**: Conectar RateLimitWarning com RateLimitContext
- **Lógica**: Sincroniza countdown com retryAfter

### 5. RateLimitBadge
- **Arquivo**: `src/shared/components/RateLimitBadge.tsx`
- **Responsabilidade**: Badge no header com requests restantes
- **Localização**: Canto superior direito do header

### 6. Interceptors Axios
- **Arquivo**: `src/shared/config/api.config.ts`
- **Response Success**: Captura headers `X-RateLimit-*`
- **Response Error**: Detecta erro 429 e captura headers

## Como Testar

### Teste 1: Simular Erro 429 Localmente

#### Opção A: Mock no Browser DevTools

1. Abra DevTools (F12)
2. Vá para Network tab
3. Ative "Throttling" ou use extensão para interceptar requests
4. Modifique resposta para retornar 429 com headers:
   ```
   Status: 429 Too Many Requests
   Retry-After: 60
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 0
   X-RateLimit-Reset: 1735161600
   ```

#### Opção B: Backend Local

Se você tem acesso ao backend lordtsapi:

1. Configure limite muito baixo (ex: 5 requests/15min)
2. Faça múltiplas requisições rapidamente
3. Backend retornará 429 automaticamente

#### Opção C: Mock no Código (Temporário)

Adicione temporariamente no `api.config.ts`:

```typescript
// APENAS PARA TESTE - REMOVER DEPOIS
api.interceptors.response.use(
  (response) => {
    // Simula erro 429 na próxima request
    if (Math.random() > 0.5) {
      const error = {
        response: {
          status: 429,
          headers: {
            'retry-after': '30',
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': Math.floor(Date.now() / 1000) + 900,
          },
        },
      };
      return Promise.reject(error);
    }
    return response;
  }
);
```

### Teste 2: Verificar Countdown

1. Trigger erro 429
2. Verificar que alerta aparece no topo
3. Observar countdown decrementando a cada segundo
4. Verificar formato de tempo (mm:ss)
5. Quando chegar a zero, verificar que:
   - Mensagem muda para "Você já pode tentar novamente!"
   - Botão "Tentar Novamente" fica enabled

### Teste 3: Verificar Retry

1. Quando countdown = 0
2. Clicar em "Tentar Novamente"
3. Verificar que:
   - Alerta desaparece
   - Estado de rate limit é limpo
   - Usuário pode fazer nova request

### Teste 4: Verificar Badge no Header

1. Fazer requests bem-sucedidas
2. Verificar que badge aparece no header (canto superior direito)
3. Hover sobre badge para ver tooltip com:
   - Uso: X / Y requests
   - Reset em: HH:MM ou "X minutos"

### Teste 5: Verificar Headers em Responses

Use DevTools Network tab:

1. Fazer request normal
2. Inspecionar response headers
3. Verificar presença de:
   - `X-RateLimit-Limit`
   - `X-RateLimit-Remaining`
   - `X-RateLimit-Reset`
4. Confirmar que badge atualiza com valores corretos

### Teste 6: Verificar Erro 429 Real

Se backend lordtsapi está rodando com rate limit:

1. Configure .env com endpoint correto
2. Faça múltiplas requests rapidamente (exceda o limite)
3. Backend retornará 429
4. Verificar todos os comportamentos esperados

### Teste 7: Verificar Accessibility

1. Abrir alerta de rate limit
2. Verificar com screen reader:
   - `role="alert"` está presente
   - `aria-live="assertive"` funciona
   - Mensagens são anunciadas
3. Navegar com teclado:
   - Tab deve focar no botão "Tentar Novamente"
   - Enter deve executar retry
   - Escape deve fechar alerta (se closable)

## Cenários de Teste

### Cenário 1: Usuário Atinge Limite
1. Usuário faz 100 requests em 15 minutos
2. Request #101 retorna 429
3. Alerta aparece: "Aguarde 14:32"
4. Countdown decrementa
5. Após 14:32, botão fica enabled
6. Usuário clica "Tentar Novamente"
7. Sistema permite nova request

### Cenário 2: Usuário Fecha Alerta
1. Rate limit ativo
2. Usuário clica X (fechar)
3. Alerta desaparece
4. Estado de rate limit é limpo
5. Usuário pode tentar novamente manualmente

### Cenário 3: Múltiplos Erros 429
1. Request A retorna 429 (retry-after: 60)
2. Alerta aparece com countdown 60s
3. Request B também retorna 429 (retry-after: 30)
4. Sistema mantém countdown maior (60s)
5. **OU** atualiza para retry-after mais recente

### Cenário 4: Badge Atualização Contínua
1. Badge mostra 95 requests restantes
2. Usuário faz request
3. Badge atualiza para 94
4. Continua decrementando a cada request

## Verificações de Qualidade

### TypeScript
- [ ] Todos os tipos estão corretos
- [ ] Sem `any` desnecessários
- [ ] Interfaces exportadas documentadas

### UX
- [ ] Alerta é visível mas não intrusivo
- [ ] Countdown é claro e fácil de entender
- [ ] Mensagens são amigáveis (não técnicas)
- [ ] Botão retry está disabled durante countdown

### Performance
- [ ] Countdown não causa rerenders desnecessários
- [ ] Badge não rerender a cada segundo
- [ ] Interceptors não impactam performance

### Accessibility
- [ ] Alert tem role="alert"
- [ ] Countdown é anunciado (aria-live)
- [ ] Botão é focável
- [ ] Cores têm contraste adequado

## Troubleshooting

### Alerta não aparece ao receber 429
- Verificar se RateLimitProvider está no index.tsx
- Verificar se handlers globais foram registrados
- Verificar console para logs de desenvolvimento
- Verificar Network tab para confirmar status 429

### Countdown não decrementa
- Verificar se useCountdown está sendo chamado
- Verificar cleanup do setInterval
- Verificar se retryAfter é um número válido

### Badge não mostra número
- Verificar se backend envia headers X-RateLimit-*
- Verificar se interceptor está capturando headers
- Verificar case sensitivity dos headers

### Retry não funciona
- Verificar se clearRateLimit está sendo chamado
- Verificar se estado é limpo corretamente
- Verificar logs no console

## Configuração de Ambiente

### Backend lordtsapi

O backend já possui rate limiting implementado:

```typescript
// Padrão: 100 requests por 15 minutos
@UseGuards(RateLimitGuard)
@Controller('api/items')
export class ItemsController {
  // endpoints...
}
```

Headers retornados:
- `X-RateLimit-Limit`: 100
- `X-RateLimit-Remaining`: 95
- `X-RateLimit-Reset`: 1735161600
- `Retry-After`: 900 (em caso de 429)

### Frontend .env

```bash
REACT_APP_API_URL=http://localhost:3000/api
```

## Próximos Passos

Após implementação e testes manuais:

1. **Testes Automatizados**
   - Unit tests para useCountdown
   - Unit tests para RateLimitContext
   - Integration tests para interceptors
   - E2E tests com Playwright

2. **Melhorias Futuras**
   - Cores no badge baseadas em % restante
   - Notificações quando chegar perto do limite
   - Histórico de rate limits
   - Configuração de thresholds

3. **Monitoramento**
   - Logs de rate limit no analytics
   - Métricas de quantos usuários atingem limite
   - Dashboards de uso de API

## Referências

- [Backend lordtsapi Rate Limit](../lordtsapi/docs/RATE_LIMIT.md)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [React useEffect Cleanup](https://react.dev/reference/react/useEffect#cleanup-function)
- [Ant Design Alert](https://ant.design/components/alert)
