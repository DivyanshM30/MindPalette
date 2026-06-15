'use client'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, TrendingUp, Calendar, Smile, Frown, Loader2, Flame } from 'lucide-react'
import { Mood, MoodGrade } from '@/lib/types'
import { MOODS } from '@/lib/utils'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

const MOOD_SCORES: Record<MoodGrade, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 }
const MOOD_GRADIENTS: Record<MoodGrade, string> = {
    A: 'from-emerald-400 to-emerald-500',
    B: 'from-amber-400 to-yellow-500',
    C: 'from-violet-400 to-purple-500',
    D: 'from-orange-400 to-red-400',
    F: 'from-slate-400 to-slate-500',
}

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

    useEffect(() => { fetchMoods() }, [fetchMoods])

    const monthlyData = useMemo(() => {
        const months: Record<number, Mood[]> = {}
        for (let i = 0; i < 12; i++) months[i] = []
        moodData.forEach(m => {
            const month = new Date(m.date).getMonth()
            months[month].push(m)
        })
        return months
    }, [moodData])

    const monthStats = useMemo(() => {
        const entries = monthlyData[selectedMonth] || []
        if (entries.length === 0) return null
        const counts: Record<MoodGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
        let totalScore = 0
        entries.forEach(e => { counts[e.mood]++; totalScore += MOOD_SCORES[e.mood] })
        const avgScore = totalScore / entries.length
        const bestDay = entries.reduce((a, b) => MOOD_SCORES[a.mood] >= MOOD_SCORES[b.mood] ? a : b)
        const worstDay = entries.reduce((a, b) => MOOD_SCORES[a.mood] <= MOOD_SCORES[b.mood] ? a : b)
        return { entries, counts, avgScore, bestDay, worstDay, total: entries.length }
    }, [monthlyData, selectedMonth])

    const monthlyTrend = useMemo(() =>
        Array.from({ length: 12 }, (_, i) => {
            const entries = monthlyData[i]
            if (entries.length === 0) return null
            return entries.reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) / entries.length
        }), [monthlyData])

    // Year-level stats
    const yearStats = useMemo(() => {
        if (moodData.length === 0) return null
        const totalScore = moodData.reduce((s, m) => s + MOOD_SCORES[m.mood], 0)
        const avg = totalScore / moodData.length
        const counts: Record<MoodGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
        moodData.forEach(m => counts[m.mood]++)
        const topMood = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as MoodGrade
        return { total: moodData.length, avg, topMood }
    }, [moodData])

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">

            {/* ── HEADER ── */}
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </Link>
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <BarChart3 size={22} className="text-white" />
                        </span>
                        Mood Insights
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-[52px]">
                        Your patterns for {currentYear}
                    </p>
                </div>
            </div>

            {moodData.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center shadow-sm">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No data yet</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Start logging moods to unlock insights!</p>
                    <Link href="/day-view" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-105">
                        Log Your First Mood <Calendar size={18} />
                    </Link>
                </motion.div>
            ) : (
                <>
                    {/* ── YEAR HERO STATS ── */}
                    {yearStats && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-3 gap-4">
                            {[
                                {
                                    label: 'Days Tracked',
                                    value: yearStats.total,
                                    sub: `of 365 this year`,
                                    icon: <Flame size={18} />,
                                    gradient: 'from-purple-500 to-pink-500',
                                    glow: 'shadow-purple-500/20'
                                },
                                {
                                    label: 'Avg Mood Score',
                                    value: yearStats.avg.toFixed(1),
                                    sub: 'out of 5.0',
                                    icon: <TrendingUp size={18} />,
                                    gradient: 'from-blue-500 to-teal-500',
                                    glow: 'shadow-blue-500/20'
                                },
                                {
                                    label: 'Most Frequent',
                                    value: MOODS[yearStats.topMood].emoji,
                                    sub: MOODS[yearStats.topMood].label,
                                    icon: <Smile size={18} />,
                                    gradient: 'from-amber-500 to-orange-500',
                                    glow: 'shadow-amber-500/20'
                                },
                            ].map((stat) => (
                                <div key={stat.label} className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-full -translate-y-6 translate-x-6`} />
                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white mb-3 shadow-md ${stat.glow}`}>
                                        {stat.icon}
                                    </div>
                                    <div className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* ── MONTHLY TREND CHART (Option 2: Straight segments + glowing dots) ── */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <TrendingUp size={18} className="text-purple-500" /> Monthly Mood Trend
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">Click a dot to explore that month's breakdown</p>
                        </div>

                        {(() => {
                            const W = 600, H = 160, PAD = 30

                            const DOT_COLOR = (avg: number) =>
                                avg >= 4.5 ? '#10b981' : avg >= 3.5 ? '#f59e0b' : avg >= 2.5 ? '#a855f7' : avg >= 1.5 ? '#f97316' : '#94a3b8'

                            const points = monthlyTrend.map((avg, i) => ({
                                x: PAD + (i / 11) * (W - PAD * 2),
                                y: avg ? PAD + ((5 - avg) / 4) * (H - PAD * 2) : null,
                                avg, i
                            }))
                            const active = points.filter(p => p.y !== null)

                            // Straight polyline path
                            const linePath = active.length >= 2
                                ? active.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y!}`).join(' ')
                                : ''

                            return (
                                <div className="relative">
                                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 240 }}>
                                        <defs>
                                            {/* Glow filter per color */}
                                            {['#10b981','#f59e0b','#a855f7','#f97316','#94a3b8'].map((c, ci) => (
                                                <filter key={ci} id={`glow${ci}`} x="-50%" y="-50%" width="200%" height="200%">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                                </filter>
                                            ))}
                                        </defs>

                                        {/* Y-axis grid lines */}
                                        {[1,2,3,4,5].map(score => {
                                            const y = PAD + ((5 - score) / 4) * (H - PAD * 2)
                                            const labels: Record<number,string> = {5:'Great',4:'Good',3:'Okay',2:'Bad',1:'Awful'}
                                            return (
                                                <g key={score}>
                                                    <line x1={PAD} y1={y} x2={W - PAD} y2={y}
                                                        stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" strokeDasharray="4 4"
                                                        className="text-gray-400" />
                                                    <text x={PAD - 6} y={y + 4} textAnchor="end"
                                                        className="fill-gray-300 dark:fill-gray-600" style={{ fontSize: 8 }}>
                                                        {labels[score]}
                                                    </text>
                                                </g>
                                            )
                                        })}

                                        {/* Straight connecting lines — grey thin */}
                                        {linePath && (
                                            <motion.path
                                                d={linePath}
                                                fill="none"
                                                stroke="#d1d5db"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeDasharray="5 3"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 1, ease: 'easeInOut' }}
                                            />
                                        )}

                                        {/* Colored glowing dots + click areas */}
                                        {points.map((p) => {
                                            const color = p.avg ? DOT_COLOR(p.avg) : '#e5e7eb'
                                            const isSelected = p.i === selectedMonth
                                            return (
                                                <g key={p.i} onClick={() => setSelectedMonth(p.i)} style={{ cursor: 'pointer' }}>
                                                    {p.y !== null ? (
                                                        <>
                                                            {/* Glow ring */}
                                                            <motion.circle cx={p.x} cy={p.y!}
                                                                r={isSelected ? 16 : 10}
                                                                fill={color} fillOpacity={isSelected ? 0.25 : 0.12}
                                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                transition={{ delay: p.i * 0.06 }}
                                                            />
                                                            {/* Main dot */}
                                                            <motion.circle cx={p.x} cy={p.y!}
                                                                r={isSelected ? 8 : 6}
                                                                fill={color}
                                                                stroke="white" strokeWidth="2"
                                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                transition={{ delay: p.i * 0.06, type: 'spring', stiffness: 300 }}
                                                                style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
                                                            />
                                                            {/* Score label — always visible */}
                                                            <text x={p.x} y={p.y! - 14} textAnchor="middle"
                                                                style={{ fontSize: 9, fontWeight: 700, fill: color }}>
                                                                {p.avg!.toFixed(1)}
                                                            </text>
                                                        </>
                                                    ) : (
                                                        <circle cx={p.x} cy={H - PAD + 4} r={3}
                                                            fill="currentColor" className="text-gray-200 dark:text-gray-700" />
                                                    )}
                                                    {/* Month label */}
                                                    <text x={p.x} y={H - 4} textAnchor="middle"
                                                        style={{ fontSize: 9, fontWeight: isSelected ? 700 : 400, fill: isSelected ? color : '#9ca3af' }}>
                                                        {MONTH_NAMES[p.i].slice(0, 3)}
                                                    </text>
                                                </g>
                                            )
                                        })}
                                    </svg>

                                    {/* Legend */}
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 px-1">
                                        {([['#10b981','Great (A)'],['#f59e0b','Good (B)'],['#a855f7','Okay (C)'],['#f97316','Bad (D)'],['#94a3b8','Awful (F)']] as [string,string][]).map(([c,l]) => (
                                            <div key={l} className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                                                <span className="text-[10px] text-gray-400">{l}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })()}
                    </motion.div>

                    {/* ── MONTH BREAKDOWN ── */}
                    <motion.div key={selectedMonth} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{MONTH_NAMES[selectedMonth]}</h2>
                            {monthStats && (
                                <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-sm font-semibold">
                                    {monthStats.total} entries
                                </span>
                            )}
                        </div>

                        {monthStats ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                {/* Mood Distribution */}
                                <div className="md:col-span-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Mood Distribution</h3>
                                    <div className="space-y-4">
                                        {(Object.entries(MOODS) as [MoodGrade, typeof MOODS[MoodGrade]][]).map(([grade, data]) => {
                                            const count = monthStats.counts[grade]
                                            const pct = monthStats.total > 0 ? (count / monthStats.total) * 100 : 0
                                            return (
                                                <div key={grade} className="flex items-center gap-3">
                                                    <span className="text-xl w-7 text-center flex-shrink-0">{data.emoji}</span>
                                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 w-14 flex-shrink-0">{data.label}</span>
                                                    <div className="flex-1 h-7 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
                                                            className={`h-full rounded-lg bg-gradient-to-r ${MOOD_GRADIENTS[grade]} flex items-center justify-end pr-2`}
                                                        >
                                                            {pct > 18 && (
                                                                <span className="text-[11px] font-black text-white">{Math.round(pct)}%</span>
                                                            )}
                                                        </motion.div>
                                                    </div>
                                                    <span className="text-sm font-black text-gray-700 dark:text-gray-200 w-5 text-right flex-shrink-0">{count}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Right column: avg + best/worst */}
                                <div className="space-y-4">
                                    {/* Average mood - dark glass */}
                                    <div className="rounded-2xl bg-gray-950 dark:bg-gray-950 border border-purple-500/30 p-5 text-center shadow-lg shadow-purple-500/10 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-purple-500/5 rounded-2xl" />
                                        <div className="relative z-10">
                                            <div className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Average Mood</div>
                                            <div className="text-6xl font-black text-white leading-none">{monthStats.avgScore.toFixed(1)}</div>
                                            <div className="text-xs text-gray-500 mt-1.5">out of 5.0</div>
                                            <div className="text-4xl mt-4">
                                                {monthStats.avgScore >= 4.5 ? '🤩' : monthStats.avgScore >= 3.5 ? '😊' : monthStats.avgScore >= 2.5 ? '🙂' : monthStats.avgScore >= 1.5 ? '😔' : '😢'}
                                            </div>
                                            <div className="mt-3 h-1 rounded-full bg-gray-800 overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${((monthStats.avgScore - 1) / 4) * 100}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                    className="h-full rounded-full bg-purple-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Best day */}
                                    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <Smile size={15} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Best Day</span>
                                        </div>
                                        <div className="text-xl font-black text-gray-900 dark:text-white">
                                            {new Date(monthStats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-0.5">{MOODS[monthStats.bestDay.mood].emoji} {MOODS[monthStats.bestDay.mood].label}</div>
                                    </div>

                                    {/* Toughest day */}
                                    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                                <Frown size={15} className="text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Toughest Day</span>
                                        </div>
                                        <div className="text-xl font-black text-gray-900 dark:text-white">
                                            {new Date(monthStats.worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-0.5">{MOODS[monthStats.worstDay.mood].emoji} {MOODS[monthStats.worstDay.mood].label}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-10 text-center shadow-sm">
                                <div className="text-4xl mb-3">📅</div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No entries for {MONTH_NAMES[selectedMonth]}</p>
                                <Link href="/day-view" className="inline-flex items-center gap-1.5 mt-4 text-sm text-purple-500 hover:text-purple-700 font-semibold transition-colors">
                                    Log a mood →
                                </Link>
                            </div>
                        )}
                    </motion.div>

                    {/* ── CHECK-IN ACTIVITY GRID ── */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                            <Calendar size={18} className="text-purple-500" /> Check-in Activity
                        </h2>
                        <p className="text-xs text-gray-400 mb-5">Days logged per month — darker = more tracked</p>

                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2.5">
                            {MONTH_NAMES.map((name, i) => {
                                const count = (monthlyData[i] || []).length
                                const daysInMonth = new Date(currentYear, i + 1, 0).getDate()
                                const pct = (count / daysInMonth) * 100
                                const isSelected = i === selectedMonth

                                const bgStyle = pct >= 80
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                                    : pct >= 50
                                        ? 'bg-purple-400 text-white shadow-sm'
                                        : pct > 0
                                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600'

                                return (
                                    <button key={i} onClick={() => setSelectedMonth(i)}
                                        className={`rounded-xl p-3 text-center transition-all duration-200 hover:scale-105 active:scale-95 ${bgStyle} ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-105' : ''}`}
                                    >
                                        <div className="text-[10px] font-semibold opacity-70 mb-0.5">{name.slice(0, 3)}</div>
                                        <div className="text-xl font-black leading-none">{count}</div>
                                        <div className="text-[9px] opacity-50 mt-0.5">/{daysInMonth}</div>
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
