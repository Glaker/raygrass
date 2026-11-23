import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.SUPABASE_URL as string
const key = import.meta.env.SUPABASE_PUBLISHABLE_KEY as string

if (!url || !key) {
  throw new Error('Faltan SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en .env')
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
})
