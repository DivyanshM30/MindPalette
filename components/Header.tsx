'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import AuthButton from '@/components/AuthButton'
import ThemeToggle from '@/components/ThemeToggle'
import { Calendar, CalendarDays } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const isYearView = pathname === '/year'

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/20 dark:border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20" />
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
            Mood 2026
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {pathname === '/' && (
            <Link
              href="/year"
              className="px-3 py-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-all text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2"
              title="View year summary"
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">Year View</span>
            </Link>
          )}
          {isYearView && (
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-all text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2"
              title="View day by day"
            >
              <CalendarDays size={16} />
              <span className="hidden sm:inline">Day View</span>
            </Link>
          )}
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  )
}

