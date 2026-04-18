import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, gradients } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAppSettings } from '../contexts/AppSettingsContext';

const REVIEWS = [
    { id: '1', author: 'Aliyan M.', rating: 5, text: 'Incredibly knowledgeable and supportive throughout my case. Highly recommend.' },
    { id: '2', author: 'Farah T.', rating: 5, text: 'Very professional, always available to answer my questions.' },
    { id: '3', author: 'Usman S.', rating: 4, text: 'Great lawyer, managed to get my issue resolved quickly.' },
];

const LawyerProfileScreen = ({ route, navigation }) => {
    const { t } = useAppSettings();
    const { lawyer } = route.params || {
        lawyer: { name: t('lawyers.unknownLawyer'), specialty: t('lawyers.generalPractice'), cases: 0, rating: 0, location: t('lawyers.unknownLocation'), available: false }
    };
    const [showContact, setShowContact] = useState(false);
    const [requested, setRequested] = useState(false);

    const handleConnect = () => {
        if (lawyer.contact_email || lawyer.contact_phone) {
            setShowContact(true);
        } else {
            setRequested(true);
            const requestMessage = t('lawyers.profileRequestNoted').replace('{name}', lawyer.name);
            if (Platform.OS === 'web') window.alert(requestMessage);
            else Alert.alert(t('lawyers.requestSentTitle'), requestMessage);
        }
    };

    const handleEmail = () => {
        const email = lawyer.contact_email || '';
        const subject = encodeURIComponent(`LegalEase Consultation Request - ${lawyer.specialty}`);
        const body = encodeURIComponent(`Dear ${lawyer.name},\n\nI found your profile on LegalEase and would like to request a consultation regarding a ${lawyer.specialty} matter.\n\nPlease let me know your availability.\n\nBest regards`);
        Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`).catch(() => {
            Alert.alert(t('lawyers.email'), email);
        });
    };

    const handleCall = () => {
        const phone = lawyer.contact_phone || '';
        Linking.openURL(`tel:${phone}`).catch(() => {
            Alert.alert(t('lawyers.phone'), phone);
        });
    };

    return (
        <View style={st.root}>
            <View style={st.headerBlock}>
                <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={st.headerTitle}>{t('lawyers.profile')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scrollContent}>
                <FadeInView delay={100} distance={20}>
                    <View style={st.heroSection}>
                        <View style={st.avatarWrap}>
                            <LinearGradient colors={gradients.brand} style={st.avatarPlaceholder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                <Text style={st.avatarInitial}>{lawyer.name.charAt(0)}</Text>
                            </LinearGradient>
                            <View style={[st.statusBadge, { backgroundColor: lawyer.available ? colors.success : colors.textTertiary }]}>
                                <Text style={st.statusText}>{lawyer.available ? t('lawyers.available') : t('lawyers.busy')}</Text>
                            </View>
                        </View>

                        <Text style={st.heroName} numberOfLines={2} ellipsizeMode="tail">{lawyer.name}</Text>
                        <Text style={st.heroSpecialty} numberOfLines={1} ellipsizeMode="tail">{lawyer.specialty}</Text>

                        {lawyer.bar_council && (
                            <View style={st.barBadge}>
                                <Ionicons name="ribbon-outline" size={12} color={colors.gold} />
                                <Text style={st.barText}>{lawyer.bar_council}{lawyer.bar_number ? ` · ${lawyer.bar_number}` : ''}</Text>
                            </View>
                        )}

                        <View style={st.metaRow}>
                            <View style={st.metaItem}>
                                <Ionicons name="location" size={14} color={colors.textTertiary} />
                                <Text style={st.metaText}>{lawyer.location}</Text>
                            </View>
                            <View style={st.dot} />
                            <View style={st.metaItem}>
                                <Ionicons name="star" size={14} color={colors.gold} />
                                <Text style={[st.metaText, { color: colors.gold, fontWeight: '700' }]}>{lawyer.rating} {t('lawyers.rating')}</Text>
                            </View>
                        </View>

                        {!showContact ? (
                            <AnimatedPressable
                                style={[st.connectBtn, requested && st.connectBtnRequested]}
                                scaleValue={0.96}
                                onPress={handleConnect}
                                disabled={requested}
                            >
                                <LinearGradient
                                    colors={requested ? [colors.bgTertiary, colors.bgTertiary] : gradients.brand}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                />
                                <Ionicons name={requested ? 'checkmark-circle' : 'call-outline'} size={18} color={requested ? colors.success : '#FFF'} />
                                <Text style={[st.connectBtnText, requested && { color: colors.success }]}>
                                    {requested ? t('lawyers.requestSentTitle') : t('lawyers.requestConsultation')}
                                </Text>
                            </AnimatedPressable>
                        ) : (
                            <View style={st.contactOptions}>
                                {lawyer.contact_email && (
                                    <AnimatedPressable style={st.contactBtn} scaleValue={0.96} onPress={handleEmail}>
                                        <Ionicons name="mail-outline" size={18} color={colors.accentPrimary} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={st.contactLabel}>{t('lawyers.email')}</Text>
                                            <Text style={st.contactValue} numberOfLines={1}>{lawyer.contact_email}</Text>
                                        </View>
                                        <Ionicons name="open-outline" size={14} color={colors.textTertiary} />
                                    </AnimatedPressable>
                                )}
                                {lawyer.contact_phone && (
                                    <AnimatedPressable style={st.contactBtn} scaleValue={0.96} onPress={handleCall}>
                                        <Ionicons name="call-outline" size={18} color={colors.success} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={st.contactLabel}>{t('lawyers.phone')}</Text>
                                            <Text style={st.contactValue} numberOfLines={1}>{lawyer.contact_phone}</Text>
                                        </View>
                                        <Ionicons name="open-outline" size={14} color={colors.textTertiary} />
                                    </AnimatedPressable>
                                )}
                            </View>
                        )}
                    </View>
                </FadeInView>

                <FadeInView delay={200} distance={15}>
                    <View style={st.statsRow}>
                        <View style={st.statBox}>
                            <Text style={st.statValue}>{lawyer.cases}+</Text>
                            <Text style={st.statLabel}>{t('lawyers.casesWon')}</Text>
                        </View>
                        <View style={st.statDivider} />
                        <View style={st.statBox}>
                            <Text style={st.statValue}>{lawyer.experience_years || 12}</Text>
                            <Text style={st.statLabel}>{t('lawyers.yearsExp')}</Text>
                        </View>
                        <View style={st.statDivider} />
                        <View style={st.statBox}>
                            <Text style={st.statValue}>98%</Text>
                            <Text style={st.statLabel}>{t('lawyers.successRate')}</Text>
                        </View>
                    </View>
                </FadeInView>

                <FadeInView delay={300} distance={15}>
                    <View style={st.section}>
                        <Text style={st.sectionTitle}>{t('lawyers.about')}</Text>
                        <Text style={st.aboutText}>
                            {lawyer.bio || t('lawyers.profileAboutFallback').replace('{name}', lawyer.name).replace('{specialty}', lawyer.specialty).replace('{experience}', String(lawyer.experience_years || t('lawyers.decade'))).replace('{location}', lawyer.location)}
                        </Text>
                    </View>
                </FadeInView>

                {lawyer.availability && (
                    <FadeInView delay={350} distance={15}>
                        <View style={st.section}>
                            <Text style={st.sectionTitle}>{t('lawyers.availability')}</Text>
                            <View style={st.availBadge}>
                                <Ionicons name="time-outline" size={14} color={colors.accentPrimary} />
                                <Text style={st.availText}>{lawyer.availability}</Text>
                            </View>
                        </View>
                    </FadeInView>
                )}

                <FadeInView delay={400} distance={15}>
                    <View style={st.section}>
                        <Text style={st.sectionTitle}>{t('lawyers.clientReviews')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.reviewList}>
                            {REVIEWS.map((review) => (
                                <View key={review.id} style={st.reviewCard}>
                                    <View style={st.reviewHeader}>
                                        <Text style={st.reviewAuthor}>{review.author}</Text>
                                        <View style={st.stars}>
                                            {[...Array(review.rating)].map((_, idx) => (
                                                <Ionicons key={idx} name="star" size={12} color={colors.gold} />
                                            ))}
                                        </View>
                                    </View>
                                    <Text style={st.reviewText}>{review.text}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </FadeInView>
            </ScrollView>
        </View>
    );
};

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgPrimary },
    scrollContent: { paddingBottom: 100 },
    headerBlock: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'web' ? 40 : 60,
        paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
        backgroundColor: colors.bgPrimary,
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgTertiary, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },

    heroSection: { alignItems: 'center', paddingHorizontal: spacing.lg, marginTop: spacing.md },
    avatarWrap: { position: 'relative', marginBottom: 16 },
    avatarPlaceholder: {
        width: 100, height: 100, borderRadius: 50,
        alignItems: 'center', justifyContent: 'center', ...shadows.accent,
    },
    avatarInitial: { fontSize: 40, fontWeight: '700', color: '#FFF' },
    statusBadge: {
        position: 'absolute', bottom: 0, right: 0,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
        borderWidth: 2, borderColor: colors.bgPrimary,
    },
    statusText: { fontSize: 10, fontWeight: '700', color: '#FFF', textTransform: 'uppercase' },

    heroName: { ...typography.h1, color: colors.textPrimary, marginBottom: 4 },
    heroSpecialty: { fontSize: 16, color: colors.accentPrimary, fontWeight: '600', marginBottom: 8 },

    barBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: colors.goldMuted, borderWidth: 1, borderColor: colors.goldBorder,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12,
    },
    barText: { color: colors.gold, fontSize: 11, fontWeight: '600' },

    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 14, color: colors.textTertiary },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textTertiary, marginHorizontal: 10 },

    connectBtn: {
        width: '100%', height: 50, borderRadius: 16, overflow: 'hidden',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        ...shadows.accent,
    },
    connectBtnRequested: { shadowOpacity: 0 },
    connectBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    contactOptions: { width: '100%', gap: 10 },
    contactBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: colors.bgSecondary, borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: colors.borderColor,
    },
    contactLabel: { color: colors.textTertiary, fontSize: 11, fontWeight: '600' },
    contactValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '500', marginTop: 1 },

    statsRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.bgSecondary,
        marginHorizontal: spacing.lg, marginTop: 30,
        borderRadius: 20, paddingVertical: 20,
        borderWidth: 1, borderColor: colors.borderColor,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: 30, backgroundColor: colors.borderColor },
    statValue: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
    statLabel: { fontSize: 12, color: colors.textTertiary },

    section: { paddingHorizontal: spacing.lg, marginTop: 30 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
    aboutText: { fontSize: 15, color: colors.textSecondary, lineHeight: 24 },

    availBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colors.accentMuted, borderWidth: 1, borderColor: colors.accentBorder,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    },
    availText: { color: colors.textPrimary, fontSize: 14 },

    reviewList: { paddingRight: spacing.lg, gap: 16 },
    reviewCard: {
        width: 260, backgroundColor: colors.bgSecondary,
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: colors.borderColor,
    },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    reviewAuthor: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    stars: { flexDirection: 'row', gap: 2 },
    reviewText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },
});

export default LawyerProfileScreen;
