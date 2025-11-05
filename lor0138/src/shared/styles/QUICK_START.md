# 🚀 GUIA RÁPIDO - Como Aplicar o Design System

## ✅ PASSO A PASSO (5 minutos)

### 1️⃣ **Atualizar App.tsx**

Abra `src/App.tsx` e adicione os imports:

```tsx
// NO TOPO DO ARQUIVO (linha ~3-5)
import './shared/styles/design-tokens.css';
import './shared/styles/global.css';
import { getTheme } from './shared/styles/theme.config';
```

Depois, atualize o ConfigProvider:

```tsx
// ENCONTRE ESTA LINHA (aproximadamente linha 243):
<ConfigProvider
  locale={ptBR}
  theme={{
    algorithm: theme === 'light' ? defaultAlgorithm : darkAlgorithm,
  }}
>

// SUBSTITUA POR:
<ConfigProvider
  locale={ptBR}
  theme={getTheme(theme)}  // ← Usa configuração customizada
>
```

### 2️⃣ **Reiniciar o Servidor**

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

### 3️⃣ **Ver Resultado**

Abra http://localhost:3000 e veja:

- ✅ Botões mais bonitos
- ✅ Inputs com melhor aparência
- ✅ Cards com sombras suaves
- ✅ Espaçamento mais consistente
- ✅ Transições suaves

---

## 🎨 ANTES x DEPOIS

### ANTES (Sem Design System)

```tsx
<Card
  style={{
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px #00000014',
  }}
>
  <Button
    style={{
      background: '#1890ff',
      borderRadius: '4px',
    }}
  >
    Clique
  </Button>
</Card>
```

### DEPOIS (Com Design System)

```tsx
<Card>
  {' '}
  {/* Já vem estilizado! */}
  <Button type="primary" size="large">
    Clique
  </Button>
</Card>
```

---

## 💡 USAR TOKENS CUSTOMIZADOS

### Em CSS

```css
.meu-componente {
  padding: var(--spacing-4);
  color: var(--color-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-base);
}
```

### Em React (Inline)

```tsx
<div style={{
  padding: 'var(--spacing-6)',
  background: 'var(--color-bg-container)',
  borderRadius: 'var(--border-radius-md)',
}}>
```

### Classes Utilitárias

```tsx
<div className="u-p-6 u-shadow-base u-radius-md">Conteúdo</div>
```

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Aplicar no App.tsx** (FEITO)
2. 🔍 **Testar em Dev** (agora)
3. 📝 **Atualizar componentes** aos poucos
4. 🎨 **Usar tokens** em novos componentes
5. 📚 **Consultar DESIGN_SYSTEM.md** sempre

---

## 📊 O QUE FOI CRIADO

```
src/shared/styles/
├── design-tokens.css     ✅ Variáveis (cores, espaços, etc)
├── theme.config.ts       ✅ Configuração Ant Design
├── global.css            ✅ Estilos globais
├── DESIGN_SYSTEM.md      ✅ Documentação completa
└── QUICK_START.md        ✅ Este guia
```

---

## 🎁 BENEFÍCIOS IMEDIATOS

✨ **Visual**

- Interface mais moderna
- Consistência em todos os módulos
- Hierarquia visual clara

⚡ **Performance**

- CSS otimizado
- Menos código duplicado
- Carregamento mais rápido

♿ **Acessibilidade**

- Contraste WCAG AA
- Área de toque adequada (44px)
- Foco visível para teclado

🔧 **Manutenção**

- Mudanças centralizadas
- Menos bugs visuais
- Código mais limpo

---

## 🆘 TROUBLESHOOTING

### Problema: Estilos não aplicados

**Solução:** Verificar ordem dos imports

```tsx
// design-tokens DEVE vir antes do global
import './shared/styles/design-tokens.css';
import './shared/styles/global.css';
```

### Problema: Ant Design não mudou

**Solução:** Verificar ConfigProvider

```tsx
<ConfigProvider theme={getTheme(theme)}>
```

### Problema: Dark mode com cores erradas

**Solução:** Verificar se ThemeContext está funcionando

```tsx
const { theme } = useTheme(); // deve retornar 'light' ou 'dark'
```

---

## 📞 DÚVIDAS?

- Leia `DESIGN_SYSTEM.md` para documentação completa
- Veja exemplos em `src/modules/item/search/`
- Consulte `design-tokens.css` para ver todos os tokens

---

**Tempo de Aplicação:** 5 minutos  
**Impacto Visual:** ENORME  
**Risco:** Mínimo (CSS adicional, sem quebra)

🚀 **Pronto para aplicar!**
