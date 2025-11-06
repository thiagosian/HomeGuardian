import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Alert,
  IconButton,
  Snackbar,
} from '@mui/material'
import {
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const [settings, setSettings] = useState({})
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [formData, setFormData] = useState({
    remoteUrl: '',
    authType: 'ssh',
    token: '',
  })

  useEffect(() => {
    fetchSettings()
    fetchPublicKey()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.settings.getAll()
      setSettings(response.data.settings)
      setFormData({
        remoteUrl: response.data.settings.remote_url || '',
        authType: response.data.settings.auth_type || 'ssh',
        token: '',
      })
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPublicKey = async () => {
    try {
      const response = await api.settings.getPublicKey()
      if (response.data.success) {
        setPublicKey(response.data.publicKey)
      }
    } catch (err) {
      // Key doesn't exist yet, that's okay
    }
  }

  const handleGenerateKey = async () => {
    try {
      setSaving(true)
      const response = await api.settings.generateSSH()
      setPublicKey(response.data.publicKey)
      setSuccess('SSH key generated successfully')
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(publicKey)
    setSuccess('Key copied to clipboard')
  }

  const handleTestConnection = async () => {
    try {
      setSaving(true)
      const response = await api.settings.testRemote()
      if (response.data.success) {
        setSuccess('Connection successful')
        setError(null)
      } else {
        setError('Connection failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRemote = async () => {
    try {
      setSaving(true)
      await api.settings.configureRemote(
        formData.remoteUrl,
        formData.authType,
        formData.token
      )
      setSuccess('Remote repository configured')
      setError(null)
      await fetchSettings()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePush = async () => {
    try {
      setSaving(true)
      await api.settings.pushToRemote()
      setSuccess('Pushed to remote successfully')
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangeLanguage = (event) => {
    i18n.changeLanguage(event.target.value)
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
        {t('settings.title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        message={success}
      />

      {/* General Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('settings.general')}
          </Typography>

          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={i18n.language}
                  label="Language"
                  onChange={handleChangeLanguage}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="pt">Português</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Remote Repository Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('settings.remote')}
          </Typography>

          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              {t('settings.authType')}
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={formData.authType}
                onChange={(e) =>
                  setFormData({ ...formData, authType: e.target.value })
                }
              >
                <MenuItem value="ssh">{t('settings.ssh')}</MenuItem>
                <MenuItem value="token">{t('settings.token')}</MenuItem>
              </Select>
            </FormControl>

            {formData.authType === 'ssh' && (
              <Box mb={3}>
                <Button
                  variant="outlined"
                  onClick={handleGenerateKey}
                  disabled={saving || !!publicKey}
                  sx={{ mb: 2 }}
                >
                  {t('settings.generateKey')}
                </Button>

                {publicKey && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('settings.publicKey')}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={publicKey}
                        InputProps={{ readOnly: true }}
                        sx={{ mr: 1 }}
                      />
                      <IconButton onClick={handleCopyKey}>
                        <ContentCopyIcon />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {formData.authType === 'token' && (
              <TextField
                fullWidth
                label={t('settings.token')}
                type="password"
                value={formData.token}
                onChange={(e) =>
                  setFormData({ ...formData, token: e.target.value })
                }
                sx={{ mb: 2 }}
              />
            )}

            <TextField
              fullWidth
              label={t('settings.remoteUrl')}
              value={formData.remoteUrl}
              onChange={(e) =>
                setFormData({ ...formData, remoteUrl: e.target.value })
              }
              placeholder="git@github.com:username/repo.git"
              sx={{ mb: 2 }}
            />

            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                onClick={handleSaveRemote}
                disabled={saving || !formData.remoteUrl}
              >
                {t('settings.save')}
              </Button>
              <Button
                variant="outlined"
                onClick={handleTestConnection}
                disabled={saving || !settings.remote_url}
              >
                {t('settings.testConnection')}
              </Button>
              <Button
                variant="outlined"
                onClick={handlePush}
                disabled={saving || !settings.remote_url}
              >
                Push Now
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
