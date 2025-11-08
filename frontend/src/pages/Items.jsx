import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { api } from '../api/client'
import { Card, CardContent } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Badge } from '../components/ui/badge'

export default function Items() {
  const { t } = useTranslation()
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const renderItemTable = (itemList, type) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('items.name')}</TableHead>
          <TableHead>{t('items.file')}</TableHead>
          {type === 'automation' && <TableHead>Status</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {itemList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('items.noItems')}
              </p>
            </TableCell>
          </TableRow>
        ) : (
          itemList.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.alias || item.name || item.id}
              </TableCell>
              <TableCell>
                <p className="text-xs text-muted-foreground font-mono">
                  {item.file}
                </p>
              </TableCell>
              {type === 'automation' && (
                <TableCell>
                  <Badge variant={item.enabled ? 'success' : 'secondary'}>
                    {item.enabled ? t('items.enabled') : t('items.disabled')}
                  </Badge>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('items.title')}</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <Tabs defaultValue="automations" className="w-full">
          <div className="border-b px-6 pt-6">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="automations">
                {t('items.automations')} ({items?.automations?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="scripts">
                {t('items.scripts')} ({items?.scripts?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="scenes">
                {t('items.scenes')} ({items?.scenes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="esphome">
                {t('items.esphome')} ({items?.esphome?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="packages">
                {t('items.packages')} ({items?.packages?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="dashboards">
                {t('items.dashboards')} ({items?.lovelace?.length || 0})
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-6">
            <TabsContent value="automations">
              {renderItemTable(items?.automations || [], 'automation')}
            </TabsContent>
            <TabsContent value="scripts">
              {renderItemTable(items?.scripts || [], 'script')}
            </TabsContent>
            <TabsContent value="scenes">
              {renderItemTable(items?.scenes || [], 'scene')}
            </TabsContent>
            <TabsContent value="esphome">
              {renderItemTable(items?.esphome || [], 'esphome')}
            </TabsContent>
            <TabsContent value="packages">
              {renderItemTable(items?.packages || [], 'package')}
            </TabsContent>
            <TabsContent value="dashboards">
              {renderItemTable(items?.lovelace || [], 'lovelace')}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <p className="text-xs text-muted-foreground">
        Total items: {items?.total || 0}
      </p>
    </div>
  )
}
