import { supabase } from '@/lib/supabase'
import { MoodGrade } from '@/lib/types'

type MoodWrite = {
    user_id: string
    date: string
    mood: MoodGrade
    note: string | null
    positive_note?: string | null
}

// Blur, mood selection and explicit save can overlap, including across views.
// Serialize each owner's day so an older write cannot finish last.
const pending = new Map<string, Promise<void>>()

// Accept either YYYY-MM-DD or YYYY when loading a day or an entire year.
export async function waitForMoodWrites(userId: string, datePrefix: string) {
    const prefix = `${userId}:${datePrefix}`
    for (;;) {
        const writes = [...pending].filter(([key]) => key.startsWith(prefix)).map(([, write]) => write)
        if (writes.length === 0) return
        await Promise.all(writes.map(write => write.catch(() => {})))
    }
}

export function saveMood(entry: MoodWrite, isCurrentUser: () => boolean): Promise<void> {
    const key = `${entry.user_id}:${entry.date}`
    const write = (pending.get(key) ?? Promise.resolve()).catch(() => {}).then(async () => {
        if (!isCurrentUser()) throw new Error('This account is no longer active. Please try again.')
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || user?.id !== entry.user_id || !isCurrentUser()) {
            throw new Error('Your session changed. Please sign in again before saving.')
        }
        const { error } = await supabase.from('moods').upsert(entry, { onConflict: 'user_id,date' })
        if (error) throw error
    })
    pending.set(key, write)
    const cleanup = () => { if (pending.get(key) === write) pending.delete(key) }
    void write.then(cleanup, cleanup)
    return write
}
