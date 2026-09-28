'use client'
import { createContext, useContext, useEffect, useState, useRef, useCallback, Fragment, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserContextType {
    user: User | null
    loading: boolean
    refreshUser: () => Promise<void>
    isCurrentUser: () => boolean
}

const UserContext = createContext<UserContextType>({
    user: null,
    loading: true,
    refreshUser: async () => {},
    isCurrentUser: () => false,
})

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const revision = useRef(0)
    const identity = useRef({ id: null as string | null, epoch: 0 })
    const applyUser = useCallback((next: User | null) => {
        if (identity.current.id !== (next?.id ?? null)) {
            identity.current = { id: next?.id ?? null, epoch: identity.current.epoch + 1 }
        }
        setUser(next)
    }, [])

    const refreshUser = useCallback(async () => {
        const request = ++revision.current
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (request === revision.current) applyUser(user)
        } catch {
            if (request === revision.current) applyUser(null)
        } finally {
            if (request === revision.current) setLoading(false)
        }
    }, [applyUser])

    useEffect(() => {
        const requests = revision
        refreshUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            ++revision.current
            applyUser(session?.user ?? null)
            setLoading(false)
        })

        return () => {
            ++requests.current
            subscription.unsubscribe()
        }
    }, [refreshUser, applyUser])

    const epoch = identity.current.epoch
    const isCurrentUser = useCallback(() => identity.current.epoch === epoch, [epoch])

    return (
        <UserContext.Provider value={{ user, loading, refreshUser, isCurrentUser }}>
            {/* Private drafts, dialogs and caches belong to one identity. */}
            <Fragment key={`${user?.id ?? 'signed-out'}:${epoch}`}>{children}</Fragment>
        </UserContext.Provider>
    )
}

export const useUser = () => useContext(UserContext)
