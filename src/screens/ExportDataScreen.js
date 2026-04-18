import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, shadows } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import { useToast } from '../components/Toast';
import * as Clipboard from 'expo-clipboard';
import { exportStorage } from '../services/storage';
import { authService } from '../services/auth';

const ExportDataScreen = () => {
    const navigation = useNavigation();
    const { showToast } = useToast() || {};
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleExport = () => {
        const run = async () => {
            setErrorMessage('');
            setIsExporting(true);
            const session = await authService.getSession();
            const payload = await exportStorage.buildExportPayload(session?.user || null);
            const json = JSON.stringify(payload, null, 2);

            if (Platform.OS === 'web') {
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const date = new Date().toISOString().slice(0, 10);
                a.href = url;
                a.download = `legalease-export-${date}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast?.('Download started', { variant: 'success' });
            } else {
                await Clipboard.setStringAsync(json);
                showToast?.('Export copied to clipboard', { variant: 'success' });
            }

            setIsExporting(false);
            setExportSuccess(true);
        };

        run().catch((err) => {
            setIsExporting(false);
            const msg = err?.message || 'Could not prepare export. Please try again.';
            setErrorMessage(msg);
            showToast?.(msg, { variant: 'error' });
        });
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
                    <Text style={st.headerTitle}>Export Data</Text>
                </View>
                <View style={st.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>

                <FadeInView delay={100} distance={15}>
                    <View style={st.card}>
                        <View style={st.iconWrap}>
                            <Ionicons name="cloud-download" size={32} color={colors.accentPrimary} />
                        </View>
                        <Text style={st.cardTitle}>Download Your Data</Text>
                        <Text style={st.cardDesc}>
                            Get a copy of your LegalEase data to review or keep for your records. Your export will include:
                        </Text>

                        <View style={st.listGroup}>
                            <View style={st.listItem}><Ionicons name="checkmark" size={16} color={colors.success} /><Text style={st.listText} numberOfLines={1} ellipsizeMode="tail">Profile information</Text></View>
                            <View style={st.listItem}><Ionicons name="checkmark" size={16} color={colors.success} /><Text style={st.listText} numberOfLines={1} ellipsizeMode="tail">Chat history and AI transcripts</Text></View>
                            <View style={st.listItem}><Ionicons name="checkmark" size={16} color={colors.success} /><Text style={st.listText} numberOfLines={1} ellipsizeMode="tail">Document extraction results</Text></View>
                            <View style={st.listItem}><Ionicons name="checkmark" size={16} color={colors.success} /><Text style={st.listText} numberOfLines={1} ellipsizeMode="tail">Usage statistics</Text></View>
                        </View>
                    </View>
                </FadeInView>

                <FadeInView delay={200} distance={15}>
                    {exportSuccess ? (
                        <View style={st.successCard}>
                            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                            <Text style={st.successTitle}>Export Complete</Text>
                            <Text style={st.successDesc}>{Platform.OS === 'web' ? 'Your data has been downloaded as JSON.' : 'Your data JSON has been copied to clipboard.'}</Text>
                            <AnimatedPressable style={st.downloadBtn} onPress={() => setExportSuccess(false)}>
                                <Text style={st.downloadBtnText}>Download Another Copy</Text>
                            </AnimatedPressable>
                        </View>
                    ) : (
                        <AnimatedPressable style={[st.exportBtn, isExporting && st.exportBtnDisabled]} onPress={handleExport} disabled={isExporting}>
                            {isExporting ? (
                                <View style={st.btnContent}>
                                    <ActivityIndicator size="small" color="#FFF" />
                                    <Text style={st.btnText}>Preparing Export...</Text>
                                </View>
                            ) : (
                                <View style={st.btnContent}>
                                    <Ionicons name="download-outline" size={20} color="#FFF" />
                                    <Text style={st.btnText}>{Platform.OS === 'web' ? 'Download JSON' : 'Copy JSON to Clipboard'}</Text>
                                </View>
                            )}
                        </AnimatedPressable>
                    )}
                </FadeInView>

                {errorMessage ? (
                    <FadeInView delay={150} distance={10}>
                        <View style={st.errorCard}>
                            <Ionicons name="alert-circle" size={20} color={colors.error} />
                            <Text style={st.errorText}>{errorMessage}</Text>
                        </View>
                    </FadeInView>
                ) : null}
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
        borderColor: 'rgba(255,255,255,0.04)',
        zIndex: 10,
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    headerCenter: { flexDirection: 'row', alignItems: 'center' },
    headerSpacer: { width: 40 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },

    content: { padding: 24 },
    card: {
        backgroundColor: colors.bgSecondary,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.borderColor,
        alignItems: 'center',
        marginBottom: 24,
    },
    iconWrap: {
        width: 64, height: 64,
        borderRadius: 32,
        backgroundColor: colors.accentMuted,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    cardTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
    cardDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 12, marginBottom: 24 },
    listGroup: { width: '100%', backgroundColor: colors.bgTertiary, padding: 16, borderRadius: 16 },
    listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    listText: { flex: 1, fontSize: 14, color: colors.textSecondary },

    exportBtn: {
        backgroundColor: colors.accentPrimary,
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.accent,
    },
    exportBtnDisabled: {
        backgroundColor: colors.textTertiary,
        shadowOpacity: 0,
    },
    btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

    successCard: {
        backgroundColor: colors.successMuted,
        borderRadius: 24, padding: 24,
        alignItems: 'center',
        borderWidth: 1, borderColor: colors.successBorder,
    },
    successTitle: { fontSize: 18, fontWeight: '700', color: colors.success, marginTop: 12, marginBottom: 6 },
    successDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
    downloadBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 12,
    },
    downloadBtnText: { color: colors.success, fontWeight: '600', fontSize: 14 },

    errorCard: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.25)',
        padding: 14,
        borderRadius: 14,
    },
    errorText: { flex: 1, color: colors.textSecondary, fontSize: 13 },
});

export default ExportDataScreen;
