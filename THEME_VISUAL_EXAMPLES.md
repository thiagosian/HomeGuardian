# HomeGuardian - Exemplos Visuais dos Temas

## 🎨 Como cada tema renderiza os mesmos componentes

Este documento mostra como os mesmos componentes aparecem em cada tema.

---

## 1. Card Simples

### Código (funciona em todos os temas)
```jsx
<div className="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-md">
  <h2 className="text-xl font-semibold mb-2">Git Status</h2>
  <p className="text-muted-foreground">No uncommitted changes</p>
  <div className="mt-4">
    <span className="text-success">✓ Clean</span>
  </div>
</div>
```

### Renderização Visual

#### Classic Light
```
┌─────────────────────────────────────┐
│ Git Status                          │ ← #24292e (dark gray)
│ No uncommitted changes              │ ← #6a737d (muted)
│                                     │
│ ✓ Clean                             │ ← #28a745 (green)
└─────────────────────────────────────┘
Background: #ffffff
Border: #d1d5da (light gray)
Border Radius: 6px (quadrado)
Shadow: Sutil
```

#### Classic Dark
```
┌─────────────────────────────────────┐
│ Git Status                          │ ← #fafafa (off-white)
│ No uncommitted changes              │ ← #a5a5a5 (gray)
│                                     │
│ ✓ Clean                             │ ← #52c776 (green claro)
└─────────────────────────────────────┘
Background: #1f2428 (dark gray)
Border: #353b44 (darker gray)
Border Radius: 6px (quadrado)
Shadow: Média
```

#### New Light
```
┌──────────────────────────────────────┐
│ Git Status                           │ ← #09090b (quase preto)
│ No uncommitted changes               │ ← #71717a (gray)
│                                      │
│ ✓ Clean                              │ ← #16a34a (green)
└──────────────────────────────────────┘
Background: #ffffff
Border: #e5e7eb (light gray)
Border Radius: 12px (arredondado)
Shadow: Layered (múltiplas camadas)
Padding: 20px (mais espaçoso)
```

#### New Dark
```
┌──────────────────────────────────────┐
│ Git Status                           │ ← #fafafa (branco)
│ No uncommitted changes               │ ← #a1a1aa (gray)
│                                      │
│ ✓ Clean                              │ ← #22c55e (neon green)
└──────────────────────────────────────┘
Background: #121212 (quase preto)
Border: rgba(255,255,255,0.08) (muito sutil)
Border Radius: 12px (arredondado)
Shadow: Dark + Glow effect ✨
Padding: 20px (mais espaçoso)
```

---

## 2. Botões

### Código
```jsx
<div className="flex gap-2">
  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium">
    Primary
  </button>
  <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-medium">
    Delete
  </button>
</div>
```

### Renderização

#### Classic Light
```
┌─────────┐  ┌─────────┐
│ Primary │  │ Delete  │
└─────────┘  └─────────┘
  #03a9f4      #ff0000
  (Cyan)       (Red)
White text   White text
6px radius   6px radius
```

#### Classic Dark
```
┌─────────┐  ┌─────────┐
│ Primary │  │ Delete  │
└─────────┘  └─────────┘
  #33b5ff      #e55e5e
  (Cyan+)      (Red+)
Dark text    White text
6px radius   6px radius
```

#### New Light
```
┌──────────┐  ┌──────────┐
│ Primary  │  │ Delete   │
└──────────┘  └──────────┘
  #8b5cf6       #f43f5e
  (Purple)      (Rose)
White text    White text
8px radius    8px radius
Mais padding
```

#### New Dark
```
┌──────────┐  ┌──────────┐
│ Primary  │  │ Delete   │
└──────────┘  └──────────┘
  #8b5cf6       #f43f5e
  (Purple)      (Rose)
White text    White text
8px radius    8px radius
Glow on hover ✨
```

---

## 3. Status Badges

### Código
```jsx
<div className="flex gap-2">
  <span className="bg-[hsl(var(--success)_/_0.1)] text-success px-2 py-1 rounded text-xs font-semibold">
    Success
  </span>
  <span className="bg-[hsl(var(--warning)_/_0.1)] text-warning px-2 py-1 rounded text-xs font-semibold">
    Warning
  </span>
  <span className="bg-[hsl(var(--error)_/_0.1)] text-error px-2 py-1 rounded text-xs font-semibold">
    Error
  </span>
</div>
```

### Renderização

#### Classic Light
```
┌─────────┐ ┌─────────┐ ┌───────┐
│ Success │ │ Warning │ │ Error │
└─────────┘ └─────────┘ └───────┘
  #28a745     #ff9800     #dc3545
 (GitHub     (Orange)    (GitHub
  Green)                   Red)
Background: rgba(color, 0.1)
```

#### Classic Dark
```
┌─────────┐ ┌─────────┐ ┌───────┐
│ Success │ │ Warning │ │ Error │
└─────────┘ └─────────┘ └───────┘
  #52c776     #ffad33     #e66b6b
  (Green+)    (Orange+)   (Red+)
Background: rgba(color, 0.1)
Cores mais claras para contraste
```

#### New Light
```
┌─────────┐ ┌─────────┐ ┌───────┐
│ Success │ │ Warning │ │ Error │
└─────────┘ └─────────┘ └───────┘
  #16a34a     #ea580c     #f43f5e
  (Green)     (Orange)    (Rose)
Background: rgba(color, 0.1)
Cores vibrantes
```

#### New Dark
```
┌─────────┐ ┌─────────┐ ┌───────┐
│ Success │ │ Warning │ │ Error │
└─────────┘ └─────────┘ └───────┘
  #22c55e     #f97316     #f43f5e
  (Neon       (Neon       (Neon
   Green)      Orange)     Red)
Background: rgba(color, 0.1)
Glow effect ✨
```

---

## 4. Git Diff Viewer

### Código
```jsx
<div className="font-mono text-sm">
  <div className="diff-added px-3 py-1">
    + const newFeature = true
  </div>
  <div className="diff-removed px-3 py-1">
    - const oldFeature = false
  </div>
  <div className="diff-context px-3 py-1">
    const unchanged = 'same'
  </div>
</div>
```

### Renderização

#### Classic Light (GitHub style)
```
┌──────────────────────────────────────┐
│ + const newFeature = true            │ ← #e6ffed bg, #28a745 text
│ - const oldFeature = false           │ ← #ffeef0 bg, #dc3545 text
│   const unchanged = 'same'           │ ← #f6f8fa bg, #24292e text
└──────────────────────────────────────┘
Estilo: Idêntico ao GitHub
```

#### Classic Dark
```
┌──────────────────────────────────────┐
│ + const newFeature = true            │ ← Dark green bg, light green text
│ - const oldFeature = false           │ ← Dark red bg, light red text
│   const unchanged = 'same'           │ ← Dark gray bg, light gray text
└──────────────────────────────────────┘
Estilo: GitHub dark mode
```

#### New Light
```
┌──────────────────────────────────────┐
│ + const newFeature = true            │ ← Light green bg, vibrant green text
│ - const oldFeature = false           │ ← Light red bg, vibrant red text
│   const unchanged = 'same'           │ ← Very light gray bg, dark text
└──────────────────────────────────────┘
Estilo: Moderno, cores vibrantes
```

#### New Dark (Neon style)
```
┌──────────────────────────────────────┐
│ + const newFeature = true            │ ← Dark green bg, NEON green text ✨
│ - const oldFeature = false           │ ← Dark red bg, NEON red text ✨
│   const unchanged = 'same'           │ ← Very dark bg, gray text
└──────────────────────────────────────┘
Estilo: Dev tools, high tech
```

---

## 5. Form Inputs

### Código
```jsx
<div className="space-y-2">
  <label className="text-sm font-medium text-foreground">
    Repository Path
  </label>
  <input
    className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:ring-2 focus:ring-[hsl(var(--ring))]"
    placeholder="/config"
  />
</div>
```

### Renderização

#### Classic Light
```
Repository Path
┌────────────────────────────┐
│ /config                    │
└────────────────────────────┘
Background: #fafafa
Border: #d1d5da
Focus ring: #03a9f4 (cyan)
Radius: 6px
```

#### Classic Dark
```
Repository Path
┌────────────────────────────┐
│ /config                    │
└────────────────────────────┘
Background: #181b1f
Border: #353b44
Focus ring: #33b5ff (cyan)
Radius: 6px
Text: #fafafa
```

#### New Light
```
Repository Path
┌─────────────────────────────┐
│ /config                     │
└─────────────────────────────┘
Background: #ffffff
Border: #e5e7eb
Focus ring: #8b5cf6 (purple)
Radius: 8px
Mais padding
```

#### New Dark
```
Repository Path
┌─────────────────────────────┐
│ /config                     │
└─────────────────────────────┘
Background: #0a0a0a
Border: rgba(255,255,255,0.08)
Focus ring: #8b5cf6 (purple) ✨
Radius: 8px
Text: #fafafa
```

---

## 6. Typography Hierarchy

### Código
```jsx
<div>
  <h1 className="text-[var(--text-4xl)] font-bold mb-2">
    Heading 1
  </h1>
  <h2 className="text-[var(--text-2xl)] font-semibold mb-2">
    Heading 2
  </h2>
  <p className="text-[var(--text-base)] text-muted-foreground">
    Body text with some explanation
  </p>
</div>
```

### Renderização

#### Classic
```
Heading 1        ← 36px, bold, #24292e (light) / #fafafa (dark)

Heading 2        ← 24px, semibold

Body text with some explanation  ← 16px, #6a737d (muted)

Font: System fonts
Line height: 1.5 (normal)
```

#### New
```
Heading 1        ← 48px (+33%!), bold, tight line-height

Heading 2        ← 28px (+17%), semibold

Body text with some explanation  ← 16px, muted

Font: Inter (preferred)
Line height: 1.2 (tight) para headings
Letter spacing: -0.02em (tight)
Muito mais impactante visualmente
```

---

## 7. Dashboard Stat Card

### Código
```jsx
<div className="bg-card p-6 rounded-lg border border-border shadow-md">
  <p className="text-sm text-muted-foreground uppercase mb-2">
    Commits Today
  </p>
  <p className="text-[var(--text-3xl)] font-bold text-foreground">
    12
  </p>
  <p className="text-sm text-success mt-1">
    ↑ 20% from yesterday
  </p>
</div>
```

### Renderização

#### Classic Light
```
┌───────────────────────┐
│ COMMITS TODAY         │ ← 12px uppercase, #6a737d
│                       │
│ 12                    │ ← 30px bold, #24292e
│                       │
│ ↑ 20% from yesterday  │ ← 14px, #28a745 (green)
└───────────────────────┘
Background: #ffffff
Border: #d1d5da
Radius: 6px
Padding: 24px
```

#### Classic Dark
```
┌───────────────────────┐
│ COMMITS TODAY         │ ← 12px uppercase, #a5a5a5
│                       │
│ 12                    │ ← 30px bold, #fafafa
│                       │
│ ↑ 20% from yesterday  │ ← 14px, #52c776 (green)
└───────────────────────┘
Background: #1f2428
Border: #353b44
Radius: 6px
Padding: 24px
```

#### New Light
```
┌────────────────────────┐
│ COMMITS TODAY          │ ← 12px uppercase, #71717a
│                        │
│ 12                     │ ← 36px (+20%!) bold, #09090b
│                        │
│ ↑ 20% from yesterday   │ ← 14px, #16a34a (green)
└────────────────────────┘
Background: #ffffff
Border: #e5e7eb
Radius: 12px (+100%)
Padding: 30px (+25%)
Shadow: Layered
```

#### New Dark
```
┌────────────────────────┐
│ COMMITS TODAY          │ ← 12px uppercase, #a1a1aa
│                        │
│ 12                     │ ← 36px bold, #fafafa
│                        │
│ ↑ 20% from yesterday   │ ← 14px, #22c55e (neon green) ✨
└────────────────────────┘
Background: #121212
Border: rgba(255,255,255,0.08)
Radius: 12px
Padding: 30px
Shadow: Dark + subtle glow
```

---

## 8. Modal/Dialog

### Código
```jsx
<div className="bg-card border border-border rounded-lg shadow-lg max-w-md">
  <div className="p-6 border-b border-border">
    <h2 className="text-xl font-semibold">Confirm Delete</h2>
  </div>
  <div className="p-6">
    <p className="text-muted-foreground">
      Are you sure you want to delete this backup?
    </p>
  </div>
  <div className="p-6 border-t border-border flex gap-2 justify-end">
    <button className="px-4 py-2 border border-border rounded-md">
      Cancel
    </button>
    <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md">
      Delete
    </button>
  </div>
</div>
```

### Renderização

#### Classic Light
```
┌─────────────────────────────────┐
│ Confirm Delete                  │
├─────────────────────────────────┤
│                                 │
│ Are you sure you want to delete │
│ this backup?                    │
│                                 │
├─────────────────────────────────┤
│              ┌────────┐ ┌──────┐│
│              │ Cancel │ │Delete││
│              └────────┘ └──────┘│
└─────────────────────────────────┘
Background: #ffffff
Delete button: #ff0000
Radius: 6px
```

#### New Dark
```
┌──────────────────────────────────┐
│ Confirm Delete                   │
├──────────────────────────────────┤
│                                  │
│ Are you sure you want to delete  │
│ this backup?                     │
│                                  │
├──────────────────────────────────┤
│               ┌────────┐ ┌──────┐│
│               │ Cancel │ │Delete││
│               └────────┘ └──────┘│
└──────────────────────────────────┘
Background: #121212
Delete button: #f43f5e (neon red) ✨
Radius: 12px (+100%)
Backdrop blur
Shadow: Dark + glow
```

---

## 9. Status Indicator com Glow (New Dark exclusive)

### Código
```jsx
<div className="glow-success bg-[hsl(var(--success)_/_0.1)] p-4 rounded-lg flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-success" />
  <span className="text-success font-medium">
    All systems operational
  </span>
</div>
```

### Classic Light/Dark e New Light
```
┌──────────────────────────────────┐
│ ● All systems operational        │
└──────────────────────────────────┘
Background: rgba(success, 0.1)
Text: success color
Sem glow
```

### New Dark (EXCLUSIVO)
```
┌──────────────────────────────────┐
│ ● All systems operational        │ ✨
└──────────────────────────────────┘
Background: rgba(#22c55e, 0.1)
Text: #22c55e (neon green)
Glow: 0 0 20px rgba(34, 197, 94, 0.3)
Efeito "brilhante" ao redor do componente!
```

---

## 10. Scrollbar (Dark themes only)

### Light Themes
```
Scrollbar nativa do sistema operacional
Não customizada
```

### Classic Dark
```
│                                    │
│                                    │
│ Conteúdo                           ┃ ← 8px width
│                                    ┃    #2f3439 (muted)
│                                    ┃    Hover: #a5a5a5
│                                    │
│                                    │
```

### New Dark
```
│                                    │
│                                    │
│ Conteúdo                           ┃ ← 8px width
│                                    ┃    rgba(255,255,255,0.08)
│                                    ┃    Hover: rgba(255,255,255,0.15)
│                                    │    Muito sutil e moderno
│                                    │
```

---

## 11. Spacing Comparison

### Mesmo componente, espaçamento diferente

#### Classic
```jsx
<div className="p-[var(--spacing-md)] space-y-[var(--spacing-sm)]">
  ...
</div>
```
```
┌─────────────────┐
│ ●               │ ← 16px padding
│ Title           │
│                 │ ← 8px gap
│ ●               │
│ Subtitle        │
│                 │
└─────────────────┘
Compacto, eficiente
```

#### New
```jsx
<div className="p-[var(--spacing-md)] space-y-[var(--spacing-sm)]">
  ...
</div>
```
```
┌──────────────────┐
│  ●               │ ← 20px padding (+25%)
│  Title           │
│                  │ ← 12px gap (+50%)
│  ●               │
│  Subtitle        │
│                  │
└──────────────────┘
Respirável, confortável
```

---

## 📊 Tabela Visual Comparativa

| Elemento | Classic Light | Classic Dark | New Light | New Dark |
|----------|--------------|--------------|-----------|----------|
| **Card BG** | #ffffff | #1f2428 | #ffffff | #121212 |
| **Card Border** | #d1d5da | #353b44 | #e5e7eb | rgba(255,255,255,0.08) |
| **Card Radius** | 6px | 6px | 12px | 12px |
| **Card Padding** | 24px | 24px | 30px | 30px |
| **Text Color** | #24292e | #fafafa | #09090b | #fafafa |
| **Muted Text** | #6a737d | #a5a5a5 | #71717a | #a1a1aa |
| **Primary** | #03a9f4 | #33b5ff | #8b5cf6 | #8b5cf6 |
| **Success** | #28a745 | #52c776 | #16a34a | #22c55e |
| **H1 Size** | 36px | 36px | 48px | 48px |
| **Button Radius** | 6px | 6px | 8px | 8px |
| **Glow Effect** | ❌ | ❌ | ❌ | ✅ |
| **Shadow** | Sutil | Média | Layered | Dark+Glow |
| **Font** | System | System | Inter | Inter |

---

## 🎯 Dicas Visuais

### Para design conservador
👉 Use **Classic Light** ou **Classic Dark**
- Cores familiares (cyan/orange)
- Espaçamento compacto
- Cantos mais quadrados
- Profissional e tradicional

### Para design moderno
👉 Use **New Light** ou **New Dark**
- Purple como primary
- Espaçamento generoso (+25%)
- Cantos arredondados (+100%)
- Typography com mais impacto (+33% em títulos)

### Para dev tools/high tech
👉 Use **New Dark**
- Neon accents
- Glow effects exclusivos ✨
- Background quase preto
- Scrollbar customizada

---

**Nota:** Todos os exemplos acima usam as mesmas classes CSS, apenas o tema muda!

**Data:** 2025-11-08
**Versão:** 1.0.0
