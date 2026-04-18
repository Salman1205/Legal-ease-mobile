import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, gradients } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import SectionHeader from '../components/SectionHeader';
import { SkeletonCourseCard, SkeletonListItem } from '../components/SkeletonCard';
import { apiService } from '../services/api';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { SEED_COURSES, SEED_LIBRARY } from '../constants/educationSeed';

const COURSE_COLORS = [
    ['#0EA5A4', '#22D3EE'],
    ['#34D399', '#10B981'],
    ['#FBBF24', '#F59E0B'],
    ['#818CF8', '#6366F1'],
    ['#F87171', '#EF4444'],
];

const EducationScreen = ({ navigation }) => {
    const { t } = useAppSettings();
    const [courses, setCourses] = useState([]);
    const [articles, setArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const normalizeKey = (value) => String(value || '').trim().toLowerCase();

        const mergeCourses = (seedCourses, backendCourses) => {
            const merged = [...seedCourses];

            backendCourses.forEach((backendItem) => {
                const backendId = normalizeKey(backendItem?.id);
                const backendTitle = normalizeKey(backendItem?.title);
                const existingIndex = merged.findIndex((seedItem) => (
                    (backendId && normalizeKey(seedItem?.id) === backendId)
                    || (backendTitle && normalizeKey(seedItem?.title) === backendTitle)
                ));

                if (existingIndex === -1) {
                    merged.push(backendItem);
                    return;
                }

                merged[existingIndex] = {
                    ...merged[existingIndex],
                    ...backendItem,
                    // Preserve lesson richness from seed when backend sends partial records.
                    lessons: Array.isArray(backendItem?.lessons) && backendItem.lessons.length
                        ? backendItem.lessons
                        : merged[existingIndex].lessons,
                };
            });

            return merged;
        };

        const mapCourses = (list) => list.map((course, index) => {
            const hours = Number(course.hours ?? course.duration ?? 0);
            const lessons = Array.isArray(course.lessons) ? course.lessons : [];
            return {
                ...course,
                id: String(course.id || `seed-course-${index}`),
                description: course.desc || course.description || '',
                durationLabel: `${hours.toFixed(1)} ${t('education.hrs')}`,
                lessonCount: lessons.length || Number(course.lesson_count || 0),
                progress: Number(course.progress_percent || 0),
                color: COURSE_COLORS[index % COURSE_COLORS.length],
            };
        });

        const mapLibrary = (list) => list.slice(0, 8).map((item) => ({
            id: item.id,
            title: item.title,
            readTime: `${Math.max(4, Math.ceil((item.section_count || 10) / 2))} ${t('education.minRead')}`,
            category: item.category || t('education.general'),
        }));

        const loadEducationData = async () => {
            let backendCourses = [];
            let backendLibrary = [];

            try {
                const [courseData, libraryData] = await Promise.all([
                    apiService.getEducationCourses().catch(() => []),
                    apiService.searchEducationLibrary('law').catch(() => []),
                ]);
                backendCourses = Array.isArray(courseData) ? courseData : [];
                backendLibrary = Array.isArray(libraryData)
                    ? libraryData
                    : Array.isArray(libraryData?.items)
                        ? libraryData.items
                        : [];
            } catch {
                // Backend unreachable — fall back to local seed below.
            }

            // Hardcoded seed data is always present; backend enriches it when available.
            const finalCourses = mergeCourses(SEED_COURSES, backendCourses);
            const finalLibrary = backendLibrary.length ? backendLibrary : SEED_LIBRARY;

            setCourses(mapCourses(finalCourses));
            setArticles(mapLibrary(finalLibrary));
            setIsLoading(false);
        };

        loadEducationData();
    }, []);

    return (
        <View style={st.root}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scrollContent}>

                {/* Header */}
                <View style={st.headerBlock}>
                    <View style={st.titleRow}>
                        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={st.pageTitle}>{t('education.title')}</Text>
                    </View>
                    <Text style={st.pageSub}>{t('education.subtitle')}</Text>
                </View>

                <FadeInView delay={100} distance={15}>
                    {/* Featured Hero */}
                    <AnimatedPressable
                        style={st.heroCard}
                        scaleValue={0.97}
                        onPress={() => courses[0] && navigation.navigate('CourseDetailScreen', { courseId: courses[0].id, course: courses[0] })}
                    >
                        <LinearGradient colors={gradients.brand} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                        <View style={st.heroContent}>
                            <View style={st.badge}><Text style={st.badgeText}>{t('education.featured')}</Text></View>
                            <Text style={st.heroTitle}>{courses[0]?.title || t('education.loading')}</Text>
                            <Text style={st.heroDesc}>{courses[0]?.description || t('education.heroFallback')}</Text>

                            <View style={st.heroBottom}>
                                <View style={st.heroMeta}>
                                    <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                                    <Text style={st.heroMetaText}>{courses[0]?.durationLabel || '...'}</Text>
                                </View>
                                <Ionicons name="play-circle" size={32} color="#FFF" />
                            </View>
                        </View>
                    </AnimatedPressable>
                </FadeInView>

                {/* Courses */}
                <View style={st.section}>
                    <SectionHeader title={t('education.videoCourses')} icon="play" iconColor={colors.accentPrimary} actionText={t('common.seeAll')} onAction={() => Alert.alert(t('education.videoCourses'), `${courses.length}`)} />
                    {isLoading ? (
                        <View style={st.horizontalSkeletonRow}>
                            <SkeletonCourseCard />
                            <SkeletonCourseCard />
                            <SkeletonCourseCard />
                        </View>
                    ) : (
                    <FlatList
                        data={courses}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={c => c.id}
                        contentContainerStyle={st.hList}
                        renderItem={({ item, index }) => (
                            <FadeInView delay={200 + index * 100} distance={10}>
                                <AnimatedPressable
                                    style={st.courseCard}
                                    scaleValue={0.95}
                                    onPress={() => navigation.navigate('CourseDetailScreen', { courseId: item.id, course: item })}
                                >
                                    <LinearGradient colors={item.color} style={st.courseThumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                        <Ionicons name="play" size={24} color="rgba(255,255,255,0.9)" />
                                    </LinearGradient>
                                    <View style={st.courseInfo}>
                                        <Text style={st.courseTitle} numberOfLines={2}>{item.title}</Text>
                                        <View style={st.courseMeta}>
                                            <Text style={st.courseMetaText}>{item.lessonCount} {t('education.lessons')}</Text>
                                            <View style={st.dot} />
                                            <Text style={st.courseMetaText}>{item.durationLabel}</Text>
                                        </View>

                                        {item.progress > 0 && (
                                            <View style={st.progressTrack}>
                                                <View style={[st.progressBar, { width: `${item.progress}%`, backgroundColor: item.color[0] }]} />
                                            </View>
                                        )}
                                    </View>
                                </AnimatedPressable>
                            </FadeInView>
                        )}
                    />
                    )}
                </View>

                {/* Articles */}
                <View style={st.section}>
                    <SectionHeader title={t('education.latestGuides')} icon="book" iconColor={colors.gold} actionText={t('common.seeAll')} onAction={() => Alert.alert(t('education.latestGuides'), `${articles.length}`)} />
                    <View style={st.articleList}>
                        {isLoading && (
                            <>
                                <SkeletonListItem />
                                <SkeletonListItem />
                                <SkeletonListItem />
                            </>
                        )}
                        {!isLoading && articles.map((article, index) => (
                            <FadeInView key={article.id} delay={300 + index * 50} distance={10}>
                                <AnimatedPressable style={st.articleCard} scaleValue={0.98} onPress={() => Alert.alert(t('education.articleSelectedTitle'), `${t('education.reading')}: ${article.title}`)}>
                                    <View style={st.articleIconWrap}>
                                        <Ionicons name="document-text" size={20} color={colors.gold} />
                                    </View>
                                    <View style={st.articleInfo}>
                                        <Text style={st.articleCat}>{article.category}</Text>
                                        <Text style={st.articleTitle} numberOfLines={1}>{article.title}</Text>
                                        <Text style={st.articleTime}>{article.readTime}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                                </AnimatedPressable>
                            </FadeInView>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgPrimary },
    scrollContent: { paddingBottom: 100 },

    headerBlock: {
        paddingTop: Platform.OS === 'web' ? 40 : 60,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgTertiary, alignItems: 'center', justifyContent: 'center' },
    pageTitle: { ...typography.h1, color: colors.textPrimary },
    pageSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },

    heroCard: {
        marginHorizontal: spacing.lg,
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        ...shadows.accent,
        marginBottom: spacing.xxl,
    },
    heroContent: { padding: 20, flex: 1, justifyContent: 'space-between' },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    heroTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', marginTop: 16 },
    heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, lineHeight: 18, maxWidth: '90%' },
    heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    heroMetaText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
    loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 4, marginBottom: 12 },
    loadingText: { color: colors.textSecondary, fontSize: 12 },

    section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xxl },
    hList: { paddingRight: spacing.lg, gap: 16 },
    horizontalSkeletonRow: { flexDirection: 'row', marginTop: spacing.sm },

    courseCard: {
        width: 160,
        backgroundColor: colors.bgSecondary,
        borderRadius: 20,
        borderWidth: 1, borderColor: colors.borderColor,
        overflow: 'hidden',
    },
    courseThumb: { height: 100, alignItems: 'center', justifyContent: 'center' },
    courseInfo: { padding: 12 },
    courseTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, lineHeight: 18, height: 36, marginBottom: 8 },
    courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    courseMetaText: { fontSize: 11, color: colors.textTertiary },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textTertiary },
    progressTrack: { height: 4, backgroundColor: colors.bgTertiary, borderRadius: 2, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 2 },

    articleList: { gap: 12 },
    articleCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.bgSecondary,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1, borderColor: colors.borderColor,
    },
    articleIconWrap: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: colors.goldMuted,
        borderWidth: 1, borderColor: colors.goldBorder,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
    },
    articleInfo: { flex: 1 },
    articleCat: { fontSize: 10, fontWeight: '700', color: colors.gold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    articleTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
    articleTime: { fontSize: 12, color: colors.textTertiary },
});

export default EducationScreen;
