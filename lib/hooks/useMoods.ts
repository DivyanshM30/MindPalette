'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
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
    const [moods, setMoods] = useState<Mood[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const refetch = useCallback(async () => {
        if (!user) {
            setMoods([])
            setLoading(false)
            return
        }
        setError(false)
        setLoading(true)
        try {
            const { data, error: fetchError } = await supabase
                .from('moods')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', `${year}-01-01`)
                .lte('date', `${year}-12-31`)
                .order('date', { ascending: true })

            if (fetchError) throw fetchError
            setMoods(data || [])
        } catch (err) {
            console.error('Error fetching moods:', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }, [user, year])

    useEffect(() => {
        if (!userLoading) refetch()
    }, [refetch, userLoading])

    // Optimistic local update; callers refetch() to roll back on failure.
    const mutate = useCallback((date: string, entry: MoodEntry) => {
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
    }, [])

    const moodMap: MoodMap = useMemo(() => {
        const map: MoodMap = {}
        moods.forEach(m => { map[m.date] = { mood: m.mood, note: m.note || '' } })
        return map
    }, [moods])

    return { moods, moodMap, loading: userLoading || loading, error, refetch, mutate }
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
