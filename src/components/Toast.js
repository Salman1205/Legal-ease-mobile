// Toast — lightweight global notification system.
// Usage:
//   import { useToast } from './Toast';
//   const { showToast } = useToast();
//   showToast('Saved', { variant: 'success' });
//
// Wrap your app in <ToastProvider> (App.js).
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows, borderRadius } from '../constants/theme';

const ToastCtx = createContext({ showToast: () => {} });

const VARIANT_STYLES = {
    success: { icon: 'checkmark-circle', color: colors.success, bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.28)' },
    error:   { icon: 'alert-circle',     color: colors.error,   bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.28)' },
    warning: { icon: 'warning',          color: colors.warning, bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.28)' },
    info:    { icon: 'information-circle', color: colors.accentPrimary, bg: 'rgba(14,165,164,0.12)', border: 'rgba(14,165,164,0.32)' },
};

const ToastItem = ({ toast, onDismiss }) => {
    const translateY = useRef(new Animated.Value(-80)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const variant = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, tension: 180, friction: 18, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, { toValue: -80, duration: 220, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
            ]).start(() => onDismiss(toast.id));
        }, toast.duration);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Animated.View
            style={[
                styles.toast,
                { backgroundColor: variant.bg, borderColor: variant.border, opacity, transform: [{ translateY }] },
            ]}
        >
            <Ionicons name={variant.icon} size={20} color={variant.color} />
            <View style={styles.textWrap}>
                {toast.title ? <Text style={styles.title}>{toast.title}</Text> : null}
                <Text style={styles.message} numberOfLines={3}>{toast.message}</Text>
            </View>
        </Animated.View>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const showToast = useCallback((message, options = {}) => {
        const id = ++idRef.current;
        const toast = {
            id,
            message,
            title: options.title || null,
            variant: options.variant || 'info',
            duration: options.duration ?? 2800,
        };
        setToasts((prev) => [...prev, toast]);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastCtx.Provider value={{ showToast }}>
            {children}
            <View pointerEvents="none" style={styles.stack}>
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </View>
        </ToastCtx.Provider>
    );
};

export const useToast = () => useContext(ToastCtx);

const styles = StyleSheet.create({
    stack: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 60,
        left: 16,
        right: 16,
        gap: 10,
        zIndex: 9999,
        alignItems: 'center',
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        backgroundColor: colors.bgSecondary,
        minWidth: 240,
        maxWidth: 520,
        width: '100%',
        ...shadows.lg,
    },
    textWrap: { flex: 1 },
    title: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 2 },
    message: { color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
});

export default ToastProvider;
