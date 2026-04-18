import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, gradients, borderRadius } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAppSettings } from '../contexts/AppSettingsContext';

const getGreetingKey = () => {
    const h = new Date().getHours();
    if (h < 5) return 'hub.greetingNight';
    if (h < 12) return 'hub.greetingMorning';
    if (h < 17) return 'hub.greetingAfternoon';
    if (h < 21) return 'hub.greetingEvening';
    return 'hub.greetingNight';
};

const FALLBACK = {
    'hub.greetingMorning': 'Good morning',
    'hub.greetingAfternoon': 'Good afternoon',
    'hub.greetingEvening': 'Good evening',
    'hub.greetingNight': 'Good evening',
};

const HubScreen = ({ navigation }) => {
    const { t, settings } = useAppSettings();

    const greetingKey = getGreetingKey();
    const greetingTranslated = t(greetingKey);
    const greeting = greetingTranslated && greetingTranslated !== greetingKey
        ? greetingTranslated
        : FALLBACK[greetingKey];

    const HERO_STATS = useMemo(() => ([
        { label: t('hub.statLaws'), value: '20K+', icon: 'library-outline' },
        { label: t('hub.statLawyers'), value: '500+', icon: 'people-outline' },
        { label: t('hub.statSpeed'), value: '<4s', icon: 'flash-outline' },
    ]), [t, settings.language]);

    const NAV_CARDS = useMemo(() => ([
        {
            id: 'news',
            title: t('hub.newsTitle'),
            subtitle: t('hub.newsSub'),
            icon: 'newspaper-outline',
            color: gradients.brand,
            route: 'NewsScreen',
        },
        {
            id: 'lawyers',
            title: t('hub.lawyersTitle'),
            subtitle: t('hub.lawyersSub'),
            icon: 'people-outline',
            color: gradients.gold,
            route: 'LawyerScreen',
        },
        {
            id: 'education',
            title: t('hub.educationTitle'),
            subtitle: t('hub.educationSub'),
            icon: 'book-outline',
            color: gradients.success,
            route: 'EducationScreen',
        },
    ]), [t, settings.language]);

    return (
        <View style={st.root}>
            <LinearGradient
                colors={['rgba(14,165,164,0.08)', 'transparent']}
                style={st.headerAmbient}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scrollContent}>
                {/* Header */}
                <View style={st.headerBlock}>
                    <View style={st.kickerRow}>
                        <View style={st.kickerDot} />
                        <Text style={st.kicker}>{greeting}</Text>
                    </View>
                    <Text style={st.pageTitle}>{t('hub.title')}</Text>
                    <Text style={st.pageSub}>{t('hub.subtitle')}</Text>

                    <View style={st.statsRow}>
                        {HERO_STATS.map((item) => (
                            <View key={item.label} style={st.statPill}>
                                <View style={st.statIconWrap}>
                                    <Ionicons name={item.icon} size={14} color={colors.accentPrimary} />
                                </View>
                                <Text style={st.statValue}>{item.value}</Text>
                                <Text style={st.statLabel}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Featured quick-action card */}
                <FadeInView delay={60} distance={12}>
                    <AnimatedPressable
                        style={st.featuredCard}
                        onPress={() => navigation.navigate('Chat')}
                        scaleValue={0.98}
                        haptic={false}
                    >
                        <LinearGradient
                            colors={gradients.brand}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                        <View style={st.featuredContent}>
                            <View style={st.featuredBadge}>
                                <Ionicons name="sparkles" size={10} color="#FFF" />
                                <Text style={st.featuredBadgeText}>AI POWERED</Text>
                            </View>
                            <Text style={st.featuredTitle}>{t('hub.askAiTitle')}</Text>
                            <Text style={st.featuredSub}>{t('hub.askAiSub')}</Text>
                            <View style={st.featuredCta}>
                                <Text style={st.featuredCtaText}>{t('hub.startChat')}</Text>
                                <Ionicons name="arrow-forward-circle" size={22} color="#FFF" />
                            </View>
                        </View>
                    </AnimatedPressable>
                </FadeInView>

                {/* Section label */}
                <View style={st.sectionLabelRow}>
                    <View style={st.sectionBar} />
                    <Text style={st.sectionLabel}>{t('hub.exploreLabel')}</Text>
                </View>

                {/* Cards */}
                <View style={st.grid}>
                    {NAV_CARDS.map((card, index) => (
                        <FadeInView key={card.id} delay={80 + index * 60} distance={10}>
                            <AnimatedPressable
                                style={st.card}
                                onPress={() => navigation.navigate(card.route)}
                                scaleValue={0.97}
                                haptic={false}
                            >
                                <LinearGradient
                                    colors={gradients.card}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                                <View style={st.cardHeader}>
                                    <View style={st.iconWrap}>
                                        <LinearGradient
                                            colors={card.color}
                                            style={StyleSheet.absoluteFill}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                        <Ionicons name={card.icon} size={24} color="#FFF" />
                                    </View>
                                    <View style={st.arrowChip}>
                                        <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
                                    </View>
                                </View>

                                <View style={st.cardBody}>
                                    <Text style={st.cardTitle}>{card.title}</Text>
                                    <Text style={st.cardSub}>{card.subtitle}</Text>
                                </View>

                                <View style={st.cardFooter}>
                                    <Text style={st.cardFooterText}>{t('hub.openWorkspace')}</Text>
                                    <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
                                </View>
                            </AnimatedPressable>
                        </FadeInView>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgPrimary },
    scrollContent: { paddingBottom: 120 },
    headerAmbient: {
        position: 'absolute',
        top: 0,
        left: -80,
        width: 320,
        height: 320,
        borderRadius: 220,
    },

    headerBlock: {
        paddingTop: Platform.OS === 'web' ? 40 : 60,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    kickerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentPrimary },
    kicker: { color: colors.accentPrimary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    pageTitle: { ...typography.display, color: colors.textPrimary, marginTop: 10, lineHeight: 40 },
    pageSub: { fontSize: 14, color: colors.textSecondary, marginTop: 8, lineHeight: 21, maxWidth: 340 },

    statsRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
    statPill: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.borderMid,
        paddingVertical: 10,
        paddingHorizontal: 10,
        minWidth: 100,
    },
    statIconWrap: {
        width: 22,
        height: 22,
        borderRadius: 7,
        backgroundColor: colors.accentMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    statValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
    statLabel: { color: colors.textTertiary, fontSize: 10.5, marginTop: 2, fontWeight: '500' },

    featuredCard: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.xl,
        borderRadius: borderRadius['2xl'],
        overflow: 'hidden',
        minHeight: 160,
        ...shadows.accent,
    },
    featuredContent: { padding: 20 },
    featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.22)',
        alignSelf: 'flex-start',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
    },
    featuredBadgeText: { color: '#FFF', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8 },
    featuredTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 12, letterSpacing: -0.4 },
    featuredSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6, lineHeight: 19, maxWidth: '90%' },
    featuredCta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
    featuredCtaText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

    sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
    sectionBar: { width: 3, height: 14, backgroundColor: colors.accentPrimary, borderRadius: 2 },
    sectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

    grid: { paddingHorizontal: spacing.lg, gap: 14 },

    card: {
        overflow: 'hidden',
        backgroundColor: colors.bgSecondary,
        borderRadius: borderRadius['2xl'],
        padding: 20,
        borderWidth: 1,
        borderColor: colors.borderMid,
        ...shadows.md,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    iconWrap: {
        width: 48, height: 48, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
    },
    arrowChip: {
        width: 30,
        height: 30,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.borderMid,
        backgroundColor: colors.bgTertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBody: { gap: 6 },
    cardTitle: { fontSize: 19, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
    cardSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
    cardFooter: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.borderColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardFooterText: { color: colors.textTertiary, fontSize: 12, fontWeight: '600' },
});

export default HubScreen;
