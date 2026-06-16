import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { User } from "@supabase/supabase-js"

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

export const MOOD_SCORES: Record<MoodGrade, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };

export const MOOD_GRADIENTS: Record<MoodGrade, string> = {
    A: 'from-emerald-400 to-emerald-500',
    B: 'from-amber-400 to-yellow-500',
    C: 'from-violet-400 to-purple-500',
    D: 'from-orange-400 to-red-400',
    F: 'from-slate-400 to-slate-500',
};

export const BAR_COLORS: Record<MoodGrade, string> = {
    A: 'bg-emerald-500',
    B: 'bg-amber-500',
    C: 'bg-purple-500',
    D: 'bg-orange-500',
    F: 'bg-slate-500',
};

export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

export const getDisplayName = (user: User | null, fallback = 'there') =>
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || fallback;
