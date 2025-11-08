import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Info, Moon, Sun } from 'lucide-react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select'
import { useTheme } from '../contexts/ThemeContext'

const THEME_OPTIONS = [
  { value: 'classic-light', label: 'Classic Light', icon: Sun },
  { value: 'classic-dark', label: 'Classic Dark', icon: Moon },
  { value: 'new-light', label: 'New Light', icon: Sun },
  { value: 'new-dark', label: 'New Dark', icon: Moon },
]

export default function Settings() {
  const { theme, setTheme, isDark, isClassicTheme, isNewTheme } = useTheme()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Select Theme</label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a theme" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Current Theme:</span>
              <span className="text-muted-foreground">{theme}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Dark Mode:</span>
              <span className="text-muted-foreground">{isDark ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Theme Type:</span>
              <span className="text-muted-foreground">
                {isClassicTheme ? 'Classic' : 'New'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your theme preference is automatically saved to browser storage and will be restored on your next visit.
        </AlertDescription>
      </Alert>
    </div>
  )
}
