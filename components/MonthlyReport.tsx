'use client'
import { useMemo, useState } from 'react'
import { FileText, Printer, Lock } from 'lucide-react'
import { Mood, MoodGrade } from '@/lib/types'
import { MOODS } from '@/lib/utils'
import { buildMonthReport, describeAverage, WEEKDAY_LABELS } from '@/lib/report'

/**
 * P1-7 monthly report — an on-screen "sheet" that doubles as the print output.
 *
 * Design decisions worth keeping:
 *  - WYSIWYG: what prints is this exact DOM node, not a second hidden layout.
 *    `@media print` in globals.css hides the app chrome (`.print-hide`) and
 *    lets the sheet fill the page, so the preview can't drift from the paper.
 *  - The sheet is deliberately light-themed in both themes: it's a document,
 *    not a screen surface, and a dark sheet would print as a wall of ink.
 *    Colours are inline hex (not Tailwind dark-variant classes) so no theme
 *    state can leak into the printed page.
 *  - Written text is opt-in. Mood data is sensitive and this is a page people
 *    print and hand to a therapist, so notes and good things are OFF until
 *    the user asks for them.
 */

interface MonthlyReportProps {
    /** Rows for the fetched year; the report slices out the month it needs. */
    moods: Mood[]
    year: number
    /** 0-indexed month, kept in sync with the insights month selector. */
    month: number
    userName?: string
}

/** Solid print-safe swatches — gradients don't survive a printer. */
const SWATCH: Record<MoodGrade, string> = {
    A: '#10b981',
    B: '#f59e0b',
    C: '#8b5cf6',
    D: '#f97316',
    F: '#64748b',
}

const INK = '#0f172a'
const MUTED = '#64748b'
const LINE = '#e2e8f0'
const EMPTY = '#f1f5f9'
const GRADES: MoodGrade[] = ['A', 'B', 'C', 'D', 'F']

const sheetLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: MUTED,
}

const card: React.CSSProperties = {
    border: `1px solid ${LINE}`,
    borderRadius: 10,
    padding: '12px 14px',
    breakInside: 'avoid',
}

const sectionStyle: React.CSSProperties = {
    marginTop: 22,
    breakInside: 'avoid',
}

export default function MonthlyReport({ moods, year, month, userName }: MonthlyReportProps) {
    const [includeNotes, setIncludeNotes] = useState(false)
    const [includeGoodThings, setIncludeGoodThings] = useState(false)

    const report = useMemo(() => buildMonthReport(moods, year, month), [moods, year, month])

    const generatedOn = useMemo(
        () => new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
        [],
    )

    const hasNotes = report.notes.length > 0
    const hasGoodThings = report.goodThings.length > 0
    const showNotes = includeNotes && hasNotes
    const showGoodThings = includeGoodThings && hasGoodThings
    const includesText = showNotes || showGoodThings

    if (report.logged === 0) {
        return (
            <section className="print-hide rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText size={18} className="text-purple-500" /> Monthly Report
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Log a few days in {report.monthLabel} and a printable report will appear here.
                </p>
            </section>
        )
    }

    const maxCount = Math.max(...GRADES.map(g => report.counts[g]), 1)
    const leadingBlanks = report.days[0].weekday

    // `scroll-mt-24` on the section clears the sticky header when the insights
    // banner scrolls here, or when the dashboard notice deep-links to #monthly-report.
    return (
        <section id="monthly-report" className="scroll-mt-24 space-y-4">

            {/* ── CONTROLS (never printed) ── */}
            <div className="print-hide rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText size={18} className="text-purple-500" /> Monthly Report
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            A one-page summary of {report.monthLabel} — print it or save it as a PDF to share with a therapist.
                        </p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                    >
                        <Printer size={16} /> Print / Save as PDF
                    </button>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1.5 mb-3">
                        <Lock size={12} className="text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            What&apos;s included
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Toggle
                            checked={includeGoodThings}
                            disabled={!hasGoodThings}
                            onChange={setIncludeGoodThings}
                            label="Good things"
                            hint={hasGoodThings
                                ? `${report.goodThings.length} this month`
                                : 'none logged this month'}
                        />
                        <Toggle
                            checked={includeNotes}
                            disabled={!hasNotes}
                            onChange={setIncludeNotes}
                            label="Daily notes"
                            hint={hasNotes
                                ? `${report.notes.length} this month`
                                : 'none written this month'}
                        />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3">
                        {includesText
                            ? 'Your written entries will appear on the report. Everything stays on your device until you print it.'
                            : 'Charts and numbers only — no written entries leave this page.'}
                    </p>
                </div>
            </div>

            {/* ── THE SHEET (this is exactly what prints) ── */}
            <div className="flex justify-center">
                <div
                    id="report-sheet"
                    style={{
                        width: '100%',
                        maxWidth: 720,
                        background: '#ffffff',
                        color: INK,
                        padding: 32,
                        borderRadius: 16,
                        border: `1px solid ${LINE}`,
                        boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact',
                    }}
                >
                    {/* Masthead */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                            <div style={sheetLabel}>Mood report</div>
                            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15, marginTop: 2 }}>
                                {report.monthLabel}
                            </div>
                            {userName && (
                                <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{userName}</div>
                            )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 800 }}>MindPalette</div>
                            <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Generated {generatedOn}</div>
                        </div>
                    </div>

                    <div style={{ height: 1, background: LINE, margin: '16px 0 18px' }} />

                    {/* Plain-language summary */}
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                        {report.logged} of {report.daysInMonth} days logged ({Math.round(report.coverage)}%) —{' '}
                        {describeAverage(report.avgScore)}, averaging{' '}
                        <strong>{report.avgScore.toFixed(1)} out of 5.0</strong>.
                        {report.delta !== null && Math.abs(report.delta) >= 0.05 && (
                            <> That&apos;s {Math.abs(report.delta).toFixed(1)} {report.delta > 0 ? 'higher' : 'lower'} than the month before.</>
                        )}
                        {report.delta !== null && Math.abs(report.delta) < 0.05 && (
                            <> About the same as the month before.</>
                        )}
                    </p>

                    {/* Stat strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
                        <Stat label="Days logged" value={`${report.logged}`} sub={`of ${report.daysInMonth}`} />
                        <Stat label="Average" value={report.avgScore.toFixed(1)} sub="out of 5.0" />
                        <Stat
                            label="Most frequent"
                            value={report.dominant ? MOODS[report.dominant].label : '—'}
                            sub={report.dominant ? `${report.counts[report.dominant]} days` : ''}
                            accent={report.dominant ? SWATCH[report.dominant] : undefined}
                        />
                        <Stat label="Longest streak" value={`${report.bestStreak}`} sub={report.bestStreak === 1 ? 'day' : 'days'} />
                    </div>

                    {/* Distribution */}
                    <div style={sectionStyle}>
                        <div style={sheetLabel}>Mood distribution</div>
                        <div style={{ marginTop: 10 }}>
                            {GRADES.map(grade => {
                                const count = report.counts[grade]
                                const pct = (count / report.logged) * 100
                                return (
                                    <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, width: 58, flexShrink: 0 }}>
                                            {MOODS[grade].label}
                                        </span>
                                        <div style={{ flex: 1, height: 16, background: EMPTY, borderRadius: 4, overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    width: `${(count / maxCount) * 100}%`,
                                                    height: '100%',
                                                    background: SWATCH[grade],
                                                    borderRadius: 4,
                                                }}
                                            />
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 700, width: 62, textAlign: 'right', flexShrink: 0 }}>
                                            {count} · {Math.round(pct)}%
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Calendar pixels */}
                    <div style={sectionStyle}>
                        <div style={sheetLabel}>Day by day</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 10 }}>
                            {WEEKDAY_LABELS.map(d => (
                                <div key={d} style={{ fontSize: 9, color: MUTED, textAlign: 'center', fontWeight: 700 }}>
                                    {d.charAt(0)}
                                </div>
                            ))}
                            {Array.from({ length: leadingBlanks }, (_, i) => <div key={`pad-${i}`} />)}
                            {report.days.map(d => (
                                <div
                                    key={d.date}
                                    style={{
                                        aspectRatio: '1 / 1',
                                        borderRadius: 4,
                                        background: d.mood ? SWATCH[d.mood] : EMPTY,
                                        border: d.mood ? 'none' : `1px solid ${LINE}`,
                                        color: d.mood ? '#ffffff' : '#94a3b8',
                                        fontSize: 9,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {d.day}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
                            {GRADES.map(grade => (
                                <span key={grade} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: MUTED }}>
                                    <span style={{ width: 9, height: 9, borderRadius: 2, background: SWATCH[grade] }} />
                                    {MOODS[grade].label}
                                </span>
                            ))}
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: MUTED }}>
                                <span style={{ width: 9, height: 9, borderRadius: 2, background: EMPTY, border: `1px solid ${LINE}` }} />
                                Not logged
                            </span>
                        </div>
                    </div>

                    {/* Weekday pattern + notable days */}
                    <div style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 16 }}>
                        <div>
                            <div style={sheetLabel}>By weekday</div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 76, marginTop: 12 }}>
                                {report.weekdayAverages.map((avg, i) => (
                                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ height: 56, display: 'flex', alignItems: 'flex-end' }}>
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: avg === null ? 2 : `${Math.max(((avg - 1) / 4) * 100, 6)}%`,
                                                    background: avg === null ? LINE : '#8b5cf6',
                                                    borderRadius: '3px 3px 0 0',
                                                }}
                                            />
                                        </div>
                                        <div style={{ fontSize: 9, color: MUTED, marginTop: 4, fontWeight: 600 }}>
                                            {WEEKDAY_LABELS[i].charAt(0)}
                                        </div>
                                        <div style={{ fontSize: 9, color: MUTED }}>
                                            {avg === null ? '–' : avg.toFixed(1)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {report.bestWeekday !== null && report.worstWeekday !== null && (
                                <p style={{ fontSize: 11, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>
                                    Highest on {WEEKDAY_LABELS[report.bestWeekday]}s, lowest on {WEEKDAY_LABELS[report.worstWeekday]}s.
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {report.best && (
                                <NotableDay label="Best day" mood={report.best.mood} date={report.best.date} />
                            )}
                            {report.worst && (
                                <NotableDay label="Toughest day" mood={report.worst.mood} date={report.worst.date} />
                            )}
                        </div>
                    </div>

                    {/* Good things (opt-in) */}
                    {showGoodThings && (
                        <div style={sectionStyle}>
                            <div style={sheetLabel}>Good things ({report.goodThings.length})</div>
                            <div style={{ marginTop: 10 }}>
                                {report.goodThings.map(entry => (
                                    <EntryRow key={entry.date} label={entry.label} text={entry.text} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Daily notes (opt-in) */}
                    {showNotes && (
                        <div style={sectionStyle}>
                            <div style={sheetLabel}>Daily notes ({report.notes.length})</div>
                            <div style={{ marginTop: 10 }}>
                                {report.notes.map(entry => (
                                    <EntryRow
                                        key={entry.date}
                                        label={entry.label}
                                        text={entry.text}
                                        dot={SWATCH[entry.mood]}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ height: 1, background: LINE, margin: '22px 0 10px' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 9, color: MUTED }}>
                        <span>Generated by MindPalette · a free, private mood tracker</span>
                        <span>{includesText ? 'Includes personal written entries' : 'Summary data only'}</span>
                    </div>
                </div>
            </div>
        </section>
    )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
    return (
        <div style={card}>
            <div style={{ ...sheetLabel, fontSize: 9 }}>{label}</div>
            <div style={{ fontSize: 19, fontWeight: 800, marginTop: 3, color: accent || INK, lineHeight: 1.2 }}>
                {value}
            </div>
            {sub && <div style={{ fontSize: 10, color: MUTED }}>{sub}</div>}
        </div>
    )
}

function NotableDay({ label, mood, date }: { label: string; mood: MoodGrade; date: string }) {
    const formatted = new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric',
    })
    return (
        <div style={card}>
            <div style={{ ...sheetLabel, fontSize: 9 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 3 }}>{formatted}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: MUTED, marginTop: 2 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: SWATCH[mood] }} />
                {MOODS[mood].label}
            </div>
        </div>
    )
}

function EntryRow({ label, text, dot }: { label: string; text: string; dot?: string }) {
    return (
        <div style={{ display: 'flex', gap: 10, padding: '6px 0', borderTop: `1px solid ${LINE}`, breakInside: 'avoid' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: 62, flexShrink: 0 }}>
                {dot && <span style={{ width: 7, height: 7, borderRadius: 2, background: dot, flexShrink: 0 }} />}
                <span style={{ fontSize: 10, fontWeight: 700, color: MUTED }}>{label}</span>
            </div>
            <p style={{ fontSize: 11.5, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {text}
            </p>
        </div>
    )
}

function Toggle({
    checked, disabled, onChange, label, hint,
}: {
    checked: boolean
    disabled?: boolean
    onChange: (v: boolean) => void
    label: string
    hint: string
}) {
    return (
        <label
            className={`flex items-start gap-2.5 flex-1 rounded-xl border p-3 transition-colors ${disabled
                ? 'border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500/50 cursor-pointer'
                }`}
        >
            <input
                type="checkbox"
                checked={checked && !disabled}
                disabled={disabled}
                onChange={e => onChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-purple-500 disabled:cursor-not-allowed"
            />
            <span className="leading-tight">
                <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</span>
                <span className="block text-[11px] text-gray-400 mt-0.5">{hint}</span>
            </span>
        </label>
    )
}
