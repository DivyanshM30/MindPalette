'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar } from 'lucide-react'
import { MOODS, MoodGrade, cn } from '@/lib/utils'

interface MoodDialogProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (mood: MoodGrade, note: string) => void
    date: Date
    currentMood?: MoodGrade
    currentNote?: string
}

export default function MoodDialog({ isOpen, onClose, onSelect, date, currentMood, currentNote }: MoodDialogProps) {
    const sortedMoods = Object.entries(MOODS) as [MoodGrade, typeof MOODS[MoodGrade]][]

    // Prevent click propagation to overlay
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Dialog */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={handleContentClick}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20"
                        >
                            {/* Header */}
                            <div className="p-6 pb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-500 font-medium">
                                    <Calendar size={18} />
                                    <span>{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 pt-2">
                                <h2 className="text-2xl font-bold mb-6 text-center">How was today?</h2>

                                {/* Mood Grid */}
                                <div className="grid grid-cols-5 gap-3 mb-8">
                                    {sortedMoods.map(([key, data]) => (
                                        <button
                                            key={key}
                                            onClick={() => onSelect(key, currentNote || '')}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:scale-110 active:scale-95",
                                                currentMood === key ? "ring-2 ring-offset-2 ring-black dark:ring-white bg-gray-50 dark:bg-gray-800" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            <div className={cn("w-12 h-12 rounded-full shadow-md flex items-center justify-center text-lg font-bold text-white transition-transform", data.color)}>
                                                {key}
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                {data.emoji} {data.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Note Input */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">
                                        Add a note
                                    </label>
                                    <textarea
                                        value={currentNote || ''}
                                        onChange={(e) => onSelect(currentMood || 'C', e.target.value)}
                                        placeholder="What made today memorable?"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-none h-24 text-sm transition-all"
                                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking textarea
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black font-medium text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
                                    >
                                        Save & Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
