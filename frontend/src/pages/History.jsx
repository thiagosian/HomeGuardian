import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  Alert,
} from '@mui/material'
import {
  Visibility as VisibilityIcon,
  Restore as RestoreIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { format } from 'date-fns'
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('history.title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {history.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary">
              {t('history.noHistory')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {history.map((commit) => (
            <Card key={commit.hash} sx={{ mb: 2 }}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={() => handleViewDiff(commit)}
                      sx={{ mr: 1 }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={commit.message}
                  secondary={
                    <>
                      <Typography variant="caption" display="block">
                        {commit.shortHash} • {commit.author}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(commit.date), 'PPpp')}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </List>
      )}

      {/* Diff Dialog */}
      <Dialog
        open={diffOpen}
        onClose={handleCloseDiff}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedCommit?.message}
            </Typography>
            <IconButton onClick={handleCloseDiff}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {selectedCommit?.shortHash} • {selectedCommit?.author}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {diff && <DiffViewer diff={diff} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDiff}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
