// ChatMessage v4 — Clean, professional message rendering
// No icon rings, refined bubbles, smooth entrance
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, gradients, shadows } from '../constants/theme';
import CitationCard from './CitationCard';
import MarkdownText from './MarkdownText';
import LoadingDots from './LoadingDots';
import * as Clipboard from 'expo-clipboard';

const ChatMessage = ({ message }) => {
    const [showTimestamp, setShowTimestamp] = useState(false);
    const [sourcesExpanded, setSourcesExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const isUser = message.role === 'user';
    const isPending = Boolean(message.isPending);
    const isError = Boolean(message.isError);

    const slideAnim = useRef(new Animated.Value(12)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideAnim, { toValue: 0, tension: 120, friction: 14, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
    }, []);

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleCopy = async () => {
        try {
            if (Platform.OS === 'web') await navigator.clipboard.writeText(message.content);
            else await Clipboard.setStringAsync(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch (e) { console.log('Copy failed', e); }
    };

    const sources = message.sources || [];

    return (
        <Animated.View style={[
            st.wrapper, isUser ? st.wrapperUser : st.wrapperAI,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
            <View style={[st.col, isUser && st.colUser]}>
                {/* Attachment */}
                {message.hasAttachment && message.attachmentName && (
                    <View style={st.attachBadge}>
                        <Ionicons
                            name={message.attachmentIsImage ? 'image-outline' : 'document-text-outline'}
                            size={12} color={colors.textTertiary}
                        />
                        <Text style={st.attachText} numberOfLines={1}>{message.attachmentName}</Text>
                    </View>
                )}

                {/* Bubble */}
                <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => setShowTimestamp(v => !v)}
                    onLongPress={handleCopy}
                    delayLongPress={400}
                >
                    {isUser ? (
                        <LinearGradient
                            colors={gradients.brand}
                            style={st.userBubble}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                            <Text style={st.userText}>{message.content}</Text>
                        </LinearGradient>
                    ) : (
                        <View style={[
                            st.aiBubble,
                            isPending && st.aiBubblePending,
                            isError && st.aiBubbleError,
                            Boolean(message.isRefusal) && st.aiBubbleRefusal,
                        ]}>
                            {isPending ? (
                                <View style={st.pendingWrap}>
                                    <LoadingDots />
                                    <Text style={st.pendingText}>Researching your answer...</Text>
                                </View>
                            ) : (
                                <MarkdownText content={message.content} baseColor={isError ? colors.error : colors.textPrimary} />
                            )}

                            {/* Sources */}
                            {!isPending && sources.length > 0 && (
                                <View style={st.sourcesSection}>
                                    <TouchableOpacity
                                        style={st.sourcesToggle}
                                        onPress={() => setSourcesExpanded(v => !v)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="library-outline" size={13} color={colors.textTertiary} />
                                        <Text style={st.sourcesLabel}>
                                            {sources.length} legal {sources.length === 1 ? 'reference' : 'references'}
                                        </Text>
                                        <Ionicons name={sourcesExpanded ? 'chevron-up' : 'chevron-down'} size={13} color={colors.textTertiary} />
                                    </TouchableOpacity>
                                    {sourcesExpanded && (
                                        <View style={st.sourcesList}>
                                            {sources.map((source, idx) => (
                                                <CitationCard key={idx} source={source} index={source.citation_number || idx + 1} />
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    )}
                </TouchableOpacity>

                {/* Meta */}
                <View style={[st.meta, isUser && st.metaUser]}>
                    {showTimestamp && message.timestamp && (
                        <Text style={st.time}>{formatTimestamp(message.timestamp)}</Text>
                    )}
                    {!isUser && (
                        <TouchableOpacity onPress={handleCopy} style={st.copyBtn} hitSlop={10}>
                            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={12} color={copied ? colors.success : colors.textTertiary} />
                            {copied && <Text style={st.copiedLabel}>Copied</Text>}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Animated.View>
    );
};

const st = StyleSheet.create({
    wrapper: { paddingHorizontal: 16, paddingVertical: 4 },
    wrapperUser: { alignItems: 'flex-end' },
    wrapperAI: { alignItems: 'flex-start' },

    col: { maxWidth: '85%', gap: 3 },
    colUser: { alignItems: 'flex-end' },

    // Attachment
    attachBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
        backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.borderColor,
    },
    attachText: { color: colors.textTertiary, fontSize: 11, maxWidth: 160 },

    // User bubble
    userBubble: {
        borderRadius: 18, borderBottomRightRadius: 4,
        paddingHorizontal: 16, paddingVertical: 11,
        ...shadows.sm,
    },
    userText: { color: '#fff', fontSize: 15, lineHeight: 22 },

    // AI bubble
    aiBubble: {
        backgroundColor: colors.bgSecondary,
        borderWidth: 1, borderColor: colors.borderColor,
        borderRadius: 18, borderBottomLeftRadius: 4,
        paddingHorizontal: 14, paddingVertical: 12,
    },
    aiBubblePending: {
        minHeight: 54,
        justifyContent: 'center',
    },
    aiBubbleError: {
        borderColor: colors.errorBorder,
        backgroundColor: colors.errorMuted,
    },
    aiBubbleRefusal: {
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
    },

    pendingWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    pendingText: {
        color: colors.textTertiary,
        fontSize: 13,
        fontWeight: '500',
    },

    // Sources
    sourcesSection: {
        marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.borderColor, paddingTop: 10,
    },
    sourcesToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    sourcesLabel: { color: colors.textTertiary, fontSize: 12, fontWeight: '500', flex: 1 },
    sourcesList: { marginTop: 8 },

    // Meta
    meta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2, minHeight: 16 },
    metaUser: { justifyContent: 'flex-end' },
    time: { color: colors.textTertiary, fontSize: 11 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, padding: 2 },
    copiedLabel: { color: colors.success, fontSize: 11 },
});

export default ChatMessage;
