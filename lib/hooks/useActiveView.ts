'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'

// UserProvider remounts the private subtree when its owner changes.
export function useActiveView() {
    const active = useRef(true)
    const { isCurrentUser } = useUser()
    useEffect(() => {
        active.current = true
        return () => { active.current = false }
    }, [])
    return useCallback(() => active.current && isCurrentUser(), [isCurrentUser])
}
