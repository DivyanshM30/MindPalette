'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserContextType {
    user: User | null
    loading: boolean
    refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
    user: null,
    loading: true,
    refreshUser: async () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        setLoading(false)
    }

    useEffect(() => {
        refreshUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <UserContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </UserContext.Provider>
    )
}

export const useUser = () => useContext(UserContext)
