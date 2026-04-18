// ProfileScreen v4 — Clean, settings-forward, professional
// No icon rings, proper grouped rows, animated stats
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, gradients } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import LawLogo from '../components/LawLogo';
import { chatStorage, documentStorage } from '../services/storage';
import { useAppSettings } from '../contexts/AppSettingsContext';

const Counter = ({ value }) => {
    const anim = useRef(new Animated.Value(0)).current;
    const [display, setDisplay] = useState(0);
    const num = Number(value) || 0;
    useEffect(() => {
        anim.setValue(0);
        Animated.timing(anim, { toValue: num, duration: 800, useNativeDriver: false }).start();
        const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
        return () => anim.removeListener(id);
    }, [num]);
    return <Text style={st.statNum}>{display}</Text>;
};

const Row = ({ icon, label, detail, last, onPress }) => (
    <AnimatedPressable onPress={onPress} scaleValue={0.99}>
        <View style={[st.row, !last && st.rowBorder]}>
            <Ionicons name={icon} size={17} color={colors.textSecondary} />
            <Text style={st.rowLabel} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
            {detail && <Text style={st.rowDetail} numberOfLines={1} ellipsizeMode="tail">{detail}</Text>}
            <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </View>
    </AnimatedPressable>
);

const ProfileScreen = ({ user, onLogout }) => {
    const navigation = useNavigation();
    const { settings, t } = useAppSettings();
    const [usageStats, setUsageStats] = useState({ totalChats: 0, totalDocuments: 0, hoursSaved: 0 });

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const handleLogout = () => {
        const confirmMsg = t('auth.logoutConfirm');
        if (Platform.OS === 'web') {
            if (window.confirm(confirmMsg)) onLogout();
        } else {
            Alert.alert(t('settings.logout'), confirmMsg, [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('settings.logout'), style: 'destructive', onPress: onLogout },
            ]);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            const loadStats = async () => {
                const [chatStats, analyses] = await Promise.all([
                    chatStorage.getChatStats(),
                    documentStorage.loadAnalyses(),
                ]);
                const approxHoursSaved = Math.max(0, Math.round((chatStats.totalMessages * 0.8 + analyses.length * 3) / 60));
                setUsageStats({
                    totalChats: chatStats.totalChats,
                    totalDocuments: analyses.length,
                    hoursSaved: approxHoursSaved,
                });
            };
            loadStats();
        }, [])
    );

    const appearanceLabel = settings.appearance === 'dark' ? t('settings.themeDark') : settings.appearance === 'light' ? t('settings.themeLight') : t('settings.themeSystem');
    const languageLabel = settings.language === 'ur' ? 'اردو' : 'English';
    const isUrdu = settings.language === 'ur';
    const notificationsLabel = settings.notifications?.push ? (isUrdu ? 'آن' : 'On') : (isUrdu ? 'آف' : 'Off');

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
            {/* Premium Header */}
            <View style={st.header}>
                <LinearGradient
                    colors={['rgba(99,102,241,0.08)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                />
                <View style={st.headerLeft}>
                    <LawLogo size={34} />
                    <View>
                        <Text style={st.headerTitle}>{t('nav.profile')}</Text>
                        <Text style={st.headerSub}>{t('settings.editProfile')}</Text>
                    </View>
                </View>
                <AnimatedPressable style={st.headerBtn} onPress={handleLogout} scaleValue={0.9}>
                    <Ionicons name="log-out-outline" size={18} color={colors.error} />
                </AnimatedPressable>
            </View>

            <ScrollView style={st.scrollRoot} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
                {/* User info */}
                <FadeInView delay={0} distance={14}>
                    <View style={st.userSection}>
                        <LinearGradient colors={gradients.brand} style={st.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            <Text style={st.initials}>{initials}</Text>
                        </LinearGradient>
                        <View style={st.userInfo}>
                            <Text style={st.userName} numberOfLines={1} ellipsizeMode="tail">{user?.name || 'User'}</Text>
                            <Text style={st.userEmail} numberOfLines={1} ellipsizeMode="middle">{user?.email || ''}</Text>
                        </View>
                    </View>
                    <Text style={st.memberSince}>Member since {memberSince}</Text>
                </FadeInView>

                {/* Stats */}
                <FadeInView delay={100} distance={12}>
                    <View style={st.statsRow}>
                        {[
                            { label: 'AI Chats', value: usageStats.totalChats },
                            { label: 'Analysed', value: usageStats.totalDocuments },
                            { label: 'Hours Saved', value: usageStats.hoursSaved },
                        ].map((s, i) => (
                            <View key={i} style={st.statCard}>
                                <Counter value={s.value} />
                                <Text style={st.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>
                </FadeInView>

                {/* Account */}
                <FadeInView delay={200} distance={12}>
                    <Text style={st.sectionLabel}>{(isUrdu ? 'اکاؤنٹ' : 'ACCOUNT')}</Text>
                    <View style={st.group}>
                        <Row icon="person-outline" label={t('settings.editProfile')} onPress={() => navigation.navigate('EditProfileScreen', { user })} />
                        <Row icon="key-outline" label={t('settings.changePassword')} onPress={() => navigation.navigate('ChangePasswordScreen')} />
                        <Row icon="cloud-download-outline" label={t('settings.exportData')} last onPress={() => navigation.navigate('ExportDataScreen')} />
                    </View>
                </FadeInView>

                {/* Preferences */}
                <FadeInView delay={300} distance={12}>
                    <Text style={st.sectionLabel}>{(isUrdu ? 'ترجیحات' : 'PREFERENCES')}</Text>
                    <View style={st.group}>
                        <Row icon="moon-outline" label={t('settings.appearance')} detail={appearanceLabel} onPress={() => navigation.navigate('AppearanceScreen')} />
                        <Row icon="notifications-outline" label={t('settings.notifications')} detail={notificationsLabel} onPress={() => navigation.navigate('NotificationsScreen')} />
                        <Row icon="language-outline" label={t('settings.language')} detail={languageLabel} last onPress={() => navigation.navigate('LanguageScreen')} />
                    </View>
                </FadeInView>

                {/* About */}
                <FadeInView delay={380} distance={12}>
                    <Text style={st.sectionLabel}>ABOUT</Text>
                    <View style={st.group}>
                        <Row icon="information-circle-outline" label="About LegalEase" onPress={() => navigation.navigate('AboutScreen')} />
                        <Row icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicyScreen')} />
                        <Row icon="document-text-outline" label="Terms of Service" last onPress={() => navigation.navigate('TermsOfServiceScreen')} />
                    </View>
                </FadeInView>

                {/* Security */}
                <FadeInView delay={440} distance={8}>
                    <View style={st.security}>
                        <Ionicons name="lock-closed" size={11} color={colors.textTertiary} />
                        <Text style={st.secText}>End-to-end encrypted</Text>
                        <View style={st.secDot} />
                        <Text style={st.secText}>v2.0.0</Text>
                    </View>
                </FadeInView>

                {/* Disclaimer */}
                <FadeInView delay={480} distance={8}>
                    <Text style={st.disclaimer}>
                        LegalEase provides AI-generated legal information only.{'\n'}
                        Not a substitute for professional legal counsel.
                    </Text>
                </FadeInView>

                {/* Sign out */}
                <FadeInView delay={520} distance={8}>
                    <TouchableOpacity style={st.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                        <Ionicons name="log-out-outline" size={16} color={colors.error} />
                        <Text style={st.logoutText}>{t('settings.logout')}</Text>
                    </TouchableOpacity>
                </FadeInView>
            </ScrollView>
        </View>
    );
};

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgPrimary },
    scrollRoot: { flex: 1 },
    content: { padding: 24, paddingBottom: spacing.xxxl, maxWidth: 520, alignSelf: 'center', width: '100%', gap: 20 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: colors.bgSecondary,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderColor,
    },
    headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerSub: { color: colors.textTertiary, fontSize: 10, marginTop: 1 },
    headerBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: colors.errorMuted, borderWidth: 1, borderColor: colors.errorBorder,
        alignItems: 'center', justifyContent: 'center',
    },

    // User
    userSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: {
        width: 54, height: 54, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
    },
    initials: { fontSize: 20, fontWeight: '800', color: '#fff' },
    userInfo: { flex: 1 },
    userName: { ...typography.h2, color: colors.textPrimary, letterSpacing: -0.3 },
    userEmail: { color: colors.textTertiary, fontSize: 14, marginTop: 2 },
    memberSince: { color: colors.textTertiary, fontSize: 12, marginTop: 10 },

    // Stats
    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
        flex: 1, backgroundColor: colors.bgSecondary,
        borderRadius: 12, borderWidth: 1, borderColor: colors.borderColor,
        paddingVertical: 16, alignItems: 'center', gap: 4,
    },
    statNum: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
    statLabel: { color: colors.textTertiary, fontSize: 11, fontWeight: '500' },

    // Section
    sectionLabel: { ...typography.label, color: colors.textTertiary, marginBottom: 8, marginLeft: 2 },
    group: {
        backgroundColor: colors.bgSecondary, borderRadius: 12,
        borderWidth: 1, borderColor: colors.borderColor, overflow: 'hidden',
    },

    // Row
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 13,
        paddingHorizontal: 16, paddingVertical: 15,
    },
    rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderColor },
    rowLabel: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
    rowDetail: { color: colors.textTertiary, fontSize: 13, marginRight: 4 },

    // Security
    security: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 4,
    },
    secText: { color: colors.textTertiary, fontSize: 11 },
    secDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textTertiary, opacity: 0.3 },

    // Disclaimer
    disclaimer: {
        color: colors.textTertiary, fontSize: 11, textAlign: 'center',
        lineHeight: 17, opacity: 0.6,
    },

    // Logout
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14,
        backgroundColor: colors.errorMuted, borderRadius: 12,
        borderWidth: 1, borderColor: colors.errorBorder,
    },
    logoutText: { color: colors.error, fontSize: 14, fontWeight: '600' },
});

export default ProfileScreen;
