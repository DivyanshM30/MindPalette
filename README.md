# Mood Tracker 2026

A beautiful, personal mood tracking application built with Next.js 14, TypeScript, and Supabase. Track your daily moods, reflect on your day, and visualize your emotional journey throughout the year.

## Features

- 📅 **Day-by-Day View**: Focused daily mood tracking with reflection prompts
- 📊 **Year Overview**: Complete calendar grid showing your entire year at a glance
- 🎨 **Beautiful UI**: Modern glassmorphism design with dark mode support
- 📈 **Statistics Dashboard**: Track streaks, primary vibe, and total check-ins
- 💾 **Cloud Sync**: All data synced to Supabase with Row Level Security
- 🔐 **Secure Authentication**: Email/password and magic link authentication
- 📝 **Journaling**: Add notes and positive reflections to each day
- 🌓 **Dark Mode**: Toggle between light and dark themes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd moodtracker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
- Run the SQL from `supabase_schema.sql` in your Supabase SQL Editor
- Add the `positive_note` column by running:
```sql
ALTER TABLE moods ADD COLUMN IF NOT EXISTS positive_note TEXT;
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
moodtracker/
├── app/                 # Next.js app directory
│   ├── page.tsx        # Day view (home page)
│   ├── year/           # Year overview page
│   └── login/          # Authentication page
├── components/         # React components
│   ├── DayView.tsx     # Day-by-day tracking interface
│   ├── MoodGrid.tsx    # Year calendar grid
│   ├── StatisticsPanel.tsx
│   └── ...
├── lib/                # Utilities and types
│   ├── supabase.ts     # Supabase client
│   ├── types.ts        # TypeScript types
│   └── utils.ts        # Utility functions
└── supabase_schema.sql # Database schema
```

## Usage

1. **Sign Up/Login**: Create an account or sign in
2. **Day View**: Track your daily mood and add reflections
3. **Year View**: Navigate to `/year` to see your complete mood journey
4. **Statistics**: View your streaks, primary vibe, and check-in stats

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables
4. Deploy!

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
