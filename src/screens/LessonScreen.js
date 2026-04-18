import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, gradients } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import SectionHeader from '../components/SectionHeader';
import { apiService } from '../services/api';
import { SEED_COURSES, SEED_LIBRARY } from '../constants/educationSeed';
import { useAppSettings } from '../contexts/AppSettingsContext';

const LessonScreen = ({ route, navigation }) => {
    const { t } = useAppSettings();
    const {
        courseId,
        courseTitle,
        courseCategory,
        lessonTitle,
        lessonIndex,
        totalLessons,
        lessonSummary,
        lessonContent,
        lessonKeyPoints,
    } = route?.params || {};
    const [relatedItems, setRelatedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [resolvedLesson, setResolvedLesson] = useState({
        title: lessonTitle || t('education.lesson'),
        summary: lessonSummary || '',
        content: lessonContent || '',
        keyPoints: Array.isArray(lessonKeyPoints) ? lessonKeyPoints : [],
    });

    useEffect(() => {
        if (resolvedLesson.content || resolvedLesson.summary || resolvedLesson.keyPoints.length) return;

        const seedCourse = SEED_COURSES.find((course) => (
            course.id === courseId
            || (courseTitle && String(course.title || '').trim().toLowerCase() === String(courseTitle).trim().toLowerCase())
            || (courseCategory && String(course.category || '').trim().toLowerCase() === String(courseCategory).trim().toLowerCase())
        ));
        const seedLesson = Array.isArray(seedCourse?.lessons)
            ? seedCourse.lessons.find((item, idx) => (item?.index ?? idx) + 1 === lessonIndex)
            : null;

        if (seedLesson) {
            setResolvedLesson({
                title: seedLesson.title || lessonTitle || t('education.lesson'),
                summary: seedLesson.summary || '',
                content: seedLesson.content || '',
                keyPoints: Array.isArray(seedLesson.key_points) ? seedLesson.key_points : [],
            });
        }
    }, [courseId, lessonIndex, lessonTitle, resolvedLesson]);

    useEffect(() => {
        let mounted = true;

        const loadRelated = async () => {
            try {
                const query = `${courseTitle || ''} ${lessonTitle || ''}`.trim();
                const results = await apiService.searchEducationLibrary(query || 'law');
                const backendItems = Array.isArray(results) ? results : [];
                if (backendItems.length > 0) {
                    if (mounted) setRelatedItems(backendItems.slice(0, 8));
                    return;
                }

                const category = (courseCategory || '').toLowerCase();
                const queryLower = query.toLowerCase();
                const fallbackItems = SEED_LIBRARY.filter((item) => {
                    const inCategory = category ? (item.category || '').toLowerCase().includes(category) : false;
                    const inText = (item.title || '').toLowerCase().includes(queryLower)
                        || (item.category || '').toLowerCase().includes(queryLower)
                        || (Array.isArray(item.tags) && item.tags.join(' ').toLowerCase().includes(queryLower));
                    return inCategory || inText;
                });

                const finalFallback = fallbackItems.length ? fallbackItems.slice(0, 8) : SEED_LIBRARY.slice(0, 8);
                if (mounted) setRelatedItems(finalFallback);
            } catch {
                const category = (courseCategory || '').toLowerCase();
                const fallbackItems = SEED_LIBRARY.filter((item) =>
                    category ? (item.category || '').toLowerCase().includes(category) : true
                );
                if (mounted) setRelatedItems((fallbackItems.length ? fallbackItems : SEED_LIBRARY).slice(0, 8));
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        loadRelated();

        return () => {
            mounted = false;
        };
    }, [courseCategory, courseTitle, lessonTitle]);

    return (
        <View style={st.root}>
            <View style={st.header}>
                <AnimatedPressable style={st.backBtn} onPress={() => navigation.goBack()} scaleValue={0.9}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </AnimatedPressable>
                <View style={st.headerCenter}>
                    <Text style={st.headerTitle}>{t('education.lesson')}</Text>
                    <Text style={st.headerSub}>{courseTitle || t('education.title')}</Text>
                </View>
                <View style={st.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
                <FadeInView delay={0} distance={12}>
                    <View style={st.heroCard}>
                        <LinearGradient colors={gradients.brand} style={StyleSheet.absoluteFill} />
                        <View style={st.heroContent}>
                            <View style={st.badge}><Text style={st.badgeText}>{t('education.lesson')} {lessonIndex || 1}{totalLessons ? ` / ${totalLessons}` : ''}</Text></View>
                            <Text style={st.heroTitle}>{resolvedLesson.title}</Text>
                            <Text style={st.heroDesc}>{resolvedLesson.summary || t('education.lessonHeroFallback')}</Text>
                        </View>
                    </View>
                </FadeInView>

                <FadeInView delay={100} distance={12}>
                    <View style={st.sectionCard}>
                        <SectionHeader icon="reader-outline" title={t('education.lessonContent')} iconColor={colors.accentPrimary} />
                        <Text style={st.bodyText}>
                            {resolvedLesson.content || t('education.lessonContentFallback')}
                        </Text>
                    </View>
                </FadeInView>

                {resolvedLesson.keyPoints.length > 0 && (
                    <FadeInView delay={140} distance={12}>
                        <View style={st.sectionCard}>
                            <SectionHeader icon="checkmark-done-outline" title={t('education.keyPoints')} iconColor={colors.success} />
                            <View style={st.pointsList}>
                                {resolvedLesson.keyPoints.map((point) => (
                                    <View key={point} style={st.pointRow}>
                                        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                        <Text style={st.pointText}>{point}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </FadeInView>
                )}

                <FadeInView delay={180} distance={12}>
                    <View style={st.sectionCard}>
                        <SectionHeader icon="library-outline" title={t('education.relatedReferences')} iconColor={colors.gold} />
                        {isLoading ? (
                            <View style={st.loadingWrap}>
                                <ActivityIndicator color={colors.accentPrimary} />
                                <Text style={st.loadingText}>{t('education.loadingReferences')}</Text>
                            </View>
                        ) : relatedItems.length > 0 ? (
                            <View style={st.referenceList}>
                                {relatedItems.map((item) => (
                                    <View key={item.id} style={st.referenceCard}>
                                        <View style={st.referenceHeader}>
                                            <Text style={st.referenceTitle} numberOfLines={2}>{item.title}</Text>
                                            <Text style={st.referenceCategory}>{item.category || t('education.general')}</Text>
                                        </View>
                                        <Text style={st.referenceDesc} numberOfLines={3}>{item.description || item.desc || t('education.referenceFallback')}</Text>
                                        <View style={st.referenceMeta}>
                                            <Text style={st.referenceTime}>{item.year || t('education.law')} • {item.section_count || 0} {t('education.sections')}</Text>
                                            <Ionicons name="open-outline" size={14} color={colors.textTertiary} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={st.emptyText}>{t('education.noRelatedReferences')}</Text>
                        )}
                    </View>
                </FadeInView>

                <FadeInView delay={240} distance={10}>
                    <AnimatedPressable style={st.ctaBtn} scaleValue={0.97} onPress={() => navigation.goBack()}>
                        <LinearGradient colors={gradients.brand} style={StyleSheet.absoluteFill} />
                        <Text style={st.ctaText}>{t('education.backToCourse')}</Text>
                    </AnimatedPressable>
                </FadeInView>
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
        borderColor: colors.borderColor,
        zIndex: 10,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.bgTertiary,
        borderWidth: 1, borderColor: colors.borderMid,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    headerSub: { fontSize: 11, color: colors.textTertiary, marginTop: 2, textAlign: 'center' },
    headerSpacer: { width: 40 },
    content: { padding: 20, paddingBottom: 120 },
    heroCard: { height: 180, borderRadius: 22, overflow: 'hidden', ...shadows.accent, marginBottom: 16 },
    heroContent: { flex: 1, padding: 18, justifyContent: 'space-between' },
    badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    heroTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 12, lineHeight: 28 },
    heroDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 19, marginTop: 6 },
    sectionCard: { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.borderColor, borderRadius: 18, padding: 16, marginBottom: 16 },
    bodyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
    pointsList: { marginTop: 8, gap: 10 },
    pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    pointText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, flex: 1 },
    loadingWrap: { alignItems: 'center', gap: 8, paddingVertical: 18 },
    loadingText: { color: colors.textSecondary, fontSize: 12 },
    emptyText: { color: colors.textTertiary, fontSize: 13, lineHeight: 20 },
    referenceList: { gap: 10 },
    referenceCard: { backgroundColor: colors.bgTertiary, borderRadius: 14, borderWidth: 1, borderColor: colors.borderMid, padding: 14 },
    referenceHeader: { gap: 4, marginBottom: 8 },
    referenceTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
    referenceCategory: { color: colors.gold, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    referenceDesc: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
    referenceMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    referenceTime: { color: colors.textTertiary, fontSize: 11 },
    ctaBtn: { height: 52, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', ...shadows.accent },
    ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default LessonScreen;