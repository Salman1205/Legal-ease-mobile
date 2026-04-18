import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import LawLogo from '../components/LawLogo';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import KeyboardAwareScreen from '../components/KeyboardAwareScreen';
import { authService } from '../services/auth';
import { useAppSettings } from '../contexts/AppSettingsContext';

const EditProfileScreen = ({ route }) => {
    const navigation = useNavigation();
    const { t } = useAppSettings();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            const routeUser = route?.params?.user;
            if (routeUser) {
                setName(routeUser.name || '');
                setEmail(routeUser.email || '');
                setPhone(routeUser.phone || '');
                return;
            }

            const session = await authService.getSession();
            if (session?.user) {
                setName(session.user.name || '');
                setEmail(session.user.email || '');
                setPhone(session.user.phone || '');
            }
        };
        init();
    }, [route?.params?.user]);

    const handleSave = async () => {
        if (!name.trim() || !email.trim()) {
            if (Platform.OS === 'web') {
                window.alert('Name and email are required.');
            } else {
                Alert.alert('Missing fields', 'Name and email are required.');
            }
            return;
        }

        setIsSaving(true);
        try {
            await authService.updateProfile({ name, email, phone });
            setIsSaving(false);
            if (Platform.OS === 'web') {
                window.alert('Profile updated successfully!');
            } else {
                Alert.alert('Success', 'Profile updated successfully!');
            }
            navigation.goBack();
        } catch (err) {
            setIsSaving(false);
            if (Platform.OS === 'web') {
                window.alert(err.message || 'Failed to update profile.');
            } else {
                Alert.alert('Update failed', err.message || 'Failed to update profile.');
            }
        }
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
                    <Text style={st.headerTitle}>{t('settings.editProfile')}</Text>
                </View>

                <AnimatedPressable style={st.saveBtn} onPress={handleSave} disabled={isSaving}>
                    <Text style={st.saveBtnText}>{isSaving ? t('common.saving') : t('common.save')}</Text>
                </AnimatedPressable>
            </View>

            <KeyboardAwareScreen contentContainerStyle={st.content} offset={Platform.OS === 'ios' ? 80 : 0}>
                <FadeInView delay={100} distance={15}>
                    <View style={st.avatarContainer}>
                        <View style={st.avatarBlock}>
                            <LinearGradient colors={['#0EA5A4', '#22D3EE']} style={st.avatarWrap}>
                                <Text style={st.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
                            </LinearGradient>
                            <AnimatedPressable style={st.editAvatarBtn} scaleValue={0.9}>
                                <Ionicons name="camera" size={16} color={colors.textPrimary} />
                            </AnimatedPressable>
                        </View>
                    </View>
                </FadeInView>

                <FadeInView delay={200} distance={15}>
                    <View style={st.formGroup}>
                        <Text style={st.label}>Full Name</Text>
                        <View style={st.inputWrap}>
                            <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={st.inputIcon} />
                            <TextInput
                                style={st.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter full name"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>
                    </View>

                    <View style={st.formGroup}>
                        <Text style={st.label}>Email Address</Text>
                        <View style={st.inputWrap}>
                            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={st.inputIcon} />
                            <TextInput
                                style={st.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>
                    </View>

                    <View style={st.formGroup}>
                        <Text style={st.label}>Phone Number</Text>
                        <View style={st.inputWrap}>
                            <Ionicons name="call-outline" size={20} color={colors.textTertiary} style={st.inputIcon} />
                            <TextInput
                                style={st.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+92 3XX XXXXXXX"
                                keyboardType="phone-pad"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>
                    </View>
                </FadeInView>
            </KeyboardAwareScreen>
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
    headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.accentMuted },
    saveBtnText: { color: colors.accentPrimary, fontWeight: '600', fontSize: 14 },
    content: { padding: 24 },
    avatarContainer: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
    avatarBlock: { width: 100, height: 100, position: 'relative' },
    avatarWrap: {
        width: 100, height: 100,
        borderRadius: 50,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 4, borderColor: colors.bgSecondary
    },
    avatarLetter: { fontSize: 40, fontWeight: '700', color: '#FFF' },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0, right: -4,
        width: 32, height: 32,
        borderRadius: 16,
        backgroundColor: colors.bgSecondary,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: colors.bgPrimary,
    },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, paddingLeft: 4 },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
        borderWidth: 1, borderColor: colors.borderMid,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: colors.textPrimary, fontSize: 16, height: '100%' },
});

export default EditProfileScreen;
