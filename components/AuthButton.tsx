'use client'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut, User as UserIcon, Settings } from 'lucide-react'
import ProfileDialog from './ProfileDialog'

export default function AuthButton() {
    const [user, setUser] = useState<User | null>(null)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    const handleSignIn = () => {
        router.push('/login')
    }

    return user ? (
        <div className="flex items-center gap-4">
            <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5 p-1 px-2 rounded-lg transition-all"
                title="Edit Profile"
            >
                <UserIcon size={16} />
                <span className="hidden sm:inline">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
            </button>
            <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm font-medium"
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
        <button
            onClick={handleSignIn}
            className="px-6 py-2 rounded-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all font-medium text-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
        >
            Log In
        </button>
    )
}
