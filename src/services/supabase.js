// Supabase client — works on web, iOS, Android via Expo.
// Session persists via AsyncStorage on native, localStorage on web.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
        '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Fill them in .env and restart Expo with: npx expo start --clear',
    );
}

// Use stub URL/key if not set — avoids createClient() throwing on module import
// so the app still boots and screens not using Supabase keep working.
const safeUrl = SUPABASE_URL || 'https://stub.supabase.co';
const safeKey = SUPABASE_ANON_KEY || 'stub-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
    auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
    },
});

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const SUPABASE_BUCKETS = {
    DOCUMENTS: 'documents',
    AVATARS: 'avatars',
};
