# Guia de Contribuição

## Código de Conduta

- Seja respeitoso e profissional
- Colabore de forma construtiva
- Foque em soluções, não em problemas

## Como Contribuir

### 1. Configuração do Ambiente

```bash
git clone <repository>
cd lor0138
npm install
npm start
```

### 2. Criar Branch

```bash
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
```

### 3. Fazer Alterações

- Siga os padrões de código do projeto
- Escreva testes para novas funcionalidades
- Atualize documentação se necessário

### 4. Commits

Siga o padrão **Conventional Commits**:

```bash
git commit -m "feat: adiciona nova funcionalidade"
git commit -m "fix: corrige bug na busca"
git commit -m "docs: atualiza README"
git commit -m "refactor: melhora estrutura do componente"
git commit -m "test: adiciona testes para service"
```

**Tipos de commit:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `refactor`: Refatoração de código
- `test`: Adição/modificação de testes
- `chore`: Tarefas de manutenção

### 5. Push e Pull Request

```bash
git push origin feature/nome-da-feature
```

Abra Pull Request no GitHub com:
- Título descritivo
- Descrição das mudanças
- Screenshots (se aplicável)
- Referência a issues relacionadas

## Padrões de Código

### Nomenclatura
- **Variáveis/Funções**: camelCase
- **Componentes**: PascalCase
- **Arquivos**: PascalCase para componentes, camelCase para outros
- **Constantes**: UPPER_SNAKE_CASE
- **Sem underscores**: exceto em constantes

### TypeScript
- Sempre definir tipos explícitos
- Evitar `any` - usar `unknown` se necessário
- Preferir interfaces para objetos

### React
- Componentes funcionais com hooks
- Memoização quando apropriado
- Props interfaces definidas

### Imports
```typescript
// 1. Externos
import React from 'react';
import { Button } from 'antd';

// 2. Path aliases
import { api } from '@shared/config/api.config';

// 3. Relativos
import { Entity } from '../types';
```

## Testes

### Executar Testes
```bash
npm test
npm test -- --coverage
```

### Escrever Testes
- Unit tests para services e utilities
- Component tests com React Testing Library
- Cobertura mínima: 70%

## Code Review

### Checklist do Autor
- [ ] Código segue padrões do projeto
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Sem console.logs desnecessários
- [ ] Sem warnings de linting
- [ ] Build de produção funciona

### Checklist do Reviewer
- [ ] Código é legível e manutenível
- [ ] Lógica está correta
- [ ] Não introduz bugs
- [ ] Performance adequada
- [ ] Testes cobrem casos importantes

## Dúvidas

Consulte:
- Documentação em `/docs`
- Módulos existentes como referência
- Equipe de desenvolvimento

---

**Obrigado por contribuir!**
