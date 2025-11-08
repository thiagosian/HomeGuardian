import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, History, List, Settings as SettingsIcon, Shield, Menu, X } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

const DRAWER_WIDTH = 240

export default function Layout({ children }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const menuItems = [
    { text: t('nav.dashboard'), icon: LayoutDashboard, path: '/' },
    { text: t('nav.history'), icon: History, path: '/history' },
    { text: t('nav.items'), icon: List, path: '/items' },
    { text: t('nav.settings'), icon: SettingsIcon, path: '/settings' },
  ]

  const drawer = (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="h-16 px-4 flex items-center gap-2 border-b">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-lg font-semibold">{t('app.title')}</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Button
              key={item.path}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3',
                isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
            >
              <Icon className="h-5 w-5" />
              {item.text}
            </Button>
          )
        })}
      </nav>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-60 bg-card border-r transition-transform duration-200 z-50 sm:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {drawer}
      </aside>

      {/* Sidebar - Desktop */}
      <aside className="hidden sm:block w-60 border-r fixed left-0 top-0 h-full bg-card">
        {drawer}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col sm:ml-60">
        {/* Top bar - Mobile only */}
        <header className="h-16 border-b bg-card flex items-center px-4 sm:hidden fixed top-0 left-0 right-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="ml-3 font-semibold">{t('app.subtitle')}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 mt-16 sm:mt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
