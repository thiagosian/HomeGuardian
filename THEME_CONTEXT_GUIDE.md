# ThemeContext.jsx - Guide de Uso

## Visão Geral

O novo `ThemeContext` é um contexto React simplificado (sem MUI) que gerencia 4 temas diferentes:
- `classic-light` - Tema clássico claro
- `classic-dark` - Tema clássico escuro  
- `new-light` - Novo tema claro (com cores vibrantes)
- `new-dark` - Novo tema escuro (com cores vibrantes)

## Características

✓ **Persistência**: Salva em localStorage com chave `homeguardian-theme`  
✓ **data-theme**: Aplica atributo `data-theme` no `document.documentElement`  
✓ **Tailwind Dark Mode**: Aplica classes `dark`/`light` automaticamente  
✓ **Migração**: Converte localStorage antigo (`classic` → `classic-light`, `modern` → `classic-dark`)  
✓ **Sem MUI**: Nenhuma dependência do Material-UI  
✓ **Type-Safe**: API clara e previsível  

## API do Context

```javascript
{
  theme: string,           // 'classic-light' | 'classic-dark' | 'new-light' | 'new-dark'
  setTheme: (theme) => void,  // Altera o tema
  isDark: boolean,         // true se o tema é dark
  isClassicTheme: boolean, // true se é um tema classic
  isNewTheme: boolean,     // true se é um tema new
}
```

## Exemplo 1: Usar em um Componente

```jsx
import { useTheme } from '../contexts/ThemeContext'

export default function MyComponent() {
  const { theme, setTheme, isDark, isClassicTheme } = useTheme()

  return (
    <div>
      <p>Tema atual: {theme}</p>
      <p>Modo escuro: {isDark ? 'Ativado' : 'Desativado'}</p>
      <p>Tipo: {isClassicTheme ? 'Clássico' : 'Novo'}</p>

      <button onClick={() => setTheme('classic-light')}>
        Clássico Claro
      </button>
      <button onClick={() => setTheme('classic-dark')}>
        Clássico Escuro
      </button>
      <button onClick={() => setTheme('new-light')}>
        Novo Claro
      </button>
      <button onClick={() => setTheme('new-dark')}>
        Novo Escuro
      </button>
    </div>
  )
}
```

## Exemplo 2: Com Select Component

```jsx
import { useTheme } from '../contexts/ThemeContext'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select'

const THEMES = [
  { value: 'classic-light', label: 'Classic Light' },
  { value: 'classic-dark', label: 'Classic Dark' },
  { value: 'new-light', label: 'New Light' },
  { value: 'new-dark', label: 'New Dark' },
]

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger>
        <SelectValue placeholder="Escolha um tema" />
      </SelectTrigger>
      <SelectContent>
        {THEMES.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

## Exemplo 3: Aplicar Estilos Específicos por Tema

No CSS/Tailwind, você pode usar o atributo `data-theme`:

```css
/* Classic Light */
[data-theme='classic-light'] .my-element {
  background: white;
  color: black;
}

/* Classic Dark */
[data-theme='classic-dark'] .my-element {
  background: #0f0f0f;
  color: white;
}

/* New Light */
[data-theme='new-light'] .my-element {
  background: #f9f9f9;
  color: #1a1a1a;
}

/* New Dark */
[data-theme='new-dark'] .my-element {
  background: #141414;
  color: #e8e8e8;
}
```

Ou usar a classe `.dark`:

```jsx
<div className="bg-white dark:bg-slate-950">
  Conteúdo
</div>
```

## Integração na Aplicação

O `ThemeProvider` já está envolvendo toda a aplicação em `main.jsx`:

```jsx
import { ThemeProvider } from './contexts/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
```

Não é necessário fazer nada extra - qualquer componente dentro da aplicação pode usar `useTheme()`.

## Migração do localStorage

Se você tinha valores antigos no localStorage:

| Valor Antigo | Novo Valor      |
|--------------|-----------------|
| `classic`    | `classic-light` |
| `modern`     | `classic-dark`  |

A migração é automática na primeira vez que o aplicativo carrega.

## Atributos do document.documentElement

O `ThemeContext` aplica automaticamente:

```html
<html data-theme="classic-light" class="light">
  <!-- conteúdo -->
</html>
```

Você pode acessar isso em JavaScript:

```javascript
const theme = document.documentElement.getAttribute('data-theme')
const isDark = document.documentElement.classList.contains('dark')
```

## Variáveis CSS por Tema

O arquivo `index.css` define variáveis CSS para cada tema. Cada tema tem:

- `--background`
- `--foreground`
- `--card`, `--card-foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--muted`, `--muted-foreground`
- `--border`
- `--input`
- `--ring`

Você pode usar essas variáveis em seus componentes:

```jsx
<div style={{ backgroundColor: 'hsl(var(--background))' }}>
  Fundo dinâmico baseado no tema
</div>
```

## Exemplo Completo: Settings Page

Veja `/home/user/HomeGuardian/frontend/src/pages/Settings.jsx` para um exemplo completo
de como implementar um seletor de temas.

## Troubleshooting

### O tema não persiste

Verifique o localStorage:
```javascript
console.log(localStorage.getItem('homeguardian-theme'))
```

### Classes `.dark` não estão sendo aplicadas

Verifique se o Tailwind está configurado para usar o modo `.dark`:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Isso precisa estar configurado
  // ...
}
```

### Temas customizados

Para adicionar um novo tema, edite:

1. Adicione em `ThemeContext.jsx` no array `VALID_THEMES`
2. Adicione as variáveis CSS correspondentes em `index.css` com `[data-theme='seu-tema']`

Exemplo:
```javascript
const VALID_THEMES = ['classic-light', 'classic-dark', 'new-light', 'new-dark', 'seu-tema']
```

```css
[data-theme='seu-tema'] {
  --background: /* sua cor */;
  --foreground: /* sua cor */;
  /* ... outras variáveis */
}
```

---

**Arquivo Principal**: `/home/user/HomeGuardian/frontend/src/contexts/ThemeContext.jsx`  
**Arquivo de Estilos**: `/home/user/HomeGuardian/frontend/src/index.css`  
**Exemplo de Uso**: `/home/user/HomeGuardian/frontend/src/pages/Settings.jsx`
