import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Login — MindPalette',
    description: 'Sign in to MindPalette to track your daily moods and see your year in pixels.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return children
}
