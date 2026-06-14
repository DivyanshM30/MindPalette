import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Insights — MindPalette',
    description: 'Explore your mood trends, monthly breakdowns, and emotional patterns with beautiful visualizations.',
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
    return children
}
