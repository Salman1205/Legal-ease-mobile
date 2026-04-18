// Supabase-backed auth service — drop-in replacement for services/auth.js
// Same function names so existing screens keep working.
import { supabase } from './supabase';

const mapUser = (user, profile) => {
    if (!user) return null;
    return {
        id: user.id,
        email: user.email,
        name: profile?.full_name || user.user_metadata?.full_name || '',
        phone: profile?.phone || '',
        avatarUrl: profile?.avatar_url || '',
        createdAt: user.created_at,
    };
};

const fetchProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
    if (error) {
        console.warn('[auth] fetchProfile error:', error.message);
        return null;
    }
    return data;
};

export const supabaseAuthService = {
    register: async (email, password, name) => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanName = name?.trim() || '';

        const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
                data: { full_name: cleanName },
                // No redirect — pure in-app flow. If "Confirm email" is enabled in
                // the Supabase Dashboard, Supabase will still email a link; disable
                // it under Authentication → Providers → Email → "Confirm email".
                emailRedirectTo: undefined,
            },
        });
        if (error) throw new Error(error.message);

        // Session returned immediately = email confirmation is OFF (desired).
        if (data.session) {
            return {
                success: true,
                message: 'Registration successful',
                user: mapUser(data.user, null),
                session_token: data.session.access_token,
            };
        }

        // No session = email confirmation is ON in Supabase Dashboard. Try to
        // force-sign-in anyway; if confirm-email is required, this will fail
        // with a clear error the user can act on.
        const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (signInError) {
            throw new Error(
                'Email confirmation is enabled in Supabase. Disable it in ' +
                'Dashboard → Authentication → Providers → Email → "Confirm email", ' +
                'then try again.',
            );
        }
        return {
            success: true,
            message: 'Registration successful',
            user: mapUser(signInData.user, null),
            session_token: signInData.session?.access_token || null,
        };
    },

    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
        });
        if (error) throw new Error(error.message);

        const profile = await fetchProfile(data.user.id);
        return {
            success: true,
            message: 'Login successful',
            session_token: data.session?.access_token || null,
            user: mapUser(data.user, profile),
        };
    },

    getSession: async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) return null;
        const profile = await fetchProfile(data.session.user.id);
        return {
            user: mapUser(data.session.user, profile),
            session_token: data.session.access_token,
        };
    },

    checkSession: async () => {
        const session = await supabaseAuthService.getSession();
        if (!session) return { authenticated: false, user: null };
        return { authenticated: true, user: session.user };
    },

    saveSession: async () => {
        // Supabase handles persistence automatically via AsyncStorage/localStorage
        return;
    },

    updateProfile: async ({ name, email, phone, avatarUrl }) => {
        const { data: sessionRes } = await supabase.auth.getUser();
        const user = sessionRes?.user;
        if (!user) throw new Error('Session expired. Please sign in again.');

        const nextName = (name || '').trim();
        const nextEmail = (email || '').trim().toLowerCase();
        const nextPhone = (phone || '').trim();

        if (!nextName) throw new Error('Name is required');
        if (nextEmail && (!nextEmail.includes('@') || !nextEmail.includes('.'))) {
            throw new Error('Invalid email format');
        }

        // Update email on auth if changed
        if (nextEmail && nextEmail !== user.email) {
            const { error: emailErr } = await supabase.auth.updateUser({ email: nextEmail });
            if (emailErr) throw new Error(emailErr.message);
        }

        // Update profile row
        const { data, error } = await supabase
            .from('profiles')
            .update({
                full_name: nextName,
                email: nextEmail || user.email,
                phone: nextPhone,
                ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
            })
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        return {
            id: user.id,
            email: data.email,
            name: data.full_name,
            phone: data.phone || '',
            avatarUrl: data.avatar_url || '',
            createdAt: user.created_at,
        };
    },

    changePassword: async (_currentPassword, newPassword) => {
        if (!newPassword || newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters');
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw new Error(error.message);
        return { success: true };
    },

    logout: async () => {
        await supabase.auth.signOut();
    },

    clearSession: async () => {
        await supabase.auth.signOut();
    },

    onAuthChange: (callback) => {
        const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!session?.user) {
                callback(null);
                return;
            }
            const profile = await fetchProfile(session.user.id);
            callback(mapUser(session.user, profile));
        });
        return () => data.subscription.unsubscribe();
    },
};

// Back-compat export so existing `import { authService } from './auth'` works
// if you later choose to re-export from this file.
export const authService = supabaseAuthService;
