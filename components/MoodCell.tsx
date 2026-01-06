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
                moodConfig ? `${moodConfig.color} shadow-md hover:shadow-lg` : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700",
                isToday && !mood && "ring-2 ring-purple-400 dark:ring-purple-500 ring-offset-2 dark:ring-offset-gray-900 animate-pulse",
                moodConfig ? "text-white" : "text-gray-400 dark:text-gray-500"
            )}
            title={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        >
            {mood ? (
                <span className="text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    {MOODS[mood].emoji}
                </span>
            ) : (
                <span className="opacity-0 group-hover:opacity-60 transition-opacity text-xs font-bold text-gray-500 dark:text-gray-400">
                    +
                </span>
            )}
        </motion.button>
    )
}
