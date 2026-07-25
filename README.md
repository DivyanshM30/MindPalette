# MindPalette

A beautiful, personal mood tracking application built with Next.js 14, TypeScript, and Supabase. Track your daily moods, reflect on your day, and visualize your emotional journey throughout the year.

## Features

- 📅 **Day-by-Day View**: Focused daily mood tracking with reflection prompts
- 📊 **Year Overview**: Complete calendar grid showing your entire year at a glance
- 🗓️ **Multi-Year History**: Switch between years — your history stays reachable forever
- 🖼️ **Shareable Year Art**: Turn your year in pixels into a downloadable PNG with four palette themes (Classic, Midnight, Heatmap, Sunset) — share the art, never the notes
- 🌻 **Good Things Recap**: Your positive reflections come back to you — a monthly gratitude reel and a daily "remember this?" card on the dashboard
- 🎨 **Beautiful UI**: Modern glassmorphism design with dark mode support
- 📈 **Statistics Dashboard**: Track streaks, primary vibe, and total check-ins
- 💾 **Cloud Sync**: All data synced to Supabase with Row Level Security
- 🔐 **Secure Authentication**: Email/password and magic sign-in links, plus full password reset and change-password flows
- 📤 **Data Export**: One-click CSV/JSON export of every entry, across all years — free forever
- 🗑️ **Account Deletion**: Self-serve delete-my-data (type-to-confirm), removes all entries and the account itself
- 📝 **Journaling**: Add notes and positive reflections to each day
- 🌓 **Dark Mode**: Animated sun/moon toggle between light and dark themes

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
git clone https://github.com/DivyanshM30/MindPalette.git
cd MindPalette
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
- Run `supabase/migrations/20260719_delete_account.sql` in the SQL Editor. This creates the `delete_account()` RPC (SECURITY DEFINER, scoped to the calling user via `auth.uid()`) that powers self-serve account deletion — without it the delete button in the account dialog will fail.

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
mindpalette/
├── app/                 # Next.js app directory
│   ├── page.tsx        # Dashboard / landing page
│   ├── day-view/       # Day-by-day tracking
│   ├── year/           # Year overview page
│   ├── insights/       # Monthly trends & stats
│   ├── login/          # Authentication page
│   └── reset-password/ # Password recovery
├── components/         # React components
│   ├── DayView.tsx     # Day-by-day tracking interface
│   ├── MoodGrid.tsx    # Year calendar grid
│   ├── GoodThings.tsx  # Gratitude recap cards
│   ├── ShareCardDialog.tsx # Shareable year-art dialog
│   ├── StatisticsPanel.tsx
│   └── ...
├── lib/                # Utilities and types
│   ├── hooks/useMoods.ts # Shared year-fetch hook
│   ├── shareCard.ts    # Canvas renderer for the share art card
│   ├── export.ts       # CSV/JSON export
│   ├── supabase.ts     # Supabase client
│   ├── types.ts        # TypeScript types
│   └── utils.ts        # Utility functions
├── supabase/migrations/ # SQL migrations (account deletion RPC)
└── supabase_schema.sql  # Database schema
```

## Usage

1. **Sign Up/Login**: Create an account or sign in
2. **Day View**: Track your daily mood and add reflections
3. **Year View**: Navigate to `/year` to see your complete mood journey — switch years to browse history
4. **Insights**: Monthly trends, mood distribution, and stats at `/insights`
5. **Statistics**: View your streaks, primary vibe, and check-in stats
6. **Good Things**: Positive reflections resurface on the dashboard as a monthly recap and daily memory
7. **Share Your Year**: Hit "Share your year" on the dashboard (or the Share button on `/year`) to download your year in pixels as an image — notes stay private
8. **Your Data**: Export everything as CSV/JSON or delete your account from the profile dialog

## Deployment

### 🚀 Deploy to Vercel (Recommended)

Vercel is the best option for Next.js applications as it's created by the Next.js team and offers seamless integration.

#### Step 1: Prepare Your Repository
Ensure all your code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### Step 2: Create Vercel Account
1. Go to [vercel.com](https://vercel.com) and sign up (you can use your GitHub account)
2. Verify your email if required

#### Step 3: Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your `MindPalette` repository from GitHub
3. Vercel will auto-detect Next.js settings

#### Step 4: Configure Environment Variables
Before deploying, add these environment variables in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Add the following:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
     - Find it in: Supabase Dashboard → Project Settings → API → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
     - Find it in: Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`

#### Step 5: Configure Supabase for Production
1. Go to your Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel deployment URL to **Redirect URLs**:
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/**` (for wildcard)
3. Add your Vercel URL to **Site URL**: `https://your-app.vercel.app`

#### Step 6: Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-2 minutes)
3. Your app will be live at `https://your-app.vercel.app`

#### Step 7: Set Up Custom Domain (Optional)
1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

---

### 🌐 Alternative Deployment Options

#### Netlify
1. Sign up at [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
4. Add environment variables (same as Vercel)
5. Deploy!

#### Railway
1. Sign up at [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select your repository
4. Add environment variables
5. Railway auto-detects Next.js and deploys

#### Render
1. Sign up at [render.com](https://render.com)
2. New → Web Service → Connect GitHub
3. Settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables
5. Deploy!

---

### 📝 Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] Supabase redirect URLs are configured
- [ ] Database schema is set up (run `supabase_schema.sql`)
- [ ] Account-deletion RPC is installed (run `supabase/migrations/20260719_delete_account.sql`)
- [ ] Test authentication (sign up/login + password reset)
- [ ] Test mood tracking functionality
- [ ] Verify dark mode works
- [ ] Check mobile responsiveness

### 🔧 Troubleshooting

**Build fails?**
- Check that all environment variables are set
- Verify Node.js version (should be 18+)
- Check build logs in Vercel dashboard

**Authentication not working?**
- Verify Supabase redirect URLs include your production URL
- Check that environment variables are correct
- Ensure `auth/callback` route is accessible

**Database errors?**
- Make sure you've run the SQL schema in Supabase
- Check Row Level Security policies are enabled
- Verify your Supabase project is active

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🤝 Connect

- **GitHub**: [@DivyanshM30](https://github.com/DivyanshM30)
- **LinkedIn**: [DivyanshM30](https://linkedin.com/in/DivyanshM30)
- **Email**: divyanshm.code@gmail.com