import { Mood } from './types'

export type MoodExportRow = Pick<Mood, 'date' | 'mood' | 'note' | 'positive_note' | 'created_at'>

const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`

export function moodsToCsv(moods: MoodExportRow[]): string {
    const header = ['date', 'mood', 'note', 'positive_note', 'created_at']
    const rows = moods.map(m =>
        [m.date, m.mood, m.note || '', m.positive_note || '', m.created_at]
            .map(v => csvEscape(String(v)))
            .join(',')
    )
    // Leading BOM so Excel detects UTF-8 and renders emoji in notes correctly
    return '\ufeff' + [header.join(','), ...rows].join('\r\n')
}

export function moodsToJson(moods: MoodExportRow[]): string {
    return JSON.stringify(
        moods.map(({ date, mood, note, positive_note, created_at }) => ({
            date,
            mood,
            note: note || null,
            positive_note: positive_note || null,
            created_at,
        })),
        null,
        2
    )
}

export function downloadFile(filename: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}
