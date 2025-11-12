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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor your Home Assistant backups</p>
        </div>
        <Button
          onClick={handleBackupNow}
          disabled={backing}
          size="lg"
          className="shadow-sm"
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
        <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
        {/* Git Status */}
        <Card className="group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status?.git?.isClean ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              {t('dashboard.gitStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium">
                  {status?.git?.isClean ? t('dashboard.clean') : t('dashboard.modified')}
                </span>
              </div>
              {!status?.git?.isClean && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Modified:</span>
                    <span className="font-medium">{status?.git?.modified?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">{status?.git?.created?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deleted:</span>
                    <span className="font-medium">{status?.git?.deleted?.length || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Watcher Status */}
        <Card className="group">
          <CardHeader>
            <CardTitle>{t('dashboard.fileWatcher')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Badge
                variant={status?.watcher?.isRunning ? 'success' : 'secondary'}
                className="text-sm px-3 py-1"
              >
                {status?.watcher?.isRunning
                  ? t('dashboard.running')
                  : t('dashboard.stopped')}
              </Badge>
              {status?.watcher?.changedFiles?.length > 0 && (
                <div className="pt-2 border-t border-border/40">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Changed files:</span>
                    <span className="font-medium">{status.watcher.changedFiles.length}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Last Backup */}
        <Card className="group">
          <CardHeader>
            <CardTitle>{t('dashboard.lastBackup')}</CardTitle>
          </CardHeader>
          <CardContent>
            {status?.lastCommit ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">
                  {status.lastCommit.message}
                </p>
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">When:</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(status.lastCommit.date), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hash:</span>
                    <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      {status.lastCommit.shortHash}
                    </code>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No backups yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Remote Sync Status */}
        <Card className="group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status?.remote?.configured ? (
                <CloudCheck className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              {t('dashboard.remoteSync')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <span className="text-base font-medium">
                {status?.remote?.configured ? t('dashboard.configured') : t('dashboard.notConfigured')}
              </span>
              {status?.remote?.configured && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending pushes:</span>
                    <span className="font-medium">{status.remote.pendingPushes || 0}</span>
                  </div>
                  {status.remote.lastPush && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last push:</span>
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(status.remote.lastPush), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
