// ShimmerLoader — premium skeleton loading effect
// Animated shimmer bars that sweep left-to-right
// Replaces basic LoadingDots for AI response loading
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { colors, borderRadius, spacing } from '../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const ShimmerBar = ({ width, delay = 0, height = 12 }) => {
    const shimmer = useRef(new Animated.Value(-SCREEN_W)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.loop(
                Animated.timing(shimmer, {
                    toValue: SCREEN_W,
                    duration: 1400,
                    useNativeDriver: true,
                })
            ).start();
        }, delay);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={[styles.bar, { width, height, borderRadius: height / 2 }]}>
            <Animated.View
                style={[
                    styles.shimmerOverlay,
                    {
                        transform: [{ translateX: shimmer }],
                    },
                ]}
            />
        </View>
    );
};

const ShimmerLoader = ({ lines = 3, style }) => {
    const widths = ['85%', '70%', '55%', '90%', '60%'];

    return (
        <View style={[styles.container, style]}>
            {Array.from({ length: lines }).map((_, i) => (
                <ShimmerBar
                    key={i}
                    width={widths[i % widths.length]}
                    delay={i * 120}
                    height={i === 0 ? 14 : 11}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: spacing.sm + 2,
        paddingVertical: spacing.xs,
    },
    bar: {
        backgroundColor: colors.bgTertiary,
        overflow: 'hidden',
    },
    shimmerOverlay: {
        ...StyleSheet.absoluteFillObject,
        width: 120,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
});

export default ShimmerLoader;
