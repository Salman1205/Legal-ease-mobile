// Screen — standardized screen wrapper
// Consolidates SafeAreaView, StatusBar, keyboard avoidance, scroll behaviour,
// and pull-to-refresh into one composable primitive. Replaces the ad-hoc
// SafeAreaView + KeyboardAvoidingView + ScrollView scaffolding that every
// screen re-invents. All behaviour is opt-in through props so it remains
// backwards-compatible with screens that render their own header/footer.
//
// Props:
//   edges           — SafeArea edges. Default ['top']. Pass [] to disable.
//   scroll          — wrap children in a ScrollView. Default false.
//   keyboardAware   — wrap in KeyboardAvoidingView. Default true on native.
//   keyboardOffset  — vertical offset for KeyboardAvoidingView.
//   refreshing      — pull-to-refresh loading state. Requires onRefresh.
//   onRefresh       — pull-to-refresh handler. Only fires when scroll=true.
//   statusBarStyle  — 'light' (default) | 'dark' | 'auto'.
//   padded          — apply default horizontal padding. Default false.
//   background      — React node rendered behind scroll content (gradients, orbs).
//   contentContainerStyle — style for the inner content container.
//   style           — style for the outer root.

import React from 'react';
import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    RefreshControl,
    StyleSheet,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from '../constants/theme';

const DEFAULT_EDGES = ['top'];

const Screen = ({
    children,
    edges = DEFAULT_EDGES,
    scroll = false,
    keyboardAware = true,
    keyboardOffset,
    refreshing = false,
    onRefresh,
    statusBarStyle = 'light',
    padded = false,
    background,
    contentContainerStyle,
    scrollProps,
    style,
    backgroundColor = colors.bgPrimary,
}) => {
    const paddedStyle = padded ? st.padded : null;

    const inner = scroll ? (
        <ScrollView
            style={st.flex}
            contentContainerStyle={[st.grow, paddedStyle, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
            refreshControl={
                onRefresh ? (
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accentPrimary}
                        colors={[colors.accentPrimary]}
                        progressBackgroundColor={colors.bgSecondary}
                    />
                ) : undefined
            }
            {...scrollProps}
        >
            {children}
        </ScrollView>
    ) : (
        <View style={[st.flex, paddedStyle, contentContainerStyle]}>{children}</View>
    );

    const shouldAvoidKeyboard = keyboardAware && Platform.OS !== 'web';
    const avoided = shouldAvoidKeyboard ? (
        <KeyboardAvoidingView
            style={st.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={keyboardOffset ?? (Platform.OS === 'ios' ? 80 : 0)}
        >
            {inner}
        </KeyboardAvoidingView>
    ) : (
        inner
    );

    return (
        <SafeAreaView
            edges={edges}
            style={[st.root, { backgroundColor }, style]}
        >
            <StatusBar style={statusBarStyle} />
            {background ? (
                <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                    {background}
                </View>
            ) : null}
            {avoided}
        </SafeAreaView>
    );
};

const st = StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },
    grow: { flexGrow: 1 },
    padded: { paddingHorizontal: spacing.lg },
});

export default Screen;
