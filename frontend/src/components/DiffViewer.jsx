import { Box, Typography } from '@mui/material'

export default function DiffViewer({ diff }) {
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
      return { backgroundColor: '#e6ffed', color: '#24292e' }
    } else if (line.startsWith('-')) {
      return { backgroundColor: '#ffeef0', color: '#24292e' }
    } else if (line.startsWith('@@')) {
      return { backgroundColor: '#f1f8ff', color: '#6a737d' }
    }
    return { color: '#24292e' }
  }

  return (
    <Box
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        backgroundColor: '#f6f8fa',
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
