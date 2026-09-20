'use client'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { getDisplayName } from '@/lib/utils'
import ProfileDialog from './ProfileDialog'
import Link from 'next/link'

export default function AuthButton() {
    const { user } = useUser()
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const router = useRouter()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return user ? (
        <div className="flex items-center gap-1 sm:gap-3">
            <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-paper/50 dark:hover:bg-paper/5 p-1 px-2 rounded-lg transition-all"
                title="Edit Profile"
                aria-label="Edit profile"
            >
                <UserIcon size={16} />
                <span className="hidden sm:inline max-w-32 truncate">
                    {getDisplayName(user)}
                </span>
            </button>
            <button
                onClick={handleSignOut}
                aria-label="Log out"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-ink-600 dark:text-ink-300 hover:bg-paper/50 dark:hover:bg-paper/5 border border-ink-200 dark:border-ink-700 hover:border-red-300 dark:hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400 transition-all text-sm font-medium"
            >
                <LogOut size={16} />
                <span className="hidden sm:inline">Log out</span>
            </button>

            <ProfileDialog
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                initialName={user.user_metadata?.full_name || ''}
            />
        </div>
    ) : (
        <Link
            href="/login"
            className="px-6 py-2 rounded-full bg-brand-500 text-white hover:bg-ink-800 dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-ink-200 transition-all font-medium text-sm shadow-md hover:shadow-lg hover:translate-y-[-1px] active:scale-95"
        >
            Log In
        </Link>
    )
}
