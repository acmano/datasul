# 🎨 DESIGN SYSTEM - LOR0138

## 📋 Visão Geral

Sistema de design completo e profissional para o projeto LOR0138, garantindo consistência visual, acessibilidade e manutenibilidade em toda a aplicação.

---

## 📁 Estrutura de Arquivos

```
src/shared/styles/
├── design-tokens.css      ← Variáveis CSS (cores, espaçamentos, etc)
├── theme.config.ts        ← Configuração do Ant Design
├── global.css             ← Estilos globais aplicando os tokens
└── DESIGN_SYSTEM.md       ← Esta documentação
```

---

## 🎨 1. CORES

### Paleta Principal

```css
/* Primária - Azul Lorenzetti */
--color-primary: #1890ff --color-primary-light: #40a9ff --color-primary-dark: #096dd9
  --color-primary-lightest: #e6f7ff /* Secundária - Vermelho Lorenzetti */
  --color-secondary: #ff4d4f --color-secondary-light: #ff7875 --color-secondary-dark: #cf1322
  /* Estados */ --color-success: #52c41a (Verde) --color-warning: #faad14 (Laranja)
  --color-error: #ff4d4f (Vermelho) --color-info: #1890ff (Azul);
```

### Escala de Cinzas

```css
--color-gray-50: #fafafa (Mais claro) --color-gray-100: #f5f5f5 --color-gray-200: #f0f0f0
  --color-gray-300: #d9d9d9 --color-gray-400: #bfbfbf --color-gray-500: #8c8c8c
  --color-gray-600: #595959 --color-gray-700: #434343 --color-gray-800: #262626
  --color-gray-900: #1f1f1f --color-gray-950: #141414 (Mais escuro);
```

### Como Usar

```tsx
// Em CSS
.meu-componente {
  color: var(--color-primary);
  background: var(--color-gray-50);
}

// Em Ant Design (theme.config.ts já configurado)
<Button type="primary">Botão</Button>
```

---

## 📏 2. ESPAÇAMENTO

### Escala Base (8px)

```css
--spacing-0: 0 --spacing-1: 4px (0.25rem) --spacing-2: 8px (0.5rem) ← Espaçamento mínimo
  --spacing-3: 12px (0.75rem) --spacing-4: 16px (1rem) ← Espaçamento padrão --spacing-5: 20px
  (1.25rem) --spacing-6: 24px (1.5rem) ← Espaçamento médio --spacing-8: 32px (2rem) ← Espaçamento
  grande --spacing-10: 40px --spacing-12: 48px --spacing-16: 64px --spacing-20: 80px
  --spacing-24: 96px;
```

### Quando Usar

| Espaçamento | Uso Recomendado                        |
| ----------- | -------------------------------------- |
| `2px`       | Entre elementos muito próximos         |
| `4px`       | Padding interno pequeno                |
| `8px`       | Gap entre itens em grid                |
| `12px`      | Espaçamento entre campos de formulário |
| `16px`      | Padding padrão de cards                |
| `24px`      | Margem entre seções                    |
| `32px+`     | Grandes separações de layout           |

### Como Usar

```tsx
// Em CSS
.card {
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

// Em inline style
<div style={{ padding: 'var(--spacing-4)' }}>

// Em Ant Design (Row/Col gutter)
<Row gutter={16}> {/* 16px = spacing-4 */}
```

---

## 🌑 3. SOMBRAS

### Níveis de Elevação

```css
--shadow-sm      /* Elevação mínima (hover leve) */
--shadow-base    /* Padrão para cards */
--shadow-md      /* Dropdown, popovers */
--shadow-lg      /* Modals */
--shadow-xl      /* Destaque máximo */
```

### Sombras Coloridas

```css
--shadow-primary  /* Para botões primários */
--shadow-success  /* Para sucessos */
--shadow-warning  /* Para avisos */
--shadow-error    /* Para erros */
```

### Como Usar

```css
.card {
  box-shadow: var(--shadow-base);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.primary-button {
  box-shadow: var(--shadow-primary);
}

/* Ou usar classes utilitárias */
<div className="u-shadow-base">...</div>
```

---

## 🔲 4. BORDAS E RAIOS

### Raios de Borda

```css
--border-radius-sm: 4px /* Elementos pequenos */ --border-radius-base: 6px
  /* Padrão (inputs, buttons) */ --border-radius-md: 8px /* Cards */ --border-radius-lg: 12px
  /* Containers grandes */ --border-radius-xl: 16px /* Destaque */ --border-radius-full: 9999px
  /* Círculos/pills */;
```

### Quando Usar

| Raio     | Componente                  |
| -------- | --------------------------- |
| `4px`    | Tags, badges pequenos       |
| `6px`    | Botões, inputs, selects     |
| `8px`    | Cards, containers           |
| `12px`   | Modals, grandes containers  |
| `9999px` | Avatares, badges circulares |

---

## ✍️ 5. TIPOGRAFIA

### Tamanhos de Fonte

```css
--font-size-xs: 12px /* Legendas, hints */ --font-size-sm: 13px /* Texto secundário */
  --font-size-base: 14px /* Corpo do texto (padrão) */ --font-size-md: 16px /* Texto destacado */
  --font-size-lg: 18px /* Subtítulos */ --font-size-xl: 20px /* Heading 5 */ --font-size-2xl: 24px
  /* Heading 4 */ --font-size-3xl: 30px /* Heading 3 */ --font-size-4xl: 38px /* Heading 1 */;
```

### Pesos de Fonte

```css
--font-weight-light: 300 /* Textos leves */ --font-weight-normal: 400 /* Padrão */
  --font-weight-medium: 500 /* Labels, botões */ --font-weight-semibold: 600 /* Subtítulos */
  --font-weight-bold: 700 /* Títulos */;
```

### Como Usar

```tsx
// CSS
.label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

// Typography do Ant Design
<Typography.Title level={3}>Título</Typography.Title>
<Typography.Text>Texto normal</Typography.Text>
<Typography.Text type="secondary">Texto secundário</Typography.Text>

// Classes utilitárias
<span className="u-font-medium">Texto médio</span>
<span className="u-font-bold">Texto negrito</span>
```

---

## ⚡ 6. TRANSIÇÕES

### Durações

```css
--transition-duration-fast: 150ms /* Hover, pequenas mudanças */ --transition-duration-base: 250ms
  /* Padrão */ --transition-duration-slow: 350ms /* Grandes animações */;
```

### Timing Functions

```css
--transition-timing-ease-in-out  /* Padrão suave */
--transition-timing-ease-in      /* Aceleração */
--transition-timing-ease-out     /* Desaceleração */
```

### Como Usar

```css
.button {
  transition: var(--transition-base);
  /* Equivale a: all 250ms cubic-bezier(0.4, 0, 0.2, 1) */
}

.quick-hover {
  transition: var(--transition-fast);
}
```

---

## 📱 7. BREAKPOINTS

### Pontos de Quebra

```css
--breakpoint-xs: 480px /* Extra Small (mobile) */ --breakpoint-sm: 576px
  /* Small (mobile landscape) */ --breakpoint-md: 768px /* Medium (tablet) */ --breakpoint-lg: 992px
  /* Large (desktop) */ --breakpoint-xl: 1200px /* Extra Large */ --breakpoint-2xl: 1600px
  /* 2X Large */;
```

### Como Usar

```css
/* Mobile First */
.container {
  padding: var(--spacing-4);
}

@media (min-width: 768px) {
  .container {
    padding: var(--spacing-6);
  }
}


@media (min-width: 1200px) {
  .container {
    padding: var(--spacing-8);
  }
}

/* Ant Design Grid */
<Row>
  <Col xs={24} sm={12} md={8} lg={6}>
    Responsivo
  </Col>
</Row>
```

---

## 🚀 8. COMO APLICAR NO PROJETO

### Passo 1: Importar no App.tsx

```tsx
// src/App.tsx
import './shared/styles/design-tokens.css';
import './shared/styles/global.css';
import { getTheme } from './shared/styles/theme.config';

function App() {
  const { theme } = useTheme(); // 'light' ou 'dark'

  return (
    <ConfigProvider
      locale={ptBR}
      theme={getTheme(theme)} // ← Aplicar tema customizado
    >
      {/* Seu app */}
    </ConfigProvider>
  );
}
```

### Passo 2: Usar Tokens nos Componentes

```tsx
// Opção 1: CSS Modules
import styles from './Component.module.css';

// Component.module.css
.card {
  padding: var(--spacing-6);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-base);
  background: var(--color-bg-container);
}

// Opção 2: Inline Styles
<div style={{
  padding: 'var(--spacing-4)',
  borderRadius: 'var(--border-radius-base)',
}}>

// Opção 3: Classes Utilitárias
<div className="u-p-4 u-shadow-base u-radius-md">
```

---

## 📊 9. EXEMPLOS PRÁTICOS

### Card de Produto

```tsx
import { Card, Typography } from 'antd';

const ProductCard = () => (
  <Card
    style={{
      borderRadius: 'var(--border-radius-md)',
      boxShadow: 'var(--shadow-base)',
      transition: 'var(--transition-base)',
    }}
    hoverable
  >
    <Typography.Title
      level={4}
      style={{
        fontWeight: 'var(--font-weight-semibold)',
        marginBottom: 'var(--spacing-3)',
      }}
    >
      Nome do Produto
    </Typography.Title>
    <Typography.Text type="secondary">Descrição do produto aqui</Typography.Text>
  </Card>
);
```

### Formulário Estilizado

```tsx
import { Form, Input, Button, Row, Col } from 'antd';

const StyledForm = () => (
  <Form layout="vertical">
    <Row gutter={16}>
      {' '}
      {/* 16px = spacing-4 */}
      <Col span={12}>
        <Form.Item label="Nome">
          <Input size="large" placeholder="Digite seu nome" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Email">
          <Input size="large" type="email" placeholder="seu@email.com" />
        </Form.Item>
      </Col>
    </Row>
    <Button type="primary" size="large" block>
      Enviar
    </Button>
  </Form>
);
```

---

## ✅ 10. CHECKLIST DE QUALIDADE

Ao criar novos componentes, verifique:

- [ ] **Espaçamento**: Usa tokens de spacing?
- [ ] **Cores**: Usa palette definida?
- [ ] **Bordas**: Raio consistente (6-8px)?
- [ ] **Sombras**: Nível de elevação adequado?
- [ ] **Tipografia**: Peso e tamanho corretos?
- [ ] **Transições**: Animações suaves?
- [ ] **Responsivo**: Funciona em mobile?
- [ ] **Acessibilidade**: Contraste mínimo 4.5:1?
- [ ] **Estados**: Hover/focus/active definidos?

---

## 🎯 11. BENEFÍCIOS

✅ **Consistência**: Visual uniforme em todo projeto  
✅ **Manutenibilidade**: Mudanças centralizadas  
✅ **Performance**: CSS otimizado  
✅ **Acessibilidade**: Contraste e área de toque adequados  
✅ **Escalabilidade**: Fácil adicionar novos componentes  
✅ **DX**: Developer Experience melhorada

---

## 📚 12. REFERÊNCIAS

- [Ant Design Customization](https://ant.design/docs/react/customize-theme)
- [Material Design Color System](https://material.io/design/color)
- [8-Point Grid System](https://spec.fm/specifics/8-pt-grid)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 💡 13. DICAS RÁPIDAS

**Cores:**

```tsx
// ❌ Evite
color: '#1890ff';

// ✅ Prefira
color: 'var(--color-primary)';
```

**Espaçamento:**

```tsx
// ❌ Evite
padding: '20px';

// ✅ Prefira
padding: 'var(--spacing-5)';
```

**Sombras:**

```tsx
// ❌ Evite
boxShadow: '0 2px 8px rgba(0,0,0,0.15)';

// ✅ Prefira
boxShadow: 'var(--shadow-base)';
```

---

## 🔄 14. MIGRANDO CÓDIGO EXISTENTE

### Antes (Hard-coded)

```tsx
<Card style={{
  padding: '24px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  marginBottom: '16px',
}}>
```

### Depois (Com Design System)

```tsx
<Card style={{
  padding: 'var(--spacing-6)',
  borderRadius: 'var(--border-radius-md)',
  boxShadow: 'var(--shadow-base)',
  marginBottom: 'var(--spacing-4)',
}}>
```

Ou simplesmente:

```tsx
<Card className="u-p-6 u-shadow-base u-radius-md u-mb-4">
```

---

## 📞 SUPORTE

Dúvidas sobre o Design System?

- Consulte esta documentação
- Veja exemplos em `src/modules/item/search/`
- Verifique o código em `design-tokens.css`

---

**Criado em:** 02/11/2025  
**Versão:** 1.0.0  
**Mantido por:** Equipe LOR0138
