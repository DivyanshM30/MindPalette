'use client'
import { motion } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Mood, MoodGrade } from '@/lib/types'
import { Loader2 } from 'lucide-react'
import MoodCell from './MoodCell'
import MoodDialog from './MoodDialog'
import StatisticsPanel from './StatisticsPanel'

// Helper to get days in a month
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

export default function MoodGrid() {
    const [year] = useState(2026)
    const [user, setUser] = useState<User | null>(null)
    const [moodData, setMoodData] = useState<Record<string, { mood: MoodGrade, note: string }>>({})
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const supabase = createClient()

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    // Fetch Moods
    const fetchMoods = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (!user) return

            const { data, error } = await supabase
                .from('moods')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', `${year}-01-01`)
                .lte('date', `${year}-12-31`)

            if (error) throw error

            const dataMap: Record<string, { mood: MoodGrade, note: string }> = {}
            data?.forEach((m: Mood) => {
                dataMap[m.date] = { mood: m.mood, note: m.note || '' }
            })
            setMoodData(dataMap)
        } catch (error) {
            console.error('Error fetching moods:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase, year])

    useEffect(() => {
        fetchMoods()
    }, [fetchMoods])

    // Optimize date interactions
    const handleCellClick = useCallback((monthIndex: number, day: number) => {
        // Validation: Feb 30 shouldn't exist
        const daysInMonth = getDaysInMonth(year, monthIndex)
        if (day > daysInMonth) return

        const date = new Date(year, monthIndex, day)
        // Adjust for timezone offset to ensure "2026-01-01" isn't "2025-12-31" depending on where user is
        // Best practice: work with "YYYY-MM-DD" strings for keys, but Date objects for UI labels
        setSelectedDate(date)
        setDialogOpen(true)
    }, [year])

    const handleSaveMood = async (mood: MoodGrade, note: string) => {
        if (!selectedDate) return

        // Format to YYYY-MM-DD local time approach
        const dateStr = selectedDate.toLocaleDateString('en-CA') // YYYY-MM-DD format

        // Optimistic Update
        const previousData = { ...moodData }
        setMoodData(prev => ({ ...prev, [dateStr]: { mood, note } }))
        setDialogOpen(false)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user')

            const { error } = await supabase
                .from('moods')
                .upsert({
                    user_id: user.id,
                    date: dateStr,
                    mood,
                    note
                }, { onConflict: 'user_id,date' })

            if (error) throw error
        } catch (error) {
            console.error('Error saving mood:', error)
            setMoodData(previousData) // Rollback
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

    return (
        <div className="w-full space-y-8">
            {user && <StatisticsPanel moodData={moodData} user={user} />}

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
                                                mood={moodData[dateKey]?.mood}
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
                        currentMood={moodData[selectedDate.toLocaleDateString('en-CA')]?.mood}
                        currentNote={moodData[selectedDate.toLocaleDateString('en-CA')]?.note}
                    />
                )}
            </div>
        </div>
    )
}
