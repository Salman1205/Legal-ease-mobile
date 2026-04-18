// App-wide settings context — theme, language, notifications.
// Reads/writes via appSettingsStorage so LanguageScreen / AppearanceScreen
// changes propagate reactively to every screen that uses `useAppSettings()`.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, I18nManager, Platform } from 'react-native';
import { appSettingsStorage } from '../services/storage';
import { LANGUAGES, translate } from '../constants/i18n';

const AppSettingsContext = createContext(null);

const DEFAULTS = {
    appearance: 'system',
    language: 'en',
    notifications: {
        push: true,
        email: false,
        news: true,
        documentUpdates: true,
        security: true,
    },
};

const resolveScheme = (appearance) => {
    if (appearance === 'light' || appearance === 'dark') return appearance;
    const sys = Appearance.getColorScheme();
    return sys === 'light' ? 'light' : 'dark';
};

export const AppSettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(DEFAULTS);
    const [isReady, setIsReady] = useState(false);
    const [scheme, setScheme] = useState(resolveScheme(DEFAULTS.appearance));

    // Load saved settings on mount
    useEffect(() => {
        let mounted = true;
        appSettingsStorage.loadSettings().then((loaded) => {
            if (!mounted) return;
            setSettings(loaded);
            setScheme(resolveScheme(loaded.appearance));
            setIsReady(true);
        });
        return () => { mounted = false; };
    }, []);

    // Follow system theme if user picked "system"
    useEffect(() => {
        if (settings.appearance !== 'system') return;
        const sub = Appearance.addChangeListener(() => {
            setScheme(resolveScheme('system'));
        });
        return () => sub.remove?.();
    }, [settings.appearance]);

    const setAppearance = useCallback(async (next) => {
        const saved = await appSettingsStorage.updateAppearance(next);
        setSettings(saved);
        setScheme(resolveScheme(next));
    }, []);

    const setLanguage = useCallback(async (next) => {
        const saved = await appSettingsStorage.updateLanguage(next);
        setSettings(saved);
        // Native RTL switch requires app reload to fully apply;
        // we still toggle the manager so new mounts render RTL correctly.
        const isRTL = !!LANGUAGES[next]?.isRTL;
        if (Platform.OS !== 'web' && I18nManager.isRTL !== isRTL) {
            try { I18nManager.allowRTL(isRTL); I18nManager.forceRTL(isRTL); } catch {}
        }
    }, []);

    const setNotifications = useCallback(async (patch) => {
        const saved = await appSettingsStorage.updateNotifications(patch);
        setSettings(saved);
    }, []);

    const t = useCallback(
        (path) => translate(settings.language || 'en', path),
        [settings.language],
    );

    const value = useMemo(() => ({
        settings,
        isReady,
        scheme,
        isDark: scheme === 'dark',
        language: settings.language || 'en',
        isRTL: !!LANGUAGES[settings.language || 'en']?.isRTL,
        t,
        setAppearance,
        setLanguage,
        setNotifications,
    }), [settings, isReady, scheme, t, setAppearance, setLanguage, setNotifications]);

    return (
        <AppSettingsContext.Provider value={value}>
            {children}
        </AppSettingsContext.Provider>
    );
};

export const useAppSettings = () => {
    const ctx = useContext(AppSettingsContext);
    if (!ctx) {
        // Safe fallback when used outside the provider (e.g., storybook-style previews)
        return {
            settings: DEFAULTS,
            isReady: true,
            scheme: resolveScheme('system'),
            isDark: resolveScheme('system') === 'dark',
            language: 'en',
            isRTL: false,
            t: (path) => translate('en', path),
            setAppearance: async () => {},
            setLanguage: async () => {},
            setNotifications: async () => {},
        };
    }
    return ctx;
};

export const useTranslation = () => {
    const { t, language, isRTL } = useAppSettings();
    return { t, language, isRTL };
};
