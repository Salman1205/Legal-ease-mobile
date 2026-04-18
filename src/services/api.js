// API Service — works on both web and native
// Aligned with the TypeScript/Node.js backend response shapes (legal-mobile/backend)
import { Platform } from 'react-native';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../constants/api';
import { SEED_COURSES, SEED_LIBRARY, SEED_QUIZZES } from '../constants/educationSeed';

const fetchWithTimeout = async (url, options, timeout = REQUEST_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error('Request timeout. Please try again.');
        throw error;
    }
};

const parseErrorResponse = async (response) => {
    try {
        const errorData = await response.json();
        return (
            errorData.response
            || errorData.error?.message
            || errorData.error
            || errorData.detail
            || errorData.message
            || `HTTP error! status: ${response.status}`
        );
    } catch {
        return `HTTP error! status: ${response.status}`;
    }
};

export const formatConversationHistory = (messages) => {
    return messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));
};

// Build FormData correctly for both web and native.
// On web this is async because ImagePicker returns only a data/blob URI, which we
// must fetch into a real Blob before appending — otherwise browsers serialise the
// plain object as "[object Object]" and multer rejects it.
const buildFileFormData = async (fileAsset) => {
    const formData = new FormData();
    const name = fileAsset.name || fileAsset.fileName || 'upload';
    const type = fileAsset.mimeType || fileAsset.type || 'application/octet-stream';

    if (Platform.OS === 'web') {
        if (fileAsset.file instanceof Blob) {
            formData.append('file', fileAsset.file, name);
        } else if (fileAsset.uri) {
            const response = await fetch(fileAsset.uri);
            const blob = await response.blob();
            const finalType = blob.type && blob.type !== 'application/octet-stream' ? blob.type : type;
            const typedBlob = finalType === blob.type ? blob : new Blob([blob], { type: finalType });
            formData.append('file', typedBlob, name);
        } else {
            throw new Error('Unable to read file: no Blob or URI available.');
        }
    } else {
        formData.append('file', { uri: fileAsset.uri, name, type });
    }
    return formData;
};

const buildQueryString = (params = {}) => {
    const entries = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    return entries.length ? `?${entries.join('&')}` : '';
};

const getJson = async (path, { query, timeout = REQUEST_TIMEOUT, headers } = {}) => {
    const qs = query ? buildQueryString(query) : '';
    const response = await fetchWithTimeout(
        `${API_BASE_URL}${path}${qs}`,
        { method: 'GET', headers: headers || {} },
        timeout
    );
    if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        throw new Error(errorMessage);
    }
    return response.json();
};

const postJson = async (path, body, { timeout = REQUEST_TIMEOUT, headers } = {}) => {
    const response = await fetchWithTimeout(
        `${API_BASE_URL}${path}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(headers || {}) },
            body: JSON.stringify(body || {}),
        },
        timeout
    );
    if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        throw new Error(errorMessage);
    }
    return response.json();
};

export const apiService = {
    // ------------------------------------------------------------------
    // Chat
    // ------------------------------------------------------------------
    sendChatMessage: async (message, conversationHistory, documentContext = null, documentName = null, mode = 'user') => {
        const formattedHistory = formatConversationHistory(conversationHistory);
        return postJson('/chat', {
            message,
            conversation_history: formattedHistory,
            document_context: documentContext,
            document_name: documentName,
            mode,
        });
    },

    // ------------------------------------------------------------------
    // Documents / Contracts
    // ------------------------------------------------------------------
    extractDocument: async (fileAsset) => {
        const formData = await buildFileFormData(fileAsset);
        const response = await fetchWithTimeout(
            `${API_BASE_URL}/document/extract`,
            { method: 'POST', body: formData },
            REQUEST_TIMEOUT * 2
        );
        if (!response.ok) {
            const errorMessage = await parseErrorResponse(response);
            throw new Error(errorMessage);
        }
        return response.json();
    },

    transcribeAudio: async (audioBlob, { language, filename } = {}) => {
        const formData = new FormData();
        const name = filename || 'speech.webm';
        formData.append('file', audioBlob, name);
        if (language) formData.append('language', language);
        const response = await fetchWithTimeout(
            `${API_BASE_URL}/transcribe`,
            { method: 'POST', body: formData },
            REQUEST_TIMEOUT * 2
        );
        if (!response.ok) {
            const errorMessage = await parseErrorResponse(response);
            throw new Error(errorMessage);
        }
        return response.json();
    },

    analyzeContract: async (fileAsset) => {
        const formData = await buildFileFormData(fileAsset);
        const response = await fetchWithTimeout(
            `${API_BASE_URL}/contract/analyze`,
            { method: 'POST', body: formData },
            REQUEST_TIMEOUT * 2
        );
        if (!response.ok) {
            const errorMessage = await parseErrorResponse(response);
            throw new Error(errorMessage);
        }
        return response.json();
    },

    // ------------------------------------------------------------------
    // Lawyers
    // Backend returns: { lawyers, total, page, page_size }
    // ------------------------------------------------------------------
    getLawyers: async (filters = {}) => {
        const payload = await getJson('/lawyers', { query: filters });
        return payload.lawyers || [];
    },

    getLawyersPaginated: async (filters = {}) => {
        return getJson('/lawyers', { query: filters });
    },

    getLawyerById: async (id) => {
        return getJson(`/lawyers/${encodeURIComponent(id)}`);
    },

    getLawyerReviews: async (id) => {
        return getJson(`/lawyers/${encodeURIComponent(id)}/reviews`);
    },

    submitLawyerReview: async (id, { user_name, rating, comment }) => {
        return postJson(`/lawyers/${encodeURIComponent(id)}/reviews`, { user_name, rating, comment });
    },

    getLawyerSpecializations: async () => {
        return getJson('/lawyers/meta/specializations');
    },

    getLawyerCities: async () => {
        return getJson('/lawyers/meta/cities');
    },

    // ------------------------------------------------------------------
    // Education — courses, library, categories, progress, assessments
    // ------------------------------------------------------------------
    getEducationCourses: async ({ userId, level, category, search } = {}) => {
        try {
            const payload = await getJson('/education/courses', {
                query: { user_id: userId, level, category, search },
            });
            // Backend returns { courses, total }
            if (Array.isArray(payload)) return payload;
            return payload.courses || [];
        } catch {
            const queryText = String(search || '').trim().toLowerCase();
            const categoryText = String(category || '').trim().toLowerCase();
            const levelText = String(level || '').trim().toLowerCase();

            return SEED_COURSES.filter((course) => {
                const courseCategory = String(course.category || '').toLowerCase();
                const courseLevel = String(course.level || '').toLowerCase();
                const searchable = `${course.title || ''} ${course.desc || ''} ${course.category || ''}`.toLowerCase();

                const categoryOk = !categoryText || courseCategory.includes(categoryText);
                const levelOk = !levelText || courseLevel === levelText;
                const searchOk = !queryText || searchable.includes(queryText);
                return categoryOk && levelOk && searchOk;
            });
        }
    },

    getEducationCourseById: async (courseId, userId) => {
        try {
            const payload = await getJson(
                `/education/courses/${encodeURIComponent(courseId)}`,
                { query: { user_id: userId } }
            );
            // Python-style backend returns { data: course }; TS backend returns the course directly
            return payload.data || payload || null;
        } catch {
            return SEED_COURSES.find((course) => course.id === courseId) || null;
        }
    },

    getEducationCategories: async () => {
        return getJson('/education/courses/categories');
    },

    searchEducationLibrary: async (query) => {
        try {
            // Backend: GET /education/library?search=...&category=...
            const payload = await getJson('/education/library', { query: { search: query } });
            if (Array.isArray(payload)) return payload;
            return payload.items || payload.data || payload.results || [];
        } catch {
            const queryText = String(query || '').trim().toLowerCase();
            if (!queryText) return SEED_LIBRARY;

            const filtered = SEED_LIBRARY.filter((item) => {
                const haystack = `${item.title || ''} ${item.category || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
                return haystack.includes(queryText);
            });

            return filtered.length ? filtered : SEED_LIBRARY;
        }
    },

    getEducationLibraryCategories: async () => {
        return getJson('/education/library/categories');
    },

    getEducationLibraryStats: async () => {
        return getJson('/education/library/stats');
    },

    // Progress
    getUserProgress: async (userId) => {
        return getJson('/education/progress', { query: { user_id: userId } });
    },

    updateProgress: async ({ user_id, course_id, lesson_index, completed }) => {
        return postJson('/education/progress', { user_id, course_id, lesson_index, completed });
    },

    // Assessments
    getAssessments: async (courseId) => {
        try {
            return await getJson('/education/assessments', { query: { course_id: courseId } });
        } catch {
            return SEED_QUIZZES.filter((quiz) => !courseId || quiz.course_id === courseId);
        }
    },

    getAssessment: async (assessmentId) => {
        try {
            return await getJson(`/education/assessments/${encodeURIComponent(assessmentId)}`);
        } catch {
            return SEED_QUIZZES.find((quiz) => quiz.id === assessmentId) || null;
        }
    },

    submitAssessment: async (assessmentId, { user_id, answers }) => {
        try {
            return await postJson(
                `/education/assessments/${encodeURIComponent(assessmentId)}/submit`,
                { user_id, answers }
            );
        } catch {
            const quiz = SEED_QUIZZES.find((item) => item.id === assessmentId);
            if (!quiz) {
                throw new Error('Assessment not found');
            }

            const normalizedAnswers = answers || [];
            const total = quiz.questions.length;
            let correct = 0;

            quiz.questions.forEach((question, index) => {
                const submitted = normalizedAnswers[index];
                if (Number(submitted) === Number(question.correct_index)) {
                    correct += 1;
                }
            });

            const score = total ? Math.round((correct / total) * 100) : 0;
            return {
                assessment_id: assessmentId,
                user_id,
                total_questions: total,
                correct_answers: correct,
                score,
                passed: score >= Number(quiz.pass_score || 70),
            };
        }
    },
};
