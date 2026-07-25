import { MoodGrade } from './types'
import { MoodMap } from './hooks/useMoods'
import { getDaysInMonth } from './utils'

/**
 * Pure canvas renderer for the shareable "year in pixels" art card.
 *
 * Design notes:
 *  - Notes are never drawn — only the mood colour of each day. The card is
 *    a privacy-safe artefact the user chooses to export; nothing here touches
 *    the network or the DB.
 *  - Invalid days (Feb 30th, Apr 31st…) are left blank so the ragged bottom
 *    edge honestly shows each month's real length.
 *  - The "MindPalette" wordmark is always drawn (never optional) — it is the
 *    growth loop for a free product. Only the user's name is optional.
 */

export interface ShareTheme {
    id: string
    label: string
    bg: string
    /** subtle panel behind the grid; null = same as bg (no panel) */
    panel: string | null
    text: string
    subtext: string
    /** logged-but... no, empty = day with no entry */
    empty: string
    /** thin border on empty cells, for themes where empty ≈ background */
    emptyBorder: string | null
    moods: Record<MoodGrade, string>
}

const MOOD_ORDER: MoodGrade[] = ['A', 'B', 'C', 'D', 'F']
const MOOD_LABELS: Record<MoodGrade, string> = {
    A: 'Great', B: 'Good', C: 'Okay', D: 'Bad', F: 'Terrible',
}

export const THEMES: ShareTheme[] = [
    {
        id: 'classic',
        label: 'Classic',
        bg: '#ffffff',
        panel: '#f8fafc',
        text: '#0f172a',
        subtext: '#64748b',
        empty: '#eef2f7',
        emptyBorder: null,
        moods: { A: '#34d399', B: '#fbbf24', C: '#a78bfa', D: '#f87171', F: '#94a3b8' },
    },
    {
        id: 'midnight',
        label: 'Midnight',
        bg: '#0a0a0f',
        panel: '#16161f',
        text: '#f8fafc',
        subtext: '#8b93a7',
        empty: '#20202c',
        emptyBorder: null,
        moods: { A: '#34d399', B: '#fbbf24', C: '#a78bfa', D: '#f87171', F: '#64748b' },
    },
    {
        id: 'heatmap',
        label: 'Heatmap',
        bg: '#ffffff',
        panel: '#faf7ff',
        text: '#2e1065',
        subtext: '#8b7bb0',
        empty: '#eef1f5',
        emptyBorder: '#e2e8f0',
        // single purple hue, deepest = best day; every level stays clearly
        // more saturated than the empty cell so bad days never read as "no data"
        moods: { A: '#4c1d95', B: '#6d28d9', C: '#8b5cf6', D: '#a78bfa', F: '#c4b5fd' },
    },
    {
        id: 'sunset',
        label: 'Sunset',
        bg: '#241633',
        panel: '#2e1e42',
        text: '#fdf2f8',
        subtext: '#c4a8d4',
        empty: '#3a2a4f',
        emptyBorder: null,
        // warm (good) → cool (bad), like dusk fading to night
        moods: { A: '#fbbf24', B: '#fb923c', C: '#f472b6', D: '#c084fc', F: '#818cf8' },
    },
]

export const DEFAULT_THEME = THEMES[0]

export interface ShareCardOptions {
    moodMap: MoodMap
    year: number
    theme: ShareTheme
    /** shown as "{name}'s {year}" when present; omitted otherwise */
    displayName?: string | null
    /**
     * Font family for canvas text. Pass the app's *actual* loaded family
     * (e.g. getComputedStyle(document.body).fontFamily) — next/font registers
     * Inter under a hashed name, so a literal "Inter" would silently fall back.
     */
    fontFamily?: string
}

// Logical layout constants (pre-DPR). Everything scales from CELL.
const CELL = 24
const GAP = 5
const COLS = 12
const ROWS = 31
const PAD_X = 60
const PAD_TOP = 56
const PAD_BOTTOM = 52
const TITLE_H = 88
const MONTHS_H = 30
const LEGEND_H = 64
const WORDMARK_H = 54

const GRID_W = COLS * CELL + (COLS - 1) * GAP
const GRID_H = ROWS * CELL + (ROWS - 1) * GAP
const CARD_W = PAD_X * 2 + GRID_W
const CARD_H = PAD_TOP + TITLE_H + MONTHS_H + GRID_H + LEGEND_H + WORDMARK_H + PAD_BOTTOM

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const radius = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + w, y, x + w, y + h, radius)
    ctx.arcTo(x + w, y + h, x, y + h, radius)
    ctx.arcTo(x, y + h, x, y, radius)
    ctx.arcTo(x, y, x + w, y, radius)
    ctx.closePath()
}

/**
 * Draws the card onto a fresh <canvas> sized CARD_W×CARD_H (at `scale` DPR)
 * and returns it. Caller reads it via toDataURL / toBlob.
 *
 * Fonts: callers should `await document.fonts.ready` before invoking so the
 * Inter face is available; otherwise the canvas falls back to a system font.
 */
export function renderShareCard({ moodMap, year, theme, displayName, fontFamily }: ShareCardOptions): HTMLCanvasElement {
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = CARD_W * scale
    canvas.height = CARD_H * scale
    const ctx = canvas.getContext('2d')!
    ctx.scale(scale, scale)

    // Always keep a generic sans-serif at the end: if the requested family
    // (e.g. next/font's hashed Inter) isn't resolvable at draw time, canvas
    // otherwise falls back to an ugly serif default.
    const fontStack = fontFamily
        ? `${fontFamily}, system-ui, sans-serif`
        : 'Inter, system-ui, -apple-system, sans-serif'

    // Background
    ctx.fillStyle = theme.bg
    ctx.fillRect(0, 0, CARD_W, CARD_H)

    // Count logged days this year (drives the subtitle)
    let logged = 0
    for (let m = 0; m < COLS; m++) {
        const days = getDaysInMonth(year, m)
        for (let d = 1; d <= days; d++) {
            const key = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            if (moodMap[key]?.mood) logged++
        }
    }

    // --- Title block ---
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    const titleX = PAD_X
    const titleTop = PAD_TOP
    const name = displayName?.trim()
    const suffix = name ? `'s ${year}` : ''
    let head = name || `${year} in moods`
    ctx.fillStyle = theme.text
    const maxTitleW = CARD_W - PAD_X * 2
    // Stage 1: shrink the font to fit a long name.
    let titleSize = 40
    ctx.font = `700 ${titleSize}px ${fontStack}`
    const titleW = () => ctx.measureText(head + suffix).width
    while (titleW() > maxTitleW && titleSize > 26) {
        titleSize -= 2
        ctx.font = `700 ${titleSize}px ${fontStack}`
    }
    // Stage 2: if an extreme name still overflows at the min size, ellipsize
    // the name so the "'s {year}" suffix is never truncated.
    if (titleW() > maxTitleW && name) {
        while (head.length > 1 && ctx.measureText(`${head}…${suffix}`).width > maxTitleW) {
            head = head.slice(0, -1)
        }
        head = head.replace(/\s+$/, '') + '…'
    }
    ctx.fillText(head + suffix, titleX, titleTop + 34)
    ctx.fillStyle = theme.subtext
    ctx.font = `500 18px ${fontStack}`
    const subtitle = logged === 1 ? '1 day logged' : `${logged} days logged`
    ctx.fillText(subtitle, titleX, titleTop + 62)

    // Panel behind the grid + month labels
    const gridX = PAD_X
    const monthsTop = PAD_TOP + TITLE_H
    const gridTop = monthsTop + MONTHS_H
    if (theme.panel) {
        const padP = 18
        ctx.fillStyle = theme.panel
        roundRect(ctx, gridX - padP, monthsTop - padP + 6, GRID_W + padP * 2, MONTHS_H + GRID_H + padP * 2, 24)
        ctx.fill()
    }

    // --- Month initials ---
    ctx.fillStyle = theme.subtext
    ctx.font = `700 15px ${fontStack}`
    ctx.textAlign = 'center'
    for (let m = 0; m < COLS; m++) {
        const cx = gridX + m * (CELL + GAP) + CELL / 2
        ctx.fillText(MONTH_INITIALS[m], cx, monthsTop + 18)
    }

    // --- The grid ---
    for (let m = 0; m < COLS; m++) {
        const daysInMonth = getDaysInMonth(year, m)
        const x = gridX + m * (CELL + GAP)
        for (let d = 1; d <= ROWS; d++) {
            if (d > daysInMonth) continue // ragged bottom = honest month length
            const y = gridTop + (d - 1) * (CELL + GAP)
            const key = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const mood = moodMap[key]?.mood
            roundRect(ctx, x, y, CELL, CELL, 6)
            if (mood) {
                ctx.fillStyle = theme.moods[mood]
                ctx.fill()
            } else {
                ctx.fillStyle = theme.empty
                ctx.fill()
                if (theme.emptyBorder) {
                    ctx.lineWidth = 1
                    ctx.strokeStyle = theme.emptyBorder
                    ctx.stroke()
                }
            }
        }
    }

    // --- Legend ---
    const legendTop = gridTop + GRID_H + 34
    const swatch = 15
    const legendGap = 8
    // measure each item so we can centre the whole row
    ctx.font = `600 14px ${fontStack}`
    const itemWidths = MOOD_ORDER.map(g => swatch + legendGap + ctx.measureText(MOOD_LABELS[g]).width)
    const itemSpacing = 20
    const totalW = itemWidths.reduce((a, b) => a + b, 0) + itemSpacing * (MOOD_ORDER.length - 1)
    let lx = (CARD_W - totalW) / 2
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    MOOD_ORDER.forEach((g, i) => {
        roundRect(ctx, lx, legendTop - swatch / 2, swatch, swatch, 4)
        ctx.fillStyle = theme.moods[g]
        ctx.fill()
        ctx.fillStyle = theme.subtext
        ctx.fillText(MOOD_LABELS[g], lx + swatch + legendGap, legendTop + 1)
        lx += itemWidths[i] + itemSpacing
    })

    // --- Wordmark (always drawn) ---
    const markY = legendTop + 40
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = theme.text
    ctx.font = `800 22px ${fontStack}`
    ctx.fillText('MindPalette', CARD_W / 2, markY + 4)
    ctx.fillStyle = theme.subtext
    ctx.font = `500 13px ${fontStack}`
    ctx.fillText('your year in pixels · mindpalette', CARD_W / 2, markY + 26)

    return canvas
}
