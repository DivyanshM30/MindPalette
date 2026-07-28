import { Mood, MoodGrade } from './types'
import { MOOD_SCORES, MONTH_NAMES, getDaysInMonth } from './utils'

/**
 * P1-7 monthly report — pure data layer.
 *
 * Everything the printable report shows is derived here from rows the user
 * already has; nothing hits the network and no new columns are required.
 * Kept free of React so the numbers can be reasoned about (and later tested)
 * independently of how they're rendered on screen or on paper.
 *
 * Dates are parsed with an explicit `T00:00:00` so a `YYYY-MM-DD` row lands on
 * the day the user actually logged it, rather than shifting a day in negative
 * UTC offsets (the mistake elsewhere in the codebase).
 */

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const GRADES: MoodGrade[] = ['A', 'B', 'C', 'D', 'F']

/** Local-time date parts of a YYYY-MM-DD string. */
function parts(date: string): { year: number; month: number; day: number; weekday: number } {
    const d = new Date(date + 'T00:00:00')
    return {
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
        // Monday-first: reports read better starting on the work week.
        weekday: (d.getDay() + 6) % 7,
    }
}

export interface ReportDay {
    date: string
    day: number
    /** 0 = Monday. */
    weekday: number
    mood: MoodGrade | null
}

export interface ReportEntry {
    date: string
    day: number
    /** "Mon 14" — pre-formatted so the renderer stays dumb. */
    label: string
    mood: MoodGrade
    text: string
}

export interface MonthReport {
    year: number
    /** 0-indexed, matching Date#getMonth. */
    month: number
    monthLabel: string
    daysInMonth: number
    logged: number
    /** Percentage of the month's days with an entry, 0–100. */
    coverage: number
    counts: Record<MoodGrade, number>
    /** Mean mood score 1–5; 0 when nothing is logged. */
    avgScore: number
    /** Most frequently logged mood; null when nothing is logged. */
    dominant: MoodGrade | null
    best: Mood | null
    worst: Mood | null
    /** Longest run of consecutive logged days inside this month. */
    bestStreak: number
    /** Mean score per weekday, Monday-first; null where that weekday has no entries. */
    weekdayAverages: (number | null)[]
    bestWeekday: number | null
    worstWeekday: number | null
    /** Previous month's mean, when it falls inside the supplied rows. */
    prevAvg: number | null
    /** avgScore − prevAvg, or null when there's nothing to compare against. */
    delta: number | null
    /** Every day of the month in order, logged or not — drives the pixel grid. */
    days: ReportDay[]
    notes: ReportEntry[]
    goodThings: ReportEntry[]
}

function mean(scores: number[]): number {
    if (scores.length === 0) return 0
    return scores.reduce((a, b) => a + b, 0) / scores.length
}

function entryLabel(date: string): string {
    const d = new Date(date + 'T00:00:00')
    return `${WEEKDAY_LABELS[(d.getDay() + 6) % 7]} ${d.getDate()}`
}

/**
 * Longest run of consecutive calendar days present in `dayNumbers`
 * (day-of-month integers, unsorted).
 */
function longestRun(dayNumbers: number[]): number {
    const sorted = [...new Set(dayNumbers)].sort((a, b) => a - b)
    let best = 0
    let run = 0
    for (let i = 0; i < sorted.length; i++) {
        run = i > 0 && sorted[i] - sorted[i - 1] === 1 ? run + 1 : 1
        if (run > best) best = run
    }
    return best
}

/**
 * Builds the report for one month out of a set of mood rows.
 *
 * `moods` may span any range — typically the calendar year already fetched by
 * `useMoods`. Rows outside the target month are ignored except for the
 * previous-month comparison, which is simply omitted when those rows aren't
 * present (e.g. January, whose predecessor lives in the prior year's fetch).
 */
export function buildMonthReport(moods: Mood[], year: number, month: number): MonthReport {
    const daysInMonth = getDaysInMonth(year, month)

    const inMonth: Mood[] = []
    const prevScores: number[] = []
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year

    moods.forEach(m => {
        const p = parts(m.date)
        if (p.year === year && p.month === month) inMonth.push(m)
        else if (p.year === prevYear && p.month === prevMonth) prevScores.push(MOOD_SCORES[m.mood])
    })

    const byDay = new Map<number, Mood>()
    inMonth.forEach(m => byDay.set(parts(m.date).day, m))

    const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 } as Record<MoodGrade, number>
    inMonth.forEach(m => { counts[m.mood]++ })

    const avgScore = mean(inMonth.map(m => MOOD_SCORES[m.mood]))

    // Ties resolve to the higher-scoring grade so "most frequent" never
    // reports a bleaker mood than the data supports.
    const dominant = inMonth.length === 0
        ? null
        : GRADES.reduce((a, b) => (counts[b] > counts[a] ? b : a), GRADES[0])

    // Earliest date wins a tie, so best/worst point at the first such day.
    const best = inMonth.reduce<Mood | null>(
        (acc, m) => (!acc || MOOD_SCORES[m.mood] > MOOD_SCORES[acc.mood] ? m : acc), null)
    const worst = inMonth.reduce<Mood | null>(
        (acc, m) => (!acc || MOOD_SCORES[m.mood] < MOOD_SCORES[acc.mood] ? m : acc), null)

    const perWeekday: number[][] = Array.from({ length: 7 }, () => [])
    inMonth.forEach(m => { perWeekday[parts(m.date).weekday].push(MOOD_SCORES[m.mood]) })
    const weekdayAverages = perWeekday.map(scores => (scores.length ? mean(scores) : null))

    const rankedWeekdays = weekdayAverages
        .map((avg, i) => ({ avg, i }))
        .filter((w): w is { avg: number; i: number } => w.avg !== null)
        .sort((a, b) => b.avg - a.avg)

    // A single logged weekday is not a pattern — needs at least two to compare.
    const bestWeekday = rankedWeekdays.length >= 2 ? rankedWeekdays[0].i : null
    const worstWeekday = rankedWeekdays.length >= 2 ? rankedWeekdays[rankedWeekdays.length - 1].i : null

    const days: ReportDay[] = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return { date, day, weekday: parts(date).weekday, mood: byDay.get(day)?.mood ?? null }
    })

    const sorted = [...inMonth].sort((a, b) => a.date.localeCompare(b.date))

    const notes: ReportEntry[] = sorted
        .filter(m => m.note && m.note.trim().length > 0)
        .map(m => ({
            date: m.date,
            day: parts(m.date).day,
            label: entryLabel(m.date),
            mood: m.mood,
            text: m.note!.trim(),
        }))

    const goodThings: ReportEntry[] = sorted
        .filter(m => m.positive_note && m.positive_note.trim().length > 0)
        .map(m => ({
            date: m.date,
            day: parts(m.date).day,
            label: entryLabel(m.date),
            mood: m.mood,
            text: m.positive_note!.trim(),
        }))

    const prevAvg = prevScores.length ? mean(prevScores) : null

    return {
        year,
        month,
        monthLabel: `${MONTH_NAMES[month]} ${year}`,
        daysInMonth,
        logged: inMonth.length,
        coverage: (inMonth.length / daysInMonth) * 100,
        counts,
        avgScore,
        dominant,
        best,
        worst,
        bestStreak: longestRun([...byDay.keys()]),
        weekdayAverages,
        bestWeekday,
        worstWeekday,
        prevAvg,
        delta: prevAvg !== null && inMonth.length > 0 ? avgScore - prevAvg : null,
        days,
        notes,
        goodThings,
    }
}

/** Plain-language reading of a 1–5 mean, for the report's summary line. */
export function describeAverage(avg: number): string {
    if (avg >= 4.5) return 'mostly great days'
    if (avg >= 3.5) return 'mostly good days'
    if (avg >= 2.5) return 'a fairly even month'
    if (avg >= 1.5) return 'a tough month'
    return 'a very hard month'
}
