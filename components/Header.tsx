'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import AuthButton from '@/components/AuthButton'
import ThemeToggle from '@/components/ThemeToggle'
import { Calendar, CalendarDays, Home, BarChart3, Flower2 } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

const navigation = [
  { href: '/', label: 'Overview', icon: Home },
  { href: '/day-view', label: 'Journal', icon: CalendarDays },
  { href: '/year', label: 'Year', icon: Calendar },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
]

export default function Header() {
  const pathname = usePathname()
  const { user } = useUser()
  if (pathname === '/login') return null
  return (
    <header className="print-hide sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-ink-200 dark:border-ink-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="min-h-20 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-brand-600 dark:text-brand-300" aria-label="MindPalette home">
            <Flower2 size={27} strokeWidth={1.3} aria-hidden="true" />
            <span className="atelier-brand text-xl sm:text-3xl">MindPalette</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4"><ThemeToggle /><AuthButton /></div>
        </div>
        {user && (
          <nav className="atelier-nav pb-3" aria-label="Main navigation">
            {navigation.map(({href, label, icon: Icon}) => (
              <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm text-ink-600 dark:text-ink-300 transition-colors hover:bg-paper">
                <Icon size={16} className="hidden sm:block" aria-hidden="true" />{label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
