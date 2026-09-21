import { SmilePlus, Smile, Meh, Frown, CloudRain } from 'lucide-react'
import type { MoodGrade } from '@/lib/types'

const icons = { A: SmilePlus, B: Smile, C: Meh, D: Frown, F: CloudRain }

/** Decorative alongside mood text; icon-only controls provide their own label. */
export default function MoodIcon({ mood, size = 20, className = '' }: {
  mood: MoodGrade
  size?: number
  className?: string
}) {
  const Icon = icons[mood]
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" className={`inline-block shrink-0 ${className}`} />
}
