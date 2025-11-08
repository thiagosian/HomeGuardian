# Design References for HomeGuardian Enterprise UI Redesign

## Contexto do Projeto Atual

**HomeGuardian** é um gerenciador de configuração Git para Home Assistant com:
- Dashboard de status (Git, File Watcher, Remote Sync)
- Visualizador de histórico de commits
- Diff viewer para comparação de versões
- Gerenciamento de items/automações
- Interface Material-UI (MUI) atual

---

## 1. LINEAR (linear.app)

### O que torna o design excepcional

#### Princípios de "Linear Design"
- **Minimalismo Direcionado**: Reduce cognitive load oferecendo apenas uma direção visual, um assunto focal e sequência ordenada
- **Tipografia Ousada**: Left-aligned, bold typography para hierarquia clara
- **Concentricidade**: Ritmo unificado entre elementos da interface
- **Linearidade**: Uma única direção para os olhos escanearem, minimizando escolhas

#### Elementos Visuais Específicos
```
Espaçamento:
- Padding generoso: 16px-24px entre elementos principais
- Grid system de 8px base
- Whitespace como elemento de design primário

Cores:
- Paleta reduzida (3-4 cores principais)
- Alto contraste para acessibilidade
- Sistema de cores semântico (success/warning/error consistente)

Tipografia:
- Inter ou similar (system fonts)
- Font weights: 400 (regular), 500 (medium), 600 (semibold)
- Scale: 12px, 14px, 16px, 20px, 24px, 32px
```

### Padrões UX Específicos

#### 1. Command Palette (Cmd+K)
```javascript
// Exemplo de implementação
const shortcuts = {
  'g i': 'Go to Dashboard',
  'g h': 'Go to History',
  'g s': 'Go to Settings',
  'b': 'Backup Now',
  '/': 'Search commits'
}
```

**Como aplicar ao HomeGuardian:**
- Adicionar Command Palette global (Cmd/Ctrl+K)
- Navegação por teclado: G+D (dashboard), G+H (history), G+S (settings)
- Busca rápida de commits, arquivos modificados
- Ações contextuais: B (backup now), P (push to remote)

#### 2. Keyboard-First Design
- Todos os botões mostram shortcuts em tooltips
- Tab navigation otimizada
- Escape para fechar modais/dialogs
- Enter para confirmar ações

**Aplicação prática:**
```jsx
// Componente Dashboard melhorado
<Button
  variant="contained"
  onClick={handleBackupNow}
  title="Backup Now (B)"
  // adicionar hotkey listener
>
  Backup Now
</Button>
```

#### 3. Context Menus Inteligentes
- Right-click em commit mostra: View Diff, Restore, Copy Hash, Create Tag
- Shortcuts exibidos ao lado das ações

### Aplicação ao HomeGuardian

#### Dashboard Cards Redesign
```jsx
// Estilo Linear para cards de status
<Card sx={{
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.02)',
  padding: '20px',
  '&:hover': {
    background: 'rgba(255,255,255,0.04)'
  }
}}>
  <Typography variant="h6" sx={{
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    marginBottom: '16px'
  }}>
    Git Status
  </Typography>
  {/* Conteúdo minimalista */}
</Card>
```

#### Visual Hierarchy
- Header primário: 32px, weight 600
- Section headers: 14px, weight 600, uppercase, tracking
- Body: 14px, weight 400
- Captions: 12px, weight 400, opacity 0.6

**Referências:**
- https://linear.app/now/how-we-redesigned-the-linear-ui
- https://www.radix-ui.com/primitives/case-studies/linear
- https://blog.logrocket.com/ux-design/linear-design/

---

## 2. VERCEL DASHBOARD

### Elementos Visuais Excepcionais

#### Design System Principles
- **Speed-Focused**: First Meaningful Paint otimizado (redução de 1.2s)
- **Mobile-First**: Todos os componentes funcionam em desktop e mobile
- **Redundant Status Cues**: Não depende apenas de cor (WAI-ARIA compliant)

#### Componentes Específicos

**1. Project Cards**
```css
/* Vercel-style card */
.project-card {
  background: #000;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 20px;
  transition: border-color 0.2s ease;
}

.project-card:hover {
  border-color: #666;
}
```

**2. Status Indicators**
- Checkmark verde + texto "Success"
- Spinner + texto "Building"
- X vermelho + texto "Failed"
- Sempre texto + ícone (nunca apenas cor)

**3. Collapsible Sidebar**
- 240px expandido
- 60px collapsed (apenas ícones)
- Smooth transition (200ms ease)

### Padrões UX Específicos

#### All States Designed
```javascript
// Estados para considerar
const states = [
  'empty',      // Sem commits ainda
  'sparse',     // Poucos commits (1-5)
  'dense',      // Muitos commits (50+)
  'error',      // Erro ao carregar
  'loading'     // Carregando dados
]
```

#### Theme System
- Light mode padrão
- Dark mode com preferência do sistema
- Toggle manual preservado em localStorage

### Aplicação ao HomeGuardian

#### Status Cards com Redundância
```jsx
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  {/* Ícone */}
  <CheckCircleIcon sx={{ color: 'success.main' }} />

  {/* Cor de fundo */}
  <Chip
    label="Clean"
    sx={{
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      color: 'success.main',
      fontWeight: 500
    }}
  />

  {/* Texto descritivo */}
  <Typography variant="body2">
    No uncommitted changes
  </Typography>
</Box>
```

#### Empty States
```jsx
// Dashboard sem commits ainda
<Box sx={{
  textAlign: 'center',
  padding: '80px 20px',
  background: 'rgba(255,255,255,0.02)',
  borderRadius: '12px'
}}>
  <ShieldIcon sx={{ fontSize: 64, opacity: 0.2, marginBottom: 2 }} />
  <Typography variant="h6" gutterBottom>
    No backups yet
  </Typography>
  <Typography variant="body2" color="text.secondary" paragraph>
    HomeGuardian will automatically create commits when files change
  </Typography>
  <Button variant="contained" startIcon={<BackupIcon />}>
    Create first backup
  </Button>
</Box>
```

**Referências:**
- https://vercel.com/design/guidelines
- https://vercel.com/blog/dashboard-redesign

---

## 3. RAILWAY (railway.app)

### Elementos Visuais Excepcionais

#### Dark Mode Implementation
- Background principal: #0B0D0E (quase preto)
- Surface: #13151A (cards)
- Borders: rgba(255,255,255,0.06)
- Text primary: #E5E7EB
- Text secondary: #9CA3AF

#### Glassmorphism for Infrastructure Metrics
```css
.metric-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
```

#### Gradient Accents
- Purple to Blue gradients para CTAs
- Subtle gradients em borders (hover states)
- Glow effects para elementos ativos

### Padrões UX Específicos

#### Real-time Metrics Display
- WebSocket updates para status
- Smooth animations (não jumpy)
- Skeleton loaders durante fetch

#### Infrastructure Visualization
- Service cards com status indicators
- Deploy timeline visual (similar ao que HomeGuardian precisa)
- Resource usage bars com cores graduais

### Aplicação ao HomeGuardian

#### Dark Theme Refinado
```javascript
// Tema Railway-inspired para HomeGuardian
const railwayTheme = {
  palette: {
    mode: 'dark',
    background: {
      default: '#0B0D0E',
      paper: '#13151A',
    },
    primary: {
      main: '#8B5CF6', // Purple
    },
    text: {
      primary: '#E5E7EB',
      secondary: '#9CA3AF',
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }
      }
    }
  }
}
```

#### File Watcher Status com Glow
```jsx
<Box sx={{
  padding: 2,
  background: status.isRunning
    ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)'
    : 'rgba(255,255,255,0.02)',
  border: status.isRunning
    ? '1px solid rgba(76, 175, 80, 0.3)'
    : '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  boxShadow: status.isRunning
    ? '0 0 20px rgba(76, 175, 80, 0.2)'
    : 'none',
  transition: 'all 0.3s ease'
}}>
  {/* Conteúdo */}
</Box>
```

**Referências:**
- https://railway.app
- Exemplos de dark mode: https://dribbble.com/tags/dark-dashboard

---

## 4. GRAFANA

### Elementos Visuais Excepcionais

#### Dashboard Design Philosophy
- **Story-Driven**: Dashboards contam uma história (large → small, general → specific)
- **Audience-Driven**: Design específico para engenheiros vs. PMs
- **Visual Clarity**: Anomalias devem ser óbvias

#### Color System for Metrics
```javascript
const grafanaColors = {
  success: '#73BF69',    // Verde
  warning: '#FF9830',    // Laranja
  critical: '#F2495C',   // Vermelho
  neutral: '#5794F2',    // Azul
  unknown: '#B7B7B7'     // Cinza
}
```

#### Panel Types
- Time series (para histórico de commits ao longo do tempo)
- Stat panels (para métricas single-value)
- Bar gauge (para progresso/percentagens)
- Table (para lista de commits)

### Padrões UX Específicos

#### Monitoring Methodologies

**RED Method (para serviços):**
- **Rate**: Commits por dia/semana
- **Errors**: Failed backups
- **Duration**: Tempo médio de backup

**USE Method (para infraestrutura):**
- **Utilization**: % de espaço usado (.git folder size)
- **Saturation**: Pending commits queue
- **Errors**: Git operation failures

#### Template Variables
```javascript
// Evitar dashboards separados - usar variáveis
const filters = {
  timeRange: 'Last 7 days',
  author: 'All authors',
  fileType: 'All files'
}
```

### Aplicação ao HomeGuardian

#### Dashboard Stats com Grafana Style
```jsx
// Stat panel para commits hoje
<Card sx={{
  background: 'linear-gradient(135deg, #1E2127 0%, #13151A 100%)',
  borderLeft: '3px solid #73BF69'
}}>
  <CardContent>
    <Typography variant="overline" sx={{
      fontSize: '11px',
      color: '#9CA3AF',
      fontWeight: 600
    }}>
      COMMITS TODAY
    </Typography>
    <Typography variant="h3" sx={{
      fontSize: '36px',
      fontWeight: 500,
      color: '#73BF69',
      marginTop: 1
    }}>
      12
    </Typography>
    <Typography variant="caption" sx={{ color: '#6B7280' }}>
      ↑ 20% from yesterday
    </Typography>
  </CardContent>
</Card>
```

#### Threshold Colors
```jsx
// Exemplo: Git repo size warning
const getRepoSizeColor = (sizeMB) => {
  if (sizeMB < 100) return '#73BF69'      // Verde
  if (sizeMB < 500) return '#FF9830'      // Laranja
  return '#F2495C'                         // Vermelho
}
```

#### Commit Timeline Graph
```jsx
// Mini sparkline para últimos 30 dias
import { Sparklines, SparklinesLine } from 'react-sparklines'

<Sparklines data={commitsPerDay} width={100} height={30}>
  <SparklinesLine color="#5794F2" />
</Sparklines>
```

**Referências:**
- https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/
- https://grafana.com/blog/2024/07/03/getting-started-with-grafana-best-practices-to-design-your-first-dashboard/

---

## 5. SENTRY

### Elementos Visuais Excepcionais

#### Dashboard Widget System
- Cada widget visualiza um ou mais datasets
- Widgets independentes mas sincronizados por date range
- Zoom individual sem afetar outros widgets
- Deep linking para Discover (query auto-populated)

#### Error Overview Design
- **High-level view**: Trends, frequent issues, spikes
- **Color coding**: Issue severity levels
- **Grouping**: Similar errors agrupados automaticamente

#### Visual Query Builder
- Cross-environment data
- Holistic system health view
- User-friendly e visualmente claro

### Padrões UX Específicos

#### Dashboard Types (aplicáveis ao HomeGuardian)

**1. Overview Dashboard (Homepage)**
- Health score
- Recent commits (últimos 10)
- Git status
- Remote sync status

**2. History Dashboard**
- Commit trends
- Author statistics
- File change heatmap
- Most modified files

**3. Health Dashboard**
- Repository size over time
- Backup success rate
- Auto-push status
- Scheduled backup reliability

#### Global Filters
```jsx
<Box sx={{ display: 'flex', gap: 2, marginBottom: 3 }}>
  <Select value={dateRange}>
    <MenuItem value="24h">Last 24 hours</MenuItem>
    <MenuItem value="7d">Last 7 days</MenuItem>
    <MenuItem value="30d">Last 30 days</MenuItem>
  </Select>

  <Select value={author}>
    <MenuItem value="all">All authors</MenuItem>
    <MenuItem value="homeguardian">HomeGuardian</MenuItem>
    <MenuItem value="manual">Manual commits</MenuItem>
  </Select>
</Box>
```

### Aplicação ao HomeGuardian

#### Issue-style Commit Cards
```jsx
// Lista de commits estilo Sentry issues
<Card sx={{
  marginBottom: 2,
  borderLeft: commit.type === 'auto'
    ? '4px solid #5794F2'
    : '4px solid #8B5CF6',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  }
}}>
  <CardContent>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Box>
        <Chip
          label={commit.type}
          size="small"
          sx={{ marginRight: 1 }}
        />
        <Typography variant="h6" component="span">
          {commit.message}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {formatDistanceToNow(commit.date)} ago
      </Typography>
    </Box>

    <Box sx={{ marginTop: 2, display: 'flex', gap: 2 }}>
      <Chip
        icon={<AddIcon />}
        label={`+${commit.additions}`}
        size="small"
        sx={{ color: '#73BF69' }}
      />
      <Chip
        icon={<RemoveIcon />}
        label={`-${commit.deletions}`}
        size="small"
        sx={{ color: '#F2495C' }}
      />
      <Chip
        label={`${commit.files} files`}
        size="small"
        variant="outlined"
      />
    </Box>
  </CardContent>
</Card>
```

#### Custom Dashboards
- Dashboards compartilhados na organização (multi-user HomeGuardian)
- Widgets customizáveis via drag-and-drop
- Export/import de configurações de dashboard

**Referências:**
- https://docs.sentry.io/product/dashboards/
- https://sentry.io/features/dashboards/

---

## 6. DATADOG

### Elementos Visuais Excepcionais

#### Visual Hierarchy Best Practices
- **Top-left priority**: Métricas mais críticas no canto superior esquerdo
- **Grid layout**: Widgets relacionados agrupados
- **Concise views**: Limite de widgets por view
- **Bold colors sparingly**: Apenas para dados urgentes

#### Widget Gallery
- Timeseries (linha do tempo de commits)
- Query value (total de commits)
- Top list (arquivos mais modificados)
- Table (lista detalhada de commits)
- Distribution (commits por hora do dia)
- Pie chart (commits por tipo: automation, script, config)

#### Color Strategy
```javascript
const datadogColorStrategy = {
  critical: '#D13212',  // Vermelho vibrante - apenas para urgente
  warning: '#FF9830',   // Laranja
  info: '#5794F2',      // Azul
  success: '#73BF69',   // Verde
  neutral: '#9CA3AF'    // Cinza
}
```

### Padrões UX Específicos

#### Dashboard Philosophy
- **Bring answers to surface**: Dashboard deve responder perguntas-chave
- **Separate concerns**: Não crammar tudo em um dashboard
- **Context matters**: Top list + table + timeseries juntos

#### Screenboards vs Timeboards
- **Timeboards**: Métricas que atualizam em real-time
- **Screenboards**: Views de storytelling (relatórios)

### Aplicação ao HomeGuardian

#### Dashboard Layout Strategy
```jsx
// Grid 12-column layout
<Grid container spacing={3}>
  {/* Top-left: Métricas críticas */}
  <Grid item xs={12} md={4}>
    <StatCard
      title="Repository Health"
      value="Healthy"
      icon={<CheckCircleIcon />}
      color="success"
    />
  </Grid>

  <Grid item xs={12} md={4}>
    <StatCard
      title="Commits Today"
      value={12}
      trend="+20%"
    />
  </Grid>

  <Grid item xs={12} md={4}>
    <StatCard
      title="Backup Success Rate"
      value="99.8%"
      trend="↑ 0.2%"
    />
  </Grid>

  {/* Middle: Timeseries */}
  <Grid item xs={12} md={8}>
    <Card>
      <CardHeader title="Commit Activity" />
      <CardContent>
        <CommitTimelineChart data={last30Days} />
      </CardContent>
    </Card>
  </Grid>

  <Grid item xs={12} md={4}>
    <Card>
      <CardHeader title="Top Modified Files" />
      <CardContent>
        <TopFilesList files={topFiles} />
      </CardContent>
    </Card>
  </Grid>

  {/* Bottom: Detailed table */}
  <Grid item xs={12}>
    <Card>
      <CardHeader title="Recent Commits" />
      <CardContent>
        <CommitTable commits={recentCommits} />
      </CardContent>
    </Card>
  </Grid>
</Grid>
```

#### Interactive Widgets
```jsx
// Widget com drill-down
<Card onClick={() => navigate('/history')}>
  <CardContent sx={{ cursor: 'pointer' }}>
    <Typography variant="h6">Recent Activity</Typography>
    <MiniCommitList commits={recent5} />
    <Button size="small" endIcon={<ArrowForwardIcon />}>
      View all commits
    </Button>
  </CardContent>
</Card>
```

**Referências:**
- https://docs.datadoghq.com/dashboards/
- https://www.nobs.tech/blog/effective-datadog-dashboards

---

## 7. BETTER STACK (betteruptime.com)

### Elementos Visuais Excepcionais

#### Clean UI Philosophy
- "Dead simple, fast to set up"
- "Slick UI" que não sobrecarrega
- Classic dark mode option
- Status pages "beautifully designed"

#### Status Page Customization
- Customizável com CSS e JavaScript
- Public status pages
- Incident timeline visual
- Real-time updates

#### Notification Design
- "Lightning fast notifications"
- Clear, actionable alerts
- Multiple channels (email, Slack, webhooks)

### Padrões UX Específicos

#### Uptime Monitoring Display
```jsx
// Uptime indicator visual
<Box sx={{ display: 'flex', gap: 0.5 }}>
  {last90Days.map((day, i) => (
    <Box
      key={i}
      sx={{
        width: 4,
        height: 32,
        borderRadius: 1,
        backgroundColor: day.uptime === 100
          ? '#73BF69'
          : day.uptime > 99
            ? '#FF9830'
            : '#F2495C',
        opacity: day.uptime === 100 ? 1 : 0.6,
        transition: 'all 0.2s ease',
        '&:hover': {
          opacity: 1,
          transform: 'scaleY(1.2)'
        }
      }}
      title={`${day.date}: ${day.uptime}% uptime`}
    />
  ))}
</Box>
```

#### Incident Timeline
- Visual timeline de incidents
- Color-coded severity
- Expandable details
- Post-mortem links

### Aplicação ao HomeGuardian

#### Backup Reliability Timeline
```jsx
// 90-day backup success visualization
<Card>
  <CardHeader
    title="Backup Reliability"
    subheader="Last 90 days"
  />
  <CardContent>
    <Box sx={{ display: 'flex', gap: 0.5, marginBottom: 2 }}>
      {last90Days.map((day) => (
        <Tooltip
          key={day.date}
          title={`${day.date}: ${day.backups} backups, ${day.failures} failures`}
        >
          <Box sx={{
            width: 3,
            height: 24,
            borderRadius: 0.5,
            backgroundColor: day.failures === 0
              ? '#73BF69'
              : '#F2495C'
          }} />
        </Tooltip>
      ))}
    </Box>

    <Typography variant="h4" sx={{ fontWeight: 500 }}>
      99.8%
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Average backup success rate
    </Typography>
  </CardContent>
</Card>
```

#### Status Page for Remote Sync
```jsx
// Public status view para sync com GitHub/GitLab
<Box sx={{
  padding: 3,
  background: 'linear-gradient(135deg, #13151A 0%, #1E2127 100%)',
  borderRadius: 2
}}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box sx={{
      width: 12,
      height: 12,
      borderRadius: '50%',
      backgroundColor: '#73BF69',
      boxShadow: '0 0 12px rgba(115, 191, 105, 0.6)',
      animation: 'pulse 2s infinite'
    }} />
    <Typography variant="h6">All Systems Operational</Typography>
  </Box>

  <Divider sx={{ marginY: 2 }} />

  <List>
    <ListItem>
      <ListItemIcon>
        <CheckCircleIcon sx={{ color: '#73BF69' }} />
      </ListItemIcon>
      <ListItemText
        primary="Git Operations"
        secondary="Response time: 45ms"
      />
    </ListItem>

    <ListItem>
      <ListItemIcon>
        <CheckCircleIcon sx={{ color: '#73BF69' }} />
      </ListItemIcon>
      <ListItemText
        primary="Remote Sync"
        secondary="Last push: 2 minutes ago"
      />
    </ListItem>
  </List>
</Box>
```

**Referências:**
- https://betterstack.com/uptime
- https://betterstack.com/status-page

---

## 8. AXIOM (axiom.co)

### Elementos Visuais Excepcionais

#### Observability Platform Design
- Modern, clean analytics interface
- Query-based dashboards
- Each query can visualize multiple charts
- Pre-built AI observability dashboards

#### Data Visualization
- Easy-to-use interface
- Any data source integration
- HTML-based (modern web browser only)

### Padrões UX Específicos

#### Dashboard Query System
```javascript
// Cada dashboard consiste de queries
const dashboardQueries = [
  {
    name: 'Commits per day',
    dataset: 'git_commits',
    visualization: ['line-chart', 'bar-chart'],
    groupBy: 'date'
  },
  {
    name: 'Top authors',
    dataset: 'git_commits',
    visualization: ['pie-chart', 'table'],
    groupBy: 'author'
  }
]
```

### Aplicação ao HomeGuardian

#### Query Builder for History
```jsx
<Card>
  <CardHeader title="Custom Query" />
  <CardContent>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        select
        label="Dataset"
        value="commits"
      >
        <MenuItem value="commits">Commits</MenuItem>
        <MenuItem value="files">Files</MenuItem>
        <MenuItem value="authors">Authors</MenuItem>
      </TextField>

      <TextField
        select
        label="Group By"
        value="date"
      >
        <MenuItem value="date">Date</MenuItem>
        <MenuItem value="author">Author</MenuItem>
        <MenuItem value="file">File</MenuItem>
      </TextField>

      <TextField
        select
        label="Visualization"
        value="line-chart"
      >
        <MenuItem value="line-chart">Line Chart</MenuItem>
        <MenuItem value="bar-chart">Bar Chart</MenuItem>
        <MenuItem value="table">Table</MenuItem>
      </TextField>

      <Button variant="contained">Run Query</Button>
    </Box>
  </CardContent>
</Card>
```

**Referências:**
- https://axiom.co/blog/working-with-dashboards-in-axiom
- https://axiom.co

---

## 9. APPLE HUMAN INTERFACE GUIDELINES

### Elementos Visuais Excepcionais (2025 Update)

#### Liquid Glass Design System
- Most extensive software design update
- Refined color palette
- Bolder left-aligned typography
- Concentricity (unified rhythm)
- Harmonized design language

#### Data-Rich Environments
- Card layouts com visual anchors
- Progressive disclosure
- Generous spacing
- Simple icons or illustrations

### Padrões UX Específicos

#### SF Symbols Style Icons
```jsx
// Usar ícones simples e reconhecíveis
import {
  ShieldCheckIcon,      // Git status clean
  ExclamationTriangleIcon, // Warnings
  ClockIcon,            // Scheduled backups
  CloudArrowUpIcon,     // Remote sync
  CommandLineIcon       // Manual commits
} from '@heroicons/react/24/outline'
```

#### Card Segmentation
```jsx
// Segmentar dados complexos em cards
<Stack spacing={2}>
  <Card elevation={0} sx={{
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2
  }}>
    <CardContent>
      <Typography variant="overline" color="text.secondary">
        Local Repository
      </Typography>
      {/* Métricas locais */}
    </CardContent>
  </Card>

  <Card elevation={0} sx={{
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2
  }}>
    <CardContent>
      <Typography variant="overline" color="text.secondary">
        Remote Sync
      </Typography>
      {/* Métricas remotas */}
    </CardContent>
  </Card>
</Stack>
```

### Aplicação ao HomeGuardian

#### Typography System (Apple-inspired)
```javascript
const appleTypography = {
  h1: {
    fontSize: '32px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.2
  },
  h2: {
    fontSize: '24px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.3
  },
  h3: {
    fontSize: '20px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.4
  },
  body1: {
    fontSize: '16px',
    fontWeight: 400,
    letterSpacing: '0',
    lineHeight: 1.5
  },
  body2: {
    fontSize: '14px',
    fontWeight: 400,
    letterSpacing: '0',
    lineHeight: 1.5
  },
  caption: {
    fontSize: '12px',
    fontWeight: 400,
    letterSpacing: '0',
    lineHeight: 1.4,
    opacity: 0.6
  }
}
```

**Referências:**
- https://developer.apple.com/design/human-interface-guidelines/
- https://developer.apple.com/videos/play/wwdc2025/356/

---

## 10. GOOGLE MATERIAL DESIGN 3

### Elementos Visuais Excepcionais (Material 3 Expressive)

#### Latest Updates (2025)
- Redesigned UI components
- Rounded edges
- More padding
- Greater visual hierarchy
- Touch-friendly buttons, sliders, switches

#### Key Components
- **Search app bars**: Hamburger e profile fora da search bar (mais espessa)
- **Containers**: Heavy use of large/tall cards
- **Buttons**: Pill-shaped, split button components
- **Bottom bars & FAB menus**: Navegação e ações

#### Color System (Dynamic Color)
```javascript
// Material 3 dynamic color
const m3Colors = {
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',
  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  // ... etc
}
```

### Padrões UX Específicos

#### Material You Personalization
- Cor extraída do wallpaper do usuário
- Theme dinâmico
- Consistent across apps

#### Component Updates
```jsx
// Material 3 button styles
<Button
  variant="filled"
  sx={{
    borderRadius: '20px',  // Pill-shaped
    padding: '10px 24px',
    textTransform: 'none',
    fontWeight: 500
  }}
>
  Backup Now
</Button>

// Material 3 elevated card
<Card sx={{
  borderRadius: '16px',
  boxShadow: '0 1px 3px 1px rgba(0,0,0,0.15)',
  padding: '16px'
}}>
  {/* Content */}
</Card>
```

### Aplicação ao HomeGuardian

#### Material 3 Dashboard Redesign
```jsx
import { ThemeProvider, createTheme } from '@mui/material'

const m3Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#D0BCFF',
      container: '#4F378B',
    },
    secondary: {
      main: '#CCC2DC',
      container: '#4A4458',
    },
    background: {
      default: '#1C1B1F',
      paper: '#2B2930',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
      },
    },
  },
})
```

#### FAB for Quick Actions
```jsx
<SpeedDial
  ariaLabel="Quick actions"
  sx={{ position: 'fixed', bottom: 16, right: 16 }}
  icon={<SpeedDialIcon />}
>
  <SpeedDialAction
    icon={<BackupIcon />}
    tooltipTitle="Backup Now"
    onClick={handleBackupNow}
  />
  <SpeedDialAction
    icon={<CloudUploadIcon />}
    tooltipTitle="Push to Remote"
    onClick={handlePush}
  />
  <SpeedDialAction
    icon={<RefreshIcon />}
    tooltipTitle="Refresh Status"
    onClick={handleRefresh}
  />
</SpeedDial>
```

**Referências:**
- https://m3.material.io/
- https://oritop.co/google-material-design-a-complete-breakdown-of-material-design-3/

---

## DESIGN PATTERNS CONSOLIDADOS PARA HOMEGUARDIAN

### 1. Status Indicators (de todas as referências)

```jsx
// Sistema de status multi-redundante
const StatusIndicator = ({ status, label, details }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    {/* Ícone */}
    <Box sx={{
      width: 40,
      height: 40,
      borderRadius: '8px',
      backgroundColor: status === 'success'
        ? 'rgba(115, 191, 105, 0.1)'
        : status === 'warning'
          ? 'rgba(255, 152, 48, 0.1)'
          : 'rgba(242, 73, 92, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {status === 'success' && <CheckCircleIcon sx={{ color: '#73BF69' }} />}
      {status === 'warning' && <WarningIcon sx={{ color: '#FF9830' }} />}
      {status === 'error' && <ErrorIcon sx={{ color: '#F2495C' }} />}
    </Box>

    {/* Texto */}
    <Box>
      <Typography variant="body2" fontWeight={500}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {details}
      </Typography>
    </Box>

    {/* Badge */}
    <Chip
      label={status}
      size="small"
      sx={{
        backgroundColor: status === 'success'
          ? 'rgba(115, 191, 105, 0.2)'
          : status === 'warning'
            ? 'rgba(255, 152, 48, 0.2)'
            : 'rgba(242, 73, 92, 0.2)',
        color: status === 'success'
          ? '#73BF69'
          : status === 'warning'
            ? '#FF9830'
            : '#F2495C',
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: '10px'
      }}
    />
  </Box>
)
```

### 2. Git Diff Viewer (Linear + GitHub inspired)

```jsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const DiffViewer = ({ diff }) => (
  <Box sx={{
    fontFamily: 'monospace',
    fontSize: '13px',
    lineHeight: 1.5
  }}>
    {diff.files.map((file) => (
      <Card key={file.name} sx={{ marginBottom: 2 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" fontFamily="monospace">
                {file.name}
              </Typography>
              <Chip
                label={`+${file.additions} -${file.deletions}`}
                size="small"
                variant="outlined"
              />
            </Box>
          }
          sx={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}
        />
        <CardContent sx={{ padding: 0 }}>
          {file.hunks.map((hunk, i) => (
            <Box key={i}>
              {hunk.lines.map((line, j) => (
                <Box
                  key={j}
                  sx={{
                    display: 'flex',
                    backgroundColor:
                      line.type === 'add' ? 'rgba(115, 191, 105, 0.1)' :
                      line.type === 'remove' ? 'rgba(242, 73, 92, 0.1)' :
                      'transparent',
                    borderLeft: line.type === 'add' ? '2px solid #73BF69' :
                                line.type === 'remove' ? '2px solid #F2495C' :
                                '2px solid transparent',
                    padding: '2px 12px',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.03)'
                    }
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      width: 60,
                      color: 'text.secondary',
                      userSelect: 'none',
                      textAlign: 'right',
                      marginRight: 2
                    }}
                  >
                    {line.lineNumber}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      color: line.type === 'add' ? '#73BF69' :
                             line.type === 'remove' ? '#F2495C' :
                             'text.primary'
                    }}
                  >
                    {line.content}
                  </Typography>
                </Box>
              ))}
            </Box>
          ))}
        </CardContent>
      </Card>
    ))}
  </Box>
)
```

### 3. Timeline History (GitHub + Linear inspired)

```jsx
const CommitTimeline = ({ commits }) => (
  <Box>
    {commits.map((commit, index) => (
      <Box key={commit.hash} sx={{ display: 'flex', gap: 2 }}>
        {/* Timeline line */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: commit.type === 'auto' ? '#5794F2' : '#8B5CF6',
            border: '2px solid',
            borderColor: 'background.paper',
            zIndex: 1
          }} />
          {index < commits.length - 1 && (
            <Box sx={{
              width: 2,
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.1)',
              minHeight: 40
            }} />
          )}
        </Box>

        {/* Commit card */}
        <Card sx={{
          flex: 1,
          marginBottom: index < commits.length - 1 ? 2 : 0,
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease'
          }
        }}>
          <CardContent>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 1
            }}>
              <Typography variant="h6" fontSize="14px" fontWeight={600}>
                {commit.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(commit.date))} ago
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, marginBottom: 1 }}>
              <Chip
                label={commit.type}
                size="small"
                sx={{
                  backgroundColor: commit.type === 'auto'
                    ? 'rgba(87, 148, 242, 0.1)'
                    : 'rgba(139, 92, 246, 0.1)',
                  color: commit.type === 'auto' ? '#5794F2' : '#8B5CF6'
                }}
              />
              <Chip
                label={commit.author}
                size="small"
                variant="outlined"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#73BF69' }}>
                +{commit.additions}
              </Typography>
              <Typography variant="caption" sx={{ color: '#F2495C' }}>
                -{commit.deletions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {commit.files} files
              </Typography>
            </Box>

            <Box sx={{ marginTop: 2, display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => handleViewDiff(commit)}
              >
                View Diff
              </Button>
              <Button
                size="small"
                startIcon={<RestoreIcon />}
                onClick={() => handleRestore(commit)}
              >
                Restore
              </Button>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </Box>
    ))}
  </Box>
)
```

### 4. Empty States (Vercel + Better Stack inspired)

```jsx
const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel
}) => (
  <Box sx={{
    textAlign: 'center',
    padding: '80px 20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '16px',
    border: '1px dashed rgba(255,255,255,0.1)'
  }}>
    <Box sx={{
      width: 64,
      height: 64,
      borderRadius: '16px',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px'
    }}>
      <Icon sx={{ fontSize: 32, color: '#8B5CF6' }} />
    </Box>

    <Typography
      variant="h6"
      gutterBottom
      sx={{ fontSize: '18px', fontWeight: 600 }}
    >
      {title}
    </Typography>

    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ marginBottom: 3, maxWidth: 400, margin: '0 auto 24px' }}
    >
      {description}
    </Typography>

    {action && (
      <Button
        variant="contained"
        size="large"
        onClick={action}
        sx={{ borderRadius: '20px' }}
      >
        {actionLabel}
      </Button>
    )}
  </Box>
)

// Uso:
// <EmptyState
//   icon={BackupIcon}
//   title="No backups yet"
//   description="HomeGuardian will automatically create commits when files change in your Home Assistant configuration."
//   action={handleFirstBackup}
//   actionLabel="Create first backup"
// />
```

### 5. Command Palette (Linear inspired)

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const CommandPalette = ({ open, onClose }) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  const commands = [
    { id: 'nav-dashboard', label: 'Go to Dashboard', action: () => navigate('/'), shortcut: 'G D' },
    { id: 'nav-history', label: 'Go to History', action: () => navigate('/history'), shortcut: 'G H' },
    { id: 'nav-settings', label: 'Go to Settings', action: () => navigate('/settings'), shortcut: 'G S' },
    { id: 'backup-now', label: 'Backup Now', action: handleBackupNow, shortcut: 'B' },
    { id: 'push-remote', label: 'Push to Remote', action: handlePush, shortcut: 'P' },
  ]

  useEffect(() => {
    if (query) {
      const filtered = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
      )
      setResults(filtered)
    } else {
      setResults(commands)
    }
  }, [query])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          background: 'rgba(19, 21, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }
      }}
    >
      <Box sx={{ padding: 2 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Type a command or search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ marginRight: 1, opacity: 0.5 }} />,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              '& fieldset': { border: 'none' }
            }
          }}
        />
      </Box>

      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {results.map((cmd) => (
          <ListItemButton
            key={cmd.id}
            onClick={() => {
              cmd.action()
              onClose()
            }}
            sx={{
              padding: '12px 16px',
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.1)'
              }
            }}
          >
            <ListItemText
              primary={cmd.label}
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500
              }}
            />
            {cmd.shortcut && (
              <Chip
                label={cmd.shortcut}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  fontSize: '11px',
                  height: 24
                }}
              />
            )}
          </ListItemButton>
        ))}
      </List>
    </Dialog>
  )
}

// Keyboard shortcuts hook
const useKeyboardShortcuts = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command Palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { commandPaletteOpen, setCommandPaletteOpen }
}
```

---

## ROADMAP DE IMPLEMENTAÇÃO

### Fase 1: Fundação (Semana 1-2)
- [ ] Atualizar Material-UI para Material 3
- [ ] Implementar novo color system (Grafana-inspired)
- [ ] Criar typography scale (Apple HIG inspired)
- [ ] Implementar dark theme refinado (Railway-inspired)

### Fase 2: Componentes Core (Semana 3-4)
- [ ] Redesign Dashboard cards (Linear + Vercel)
- [ ] Implementar status indicators multi-redundantes
- [ ] Criar empty states para todos os views
- [ ] Melhorar loading states (skeleton loaders)

### Fase 3: Features Avançadas (Semana 5-6)
- [ ] Command Palette (Linear-inspired)
- [ ] Keyboard shortcuts globais
- [ ] Timeline history view (GitHub-inspired)
- [ ] Diff viewer melhorado com syntax highlighting

### Fase 4: Métricas & Analytics (Semana 7-8)
- [ ] Dashboard stats widgets (Datadog-inspired)
- [ ] Commit activity charts (Grafana)
- [ ] Backup reliability timeline (Better Stack)
- [ ] Top files/authors visualizations

### Fase 5: Polish & Accessibility (Semana 9-10)
- [ ] Animações e transições suaves
- [ ] Glassmorphism effects (Railway)
- [ ] WCAG 2.1 AA compliance
- [ ] Mobile responsive refinement

---

## RECURSOS ADICIONAIS

### Design Systems para Referência
- Linear Design System: https://www.figma.com/community/file/1222872653732371433
- Material Design 3: https://m3.material.io/
- Carbon Design System: https://carbondesignsystem.com/
- Atlassian Design System: https://atlassian.design/

### Component Libraries
- shadcn/ui: https://ui.shadcn.com/
- Radix UI: https://www.radix-ui.com/
- MUI (Material-UI): https://mui.com/

### Inspiração Visual
- Dribbble - Dark Dashboard: https://dribbble.com/tags/dark-dashboard
- Nicelydone.club: https://nicelydone.club/
- Mobbin: https://mobbin.com/

### Ferramentas
- Figma (design & prototyping)
- react-syntax-highlighter (diff viewer)
- date-fns (formatação de datas)
- recharts ou victory (charts)
- framer-motion (animações)

---

**Documentação criada em:** 2025-11-08
**Última atualização:** 2025-11-08
**Versão:** 1.0.0
