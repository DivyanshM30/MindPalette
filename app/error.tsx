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
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-red-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
            <div className="w-full max-w-md text-center">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="text-red-500 dark:text-red-400" size={36} />
                </div>

                {/* Message */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Something went wrong
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                    An unexpected error occurred. Don&apos;t worry — your data is safe.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20"
                    >
                        <RotateCcw size={18} />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
                    >
                        <Home size={18} />
                        Go Home
                    </Link>
                </div>

                {/* Error digest for debugging */}
                {error.digest && (
                    <p className="mt-6 text-xs text-gray-400 dark:text-gray-600 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    )
}
