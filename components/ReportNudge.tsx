'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Printer, X, ArrowRight } from 'lucide-react'
import { Mood } from '@/lib/types'
import { MONTH_NAMES } from '@/lib/utils'

const DISMISS_KEY = 'reportNudgeDismissed'
/** Below this, a report is too sparse to be worth printing. */
const MIN_ENTRIES = 3

/**
 * Small dashboard notice pointing at the printable monthly report (P1-7),
 * which otherwise lives out of sight at the bottom of /insights.
 *
 * Deliberately quiet, per the anti-roadmap's "no nag" rule:
 *  - appears only once the month has enough entries to be worth printing
 *  - dismissible, and the dismissal is remembered *per month* — so it can
 *    return next month with something new to say rather than nagging today
 *  - a notice, not a paywall tease: one line, one link, one X
 */
export default function ReportNudge({ moods }: { moods: Mood[] }) {
    const [mounted, setMounted] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    // Primitive dependencies stay stable during mood-context re-renders while
    // still picking up a new calendar month on the next render.
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const monthKey = `${year}-${month + 1}`

    const count = useMemo(() => {
        const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`
        return moods.filter(m => m.date.startsWith(prefix)).length
    }, [moods, year, month])

    // localStorage is read after mount so server and client markup agree.
    useEffect(() => {
        try {
            setDismissed(localStorage.getItem(DISMISS_KEY) === monthKey)
        } catch {
            // Private-mode / blocked storage: just show the notice.
        }
        setMounted(true)
    }, [monthKey])

    const dismiss = () => {
        setDismissed(true)
        try {
            localStorage.setItem(DISMISS_KEY, monthKey)
        } catch {
            // Dismissal simply won't persist; not worth surfacing.
        }
    }

    if (!mounted || dismissed || count < MIN_ENTRIES) return null

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-200/80 dark:border-brand-500/20 bg-brand-50/70 dark:bg-brand-950/20 px-4 py-3">
            <span className="w-9 h-9 shrink-0 rounded-xl bg-paper dark:bg-brand-500/10 border border-brand-200/80 dark:border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-300">
                <Printer size={17} />
            </span>

            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">
                    Your {MONTH_NAMES[month]} report is ready
                </p>
                <p className="text-xs text-ink-500 dark:text-ink-400 truncate">
                    {count} {count === 1 ? 'day' : 'days'} logged — print a one-page summary or save it as a PDF
                </p>
            </div>

            <Link
                href="/insights#monthly-report"
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors"
            >
                View <ArrowRight size={13} />
            </Link>

            <button
                onClick={dismiss}
                aria-label="Dismiss report reminder"
                title="Dismiss until next month"
                className="shrink-0 p-1.5 rounded-lg text-ink-500 dark:text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 hover:bg-paper dark:hover:bg-paper/5 transition-colors"
            >
                <X size={15} />
            </button>
        </div>
    )
}
