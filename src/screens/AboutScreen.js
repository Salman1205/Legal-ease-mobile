import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, shadows } from '../constants/theme';
import LawLogo from '../components/LawLogo';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';

const AboutScreen = () => {
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
                        <Text style={st.headerTitle}>About</Text>
                        <Text style={st.headerSub}>LegalEase Platform</Text>
                    </View>
                </View>
                <View style={st.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
                <FadeInView delay={100} distance={15}>
                    <View style={st.logoWrap}>
                        <LawLogo size={80} animated />
                        <Text style={st.appName}>LegalEase</Text>
                        <Text style={st.version}>Version 4.0.0</Text>
                    </View>
                </FadeInView>

                <FadeInView delay={200} distance={15}>
                    <View style={st.card}>
                        <Text style={st.bodyText}>
                            LegalEase is a state-of-the-art legal intelligence platform designed specifically for the Pakistani legal landscape.
                        </Text>
                        <Text style={[st.bodyText, { marginTop: 12 }]}>
                            Our mission is to democratize legal access and streamline legal research by providing an intuitive, AI-powered system that can instantly surface relevant laws, regulations, and procedural guidance from the Pakistan Code.
                        </Text>
                        <Text style={[st.bodyText, { marginTop: 12 }]}>
                            Whether you are a legal professional seeking rapid case preparation or an individual looking to understand your rights, LegalEase is built to serve as your dependable, pocket-sized legal assistant.
                        </Text>
                    </View>
                </FadeInView>

                <FadeInView delay={300} distance={15}>
                    <View style={st.card}>
                        <Text style={st.sectionTitle}>Key Capabilities</Text>
                        {[
                            { icon: 'chatbubbles', label: 'Conversational Legal AI' },
                            { icon: 'document-text', label: 'Rapid Contract Analysis' },
                            { icon: 'scan', label: 'OCR Document Extraction' },
                            { icon: 'newspaper', label: 'Real-time Legal News' }
                        ].map((feat, i) => (
                            <View key={i} style={st.featureRow}>
                                <Ionicons name={feat.icon} size={20} color={colors.accentPrimary} />
                                <Text style={st.featureLabel} numberOfLines={1} ellipsizeMode="tail">{feat.label}</Text>
                            </View>
                        ))}
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
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerSpacer: { width: 40 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
    headerSub: { fontSize: 11, color: colors.textTertiary },
    content: { padding: 20 },
    logoWrap: {
        alignItems: 'center',
        marginVertical: 40,
    },
    appName: {
        marginTop: 16,
        fontSize: 28,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    version: {
        fontSize: 14,
        color: colors.textTertiary,
        marginTop: 4,
    },
    card: {
        backgroundColor: colors.bgSecondary,
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.borderColor,
    },
    bodyText: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 12,
    },
    featureLabel: {
        flex: 1,
        fontSize: 15,
        color: colors.textSecondary,
        fontWeight: '500',
    }
});

export default AboutScreen;
