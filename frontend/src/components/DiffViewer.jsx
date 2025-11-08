import { Box, Typography, useTheme } from '@mui/material'

export default function DiffViewer({ diff }) {
  const theme = useTheme()

  if (!diff) {
    return (
      <Typography variant="body2" color="text.secondary">
        No changes to display
      </Typography>
    )
  }

  // Parse and render the diff
  const lines = diff.split('\n')

  const getLineStyle = (line) => {
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
          key={index}
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
}
