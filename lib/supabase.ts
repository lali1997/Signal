import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anon)

export type Entry = { date: string; weight: number; steps: number }
export type UserMeta = {
  name: string
  goal_weight: number
  start_date: string
  log_gap_warn: number
}
