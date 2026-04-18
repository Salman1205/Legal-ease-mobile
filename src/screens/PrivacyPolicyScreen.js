import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import LawLogo from '../components/LawLogo';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';

const PrivacyPolicyScreen = () => {
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
                        <Text style={st.headerTitle}>Privacy</Text>
                        <Text style={st.headerSub}>Data Protection</Text>
                    </View>
                </View>
                <View style={st.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
                <FadeInView delay={100} distance={15}>
                    <View style={st.headerBlock}>
                        <Text style={st.pageTitle}>Privacy Policy</Text>
                        <Text style={st.lastUpdated}>Last Updated: October 2026</Text>
                    </View>
                </FadeInView>

                <FadeInView delay={200} distance={15}>
                    <View style={st.card}>
                        <Text style={st.sectionTitle}>1. Data Collection</Text>
                        <Text style={st.bodyText}>
                            We collect minimal personal information required to maintain your account and provide you with personalized legal intelligence. This includes your email, name, and encrypted credentials. Any documents you upload for analysis are temporarily processed and not retained permanently unless expressly saved to your profile.
                        </Text>
                    </View>

                    <View style={st.card}>
                        <Text style={st.sectionTitle}>2. Use of Information</Text>
                        <Text style={st.bodyText}>
                            Your interactions with the LegalEase Assistant and uploaded documents are processed securely. We use this data strictly to provide relevant legal answers. We do not sell, rent, or trade your inquiries or personal data to third parties.
                        </Text>
                    </View>

                    <View style={st.card}>
                        <Text style={st.sectionTitle}>3. Security Measures</Text>
                        <Text style={st.bodyText}>
                            LegalEase employs industry-standard security protocols to protect your data during transit and at rest. We utilize encryption for sensitive information to ensure unauthorized access is prevented.
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

export default PrivacyPolicyScreen;
