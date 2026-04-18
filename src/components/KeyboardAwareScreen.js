// Reusable keyboard-aware wrapper.
// - Avoids TextInput overlap with the soft keyboard on iOS/Android
// - Dismisses keyboard on outside tap (useful in forms)
// - Works with scroll content or single-view content
// - No-op on web where native keyboard events don't apply

import React from 'react';
import {
    View,
    KeyboardAvoidingView,
    ScrollView,
    Keyboard,
    Platform,
    TouchableWithoutFeedback,
    StyleSheet,
} from 'react-native';
import { colors } from '../constants/theme';

const DEFAULT_OFFSET = Platform.select({ ios: 0, android: 0, default: 0 });

const KeyboardAwareScreen = ({
    children,
    style,
    contentContainerStyle,
    scroll = true,
    dismissOnTap = true,
    offset = DEFAULT_OFFSET,
    showsVerticalScrollIndicator = false,
    keyboardShouldPersistTaps = 'handled',
}) => {
    const inner = scroll ? (
        <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.grow, contentContainerStyle]}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        >
            {children}
        </ScrollView>
    ) : (
        <View style={[styles.flex, contentContainerStyle]}>{children}</View>
    );

    const wrapped = dismissOnTap ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.flex}>{inner}</View>
        </TouchableWithoutFeedback>
    ) : (
        inner
    );

    if (Platform.OS === 'web') {
        return <View style={[styles.root, style]}>{wrapped}</View>;
    }

    return (
        <KeyboardAvoidingView
            style={[styles.root, style]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={offset}
        >
            {wrapped}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgPrimary },
    flex: { flex: 1 },
    grow: { flexGrow: 1 },
});

export default KeyboardAwareScreen;
