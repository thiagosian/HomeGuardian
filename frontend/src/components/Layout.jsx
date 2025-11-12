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
    <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-r border-border/40">
      {/* Header */}
      <div className="h-20 px-6 flex items-center gap-3 border-b border-border/40">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 ring-1 ring-primary/20">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-base font-semibold tracking-tight">{t('app.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('app.subtitle')}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                'hover:bg-accent/50',
                isActive
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
            >
              <Icon className={cn('h-4 w-4 transition-colors', isActive && 'text-primary')} />
              {item.text}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/40">
        <p className="text-xs text-muted-foreground">
          v7.0.0
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-60 z-50 sm:hidden transition-transform duration-300 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {drawer}
      </aside>

      {/* Sidebar - Desktop */}
      <aside className="hidden sm:block w-60 fixed left-0 top-0 h-full">
        {drawer}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col sm:ml-60">
        {/* Top bar - Mobile only */}
        <header className="h-16 border-b border-border/40 bg-card/50 backdrop-blur-sm flex items-center px-4 sm:hidden fixed top-0 left-0 right-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="hover:bg-accent/50"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="ml-3 font-semibold text-sm">{t('app.subtitle')}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 sm:p-8 mt-16 sm:mt-0 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
