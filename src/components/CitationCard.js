// Citation Card v2 — compact, colored badges, refined layout
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../constants/theme';

const CitationCard = ({ source, index }) => {
    const handlePress = () => {
        if (source.url) Linking.openURL(source.url);
    };

    return (
        <View style={s.container}>
            <View style={s.badge}>
                <Text style={s.badgeText}>{index}</Text>
            </View>
            <View style={s.content}>
                <View style={s.header}>
                    <Text style={s.lawName} numberOfLines={2}>{source.law_name || source.law}</Text>
                    {source.year ? <Text style={s.year}>{source.year}</Text> : null}
                </View>
                {source.section ? (
                    <Text style={s.section} numberOfLines={1}>{source.section}</Text>
                ) : null}
                <View style={s.footer}>
                    <View style={s.categoryBadge}>
                        <Ionicons name="scale-outline" size={10} color={colors.textTertiary} />
                        <Text style={s.category}>{source.category || 'Legal Reference'}</Text>
                    </View>
                    <TouchableOpacity style={s.linkBtn} onPress={handlePress} activeOpacity={0.7}>
                        <Text style={s.linkText}>View</Text>
                        <Ionicons name="arrow-forward" size={11} color={colors.accentPrimary} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    container: {
        flexDirection: 'row', gap: spacing.sm,
        paddingVertical: spacing.sm + 2,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderColor,
    },
    badge: {
        width: 26, height: 26, borderRadius: 8,
        backgroundColor: colors.accentMuted,
        alignItems: 'center', justifyContent: 'center',
        marginTop: 2,
    },
    badgeText: { color: colors.accentPrimary, fontSize: 11, fontWeight: '800' },
    content: { flex: 1, gap: 3 },
    header: {
        flexDirection: 'row', alignItems: 'flex-start',
        gap: spacing.xs, flexWrap: 'wrap',
    },
    lawName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1 },
    year: {
        color: colors.textTertiary, fontSize: 11, fontWeight: '500',
        backgroundColor: colors.bgTertiary, paddingHorizontal: 5,
        paddingVertical: 1, borderRadius: 4,
    },
    section: { color: colors.textSecondary, fontSize: 12 },
    footer: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginTop: 3,
    },
    categoryBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
    },
    category: { color: colors.textTertiary, fontSize: 11, fontWeight: '500' },
    linkBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: colors.accentMuted,
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 6,
    },
    linkText: { color: colors.accentPrimary, fontSize: 11, fontWeight: '600' },
});

export default CitationCard;
