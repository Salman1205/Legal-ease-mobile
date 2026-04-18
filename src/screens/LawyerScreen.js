import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, gradients } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import { SkeletonLawyerCard } from '../components/SkeletonCard';
import { apiService } from '../services/api';
import { useAppSettings } from '../contexts/AppSettingsContext';

const CATEGORIES = [
    { id: 'all', labelKey: 'lawyers.categoryAll', specialty: null },
    { id: 'criminal', labelKey: 'lawyers.categoryCriminal', specialty: 'Criminal' },
    { id: 'family', labelKey: 'lawyers.categoryFamily', specialty: 'Family' },
    { id: 'property', labelKey: 'lawyers.categoryProperty', specialty: 'Property' },
    { id: 'corporate', labelKey: 'lawyers.categoryCorporate', specialty: 'Corporate' },
    { id: 'immigration', labelKey: 'lawyers.categoryImmigration', specialty: 'Immigration' },
    { id: 'banking', labelKey: 'lawyers.categoryBanking', specialty: 'Banking' },
];

const LawyerCard = ({ lawyer, index, navigation, requested, onRequest, t }) => {
    return (
        <FadeInView delay={index * 100} distance={15}>
            <AnimatedPressable style={st.card} scaleValue={0.98} onPress={() => navigation.navigate('LawyerProfileScreen', { lawyer })}>
                <View style={st.cardHeader}>
                    <View style={st.avatarWrap}>
                        <LinearGradient colors={gradients.surface} style={st.avatarPlaceholder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            <Text style={st.avatarInitial}>{lawyer.name.charAt(0)}</Text>
                        </LinearGradient>
                        {lawyer.available && <View style={st.statusDot} />}
                    </View>
                    <View style={st.cardInfo}>
                        <Text style={st.lawyerName} numberOfLines={1} ellipsizeMode="tail">{lawyer.name}</Text>
                        <Text style={st.specialty} numberOfLines={1} ellipsizeMode="tail">{lawyer.specialty}</Text>
                        <View style={st.metaRow}>
                            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                            <Text style={st.metaText} numberOfLines={1} ellipsizeMode="tail">{lawyer.location}</Text>
                            <View style={st.dot} />
                            <Ionicons name="briefcase-outline" size={12} color={colors.textTertiary} />
                            <Text style={st.metaTextCases} numberOfLines={1}>{lawyer.cases} {t('lawyers.cases')}</Text>
                        </View>
                    </View>
                    <View style={st.ratingBadge}>
                        <Ionicons name="star" size={12} color={colors.gold} />
                        <Text style={st.ratingText}>{lawyer.rating}</Text>
                    </View>
                </View>

                <View style={st.cardActions}>
                    <TouchableOpacity style={st.actionBtnOutline} activeOpacity={0.7} onPress={() => navigation.navigate('LawyerProfileScreen', { lawyer })}>
                        <Text style={st.actionBtnOutlineText}>{t('lawyers.viewProfile')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[st.actionBtnSolid, requested && st.actionBtnRequested]} activeOpacity={0.8} onPress={() => onRequest(lawyer)}>
                        <LinearGradient colors={gradients.brand} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                        <Text style={st.actionBtnSolidText}>{requested ? t('lawyers.requested') : t('lawyers.connect')}</Text>
                    </TouchableOpacity>
                </View>
            </AnimatedPressable>
        </FadeInView>
    );
};

const LawyerScreen = ({ navigation }) => {
    const { t } = useAppSettings();
    const [selectedCat, setSelectedCat] = useState(CATEGORIES[0].id);
    const [searchQuery, setSearchQuery] = useState('');
    const [requestedIds, setRequestedIds] = useState([]);
    const [lawyers, setLawyers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadLawyers = async () => {
            try {
                const data = await apiService.getLawyers();
                const mapped = data.map((l) => ({
                    id: String(l.id),
                    name: l.name,
                    specialty: l.specialization,
                    cases: l.review_count || Math.max(10, (l.experience_years || 1) * 8),
                    rating: l.rating || 4.5,
                    location: l.location ? `${l.location}, PK` : 'Pakistan',
                    available: (l.availability || '').toLowerCase().includes('available') || (l.availability || '').toLowerCase().includes('hour') || (l.availability || '').toLowerCase().includes('today'),
                    availability: l.availability,
                    experience_years: l.experience_years,
                    bio: l.bio,
                    contact_email: l.contact_email,
                    contact_phone: l.contact_phone,
                    bar_council: l.bar_council,
                    bar_number: l.bar_number,
                }));
                setLawyers(mapped);
            } catch (error) {
                if (Platform.OS === 'web') {
                    window.alert(t('lawyers.loadFailed'));
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadLawyers();
    }, []);

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredLawyers = lawyers.filter((l) => {
        const selectedCategory = CATEGORIES.find((cat) => cat.id === selectedCat);
        const categoryMatch = !selectedCategory?.specialty || l.specialty.includes(selectedCategory.specialty);
        if (!normalizedQuery) return categoryMatch;
        const searchMatch = l.name.toLowerCase().includes(normalizedQuery) || l.specialty.toLowerCase().includes(normalizedQuery) || l.location.toLowerCase().includes(normalizedQuery);
        return categoryMatch && searchMatch;
    });

    const handleRequest = (lawyer) => {
        if (requestedIds.includes(lawyer.id)) return;
        setRequestedIds((prev) => [...prev, lawyer.id]);
        const message = t('lawyers.requestSentMessage').replace('{name}', lawyer.name);
        if (Platform.OS === 'web') {
            window.alert(message);
        } else {
            Alert.alert(t('lawyers.requestSentTitle'), message);
        }
    };

    return (
        <View style={st.root}>
            {/* Header Content */}
            <View style={st.headerBlock}>
                <View style={st.titleRow}>
                    <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={st.pageTitle}>{t('lawyers.title')}</Text>
                </View>
                <Text style={st.pageSub}>{t('lawyers.subtitle')}</Text>

                {/* Search Bar */}
                <View style={st.searchBar}>
                    <Ionicons name="search" size={18} color={colors.textTertiary} />
                    <TextInput
                        style={st.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={t('lawyers.searchPlaceholder')}
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Categories */}
            <View style={st.catContainer}>
                <FlatList
                    data={CATEGORIES}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={st.catList}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[st.catChip, selectedCat === item.id && st.catChipActive]}
                            onPress={() => setSelectedCat(item.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={[st.catText, selectedCat === item.id && st.catTextActive]}>{t(item.labelKey)}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* List */}
            {isLoading ? (
                <View style={st.skeletonWrap}>
                    {[0, 1, 2, 3].map((i) => (
                        <SkeletonLawyerCard key={i} />
                    ))}
                </View>
            ) : (
            <FlatList
                data={filteredLawyers}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <LawyerCard
                        lawyer={item}
                        index={index}
                        navigation={navigation}
                        requested={requestedIds.includes(item.id)}
                        onRequest={handleRequest}
                        t={t}
                    />
                )}
                contentContainerStyle={st.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={st.emptyState}>
                        <Ionicons name="briefcase-outline" size={40} color={colors.textTertiary} />
                        <Text style={st.emptyText}>{t('lawyers.empty')}</Text>
                    </View>
                }
            />
            )}
        </View>
    );
};

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgPrimary },
    headerBlock: {
        paddingTop: Platform.OS === 'web' ? 40 : 60,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.bgSecondary,
        borderBottomWidth: 1,
        borderColor: colors.borderColor,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgTertiary, alignItems: 'center', justifyContent: 'center' },
    pageTitle: { ...typography.h1, color: colors.textPrimary },
    pageSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 16 },

    // Search
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.bgTertiary,
        borderWidth: 1, borderColor: colors.borderMid,
        borderRadius: 16,
        paddingHorizontal: 16, height: 50,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 14,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    },

    // Categories
    catContainer: { backgroundColor: colors.bgPrimary, paddingVertical: 12 },
    catList: { paddingHorizontal: spacing.lg, gap: 8 },
    catChip: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1, borderColor: colors.borderMid,
    },
    catChipActive: {
        backgroundColor: colors.accentMuted,
        borderColor: colors.accentBorder,
    },
    catText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    catTextActive: { color: colors.accentPrimary },

    // List
    listContent: { padding: spacing.lg, paddingBottom: 100 },
    card: {
        backgroundColor: colors.bgSecondary,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.borderColor,
        ...shadows.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    avatarWrap: { marginRight: 14, position: 'relative' },
    avatarPlaceholder: {
        width: 50, height: 50, borderRadius: 25,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: colors.borderMid,
    },
    avatarInitial: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
    statusDot: {
        position: 'absolute', bottom: 0, right: 0,
        width: 14, height: 14, borderRadius: 7,
        backgroundColor: colors.success,
        borderWidth: 2, borderColor: colors.bgSecondary,
    },
    cardInfo: { flex: 1 },
    lawyerName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
    specialty: { fontSize: 13, color: colors.accentPrimary, fontWeight: '500', marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { flexShrink: 1, fontSize: 12, color: colors.textTertiary },
    metaTextCases: { fontSize: 12, color: colors.textTertiary, flexShrink: 0 },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textTertiary, marginHorizontal: 2 },

    ratingBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: colors.goldMuted,
        paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 8, borderWidth: 1, borderColor: colors.goldBorder,
    },
    ratingText: { fontSize: 12, fontWeight: '700', color: colors.gold },

    cardActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    actionBtnOutline: {
        flex: 1, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.borderFocus,
        backgroundColor: colors.accentMuted,
    },
    actionBtnOutlineText: { color: colors.accentPrimary, fontSize: 13, fontWeight: '600' },
    actionBtnSolid: {
        flex: 1, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        ...shadows.accent,
    },
    actionBtnRequested: { opacity: 0.8 },
    actionBtnSolidText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

    emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
    emptyText: { color: colors.textSecondary, marginTop: 12, fontSize: 14 },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    loadingText: { color: colors.textSecondary, fontSize: 12 },
    skeletonWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});

export default LawyerScreen;
