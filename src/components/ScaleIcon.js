// Scales of Justice icon — pure React Native (no emoji inconsistency)
// Renders consistently across iOS + Android + Web
import React from 'react';
import { View, StyleSheet } from 'react-native';

const ScaleIcon = ({ size = 24, color = '#fff' }) => {
    const s = size;
    const beam = s * 0.55;
    const pillar = s * 0.35;
    const pan = s * 0.18;
    const thick = Math.max(1.5, s * 0.06);

    return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
            {/* Center pillar */}
            <View style={{
                position: 'absolute',
                width: thick,
                height: pillar,
                backgroundColor: color,
                borderRadius: thick,
                top: s * 0.12,
            }} />
            {/* Horizontal beam */}
            <View style={{
                position: 'absolute',
                width: beam,
                height: thick,
                backgroundColor: color,
                borderRadius: thick,
                top: s * 0.12,
            }} />
            {/* Left chain */}
            <View style={{
                position: 'absolute',
                width: thick * 0.8,
                height: s * 0.22,
                backgroundColor: color,
                opacity: 0.7,
                left: s * 0.5 - beam / 2,
                top: s * 0.12 + thick,
            }} />
            {/* Right chain */}
            <View style={{
                position: 'absolute',
                width: thick * 0.8,
                height: s * 0.22,
                backgroundColor: color,
                opacity: 0.7,
                right: s * 0.5 - beam / 2,
                top: s * 0.12 + thick,
            }} />
            {/* Left pan */}
            <View style={{
                position: 'absolute',
                width: pan,
                height: thick * 1.2,
                backgroundColor: color,
                borderRadius: thick,
                left: s * 0.5 - beam / 2 - pan / 2 + thick * 0.4,
                top: s * 0.12 + thick + s * 0.22,
            }} />
            {/* Right pan */}
            <View style={{
                position: 'absolute',
                width: pan,
                height: thick * 1.2,
                backgroundColor: color,
                borderRadius: thick,
                right: s * 0.5 - beam / 2 - pan / 2 + thick * 0.4,
                top: s * 0.12 + thick + s * 0.22,
            }} />
            {/* Base */}
            <View style={{
                position: 'absolute',
                width: s * 0.3,
                height: thick,
                backgroundColor: color,
                borderRadius: thick,
                bottom: s * 0.15,
            }} />
            {/* Base foot */}
            <View style={{
                position: 'absolute',
                width: s * 0.42,
                height: thick * 1.2,
                backgroundColor: color,
                borderRadius: thick,
                bottom: s * 0.1,
            }} />
        </View>
    );
};

export default ScaleIcon;
