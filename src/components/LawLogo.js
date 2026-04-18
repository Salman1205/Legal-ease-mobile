// LawLogo — Pakistan flag ONLY.
// White hoist stripe (1/4) + forest-green field (3/4) with a centered
// crescent (opening facing upper-right) and a five-pointed star nestled
// inside the opening. Geometry computed from the badge size so every
// element stays in proportion.
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { shadows } from '../constants/theme';

const PAK_GREEN_DARK = '#01411C';
const PAK_GREEN = '#046A38';
const PAK_GREEN_GLOW = '#0A7A42';
const CREAM = '#F6F1E3';

const LawLogo = ({ size = 36, style, animated = false }) => {
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!animated) return;
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration: 1800, useNativeDriver: true }),
            ]),
        ).start();
    }, [animated]);

    const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.5] });
    const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });

    // Flag geometry. The Pakistan flag spec: hoist stripe = 1/4 width,
    // green field = 3/4 width. Crescent + star sit on the fly half of
    // the green field. We compute everything from `size` so the emblem
    // scales cleanly from a 20pt avatar to a 120pt hero logo.
    const radius = size * 0.24;
    const stripeW = size * 0.25;
    const fieldW = size - stripeW;

    // Center of the green field (local coords within the green field)
    const fieldCx = fieldW / 2;
    const fieldCy = size / 2;

    // Crescent: two discs. The outer white disc sits centered in the
    // field; the carving disc (green-dark, same size) is offset to the
    // upper-right, which leaves a crescent whose opening faces upper-right.
    const crescentD = size * 0.5;
    const carveOffsetX = crescentD * 0.22;
    const carveOffsetY = -crescentD * 0.05;

    // Star sits inside the crescent opening — slightly right of center,
    // same vertical line.
    const starSize = size * 0.24;

    const webProps = Platform.OS === 'web'
        ? { accessibilityRole: 'image', 'aria-label': 'Pakistan flag — LegalEase' }
        : {};

    return (
        <View style={[{ width: size, height: size }, style]} {...webProps}>
            {animated && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            borderRadius: radius,
                            opacity: glowOpacity,
                            transform: [{ scale: glowScale }],
                            backgroundColor: PAK_GREEN_GLOW,
                        },
                    ]}
                />
            )}

            <View style={[st.badge, { width: size, height: size, borderRadius: radius }]}>
                {/* White hoist stripe */}
                <View
                    style={[
                        st.stripe,
                        {
                            width: stripeW,
                            borderTopLeftRadius: radius,
                            borderBottomLeftRadius: radius,
                            backgroundColor: CREAM,
                        },
                    ]}
                />

                {/* Green field */}
                <LinearGradient
                    colors={[PAK_GREEN, PAK_GREEN_DARK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        st.greenField,
                        {
                            left: stripeW,
                            width: fieldW,
                            borderTopRightRadius: radius,
                            borderBottomRightRadius: radius,
                        },
                    ]}
                >
                    {/* Crescent — outer white disc */}
                    <View
                        style={{
                            position: 'absolute',
                            left: fieldCx - crescentD / 2,
                            top: fieldCy - crescentD / 2,
                            width: crescentD,
                            height: crescentD,
                            borderRadius: crescentD / 2,
                            backgroundColor: CREAM,
                        }}
                    />
                    {/* Crescent — inner carving disc (creates the opening facing upper-right) */}
                    <LinearGradient
                        colors={[PAK_GREEN, PAK_GREEN_DARK]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            position: 'absolute',
                            left: fieldCx - crescentD / 2 + carveOffsetX,
                            top: fieldCy - crescentD / 2 + carveOffsetY,
                            width: crescentD,
                            height: crescentD,
                            borderRadius: crescentD / 2,
                        }}
                    />

                    {/* Five-pointed star — icon-based to avoid missing glyph squares on some devices */}
                    <View
                        style={{
                            position: 'absolute',
                            left: fieldCx + crescentD * 0.1,
                            top: fieldCy - starSize * 0.5,
                        }}
                    >
                        <Ionicons name="star" size={starSize * 0.9} color={CREAM} />
                    </View>
                </LinearGradient>
            </View>
        </View>
    );
};

const st = StyleSheet.create({
    badge: {
        position: 'relative',
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.18)',
        ...shadows.accent,
    },
    stripe: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
    },
    greenField: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        overflow: 'hidden',
    },
});

export default LawLogo;
