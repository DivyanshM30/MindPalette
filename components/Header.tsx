'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AuthButton from '@/components/AuthButton'
import ThemeToggle from '@/components/ThemeToggle'
import { Calendar, CalendarDays, Home, BarChart3 } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

export default function Header() {
  const pathname = usePathname()
  const { user } = useUser()
  const isHome = pathname === '/'
  const isYearView = pathname === '/year'
  const isDayView = pathname === '/day-view'
  const isInsights = pathname === '/insights'
  const isLogin = pathname === '/login'

  // Hide header on login page for a clean, immersive auth experience
  if (isLogin) return null

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/20 dark:border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Image src="/icons/logo.png" alt="MindPalette" width={128} height={128} className="w-9 h-9 rounded-lg" />
          <span className="font-bold text-xl tracking-tight">
            <span className="text-gray-900 dark:text-white">Mind</span><span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-orange-400 via-40% via-yellow-300 via-50% to-teal-400">Palette</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {user && !isHome && (
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-all text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2"
              title="Dashboard"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}
          {user && !isDayView && (
            <Link
              href="/day-view"
              className="px-3 py-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-all text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2"
              title="Day View"
            >
              <CalendarDays size={16} />
              <span className="hidden sm:inline">Day View</span>
            </Link>
          )}
          {user && !isYearView && (
            <Link
              href="/year"
              className="px-3 py-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-all text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2"
              title="Year View"
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">Year View</span>
            </Link>
          )}
          {user && !isInsights && (
            <Link
              href="/insights"
              className="px-3 py-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-all text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2"
              title="Insights"
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Insights</span>
            </Link>
          )}
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  )
}
