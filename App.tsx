import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_400Regular,
} from '@expo-google-fonts/poppins';
import * as Notifications from 'expo-notifications';
import { StripeProvider } from '@stripe/stripe-react-native';
import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { ProgressProvider } from './src/context/ProgressContext';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RootStackParamList } from './src/types/navigation';
import { migrateDataVersion } from './src/utils/progress';

const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

function AppContent({ navRef }: { navRef: React.MutableRefObject<NavigationContainerRef<RootStackParamList> | null> }) {
  const { isDark } = useTheme();

  useEffect(() => {
    void migrateDataVersion();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen as string | undefined;
      if (!screen || !navRef.current) return;

      if (screen === 'Tracks') {
        navRef.current.dispatch(
          CommonActions.navigate('Main', { screen: 'Tracks' })
        );
      } else {
        navRef.current.dispatch(
          CommonActions.navigate('Main', { screen: 'Dashboard' })
        );
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator navRef={navRef} />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_400Regular,
  });

  const navRef = useRef<NavigationContainerRef<RootStackParamList> | null>(null);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <StripeProvider publishableKey={STRIPE_PK} urlScheme="ultimaven">
            <ProgressProvider>
              <AppContent navRef={navRef} />
            </ProgressProvider>
          </StripeProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
