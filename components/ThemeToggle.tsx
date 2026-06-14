'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-all text-gray-600 dark:text-gray-300"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {!mounted ? (
        <div className="w-[18px] h-[18px]" />
      ) : theme === 'dark' ? (
        <Sun size={18} className="text-yellow-400" />
      ) : (
        <Moon size={18} />
      )}
    </button>
  )
}
