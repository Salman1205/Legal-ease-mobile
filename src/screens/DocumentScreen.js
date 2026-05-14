// DocumentScreen v6 — Cinematic, creative, alive
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    ActivityIndicator, Platform, Animated, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography, shadows, gradients } from '../constants/theme';
import { apiService } from '../services/api';
import { documentStorage } from '../services/storage';
import MarkdownText from '../components/MarkdownText';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import LawLogo from '../components/LawLogo';
import { useAppSettings } from '../contexts/AppSettingsContext';

const { width: SCREEN_W } = Dimensions.get('window');

const calcRiskScore = (analysis) => {
    if (!analysis) return null;
    // Backend returns `compliance_score` 0-100 directly — prefer that.
    if (Number.isFinite(Number(analysis.compliance_score))) {
        return Math.max(0, Math.min(100, Math.round(Number(analysis.compliance_score))));
    }
    const risks = analysis.risks?.length || 0;
    const missing = (analysis.missing_clauses || analysis.missing)?.length || 0;
    const recs = analysis.recommendations?.length || 0;
    return Math.max(0, Math.min(100, Math.round(100 - risks * 12 - missing * 7 - recs * 4)));
};

const formatApplicableLaw = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    const name = item.name || 'Applicable law';
    const year = item.year ? ` (${item.year})` : '';
    const relev = item.relevance ? ` — ${item.relevance}` : '';
    const sections = Array.isArray(item.key_sections) && item.key_sections.length
        ? ` [Sections: ${item.key_sections.join(', ')}]`
        : '';
    return `${name}${year}${relev}${sections}`;
};

const getRiskLevel = (score) => {
    if (score === null) return null;
    if (score >= 80) return { label: 'Low Risk', icon: 'checkmark-circle', color: '#34D399', bg: ['#34D399', '#10B981'] };
    if (score >= 55) return { label: 'Medium Risk', icon: 'alert-circle', color: '#FBBF24', bg: ['#FBBF24', '#F59E0B'] };
    return { label: 'High Risk', icon: 'close-circle', color: '#F87171', bg: ['#F87171', '#EF4444'] };
};

const cleanText = (t) => t ? String(t).replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/\s+/g, ' ').trim() : '';

const STEP_KEYS = [
    { key: 'document.stepUploading', icon: 'cloud-upload-outline' },
    { key: 'document.stepReading', icon: 'reader-outline' },
    { key: 'document.stepRisks', icon: 'warning-outline' },
    { key: 'document.stepReport', icon: 'sparkles-outline' },
];

// Expandable risk card — shows severity, description, problematic clause text,
// suggested replacement clause, and law reference (mirrors the web RiskCard).
const SEVERITY_STYLES = {
    critical: { color: '#DC2626', bg: '#FEE2E2', label: 'CRITICAL' },
    high: { color: '#EA580C', bg: '#FFEDD5', label: 'HIGH' },
    medium: { color: '#D97706', bg: '#FEF3C7', label: 'MEDIUM' },
    low: { color: '#65A30D', bg: '#ECFCCB', label: 'LOW' },
};

const RiskCard = ({ risk, idx, isLast }) => {
    const [open, setOpen] = useState(idx === 0);
    if (!risk) return null;
    const sev = SEVERITY_STYLES[String(risk.severity || 'medium').toLowerCase()] || SEVERITY_STYLES.medium;
    return (
        <View style={[sec.card, !isLast && { marginBottom: 10 }, { borderLeftColor: sev.color }]}>
            <AnimatedPressable onPress={() => setOpen(v => !v)} scaleValue={0.99}>
                <View style={sec.cardHeader}>
                    <View style={[sec.sevPill, { backgroundColor: sev.bg }]}>
                        <Text style={[sec.sevPillText, { color: sev.color }]}>{sev.label}</Text>
                    </View>
                    {risk.category ? (
                        <Text style={sec.cardCategory} numberOfLines={1}>{risk.category}</Text>
                    ) : null}
                    <Text style={sec.cardTitle} numberOfLines={open ? undefined : 2}>
                        {cleanText(risk.title || 'Risk identified')}
                    </Text>
                    <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textTertiary}
                    />
                </View>
            </AnimatedPressable>
            {open && (
                <View style={sec.cardBody}>
                    {risk.description ? (
                        <Text style={sec.cardDesc}>{cleanText(risk.description)}</Text>
                    ) : null}

                    {risk.original_clause ? (
                        <View style={sec.clauseBlock}>
                            <Text style={sec.clauseLabel}>Problematic clause</Text>
                            <View style={[sec.clauseBox, sec.clauseBad]}>
                                <Text style={[sec.clauseText, { color: '#7F1D1D' }]}>
                                    {cleanText(risk.original_clause)}
                                </Text>
                            </View>
                        </View>
                    ) : null}

                    {risk.suggested_fix ? (
                        <View style={sec.clauseBlock}>
                            <Text style={sec.clauseLabel}>Suggested replacement</Text>
                            <View style={[sec.clauseBox, sec.clauseGood]}>
                                <Text style={[sec.clauseText, { color: '#14532D' }]}>
                                    {cleanText(risk.suggested_fix)}
                                </Text>
                            </View>
                        </View>
                    ) : null}

                    {risk.law_reference ? (
                        <Text style={sec.lawRef}>📋 {cleanText(risk.law_reference)}</Text>
                    ) : null}
                </View>
            )}
        </View>
    );
};

// Expandable missing-clause card — shows why the clause is needed and the exact
// draft clause text the user can insert (mirrors the web MissingCard).
const MissingCard = ({ item, idx, isLast }) => {
    const [open, setOpen] = useState(idx === 0);
    if (!item) return null;
    return (
        <View style={[sec.card, !isLast && { marginBottom: 10 }, { borderLeftColor: '#818CF8' }]}>
            <AnimatedPressable onPress={() => setOpen(v => !v)} scaleValue={0.99}>
                <View style={sec.cardHeader}>
                    <Ionicons name="alert-circle" size={16} color="#818CF8" />
                    <Text style={[sec.cardTitle, { marginLeft: 4 }]} numberOfLines={open ? undefined : 2}>
                        {cleanText(item.title || 'Missing clause')}
                    </Text>
                    <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textTertiary}
                    />
                </View>
            </AnimatedPressable>
            {open && (
                <View style={sec.cardBody}>
                    {item.why_needed ? (
                        <Text style={sec.cardDesc}>{cleanText(item.why_needed)}</Text>
                    ) : null}

                    {item.suggested_text ? (
                        <View style={sec.clauseBlock}>
                            <Text style={sec.clauseLabel}>Suggested clause to add</Text>
                            <View style={[sec.clauseBox, sec.clauseAdd]}>
                                <Text style={[sec.clauseText, { color: '#3730A3' }]}>
                                    {cleanText(item.suggested_text)}
                                </Text>
                            </View>
                        </View>
                    ) : null}

                    {item.law_reference ? (
                        <Text style={sec.lawRef}>📋 {cleanText(item.law_reference)}</Text>
                    ) : null}
                </View>
            )}
        </View>
    );
};

// Group wrapper — renders a collapsible section header and maps items to cards.
const CardSection = ({ title, items, color, icon, bg, renderItem, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    if (!items?.length) return null;
    return (
        <View style={sec.group}>
            <AnimatedPressable onPress={() => setOpen(v => !v)} scaleValue={0.99}>
                <View style={sec.header}>
                    <LinearGradient colors={bg} style={sec.iconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Ionicons name={icon} size={13} color="#fff" />
                    </LinearGradient>
                    <Text style={sec.title}>{title}</Text>
                    <View style={[sec.badge, { backgroundColor: color + '18' }]}>
                        <Text style={[sec.badgeNum, { color }]}>{items.length}</Text>
                    </View>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />
                </View>
            </AnimatedPressable>
            {open && (
                <View style={sec.cardList}>
                    {items.map((item, i) => renderItem(item, i, i === items.length - 1))}
                </View>
            )}
        </View>
    );
};

// Collapsible section
const AnalysisSection = ({ title, items, color, icon, bg, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    if (!items?.length) return null;
    return (
        <View style={sec.group}>
            <AnimatedPressable onPress={() => setOpen(v => !v)} scaleValue={0.99}>
                <View style={sec.header}>
                    <LinearGradient colors={bg} style={sec.iconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Ionicons name={icon} size={13} color="#fff" />
                    </LinearGradient>
                    <Text style={sec.title}>{title}</Text>
                    <View style={[sec.badge, { backgroundColor: color + '18' }]}>
                        <Text style={[sec.badgeNum, { color }]}>{items.length}</Text>
                    </View>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />
                </View>
            </AnimatedPressable>
            {open && (
                <View style={sec.items}>
                    {items.map((item, i) => (
                        <View key={i} style={[sec.item, i < items.length - 1 && sec.itemBorder]}>
                            <View style={[sec.dot, { backgroundColor: color }]} />
                            <Text style={sec.text}>{cleanText(item)}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

// Counter
const Counter = ({ value, color }) => {
    const anim = useRef(new Animated.Value(0)).current;
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (value === null) return;
        anim.setValue(0);
        Animated.timing(anim, { toValue: value, duration: 1200, useNativeDriver: false }).start();
        const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
        return () => anim.removeListener(id);
    }, [value]);
    return <Text style={[st.scoreNum, { color }]}>{display}</Text>;
};

const DocumentScreen = ({ navigation }) => {
    const { t } = useAppSettings();
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [step, setStep] = useState(0);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);

    // Ambient animations
    const orb1 = useRef(new Animated.Value(0)).current;
    const uploadPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (Platform.OS === 'web') {
            orb1.setValue(0.3);
            uploadPulse.setValue(1);
            return;
        }

        Animated.loop(Animated.sequence([
            Animated.timing(orb1, { toValue: 1, duration: 5000, useNativeDriver: true }),
            Animated.timing(orb1, { toValue: 0, duration: 5000, useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.sequence([
            Animated.timing(uploadPulse, { toValue: 1.06, duration: 2000, useNativeDriver: true }),
            Animated.timing(uploadPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])).start();
    }, []);

    const acceptFile = (fileAsset) => {
        setFile(fileAsset);
        setError(null);
        setAnalysis(null);
    };

    const normalizeImageAsset = (asset, name) => ({
        uri: asset.uri,
        name,
        mimeType: 'image/jpeg',
        size: asset.fileSize || 0,
        width: asset.width,
        height: asset.height,
        file: asset.file, // preserved on web
    });

    const checkImageQuality = (asset) => {
        const w = Number(asset.width) || 0;
        const h = Number(asset.height) || 0;
        const size = Number(asset.fileSize) || 0;
        const minDim = Math.min(w, h);
        const issues = [];
        if (minDim > 0 && minDim < 700) {
            issues.push(`Low resolution (${w}×${h}). Text may be hard to read. Try holding the camera closer.`);
        }
        if (size > 0 && size < 40 * 1024) {
            issues.push('Image file is unusually small — the photo may be blurry or compressed.');
        }
        if (w > 0 && h > 0) {
            const ratio = Math.max(w, h) / Math.max(1, Math.min(w, h));
            if (ratio > 3.2) {
                issues.push('Unusual aspect ratio — make sure the whole document is in frame.');
            }
        }
        return issues;
    };

    const showQualityWarning = (issues, proceed) => {
        const summary = issues.join('\n• ');
        if (Platform.OS === 'web') {
            const ok = window.confirm(`Image quality warning:\n\n• ${summary}\n\nUse this image anyway?`);
            if (ok) proceed();
            return;
        }
        Alert.alert(
            t('document.imageQualityPoorTitle'),
            `• ${summary}\n\n${t('document.imageQualityPoorAdvice')}`,
            [
                { text: t('document.retake'), style: 'cancel' },
                { text: t('document.useAnyway'), onPress: proceed },
            ],
        );
    };

    const pickFile = async () => {
        try {
            const r = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'image/webp'],
                copyToCacheDirectory: true,
            });
            if (!r.canceled) acceptFile(r.assets[0]);
        } catch (err) { console.error(err); }
    };

    const pickFromCamera = async () => {
        try {
            if (Platform.OS === 'web') {
                Alert.alert(t('document.useUploadTitle'), t('document.useUploadMessage'));
                return;
            }
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('document.permissionNeededTitle'), t('document.cameraPermissionRequired'));
                return;
            }
            const res = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.9,
                allowsEditing: false,
                exif: false,
            });
            if (res.canceled || !res.assets?.length) return;
            const asset = res.assets[0];
            const fileAsset = normalizeImageAsset(asset, `scan_${Date.now()}.jpg`);
            const issues = checkImageQuality(asset);
            if (issues.length) {
                showQualityWarning(issues, () => acceptFile(fileAsset));
                return;
            }
            acceptFile(fileAsset);
        } catch (err) {
            console.error(err);
            Alert.alert(t('document.cameraErrorTitle'), t('document.cameraOpenFailed'));
        }
    };

    const pickFromGallery = async () => {
        try {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(t('document.permissionNeededTitle'), t('document.galleryPermissionRequired'));
                    return;
                }
            }
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                allowsEditing: false,
                exif: false,
            });
            if (res.canceled || !res.assets?.length) return;
            const asset = res.assets[0];
            const name = asset.fileName || `image_${Date.now()}.jpg`;
            const fileAsset = normalizeImageAsset(asset, name);
            const issues = checkImageQuality(asset);
            if (issues.length) {
                showQualityWarning(issues, () => acceptFile(fileAsset));
                return;
            }
            acceptFile(fileAsset);
        } catch (err) {
            console.error(err);
        }
    };

    const showSourceChooser = () => {
        if (Platform.OS === 'web') {
            pickFile();
            return;
        }
        Alert.alert(
            t('document.addDocument'),
            t('document.sourceSheet'),
            [
                { text: t('document.chooseFile'), onPress: pickFile },
                { text: t('document.takePhoto'), onPress: pickFromCamera },
                { text: t('document.fromGallery'), onPress: pickFromGallery },
                { text: t('common.cancel'), style: 'cancel' },
            ],
        );
    };

    const analyze = async () => {
        if (!file) return;
        setAnalyzing(true); setError(null); setAnalysis(null); setStep(0);
        const timer = setInterval(() => setStep(p => p < STEP_KEYS.length - 1 ? p + 1 : p), 1800);
        try {
            const result = await apiService.analyzeContract(file);
            clearInterval(timer);
            setAnalysis(result);
            await documentStorage.saveAnalysis({ fileName: file?.name, analysis: result });
            setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 200);
        } catch (err) {
            clearInterval(timer);
            setError(err.message || t('document.analysisFailed'));
            setTimeout(() => setError(null), 6000);
        } finally { setAnalyzing(false); setStep(0); }
    };

    const reset = () => { setFile(null); setAnalysis(null); };
    const askAI = () => navigation?.navigate('Chat', { analysisContext: analysis?.summary || '', documentName: file?.name || 'contract' });

    const score = calcRiskScore(analysis);
    const risk = getRiskLevel(score);
    const orbOp = orb1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.5, 0.2] });
    const orbY = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
            {/* Header */}
            <View style={st.header}>
                <View style={st.headerLeft}>
                    <LawLogo size={34} />
                    <View>
                        <Text style={st.headerTitle}>{t('document.title')}</Text>
                        <Text style={st.headerSub}>{analysis ? file?.name || t('document.analysisLabel') : t('document.subtitle')}</Text>
                    </View>
                </View>
                {analysis && (
                    <AnimatedPressable style={st.headerBtn} onPress={reset} scaleValue={0.9}>
                        <Ionicons name="add" size={20} color={colors.textPrimary} />
                    </AnimatedPressable>
                )}
            </View>

            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={st.content}
                showsVerticalScrollIndicator={false}
            >

            {error && (
                <View style={st.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={colors.error} />
                    <Text style={st.errorText}>{error}</Text>
                </View>
            )}

                {/* ── Upload state ── */}
                {!file && !analysis && (
                    <View style={st.uploadWrap}>
                        {/* Ambient orb */}
                        <Animated.View style={[st.orb, { opacity: orbOp, transform: [{ translateY: orbY }] }]}>
                            <LinearGradient colors={['rgba(99,102,241,0.20)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
                        </Animated.View>

                        {/* Main upload card */}
                        <FadeInView delay={0} distance={16}>
                            <AnimatedPressable onPress={showSourceChooser} scaleValue={0.96}>
                                <View style={st.uploadCard}>
                                    <LinearGradient
                                        colors={['rgba(99,102,241,0.08)', 'rgba(99,102,241,0.02)']}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    />
                                    <Animated.View style={{ transform: [{ scale: uploadPulse }] }}>
                                        <LinearGradient colors={gradients.brand} style={st.uploadIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                            <Ionicons name="cloud-upload" size={28} color="#fff" />
                                        </LinearGradient>
                                    </Animated.View>
                                    <Text style={st.uploadTitle}>{t('document.uploadTitle')}</Text>
                                    <Text style={st.uploadSub}>{t('document.uploadSub')}</Text>
                                    <View style={st.uploadHint}>
                                        <Ionicons name="hand-left-outline" size={13} color={colors.accentPrimary} />
                                        <Text style={st.uploadHintText}>{t('document.uploadHint')}</Text>
                                    </View>
                                </View>
                            </AnimatedPressable>
                        </FadeInView>

                        {/* Quick source actions — File / Camera / Gallery */}
                        {Platform.OS !== 'web' && (
                            <FadeInView delay={120} distance={12}>
                                <View style={st.sourceRow}>
                                    <AnimatedPressable style={st.sourceBtn} onPress={pickFile} scaleValue={0.95}>
                                        <Ionicons name="document-outline" size={16} color={colors.accentPrimary} />
                                        <Text style={st.sourceLabel}>{t('document.chooseFile')}</Text>
                                    </AnimatedPressable>
                                    <AnimatedPressable style={st.sourceBtn} onPress={pickFromCamera} scaleValue={0.95}>
                                        <Ionicons name="camera-outline" size={16} color={colors.accentPrimary} />
                                        <Text style={st.sourceLabel}>{t('document.takePhoto')}</Text>
                                    </AnimatedPressable>
                                    <AnimatedPressable style={st.sourceBtn} onPress={pickFromGallery} scaleValue={0.95}>
                                        <Ionicons name="images-outline" size={16} color={colors.accentPrimary} />
                                        <Text style={st.sourceLabel}>{t('document.fromGallery')}</Text>
                                    </AnimatedPressable>
                                </View>
                            </FadeInView>
                        )}

                        {/* Feature cards — horizontal row */}
                        <FadeInView delay={200} distance={14}>
                            <View style={st.featureRow}>
                                {[
                                    { icon: 'scan-outline', title: t('document.featureClauseAnalysis'), color: '#818CF8', bg: ['#818CF8', '#6366F1'] },
                                    { icon: 'warning-outline', title: t('document.featureRiskDetection'), color: '#F87171', bg: ['#F87171', '#EF4444'] },
                                    { icon: 'checkmark-done-outline', title: t('document.featureSmartAdvice'), color: '#34D399', bg: ['#34D399', '#10B981'] },
                                ].map((f, i) => (
                                    <View key={i} style={st.featureCard}>
                                        <LinearGradient colors={f.bg} style={st.featureIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                            <Ionicons name={f.icon} size={16} color="#fff" />
                                        </LinearGradient>
                                        <Text style={st.featureTitle}>{f.title}</Text>
                                    </View>
                                ))}
                            </View>
                        </FadeInView>

                        {/* Trust bar */}
                        <FadeInView delay={350} distance={10}>
                            <View style={st.trustBar}>
                                <View style={st.trustItem}>
                                    <Ionicons name="lock-closed" size={12} color={colors.textTertiary} />
                                    <Text style={st.trustText}>{t('document.trustEncrypted')}</Text>
                                </View>
                                <View style={st.trustDot} />
                                <View style={st.trustItem}>
                                    <Ionicons name="flash" size={12} color={colors.textTertiary} />
                                    <Text style={st.trustText}>{t('document.trustAIPowered')}</Text>
                                </View>
                                <View style={st.trustDot} />
                                <View style={st.trustItem}>
                                    <Ionicons name="time" size={12} color={colors.textTertiary} />
                                    <Text style={st.trustText}>{t('document.trustUnder30')}</Text>
                                </View>
                            </View>
                        </FadeInView>
                    </View>
                )}

                {/* ── File selected ── */}
                {file && !analysis && !analyzing && (
                    <FadeInView distance={14}>
                        <View style={st.fileCard}>
                            <View style={st.fileIconWrap}>
                                <Ionicons name="document-text" size={22} color={colors.accentPrimary} />
                            </View>
                            <View style={st.fileInfo}>
                                <Text style={st.fileName} numberOfLines={1}>{file.name}</Text>
                                <Text style={st.fileSize}>{file.size ? `${(file.size / 1024).toFixed(1)} KB` : t('document.readyToAnalyze')}</Text>
                            </View>
                            <TouchableOpacity onPress={reset} hitSlop={10}>
                                <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={analyze} activeOpacity={0.85} style={{ marginTop: 14 }}>
                            <LinearGradient colors={gradients.brand} style={st.analyzeBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Ionicons name="sparkles" size={16} color="#fff" />
                                <Text style={st.analyzeBtnText}>{t('document.analyse')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </FadeInView>
                )}

                {/* ── Progress ── */}
                {analyzing && (
                    <FadeInView distance={12}>
                        <View style={st.progressCard}>
                            {STEP_KEYS.map((s, i) => (
                                <View key={i} style={[st.stepRow, i < STEP_KEYS.length - 1 && st.stepBorder]}>
                                    <View style={[st.stepDot, i < step && st.stepDone, i === step && st.stepActive]}>
                                        {i < step ? <Ionicons name="checkmark" size={11} color="#fff" />
                                            : <Ionicons name={s.icon} size={13} color={i === step ? colors.accentPrimary : colors.textTertiary} />}
                                    </View>
                                    <Text style={[st.stepText, i === step && { color: colors.textPrimary, fontWeight: '500' }, i < step && { color: colors.success }]}>{t(s.key)}</Text>
                                    {i === step && <ActivityIndicator size="small" color={colors.accentPrimary} style={{ marginLeft: 'auto' }} />}
                                </View>
                            ))}
                        </View>
                    </FadeInView>
                )}

                {/* ── Results ── */}
                {analysis && (
                    <View style={{ gap: 14 }}>
                        {/* Score card */}
                        {risk && (
                            <FadeInView delay={0} distance={16}>
                                <View style={st.scoreCard}>
                                    <LinearGradient colors={[risk.color + '12', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                                    <View style={st.scoreTop}>
                                        <View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                                                <LinearGradient colors={risk.bg} style={st.scoreBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                                    <Ionicons name={risk.icon} size={14} color="#fff" />
                                                </LinearGradient>
                                                <Text style={[{ fontSize: 16, fontWeight: '700' }, { color: risk.color }]}>{risk.label}</Text>
                                            </View>
                                            <Text style={st.scoreMeta}>{analysis.risks?.length || 0} {t('document.risksIdentified')}</Text>
                                        </View>
                                        <View style={st.scoreRight}>
                                            <Counter value={score} color={risk.color} />
                                            <Text style={[st.scoreSlash, { color: risk.color + '80' }]}>/100</Text>
                                        </View>
                                    </View>
                                    <View style={st.bar}><View style={[st.barFill, { width: `${score}%`, backgroundColor: risk.color }]} /></View>
                                </View>
                            </FadeInView>
                        )}

                        {/* Summary */}
                        {analysis.summary && (
                            <FadeInView delay={100} distance={12}>
                                <View style={st.summaryCard}>
                                    <Text style={st.summaryLabel}>{t('document.summary')}</Text>
                                    <MarkdownText content={cleanText(analysis.summary)} baseColor={colors.textSecondary} />
                                </View>
                            </FadeInView>
                        )}

                        {/* Sections */}
                        <FadeInView delay={200} distance={12}>
                            <CardSection
                                title={t('document.risks')}
                                items={analysis.risks || []}
                                color={colors.error}
                                icon="warning"
                                bg={['#F87171', '#EF4444']}
                                defaultOpen
                                renderItem={(item, i, isLast) => (
                                    <RiskCard key={i} risk={item} idx={i} isLast={isLast} />
                                )}
                            />
                            <CardSection
                                title={t('document.missing')}
                                items={analysis.missing_clauses || analysis.missing || []}
                                color={colors.warning}
                                icon="alert-circle"
                                bg={['#FBBF24', '#F59E0B']}
                                renderItem={(item, i, isLast) => (
                                    <MissingCard key={i} item={item} idx={i} isLast={isLast} />
                                )}
                            />
                            <AnalysisSection
                                title={t('document.applicableLaws')}
                                items={(analysis.applicable_laws || []).map(formatApplicableLaw)}
                                color={colors.accentPrimary}
                                icon="library"
                                bg={['#818CF8', '#6366F1']}
                            />
                            <AnalysisSection
                                title={t('document.recommendations')}
                                items={analysis.recommendations || []}
                                color={colors.success}
                                icon="checkmark-circle"
                                bg={['#34D399', '#10B981']}
                            />
                        </FadeInView>

                        {/* Actions */}
                        <FadeInView delay={350} distance={10}>
                            <TouchableOpacity onPress={askAI} activeOpacity={0.85}>
                                <LinearGradient colors={gradients.brand} style={st.askBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                    <Ionicons name="chatbubbles-outline" size={16} color="#fff" />
                                    <Text style={st.askBtnText}>{t('document.discussAI')}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity style={st.resetBtn} onPress={reset}>
                                <Text style={st.resetText}>{t('document.analyseAnother')}</Text>
                            </TouchableOpacity>
                        </FadeInView>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const sec = StyleSheet.create({
    group: {
        backgroundColor: colors.bgSecondary, borderRadius: 16,
        borderWidth: 1, borderColor: colors.borderColor,
        overflow: 'hidden', marginBottom: 12,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 14,
    },
    iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    title: { flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 4 },
    badgeNum: { fontSize: 12, fontWeight: '700' },
    items: { paddingBottom: 6 },
    item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 10 },
    itemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderColor },
    dot: { width: 5, height: 5, borderRadius: 3, marginTop: 7, flexShrink: 0 },
    text: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 },

    // Expandable card list (risks & missing clauses)
    cardList: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12 },
    card: {
        backgroundColor: colors.bgPrimary || colors.bgSecondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderColor,
        borderLeftWidth: 4,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    sevPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    sevPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
    cardCategory: { fontSize: 11, color: colors.textTertiary, fontStyle: 'italic' },
    cardTitle: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
    cardBody: {
        paddingHorizontal: 12,
        paddingBottom: 14,
        paddingTop: 2,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.borderColor,
    },
    cardDesc: {
        color: colors.textPrimary,
        fontSize: 13,
        lineHeight: 20,
        marginTop: 10,
        marginBottom: 10,
    },
    clauseBlock: { marginBottom: 10 },
    clauseLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    clauseBox: {
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    clauseBad: { backgroundColor: '#FFF5F5', borderColor: '#FCA5A5' },
    clauseGood: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
    clauseAdd: { backgroundColor: '#F5F3FF', borderColor: '#C7D2FE' },
    clauseText: {
        fontSize: 12,
        lineHeight: 19,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
    lawRef: {
        fontSize: 11,
        color: colors.textTertiary,
        fontStyle: 'italic',
        marginTop: 2,
    },
});

const st = StyleSheet.create({
    content: { padding: 20, paddingBottom: 120, maxWidth: 520, alignSelf: 'center', width: '100%' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: colors.bgSecondary,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderColor,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
    headerSub: { color: colors.textTertiary, fontSize: 10, marginTop: 1 },
    headerBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.borderMid,
        alignItems: 'center', justifyContent: 'center',
    },

    // Error
    errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.errorMuted, borderWidth: 1, borderColor: colors.errorBorder, borderRadius: 14, padding: 12, marginBottom: 14 },
    errorText: { color: colors.error, fontSize: 13, flex: 1 },

    // Upload
    uploadWrap: { flex: 1, overflow: 'hidden' },
    orb: { position: 'absolute', width: 260, height: 260, top: -30, right: -60, borderRadius: 130, overflow: 'hidden' },

    uploadCard: {
        backgroundColor: colors.bgSecondary, borderRadius: 20,
        borderWidth: 1, borderColor: colors.borderMid,
        paddingVertical: 40, paddingHorizontal: 24,
        alignItems: 'center', gap: 10, overflow: 'hidden',
    },
    uploadIcon: {
        width: 64, height: 64, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center', ...shadows.accent,
    },
    uploadTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '700', marginTop: 8 },
    uploadSub: { color: colors.textTertiary, fontSize: 13 },
    uploadHint: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        marginTop: 8, paddingHorizontal: 14, paddingVertical: 7,
        backgroundColor: colors.accentMuted, borderRadius: 10,
    },
    uploadHintText: { color: colors.accentPrimary, fontSize: 12, fontWeight: '600' },

    // Source chooser row (native)
    sourceRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    sourceBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 12,
        backgroundColor: colors.bgSecondary, borderRadius: 14,
        borderWidth: 1, borderColor: colors.borderColor,
    },
    sourceLabel: { color: colors.accentPrimary, fontSize: 13, fontWeight: '600' },

    // Feature cards
    featureRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    featureCard: {
        flex: 1, backgroundColor: colors.bgSecondary, borderRadius: 16,
        borderWidth: 1, borderColor: colors.borderColor,
        paddingVertical: 16, alignItems: 'center', gap: 8,
    },
    featureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    featureTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 },

    // Trust
    trustBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, paddingVertical: 10 },
    trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    trustText: { color: colors.textTertiary, fontSize: 11, fontWeight: '500' },
    trustDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textTertiary, opacity: 0.3 },

    // File
    fileCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: colors.bgSecondary, borderRadius: 16,
        borderWidth: 1, borderColor: colors.borderColor,
        padding: 16,
    },
    fileIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.accentMuted, alignItems: 'center', justifyContent: 'center' },
    fileInfo: { flex: 1 },
    fileName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    fileSize: { color: colors.textTertiary, fontSize: 12, marginTop: 2 },
    analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16, ...shadows.accent },
    analyzeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Progress
    progressCard: {
        backgroundColor: colors.bgSecondary, borderRadius: 16,
        borderWidth: 1, borderColor: colors.borderColor, overflow: 'hidden',
    },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    stepBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderColor },
    stepDot: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.bgTertiary, alignItems: 'center', justifyContent: 'center' },
    stepDone: { backgroundColor: colors.success },
    stepActive: { backgroundColor: colors.accentMuted, borderWidth: 1, borderColor: colors.accentBorder },
    stepText: { color: colors.textTertiary, fontSize: 14, flex: 1 },

    // Score
    scoreCard: { backgroundColor: colors.bgSecondary, borderRadius: 20, borderWidth: 1, borderColor: colors.borderColor, padding: 20, gap: 14, overflow: 'hidden' },
    scoreTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    scoreBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    scoreMeta: { color: colors.textTertiary, fontSize: 12, marginTop: 4, marginLeft: 35 },
    scoreRight: { alignItems: 'flex-end' },
    scoreNum: { fontSize: 42, fontWeight: '800', letterSpacing: -2 },
    scoreSlash: { fontSize: 12, fontWeight: '600', marginTop: -4 },
    bar: { height: 6, backgroundColor: colors.bgTertiary, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },

    // Summary
    summaryCard: { backgroundColor: colors.bgSecondary, borderRadius: 16, borderWidth: 1, borderColor: colors.borderColor, padding: 18, gap: 8 },
    summaryLabel: { color: colors.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

    // Actions
    askBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16, ...shadows.accent },
    askBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    resetBtn: { alignItems: 'center', paddingVertical: 16 },
    resetText: { color: colors.textTertiary, fontSize: 13, fontWeight: '500' },
});

export default DocumentScreen;
