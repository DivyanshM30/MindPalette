'use client'
import { motion } from 'framer-motion'
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MoodGrade } from '@/lib/types'
import { getDaysInMonth, MONTH_NAMES } from '@/lib/utils'
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react'
import MoodCell from './MoodCell'
import MoodDialog from './MoodDialog'
import StatisticsPanel from './StatisticsPanel'
import { useToast } from './Toast'
import { useMoods } from '@/lib/hooks/useMoods'
import { useUser } from '@/contexts/UserContext'

interface MoodGridProps {
    showStats?: boolean
    year?: number
}

export default function MoodGrid({ showStats = true, year = new Date().getFullYear() }: MoodGridProps) {
    const { user } = useUser()
    const { moods, moodMap, loading, error, refetch, mutate } = useMoods(year)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const { showToast } = useToast()

    const months = MONTH_NAMES.map(m => m.slice(0, 3))

    const handleCellClick = useCallback((monthIndex: number, day: number) => {
        // Validation: Feb 30 shouldn't exist
        const daysInMonth = getDaysInMonth(year, monthIndex)
        if (day > daysInMonth) return

        setSelectedDate(new Date(year, monthIndex, day))
        setDialogOpen(true)
    }, [year])

    const handleSaveMood = async (mood: MoodGrade, note: string) => {
        if (!selectedDate || !user) return

        const dateStr = selectedDate.toLocaleDateString('en-CA')

        // Optimistic update
        mutate(dateStr, { mood, note })
        setDialogOpen(false)

        try {
            const { error: saveError } = await supabase
                .from('moods')
                .upsert({
                    user_id: user.id,
                    date: dateStr,
                    mood,
                    note
                }, { onConflict: 'user_id,date' })

            if (saveError) throw saveError
        } catch (err) {
            console.error('Error saving mood:', err)
            showToast('Failed to save your mood. Please try again.', 'error')
            refetch() // Roll back the optimistic update
        }
    }

    if (loading) {
        return (
            <div className="w-full aspect-[2/1] rounded-3xl border border-gray-200 dark:border-gray-800 flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Loader2 className="animate-spin" />
                    <span>Syncing your year...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full rounded-3xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10 p-10 flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="text-red-500 dark:text-red-400" size={32} />
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Couldn&apos;t load your moods</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Check your connection and try again.</p>
                </div>
                <button
                    onClick={refetch}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                    <RotateCcw size={16} /> Try again
                </button>
            </div>
        )
    }

    return (
        <div className="w-full space-y-8">
            {showStats && user && <StatisticsPanel moodData={moodMap} moods={moods} user={user} />}

            <div className="w-full overflow-x-auto pb-6 -mx-2 px-2">
                <div className="min-w-[800px] glass rounded-2xl p-6 md:p-8 border border-white/50 dark:border-white/10 shadow-xl">
                    {/* Header Row */}
                    <div className="flex mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-800/50">
                        <div className="w-10 sticky left-0 z-10 bg-transparent" /> {/* Corner Spacer */}
                        <div className="flex-1 grid grid-cols-12 gap-2 text-center">
                            {months.map(m => (
                                <div key={m} className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{m}</div>
                            ))}
                        </div>
                    </div>

                    {/* Grid Rows (Days 1-31) */}
                    <motion.div
                        variants={{
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { staggerChildren: 0.03 } }
                        }}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col gap-2.5"
                    >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <motion.div
                                key={day}
                                variants={{
                                    hidden: { opacity: 0, x: -10 },
                                    show: { opacity: 1, x: 0 }
                                }}
                                className="flex items-center group/row"
                            >
                                {/* Day Label */}
                                <div className="w-10 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center sticky left-0 z-10 bg-transparent pr-2">
                                    {day}
                                </div>
                                {/* Columns */}
                                <div className="flex-1 grid grid-cols-12 gap-2 place-items-center">
                                    {months.map((_, monthIndex) => {
                                        const daysInMonth = getDaysInMonth(year, monthIndex)
                                        const isValid = day <= daysInMonth
                                        // YYYY-MM-DD Key Construction
                                        // Note: monthIndex is 0-11. We need 01-12
                                        const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

                                        return (
                                            <MoodCell
                                                key={`${monthIndex}-${day}`}
                                                date={new Date(year, monthIndex, day)}
                                                mood={moodMap[dateKey]?.mood}
                                                onClick={() => handleCellClick(monthIndex, day)}
                                                disabled={!isValid}
                                            />
                                        )
                                    })}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {selectedDate && (
                    <MoodDialog
                        isOpen={dialogOpen}
                        onClose={() => setDialogOpen(false)}
                        onSelect={handleSaveMood}
                        date={selectedDate}
                        currentMood={moodMap[selectedDate.toLocaleDateString('en-CA')]?.mood}
                        currentNote={moodMap[selectedDate.toLocaleDateString('en-CA')]?.note}
                    />
                )}
            </div>
        </div>
    )
}
