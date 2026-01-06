'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import AuthButton from '@/components/AuthButton'
import ThemeToggle from '@/components/ThemeToggle'
import { Calendar, CalendarDays, Home } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isYearView = pathname === '/year'
  const isDayView = pathname === '/day-view'

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/20 dark:border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20" />
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
            MindPalette
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {!isHome && (
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-all text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2"
              title="Dashboard"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}
          {!isDayView && (
            <Link
              href="/day-view"
              className="px-3 py-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-all text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2"
              title="Day View"
            >
              <CalendarDays size={16} />
              <span className="hidden sm:inline">Day View</span>
            </Link>
          )}
          {!isYearView && (
            <Link
              href="/year"
              className="px-3 py-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-all text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2"
              title="Year View"
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">Year View</span>
            </Link>
          )}
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  )
}
