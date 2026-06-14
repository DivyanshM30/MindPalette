'use client'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, TrendingUp, Calendar, Smile, Frown, Loader2 } from 'lucide-react'
import { Mood, MoodGrade } from '@/lib/types'
import { MOODS } from '@/lib/utils'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

const MOOD_SCORES: Record<MoodGrade, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 }

export default function InsightsPage() {
    const [user, setUser] = useState<User | null>(null)
    const [moodData, setMoodData] = useState<Mood[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())

    const supabase = createClient()
    const router = useRouter()
    const currentYear = new Date().getFullYear()

    const fetchMoods = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (!user) { router.push('/login'); return }

            const { data, error } = await supabase
                .from('moods')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', `${currentYear}-01-01`)
                .lte('date', `${currentYear}-12-31`)
                .order('date', { ascending: true })

            if (error) throw error
            setMoodData(data || [])
        } catch (error) {
            console.error('Error fetching moods:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase, currentYear, router])

    useEffect(() => {
        fetchMoods()
    }, [fetchMoods])

    // Monthly breakdown
    const monthlyData = useMemo(() => {
        const months: Record<number, Mood[]> = {}
        for (let i = 0; i < 12; i++) months[i] = []
        moodData.forEach(m => {
            const month = new Date(m.date).getMonth()
            months[month].push(m)
        })
        return months
    }, [moodData])

    // Stats for selected month
    const monthStats = useMemo(() => {
        const entries = monthlyData[selectedMonth] || []
        if (entries.length === 0) return null

        const counts: Record<MoodGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
        let totalScore = 0

        entries.forEach(e => {
            counts[e.mood]++
            totalScore += MOOD_SCORES[e.mood]
        })

        const avgScore = totalScore / entries.length
        const bestDay = entries.reduce((a, b) => MOOD_SCORES[a.mood] >= MOOD_SCORES[b.mood] ? a : b)
        const worstDay = entries.reduce((a, b) => MOOD_SCORES[a.mood] <= MOOD_SCORES[b.mood] ? a : b)
        const primaryMood = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as MoodGrade

        return { entries, counts, avgScore, bestDay, worstDay, primaryMood, total: entries.length }
    }, [monthlyData, selectedMonth])

    // Monthly trend (avg score per month)
    const monthlyTrend = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => {
            const entries = monthlyData[i]
            if (entries.length === 0) return null
            const avg = entries.reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) / entries.length
            return avg
        })
    }, [monthlyData])

    // Trend line max for scaling
    const trendMax = 5
    const trendMin = 1

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-purple-400">
                    <Loader2 className="animate-spin" size={32} />
                    <span>Analyzing your moods...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <BarChart3 size={32} className="text-purple-500" />
                            Mood Insights
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Your emotional patterns for {currentYear}
                        </p>
                    </div>
                </div>
            </div>

            {moodData.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-12 text-center border border-white/50 dark:border-white/10"
                >
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No data yet</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Start logging moods to unlock insights!</p>
                    <Link
                        href="/day-view"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors"
                    >
                        Log Your First Mood <Calendar size={18} />
                    </Link>
                </motion.div>
            ) : (
                <>
                    {/* Monthly Trend Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl p-6 md:p-8 border border-white/50 dark:border-white/10 shadow-lg"
                    >
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                            <TrendingUp size={20} className="text-purple-500" />
                            Monthly Mood Trend
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Average mood score per month</p>

                        <div className="flex items-end gap-2 md:gap-3 h-48">
                            {monthlyTrend.map((avg, i) => {
                                const height = avg ? ((avg - trendMin) / (trendMax - trendMin)) * 100 : 0
                                const isSelected = i === selectedMonth
                                const moodColor = avg
                                    ? avg >= 4 ? 'from-emerald-400 to-emerald-500'
                                        : avg >= 3 ? 'from-amber-400 to-amber-500'
                                            : avg >= 2 ? 'from-orange-400 to-orange-500'
                                                : 'from-red-400 to-red-500'
                                    : 'from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800'

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedMonth(i)}
                                        className={`flex-1 flex flex-col items-center justify-end gap-1 group transition-all ${isSelected ? 'scale-105' : 'hover:scale-105'}`}
                                    >
                                        {avg && (
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                                {avg.toFixed(1)}
                                            </span>
                                        )}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(height, 8)}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.05 }}
                                            className={`w-full rounded-lg bg-gradient-to-t ${moodColor} transition-all ${
                                                isSelected
                                                    ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 shadow-lg'
                                                    : 'opacity-70 group-hover:opacity-100'
                                            }`}
                                        />
                                        <span className={`text-[10px] md:text-xs font-medium mt-1 ${
                                            isSelected ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-gray-400'
                                        }`}>
                                            {MONTH_NAMES[i].slice(0, 3)}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>

                    {/* Selected Month Details */}
                    <motion.div
                        key={selectedMonth}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {MONTH_NAMES[selectedMonth]} Breakdown
                        </h2>

                        {monthStats ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Mood Distribution */}
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    className="glass rounded-2xl p-6 border border-white/50 dark:border-white/10 shadow-lg md:col-span-2"
                                >
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                                        Mood Distribution
                                    </h3>
                                    <div className="space-y-3">
                                        {(Object.entries(MOODS) as [MoodGrade, typeof MOODS[MoodGrade]][]).map(([grade, data]) => {
                                            const count = monthStats.counts[grade]
                                            const pct = monthStats.total > 0 ? (count / monthStats.total) * 100 : 0
                                            return (
                                                <div key={grade} className="flex items-center gap-3">
                                                    <span className="text-xl w-8 text-center">{data.emoji}</span>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16">{data.label}</span>
                                                    <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.8, delay: 0.1 }}
                                                            className={`h-full rounded-full ${data.color} flex items-center justify-end px-2`}
                                                        >
                                                            {pct > 15 && (
                                                                <span className="text-[10px] font-bold text-white/90">{Math.round(pct)}%</span>
                                                            )}
                                                        </motion.div>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300 w-8 text-right">{count}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </motion.div>

                                {/* Month Summary Card */}
                                <div className="space-y-4">
                                    <motion.div
                                        whileHover={{ y: -4 }}
                                        className="glass rounded-2xl p-6 border border-white/50 dark:border-white/10 shadow-lg text-center"
                                    >
                                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                            Average Mood
                                        </div>
                                        <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                                            {monthStats.avgScore.toFixed(1)}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            out of 5.0
                                        </div>
                                        <div className="mt-3 text-3xl">
                                            {monthStats.avgScore >= 4 ? '😊' : monthStats.avgScore >= 3 ? '🙂' : monthStats.avgScore >= 2 ? '😐' : '😔'}
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ y: -4 }}
                                        className="glass rounded-2xl p-5 border border-white/50 dark:border-white/10 shadow-lg"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <Smile size={18} className="text-emerald-500" />
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Best Day</span>
                                        </div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {new Date(monthStats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-sm text-gray-500">{MOODS[monthStats.bestDay.mood].emoji} {MOODS[monthStats.bestDay.mood].label}</div>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ y: -4 }}
                                        className="glass rounded-2xl p-5 border border-white/50 dark:border-white/10 shadow-lg"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <Frown size={18} className="text-orange-500" />
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Toughest Day</span>
                                        </div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {new Date(monthStats.worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-sm text-gray-500">{MOODS[monthStats.worstDay.mood].emoji} {MOODS[monthStats.worstDay.mood].label}</div>
                                    </motion.div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass rounded-2xl p-8 text-center border border-white/50 dark:border-white/10">
                                <div className="text-4xl mb-3">📅</div>
                                <p className="text-gray-500 dark:text-gray-400">No entries for {MONTH_NAMES[selectedMonth]}</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Monthly Check-in Counts (mini heatmap) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-2xl p-6 md:p-8 border border-white/50 dark:border-white/10 shadow-lg"
                    >
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                            <Calendar size={20} className="text-purple-500" />
                            Check-in Activity
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Days tracked per month</p>

                        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                            {MONTH_NAMES.map((name, i) => {
                                const count = (monthlyData[i] || []).length
                                const daysInMonth = new Date(currentYear, i + 1, 0).getDate()
                                const pct = (count / daysInMonth) * 100
                                const intensity = pct >= 80 ? 'bg-purple-500 text-white'
                                    : pct >= 50 ? 'bg-purple-300 dark:bg-purple-700 text-purple-900 dark:text-purple-100'
                                        : pct > 0 ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-400'

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedMonth(i)}
                                        className={`rounded-xl p-3 text-center transition-all hover:scale-105 ${intensity} ${
                                            i === selectedMonth ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''
                                        }`}
                                    >
                                        <div className="text-xs font-medium opacity-70">{name.slice(0, 3)}</div>
                                        <div className="text-2xl font-black">{count}</div>
                                        <div className="text-[10px] opacity-60">/{daysInMonth}</div>
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    )
}
