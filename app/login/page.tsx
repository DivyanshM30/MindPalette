'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, ArrowRight, User } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null)
    const [isSignUp, setIsSignUp] = useState(false)

    const router = useRouter()

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('error') === 'auth_callback_error') {
            setMessage({ text: 'This sign-in link is invalid, expired, or was opened in a different browser. Request a new link and open it in the browser where you requested it.', type: 'error' })
        }
    }, [])


    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback`,
                        data: {
                            full_name: fullName,
                        }
                    },
                })
                if (error) throw error
                // Supabase returns a user with empty identities when the email already exists
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    setMessage({ text: 'An account with this email already exists. Try signing in instead!', type: 'error' })
                } else if (data.session) {
                    router.push('/')
                    router.refresh()
                } else {
                    setMessage({ text: 'Check your email for the confirmation link!', type: 'success' })
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                router.push('/')
                router.refresh()
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'An error occurred'
            setMessage({ text: errMsg, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const handleMagicLink = async () => {
        if (!email) {
            setMessage({ text: 'Enter your email above first.', type: 'error' })
            return
        }
        setLoading(true)
        setMessage(null)
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            })
            if (error) throw error
            setMessage({ text: 'Magic link sent to your email!', type: 'success' })
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'An error occurred'
            setMessage({ text: errMsg, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        if (!email) {
            setMessage({ text: 'Enter your email above first, then click "Forgot password?"', type: 'error' })
            return
        }
        setLoading(true)
        setMessage(null)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
            })
            if (error) throw error
            setMessage({ text: 'Password reset link sent — check your email!', type: 'success' })
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'An error occurred'
            setMessage({ text: errMsg, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-brand-50 to-brand-50 dark:from-ink-950 dark:via-brand-950 dark:to-ink-950 overflow-hidden relative">

            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-300/30 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-300/30 rounded-full blur-[100px] animate-pulse delay-1000" />

            <div className="glass w-full max-w-md p-8 rounded-3xl shadow-md relative z-10 border border-white/50 dark:border-white/10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-200 dark:to-brand-300 mb-2">
                        MindPalette
                    </h1>
                    <p className="text-ink-500 dark:text-ink-400 text-sm">
                        {isSignUp ? 'Begin your journey' : 'Welcome back'}
                    </p>
                </div>

                {message && (
                    <div className={`p-4 mb-6 text-sm rounded-xl ${message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-ink-500 dark:text-ink-400" size={18} />
                                <input
                                    type="text"
                                    required={isSignUp}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-50 border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all dark:bg-ink-800 dark:border-ink-700"
                                    placeholder="Jane Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-ink-500 dark:text-ink-400" size={18} />
                            <input
                                type="email"
                                required
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-50 border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all dark:bg-ink-800 dark:border-ink-700"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-ink-500 dark:text-ink-400" size={18} />
                            <input
                                type="password"
                                required
                                minLength={isSignUp ? 8 : undefined}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-50 border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all dark:bg-ink-800 dark:border-ink-700"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-ink-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 dark:bg-brand-300 dark:text-brand-950"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                {isSignUp ? 'Sign Up' : 'Sign In'} <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-ink-500">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"} {' '}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>

                {!isSignUp && (
                    <div className="mt-4 flex items-center justify-center gap-3 text-xs">
                        <button disabled={loading} onClick={handleForgotPassword} className="text-ink-500 dark:text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300 underline">
                            Forgot password?
                        </button>
                        <span className="text-ink-300 dark:text-ink-400">|</span>
                        <button disabled={loading} onClick={handleMagicLink} className="text-ink-500 dark:text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300 underline">
                            Email me a sign-in link
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
