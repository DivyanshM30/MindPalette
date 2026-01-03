'use client'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import DayView from '@/components/DayView'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [supabase])

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><div className="animate-pulse text-purple-400">Loading your space...</div></div>
  }

  return (
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
        <div className="w-full text-left space-y-10">
          <div className="flex items-end justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {user.email?.split('@')[0]}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Track your daily mood and reflections.</p>
            </div>
            <a 
              href="#day-view"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Check In Today
            </a>
          </div>

          {/* Day View */}
          <DayView />
        </div>
      )}
    </div>
  )
}
