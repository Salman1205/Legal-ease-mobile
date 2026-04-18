// AnimatedPressable — premium spring-animated press effect + subtle haptics
// Scales down on press, bounces back with spring, triggers a light native haptic.
import React, { useRef, useCallback } from 'react';
import { Animated, TouchableWithoutFeedback, StyleSheet, Platform, Vibration } from 'react-native';

const triggerHaptic = () => {
    if (Platform.OS === 'web') return;
    try {
        Vibration.vibrate(8);
    } catch {
        // Ignore: some devices/emulators reject ultra-short pulses.
    }
};

const AnimatedPressable = ({
    children,
    onPress,
    onLongPress,
    style,
    disabled = false,
    scaleValue = 0.97,
    hitSlop,
    delayLongPress,
    haptic = true,
}) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        if (!disabled && haptic) triggerHaptic();
        Animated.spring(scale, {
            toValue: scaleValue,
            tension: 200,
            friction: 20,
            useNativeDriver: true,
        }).start();
    }, [scaleValue, disabled, haptic]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, {
            toValue: 1,
            tension: 180,
            friction: 12,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <TouchableWithoutFeedback
            onPress={disabled ? undefined : onPress}
            onLongPress={disabled ? undefined : onLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={hitSlop}
            delayLongPress={delayLongPress}
        >
            <Animated.View
                style={[
                    style,
                    { transform: [{ scale }] },
                    disabled && styles.disabled,
                ]}
            >
                {children}
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    disabled: { opacity: 0.5 },
});

export default AnimatedPressable;
