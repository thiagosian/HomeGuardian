import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Info } from 'lucide-react'

export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Settings page migration in progress. Full functionality will be available in the next update.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Settings interface is being redesigned with shadcn/ui components.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
