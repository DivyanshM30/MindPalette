'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { MoodGrade } from '@/lib/types'
import { MOODS } from '@/lib/utils'

interface CalendarPopupProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: Date
    onDateSelect: (date: Date) => void
    moodData: Record<string, { mood: MoodGrade, note: string }>
}

export default function CalendarPopup({ isOpen, onClose, selectedDate, onDateSelect, moodData }: CalendarPopupProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        onDateSelect(newDate)
    }

    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

    const getDateKey = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        return date.toLocaleDateString('en-CA')
    }

    const isSelected = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        return date.toDateString() === selectedDate.toDateString()
    }

    const isToday = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        return date.toDateString() === new Date().toDateString()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20"
                        >
                            {/* Header */}
                            <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handlePrevMonth}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
                                    </button>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                    </h3>
                                    <button
                                        onClick={handleNextMonth}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
                                    </button>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-gray-600 dark:text-gray-300" />
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="p-6">
                                {/* Week Days */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {weekDays.map(day => (
                                        <div key={day} className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Days */}
                                <div className="grid grid-cols-7 gap-1">
                                    {emptyDays.map((_, i) => (
                                        <div key={`empty-${i}`} className="aspect-square" />
                                    ))}
                                    {days.map(day => {
                                        const dateKey = getDateKey(day)
                                        const mood = moodData[dateKey]?.mood
                                        const selected = isSelected(day)
                                        const today = isToday(day)

                                        return (
                                            <motion.button
                                                key={day}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleDateClick(day)}
                                                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-all relative ${
                                                    selected
                                                        ? 'bg-purple-500 text-white ring-2 ring-purple-300 dark:ring-purple-700'
                                                        : today
                                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 ring-2 ring-purple-300 dark:ring-purple-700'
                                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                {mood ? (
                                                    <div className={`w-8 h-8 rounded-lg ${MOODS[mood].color} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                                                        {MOODS[mood].emoji}
                                                    </div>
                                                ) : (
                                                    <span>{day}</span>
                                                )}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

