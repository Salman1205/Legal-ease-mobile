import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAppSettings } from '../contexts/AppSettingsContext';

const NotificationsScreen = () => {
    const navigation = useNavigation();
    const { settings: appSettings, setNotifications, t } = useAppSettings();
    const settings = appSettings.notifications || {
        push: true, email: false, news: true, documentUpdates: true, security: true,
    };
    const [saved, setSaved] = useState(false);

    const toggle = async (key) => {
        await setNotifications({ [key]: !settings[key] });
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
    };

    const renderToggle = (key, title, desc, last = false) => (
        <View style={[st.row, !last && st.rowBorder]}>
            <View style={st.rowTextWrap}>
                <Text style={st.rowTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
                <Text style={st.rowDesc} numberOfLines={2} ellipsizeMode="tail">{desc}</Text>
            </View>
            <Switch
                value={settings[key]}
                onValueChange={() => toggle(key)}
                trackColor={{ false: colors.bgTertiary, true: colors.accentPrimary }}
                thumbColor={Platform.OS === 'ios' ? '#FFF' : '#FFF'}
            />
        </View>
    );

    return (
        <View style={st.root}>
            <View style={st.header}>
                <LinearGradient
                    colors={['rgba(99,102,241,0.08)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                />

                <AnimatedPressable style={st.backBtn} onPress={() => navigation.goBack()} scaleValue={0.9}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </AnimatedPressable>

                <View style={st.headerCenter}>
                    <Text style={st.headerTitle}>{t('settings.notifications')}</Text>
                </View>
                <View style={st.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
                <FadeInView delay={100} distance={15}>
                    <Text style={st.sectionLabel}>{t('settings.notificationsHelper')}</Text>
                    <View style={st.group}>
                        {renderToggle('push', t('settings.notifPush'), t('settings.notifPushDesc'), false)}
                        {renderToggle('email', t('settings.notifEmail'), t('settings.notifEmailDesc'), true)}
                    </View>
                </FadeInView>

                <FadeInView delay={200} distance={15}>
                    <View style={st.group}>
                        {renderToggle('documentUpdates', t('settings.notifDocs'), t('settings.notifDocsDesc'), false)}
                        {renderToggle('news', t('settings.notifNews'), t('settings.notifNewsDesc'), false)}
                        {renderToggle('security', t('settings.notifSecurity'), t('settings.notifSecurityDesc'), true)}
                    </View>
                </FadeInView>

                {saved && (
                    <View style={st.savedWrap}>
                        <Text style={st.savedText}>{t('common.saved')}</Text>
                    </View>
                )}

            </ScrollView>
        </View>
    );
};

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgPrimary },
    header: {
        height: Platform.OS === 'web' ? 70 : 100,
        paddingTop: Platform.OS === 'web' ? 10 : 40,
        paddingHorizontal: 16,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.bgSecondary,
        borderBottomWidth: 1, borderColor: colors.borderColor,
        zIndex: 10,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.bgTertiary,
        borderWidth: 1, borderColor: colors.borderMid,
    },
    headerCenter: { flexDirection: 'row', alignItems: 'center' },
    headerSpacer: { width: 40 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },

    content: { padding: 20 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textTertiary, marginBottom: 12, paddingLeft: 8, marginTop: 16, letterSpacing: 0.5 },
    group: {
        backgroundColor: colors.bgSecondary,
        borderRadius: 16,
        borderWidth: 1, borderColor: colors.borderColor,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderColor },
    rowTextWrap: { flex: 1, paddingRight: 16 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
    rowDesc: { fontSize: 13, color: colors.textTertiary, lineHeight: 18 },
    savedWrap: { alignItems: 'center', marginTop: 16, marginBottom: 10 },
    savedText: { color: colors.success, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
});

export default NotificationsScreen;
