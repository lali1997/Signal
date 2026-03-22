# Signal — Biometric Intelligence

A personal health tracking dashboard built for people who take their data seriously.

## What it does

Signal turns your daily weight and step logs into a living analysis of your body's patterns. It computes a personal regression equation unique to your biology, tracks momentum and adaptation, and tells you exactly what to do next.

## Features

- 3D scroll-through landing page with anonymous demo data
- Per-user auth via Supabase — email, password, magic link
- CSV import — handles DD/MM/YYYY, bulk upsert, safe re-import
- Log widget — today, past date, inline history editing
- Biometric score cards — Momentum, Consistency, Signal, Activity, Habit
- 7-day rolling average weight chart with dynamic Y-axis
- Personal regression model — steps vs next-day weight delta
- Spike risk, movement debt, plateau detection
- Metabolic vs behavioural adaptation analysis
- What-if simulator — project weight at any step count
- Goal intelligence — projected arrival date
- Streak tracking with at-risk warning
- Goal celebration screen
- Export data as CSV
- Profile settings — name, goal weight, timezone

## Stack

- Next.js 14 — App Router
- Supabase — auth, database, RLS
- Three.js / React Three Fiber — landing page 3D scene
- Framer Motion — animations
- Recharts — weight and step charts
- Tailwind CSS
- Deployed on Vercel

## Setup

1. Clone the repo
2. Run `npm install`
3. Add your Supabase keys to `.env.local`:
```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
4. Run `npm run dev`

## Environment

`.env.local` is gitignored — never commit your Supabase keys.