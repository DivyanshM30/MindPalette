'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Copy, Check, Loader2, Share2 } from 'lucide-react'
import { useMoods } from '@/lib/hooks/useMoods'
import { useUser } from '@/contexts/UserContext'
import { renderShareCard, THEMES, DEFAULT_THEME, ShareTheme } from '@/lib/shareCard'

interface ShareCardDialogProps {
    isOpen: boolean
    onClose: () => void
    year: number
}

export default function ShareCardDialog({ isOpen, onClose, year }: ShareCardDialogProps) {
    const { user } = useUser()
    const { moodMap, loading } = useMoods(year)
    const fullName = (user?.user_metadata?.full_name as string | undefined)?.trim() || ''

    const [mounted, setMounted] = useState(false)
    const [theme, setTheme] = useState<ShareTheme>(DEFAULT_THEME)
    const [includeName, setIncludeName] = useState(true)
    const [dataUrl, setDataUrl] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => { setMounted(true) }, [])

    // Re-render the card whenever inputs change (once data has loaded)
    useEffect(() => {
        if (!isOpen || loading) return
        let cancelled = false
        const draw = async () => {
            // Ensure Inter is ready so canvas text isn't a system-font fallback
            if (document.fonts?.ready) await document.fonts.ready
            if (cancelled) return
            // Use the app's actual loaded family (next/font hashes "Inter")
            const fontFamily = getComputedStyle(document.body).fontFamily || undefined
            const canvas = renderShareCard({
                moodMap,
                year,
                theme,
                displayName: includeName && fullName ? fullName : null,
                fontFamily,
            })
            canvasRef.current = canvas
            setDataUrl(canvas.toDataURL('image/png'))
        }
        draw()
        return () => { cancelled = true }
    }, [isOpen, loading, moodMap, year, theme, includeName, fullName])

    // Reset copied state / theme when reopened
    useEffect(() => {
        if (isOpen) setCopied(false)
    }, [isOpen])

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
    }, [onClose])

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            return () => document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, handleKeyDown])

    const filename = `mindpalette-${year}.png`

    const handleDownload = () => {
        if (!dataUrl) return
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
    }

    // Copy is best-effort: clipboard image write isn't supported everywhere
    // (Firefox, older Safari). On any failure we fall back to a download so
    // the user never hits a dead button.
    const handleCopy = async () => {
        const canvas = canvasRef.current
        if (!canvas) return
        try {
            if (!navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('unsupported')
            const blob: Blob = await new Promise((resolve, reject) =>
                canvas.toBlob(b => (b ? resolve(b) : reject(new Error('no blob'))), 'image/png')
            )
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            handleDownload()
        }
    }

    if (!mounted) return null

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
                        aria-label="Share your year"
                        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative border border-white/20 z-10"
                    >
                        <button onClick={onClose} aria-label="Close dialog" className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors z-20">
                            <X size={20} />
                        </button>

                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-2.5 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shrink-0">
                                    <Share2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Share your year</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">A pixel portrait of {year} — notes stay private.</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-[minmax(0,1fr)_260px] gap-6">
                                {/* Preview */}
                                <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-center min-h-[320px]">
                                    {loading || !dataUrl ? (
                                        <div className="flex flex-col items-center gap-2 text-gray-400 py-16">
                                            <Loader2 className="animate-spin" size={22} />
                                            <span className="text-sm">Painting your year…</span>
                                        </div>
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={dataUrl}
                                            alt={`Mood grid for ${year}`}
                                            className="max-h-[60vh] w-auto rounded-xl shadow-lg"
                                        />
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-0.5">Palette</label>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {THEMES.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setTheme(t)}
                                                    aria-pressed={theme.id === t.id}
                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                                        theme.id === t.id
                                                            ? 'border-purple-400 dark:border-purple-500 ring-2 ring-purple-200 dark:ring-purple-900/50 bg-purple-50/50 dark:bg-purple-900/10'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                                >
                                                    <span className="flex gap-0.5 shrink-0">
                                                        {(['A', 'B', 'C', 'D', 'F'] as const).map(g => (
                                                            <span key={g} className="w-2 h-4 rounded-sm" style={{ backgroundColor: t.moods[g] }} />
                                                        ))}
                                                    </span>
                                                    <span className="text-gray-700 dark:text-gray-200 truncate">{t.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {fullName && (
                                        <label className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 cursor-pointer">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Include my name</span>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={includeName}
                                                onClick={() => setIncludeName(v => !v)}
                                                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${includeName ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${includeName ? 'translate-x-5' : ''}`} />
                                            </button>
                                        </label>
                                    )}

                                    <div className="space-y-2.5 pt-1">
                                        <button
                                            onClick={handleDownload}
                                            disabled={!dataUrl}
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:scale-100"
                                        >
                                            <Download size={17} /> Download PNG
                                        </button>
                                        <button
                                            onClick={handleCopy}
                                            disabled={!dataUrl}
                                            className="w-full py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                        >
                                            {copied ? <><Check size={17} className="text-green-500" /> Copied!</> : <><Copy size={17} /> Copy image</>}
                                        </button>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center leading-relaxed pt-1">
                                            Only your mood colours are shared — never your notes.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
