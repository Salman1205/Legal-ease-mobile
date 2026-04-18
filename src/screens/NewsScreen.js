// NewsScreen v6 — Functional legal updates hub
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, TouchableOpacity, TextInput, Platform, Dimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography, shadows, gradients } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import LawLogo from '../components/LawLogo';
import { appSettingsStorage } from '../services/storage';

const CATEGORIES = [
    { icon: 'business-outline', title: 'Supreme Court', color: '#F87171', bg: ['#F87171', '#EF4444'], prompt: 'What are the latest significant Supreme Court of Pakistan rulings and their implications?' },
    { icon: 'document-text-outline', title: 'Legislation', color: '#FBBF24', bg: ['#FBBF24', '#F59E0B'], prompt: 'What are the recent legislative changes and new laws passed in Pakistan?' },
    { icon: 'briefcase-outline', title: 'Corporate', color: '#34D399', bg: ['#34D399', '#10B981'], prompt: 'What are the latest corporate law developments and SECP regulations in Pakistan?' },
    { icon: 'shield-checkmark-outline', title: 'Criminal', color: '#A78BFA', bg: ['#A78BFA', '#8B5CF6'], prompt: 'What are the recent developments in criminal law and procedure in Pakistan?' },
    { icon: 'home-outline', title: 'Property', color: '#38BDF8', bg: ['#38BDF8', '#0EA5E9'], prompt: 'What are the latest property and land law developments in Pakistan?' },
    { icon: 'people-outline', title: 'Family', color: '#F472B6', bg: ['#F472B6', '#EC4899'], prompt: 'What are the recent family law developments in Pakistan including marriage, divorce, and custody?' },
];

const RECENT_UPDATES = [
    { id: '1', title: 'Supreme Court Rules on Digital Evidence', category: 'Supreme Court', date: '2026-04-02', summary: 'The SC has issued new guidelines on the admissibility of digital evidence in criminal proceedings.' },
    { id: '2', title: 'SECP Updates Company Registration Process', category: 'Corporate', date: '2026-03-28', summary: 'New streamlined digital company registration process effective from April 2026.' },
    { id: '3', title: 'Punjab Tenancy Act Amendment', category: 'Property', date: '2026-03-25', summary: 'Key amendments to the Punjab Tenancy Act affecting tenant rights and eviction procedures.' },
    { id: '4', title: 'Family Courts Act 2026 Amendment', category: 'Family', date: '2026-03-20', summary: 'New provisions for expedited child custody hearings and maintenance enforcement.' },
    { id: '5', title: 'Anti-Money Laundering Regulations Updated', category: 'Corporate', date: '2026-03-15', summary: 'FIA issues updated AML compliance guidelines for banking and financial institutions.' },
];

const NewsScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [savingSubscription, setSavingSubscription] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
const heroScale = useRef(new Animated.Value(0.9)).current;
    const heroOp = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(heroScale, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }),
            Animated.timing(heroOp, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();

        appSettingsStorage.loadSettings().then((settings) => {
            const sub = settings.newsSubscription;
            if (sub?.subscribed) { setSubscribed(true); setEmail(sub.email || ''); }
        });
    }, []);

    const subscribeForLaunch = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed.includes('@') || !trimmed.includes('.')) return;
        setSavingSubscription(true);
        await appSettingsStorage.updateNewsSubscription({ subscribed: true, email: trimmed });
        setSubscribed(true);
        setSavingSubscription(false);
    };

    const handleCategoryPress = (cat) => {
        setSelectedCategory((current) => (current === cat.title ? 'All' : cat.title));
    };

    const visibleUpdates = selectedCategory === 'All'
        ? RECENT_UPDATES
        : RECENT_UPDATES.filter((item) => item.category === selectedCategory);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getCategoryColor = (cat) => {
        const found = CATEGORIES.find(c => c.title === cat);
        return found ? found.color : colors.textTertiary;
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
            <View style={st.header}>
                <View style={st.headerLeft}>
                    <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <LawLogo size={30} />
                    <View>
                        <Text style={st.headerTitle}>Legal News</Text>
                        <Text style={st.headerSub}>Updates & briefs</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
                <Animated.View style={[st.heroCenter, { opacity: heroOp, transform: [{ scale: heroScale }] }]}>
                    <Text style={st.heroTitle}>Legal Updates</Text>
                    <Text style={st.heroDesc}>Stay informed with the latest developments in Pakistani law</Text>
                </Animated.View>

                {/* Category grid */}
                <FadeInView delay={200} distance={16}>
                    <Text style={st.sectionLabel}>BROWSE BY CATEGORY</Text>
                    {selectedCategory !== 'All' && (
                        <Text style={st.selectedCategoryText}>Showing updates for {selectedCategory}</Text>
                    )}
                    <View style={st.catGrid}>
                        {CATEGORIES.map((cat, i) => (
                            <AnimatedPressable
                                key={i}
                                style={[st.catCard, selectedCategory === cat.title && st.catCardActive]}
                                scaleValue={0.95}
                                onPress={() => handleCategoryPress(cat)}
                            >
                                <LinearGradient colors={cat.bg} style={st.catIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <Ionicons name={cat.icon} size={16} color="#fff" />
                                </LinearGradient>
                                <Text style={[st.catTitle, selectedCategory === cat.title && st.catTitleActive]} numberOfLines={1} ellipsizeMode="tail">{cat.title}</Text>
                            </AnimatedPressable>
                        ))}
                    </View>
                </FadeInView>

                {/* Recent Updates */}
                <FadeInView delay={350} distance={14}>
                    <Text style={st.sectionLabel}>RECENT UPDATES</Text>
                    <View style={st.updatesGroup}>
                        {visibleUpdates.map((item, i) => (
                            <TouchableOpacity key={item.id} style={[st.updateRow, i < visibleUpdates.length - 1 && st.updateBorder]} activeOpacity={0.7}>
                                <View style={st.updateHeader}>
                                    <View style={[st.updateCatDot, { backgroundColor: getCategoryColor(item.category) }]} />
                                    <Text style={st.updateCat} numberOfLines={1} ellipsizeMode="tail">{item.category}</Text>
                                    <Text style={st.updateDate} numberOfLines={1}>{formatDate(item.date)}</Text>
                                </View>
                                <Text style={st.updateTitle} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
                                <Text style={st.updateSummary} numberOfLines={3} ellipsizeMode="tail">{item.summary}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </FadeInView>

                {/* Subscribe CTA */}
                <FadeInView delay={500} distance={12}>
                    <View style={st.ctaCard}>
                        <LinearGradient colors={['rgba(14,165,164,0.08)', 'rgba(14,165,164,0.02)']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                        <Text style={st.ctaTitle}>Get daily updates</Text>
                        <Text style={st.ctaDesc}>Subscribe to receive curated legal news in your inbox</Text>
                        {subscribed ? (
                            <View style={st.subRow}>
                                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                                <Text style={st.subText}>You're subscribed!</Text>
                            </View>
                        ) : (
                            <View style={st.inputRow}>
                                <TextInput
                                    style={st.emailInput} value={email} onChangeText={setEmail}
                                    placeholder="you@example.com" placeholderTextColor={colors.textTertiary}
                                    keyboardType="email-address" autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={subscribeForLaunch} activeOpacity={0.8} disabled={savingSubscription}>
                                    <LinearGradient colors={gradients.brand} style={st.notifyBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        {savingSubscription ? <Ionicons name="hourglass-outline" size={16} color="#fff" /> : <Ionicons name="arrow-forward" size={16} color="#fff" />}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </FadeInView>

                <FadeInView delay={600} distance={8}>
                    <View style={st.footHint}>
                        <Ionicons name="chatbubbles-outline" size={13} color={colors.textTertiary} />
                        <Text style={st.footHintText}>Ask our AI about any legal topic for detailed analysis</Text>
                    </View>
                </FadeInView>
            </ScrollView>
        </View>
    );
};

const st = StyleSheet.create({
    content: { padding: 20, paddingBottom: 120, maxWidth: 520, alignSelf: 'center', width: '100%' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: colors.bgSecondary,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderColor,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgTertiary, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
    headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
    headerSub: { color: colors.textTertiary, fontSize: 10, marginTop: 1 },

    heroCenter: { alignItems: 'center', paddingVertical: 20, gap: 8 },
    heroTitle: { ...typography.h1, color: colors.textPrimary },
    heroDesc: { color: colors.textTertiary, fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 300 },

    sectionLabel: { ...typography.label, color: colors.textTertiary, marginBottom: 10, marginLeft: 4, marginTop: 22 },
    selectedCategoryText: { color: colors.textSecondary, fontSize: 12, marginLeft: 4, marginBottom: 10 },

    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
    catCard: {
        width: '31%', backgroundColor: colors.bgSecondary,
        borderRadius: 16, paddingVertical: 16, alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: colors.borderColor,
    },
    catCardActive: {
        borderColor: colors.accentPrimary,
        backgroundColor: 'rgba(14,165,164,0.08)',
    },
    catIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    catTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center', paddingHorizontal: 4 },
    catTitleActive: { color: colors.textPrimary, fontWeight: '700' },

    updatesGroup: {
        backgroundColor: colors.bgSecondary, borderRadius: 16,
        borderWidth: 1, borderColor: colors.borderColor, overflow: 'hidden',
    },
    updateRow: { paddingHorizontal: 16, paddingVertical: 14 },
    updateBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderColor },
    updateHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    updateCatDot: { width: 6, height: 6, borderRadius: 3 },
    updateCat: { color: colors.textTertiary, fontSize: 11, fontWeight: '600', flex: 1 },
    updateDate: { color: colors.textTertiary, fontSize: 11 },
    updateTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 4 },
    updateSummary: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },

    ctaCard: {
        backgroundColor: colors.bgSecondary, borderRadius: 20,
        borderWidth: 1, borderColor: colors.borderMid,
        padding: 20, gap: 10, overflow: 'hidden', marginTop: 22,
    },
    ctaTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
    ctaDesc: { color: colors.textTertiary, fontSize: 13, lineHeight: 19 },
    inputRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    emailInput: {
        flex: 1, height: 46, backgroundColor: colors.bgTertiary,
        borderRadius: 14, paddingHorizontal: 14,
        color: colors.textPrimary, fontSize: 14,
        borderWidth: 1, borderColor: colors.borderColor,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    },
    notifyBtn: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...shadows.accent },
    subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    subText: { color: colors.success, fontSize: 14, fontWeight: '600' },

    footHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 22 },
    footHintText: { color: colors.textTertiary, fontSize: 12 },
});

export default NewsScreen;
