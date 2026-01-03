'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Mood, MoodGrade } from '@/lib/types'
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { MOODS } from '@/lib/utils'
import CalendarPopup from './CalendarPopup'

export default function DayView() {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [user, setUser] = useState<User | null>(null)
    const [moodData, setMoodData] = useState<{ mood: MoodGrade | null, note: string, positive: string } | null>(null)
    const [allMoodData, setAllMoodData] = useState<Record<string, { mood: MoodGrade, note: string }>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)
    const [showMoodSelector, setShowMoodSelector] = useState(false)

    const supabase = createClient()

    const fetchDayData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (!user) return

            const dateStr = selectedDate.toLocaleDateString('en-CA')
            const { data, error } = await supabase
                .from('moods')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', dateStr)
                .single()

            if (error && error.code !== 'PGRST116') throw error

            if (data) {
                setMoodData({
                    mood: data.mood as MoodGrade,
                    note: data.note || '',
                    positive: data.positive_note || ''
                })
            } else {
                setMoodData({ mood: null, note: '', positive: '' })
            }

            // Also fetch all moods for calendar display
            const { data: allData } = await supabase
                .from('moods')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', `${selectedDate.getFullYear()}-01-01`)
                .lte('date', `${selectedDate.getFullYear()}-12-31`)

            if (allData) {
                const dataMap: Record<string, { mood: MoodGrade, note: string }> = {}
                allData.forEach((m: Mood) => {
                    dataMap[m.date] = { mood: m.mood, note: m.note || '' }
                })
                setAllMoodData(dataMap)
            }
        } catch (error) {
            console.error('Error fetching day data:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase, selectedDate])

    useEffect(() => {
        setLoading(true)
        fetchDayData()
    }, [fetchDayData])

    const handleDateChange = (newDate: Date) => {
        setSelectedDate(newDate)
        setShowCalendar(false)
    }

    const handlePrevDay = () => {
        const prev = new Date(selectedDate)
        prev.setDate(prev.getDate() - 1)
        setSelectedDate(prev)
    }

    const handleNextDay = () => {
        const next = new Date(selectedDate)
        next.setDate(next.getDate() + 1)
        setSelectedDate(next)
    }

    const handleMoodSelect = async (mood: MoodGrade) => {
        setMoodData(prev => prev ? { ...prev, mood } : { mood, note: '', positive: '' })
        setShowMoodSelector(false)
        await saveData(mood, moodData?.note || '', moodData?.positive || '')
    }

    const handleNoteChange = (field: 'note' | 'positive', value: string) => {
        setMoodData(prev => prev ? { ...prev, [field]: value } : { mood: null, note: '', positive: '', [field]: value })
    }

    const saveData = async (mood: MoodGrade | null, note: string, positive: string) => {
        if (!user) return

        setSaving(true)
        try {
            const dateStr = selectedDate.toLocaleDateString('en-CA')
            
            if (mood) {
                const { error } = await supabase
                    .from('moods')
                    .upsert({
                        user_id: user.id,
                        date: dateStr,
                        mood,
                        note: note || null,
                        positive_note: positive || null
                    }, { onConflict: 'user_id,date' })

                if (error) throw error
            }
        } catch (error) {
            console.error('Error saving data:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleSave = async () => {
        if (!moodData?.mood) return
        await saveData(moodData.mood, moodData.note, moodData.positive)
    }

    const isToday = new Date().toDateString() === selectedDate.toDateString()
    const dateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Loader2 className="animate-spin" size={32} />
                    <span>Loading your day...</span>
                </div>
            </div>
        )
    }

    return (
        <div id="day-view" className="w-full max-w-3xl mx-auto space-y-8">
            {/* Date Navigation */}
            <div className="flex items-center justify-center gap-4 mb-8">
                <button
                    onClick={handlePrevDay}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Previous day"
                >
                    <ChevronLeft size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
                
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCalendar(true)}
                    className="px-6 py-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
                >
                    <Calendar size={20} className="text-purple-500" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {dateStr}
                    </span>
                </motion.button>

                <button
                    onClick={handleNextDay}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Next day"
                >
                    <ChevronRight size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
            </div>

            {/* Main Content Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-8 md:p-10 border border-white/50 dark:border-white/10 shadow-xl"
            >
                {/* Question */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    How was your day {isToday ? 'today' : ''}?
                </h2>

                {/* Mood Selector */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Select your mood
                    </label>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowMoodSelector(!showMoodSelector)}
                        className="w-full px-6 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all text-left flex items-center justify-between group"
                    >
                                    <div className="flex items-center gap-3">
                            {moodData?.mood ? (
                                <>
                                    <div className={`w-12 h-12 rounded-xl ${MOODS[moodData.mood].color} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                                        {moodData.mood}
                                    </div>
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {MOODS[moodData.mood].emoji} {MOODS[moodData.mood].label}
                                    </span>
                                </>
                            ) : (
                                <span className="text-gray-500 dark:text-gray-400">Choose a mood...</span>
                            )}
                        </div>
                        <ChevronRight 
                            size={20} 
                            className={`text-gray-400 transition-transform ${showMoodSelector ? 'rotate-90' : ''}`}
                        />
                    </motion.button>

                    {/* Mood Options */}
                    <AnimatePresence>
                        {showMoodSelector && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 grid grid-cols-5 gap-3 overflow-hidden"
                            >
                                {(Object.entries(MOODS) as [MoodGrade, typeof MOODS[MoodGrade]][]).map(([grade, data]) => (
                                    <motion.button
                                        key={grade}
                                        whileHover={{ scale: 1.1, y: -4 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleMoodSelect(grade)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                                            moodData?.mood === grade
                                                ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-400 dark:ring-purple-500'
                                                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl ${data.color} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                                            {grade}
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {data.emoji} {data.label}
                                        </span>
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Text Inputs */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Describe
                        </label>
                        <textarea
                            value={moodData?.note || ''}
                            onChange={(e) => handleNoteChange('note', e.target.value)}
                            onBlur={() => moodData?.mood && saveData(moodData.mood, moodData.note || '', moodData.positive || '')}
                            placeholder="What happened today? How did you feel?"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-none h-32 text-sm transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            What was something good that happened today?
                        </label>
                        <textarea
                            value={moodData?.positive || ''}
                            onChange={(e) => handleNoteChange('positive', e.target.value)}
                            onBlur={() => moodData?.mood && saveData(moodData.mood, moodData.note || '', moodData.positive || '')}
                            placeholder="Even on tough days, there's usually something positive..."
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-none h-32 text-sm transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                </div>

                {/* Save Button */}
                {moodData?.mood && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="mt-8 w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Saving...
                            </>
                        ) : (
                            'Save Entry'
                        )}
                    </motion.button>
                )}
            </motion.div>

            {/* Calendar Popup */}
            <CalendarPopup
                isOpen={showCalendar}
                onClose={() => setShowCalendar(false)}
                selectedDate={selectedDate}
                onDateSelect={handleDateChange}
                moodData={allMoodData}
            />
        </div>
    )
}

