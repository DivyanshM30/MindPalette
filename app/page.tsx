'use client'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Calendar, CalendarDays, Loader2 } from 'lucide-react'
import StatisticsPanel from '@/components/StatisticsPanel'
import { Mood, MoodGrade } from '@/lib/types'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [moodData, setMoodData] = useState<Record<string, { mood: MoodGrade, note: string }>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMoods = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', '2026-01-01')
        .lte('date', '2026-12-31')

      if (error) throw error

      const dataMap: Record<string, { mood: MoodGrade, note: string }> = {}
      data?.forEach((m: Mood) => {
        dataMap[m.date] = { mood: m.mood, note: m.note || '' }
      })
      setMoodData(dataMap)
    } catch (error) {
      console.error('Error fetching moods:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchMoods()
  }, [fetchMoods])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-purple-400">
          <Loader2 className="animate-spin" size={32} />
          <span>Loading your space...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {!user ? (
          <>
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-medium dark:bg-purple-900/30 dark:text-purple-300 mb-4 animate-bounce">
                <Sparkles size={12} /> Your 2026 Emotional Journey
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white">
                Track your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">Vibe</span>
              </h1>
              <p className="text-xl text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                A beautiful, personal space to log your daily moods, understand your emotions, and see your year in pixels.
              </p>
            </div>

            <div className="flex gap-4">
              <Link href="/login" className="px-8 py-4 rounded-full bg-black text-white font-medium hover:scale-105 active:scale-95 transition-all text-lg shadow-xl shadow-purple-500/20 flex items-center gap-2 dark:bg-white dark:text-black">
                Get Started <ArrowRight size={20} />
              </Link>
            </div>

            {/* Visual Preview / Aura Blur */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-300/30 to-pink-300/30 rounded-full blur-[120px]" />
          </>
        ) : (
          <div className="w-full text-left space-y-8">
            {/* Statistics First */}
            <StatisticsPanel moodData={moodData} user={user} />

            {/* Navigation Buttons - Below Stats and Centered */}
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link
                href="/day-view"
                className="group relative overflow-hidden px-6 py-5 rounded-2xl bg-white dark:bg-gray-900 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-4"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all" />
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 relative z-10">
                  <CalendarDays size={28} />
                </div>
                <div className="text-left relative z-10">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">Check In Today</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Log your daily mood</div>
                </div>
                <ArrowRight className="ml-auto text-purple-400 group-hover:translate-x-1 transition-transform relative z-10" size={20} />
              </Link>

              <Link
                href="/year"
                className="group relative overflow-hidden px-6 py-5 rounded-2xl bg-white dark:bg-gray-900 border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-4"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all" />
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 relative z-10">
                  <Calendar size={28} />
                </div>
                <div className="text-left relative z-10">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">Year View</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">See your year in pixels</div>
                </div>
                <ArrowRight className="ml-auto text-indigo-400 group-hover:translate-x-1 transition-transform relative z-10" size={20} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
