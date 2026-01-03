import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export type MoodGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export const MOODS: Record<MoodGrade, { label: string; color: string; description: string; emoji: string }> = {
    'A': { label: 'Great', color: 'bg-gradient-to-br from-emerald-300 to-emerald-500', description: 'Amazing day', emoji: '😊' },
    'B': { label: 'Good', color: 'bg-gradient-to-br from-yellow-200 to-amber-400', description: 'Good day', emoji: '🙂' },
    'C': { label: 'Okay', color: 'bg-gradient-to-br from-violet-200 to-purple-300', description: 'Average day', emoji: '😐' },
    'D': { label: 'Bad', color: 'bg-gradient-to-br from-orange-200 to-red-300', description: 'Tough day', emoji: '😔' },
    'F': { label: 'Terrible', color: 'bg-gradient-to-br from-gray-300 to-slate-500', description: 'Very bad day', emoji: '😢' },
};
