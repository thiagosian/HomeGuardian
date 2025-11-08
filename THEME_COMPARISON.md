# HomeGuardian - Comparação Visual dos 4 Temas

## Visão Geral

Este documento detalha as diferenças visuais entre os 4 temas do HomeGuardian:

1. **Classic Light** - Original HomeGuardian (Cyan/Orange)
2. **Classic Dark** - Classic em modo escuro
3. **New Light** - Tema moderno claro
4. **New Dark** - Tema moderno escuro (padrão atual)

---

## 1. Paleta de Cores

### Classic Light
```css
/* Identidade Visual: Cyan + Orange (GitHub-inspired) */
Primary:    #03a9f4  /* Cyan vibrante */
Secondary:  #ff9800  /* Orange */
Background: #fafafa  /* Off-white */
Text:       #24292e  /* Quase preto */
Success:    #28a745  /* GitHub green */
Error:      #dc3545  /* GitHub red */
```

**Características:**
- Paleta limpa e profissional
- Alto contraste para legibilidade
- Cores inspiradas no GitHub
- Adequado para uso diurno

### Classic Dark
```css
/* Mesmas cores, adaptadas para dark mode */
Primary:    #33b5ff  /* Cyan mais claro */
Secondary:  #ffad33  /* Orange mais claro */
Background: #181b1f  /* GitHub dark */
Text:       #fafafa  /* Quase branco */
Success:    #52c776  /* Verde mais claro */
Error:      #e66b6b  /* Vermelho mais claro */
```

**Características:**
- Mantém identidade do Classic Light
- Cores ajustadas para evitar eye strain
- Background GitHub dark
- Ideal para uso noturno

### New Light
```css
/* Moderno, clean, minimalista */
Primary:    #8b5cf6  /* Purple vibrante */
Secondary:  #f1f5f9  /* Cinza claro */
Background: #ffffff  /* Branco puro */
Text:       #09090b  /* Preto profundo */
Success:    #16a34a  /* Verde moderno */
Error:      #f43f5e  /* Rose */
Info:       #3b82f6  /* Blue */
```

**Características:**
- Paleta moderna e sofisticada
- Purple como cor principal (trend 2024-2025)
- Branco puro para fundo
- Inspirado em Linear e Vercel

### New Dark
```css
/* Neon accents, dev tools style */
Primary:    #8b5cf6  /* Purple */
Secondary:  #27272a  /* Cinza escuro */
Background: #0a0a0a  /* Preto profundo */
Text:       #fafafa  /* Branco */
Success:    #22c55e  /* Neon green */
Warning:    #f97316  /* Neon orange */
Error:      #f43f5e  /* Neon red */
Info:       #06b6d4  /* Neon cyan */
```

**Características:**
- Neon accents para status
- Background quase preto
- Alto contraste
- Glow effects em elementos ativos
- Inspirado em Railway e Linear Dark

---

## 2. Typography

### Classic Themes

```css
Font Family: System fonts stack
  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, etc.

Font Sizes (Classic):
  xs:   12px
  sm:   14px
  base: 16px
  lg:   18px
  xl:   20px
  2xl:  24px
  3xl:  30px
  4xl:  36px

Font Weights:
  normal:    400
  medium:    500
  semibold:  600
  bold:      700

Line Height: 1.5 (normal)
```

**Filosofia:** Conservador, profissional, legível

### New Themes

```css
Font Family: Inter (preferred) + System fonts fallback
  "Inter", -apple-system, BlinkMacSystemFont, etc.

Font Sizes (New - MAIOR contraste):
  xs:   12px
  sm:   14px
  base: 16px
  lg:   18px
  xl:   22px  ← +2px vs Classic
  2xl:  28px  ← +4px
  3xl:  36px  ← +6px
  4xl:  48px  ← +12px

Font Weights: Same as Classic

Line Height: 1.2 (tight) para headings
Letter Spacing: -0.02em (tight) para títulos
```

**Filosofia:** Bold, moderno, hierarquia visual forte

**Comparação visual:**
```
Classic H1:  36px, 1.5 line-height
New H1:      48px, 1.2 line-height, -0.02em tracking
             ↑ 33% maior, mais impactante
```

---

## 3. Border Radius

### Classic: Mais Quadrado

```css
sm:   4px   /* Botões pequenos */
md:   6px   /* Cards, inputs (padrão) */
lg:   8px   /* Cards maiores */
xl:   12px  /* Elementos especiais */
```

**Estilo:** Profissional, corporativo, clean

### New: Mais Arredondado

```css
sm:   6px   ← +2px vs Classic
md:   8px   ← +2px (padrão)
lg:   12px  ← +4px
xl:   16px  ← +4px
2xl:  24px  ← Novo (elementos hero)
```

**Estilo:** Moderno, friendly, suave

**Exemplo visual:**
```
Classic Button:  border-radius: 6px
New Button:      border-radius: 8px

Classic Card:    border-radius: 6px
New Card:        border-radius: 12px
```

---

## 4. Shadows

### Classic Light

```css
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
```

**Características:**
- Sombras sutis
- Pouco contraste
- Profundidade discreta

### Classic Dark

```css
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3)
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4)
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5)
```

**Características:**
- Sombras mais pronunciadas
- Necessário para contraste em fundo escuro

### New Light

```css
shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1)
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1),
           0 2px 4px -2px rgb(0 0 0 / 0.1)
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1),
           0 4px 6px -4px rgb(0 0 0 / 0.1)
```

**Características:**
- Múltiplas camadas de sombra
- Mais realista e sofisticado
- Inspirado em Material Design 3

### New Dark

```css
shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.8)
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.8),
           0 2px 4px -2px rgb(0 0 0 / 0.8)
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.8),
           0 4px 6px -4px rgb(0 0 0 / 0.8)

/* EXCLUSIVO: Glow effects */
glow-primary: 0 0 20px rgba(139, 92, 246, 0.3)
glow-success: 0 0 20px rgba(34, 197, 94, 0.3)
glow-error:   0 0 20px rgba(244, 63, 94, 0.3)
```

**Características:**
- Sombras muito escuras (0.8 opacity)
- **Glow effects** exclusivos para neon accent
- Elementos ativos "brilham"

---

## 5. Spacing

### Classic: Espaçamento Padrão

```css
xs:   4px
sm:   8px
md:   16px  ← Base
lg:   24px
xl:   32px
2xl:  48px
```

**Filosofia:** Compacto, eficiente, tradicional

### New: Espaçamento Generoso

```css
xs:   8px   ← +4px (100% maior!)
sm:   12px  ← +4px (50% maior)
md:   20px  ← +4px (25% maior)
lg:   32px  ← +8px (33% maior)
xl:   40px  ← +8px (25% maior)
2xl:  64px  ← +16px (33% maior)
```

**Filosofia:** Respirável, moderno, confortável

**Impacto visual:**
```
Classic padding: 16px
New padding:     20px
                 ↑ 25% mais espaço para respirar
```

---

## 6. Diff Colors (para Git Diff Viewer)

### Classic Light (GitHub style)

```css
Added:    #e6ffed (bg) + #28a745 (text)
Removed:  #ffeef0 (bg) + #dc3545 (text)
Modified: #fff5b1 (bg) + #b88300 (text)
Context:  #f6f8fa (bg) + #24292e (text)
```

**Estilo:** Familiar, GitHub-like, profissional

### Classic Dark

```css
Added:    hsl(134 40% 20%) + hsl(134 50% 65%)
Removed:  hsl(354 40% 20%) + hsl(354 70% 70%)
Modified: hsl(45 40% 20%) + hsl(45 100% 70%)
Context:  hsl(220 13% 15%) + hsl(0 0% 80%)
```

**Estilo:** Escuro mas legível, alto contraste

### New Light

```css
Added:    hsl(142 76% 95%) + hsl(142 76% 36%)
Removed:  hsl(0 84% 95%) + hsl(0 84% 60%)
Modified: hsl(45 93% 95%) + hsl(45 93% 47%)
Context:  hsl(240 5% 96%) + hsl(240 10% 3.9%)
```

**Estilo:** Moderno, vibrante, clean

### New Dark (Neon style)

```css
Added:    hsl(142 50% 20%) + hsl(142 76% 60%)  ← Neon green
Removed:  hsl(0 50% 20%) + hsl(0 84% 70%)      ← Neon red
Modified: hsl(45 50% 20%) + hsl(45 93% 60%)    ← Neon yellow
Context:  hsl(240 4% 12%) + hsl(240 5% 70%)
```

**Estilo:** Neon accents, high tech, dev tools

---

## 7. Componentes Especiais

### Status Badges

**Classic Light:**
```jsx
<Badge variant="success">
  background: rgba(40, 167, 69, 0.1)
  color: #28a745
  border-radius: 6px
</Badge>
```

**New Dark:**
```jsx
<Badge variant="success" className="glow-success">
  background: rgba(34, 197, 94, 0.1)
  color: #22c55e
  border-radius: 8px
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3) ← GLOW!
</Badge>
```

### Cards

**Classic:**
```jsx
<Card>
  background: #ffffff (light) / #1f2428 (dark)
  border: 1px solid #d1d5da / #353b44
  border-radius: 6px
  shadow: subtle
  padding: 16px
</Card>
```

**New:**
```jsx
<Card>
  background: #ffffff (light) / #121212 (dark)
  border: 1px solid #e5e7eb / rgba(255,255,255,0.08)
  border-radius: 12px ← Mais arredondado
  shadow: layered (multiple shadows)
  padding: 20px ← Mais espaçoso
</Card>
```

### Buttons

**Classic:**
```jsx
<Button variant="primary">
  background: #03a9f4 (light) / #33b5ff (dark)
  color: white
  border-radius: 6px
  padding: 8px 16px
  font-weight: 500
  text-transform: none
</Button>
```

**New:**
```jsx
<Button variant="primary">
  background: #8b5cf6
  color: white
  border-radius: 8px ← Mais arredondado
  padding: 10px 20px ← Mais espaçoso
  font-weight: 600 ← Mais bold
  text-transform: none
  transition: all 200ms ease

  &:hover {
    transform: translateY(-1px)
    box-shadow: 0 4px 12px rgba(139,92,246,0.3)
  }
</Button>
```

---

## 8. Scrollbar Customização

Apenas **Dark themes** têm scrollbar customizada:

```css
width: 8px
track: background color
thumb: muted color
thumb:hover: muted-foreground color
border-radius: 4px
```

**Light themes** usam scrollbar nativa do sistema.

---

## 9. Transições e Animações

Todos os temas compartilham:

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1)
```

**Animações disponíveis:**
- `pulse` - Para loading states
- `spin` - Para spinners
- `fadeIn` - Para modais
- `slideInFromRight` - Para sidebars
- `slideInFromLeft` - Para drawers

---

## 10. Quando Usar Cada Tema

### Classic Light
✅ **Use quando:**
- Ambiente corporativo tradicional
- Preferência por design conservador
- Familiaridade com GitHub
- Uso diurno em ambiente bem iluminado

❌ **Evite quando:**
- Deseja visual moderno/inovador
- Uso noturno prolongado

### Classic Dark
✅ **Use quando:**
- Gosta do Classic mas precisa de dark mode
- Trabalho noturno
- Preferência por cores Classic (cyan/orange)

❌ **Evite quando:**
- Deseja neon accents
- Prefere visual ultra-moderno

### New Light
✅ **Use quando:**
- Deseja visual moderno e clean
- Aprecia design minimalista
- Trabalho em ambiente bem iluminado
- Prefere cores neutras com purple accent

❌ **Evite quando:**
- Prefere cores vibrantes (cyan/orange)
- Gosta de design tradicional

### New Dark (PADRÃO)
✅ **Use quando:**
- Deseja visual ultra-moderno
- Aprecia neon accents
- Trabalho noturno
- Gosta de dev tools modernos (VS Code, Railway, Linear)
- Quer glow effects em elementos ativos

❌ **Evite quando:**
- Prefere design conservador
- Neon colors são muito intensos
- Ambiente corporativo tradicional

---

## 11. Tabela Comparativa Resumida

| Característica | Classic Light | Classic Dark | New Light | New Dark |
|----------------|--------------|--------------|-----------|----------|
| **Cor Principal** | Cyan #03a9f4 | Cyan #33b5ff | Purple #8b5cf6 | Purple #8b5cf6 |
| **Background** | #fafafa | #181b1f | #ffffff | #0a0a0a |
| **Border Radius** | 6px | 6px | 8-12px | 8-12px |
| **Font Family** | System fonts | System fonts | Inter + fallback | Inter + fallback |
| **Font Size (H1)** | 36px | 36px | 48px | 48px |
| **Spacing (md)** | 16px | 16px | 20px | 20px |
| **Shadows** | Sutis | Médias | Layered | Dark + Glow |
| **Diff Style** | GitHub | GitHub dark | Modern | Neon |
| **Glow Effects** | ❌ | ❌ | ❌ | ✅ |
| **Scrollbar Custom** | ❌ | ✅ | ❌ | ✅ |
| **Target Audience** | Conservative | Conservative Night | Modern | Dev Tools |

---

## 12. Como Alternar Entre Temas

O ThemeContext gerencia os temas via `data-theme` attribute:

```jsx
import { useTheme } from '@/contexts/ThemeContext'

function ThemeSelector() {
  const { currentTheme, setTheme } = useTheme()

  return (
    <select value={currentTheme} onChange={(e) => setTheme(e.target.value)}>
      <option value="classic">Classic Light</option>
      <option value="classic-dark">Classic Dark</option>
      <option value="new-light">New Light</option>
      <option value="new-dark">New Dark</option>
    </select>
  )
}
```

O tema é persistido em `localStorage` como `homeguardian-theme-preference`.

---

## 13. Exemplo de Uso das Variáveis CSS

```jsx
// Em qualquer componente:

<div style={{
  backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-md)',
  boxShadow: 'var(--shadow-md)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
}}>
  <h1 style={{
    fontSize: 'var(--text-4xl)',
    fontWeight: 'var(--font-bold)',
    lineHeight: 'var(--leading-tight)',
    letterSpacing: 'var(--tracking-tight)',
  }}>
    HomeGuardian
  </h1>

  <p className="text-muted-foreground">
    Git backup system for Home Assistant
  </p>

  <button className="bg-primary text-primary-foreground rounded-modern">
    Backup Now
  </button>
</div>
```

---

## 14. Referências Visuais

### Classic Themes inspirados em:
- GitHub (colors, layout, diff viewer)
- GitLab (professional, clean)
- Bitbucket (conservative)

### New Themes inspirados em:
- Linear (bold typography, purple accent, spacing)
- Vercel (clean, modern, minimalist)
- Railway (dark mode, neon accents, glow)
- shadcn/ui (design system structure)

---

**Criado:** 2025-11-08
**Versão:** 1.0.0
**Autor:** Claude Code Assistant
