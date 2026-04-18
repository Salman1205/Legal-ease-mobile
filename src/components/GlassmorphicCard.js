// GlassmorphicCard v2 — Simple elevated card, no glass gimmick
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../constants/theme';

const GlassmorphicCard = ({ children, style, noPadding }) => (
    <View style={[st.card, noPadding ? st.noPad : st.padded, style]}>
        {children}
    </View>
);

const st = StyleSheet.create({
    card: {
        backgroundColor: colors.bgSecondary,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.borderColor,
    },
    padded: { padding: 18 },
    noPad: { padding: 0 },
});

export default GlassmorphicCard;
