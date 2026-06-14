import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Year View — MindPalette',
    description: 'See your entire year of moods at a glance with a beautiful pixel grid visualization.',
}

export default function YearViewLayout({ children }: { children: React.ReactNode }) {
    return children
}
