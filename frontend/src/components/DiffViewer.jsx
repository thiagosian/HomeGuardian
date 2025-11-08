import { useMemo, useCallback, memo } from 'react'
import { Alert, AlertDescription } from './ui/alert'
import { AlertCircle } from 'lucide-react'

const DiffViewer = memo(function DiffViewer({ diff }) {
  // Memoize line parsing
  const lines = useMemo(() => {
    if (!diff) return []
    return diff.split('\n')
  }, [diff])

  // Memoize getLineStyle function
  const getLineClassName = useCallback((line) => {
    if (line.startsWith('+')) {
      return 'bg-green-500/10 text-green-400'
    } else if (line.startsWith('-')) {
      return 'bg-red-500/10 text-red-400'
    } else if (line.startsWith('@@')) {
      return 'bg-blue-500/10 text-blue-400 font-semibold'
    }
    return 'text-foreground'
  }, [])

  if (!diff) {
    return (
      <p className="text-sm text-muted-foreground">
        No changes to display
      </p>
    )
  }

  // Warn for very large diffs and show first 1000 lines
  if (lines.length > 1000) {
    return (
      <div className="space-y-3">
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Large diff detected ({lines.length} lines). Showing first 1000 lines to prevent performance issues.
          </AlertDescription>
        </Alert>
        <div className="font-mono text-sm bg-card border rounded-lg p-4 overflow-x-auto">
          {lines.slice(0, 1000).map((line, index) => (
            <div
              key={`line-${index}`}
              className={`px-2 whitespace-pre-wrap break-all ${getLineClassName(line)}`}
            >
              {line || ' '}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="font-mono text-sm bg-card border rounded-lg p-4 overflow-x-auto">
      {lines.map((line, index) => (
        <div
          key={`line-${index}`}
          className={`px-2 whitespace-pre-wrap break-all ${getLineClassName(line)}`}
        >
          {line || ' '}
        </div>
      ))}
    </div>
  )
})

export default DiffViewer
