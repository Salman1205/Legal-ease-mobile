// LoadingDots v2 — refined animated dots (kept for backwards compatibility)
// Can still be used where shimmer is too heavy
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

const DOT_COUNT = 3;
const DOT_SIZE = 7;

const LoadingDots = () => {
    const anims = useRef([...Array(DOT_COUNT)].map(() => new Animated.Value(0.3))).current;

    useEffect(() => {
        const animations = anims.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 220),
                    Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0.3, duration: 350, useNativeDriver: true }),
                ])
            )
        );
        animations.forEach(a => a.start());
        return () => animations.forEach(a => a.stop());
    }, []);

    return (
        <View style={styles.container}>
            {anims.map((anim, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.dot,
                        {
                            opacity: anim,
                            transform: [{
                                scale: anim.interpolate({
                                    inputRange: [0.3, 1],
                                    outputRange: [0.8, 1.15],
                                }),
                            }],
                        },
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
    },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: colors.accentPrimary,
    },
});

export default LoadingDots;
