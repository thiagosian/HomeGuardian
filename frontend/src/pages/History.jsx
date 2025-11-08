import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Eye, Loader2 } from 'lucide-react'
import { api } from '../api/client'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import DiffViewer from '../components/DiffViewer'

export default function History() {
  const { t } = useTranslation()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCommit, setSelectedCommit] = useState(null)
  const [diffOpen, setDiffOpen] = useState(false)
  const [diff, setDiff] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

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

  const handleCloseDiff = () => {
    setDiffOpen(false)
    setSelectedCommit(null)
    setDiff(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('history.title')}</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {history.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {t('history.noHistory')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((commit) => (
            <Card key={commit.hash} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {commit.message}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs text-muted-foreground font-mono">
                        {commit.shortHash} • {commit.author}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(commit.date), 'PPpp')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDiff(commit)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diff Dialog */}
      <Dialog open={diffOpen} onOpenChange={setDiffOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCommit?.message}</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {selectedCommit?.shortHash} • {selectedCommit?.author}
            </DialogDescription>
          </DialogHeader>
          {diff && <DiffViewer diff={diff} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
