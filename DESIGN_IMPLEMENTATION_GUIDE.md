# HomeGuardian - Guia de Implementação de Design Moderno

## Índice
1. [Theme System Completo](#theme-system-completo)
2. [Componentes Reutilizáveis](#componentes-reutilizáveis)
3. [Dashboard Redesign](#dashboard-redesign)
4. [History View Redesign](#history-view-redesign)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Animações e Transições](#animações-e-transições)

---

## Theme System Completo

### `/frontend/src/theme/index.js`

```javascript
import { createTheme } from '@mui/material/styles'

// Inspirado em Linear, Railway, e Material Design 3
export const createHomeGuardianTheme = (mode = 'dark') => {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      ...(isDark ? {
        // Dark theme (Railway + Linear inspired)
        background: {
          default: '#0B0D0E',
          paper: '#13151A',
          elevated: '#1E2127',
        },
        primary: {
          main: '#8B5CF6',        // Purple
          light: '#A78BFA',
          dark: '#7C3AED',
          container: '#4F378B',
        },
        secondary: {
          main: '#5794F2',        // Blue
          light: '#74B0FF',
          dark: '#3B78D4',
        },
        success: {
          main: '#73BF69',        // Grafana green
          light: '#8DD888',
          dark: '#5FA955',
        },
        warning: {
          main: '#FF9830',        // Grafana orange
          light: '#FFB366',
          dark: '#E87E1C',
        },
        error: {
          main: '#F2495C',        // Grafana red
          light: '#F76B7A',
          dark: '#D93848',
        },
        info: {
          main: '#5794F2',
          light: '#74B0FF',
          dark: '#3B78D4',
        },
        text: {
          primary: '#E5E7EB',
          secondary: '#9CA3AF',
          disabled: '#6B7280',
        },
        divider: 'rgba(255, 255, 255, 0.08)',
      } : {
        // Light theme (Apple + Vercel inspired)
        background: {
          default: '#FFFFFF',
          paper: '#F9FAFB',
          elevated: '#FFFFFF',
        },
        primary: {
          main: '#6750A4',
          light: '#8B7BC8',
          dark: '#4F378B',
        },
        secondary: {
          main: '#0070F3',
          light: '#3291FF',
          dark: '#0051CC',
        },
        success: {
          main: '#059669',
          light: '#10B981',
          dark: '#047857',
        },
        warning: {
          main: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
        },
        error: {
          main: '#DC2626',
          light: '#EF4444',
          dark: '#B91C1C',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          disabled: '#9CA3AF',
        },
        divider: 'rgba(0, 0, 0, 0.08)',
      }),
    },

    typography: {
      // Apple HIG + Linear inspired
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Inter',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '32px',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '24px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '20px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '18px',
        fontWeight: 600,
        letterSpacing: '-0.005em',
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '16px',
        fontWeight: 600,
        letterSpacing: '0',
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '0',
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '16px',
        fontWeight: 400,
        letterSpacing: '0',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '14px',
        fontWeight: 400,
        letterSpacing: '0',
        lineHeight: 1.5,
      },
      caption: {
        fontSize: '12px',
        fontWeight: 400,
        letterSpacing: '0',
        lineHeight: 1.4,
      },
      overline: {
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        lineHeight: 1.5,
        textTransform: 'uppercase',
      },
      button: {
        fontSize: '14px',
        fontWeight: 500,
        letterSpacing: '0.01em',
        textTransform: 'none',
      },
    },

    shape: {
      borderRadius: 8,
    },

    spacing: 8,

    shadows: isDark ? [
      'none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
      '0 2px 4px 0 rgba(0, 0, 0, 0.4)',
      '0 2px 6px 0 rgba(0, 0, 0, 0.4)',
      '0 4px 8px 0 rgba(0, 0, 0, 0.4)',
      '0 4px 12px 0 rgba(0, 0, 0, 0.4)',
      '0 6px 16px 0 rgba(0, 0, 0, 0.4)',
      '0 8px 20px 0 rgba(0, 0, 0, 0.4)',
      '0 12px 24px 0 rgba(0, 0, 0, 0.4)',
      // ... rest of shadows
    ] : undefined,

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: isDark
              ? 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05)',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: isDark
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              '&:hover': {
                background: isDark
                  ? 'rgba(255, 255, 255, 0.3)'
                  : 'rgba(0, 0, 0, 0.3)',
              },
            },
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.03)'
              : '#FFFFFF',
            backdropFilter: isDark ? 'blur(10px)' : 'none',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
            borderRadius: 12,
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.15)',
            },
          },
        },
        defaultProps: {
          elevation: 0,
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            padding: '8px 16px',
            transition: 'all 0.2s ease',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: isDark
                ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                : '0 2px 8px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          outlined: {
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(0, 0, 0, 0.2)',
            '&:hover': {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.4)'
                : 'rgba(0, 0, 0, 0.4)',
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.05)',
            },
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '12px',
          },
          filled: {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.08)',
          },
        },
      },

      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              },
              '&:hover fieldset': {
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(0, 0, 0, 0.2)',
              },
              '&.Mui-focused': {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : '#FFFFFF',
              },
            },
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            backgroundImage: 'none',
            backgroundColor: isDark
              ? 'rgba(19, 21, 26, 0.95)'
              : '#FFFFFF',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark
              ? 'rgba(30, 33, 39, 0.95)'
              : 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(8px)',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: 6,
          },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            marginBottom: 2,
            '&.Mui-selected': {
              backgroundColor: isDark
                ? 'rgba(139, 92, 246, 0.15)'
                : 'rgba(103, 80, 164, 0.1)',
              '&:hover': {
                backgroundColor: isDark
                  ? 'rgba(139, 92, 246, 0.2)'
                  : 'rgba(103, 80, 164, 0.15)',
              },
            },
          },
        },
      },
    },
  })
}

export default createHomeGuardianTheme
```

---

## Componentes Reutilizáveis

### `/frontend/src/components/StatusIndicator.jsx`

```javascript
import { Box, Typography, Chip } from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material'

const statusConfig = {
  success: {
    icon: CheckCircleIcon,
    color: '#73BF69',
    backgroundColor: 'rgba(115, 191, 105, 0.1)',
  },
  warning: {
    icon: WarningIcon,
    color: '#FF9830',
    backgroundColor: 'rgba(255, 152, 48, 0.1)',
  },
  error: {
    icon: ErrorIcon,
    color: '#F2495C',
    backgroundColor: 'rgba(242, 73, 92, 0.1)',
  },
  info: {
    icon: InfoIcon,
    color: '#5794F2',
    backgroundColor: 'rgba(87, 148, 242, 0.1)',
  },
}

export default function StatusIndicator({
  status,
  label,
  details,
  showIcon = true,
  showBadge = true,
  size = 'medium',
}) {
  const config = statusConfig[status] || statusConfig.info
  const Icon = config.icon

  const iconSize = size === 'small' ? 32 : size === 'large' ? 48 : 40

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {showIcon && (
        <Box
          sx={{
            width: iconSize,
            height: iconSize,
            borderRadius: 2,
            backgroundColor: config.backgroundColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ color: config.color, fontSize: iconSize * 0.6 }} />
        </Box>
      )}

      <Box sx={{ flex: 1 }}>
        <Typography variant={size === 'small' ? 'body2' : 'body1'} fontWeight={500}>
          {label}
        </Typography>
        {details && (
          <Typography variant="caption" color="text.secondary">
            {details}
          </Typography>
        )}
      </Box>

      {showBadge && (
        <Chip
          label={status}
          size="small"
          sx={{
            backgroundColor: config.backgroundColor,
            color: config.color,
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '10px',
            height: 24,
          }}
        />
      )}
    </Box>
  )
}
```

### `/frontend/src/components/StatCard.jsx`

```javascript
import { Card, CardContent, Box, Typography } from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'

export default function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  color = 'primary',
  loading = false,
}) {
  const trendValue = trend ? parseFloat(trend.replace(/[^0-9.-]/g, '')) : 0
  const isPositive = trendValue >= 0

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${
          color === 'success'
            ? 'rgba(115, 191, 105, 0.05)'
            : color === 'error'
            ? 'rgba(242, 73, 92, 0.05)'
            : 'rgba(139, 92, 246, 0.05)'
        } 0%, transparent 100%)`,
        borderLeft: `3px solid ${
          color === 'success'
            ? '#73BF69'
            : color === 'error'
            ? '#F2495C'
            : '#8B5CF6'
        }`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                fontSize: '11px',
                color: 'text.secondary',
                fontWeight: 600,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontSize: '36px',
                fontWeight: 500,
                marginTop: 1,
                color:
                  color === 'success'
                    ? '#73BF69'
                    : color === 'error'
                    ? '#F2495C'
                    : 'text.primary',
              }}
            >
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, marginTop: 1 }}>
                {isPositive ? (
                  <TrendingUp sx={{ fontSize: 16, color: '#73BF69' }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: '#F2495C' }} />
                )}
                <Typography
                  variant="caption"
                  sx={{ color: isPositive ? '#73BF69' : '#F2495C' }}
                >
                  {trend} from yesterday
                </Typography>
              </Box>
            )}
          </Box>
          {Icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ fontSize: 24, opacity: 0.7 }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
```

### `/frontend/src/components/EmptyState.jsx`

```javascript
import { Box, Typography, Button } from '@mui/material'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  actionIcon: ActionIcon,
}) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        padding: { xs: '60px 20px', md: '80px 40px' },
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 3,
        border: '1px dashed rgba(255,255,255,0.1)',
      }}
    >
      {Icon && (
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Icon sx={{ fontSize: 32, color: '#8B5CF6' }} />
        </Box>
      )}

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
        sx={{
          marginBottom: action ? 3 : 0,
          maxWidth: 400,
          margin: action ? '0 auto 24px' : '0 auto',
        }}
      >
        {description}
      </Typography>

      {action && (
        <Button
          variant="contained"
          size="large"
          onClick={action}
          startIcon={ActionIcon && <ActionIcon />}
          sx={{
            borderRadius: '20px',
            padding: '10px 24px',
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}
```

### `/frontend/src/components/CommitCard.jsx`

```javascript
import { useState } from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Visibility as VisibilityIcon,
  Restore as RestoreIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as CopyIcon,
  Tag as TagIcon,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'

export default function CommitCard({ commit, onViewDiff, onRestore }) {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleCopyHash = () => {
    navigator.clipboard.writeText(commit.hash)
    handleMenuClose()
  }

  return (
    <Card
      sx={{
        marginBottom: 2,
        borderLeft: `4px solid ${
          commit.type === 'auto' ? '#5794F2' : '#8B5CF6'
        }`,
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontSize="14px" fontWeight={600}>
              {commit.message}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(new Date(commit.date))} ago
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, marginBottom: 1.5 }}>
          <Chip
            label={commit.type}
            size="small"
            sx={{
              backgroundColor:
                commit.type === 'auto'
                  ? 'rgba(87, 148, 242, 0.1)'
                  : 'rgba(139, 92, 246, 0.1)',
              color: commit.type === 'auto' ? '#5794F2' : '#8B5CF6',
              fontWeight: 500,
            }}
          />
          <Chip label={commit.author} size="small" variant="outlined" />
          <Chip
            label={commit.shortHash}
            size="small"
            variant="outlined"
            sx={{ fontFamily: 'monospace', fontSize: '11px' }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
          <Typography variant="caption" sx={{ color: '#73BF69' }}>
            +{commit.additions || 0}
          </Typography>
          <Typography variant="caption" sx={{ color: '#F2495C' }}>
            -{commit.deletions || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {commit.files || 0} {commit.files === 1 ? 'file' : 'files'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => onViewDiff(commit)}
          >
            View Diff
          </Button>
          <Button
            size="small"
            startIcon={<RestoreIcon />}
            onClick={() => onRestore(commit)}
          >
            Restore
          </Button>
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </CardContent>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleCopyHash}>
          <CopyIcon sx={{ marginRight: 1, fontSize: 18 }} />
          Copy Hash
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <TagIcon sx={{ marginRight: 1, fontSize: 18 }} />
          Create Tag
        </MenuItem>
      </Menu>
    </Card>
  )
}
```

---

## Dashboard Redesign

### `/frontend/src/pages/Dashboard.jsx` (Versão Melhorada)

```javascript
import { useState, useEffect } from 'react'
import { Box, Grid, Typography, Button, Alert, CircularProgress } from '@mui/material'
import { Backup as BackupIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { formatDistanceToNow } from 'date-fns'

// Componentes novos
import StatCard from '../components/StatCard'
import StatusIndicator from '../components/StatusIndicator'
import EmptyState from '../components/EmptyState'
import ReliabilityTimeline from '../components/ReliabilityTimeline'

export default function Dashboard() {
  const { t } = useTranslation()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [backing, setBacking] = useState(false)
  const [error, setError] = useState(null)

  const fetchStatus = async () => {
    try {
      const response = await api.status.get()
      setStatus(response.data.status)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleBackupNow = async () => {
    setBacking(true)
    try {
      await api.backup.now()
      await fetchStatus()
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBacking(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!status?.lastCommit) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">{t('dashboard.title')}</Typography>
        </Box>

        <EmptyState
          icon={BackupIcon}
          title="No backups yet"
          description="HomeGuardian will automatically create commits when files change in your Home Assistant configuration. You can also create your first backup manually."
          action={handleBackupNow}
          actionLabel="Create first backup"
          actionIcon={BackupIcon}
        />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('dashboard.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of your Home Assistant configuration backups
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={backing ? <CircularProgress size={20} /> : <BackupIcon />}
          onClick={handleBackupNow}
          disabled={backing}
          sx={{ borderRadius: '20px', padding: '10px 24px' }}
        >
          {t('dashboard.backupNow')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Repository Health"
            value={status?.git?.isClean ? 'Healthy' : 'Modified'}
            color={status?.git?.isClean ? 'success' : 'warning'}
            trend={status?.git?.isClean ? '+5%' : '-2%'}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <StatCard
            title="Commits Today"
            value={status?.stats?.commitsToday || 0}
            trend="+20%"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <StatCard
            title="Backup Success Rate"
            value="99.8%"
            color="success"
            trend="↑ 0.2%"
          />
        </Grid>
      </Grid>

      {/* Status Grid */}
      <Grid container spacing={3} mb={4}>
        {/* Git Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontSize="14px" fontWeight={600}>
                {t('dashboard.gitStatus')}
              </Typography>

              <StatusIndicator
                status={status?.git?.isClean ? 'success' : 'warning'}
                label={status?.git?.isClean ? 'Clean' : 'Modified'}
                details={
                  status?.git?.isClean
                    ? 'No uncommitted changes'
                    : `${status?.git?.modified?.length || 0} modified, ${
                        status?.git?.created?.length || 0
                      } created`
                }
              />
            </CardContent>
          </Card>
        </Grid>

        {/* File Watcher */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontSize="14px" fontWeight={600}>
                {t('dashboard.fileWatcher')}
              </Typography>

              <StatusIndicator
                status={status?.watcher?.isRunning ? 'success' : 'error'}
                label={
                  status?.watcher?.isRunning ? 'Running' : 'Stopped'
                }
                details={
                  status?.watcher?.changedFiles?.length > 0
                    ? `${status.watcher.changedFiles.length} files pending`
                    : 'No pending changes'
                }
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Last Backup */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontSize="14px" fontWeight={600}>
                {t('dashboard.lastBackup')}
              </Typography>

              <Box mt={2}>
                <Typography variant="body2" fontWeight={500}>
                  {status.lastCommit.message}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  {formatDistanceToNow(new Date(status.lastCommit.date), {
                    addSuffix: true,
                  })}
                </Typography>
                <Chip
                  label={status.lastCommit.shortHash}
                  size="small"
                  variant="outlined"
                  sx={{ marginTop: 1, fontFamily: 'monospace', fontSize: '11px' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Remote Sync */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontSize="14px" fontWeight={600}>
                {t('dashboard.remoteSync')}
              </Typography>

              <StatusIndicator
                status={status?.remote?.configured ? 'success' : 'warning'}
                label={
                  status?.remote?.configured ? 'Configured' : 'Not Configured'
                }
                details={
                  status?.remote?.configured
                    ? `${status.remote.pendingPushes || 0} pending pushes`
                    : 'Set up remote sync in Settings'
                }
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reliability Timeline */}
      <ReliabilityTimeline days={90} />
    </Box>
  )
}
```

---

## History View Redesign

### `/frontend/src/pages/History.jsx` (Versão Melhorada)

```javascript
import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

import CommitCard from '../components/CommitCard'
import CommitTimeline from '../components/CommitTimeline'
import EmptyState from '../components/EmptyState'
import DiffDialog from '../components/DiffDialog'
import { History as HistoryIcon } from '@mui/icons-material'

export default function History() {
  const { t } = useTranslation()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCommit, setSelectedCommit] = useState(null)
  const [diffOpen, setDiffOpen] = useState(false)
  const [diff, setDiff] = useState(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('7d')
  const [authorFilter, setAuthorFilter] = useState('all')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'timeline'

  useEffect(() => {
    fetchHistory()
  }, [dateRange, authorFilter])

  const fetchHistory = async () => {
    try {
      const response = await api.history.list(50, 0)
      setHistory(response.data.history)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDiff = async (commit) => {
    try {
      setSelectedCommit(commit)
      const response = await api.history.getCommit(commit.hash)
      setDiff(response.data.diff)
      setDiffOpen(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRestore = async (commit) => {
    // Implementar restore
    console.log('Restore', commit)
  }

  const handleCloseDiff = () => {
    setDiffOpen(false)
    setSelectedCommit(null)
    setDiff(null)
  }

  const filteredHistory = history.filter((commit) => {
    if (searchQuery && !commit.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (authorFilter !== 'all' && commit.author !== authorFilter) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (history.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          {t('history.title')}
        </Typography>
        <EmptyState
          icon={HistoryIcon}
          title="No commit history"
          description="Your commit history will appear here once you create your first backup."
        />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {t('history.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and restore previous versions of your configuration
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, marginBottom: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search commits..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={dateRange}
            label="Time Range"
            onChange={(e) => setDateRange(e.target.value)}
          >
            <MenuItem value="24h">Last 24 hours</MenuItem>
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="all">All time</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Author</InputLabel>
          <Select
            value={authorFilter}
            label="Author"
            onChange={(e) => setAuthorFilter(e.target.value)}
          >
            <MenuItem value="all">All authors</MenuItem>
            <MenuItem value="homeguardian">HomeGuardian</MenuItem>
            <MenuItem value="manual">Manual commits</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>View</InputLabel>
          <Select
            value={viewMode}
            label="View"
            onChange={(e) => setViewMode(e.target.value)}
          >
            <MenuItem value="list">List</MenuItem>
            <MenuItem value="timeline">Timeline</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Commit List/Timeline */}
      {viewMode === 'timeline' ? (
        <CommitTimeline
          commits={filteredHistory}
          onViewDiff={handleViewDiff}
          onRestore={handleRestore}
        />
      ) : (
        <Box>
          {filteredHistory.map((commit) => (
            <CommitCard
              key={commit.hash}
              commit={commit}
              onViewDiff={handleViewDiff}
              onRestore={handleRestore}
            />
          ))}
        </Box>
      )}

      {/* Diff Dialog */}
      <DiffDialog
        open={diffOpen}
        commit={selectedCommit}
        diff={diff}
        onClose={handleCloseDiff}
      />
    </Box>
  )
}
```

---

## Keyboard Shortcuts

### `/frontend/src/hooks/useKeyboardShortcuts.js`

```javascript
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export default function useKeyboardShortcuts({ onBackupNow, onPush, onRefresh }) {
  const navigate = useNavigate()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [sequenceBuffer, setSequenceBuffer] = useState([])

  const handleKeySequence = useCallback(
    (keys) => {
      const sequence = keys.join(' ')

      switch (sequence) {
        case 'g d':
          navigate('/')
          break
        case 'g h':
          navigate('/history')
          break
        case 'g i':
          navigate('/items')
          break
        case 'g s':
          navigate('/settings')
          break
        default:
          break
      }

      setSequenceBuffer([])
    },
    [navigate]
  )

  useEffect(() => {
    let timeout

    const handleKeyDown = (e) => {
      // Command Palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
        return
      }

      // Escape: Close command palette
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
        setSequenceBuffer([])
        return
      }

      // Single key commands (when not in input)
      if (
        !e.target.matches('input, textarea, [contenteditable]') &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            onBackupNow?.()
            break
          case 'p':
            e.preventDefault()
            onPush?.()
            break
          case 'r':
            e.preventDefault()
            onRefresh?.()
            break
          case '/':
            e.preventDefault()
            setCommandPaletteOpen(true)
            break
          case 'g':
            e.preventDefault()
            setSequenceBuffer(['g'])
            // Wait for second key
            timeout = setTimeout(() => setSequenceBuffer([]), 1000)
            break
          case 'd':
          case 'h':
          case 'i':
          case 's':
            if (sequenceBuffer[0] === 'g') {
              e.preventDefault()
              handleKeySequence(['g', e.key])
              clearTimeout(timeout)
            }
            break
          default:
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeout)
    }
  }, [sequenceBuffer, handleKeySequence, onBackupNow, onPush, onRefresh])

  return { commandPaletteOpen, setCommandPaletteOpen }
}
```

### `/frontend/src/components/CommandPalette.jsx`

```javascript
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  Box,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Typography,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  ViewList as ViewListIcon,
  Settings as SettingsIcon,
  Backup as BackupIcon,
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material'

export default function CommandPalette({ open, onClose, onBackupNow, onPush, onRefresh }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  const commands = [
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      icon: DashboardIcon,
      action: () => navigate('/'),
      shortcut: 'G D',
      category: 'Navigation',
    },
    {
      id: 'nav-history',
      label: 'Go to History',
      icon: HistoryIcon,
      action: () => navigate('/history'),
      shortcut: 'G H',
      category: 'Navigation',
    },
    {
      id: 'nav-items',
      label: 'Go to Items',
      icon: ViewListIcon,
      action: () => navigate('/items'),
      shortcut: 'G I',
      category: 'Navigation',
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      icon: SettingsIcon,
      action: () => navigate('/settings'),
      shortcut: 'G S',
      category: 'Navigation',
    },
    {
      id: 'backup-now',
      label: 'Backup Now',
      icon: BackupIcon,
      action: onBackupNow,
      shortcut: 'B',
      category: 'Actions',
    },
    {
      id: 'push-remote',
      label: 'Push to Remote',
      icon: CloudUploadIcon,
      action: onPush,
      shortcut: 'P',
      category: 'Actions',
    },
    {
      id: 'refresh',
      label: 'Refresh Status',
      icon: RefreshIcon,
      action: onRefresh,
      shortcut: 'R',
      category: 'Actions',
    },
  ]

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (query) {
      const filtered = commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.category.toLowerCase().includes(query.toLowerCase())
      )
      setResults(filtered)
    } else {
      setResults(commands)
    }
    setSelectedIndex(0)
  }, [query])

  const executeCommand = (command) => {
    command.action()
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      executeCommand(results[selectedIndex])
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'rgba(19, 21, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '80vh',
        },
      }}
    >
      <Box sx={{ padding: 2 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Type a command or search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
          InputProps={{
            startAdornment: <SearchIcon sx={{ marginRight: 1.5, opacity: 0.5 }} />,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.05)',
              fontSize: '16px',
              '& fieldset': { border: 'none' },
            },
          }}
        />
      </Box>

      <List sx={{ maxHeight: 400, overflow: 'auto', padding: '0 8px 8px' }}>
        {results.length === 0 ? (
          <Box sx={{ textAlign: 'center', padding: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No commands found
            </Typography>
          </Box>
        ) : (
          results.map((cmd, index) => {
            const Icon = cmd.icon
            return (
              <ListItemButton
                key={cmd.id}
                onClick={() => executeCommand(cmd)}
                selected={index === selectedIndex}
                sx={{
                  padding: '12px 16px',
                  borderRadius: 2,
                  marginBottom: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={cmd.label}
                  secondary={cmd.category}
                  primaryTypographyProps={{
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '12px',
                  }}
                />
                {cmd.shortcut && (
                  <Chip
                    label={cmd.shortcut}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      fontSize: '11px',
                      height: 24,
                      fontFamily: 'monospace',
                    }}
                  />
                )}
              </ListItemButton>
            )
          })
        )}
      </List>

      <Box
        sx={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 16px',
          display: 'flex',
          gap: 2,
          fontSize: '11px',
          color: 'text.secondary',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip label="↑↓" size="small" sx={{ height: 20, fontSize: '10px' }} />
          <Typography variant="caption">Navigate</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip label="↵" size="small" sx={{ height: 20, fontSize: '10px' }} />
          <Typography variant="caption">Select</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip label="ESC" size="small" sx={{ height: 20, fontSize: '10px' }} />
          <Typography variant="caption">Close</Typography>
        </Box>
      </Box>
    </Dialog>
  )
}
```

---

## Animações e Transições

### `/frontend/src/utils/animations.js`

```javascript
// Framer Motion variants para animações consistentes

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

export const slideDown = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const listItem = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

// Exemplo de uso com Framer Motion:
// import { motion } from 'framer-motion'
// import { fadeIn, staggerContainer, listItem } from '../utils/animations'
//
// <motion.div
//   variants={staggerContainer}
//   initial="hidden"
//   animate="visible"
// >
//   {items.map(item => (
//     <motion.div key={item.id} variants={listItem}>
//       {item.content}
//     </motion.div>
//   ))}
// </motion.div>
```

---

## Checklist de Implementação

### Fase 1: Setup Básico
- [ ] Instalar dependências necessárias (`framer-motion`, `react-syntax-highlighter`)
- [ ] Criar novo theme system em `/frontend/src/theme/index.js`
- [ ] Atualizar `App.jsx` para usar novo theme
- [ ] Testar theme em dark/light mode

### Fase 2: Componentes Base
- [ ] Criar `StatusIndicator.jsx`
- [ ] Criar `StatCard.jsx`
- [ ] Criar `EmptyState.jsx`
- [ ] Criar `CommitCard.jsx`
- [ ] Testar todos os componentes isoladamente

### Fase 3: Dashboard
- [ ] Atualizar `Dashboard.jsx` com novo layout
- [ ] Implementar stat cards
- [ ] Implementar status indicators
- [ ] Adicionar empty state
- [ ] Testar responsividade

### Fase 4: History
- [ ] Atualizar `History.jsx` com filtros
- [ ] Implementar `CommitTimeline.jsx`
- [ ] Melhorar `DiffViewer.jsx` com syntax highlighting
- [ ] Adicionar view modes (list/timeline)

### Fase 5: Keyboard Shortcuts
- [ ] Implementar `useKeyboardShortcuts` hook
- [ ] Criar `CommandPalette.jsx`
- [ ] Adicionar tooltips com shortcuts em botões
- [ ] Testar todas as combinações de teclas

### Fase 6: Polish
- [ ] Adicionar animações com Framer Motion
- [ ] Implementar loading skeletons
- [ ] Adicionar toast notifications
- [ ] Testes de acessibilidade (WCAG)
- [ ] Otimização de performance

---

**Última atualização:** 2025-11-08
