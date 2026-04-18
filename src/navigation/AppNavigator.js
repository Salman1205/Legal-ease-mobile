// AppNavigator v6 — Elevated floating tab bar, inset-aware, no system-UI overlap
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows } from '../constants/theme';

const TAB_BAR_HEIGHT = 62;
const TAB_BAR_MARGIN = 8;
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../screens/ChatScreen';
import DocumentScreen from '../screens/DocumentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NewsScreen from '../screens/NewsScreen';
import LawyerScreen from '../screens/LawyerScreen';
import LawyerProfileScreen from '../screens/LawyerProfileScreen';
import EducationScreen from '../screens/EducationScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import LessonScreen from '../screens/LessonScreen';
import HubScreen from '../screens/HubScreen';
import AboutScreen from '../screens/AboutScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ExportDataScreen from '../screens/ExportDataScreen';
import AppearanceScreen from '../screens/AppearanceScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LanguageScreen from '../screens/LanguageScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TABS = [
    { name: 'Chat', iconFilled: 'chatbubble', iconOutline: 'chatbubble-outline', label: 'Chat' },
    { name: 'Documents', iconFilled: 'document-text', iconOutline: 'document-text-outline', label: 'Docs' },
    { name: 'Learning', iconFilled: 'school', iconOutline: 'school-outline', label: 'Learning' },
    { name: 'Profile', iconFilled: 'person', iconOutline: 'person-outline', label: 'You' },
];

const TabButton = ({ tab, isFocused, onPress }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const dotWidth = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

    useEffect(() => {
        Animated.spring(dotWidth, {
            toValue: isFocused ? 1 : 0,
            tension: 200, friction: 20, useNativeDriver: false,
        }).start();
    }, [isFocused]);

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, tension: 300, friction: 12, useNativeDriver: true }),
        ]).start();
        onPress();
    };

    const bgWidth = dotWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });

    return (
        <TouchableOpacity activeOpacity={1} onPress={handlePress} style={tb.btn}>
            <Animated.View style={[tb.inner, { transform: [{ scale }] }]}>
                {/* Active background pill */}
                <Animated.View style={[tb.activeBg, { width: bgWidth, opacity: dotWidth }]}>
                    <LinearGradient
                        colors={[colors.accentMuted, 'rgba(255,255,255,0.03)']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    />
                </Animated.View>

                <Ionicons
                    name={isFocused ? tab.iconFilled : tab.iconOutline}
                    size={20}
                    color={isFocused ? colors.accentPrimary : colors.textTertiary}
                />
                <Text
                    style={[tb.label, isFocused && tb.labelActive]}
                    numberOfLines={1}
                    allowFontScaling={false}
                >
                    {tab.label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const CustomTabBar = ({ state, navigation }) => {
    const insets = useSafeAreaInsets();
    // Respect the real device bottom inset (home indicator / gesture pill).
    // Floor of 10px on devices with no inset so the bar never hugs the edge.
    const bottomPadding = Math.max(insets.bottom, 10);

    return (
        <View style={[tb.outer, { paddingBottom: bottomPadding }]}>
            <View style={tb.bar}>
                {state.routes.map((route, index) => {
                    const tab = TABS.find(t => t.name === route.name);
                    return (
                        <TabButton
                            key={route.key}
                            tab={tab}
                            isFocused={state.index === index}
                            onPress={() => {
                                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                                if (state.index !== index && !event.defaultPrevented) navigation.navigate(route.name);
                            }}
                        />
                    );
                })}
            </View>
        </View>
    );
};

const tb = StyleSheet.create({
    outer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        alignItems: 'center',
        paddingTop: 4,
        paddingHorizontal: 16,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        maxWidth: 400,
        height: 62,
        borderRadius: 22,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.borderMid,
        paddingHorizontal: 8,
        ...shadows.lg,
    },
    btn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    inner: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        minWidth: 56,
        paddingHorizontal: 10,
        height: 44,
        position: 'relative',
    },
    activeBg: {
        position: 'absolute',
        top: 0, bottom: 0,
        borderRadius: 14,
        overflow: 'hidden',
        alignSelf: 'center',
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        color: colors.textTertiary,
    },
    labelActive: {
        color: colors.accentPrimary,
        fontWeight: '700',
    },
});

const MainTabs = ({ user, onLogout }) => {
    const insets = useSafeAreaInsets();
    const sceneBottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 10) + TAB_BAR_MARGIN;

    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            sceneContainerStyle={{ paddingBottom: sceneBottomPadding }}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Chat" component={ChatScreen} />
            <Tab.Screen name="Documents" component={DocumentScreen} />
            <Tab.Screen name="Learning" component={HubScreen} />
            <Tab.Screen
                name="Profile"
                children={() => <ProfileScreen user={user} onLogout={onLogout} />}
            />
        </Tab.Navigator>
    );
};

const AppNavigator = ({ user, onLogout }) => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" children={() => <MainTabs user={user} onLogout={onLogout} />} />
        <Stack.Screen name="NewsScreen" component={NewsScreen} />
        <Stack.Screen name="LawyerScreen" component={LawyerScreen} />
        <Stack.Screen name="LawyerProfileScreen" component={LawyerProfileScreen} />
        <Stack.Screen name="EducationScreen" component={EducationScreen} />
        <Stack.Screen name="CourseDetailScreen" component={CourseDetailScreen} />
        <Stack.Screen name="LessonScreen" component={LessonScreen} />
        <Stack.Screen name="AboutScreen" component={AboutScreen} />
        <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} />
        <Stack.Screen name="TermsOfServiceScreen" component={TermsOfServiceScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
        <Stack.Screen name="ExportDataScreen" component={ExportDataScreen} />
        <Stack.Screen name="AppearanceScreen" component={AppearanceScreen} />
        <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
        <Stack.Screen name="LanguageScreen" component={LanguageScreen} />
    </Stack.Navigator>
);

export default AppNavigator;
