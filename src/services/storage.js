// Chat History Storage — mirrors web chatHistoryHelper
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    CURRENT_CHAT: 'legalease_current_chat',
    CHAT_HISTORY: 'legalease_chat_history',
    APP_SETTINGS: 'legalease_app_settings',
    DOCUMENT_ANALYSES: 'legalease_document_analyses',
    LAST_USER_ID: 'legalease_last_user_id',
};

// Wipe per-user caches that would otherwise leak across accounts on the same
// device (chat history, document analyses). Called on login when the user id
// changes, and on logout unconditionally.
const USER_SCOPED_KEYS = [
    KEYS.CURRENT_CHAT,
    KEYS.CHAT_HISTORY,
    KEYS.APP_SETTINGS,
    KEYS.DOCUMENT_ANALYSES,
];

export const userSession = {
    syncActiveUser: async (userId) => {
        try {
            const previous = await AsyncStorage.getItem(KEYS.LAST_USER_ID);
            const next = userId ? String(userId) : null;
            if (previous !== next) {
                await AsyncStorage.multiRemove(USER_SCOPED_KEYS);
            }
            if (next) {
                await AsyncStorage.setItem(KEYS.LAST_USER_ID, next);
            } else {
                await AsyncStorage.removeItem(KEYS.LAST_USER_ID);
            }
        } catch (error) {
            console.warn('Failed to sync active user:', error);
        }
    },

    clearLocalUserData: async () => {
        try {
            await AsyncStorage.multiRemove([...USER_SCOPED_KEYS, KEYS.LAST_USER_ID]);
        } catch (error) {
            console.warn('Failed to clear local user data:', error);
        }
    },
};

const DEFAULT_SETTINGS = {
    appearance: 'system',
    language: 'en',
    notifications: {
        push: true,
        email: false,
        news: true,
        documentUpdates: true,
        security: true,
    },
    newsSubscription: {
        subscribed: false,
        email: '',
        subscribedAt: null,
    },
};

let saveTimeout = null;
const SAVE_DEBOUNCE_MS = 1000;

export const chatStorage = {
    saveChat: (messages) => {
        if (saveTimeout) clearTimeout(saveTimeout);

        saveTimeout = setTimeout(async () => {
            try {
                const chatHistory = {
                    messages,
                    timestamp: new Date().toISOString(),
                    id: Date.now(),
                };
                await AsyncStorage.setItem(KEYS.CURRENT_CHAT, JSON.stringify(chatHistory));

                const allChatsRaw = await AsyncStorage.getItem(KEYS.CHAT_HISTORY);
                const allChats = allChatsRaw ? JSON.parse(allChatsRaw) : [];

                const existingIndex = allChats.findIndex(
                    (chat) =>
                        chat.messages.length === messages.length &&
                        chat.messages[chat.messages.length - 1]?.content === messages[messages.length - 1]?.content
                );

                if (existingIndex >= 0) {
                    allChats[existingIndex] = chatHistory;
                } else {
                    allChats.push(chatHistory);
                }

                if (allChats.length > 50) allChats.shift();

                await AsyncStorage.setItem(KEYS.CHAT_HISTORY, JSON.stringify(allChats));
            } catch (error) {
                console.error('Failed to save chat:', error);
            }
        }, SAVE_DEBOUNCE_MS);
    },

    loadCurrentChat: async () => {
        try {
            const saved = await AsyncStorage.getItem(KEYS.CURRENT_CHAT);
            return saved ? JSON.parse(saved).messages : [];
        } catch (error) {
            console.error('Failed to load chat:', error);
            return [];
        }
    },

    loadAllChats: async () => {
        try {
            const saved = await AsyncStorage.getItem(KEYS.CHAT_HISTORY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load all chats:', error);
            return [];
        }
    },

    clearCurrentChat: async () => {
        await AsyncStorage.removeItem(KEYS.CURRENT_CHAT);
    },

    getChatStats: async () => {
        try {
            const chats = await chatStorage.loadAllChats();
            const totalChats = chats.length;
            const totalMessages = chats.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0);
            return { totalChats, totalMessages };
        } catch (error) {
            console.error('Failed to calculate chat stats:', error);
            return { totalChats: 0, totalMessages: 0 };
        }
    },
};

const mergeSettings = (stored) => ({
    ...DEFAULT_SETTINGS,
    ...stored,
    notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(stored?.notifications || {}),
    },
    newsSubscription: {
        ...DEFAULT_SETTINGS.newsSubscription,
        ...(stored?.newsSubscription || {}),
    },
});

export const appSettingsStorage = {
    loadSettings: async () => {
        try {
            const raw = await AsyncStorage.getItem(KEYS.APP_SETTINGS);
            if (!raw) return DEFAULT_SETTINGS;
            return mergeSettings(JSON.parse(raw));
        } catch (error) {
            console.error('Failed to load app settings:', error);
            return DEFAULT_SETTINGS;
        }
    },

    saveSettings: async (settings) => {
        try {
            const merged = mergeSettings(settings);
            await AsyncStorage.setItem(KEYS.APP_SETTINGS, JSON.stringify(merged));
            return merged;
        } catch (error) {
            console.error('Failed to save app settings:', error);
            return mergeSettings(settings);
        }
    },

    updateAppearance: async (appearance) => {
        const current = await appSettingsStorage.loadSettings();
        const next = { ...current, appearance };
        return appSettingsStorage.saveSettings(next);
    },

    updateLanguage: async (language) => {
        const current = await appSettingsStorage.loadSettings();
        const next = { ...current, language };
        return appSettingsStorage.saveSettings(next);
    },

    updateNotifications: async (notifications) => {
        const current = await appSettingsStorage.loadSettings();
        const next = {
            ...current,
            notifications: {
                ...current.notifications,
                ...notifications,
            },
        };
        return appSettingsStorage.saveSettings(next);
    },

    updateNewsSubscription: async ({ subscribed, email }) => {
        const current = await appSettingsStorage.loadSettings();
        const next = {
            ...current,
            newsSubscription: {
                subscribed,
                email,
                subscribedAt: subscribed ? new Date().toISOString() : null,
            },
        };
        return appSettingsStorage.saveSettings(next);
    },
};

export const documentStorage = {
    saveAnalysis: async ({ fileName, analysis }) => {
        if (!analysis) return;
        try {
            const raw = await AsyncStorage.getItem(KEYS.DOCUMENT_ANALYSES);
            const existing = raw ? JSON.parse(raw) : [];
            const next = [
                {
                    id: Date.now(),
                    fileName: fileName || 'document',
                    summary: analysis.summary || '',
                    riskCount: analysis.risks?.length || 0,
                    missingCount: analysis.missing?.length || 0,
                    recommendationCount: analysis.recommendations?.length || 0,
                    createdAt: new Date().toISOString(),
                },
                ...existing,
            ].slice(0, 50);
            await AsyncStorage.setItem(KEYS.DOCUMENT_ANALYSES, JSON.stringify(next));
        } catch (error) {
            console.error('Failed to save document analysis:', error);
        }
    },

    loadAnalyses: async () => {
        try {
            const raw = await AsyncStorage.getItem(KEYS.DOCUMENT_ANALYSES);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            console.error('Failed to load document analyses:', error);
            return [];
        }
    },
};

export const exportStorage = {
    buildExportPayload: async (user) => {
        const [currentChat, chatHistory, settings, documentAnalyses] = await Promise.all([
            chatStorage.loadCurrentChat(),
            chatStorage.loadAllChats(),
            appSettingsStorage.loadSettings(),
            documentStorage.loadAnalyses(),
        ]);

        return {
            app: 'LegalEase',
            exportedAt: new Date().toISOString(),
            user: user || null,
            settings,
            currentChat,
            chatHistory,
            documentAnalyses,
            stats: {
                totalChats: chatHistory.length,
                totalMessages: chatHistory.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0),
                totalDocumentAnalyses: documentAnalyses.length,
            },
        };
    },
};
