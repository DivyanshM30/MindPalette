import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Day View — MindPalette',
    description: 'Log your daily mood, write reflections, and track how your day went.',
}

export default function DayViewLayout({ children }: { children: React.ReactNode }) {
    return children
}
