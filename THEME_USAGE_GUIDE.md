# HomeGuardian - Guia Prático de Uso dos Temas

## Quick Start

### 1. Aplicar tema no root element

O ThemeContext automaticamente aplica `data-theme` no `<html>`:

```jsx
// main.jsx
import { ThemeProvider } from '@/contexts/ThemeContext'

<ThemeProvider>
  <App />
</ThemeProvider>
```

### 2. Usar variáveis CSS nos componentes

```jsx
// Qualquer componente
export default function MyComponent() {
  return (
    <div className="bg-background text-foreground p-4 rounded-lg">
      <h1 className="text-4xl font-bold text-primary">
        Hello World
      </h1>
      <p className="text-muted-foreground mt-2">
        This text adapts to all 4 themes automatically
      </p>
    </div>
  )
}
```

---

## Componentes Comuns

### Card Component

```jsx
export function Card({ children, className = '' }) {
  return (
    <div className={`
      bg-card text-card-foreground
      border border-border
      rounded-[var(--radius-lg)]
      shadow-[var(--shadow-md)]
      p-[var(--spacing-md)]
      ${className}
    `}>
      {children}
    </div>
  )
}

// Uso:
<Card>
  <h2 className="text-xl font-semibold">Git Status</h2>
  <p className="text-muted-foreground">No uncommitted changes</p>
</Card>
```

### Button Component

```jsx
export function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
    destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
    outline: 'border border-border bg-transparent hover:bg-muted',
  }

  return (
    <button
      className={`
        px-[var(--spacing-md)] py-[var(--spacing-sm)]
        rounded-[var(--radius-md)]
        font-medium
        transition-all duration-[var(--transition-base)]
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

// Uso:
<Button variant="primary">Backup Now</Button>
<Button variant="destructive">Delete All</Button>
```

### Badge Component

```jsx
export function Badge({
  variant = 'default',
  children,
  className = ''
}) {
  const variants = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-[hsl(var(--success)_/_0.1)] text-success',
    warning: 'bg-[hsl(var(--warning)_/_0.1)] text-warning',
    error: 'bg-[hsl(var(--error)_/_0.1)] text-error',
    info: 'bg-[hsl(var(--info)_/_0.1)] text-info',
  }

  return (
    <span className={`
      inline-flex items-center
      px-2 py-1
      rounded-[var(--radius-sm)]
      text-xs font-semibold
      ${variants[variant]}
      ${className}
    `}>
      {children}
    </span>
  )
}

// Uso:
<Badge variant="success">Clean</Badge>
<Badge variant="error">Failed</Badge>
```

### Status Indicator (com Glow no New Dark)

```jsx
export function StatusIndicator({ status, label }) {
  const statusConfig = {
    success: {
      color: 'text-success',
      bg: 'bg-[hsl(var(--success)_/_0.1)]',
      glow: 'glow-success', // Só funciona no New Dark
    },
    warning: {
      color: 'text-warning',
      bg: 'bg-[hsl(var(--warning)_/_0.1)]',
      glow: '',
    },
    error: {
      color: 'text-error',
      bg: 'bg-[hsl(var(--error)_/_0.1)]',
      glow: 'glow-error',
    },
  }

  const config = statusConfig[status]

  return (
    <div className={`
      flex items-center gap-2
      p-3 rounded-lg
      ${config.bg}
      ${config.glow}
    `}>
      <div className={`
        w-2 h-2 rounded-full
        ${config.color}
        bg-current
      `} />
      <span className={`font-medium ${config.color}`}>
        {label}
      </span>
    </div>
  )
}

// Uso:
<StatusIndicator status="success" label="All systems operational" />
```

### Diff Viewer Line

```jsx
export function DiffLine({ type, lineNumber, content }) {
  const typeClasses = {
    added: 'diff-added border-l-2 border-[hsl(var(--diff-added-fg))]',
    removed: 'diff-removed border-l-2 border-[hsl(var(--diff-removed-fg))]',
    modified: 'diff-modified border-l-2 border-[hsl(var(--diff-modified-fg))]',
    context: 'diff-context',
  }

  return (
    <div className={`
      flex items-center
      px-3 py-1
      font-mono text-sm
      ${typeClasses[type]}
      hover:bg-[hsl(var(--muted)_/_0.3)]
      transition-colors duration-[var(--transition-fast)]
    `}>
      <span className="w-12 text-right text-muted-foreground mr-4 select-none">
        {lineNumber}
      </span>
      <code>{content}</code>
    </div>
  )
}

// Uso:
<DiffLine type="added" lineNumber={42} content="+  const newFeature = true" />
<DiffLine type="removed" lineNumber={43} content="-  const oldFeature = false" />
```

---

## Utility Classes Customizadas

### Text Colors

```jsx
<p className="text-foreground">Default text</p>
<p className="text-muted-foreground">Muted text</p>
<p className="text-primary">Primary colored text</p>
<p className="text-success">Success message</p>
<p className="text-warning">Warning message</p>
<p className="text-error">Error message</p>
```

### Backgrounds

```jsx
<div className="bg-background">Page background</div>
<div className="bg-card">Card background</div>
<div className="bg-muted">Muted background</div>
<div className="bg-primary">Primary background</div>
```

### Border Radius

```jsx
<div className="rounded-classic">Classic style (6px)</div>
<div className="rounded-modern">Modern style (8-12px)</div>

// Ou usar CSS variables diretamente:
<div style={{ borderRadius: 'var(--radius-sm)' }}>Small</div>
<div style={{ borderRadius: 'var(--radius-md)' }}>Medium</div>
<div style={{ borderRadius: 'var(--radius-lg)' }}>Large</div>
<div style={{ borderRadius: 'var(--radius-xl)' }}>Extra Large</div>
```

### Glow Effects (New Dark only)

```jsx
<div className="glow-primary">Glows purple in New Dark theme</div>
<div className="glow-success">Glows green in New Dark theme</div>
<div className="glow-error">Glows red in New Dark theme</div>
```

---

## Layout Components

### Dashboard Grid

```jsx
export function DashboardGrid({ children }) {
  return (
    <div className="
      grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
      gap-[var(--spacing-lg)]
      p-[var(--spacing-xl)]
    ">
      {children}
    </div>
  )
}

// Uso:
<DashboardGrid>
  <StatCard title="Commits Today" value={12} />
  <StatCard title="Backup Success Rate" value="99.8%" />
  <StatCard title="Repository Size" value="234 MB" />
</DashboardGrid>
```

### Stat Card

```jsx
export function StatCard({ title, value, trend, icon: Icon }) {
  return (
    <Card className="hover:shadow-[var(--shadow-lg)] transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
      </div>

      <p className="text-[var(--text-3xl)] font-bold text-foreground">
        {value}
      </p>

      {trend && (
        <p className="text-sm text-success mt-1">
          {trend}
        </p>
      )}
    </Card>
  )
}

// Uso:
import { GitBranchIcon } from 'lucide-react'

<StatCard
  title="Commits Today"
  value={12}
  trend="↑ 20% from yesterday"
  icon={GitBranchIcon}
/>
```

### Section Header

```jsx
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="
      flex items-center justify-between
      mb-[var(--spacing-lg)]
      pb-[var(--spacing-sm)]
      border-b border-border
    ">
      <div>
        <h2 className="
          text-[var(--text-2xl)]
          font-[var(--font-bold)]
          leading-[var(--leading-tight)]
          text-foreground
        ">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

// Uso:
<SectionHeader
  title="Recent Commits"
  subtitle="Last 30 days"
  action={<Button>View All</Button>}
/>
```

---

## Form Components

### Input

```jsx
export function Input({ label, error, ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="
          text-sm font-medium text-foreground
          block
        ">
          {label}
        </label>
      )}
      <input
        className={`
          w-full
          px-3 py-2
          bg-background
          border border-input
          rounded-[var(--radius-md)]
          text-foreground
          placeholder:text-muted-foreground
          focus:outline-none
          focus:ring-2
          focus:ring-[hsl(var(--ring))]
          focus:border-transparent
          transition-all
          ${error ? 'border-error focus:ring-error' : ''}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  )
}

// Uso:
<Input
  label="Repository Path"
  placeholder="/config"
  error={errors.path}
/>
```

### Select

```jsx
export function Select({ label, options, ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-foreground block">
          {label}
        </label>
      )}
      <select
        className="
          w-full
          px-3 py-2
          bg-background
          border border-input
          rounded-[var(--radius-md)]
          text-foreground
          focus:outline-none
          focus:ring-2
          focus:ring-[hsl(var(--ring))]
          transition-all
        "
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// Uso:
<Select
  label="Theme"
  options={[
    { value: 'classic-light', label: 'Classic Light' },
    { value: 'classic-dark', label: 'Classic Dark' },
    { value: 'new-light', label: 'New Light' },
    { value: 'new-dark', label: 'New Dark' },
  ]}
  onChange={(e) => setTheme(e.target.value)}
/>
```

---

## Modal/Dialog

```jsx
export function Dialog({ open, onClose, title, children }) {
  if (!open) return null

  return (
    <div className="
      fixed inset-0 z-50
      flex items-center justify-center
      bg-black/50
      backdrop-blur-sm
    ">
      <div className="
        bg-card
        border border-border
        rounded-[var(--radius-lg)]
        shadow-[var(--shadow-lg)]
        max-w-md w-full
        mx-4
        animate-[fadeIn_var(--transition-base)]
      ">
        <div className="
          p-[var(--spacing-lg)]
          border-b border-border
        ">
          <h2 className="text-xl font-semibold text-foreground">
            {title}
          </h2>
        </div>

        <div className="p-[var(--spacing-lg)]">
          {children}
        </div>

        <div className="
          p-[var(--spacing-lg)]
          border-t border-border
          flex gap-2 justify-end
        ">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}

// Uso:
<Dialog open={isOpen} onClose={() => setIsOpen(false)} title="Delete Backup">
  <p className="text-muted-foreground">
    Are you sure you want to delete this backup? This action cannot be undone.
  </p>
</Dialog>
```

---

## Theme Selector Component

```jsx
import { useTheme } from '@/contexts/ThemeContext'
import { SunIcon, MoonIcon } from 'lucide-react'

export function ThemeSelector() {
  const { currentTheme, setTheme, availableThemes } = useTheme()

  const themes = [
    { id: 'classic', label: 'Classic Light', icon: SunIcon, group: 'classic' },
    { id: 'classic-dark', label: 'Classic Dark', icon: MoonIcon, group: 'classic' },
    { id: 'new-light', label: 'New Light', icon: SunIcon, group: 'new' },
    { id: 'new-dark', label: 'New Dark', icon: MoonIcon, group: 'new' },
  ]

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-foreground">
        Choose Theme
      </label>

      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme) => {
          const Icon = theme.icon
          const isActive = currentTheme === theme.id

          return (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`
                p-4
                border-2
                rounded-[var(--radius-lg)]
                transition-all
                ${isActive
                  ? 'border-primary bg-[hsl(var(--primary)_/_0.1)]'
                  : 'border-border bg-card hover:border-muted-foreground'
                }
              `}
            >
              <Icon className={`
                w-6 h-6 mb-2
                ${isActive ? 'text-primary' : 'text-muted-foreground'}
              `} />
              <p className={`
                text-sm font-medium
                ${isActive ? 'text-primary' : 'text-foreground'}
              `}>
                {theme.label}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Uso em Settings page:
<ThemeSelector />
```

---

## Typography Components

```jsx
export function Typography({ variant = 'p', children, className = '' }) {
  const variants = {
    h1: 'text-[var(--text-4xl)] font-[var(--font-bold)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)]',
    h2: 'text-[var(--text-3xl)] font-[var(--font-bold)] leading-[var(--leading-tight)]',
    h3: 'text-[var(--text-2xl)] font-[var(--font-semibold)]',
    h4: 'text-[var(--text-xl)] font-[var(--font-semibold)]',
    p: 'text-[var(--text-base)] leading-[var(--leading-normal)]',
    small: 'text-[var(--text-sm)]',
    caption: 'text-[var(--text-xs)] text-muted-foreground',
  }

  const Component = variant

  return (
    <Component className={`${variants[variant]} ${className}`}>
      {children}
    </Component>
  )
}

// Uso:
<Typography variant="h1">Dashboard</Typography>
<Typography variant="p">Welcome to HomeGuardian</Typography>
<Typography variant="caption">Last updated 5 minutes ago</Typography>
```

---

## Responsive Design

```jsx
export function ResponsiveCard() {
  return (
    <Card className="
      p-[var(--spacing-sm)]
      sm:p-[var(--spacing-md)]
      lg:p-[var(--spacing-lg)]
    ">
      <h2 className="
        text-[var(--text-xl)]
        sm:text-[var(--text-2xl)]
        lg:text-[var(--text-3xl)]
      ">
        Responsive Title
      </h2>
    </Card>
  )
}
```

---

## Animation Examples

```jsx
// Fade in
<div className="animate-[fadeIn_var(--transition-base)]">
  Content fades in
</div>

// Slide in from right
<div className="animate-[slideInFromRight_var(--transition-base)]">
  Sidebar slides in
</div>

// Pulse (loading)
<div className="animate-[pulse_2s_infinite]">
  Loading...
</div>

// Spin (spinner)
<div className="animate-[spin_1s_linear_infinite]">
  ⟳
</div>
```

---

## Dark Mode Detection

```jsx
import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme')
    setIsDark(theme?.includes('dark') || false)

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme')
      setIsDark(currentTheme?.includes('dark') || false)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    return () => observer.disconnect()
  }, [])

  return isDark
}

// Uso:
function MyComponent() {
  const isDark = useDarkMode()

  return (
    <div>
      {isDark ? (
        <MoonIcon className="glow-primary" />
      ) : (
        <SunIcon />
      )}
    </div>
  )
}
```

---

## Testing Themes

```jsx
// Component para testar todos os temas rapidamente
export function ThemePreview() {
  const themes = ['classic-light', 'classic-dark', 'new-light', 'new-dark']

  return (
    <div className="grid grid-cols-2 gap-4 p-8">
      {themes.map((theme) => (
        <div key={theme} data-theme={theme} className="bg-background p-6 rounded-lg">
          <h3 className="text-xl font-bold text-foreground mb-4">{theme}</h3>

          <Card className="mb-4">
            <p className="text-foreground">Card with default text</p>
            <p className="text-muted-foreground">Muted text</p>
          </Card>

          <div className="flex gap-2 mb-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
          </div>

          <div className="flex gap-2">
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## Best Practices

### ✅ DO

```jsx
// Use CSS variables
<div style={{ color: 'hsl(var(--foreground))' }}>Text</div>

// Use utility classes
<p className="text-muted-foreground">Text</p>

// Respect theme spacing
<div className="p-[var(--spacing-md)]">Content</div>

// Use theme-aware components
<Card>Content</Card>
```

### ❌ DON'T

```jsx
// Hard-code colors
<div style={{ color: '#24292e' }}>Text</div>

// Hard-code spacing
<div className="p-4">Content</div>

// Ignore theme variables
<div style={{ borderRadius: '8px' }}>Content</div>
```

---

**Criado:** 2025-11-08
**Versão:** 1.0.0
