'use client'
import MoodIcon from '@/components/MoodIcon'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Mood, MoodGrade } from '@/lib/types'
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { MOODS } from '@/lib/utils'
import CalendarPopup from './CalendarPopup'
import { useToast } from './Toast'
import { useUser } from '@/contexts/UserContext'
import { saveMood, waitForMoodWrites } from '@/lib/mood-persistence'
import { useActiveView } from '@/lib/hooks/useActiveView'

type DayEntry = { mood: MoodGrade | null, note: string, positive: string }

export default function DayView() {
    const { user, loading: userLoading, isCurrentUser } = useUser()
    const ownerId = user?.id
    const searchParams = useSearchParams()
    // Deep-link support (?date=YYYY-MM-DD), used by streak repair. Past dates only.
    const [selectedDate, setSelectedDate] = useState(() => {
        const param = searchParams.get('date')
        if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
            const d = new Date(param + 'T00:00:00')
            if (!isNaN(d.getTime()) && d <= new Date()) return d
        }
        return new Date()
    })
    const [moodData, setMoodData] = useState<DayEntry | null>(null)
    const [allMoodData, setAllMoodData] = useState<Record<string, { mood: MoodGrade, note: string }>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)
    const [showMoodSelector, setShowMoodSelector] = useState(false)

    // The provider resets this editor on identity changes. Keep every unsaved
    // snapshot (including failed saves), not only notes without a mood.
    const draftsRef = useRef<Record<string, DayEntry>>({})
    const requestId = useRef(0)
    const pendingSaves = useRef(0)
    const isActive = useActiveView()
    const dayKey = selectedDate.toLocaleDateString('en-CA')
    const currentDay = useRef(dayKey)
    currentDay.current = dayKey
    const [loadedDay, setLoadedDay] = useState('')
    const [loadError, setLoadError] = useState(false)
    const { showToast } = useToast()

    const fetchDayData = useCallback(async () => {
        const request = ++requestId.current
        const isCurrent = () => isActive() && request === requestId.current && currentDay.current === dayKey
        if (!ownerId) { setLoading(false); return }
        setLoading(true)
        setLoadError(false)
        try {
            await waitForMoodWrites(ownerId, dayKey)
            if (!isCurrent()) return
            const { data, error } = await supabase
                .from('moods').select('*').eq('user_id', ownerId).eq('date', dayKey).maybeSingle()
            if (error) throw error
            if (!isCurrent()) return
            setMoodData(draftsRef.current[dayKey] ?? (data ? {
                mood: data.mood as MoodGrade, note: data.note || '', positive: data.positive_note || ''
            } : { mood: null, note: '', positive: '' }))

            const { data: allData, error: calendarError } = await supabase
                .from('moods').select('*').eq('user_id', ownerId)
                .gte('date', `${dayKey.slice(0, 4)}-01-01`).lte('date', `${dayKey.slice(0, 4)}-12-31`)
            if (calendarError) throw calendarError
            if (!isCurrent()) return
            const dataMap: Record<string, { mood: MoodGrade, note: string }> = {}
            allData?.forEach((m: Mood) => { dataMap[m.date] = { mood: m.mood, note: m.note || '' } })
            setAllMoodData(dataMap)
        } catch (error) {
            if (isCurrent()) {
                console.error('Error fetching day data:', error)
                setLoadError(true)
            }
        } finally {
            if (isCurrent()) { setLoadedDay(dayKey); setLoading(false) }
        }
    }, [dayKey, ownerId, isActive])

    useEffect(() => {
        const requests = requestId
        if (!userLoading) void fetchDayData()
        return () => { ++requests.current }
    }, [fetchDayData, userLoading])

    const saveData = useCallback(async (mood: MoodGrade | null, note: string, positive: string) => {
        if (!ownerId || !mood || !isActive() || loading || loadError || loadedDay !== dayKey) return
        const snapshot = { mood, note, positive }
        draftsRef.current[dayKey] = snapshot
        ++pendingSaves.current
        setSaving(true)
        try {
            await saveMood({ user_id: ownerId, date: dayKey, mood, note: note || null, positive_note: positive || null }, isCurrentUser)
            if (!isActive()) return
            // A save acknowledgement must never discard edits typed afterward.
            if (draftsRef.current[dayKey] === snapshot) delete draftsRef.current[dayKey]
            setAllMoodData(prev => ({ ...prev, [dayKey]: { mood, note } }))
            showToast('Mood saved successfully.')
        } catch (error) {
            if (isActive()) {
                console.error('Error saving data:', error)
                showToast('Failed to save. Your draft is kept in this tab; retry Save Entry.', 'error')
            }
        } finally {
            --pendingSaves.current
            if (isActive()) setSaving(pendingSaves.current > 0)
        }
    }, [ownerId, dayKey, showToast, isActive, isCurrentUser, loading, loadError, loadedDay])

    // If the user typed text but hasn't picked a mood, it can't be saved yet —
    // let them know it's kept as a draft when they navigate away.
    const warnIfUnsavedDraft = useCallback(() => {
        if (draftsRef.current[dayKey]) {
            showToast('Unsaved changes kept in this tab — return to this day to save them.', 'info')
        }
    }, [dayKey, showToast])

    const handleDateChange = (newDate: Date) => {
        warnIfUnsavedDraft()
        setSelectedDate(newDate)
        setShowCalendar(false)
    }

    const handlePrevDay = useCallback(() => {
        warnIfUnsavedDraft()
        setSelectedDate(prev => {
            const d = new Date(prev)
            d.setDate(d.getDate() - 1)
            return d
        })
    }, [warnIfUnsavedDraft])

    const handleNextDay = useCallback(() => {
        warnIfUnsavedDraft()
        setSelectedDate(prev => {
            const d = new Date(prev)
            d.setDate(d.getDate() + 1)
            return d
        })
    }, [warnIfUnsavedDraft])

    const handleMoodSelect = useCallback(async (mood: MoodGrade) => {
        if (loading || loadError || loadedDay !== dayKey || !isActive()) return
        setMoodData(prev => prev ? { ...prev, mood } : { mood, note: '', positive: '' })
        setShowMoodSelector(false)
        await saveData(mood, moodData?.note || '', moodData?.positive || '')
    }, [moodData, saveData, loading, loadError, loadedDay, dayKey, isActive])

    const handleNoteChange = (field: 'note' | 'positive', value: string) => {
        const base = moodData ?? { mood: null, note: '', positive: '' }
        const next = { ...base, [field]: value }
        draftsRef.current[dayKey] = next
        setMoodData(next)
    }

    // Keyboard shortcuts: ← → navigate days, 1-5 select moods, T = today
    useEffect(() => {
        const handleKeyboard = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return
            if (showCalendar) return

            const moodKeys: Record<string, MoodGrade> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'F' }

            if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrevDay() }
            else if (e.key === 'ArrowRight') { e.preventDefault(); handleNextDay() }
            else if (e.key.toLowerCase() === 't') { warnIfUnsavedDraft(); setSelectedDate(new Date()) }
            else if (moodKeys[e.key]) { handleMoodSelect(moodKeys[e.key]) }
        }
        window.addEventListener('keydown', handleKeyboard)
        return () => window.removeEventListener('keydown', handleKeyboard)
    }, [showCalendar, handlePrevDay, handleNextDay, handleMoodSelect, warnIfUnsavedDraft])

    const handleSave = async () => {
        if (!moodData?.mood) return
        await saveData(moodData.mood, moodData.note, moodData.positive)
    }

    const isToday = new Date().toDateString() === selectedDate.toDateString()
    const dateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    if (userLoading || loading || loadedDay !== dayKey) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3 text-ink-500 dark:text-ink-400">
                    <Loader2 className="animate-spin" size={32} />
                    <span>Loading your day...</span>
                </div>
            </div>
        )
    }

    if (loadError) {
        return <div role="alert" className="text-center space-y-4 py-12">
            <p>Could not load this day. Your draft is kept in this tab.</p>
            <button onClick={() => void fetchDayData()} className="px-5 py-3 rounded-xl bg-brand-500 text-white">Try again</button>
        </div>
    }

    return (
        <div id="day-view" className="w-full max-w-3xl mx-auto space-y-8">
            {/* Date Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-8">
                <button
                    onClick={handlePrevDay}
                    className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                    aria-label="Previous day"
                >
                    <ChevronLeft size={24} className="text-ink-600 dark:text-ink-300" />
                </button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCalendar(true)}
                    className="px-3 sm:px-6 py-3 rounded-xl bg-paper border border-ink-200 dark:border-ink-700 hover:border-brand-400 transition-colors flex items-center gap-2"
                >
                    <Calendar size={20} className="text-brand-500" />
                    <span className="text-xs sm:text-base font-medium text-ink-900 dark:text-white">
                        {dateStr}
                    </span>
                </motion.button>

                <button
                    onClick={handleNextDay}
                    className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                    aria-label="Next day"
                >
                    <ChevronRight size={24} className="text-ink-600 dark:text-ink-300" />
                </button>

                {!isToday && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { warnIfUnsavedDraft(); setSelectedDate(new Date()) }}
                        className="ml-2 px-4 py-2 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-bold shadow-sm hover:shadow-md transition-all border border-brand-200 dark:border-brand-800"
                    >
                        Today
                    </motion.button>
                )}
            </div>

            {/* Keyboard shortcut hint */}
            <div className="text-center text-xs text-ink-500 dark:text-ink-400 dark:text-ink-400 -mt-4 hidden md:block">
                <kbd className="px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 font-mono text-[10px]">←</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 font-mono text-[10px] ml-1">→</kbd>
                <span className="mx-2">navigate</span>
                <kbd className="px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 font-mono text-[10px]">1</kbd>-<kbd className="px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 font-mono text-[10px]">5</kbd>
                <span className="mx-2">mood</span>
                <kbd className="px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 font-mono text-[10px]">T</kbd>
                <span className="ml-2">today</span>
            </div>

            {/* Main Content Card */}
            <motion.div
                key={selectedDate.toISOString().split('T')[0]}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass atelier-journal rounded-xl p-5 sm:p-8 md:p-10 border shadow-sm"
            >
                {/* Question */}
                <h2 className="text-2xl md:text-3xl font-bold text-ink-900 dark:text-white mb-8">
                    How was your day {isToday ? 'today' : ''}?
                </h2>

                {/* Mood Selector */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-3">
                        Select your mood
                    </label>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowMoodSelector(!showMoodSelector)}
                        className="w-full px-6 py-4 rounded-xl bg-ink-50 dark:bg-ink-800 border-2 border-ink-200 dark:border-ink-700 hover:border-brand-400 dark:hover:border-brand-500 transition-all text-left flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            {moodData?.mood ? (
                                <>
                                    <div className={`w-12 h-12 rounded-xl ${MOODS[moodData.mood].color} flex items-center justify-center font-bold text-lg shadow-md`}>
                                        <span className="text-2xl"><MoodIcon mood={moodData.mood} size={26} className="text-ink-900" /></span>
                                    </div>
                                    <span className="text-lg font-semibold text-ink-900 dark:text-white">
                                        {MOODS[moodData.mood].label}
                                    </span>
                                </>
                            ) : (
                                <span className="text-ink-500 dark:text-ink-400">Choose a mood...</span>
                            )}
                        </div>
                        <ChevronRight
                            size={20}
                            className={`text-ink-500 dark:text-ink-400 transition-transform ${showMoodSelector ? 'rotate-90' : ''}`}
                        />
                    </motion.button>

                    {/* Mood Options */}
                    <AnimatePresence>
                        {showMoodSelector && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2 overflow-hidden"
                            >
                                {(Object.entries(MOODS) as [MoodGrade, typeof MOODS[MoodGrade]][]).map(([grade, data]) => (
                                    <motion.button
                                        key={grade}
                                        whileHover={{ scale: 1.1, y: -4 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleMoodSelect(grade)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${moodData?.mood === grade
                                            ? 'bg-brand-100 dark:bg-brand-900/30 ring-2 ring-brand-400 dark:ring-brand-500'
                                            : 'bg-ink-50 dark:bg-ink-800 hover:bg-ink-100 dark:hover:bg-ink-700'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl ${data.color} flex items-center justify-center font-bold text-lg shadow-md`}>
                                            <span className="text-2xl"><MoodIcon mood={grade} size={26} className="text-ink-900" /></span>
                                        </div>
                                        <span className="text-xs font-medium text-ink-700 dark:text-ink-300">
                                            {data.label}
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
                        <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-3">
                            Describe
                        </label>
                        <textarea
                            value={moodData?.note || ''}
                            onChange={(e) => handleNoteChange('note', e.target.value)}
                            onBlur={() => moodData?.mood && saveData(moodData.mood, moodData.note || '', moodData.positive || '')}
                            placeholder="What happened today? How did you feel?"
                            className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-800 border-2 border-ink-200 dark:border-ink-700 focus:border-brand-400 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 resize-none h-32 text-sm transition-all outline-none text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-3">
                            What was something good that happened today?
                        </label>
                        <textarea
                            value={moodData?.positive || ''}
                            onChange={(e) => handleNoteChange('positive', e.target.value)}
                            onBlur={() => moodData?.mood && saveData(moodData.mood, moodData.note || '', moodData.positive || '')}
                            placeholder="Even on tough days, there's usually something positive..."
                            className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-800 border-2 border-ink-200 dark:border-ink-700 focus:border-brand-400 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 resize-none h-32 text-sm transition-all outline-none text-ink-900 dark:text-white placeholder-ink-400 dark:placeholder-ink-500"
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
                        className="mt-8 w-full px-6 py-4 rounded-xl bg-brand-500 hover:from-brand-600 hover:to-brand-600 text-white font-semibold shadow-lg hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
