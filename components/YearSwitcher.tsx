'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface YearSwitcherProps {
    year: number
    minYear: number
    maxYear: number
    onChange: (year: number) => void
}

export default function YearSwitcher({ year, minYear, maxYear, onChange }: YearSwitcherProps) {
    const canPrev = year > minYear
    const canNext = year < maxYear

    return (
        <div className="flex items-center gap-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm px-1 py-1">
            <button
                onClick={() => canPrev && onChange(year - 1)}
                disabled={!canPrev}
                aria-label="Previous year"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronLeft size={18} className="text-gray-600 dark:text-gray-300" />
            </button>
            <span className="px-2 text-sm font-bold text-gray-900 dark:text-white tabular-nums">{year}</span>
            <button
                onClick={() => canNext && onChange(year + 1)}
                disabled={!canNext}
                aria-label="Next year"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronRight size={18} className="text-gray-600 dark:text-gray-300" />
            </button>
        </div>
    )
}
