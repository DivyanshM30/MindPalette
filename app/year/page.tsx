'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ArrowLeft, Share2 } from 'lucide-react'
import MoodGrid from '@/components/MoodGrid'
import YearSwitcher from '@/components/YearSwitcher'
import ShareCardDialog from '@/components/ShareCardDialog'
import { useEarliestYear } from '@/lib/hooks/useMoods'
import { useUser } from '@/contexts/UserContext'

export default function YearView() {
  const { user, loading } = useUser()
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [shareOpen, setShareOpen] = useState(false)
  const earliestYear = useEarliestYear()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><div className="animate-pulse text-purple-400">Loading your year...</div></div>
  }

  if (!user) return null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Back to day view"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Calendar size={32} className="text-purple-500" />
              Year Overview {year}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Your complete mood journey at a glance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <YearSwitcher year={year} minYear={Math.min(earliestYear, currentYear)} maxYear={currentYear} onChange={setYear} />
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95"
            title="Share your year as an image"
          >
            <Share2 size={16} /> Share
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Day View
          </Link>
        </div>
      </div>

      <MoodGrid showStats={false} year={year} />

      {/* Mounted only when open so its useMoods() call doesn't double-fetch
          the year alongside MoodGrid on every page load. */}
      {shareOpen && (
        <ShareCardDialog isOpen={shareOpen} onClose={() => setShareOpen(false)} year={year} />
      )}
    </div>
  )
}
