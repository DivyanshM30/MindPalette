'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-11 h-11 shrink-0" />
  const isDark = theme === 'dark'
  return (
    <button onClick={toggleTheme} role="switch" aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full border border-ink-200 dark:border-ink-700 text-brand-600 dark:text-brand-300 hover:bg-paper transition-colors">
      {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
    </button>
  )
}
