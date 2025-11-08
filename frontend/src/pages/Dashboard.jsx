import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import {
  HardDrive,
  CheckCircle2,
  AlertCircle,
  CloudCheck,
  Loader2
} from 'lucide-react'
import { api } from '../api/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'

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
    const interval = setInterval(fetchStatus, 5000) // Refresh every 5 seconds
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
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <Button
          onClick={handleBackupNow}
          disabled={backing}
          size="lg"
        >
          {backing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <HardDrive className="mr-2 h-4 w-4" />
          )}
          {t('dashboard.backupNow')}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Git Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.gitStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mt-2">
              {status?.git?.isClean ? (
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
              )}
              <p className="text-sm font-medium">
                {status?.git?.isClean ? t('dashboard.clean') : t('dashboard.modified')}
              </p>
            </div>
            {!status?.git?.isClean && (
              <div className="mt-4 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Modified: {status?.git?.modified?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Created: {status?.git?.created?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Deleted: {status?.git?.deleted?.length || 0}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Watcher Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.fileWatcher')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mt-2">
              <Badge variant={status?.watcher?.isRunning ? 'success' : 'secondary'}>
                {status?.watcher?.isRunning
                  ? t('dashboard.running')
                  : t('dashboard.stopped')}
              </Badge>
            </div>
            {status?.watcher?.changedFiles?.length > 0 && (
              <p className="text-sm text-muted-foreground mt-4">
                Changed files: {status.watcher.changedFiles.length}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Last Backup */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.lastBackup')}</CardTitle>
          </CardHeader>
          <CardContent>
            {status?.lastCommit ? (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {status.lastCommit.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(status.lastCommit.date), {
                    addSuffix: true,
                  })}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {status.lastCommit.shortHash}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                No backups yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Remote Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.remoteSync')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mt-2">
              {status?.remote?.configured ? (
                <>
                  <CloudCheck className="mr-2 h-5 w-5 text-green-500" />
                  <p className="text-sm font-medium">{t('dashboard.configured')}</p>
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
                  <p className="text-sm font-medium">{t('dashboard.notConfigured')}</p>
                </>
              )}
            </div>
            {status?.remote?.configured && (
              <div className="mt-4 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Pending pushes: {status.remote.pendingPushes || 0}
                </p>
                {status.remote.lastPush && (
                  <p className="text-xs text-muted-foreground">
                    Last push:{' '}
                    {formatDistanceToNow(new Date(status.remote.lastPush), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
