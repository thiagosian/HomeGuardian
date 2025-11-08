import { useMemo, useCallback, memo } from 'react'
import { Box, Typography, useTheme, Alert } from '@mui/material'

const DiffViewer = memo(function DiffViewer({ diff }) {
  const theme = useTheme()

  // Memoize line parsing
  const lines = useMemo(() => {
    if (!diff) return []
    return diff.split('\n')
  }, [diff])

  // Memoize getLineStyle function
  const getLineStyle = useCallback((line) => {
    if (line.startsWith('+')) {
      return {
        backgroundColor: theme.palette.diff.addedBg,
        color: theme.palette.diff.addedText,
      }
    } else if (line.startsWith('-')) {
      return {
        backgroundColor: theme.palette.diff.removedBg,
        color: theme.palette.diff.removedText,
      }
    } else if (line.startsWith('@@')) {
      return {
        backgroundColor: theme.palette.diff.headerBg,
        color: theme.palette.diff.headerText,
      }
    }
    return { color: theme.palette.text.primary }
  }, [theme])

  if (!diff) {
    return (
      <Typography variant="body2" color="text.secondary">
        No changes to display
      </Typography>
    )
  }

  // Warn for very large diffs and show first 1000 lines
  if (lines.length > 1000) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Large diff detected ({lines.length} lines). Showing first 1000 lines to prevent performance issues.
        </Alert>
        <Box
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            backgroundColor: theme.palette.diff.viewerBg,
            borderRadius: 1,
            p: 2,
            overflowX: 'auto',
          }}
        >
          {lines.slice(0, 1000).map((line, index) => (
            <Box
              key={`line-${index}`}
              sx={{
                ...getLineStyle(line),
                px: 1,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {line || ' '}
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        backgroundColor: theme.palette.diff.viewerBg,
        borderRadius: 1,
        p: 2,
        overflowX: 'auto',
      }}
    >
      {lines.map((line, index) => (
        <Box
          key={`line-${index}`}
          sx={{
            ...getLineStyle(line),
            px: 1,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {line || ' '}
        </Box>
      ))}
    </Box>
  )
})

export default DiffViewer
