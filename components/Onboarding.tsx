'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CalendarDays, BarChart3, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'

interface OnboardingProps {
    userName: string
}

const steps = [
    {
        icon: Sparkles,
        emoji: '🎨',
        title: 'Welcome to MindPalette!',
        description: 'Your personal space to understand your emotions and see patterns in how you feel.',
        gradient: 'from-purple-500 to-pink-500',
        bg: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
    },
    {
        icon: CalendarDays,
        emoji: '✍️',
        title: 'Log Your First Mood',
        description: 'Each day, pick how you\'re feeling and add an optional note. It only takes a few seconds!',
        gradient: 'from-amber-500 to-orange-500',
        bg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    },
    {
        icon: BarChart3,
        emoji: '📊',
        title: 'See Your Year Unfold',
        description: 'Watch your mood grid fill up with beautiful colors. Spot trends, celebrate streaks, and grow.',
        gradient: 'from-emerald-500 to-teal-500',
        bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
    },
]

export default function Onboarding({ userName }: OnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const dismissed = localStorage.getItem('mindpalette-onboarding-done')
        if (!dismissed) {
            setIsVisible(true)
        }
    }, [])

    const handleDismiss = () => {
        localStorage.setItem('mindpalette-onboarding-done', 'true')
        setIsVisible(false)
    }

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1)
        }
    }

    if (!isVisible) return null

    const step = steps[currentStep]
    const isLastStep = currentStep === steps.length - 1
    const Icon = step.icon

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={handleDismiss}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close onboarding"
                    >
                        <X size={16} className="text-gray-500" />
                    </button>

                    {/* Step content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Colored header area */}
                            <div className={`bg-gradient-to-br ${step.bg} px-8 pt-10 pb-8 text-center`}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mx-auto mb-5 shadow-lg`}
                                >
                                    <Icon size={36} className="text-white" />
                                </motion.div>
                                <div className="text-4xl mb-3">{step.emoji}</div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {currentStep === 0 ? `Hey, ${userName}!` : step.title}
                                </h2>
                            </div>

                            {/* Description */}
                            <div className="px-8 pt-6 pb-4">
                                {currentStep === 0 && (
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
                                        {step.title}
                                    </h3>
                                )}
                                <p className="text-gray-600 dark:text-gray-400 text-center leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer with progress + actions */}
                    <div className="px-8 pb-8 pt-2">
                        {/* Step dots */}
                        <div className="flex justify-center gap-2 mb-6">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        i === currentStep
                                            ? 'w-8 bg-purple-500'
                                            : i < currentStep
                                                ? 'w-1.5 bg-purple-300 dark:bg-purple-700'
                                                : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Action buttons */}
                        {isLastStep ? (
                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/day-view"
                                    onClick={handleDismiss}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-center hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    Log Your First Mood <ArrowRight size={18} />
                                </Link>
                                <button
                                    onClick={handleDismiss}
                                    className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    I&apos;ll explore on my own
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDismiss}
                                    className="flex-1 py-3 rounded-xl text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    Next <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
