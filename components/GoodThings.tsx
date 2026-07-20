'use client'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Sun, ChevronLeft, ChevronRight } from 'lucide-react'
import { Mood } from '@/lib/types'

const PAGE_SIZE = 2

interface GoodThingsProps {
    moods: Mood[]
}

/** Deterministic hash so the "remember this?" pick is stable for a whole day. */
function hashString(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0
    }
    return Math.abs(h)
}

function formatDay(date: string, opts: Intl.DateTimeFormatOptions): string {
    return new Date(date + 'T00:00:00').toLocaleDateString(undefined, opts)
}

/**
 * P1-1 "Good Things" recap — surfaces the positive_note column:
 * a stable-per-day "remember this?" card resurfacing a past good thing,
 * and a reel of this month's good things. Renders nothing when the
 * user has no positive notes (no empty-state nag).
 */
export default function GoodThings({ moods }: GoodThingsProps) {
    const today = new Date().toLocaleDateString('en-CA')
    const [page, setPage] = useState(0)

    const goodThings = useMemo(
        () => moods.filter(m => m.positive_note && m.positive_note.trim().length > 0),
        [moods]
    )

    // Past entries only — resurfacing today's note back at the user is pointless.
    const memory = useMemo(() => {
        const past = goodThings.filter(m => m.date < today)
        if (past.length === 0) return null
        return past[hashString(today) % past.length]
    }, [goodThings, today])

    const monthThings = useMemo(
        () => goodThings.filter(m => m.date.slice(0, 7) === today.slice(0, 7)).reverse(),
        [goodThings, today]
    )

    if (!memory && monthThings.length === 0) return null

    const monthName = new Date().toLocaleDateString(undefined, { month: 'long' })

    // Pagination for the reel: PAGE_SIZE days per page, clamped if data shrinks.
    const pageCount = Math.max(1, Math.ceil(monthThings.length / PAGE_SIZE))
    const safePage = Math.min(page, pageCount - 1)
    const pageItems = monthThings.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

    return (
        <div className={`grid gap-4 ${memory && monthThings.length > 0 ? 'md:grid-cols-2' : ''}`}>
            {/* Remember this? — a past good thing, rotates daily */}
            {memory && (
                <div className="glass rounded-3xl border border-amber-200/60 dark:border-amber-500/20 p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute -z-10 -top-8 -right-8 w-40 h-40 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-full blur-[40px]" />
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
                            <Sun size={16} />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">Remember this?</span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-100 leading-relaxed">
                        &ldquo;{memory.positive_note}&rdquo;
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                        {formatDay(memory.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
            )}

            {/* This month's gratitude reel */}
            {monthThings.length > 0 && (
                <div className="glass rounded-3xl border border-white/30 dark:border-white/10 p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute -z-10 -bottom-8 -left-8 w-40 h-40 bg-gradient-to-tr from-pink-400/15 to-transparent rounded-full blur-[40px]" />
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
                            <Sparkles size={16} />
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white flex-1">
                            {monthThings.length} good thing{monthThings.length === 1 ? '' : 's'} happened in {monthName}
                        </span>
                        {pageCount > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setPage(safePage - 1)}
                                    disabled={safePage === 0}
                                    aria-label="Previous good things"
                                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-30 disabled:hover:bg-white/70 dark:disabled:hover:bg-gray-900/70"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums" aria-live="polite">
                                    {safePage + 1}/{pageCount}
                                </span>
                                <button
                                    onClick={() => setPage(safePage + 1)}
                                    disabled={safePage === pageCount - 1}
                                    aria-label="Next good things"
                                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-30 disabled:hover:bg-white/70 dark:disabled:hover:bg-gray-900/70"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        )}
                    </div>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={safePage}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.18 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                            role="list"
                            aria-label={`Good things in ${monthName}`}
                        >
                            {pageItems.map(m => (
                                <div
                                    key={m.date}
                                    role="listitem"
                                    className="rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-gray-100 dark:border-gray-800 p-4 min-h-[104px]"
                                >
                                    <p className="text-xs font-semibold text-purple-500 dark:text-purple-400 mb-1.5">
                                        {formatDay(m.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed line-clamp-4">
                                        {m.positive_note}
                                    </p>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
