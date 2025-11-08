# Guia de Migração: Material-UI → shadcn/ui + Tailwind CSS

## 📋 Visão Geral

Este guia detalha a migração do HomeGuardian de Material-UI para shadcn/ui com Tailwind CSS, focando em redução massiva de RAM e bundle size.

---

## 🎯 Objetivos da Migração

- ✅ Reduzir bundle size em ~85% (630KB → ~80KB)
- ✅ Reduzir consumo de RAM em ~85% (50-70MB → 5-10MB)
- ✅ Eliminar runtime CSS-in-JS (Emotion)
- ✅ Melhorar performance de build e hydration
- ✅ Manter qualidade visual enterprise
- ✅ Melhorar acessibilidade (Radix UI)

---

## 📊 Comparação de Componentes: MUI vs shadcn/ui

### 1. Button

**MUI (ANTES):**
```jsx
import { Button, CircularProgress } from '@mui/material'
import { Backup as BackupIcon } from '@mui/icons-material'

<Button
  variant="contained"
  startIcon={backing ? <CircularProgress size={20} /> : <BackupIcon />}
  onClick={handleBackupNow}
  disabled={backing}
>
  {t('dashboard.backupNow')}
</Button>
```

**shadcn/ui (DEPOIS):**
```jsx
import { Button } from '@/components/ui/button'
import { Loader2, Archive } from 'lucide-react'

<Button
  onClick={handleBackupNow}
  disabled={backing}
>
  {backing ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : (
    <Archive className="mr-2 h-4 w-4" />
  )}
  {t('dashboard.backupNow')}
</Button>
```

**Ganhos:**
- Bundle: ~15KB → ~2KB (MUI Button + Icon vs shadcn Button + Lucide)
- Runtime: CSS-in-JS eliminado
- Customização: Total via Tailwind classes

---

### 2. Card

**MUI (ANTES):**
```jsx
import { Card, CardContent, Typography } from '@mui/material'

<Card>
  <CardContent>
    <Typography variant="h6" gutterBottom>
      {t('dashboard.gitStatus')}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Status information
    </Typography>
  </CardContent>
</Card>
```

**shadcn/ui (DEPOIS):**
```jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>{t('dashboard.gitStatus')}</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Status information
    </p>
  </CardContent>
</Card>
```

**Ganhos:**
- Bundle: ~12KB → ~1.5KB
- Estrutura semântica melhor
- Acessibilidade nativa

---

### 3. Alert

**MUI (ANTES):**
```jsx
import { Alert } from '@mui/material'

{error && (
  <Alert severity="error" sx={{ mb: 3 }}>
    {error}
  </Alert>
)}
```

**shadcn/ui (DEPOIS):**
```jsx
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

{error && (
  <Alert variant="destructive" className="mb-6">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

**Ganhos:**
- Bundle: ~8KB → ~1KB
- Icons customizáveis
- Variants consistentes

---

### 4. Grid/Layout

**MUI (ANTES):**
```jsx
import { Grid } from '@mui/material'

<Grid container spacing={3}>
  <Grid item xs={12} md={6}>
    <Card>...</Card>
  </Grid>
  <Grid item xs={12} md={6}>
    <Card>...</Card>
  </Grid>
</Grid>
```

**Tailwind (DEPOIS):**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Card>...</Card>
  <Card>...</Card>
</div>
```

**Ganhos:**
- Bundle: ~20KB → 0KB (CSS utilitário)
- Mais legível e conciso
- Sem componente wrapper desnecessário

---

### 5. Chip/Badge

**MUI (ANTES):**
```jsx
import { Chip } from '@mui/material'

<Chip
  label={status?.watcher?.isRunning ? 'Running' : 'Stopped'}
  color={status?.watcher?.isRunning ? 'success' : 'default'}
  size="small"
/>
```

**shadcn/ui (DEPOIS):**
```jsx
import { Badge } from '@/components/ui/badge'

<Badge variant={status?.watcher?.isRunning ? 'success' : 'secondary'}>
  {status?.watcher?.isRunning ? 'Running' : 'Stopped'}
</Badge>
```

**Ganhos:**
- Bundle: ~6KB → ~0.5KB
- Mais leve e flexível

---

### 6. Loading Spinner

**MUI (ANTES):**
```jsx
import { Box, CircularProgress } from '@mui/material'

<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
  <CircularProgress />
</Box>
```

**shadcn/ui (DEPOIS):**
```jsx
import { Loader2 } from 'lucide-react'

<div className="flex justify-center items-center min-h-[400px]">
  <Loader2 className="h-8 w-8 animate-spin text-primary" />
</div>
```

**Ganhos:**
- Bundle: ~10KB → ~0.8KB
- Animação CSS (sem JS)
- Customização via classes

---

## 🔧 Setup Inicial

### 1. Instalar Dependências

```bash
# Remover MUI e Emotion
npm uninstall @mui/material @mui/icons-material @emotion/react @emotion/styled

# Instalar Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge

# Instalar Lucide Icons
npm install lucide-react

# Radix UI (base para shadcn/ui) - será instalado via CLI shadcn
```

### 2. Configurar Tailwind CSS

**tailwind.config.js:**
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 3. Atualizar PostCSS

**postcss.config.js:**
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 4. Criar arquivo de estilos globais

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 5. Setup shadcn/ui CLI

```bash
# Instalar CLI (opcional, pode copiar componentes manualmente)
npx shadcn-ui@latest init

# Adicionar componentes necessários
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
```

### 6. Utility para merge de classes

**src/lib/utils.ts:**
```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 📁 Estrutura de Componentes

```
src/
├── components/
│   ├── ui/                    # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   ├── dialog.tsx
│   │   └── dropdown-menu.tsx
│   ├── Layout.jsx            # Layout principal
│   └── DiffViewer.jsx        # Componentes customizados
├── pages/
│   ├── Dashboard.jsx
│   ├── History.jsx
│   ├── Items.jsx
│   └── Settings.jsx
├── lib/
│   └── utils.ts              # Utilities
└── index.css                 # Estilos globais Tailwind
```

---

## 🔄 Migração Passo a Passo

### Fase 1: Setup e Testes (Semana 1)

**Dia 1-2: Setup Inicial**
- [ ] Instalar Tailwind CSS e dependências
- [ ] Configurar tailwind.config.js
- [ ] Configurar postcss.config.js
- [ ] Criar src/index.css com design tokens
- [ ] Testar build funcionando

**Dia 3-4: Primeiro Componente**
- [ ] Adicionar componente Button via shadcn CLI
- [ ] Migrar um botão simples do Dashboard
- [ ] Testar funcionalidade
- [ ] Validar bundle size reduction
- [ ] Validar visual

**Dia 5: Validação**
- [ ] Adicionar mais 2-3 componentes (Card, Alert)
- [ ] Migrar seção pequena do Dashboard
- [ ] Medir bundle size
- [ ] Medir RAM usage
- [ ] Decisão: Go/No-Go

---

### Fase 2: Migração Core (Semana 2-3)

**Week 2: Components Base**
- [ ] Migrar todos os componentes shadcn necessários
- [ ] Criar wrapper components customizados se necessário
- [ ] Migrar Layout.jsx
- [ ] Migrar componentes comuns (LoadingFallback, etc)

**Week 3: Pages**
- [ ] Migrar Dashboard.jsx
- [ ] Migrar History.jsx
- [ ] Migrar Items.jsx
- [ ] Migrar Settings.jsx
- [ ] Testar todas as funcionalidades

---

### Fase 3: Icons e Charts (Semana 4)

**Icons:**
- [ ] Mapear todos os ícones MUI usados
- [ ] Encontrar equivalentes em Lucide React
- [ ] Substituir imports
- [ ] Remover @mui/icons-material

**Charts:**
- [ ] Avaliar necessidade de charts
- [ ] Se necessário, instalar uPlot ou Chart.js
- [ ] Migrar visualizações

---

### Fase 4: Dark Mode e Temas (Semana 5)

- [ ] Implementar provider de tema
- [ ] Configurar dark mode toggle
- [ ] Testar todas as páginas em dark mode
- [ ] Ajustar cores e contrastes

---

### Fase 5: Cleanup e Otimização (Semana 6)

- [ ] Remover MUI completamente
- [ ] Remover Emotion
- [ ] Limpar imports não usados
- [ ] Otimizar bundle (analyze)
- [ ] Testes finais de performance
- [ ] Testes de RAM consumption
- [ ] Documentação

---

## 🧪 Como Testar Performance

### Bundle Size Analysis

```bash
# Build production
npm run build

# Analyze bundle (adicionar ao package.json)
npm install -D rollup-plugin-visualizer

# vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
})
```

### RAM Usage

```bash
# Build e servir
npm run build
npm run preview

# Em outro terminal, monitorar RAM do container
docker stats homeguardian

# Ou via Node.js
node --expose-gc server.js
# Adicionar ao código:
if (global.gc) {
  global.gc()
}
console.log(process.memoryUsage())
```

---

## 🎨 Customização de Tema

### Adaptar cores do HomeGuardian

**tailwind.config.js:**
```js
theme: {
  extend: {
    colors: {
      // Manter cores do branding
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        500: '#0ea5e9',  // Cor principal HomeGuardian
        600: '#0284c7',
        700: '#0369a1',
      },
      success: {
        DEFAULT: '#22c55e',
        foreground: '#ffffff',
      },
      warning: {
        DEFAULT: '#f59e0b',
        foreground: '#ffffff',
      },
      danger: {
        DEFAULT: '#ef4444',
        foreground: '#ffffff',
      },
    },
  },
}
```

---

## 📊 Mapeamento Completo de Componentes

| MUI Component | shadcn/ui Alternative | Notes |
|---------------|----------------------|-------|
| Button | Button | Variants diferentes |
| IconButton | Button variant="ghost" size="icon" | Wrapper personalizado |
| Card, CardContent | Card, CardHeader, CardContent | Estrutura similar |
| Typography | Tailwind classes | h1, h2, p com classes |
| Box | div com classes | Substituir sx por className |
| Grid | Tailwind Grid | grid, grid-cols-* |
| Container | Tailwind container | max-w-* classes |
| Chip | Badge | Similar |
| Alert | Alert | Variants diferentes |
| CircularProgress | Lucide Loader2 | animate-spin |
| TextField | Input + Label | Separados |
| Select | Select | Radix-based |
| Switch | Switch | Radix-based |
| Dialog | Dialog | Radix-based |
| Menu | DropdownMenu | Radix-based |
| Tabs | Tabs | Radix-based |
| Tooltip | Tooltip | Radix-based |

---

## ⚠️ Problemas Comuns e Soluções

### 1. Classes Tailwind não funcionam

**Problema:** Classes dinâmicas não aplicam estilos.
```jsx
// ❌ NÃO FUNCIONA
const color = 'blue'
<div className={`text-${color}-500`}>

// ✅ FUNCIONA
<div className={color === 'blue' ? 'text-blue-500' : 'text-gray-500'}>
```

### 2. Dark mode não aplica

**Problema:** Dark mode não muda cores.
**Solução:** Verificar provider de tema e classe "dark" no html.

### 3. Ícones não aparecem

**Problema:** Ícones Lucide não renderizam.
**Solução:** Importação correta.
```jsx
// ✅ Correto
import { Archive, Loader2 } from 'lucide-react'
<Archive className="h-4 w-4" />
```

### 4. Componentes não responsivos

**Problema:** Layout quebra em mobile.
**Solução:** Usar breakpoints Tailwind.
```jsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## 📈 Métricas Esperadas

### Antes (MUI)
```
Bundle Size (total): ~850KB uncompressed, ~250KB gzipped
Main chunk: ~400KB
Vendor chunks: ~450KB
RAM Usage (SSR): ~60-80MB
First Load JS: ~280KB
```

### Depois (shadcn/ui)
```
Bundle Size (total): ~150KB uncompressed, ~50KB gzipped
Main chunk: ~80KB
Vendor chunks: ~70KB
RAM Usage (SSR): ~8-12MB
First Load JS: ~55KB

Redução: ~80-85% em todos os aspectos
```

---

## ✅ Checklist Final

- [ ] Todas as páginas migradas
- [ ] Todos os componentes funcionando
- [ ] Dark mode implementado
- [ ] Responsividade testada (mobile, tablet, desktop)
- [ ] Acessibilidade validada (WCAG AA)
- [ ] Bundle size < 100KB gzipped
- [ ] RAM usage < 15MB (frontend overhead)
- [ ] MUI removido do package.json
- [ ] Emotion removido do package.json
- [ ] Build production funciona
- [ ] Testes passando
- [ ] Documentação atualizada

---

## 🚀 Deploy

Após migração completa:

```bash
# Rebuild Docker image
docker-compose build

# Restart container
docker-compose up -d

# Verificar logs
docker-compose logs -f homeguardian

# Monitorar RAM
docker stats homeguardian
```

---

**Próximo:** Ver `UI_LIBRARIES_COMPARISON.md` para comparações detalhadas de todas as opções.
