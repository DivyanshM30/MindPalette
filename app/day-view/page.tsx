'use client'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import DayView from '@/components/DayView'

export default function DayViewPage() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
            if (!user) {
                redirect('/login')
            }
        }
        checkUser()
    }, [supabase])

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><div className="animate-pulse text-purple-400">Loading your space...</div></div>
    }

    if (!user) return null

    return (
        <div className="w-full space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Track your daily mood and reflections.</p>
                </div>
            </div>

            <DayView />
        </div>
    )
}
