import {
  NavigationContainer,
  NavigationIndependentTree,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';
import { HeroUINativeProvider, Spinner } from 'heroui-native';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { StatusBar, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useCurrentUserQuery } from './hooks/useAuth';
import { useLanguage, useTranslation } from './hooks/useLanguage';
import { useTheme } from './hooks/useTheme';
import i18n from './i18n/i18n';
import './store/languageStore';
import { queryClient } from './lib/queryClient';
import HomeScreen from './screens/HomeScreen';
import { useAuthStore } from './store/authStore';
import './styles/global.css';
import * as Sentry from '@sentry/react-native';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';

Sentry.init({
  dsn: 'https://58998ef3d1c8cef99e55fd217e1c8371@o4510396810002432.ingest.us.sentry.io/4511012879532032',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  const { colors } = useTheme();

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <AuthStack.Navigator
          initialRouteName="SignIn"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
          }}
        >
          <AuthStack.Screen name="SignIn" component={SignInScreen} />
          <AuthStack.Screen name="SignUp" component={SignUpScreen} />
        </AuthStack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};

const BootstrapLoader = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <View
      className="flex-1 items-center justify-center gap-3 px-5"
      style={{
        backgroundColor: colors.background,
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <Spinner size="lg" />
      <Text
        style={{
          fontSize: 16,
          color: colors.textMuted,
          textAlign: 'center',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        }}
      >
        {t('auth.checkingSession')}
      </Text>
    </View>
  );
};

const AppContent = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isBootstrapping = useAuthStore(state => state.isBootstrapping);
  const setBootstrapping = useAuthStore(state => state.setBootstrapping);
  const setUser = useAuthStore(state => state.setUser);

  const { data, isError, isPending, isSuccess } = useCurrentUserQuery();

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (isSuccess) {
      setUser(data ?? null);
    }

    if (isError) {
      setUser(null);
    }

    setBootstrapping(false);
  }, [data, isError, isPending, isSuccess, setBootstrapping, setUser]);

  if (isBootstrapping) {
    return <BootstrapLoader />;
  }

  if (isAuthenticated) {
    return <HomeScreen />;
  }

  return <AuthNavigator />;
};

function App() {
  const { isDark, colors } = useTheme();
  const { isRTL } = useLanguage();

  return (
    <I18nextProvider i18n={i18n}>
      <GestureHandlerRootView
        className="flex-1"
        style={{
          flex: 1,
          backgroundColor: colors.background,
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <HeroUINativeProvider>
          <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
              <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
              />
              <AppContent />
            </QueryClientProvider>
          </SafeAreaProvider>
        </HeroUINativeProvider>
      </GestureHandlerRootView>
    </I18nextProvider>
  );
}

export default Sentry.wrap(App);
