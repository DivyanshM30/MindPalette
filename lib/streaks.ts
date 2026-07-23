import { Mood } from './types'

/**
 * Centralized streak logic (P1-5 "forgiving streaks").
 * Single source of truth for the dashboard streak card and insights
 * streak forecast — previously duplicated with subtly different rules.
 *
 * Forgiveness rules:
 * - Today being empty never breaks a streak; it survives until a full
 *   day is actually missed.
 * - Missing exactly one day is repairable: logging that day
 *   retroactively reconnects the streak. One repair per rolling week,
 *   "earned" back over time (detected from created_at vs date — a row
 *   logged on a later calendar day was a repair).
 * - Missing two or more days resets the streak. That's not a failure;
 *   copy stays guilt-free.
 */

export interface StreakInfo {
    /** Consecutive days ending today or yesterday. */
    current: number
    /** Longest run in the provided data. */
    best: number
    /** The single missed day that can reconnect the streak, if repair is available. */
    repairDate: string | null
    /** True when a repairable gap exists but this week's repair is already spent. */
    repairSpent: boolean
    /** True when a previous streak exists but the current one is 0 (show no-guilt copy). */
    broken: boolean
}

type StreakEntry = Pick<Mood, 'date' | 'created_at'>

export function localToday(): string {
    return new Date().toLocaleDateString('en-CA')
}

/** date string (YYYY-MM-DD) shifted by delta days, in local time. */
export function shiftDay(date: string, delta: number): string {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    return d.toLocaleDateString('en-CA')
}

/** Whole-day difference between two YYYY-MM-DD strings. */
function dayDiff(a: string, b: string): number {
    return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000)
}

/** A row logged on a later calendar day than the day it describes. */
function isRetroLogged(m: StreakEntry): boolean {
    if (!m.created_at) return false // optimistic rows
    return new Date(m.created_at).toLocaleDateString('en-CA') > m.date
}

export function computeStreaks(moods: StreakEntry[], today: string = localToday()): StreakInfo {
    const dates = new Set(moods.map(m => m.date))

    // Current streak: walk back from today (or yesterday if today is empty).
    let current = 0
    const start = dates.has(today) ? today : shiftDay(today, -1)
    let cursor = start
    while (dates.has(cursor)) {
        current++
        cursor = shiftDay(cursor, -1)
    }

    // Best streak: longest consecutive run.
    const sorted = [...dates].sort()
    let best = 0, run = 0
    for (let i = 0; i < sorted.length; i++) {
        run = i > 0 && dayDiff(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1
        if (run > best) best = run
    }

    // Repair: exactly one missing day directly behind the live streak
    // (or behind yesterday when nothing is logged yet), with an earlier
    // run on its far side to reconnect to.
    // `cursor` is the first empty day walking backwards.
    const gapDay = cursor
    const repairable = gapDay <= shiftDay(today, -1) // never "repair" today
        && !dates.has(gapDay)
        && dates.has(shiftDay(gapDay, -1)) // one-day gap only; two+ misses reset
        && dayDiff(gapDay, today) <= 2 // stale interior gaps from weeks ago don't count

    // One repair per rolling week, derived from data. A repair specifically
    // *bridges a one-day gap*: the retro-logged day has entries on BOTH sides.
    // A plain backfill (isolated day, or trailing catch-up) is not a repair and
    // must not burn the weekly allowance — otherwise filling in any past day
    // silently hides the repair hint.
    const weekAgo = shiftDay(today, -7)
    const repairUsed = moods.some(m =>
        m.date >= weekAgo
        && isRetroLogged(m)
        && dates.has(shiftDay(m.date, -1))
        && dates.has(shiftDay(m.date, 1)),
    )

    return {
        current,
        best,
        repairDate: repairable && !repairUsed ? gapDay : null,
        repairSpent: repairable && repairUsed,
        broken: current === 0 && best > 0,
    }
}
