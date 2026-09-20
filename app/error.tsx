'use client'
import { useEffect } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Application error:', error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-red-50 via-brand-50 to-brand-50 dark:from-ink-950 dark:via-brand-950 dark:to-ink-950">
            <div className="w-full max-w-md text-center">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="text-red-500 dark:text-red-400" size={36} />
                </div>

                {/* Message */}
                <h2 className="text-2xl font-bold text-ink-900 dark:text-white mb-2">
                    Something went wrong
                </h2>
                <p className="text-ink-500 dark:text-ink-400 text-sm mb-8">
                    An unexpected error occurred. Don&apos;t worry — your data is safe.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-brand-500/20"
                    >
                        <RotateCcw size={18} />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-paper dark:bg-ink-800 text-ink-700 dark:text-ink-300 font-medium border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700 active:scale-[0.98] transition-all"
                    >
                        <Home size={18} />
                        Go Home
                    </Link>
                </div>

                {/* Error digest for debugging */}
                {error.digest && (
                    <p className="mt-6 text-xs text-ink-500 dark:text-ink-400 dark:text-ink-400 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    )
}
