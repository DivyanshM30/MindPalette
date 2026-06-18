export type MoodGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface Mood {
    id: string;
    user_id: string;
    date: string; // YYYY-MM-DD
    mood: MoodGrade;
    note?: string;
    positive_note?: string;
    created_at: string;
}
