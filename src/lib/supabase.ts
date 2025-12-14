import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Hacer opcional para desarrollo local sin Supabase configurado
let supabase: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else if (import.meta.env.DEV) {
  // Solo mostrar warning en desarrollo
  console.warn('⚠️ Supabase no configurado. Las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están definidas.')
}

export { supabase }


