import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, gradients } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import SectionHeader from '../components/SectionHeader';
import { apiService } from '../services/api';
import { SEED_COURSES } from '../constants/educationSeed';
import { useAppSettings } from '../contexts/AppSettingsContext';

const CourseDetailScreen = ({ route, navigation }) => {
    const { t } = useAppSettings();
    const courseId = route?.params?.courseId;
    const initialCourse = route?.params?.course || null;
    const [course, setCourse] = useState(initialCourse);
    const [isLoading, setIsLoading] = useState(!initialCourse);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const loadCourse = async () => {
            if (!courseId || course) return;

            try {
                setIsLoading(true);
                const data = await apiService.getEducationCourseById(courseId);
                if (mounted) {
                    if (data) setCourse(data);
                    else setCourse(SEED_COURSES.find((item) => item.id === courseId) || null);
                }
            } catch (err) {
                if (mounted) {
                    const fallback = SEED_COURSES.find((item) => item.id === courseId) || null;
                    if (fallback) {
                        setCourse(fallback);
                        setError(null);
                    } else {
                        setError(err.message || t('education.courseLoadFailed'));
                    }
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        loadCourse();

        return () => {
            mounted = false;
        };
    }, [courseId, course]);

    useEffect(() => {
        if (!course) return;

        const hasLessons = Array.isArray(course.lessons) && course.lessons.length > 0;
        if (hasLessons) return;

        const byId = SEED_COURSES.find((item) => item.id === course.id);
        const byTitle = SEED_COURSES.find((item) => (
            String(item.title || '').trim().toLowerCase()
            === String(course.title || '').trim().toLowerCase()
        ));
        const seedMatch = byId || byTitle;

        if (!seedMatch) return;

        setCourse((prev) => ({
            ...seedMatch,
            ...prev,
            lessons: Array.isArray(prev?.lessons) && prev.lessons.length ? prev.lessons : seedMatch.lessons,
            key_topics: Array.isArray(prev?.key_topics) && prev.key_topics.length ? prev.key_topics : seedMatch.key_topics,
            overview: prev?.overview || seedMatch.overview,
            desc: prev?.desc || prev?.description || seedMatch.desc,
        }));
    }, [course]);

    const lessonList = useMemo(() => {
        if (!course) return [];
        const lessons = Array.isArray(course.lessons) ? course.lessons : [];
        if (lessons.length) {
            return lessons.map((lesson, index) => {
                if (typeof lesson === 'string') {
                    return {
                        id: `${course.id}-${index}`,
                        index: index + 1,
                        title: lesson,
                        summary: '',
                        content: '',
                        key_points: [],
                    };
                }
                return {
                    id: `${course.id}-${index}`,
                    index: (lesson.index ?? index) + 1,
                        title: lesson.title || `${t('education.lesson')} ${index + 1}`,
                    summary: lesson.summary || '',
                    content: lesson.content || '',
                    key_points: Array.isArray(lesson.key_points) ? lesson.key_points : [],
                };
            });
        }

        const titles = Array.isArray(course.lesson_titles) ? course.lesson_titles : [];
        return titles.map((title, index) => ({
            id: `${course.id}-${index}`,
            index: index + 1,
            title,
            summary: '',
            content: '',
            key_points: [],
        }));
    }, [course]);

    const openLesson = (lesson) => {
        navigation.navigate('LessonScreen', {
            courseId: course?.id,
            courseTitle: course?.title,
            courseCategory: course?.category || course?.law_category || t('education.general'),
            lessonTitle: lesson.title,
            lessonIndex: lesson.index,
            totalLessons: lessonList.length,
            lessonSummary: lesson.summary,
            lessonContent: lesson.content,
            lessonKeyPoints: lesson.key_points,
        });
    };

    return (
        <View style={st.root}>
            <View style={st.header}>
                <AnimatedPressable style={st.backBtn} onPress={() => navigation.goBack()} scaleValue={0.9}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </AnimatedPressable>
                <View style={st.headerCenter}>
                    <Text style={st.headerTitle}>{t('education.courseDetail')}</Text>
                    <Text style={st.headerSub}>{course?.title || t('common.loading')}</Text>
                </View>
                <View style={st.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
                {isLoading && (
                    <View style={st.loadingWrap}>
                        <ActivityIndicator color={colors.accentPrimary} />
                        <Text style={st.loadingText}>{t('education.loadingCourse')}</Text>
                    </View>
                )}

                {error && (
                    <View style={st.errorBox}>
                        <Ionicons name="alert-circle" size={16} color={colors.error} />
                        <Text style={st.errorText}>{error}</Text>
                    </View>
                )}

                {course && (
                    <>
                        <FadeInView delay={0} distance={12}>
                            <View style={st.heroCard}>
                                <LinearGradient colors={gradients.brand} style={StyleSheet.absoluteFill} />
                                <View style={st.heroContent}>
                                    <View style={st.badge}><Text style={st.badgeText}>{course.level || t('education.beginner')}</Text></View>
                                    <Text style={st.heroTitle}>{course.title}</Text>
                                    <Text style={st.heroDesc}>{course.desc || course.description || t('education.courseHeroFallback')}</Text>
                                    <View style={st.heroMetaRow}>
                                        <View style={st.heroMetaItem}>
                                            <Ionicons name="layers-outline" size={14} color="rgba(255,255,255,0.85)" />
                                            <Text style={st.heroMetaText}>{lessonList.length} {t('education.lessons')}</Text>
                                        </View>
                                        <View style={st.heroMetaItem}>
                                            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.85)" />
                                            <Text style={st.heroMetaText}>{Number(course.hours ?? course.duration ?? 0).toFixed(1)} {t('education.hrs')}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </FadeInView>

                        <FadeInView delay={100} distance={12}>
                            <View style={st.summaryRow}>
                                <View style={st.summaryCard}>
                                    <Text style={st.summaryValue}>{course.category || course.law_category || t('education.general')}</Text>
                                    <Text style={st.summaryLabel}>{t('education.category')}</Text>
                                </View>
                                <View style={st.summaryCard}>
                                    <Text style={st.summaryValue}>{course.level || t('education.beginner')}</Text>
                                    <Text style={st.summaryLabel}>{t('education.difficulty')}</Text>
                                </View>
                                <View style={st.summaryCard}>
                                    <Text style={st.summaryValue}>{lessonList.length}</Text>
                                    <Text style={st.summaryLabel}>{t('education.lessons')}</Text>
                                </View>
                            </View>
                        </FadeInView>

                        <FadeInView delay={200} distance={12}>
                            <View style={st.sectionCard}>
                                <SectionHeader icon="book-outline" title={t('education.aboutCourse')} iconColor={colors.accentPrimary} />
                                <Text style={st.bodyText}>
                                    {course.overview || course.desc || course.description || t('education.courseOverviewFallback')}
                                </Text>
                            </View>
                        </FadeInView>

                        {Array.isArray(course.key_topics) && course.key_topics.length > 0 && (
                            <FadeInView delay={230} distance={12}>
                                <View style={st.sectionCard}>
                                    <SectionHeader icon="list-outline" title={t('education.keyTopics')} iconColor={colors.success} />
                                    <View style={st.topicsList}>
                                        {course.key_topics.map((topic) => (
                                            <View key={topic} style={st.topicRow}>
                                                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                                <Text style={st.topicText}>{topic}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </FadeInView>
                        )}

                        <FadeInView delay={280} distance={12}>
                            <View style={st.sectionCard}>
                                <SectionHeader icon="play-circle-outline" title={t('education.lessons')} iconColor={colors.gold} />
                                <View style={st.lessonList}>
                                    {lessonList.map((lesson) => (
                                        <AnimatedPressable key={lesson.id} style={st.lessonItem} scaleValue={0.98} onPress={() => openLesson(lesson)}>
                                            <View style={st.lessonIndexWrap}>
                                                <Text style={st.lessonIndex}>{lesson.index}</Text>
                                            </View>
                                            <View style={st.lessonInfo}>
                                                <Text style={st.lessonTitle}>{lesson.title}</Text>
                                                <Text style={st.lessonSub}>{t('education.lessonOpenHint')}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                                        </AnimatedPressable>
                                    ))}
                                </View>
                            </View>
                        </FadeInView>
                    </>
                )}
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
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bgTertiary,
        borderWidth: 1,
        borderColor: colors.borderMid,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    headerSub: { fontSize: 11, color: colors.textTertiary, marginTop: 2, textAlign: 'center' },
    headerSpacer: { width: 40 },
    content: { padding: 20, paddingBottom: 120 },
    loadingWrap: { alignItems: 'center', gap: 10, paddingVertical: 24 },
    loadingText: { color: colors.textSecondary, fontSize: 13 },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.errorMuted,
        borderWidth: 1,
        borderColor: colors.errorBorder,
        borderRadius: 14,
        padding: 12,
        marginBottom: 16,
    },
    errorText: { color: colors.error, flex: 1, fontSize: 13 },
    heroCard: { height: 220, borderRadius: 24, overflow: 'hidden', ...shadows.accent, marginBottom: 16 },
    heroContent: { flex: 1, padding: 20, justifyContent: 'space-between' },
    badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
    heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 14, lineHeight: 28 },
    heroDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 19, marginTop: 6 },
    heroMetaRow: { flexDirection: 'row', gap: 12, marginTop: 14, flexWrap: 'wrap' },
    heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    heroMetaText: { color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: '600' },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.borderColor,
        borderRadius: 16,
        padding: 14,
    },
    summaryValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
    summaryLabel: { color: colors.textTertiary, fontSize: 11, marginTop: 4 },
    sectionCard: {
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.borderColor,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
    },
    bodyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
    topicsList: { gap: 10, marginTop: 8 },
    topicRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    topicText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, flex: 1 },
    lessonList: { marginTop: 8, gap: 10 },
    lessonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.bgTertiary,
        borderWidth: 1,
        borderColor: colors.borderMid,
        borderRadius: 16,
        padding: 14,
    },
    lessonIndexWrap: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: colors.accentMuted,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    lessonIndex: { color: colors.accentPrimary, fontSize: 12, fontWeight: '800' },
    lessonInfo: { flex: 1 },
    lessonTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', lineHeight: 20 },
    lessonSub: { color: colors.textTertiary, fontSize: 11, marginTop: 3 },
});

export default CourseDetailScreen;