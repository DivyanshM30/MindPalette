'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'

export default function ResetPasswordPage() {
    const { user, loading: userLoading } = useUser()
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        if (password.length < 8) {
            setMessage({ text: 'Password must be at least 8 characters.', type: 'error' })
            return
        }
        if (password !== confirm) {
            setMessage({ text: 'Passwords do not match.', type: 'error' })
            return
        }
        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setMessage({ text: 'Password updated! Taking you to your dashboard...', type: 'success' })
            setTimeout(() => {
                router.push('/')
                router.refresh()
            }, 1500)
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'An error occurred'
            setMessage({ text: errMsg, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    if (userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-400" size={32} />
            </div>
        )
    }

    // The reset link signs the user in via /auth/callback before landing here.
    // No session means the link was invalid or expired.
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
                <div className="glass w-full max-w-md p-8 rounded-3xl shadow-2xl text-center border border-white/50 dark:border-white/10">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Link expired</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        This password reset link is invalid or has expired. Request a new one from the login page.
                    </p>
                    <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold hover:opacity-90 transition-all">
                        Back to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
            <div className="glass w-full max-w-md p-8 rounded-3xl shadow-2xl relative z-10 border border-white/50 dark:border-white/10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500 mb-2">
                        Reset Password
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Choose a new password for your account</p>
                </div>

                {message && (
                    <div className={`p-4 mb-6 text-sm rounded-xl ${message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                            <input
                                type="password"
                                required
                                autoComplete="new-password"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all dark:bg-gray-800 dark:border-gray-700"
                                placeholder="Min. 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                            <input
                                type="password"
                                required
                                autoComplete="new-password"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all dark:bg-gray-800 dark:border-gray-700"
                                placeholder="Repeat your new password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-black text-white font-medium hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 dark:bg-white dark:text-black"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                Update Password <CheckCircle2 size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
