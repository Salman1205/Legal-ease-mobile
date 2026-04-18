// Auth Service — Supabase-backed. Credentials, sessions, and profiles
// are stored in Supabase (auth.users + public.profiles). No local user DB.
// Sessions persist automatically via AsyncStorage (native) / localStorage (web).
export { supabaseAuthService as authService } from './supabaseAuth';
