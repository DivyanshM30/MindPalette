'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Compass, TrendingUp, TrendingDown, Minus, Flame, Trophy, CloudRain, Lock } from 'lucide-react'
import { Mood } from '@/lib/types'
import { MOOD_SCORES, MONTH_NAMES } from '@/lib/utils'

interface PatternInsightsProps {
    moods: Mood[]
    year: number
}

/** Entries needed before any pattern stat is shown (avoids garbage stats). */
const MIN_TOTAL = 14
/** Entries a weekday needs before it can be crowned best/toughest. */
const MIN_PER_WEEKDAY = 2
/** Entries a month needs before it can be crowned best/worst. */
const MIN_PER_MONTH = 5
/** Entries each 7-day window needs for the rolling trend. */
const MIN_PER_WINDOW = 3

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const STREAK_MILESTONES = [7, 30, 100, 365]

function isoDaysAgo(n: number): string {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toLocaleDateString('en-CA')
}

function avgScore(entries: Mood[]): number {
    return entries.reduce((s, m) => s + MOOD_SCORES[m.mood], 0) / entries.length
}

/**
 * P1-3 Pattern insights — answers "so what?" from data already fetched:
 * weekday averages, rolling 7-day trend, best/worst months, streak forecast.
 * Everything is guarded behind minimum-data thresholds; below MIN_TOTAL the
 * card shows how many more days are needed instead of unstable stats.
 */
export default function PatternInsights({ moods, year }: PatternInsightsProps) {
    const isCurrentYear = year === new Date().getFullYear()

    const weekdayStats = useMemo(() => {
        const buckets: Mood[][] = Array.from({ length: 7 }, () => [])
        moods.forEach(m => {
            // getDay(): 0 = Sunday. Re-index so 0 = Monday.
            const dow = (new Date(m.date + 'T00:00:00').getDay() + 6) % 7
            buckets[dow].push(m)
        })
        return buckets.map((entries, i) => ({
            label: WEEKDAYS[i],
            count: entries.length,
            avg: entries.length > 0 ? avgScore(entries) : null,
        }))
    }, [moods])

    const { bestDay, worstDay } = useMemo(() => {
        const eligible = weekdayStats.filter(d => d.avg !== null && d.count >= MIN_PER_WEEKDAY)
        if (eligible.length < 2) return { bestDay: null, worstDay: null }
        const sorted = [...eligible].sort((a, b) => (b.avg! - a.avg!))
        // A tie between best and worst means there's no real pattern to report.
        if (sorted[0].avg === sorted[sorted.length - 1].avg) return { bestDay: null, worstDay: null }
        return { bestDay: sorted[0], worstDay: sorted[sorted.length - 1] }
    }, [weekdayStats])

    const { bestMonth, worstMonth } = useMemo(() => {
        const monthAvgs = Array.from({ length: 12 }, (_, i) => {
            const entries = moods.filter(m => new Date(m.date + 'T00:00:00').getMonth() === i)
            return { label: MONTH_NAMES[i], count: entries.length, avg: entries.length > 0 ? avgScore(entries) : null }
        }).filter(m => m.avg !== null && m.count >= MIN_PER_MONTH)
        if (monthAvgs.length < 2) return { bestMonth: null, worstMonth: null }
        const sorted = [...monthAvgs].sort((a, b) => b.avg! - a.avg!)
        if (sorted[0].avg === sorted[sorted.length - 1].avg) return { bestMonth: null, worstMonth: null }
        return { bestMonth: sorted[0], worstMonth: sorted[sorted.length - 1] }
    }, [moods])

    const trend = useMemo(() => {
        if (!isCurrentYear) return null
        const d7 = isoDaysAgo(7), d14 = isoDaysAgo(14)
        const last7 = moods.filter(m => m.date > d7)
        const prev7 = moods.filter(m => m.date > d14 && m.date <= d7)
        if (last7.length < MIN_PER_WINDOW || prev7.length < MIN_PER_WINDOW) return null
        const delta = avgScore(last7) - avgScore(prev7)
        return { current: avgScore(last7), delta }
    }, [moods, isCurrentYear])

    const streak = useMemo(() => {
        if (!isCurrentYear) return null
        const dates = new Set(moods.map(m => m.date))
        // A streak survives until a full day is missed: start from today if
        // logged, otherwise from yesterday.
        let count = 0
        let offset = dates.has(isoDaysAgo(0)) ? 0 : 1
        while (dates.has(isoDaysAgo(offset + count))) count++
        if (count === 0) return null
        const next = STREAK_MILESTONES.find(ms => ms > count)
        return { count, next, toGo: next ? next - count : null }
    }, [moods, isCurrentYear])

    // ── Locked state: not enough data for anything trustworthy ──
    if (moods.length < MIN_TOTAL) {
        return (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                    <Compass size={18} className="text-purple-500" /> Your Patterns
                </h2>
                <div className="flex items-center gap-3 mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                    <Lock size={18} className="text-gray-400 shrink-0" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Log <span className="font-bold text-purple-500">{MIN_TOTAL - moods.length} more {MIN_TOTAL - moods.length === 1 ? 'day' : 'days'}</span> to
                        unlock pattern insights — weekday rhythms, trends, and your best stretches.
                    </p>
                </div>
            </motion.div>
        )
    }

    const maxAvg = Math.max(...weekdayStats.map(d => d.avg ?? 0))

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Compass size={18} className="text-purple-500" /> Your Patterns
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">What moves your mood in {year}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weekday averages */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Average by weekday</h3>
                    <div className="space-y-2.5">
                        {weekdayStats.map(d => {
                            const isBest = bestDay?.label === d.label
                            const isWorst = worstDay?.label === d.label
                            return (
                                <div key={d.label} className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-9 shrink-0">{d.label.slice(0, 3)}</span>
                                    <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800/60 rounded-md overflow-hidden">
                                        {d.avg !== null && (
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(d.avg / 5) * 100}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                className={`h-full rounded-md ${isBest ? 'bg-emerald-500' : isWorst ? 'bg-orange-400' : 'bg-purple-400'} ${d.avg === maxAvg ? '' : 'opacity-90'}`}
                                            />
                                        )}
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-8 text-right shrink-0 tabular-nums">
                                        {d.avg !== null ? d.avg.toFixed(1) : '—'}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Findings */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">What stands out</h3>

                    {bestDay && worstDay && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                            <span className="text-lg leading-none mt-0.5">📅</span>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{bestDay.label}s</span> are your best days ({bestDay.avg!.toFixed(1)}),
                                while <span className="font-bold text-orange-500 dark:text-orange-400">{worstDay.label}s</span> run toughest ({worstDay.avg!.toFixed(1)}).
                            </p>
                        </div>
                    )}

                    {bestMonth && worstMonth && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                            <span className="text-lg leading-none mt-0.5"><Trophy size={16} className="text-amber-500 inline" /></span>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-bold">{bestMonth.label}</span> was your best month ({bestMonth.avg!.toFixed(1)});
                                <span className="font-bold"> {worstMonth.label}</span> was the hardest ({worstMonth.avg!.toFixed(1)}).
                            </p>
                        </div>
                    )}

                    {trend && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                            <span className="mt-0.5">
                                {trend.delta > 0.05 ? <TrendingUp size={16} className="text-emerald-500" /> :
                                    trend.delta < -0.05 ? <TrendingDown size={16} className="text-orange-500" /> :
                                        <Minus size={16} className="text-gray-400" />}
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Your last 7 days average <span className="font-bold">{trend.current.toFixed(1)}</span>
                                {trend.delta > 0.05 ? <> — up <span className="font-bold text-emerald-600 dark:text-emerald-400">{trend.delta.toFixed(1)}</span> from the week before.</> :
                                    trend.delta < -0.05 ? <> — down <span className="font-bold text-orange-500 dark:text-orange-400">{Math.abs(trend.delta).toFixed(1)}</span> from the week before. Be kind to yourself.</> :
                                        <> — steady with the week before.</>}
                            </p>
                        </div>
                    )}

                    {streak && streak.next && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                            <Flame size={16} className="text-orange-500 mt-0.5" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-bold">{streak.count}-day</span> streak — {streak.toGo} more {streak.toGo === 1 ? 'day' : 'days'} to hit <span className="font-bold text-purple-500">{streak.next}</span>.
                            </p>
                        </div>
                    )}

                    {!bestDay && !bestMonth && !trend && !streak && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                            <CloudRain size={16} className="text-gray-400 mt-0.5" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No clear patterns yet — keep logging and they&apos;ll emerge.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
