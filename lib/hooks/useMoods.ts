'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useActiveView } from './useActiveView'
import { waitForMoodWrites } from '@/lib/mood-persistence'
import { supabase } from '@/lib/supabase'
import { Mood, MoodGrade } from '@/lib/types'
import { useUser } from '@/contexts/UserContext'

export type MoodEntry = { mood: MoodGrade, note: string }
export type MoodMap = Record<string, MoodEntry>

/**
 * Fetches one calendar year of moods for the signed-in user.
 * Single source of truth for the year-fetch previously duplicated
 * across the dashboard, year grid and insights pages.
 */
export function useMoods(year: number) {
    const { user, loading: userLoading } = useUser()
    const ownerId = user?.id
    const [moods, setMoods] = useState<Mood[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const requestId = useRef(0)
    const isActive = useActiveView()
    const scope = `${ownerId ?? ''}:${year}`
    const currentScope = useRef(scope)
    currentScope.current = scope
    const [loadedScope, setLoadedScope] = useState('')

    const refetch = useCallback(async () => {
        if (!isActive() || currentScope.current !== scope) return
        const request = ++requestId.current
        const isCurrent = () => isActive() && request === requestId.current && currentScope.current === scope
        if (!ownerId) {
            setMoods([])
            setLoading(false)
            setLoadedScope(scope)
            return
        }
        setError(false)
        setLoading(true)
        try {
            await waitForMoodWrites(ownerId, String(year))
            if (!isCurrent()) return
            const { data, error: fetchError } = await supabase
                .from('moods')
                .select('*')
                .eq('user_id', ownerId)
                .gte('date', `${year}-01-01`)
                .lte('date', `${year}-12-31`)
                .order('date', { ascending: true })

            if (fetchError) throw fetchError
            if (!isCurrent()) return
            setMoods(data || [])
        } catch (err) {
            console.error('Error fetching moods:', err)
            if (isCurrent()) { setMoods([]); setError(true) }
        } finally {
            if (isCurrent()) { setLoading(false); setLoadedScope(scope) }
        }
    }, [ownerId, year, scope, isActive])

    useEffect(() => {
        const requests = requestId
        if (!userLoading) refetch()
        return () => { ++requests.current }
    }, [refetch, userLoading])

    // Optimistic local update; callers refetch() to roll back on failure.
    const mutate = useCallback((date: string, entry: MoodEntry) => {
        if (!isActive() || currentScope.current !== scope) return
        ++requestId.current
        setLoading(false)
        setLoadedScope(scope)
        setMoods(prev => {
            const idx = prev.findIndex(m => m.date === date)
            if (idx >= 0) {
                const next = [...prev]
                next[idx] = { ...next[idx], mood: entry.mood, note: entry.note }
                return next
            }
            const added = { id: `optimistic-${date}`, user_id: '', date, mood: entry.mood, note: entry.note, created_at: '' } as Mood
            return [...prev, added].sort((a, b) => a.date.localeCompare(b.date))
        })
    }, [scope, isActive])

    const moodMap: MoodMap = useMemo(() => {
        const map: MoodMap = {}
        if (loadedScope === scope) moods.forEach(m => { map[m.date] = { mood: m.mood, note: m.note || '' } })
        return map
    }, [moods, loadedScope, scope])

    return { moods: loadedScope === scope ? moods : [], moodMap, loading: userLoading || loading || loadedScope !== scope, error, refetch, mutate }
}

/**
 * Year of the user's earliest entry (defaults to the current year).
 * Bounds the year switcher so users can't navigate into empty decades.
 */
export function useEarliestYear() {
    const { user, loading: userLoading } = useUser()
    const [earliestYear, setEarliestYear] = useState(new Date().getFullYear())

    useEffect(() => {
        if (userLoading || !user) return
        let cancelled = false
        supabase
            .from('moods')
            .select('date')
            .eq('user_id', user.id)
            .order('date', { ascending: true })
            .limit(1)
            .then(({ data }) => {
                if (!cancelled && data && data.length > 0) {
                    setEarliestYear(new Date(data[0].date + 'T00:00:00').getFullYear())
                }
            })
        return () => { cancelled = true }
    }, [user, userLoading])

    return earliestYear
}
