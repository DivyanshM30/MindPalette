'use client'
import { motion } from 'framer-motion'
import { useTheme } from './ThemeProvider'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Placeholder until mounted so server/client markup match and the knob
  // doesn't animate on initial load.
  if (!mounted) return <div className="w-16 h-8" />

  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      title={label}
      aria-label={label}
      className="relative w-16 h-8 rounded-full overflow-hidden ring-1 ring-black/10 dark:ring-white/10 shadow-inner transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
      style={{
        background: isDark
          ? 'linear-gradient(to right, #10141f, #1d2333)'
          : 'linear-gradient(to bottom, #3d8fd6, #7cbdf0)',
      }}
    >
      {/* Night sky: stars + sparkles */}
      <div
        aria-hidden
        className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}
      >
        <svg viewBox="0 0 64 32" className="w-full h-full">
          {/* subtle concentric glow rings around the moon side */}
          <circle cx="52" cy="16" r="26" fill="rgba(255,255,255,0.03)" />
          <circle cx="52" cy="16" r="18" fill="rgba(255,255,255,0.04)" />
          {/* dot stars */}
          <circle cx="8" cy="9" r="1" fill="white" opacity="0.9" />
          <circle cx="16" cy="22" r="0.8" fill="white" opacity="0.7" />
          <circle cx="24" cy="7" r="0.8" fill="white" opacity="0.8" />
          <circle cx="30" cy="17" r="1" fill="white" opacity="0.6" />
          <circle cx="21" cy="27" r="0.7" fill="white" opacity="0.5" />
          <circle cx="36" cy="25" r="0.8" fill="white" opacity="0.7" />
          {/* four-point sparkles */}
          <path d="M12 14 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1 z" fill="white" opacity="0.95" />
          <path d="M33 6 l0.8 1.9 1.9 0.8 -1.9 0.8 -0.8 1.9 -0.8 -1.9 -1.9 -0.8 1.9 -0.8 z" fill="white" opacity="0.8" />
        </svg>
      </div>

      {/* Day sky: layered clouds */}
      <div
        aria-hidden
        className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}
      >
        <svg viewBox="0 0 64 32" className="w-full h-full">
          {/* back cloud layer (translucent) */}
          <g fill="rgba(255,255,255,0.55)">
            <circle cx="34" cy="30" r="9" />
            <circle cx="45" cy="26" r="10" />
            <circle cx="58" cy="22" r="11" />
          </g>
          {/* front cloud layer */}
          <g fill="#ffffff">
            <circle cx="38" cy="34" r="9" />
            <circle cx="49" cy="30" r="10" />
            <circle cx="62" cy="27" r="11" />
          </g>
        </svg>
      </div>

      {/* Knob: sun ⟷ moon */}
      <motion.div
        aria-hidden
        className="absolute top-1 left-1 w-6 h-6 rounded-full"
        animate={{ x: isDark ? 32 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.35), inset 0 -2px 3px rgba(0,0,0,0.15), inset 0 2px 3px rgba(255,255,255,0.4)' }}
      >
        {/* sun face */}
        <div
          className={`absolute inset-0 rounded-full transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`}
          style={{ background: 'radial-gradient(circle at 35% 30%, #ffd75e, #f5a623)' }}
        />
        {/* moon face */}
        <div
          className={`absolute inset-0 rounded-full transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'radial-gradient(circle at 35% 30%, #f0f3f7, #c8d0da)' }}
        >
          <span className="absolute rounded-full bg-[#aab4c2]" style={{ width: 7, height: 7, top: 4, left: 11 }} />
          <span className="absolute rounded-full bg-[#aab4c2]" style={{ width: 5, height: 5, top: 13, left: 5 }} />
          <span className="absolute rounded-full bg-[#aab4c2]" style={{ width: 3.5, height: 3.5, top: 15, left: 14 }} />
        </div>
      </motion.div>
    </button>
  )
}
