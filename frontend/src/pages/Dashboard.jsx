import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
  Alert,
} from '@mui/material'
import {
  Backup as BackupIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CloudDone as CloudDoneIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { formatDistanceToNow } from 'date-fns'

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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('dashboard.title')}</Typography>
        <Button
          variant="contained"
          startIcon={backing ? <CircularProgress size={20} /> : <BackupIcon />}
          onClick={handleBackupNow}
          disabled={backing}
        >
          {t('dashboard.backupNow')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Git Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.gitStatus')}
              </Typography>
              <Box display="flex" alignItems="center" mt={2}>
                {status?.git?.isClean ? (
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                ) : (
                  <ErrorIcon color="warning" sx={{ mr: 1 }} />
                )}
                <Typography>
                  {status?.git?.isClean ? t('dashboard.clean') : t('dashboard.modified')}
                </Typography>
              </Box>
              {!status?.git?.isClean && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Modified: {status?.git?.modified?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {status?.git?.created?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Deleted: {status?.git?.deleted?.length || 0}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* File Watcher Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.fileWatcher')}
              </Typography>
              <Box display="flex" alignItems="center" mt={2}>
                <Chip
                  label={
                    status?.watcher?.isRunning
                      ? t('dashboard.running')
                      : t('dashboard.stopped')
                  }
                  color={status?.watcher?.isRunning ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              {status?.watcher?.changedFiles?.length > 0 && (
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Changed files: {status.watcher.changedFiles.length}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Last Backup */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.lastBackup')}
              </Typography>
              {status?.lastCommit ? (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    {status.lastCommit.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(status.lastCommit.date), {
                      addSuffix: true,
                    })}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mt={1}
                  >
                    {status.lastCommit.shortHash}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" mt={2}>
                  No backups yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Remote Sync Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.remoteSync')}
              </Typography>
              <Box display="flex" alignItems="center" mt={2}>
                {status?.remote?.configured ? (
                  <>
                    <CloudDoneIcon color="success" sx={{ mr: 1 }} />
                    <Typography>{t('dashboard.configured')}</Typography>
                  </>
                ) : (
                  <>
                    <ErrorIcon color="warning" sx={{ mr: 1 }} />
                    <Typography>{t('dashboard.notConfigured')}</Typography>
                  </>
                )}
              </Box>
              {status?.remote?.configured && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Pending pushes: {status.remote.pendingPushes || 0}
                  </Typography>
                  {status.remote.lastPush && (
                    <Typography variant="caption" color="text.secondary">
                      Last push:{' '}
                      {formatDistanceToNow(new Date(status.remote.lastPush), {
                        addSuffix: true,
                      })}
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
