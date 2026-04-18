// FadeInView — staggered entrance animation wrapper
// Fades + slides children in from below with configurable delay
// Use for list items, cards, screen sections
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const FadeInView = ({
    children,
    delay = 0,
    duration = 450,
    distance = 16,
    style,
}) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(distance)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 120,
                    friction: 14,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
};

export default FadeInView;
