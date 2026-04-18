// Data helpers for Supabase tables. Uses RLS — user sees only their own rows.
import { supabase, SUPABASE_BUCKETS } from './supabase';

const requireUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) throw new Error('Not authenticated');
    return data.user;
};

// ---------- User settings ----------
export const settingsApi = {
    get: async () => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
        if (error) throw new Error(error.message);
        return data;
    },
    upsert: async (patch) => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('user_settings')
            .upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() })
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },
};

// ---------- Chat ----------
export const chatApi = {
    listConversations: async () => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data || [];
    },
    createConversation: async ({ title, documentName, documentContext, mode = 'user' } = {}) => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('chat_conversations')
            .insert({
                user_id: user.id,
                title: title || null,
                document_name: documentName || null,
                document_context: documentContext || null,
                mode,
            })
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },
    listMessages: async (conversationId) => {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        if (error) throw new Error(error.message);
        return data || [];
    },
    addMessage: async (conversationId, role, content) => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('chat_messages')
            .insert({ conversation_id: conversationId, user_id: user.id, role, content })
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },
};

// ---------- Documents ----------
export const documentsApi = {
    list: async () => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data || [];
    },
    uploadAndCreate: async ({ fileAsset, analysis = {} }) => {
        const user = await requireUser();
        const ext = (fileAsset.name?.split('.').pop() || 'bin').toLowerCase();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        let uploadBody;
        if (fileAsset.file) {
            uploadBody = fileAsset.file;
        } else {
            const res = await fetch(fileAsset.uri);
            uploadBody = await res.blob();
        }

        const { error: upErr } = await supabase.storage
            .from(SUPABASE_BUCKETS.DOCUMENTS)
            .upload(path, uploadBody, {
                contentType: fileAsset.mimeType || 'application/octet-stream',
                upsert: false,
            });
        if (upErr) throw new Error(upErr.message);

        const { data, error } = await supabase
            .from('documents')
            .insert({
                user_id: user.id,
                name: fileAsset.name,
                storage_path: path,
                mime_type: fileAsset.mimeType || null,
                size_bytes: fileAsset.size || null,
                extracted_text: analysis.extractedText || null,
                summary: analysis.summary || null,
                risks: analysis.risks || [],
                missing_clauses: analysis.missingClauses || [],
                applicable_laws: analysis.applicableLaws || [],
                recommendations: analysis.recommendations || [],
                analysis_status: analysis.status || 'done',
            })
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },
    getSignedUrl: async (storagePath, expiresInSeconds = 60 * 60) => {
        const { data, error } = await supabase.storage
            .from(SUPABASE_BUCKETS.DOCUMENTS)
            .createSignedUrl(storagePath, expiresInSeconds);
        if (error) throw new Error(error.message);
        return data.signedUrl;
    },
    remove: async (doc) => {
        if (doc.storage_path) {
            await supabase.storage.from(SUPABASE_BUCKETS.DOCUMENTS).remove([doc.storage_path]);
        }
        const { error } = await supabase.from('documents').delete().eq('id', doc.id);
        if (error) throw new Error(error.message);
    },
};

// ---------- Lawyers ----------
export const lawyersApi = {
    list: async (filters = {}) => {
        let q = supabase.from('lawyers').select('*').eq('is_active', true);
        if (filters.city) q = q.eq('city', filters.city);
        if (filters.specialization) q = q.contains('specializations', [filters.specialization]);
        const { data, error } = await q.order('rating', { ascending: false });
        if (error) throw new Error(error.message);
        return data || [];
    },
    byId: async (id) => {
        const { data, error } = await supabase.from('lawyers').select('*').eq('id', id).single();
        if (error) throw new Error(error.message);
        return data;
    },
    reviews: async (lawyerId) => {
        const { data, error } = await supabase
            .from('lawyer_reviews')
            .select('*')
            .eq('lawyer_id', lawyerId)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data || [];
    },
    submitReview: async (lawyerId, { userName, rating, comment }) => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('lawyer_reviews')
            .upsert({
                lawyer_id: lawyerId,
                user_id: user.id,
                user_name: userName,
                rating,
                comment,
            }, { onConflict: 'lawyer_id,user_id' })
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },
    requestConnection: async (lawyerId, message) => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('lawyer_connections')
            .upsert({ user_id: user.id, lawyer_id: lawyerId, message: message || null })
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },
};

// ---------- Education ----------
export const educationApi = {
    courses: async () => {
        const { data, error } = await supabase
            .from('education_courses')
            .select('*, education_lessons(*)')
            .eq('is_published', true)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data || [];
    },
    courseById: async (id) => {
        const { data, error } = await supabase
            .from('education_courses')
            .select('*, education_lessons(*)')
            .eq('id', id)
            .single();
        if (error) throw new Error(error.message);
        return data;
    },
    library: async (query) => {
        const q = supabase.from('education_library').select('*').limit(50);
        if (query) q.ilike('title', `%${query}%`);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return data || [];
    },
    progress: async () => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id);
        if (error) throw new Error(error.message);
        return data || [];
    },
    markLesson: async ({ courseId, lessonIndex, completed }) => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('user_progress')
            .upsert({
                user_id: user.id,
                course_id: courseId,
                lesson_index: lessonIndex,
                completed,
                completed_at: completed ? new Date().toISOString() : null,
            }, { onConflict: 'user_id,course_id,lesson_index' })
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },
};

// ---------- News bookmarks ----------
export const bookmarksApi = {
    list: async () => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('news_bookmarks')
            .select('*')
            .eq('user_id', user.id)
            .order('saved_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data || [];
    },
    add: async (item) => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('news_bookmarks')
            .upsert({
                user_id: user.id,
                news_id: item.id,
                title: item.title,
                url: item.url,
                image_url: item.imageUrl || null,
            }, { onConflict: 'user_id,news_id' })
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },
    remove: async (newsId) => {
        const user = await requireUser();
        const { error } = await supabase
            .from('news_bookmarks')
            .delete()
            .eq('user_id', user.id)
            .eq('news_id', newsId);
        if (error) throw new Error(error.message);
    },
};
