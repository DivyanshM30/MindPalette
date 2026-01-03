'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface ProfileDialogProps {
    isOpen: boolean
    onClose: () => void
    initialName: string
}

export default function ProfileDialog({ isOpen, onClose, initialName }: ProfileDialogProps) {
    const [name, setName] = useState(initialName)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
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
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative border border-white/20 p-8"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                                <User size={32} />
                            </div>
                            <h2 className="text-xl font-bold">Edit Profile</h2>
                            <p className="text-gray-500 text-sm">Update your display name</p>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || success}
                                className="w-full py-3.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-medium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> :
                                    success ? <><CheckCircle2 size={20} className="text-green-500" /> Updated!</> :
                                        'Save Changes'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
