import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Reset Password — MindPalette',
    description: 'Choose a new password for your MindPalette account.',
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
    return children
}
