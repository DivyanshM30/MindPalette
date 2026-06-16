'use client'
import { motion } from 'framer-motion'
import { MONTH_NAMES } from '@/lib/utils'

interface MoodTrendChartProps {
    monthlyTrend: (number | null)[]
    selectedMonth: number
    onSelectMonth: (month: number) => void
}

const W = 600, H = 160, PAD = 30

const DOT_COLOR = (avg: number) =>
    avg >= 4.5 ? '#10b981' : avg >= 3.5 ? '#f59e0b' : avg >= 2.5 ? '#a855f7' : avg >= 1.5 ? '#f97316' : '#94a3b8'

const GLOW_COLORS = ['#10b981', '#f59e0b', '#a855f7', '#f97316', '#94a3b8']

const LEGEND: [string, string][] = [
    ['#10b981', 'Great (A)'],
    ['#f59e0b', 'Good (B)'],
    ['#a855f7', 'Okay (C)'],
    ['#f97316', 'Bad (D)'],
    ['#94a3b8', 'Awful (F)'],
]

const Y_LABELS: Record<number, string> = { 5: 'Great', 4: 'Good', 3: 'Okay', 2: 'Bad', 1: 'Awful' }

export default function MoodTrendChart({ monthlyTrend, selectedMonth, onSelectMonth }: MoodTrendChartProps) {
    const points = monthlyTrend.map((avg, i) => ({
        x: PAD + (i / 11) * (W - PAD * 2),
        y: avg ? PAD + ((5 - avg) / 4) * (H - PAD * 2) : null,
        avg, i
    }))
    const active = points.filter(p => p.y !== null)

    const linePath = active.length >= 2
        ? active.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y!}`).join(' ')
        : ''

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 240 }}>
                <defs>
                    {GLOW_COLORS.map((c, ci) => (
                        <filter key={ci} id={`glow${ci}`} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    ))}
                </defs>

                {/* Y-axis grid lines */}
                {[1, 2, 3, 4, 5].map(score => {
                    const y = PAD + ((5 - score) / 4) * (H - PAD * 2)
                    return (
                        <g key={score}>
                            <line x1={PAD} y1={y} x2={W - PAD} y2={y}
                                stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" strokeDasharray="4 4"
                                className="text-gray-400" />
                            <text x={PAD - 6} y={y + 4} textAnchor="end"
                                className="fill-gray-300 dark:fill-gray-600" style={{ fontSize: 8 }}>
                                {Y_LABELS[score]}
                            </text>
                        </g>
                    )
                })}

                {/* Connecting line */}
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

                {/* Dots + labels */}
                {points.map((p) => {
                    const color = p.avg ? DOT_COLOR(p.avg) : '#e5e7eb'
                    const isSelected = p.i === selectedMonth
                    return (
                        <g key={p.i} onClick={() => onSelectMonth(p.i)} style={{ cursor: 'pointer' }}>
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
                                    {/* Score label */}
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
                {LEGEND.map(([c, l]) => (
                    <div key={l} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                        <span className="text-[10px] text-gray-400">{l}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
