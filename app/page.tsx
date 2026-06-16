'use client'
import { createClient } from '@/lib/supabase'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Calendar, CalendarDays, Loader2, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'
import StatisticsPanel from '@/components/StatisticsPanel'
const Onboarding = dynamic(() => import('@/components/Onboarding'), { ssr: false })
import { Mood, MoodGrade } from '@/lib/types'
import { useUser } from '@/contexts/UserContext'
import { getDisplayName } from '@/lib/utils'

export default function Home() {
  const { user, loading: userLoading } = useUser()
  const [moodData, setMoodData] = useState<Record<string, { mood: MoodGrade, note: string }>>({})
  const [moodLoading, setMoodLoading] = useState(true)
  const supabase = createClient()

  const currentYear = new Date().getFullYear()

  // Stable random grid for landing page (fixes U5 flicker)
  const pixelGrid = useMemo(() =>
    Array.from({ length: 182 }, () => {
      const colors = [
        'bg-emerald-400', 'bg-amber-400', 'bg-violet-400',
        'bg-orange-400', 'bg-slate-400', 'bg-teal-400', 'bg-pink-400'
      ]
      return {
        hasEntry: Math.random() > 0.15,
        color: colors[Math.floor(Math.random() * colors.length)]
      }
    }), [])

  const fetchMoods = useCallback(async () => {
    if (!user) {
      setMoodLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', `${currentYear}-01-01`)
        .lte('date', `${currentYear}-12-31`)

      if (error) throw error

      const dataMap: Record<string, { mood: MoodGrade, note: string }> = {}
      data?.forEach((m: Mood) => {
        dataMap[m.date] = { mood: m.mood, note: m.note || '' }
      })
      setMoodData(dataMap)
    } catch (error) {
      console.error('Error fetching moods:', error)
    } finally {
      setMoodLoading(false)
    }
  }, [supabase, currentYear, user])

  useEffect(() => {
    if (!userLoading) fetchMoods()
  }, [fetchMoods, userLoading])

  const loading = userLoading || moodLoading

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
      <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">

        {!user ? (<>
            {/* ── HERO ── */}
            <div className="relative w-full flex flex-col items-center text-center pt-8 pb-4 space-y-6">
              {/* Background aura */}
              <div className="absolute -z-10 top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-teal-500/10 rounded-full blur-[100px]" />

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-300/50 dark:border-purple-700/50 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 text-xs font-semibold tracking-wide uppercase">
                <Sparkles size={12} className="animate-pulse" /> Your {new Date().getFullYear()} Emotional Journey
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
                <span className="text-gray-900 dark:text-white">Understand your</span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400">inner world</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
                MindPalette turns your daily feelings into a living, breathing canvas of color — one pixel per day, one year at a time.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                <Link
                  href="/login"
                  className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-base shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
                >
                  Start Tracking Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="px-8 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-base hover:border-purple-400 dark:hover:border-purple-600 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  See how it works ↓
                </a>
              </div>

              {/* Animated pixel grid preview */}
              <div className="mt-8 w-full max-w-2xl">
                <div className="glass rounded-3xl border border-white/20 dark:border-white/10 p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4 text-left">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs text-gray-400 font-mono">mindpalette.app — Your 2025</span>
                  </div>
                  {/* Pixel grid demo */}
                  <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(26, 1fr)' }}>
                    {pixelGrid.map((cell, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-sm ${cell.hasEntry ? cell.color + ' opacity-80' : 'bg-gray-200 dark:bg-gray-800 opacity-30'}`}
                        style={{ animationDelay: `${i * 8}ms` }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-400">Jan 2025</span>
                    <span className="text-xs text-gray-400 font-medium">182 days tracked ✨</span>
                    <span className="text-xs text-gray-400">Jun 2025</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── FEATURES ── */}
            <div id="features" className="w-full pt-16 pb-8 space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Everything you need to know yourself</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Built for reflection, not obsession. Simple daily check-ins, beautiful long-term patterns.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                {[
                  {
                    icon: '✍️',
                    gradient: 'from-purple-500 to-pink-500',
                    glow: 'shadow-purple-500/20',
                    title: '30-Second Check-ins',
                    desc: 'Pick your mood, add an optional note. No journaling pressure — just a quick pulse check every day.',
                    tag: 'Daily habit'
                  },
                  {
                    icon: '📊',
                    gradient: 'from-blue-500 to-teal-500',
                    glow: 'shadow-blue-500/20',
                    title: 'Monthly Insights',
                    desc: 'See your mood trends, best days, toughest stretches, and average score — all visualized beautifully.',
                    tag: 'Smart analytics'
                  },
                  {
                    icon: '🔥',
                    gradient: 'from-orange-500 to-amber-500',
                    glow: 'shadow-orange-500/20',
                    title: 'Streaks & Milestones',
                    desc: "Build the habit of reflection. Celebrate when you hit 7, 30, or 100 days — you'll be surprised how it feels.",
                    tag: 'Motivation'
                  }
                ].map((f) => (
                  <div key={f.title} className="glass rounded-2xl p-6 border border-white/30 dark:border-white/10 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl mb-4 shadow-lg ${f.glow}`}>
                      {f.icon}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-purple-500 dark:text-purple-400 mb-1">{f.tag}</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── YEAR IN PIXELS SHOWCASE ── */}
            <div className="w-full py-12">
              <div className="glass rounded-3xl border border-white/20 dark:border-white/10 p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute -z-10 top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-[60px]" />
                <div className="absolute -z-10 bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-teal-500/10 to-transparent rounded-full blur-[60px]" />

                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="flex-1 space-y-4 text-left">
                    <div className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Year in Pixels</div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                      Your whole year,<br />painted in feeling
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                      Every day becomes a colored square. Fill your year with greens, golds, and purples. Spot patterns you never noticed. Celebrate the good days. Learn from the hard ones.
                    </p>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 transition-all"
                    >
                      Start your canvas <ArrowRight size={16} />
                    </Link>
                  </div>
                  {/* Decorative large pixel grid */}
                  <div className="flex-shrink-0">
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(12, 1fr)', width: '240px' }}>
                      {[
                        'bg-emerald-400','bg-emerald-500','bg-amber-400','bg-emerald-400','bg-violet-400','bg-emerald-300',
                        'bg-amber-400','bg-emerald-400','bg-emerald-400','bg-orange-400','bg-emerald-500','bg-emerald-400',
                        'bg-violet-400','bg-amber-300','bg-emerald-400','bg-emerald-400','bg-slate-400','bg-violet-400',
                        'bg-orange-400','bg-amber-400','bg-emerald-400','bg-violet-300','bg-emerald-400','bg-teal-400',
                        'bg-emerald-400','bg-emerald-400','bg-orange-300','bg-emerald-400','bg-amber-400','bg-emerald-500',
                        'bg-slate-400','bg-violet-400','bg-emerald-400','bg-emerald-400','bg-amber-400','bg-orange-400',
                        'bg-emerald-400','bg-teal-400','bg-amber-400','bg-emerald-400','bg-violet-400','bg-emerald-400',
                        'bg-amber-400','bg-emerald-400','bg-emerald-300','bg-orange-400','bg-emerald-400','bg-amber-300',
                      ].map((color, i) => (
                        <div key={i} className={`w-full aspect-square rounded-md ${color} opacity-90 shadow-sm`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── TRUST BADGES ── */}
            <div className="w-full py-6 flex flex-col items-center gap-4">
              <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Why people love it</p>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { icon: '🔒', text: 'Private & secure' },
                  { icon: '✨', text: 'Free forever' },
                  { icon: '📱', text: 'Install as an app' },
                  { icon: '🌙', text: 'Dark & light mode' },
                  { icon: '⌨️', text: 'Keyboard shortcuts' },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 text-sm font-medium">
                    <span>{b.icon}</span> {b.text}
                  </div>
                ))}
              </div>
            </div>

            {/* ── FINAL CTA ── */}
            <div className="w-full py-12 flex flex-col items-center text-center space-y-5">
              <div className="relative">
                <div className="absolute -z-10 inset-0 w-[400px] h-[200px] left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-[60px] rounded-full" />
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white">
                  Ready to understand<br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">yourself better?</span>
                </h2>
              </div>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Takes 30 seconds a day. Gives you a lifetime of self-awareness.
              </p>
              <Link
                href="/login"
                className="group px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
              >
                Start Tracking Today
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-xs text-gray-400">No credit card. No nonsense. Just you and your moods.</p>
            </div>

            {/* Background aura */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-300/10 to-pink-300/10 rounded-full blur-[120px]" />
          </>) : (
          <div className="w-full text-left space-y-8">
            {/* Onboarding for new users */}
            {Object.keys(moodData).length === 0 && (
              <Onboarding userName={getDisplayName(user)} />
            )}

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

              <Link
                href="/insights"
                className="group relative overflow-hidden px-6 py-5 rounded-2xl bg-white dark:bg-gray-900 border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-4"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 group-hover:from-emerald-500/10 group-hover:to-teal-500/10 transition-all" />
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 relative z-10">
                  <BarChart3 size={28} />
                </div>
                <div className="text-left relative z-10">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">Insights</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Monthly trends & stats</div>
                </div>
                <ArrowRight className="ml-auto text-emerald-400 group-hover:translate-x-1 transition-transform relative z-10" size={20} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
