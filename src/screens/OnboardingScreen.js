// OnboardingScreen — 3-slide intro for first-time users
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, shadows, spacing } from '../constants/theme';
import AnimatedPressable from '../components/AnimatedPressable';
import LawLogo from '../components/LawLogo';
import Screen from '../components/Screen';

const { width: SCREEN_W } = Dimensions.get('window');

const SLIDES = [
    {
        icon: 'chatbubble-ellipses-outline',
        title: 'AI Legal Counsel',
        desc: 'Get instant answers to legal questions powered by a corpus of 20,000+ Pakistani law sections with source citations.',
        gradient: gradients.brand,
    },
    {
        icon: 'document-text-outline',
        title: 'Document Analysis',
        desc: 'Upload contracts and legal documents for AI-powered risk analysis, missing clause detection, and actionable recommendations.',
        gradient: gradients.gold,
    },
    {
        icon: 'people-outline',
        title: 'Lawyer Network',
        desc: 'Browse 500+ verified Pakistani lawyers by specialty, read reviews, and request consultations directly from the app.',
        gradient: gradients.success,
    },
];

const OnboardingScreen = ({ onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaging, setIsPaging] = useState(false);
    const flatListRef = useRef(null);
    const pagingUnlockRef = useRef(null);

    const clearPagingUnlock = () => {
        if (pagingUnlockRef.current) {
            clearTimeout(pagingUnlockRef.current);
            pagingUnlockRef.current = null;
        }
    };

    const unlockPagingWithFallback = () => {
        clearPagingUnlock();
        pagingUnlockRef.current = setTimeout(() => {
            setIsPaging(false);
            pagingUnlockRef.current = null;
        }, 450);
    };

    const handleNext = () => {
        if (isPaging) return;

        const nextIndex = currentIndex + 1;
        if (nextIndex >= SLIDES.length) {
            onComplete();
            return;
        }

        setIsPaging(true);
        unlockPagingWithFallback();
        flatListRef.current?.scrollToOffset({ offset: nextIndex * SCREEN_W, animated: true });
    };

    const handleSkip = () => {
        clearPagingUnlock();
        onComplete();
    };

    const handleMomentumScrollEnd = (event) => {
        const offsetX = event?.nativeEvent?.contentOffset?.x || 0;
        const index = Math.round(offsetX / SCREEN_W);
        const calculatedIndex = Math.max(0, Math.min(index, SLIDES.length - 1));
        setCurrentIndex(calculatedIndex);
        setIsPaging(false);
    };

    const renderSlide = ({ item, index }) => (
        <View style={st.slide}>
            <View style={st.iconCircle}>
                <LinearGradient colors={item.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <Ionicons name={item.icon} size={40} color="#FFF" />
            </View>
            <Text style={st.slideTitle}>{item.title}</Text>
            <Text style={st.slideDesc}>{item.desc}</Text>
        </View>
    );

    const isLast = currentIndex === SLIDES.length - 1;

    return (
        <Screen
            edges={['top', 'bottom']}
            keyboardAware={false}
            backgroundColor={colors.bgDeep}
            style={st.root}
        >
            <LinearGradient colors={['#080C18', '#0A0E17', '#0D1120']} style={StyleSheet.absoluteFill} />

            {/* Skip button */}
            <TouchableOpacity style={st.skipBtn} onPress={handleSkip} activeOpacity={0.7} hitSlop={8}>
                <Text style={st.skipText}>Skip</Text>
            </TouchableOpacity>

            {/* Logo */}
            <View style={st.logoRow}>
                <LawLogo size={36} />
                <Text style={st.logoText}>LegalEase</Text>
            </View>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                keyExtractor={(_, i) => i.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                getItemLayout={(_, index) => ({
                    length: SCREEN_W,
                    offset: SCREEN_W * index,
                    index,
                })}
                bounces={false}
            />

            {/* Dots + CTA */}
            <View style={st.footer}>
                <View style={st.dots}>
                    {SLIDES.map((_, i) => (
                        <View key={i} style={[st.dot, i === currentIndex && st.dotActive]} />
                    ))}
                </View>

                <AnimatedPressable style={st.nextBtn} onPress={handleNext} scaleValue={0.95} disabled={isPaging}>
                    <LinearGradient colors={gradients.brand} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    <Text style={st.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
                    <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={18} color="#FFF" />
                </AnimatedPressable>
            </View>
        </Screen>
    );
};

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgDeep },

    skipBtn: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.md,
        zIndex: 10,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    skipText: { color: colors.textTertiary, fontSize: 14, fontWeight: '600' },

    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingTop: spacing.xxl,
        paddingHorizontal: spacing.xxl,
        marginBottom: spacing.xl,
    },
    logoText: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },

    slide: {
        width: SCREEN_W,
        paddingHorizontal: 36,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: 28,
        ...shadows.accent,
    },
    slideTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.textPrimary,
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 12,
    },
    slideDesc: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 23,
        maxWidth: 320,
    },

    footer: {
        paddingHorizontal: spacing.xxl,
        paddingBottom: spacing.xl,
        gap: spacing.xl,
        alignItems: 'center',
    },
    dots: { flexDirection: 'row', gap: 8 },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.bgTertiary,
    },
    dotActive: {
        width: 24,
        backgroundColor: colors.accentPrimary,
    },
    nextBtn: {
        width: '100%',
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        overflow: 'hidden',
        ...shadows.accent,
    },
    nextText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default OnboardingScreen;
