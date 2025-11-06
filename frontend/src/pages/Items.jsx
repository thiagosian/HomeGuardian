import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Typography,
  Alert,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

export default function Items() {
  const { t } = useTranslation()
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await api.history.getItems()
      setItems(response.data.items)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  const renderItemTable = (itemList, type) => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('items.name')}</TableCell>
            <TableCell>{t('items.file')}</TableCell>
            {type === 'automation' && <TableCell>Status</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {itemList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} align="center">
                <Typography variant="body2" color="text.secondary">
                  {t('items.noItems')}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            itemList.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.alias || item.name || item.id}
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{item.file}</Typography>
                </TableCell>
                {type === 'automation' && (
                  <TableCell>
                    <Chip
                      label={item.enabled ? t('items.enabled') : t('items.disabled')}
                      size="small"
                      color={item.enabled ? 'success' : 'default'}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('items.title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`${t('items.automations')} (${items?.automations?.length || 0})`} />
          <Tab label={`${t('items.scripts')} (${items?.scripts?.length || 0})`} />
          <Tab label={`${t('items.scenes')} (${items?.scenes?.length || 0})`} />
        </Tabs>

        <CardContent>
          {tabValue === 0 && renderItemTable(items?.automations || [], 'automation')}
          {tabValue === 1 && renderItemTable(items?.scripts || [], 'script')}
          {tabValue === 2 && renderItemTable(items?.scenes || [], 'scene')}
        </CardContent>
      </Card>

      <Box mt={2}>
        <Typography variant="caption" color="text.secondary">
          Total items: {items?.total || 0}
        </Typography>
      </Box>
    </Box>
  )
}
