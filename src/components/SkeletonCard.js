// SkeletonCard — premium shimmer-effect placeholder for list/grid items.
// Used while data is loading to avoid the jarring empty state + spinner combo.
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, borderRadius } from '../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const Shimmer = ({ style, delay = 0 }) => {
    const x = useRef(new Animated.Value(-SCREEN_W)).current;
    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.loop(
                Animated.timing(x, {
                    toValue: SCREEN_W,
                    duration: 1400,
                    useNativeDriver: true,
                })
            ).start();
        }, delay);
        return () => clearTimeout(timer);
    }, []);
    return (
        <View style={[styles.shell, style]}>
            <Animated.View style={[styles.sweep, { transform: [{ translateX: x }] }]} />
        </View>
    );
};

export const SkeletonLawyerCard = () => (
    <View style={styles.card}>
        <View style={styles.row}>
            <Shimmer style={styles.avatar} />
            <View style={styles.colFlex}>
                <Shimmer style={[styles.line, { width: '62%', height: 14 }]} delay={60} />
                <Shimmer style={[styles.line, { width: '42%', height: 11, marginTop: 8 }]} delay={120} />
            </View>
        </View>
        <View style={styles.chipsRow}>
            <Shimmer style={styles.chip} delay={180} />
            <Shimmer style={styles.chip} delay={240} />
            <Shimmer style={[styles.chip, { width: 50 }]} delay={300} />
        </View>
        <Shimmer style={[styles.line, { width: '100%', height: 38, marginTop: 12, borderRadius: 12 }]} delay={360} />
    </View>
);

export const SkeletonCourseCard = () => (
    <View style={styles.course}>
        <Shimmer style={styles.courseThumb} />
        <View style={{ padding: 12 }}>
            <Shimmer style={[styles.line, { width: '90%', height: 13 }]} />
            <Shimmer style={[styles.line, { width: '60%', height: 11, marginTop: 8 }]} delay={80} />
        </View>
    </View>
);

export const SkeletonListItem = () => (
    <View style={styles.listRow}>
        <Shimmer style={styles.iconSquare} />
        <View style={{ flex: 1 }}>
            <Shimmer style={[styles.line, { width: '80%', height: 12 }]} delay={40} />
            <Shimmer style={[styles.line, { width: '50%', height: 10, marginTop: 6 }]} delay={90} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    shell: {
        overflow: 'hidden',
        backgroundColor: colors.bgTertiary,
        borderRadius: 8,
    },
    sweep: {
        ...StyleSheet.absoluteFillObject,
        width: 140,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    card: {
        backgroundColor: colors.bgSecondary,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.borderColor,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    colFlex: { flex: 1 },
    avatar: { width: 52, height: 52, borderRadius: 26 },
    line: { borderRadius: 6 },
    chipsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    chip: { width: 70, height: 22, borderRadius: 11 },
    course: {
        width: 160,
        backgroundColor: colors.bgSecondary,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.borderColor,
        overflow: 'hidden',
        marginRight: spacing.lg,
    },
    courseThumb: { height: 100, borderRadius: 0 },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: colors.bgSecondary,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.borderColor,
        marginBottom: spacing.md,
    },
    iconSquare: { width: 40, height: 40, borderRadius: 12 },
});

export default SkeletonLawyerCard;
