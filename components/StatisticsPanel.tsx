'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { MoodGrade, MOODS } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
import { Trophy, TrendingUp, Activity } from 'lucide-react'

interface StatisticsPanelProps {
    moodData: Record<string, { mood: MoodGrade, note: string }>
    user: User | null
}

export default function StatisticsPanel({ moodData, user }: StatisticsPanelProps) {
    const stats = useMemo(() => {
        const total = Object.keys(moodData).length
        if (total === 0) return null

        const counts: Record<MoodGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
        let currentStreak = 0
        let bestStreak = 0
        let tempStreak = 0

        // Sort dates to calculate streaks
        const sortedDates = Object.keys(moodData).sort()

        // Calculate counts
        Object.values(moodData).forEach(d => {
            if (counts[d.mood] !== undefined) counts[d.mood]++
        })

        // Calculate streaks
        sortedDates.forEach((dateStr, index) => {
            if (index === 0) {
                tempStreak = 1
            } else {
                const prev = new Date(sortedDates[index - 1])
                const curr = new Date(dateStr)
                const diffTime = Math.abs(curr.getTime() - prev.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                if (diffDays === 1) {
                    tempStreak++
                } else {
                    tempStreak = 1
                }
            }
            if (tempStreak > bestStreak) bestStreak = tempStreak
        })
        const lastEntry = new Date(sortedDates[sortedDates.length - 1])
        const today = new Date()
        const isRecent = (today.getTime() - lastEntry.getTime()) / (1000 * 3600 * 24) <= 2
        currentStreak = isRecent ? tempStreak : 0

        const primaryVibe = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as MoodGrade

        return { total, counts, currentStreak, bestStreak, primaryVibe }
    }, [moodData])

    if (!stats) return null

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4"
            >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    Hey, {displayName}! 👋
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-base">Here&apos;s how your 2026 is looking so far.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            >
                {/* Vibe Overview Card */}
                <motion.div
                    whileHover={{ y: -4 }}
                    className="glass rounded-2xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden group border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${MOODS[stats.primaryVibe].color.replace('bg-', 'from-')} to-transparent opacity-30 dark:opacity-20 rounded-bl-full blur-2xl`} />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-3">
                            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                                <Activity size={16} />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider">Primary Vibe</span>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white mb-2">
                            {MOODS[stats.primaryVibe].emoji} {MOODS[stats.primaryVibe].label}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                            You&apos;re mostly feeling <span className="font-bold text-gray-800 dark:text-gray-100">{MOODS[stats.primaryVibe].description.toLowerCase()}</span> this year.
                        </p>
                    </div>
                    <div className="mt-6 flex items-end gap-3 relative z-10" style={{ height: '120px' }}>
                        {(Object.entries(stats.counts) as [MoodGrade, number][]).map(([grade, count]) => {
                            const maxCount = Math.max(...Object.values(stats.counts), 1);
                            // Use pixel heights: max 80px, min 12px for bars with 0 count
                            const barHeight = count > 0 ? Math.max((count / maxCount) * 80, 20) : 12;
                            // More saturated colors for better visibility
                            const barColors: Record<MoodGrade, string> = {
                                'A': 'bg-emerald-500',
                                'B': 'bg-amber-500',
                                'C': 'bg-purple-500',
                                'D': 'bg-orange-500',
                                'F': 'bg-slate-500'
                            };
                            return (
                                <div key={grade} className="flex-1 flex flex-col items-center justify-end group/bar hover:scale-105 transition-transform">
                                    <div className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">{count}</div>
                                    <div
                                        className={`w-full max-w-[40px] rounded-lg transition-all duration-700 ${barColors[grade]} shadow-md hover:shadow-lg`}
                                        style={{ height: `${barHeight}px` }}
                                    />
                                    <div className="text-lg mt-2">{MOODS[grade].emoji}</div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Streak Card */}
                <motion.div
                    whileHover={{ y: -4 }}
                    className="glass rounded-2xl p-6 md:p-8 flex flex-col justify-center items-center text-center relative overflow-hidden border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-transparent to-transparent dark:from-orange-900/10 dark:via-transparent" />
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 flex items-center justify-center mb-5 text-orange-600 dark:text-orange-400 relative z-10 shadow-lg">
                        <TrendingUp size={36} />
                    </div>
                    <h3 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white relative z-10 mb-2">
                        {stats.currentStreak}
                    </h3>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 relative z-10 mb-1">Current Streak</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 relative z-10 mb-4">days in a row</p>
                    <div className="mt-2 text-xs font-bold text-orange-600 dark:text-orange-400 px-4 py-1.5 rounded-full bg-orange-100/80 dark:bg-orange-900/30 relative z-10 border border-orange-200 dark:border-orange-800">
                        Best: {stats.bestStreak} days
                    </div>
                </motion.div>

                {/* Total Check-ins */}
                <motion.div
                    whileHover={{ y: -4 }}
                    className="glass rounded-2xl p-6 md:p-8 flex flex-col justify-center items-center text-center relative overflow-hidden border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-transparent dark:from-purple-900/10 dark:via-transparent" />
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/40 dark:to-pink-800/40 flex items-center justify-center mb-5 text-purple-600 dark:text-purple-400 relative z-10 shadow-lg">
                        <Trophy size={36} />
                    </div>
                    <h3 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white relative z-10 mb-2">
                        {stats.total}
                    </h3>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 relative z-10 mb-1">Total Check-ins</p>
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 max-w-[160px] relative z-10 leading-relaxed">
                        Keep tracking to unlock detailed monthly insights!
                    </p>
                </motion.div>
            </motion.div>
        </div>
    )
}
