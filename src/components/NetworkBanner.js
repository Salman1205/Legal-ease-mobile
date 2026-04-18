// NetworkBanner — Shows a banner when the device is offline
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

const NetworkBanner = () => {
    const [isOffline, setIsOffline] = useState(false);
    const slideAnim = useRef(new Animated.Value(-50)).current;

    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleOnline = () => setIsOffline(false);
            const handleOffline = () => setIsOffline(true);

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            setIsOffline(!navigator.onLine);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }

        // For native, use NetInfo if available
        let unsubscribe;
        try {
            const NetInfo = require('@react-native-community/netinfo');
            unsubscribe = NetInfo.addEventListener(state => {
                setIsOffline(!state.isConnected);
            });
        } catch {
            // NetInfo not installed — skip native network detection
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: isOffline ? 0 : -50,
            tension: 200,
            friction: 20,
            useNativeDriver: true,
        }).start();
    }, [isOffline]);

    if (!isOffline) return null;

    return (
        <Animated.View style={[st.banner, { transform: [{ translateY: slideAnim }] }]}>
            <Ionicons name="cloud-offline-outline" size={14} color={colors.warning} />
            <Text style={st.text}>No internet connection — some features may be unavailable</Text>
        </Animated.View>
    );
};

const st = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.warningMuted,
        borderBottomWidth: 1,
        borderBottomColor: colors.warningBorder,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    text: {
        color: colors.warning,
        fontSize: 12,
        fontWeight: '600',
    },
});

export default NetworkBanner;
