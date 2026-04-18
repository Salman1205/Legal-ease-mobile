// InputBar v5 - text input with cross-platform speech-to-text UI
import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, gradients } from '../constants/theme';
import { MAX_MESSAGE_LENGTH } from '../constants/api';

const InputBar = ({
    value,
    onChangeText,
    onSend,
    onAttach,
    onCamera,
    onMic,
    isLoading,
    isExtracting,
    hasAttachment,
    isRecording = false,
    recordingDuration = 0,
    onStopRecording,
    onCancelRecording,
    isListening = false,
    isMicSupported = true,
    placeholderText = 'Ask a legal question...',
    listeningText = 'Listening... tap mic to stop',
    attachSheetTitle = 'Add Attachment',
    attachOptionDocument = 'Choose Document',
    attachOptionCamera = 'Take Photo',
    cancelLabel = 'Cancel',
}) => {
    const canSend = !isLoading && !isExtracting && !isRecording && !isListening && (value.trim().length > 0 || hasAttachment);
    const sendScale = useRef(new Animated.Value(canSend ? 1 : 0.8)).current;
    const micPulse = useRef(new Animated.Value(0)).current;
    const showMic = !value.trim() && !hasAttachment;

    useEffect(() => {
        Animated.spring(sendScale, {
            toValue: canSend ? 1 : 0.85,
            tension: 200,
            friction: 15,
            useNativeDriver: true,
        }).start();
    }, [canSend, sendScale]);

    useEffect(() => {
        if (!isListening) {
            micPulse.stopAnimation();
            micPulse.setValue(0);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(micPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(micPulse, { toValue: 0, duration: 900, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [isListening, micPulse]);

    const pulseScale = micPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
    const pulseOpacity = micPulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

    const handleAttachPress = () => {
        if (isLoading || isExtracting) return;
        if (Platform.OS === 'web') {
            onAttach();
            return;
        }

        Alert.alert(
            attachSheetTitle,
            null,
            [
                { text: attachOptionDocument, onPress: onAttach },
                { text: attachOptionCamera, onPress: onCamera },
                { text: cancelLabel, style: 'cancel' },
            ],
            { cancelable: true }
        );
    };

    const nearLimit = value.length > MAX_MESSAGE_LENGTH * 0.85;

    if (isRecording) {
        return (
            <View style={s.container}>
                <View style={s.recordingRow}>
                    <TouchableOpacity style={s.cancelBtn} onPress={onCancelRecording} hitSlop={10}>
                        <View style={s.cancelBtnInner}>
                            <Ionicons name="trash-outline" size={17} color={colors.error} />
                        </View>
                    </TouchableOpacity>

                    <View style={s.waveWrap}>
                        <View style={s.recDot} />
                        <Text style={s.recTimer}>{`${Math.floor(recordingDuration / 60)}:${String(recordingDuration % 60).padStart(2, '0')}`}</Text>
                    </View>

                    <TouchableOpacity onPress={onStopRecording} hitSlop={10} activeOpacity={0.8}>
                        <LinearGradient colors={gradients.error} style={s.stopBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            <Ionicons name="stop" size={16} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={s.container}>
            {isListening && (
                <View style={s.listeningPill} pointerEvents="none">
                    <View style={s.listeningDot} />
                    <Text style={s.listeningText}>{listeningText}</Text>
                </View>
            )}
            <View style={[s.inputRow, isListening && s.inputRowListening]}>
                <TouchableOpacity
                    style={s.iconBtn}
                    onPress={handleAttachPress}
                    disabled={isLoading || isExtracting}
                    hitSlop={8}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Upload document"
                >
                    <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color={isLoading || isExtracting ? colors.textTertiary : colors.accentPrimary}
                    />
                </TouchableOpacity>

                {/* Separate camera button — always visible so web users can scan images too. */}
                {Platform.OS === 'web' && (
                    <TouchableOpacity
                        style={s.iconBtn}
                        onPress={() => { if (!isLoading && !isExtracting) onCamera(); }}
                        disabled={isLoading || isExtracting}
                        hitSlop={8}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Scan or take a photo"
                    >
                        <Ionicons
                            name="camera-outline"
                            size={22}
                            color={isLoading || isExtracting ? colors.textTertiary : colors.accentPrimary}
                        />
                    </TouchableOpacity>
                )}

                <TextInput
                    style={s.input}
                    value={value}
                    onChangeText={(text) => {
                        if (text.length <= MAX_MESSAGE_LENGTH) onChangeText(text);
                    }}
                    placeholder={placeholderText}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    maxLength={MAX_MESSAGE_LENGTH}
                    editable={!isLoading}
                    onSubmitEditing={Platform.OS === 'web' ? () => { if (canSend) onSend(); } : undefined}
                    blurOnSubmit={Platform.OS === 'web'}
                    returnKeyType="send"
                />

                {nearLimit && (
                    <Text style={s.charCount}>{value.length}/{MAX_MESSAGE_LENGTH}</Text>
                )}

                {isMicSupported && (showMic || isListening) && (
                    <TouchableOpacity
                        style={s.micBtn}
                        onPress={onMic}
                        disabled={isLoading || isExtracting}
                        hitSlop={8}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
                    >
                        <View style={s.micInner}>
                            {isListening && (
                                <Animated.View
                                    style={[s.micHalo, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]}
                                    pointerEvents="none"
                                />
                            )}
                            {isListening ? (
                                <LinearGradient colors={gradients.error} style={s.micActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <Ionicons name="mic" size={18} color="#fff" />
                                </LinearGradient>
                            ) : (
                                <View style={s.micIdle}>
                                    <Ionicons name="mic-outline" size={20} color={colors.accentPrimary} />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={() => { if (canSend) onSend(); }}
                    disabled={!canSend}
                    hitSlop={8}
                    activeOpacity={0.75}
                >
                    <Animated.View style={{ transform: [{ scale: sendScale }] }}>
                        {canSend ? (
                            <LinearGradient colors={gradients.brand} style={s.sendBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                <Ionicons name="arrow-up" size={18} color="#fff" />
                            </LinearGradient>
                        ) : (
                            <View style={[s.sendBtn, s.sendBtnInactive]}>
                                <Ionicons name="arrow-up" size={18} color={colors.textTertiary} />
                            </View>
                        )}
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
        backgroundColor: colors.bgPrimary,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.borderColor,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.borderGlass,
        paddingLeft: spacing.xs,
        paddingRight: spacing.xs,
        paddingVertical: spacing.xs,
        gap: 2,
        minHeight: 50,
    },
    inputRowListening: {
        borderColor: colors.error,
    },
    listeningPill: {
        position: 'absolute',
        top: -26,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: colors.errorMuted,
        borderWidth: 1,
        borderColor: colors.errorBorder,
        zIndex: 5,
    },
    listeningDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.error,
    },
    listeningText: {
        color: colors.error,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    micBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    micInner: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    micHalo: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.error,
    },
    micActive: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    micIdle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.accentMuted,
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    input: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: Platform.OS === 'web' ? 16 : 15,
        lineHeight: 21,
        maxHeight: 130,
        paddingVertical: Platform.OS === 'web' ? 12 : 10,
        paddingHorizontal: 4,
        textAlignVertical: 'center',
        includeFontPadding: false,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    },
    charCount: {
        color: colors.warning,
        fontSize: 10,
        fontWeight: '700',
        marginRight: 2,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnInactive: {
        backgroundColor: colors.bgTertiary,
    },
    recordingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.errorBorder,
        paddingLeft: spacing.xs,
        paddingRight: spacing.xs,
        paddingVertical: spacing.xs,
        gap: spacing.sm,
        minHeight: 50,
    },
    cancelBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    cancelBtnInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.errorMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waveWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    recDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.error,
        flexShrink: 0,
    },
    recTimer: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
        flexShrink: 0,
        marginRight: spacing.xs,
    },
    stopBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
});

export default InputBar;
