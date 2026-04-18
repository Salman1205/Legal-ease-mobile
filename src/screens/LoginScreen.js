// LoginScreen v5 — Cinematic SaaS login
// Full-screen gradient, oversized typography, minimal and premium
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Platform, ActivityIndicator,
    Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, shadows, gradients } from '../constants/theme';
import { authService } from '../services/auth';
import FadeInView from '../components/FadeInView';
import LawLogo from '../components/LawLogo';
import Screen from '../components/Screen';
import { useAppSettings } from '../contexts/AppSettingsContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const LoginScreen = ({ onLoginSuccess }) => {
    const { t } = useAppSettings();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(null);

    // Entrance
    const heroOpacity = useRef(new Animated.Value(0)).current;
    const heroSlide = useRef(new Animated.Value(30)).current;
    const orb1 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(heroOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.spring(heroSlide, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        ]).start();

        if (Platform.OS === 'web') {
            orb1.setValue(0.4);
            return;
        }

        Animated.loop(
            Animated.sequence([
                Animated.timing(orb1, { toValue: 1, duration: 8000, useNativeDriver: true }),
                Animated.timing(orb1, { toValue: 0, duration: 8000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const handleSubmit = async () => {
        setError(null); setSuccess(null); setIsLoading(true);
        try {
            if (isLogin) {
                const r = await authService.login(email, password);
                if (r.success && r.session_token) onLoginSuccess(r.user, r.session_token);
            } else {
                const r = await authService.register(email, password, name);
                if (r.success) {
                    const lr = await authService.login(email, password);
                    if (lr.success && lr.session_token) {
                        onLoginSuccess(lr.user, lr.session_token);
                    } else {
                        setSuccess('Account created successfully');
                        setIsLogin(true); setName(''); setPassword('');
                    }
                }
            }
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally { setIsLoading(false); }
    };

    const switchMode = () => { setIsLogin(v => !v); setError(null); setSuccess(null); };
    const inputActive = (field) => focused === field;

    const orbY = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
    const orbX = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });

    const backdrop = (
        <>
            <LinearGradient colors={['#080C18', '#0A0E17', '#0D1120']} style={StyleSheet.absoluteFill} />
            <Animated.View pointerEvents="none" style={[s.orb1, { transform: [{ translateY: orbY }, { translateX: orbX }] }]}>
                <LinearGradient colors={['rgba(99,102,241,0.15)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.3, y: 0.3 }} end={{ x: 0.7, y: 0.7 }} />
            </Animated.View>
            <Animated.View pointerEvents="none" style={[s.orb2, { transform: [{ translateY: Animated.multiply(orbY, -1) }] }]}>
                <LinearGradient colors={['rgba(212,168,83,0.08)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
            </Animated.View>
        </>
    );

    return (
        <Screen
            scroll
            keyboardAware
            keyboardOffset={0}
            edges={['top', 'bottom']}
            backgroundColor={colors.bgDeep}
            contentContainerStyle={s.scroll}
            background={backdrop}
        >
                    {/* ══ Hero — cinematic typography ══ */}
                    <Animated.View style={[s.hero, { opacity: heroOpacity, transform: [{ translateY: heroSlide }] }]}>
                        <View style={s.logoMark}>
                            <LawLogo size={52} animated />
                        </View>
                        <Text style={s.brand}>LegalEase</Text>
                        <Text style={s.tagline}>Your AI legal counsel</Text>

                        {/* Feature highlights */}
                        <View style={s.features}>
                            {[
                                { icon: 'chatbubble-outline', text: 'AI Consultation' },
                                { icon: 'document-text-outline', text: 'Contract Analysis' },
                                { icon: 'shield-checkmark-outline', text: 'Legal Research' },
                            ].map((f, i) => (
                                <View key={i} style={s.featureItem}>
                                    <Ionicons name={f.icon} size={13} color={colors.accentPrimary} />
                                    <Text style={s.featureText}>{f.text}</Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>

                    {/* ══ Auth form ══ */}
                    <FadeInView delay={200} distance={20}>
                        <View style={s.form}>
                            {/* Tab row */}
                            <View style={s.tabRow}>
                                <TouchableOpacity style={[s.tab, isLogin && s.tabActive]} onPress={() => { setIsLogin(true); setError(null); }}>
                                    <Text style={[s.tabText, isLogin && s.tabTextActive]}>{t('auth.signIn')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.tab, !isLogin && s.tabActive]} onPress={() => { setIsLogin(false); setError(null); }}>
                                    <Text style={[s.tabText, !isLogin && s.tabTextActive]}>{t('auth.signUp')}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Alerts */}
                            {error && (
                                <View style={s.alert}>
                                    <View style={s.alertDot} />
                                    <Text style={s.alertText}>{error}</Text>
                                </View>
                            )}
                            {success && (
                                <View style={[s.alert, s.alertSuccess]}>
                                    <View style={[s.alertDot, { backgroundColor: colors.success }]} />
                                    <Text style={[s.alertText, { color: colors.success }]}>{success}</Text>
                                </View>
                            )}

                            {/* Name field */}
                            {!isLogin && (
                                <FadeInView delay={50} distance={10}>
                                    <Text style={s.fieldLabel}>{t('auth.name')}</Text>
                                    <View style={[s.inputWrap, inputActive('name') && s.inputFocused]}>
                                        <TextInput
                                            style={s.input}
                                            value={name} onChangeText={setName}
                                            placeholder={t('auth.name')}
                                            placeholderTextColor={colors.textTertiary}
                                            autoComplete="name" editable={!isLoading}
                                            onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                                        />
                                    </View>
                                </FadeInView>
                            )}

                            {/* Email */}
                            <View>
                                <Text style={s.fieldLabel}>{t('auth.email')}</Text>
                                <View style={[s.inputWrap, inputActive('email') && s.inputFocused]}>
                                    <TextInput
                                        style={s.input}
                                        value={email} onChangeText={setEmail}
                                        placeholder="you@example.com"
                                        placeholderTextColor={colors.textTertiary}
                                        keyboardType="email-address" autoCapitalize="none"
                                        autoComplete="email" editable={!isLoading}
                                        onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                                    />
                                </View>
                            </View>

                            {/* Password */}
                            <View>
                                <Text style={s.fieldLabel}>{t('auth.password')}</Text>
                                <View style={[s.inputWrap, inputActive('password') && s.inputFocused]}>
                                    <TextInput
                                        style={[s.input, { flex: 1 }]}
                                        value={password} onChangeText={setPassword}
                                        placeholder="Min. 6 characters"
                                        placeholderTextColor={colors.textTertiary}
                                        secureTextEntry={!showPassword}
                                        editable={!isLoading}
                                        onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={12}>
                                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textTertiary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* CTA */}
                            <TouchableOpacity
                                onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}
                                style={{ marginTop: spacing.xs }}
                            >
                                <LinearGradient
                                    colors={isLoading ? [colors.bgTertiary, colors.bgTertiary] : gradients.brand}
                                    style={s.cta}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={colors.textTertiary} size="small" />
                                    ) : (
                                        <Text style={s.ctaText}>{isLogin ? t('auth.signIn') : t('auth.signUp')}</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Switch mode */}
                            <TouchableOpacity onPress={switchMode} style={s.switchRow} hitSlop={10}>
                                <Text style={s.switchText}>
                                    {isLogin ? t('auth.orSignUp') : t('auth.orSignIn')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </FadeInView>

                    {/* Footer */}
                    <FadeInView delay={400} distance={8}>
                        <View style={s.footer}>
                            <View style={s.trustRow}>
                                <Ionicons name="lock-closed" size={11} color={colors.textTertiary} />
                                <Text style={s.trustText}>End-to-end encrypted</Text>
                                <View style={s.dot} />
                                <Text style={s.trustText}>AI-powered analysis</Text>
                            </View>
                            <Text style={s.disclaimer}>
                                LegalEase provides AI-generated legal information only.{'\n'}
                                Not a substitute for professional legal counsel.
                            </Text>
                        </View>
                    </FadeInView>
        </Screen>
    );
};

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgDeep },

    orb1: { position: 'absolute', top: -200, left: -200, width: 500, height: 500, borderRadius: 250, overflow: 'hidden' },
    orb2: { position: 'absolute', top: -50, right: -200, width: 400, height: 400, borderRadius: 200, overflow: 'hidden' },

    scroll: {
        flexGrow: 1, justifyContent: 'center',
        paddingHorizontal: 28, paddingVertical: 40,
        maxWidth: 420, alignSelf: 'center', width: '100%',
    },

    // Hero
    hero: { marginBottom: 36 },
    logoMark: { marginBottom: 20 },
    logoGrad: {
        width: 48, height: 48, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        ...shadows.accent,
    },
    brand: {
        fontSize: 32, fontWeight: '800', color: colors.textPrimary,
        letterSpacing: -1.2, marginBottom: 6,
    },
    tagline: { color: colors.textTertiary, fontSize: 16, fontWeight: '400' },
    features: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18,
    },
    featureItem: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: colors.accentMuted,
        borderWidth: 1, borderColor: colors.accentBorder,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    },
    featureText: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },

    // Form
    form: { gap: 18 },

    // Tabs
    tabRow: { flexDirection: 'row', gap: 0, marginBottom: 4 },
    tab: { paddingBottom: 10, paddingRight: 20 },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accentPrimary },
    tabText: { color: colors.textTertiary, fontSize: 15, fontWeight: '500' },
    tabTextActive: { color: colors.textPrimary, fontWeight: '600' },

    // Alert
    alert: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
        backgroundColor: colors.errorMuted, borderWidth: 1, borderColor: colors.errorBorder,
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    },
    alertSuccess: { backgroundColor: colors.successMuted, borderColor: colors.successBorder },
    alertDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error, flexShrink: 0 },
    alertText: { color: colors.error, fontSize: 13, flex: 1, lineHeight: 18 },

    // Fields
    fieldLabel: {
        color: colors.textSecondary, fontSize: 13, fontWeight: '500',
        marginBottom: 7, marginLeft: 2,
    },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.bgSecondary,
        borderRadius: 12, borderWidth: 1, borderColor: colors.borderMid,
        paddingHorizontal: 16, height: 50,
    },
    inputFocused: {
        borderColor: colors.accentPrimary,
        backgroundColor: colors.bgTertiary,
    },
    input: {
        flex: 1, color: colors.textPrimary, fontSize: 15,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    },

    // CTA
    cta: {
        height: 50, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        ...shadows.accent,
    },
    ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Switch
    switchRow: { flexDirection: 'row', justifyContent: 'center', paddingTop: 4 },
    switchText: { color: colors.textTertiary, fontSize: 13 },
    switchAction: { color: colors.accentPrimary, fontSize: 13, fontWeight: '600' },

    // Footer
    footer: { marginTop: 40, alignItems: 'center', gap: 12 },
    trustRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    trustText: { color: colors.textTertiary, fontSize: 11, fontWeight: '500' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textTertiary, opacity: 0.4 },
    disclaimer: { color: colors.textTertiary, fontSize: 11, textAlign: 'center', lineHeight: 17, opacity: 0.5 },
});

export default LoginScreen;
