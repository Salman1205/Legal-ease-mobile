import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import KeyboardAwareScreen from '../components/KeyboardAwareScreen';
import { authService } from '../services/auth';
import { useAppSettings } from '../contexts/AppSettingsContext';

const ChangePasswordScreen = () => {
    const navigation = useNavigation();
    const { t } = useAppSettings();

    // Form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const handleSave = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) return;
        if (newPassword !== confirmPassword) {
            if (Platform.OS === 'web') window.alert('Passwords do not match');
            else Alert.alert('Mismatch', 'Passwords do not match.');
            return;
        }

        setIsSaving(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            setIsSaving(false);
            if (Platform.OS === 'web') {
                window.alert('Password successfully updated!');
            } else {
                Alert.alert('Success', 'Password successfully updated!');
            }
            navigation.goBack();
        } catch (err) {
            setIsSaving(false);
            if (Platform.OS === 'web') {
                window.alert(err.message || 'Failed to update password');
            } else {
                Alert.alert('Update failed', err.message || 'Failed to update password');
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
                    <Text style={st.headerTitle}>{t('settings.changePassword')}</Text>
                </View>

                <AnimatedPressable style={st.saveBtn} onPress={handleSave} disabled={isSaving}>
                    <Text style={st.saveBtnText}>{isSaving ? t('common.updating') : t('common.update')}</Text>
                </AnimatedPressable>
            </View>

            <KeyboardAwareScreen contentContainerStyle={st.content} offset={Platform.OS === 'ios' ? 80 : 0}>

                <FadeInView delay={100} distance={10}>
                    <Text style={st.infoText}>
                        Your password must be at least 8 characters long and include a mix of letters, numbers, and symbols.
                    </Text>
                </FadeInView>

                <FadeInView delay={200} distance={15}>
                    <View style={st.formGroup}>
                        <Text style={st.label}>{t('auth.currentPassword')}</Text>
                        <View style={st.inputWrap}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={st.inputIcon} />
                            <TextInput
                                style={st.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Enter current password"
                                placeholderTextColor={colors.textTertiary}
                                secureTextEntry={!showCurrent}
                            />
                            <AnimatedPressable onPress={() => setShowCurrent(!showCurrent)}>
                                <Ionicons name={showCurrent ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textTertiary} />
                            </AnimatedPressable>
                        </View>
                    </View>

                    <View style={st.formGroup}>
                        <Text style={st.label}>{t('auth.newPassword')}</Text>
                        <View style={st.inputWrap}>
                            <Ionicons name="key-outline" size={20} color={colors.textTertiary} style={st.inputIcon} />
                            <TextInput
                                style={st.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                                placeholderTextColor={colors.textTertiary}
                                secureTextEntry={!showNew}
                            />
                            <AnimatedPressable onPress={() => setShowNew(!showNew)}>
                                <Ionicons name={showNew ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textTertiary} />
                            </AnimatedPressable>
                        </View>
                    </View>

                    <View style={st.formGroup}>
                        <Text style={st.label}>{t('auth.confirmPassword')}</Text>
                        <View style={st.inputWrap}>
                            <Ionicons name="checkmark-circle-outline" size={20} color={colors.textTertiary} style={st.inputIcon} />
                            <TextInput
                                style={st.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                placeholderTextColor={colors.textTertiary}
                                secureTextEntry={!showNew}
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
    infoText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, paddingHorizontal: 4, marginBottom: 24, marginTop: 8 },
    content: { padding: 24 },
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

export default ChangePasswordScreen;
