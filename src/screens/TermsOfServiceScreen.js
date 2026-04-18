import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import LawLogo from '../components/LawLogo';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';

const TermsOfServiceScreen = () => {
    const navigation = useNavigation();

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
                    <LawLogo size={32} />
                    <View style={{ marginLeft: 8 }}>
                        <Text style={st.headerTitle}>Terms</Text>
                        <Text style={st.headerSub}>Usage Guidelines</Text>
                    </View>
                </View>
                <View style={st.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
                <FadeInView delay={100} distance={15}>
                    <View style={st.headerBlock}>
                        <Text style={st.pageTitle}>Terms of Service</Text>
                        <Text style={st.lastUpdated}>Effective Date: October 2026</Text>
                    </View>
                </FadeInView>

                <FadeInView delay={200} distance={15}>
                    <View style={st.card}>
                        <Text style={st.sectionTitle}>1. Acceptance of Terms</Text>
                        <Text style={st.bodyText}>
                            By accessing and using the LegalEase application, you accept and agree to be bound by the terms and provisions of this agreement.
                        </Text>
                    </View>

                    <View style={st.card}>
                        <Text style={st.sectionTitle}>2. Not Legal Advice</Text>
                        <Text style={st.bodyText}>
                            The information and analysis provided by the LegalEase AI is for informational and educational purposes only. It is NOT a substitute for professional legal advice from a qualified attorney. Always consult a legal professional before making decisions based on our output.
                        </Text>
                    </View>

                    <View style={st.card}>
                        <Text style={st.sectionTitle}>3. User Conduct</Text>
                        <Text style={st.bodyText}>
                            You agree not to use the app for any unlawful purpose, or in any way that could damage, disable, overburden, or impair the service. Malicious use, including attempting to reverse engineer the AI models, will result in immediate account termination.
                        </Text>
                    </View>
                </FadeInView>
                <View style={{ height: 40 }} />
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
        borderBottomWidth: 1,
        borderColor: colors.borderColor,
        zIndex: 10,
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.bgTertiary,
        borderWidth: 1, borderColor: colors.borderMid,
    },
    headerCenter: { flexDirection: 'row', alignItems: 'center' },
    headerSpacer: { width: 40 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
    headerSub: { fontSize: 11, color: colors.textTertiary },
    content: { padding: 20 },
    headerBlock: {
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    lastUpdated: {
        fontSize: 13,
        color: colors.textTertiary,
        marginTop: 6,
    },
    card: {
        backgroundColor: colors.bgSecondary,
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.borderColor,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    bodyText: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 24,
    }
});

export default TermsOfServiceScreen;
