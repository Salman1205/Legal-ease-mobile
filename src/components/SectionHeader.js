// SectionHeader — consistent section title with icon
// Used across Document, Profile, and News screens
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';

const SectionHeader = ({
    icon,
    iconColor = colors.accentPrimary,
    title,
    actionText,
    onAction,
    style,
}) => (
    <View style={[styles.container, style]}>
        <View style={styles.left}>
            {icon && (
                <View style={[styles.iconWrap, { backgroundColor: iconColor + '15' }]}>
                    <Ionicons name={icon} size={15} color={iconColor} />
                </View>
            )}
            <Text style={styles.title}>{title}</Text>
        </View>
        {actionText && onAction && (
            <TouchableOpacity onPress={onAction} hitSlop={10} activeOpacity={0.7}>
                <Text style={styles.action}>{actionText}</Text>
            </TouchableOpacity>
        )}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm + 2,
    },
    iconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        ...typography.h4,
        color: colors.textPrimary,
    },
    action: {
        color: colors.accentPrimary,
        fontSize: 13,
        fontWeight: '600',
    },
});

export default SectionHeader;
