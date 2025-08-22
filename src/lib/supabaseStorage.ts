import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_ANON_KEY // Use service role key for backend

export const supabaseStorage = createClient(supabaseUrl!, supabaseServiceKey!)