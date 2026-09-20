'use client'
import { motion } from 'framer-motion'
import { cn, MoodGrade, MOODS } from '@/lib/utils'

interface MoodCellProps {
    date: Date
    mood?: MoodGrade | null
    onClick: () => void
    disabled?: boolean
}

export default function MoodCell({ date, mood, onClick, disabled }: MoodCellProps) {
    const isToday = new Date().toDateString() === date.toDateString()
    const moodConfig = mood ? MOODS[mood] : null

    if (disabled) {
        return <div className="w-8 h-8 rounded-full bg-transparent" />
    }

    return (
        <motion.button
            whileHover={{ scale: 1.2, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-extrabold transition-all relative group shadow-sm",
                moodConfig ? `${moodConfig.color} shadow-md hover:shadow-lg` : "bg-ink-100 dark:bg-ink-800 hover:bg-ink-200 dark:hover:bg-ink-700 border border-ink-200 dark:border-ink-700",
                isToday && !mood && "ring-2 ring-brand-400 dark:ring-brand-500 ring-offset-2 dark:ring-offset-ink-900 animate-pulse",
                moodConfig ? "text-white" : "text-ink-500 dark:text-ink-400 dark:text-ink-500"
            )}
            title={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        >
            {mood ? (
                <span className="text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    {MOODS[mood].emoji}
                </span>
            ) : (
                <span className="opacity-0 group-hover:opacity-60 transition-opacity text-xs font-bold text-ink-500 dark:text-ink-400">
                    +
                </span>
            )}
        </motion.button>
    )
}
