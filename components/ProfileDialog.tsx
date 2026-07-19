'use client'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Loader2, CheckCircle2, Lock, Download, Database, ChevronDown, Trash2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { moodsToCsv, moodsToJson, downloadFile, MoodExportRow } from '@/lib/export'
import { useUser } from '@/contexts/UserContext'

interface ProfileDialogProps {
    isOpen: boolean
    onClose: () => void
    initialName: string
}

type Expandable = 'password' | 'data' | 'delete' | null

export default function ProfileDialog({ isOpen, onClose, initialName }: ProfileDialogProps) {
    const [name, setName] = useState(initialName)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const [expanded, setExpanded] = useState<Expandable>(null)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [pwLoading, setPwLoading] = useState(false)
    const [pwError, setPwError] = useState<string | null>(null)
    const [pwSuccess, setPwSuccess] = useState(false)
    const [exporting, setExporting] = useState<'csv' | 'json' | null>(null)
    const [exportError, setExportError] = useState<string | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const { user } = useUser()
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Fresh state each time the dialog opens
    useEffect(() => {
        if (isOpen) {
            setExpanded(null)
            setError(null)
            setPwError(null)
            setExportError(null)
            setDeleteConfirm('')
            setDeleteError(null)
        }
    }, [isOpen])

    const toggle = (id: Exclude<Expandable, null>) =>
        setExpanded(prev => (prev === id ? null : id))

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: name }
            })
            if (error) throw error
            setSuccess(true)
            setTimeout(() => {
                setSuccess(false)
                onClose()
            }, 1500)
        } catch (err) {
            console.error('Error updating profile:', err)
            setError(err instanceof Error ? err.message : 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setPwError(null)
        if (newPassword.length < 8) {
            setPwError('Password must be at least 8 characters')
            return
        }
        if (newPassword !== confirmPassword) {
            setPwError('Passwords do not match')
            return
        }
        setPwLoading(true)
        try {
            const { error: pwUpdateError } = await supabase.auth.updateUser({ password: newPassword })
            if (pwUpdateError) throw pwUpdateError
            setPwSuccess(true)
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setPwSuccess(false), 2500)
        } catch (err) {
            console.error('Error updating password:', err)
            setPwError(err instanceof Error ? err.message : 'Failed to update password')
        } finally {
            setPwLoading(false)
        }
    }

    const handleExport = async (format: 'csv' | 'json') => {
        if (!user) return
        setExportError(null)
        setExporting(format)
        try {
            const { data, error: exportFetchError } = await supabase
                .from('moods')
                .select('date, mood, note, positive_note, created_at')
                .eq('user_id', user.id)
                .order('date', { ascending: true })
            if (exportFetchError) throw exportFetchError
            const rows = (data || []) as MoodExportRow[]
            if (rows.length === 0) {
                setExportError('No moods to export yet.')
                return
            }
            const today = new Date().toLocaleDateString('en-CA')
            if (format === 'csv') {
                downloadFile(`mindpalette-export-${today}.csv`, moodsToCsv(rows), 'text/csv;charset=utf-8')
            } else {
                downloadFile(`mindpalette-export-${today}.json`, moodsToJson(rows), 'application/json')
            }
        } catch (err) {
            console.error('Error exporting moods:', err)
            setExportError(err instanceof Error ? err.message : 'Export failed. Please try again.')
        } finally {
            setExporting(null)
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'DELETE') return
        setDeleteError(null)
        setDeleteLoading(true)
        try {
            const { error: deleteRpcError } = await supabase.rpc('delete_account')
            if (deleteRpcError) throw deleteRpcError
            // Account is gone server-side; clear the local session and leave.
            await supabase.auth.signOut()
            router.push('/login')
        } catch (err) {
            console.error('Error deleting account:', err)
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete account. Please try again.')
            setDeleteLoading(false)
        }
    }

    // Handle Escape key to close dialog
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
    }, [onClose])

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            return () => document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, handleKeyDown])

    if (!mounted) return null

    const inputClass = "w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-gray-900 dark:text-white"
    const errorBoxClass = "p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/30"
    const rowClass = "rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 overflow-hidden"
    const rowHeaderClass = "w-full px-4 py-3.5 flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800 transition-colors"

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Account settings"
                        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto relative border border-white/20 p-8 z-10"
                    >
                        <button onClick={onClose} aria-label="Close dialog" className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors">
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400 shadow-inner">
                                <User size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{user?.email}</p>
                        </div>

                        {/* Profile name */}
                        <form onSubmit={handleUpdate} className="space-y-4 mb-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        className={inputClass}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>

                            {error && <div className={errorBoxClass}>{error}</div>}

                            <button
                                type="submit"
                                disabled={loading || success}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> :
                                    success ? <><CheckCircle2 size={20} className="text-green-300" /> Updated!</> :
                                        'Save Changes'}
                            </button>
                        </form>

                        <div className="space-y-3">
                            {/* Change Password (expandable) */}
                            <div className={rowClass}>
                                <button
                                    onClick={() => toggle('password')}
                                    aria-expanded={expanded === 'password'}
                                    className={rowHeaderClass}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Lock size={16} className="text-purple-500" /> Change Password
                                    </span>
                                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded === 'password' ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {expanded === 'password' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <form onSubmit={handlePasswordChange} className="p-4 pt-1 space-y-3">
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                                    <input
                                                        type="password"
                                                        autoComplete="new-password"
                                                        className={inputClass}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        placeholder="New password (min. 8 characters)"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                                    <input
                                                        type="password"
                                                        autoComplete="new-password"
                                                        className={inputClass}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Confirm new password"
                                                    />
                                                </div>
                                                {pwError && <div className={errorBoxClass}>{pwError}</div>}
                                                <button
                                                    type="submit"
                                                    disabled={pwLoading || !newPassword || !confirmPassword}
                                                    className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                                >
                                                    {pwLoading ? <Loader2 className="animate-spin" size={18} /> :
                                                        pwSuccess ? <><CheckCircle2 size={18} className="text-green-400" /> Password updated!</> :
                                                            'Update Password'}
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Your Data (expandable) */}
                            <div className={rowClass}>
                                <button
                                    onClick={() => toggle('data')}
                                    aria-expanded={expanded === 'data'}
                                    className={rowHeaderClass}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Database size={16} className="text-purple-500" /> Your Data
                                    </span>
                                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded === 'data' ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {expanded === 'data' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 pt-1 space-y-3">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleExport('csv')}
                                                        disabled={exporting !== null}
                                                        className="flex-1 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                                    >
                                                        {exporting === 'csv' ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} CSV
                                                    </button>
                                                    <button
                                                        onClick={() => handleExport('json')}
                                                        disabled={exporting !== null}
                                                        className="flex-1 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                                    >
                                                        {exporting === 'json' ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} JSON
                                                    </button>
                                                </div>
                                                {exportError && <div className={errorBoxClass}>{exportError}</div>}
                                                <p className="text-[11px] text-gray-400 dark:text-gray-500 ml-1">
                                                    Downloads every mood, note and reflection across all years.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Delete Account (expandable) */}
                            <div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 overflow-hidden">
                                <button
                                    onClick={() => toggle('delete')}
                                    aria-expanded={expanded === 'delete'}
                                    className="w-full px-4 py-3.5 flex items-center justify-between text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Trash2 size={16} /> Delete Account
                                    </span>
                                    <ChevronDown size={16} className={`text-red-300 dark:text-red-500 transition-transform ${expanded === 'delete' ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {expanded === 'delete' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 pt-1 space-y-3">
                                                <div className="flex items-start gap-2 text-xs text-red-600/90 dark:text-red-400/90">
                                                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                                    <p>
                                                        This permanently deletes your account and every mood, note and reflection.
                                                        There is no undo. Consider exporting your data first (see “Your Data” above).
                                                    </p>
                                                </div>
                                                <input
                                                    type="text"
                                                    autoComplete="off"
                                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/40 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 outline-none transition-all text-gray-900 dark:text-white text-sm"
                                                    value={deleteConfirm}
                                                    onChange={(e) => setDeleteConfirm(e.target.value)}
                                                    placeholder='Type "DELETE" to confirm'
                                                    aria-label='Type DELETE to confirm account deletion'
                                                />
                                                {deleteError && <div className={errorBoxClass}>{deleteError}</div>}
                                                <button
                                                    onClick={handleDeleteAccount}
                                                    disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                                                    className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:bg-red-600"
                                                >
                                                    {deleteLoading ? <Loader2 className="animate-spin" size={18} /> : <><Trash2 size={16} /> Delete my account forever</>}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
