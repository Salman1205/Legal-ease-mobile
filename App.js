// App.js v5 - safe-area aware entry point with branded splash
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar, View, Text, TextInput, StyleSheet, Animated, Platform } from 'react-native';

// Clamp OS accessibility font scaling so layouts don't break when the user
// cranks text size in Settings. Applied once at module load before any render.
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;
Text.defaultProps.maxFontSizeMultiplier = 1.2;
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;
TextInput.defaultProps.maxFontSizeMultiplier = 1.2;
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import LawLogo from './src/components/LawLogo';
import NetworkBanner from './src/components/NetworkBanner';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { colors, shadows } from './src/constants/theme';
import { authService } from './src/services/auth';
import { userSession } from './src/services/storage';
import { AppSettingsProvider } from './src/contexts/AppSettingsContext';
import { ToastProvider } from './src/components/Toast';

const navTheme = {
  dark: true,
  colors: {
    primary: colors.accentPrimary,
    background: colors.bgPrimary,
    card: colors.bgPrimary,
    text: colors.textPrimary,
    border: colors.borderColor,
    notification: colors.accentPrimary,
  },
};

const ONBOARDING_KEY = 'legalease_onboarded';

const getWebStorage = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('localStorage access blocked:', error);
    return null;
  }
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const splashFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let splashTimerId = null;
    let isMounted = true;

    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 100, friction: 12, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const init = async () => {
      try {
        const session = await authService.getSession();
        if (session?.user && session?.session_token) {
          // Wipe local caches if a different user was active on this device.
          await userSession.syncActiveUser(session.user.id);
          setUser(session.user);
          setToken(session.session_token);
        } else {
          await userSession.syncActiveUser(null);
        }
      } catch (error) {
        console.error('Session restore failed:', error);
      } finally {
        if (!isMounted) return;

        splashTimerId = setTimeout(() => {
          if (!isMounted) return;

          Animated.timing(splashFade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
            if (!isMounted) return;

            setShowSplash(false);
            setIsLoading(false);
          });
        }, 800);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (splashTimerId) clearTimeout(splashTimerId);
    };
  }, []);

  const handleLoginSuccess = async (loggedUser, sessionToken) => {
    // Clear previous user's local caches before loading the new user.
    await userSession.syncActiveUser(loggedUser?.id);
    setUser(loggedUser);
    setToken(sessionToken);
    await authService.saveSession(loggedUser, sessionToken);
  };

  const handleLogout = async () => {
    try {
      const sessionToken = token || (await authService.getSession())?.session_token;
      if (sessionToken) await authService.logout(sessionToken);
    } catch {
      // Ignore logout cleanup errors.
    }

    setUser(null);
    setToken(null);
    await authService.clearSession();
    // Wipe chat / settings / document caches so the next account starts clean.
    await userSession.clearLocalUserData();
  };

  let screen;
  if (showSplash) {
    screen = (
      <SafeAreaView style={sp.centeredRoot} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bgDeep} />
        <Animated.View style={[sp.splash, { opacity: splashFade }]}>
          <Animated.View style={[sp.center, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <LawLogo size={64} animated />
            <Text style={sp.name}>LegalEase</Text>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  } else if (!user) {
    screen = (
      <SafeAreaView style={sp.root} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bgDeep} />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  } else {
    // Tab bar handles its own bottom inset via useSafeAreaInsets, so the root
    // only claims the top edge. Prevents double-padding that was eating space.
    screen = (
      <SafeAreaView style={sp.root} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
        <NetworkBanner />
        <NavigationContainer theme={navTheme}>
          <AppNavigator user={user} onLogout={handleLogout} />
        </NavigationContainer>
      </SafeAreaView>
    );
  }

  // Key the settings provider by the active user id so switching accounts
  // remounts the context and reloads settings from the (just-wiped) storage.
  // Guests share a single 'guest' key so settings persist across the login flow.
  const settingsScope = user?.id ? `u:${user.id}` : 'guest';

  return (
    <SafeAreaProvider>
      <AppSettingsProvider key={settingsScope}>
        <ToastProvider>
          {screen}
        </ToastProvider>
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
}

const sp = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  centeredRoot: {
    flex: 1,
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', gap: 16 },
  name: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
});
