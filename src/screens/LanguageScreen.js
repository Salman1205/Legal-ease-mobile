import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAppSettings } from '../contexts/AppSettingsContext';

const LanguageScreen = () => {
    const navigation = useNavigation();
    const { language, setLanguage, t } = useAppSettings();
    const [saved, setSaved] = useState(false);

    const onSelectLanguage = async (id) => {
        await setLanguage(id);
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
    };
    const lang = language;

    const renderOption = (id, title, desc, flag) => {
        const isActive = lang === id;
        return (
            <AnimatedPressable key={id} style={[st.optionCard, isActive && st.optionCardActive]} onPress={() => onSelectLanguage(id)} scaleValue={0.97}>
                <View style={[st.iconWrap, isActive && st.iconWrapActive]}>
                    <Text style={st.flagIcon}>{flag}</Text>
                </View>
                <View style={st.optionTextWrap}>
                    <Text style={[st.optionTitle, isActive && st.optionTitleActive]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
                    <Text style={st.optionDesc} numberOfLines={2} ellipsizeMode="tail">{desc}</Text>
                </View>
                <View style={st.radioOuter}>
                    {isActive ? <View style={st.radioInner} /> : null}
                </View>
            </AnimatedPressable>
        );
    };

    return (
        <View style={st.root}>
            {/* Header */}
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
                    <Text style={st.headerTitle}>{t('settings.language')}</Text>
                </View>
                <View style={st.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
                <FadeInView delay={100} distance={15}>
                    <Text style={st.sectionLabel}>{t('settings.appLanguage')}</Text>
                    <View style={st.optionsGroup}>
                        {renderOption('en', 'English', 'Default legal interface language', '🇬🇧')}
                        {renderOption('ur', 'Urdu', 'UI labels and prompts (beta)', '🇵🇰')}
                    </View>
                    <Text style={st.helperText}>{t('settings.languageHelper')}</Text>
                    {saved && <Text style={st.savedText}>{t('common.saved')}</Text>}
                </FadeInView>
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
    sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textTertiary, marginBottom: 16, paddingLeft: 8, letterSpacing: 0.5 },
    optionsGroup: { gap: 12 },

    optionCard: {
        flexDirection: 'row', alignItems: 'center',
        padding: 16,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1, borderColor: colors.borderColor,
        borderRadius: 16,
    },
    optionCardActive: {
        backgroundColor: colors.accentMuted,
        borderColor: colors.accentBorder,
    },
    iconWrap: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: colors.bgTertiary,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
    },
    iconWrapActive: { backgroundColor: colors.accentMuted },
    flagIcon: { fontSize: 20 },
    optionTextWrap: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
    optionTitleActive: { color: colors.accentPrimary },
    optionDesc: { fontSize: 13, color: colors.textTertiary },

    radioOuter: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: colors.textTertiary,
        alignItems: 'center', justifyContent: 'center',
    },
    radioInner: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: colors.accentPrimary,
    },
    helperText: {
        fontSize: 13, color: colors.textTertiary,
        marginTop: 20, paddingHorizontal: 8,
        lineHeight: 20, textAlign: 'center'
    },
    savedText: {
        color: colors.success,
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 10,
        letterSpacing: 0.3,
    },
});

export default LanguageScreen;
