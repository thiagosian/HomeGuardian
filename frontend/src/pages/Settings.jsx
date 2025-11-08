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
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
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
import { useTheme as useAppTheme } from '../contexts/ThemeContext'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { currentTheme, setTheme } = useAppTheme()
  const [settings, setSettings] = useState({})
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // General settings
  const [logLevel, setLogLevel] = useState('info')

  // Backup & Commit settings
  const [autoCommitEnabled, setAutoCommitEnabled] = useState(true)
  const [autoCommitDebounce, setAutoCommitDebounce] = useState(60)
  const [scheduledBackupEnabled, setScheduledBackupEnabled] = useState(false)
  const [scheduledBackupTime, setScheduledBackupTime] = useState('03:00')
  const [gitUserName, setGitUserName] = useState('HomeGuardian')
  const [gitUserEmail, setGitUserEmail] = useState('homeguardian@homeassistant.local')

  // Parsing options
  const [parseEsphome, setParseEsphome] = useState(false)
  const [parsePackages, setParsePackages] = useState(false)
  const [backupLovelace, setBackupLovelace] = useState(true)
  const [excludeSecrets, setExcludeSecrets] = useState(true)

  // Remote repository settings
  const [remoteEnabled, setRemoteEnabled] = useState(false)
  const [autoPushEnabled, setAutoPushEnabled] = useState(false)
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
      const s = response.data.settings

      setSettings(s)

      // General settings
      setLogLevel(s.log_level || 'info')

      // Backup & Commit settings
      setAutoCommitEnabled(s.auto_commit_enabled !== 'false' && s.auto_commit_enabled !== false)
      setAutoCommitDebounce(parseInt(s.auto_commit_debounce) || 60)
      setScheduledBackupEnabled(s.scheduled_backup_enabled === 'true' || s.scheduled_backup_enabled === true)
      setScheduledBackupTime(s.scheduled_backup_time || '03:00')
      setGitUserName(s.git_user_name || 'HomeGuardian')
      setGitUserEmail(s.git_user_email || 'homeguardian@homeassistant.local')

      // Parsing options
      setParseEsphome(s.parse_esphome === 'true' || s.parse_esphome === true)
      setParsePackages(s.parse_packages === 'true' || s.parse_packages === true)
      setBackupLovelace(s.backup_lovelace !== 'false' && s.backup_lovelace !== false)
      setExcludeSecrets(s.exclude_secrets !== 'false' && s.exclude_secrets !== false)

      // Remote repository settings
      setRemoteEnabled(s.remote_enabled === 'true' || s.remote_enabled === true)
      setAutoPushEnabled(s.auto_push_enabled === 'true' || s.auto_push_enabled === true)
      setFormData({
        remoteUrl: s.remote_url || '',
        authType: s.auth_type || 'ssh',
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

  const handleSaveGeneralSettings = async () => {
    try {
      setSaving(true)

      await api.settings.update('log_level', logLevel, false)
      await api.settings.update('auto_commit_enabled', autoCommitEnabled.toString(), false)
      await api.settings.update('auto_commit_debounce', autoCommitDebounce.toString(), false)
      await api.settings.update('scheduled_backup_enabled', scheduledBackupEnabled.toString(), false)
      await api.settings.update('scheduled_backup_time', scheduledBackupTime, false)
      await api.settings.update('git_user_name', gitUserName, false)
      await api.settings.update('git_user_email', gitUserEmail, false)
      await api.settings.update('parse_esphome', parseEsphome.toString(), false)
      await api.settings.update('parse_packages', parsePackages.toString(), false)
      await api.settings.update('backup_lovelace', backupLovelace.toString(), false)
      await api.settings.update('exclude_secrets', excludeSecrets.toString(), false)
      await api.settings.update('remote_enabled', remoteEnabled.toString(), false)
      await api.settings.update('auto_push_enabled', autoPushEnabled.toString(), false)

      setSuccess(t('settings.save') + ' - ' + t('common.success'))
      setError(null)
      await fetchSettings()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
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

          <Grid container spacing={3} mt={1}>
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

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('settings.logLevel')}</InputLabel>
                <Select
                  value={logLevel}
                  label={t('settings.logLevel')}
                  onChange={(e) => setLogLevel(e.target.value)}
                >
                  <MenuItem value="debug">Debug</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
                <FormHelperText>{t('settings.logLevelDesc')}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={currentTheme}
                  label="Theme"
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <MenuItem value="classic">Classic</MenuItem>
                  <MenuItem value="modern">Modern</MenuItem>
                </Select>
                <FormHelperText>Choose your preferred UI theme</FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Backup & Commit Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('settings.backup')}
          </Typography>

          <Grid container spacing={3} mt={1}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoCommitEnabled}
                    onChange={(e) => setAutoCommitEnabled(e.target.checked)}
                  />
                }
                label={t('settings.autoCommit')}
              />
              <FormHelperText>{t('settings.autoCommitDesc')}</FormHelperText>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                {t('settings.autoCommitDebounce')}: {autoCommitDebounce}s
              </Typography>
              <Slider
                value={autoCommitDebounce}
                onChange={(e, value) => setAutoCommitDebounce(value)}
                min={10}
                max={300}
                step={10}
                marks
                valueLabelDisplay="auto"
                disabled={!autoCommitEnabled}
              />
              <FormHelperText>{t('settings.autoCommitDebounceDesc')}</FormHelperText>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={scheduledBackupEnabled}
                    onChange={(e) => setScheduledBackupEnabled(e.target.checked)}
                  />
                }
                label={t('settings.scheduledBackup')}
              />
              <FormHelperText>{t('settings.scheduledBackupDesc')}</FormHelperText>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('settings.scheduledBackupTime')}
                type="time"
                value={scheduledBackupTime}
                onChange={(e) => setScheduledBackupTime(e.target.value)}
                disabled={!scheduledBackupEnabled}
                helperText={t('settings.scheduledBackupTimeDesc')}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('settings.gitUserName')}
                value={gitUserName}
                onChange={(e) => setGitUserName(e.target.value)}
                helperText={t('settings.gitUserNameDesc')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('settings.gitUserEmail')}
                type="email"
                value={gitUserEmail}
                onChange={(e) => setGitUserEmail(e.target.value)}
                helperText={t('settings.gitUserEmailDesc')}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Parsing Options */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Parsing Options
          </Typography>

          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={parseEsphome}
                    onChange={(e) => setParseEsphome(e.target.checked)}
                  />
                }
                label={t('settings.parseEsphome')}
              />
              <FormHelperText>{t('settings.parseEsphomeDesc')}</FormHelperText>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={parsePackages}
                    onChange={(e) => setParsePackages(e.target.checked)}
                  />
                }
                label={t('settings.parsePackages')}
              />
              <FormHelperText>{t('settings.parsePackagesDesc')}</FormHelperText>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={backupLovelace}
                    onChange={(e) => setBackupLovelace(e.target.checked)}
                  />
                }
                label={t('settings.backupLovelace')}
              />
              <FormHelperText>{t('settings.backupLovelaceDesc')}</FormHelperText>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={excludeSecrets}
                    onChange={(e) => setExcludeSecrets(e.target.checked)}
                  />
                }
                label={t('settings.excludeSecrets')}
              />
              <FormHelperText>{t('settings.excludeSecretsDesc')}</FormHelperText>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Save Button for all settings above */}
      <Box display="flex" justifyContent="flex-end" mb={3}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSaveGeneralSettings}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : t('settings.save')}
        </Button>
      </Box>

      {/* Remote Repository Settings */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">
              {t('settings.remote')}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={remoteEnabled}
                  onChange={(e) => setRemoteEnabled(e.target.checked)}
                />
              }
              label={t('settings.remoteEnabled')}
            />
          </Box>
          <FormHelperText sx={{ mb: 3 }}>{t('settings.remoteEnabledDesc')}</FormHelperText>

          {remoteEnabled && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoPushEnabled}
                        onChange={(e) => setAutoPushEnabled(e.target.checked)}
                      />
                    }
                    label={t('settings.autoPush')}
                  />
                  <FormHelperText>{t('settings.autoPushDesc')}</FormHelperText>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

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
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
